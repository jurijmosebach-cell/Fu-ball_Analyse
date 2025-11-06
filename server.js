// server.js — Stabile Version mit API Diagnose
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

// Mathematical functions (unverändert)
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
        "Serie A": 0.95, "Ligue 1": 1.02, "Champions League": 1.08,
        "Eredivisie": 1.12, "Primeira Liga": 0.94
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

// Erweiterte Demo-Daten mit mehr Realismus
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
        { home: "Newcastle", away: "Tottenham", league: "Premier League" },
        { home: "Brighton", away: "Aston Villa", league: "Premier League" },
        { home: "West Ham", away: "Crystal Palace", league: "Premier League" },
        { home: "Wolfsburg", away: "Frankfurt", league: "Bundesliga" },
        { home: "Monaco", away: "Lyon", league: "Ligue 1" },
        { home: "Porto", away: "Benfica", league: "Primeira Liga" }
    ];
    
    return demoMatches.map((match, index) => {
        const homeXG = estimateXG(match.home, true, match.league);
        const awayXG = estimateXG(match.away, false, match.league);
        const prob = computeMatchOutcomeProbs(homeXG, awayXG);
        const over25 = computeOver25Prob(homeXG, awayXG);
        const btts = computeBTTS(homeXG, awayXG);
        
        // Realistische Odds basierend auf Team-Stärke
        const baseOddsHome = homeXG > awayXG ? 1.8 : 2.2;
        const baseOddsAway = awayXG > homeXG ? 1.8 : 2.2;
        const baseOddsDraw = 3.2;
        
        const odds = {
            home: +(baseOddsHome + (Math.random() * 0.4 - 0.2)).toFixed(2),
            draw: +(baseOddsDraw + (Math.random() * 0.3 - 0.15)).toFixed(2),
            away: +(baseOddsAway + (Math.random() * 0.4 - 0.2)).toFixed(2),
            over25: +(1.9 + (Math.random() * 0.3 - 0.15)).toFixed(2)
        };
        
        const value = {
            home: calculateValue(prob.home, odds.home),
            draw: calculateValue(prob.draw, odds.draw),
            away: calculateValue(prob.away, odds.away),
            over25: calculateValue(over25, odds.over25),
            under25: calculateValue(1 - over25, 1.9)
        };
        
        const matchDate = new Date(baseDate);
        matchDate.setDate(matchDate.getDate() + Math.floor(index / 3));
        matchDate.setHours(12 + (index % 8), 0, 0, 0);
        
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

// API Diagnose Service
class APIDiagnoseService {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    async testConnection() {
        if (!this.apiKey) {
            return { success: false, error: 'No API key provided' };
        }

        const testUrls = [
            'https://apiv3.sportsap360.com/football/api/v1/matches/live',
            'https://api.sportsapi360.com/matches?api_key=TEST&sport_id=1&date=2024-01-01'
        ];

        const results = [];

        for (const url of testUrls) {
            try {
                console.log(`🔗 Testing: ${url.replace(this.apiKey, '***')}`);
                
                const testUrl = url.replace('TEST', this.apiKey);
                const response = await fetch(testUrl, {
                    headers: {
                        'x-api-key': this.apiKey,
                        'Accept': 'application/json'
                    },
                    timeout: 10000
                });

                results.push({
                    url: url.replace(this.apiKey, '***'),
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok
                });

                if (response.ok) {
                    const data = await response.json();
                    return { 
                        success: true, 
                        working_url: url,
                        data_structure: Object.keys(data) 
                    };
                }
            } catch (error) {
                results.push({
                    url: url.replace(this.apiKey, '***'),
                    error: error.message
                });
            }
        }

        return { 
            success: false, 
            error: 'All API endpoints failed',
            details: results 
        };
    }
}

// Erweiterte Debug Route für API Diagnose
app.get('/api/diagnose', async (req, res) => {
    try {
        console.log('🩺 API Diagnosis Started');
        
        if (!SPORTSAPI360_KEY) {
            return res.json({ 
                status: 'no_key',
                message: 'SPORTSAPI360_API_KEY environment variable is not set',
                solution: 'Add the API key in Render environment variables'
            });
        }

        console.log('🔑 API Key found:', SPORTSAPI360_KEY.substring(0, 8) + '...');
        
        const diagnoseService = new APIDiagnoseService(SPORTSAPI360_KEY);
        const result = await diagnoseService.testConnection();
        
        if (result.success) {
            return res.json({
                status: 'api_working',
                message: '✅ SportsAPI360 API is working!',
                working_url: result.working_url,
                data_structure: result.data_structure,
                using_demo: false
            });
        } else {
            return res.json({
                status: 'api_failed',
                message: '❌ SportsAPI360 API is not accessible',
                error: result.error,
                details: result.details,
                possible_causes: [
                    'Invalid API key',
                    'API endpoint changed',
                    'Network restrictions in Render',
                    'API service down'
                ],
                solutions: [
                    'Check if API key is valid in SportsAPI360 dashboard',
                    'Contact SportsAPI360 support',
                    'Try using a different API provider',
                    'Use demo data until API is fixed'
                ],
                using_demo: true
            });
        }
        
    } catch (error) {
        console.error('❌ Diagnosis Error:', error);
        res.json({
            status: 'diagnosis_error',
            error: error.message,
            using_demo: true
        });
    }
});

// Alternative: Football-Data.org als Fallback
class FootballDataService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.football-data.org/v4';
    }

    async getMatchesByDate(date) {
        if (!this.apiKey) return { matches: [] };

        try {
            const dateFrom = new Date(date);
            const dateTo = new Date(date);
            dateTo.setDate(dateTo.getDate() + 3);

            const url = `${this.baseURL}/matches?dateFrom=${dateFrom.toISOString().split('T')[0]}&dateTo=${dateTo.toISOString().split('T')[0]}`;
            
            const response = await fetch(url, {
                headers: {
                    'X-Auth-Token': this.apiKey,
                    'Accept': 'application/json'
                },
                timeout: 10000
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ Football-Data.org: ${data.matches?.length || 0} matches`);
            
            const filteredMatches = data.matches?.filter(match => {
                const matchDate = new Date(match.utcDate).toISOString().split('T')[0];
                return matchDate === date && match.status === 'SCHEDULED';
            }) || [];

            return { matches: filteredMatches };

        } catch (error) {
            console.log('❌ Football-Data.org error:', error.message);
            return { matches: [] };
        }
    }
}

const footballDataService = new FootballDataService(FOOTBALL_DATA_KEY);

// Haupt-API Route mit mehreren Datenquellen
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
        let apiDetails = {};
        
        // VERSUCH 1: Football-Data.org (falls verfügbar)
        if (FOOTBALL_DATA_KEY) {
            console.log('🔄 Trying Football-Data.org...');
            try {
                const footballData = await footballDataService.getMatchesByDate(requestedDate);
                
                if (footballData.matches && footballData.matches.length > 0) {
                    console.log(`✅ Got ${footballData.matches.length} matches from Football-Data.org`);
                    
                    apiGames = footballData.matches.map((match, index) => {
                        const homeTeam = match.homeTeam?.name || 'Home Team';
                        const awayTeam = match.awayTeam?.name || 'Away Team';
                        const league = match.competition?.name || 'Unknown League';
                        
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
                            id: match.id || `fd-${index}`,
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
                            over25,
                            under25: 1 - over25,
                            status: match.status,
                            source: "football_data"
                        };
                    });
                    
                    apiSource = 'football_data';
                    apiDetails.football_data = footballData.matches.length;
                }
            } catch (error) {
                console.log('❌ Football-Data.org error:', error.message);
                apiDetails.football_data_error = error.message;
            }
        }
        
        // Falls keine Spiele von Football-Data.org, verwende Demo
        if (apiGames.length === 0) {
            console.log('📋 Using ENHANCED DEMO games');
            apiGames = getDemoGames(requestedDate);
            apiSource = 'enhanced_demo';
            apiDetails.demo_count = apiGames.length;
        }
        
        // Sortieren nach Value
        apiGames.sort((a, b) => {
            const maxValueA = Math.max(a.value.home, a.value.draw, a.value.away, a.value.over25);
            const maxValueB = Math.max(b.value.home, b.value.draw, b.value.away, b.value.over25);
            return maxValueB - maxValueA;
        });
        
        console.log(`📊 Final: ${apiGames.length} games (source: ${apiSource})`);
        
        // Cache
        cache.set(cacheKey, {
            timestamp: Date.now(),
            data: apiGames
        });
        
        res.json({ 
            response: apiGames,
            info: {
                date: requestedDate,
                total: apiGames.length,
                source: apiSource,
                details: apiDetails,
                note: apiSource.includes('demo') ? 'Using high-quality demo data. Check /api/diagnose for API status.' : 'Using real API data'
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
            sportsapi360: !!SPORTSAPI360_KEY,
            football_data: !!FOOTBALL_DATA_KEY
        },
        data_sources: [
            'Football-Data.org (primary)',
            'Enhanced Demo Data (fallback)'
        ],
        version: 'multi_source_v1'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔑 SportsAPI360: ${SPORTSAPI360_KEY ? '✅' : '❌'}`);
    console.log(`🔑 Football-Data: ${FOOTBALL_DATA_KEY ? '✅' : '❌'}`);
    console.log(`🌐 App: https://your-app.onrender.com`);
    console.log(`🔗 Diagnose: https://your-app.onrender.com/api/diagnose`);
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
