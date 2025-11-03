// server.js – komplette Version mit stabilen xG/Poisson/Over2.5/BTTS Berechnungen
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

if (!FOOTBALL_DATA_KEY) console.warn("⚠️ FOOTBALL_DATA_API_KEY nicht gesetzt");

let cache = { timestamp: 0, data: [] };
const CACHE_DURATION = 15 * 60 * 1000;
const teamStatsCache = {};
const TEAM_STATS_TTL = 60 * 60 * 1000;

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
  for (const [name, flag] of Object.entries(flags)) if (team.includes(name)) return flag;
  return "eu";
}

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }
function factorial(n) { if (n <= 1) return 1; let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; }
function poisson(k, lambda) {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return Math.pow(lambda, k) * Math.exp(-lambda) / factorial(k);
}

/* ---------- Match-Wahrscheinlichkeiten ---------- */
function computeMatchOutcomeProbs(homeLambda, awayLambda, maxGoals = 10) {
  homeLambda = Math.max(0.1, Math.min(5, homeLambda));
  awayLambda = Math.max(0.1, Math.min(5, awayLambda));

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

  const lowScoreFactor = Math.min(1, Math.exp(-0.5*(homeLambda+awayLambda-2)));
  drawProb = drawProb * (0.85 + 0.15*lowScoreFactor);

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
  let over25 = 1 - pLe2;
  over25 = Math.min(0.99, Math.max(0.01, over25));
  return +over25.toFixed(4);
}

function computeBTTS(homeLambda, awayLambda, homeStats = null, awayStats = null) {
  const pHomeAtLeast1 = 1 - poisson(0, homeLambda);
  const pAwayAtLeast1 = 1 - poisson(0, awayLambda);
  let btts = pHomeAtLeast1 * pAwayAtLeast1;

  if(homeStats && awayStats) {
    const formFactor = ((homeStats.avgGoalsFor + awayStats.avgGoalsFor)/2 - (homeStats.avgGoalsAgainst + awayStats.avgGoalsAgainst)/2) * 0.05;
    btts = Math.min(0.99, Math.max(0.01, btts + formFactor));
  }

  return +btts.toFixed(4);
}

/* ---------- Team-Form & Statistik ---------- */
async function fetchTeamStats(teamId, opts = { limit: 5 }) {
  if (!FOOTBALL_DATA_KEY) return null;
  const cached = teamStatsCache[teamId];
  const now = Date.now();
  if (cached && (now - cached.timestamp) < TEAM_STATS_TTL && cached.stats) return cached.stats;

  try {
    const limit = opts.limit || 5;
    const url = `https://api.football-data.org/v4/teams/${teamId}/matches?status=FINISHED&limit=${limit}`;
    const res = await fetch(url, { headers: { "X-Auth-Token": FOOTBALL_DATA_KEY } });
    if (!res.ok) throw new Error(`Team matches fetch failed: ${res.status}`);
    const data = await res.json();
    const recent = (data.matches || []).slice(0, limit);
    const stats = computeStatsFromMatches(recent);
    teamStatsCache[teamId] = { timestamp: now, stats };
    await sleep(120);
    return stats;
  } catch (err) {
    console.warn("fetchTeamStats error for", teamId, err.message || err);
    teamStatsCache[teamId] = { timestamp: Date.now(), stats: null };
    return null;
  }
}

function computeStatsFromMatches(matches = []) {
  if (!matches.length) return { avgGoalsFor: 1.2, avgGoalsAgainst: 1.3, formRating: 1.0, played: 0 };
  let goalsFor = 0, goalsAgainst = 0, points = 0;
  for (const m of matches) {
    const h = m.score?.fullTime?.home ?? null;
    const a = m.score?.fullTime?.away ?? null;
    if (h === null || a === null) continue;
    goalsFor += Math.max(h, a);
    goalsAgainst += Math.min(h, a);
    points += h > a ? 3 : h === a ? 1 : 0;
  }
  const played = matches.length;
  const avgGoalsFor = +(goalsFor / played).toFixed(2);
  const avgGoalsAgainst = +(goalsAgainst / played).toFixed(2);
  const avgPoints = points / played;
  const formRating = +(1 + ((avgPoints - 1) / 2)).toFixed(3);
  return { avgGoalsFor, avgGoalsAgainst, formRating, played };
}

/* ---------- XG-Schätzung ---------- */
function estimateXG(teamName, isHome, league = "", teamStats = null) {
  const base = isHome ? 1.45 : 1.10;
  const LEAGUE_XG_FACTOR = {
    "Premier League": 1.05, "Bundesliga": 1.10, "La Liga": 1.00, "Serie A": 0.95,
    "Ligue 1": 1.02, "Champions League": 1.08, "Eredivisie": 1.12, "Campeonato Brasileiro Série A": 0.92,
    "Primeira Liga": 0.94, "Championship": 0.98, "European Championship": 0.90
  };
  const leagueFactor = LEAGUE_XG_FACTOR[league] || 1.0;

  const strongTeams = ["Man City","Liverpool","Arsenal","Bayern","Real Madrid","PSG","Inter","Juventus","Barcelona"];
  const mediumTeams = ["Newcastle","Aston Villa","Leipzig","Napoli","Atletico","Marseille","Leverkusen","Fiorentina"];
  const weakTeams = ["Bochum","Cadiz","Verona","Clermont","Empoli","Luton","Sheffield","Salernitana"];

  let adj = 0;
  if (teamStats && teamStats.played > 0) {
    const gf = teamStats.avgGoalsFor || 1.2;
    const ga = teamStats.avgGoalsAgainst || 1.3;
    const form = teamStats.formRating || 1.0;
    adj += Math.max(-0.6, Math.min(0.6, (gf - ga) * 0.35));
    adj += (form - 1.0) * 0.25;
  } else {
    if(strongTeams.some(t => teamName.includes(t))) adj += 0.35;
    else if(mediumTeams.some(t => teamName.includes(t))) adj += 0.1;
    else if(weakTeams.some(t => teamName.includes(t))) adj -= 0.25;
  }

  const noise = (Math.random()-0.5)*0.06;
  const raw = (base + adj + noise) * leagueFactor;
  return +Math.max(0.35, Math.min(3.5, raw)).toFixed(2);
}

