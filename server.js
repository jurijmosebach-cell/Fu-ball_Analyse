// server.js — Optimized: multifactor trend (Variant 1), XG, probs, value, caching
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

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

/* ---------- CONFIG ---------- */
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes for matches
const TEAM_STATS_TTL = 60 * 60 * 1000; // 1 hour for team stats
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

/* ---------- Simple flag mapping ---------- */
function getFlag(team) {
  const flags = {
    "Manchester": "gb", "Liverpool": "gb", "Chelsea": "gb", "Arsenal": "gb", "Tottenham": "gb",
    "Bayern": "de", "Dortmund": "de", "Leipzig": "de", "Gladbach": "de", "Frankfurt": "de", "Leverkusen": "de",
    "Real": "es", "Barcelona": "es", "Atletico": "es", "Sevilla": "es", "Valencia": "es",
    "Juventus": "it", "Inter": "it", "Milan": "it", "Napoli": "it", "Roma": "it", "Lazio": "it",
    "PSG": "fr", "Marseille": "fr", "Monaco": "fr", "Lyon": "fr", "Rennes": "fr", "Nice": "fr"
  };
  for (const [k, v] of Object.entries(flags)) if (team.includes(k)) return v;
  return "eu";
}

/* ---------- Math helpers ---------- */
function factorial(n) {
  if (n <= 1) return 1;
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}
function poisson(k, lambda) {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return Math.pow(lambda, k) * Math.exp(-lambda) / factorial(k);
}

/* ---------- Outcome / Over / BTTS ---------- */
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
  // Small low-scoring adjustment to slightly increase draw probability in low scoring matches
  const lowScoreFactor = Math.min(1, Math.exp(-0.5 * (homeLambda + awayLambda - 2)));
  drawProb = drawProb * (0.85 + 0.15 * lowScoreFactor);

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
    for (let j = 0; j <= maxGoals; j++) if (i + j <= 2) pLe2 += ph * poisson(j, awayLambda);
  }
  return +(1 - pLe2).toFixed(4);
}

function computeBTTS(homeLambda, awayLambda, homeStats = null, awayStats = null) {
  const pHomeAtLeast1 = 1 - poisson(0, homeLambda);
  const pAwayAtLeast1 = 1 - poisson(0, awayLambda);
  let btts = pHomeAtLeast1 * pAwayAtLeast1;

  if (homeStats && awayStats) {
    const formFactor = ((homeStats.avgGoalsFor + awayStats.avgGoalsFor) / 2 - (homeStats.avgGoalsAgainst + awayStats.avgGoalsAgainst) / 2) * 0.05;
    btts = Math.min(0.99, Math.max(0.01, btts + formFactor));
  }
  return +btts.toFixed(4);
}

/* ---------- Team stats fetch & compute ---------- */
const teamStatsCache = {}; // { teamId: { timestamp, stats } }

async function fetchTeamStats(teamId, { limit = 5 } = {}) {
  if (!FOOTBALL_DATA_KEY) return null;
  const now = Date.now();
  const cached = teamStatsCache[teamId];
  if (cached && (now - cached.timestamp) < TEAM_STATS_TTL && cached.stats) return cached.stats;

  try {
    const url = `https://api.football-data.org/v4/teams/${teamId}/matches?status=FINISHED&limit=${limit}`;
    const res = await fetch(url, { headers: { "X-Auth-Token": FOOTBALL_DATA_KEY } });
    if (!res.ok) throw new Error(`Team matches fetch failed: ${res.status}`);
    const data = await res.json();
    const recent = (data.matches || []).slice(0, limit);
    const stats = computeStatsFromMatches(recent);
    teamStatsCache[teamId] = { timestamp: now, stats };
    return stats;
  } catch (err) {
    // fallback: empty stats to avoid crashing
    teamStatsCache[teamId] = { timestamp: now, stats: null };
    console.warn("fetchTeamStats failed for", teamId, err?.message || err);
    return null;
  }
}

