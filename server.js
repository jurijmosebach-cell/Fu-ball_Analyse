// server.js — Optimierte Football-Data.org Version
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
const CACHE_DURATION = 10 * 60 * 1000; // 10 Minuten

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
            // Zeitraum für die Suche (aktueller Tag + 2 Tage)
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
            
            // Filtere Spiele für das gewünschte Datum
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

// Mathematische Funktionen für Wettanalyse
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
    
    // Liga-Faktoren für genauere Schätzung
    const LEAGUE_FACTORS = {
        "Premier League": 1.05, 
        "Bundesliga": 1.10, 
        "La Liga": 1.00, 
        "Serie A": 0.95, 
        "Ligue 1": 1.02, 
        "Champions League": 1.08,
        "Europa League": 1.06,
        "Eredivisie": 1.12,
        "Primeira Liga": 0.94
    };
    
    const leagueFactor = LEAGUE_FACTORS[league] || 1.0;
    const homeAdvantage = isHome ? 0.15 : -0.10;
    
    // Team-Stärken basierend auf bekannten Teams
    const strongTeams = [
        "Man City", "Liverpool", "Arsenal", "Bayern", "Real Madrid", 
        "Barcelona", "PSG", "Inter", "Juventus", "Dortmund"
    ];
    const weakTeams = [
        "Bochum", "Luton", "Sheffield", "Burnley", "Mainz", 
        "Cadiz", "Salernitana", "Clermont", "Empoli"
    ];
    
    let teamAdjustment = 0;
    if (strongTeams.some(team => teamName.includes(team))) teamAdjustment += 0.3;
    if (weakTeams.some(team => teamName.includes(team))) teamAdjustment -= 0.3;
    
    const raw = (base + homeAdvantage + teamAdjustment) * leagueFactor;
    return +Math.max(0.4, Math.min(3.5, raw)).toFixed(2);
}

function computeMatchOutcomeProbs(homeLambda, awayLambda) {
    let homeProb = 0, drawProb = 0, awayProb = 0;
    
    // Poisson-Verteilung für Spielausgänge
    for (let i = 0; i <= 6; i++) {
        for (let j = 0; j <= 6; j++) {
            const p = poisson(i, homeLambda) * poisson(j, awayLambda);
            if (i > j) homeProb += p;
            else if (i === j) drawProb += p;
            else awayProb += p;
        }
    }
    
    // Normalisieren
    const total = homeProb + drawProb + awayProb;
    return {
        home: +(homeProb / total).toFixed(4),
        draw: +(drawProb / total).toFixed(4),
        away: +(awayProb / total).toFixed(4)
    };
}

function computeOver25Prob(homeLambda, awayLambda) {
    let pLe2 = 0;
    // Wahrscheinlichkeit für 2 oder weniger Tore
    for (let i = 0; i <= 2; i++) {
        for (let j = 0; j <= (2 - i); j++) {
            pLe2 += poisson(i, homeLambda) * poisson(j, awayLambda);
        }
    }
    return +(1 - pLe2).toFixed(4);
}

function computeBTTS(homeLambda, awayLambda) {
    // Both Teams To Score Wahrscheinlichkeit
    const pHomeScore = 1 - poisson(0, homeLambda);
    const pAwayScore = 1 - poisson(0, awayLambda);
    return +(pHomeScore * pAwayScore).toFixed(4);
}

function calculateValue(probability, odds) {
    // Value = (Probability * Odds) - 1
    if (!odds || odds <= 1) return 0;
    return +((probability * odds) - 1).toFixed(4);
}

function getFlag(teamName) {
    const flags = {
        // England
        "Manchester": "gb", "Liverpool": "gb", "Chelsea": "gb", "Arsenal": "gb", 
        "Tottenham": "gb", "Newcastle": "gb", "Brighton": "gb", "West Ham": "gb",
        "Crystal Palace": "gb", "Aston Villa": "gb",
        
        // Deutschland
        "Bayern": "de", "Dortmund": "de", "Leipzig": "de", "Leverkusen": "de", 
        "Frankfurt": "de", "Wolfsburg": "de", "Stuttgart": "de", "Bremen": "de",
        
        // Spanien
        "Real": "es", "Barcelona": "es", "Atletico": "es", "Sevilla": "es", 
        "Valencia": "es", "Villarreal": "es", "Athletic": "es",
        
        // Italien
        "Juventus": "it", "Inter": "it", "Milan": "it", "Napoli": "it", 
        "Roma": "it", "Lazio": "it", "Fiorentina": "it",
        
        // Frankreich
        "PSG": "fr", "Marseille": "fr", "Monaco": "fr", "Lyon": "fr", 
        "Lille": "fr", "Nice": "fr", "Rennes": "fr",
        
        // Niederlande
        "Ajax": "nl", "PSV": "nl", "Feyenoord": "nl",
        
        // Portugal
        "Benfica": "pt", "Porto": "pt", "Sporting": "pt"
    };
    
    for (const [key, value] of Object.entries(flags)) {
        if (teamName.includes(key)) return value;
    }
    return "eu"; // Fallback
}

