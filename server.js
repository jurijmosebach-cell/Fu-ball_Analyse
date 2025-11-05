// server.js — Korrigierte Version mit aktuellen Daten
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
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_API_KEY;

if (!FOOTBALL_DATA_KEY) {
    console.warn("⚠️ WARNING: FOOTBALL_DATA_API_KEY nicht gesetzt!");
}

// Konfiguration
const CACHE_DURATION = 10 * 60 * 1000;
const cache = new Map();

// Health Check Route
app.get("/health", (req, res) => {
    res.status(200).json({ 
        status: "OK", 
        timestamp: new Date().toISOString()
    });
});

// Root Route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

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
    const base = isHome ? 1.45 : 1.10;
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
        "Ajax": "nl", "PSV": "nl", "Feyenoord": "nl"
    };
    
    for (const [key, value] of Object.entries(flags)) {
        if (teamName.includes(key)) return value;
    }
    return "eu";
}

// Demo-Daten für Fallback
function getDemoGames(date = null) {
    const baseDate = date ? new Date(date) : new Date();
    
    const demoMatches = [
        { 
            home: "Manchester City", 
            away: "Liverpool", 
            league: "Premier League"
        },
        { 
            home: "Bayern Munich", 
            away: "Borussia Dortmund", 
            league: "Bundesliga"
        },
        { 
            home: "Real Madrid", 
            away: "Barcelona", 
            league: "La Liga"
        },
        { 
            home: "PSG", 
            away: "Marseille", 
            league: "Ligue 1"
        },
        { 
            home: "Inter Milan", 
            away: "Juventus", 
            league: "Serie A"
        },
        { 
            home: "Arsenal", 
            away: "Chelsea", 
            league: "Premier League"
        },
        { 
            home: "AC Milan", 
            away: "Napoli", 
            league: "Serie A"
        },
        { 
            home: "Atletico Madrid", 
            away: "Sevilla", 
            league: "La Liga"
        }
    ];
    
    return demoMatches.map((match, index) => {
        const homeXG = estimateXG(match.home, true, match.league);
        const awayXG = estimateXG(match.away, false, match.league);
        const prob = computeMatchOutcomeProbs(homeXG, awayXG);
        const over25 = computeOver25Prob(homeXG, awayXG);
        const btts = computeBTTS(homeXG, awayXG);
        const trend = computeTrend(prob, homeXG, awayXG);
        
        // Realistische Odds
        const odds = {
            home: +(1 / prob.home * (0.92 + Math.random() * 0.1)).toFixed(2),
            draw: +(1 / prob.draw * (0.92 + Math.random() * 0.1)).toFixed(2),
            away: +(1 / prob.away * (0.92 + Math.random() * 0.1)).toFixed(2),
            over25: +(1 / over25 * (0.92 + Math.random() * 0.1)).toFixed(2)
        };
        
        const value = {
            home: calculateValue(prob.home, odds.home),
            draw: calculateValue(prob.draw, odds.draw),
            away: calculateValue(prob.away, odds.away),
            over25: calculateValue(over25, odds.over25),
            under25: calculateValue(1 - over25, 1.9)
        };
        
        // Match-Datum
        const matchDate = new Date(baseDate);
        matchDate.setDate(matchDate.getDate() + index);
        matchDate.setHours(15 + index, 0, 0, 0); // Verschiedene Uhrzeiten
        
        return {
            id: index + 1,
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
            under25: 1 - over25
        };
    });
}

