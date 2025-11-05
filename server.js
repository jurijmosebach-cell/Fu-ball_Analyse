// server.js — Optimiert für Render Deployment
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// WICHTIG: Render-spezifische Middleware
app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PORT für Render
const PORT = process.env.PORT || 10000;
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_API_KEY || "demo_key";

// Render-optimierte Konfiguration
const CACHE_DURATION = 10 * 60 * 1000; // 10 Minuten für Render
const TEAM_STATS_TTL = 30 * 60 * 1000; // 30 Minuten für Render

const LEAGUE_IDS = {
    "Premier League": "PL", "Bundesliga": "BL1", "La Liga": "PD", "Serie A": "SA",
    "Ligue 1": "FL1", "Champions League": "CL", "Eredivisie": "DED",
    "Campeonato Brasileiro Série A": "BSA", "Championship": "ELC", 
    "Primeira Liga": "PPL", "European Championship": "EC"
};

// Vereinfachtes Caching für Render
const cache = new Map();

// Health Check Route für Render
app.get("/health", (req, res) => {
    res.status(200).json({ 
        status: "OK", 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development"
    });
});

// Root Route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Vereinfachte mathematische Funktionen
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

// Vereinfachte xG-Schätzung
function estimateXG(teamName, isHome = true, league = "") {
    const base = isHome ? 1.45 : 1.10;
    const LEAGUE_FACTORS = {
        "Premier League": 1.05, "Bundesliga": 1.10, "La Liga": 1.00, 
        "Serie A": 0.95, "Ligue 1": 1.02, "Champions League": 1.08
    };
    
    const leagueFactor = LEAGUE_FACTORS[league] || 1.0;
    const homeAdvantage = isHome ? 0.15 : -0.10;
    
    // Vereinfachte Team-basierte Anpassung
    const strongTeams = ["Man City", "Liverpool", "Arsenal", "Bayern", "Real", "Barcelona", "PSG"];
    const weakTeams = ["Bochum", "Luton", "Sheffield", "Burnley", "Mainz"];
    
    let teamAdjustment = 0;
    if (strongTeams.some(team => teamName.includes(team))) teamAdjustment += 0.3;
    if (weakTeams.some(team => teamName.includes(team))) teamAdjustment -= 0.3;
    
    const raw = (base + homeAdvantage + teamAdjustment) * leagueFactor;
    return +Math.max(0.4, Math.min(3.5, raw)).toFixed(2);
}

// Kern-Berechnungsfunktionen
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
    
    // Einfache Trend-Berechnung basierend auf Wahrscheinlichkeiten und xG
    const xgDiff = homeXG - awayXG;
    const probDiff = home - away;
    
    const homeStrength = home + (xgDiff * 0.1);
    const awayStrength = away - (xgDiff * 0.1);
    
    if (draw > home && draw > away) return "Draw";
    return homeStrength > awayStrength ? "Home" : "Away";
}

function calculateValue(probability, odds) {
    if (!odds || odds <= 1) return 0;
    return +((probability * odds) - 1).toFixed(4);
}

// Demo-Daten für Fallback
function getDemoGames() {
    const demoTeams = [
        { home: "Manchester City", away: "Liverpool", league: "Premier League" },
        { home: "Bayern Munich", away: "Borussia Dortmund", league: "Bundesliga" },
        { home: "Real Madrid", away: "Barcelona", league: "La Liga" },
        { home: "PSG", away: "Marseille", league: "Ligue 1" },
        { home: "Inter Milan", away: "Juventus", league: "Serie A" }
    ];
    
    return demoTeams.map((match, index) => {
        const homeXG = estimateXG(match.home, true, match.league);
        const awayXG = estimateXG(match.away, false, match.league);
        const prob = computeMatchOutcomeProbs(homeXG, awayXG);
        const over25 = computeOver25Prob(homeXG, awayXG);
        const btts = computeBTTS(homeXG, awayXG);
        const trend = computeTrend(prob, homeXG, awayXG);
        
        // Simulierte Odds
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
        
        return {
            id: index + 1,
            home: match.home,
            away: match.away,
            league: match.league,
            date: new Date(Date.now() + index * 86400000).toISOString(),
            homeLogo: `https://flagcdn.com/w40/gb.png`,
            awayLogo: `https://flagcdn.com/w40/gb.png`,
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

// Haupt-API Route mit Timeout-Protection
app.get("/api/games", async (req, res) => {
    // Timeout für Render setzen
    req.setTimeout(30000); // 30 Sekunden
    
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const cacheKey = `games-${date}`;
        
        // Cache prüfen
        const cached = cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
            return res.json({ response: cached.data });
        }
        
        let games = [];
        
        // API nur aufrufen wenn Key vorhanden, sonst Demo-Daten
        if (FOOTBALL_DATA_KEY && FOOTBALL_DATA_KEY !== "demo_key") {
            try {
                const apiUrl = `https://api.football-data.org/v4/matches?dateFrom=${date}&dateTo=${date}`;
                const response = await fetch(apiUrl, {
                    headers: { "X-Auth-Token": FOOTBALL_DATA_KEY },
                    timeout: 10000 // 10 Sekunden Timeout
                });
                
                if (response.ok) {
                    const data = await response.json();
                    // Hier könntest du die echten Daten verarbeiten
                    games = getDemoGames(); // Fallback zu Demo für jetzt
                } else {
                    games = getDemoGames();
                }
            } catch (apiError) {
                console.log("API Error, using demo data:", apiError.message);
                games = getDemoGames();
            }
        } else {
            games = getDemoGames();
        }
        
        // Nach Value sortieren
        const sortedGames = games.sort((a, b) => {
            const maxA = Math.max(a.value.home, a.value.draw, a.value.away);
            const maxB = Math.max(b.value.home, b.value.draw, b.value.away);
            return maxB - maxA;
        });
        
        // Im Cache speichern
        cache.set(cacheKey, {
            timestamp: Date.now(),
            data: sortedGames
        });
        
        // Cache bereinigen wenn zu groß
        if (cache.size > 50) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
        }
        
        res.json({ response: sortedGames });
        
    } catch (error) {
        console.error("Error in /api/games:", error);
        // Fallback zu Demo-Daten bei Fehlern
        const demoGames = getDemoGames();
        res.json({ response: demoGames });
    }
});

// Error Handling Middleware
app.use((error, req, res, next) => {
    console.error("Unhandled Error:", error);
    res.status(500).json({ 
        error: "Internal Server Error",
        message: "Bitte versuche es später erneut"
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: "Route nicht gefunden" });
});

// Server Start mit Render-optimierten Einstellungen
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 API Key: ${FOOTBALL_DATA_KEY ? 'Configured' : 'Using demo data'}`);
}).on('error', (err) => {
    console.error('❌ Server error:', err);
    process.exit(1);
});

// Graceful Shutdown für Render
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});