/* ---------- Spiele abrufen ---------- */
async function fetchGamesFromAPI() {
  if (!FOOTBALL_DATA_KEY) return [];

  const headers = { "X-Auth-Token": FOOTBALL_DATA_KEY };
  const leaguePromises = Object.entries(LEAGUE_IDS).map(async ([leagueName,id]) => {
    try {
      const url = `https://api.football-data.org/v4/competitions/${id}/matches?status=SCHEDULED`;
      const res = await fetch(url,{headers});
      if(!res.ok) return [];
      const data = await res.json();
      return (data.matches||[]).map(m => ({ match:m, leagueName }));
    } catch(e){ return []; }
  });

  const leagueResults = await Promise.all(leaguePromises);
  const matchEntries = leagueResults.flat();
  if(!matchEntries.length) return [];

  const uniqueTeams = new Map();
  for(const e of matchEntries){
    const m = e.match;
    if(m.homeTeam?.id) uniqueTeams.set(m.homeTeam.id,{id:m.homeTeam.id,name:m.homeTeam.name});
    if(m.awayTeam?.id) uniqueTeams.set(m.awayTeam.id,{id:m.awayTeam.id,name:m.awayTeam.name});
  }

  const teamStatsById = {};
  const teamIds = Array.from(uniqueTeams.keys());
  for(let i=0;i<teamIds.length;i++){
    const tid = teamIds[i];
    if(i>0 && i%8===0) await sleep(250);
    const stats = await fetchTeamStats(tid,{limit:5});
    teamStatsById[tid] = stats;
  }

  const results = [];
  for(const entry of matchEntries){
    const m = entry.match;
    const leagueName = entry.leagueName;
    try{
      const homeId = m.homeTeam?.id;
      const awayId = m.awayTeam?.id;
      const homeStats = homeId ? teamStatsById[homeId] : null;
      const awayStats = awayId ? teamStatsById[awayId] : null;

      const homeName = m.homeTeam?.name || "Home";
      const awayName = m.awayTeam?.name || "Away";

      const homeXG = estimateXG(homeName,true,leagueName,homeStats);
      const awayXG = estimateXG(awayName,false,leagueName,awayStats);

      const outcome = computeMatchOutcomeProbs(homeXG,awayXG);
      const over25Prob = computeOver25Prob(homeXG,awayXG);
      const btts = computeBTTS(homeXG,awayXG,homeStats,awayStats);

      const odds = {
        home:+(1.5+Math.random()*1.6).toFixed(2),
        draw:+(2.8+Math.random()*1.3).toFixed(2),
        away:+(1.6+Math.random()*1.5).toFixed(2),
        over25:+(1.8+Math.random()*0.5).toFixed(2),
        under25:+(1.8+Math.random()*0.5).toFixed(2)
      };

      const prob = {
        home:outcome.home, draw:outcome.draw, away:outcome.away,
        over25:over25Prob, under25:+(1-over25Prob).toFixed(4)
      };

      const value = {
        home:+((prob.home*odds.home)-1).toFixed(4),
        draw:+((prob.draw*odds.draw)-1).toFixed(4),
        away:+((prob.away*odds.away)-1).toFixed(4),
        over25:+((prob.over25*odds.over25)-1).toFixed(4),
        under25:+((prob.under25*odds.under25)-1).toFixed(4)
      };

      let trend = "neutral";
      if(value.home>0.05 && prob.home>prob.away+0.15) trend="home";
      else if(value.away>0.05 && prob.away>prob.home+0.15) trend="away";
      else if(Math.abs(prob.home-prob.away)<0.1 && value.draw>0) trend="draw";

      results.push({
        id:m.id,
        date:m.utcDate,
        league:leagueName,
        home:homeName,
        away:awayName,
        homeLogo:`https://flagcdn.com/48x36/${getFlag(homeName)}.png`,
        awayLogo:`https://flagcdn.com/48x36/${getFlag(awayName)}.png`,
        homeXG, awayXG, odds, prob, value, btts, trend
      });
    }catch(e){ console.warn("Match mapping error",m?.id,e.message||e); }
  }

  return results.sort((a,b)=>new Date(a.date)-new Date(b.date));
}

/* ---------- API Endpoint ---------- */
app.get("/api/games", async (req,res)=>{
  try{
    const now = Date.now();
    if(!cache.data.length || now-cache.timestamp> CACHE_DURATION){
      const games = await fetchGamesFromAPI();
      cache={timestamp:now,data:games};
    }

    let filtered = cache.data.slice();
    if(req.query.date) filtered = filtered.filter(g=>g.date.startsWith(req.query.date));
    if(req.query.league) filtered = filtered.filter(g=>g.league===req.query.league);
    if(req.query.team){
      const q = req.query.team.toLowerCase();
      filtered = filtered.filter(g=>g.home.toLowerCase().includes(q)||g.away.toLowerCase().includes(q));
    }

    res.json({response:filtered});
  }catch(err){
    console.error("API Fehler:",err.message||err);
    res.status(500).json({response:[],error:err.message});
  }
});

/* ---------- Frontend ---------- */
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"index.html")));

/* ---------- Server starten ---------- */
app.listen(PORT,()=>{
  console.log(`🚀 Server läuft auf Port ${PORT}`);
});