function computeStatsFromMatches(matches = []) {
  if (!matches || !matches.length) return { avgGoalsFor: 1.2, avgGoalsAgainst: 1.3, formRating: 1.0, played: 0 };

  let goalsFor = 0, goalsAgainst = 0, points = 0, played = 0;
  for (const m of matches) {
    const h = m.score?.fullTime?.home ?? null;
    const a = m.score?.fullTime?.away ?? null;
    if (h === null || a === null) continue;
    // home/away rotation: compute goals for/against relative to the team we're fetching stats for later
    // Here we sum absolute goals — when used we treat them as averages for attack/defense proxy
    goalsFor += Math.max(h, a);
    goalsAgainst += Math.min(h, a);
    if (h > a) points += 3;
    else if (h === a) points += 1;
    played++;
  }
  if (played === 0) return { avgGoalsFor: 1.2, avgGoalsAgainst: 1.3, formRating: 1.0, played: 0 };
  const avgGoalsFor = +(goalsFor / played).toFixed(2);
  const avgGoalsAgainst = +(goalsAgainst / played).toFixed(2);
  const avgPoints = points / played;
  const formRating = +(1 + ((avgPoints - 1) / 2)).toFixed(3); // 1.0 baseline
  return { avgGoalsFor, avgGoalsAgainst, formRating, played };
}

/* ---------- XG estimate (improved) ---------- */
function estimateXG(teamName, isHome = true, league = "", teamStats = null) {
  const base = isHome ? 1.45 : 1.10;
  const LEAGUE_XG_FACTOR = {
    "Premier League": 1.05, "Bundesliga": 1.10, "La Liga": 1.00, "Serie A": 0.95,
    "Ligue 1": 1.02, "Champions League": 1.08, "Eredivisie": 1.12, "Campeonato Brasileiro Série A": 0.92,
    "Primeira Liga": 0.94, "Championship": 0.98, "European Championship": 0.90
  };
  const leagueFactor = LEAGUE_XG_FACTOR[league] || 1.0;

  let adj = 0;
  if (teamStats && teamStats.played > 0) {
    const gf = teamStats.avgGoalsFor || 1.2;
    const ga = teamStats.avgGoalsAgainst || 1.3;
    const form = teamStats.formRating || 1.0;
    adj += Math.max(-0.6, Math.min(0.6, (gf - ga) * 0.35));
    adj += (form - 1.0) * 0.25;
  } else {
    // small heuristics for well-known clubs - safe defaults
    const strong = ["Man City", "Liverpool", "Arsenal", "Bayern", "Real", "PSG", "Inter", "Juventus", "Barcelona"];
    const weak = ["Bochum", "Cadiz", "Verona", "Clermont", "Empoli", "Luton", "Sheffield", "Salernitana"];
    if (strong.some(s => teamName.includes(s))) adj += 0.25;
    if (weak.some(w => teamName.includes(w))) adj -= 0.25;
  }

  const noise = (Math.random() - 0.5) * 0.06;
  const raw = (base + adj + noise) * leagueFactor;
  return +Math.max(0.35, Math.min(3.5, raw)).toFixed(2);
}

/* ---------- Utility: normalize value to 0..1 with sigmoid ---------- */
function sigmoid(x, k = 5) {
  return 1 / (1 + Math.exp(-k * x));
}

