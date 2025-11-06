// server.js — Vereinfachte funktionierende Version
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// API Keys
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_API_KEY;
const SPORTSAPI360_KEY = process.env.SPORTSAPI360_API_KEY;

// Middleware
app.use(express.static(__dirname));
app.use(express.json());

// Basic Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        apis: {
            football_data: !!FOOTBALL_DATA_KEY,
            sportsapi360: !!SPORTSAPI360_KEY
        }
    });
});

// Cache
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000;

// Mathematical functions
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

function estimateXG(teamName, isHome = true, league = "") {
    let base = isHome ? 1.45 : 1.10;
    
    const LEAGUE_FACTORS = {
        "Premier League": 1.05, "Bundesliga": 1.10, "La Liga": 1.00, 
        "Serie A": 0.95, "Ligue 1": 1.02
    };
    
    const leagueFactor = LEAGUE_FACTORS[league] || 1.0;
    const homeAdvantage = isHome ? 0.15 : -0.10;
    
    const strongTeams = ["Man City", "Liverpool", "Arsenal", "Bayern", "Real Madrid", "Barcelona"];
    const weakTeams = ["Bochum", "Luton", "Sheffield", "Burnley"];
    
    let teamAdjustment = 0;
    if (strongTeams.some(team => teamName.includes(team))) teamAdjustment += 0.3;
    if (weakTeams.some(team => teamName.includes(team))) teamAdjustment -= 0.3;
    
    const raw = (base + homeAdvantage + teamAdjustment) * leagueFactor;
    return +Math.max(0.4, Math.min(3.5, raw)).toFixed(2);
}

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

function calculateValue(probability, odds) {
    if (!odds || odds <= 1) return 0;
    return +((probability * odds) - 1).toFixed(4);
}

function getFlag(teamName) {
    const flags = {
        "Manchester": "gb", "Liverpool": "gb", "Chelsea": "gb", "Arsenal": "gb",
        "Bayern": "de", "Dortmund": "de", "Leipzig": "de",
        "Real": "es", "Barcelona": "es",
        "Juventus": "it", "Inter": "it", "Milan": "it", "Napoli": "it",
        "PSG": "fr", "Marseille": "fr"
    };
    
    for (const [key, value] of Object.entries(flags)) {
        if (teamName.includes(key)) return value;
    }
    return "eu";
}

// Demo data
function getDemoGames(date = null) {
    const baseDate = date ? new Date(date) : new Date();
    
    const demoMatches = [
        { home: "Manchester City", away: "Liverpool", league: "Premier League" },
        { home: "Bayern Munich", away: "Borussia Dortmund", league: "Bundesliga" },
        { home: "Real Madrid", away: "Barcelona", league: "La Liga" },
        { home: "PSG", away: "Marseille", league: "Ligue 1" },
        { home: "Inter Milan", away: "Juventus", league: "Serie A" }
    ];
    
    return demoMatches.map((match, index) => {
        const homeXG = estimateXG(match.home, true, match.league);
        const awayXG = estimateXG(match.away, false, match.league);
        const prob = computeMatchOutcomeProbs(homeXG, awayXG);
        const over25 = computeOver25Prob(homeXG, awayXG);
        const btts = computeBTTS(homeXG, awayXG);
        
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
            over25,
            under25: 1 - over25,
            status: "SCHEDULED",
            source: "demo"
        };
    });
}

// SportsAPI360 Service (simplified)
class SportsAPI360Service {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = "https://api.sportsapi360.com";
    }

    async getMatchesByDate(date) {
        if (!this.apiKey) return { matches: [] };
        
        try {
            const url = `${this.baseURL}/matches?api_key=${this.apiKey}&sport_id=1&date=${date}`;
            console.log('🔗 Fetching from SportsAPI360...');
            
            const response = await fetch(url, { timeout: 10000 });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`✅ Got ${data.matches?.length || 0} matches from SportsAPI360`);
            return data;
            
        } catch (error) {
            console.log('❌ SportsAPI360 error:', error.message);
            return { matches: [] };
        }
    }
}

const sportsAPI360 = new SportsAPI360Service(SPORTSAPI360_KEY);

// Main API route
app.get('/api/games', async (req, res) => {
    try {
        console.log('📥 API Request received');
        
        const requestedDate = req.query.date || new Date().toISOString().split('T')[0];
        const cacheKey = `games-${requestedDate}`;
        
        // Check cache
        const cached = cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
            console.log('✅ Serving from cache');
            return res.json({ response: cached.data });
        }
        
        let apiGames = [];
        
        // Try SportsAPI360
        if (SPORTSAPI360_KEY) {
            try {
                const sportsData = await sportsAPI360.getMatchesByDate(requestedDate);
                if (sportsData.matches && sportsData.matches.length > 0) {
                    apiGames = sportsData.matches.map(match => {
                        const homeXG = estimateXG(match.home_team?.name, true, match.league?.name);
                        const awayXG = estimateXG(match.away_team?.name, false, match.league?.name);
                        const prob = computeMatchOutcomeProbs(homeXG, awayXG);
                        const over25 = computeOver25Prob(homeXG, awayXG);
                        const btts = computeBTTS(homeXG, awayXG);
                        
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
                            id: match.match_id,
                            home: match.home_team?.name,
                            away: match.away_team?.name,
                            league: match.league?.name,
                            date: match.date,
                            homeLogo: match.home_team?.logo || `https://flagcdn.com/w40/${getFlag(match.home_team?.name)}.png`,
                            awayLogo: match.away_team?.logo || `https://flagcdn.com/w40/${getFlag(match.away_team?.name)}.png`,
                            homeXG,
                            awayXG,
                            prob,
                            value,
                            odds,
                            btts,
                            over25,
                            under25: 1 - over25,
                            status: match.status,
                            source: "sportsapi360"
                        };
                    });
                }
            } catch (error) {
                console.log('❌ SportsAPI360 failed:', error.message);
            }
        }
        
        let finalGames = apiGames.length > 0 ? apiGames : getDemoGames(requestedDate);
        
        // Sort by value
        finalGames.sort((a, b) => {
            const maxValueA = Math.max(a.value.home, a.value.draw, a.value.away, a.value.over25);
            const maxValueB = Math.max(b.value.home, b.value.draw, b.value.away, b.value.over25);
            return maxValueB - maxValueA;
        });
        
        console.log(`🎯 Final: ${finalGames.length} games`);
        
        // Cache results
        cache.set(cacheKey, {
            timestamp: Date.now(),
            data: finalGames
        });
        
        res.json({ 
            response: finalGames,
            info: {
                date: requestedDate,
                total: finalGames.length,
                source: apiGames.length > 0 ? "sportsapi360" : "demo"
            }
        });
        
    } catch (error) {
        console.error('❌ Error in /api/games:', error);
        const fallbackGames = getDemoGames(req.query.date);
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

// Status route
app.get('/api/status', (req, res) => {
    res.json({
        status: 'running',
        apis: {
            sportsapi360: !!SPORTSAPI360_KEY,
            football_data: !!FOOTBALL_DATA_KEY
        }
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔑 Football-Data API: ${FOOTBALL_DATA_KEY ? '✅' : '❌'}`);
    console.log(`🔑 SportsAPI360 API: ${SPORTSAPI360_KEY ? '✅' : '❌'}`);
    console.log(`🌐 App available at: https://your-app.onrender.com`);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
