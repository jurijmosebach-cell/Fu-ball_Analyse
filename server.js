// server.js — Optimierte Berechnungen MIT KORREKTIERTER TREND-ANALYSE
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// API Key
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_API_KEY;

// Middleware
app.use(express.static(__dirname));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        api: 'football-data.org'
    });
});

// Cache
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000;

// Football-Data.org Service
class FootballDataService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.football-data.org/v4';
    }

    async getMatchesByDate(date) {
        if (!this.apiKey) {
            throw new Error('Football-Data.org API Key nicht konfiguriert');
        }

        try {
            const dateFrom = new Date(date);
            const dateTo = new Date(date);
            dateTo.setDate(dateTo.getDate() + 2);

            const url = `${this.baseURL}/matches?dateFrom=${dateFrom.toISOString().split('T')[0]}&dateTo=${dateTo.toISOString().split('T')[0]}`;
            
            console.log('🔗 Fetching from Football-Data.org...');

            const response = await fetch(url, {
                headers: {
                    'X-Auth-Token': this.apiKey,
                    'Accept': 'application/json'
                },
                timeout: 10000
            });

            console.log('📡 Response Status:', response.status, response.statusText);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            const filteredMatches = data.matches?.filter(match => {
                if (!match.utcDate) return false;
                const matchDate = new Date(match.utcDate).toISOString().split('T')[0];
                return matchDate === date && (match.status === 'SCHEDULED' || match.status === 'TIMED');
            }) || [];

            console.log(`✅ Found ${filteredMatches.length} matches for ${date}`);
            return filteredMatches;

        } catch (error) {
            console.log('❌ Football-Data.org error:', error.message);
            throw error;
        }
    }
}

const footballDataService = new FootballDataService(FOOTBALL_DATA_KEY);

// OPTIMIERTE MATHEMATISCHE FUNKTIONEN

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

// OPTIMIERTE xG-SCHÄTZUNG mit Team-Stärken
const TEAM_STRENGTHS = {
    // Premier League
    "Manchester City": { attack: 2.4, defense: 0.8 },
    "Liverpool": { attack: 2.3, defense: 0.9 },
    "Arsenal": { attack: 2.1, defense: 0.9 },
    "Chelsea": { attack: 1.8, defense: 1.2 },
    "Tottenham": { attack: 1.9, defense: 1.3 },
    "Manchester United": { attack: 1.7, defense: 1.4 },
    "Newcastle": { attack: 1.8, defense: 1.2 },
    "Brighton": { attack: 1.9, defense: 1.4 },
    "West Ham": { attack: 1.6, defense: 1.5 },
    "Aston Villa": { attack: 1.8, defense: 1.3 },
    "Sunderland": { attack: 1.2, defense: 1.8 },
    "Burnley": { attack: 1.1, defense: 1.9 },
    "Wolverhampton": { attack: 1.4, defense: 1.6 },
    "Hull City": { attack: 1.3, defense: 1.7 },
    "Portsmouth": { attack: 1.2, defense: 1.8 },
    
    // Bundesliga - KORRIGIERT mit besseren Differenzierungen
    "Bayern Munich": { attack: 2.6, defense: 0.7 },
    "Borussia Dortmund": { attack: 2.2, defense: 1.1 },
    "RB Leipzig": { attack: 2.0, defense: 1.2 },
    "Bayer Leverkusen": { attack: 2.1, defense: 1.0 },
    "Union Berlin": { attack: 1.3, defense: 1.6 },
    "Heidenheim": { attack: 1.2, defense: 1.7 },
    "Mönchengladbach": { attack: 1.5, defense: 1.5 },
    "Köln": { attack: 1.3, defense: 1.6 },
    "Frankfurt": { attack: 1.7, defense: 1.3 },
    
    // La Liga
    "Real Madrid": { attack: 2.3, defense: 0.8 },
    "Barcelona": { attack: 2.2, defense: 0.9 },
    "Atletico Madrid": { attack: 1.8, defense: 0.9 },
    "Villarreal": { attack: 1.7, defense: 1.4 },
    "Espanyol": { attack: 1.4, defense: 1.5 },
    "Sevilla": { attack: 1.6, defense: 1.3 },
    
    // Serie A
    "Inter Milan": { attack: 2.1, defense: 0.9 },
    "Juventus": { attack: 1.9, defense: 1.0 },
    "AC Milan": { attack: 1.9, defense: 1.1 },
    "Napoli": { attack: 1.8, defense: 1.2 },
    "Roma": { attack: 1.7, defense: 1.3 },
    "Torino": { attack: 1.4, defense: 1.4 },
    "Parma": { attack: 1.3, defense: 1.5 },
    "Lazio": { attack: 1.6, defense: 1.2 },
    
    // Ligue 1
    "PSG": { attack: 2.4, defense: 0.9 },
    "Marseille": { attack: 1.8, defense: 1.3 },
    "Brest": { attack: 1.5, defense: 1.4 },
    "Monaco": { attack: 1.9, defense: 1.2 },
    "Lyon": { attack: 1.7, defense: 1.4 },
    
    "default": { attack: 1.5, defense: 1.5 }
};

