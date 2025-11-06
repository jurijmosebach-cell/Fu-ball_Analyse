// server.js — Vollständige korrigierte Version
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

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
        "Serie A": 0.95, "Ligue 1": 1.02, "Champions League": 1.08
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
        { home: "Inter Milan", away: "Juventus", league: "Serie A" },
        { home: "Arsenal", away: "Chelsea", league: "Premier League" },
        { home: "Atletico Madrid", away: "Sevilla", league: "La Liga" },
        { home: "AC Milan", away: "Napoli", league: "Serie A" },
        { home: "Leipzig", away: "Leverkusen", league: "Bundesliga" },
        { home: "Newcastle", away: "Tottenham", league: "Premier League" }
    ];
    
    return demoMatches.map((match, index) => {
        const homeXG = estimateXG(match.home, true, match.league);
        const awayXG = estimateXG(match.away, false, match.league);
        const prob = computeMatchOutcomeProbs(homeXG, awayXG);
        const over25 = computeOver25Prob(homeXG, awayXG);
        const btts = computeBTTS(homeXG, awayXG);
        
        const odds = {
            home: +(1 / prob.home * 0.92).toFixed(2),
            draw: +(1 / prob.draw * 0.92).toFixed(2),
            away: +(1 / prob.away * 0.92).toFixed(2),
            over25: +(1 / over25 * 0.92).toFixed(2)
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
            over25,
            under25: 1 - over25,
            status: "SCHEDULED",
            source: "demo"
        };
    });
}

