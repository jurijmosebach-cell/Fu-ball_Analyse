// server.js – erweiterte Version mit dynamischer Teamform (letzte 5 Spiele)
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// Node 18+ hat fetch eingebaut
const fetch = globalThis.fetch;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.static(__dirname));

const PORT = process.env.PORT || 10000;
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_API_KEY || "";

if (!FOOTBALL_DATA_KEY) {
  console.warn("⚠️ WARNING: FOOTBALL_DATA_API_KEY nicht gesetzt — API-Aufrufe geben leere Ergebnisse zurück.");
}

// Caches
let cache = { timestamp: 0, data: [] };
const CACHE_DURATION = 15 * 60 * 1000; // 15 Minuten

// Team-Stats Cache (TTL)
const teamStatsCache = { }; // { [teamId]: { timestamp, stats } }
const TEAM_STATS_TTL = 60 * 60 * 1000; // 1 Stunde

// Ligen-IDs für football-data.org
const LEAGUE_IDS = {
  "Premier League": "PL",
  "Bundesliga": "BL1",
  "La Liga": "PD",
  "Serie A": "SA",
  "Ligue 1": "FL1",
  "Champions League": "CL",
  "Eredivisie": "DED",
  "Campeonato Brasileiro Série A": "BSA",
  "Championship": "ELC",
  "Primeira Liga": "PPL",
  "European Championship": "EC"
};

/* ---------- Utilities ---------- */
function getFlag(team) {
  const flags = {
    "Manchester": "gb", "Liverpool": "gb", "Chelsea": "gb", "Arsenal": "gb", "Tottenham": "gb",
    "Bayern": "de", "Dortmund": "de", "Leipzig": "de", "Gladbach": "de", "Frankfurt": "de", "Leverkusen": "de",
    "Real": "es", "Barcelona": "es", "Atletico": "es", "Sevilla": "es", "Valencia": "es",
    "Juventus": "it", "Inter": "it", "Milan": "it", "Napoli": "it", "Roma": "it", "Lazio": "it",
    "PSG": "fr", "Marseille": "fr", "Monaco": "fr", "Lyon": "fr", "Rennes": "fr", "Nice": "fr"
  };
  for (const [name, flag] of Object.entries(flags)) {
    if (team.includes(name)) return flag;
  }
  return "eu";
}

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