// Haupt-API Route
app.get('/api/games', async (req, res) => {
    try {
        const requestedDate = req.query.date || new Date().toISOString().split('T')[0];
        console.log('🎯 API Request for date:', requestedDate);
        
        const cacheKey = `games-${requestedDate}`;
        
        // Cache prüfen
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
                message: 'Bitte setze FOOTBALL_DATA_API_KEY Environment Variable',
                solution: 'Kostenloser Key verfügbar unter: https://www.football-data.org/'
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
        
        // Verarbeite die echten Spiele
        const processedGames = matches.map((match) => {
            const homeTeam = match.homeTeam?.name || 'Unknown Home';
            const awayTeam = match.awayTeam?.name || 'Unknown Away';
            const league = match.competition?.name || 'Unknown League';
            
            // xG Schätzung
            const homeXG = estimateXG(homeTeam, true, league);
            const awayXG = estimateXG(awayTeam, false, league);
            
            // Wahrscheinlichkeiten berechnen
            const prob = computeMatchOutcomeProbs(homeXG, awayXG);
            const over25 = computeOver25Prob(homeXG, awayXG);
            const btts = computeBTTS(homeXG, awayXG);
            
            // Realistische Odds basierend auf Wahrscheinlichkeiten (mit Buchmacher-Marge)
            const odds = {
                home: +(1 / prob.home * 0.92).toFixed(2),
                draw: +(1 / prob.draw * 0.92).toFixed(2),
                away: +(1 / prob.away * 0.92).toFixed(2),
                over25: +(1 / over25 * 0.92).toFixed(2)
            };
            
            // Value Berechnung
            const value = {
                home: calculateValue(prob.home, odds.home),
                draw: calculateValue(prob.draw, odds.draw),
                away: calculateValue(prob.away, odds.away),
                over25: calculateValue(over25, odds.over25),
                under25: calculateValue(1 - over25, 2.0)
            };
            
            return {
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
                over25,
                under25: 1 - over25,
                status: match.status,
                source: "football_data",
                // Zusätzliche Daten
                competition: match.competition?.name,
                matchday: match.matchday,
                season: match.season?.currentMatchday
            };
        });
        
        // Nach bestem Value sortieren
        processedGames.sort((a, b) => {
            const maxValueA = Math.max(a.value.home, a.value.draw, a.value.away, a.value.over25);
            const maxValueB = Math.max(b.value.home, b.value.draw, b.value.away, b.value.over25);
            return maxValueB - maxValueA;
        });
        
        console.log(`📊 Processed ${processedGames.length} real matches`);
        
        // Im Cache speichern
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
                message: "Echte Spiele von Football-Data.org",
                features: [
                    "Poisson Wahrscheinlichkeiten",
                    "Expected Goals (xG) Modell",
                    "Value Betting Identifikation",
                    "Echte Wett-Odds Simulation"
                ]
            }
        });
        
    } catch (error) {
        console.error('❌ Error in /api/games:', error);
        res.status(500).json({ 
            error: 'Fehler beim Laden der Spiele',
            message: error.message,
            solution: 'Prüfe den API Key und die Internetverbindung'
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
        features: [
            'Live Spiel-Daten',
            'Poisson Wahrscheinlichkeiten', 
            'Value Betting Analyse',
            'Expected Goals Modell'
        ],
        version: 'football_data_v1'
    });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔑 Football-Data.org API: ${FOOTBALL_DATA_KEY ? '✅ Configured' : '❌ MISSING'}`);
    
    if (FOOTBALL_DATA_KEY) {
        console.log(`🌐 App verfügbar: https://your-app.onrender.com`);
        console.log(`🔗 Test: https://your-app.onrender.com/api/test`);
        console.log(`📊 Features: Poisson Model, xG, Value Betting`);
    } else {
        console.log(`❌ WICHTIG: FOOTBALL_DATA_API_KEY nicht gesetzt!`);
        console.log(`🔗 Hol dir einen kostenlosen Key: https://www.football-data.org/`);
    }
});

// Error Handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
