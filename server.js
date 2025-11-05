// server.js — Korrigierte Version die richtige Spiele lädt
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
} else {
    console.log("✅ API Key ist gesetzt");
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

// REALISTISCHE xG-Schätzung
function estimateXG(teamName, isHome = true, league = "") {
    const TEAM_STRENGTHS = {
        // Premier League
        "Man City": 2.1, "Liverpool": 2.0, "Arsenal": 1.9, "Tottenham": 1.5,
        "Chelsea": 1.5, "Newcastle": 1.4, "Man United": 1.6, "Aston Villa": 1.4,
        "Brighton": 1.3, "West Ham": 1.3, "Crystal Palace": 1.1, "Wolves": 1.0,
        "Fulham": 1.0, "Everton": 0.9, "Brentford": 1.0, "Nottingham": 0.9,
        "Luton": 0.8, "Burnley": 0.8, "Sheffield": 0.7, "Bournemouth": 1.0,
        
        // Bundesliga
        "Bayern": 2.1, "Dortmund": 1.7, "Leipzig": 1.6, "Leverkusen": 1.8,
        "Frankfurt": 1.3, "Wolfsburg": 1.1, "Gladbach": 1.2, "Hoffenheim": 1.1,
        "Freiburg": 1.1, "Stuttgart": 1.4, "Augsburg": 0.9, "Mainz": 0.9,
        "Bochum": 0.8, "Köln": 0.8, "Darmstadt": 0.7, "Heidenheim": 0.8,
        "Union Berlin": 1.0, "Werder Bremen": 1.0,
        
        // La Liga
        "Real Madrid": 2.1, "Barcelona": 1.9, "Atletico": 1.6, "Sevilla": 1.3,
        "Valencia": 1.2, "Athletic": 1.2, "Real Sociedad": 1.3, "Villarreal": 1.2,
        "Betis": 1.1, "Getafe": 0.9, "Osasuna": 0.9, "Celta": 1.0,
        "Mallorca": 0.8, "Girona": 1.4, "Alaves": 0.8, "Granada": 0.7,
        "Rayo": 0.9, "Cadiz": 0.7, "Almeria": 0.7, "Las Palmas": 0.8,
        
        // Serie A
        "Inter": 1.8, "Juventus": 1.7, "Milan": 1.5, "Napoli": 1.6,
        "Roma": 1.4, "Lazio": 1.3, "Atalanta": 1.4, "Fiorentina": 1.2,
        "Bologna": 1.1, "Torino": 1.0, "Monza": 0.9, "Genoa": 0.8,
        "Sassuolo": 1.0, "Verona": 0.8, "Lecce": 0.8, "Frosinone": 0.7,
        "Empoli": 0.7, "Salernitana": 0.7, "Cagliari": 0.8, "Udinese": 0.9,
        
        // Ligue 1
        "PSG": 1.9, "Marseille": 1.3, "Monaco": 1.4, "Lyon": 1.3,
        "Lille": 1.3, "Rennes": 1.2, "Nice": 1.1, "Lens": 1.2,
        "Reims": 1.0, "Montpellier": 0.9, "Toulouse": 0.9, "Strasbourg": 0.9,
        "Nantes": 0.9, "Le Havre": 0.8, "Metz": 0.7, "Clermont": 0.7,
        "Lorient": 0.8, "Brest": 1.0
    };
    
    let baseXG = 1.2; // Default
    for (const [team, strength] of Object.entries(TEAM_STRENGTHS)) {
        if (teamName.includes(team)) {
            baseXG = strength;
            break;
        }
    }
    
    const LEAGUE_FACTORS = {
        "Premier League": 1.05, "Bundesliga": 1.08, "La Liga": 1.00, 
        "Serie A": 0.98, "Ligue 1": 0.95, "Champions League": 1.10
    };
    
    const leagueFactor = LEAGUE_FACTORS[league] || 1.0;
    const homeAdvantage = isHome ? 0.25 : -0.15;
    
    const finalXG = (baseXG + homeAdvantage) * leagueFactor;
    return +Math.max(0.4, Math.min(3.0, finalXG)).toFixed(2);
}

// REALISTISCHE Wahrscheinlichkeiten
function computeMatchOutcomeProbs(homeLambda, awayLambda) {
    let homeProb = 0, drawProb = 0, awayProb = 0;
    
    for (let i = 0; i <= 8; i++) {
        for (let j = 0; j <= 8; j++) {
            const p = poisson(i, homeLambda) * poisson(j, awayLambda);
            if (i > j) homeProb += p;
            else if (i === j) drawProb += p;
            else awayProb += p;
        }
    }
    
    // Realistische Korrekturen
    const totalGoals = homeLambda + awayLambda;
    
    if (totalGoals < 2.0) {
        drawProb *= 1.3;
        homeProb *= 0.9;
        awayProb *= 0.9;
    } else if (totalGoals > 3.5) {
        drawProb *= 0.7;
    }
    
    // Home Advantage
    homeProb *= 1.08;
    awayProb *= 0.92;
    
    const total = homeProb + drawProb + awayProb;
    const normalized = {
        home: +(homeProb / total).toFixed(4),
        draw: +(drawProb / total).toFixed(4),
        away: +(awayProb / total).toFixed(4)
    };
    
    // Realistische Limits
    if (normalized.home > 0.80) normalized.home = 0.80;
    if (normalized.away > 0.80) normalized.away = 0.80;
    if (normalized.draw > 0.35) normalized.draw = 0.35;
    if (normalized.home < 0.10) normalized.home = 0.10;
    if (normalized.away < 0.10) normalized.away = 0.10;
    
    return normalized;
}

function computeOver25Prob(homeLambda, awayLambda) {
    let pLe2 = 0;
    for (let i = 0; i <= 2; i++) {
        for (let j = 0; j <= (2 - i); j++) {
            pLe2 += poisson(i, homeLambda) * poisson(j, awayLambda);
        }
    }
    
    let over25Prob = 1 - pLe2;
    const totalGoals = homeLambda + awayLambda;
    
    if (totalGoals < 1.8) over25Prob *= 0.7;
    if (totalGoals > 3.2) over25Prob *= 1.2;
    
    return +Math.max(0.05, Math.min(0.95, over25Prob)).toFixed(4);
}

function computeBTTS(homeLambda, awayLambda) {
    const pHomeScore = 1 - poisson(0, homeLambda);
    const pAwayScore = 1 - poisson(0, awayLambda);
    let bttsProb = pHomeScore * pAwayScore;
    
    const totalGoals = homeLambda + awayLambda;
    if (totalGoals > 3.0) bttsProb *= 1.15;
    if (totalGoals < 1.5) bttsProb *= 0.8;
    
    return +Math.max(0.1, Math.min(0.9, bttsProb)).toFixed(4);
}

function computeTrend(prob, homeXG, awayXG, homeTeam, awayTeam) {
    const { home, draw, away } = prob;
    
    const xgDominance = (homeXG - awayXG) * 0.2;
    
    const homeStrength = home + xgDominance;
    const awayStrength = away - xgDominance;
    
    if (draw > 0.30 && Math.abs(homeStrength - awayStrength) < 0.15) {
        return "Draw";
    }
    
    return homeStrength > awayStrength ? "Home" : "Away";
}

function calculateValue(probability, odds) {
    if (!odds || odds <= 1) return 0;
    const value = (probability * odds) - 1;
    return +Math.max(-0.3, Math.min(0.3, value)).toFixed(4);
}

// Flag-Funktion
function getFlag(teamName) {
    const flags = {
        "Manchester": "gb", "Liverpool": "gb", "Chelsea": "gb", "Arsenal": "gb", "Tottenham": "gb",
        "Bayern": "de", "Dortmund": "de", "Leipzig": "de", "Leverkusen": "de", "Frankfurt": "de",
        "Real": "es", "Barcelona": "es", "Atletico": "es", "Sevilla": "es", "Valencia": "es",
        "Inter": "it", "Juventus": "it", "Milan": "it", "Napoli": "it", "Roma": "it",
        "PSG": "fr", "Marseille": "fr", "Monaco": "fr", "Lyon": "fr"
    };
    
    for (const [key, value] of Object.entries(flags)) {
        if (teamName.includes(key)) return value;
    }
    return "eu";
}

// KORRIGIERTE API-ABFRAGE
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
        
        let games = [];
        
        if (FOOTBALL_DATA_KEY) {
            try {
                console.log("🔄 Fetching from Football-Data.org API...");
                
                // WICHTIG: Für kostenlose API müssen wir competitions verwenden
                // Die kostenlose API gibt nur bestimmte Ligen zurück
                const competitions = [
                    "PL", "BL1", "PD", "SA", "FL1",  // Top 5 Ligen
                    "CL", "EL", "EC"                 // Wettbewerbe
                ];
                
                let allMatches = [];
                
                // Hole Spiele für jede Liga separat
                for (const comp of competitions) {
                    try {
                        const apiUrl = `https://api.football-data.org/v4/competitions/${comp}/matches?dateFrom=${requestedDate}&dateTo=${requestedDate}`;
                        
                        console.log(`🔗 Fetching ${comp}...`);
                        
                        const response = await fetch(apiUrl, {
                            headers: { 
                                "X-Auth-Token": FOOTBALL_DATA_KEY,
                                "Content-Type": "application/json"
                            },
                            timeout: 8000
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            if (data.matches && data.matches.length > 0) {
                                console.log(`✅ Found ${data.matches.length} matches in ${comp}`);
                                allMatches = allMatches.concat(data.matches);
                            }
                        } else if (response.status === 403) {
                            console.log(`⚠️ No access to ${comp} (403)`);
                        }
                        
                        // Kurze Pause zwischen Requests
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                    } catch (compError) {
                        console.warn(`Error fetching ${comp}:`, compError.message);
                    }
                }
                
                console.log(`📊 Total matches found: ${allMatches.length}`);
                
                // Verarbeite die gefundenen Spiele
                for (const match of allMatches) {
                    try {
                        if (match.status === "SCHEDULED" || match.status === "TIMED" || match.status === "LIVE") {
                            const homeTeam = match.homeTeam?.name || "Unknown";
                            const awayTeam = match.awayTeam?.name || "Unknown";
                            const league = match.competition?.name || "Unknown";
                            
                            // Prüfe ob das Spiel am richtigen Datum ist
                            const matchDate = new Date(match.utcDate).toISOString().split('T')[0];
                            if (matchDate !== requestedDate) {
                                continue;
                            }
                            
                            const homeXG = estimateXG(homeTeam, true, league);
                            const awayXG = estimateXG(awayTeam, false, league);
                            const prob = computeMatchOutcomeProbs(homeXG, awayXG);
                            const over25 = computeOver25Prob(homeXG, awayXG);
                            const btts = computeBTTS(homeXG, awayXG);
                            const trend = computeTrend(prob, homeXG, awayXG, homeTeam, awayTeam);
                            
                            const margin = 0.08;
                            const odds = {
                                home: +(1 / (prob.home + margin/3)).toFixed(2),
                                draw: +(1 / (prob.draw + margin/3)).toFixed(2),
                                away: +(1 / (prob.away + margin/3)).toFixed(2),
                                over25: +(1 / (over25 + margin)).toFixed(2)
                            };
                            
                            const value = {
                                home: calculateValue(prob.home, odds.home),
                                draw: calculateValue(prob.draw, odds.draw),
                                away: calculateValue(prob.away, odds.away),
                                over25: calculateValue(over25, odds.over25),
                                under25: calculateValue(1 - over25, 1.9)
                            };
                            
                            games.push({
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
                                status: match.status,
                                source: "API"
                            });
                        }
                    } catch (matchError) {
                        console.warn("Error processing match:", matchError.message);
                    }
                }
                
            } catch (apiError) {
                console.warn("❌ API call failed:", apiError.message);
            }
        }
        
        // FALLBACK: Realistische Demo-Daten wenn API keine Spiele liefert
        if (games.length === 0) {
            console.log("📋 Using realistic demo data");
            const today = new Date(requestedDate);
            const demoMatches = [
                { home: "Manchester City", away: "Liverpool", league: "Premier League" },
                { home: "Bayern Munich", away: "Borussia Dortmund", league: "Bundesliga" },
                { home: "Real Madrid", away: "Barcelona", league: "La Liga" },
                { home: "PSG", away: "Marseille", league: "Ligue 1" },
                { home: "Inter Milan", away: "Juventus", league: "Serie A" }
            ];
            
            games = demoMatches.map((match, index) => {
                const homeXG = estimateXG(match.home, true, match.league);
                const awayXG = estimateXG(match.away, false, match.league);
                const prob = computeMatchOutcomeProbs(homeXG, awayXG);
                const over25 = computeOver25Prob(homeXG, awayXG);
                const btts = computeBTTS(homeXG, awayXG);
                const trend = computeTrend(prob, homeXG, awayXG, match.home, match.away);
                
                const margin = 0.08;
                const odds = {
                    home: +(1 / (prob.home + margin/3)).toFixed(2),
                    draw: +(1 / (prob.draw + margin/3)).toFixed(2),
                    away: +(1 / (prob.away + margin/3)).toFixed(2),
                    over25: +(1 / (over25 + margin)).toFixed(2)
                };
                
                const value = {
                    home: calculateValue(prob.home, odds.home),
                    draw: calculateValue(prob.draw, odds.draw),
                    away: calculateValue(prob.away, odds.away),
                    over25: calculateValue(over25, odds.over25),
                    under25: calculateValue(1 - over25, 1.9)
                };
                
                const matchDate = new Date(today);
                matchDate.setHours(15 + index, 0, 0, 0);
                
                return {
                    id: Date.now() + index,
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
        }
        
        console.log(`✅ Loaded ${games.length} games for ${requestedDate}`);
        
        // Nach Value sortieren
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
                date: requestedDate,
                total: sortedGames.length,
                source: games[0]?.source || "unknown"
            }
        });
        
    } catch (error) {
        console.error("❌ Error in /api/games:", error);
        res.json({ 
            response: [],
            error: error.message
        });
    }
});

// API Test Route
app.get("/api/debug", async (req, res) => {
    try {
        if (!FOOTBALL_DATA_KEY) {
            return res.json({ error: "No API key" });
        }
        
        const testDate = req.query.date || new Date().toISOString().split('T')[0];
        const competitions = ["PL", "BL1", "PD", "SA", "FL1"];
        
        let results = [];
        
        for (const comp of competitions) {
            try {
                const apiUrl = `https://api.football-data.org/v4/competitions/${comp}/matches?dateFrom=${testDate}&dateTo=${testDate}`;
                const response = await fetch(apiUrl, {
                    headers: { "X-Auth-Token": FOOTBALL_DATA_KEY }
                });
                
                const data = await response.json();
                results.push({
                    competition: comp,
                    status: response.status,
                    matches: data.matches?.length || 0,
                    sample: data.matches?.slice(0, 2).map(m => ({
                        home: m.homeTeam?.name,
                        away: m.awayTeam?.name,
                        date: m.utcDate
                    })) || []
                });
                
            } catch (error) {
                results.push({
                    competition: comp,
                    error: error.message
                });
            }
        }
        
        res.json({
            testDate: testDate,
            results: results
        });
        
    } catch (error) {
        res.json({ error: error.message });
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
    console.log(`?