function getTeamStrength(teamName) {
    for (const [team, strength] of Object.entries(TEAM_STRENGTHS)) {
        if (teamName.includes(team)) {
            return strength;
        }
    }
    return TEAM_STRENGTHS.default;
}

function estimateXG(homeTeam, awayTeam, isHome = true, league = "") {
    const homeStrength = getTeamStrength(homeTeam);
    const awayStrength = getTeamStrength(awayTeam);
    
    // Realistischere xG Berechnung basierend auf Team-Stärken
    let homeXG = homeStrength.attack * (1 - awayStrength.defense / 3);
    let awayXG = awayStrength.attack * (1 - homeStrength.defense / 3);
    
    // KORRIGIERT: Realistischeren Heimvorteil (reduziert)
    const homeAdvantage = isHome ? 0.15 : -0.10;
    homeXG += homeAdvantage;
    awayXG -= homeAdvantage;
    
    // Liga-Faktoren für realistischere Werte
    const LEAGUE_FACTORS = {
        "Premier League": 1.0,
        "Bundesliga": 1.05,
        "La Liga": 0.95,
        "Serie A": 0.90,
        "Ligue 1": 1.0,
        "Championship": 0.95,
        "Champions League": 1.1,
        "Europa League": 1.05
    };
    
    const leagueFactor = LEAGUE_FACTORS[league] || 1.0;
    homeXG *= leagueFactor;
    awayXG *= leagueFactor;
    
    // Sicherstellen, dass Werte im realistischen Bereich bleiben
    homeXG = Math.max(0.3, Math.min(3.5, homeXG));
    awayXG = Math.max(0.3, Math.min(3.0, awayXG));
    
    return {
        home: +homeXG.toFixed(2),
        away: +awayXG.toFixed(2)
    };
}

// OPTIMIERTE WAHRSCHEINLICHKEITSBERECHNUNG
function computeMatchOutcomeProbs(homeXG, awayXG) {
    let homeProb = 0, drawProb = 0, awayProb = 0;
    
    // Erweiterte Poisson-Berechnung für genauere Ergebnisse
    for (let i = 0; i <= 8; i++) {
        for (let j = 0; j <= 8; j++) {
            const p = poisson(i, homeXG) * poisson(j, awayXG);
            if (i > j) homeProb += p;
            else if (i === j) drawProb += p;
            else awayProb += p;
        }
    }
    
    // Korrektur für Rundungsfehler
    const total = homeProb + drawProb + awayProb;
    if (total < 0.99 || total > 1.01) {
        const correction = 1 / total;
        homeProb *= correction;
        drawProb *= correction;
        awayProb *= correction;
    }
    
    return {
        home: +homeProb.toFixed(4),
        draw: +drawProb.toFixed(4),
        away: +awayProb.toFixed(4)
    };
}

// OPTIMIERTE OVER/UNDER BERECHNUNG
function computeOver25Prob(homeXG, awayXG) {
    let pLe2 = 0;
    // Genauere Berechnung für 2 oder weniger Tore
    for (let i = 0; i <= 2; i++) {
        for (let j = 0; j <= (2 - i); j++) {
            pLe2 += poisson(i, homeXG) * poisson(j, awayXG);
        }
    }
    return +(1 - pLe2).toFixed(4);
}

// OPTIMIERTE BTTS BERECHNUNG
function computeBTTS(homeXG, awayXG) {
    // Wahrscheinlichkeit, dass beide Teams mindestens 1 Tor schießen
    const pHomeScores = 1 - poisson(0, homeXG);
    const pAwayScores = 1 - poisson(0, awayXG);
    const bttsYes = pHomeScores * pAwayScores;
    
    return +(bttsYes.toFixed(4));
}

// KORRIGIERTE TREND-ANALYSE - REALISTISCH
function computeTrend(prob, homeXG, awayXG, homeTeam, awayTeam) {
    const { home, draw, away } = prob;
    
    // 1. Primär nach höchster Wahrscheinlichkeit entscheiden
    const maxProb = Math.max(home, draw, away);
    
    if (maxProb === home) {
        // Heimstärke basierend auf Wahrscheinlichkeit und xG-Verhältnis
        const homeDominance = homeXG / awayXG;
        if (home > 0.6 && homeDominance > 1.8) return "Strong Home";
        if (home > 0.5 && homeDominance > 1.3) return "Home";
        return "Slight Home";
    } 
    else if (maxProb === away) {
        // Auswärtsstärke basierend auf Wahrscheinlichkeit und xG-Verhältnis
        const awayDominance = awayXG / homeXG;
        if (away > 0.6 && awayDominance > 1.8) return "Strong Away";
        if (away > 0.5 && awayDominance > 1.3) return "Away";
        return "Slight Away";
    }
    else {
        // Unentschieden Tendenz
        if (draw > 0.35) return "Draw";
        return "Balanced";
    }
}

