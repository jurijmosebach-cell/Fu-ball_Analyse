// server.js — Vollständig optimierte Version für präzisere Berechnungen
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.static(__dirname));

const PORT = process.env.PORT || 10000;
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_API_KEY || "";

if (!FOOTBALL_DATA_KEY) {
    console.warn("⚠️ WARNING: FOOTBALL_DATA_API_KEY nicht gesetzt — API-Aufrufe geben leere Ergebnisse zurück.");
}

/* ---------- KONFIGURATION ---------- */
const CACHE_DURATION = 15 * 60 * 1000; // 15 Minuten für Spiele
const TEAM_STATS_TTL = 60 * 60 * 1000; // 1 Stunde für Team-Statistiken
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

/* ---------- CACHING SYSTEM ---------- */
const teamStatsCache = {};
const responseCache = new Map();

async function fetchWithCache(url, options = {}, ttl = CACHE_DURATION) {
    const cacheKey = `${url}-${JSON.stringify(options)}`;
    const cached = responseCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.data;
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    responseCache.set(cacheKey, {
        timestamp: Date.now(),
        data
    });
    
    if (responseCache.size > 100) {
        const oldestKey = responseCache.keys().next().value;
        responseCache.delete(oldestKey);
    }
    
    return data;
}

/* ---------- MATHEMATISCHE FUNKTIONEN ---------- */
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

function sigmoid(x, k = 5) {
    return 1 / (1 + Math.exp(-k * x));
}

/* ---------- SAISONALITÄTS-FAKTOR ---------- */
function getSeasonalFactor(league) {
    const now = new Date();
    const month = now.getMonth();
    
    const factors = {
        "Premier League": month >= 7 && month <= 11 ? 1.05 : 0.98,
        "Bundesliga": month >= 7 && month <= 11 ? 1.06 : 0.97,
        "La Liga": month >= 8 && month <= 12 ? 1.04 : 0.99,
        "Serie A": month >= 8 && month <= 12 ? 1.03 : 0.98,
        "Ligue 1": month >= 8 && month <= 11 ? 1.04 : 0.99,
        "Champions League": month >= 8 && month <= 4 ? 1.02 : 0.99,
        "Eredivisie": month >= 7 && month <= 11 ? 1.05 : 0.98,
        "Campeonato Brasileiro Série A": month >= 3 && month <= 8 ? 1.04 : 0.98,
        "Championship": month >= 7 && month <= 11 ? 1.03 : 0.98,
        "Primeira Liga": month >= 8 && month <= 12 ? 1.02 : 0.99
    };
    return factors[league] || 1.0;
}

/* ---------- VERBESSERTE TEAM-STATISTIKEN ---------- */
function calculateFormRating(ppg, goalsFor, goalsAgainst, cleanSheetRate) {
    const baseRating = 1.0 + (ppg - 1.5) * 0.2;
    const goalDifferenceImpact = (goalsFor - goalsAgainst) * 0.1;
    const defenseBonus = cleanSheetRate * 0.15;
    
    return Math.max(0.7, Math.min(1.3, baseRating + goalDifferenceImpact + defenseBonus));
}

function computeEnhancedStatsFromMatches(matches, teamId) {
    if (!matches || !matches.length) {
        return {
            avgGoalsFor: 1.2,
            avgGoalsAgainst: 1.3, 
            formRating: 1.0,
            cleanSheetRate: 0.3,
            bttsRate: 0.5,
            ppg: 1.5,
            played: 0,
            homeGames: 0,
            awayGames: 0
        };
    }

    let goalsFor = 0, goalsAgainst = 0, points = 0, played = 0;
    let cleanSheets = 0, bttsCount = 0, homeGames = 0, awayGames = 0;

    matches.forEach(match => {
        const isHome = match.homeTeam.id === teamId;
        if (isHome) homeGames++; else awayGames++;
        
        const goalsScored = isHome ? match.score.fullTime.home : match.score.fullTime.away;
        const goalsConceded = isHome ? match.score.fullTime.away : match.score.fullTime.home;
        
        if (goalsScored === null || goalsConceded === null) return;
        
        goalsFor += goalsScored;
        goalsAgainst += goalsConceded;
        
        if (goalsConceded === 0) cleanSheets++;
        if (goalsScored > 0 && goalsConceded > 0) bttsCount++;
        
        if (goalsScored > goalsConceded) points += 3;
        else if (goalsScored === goalsConceded) points += 1;
        
        played++;
    });

    if (played === 0) {
        return {
            avgGoalsFor: 1.2,
            avgGoalsAgainst: 1.3,
            formRating: 1.0, 
            cleanSheetRate: 0.3,
            bttsRate: 0.5,
            ppg: 1.5,
            played: 0,
            homeGames: 0,
            awayGames: 0
        };
    }

    const avgGoalsFor = goalsFor / played;
    const avgGoalsAgainst = goalsAgainst / played;
    const cleanSheetRate = cleanSheets / played;
    const bttsRate = bttsCount / played;
    const ppg = points / played;
    
    const formRating = calculateFormRating(ppg, avgGoalsFor, avgGoalsAgainst, cleanSheetRate);
    
    return {
        avgGoalsFor: +avgGoalsFor.toFixed(2),
        avgGoalsAgainst: +avgGoalsAgainst.toFixed(2),
        formRating: +formRating.toFixed(3),
        cleanSheetRate: +cleanSheetRate.toFixed(3),
        bttsRate: +bttsRate.toFixed(3),
        ppg: +ppg.toFixed(2),
        played,
        homeGames,
        awayGames
    };
}

