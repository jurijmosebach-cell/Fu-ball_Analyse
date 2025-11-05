// server.js — Mit realistischen Wahrscheinlichkeiten und Trends
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

// VERBESSERTE xG-Schätzung mit Team-Stärken
function estimateXG(teamName, isHome = true, league = "", opponentStrength = 1.0) {
    // Basis xG Werte für verschiedene Team-Stärken
    const TEAM_STRENGTHS = {
        // Top Teams
        "Man City": 2.1, "Liverpool": 2.0, "Arsenal": 1.9, "Bayern": 2.1, 
        "Real Madrid": 2.1, "Barcelona": 1.9, "PSG": 1.9, "Inter": 1.8,
        "Juventus": 1.7, "Dortmund": 1.7, "Atletico": 1.6, "Napoli": 1.6,
        
        // Mittlere Teams
        "Chelsea": 1.5, "Tottenham": 1.5, "Newcastle": 1.4, "Villa": 1.4,
        "Leipzig": 1.5, "Leverkusen": 1.6, "Milan": 1.5, "Roma": 1.4,
        "Sevilla": 1.3, "Valencia": 1.2, "Marseille": 1.3, "Lyon": 1.3,
        
        // Schwache Teams
        "Bochum": 0.9, "Luton": 0.8, "Sheffield": 0.7, "Burnley": 0.8,
        "Mainz": 0.9, "Cadiz": 0.8, "Salernitana": 0.7, "Clermont": 0.8,
        "Empoli": 0.8, "Verona": 0.8
    };
    
    // Finde Team-Stärke
    let baseXG = 1.3; // Default für mittlere Teams
    for (const [team, strength] of Object.entries(TEAM_STRENGTHS)) {
        if (teamName.includes(team)) {
            baseXG = strength;
            break;
        }
    }
    
    // Liga-Faktoren
    const LEAGUE_FACTORS = {
        "Premier League": 1.05, "Bundesliga": 1.08, "La Liga": 1.00, 
        "Serie A": 0.98, "Ligue 1": 0.95, "Champions League": 1.10,
        "Eredivisie": 1.02, "Campeonato Brasileiro Série A": 0.90,
        "Championship": 0.85, "Primeira Liga": 0.88
    };
    
    const leagueFactor = LEAGUE_FACTORS[league] || 1.0;
    
    // Home Advantage
    const homeAdvantage = isHome ? 0.25 : -0.15;
    
    // Gegner-Stärke Anpassung
    const opponentAdjustment = (1.0 - opponentStrength) * 0.3;
    
    // Form-Anpassung (leicht zufällig für Realismus)
    const formAdjustment = (Math.random() - 0.5) * 0.2;
    
    const finalXG = (baseXG + homeAdvantage + opponentAdjustment + formAdjustment) * leagueFactor;
    
    return +Math.max(0.4, Math.min(3.2, finalXG)).toFixed(2);
}

// VERBESSERTE Wahrscheinlichkeits-Berechnungen
function computeMatchOutcomeProbs(homeLambda, awayLambda) {
    let homeProb = 0, drawProb = 0, awayProb = 0;
    let totalGoals = 0;
    
    // Erweiterte Poisson-Berechnung
    for (let i = 0; i <= 8; i++) {
        for (let j = 0; j <= 8; j++) {
            const p = poisson(i, homeLambda) * poisson(j, awayLambda);
            totalGoals += p * (i + j);
            
            if (i > j) homeProb += p;
            else if (i === j) drawProb += p;
            else awayProb += p;
        }
    }
    
    // Realistische Korrekturen basierend auf Torerwartung
    const avgGoals = totalGoals;
    
    // Weniger Tore = mehr Unentschieden
    if (avgGoals < 2.0) {
        drawProb *= 1.2;
    }
    // Mehr Tore = weniger Unentschieden
    else if (avgGoals > 3.0) {
        drawProb *= 0.8;
    }
    
    // Home Advantage Verstärkung
    homeProb *= 1.05;
    awayProb *= 0.95;
    
    // Normalisieren
    const total = homeProb + drawProb + awayProb;
    const normalized = {
        home: +(homeProb / total).toFixed(4),
        draw: +(drawProb / total).toFixed(4),
        away: +(awayProb / total).toFixed(4)
    };
    
    // Sicherstellen, dass Werte realistisch sind
    if (normalized.home > 0.75) normalized.home = 0.75;
    if (normalized.away > 0.75) normalized.away = 0.75;
    if (normalized.draw > 0.35) normalized.draw = 0.35;
    
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
    
    // Realistische Anpassung
    const totalGoals = homeLambda + awayLambda;
    if (totalGoals < 2.0) over25Prob *= 0.7;
    if (totalGoals > 3.5) over25Prob *= 1.2;
    
    return +Math.max(0.05, Math.min(0.95, over25Prob)).toFixed(4);
}