function calculateValue(probability, odds) {
    if (!odds || odds <= 1) return 0;
    return +((probability * odds) - 1).toFixed(4);
}

// Beste Wett-Option finden
function findBestBet(prob, value, odds) {
    const options = [
        { type: 'home', probability: prob.home, value: value.home, odds: odds.home },
        { type: 'draw', probability: prob.draw, value: value.draw, odds: odds.draw },
        { type: 'away', probability: prob.away, value: value.away, odds: odds.away },
        { type: 'over25', probability: prob.over25, value: value.over25, odds: odds.over25 },
        { type: 'under25', probability: 1 - prob.over25, value: value.under25, odds: 2.0 }
    ];
    
    const bestValueOption = options.reduce((best, current) => 
        current.value > best.value ? current : best
    );
    
    const bestProbOption = options.reduce((best, current) => 
        current.probability > best.probability ? current : best
    );
    
    return {
        bestValue: bestValueOption,
        bestProbability: bestProbOption,
        allOptions: options
    };
}

function getFlag(teamName) {
    const flags = {
        "Manchester": "gb", "Liverpool": "gb", "Chelsea": "gb", "Arsenal": "gb", 
        "Tottenham": "gb", "Newcastle": "gb", "Brighton": "gb", "West Ham": "gb",
        "Crystal Palace": "gb", "Aston Villa": "gb", "Sunderland": "gb", "Burnley": "gb",
        "Wolverhampton": "gb", "Hull City": "gb", "Portsmouth": "gb",
        "Bayern": "de", "Dortmund": "de", "Leipzig": "de", "Leverkusen": "de", 
        "Frankfurt": "de", "Wolfsburg": "de", "Stuttgart": "de", "Bremen": "de",
        "Union Berlin": "de", "Heidenheim": "de", "Mönchengladbach": "de", "Köln": "de",
        "Real": "es", "Barcelona": "es", "Atletico": "es", "Sevilla": "es", 
        "Valencia": "es", "Villarreal": "es", "Athletic": "es", "Espanyol": "es",
        "Juventus": "it", "Inter": "it", "Milan": "it", "Napoli": "it", 
        "Roma": "it", "Lazio": "it", "Fiorentina": "it", "Torino": "it", "Parma": "it",
        "PSG": "fr", "Marseille": "fr", "Monaco": "fr", "Lyon": "fr", 
        "Lille": "fr", "Nice": "fr", "Rennes": "fr", "Brest": "fr",
        "Ajax": "nl", "PSV": "nl", "Feyenoord": "nl",
        "Benfica": "pt", "Porto": "pt", "Sporting": "pt"
    };
    
    for (const [key, value] of Object.entries(flags)) {
        if (teamName.includes(key)) return value;
    }
    return "eu";
}