// Haupt-API Route mit Fallback
app.get("/api/games", async (req, res) => {
    try {
        console.log("📥 API Request received:", req.query);
        
        let date = req.query.date;
        
        // Wenn kein Datum, nimm heute
        if (!date) {
            date = new Date().toISOString().split('T')[0];
        }
        
        // Prüfe ob Datum in der Zukunft liegt (mehr als 7 Tage)
        const requestDate = new Date(date);
        const today = new Date();
        const diffTime = requestDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 7) {
            console.log(`📅 Date ${date} is too far in future, using demo data`);
            const demoGames = getDemoGames(date);
            return res.json({ 
                response: demoGames,
                info: {
                    date: date,
                    total: demoGames.length,
                    source: "demo_data_future"
                }
            });
        }
        
        const cacheKey = `games-${date}`;
        
        // Cache prüfen
        const cached = cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
            console.log("✅ Serving from cache");
            return res.json({ response: cached.data });
        }
        
        if (!FOOTBALL_DATA_KEY) {
            console.log("🔑 No API key, using demo data");
            const demoGames = getDemoGames(date);
            return res.json({ 
                response: demoGames,
                info: {
                    date: date,
                    total: demoGames.length,
                    source: "demo_data_no_key"
                }
            });
        }
        
        console.log("🔄 Fetching from Football-Data.org API...");
        
        // Spiele von der API abrufen
        const apiUrl = `https://api.football-data.org/v4/matches?dateFrom=${date}&dateTo=${date}`;
        const response = await fetch(apiUrl, {
            headers: { "X-Auth-Token": FOOTBALL_DATA_KEY }
        });
        
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`✅ Received ${data.matches?.length || 0} matches from API`);
        
        let games = [];
        
        if (!data.matches || data.matches.length === 0) {
            console.log("📭 No matches found from API, using demo data");
            games = getDemoGames(date);
        } else {
            // Echte Spiele verarbeiten
            for (const match of data.matches.slice(0, 20)) { // Limit auf 20 Spiele
                try {
                    if (match.status === "FINISHED" || match.status === "SCHEDULED" || match.status === "LIVE") {
                        const homeTeam = match.homeTeam?.name || "Unknown";
                        const awayTeam = match.awayTeam?.name || "Unknown";
                        const league = match.competition?.name || "Unknown";
                        
                        // xG schätzen
                        const homeXG = estimateXG(homeTeam, true, league);
                        const awayXG = estimateXG(awayTeam, false, league);
                        
                        // Wahrscheinlichkeiten berechnen
                        const prob = computeMatchOutcomeProbs(homeXG, awayXG);
                        const over25 = computeOver25Prob(homeXG, awayXG);
                        const btts = computeBTTS(homeXG, awayXG);
                        const trend = computeTrend(prob, homeXG, awayXG);
                        
                        // Odds simulieren
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
                            under25: calculateValue(1 - over25, 1.9)
                        };
                        
                        const gameData = {
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
                            over25,
                            under25: 1 - over25,
                            status: match.status
                        };
                        
                        games.push(gameData);
                    }
                } catch (matchError) {
                    console.warn(`Error processing match ${match.id}:`, matchError.message);
                }
            }
        }
        
        console.log(`✅ Total games to display: ${games.length}`);
        
        // Nach bestem Value sortieren
        const sortedGames = games.sort((a, b) => {
            const maxValueA = Math.max(a.value.home, a.value.draw, a.value.away, a.value.over25);
            const maxValueB = Math.max(b.value.home, b.value.draw, b.value.away, b.value.over25);
            return maxValueB - maxValueA;
        });
        
        // Im Cache speichern
        cache.set(cacheKey, {
            timestamp: Date.now(),
            data: sortedGames
        });
        
        res.json({ 
            response: sortedGames,
            info: {
                date: date,
                total: sortedGames.length,
                source: games.length > 0 && games[0].id > 1000 ? "football-data.org" : "demo_data"
            }
        });
        
    } catch (error) {
        console.error("❌ Error in /api/games:", error);
        
        // Fallback zu Demo-Daten
        const demoGames = getDemoGames(req.query.date);
        res.json({ 
            response: demoGames,
            error: "API failed, using demo data",
            info: {
                date: req.query.date || new Date().toISOString().split('T')[0],
                total: demoGames.length,
                source: "demo_data_fallback"
            }
        });
    }
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
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔑 API Key: ${FOOTBALL_DATA_KEY ? 'Configured' : 'MISSING - Using demo data'}`);
    console.log(`📊 Ready to serve football data!`);
});
