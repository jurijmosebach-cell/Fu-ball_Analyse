// server.js — Mit korrigiertem API Key Namen
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// API Keys mit korrigierten Namen
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_API_KEY;
const SPORTSAPI360_KEY = process.env.FOOTBALL_API_V1_KEY; // ← GEÄNDERT

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

// SportsAPI360 Service mit korrekter v3 API
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
            
            console.log('📡 Response Status:', response.status, response.statusText);
            
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
        
        // Für v3 API verwenden wir live matches
        const liveData = await this.getLiveMatches();
        
        if (liveData && liveData.response) {
            const matches = this.extractMatchesFromResponse(liveData);
            console.log(`✅ Extracted ${matches.length} matches from SportsAPI360`);
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

// Football-Data.org Service
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

const sportsAPI360 = new SportsAPI360Service(SPORTSAPI360_KEY);
const footballDataService = new FootballDataService(FOOTBALL_DATA_KEY);

// Debug Route für beide APIs
app.get('/api/debug', async (req, res) => {
    try {
        console.log('🔍 DEBUG Both APIs');
        
        const results = {
            sportsapi360: {
                configured: !!SPORTSAPI360_KEY,
                key_preview: SPORTSAPI360_KEY ? SPORTSAPI360_KEY.substring(0, 8) + '...' : 'none'
            },
            football_data: {
                configured: !!FOOTBALL_DATA_KEY,
                key_preview: FOOTBALL_DATA_KEY ? FOOTBALL_DATA_KEY.substring(0, 8) + '...' : 'none'
            }
        };
        
        // Test SportsAPI360
        if (SPORTSAPI360_KEY) {
            try {
                console.log('🧪 Testing SportsAPI360...');
                const sportsData = await sportsAPI360.getLiveMatches();
                results.sportsapi360.working = !!sportsData;
                results.sportsapi360.matches_count = sportsData?.response?.length || 0;
            } catch (error) {
                results.sportsapi360.error = error.message;
            }
        }
        
        // Test Football-Data
        if (FOOTBALL_DATA_KEY) {
            try {
                console.log('🧪 Testing Football-Data.org...');
                const today = new Date().toISOString().split('T')[0];
                const footballData = await footballDataService.getMatchesByDate(today);
                results.football_data.working = true;
                results.football_data.matches_count = footballData.matches?.length || 0;
            } catch (error) {
                results.football_data.error = error.message;
            }
        }
        
        res.json(results);
        
    } catch (error) {
        console.error('❌ Debug Error:', error);
        res.json({
            error: error.message
        });
    }
});

// Haupt-API Route - Beide APIs versuchen
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
        let apiSource = 'none';
        let apiError = null;
        
        // VERSUCH 1: SportsAPI360
        if (SPORTSAPI360_KEY) {
            console.log('🔄 Trying SportsAPI360...');
            try {
                const sportsData = await sportsAPI360.getMatchesByDate(requestedDate);
                
                if (sportsData.matches && sportsData.matches.length > 0) {
                    console.log(`✅ Got ${sportsData.matches.length} matches from SportsAPI360`);
                    
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
                            under25: calculateValue(1 - over25, 2.0)
                        };
                        
                        return {
                            id: match.match_id || `s360-${index}`,
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
                            source: "sportsapi360"
                        };
                    });
                    
                    apiSource = 'sportsapi360';
                }
            } catch (error) {
                console.log('❌ SportsAPI360 error:', error.message);
                apiError = error.message;
            }
        }
        
        // VERSUCH 2: Football-Data.org (falls SportsAPI360 keine Spiele liefert)
        if (apiGames.length === 0 && FOOTBALL_DATA_KEY) {
            console.log('🔄 Trying Football-Data.org...');
            try {
                const footballData = await footballDataService.getMatchesByDate(requestedDate);
                
                if (footballData.matches && footballData.matches.length > 0) {
                    console.log(`✅ Got ${footballData.matches.length} matches from Football-Data.org`);
                    
                    apiGames = footballData.matches.map((match, index) => {
                        const homeTeam = match.homeTeam?.name || 'Unknown Home';
                        const awayTeam = match.awayTeam?.name || 'Unknown Away';
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
                            under25: calculateValue(1 - over25, 2.0)
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
                }
            } catch (error) {
                console.log('❌ Football-Data.org error:', error.message);
                apiError = error.message;
            }
        }
        
        if (apiGames.length === 0) {
            return res.status(404).json({
                error: 'Keine Spiele gefunden',
                message: 'Weder SportsAPI360 noch Football-Data.org haben Spiele für dieses Datum geliefert',
                date: requestedDate,
                apis_tried: [
                    SPORTSAPI360_KEY ? 'SportsAPI360' : null,
                    FOOTBALL_DATA_KEY ? 'Football-Data.org' : null
                ].filter(Boolean)
            });
        }
        
        // Nach Value sortieren
        apiGames.sort((a, b) => {
            const maxValueA = Math.max(a.value.home, a.value.draw, a.value.away, a.value.over25);
            const maxValueB = Math.max(b.value.home, b.value.draw, b.value.away, b.value.over25);
            return maxValueB - maxValueA;
        });
        
        console.log(`📊 Final: ${apiGames.length} games from ${apiSource}`);
        
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
                api_error: apiError
            }
        });
        
    } catch (error) {
        console.error('❌ Error in /api/games:', error);
        res.status(500).json({ 
            error: 'Fehler beim Laden der Spiele',
            message: error.message
        });
    }
});

// Status route
app.get('/api/status', (req, res) => {
    res.json({
        status: 'running',
        apis: {
            sportsapi360: {
                configured: !!SPORTSAPI360_KEY,
                key_name: 'FOOTBALL_API_V1_KEY'
            },
           