function computeBTTS(homeLambda, awayLambda) {
    const pHomeScore = 1 - poisson(0, homeLambda);
    const pAwayScore = 1 - poisson(0, awayLambda);
    let bttsProb = pHomeScore * pAwayScore;
    
    // Realistische Anpassung
    const totalGoals = homeLambda + awayLambda;
    if (totalGoals > 3.0) bttsProb *= 1.1;
    if (totalGoals < 1.5) bttsProb *= 0.8;
    
    return +Math.max(0.1, Math.min(0.9, bttsProb)).toFixed(4);
}

// VERBESSERTE Trend-Berechnung
function computeTrend(prob, homeXG, awayXG, homeTeam, awayTeam) {
    const { home, draw, away } = prob;
    
    // Team-Stärken berücksichtigen
    const strongHomeTeams = ["Man City", "Bayern", "Real Madrid", "Liverpool", "PSG"];
    const strongAwayTeams = ["Barcelona", "Arsenal", "Inter", "Dortmund", "Juventus"];
    
    let homeBoost = 0;
    let awayBoost = 0;
    
    if (strongHomeTeams.some(team => homeTeam.includes(team))) homeBoost += 0.1;
    if (strongAwayTeams.some(team => awayTeam.includes(team))) awayBoost += 0.1;
    
    // xG Dominanz
    const xgRatio = homeXG / (homeXG + awayXG);
    const xgAdvantage = (xgRatio - 0.5) * 0.3;
    
    // Kombinierte Bewertung
    const homeStrength = home + homeBoost + xgAdvantage;
    const awayStrength = away + awayBoost - xgAdvantage;
    
    // Entscheidung mit Schwellenwerten
    if (draw > 0.32 && Math.abs(homeStrength - awayStrength) < 0.15) {
        return "Draw";
    }
    
    if (homeStrength > awayStrength + 0.1) {
        return "Home";
    } else if (awayStrength > homeStrength + 0.1) {
        return "Away";
    } else {
        // Bei knappen Spielen: Home Advantage
        return homeStrength > awayStrength ? "Home" : "Away";
    }
}

function calculateValue(probability, odds) {
    if (!odds || odds <= 1) return 0;
    const value = (probability * odds) - 1;
    // Value begrenzen für Realismus
    return +Math.max(-0.5, Math.min(0.5, value)).toFixed(4);
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
        "Benfica": "pt", "Porto": "pt", "Sporting": "pt"
    };
    
    for (const [key, value] of Object.entries(flags)) {
        if (teamName.includes(key)) return value;
    }
    return "eu";
}

