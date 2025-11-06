// server.js — Vollständige korrigierte Version
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Middleware
app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PORT für Render
const PORT = process.env.PORT || 10000;

// API Keys aus Environment Variables
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_API_KEY;
const SPORTSAPI360_KEY = process.env.SPORTSAPI360_API_KEY;

// API Key Validation
console.log("🔑 API Keys:", {
    footballData: FOOTBALL_DATA_KEY ? "✅ Configured" : "❌ Missing",
    sportsAPI360: SPORTSAPI360_KEY ? "✅ Configured" : "❌ Missing"
});

// Konfiguration
const CACHE_DURATION = 10 * 60 * 1000;
const cache = new Map();

// SportsAPI360 Konfiguration
const SPORTSAPI360_CONFIG = {
    baseURL: "https://api.sportsapi360.com",
    endpoints: {
        matches: "/matches",
        odds: "/odds",
        statistics: "/statistics",
        leagues: "/leagues",
        teams: "/teams"
    },
    sports: {
        football: 1,
        basketball: 2,
        tennis: 3,
        hockey: 4
    }
};

// Health Check Route
app.get("/health", (req, res) => {
    res.status(200).json({ 
        status: "OK", 
        timestamp: new Date().toISOString(),
        apis: {
            football_data: !!FOOTBALL_DATA_KEY,
            sportsapi360: !!SPORTSAPI360_KEY
        }
    });
});

// Root Route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// SportsAPI360 Service Klasse
class SportsAPI360Service {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = SPORTSAPI360_CONFIG.baseURL;
    }

    async makeRequest(endpoint, params = {}) {
        if (!this.apiKey) {
            throw new Error("SportsAPI360 API Key nicht konfiguriert");
        }

        const url = new URL(`${this.baseURL}${endpoint}`);
        url.searchParams.append('api_key', this.apiKey);
        
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
                url.searchParams.append(key, params[key]);
            }
        });

        console.log(`🔗 SportsAPI360 Request: ${url.toString().replace(this.apiKey, '***')}`);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'WettAnalyseTool/1.0'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            console.log(`📡 Response Status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ SportsAPI360 Response received`);
            return data;
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('SportsAPI360 Timeout after 15 seconds');
            }
            console.error(`❌ SportsAPI360 API Fehler: ${error.message}`);
            throw error;
        }
    }

    async getMatchesByDate(date, sportId = SPORTSAPI360_CONFIG.sports.football) {
        try {
            console.log(`📅 Fetching SportsAPI360 matches for: ${date}, sport: ${sportId}`);
            
            const data = await this.makeRequest('/matches', {
                sport_id: sportId,
                date: date
            });
            
            console.log(`✅ Received ${data?.matches?.length || 0} matches from SportsAPI360`);
            return data || { matches: [] };
            
        } catch (error) {
            console.error("❌ Failed to get matches from SportsAPI360:", error.message);
            return { matches: [] };
        }
    }
}

// SportsAPI360 Service initialisieren
const sportsAPI360 = new SportsAPI360Service(SPORTSAPI360_KEY);

// Mathematische Funktionen
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

// xG-Schätzung
function estimateXG(teamName, isHome = true, league = "") {
    let base = isHome ? 1.45 : 1.10;
    
    const LEAGUE_FACTORS = {
        "Premier League": 1.05, "Bundesliga": 1.10, "La Liga": 1.00, 
        "Serie A": 0.95, "Ligue 1": 1.02, "Champions League": 1.08,
        "Eredivisie": 1.12, "Campeonato Brasileiro Série A": 0.92,
        "Championship": 0.98, "Primeira Liga": 0.94, "European Championship": 0.90
    };
    
    const leagueFactor = LEAGUE_FACTORS[league] || 1.0;
    const homeAdvantage = isHome ? 0.15 : -0.10;
    
    const strongTeams = ["Man City", "Liverpool", "Arsenal", "Bayern", "Real Madrid", "Barcelona", "PSG", "Inter", "Juventus", "Dortmund"];
    const weakTeams = ["Bochum", "Luton", "Sheffield", "Burnley", "Mainz", "Cadiz", "Salernitana", "Clermont", "Empoli"];
    
    let teamAdjustment = 0;
    if (strongTeams.some(team => teamName.includes(team))) teamAdjustment += 0.3;
    if (weakTeams.some(team => teamName.includes(team))) teamAdjustment -= 0.3;
    
    const raw = (base + homeAdvantage + teamAdjustment) * leagueFactor;
    return +Math.max(0.4, Math.min(3.5, raw)).toFixed(2);
}

