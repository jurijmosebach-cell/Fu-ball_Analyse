// Nur diese Importe behalten:
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { KIAnalyse } from './ki-module.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// API Keys
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_API_KEY;
const SPORTS_DB_KEY = process.env.THE_SPORTS_DB_KEY || '3';

// KI-Modul initialisieren
const kiAnalyse = new KIAnalyse();

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
        version: '2.0.0',
        features: ['KI-Analyse', 'Machine Learning', 'Erweiterte Prognosen']
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

// The Sports DB Service
class SportsDBService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://www.thesportsdb.com/api/v1/json';
    }

    async searchTeam(teamName) {
        try {
            const searchUrl = `${this.baseURL}/${this.apiKey}/searchteams.php?t=${encodeURIComponent(teamName)}`;
            console.log(`🔍 Searching SportsDB for: ${teamName}`);
            
            const response = await fetch(searchUrl, { timeout: 8000 });
            const data = await response.json();
            
            return data.teams?.[0] || null;
        } catch (error) {
            console.log(`❌ SportsDB search error for ${teamName}:`, error.message);
            return null;
        }
    }

    async getTeamLastMatches(teamId, count = 5) {
        try {
            const matchesUrl = `${this.baseURL}/${this.apiKey}/eventslast.php?id=${teamId}&limit=${count}`;
            const response = await fetch(matchesUrl, { timeout: 8000 });
            const data = await response.json();
            
            return data.results || [];
        } catch (error) {
            console.log(`❌ SportsDB matches error for team ${teamId}:`, error.message);
            return [];
        }
    }

    async getTeamForm(teamName) {
        try {
            const team = await this.searchTeam(teamName);
            if (!team) return null;
            
            const lastMatches = await this.getTeamLastMatches(team.idTeam, 5);
            
            let points = 0;
            let goalsFor = 0;
            let goalsAgainst = 0;
            let shotsFor = 0;
            let shotsAgainst = 0;
            
            lastMatches.forEach(match => {
                const teamScore = parseInt(match.intHomeScore) || 0;
                const opponentScore = parseInt(match.intAwayScore) || 0;
                
                goalsFor += teamScore;
                goalsAgainst += opponentScore;
                
                if (teamScore > opponentScore) points += 3;
                else if (teamScore === opponentScore) points += 1;
            });
            
            return {
                teamId: team.idTeam,
                teamName: team.strTeam,
                last5Matches: lastMatches.length,
                points: points,
                maxPoints: lastMatches.length * 3,
                form: points / (lastMatches.length * 3) || 0.5,
                goalsFor: goalsFor,
                goalsAgainst: goalsAgainst,
                goalDifference: goalsFor - goalsAgainst,
                avgGoalsFor: goalsFor / Math.max(lastMatches.length, 1),
                avgGoalsAgainst: goalsAgainst / Math.max(lastMatches.length, 1)
            };
        } catch (error) {
            console.log(`❌ SportsDB form analysis error for ${teamName}:`, error.message);
            return null;
        }
    }
}

const footballDataService = new FootballDataService(FOOTBALL_DATA_KEY);
const sportsDBService = new SportsDBService(SPORTS_DB_KEY);
// ERWEITERTE TEAM-STRENGTHS MIT KI-DATEN
const TEAM_STRENGTHS = {
    "Manchester City": { attack: 2.4, defense: 0.8, consistency: 0.9 },
    "Liverpool": { attack: 2.3, defense: 0.9, consistency: 0.85 },
    "Arsenal": { attack: 2.1, defense: 0.9, consistency: 0.88 },
    "Chelsea": { attack: 1.8, defense: 1.2, consistency: 0.75 },
    "Tottenham": { attack: 1.9, defense: 1.3, consistency: 0.78 },
    "Manchester United": { attack: 1.7, defense: 1.4, consistency: 0.72 },
    "Newcastle": { attack: 1.8, defense: 1.2, consistency: 0.8 },
    "Brighton": { attack: 1.9, defense: 1.4, consistency: 0.82 },
    "West Ham": { attack: 1.6, defense: 1.5, consistency: 0.7 },
    "Aston Villa": { attack: 1.8, defense: 1.3, consistency: 0.79 },
    "Bayern Munich": { attack: 2.6, defense: 0.7, consistency: 0.92 },
    "Borussia Dortmund": { attack: 2.2, defense: 1.1, consistency: 0.84 },
    "RB Leipzig": { attack: 2.0, defense: 1.2, consistency: 0.81 },
    "Bayer Leverkusen": { attack: 2.1, defense: 1.0, consistency: 0.83 },
    "Real Madrid": { attack: 2.3, defense: 0.8, consistency: 0.91 },
    "Barcelona": { attack: 2.2, defense: 0.9, consistency: 0.87 },
    "Atletico Madrid": { attack: 1.8, defense: 0.9, consistency: 0.85 },
    "Inter Milan": { attack: 2.1, defense: 0.9, consistency: 0.86 },
    "Juventus": { attack: 1.9, defense: 1.0, consistency: 0.82 },
    "AC Milan": { attack: 1.9, defense: 1.1, consistency: 0.8 },
    "PSG": { attack: 2.4, defense: 0.9, consistency: 0.88 },
    "default": { attack: 1.5, defense: 1.5, consistency: 0.7 }
};

