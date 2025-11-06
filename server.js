// server.js — Überarbeitete Analyse mit besseren Berechnungen
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

// VERBESSERTE MATHEMATISCHE FUNKTIONEN

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

// VERBESSERTE xG-SCHÄTZUNG mit Team-Stärken-Datenbank
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
    
    // Bundesliga
    "Bayern Munich": { attack: 2.5, defense: 0.7 },
    "Borussia Dortmund": { attack: 2.2, defense: 1.1 },
    "RB Leipzig": { attack: 2.0, defense: 1.2 },
    "Bayer Leverkusen": { attack: 2.1, defense: 1.0 },
    "Eintracht Frankfurt": { attack: 1.7, defense: 1.4 },
    
    // La Liga
    "Real Madrid": { attack: 2.3, defense: 0.8 },
    "Barcelona": { attack: 2.2, defense: 0.9 },
    "Atletico Madrid": { attack: 1.8, defense: 0.9 },
    "Sevilla": { attack: 1.6, defense: 1.3 },
    
    // Serie A
    "Inter Milan": { attack: 2.1, defense: 0.9 },
    "Juventus": { attack: 1.9, defense: 1.0 },
    "AC Milan": { attack: 1.9, defense: 1.1 },
    "Napoli": { attack: 1.8, defense: 1.2 },
    
    // Ligue 1
    "PSG": { attack: 2.4, defense: 0.9 },
    "Marseille": { attack: 1.8, defense: 1.3 },
    "Monaco": { attack: 1.9, defense: 1.4 },
    
    // Standardwerte für unbekannte Teams
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
    
    // Basis xG basierend auf Team-Stärken
    let homeXG = homeStrength.attack * (1 - awayStrength.defense / 3);
    let awayXG = awayStrength.attack * (1 - homeStrength.defense / 3);
    
    // Heimvorteil anpassen
    const homeAdvantage = isHome ? 0.25 : -0.15;
    homeXG += homeAdvantage;
    awayXG -= homeAdvantage;
    
    // Liga-Faktoren
    const LEAGUE_FACTORS = {
        "Premier League": 1.0,
        "Bundesliga": 1.05,  // Mehr Tore
        "La Liga": 0.95,     // Weniger Tore
        "Serie A": 0.90,     // Defensiver
        "Ligue 1": 1.0,
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

// VERBESSERTE WAHRSCHEINLICHKEITSBERECHNUNG
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
    
    // Korrektur für extreme Fälle
    const total = homeProb + drawProb + awayProb;
    if (total < 0.99) {
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

// VERBESSERTE OVER/UNDER BERECHNUNG
function computeGoalProbabilities(homeXG, awayXG) {
    const totalXG = homeXG + awayXG;
    
    // Wahrscheinlichkeiten für verschiedene Toranzahlen
    const probabilities = {
        over05: 0, over15: 0, over25: 0, over35: 0,
        exact0: 0, exact1: 0, exact2: 0, exact3: 0, exact4: 0
    };
    
    // Berechne exakte Torwahrscheinlichkeiten
    for (let i = 0; i <= 6; i++) {
        for (let j = 0; j <= 6; j++) {
            const p = poisson(i, homeXG) * poisson(j, awayXG);
            const totalGoals = i + j;
            
            if (totalGoals === 0) probabilities.exact0 += p;
            if (totalGoals === 1) probabilities.exact1 += p;
            if (totalGoals === 2) probabilities.exact2 += p;
            if (totalGoals === 3) probabilities.exact3 += p;
            if (totalGoals === 4) probabilities.exact4 += p;
            
            if (totalGoals > 0.5) probabilities.over05 += p;
            if (totalGoals > 1.5) probabilities.over15 += p;
            if (totalGoals > 2.5) probabilities.over25 += p;
            if (totalGoals > 3.5) probabilities.over35 += p;
        }
    }
    
    return probabilities;
}

// VERBESSERTE BTTS BERECHNUNG
function computeBTTS(homeXG, awayXG) {
    // Wahrscheinlichkeit, dass beide Teams mindestens 1 Tor schießen
    const pHomeScores = 1 - poisson(0, homeXG);
    const pAwayScores = 1 - poisson(0, awayXG);
    const bttsYes = pHomeScores * pAwayScores;
    
    return {
        yes: +bttsYes.toFixed(4),
        no: +(1 - bttsYes).toFixed(4)
    };
}

// VERBESSERTE TREND-ANALYSE
function computeAdvancedTrend(homeXG, awayXG, homeProb, awayProb, drawProb) {
    const xgDifference = homeXG - awayXG;
    const probDifference = homeProb - awayProb;
    const totalXG = homeXG + awayXG;
    
    // Stärke-Indikatoren
    const homeDominance = homeXG / (homeXG + awayXG);
    const expectedGoals = totalXG;
    
    // Trend-Bestimmung basierend auf mehreren Faktoren
    let trend = "";
    let confidence = 0;
    let reasoning = [];
    
    if (homeDominance > 0.6) {
        trend = "Strong Home";
        confidence = homeDominance;
        reasoning.push(`Heimstark (${(homeDominance * 100).toFixed(0)}% xG Dominanz)`);
    } else if (homeDominance > 0.55) {
        trend = "Home";
        confidence = homeDominance;
        reasoning.push(`Leichter Heimvorteil (${(homeDominance * 100).toFixed(0)}% xG Dominanz)`);
    } else if (homeDominance < 0.4) {
        trend = "Strong Away";
        confidence = 1 - homeDominance;
        reasoning.push(`Auswärtsstark (${((1 - homeDominance) * 100).toFixed(0)}% xG Dominanz)`);
    } else if (homeDominance < 0.45) {
        trend = "Away";
        confidence = 1 - homeDominance;
        reasoning.push(`Leichter Auswärtsvorteil (${((1 - homeDominance) * 100).toFixed(0)}% xG Dominanz)`);
    } else {
        trend = "Balanced";
        confidence = 0.5;
        reasoning.push("Ausgeglichene Mannschaftsstärken");
    }
    
    // Torreichheit hinzufügen
    if (expectedGoals > 3.5) {
        reasoning.push("Torreich erwartet");
    } else if (expectedGoals < 2.0) {
        reasoning.push("Wenige Tore erwartet");
    }
    
    return {
        trend,
        confidence: +confidence.toFixed(3),
        reasoning: reasoning.join(", "),
        homeDominance: +homeDominance.toFixed(3),
        expectedGoals: +expectedGoals.toFixed(2)
    };
}

// REALISTISCHE ODDS BERECHNUNG
function calculateRealisticOdds(probabilities, goalProbabilities, btts) {
    // Buchmacher-Marge (typisch 5-8%)
    const margin = 0.05; // 5% Marge
    
    // 1X2 Odds
    const homeOdds = 1 / (probabilities.home * (1 - margin));
    const drawOdds = 1 / (probabilities.draw * (1 - margin));
    const awayOdds = 1 / (probabilities.away * (1 - margin));
    
    // Over/Under Odds
    const over25Odds = 1 / (goalProbabilities.over25 * (1 - margin));
    const under25Odds = 1 / (goalProbabilities.under25 * (1 - margin));
    
    // BTTS Odds
    const bttsYesOdds = 1 / (btts.yes * (1 - margin));
    const bttsNoOdds = 1 / (btts.no * (1 - margin));
    
    return {
        home: +Math.max(1.1, Math.min(50, homeOdds)).toFixed(2),
        draw: +Math.max(1.1, Math.min(50, drawOdds)).toFixed(2),
        away: +Math.max(1.1, Math.min(50, awayOdds)).toFixed(2),
        over25: +Math.max(1.1, Math.min(10, over25Odds)).toFixed(2),
        under25: +Math.max(1.1, Math.min(10, under25Odds)).toFixed(2),
        bttsYes: +Math.max(1.1, Math.min(10, bttsYesOdds)).toFixed(2),
        bttsNo: +Math.max(1.1, Math.min(10, bttsNoOdds)).toFixed(2)
    };
}

// VALUE BERECHNUNG
function calculateValue(probability, odds) {
    if (!odds || odds <= 1) return 0;
    const value = (probability * odds) - 1;
    return +Math.max(-1, Math.min(2, value)).toFixed(4);
}

// BESTE WETT-OPTIONEN FINDEN
function findBestBets(probabilities, goalProbabilities, btts, odds) {
    const betOptions = [
        { type: 'home', probability: probabilities.home, odds: odds.home, market: '1X2' },
        { type: 'draw', probability: probabilities.draw, odds: odds.draw, market: '1X2' },
        { type: 'away', probability: probabilities.away, odds: odds.away, market: '1X2' },
        { type: 'over25', probability: goalProbabilities.over25, odds: odds.over25, market: 'Goals' },
        { type: 'under25', probability: goalProbabilities.under25, odds: odds.under25, market: 'Goals' },
        { type: 'btts_yes', probability: btts.yes, odds: odds.bttsYes, market: 'BTTS' },
        { type: 'btts_no', probability: btts.no, odds: odds.bttsNo, market: 'BTTS' }
    ];
    
    // Berechne Value für jede Option
    betOptions.forEach(bet => {
        bet.value = calculateValue(bet.probability, bet.odds);
    });
    
    // Finde beste Optionen
    const bestValue = [...betOptions].sort((a, b) => b.value - a.value)[0];
    const bestProbability = [...betOptions].sort((a, b) => b.probability - a.probability)[0];
    
    // Positive Value Wetten
    const positiveValueBets = betOptions.filter(bet => bet.value > 0.05);
    
    return {
        bestValue,
        bestProbability,
        positiveValueBets,
        allBets: betOptions
    };
}

function getFlag(teamName) {
    const flags = {
        "Manchester": "gb", "Liverpool": "gb", "Chelsea": "gb", "Arsenal": "gb", 
        "Tottenham": "gb", "Newcastle": "gb", "Brighton": "gb", "West Ham": "gb",
        "Crystal Palace": "gb", "Aston Villa": "gb",
        "Bayern": "de", "Dortmund": "de", "Leipzig": "de", "Leverkusen": "de", 
        "Frankfurt": "de", "Wolfsburg": "de", "Stuttgart": "de", "Bremen": "de",
        "Real": "es", "Barcelona": "es", "Atletico": "es", "Sevilla": "es", 
        "Valencia": "es", "Villarreal": "es", "Athletic": "es",
        "Juventus": "it", "Inter": "it", "Milan": "it", "Napoli": "it", 
        "Roma": "it", "Lazio": "it", "Fiorentina": "it",
        "PSG": "fr", "Marseille": "fr", "Monaco": "fr", "Lyon": "fr", 
        "Lille": "fr", "Nice": "fr", "Rennes": "fr",
        "Ajax": "nl", "PSV": "nl", "Feyenoord": "nl",
        "Benfica": "pt", "Porto": "pt", "Sporting": "pt"
    };
    
    for (const [key, value] of Object.entries(flags)) {
        if (teamName.includes(key)) return value;
    }
    return "eu";
}

// HAUPT-API ROUTE MIT VERBESSERTEN BERECHNUNGEN
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
            
            // VERBESSERTE xG-BERECHNUNG
            const xg = estimateXG(homeTeam, awayTeam, true, league);
            
            // VERBESSERTE WAHRSCHEINLICHKEITEN
            const probabilities = computeMatchOutcomeProbs(xg.home, xg.away);
            const goalProbabilities = computeGoalProbabilities(xg.home, xg.away);
            const btts = computeBTTS(xg.home, xg.away);
            
            // VERBESSERTE TREND-ANALYSE
            const trendAnalysis = computeAdvancedTrend(
                xg.home, xg.away, 
                probabilities.home, probabilities.away, probabilities.draw
            );
            
            // REALISTISCHE ODDS
            const odds = calculateRealisticOdds(probabilities, goalProbabilities, btts);
            
            // VALUE BERECHNUNG
            const value = {
                home: calculateValue(probabilities.home, odds.home),
                draw: calculateValue(probabilities.draw, odds.draw),
                away: calculateValue(probabilities.away, odds.away),
                over25: calculateValue(goalProbabilities.over25, odds.over25),
                under25: calculateValue(goalProbabilities.under25, odds.under25),
                bttsYes: calculateValue(btts.yes, odds.bttsYes),
                bttsNo: calculateValue(btts.no, odds.bttsNo)
            };
            
            // BESTE WETT-OPTIONEN
            const bestBets = findBestBets(probabilities, goalProbabilities, btts, odds);
            
            return {
                id: match.id,
                home: homeTeam,
                away: awayTeam,
                league: league,
                date: match.utcDate,
                homeLogo: match.homeTeam?.crest || `https://flagcdn.com/w40/${getFlag(homeTeam)}.png`,
                awayLogo: match.awayTeam?.crest || `https://flagcdn.com/w40/${getFlag(awayTeam)}.png`,
                
                // VERBESSERTE DATEN
                xg: xg,
                probabilities: probabilities,
                goalProbabilities: goalProbabilities,
                btts: btts,
                trend: trendAnalysis,
                odds: odds,
                value: value,
                bestBets: bestBets,
                
                status: match.status,
                source: "football_data",
                competition: match.competition?.name,
                matchday: match.matchday
            };
        });
        
        // SORTIERUNG NACH BESTER VALUE-WETTE
        processedGames.sort((a, b) => {
            const bestValueA = a.bestBets.bestValue.value;
            const bestValueB = b.bestBets.bestValue.value;
            return bestValueB - bestValueA;
        });
        
        console.log(`📊 Processed ${processedGames.length} matches with enhanced analysis`);
        
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
                analysis: "enhanced_v2",
                message: "Verbesserte Analyse mit realistischen Berechnungen"
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

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔑 Football-Data.org API: ${FOOTBALL_DATA_KEY ? '✅ Configured' : '❌ MISSING'}`);
    
    if (FOOTBALL_DATA_KEY) {
        console.log(`🌐 App verfügbar: https://your-app.onrender.com`);
        console.log(`📊 ENHANCED ANALYSIS aktiviert:`);
        console.log(`   ✅ Realistische xG Berechnung`);
        console.log(`   ✅ Verbesserte Poisson-Wahrscheinlichkeiten`);
        console.log(`   ✅ Genauere Over/Under Berechnungen`);
        console.log(`   ✅ Erweiterte Trend-Analyse`);
        console.log(`   ✅ Realistis