// Wahrscheinlichkeits-Berechnungen
function computeMatchOutcomeProbs(homeLambda, awayLambda) {
    let homeProb = 0, drawProb = 0, awayProb = 0;
    
    for (let i = 0; i <= 6; i++) {
        for (let j = 0; j <= 6; j++) {
            const p = poisson(i, homeLambda) * poisson(j, awayLambda);
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

function computeOver25Prob(homeLambda, awayLambda) {
    let pLe2 = 0;
    for (let i = 0; i <= 2; i++) {
        for (let j = 0; j <= (2 - i); j++) {
            pLe2 += poisson(i, homeLambda) * poisson(j, awayLambda);
        }
    }
    return +(1 - pLe2).toFixed(4);
}

function computeBTTS(homeLambda, awayLambda) {
    const pHomeScore = 1 - poisson(0, homeLambda);
    const pAwayScore = 1 - poisson(0, awayLambda);
    return +(pHomeScore * pAwayScore).toFixed(4);
}

function computeTrend(prob, homeXG, awayXG) {
    const { home, draw, away } = prob;
    
    const xgDiff = homeXG - awayXG;
    const homeStrength = home + (xgDiff * 0.1);
    const awayStrength = away - (xgDiff * 0.1);
    
    if (draw > home && draw > away) return "Draw";
    return homeStrength > awayStrength ? "Home" : "Away";
}

function calculateValue(probability, odds) {
    if (!odds || odds <= 1) return 0;
    return +((probability * odds) - 1).toFixed(4);
}

// Flag-Funktion
function getFlag(teamName) {
    const flags = {
        "Manchester": "gb", "Liverpool": "gb", "Chelsea": "gb", "Arsenal": "gb", "Tottenham": "gb",
        "Bayern": "de", "Dortmund": "de", "Leipzig": "de", "Gladbach": "de", "Frankfurt": "de", 
        "Leverkusen": "de", "Mainz": "de", "Köln": "de", "Stuttgart": "de", "Wolfsburg": "de",
        "Real": "es", "Barcelona": "es", "Atletico": "es", "Sevilla": "es", "Valencia": "es",
        "Juventus": "it", "Inter": "it", "Milan": "it", "Napoli": "it", "Roma": "it", "Lazio": "it",
        "PSG": "fr", "Marseille": "fr", "Monaco": "fr", "Lyon": "fr", "Rennes": "fr", "Nice": "fr",
        "Ajax": "nl", "PSV": "nl", "Feyenoord": "nl",
        "Portugal": "pt", "Benfica": "pt", "Porto": "pt", "Sporting": "pt"
    };
    
    for (const [key, value] of Object.entries(flags)) {
        if (teamName.includes(key)) return value;
    }
    return "eu";
}

// SportsAPI360 Daten verarbeiten
async function processSportsAPI360Games(apiData, requestedDate) {
    const games = [];
    
    if (!apiData || !apiData.matches || !Array.isArray(apiData.matches)) {
        console.log('⚠️ No valid matches array from SportsAPI360');
        return games;
    }
    
    console.log(`🔢 Processing ${apiData.matches.length} matches from SportsAPI360`);
    
    for (const match of apiData.matches) {
        try {
            const homeTeam = match.home_team?.name || match.home_team_name || "Home Team";
            const awayTeam = match.away_team?.name || match.away_team_name || "Away Team";
            const league = match.league?.name || match.league_name || "Unknown League";
            
            console.log(`⚽ Processing: ${homeTeam} vs ${awayTeam}`);
            
            const homeXG = estimateXG(homeTeam, true, league);
            const awayXG = estimateXG(awayTeam, false, league);
            const prob = computeMatchOutcomeProbs(homeXG, awayXG);
            const over25 = computeOver25Prob(homeXG, awayXG);
            const btts = computeBTTS(homeXG, awayXG);
            const trend = computeTrend(prob, homeXG, awayXG);
            
            let odds = {
                home: +(1 / prob.home * 0.95).toFixed(2),
                draw: +(1 / prob.draw * 0.95).toFixed(2),
                away: +(1 / prob.away * 0.95).toFixed(2),
                over25: +(1 / over25 * 0.95).toFixed(2)
            };
            
            if (match.odds && typeof match.odds === 'object') {
                if (match.odds.home_win) odds.home = parseFloat(match.odds.home_win);
                if (match.odds.draw) odds.draw = parseFloat(match.odds.draw);
                if (match.odds.away_win) odds.away = parseFloat(match.odds.away_win);
            }
            
            const value = {
                home: calculateValue(prob.home, odds.home),
                draw: calculateValue(prob.draw, odds.draw),
                away: calculateValue(prob.away, odds.away),
                over25: calculateValue(over25, odds.over25),
                under25: calculateValue(1 - over25, 1.9)
            };
            
            games.push({
                id: match.match_id || match.id || `s360-${Date.now()}-${Math.random()}`,
                home: homeTeam,
                away: awayTeam,
                league: league,
                date: match.date || match.match_date || new Date().toISOString(),
                homeLogo: match.home_team?.logo || `https://flagcdn.com/w40/${getFlag(homeTeam)}.png`,
                awayLogo: match.away_team?.logo || `https://flagcdn.com/w40/${getFlag(awayTeam)}.png`,
                homeXG,
                awayXG,
                prob,
                value,
                odds,
                btts,
                trend,
                over25,
                under25: 1 - over25,
                status: match.status || "SCHEDULED",
                source: "sportsapi360"
            });
            
        } catch (matchError) {
            console.warn("❌ Error processing SportsAPI360 match:", matchError.message);
        }
    }
    
    return games;
}

// Demo-Daten (Fallback)
function getDemoGames(date = null) {
    const baseDate = date ? new Date(date) : new Date();
    
    const demoMatches = [
        { home: "Manchester City", away: "Liverpool", league: "Premier League" },
        { home: "Bayern Munich", away: "Borussia Dortmund", league: "Bundesliga" },
        { home: "Real Madrid", away: "Barcelona", league: "La Liga" },
        { home: "PSG", away: "Marseille", league: "Ligue 1" },
        { home: "Inter Milan", away: "Juventus", league: "Serie A" }
    ];
    
    const games = demoMatches.map((match, index) => {
        const homeXG = estimateXG(match.home, true, match.league);
        const awayXG = estimateXG(match.away, false, match.league);
        const prob = computeMatchOutcomeProbs(homeXG, awayXG);
        const over25 = computeOver25Prob(homeXG, awayXG);
        const btts = computeBTTS(homeXG, awayXG);
        const trend = computeTrend(prob, homeXG, awayXG);
        
        const odds = {
            home: +(1 / prob.home * 0.95).toFixed(2),
            draw: +(1 / prob.draw * 0.95).toFixed(2),
            away: +(1 / prob.away * 0.95).toFixed(2),
            over25: +(1 / over25 * 0.95).toFixed(2)
        };
        
        const value = {
            home: calculateValue(prob.home, odds.home),
            draw: calculateValue(prob.draw, odds.draw),
            away: calculateValue(prob.away, odds.away),
            over25: calculateValue(over25, odds.over25),
            under25: calculateValue(1 - over25, 1.9)
        };
        
        const matchDate = new Date(baseDate);
        matchDate.setDate(matchDate.getDate() + index);
        matchDate.setHours(15 + (index % 6), 0, 0, 0);
        
        return {
            id: `demo-${Date.now()}-${index}`,
            home: match.home,
            away: match.away,
            league: match.league,
            date: matchDate.toISOString(),
            homeLogo: `https://flagcdn.com/w40/${getFlag(match.home)}.png`,
            awayLogo: `https://flagcdn.com/w40/${getFlag(match.away)}.png`,
            homeXG,
            awayXG,
            prob,
            value,
            odds,
            btts,
            trend,
            over25,
            under25: 1 - over25,
            status: "SCHEDULED",
            source: "demo"
        };
    });
    
    console.log(`🎯 Generated ${games.length} demo games`);
    return games;
}

// Haupt-API Route
app.get("/api/games", async (req, res) => {
    try {
        console.log("📥 API Request received:", req.query);
        
        let requestedDate = req.query.date || new Date().toISOString().split('T')[0];
        const cacheKey = `games-${requestedDate}`;
        
        // Cache prüfen
        const cached = cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
            console.log("✅ Serving from cache");
            return res.json({ response: cached.data });
        }
        
        let sportsAPI360Games = [];
        let apiErrors = [];
        
        // VERSUCH: SportsAPI 360 Daten
        if (SPORTSAPI360_KEY) {
            try {
                console.log("🔄 Trying SportsAPI360...");
                const sportsData = await sportsAPI360.getMatchesByDate(requestedDate);
                sportsAPI360Games = await processSportsAPI360Games(sportsData, requestedDate);
                console.log(`✅ SportsAPI360: ${sportsAPI360Games.length} games processed`);
            } catch (sportsError) {
                apiErrors.push(`SportsAPI360: ${sportsError.message}`);
                console.warn("❌ SportsAPI360 call failed:", sportsError.message);
            }
        }
        
        let finalGames = [];
        
        // Datenquelle auswählen
        if (sportsAPI360Games.length > 0) {
            console.log(`✅ Using ${sportsAPI360Games.length} games from SportsAPI360`);
            finalGames = sportsAPI360Games;
        } else {
            console.log("📋 Using demo games (no API data available)");
            finalGames = getDemoGames(requestedDate);
        }
        
        // Sicherstellen dass finalGames ein Array ist
        if (!Array.isArray(finalGames)) {
            console.warn('⚠️ finalGames is not an array, using demo games');
            finalGames = getDemoGames(requestedDate);
        }
        
        // Nach Value sortieren
        const sortedGames = finalGames.sort((a, b) => {
            const maxValueA = Math.max(a.value.home, a.value.draw, a.value.away, a.value.over25);
            const maxValueB = Math.max(b.value.home, b.value.draw, b.value.away, b.value.over25);
            return maxValueB - maxValueA;
        });
        
        console.log(`🎯 Final: ${sortedGames.length} games for date ${requestedDate}`);
        
        // Im Cache speichern
        cache.set(cacheKey, {
            timestamp: Date.now(),
            data: sortedGames
        });
        
        res.json({ 
            response: sortedGames,
            info: {
                date: requestedDate,
                total: sortedGames.length,
                source: sportsAPI360Games.length > 0 ? "sportsapi360" : "demo_data",
                sportsapi360_games: sportsAPI360Games.length,
                errors: apiErrors.length > 0 ? apiErrors : null
            }
        });
        
    } catch (error) {
        console.error("❌ Error in /api/games:", error);
        
        // SICHERER Fallback
        try {
            const fallbackGames = getDemoGames(req.query.date);
            res.json({ 
                response: fallbackGames,
                info: {
                    date: req.query.date || new Date().toISOString().split('T')[0],
                    total: fallbackGames.length,
                    source: "fallback",
                    error: error.message
                }
            });
        } catch (fallbackError) {
            console.error("❌ Even fallback failed:", fallbackError);
            res.status(500).json({ 
                error: "Internal Server Error",
                message: "Please try again later"
            });
        }
    }
});

// Debug Route für SportsAPI360
app.get("/api/debug-sportsapi360", async (req, res) => {
    try {
        if (!SPORTSAPI360_KEY) {
            return res.json({ error: "API Key nicht konfiguriert" });
        }

        const testDate = new Date().toISOString().split('T')[0];
        
        const results = [];

        try {
            const url = `${SPORTSAPI360_CONFIG.baseURL}/matches?api_key=${SPORTSAPI360_KEY}&sport_id=1&date=${testDate}`;
            console.log(`🔗 Testing: ${url.replace(SPORTSAPI360_KEY, '***')}`);
            
            const response = await fetch(url, { timeout: 10000 });
            const text = await response.text();
            
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                data = { raw: text.substring(0, 200) };
            }

            results.push({
                endpoint: 'matches',
                status: response.status,
                statusText: response.statusText,
                data: data
            });
            
        } catch (error) {
            results.push({
                endpoint: 'matches',
                error: error.message
            });
        }

        res.json({
            api_key: SPORTSAPI360_KEY ? `Configured (${SPORTSAPI360_KEY.substring(0, 10)}...)` : 'Missing',
            test_date: testDate,
            results: results
        });
        
    } catch (error) {
        console.error("❌ Debug Error:", error);
        res.json({
            error: error.message
        });
    }
});

// API Status Route
app.get("/api/status", (req, res) => {
    res.json({
        apis: {
            sportsapi360: {
                configured: !!SPORTSAPI360_KEY,
                status: SPORTSAPI360_KEY ? "active" : "missing_key"
            },
            football_data: {
                configured: !!FOOTBALL_DATA_KEY,
                status: FOOTBALL_DATA_KEY ? "active" : "missing_key"
            }
        },
        cache: {
            size: cache.size
        }
    });
});

// Error Handling
app.use((error, req, res, next) => {
    console.error("Unhandled Error:", error);
    res.status(500).json({ 
        error: "Internal Server Error",
        message: "Please try again later"
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// Server Start