function getTeamStrength(teamName) {
    for (const [team, strength] of Object.entries(TEAM_STRENGTHS)) {
        if (teamName.includes(team)) {
            return strength;
        }
    }
    return TEAM_STRENGTHS.default;
}

// KI-OPTIMIERTE xG-BERECHNUNG
async function estimateXGWithKI(homeTeam, awayTeam, isHome = true, league = "") {
    const baseStrength = getTeamStrength(homeTeam);
    const awayStrength = getTeamStrength(awayTeam);
    
    let homeXG = baseStrength.attack * (1 - awayStrength.defense / 3);
    let awayXG = awayStrength.attack * (1 - baseStrength.defense / 3);
    
    // KI-Korrekturfaktoren
    const kiFactors = await kiAnalyse.calculateKIFactors(homeTeam, awayTeam, league);
    
    // Erweiterte Heimvorteilsberechnung
    const homeAdvantage = isHome ? 0.12 * kiFactors.homeAdvantage : -0.08;
    homeXG += homeAdvantage;
    awayXG -= homeAdvantage;
    
    // Form-Korrektur mit KI
    const homeForm = await sportsDBService.getTeamForm(homeTeam);
    const awayForm = await sportsDBService.getTeamForm(awayTeam);
    
    if (homeForm && awayForm) {
        const formCorrection = kiAnalyse.calculateFormCorrection(homeForm, awayForm);
        homeXG += formCorrection.home * kiFactors.formImpact;
        awayXG += formCorrection.away * kiFactors.formImpact;
    }
    
    // Liga-Faktoren
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
    
    // KI-Finalkorrektur
    const finalCorrection = kiAnalyse.finalPredictionCorrection(homeXG, awayXG, homeTeam, awayTeam);
    homeXG += finalCorrection.home;
    awayXG += finalCorrection.away;
    
    return {
        home: Math.max(0.3, Math.min(3.5, +homeXG.toFixed(2))),
        away: Math.max(0.3, Math.min(3.0, +awayXG.toFixed(2))),
        confidence: kiFactors.confidence,
        kiFactors: kiFactors
    };
}

