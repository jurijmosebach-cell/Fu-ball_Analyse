// server.js — Erweiterte Version mit SportsAPI 360 Integration
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
if (!FOOTBALL_DATA_KEY) console.warn("⚠️ WARNING: FOOTBALL_DATA_API_KEY nicht gesetzt!");
if (!SPORTSAPI360_KEY) console.warn("⚠️ WARNING: SPORTSAPI360_API_KEY nicht gesetzt!");

// Konfiguration
const CACHE_DURATION = 10 * 60 * 1000;
const cache = new Map();

// SportsAPI 360 Konfiguration
const SPORTSAPI360_CONFIG = {
    baseURL: "https://api.sportsapi360.com/v1",
    endpoints: {
        matches: "/matches",
        odds: "/odds",
        statistics: "/statistics",
        leagues: "/leagues"
    },
    sports: {
        football: 1,
        basketball: 2,
        tennis: 3
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

// SportsAPI 360 Service Funktionen
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
        
        // Parameter hinzufügen
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });

        try {
            const response = await fetch(url.toString(), {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'WettAnalyseTool/1.0'
                },
                timeout: 15000
            });

            if (!response.ok) {
                throw new Error(`SportsAPI360 Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`SportsAPI360 API Fehler (${endpoint}):`, error.message);
            throw error;
        }
    }

    // Spiele für ein bestimmtes Datum abrufen
    async getMatchesByDate(date, sportId = SPORTSAPI360_CONFIG.sports.football) {
        try {
            const data = await this.makeRequest(SPORTSAPI360_CONFIG.endpoints.matches, {
                sport_id: sportId,
                date: date,
                include: 'odds,statistics'
            });
            return data;
        } catch (error) {
            console.error("Fehler beim Abrufen der Spiele:", error);
            return null;
        }
    }

    // Odds für bestimmte Spiele abrufen
    async getOdds(matchId) {
        try {
            const data = await this.makeRequest(SPORTSAPI360_CONFIG.endpoints.odds, {
                match_id: matchId
            });
            return data;
        } catch (error) {
            console.error(`Fehler beim Abrufen der Odds für Match ${matchId}:`, error);
            return null;
        }
    }

    // Statistiken für Spiele abrufen
    async getStatistics(matchId) {
        try {
            const data = await this.makeRequest(SPORTSAPI360_CONFIG.endpoints.statistics, {
                match_id: matchId
            });
            return data;
        } catch (error) {
            console.error(`Fehler beim Abrufen der Statistiken für Match ${matchId}:`, error);
            return null;
        }
    }
}

// SportsAPI360 Service initialisieren
const sportsAPI360 = new SportsAPI360Service(SPORTSAPI360_KEY);

// Mathematische Funktionen (unverändert)
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

// xG-Schätzung (erweitert mit SportsAPI360 Daten)
function estimateXG(teamName, isHome = true, league = "", statistics = null) {
    let base = isHome ? 1.45 : 1.10;
    
    // Wenn Statistics von SportsAPI360 verfügbar, verwende diese für genauere xG-Berechnung
    if (statistics) {
        const avgXG = calculateXGFromStatistics(statistics);
        if (avgXG > 0) {
            base = avgXG;
        }
    }
    
    const LEAGUE_FACTORS = {
        "Premier League": 1.05, "Bundesliga": 1.10, "La Liga": 1.00, 
        "Serie A": 0.95, "Ligue 1": 1.02, "Champions League": 1.08,
        "Eredivisie": 1.12, "Campeonato Brasileiro Série A": 0.92,
        "Championship": 0.98, "Primeira Liga": 0.94, "European Championship": 0.90
    };
    
    const leagueFactor = LEAGUE_FACTORS[league] || 1.0;
    const homeAdvantage = isHome ? 0.15 : -0.10;
    
    // Team-basierte Anpassung
    const strongTeams = ["Man City", "Liverpool", "Arsenal", "Bayern", "Real Madrid", "Barcelona", "PSG", "Inter", "Juventus", "Dortmund"];
    const weakTeams = ["Bochum", "Luton", "Sheffield", "Burnley", "Mainz", "Cadiz", "Salernitana", "Clermont", "Empoli"];
    
    let teamAdjustment = 0;
    if (strongTeams.some(team => teamName.includes(team))) teamAdjustment += 0.3;
    if (weakTeams.some(team => teamName.includes(team))) teamAdjustment -= 0.3;
    
    const raw = (base + homeAdvantage + teamAdjustment) * leagueFactor;
    return +Math.max(0.4, Math.min(3.5, raw)).toFixed(2);
}

// xG aus SportsAPI360 Statistiken berechnen
function calculateXGFromStatistics(statistics) {
    if (!statistics) return 0;
    
    try {
        // Beispiel: Verwende Torschüsse, Torschussgenauigkeit, Ballbesitz
        const shots = statistics.shots_total || 0;
        const shotsOnTarget = statistics.shots_on_target || 0;
        const possession = statistics.possession || 50;
        
        // Einfache xG-Formel basierend auf Statistiken
        const accuracy = shots > 0 ? shotsOnTarget / shots : 0.35;
        const xg = (shots * accuracy * (possession / 100) * 0.15);
        
        return Math.min(3.0, xg);
    } catch (error) {
        console.error("Fehler bei xG-Berechnung aus Statistiken:", error);
        return 0;
    }
}

// Wahrscheinlichkeits-Berechnungen (unverändert)
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

// Flag-Funktion (unverändert)
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

// SportsAPI360 Daten zu Spielen verarbeiten
async function processSportsAPI360Games(apiData, requestedDate) {
    const games = [];
    
    if (!apiData || !apiData.matches) {
        return games;
    }
    
    for (const match of apiData.matches) {
        try {
            // Basis Match-Informationen
            const homeTeam = match.home_team?.name || "Unknown";
            const awayTeam = match.away_team?.name || "Unknown";
            const league = match.league?.name || "Unknown";
            
            // Statistiken von SportsAPI360 verwenden falls verfügbar
            const homeStats = match.home_statistics;
            const awayStats = match.away_statistics;
            
            // xG mit SportsAPI360 Statistiken berechnen
            const homeXG = estimateXG(homeTeam, true, league, homeStats);
            const awayXG = estimateXG(awayTeam, false, league, awayStats);
            
            const prob = computeMatchOutcomeProbs(homeXG, awayXG);
            const over25 = computeOver25Prob(homeXG, awayXG);
            const btts = computeBTTS(homeXG, awayXG);
            const trend = computeTrend(prob, homeXG, awayXG);
            
            // Odds von SportsAPI360 verwenden falls verfügbar
            let odds = {
                home: +(1 / prob.home * (0.92 + Math.random() * 0.1)).toFixed(2),
                draw: +(1 / prob.draw * (0.92 + Math.random() * 0.1)).toFixed(2),
                away: +(1 / prob.away * (0.92 + Math.random() * 0.1)).toFixed(2),
                over25: +(1 / over25 * (0.92 + Math.random() * 0.1)).toFixed(2)
            };
            
            // Falls Odds von SportsAPI360 verfügbar, diese verwenden
            if (match.odds && match.odds.main) {
                const apiOdds = match.odds.main;
                if (apiOdds.home_win) odds.home = parseFloat(apiOdds.home_win);
                if (apiOdds.draw) odds.draw = parseFloat(apiOdds.draw);
                if (apiOdds.away_win) odds.away = parseFloat(apiOdds.away_win);
            }
            
            const value = {
                home: calculateValue(prob.home, odds.home),
                draw: calculateValue(prob.draw, odds.draw),
                away: calculateValue(prob.away, odds.away),
                over25: calculateValue(over25, odds.over25),
                under25: calculateValue(1 - over25, 1.9)
            };
            
            games.push({
                id: match.id || Date.now() + Math.random(),
                home: homeTeam,
                away: awayTeam,
                league: league,
                date: match.date || new Date().toISOString(),
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
                source: "sportsapi360",
                // Zusätzliche Daten von SportsAPI360
                statistics: {
                    home: homeStats,
                    away: awayStats
                }
            });
            
        } catch (matchError) {
            console.warn("Error processing SportsAPI360 match:", matchError.message);
        }
    }
    
    return games;
}

// Demo-Daten (unverändert)
function getDemoGames(date = null) {
    // ... (deine bestehende getDemoGames Funktion)
    // Kürze hier aus Platzgründen - deine ursprüngliche Funktion bleibt gleich
}

// Haupt-API Route - ERWEITERT mit SportsAPI360
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
        
        let apiGames = [];
        let sportsAPI360Games = [];
        let apiErrors = [];
        
        // VERSUCH 1: SportsAPI 360 Daten
        if (SPORTSAPI360_KEY) {
            try {
                console.log("🔄 Trying SportsAPI360...");
                const sportsData = await sportsAPI360.getMatchesByDate(requestedDate);
                if (sportsData) {
                    sportsAPI360Games = await processSportsAPI360Games(sportsData, requestedDate);
                    console.log(`✅ SportsAPI360: ${sportsAPI360Games.length} games`);
                }
            } catch (sportsError) {
                apiErrors.push(`SportsAPI360: ${sportsError.message}`);
                console.warn("❌ SportsAPI360 call failed:", sportsError.message);
            }
        }
        
        // VERSUCH 2: Football-Data.org API (deine ursprüngliche Integration)
        if (FOOTBALL_DATA_KEY) {
            try {
                console.log("🔄 Trying Football-Data.org API...");
                // ... (deine bestehende Football-Data.org Integration)
            } catch (apiErr) {
                apiErrors.push(`Football-Data: ${apiErr.message}`);
            }
        }
        
        let finalGames = [];
        
        // Priorität: SportsAPI360 > Football-Data > Demo
        if (sportsAPI360Games.length > 0) {
            console.log(`✅ Using ${sportsAPI360Games.length} games from SportsAPI360`);
            finalGames = sportsAPI360Games;
        } else if (apiGames.length > 0) {
            console.log(`✅ Using ${apiGames.length} games from Football-Data`);
            finalGames = apiGames;
        } else {
            console.log("📋 Using demo games (no API data available)");
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
                sources: {
                    sportsapi360: sportsAPI360Games.length,
                    football_data: apiGames.length,
                    demo: finalGames === getDemoGames(requestedDate) ? finalGames.length : 0
                },
                primary_source: sportsAPI360Games.length > 0 ? "sportsapi360" : 
                              apiGames.length > 0 ? "football-data.org" : "demo_data",
                errors: apiErrors.length > 0 ? apiErrors : null
            }
        });
        
    } catch (error) {
        console.error("❌ Error in /api/games:", error);
        
        // Fallback
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
    }
});

// Neue Route: SportsAPI360 Test
app.get("/api/test-sportsapi360", async (req, res) => {
    try {
        if (!SPORTSAPI360_KEY) {
            return res.json({ 
                error: "SportsAPI360 API Key nicht konfiguriert",
                hint: "Setze SPORTSAPI360_API_KEY Environment Variable"
            });
        }
        
        const today = new Date().toISOString().split('T')[0];
        const testData = await sportsAPI360.getMatchesByDate(today);
        
        res.json({
            status: "success",
            date: today,
            api_configured: true,
            total_matches: testData?.matches?.length || 0,
            sample_matches: testData?.matches?.slice(0, 3).map(m => ({
                home: m.home_team?.name,
                away: m.away_team?.name,
                league: m.league?.name,
                date: m.date,
                status: m.status,
                has_odds: !!m.odds,
                has_stats: !!(m.home_statistics || m.away_statistics)
            })) || []
        });
        
    } catch (error) {
        res.json({ 
            error: error.message,
            api_configured: !!SPORTSAPI360_KEY
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
            size: cache.size,
            keys: Array.from(cache.keys())
        }
    });
});

// Bestehende Routes beibehalten
app.get("/api/test", async (req, res) => {
    // ... (deine bestehende Test-Route)
});

// Error Handling (unverändert)
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
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔑 Football-Data API: ${FOOTBALL_DATA_KEY ? 'Configured ✅' : 'MISSING ❌'}`);
    console.log(`🔑 SportsAPI360 API: ${SPORTSAPI360_KEY ? 'Configured ✅' : 'MISSING ❌'}`);
    console.log(`📊 Multi-API mode: SportsAPI360 + Football-Data + Demo Fallback`);
    console.log(`🔗 Test: https://your-app.onrender.com/api/test-sportsapi360`);
});