// Haupt-API Route mit optimierten Berechnungen
app.get('/api/games', async (req, res) => {
    try {
        const requestedDate = req.query.date || new Date().toISOString().split('T')[0];
        console.log('🎯 API Request for date:', requestedDate);
        
        const cacheKey = `games-${requestedDate}`;
        
        const cached = cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
            console.log('✅ Serving from cache');
            return res.json({ 
                response: cached.data,
                info: { source: 'cache', date: requestedDate }
            });
        }
        
        if (!FOOTBALL_DATA_KEY) {
            return res.status(400).json({
                error: 'API Key nicht konfiguriert',
                message: 'Bitte setze FOOTBALL_DATA_API_KEY Environment Variable'
            });
        }
        
        console.log('🔄 Fetching real matches from Football-Data.org...');
        const matches = await footballDataService.getMatchesByDate(requestedDate);
        
        if (matches.length === 0) {
            return res.json({
                response: [],
                info: {
                    date: requestedDate,
                    total: 0,
                    source: "football_data",
                    message: "Keine Spiele für dieses Datum gefunden"
                }
            });
        }
        
        const processedGames = matches.map((match) => {
            const homeTeam = match.homeTeam?.name || 'Unknown Home';
            const awayTeam = match.awayTeam?.name || 'Unknown Away';
            const league = match.competition?.name || 'Unknown League';
            
            // OPTIMIERTE xG-BERECHNUNG
            const xg = estimateXG(homeTeam, awayTeam, true, league);
            
            // OPTIMIERTE WAHRSCHEINLICHKEITEN
            const prob = computeMatchOutcomeProbs(xg.home, xg.away);
            const over25 = computeOver25Prob(xg.home, xg.away);
            const btts = computeBTTS(xg.home, xg.away);
            
            // KORRIGIERTE TREND-ANALYSE
            const trend = computeTrend(prob, xg.home, xg.away, homeTeam, awayTeam);
            
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
            
            const bestBet = findBestBet(prob, value, odds);
            
            return {
                id: match.id,
                home: homeTeam,
                away: awayTeam,
                league: league,
                date: match.utcDate,
                homeLogo: match.homeTeam?.crest || `https://flagcdn.com/w40/${getFlag(homeTeam)}.png`,
                awayLogo: match.awayTeam?.crest || `https://flagcdn.com/w40/${getFlag(awayTeam)}.png`,
                homeXG: xg.home,
                awayXG: xg.away,
                prob,
                value,
                odds,
                btts,
                trend,
                over25,
                under25: 1 - over25,
                status: match.status,
                source: "football_data",
                competition: match.competition?.name,
                matchday: match.matchday,
                season: match.season?.currentMatchday,
                bestBet: bestBet.bestValue,
                highestProbability: bestBet.bestProbability,
                analysis: {
                    homeWinProbability: prob.home,
                    awayWinProbability: prob.away,
                    drawProbability: prob.draw,
                    expectedGoals: xg.home + xg.away,
                    goalExpectancy: `${xg.home}-${xg.away}`
                }
            };
        });
        
        const sortBy = req.query.sortBy || 'value';
        
        if (sortBy === 'probability') {
            processedGames.sort((a, b) => {
                const maxProbA = Math.max(a.prob.home, a.prob.away, a.prob.draw);
                const maxProbB = Math.max(b.prob.home, b.prob.away, b.prob.draw);
                return maxProbB - maxProbA;
            });
            console.log('📊 Sorted by highest probability');
        } else if (sortBy === 'goals') {
            processedGames.sort((a, b) => {
                const goalsA = a.homeXG + a.awayXG;
                const goalsB = b.homeXG + b.awayXG;
                return goalsB - goalsA;
            });
            console.log('📊 Sorted by expected goals');
        } else {
            processedGames.sort((a, b) => {
                const maxValueA = Math.max(a.value.home, a.value.draw, a.value.away, a.value.over25);
                const maxValueB = Math.max(b.value.home, b.value.draw, b.value.away, b.value.over25);
                return maxValueB - maxValueA;
            });
            console.log('📊 Sorted by best value');
        }
        
        console.log(`📊 Processed ${processedGames.length} real matches (sorted by: ${sortBy})`);
        
        cache.set(cacheKey, {
            timestamp: Date.now(),
            data: processedGames
        });
        
        res.json({ 
            response: processedGames,
            info: {
                date: requestedDate,
                total: processedGames.length,
                source: "football_data",
                sort_by: sortBy,
                message: `Echte Spiele mit optimierten Berechnungen - sortiert nach: ${sortBy === 'probability' ? 'Siegwahrscheinlichkeit' : sortBy === 'goals' ? 'erwarteten Toren' : 'Best Value'}`
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

// API Test Route
app.get('/api/test', async (req, res) => {
    try {
        if (!FOOTBALL_DATA_KEY) {
            return res.json({ 
                error: 'API Key nicht konfiguriert',
                hint: 'Setze FOOTBALL_DATA_API_KEY Environment Variable'
            });
        }
        
        const today = new Date().toISOString().split('T')[0];
        const testData = await footballDataService.getMatchesByDate(today);
        
        res.json({
            status: 'success',
            api_configured: true,
            test_date: today,
            total_matches: testData.length,
            sample_matches: testData.slice(0, 3).map(match => ({
                home: match.homeTeam?.name,
                away: match.awayTeam?.name,
                league: match.competition?.name,
                date: match.utcDate,
                status: match.status
            }))
        });
        
    } catch (error) {
        res.json({ 
            error: error.message,
            api_configured: !!FOOTBALL_DATA_KEY
        });
    }
});

// Status Route
app.get('/api/status', (req, res) => {
    res.json({
        status: 'running',
        api: {
            football_data: {
                configured: !!FOOTBALL_DATA_KEY,
                status: FOOTBALL_DATA_KEY ? 'active' : 'missing_key'
            }
        },
        sorting_options: ['value', 'probability', 'goals'],
        version: 'korrigierte_trend_analyse_v2'
    });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔑 Football-Data.org API: ${FOOTBALL_DATA_KEY ? '✅ Configured' : '❌ MISSING'}`);
    
    if (FOOTBALL_DATA_KEY) {
        console.log(`🌐 App verfügbar: https://your-app.onrender.com`);
        console.log(`🔗 Test: https://your-app.onrender.com/api/test`);
        console.log(`📊 KORRIGIERTE 