async function fetchEnhancedTeamStats(teamId, limit = 8) {
    if (!FOOTBALL_DATA_KEY) return null;
    
    const now = Date.now();
    const cached = teamStatsCache[teamId];
    if (cached && (now - cached.timestamp) < TEAM_STATS_TTL) return cached.stats;

    try {
        const url = `https://api.football-data.org/v4/teams/${teamId}/matches?status=FINISHED&limit=${limit}`;
        const data = await fetchWithCache(url, { 
            headers: { "X-Auth-Token": FOOTBALL_DATA_KEY } 
        });
        
        const enhancedStats = computeEnhancedStatsFromMatches(data.matches || [], teamId);
        teamStatsCache[teamId] = { timestamp: now, stats: enhancedStats };
        return enhancedStats;
        
    } catch (err) {
        console.warn("Enhanced team stats failed for", teamId, err.message);
        teamStatsCache[teamId] = { timestamp: now, stats: null };
        return null;
    }
}

/* ---------- VERBESSERTE XG-SCHÄTZUNG ---------- */
function estimateXG(teamName, isHome = true, league = "", teamStats = null, opponentStats = null) {
    const base = isHome ? 1.45 : 1.10;
    const LEAGUE_XG_FACTOR = {
        "Premier League": 1.05, "Bundesliga": 1.10, "La Liga": 1.00, "Serie A": 0.95,
        "Ligue 1": 1.02, "Champions League": 1.08, "Eredivisie": 1.12, 
        "Campeonato Brasileiro Série A": 0.92, "Primeira Liga": 0.94, 
        "Championship": 0.98, "European Championship": 0.90
    };
    
    const leagueFactor = LEAGUE_XG_FACTOR[league] || 1.0;
    let adj = 0;

    // Erweiterte Statistik-basierte Anpassung
    if (teamStats && teamStats.played > 2) {
        const attackStrength = (teamStats.avgGoalsFor || 1.2) / 1.4;
        const defenseWeakness = opponentStats ? (opponentStats.avgGoalsAgainst || 1.3) / 1.4 : 1.0;
        
        adj += (attackStrength - 1) * 0.4;
        adj += (defenseWeakness - 1) * 0.3;
        adj += ((teamStats.formRating || 1.0) - 1) * 0.2;
    }

    // Home Advantage
    const homeAdvantage = isHome ? 0.15 : -0.10;
    
    // Saisonalität
    const seasonalFactor = getSeasonalFactor(league);
    
    // Kleiner Zufallsfaktor für Realismus
    const noise = (Math.random() - 0.5) * 0.06;
    
    const raw = (base + adj + homeAdvantage + noise) * leagueFactor * seasonalFactor;
    return +Math.max(0.35, Math.min(3.8, raw)).toFixed(2);
}

/* ---------- PRÄZISE WAHRSCHEINLICHKEITS-BERECHNUNGEN ---------- */
function computeMatchOutcomeProbs(homeLambda, awayLambda, maxGoals = 8) {
    let homeProb = 0, drawProb = 0, awayProb = 0;
    let exactScores = [];
    
    for (let i = 0; i <= maxGoals; i++) {
        const pHome = poisson(i, homeLambda);
        for (let j = 0; j <= maxGoals; j++) {
            const pAway = poisson(j, awayLambda);
            const p = pHome * pAway;
            
            exactScores.push({ home: i, away: j, probability: p });
            
            if (i > j) homeProb += p;
            else if (i === j) drawProb += p;
            else awayProb += p;
        }
    }

    // Korrektur für niedrige Torquoten
    const totalGoalsFactor = Math.min(1, (homeLambda + awayLambda) / 3);
    const lowScoreCorrection = 0.1 * (1 - totalGoalsFactor);
    
    drawProb = Math.min(0.5, drawProb + lowScoreCorrection);
    
    // Normalisieren
    const total = homeProb + drawProb + awayProb;
    const normalized = {
        home: +(homeProb / total).toFixed(4),
        draw: +(drawProb / total).toFixed(4),
        away: +(awayProb / total).toFixed(4)
    };

    return normalized;
}