// Vereinfachte SportsAPI360 Service Klasse
class SportsAPI360Service {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = "https://apiv3.sportsap360.com";
    }

    async makeRequest(endpoint) {
        if (!this.apiKey) {
            console.log('❌ No API Key for SportsAPI360');
            return null;
        }
        
        try {
            const url = `${this.baseURL}${endpoint}`;
            console.log('🔗 Fetching from SportsAPI360 v3...');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'x-api-key': this.apiKey,
                    'Accept': 'application/json',
                    'User-Agent': 'WettAnalyseTool/1.0'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ SportsAPI360 v3 Response received');
            return data;
            
        } catch (error) {
            console.log('❌ SportsAPI360 v3 Error:', error.message);
            return null;
        }
    }

    async getLiveMatches() {
        return await this.makeRequest('/football/api/v1/matches/live');
    }

    async getMatchesByDate(date) {
        console.log('📅 Getting matches for date:', date);
        const liveData = await this.getLiveMatches();
        
        if (liveData && liveData.response) {
            const matches = this.extractMatchesFromResponse(liveData);
            console.log(`✅ Extracted ${matches.length} matches from API`);
            return { matches };
        }
        
        return { matches: [] };
    }

    extractMatchesFromResponse(apiData) {
        if (!apiData || !apiData.response) return [];
        
        const matches = [];
        
        try {
            for (const item of apiData.response) {
                if (item.matches && Array.isArray(item.matches)) {
                    for (const match of item.matches) {
                        const matchDate = new Date(match.startTimestamp * 1000);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        
                        if (matchDate >= today) {
                            matches.push({
                                match_id: match.id,
                                home_team: {
                                    name: match.homeTeam?.name || 'Home Team'
                                },
                                away_team: {
                                    name: match.awayTeam?.name || 'Away Team'
                                },
                                league: {
                                    name: item.tournaments?.name || 'Unknown League'
                                },
                                date: matchDate.toISOString(),
                                status: match.status?.description || 'SCHEDULED'
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.log('❌ Error extracting matches:', error);
        }
        
        return matches;
    }
}

const sportsAPI360 = new SportsAPI360Service(SPORTSAPI360_KEY);

// Debug Route
app.get('/api/debug-v3', async (req, res) => {
    try {
        console.log('🔍 DEBUG v3 API');
        
        if (!SPORTSAPI360_KEY) {
            return res.json({ 
                error: 'No API Key configured',
                hint: 'Check SPORTSAPI360_API_KEY environment variable'
            });
        }
        
        console.log('🔑 API Key configured:', SPORTSAPI360_KEY.substring(0, 10) + '...');
        
        const sportsAPI = new SportsAPI360Service(SPORTSAPI360_KEY);
        const liveData = await sportsAPI.getLiveMatches();
        
        if (!liveData) {
            return res.json({ 
                status: 'error', 
                message: 'Failed to fetch from API',
                using_demo: true
            });
        }
        
        return res.json({
            status: 'success',
            api_working: true,
            response_structure: Object.keys(liveData),
            has_response: !!liveData.response,
            response_count: liveData.response?.length || 0,
            sample_data: liveData.response ? {
                first_tournament: liveData.response[0]?.tournaments?.name,
                matches_count: liveData.response[0]?.matches?.length || 0,
                sample_match: liveData.response[0]?.matches?.[0] ? {
                    home: liveData.response[0].matches[0].homeTeam?.name,
                    away: liveData.response[0].matches[0].awayTeam?.name,
                    league: liveData.response[0].tournaments?.name,
                    status: liveData.response[0].matches[0].status?.description
                } : 'No matches in first tournament'
            } : 'No response data',
            using_demo: false
        });
        
    } catch (error) {
        console.error('❌ Debug v3 Error:', error);
        res.json({
            status: 'error',
            error: error.message,
            using_demo: true
        });
    }
});

// Haupt-API Route
app.get('/api/games', async (req, res) => {
    try {
        const requestedDate = req.query.date || new Date().toISOString().split('T')[0];
        console.log('🎯 API Request for date:', requestedDate);
        
        const cacheKey = `games-${requestedDate}`;
        
        // Cache prüfen
        const cached = cache.get(cacheKey);
        if (cached) {
            console.log('✅ Serving from cache');
            return res.json({ 
                response: cached.data,
                info: { source: 'cache', date: requestedDate }
            });
        }
        
        let apiGames = [];
        let apiSource = 'demo';
        let apiError = null;
        
        // SPORTSAPI360 v3 VERSION
        if (SPORTSAPI360_KEY) {
            console.log('🔄 Trying SportsAPI360 v3...');
            try {
                const sportsData = await sportsAPI360.getMatchesByDate(requestedDate);
                
                if (sportsData.matches && sportsData.matches.length > 0) {
                    console.log(`✅ Got ${sportsData.matches.length} REAL matches from SportsAPI360 v3`);
                    
                    apiGames = sportsData.matches.map((match, index) => {
                        const homeTeam = match.home_team?.name || 'Unknown Home';
                        const awayTeam = match.away_team?.name || 'Unknown Away';
                        const league = match.league?.name || 'Unknown League';
                        
                        const homeXG = estimateXG(homeTeam, true, league);
                        const awayXG = estimateXG(awayTeam, false, league);
                        const prob = computeMatchOutcomeProbs(homeXG, awayXG);
                        const over25 = computeOver25Prob(homeXG, awayXG);
                        const btts = computeBTTS(homeXG, awayXG);
                        
                        const odds = {
                            home: +(1 / prob.home * 0.92).toFixed(2),
                            draw: +(1 / prob.draw * 0.92).toFixed(2),
                            away: +(1 / prob.away * 0.92).toFixed(2),
                            over25: +(1 / over25 * 0.92).toFixed(2)
                        };
                        
                        const value = {
                            home: calculateValue(prob.home, odds.home),
                            draw: calculateValue(prob.draw, odds.draw),
                            away: calculateValue(prob.away, odds.away),
                            over25: calculateValue(over25, odds.over25),
                            under25: calculateValue(1 - over25, 1.9)
                        };
                        
                        return {
                            id: match.match_id || `real-${index}`,
                            home: homeTeam,
                            away: awayTeam,
                            league: league,
                            date: match.date || new Date().toISOString(),
                            homeLogo: `https://flagcdn.com/w40/${getFlag(homeTeam)}.png`,
                            awayLogo: `https://flagcdn.com/w40/${getFlag(awayTeam)}.png`,
                            homeXG,
                            awayXG,
                            prob,
                            value,
                            odds,
                            btts,
                            over25,
                            under25: 1 - over25,
                            status: match.status || "SCHEDULED",
                            source: "sportsapi360_v3"
                        };
                    });
                    
                    apiSource = 'sportsapi360_v3';
                } else {
                    console.log('⚠️ SportsAPI360 v3 returned no matches');
                    apiError = 'No matches from API';
                }
            } catch (error) {
                console.log('❌ SportsAPI360 v3 error:', error.message);
                apiError = error.message;
            }
        } else {
            console.log('⏭️ Skipping SportsAPI360 - no API key');
            apiError = 'No API key configured';
        }
        
        let finalGames = [];
        
        if (apiGames.length > 0) {
            console.log(`🎯 Using ${apiGames.length} REAL games from API`);
            finalGames = apiGames;
        } else {
            console.log('📋 Using DEMO games (no API data available)');
            finalGames = getDemoGames(requestedDate);
            apiSource = 'demo';
        }
        
        // Sortieren
        finalGames.sort((a, b) => {
            const maxValueA = Math.max(a.value.home, a.value.draw, a.value.away, a.value.over25);
            const maxValueB = Math.max(b.value.home, b.value.draw, b.value.away, b.value.over25);
            return maxValueB - maxValueA;
        });
        
        console.log(`📊 Final: ${finalGames.length} games (source: ${apiSource})`);
        
        // Cache
        cache.set(cacheKey, {
            timestamp: Date.now(),
            data: finalGames
        });
        
        res.json({ 
            response: finalGames,
            info: {
                date: requestedDate,
                total: finalGames.length,
                source: apiSource,
                real_games: apiGames.length,
                demo_games: finalGames.length - apiGames.length,
                api_error: apiError
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
                source: "fallback",
                error: error.message
            }
        });
    }
});

// Status route
app.get('/api/status', (req, res) => {
    res.json({
        status: 'running',
        apis: {
            sportsapi360_v3: !!SPORTSAPI360_KEY,
            football_data: !!FOOTBALL_DATA_KEY
        },
        version: 'v3_api_simple'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔑 SportsAPI360 v3 API: ${SPORTSAPI360_KEY ? '✅' : '❌'}`);
    console.log(`🌐 App available at: https://your-app.onrender.com`);
    console.log(`🔗 Debug: https://your-app.onrender.com/api/debug-v3`);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