/* ---------- Multifactor trend calculation (Variant 1: standard balanced) ---------- */
/*
  Inputs used:
    - probs.home / probs.draw / probs.away  (0..1)
    - homeXG, awayXG (>=0)
    - value.home / value.away (can be negative) -> scaled via sigmoid
    - teamStats.formRating (≈1 baseline) if available
  Output:
    - 'Home' | 'Away' | 'Draw' (capitalized to match front-end expectations)
*/
function computeTrendMultifactor({ prob, value, homeXG, awayXG, homeStats = null, awayStats = null }) {
  // safety defaults
  const ph = prob?.home ?? 0;
  const pd = prob?.draw ?? 0;
  const pa = prob?.away ?? 0;

  // xG share (avoid division by zero)
  const xgTotal = Math.max(0.0001, homeXG + awayXG);
  const xgShareHome = homeXG / xgTotal;
  const xgShareAway = awayXG / xgTotal;

  // normalize value (value = prob * odds - 1 ) — can be negative
  // use sigmoid to map to (0..1) centered at 0
  const valueHomeNorm = sigmoid((value?.home ?? 0), 6); // steep enough to highlight positive value
  const valueAwayNorm = sigmoid((value?.away ?? 0), 6);

  // form factors if available (center around 1 -> map to -..+)
  const homeForm = (homeStats?.formRating ?? 1.0);
  const awayForm = (awayStats?.formRating ?? 1.0);
  // map form to small [-0.2 .. 0.2]
  const formHomeScore = (homeForm - 1) * 0.25;
  const formAwayScore = (awayForm - 1) * 0.25;

  // Weights (Variant 1: balanced)
  const W_PROB = 0.55;    // main weight on model win-probabilities
  const W_XG = 0.25;      // contribution from xG share
  const W_VALUE = 0.15;   // value signal
  const W_FORM = 0.05;    // small contribution from recent form

  // Scores (higher is better)
  const homeScore = (ph * W_PROB) + (xgShareHome * W_XG) + (valueHomeNorm * W_VALUE) + (formHomeScore * W_FORM);
  const awayScore = (pa * W_PROB) + (xgShareAway * W_XG) + (valueAwayNorm * W_VALUE) + (formAwayScore * W_FORM);

  // Draw score: we blend draw-prob and closeness between home & away probabilities
  const closeness = 1 - Math.abs(ph - pa); // close to 1 when probs are similar
  const drawScore = (pd * 0.7) + (closeness * 0.3);

  // Decide winner, but require a margin to avoid tiny differences causing trend flips
  const margin = 0.03; // 3% margin to avoid noise-driven switching
  if (homeScore > awayScore + margin && homeScore > drawScore + margin) return "Home";
  if (awayScore > homeScore + margin && awayScore > drawScore + margin) return "Away";
  // else if drawScore is highest or differences are small -> Draw
  if (drawScore >= homeScore - margin && drawScore >= awayScore - margin) return "Draw";

  // fallback: choose the highest raw probability (safe)
  if (ph >= pa && ph >= pd) return "Home";
  if (pa > ph && pa >= pd) return "Away";
  return "Draw";
}

/* ---------- Fetch matches and build model output ---------- */
let matchesCache = { timestamp: 0, data: [] };