// REALISTISCHE Demo-Daten
function getRealisticDemoGames(date = null) {
    const baseDate = date ? new Date(date) : new Date();
    
    const realisticMatches = [
        { 
            home: "Manchester City", 
            away: "Liverpool", 
            league: "Premier League",
            expectedHomeXG: 1.9,
            expectedAwayXG: 1.7
        },
        { 
            home: "Bayern Munich", 
            away: "Borussia Dortmund", 
            league: "Bundesliga",
            expectedHomeXG: 2.1,
            expectedAwayXG: 1.4
        },
        { 
            home: "Real Madrid", 
            away: "Barcelona", 
            league: "La Liga",
            expectedHomeXG: 1.7,
            expectedAwayXG: 1.6
        },
        { 
            home: "PSG", 
            away: "Marseille", 
            league: "Ligue 1",
            expectedHomeXG: 1.9,
            expectedAwayXG: 0.9
        },
        { 
            home: "Inter Milan", 
            away: "Juventus", 
            league: "Serie A",
            expectedHomeXG: 1.5,
            expectedAwayXG: 1.2
        },
        { 
            home: "Arsenal", 
            away: "Chelsea", 
            league: "Premier League",
            expectedHomeXG: 1.8,
            expectedAwayXG: 1.1
        },
        { 
            home: "AC Milan", 
            away: "Napoli", 
            league: "Serie A",
            expectedHomeXG: 1.4,
            expectedAwayXG: 1.3
        },
        { 
            home: "Atletico Madrid", 
            away: "Sevilla", 
            league: "La Liga",
            expectedHomeXG: 1.5,
            expectedAwayXG: 0.8
        }
    ];
    
    return realisticMatches.map((match, index) => {
        // Verwende realistische xG Werte
        const homeXG = match.expectedHomeXG + (Math.random() - 0.5) * 0.2;
        const awayXG = match.expectedAwayXG + (Math.random() - 0.5) * 0.2;
        
        const prob = computeMatchOutcomeProbs(homeXG, awayXG);
        const over25 = computeOver25Prob(homeXG, awayXG);
        const btts = computeBTTS(homeXG, awayXG);
        const trend = computeTrend(prob, homeXG, awayXG, match.home, match.away);
        
        // Realistische Odds basierend auf Wahrscheinlichkeiten
        const margin = 0.08; // Buchmacher-Marge
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
        
        // Match-Datum
        const matchDate = new Date(baseDate);
        matchDate.setDate(matchDate.getDate() + index);
        matchDate.setHours(15 + (index % 6), 0, 0, 0);
        
        return {
            id: Date.now() + index,
            home: match.home,
            away: match.away,
            league: match.league,
            date: matchDate.toISOString(),
            homeLogo: `https://flagcdn.com/w40/${getFlag(match.home)}.png`,
            awayLogo: `https://flagcdn.com/w40/${getFlag(match.away)}.png`,
            homeXG: +homeXG.toFixed(2),
            awayXG: +awayXG.toFixed(2),
            prob,
            value,
            odds,
            btts,
            trend,
            over25,
            under25: 1 - over25,
            status: "SCHEDULED",
            source: "realistic_demo"
        };
    });
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
        
        let apiGames = [];
        
        // Versuche echte API-Daten
        if (FOOTBALL_DATA_KEY) {
            try {
                console.log("🔄 Trying Football-Data.org API...");
                
                const dateObj = new Date(requestedDate);
                const dateFrom = new Date(dateObj);
                const dateTo = new Date(dateObj);
                
                const apiUrl = `https://api.football-data.org/v4/matches?dateFrom=${dateFrom.toISOString().split('T')[0]}&dateTo=${dateTo.toISOString().split('T')[0]}`;
                
                const response = await fetch(apiUrl, {
                    headers: { 
                        "X-Auth-Token": FOOTBALL_DATA_KEY,
                        "Content-Type": "application/json"
                    },
                    timeout: 10000
                });
                
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.matches && data.matches.length > 0) {
                        for (const match of data.matches) {
                            if (match.status === "SCHEDULED" || match.status === "LIVE" || match.status === "TIMED") {
                                const homeTeam = match.homeTeam?.name || "Unknown";
                                const awayTeam = match.awayTeam?.name || "Unknown";
                                const league = match.competition?.name || "Unknown";
                                
                                // Gegner-Stärke schätzen
                                const homeStrength = estimateXG(homeTeam, true, league) / 2.0;
                                const awayStrength = estimateXG(awayTeam, false, league) / 2.0;
                                
                                const homeXG = estimateXG(homeTeam, true, league, awayStrength);
                                const awayXG = estimateXG(awayTeam, false, league, homeStrength);
                                
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
                                
                                apiGames.push({
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
                        }
                    }
                }
            } catch (apiErr) {
                console.warn("❌ API call failed:", apiErr.message);
            }
        }
        
        let finalGames = apiGames.length > 0 ? apiGames : getRealisticDemoGames(requestedDate);
        
        // Nach Value sortieren
        const sortedGames = finalGames.sort((a, b) => {
            const maxValueA = Math.max(a.value.home, a.value.draw, a.value.away, a.value.over25);
            const maxValueB = Math.max(b.value.home, b.value.draw, b.value.away, b.value.over25);
            return maxValueB - maxValueA;
        });
        
        console.log(`🎯 Final: ${sortedGames.length} games with realistic probabilities`);
        
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
                source: apiGames.length > 0 ? "football-data.org" : "realistic_demo"
            }
        });
        
    } catch (error) {
        console.error("❌ Error in /api/games:", error);
        const fallbackGames = getRealisticDemoGames(req.query.date);
        res.json({ 
            response: fallbackGames,
            info: {
                date: req.query.date || new Date().toISOString().split('T')[0],
                total: fallbackGames.length,
                source: "fallback"
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
    console.log(`🔑 API Key: ${FOOTBALL_DATA_KEY ? 'Configured ✅' : 'MISSING ❌'}`);
    console.log(`📊 Realistic probabilities ENABLED`);
});