function computeOver25Prob(homeLambda, awayLambda, maxGoals = 8) {
    let pLe2 = 0;
    for (let i = 0; i <= maxGoals; i++) {
        const ph = poisson(i, homeLambda);
        for (let j = 0; j <= maxGoals; j++) {
            if (i + j <= 2) {
                pLe2 += ph * poisson(j, awayLambda);
            }
        }
    }
    return +(1 - pLe2).toFixed(4);
}

function computeBTTS(homeLambda, awayLambda, homeStats = null, awayStats = null) {
    const pHomeAtLeast1 = 1 - poisson(0, homeLambda);
    const pAwayAtLeast1 = 1 - poisson(0, awayLambda);
    let btts = pHomeAtLeast1 * pAwayAtLeast1;

    // Statistik-basierte Anpassung
    if (homeStats && awayStats && homeStats.played > 0 && awayStats.played > 0) {
        const avgBTTsRate = (homeStats.bttsRate + awayStats.bttsRate) / 2;
        const adjustment = (avgBTTsRate - 0.5) * 0.15; // Anpassung basierend auf historischen Daten
        btts = Math.min(0.95, Math.max(0.05, btts + adjustment));
    }
    
    return +btts.toFixed(4);
}

/* ---------- ERWEITERTE TREND-BERECHNUNG ---------- */
function calculateMomentum(stats) {
    if (!stats || stats.played < 3) return 0.5;
    
    const form = stats.formRating || 1.0;
    const ppg = stats.ppg || 1.5;
    const goalDifference = (stats.avgGoalsFor || 1.2) - (stats.avgGoalsAgainst || 1.3);
    
    return Math.max(0, Math.min(1, 
        0.3 + (form - 1) * 0.4 + (ppg - 1.5) * 0.2 + goalDifference * 0.1
    ));
}

function computeEnhancedTrend({ prob, value, homeXG, awayXG, homeStats = null, awayStats = null }) {
    const ph = prob?.home ?? 0;
    const pd = prob?.draw ?? 0;
    const pa = prob?.away ?? 0;

    // xG Dominanz
    const xgDominance = homeXG - awayXG;
    const xgTotal = Math.max(0.1, homeXG + awayXG);
    const xgShareHome = homeXG / xgTotal;

    // Value mit Threshold
    const valueThreshold = 0.1;
    const valueHome = Math.max(0, (value?.home ?? 0) - valueThreshold);
    const valueAway = Math.max(0, (value?.away ?? 0) - valueThreshold);
    const valueHomeNorm = sigmoid(valueHome, 8);
    const valueAwayNorm = sigmoid(valueAway, 8);

    // Form mit Momentum
    const homeForm = calculateMomentum(homeStats);
    const awayForm = calculateMomentum(awayStats);

    // Optimierte Gewichte
    const W_PROB = 0.50;
    const W_XG = 0.25;
    const W_VALUE = 0.15;
    const W_FORM = 0.10;

    const homeScore = (ph * W_PROB) + 
                     (xgShareHome * W_XG) + 
                     (valueHomeNorm * W_VALUE) + 
                     (homeForm * W_FORM);

    const awayScore = (pa * W_PROB) + 
                     ((1 - xgShareHome) * W_XG) + 
                     (valueAwayNorm * W_VALUE) + 
                     (awayForm * W_FORM);

    // Verbesserte Draw-Berechnung
    const goalExpectancy = Math.min(1, xgTotal / 4);
    const drawScore = (pd * 0.6) + 
                     ((1 - Math.abs(ph - pa)) * 0.3) + 
                     ((1 - goalExpectancy) * 0.1);

    // Entscheidung
    const scores = { home: homeScore, away: awayScore, draw: drawScore };
    const winner = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    
    return winner.charAt(0).toUpperCase() + winner.slice(1);
}

/* ---------- VALUE-BERECHNUNG ---------- */
function calculateValue(probability, odds) {
    if (!odds || odds <= 1) return 0;
    return +((probability * odds) - 1).toFixed(4);
}