async function fetchGamesFromAPI() {
  if (!FOOTBALL_DATA_KEY) return [];
  const headers = { "X-Auth-Token": FOOTBALL_DATA_KEY };

  // fetch scheduled matches for each configured league
  const leaguePromises = Object.entries(LEAGUE_IDS).map(async ([leagueName, id]) => {
    try {
      const url = `https://api.football-data.org/v4/competitions/${id}/matches?status=SCHEDULED`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        // silent fail for single league
        return [];
      }
      const data = await res.json();
      return (data.matches || []).map(m => ({ match: m, leagueName }));
    } catch (err) {
      return [];
    }
  });

  const leagueResults = await Promise.all(leaguePromises);
  const entries = leagueResults.flat();
  if (!entries.length) return [];

  // collect unique team ids to fetch stats in batch
  const uniqueTeams = new Map();
  for (const e of entries) {
    const m = e.match;
    if (m.homeTeam?.id) uniqueTeams.set(m.homeTeam.id, { id: m.homeTeam.id, name: m.homeTeam.name });
    if (m.awayTeam?.id) uniqueTeams.set(m.awayTeam.id, { id: m.awayTeam.id, name: m.awayTeam.name });
  }

  // fetch team stats (with small throttling)
  const teamStatsById = {};
  const teamIds = Array.from(uniqueTeams.keys());
  for (let i = 0; i < teamIds.length; i++) {
    const tid = teamIds[i];
    if (i > 0 && i % 8 === 0) await new Promise(r => setTimeout(r, 200)); // be gentle
    teamStatsById[tid] = await fetchTeamStats(tid, { limit: 5 });
  }

  // build results
  const results = [];
  for (const entry of entries) {
    const m = entry.match;
    try {
      const homeId = m.homeTeam?.id;
      const awayId = m.awayTeam?.id;
      const homeStats = homeId ? teamStatsById[homeId] : null;
      const awayStats = awayId ? teamStatsById[awayId] : null;
      const homeName = m.homeTeam?.name || "Home";
      const awayName = m.awayTeam?.name || "Away";

      // Estimate xG for both sides
      const homeXG = estimateXG(homeName, true, entry.leagueName, homeStats);
      const awayXG = estimateXG(awayName, false, entry.leagueName, awayStats);

      // Compute probabilistic model (Poisson)
      const outcome = computeMatchOutcomeProbs(homeXG, awayXG);
      const over25 = computeOver25Prob(homeXG, awayXG);
      const btts = computeBTTS(homeXG, awayXG, homeStats, awayStats);

      // Simulate market odds if not available from an odds provider (kept realistic)
      const odds = {
        home: +(1.6 + Math.random() * 1.6).toFixed(2),
        draw: +(2.8 + Math.random() * 1.4).toFixed(2),
        away: +(1.7 + Math.random() * 1.6).toFixed(2),
        over25: +(1.8 + Math.random() * 0.6).toFixed(2),
        under25: +(1.8 + Math.random() * 0.6).toFixed(2)
      };

      // Probabilities
      const prob = {
        home: outcome.home,
        draw: outcome.draw,
        away: outcome.away,
        over25,
        under25: +(1 - over25).toFixed(4)
      };

      // Value calculation (prob * odds - 1)
      const value = {
        home: +(prob.home * odds.home - 1).toFixed(4),
        draw: +(prob.draw * odds.draw - 1).toFixed(4),
        away: +(prob.away * odds.away - 1).toFixed(4),
        over25: +(prob.over25 * odds.over25 - 1).toFixed(4),
        under25: +(prob.under25 * odds.under25 - 1).toFixed(4)
      };

      // Multifactor trend (server-side)
      const trend = computeTrendMultifactor({
        prob,
        value,
        homeXG,
        awayXG,
        homeStats,
        awayStats
      });

      results.push({
        id: m.id,
        date: m.utcDate,
        league: entry.leagueName,
        home: homeName,
        away: awayName,
        homeLogo: `https://flagcdn.com/48x36/${getFlag(homeName)}.png`,
        awayLogo: `https://flagcdn.com/48x36/${getFlag(awayName)}.png`,
        homeXG,
        awayXG,
        odds,
        prob,
        value,
        btts,
        trend
      });
    } catch (err) {
      console.warn("Match mapping error", m?.id, err?.message || err);
    }
  }

  // sort by date
  return results.sort((a, b) => new Date(a.date) - new Date(b.date));
}

/* ---------- API ---------- */
app.get("/api/games", async (req, res) => {
  try {
    const now = Date.now();
    if (!matchesCache.data.length || now - matchesCache.timestamp > CACHE_DURATION) {
      const games = await fetchGamesFromAPI();
      matchesCache = { timestamp: now, data: games };
    }

    let filtered = matchesCache.data.slice();

    if (req.query.date) {
      // expect YYYY-MM-DD format - filter by prefix
      filtered = filtered.filter(g => g.date && g.date.startsWith(req.query.date));
    }
    if (req.query.league) filtered = filtered.filter(g => g.league === req.query.league);
    if (req.query.team) {
      const q = req.query.team.toLowerCase();
      filtered = filtered.filter(g => g.home.toLowerCase().includes(q) || g.away.toLowerCase().includes(q));
    }

    res.json({ response: filtered });
  } catch (err) {
    console.error("API Fehler:", err?.message || err);
    res.status(500).json({ response: [], error: err?.message || String(err) });
  }
});

/* ---------- Frontend fallback ---------- */
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

/* ---------- Start server ---------- */
app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf Port ${PORT}`);
});