// MATHEMATISCHE FUNKTIONEN
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
// ERWEITERTE WAHRSCHEINLICHKEITSBERECHNUNG
function computeMatchOutcomeProbs(homeXG, awayXG) {
    let homeProb = 0, drawProb = 0, awayProb = 0;
    
    for (let i = 0; i <= 8; i++) {
        for (let j = 0; j <= 8; j++) {
            const p = poisson(i, homeXG) * poisson(j, awayXG);
            if (i > j) homeProb += p;
            else if (i === j) drawProb += p;
            else awayProb += p;
        }
    }
    
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

// KORRIGIERTE OVER/UNDER BERECHNUNG
function computeOver25Prob(homeXG, awayXG) {
    let pLe2 = 0;
    
    for (let homeGoals = 0; homeGoals <= 10; homeGoals++) {
        for (let awayGoals = 0; awayGoals <= 10; awayGoals++) {
            const totalGoals = homeGoals + awayGoals;
            if (totalGoals <= 2) {
                pLe2 += poisson(homeGoals, homeXG) * poisson(awayGoals, awayXG);
            }
        }
    }
    
    const over25Prob = 1 - pLe2;
    return +(over25Prob.toFixed(4));
}

// BTTS BERECHNUNG
function computeBTTS(homeXG, awayXG) {
    const pHomeScores = 1 - poisson(0, homeXG);
    const pAwayScores = 1 - poisson(0, awayXG);
    const bttsYes = pHomeScores * pAwayScores;
    return +(bttsYes.toFixed(4));
}

// KI-TREND-ANALYSE
function computeKITrend(prob, homeXG, awayXG, homeTeam, awayTeam, kiFactors) {
    const { home, draw, away } = prob;
    
    // KI-gestützte Trend-Bestimmung
    const trendScore = kiAnalyse.calculateTrendScore(home, draw, away, homeXG, awayXG);
    
    if (trendScore.home > 0.7) return "Strong Home";
    if (trendScore.away > 0.7) return "Strong Away";
    if (trendScore.home > 0.6) return "Home";
    if (trendScore.away > 0.6) return "Away";
    if (trendScore.draw > 0.4 && trendScore.draw > trendScore.home && trendScore.draw > trendScore.away) {
        return "Draw";
    }
    if (Math.abs(trendScore.home - trendScore.away) < 0.1) {
        return "Balanced";
    }
    if (trendScore.home > trendScore.away) {
        return "Slight Home";
    }
    return "Slight Away";
}

function calculateValue(probability, odds) {
    if (!odds || odds <= 1) return 0;
    return +((probability * odds) - 1).toFixed(4);
}

// ODDS-GENERIERUNG
function generateRealisticOdds(prob) {
    const margin = 0.05; // 5% Buchmacher-Marge
    return {
        home: +(1 / (prob.home * (1 - margin))).toFixed(2),
        draw: +(1 / (prob.draw * (1 - margin))).toFixed(2),
        away: +(1 / (prob.away * (1 - margin))).toFixed(2),
        over25: +(1 / (prob.over25 * (1 - margin))).toFixed(2),
        under25: +(1 / ((1 - prob.over25) * (1 - margin))).toFixed(2)
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
// HAUPT-API ROUTE
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

        console.log('🤖 Starting KI analysis for', matches.length, 'matches...');
        
        // KI-Analyse für alle Spiele
        const enhancedGames = await Promise.all(
            matches.map(async (match) => {
                try {
                    const homeTeam = match.homeTeam?.name || "Unknown Home";
                    const awayTeam = match.awayTeam?.name || "Unknown Away";
                    const league = match.competition?.name || "Unknown League";
                    
                    // KI-xG-Berechnung
                    const xgData = await estimateXGWithKI(homeTeam, awayTeam, true, league);
                    
                    // Wahrscheinlichkeiten berechnen
                    const prob = computeMatchOutcomeProbs(xgData.home, xgData.away);
                    const over25Prob = computeOver25Prob(xgData.home, xgData.away);
                    const bttsProb = computeBTTS(xgData.home, xgData.away);
                    
                    // Odds generieren
                    const odds = generateRealisticOdds({
                        ...prob,
                        over25: over25Prob
                    });
                    
                    // Value berechnen
                    const value = {
                        home: calculateValue(prob.home, odds.home),
                        draw: calculateValue(prob.draw, odds.draw),
                        away: calculateValue(prob.away, odds.away),
                        over25: calculateValue(over25Prob, odds.over25),
                        under25: calculateValue(1 - over25Prob, odds.under25)
                    };
                    
                    // KI-Trend bestimmen
                    const trend = computeKITrend(prob, xgData.home, xgData.away, homeTeam, awayTeam, xgData.kiFactors);
                    
                    return {
                        id: match.id,
                        home: homeTeam,
                        away: awayTeam,
                        league: league,
                        date: match.utcDate,
                        homeLogo: `https://flagsapi.com/${getFlag(homeTeam)}/flat/64.png`,
                        awayLogo: `https://flagsapi.com/${getFlag(awayTeam)}/flat/64.png`,
                        homeXG: xgData.home,
                        awayXG: xgData.away,
                        prob: prob,
                        over25: over25Prob,
                        btts: bttsProb,
                        value: value,
                        odds: odds,
                        trend: trend,
                        confidence: xgData.confidence,
                        kiScore: xgData.kiFactors.kiScore,
                        analysis: kiAnalyse.generateAnalysis(homeTeam, awayTeam, prob, trend, xgData.confidence)
                    };
                } catch (error) {
                    console.log(`❌ Error processing match ${match.id}:`, error.message);
                    return null;
                }
            })
        );

        // Nullwerte filtern und nach KI-Score sortieren
        const validGames = enhancedGames.filter(game => game !== null);
        validGames.sort((a, b) => (b.kiScore || 0) - (a.kiScore || 0));

        console.log(`✅ KI analysis completed. Processed ${validGames.length} games`);

        const responseData = {
            response: validGames,
            info: {
                date: requestedDate,
                total: validGames.length,
                source: "football_data+ki_analysis",
                ki_version: "2.0.0",
                timestamp: new Date().toISOString()
            }
        };

        // Im Cache speichern
        cache.set(cacheKey, {
            data: responseData.response,
            timestamp: Date.now()
        });

        res.json(responseData);

    } catch (error) {
        console.error('❌ API Error:', error);
        res.status(500).json({
            error: error.message,
            info: {
                date: req.query.date,
                source: "error",
                message: "Fehler bei der Datenverarbeitung"
            }
        });
    }
});

// NEUE ROUTE FÜR DETAILLIERTE KI-ANALYSE
app.get('/api/ki-analysis/:matchId', async (req, res) => {
    try {
        const matchId = req.params.matchId;
        const detailedAnalysis = await kiAnalyse.getDetailedAnalysis(matchId);
        
        res.json({
            matchId: matchId,
            analysis: detailedAnalysis,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// Server starten
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🤖 KI Football Analysis Tool v2.0.0`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
});
