// server.js – mit Teamform + lokalem Cache (anti-429)
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const fetch = globalThis.fetch;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.static(__dirname));

const PORT = process.env.PORT || 10000;
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_API_KEY || "";

// Cache-Datei für Teamform-Daten
const TEAM_CACHE_FILE = path.join(__dirname, "team_cache.json");
let teamCache = {};

// Cache laden (falls vorhanden)
if (fs.existsSync(TEAM_CACHE_FILE)) {
  try {
    teamCache = JSON.parse(fs.readFileSync(TEAM_CACHE_FILE, "utf8"));
  } catch {
    teamCache = {};
  }
}

// Cache speichern
function saveTeamCache() {
  fs.writeFileSync(TEAM_CACHE_FILE, JSON.stringify(teamCache, null, 2));
}

// In-Memory-Cache für Matches
let cache = { timestamp: 0, data: [] };
const CACHE_DURATION = 15 * 60 * 1000;

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

/* ---------- Utility ---------- */
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

function factorial(n) {
  if (n <= 1) return 1;
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}
function poisson(k, lambda) {
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
  const total = homeProb + drawProb + awayProb;
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

/* ---------- Teamform aus Cache/API ---------- */
async function fetchTeamForm(teamId) {
  const today = new Date().toISOString().split("T")[0];

  // Falls Cache-Eintrag aktuell → direkt zurückgeben
  if (teamCache[teamId] && teamCache[teamId].date === today) {
    return teamCache[teamId].formFactor;
  }

  if (!FOOTBALL_DATA_KEY) return 1.0;

  const url = `https://api.football-data.org/v4/teams/${teamId}/matches?status=FINISHED&limit=5`;
  try {
    const res = await fetch(url, { headers: { "X-Auth-Token": FOOTBALL_DATA_KEY } });
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    const data = await res.json();

    if (!data.matches?.length) return 1.0;

    let points = 0;
    for (const m of data.matches.slice(0, 5)) {
      if (!m.score?.winner) continue;
      if (m.score.winner === "HOME_TEAM" && m.homeTeam.id === teamId) points += 3;
      else if (m.score.winner === "AWAY_TEAM" && m.awayTeam.id === teamId) points += 3;
      else if (m.score.winner === "DRAW") points += 1;
    }
    const formFactor = +(0.8 + (points / 15) * 0.4).toFixed(2); // 0.8–1.2
    teamCache[teamId] = { date: today, formFactor };
    saveTeamCache();
    return formFactor;
  } catch (err) {
    console.log(`fetchTeamForm error for ${teamId}: ${err.message}`);
    return 1.0;
  }
}

/* ---------- Verbesserte XG-Schätzung mit Teamform ---------- */
function estimateXG(teamName, isHome, league = "", formFactor = 1.0) {
  const base = isHome ? 1.45 : 1.10;

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

  const strongTeams = ["Man City", "Liverpool", "Arsenal", "Bayern", "Real Madrid", "PSG", "Inter", "Juventus", "Barcelona"];
  const mediumTeams = ["Newcastle", "Aston Villa", "Leipzig", "Napoli", "Atletico", "Marseille", "Leverkusen", "Fiorentina"];
  const weakTeams = ["Bochum", "Cadiz", "Verona", "Clermont", "Empoli", "Luton", "Sheffield", "Salernitana"];

  let adj = 0;
  if (strongTeams.some(t => teamName.includes(t))) adj += 0.35;
  else if (mediumTeams.some(t => teamName.includes(t))) adj += 0.1;
  else if (weakTeams.some(t => teamName.includes(t))) adj -= 0.25;

  const noise = (Math.random() - 0.5) * 0.1;
  const result = (base + adj + noise) * leagueFactor * formFactor;

  return +Math.max(0.4, result).toFixed(2);
}

/* ---------- Matches laden ---------- */
async function fetchGamesFromAPI() {
  if (!FOOTBALL_DATA_KEY) return [];

  const headers = { "X-Auth-Token": FOOTBALL_DATA_KEY };

  const leaguePromises = Object.entries(LEAGUE_IDS).map(async ([leagueName, id]) => {
    try {
      const url = `https://api.football-data.org/v4/competitions/${id}/matches?status=SCHEDULED`;
      const res = await fetch(url, { headers });
      if (!res.ok) return [];
      const data = await res.json();
      if (!data.matches) return [];

      const games = [];
      for (const m of data.matches) {
        const homeForm = await fetchTeamForm(m.homeTeam?.id);
        const awayForm = await fetchTeamForm(m.awayTeam?.id);

        const homeXG = estimateXG(m.homeTeam?.name || "", true, leagueName, homeForm);
        const awayXG = estimateXG(m.awayTeam?.name || "", false, leagueName, awayForm);

        const outcome = computeMatchOutcomeProbs(homeXG, awayXG);
        const over25Prob = computeOver25Prob(homeXG, awayXG);
        const pHomeAtLeast1 = 1 - poisson(0, homeXG);
        const pAwayAtLeast1 = 1 - poisson(0, awayXG);
        const btts = +(pHomeAtLeast1 * pAwayAtLeast1).toFixed(4);

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

        games.push({
          id: m.id,
          date: m.utcDate,
          league: leagueName,
          home: m.homeTeam?.name || "Home",
          away: m.awayTeam?.name || "Away",
          homeLogo: `https://flagcdn.com/48x36/${getFlag(m.homeTeam?.name || "")}.png`,
          awayLogo: `https://flagcdn.com/48x36/${getFlag(m.awayTeam?.name || "")}.png`,
          homeXG, awayXG, odds, prob, value, btts, trend
        });
      }
      return games;
    } catch (err) {
      console.error("League fetch error:", leagueName, err.message);
      return [];
    }
  });

  const results = await Promise.all(leaguePromises);
  return results.flat().sort((a, b) => new Date(a.date) - new Date(b.date));
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

    res.json({ response: filtered });
  } catch (err) {
    console.error("API error:", err.message);
    res.status(500).json({ response: [], error: err.message });
  }
});

/* ---------- Frontend ---------- */
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf Port ${PORT}`);
  const test = computeMatchOutcomeProbs(1.8, 1.2);
  console.log("🧮 Test Poisson Beispiel 1.8–1.2:", test);
});