/* ---------- HAUPT-API-ROUTE ---------- */
app.get("/api/games", async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        
        if (!FOOTBALL_DATA_KEY) {
            return res.json({ 
                response: [],
                message: "API Key nicht konfiguriert" 
            });
        }

        // Spiele von der API abrufen
        const apiUrl = `https://api.football-data.org/v4/matches?dateFrom=${date}&dateTo=${date}`;
        const data = await fetchWithCache(apiUrl, {
            headers: { "X-Auth-Token": FOOTBALL_DATA_KEY }
        });

        if (!data.matches) {
            return res.json({ response: [] });
        }

        // Spiele verarbeiten
        const processedGames = await Promise.all(
            data.matches.map(async (match) => {
                try {
                    const homeTeam = match.homeTeam?.name || "Unbekannt";
                    const awayTeam = match.awayTeam?.name || "Unbekannt";
                    const league = match.competition?.name || "Unbekannt";
                    
                    // Team-Statistiken parallel abrufen
                    const [homeStats, awayStats] = await Promise.all([
                        match.homeTeam?.id ? fetchEnhancedTeamStats(match.homeTeam.id) : null,
                        match.awayTeam?.id ? fetchEnhancedTeamStats(match.awayTeam.id) : null
                    ]);

                    // xG schätzen
                    const homeXG = estimateXG(homeTeam, true, league, homeStats, awayStats);
                    const awayXG = estimateXG(awayTeam, false, league, awayStats, homeStats);

                    // Wahrscheinlichkeiten berechnen
                    const prob = computeMatchOutcomeProbs(homeXG, awayXG);
                    const over25 = computeOver25Prob(homeXG, awayXG);
                    const btts = computeBTTS(homeXG, awayXG, homeStats, awayStats);

                    // Odds simulieren (in der Realität von einer Odds-API)
                    const odds = {
                        home: +(1 / prob.home * (0.92 + Math.random() * 0.1)).toFixed(2),
                        draw: +(1 / prob.draw * (0.92 + Math.random() * 0.1)).toFixed(2),
                        away: +(1 / prob.away * (0.92 + Math.random() * 0.1)).toFixed(2),
                        over25: +(1 / over25 * (0.92 + Math.random() * 0.1)).toFixed(2)
                    };

                    // Value berechnen
                    const value = {
                        home: calculateValue(prob.home, odds.home),
                        draw: calculateValue(prob.draw, odds.draw),
                        away: calculateValue(prob.away, odds.away),
                        over25: calculateValue(over25, odds.over25),
                        under25: calculateValue(1 - over25, 1.9) // Fixed odds for under
                    };

                    // Trend bestimmen
                    const trend = computeEnhancedTrend({
                        prob,
                        value, 
                        homeXG,
                        awayXG,
                        homeStats,
                        awayStats
                    });

                    return {
                        id: match.id,
                        home: homeTeam,
                        away: awayTeam,
                        league: league,
                        date: match.utcDate,
                        homeLogo: match.homeTeam?.crest || `https://flagcdn.com/w40/${getFlag(homeTeam)}.png`,
                        awayLogo: match.awayTeam?.crest || `https://flagcdn.com/w40/${getFlag(awayTeam)}.png`,
                        homeXG,
                        awayXG,
                        prob,
                        value,
                        odds,
                        btts,
                        trend,
                        over25: prob.over25 || over25,
                        under25: 1 - (prob.over25 || over25)
                    };
                } catch (error) {
                    console.error("Error processing match:", match.id, error);
                    return null;
                }
            })
        );

        // Null-Werte filtern und nach Value sortieren
        const validGames = processedGames.filter(game => game !== null);
        const sortedGames = validGames.sort((a, b) => {
            const maxValueA = Math.max(a.value.home, a.value.draw, a.value.away);
            const maxValueB = Math.max(b.value.home, b.value.draw, b.value.away);
            return maxValueB - maxValueA;
        });

        res.json({ response: sortedGames });

    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ 
            error: "Interner Serverfehler",
            message: error.message 
        });
    }
});

/* ---------- FLAG-FUNKTION ---------- */
function getFlag(team) {
    const flags = {
        "Manchester": "gb", "Liverpool": "gb", "Chelsea": "gb", "Arsenal": "gb", "Tottenham": "gb",
        "Bayern": "de", "Dortmund": "de", "Leipzig": "de", "Gladbach": "de", "Frankfurt": "de", "Leverkusen": "de",
        "Real": "es", "Barcelona": "es", "Atletico": "es", "Sevilla": "es", "Valencia": "es",
        "Juventus": "it", "Inter": "it", "Milan": "it", "Napoli": "it", "Roma": "it", "Lazio": "it",
        "PSG": "fr", "Marseille": "fr", "Monaco": "fr", "Lyon": "fr", "Rennes": "fr", "Nice": "fr"
    };
    for (const [k, v] of Object.entries(flags)) {
        if (team.includes(k)) return v;
    }
    return "eu";
}

/* ---------- SERVER START ---------- */
app.listen(PORT, () => {
    console.log(`🚀 Server läuft auf Port ${PORT}`);
    console.log(`📊 Verbesserte Berechnungen aktiviert`);
    console.log(`🔮 Präzisere Wahrscheinlichkeiten geladen`);
});