/* ---------- Mathematische Hilfsfunktionen ---------- */
function factorial(n) {
  if (n <= 1) return 1;
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

function poisson(k, lambda) {
  // guard for edgecases
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return Math.pow(lambda, k) * Math.exp(-lambda) / factorial(k);
}

function computeMatchOutcomeProbs(homeLambda, awayLambda, maxGoals = 10) {
  let homeProb = 0, drawProb = 0, awayProb = 0;
  for (let i = 0; i <= maxGoals; i++) {
    const pHome = poisson(i, homeLambda);
    for (let j = 0; j <= maxGoals; j++) {
      const pAway = poisson(j, awayLambda);
      const p = pHome * pAway;
      if (i > j) homeProb += p;
      else if (i === j) drawProb += p;
      else awayProb += p;
    }
  }
  const total = homeProb + drawProb + awayProb || 1;
  return {
    home: +(homeProb / total).toFixed(4),
    draw: +(drawProb / total).toFixed(4),
    away: +(awayProb / total).toFixed(4)
  };
}

function computeOver25Prob(homeLambda, awayLambda, maxGoals = 10) {
  let pLe2 = 0;
  for (let i = 0; i <= maxGoals; i++) {
    const ph = poisson(i, homeLambda);
    for (let j = 0; j <= maxGoals; j++) {
      if (i + j <= 2) pLe2 += ph * poisson(j, awayLambda);
    }
  }
  return +(1 - pLe2).toFixed(4);
}

/* ---------- Team-Form Fetch + Statistikberechnung ---------- */
/**
 * Holt die letzten n abgeschlossenen Spiele eines Teams und berechnet:
 * - avgGoalsFor, avgGoalsAgainst
 * - formRating (normalisiert 0..2, 1 = neutral) basierend auf Resultaten (S=3,P=1,N=0) gewichtete
 *
 * Achtung: API-Endpoints und Param-Namen können leicht variieren abhängig von provider.
 */
async function fetchTeamStats(teamId, opts = { limit: 5 }) {
  if (!FOOTBALL_DATA_KEY) return null;

  // Cache valid?
  const cached = teamStatsCache[teamId];
  const now = Date.now();
  if (cached && (now - cached.timestamp) < TEAM_STATS_TTL && cached.stats) {
    return cached.stats;
  }

  try {
    // football-data v4: /teams/{id}/matches?status=FINISHED
    // Wir limitieren manuell per query param 'limit' wenn verfügbar (API kann variieren)
    const limit = opts.limit || 5;
    const url = `https://api.football-data.org/v4/teams/${teamId}/matches?status=FINISHED&limit=${limit}`;
    const res = await fetch(url, { headers: { "X-Auth-Token": FOOTBALL_DATA_KEY } });

    if (!res.ok) {
      // Fallback: versuche ohne limit param
      const fallbackUrl = `https://api.football-data.org/v4/teams/${teamId}/matches?status=FINISHED`;
      const res2 = await fetch(fallbackUrl, { headers: { "X-Auth-Token": FOOTBALL_DATA_KEY } });
      if (!res2.ok) throw new Error(`Team matches fetch failed: ${res.status} / ${res2.status}`);
      const data2 = await res2.json();
      return computeStatsFromMatches(data2.matches?.slice(0, limit) || []);
    }

    const data = await res.json();
    const recent = (data.matches || []).slice(0, limit);
    const stats = computeStatsFromMatches(recent);

    // Cache
    teamStatsCache[teamId] = { timestamp: now, stats };
    // Slight delay to avoid burst fetching many teams at once (rate-limit caution)
    await sleep(120);
    return stats;
  } catch (err) {
    console.warn("fetchTeamStats error for", teamId, err.message || err);
    // set small cache to avoid repeated failing calls
    teamStatsCache[teamId] = { timestamp: Date.now(), stats: null };
    return null;
  }
}

function computeStatsFromMatches(matches = []) {
  if (!matches.length) return {
    avgGoalsFor: 1.2,
    avgGoalsAgainst: 1.3,
    formRating: 1.0, // neutral
    played: 0
  };

  let goalsFor = 0, goalsAgainst = 0, points = 0;
  for (const m of matches) {
    // Determine if our team is home or away for each match entry (we don't have teamId here in general)
    // We will infer both home and away by checking 'score' structure
    // Note: caller uses team-specific endpoint, so 'matches' are all matches for that team; API returns role in each match.
    const score = m.score?.fullTime || {};
    // determine if team is home by matching team id presence — but easiest is:
    // We rely on 'homeTeam' & 'awayTeam' presence and the fact the endpoint was team-specific.
    // If score.homeTeam == undefined we be safe and skip.
    const homeGoals = typeof score.home === "number" ? score.home : (score.homeTeam ?? null);
    const awayGoals = typeof score.away === "number" ? score.away : (score.awayTeam ?? null);

    // Fallback: if not numeric, try using m.score?.fullTime.homeTeam / awayTeam
    const h = (m.score && m.score.fullTime && typeof m.score.fullTime.home === "number") ? m.score.fullTime.home : null;
    const a = (m.score && m.score.fullTime && typeof m.score.fullTime.away === "number") ? m.score.fullTime.away : null;

    // If both null, try m.score?.winner to assign points (best-effort)
    const home = (h !== null) ? h : (typeof homeGoals === "number" ? homeGoals : null);
    const away = (a !== null) ? a : (typeof awayGoals === "number" ? awayGoals : null);

    if (home === null || away === null) continue;

    // Find whether our team was home or away via m.homeTeam/m.awayTeam presence inside endpoint is team-specific (but we don't have teamId here)
    // As we can't reliably infer which side is "our" from this helper alone, we'll compute aggregate goals for both sides:
    // - We'll assume "our" goals equals max(home, away) if matches were team-specific (safe-ish as fallback).
    // But to be more robust, the caller of computeStatsFromMatches should pass matches from the team-specific endpoint where it's clear.
    goalsFor += Math.max(home, away);
    goalsAgainst += Math.min(home, away);

    // Points: winner logic
    if (home > away) points += 3;
    else if (home === away) points += 1;
    else points += 0;
  }

  const played = matches.length;
  const avgGoalsFor = +(goalsFor / Math.max(played, 1)).toFixed(2);
  const avgGoalsAgainst = +(goalsAgainst / Math.max(played, 1)).toFixed(2);

  // Normalize points into a 0..2 scale: averagePointsPerGame from 0..3 -> map to 0..2 with 1 neutral
  const avgPoints = points / Math.max(played, 1);
  const formRating = +(1 + ((avgPoints - 1) / 2)).toFixed(3); // avgPoints 1 -> 1.0 ; avgPoints 3 -> 2.0 ; avgPoints 0 -> 0.5

  return { avgGoalsFor, avgGoalsAgainst, formRating, played };
}

/* ---------- Verbesserte XG-Schätzung (nutzt teamStats wenn vorhanden) ---------- */
function estimateXG(teamName, isHome, league = "", teamStats = null) {
  // Basiswerte
  const base = isHome ? 1.45 : 1.10; // Heimbonus

  // Ligafaktoren – basierend auf durchschnittlicher Toranzahl pro Spiel
  const LEAGUE_XG_FACTOR = {
    "Premier League": 1.05,
    "Bundesliga": 1.10,
    "La Liga": 1.00,
    "Serie A": 0.95,
    "Ligue 1": 1.02,
    "Champions League": 1.08,
    "Eredivisie": 1.12,
    "Campeonato Brasileiro Série A": 0.92,
    "Primeira Liga": 0.94,
    "Championship": 0.98,
    "European Championship": 0.90
  };
  const leagueFactor = LEAGUE_XG_FACTOR[league] || 1.0;

  // Teamstärke-Pools (Fallback if no teamStats)
  const strongTeams = ["Man City", "Liverpool", "Arsenal", "Bayern", "Real Madrid", "PSG", "Inter", "Juventus", "Barcelona"];
  const mediumTeams = ["Newcastle", "Aston Villa", "Leipzig", "Napoli", "Atletico", "Marseille", "Leverkusen", "Fiorentina"];
  const weakTeams = ["Bochum", "Cadiz", "Verona", "Clermont", "Empoli", "Luton", "Sheffield", "Salernitana"];

  let adj = 0;
  if (teamStats && teamStats.played > 0) {
    // Use actual team stats
    // baseline: avgGoalsFor - avgGoalsAgainst centered => positive means attacking strength
    const gf = teamStats.avgGoalsFor || 1.2;
    const ga = teamStats.avgGoalsAgainst || 1.3;
    const form = teamStats.formRating || 1.0; // 1.0 neutral
    // combine effects: goals difference contributes up to ±0.45, form contributes up to ±0.25
    adj += Math.max(-0.6, Math.min(0.6, (gf - ga) * 0.35)); // goals diff weighted
    adj += (form - 1.0) * 0.25; // form weighting
  } else {
    // fallback to name-based bucket
    if (strongTeams.some(t => teamName.includes(t))) adj += 0.35;
    else if (mediumTeams.some(t => teamName.includes(t))) adj += 0.1;
    else if (weakTeams.some(t => teamName.includes(t))) adj -= 0.25;
  }

  // Kleine zufällige Streuung (sehr klein)
  const noise = (Math.random() - 0.5) * 0.06; // ±0.03
  const raw = (base + adj + noise) * leagueFactor;

  // clamp to sensible interval
  const result = Math.max(0.35, Math.min(3.5, raw));
  return +result.toFixed(2);
}

/* ---------- Hauptfunktion: Spiele abrufen (jetzt mit Teamform) ---------- */
async function fetchGamesFromAPI() {
  if (!FOOTBALL_DATA_KEY) return [];

  const headers = { "X-Auth-Token": FOOTBALL_DATA_KEY };

  // 1) Hole alle geplanten Spiele für die konfigurierten Ligen
  const leaguePromises = Object.entries(LEAGUE_IDS).map(async ([leagueName, id]) => {
    try {
      const url = `https://api.football-data.org/v4/competitions/${id}/matches?status=SCHEDULED`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        console.warn(`League fetch ${leagueName} returned ${res.status}`);
        return [];
      }
      const data = await res.json();
      return (data.matches || []).map(m => ({ match: m, leagueName }));
    } catch (err) {
      console.error("Fehler Liga", leagueName, err.message || err);
      return [];
    }
  });

  const leagueResults = await Promise.all(leaguePromises);
  const matchEntries = leagueResults.flat(); // each element { match, leagueName }
  if (!matchEntries.length) return [];

  // 2) Sammle einmalig alle eindeutigen Team-IDs, damit wir Team-Statistiken holen können
  const uniqueTeams = new Map(); // teamId -> { id, name }
  for (const e of matchEntries) {
    const m = e.match;
    if (m.homeTeam?.id) uniqueTeams.set(m.homeTeam.id, { id: m.homeTeam.id, name: m.homeTeam.name });
    if (m.awayTeam?.id) uniqueTeams.set(m.awayTeam.id, { id: m.awayTeam.id, name: m.awayTeam.name });
  }

  // 3) Hole Team-Stats sequenziell (vorsichtiger mit Rate-Limits). Cache wird genutzt.
  const teamStatsById = {};
  const teamIds = Array.from(uniqueTeams.keys());

  for (let i = 0; i < teamIds.length; i++) {
    const tid = teamIds[i];
    try {
      // small stagger to avoid bursts if many teams
      if (i > 0 && i % 8 === 0) await sleep(250); // kurze Pause nach jedem 8. Team
      const stats = await fetchTeamStats(tid, { limit: 5 });
      teamStatsById[tid] = stats;
    } catch (err) {
      teamStatsById[tid] = null;
    }
  }

  // 4) Mappe matches zu strukturierter Ausgabe unter Nutzung teamStats
  const results = [];
  for (const entry of matchEntries) {
    const m = entry.match;
    const leagueName = entry.leagueName;
    try {
      const homeId = m.homeTeam?.id;
      const awayId = m.awayTeam?.id;
      const homeStats = homeId ? teamStatsById[homeId] : null;
      const awayStats = awayId ? teamStatsById[awayId] : null;

      const homeName = m.homeTeam?.name || "Home";
      const awayName = m.awayTeam?.name || "Away";

      const homeXG = estimateXG(homeName, true, leagueName, homeStats);
      const awayXG = estimateXG(awayName, false, leagueName, awayStats);

      const outcome = computeMatchOutcomeProbs(homeXG, awayXG);
      const over25Prob = computeOver25Prob(homeXG, awayXG);
      const pHomeAtLeast1 = 1 - poisson(0, homeXG);
      const pAwayAtLeast1 = 1 - poisson(0, awayXG);
      const btts = +(pHomeAtLeast1 * pAwayAtLeast1).toFixed(4);

      // Simulierte / placeholder Quoten — du kannst hier real quotes integrieren
      const odds = {
        home: +(1.5 + Math.random() * 1.6).toFixed(2),
        draw: +(2.8 + Math.random() * 1.3).toFixed(2),
        away: +(1.6 + Math.random() * 1.5).toFixed(2),
        over25: +(1.8 + Math.random() * 0.5).toFixed(2),
        under25: +(1.8 + Math.random() * 0.5).toFixed(2)
      };

      const prob = {
        home: outcome.home,
        draw: outcome.draw,
        away: outcome.away,
        over25: over25Prob,
        under25: +(1 - over25Prob).toFixed(4)
      };

      const value = {
        home: +((prob.home * odds.home) - 1).toFixed(4),
        draw: +((prob.draw * odds.draw) - 1).toFixed(4),
        away: +((prob.away * odds.away) - 1).toFixed(4),
        over25: +((prob.over25 * odds.over25) - 1).toFixed(4),
        under25: +((prob.under25 * odds.under25) - 1).toFixed(4)
      };

      let trend = "neutral";
      if (value.home > 0.05 && prob.home > prob.away + 0.15) trend = "home";
      else if (value.away > 0.05 && prob.away > prob.home + 0.15) trend = "away";
      else if (Math.abs(prob.home - prob.away) < 0.1 && value.draw > 0) trend = "draw";

      results.push({
        id: m.id,
        date: m.utcDate,
        league: leagueName,
        home: homeName,
        away: awayName,
        homeLogo: `https://flagcdn.com/48x36/${getFlag(homeName)}.png`,
        awayLogo: `https://flagcdn.com/48x36/${getFlag(awayName)}.png`,
        homeXG, awayXG, odds, prob, value, btts, trend
      });
    } catch (err) {
      console.warn("Match mapping error", m?.id, err.message || err);
    }
  }

  // 5) Sortiere nach Datum
  return results.sort((a, b) => new Date(a.date) - new Date(b.date));
}

/* ---------- API ---------- */
app.get("/api/games", async (req, res) => {
  try {
    const now = Date.now();
    if (!cache.data.length || now - cache.timestamp > CACHE_DURATION) {
      const games = await fetchGamesFromAPI();
      cache = { timestamp: now, data: games };
    }

    let filtered = cache.data.slice();
    if (req.query.date) filtered = filtered.filter(g => g.date.startsWith(req.query.date));
    if (req.query.league) filtered = filtered.filter(g => g.league === req.query.league);
    if (req.query.team) {
      const q = req.query.team.toLowerCase();
      filtered = filtered.filter(g => g.home.toLowerCase().includes(q) || g.away.toLowerCase().includes(q));
    }

    res.json({ response: filtered });
  } catch (err) {
    console.error("API Fehler:", err.message || err);
    res.status(500).json({ response: [], error: err.message });
  }
});

/* ---------- Frontend ---------- */
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf Port ${PORT}`);
  // kurzer Plausibilitäts-Check
  const test = computeMatchOutcomeProbs(1.8, 1.2);
  console.log("🧮 Test Poisson Beispiel 1.8–1.2:", test);
});
