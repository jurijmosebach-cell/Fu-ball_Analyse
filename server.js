// server.js — Professionelle KI-Fußballanalyse mit Torschützen
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoalscorerPredictor } from './goalscorer-module.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// API Keys
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_API_KEY;
const SPORTS_DB_KEY = process.env.THE_SPORTS_DB_KEY || '3';

// KI-Module initialisieren
const goalscorerPredictor = new GoalscorerPredictor();

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
        version: '3.1.0',
        features: ['Professionelle KI-Analyse', 'Torschützen-Prognosen', 'Echtzeit-Berechnungen']
    });
});

// Cache mit erweiterten Features
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten Cache

// Professioneller Football Data Service
class ProfessionalFootballDataService {
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
            dateTo.setDate(dateTo.getDate() + 1);

            const url = `${this.baseURL}/matches?dateFrom=${dateFrom.toISOString().split('T')[0]}&dateTo=${dateTo.toISOString().split('T')[0]}`;
            
            console.log('🔗 Fetching professional data from Football-Data.org...');

            const response = await fetch(url, {
                headers: {
                    'X-Auth-Token': this.apiKey,
                    'Accept': 'application/json'
                },
                timeout: 15000
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            const data = await response.json();
            
            const filteredMatches = data.matches?.filter(match => {
                if (!match.utcDate) return false;
                const matchDate = new Date(match.utcDate).toISOString().split('T')[0];
                return matchDate === date && (match.status === 'SCHEDULED' || match.status === 'TIMED');
            }) || [];

            console.log(`✅ Found ${filtermedMatches.length} professional matches for ${date}`);
            return filteredMatches;

        } catch (error) {
            console.log('❌ Professional API error:', error.message);
            throw error;
        }
    }
}

// Erweiterter Sports DB Service
class ProfessionalSportsDBService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://www.thesportsdb.com/api/v1/json';
    }

    async searchTeam(teamName) {
        try {
            const searchUrl = `${this.baseURL}/${this.apiKey}/searchteams.php?t=${encodeURIComponent(teamName)}`;
            const response = await fetch(searchUrl, { timeout: 10000 });
            const data = await response.json();
            
            return data.teams?.[0] || null;
        } catch (error) {
            console.log(`❌ Professional team search error for ${teamName}:`, error.message);
            return null;
        }
    }

    async getTeamLastMatches(teamId, count = 10) {
        try {
            const matchesUrl = `${this.baseURL}/${this.apiKey}/eventslast.php?id=${teamId}&limit=${count}`;
            const response = await fetch(matchesUrl, { timeout: 10000 });
            const data = await response.json();
            
            return data.results || [];
        } catch (error) {
            console.log(`❌ Professional matches error for team ${teamId}:`, error.message);
            return [];
        }
    }

    async getTeamForm(teamName) {
        try {
            const team = await this.searchTeam(teamName);
            if (!team) return null;
            
            const lastMatches = await this.getTeamLastMatches(team.idTeam, 8);
            
            let points = 0;
            let goalsFor = 0;
            let goalsAgainst = 0;
            let cleanSheets = 0;
            let matchesAnalyzed = 0;
            
            lastMatches.forEach(match => {
                const teamScore = parseInt(match.intHomeScore) || 0;
                const opponentScore = parseInt(match.intAwayScore) || 0;
                
                if (!isNaN(teamScore) && !isNaN(opponentScore)) {
                    goalsFor += teamScore;
                    goalsAgainst += opponentScore;
                    
                    if (teamScore > opponentScore) points += 3;
                    else if (teamScore === opponentScore) points += 1;
                    
                    if (opponentScore === 0) cleanSheets++;
                    matchesAnalyzed++;
                }
            });
            
            const form = matchesAnalyzed > 0 ? points / (matchesAnalyzed * 3) : 0.5;
            const avgGoalsFor = matchesAnalyzed > 0 ? goalsFor / matchesAnalyzed : 1.2;
            const avgGoalsAgainst = matchesAnalyzed > 0 ? goalsAgainst / matchesAnalyzed : 1.2;
            const cleanSheetRate = matchesAnalyzed > 0 ? cleanSheets / matchesAnalyzed : 0.2;
            
            return {
                teamId: team.idTeam,
                teamName: team.strTeam,
                matchesAnalyzed: matchesAnalyzed,
                points: points,
                form: form,
                goalsFor: goalsFor,
                goalsAgainst: goalsAgainst,
                goalDifference: goalsFor - goalsAgainst,
                avgGoalsFor: avgGoalsFor,
                avgGoalsAgainst: avgGoalsAgainst,
                cleanSheetRate: cleanSheetRate,
                attackStrength: Math.min(2.5, Math.max(0.5, avgGoalsFor / 1.5)),
                defenseStrength: Math.min(2.5, Math.max(0.5, 2 - (avgGoalsAgainst / 1.5)))
            };
        } catch (error) {
            console.log(`❌ Professional form analysis error for ${teamName}:`, error.message);
            return null;
        }
    }
}

const footballDataService = new ProfessionalFootballDataService(FOOTBALL_DATA_KEY);
const sportsDBService = new ProfessionalSportsDBService(SPORTS_DB_KEY);
// PROFESSIONELLE TEAM-STRENGTHS DATENBANK
const PROFESSIONAL_TEAM_STRENGTHS = {
    // Premier League
    "Manchester City": { 
        attack: 2.45, defense: 0.75, consistency: 0.92,
        homeStrength: 1.25, awayStrength: 1.15
    },
    "Liverpool": { 
        attack: 2.35, defense: 0.85, consistency: 0.89,
        homeStrength: 1.22, awayStrength: 1.18
    },
    "Arsenal": { 
        attack: 2.15, defense: 0.82, consistency: 0.87,
        homeStrength: 1.20, awayStrength: 1.10
    },
    "Chelsea": { 
        attack: 1.85, defense: 1.25, consistency: 0.72,
        homeStrength: 1.15, awayStrength: 1.05
    },
    "Tottenham": { 
        attack: 1.95, defense: 1.35, consistency: 0.75,
        homeStrength: 1.18, awayStrength: 1.08
    },
    "Manchester United": { 
        attack: 1.72, defense: 1.42, consistency: 0.68,
        homeStrength: 1.16, awayStrength: 1.02
    },

    // Bundesliga
    "Bayern Munich": { 
        attack: 2.65, defense: 0.68, consistency: 0.94,
        homeStrength: 1.28, awayStrength: 1.20
    },
    "Borussia Dortmund": { 
        attack: 2.25, defense: 1.12, consistency: 0.82,
        homeStrength: 1.22, awayStrength: 1.12
    },
    "RB Leipzig": { 
        attack: 2.05, defense: 1.18, consistency: 0.79,
        homeStrength: 1.18, awayStrength: 1.08
    },
    "Bayer Leverkusen": { 
        attack: 2.15, defense: 1.05, consistency: 0.85,
        homeStrength: 1.20, awayStrength: 1.10
    },

    // La Liga
    "Real Madrid": { 
        attack: 2.35, defense: 0.78, consistency: 0.91,
        homeStrength: 1.22, awayStrength: 1.15
    },
    "Barcelona": { 
        attack: 2.25, defense: 0.85, consistency: 0.86,
        homeStrength: 1.20, awayStrength: 1.12
    },
    "Atletico Madrid": { 
        attack: 1.85, defense: 0.88, consistency: 0.84,
        homeStrength: 1.18, awayStrength: 1.08
    },

    // Serie A
    "Inter Milan": { 
        attack: 2.15, defense: 0.85, consistency: 0.87,
        homeStrength: 1.18, awayStrength: 1.10
    },
    "Juventus": { 
        attack: 1.95, defense: 0.95, consistency: 0.81,
        homeStrength: 1.16, awayStrength: 1.08
    },
    "AC Milan": { 
        attack: 1.92, defense: 1.08, consistency: 0.79,
        homeStrength: 1.15, awayStrength: 1.05
    },

    "default": { 
        attack: 1.45, defense: 1.55, consistency: 0.65,
        homeStrength: 1.08, awayStrength: 0.95
    }
};

function getProfessionalTeamStrength(teamName) {
    for (const [team, strength] of Object.entries(PROFESSIONAL_TEAM_STRENGTHS)) {
        if (teamName.toLowerCase().includes(team.toLowerCase())) {
            return strength;
        }
    }
    return PROFESSIONAL_TEAM_STRENGTHS.default;
}

// PROFESSIONELLE xG-BERECHNUNG
async function calculateProfessionalXG(homeTeam, awayTeam, isHome = true, league = "") {
    const homeStrength = getProfessionalTeamStrength(homeTeam);
    const awayStrength = getProfessionalTeamStrength(awayTeam);
    
    // Basis xG Berechnung
    let homeXG = homeStrength.attack * (1 - awayStrength.defense / 3.2);
    let awayXG = awayStrength.attack * (1 - homeStrength.defense / 3.2);
    
    // Dynamischer Heimvorteil
    const homeAdvantageMultiplier = isHome ? homeStrength.homeStrength : awayStrength.awayStrength;
    const homeAdvantage = isHome ? 0.15 * homeAdvantageMultiplier : -0.10;
    
    homeXG += homeAdvantage;
    awayXG -= homeAdvantage * 0.8;
    
    // Form-Korrektur
    const homeForm = await sportsDBService.getTeamForm(homeTeam);
    const awayForm = await sportsDBService.getTeamForm(awayTeam);
    
    if (homeForm && awayForm) {
        const formDiff = homeForm.form - awayForm.form;
        homeXG += formDiff * 0.2;
        awayXG -= formDiff * 0.2;
        
        // Angriffs-/Verteidigungs-Stärke Korrektur
        homeXG *= homeForm.attackStrength;
        awayXG *= awayForm.attackStrength;
    }
    
    // Liga-spezifische Anpassungen
    const LEAGUE_ADJUSTMENTS = {
        "Premier League": 1.02,
        "Bundesliga": 1.08,
        "La Liga": 0.96,
        "Serie A": 0.92,
        "Ligue 1": 0.98,
        "Champions League": 1.12
    };
    
    const leagueAdjustment = LEAGUE_ADJUSTMENTS[league] || 1.0;
    homeXG *= leagueAdjustment;
    awayXG *= leagueAdjustment;
    
    // Realistische Begrenzungen
    return {
        home: Math.max(0.2, Math.min(3.8, +homeXG.toFixed(3))),
        away: Math.max(0.2, Math.min(3.2, +awayXG.toFixed(3))),
        confidence: 0.7 + (Math.random() * 0.25),
        quality: (homeXG + awayXG) / 2
    };
}

// PROFESSIONELLE MATHEMATISCHE FUNKTIONEN
function professionalFactorial(n) {
    if (n <= 1) return 1;
    if (n > 20) return Infinity;
    let f = 1;
    for (let i = 2; i <= n; i++) f *= i;
    return f;
}

function professionalPoisson(k, lambda) {
    if (lambda <= 0) return k === 0 ? 1 : 0;
    if (lambda > 10) lambda = 10;
    return Math.pow(lambda, k) * Math.exp(-lambda) / professionalFactorial(k);
} 
// PROFESSIONELLE WAHRSCHEINLICHKEITSBERECHNUNG
function computeProfessionalProbabilities(homeXG, awayXG) {
    let homeProb = 0, drawProb = 0, awayProb = 0;
    let over25Prob = 0;
    
    // Vereinfachte Berechnung für bessere Performance
    for (let i = 0; i <= 8; i++) {
        for (let j = 0; j <= 8; j++) {
            const p = professionalPoisson(i, homeXG) * professionalPoisson(j, awayXG);
            
            if (i > j) homeProb += p;
            else if (i === j) drawProb += p;
            else awayProb += p;
            
            // Over 2.5 Berechnung
            if (i + j > 2.5) over25Prob += p;
        }
    }
    
    // Normalisierung
    const total = homeProb + drawProb + awayProb;
    if (total > 0) {
        homeProb /= total;
        drawProb /= total;
        awayProb /= total;
    }
    
    return {
        home: +homeProb.toFixed(4),
        draw: +drawProb.toFixed(4),
        away: +awayProb.toFixed(4),
        over25: +over25Prob.toFixed(4)
    };
}

// PROFESSIONELLE BTTS BERECHNUNG
function computeProfessionalBTTS(homeXG, awayXG) {
    const pHomeScores = 1 - professionalPoisson(0, homeXG);
    const pAwayScores = 1 - professionalPoisson(0, awayXG);
    const bttsYes = pHomeScores * pAwayScores;
    
    return +bttsYes.toFixed(4);
}

// PROFESSIONELLE TREND-ANALYSE
function computeProfessionalTrend(prob, homeXG, awayXG) {
    const { home, draw, away } = prob;
    
    // Vereinfachte Trend-Bewertung
    if (home > 0.65 && home > away + 0.2) {
        return home > 0.75 ? "Strong Home" : "Home";
    } else if (away > 0.65 && away > home + 0.2) {
        return away > 0.75 ? "Strong Away" : "Away";
    } else if (draw > 0.35 && draw > home && draw > away) {
        return "Draw";
    } else if (Math.abs(home - away) < 0.15) {
        return "Balanced";
    } else if (home > away) {
        return home > 0.55 ? "Home" : "Slight Home";
    } else {
        return away > 0.55 ? "Away" : "Slight Away";
    }
}

// PROFESSIONELLE VALUE-BERECHNUNG
function calculateProfessionalValue(probability, odds) {
    if (!odds || odds <= 1) return 0;
    const rawValue = (probability * odds) - 1;
    return +(Math.max(-1, rawValue).toFixed(4));
}

// PROFESSIONELLE ODDS-GENERIERUNG
function generateProfessionalOdds(prob) {
    const margin = 0.065; // 6.5% Marge
    
    return {
        home: +(1 / (prob.home * (1 - margin))).toFixed(2),
        draw: +(1 / (prob.draw * (1 - margin))).toFixed(2),
        away: +(1 / (prob.away * (1 - margin))).toFixed(2),
        over25: +(1 / (prob.over25 * (1 - margin))).toFixed(2),
        under25: +(1 / ((1 - prob.over25) * (1 - margin))).toFixed(2)
    };
}

function getProfessionalFlag(teamName) {
    const flagMapping = {
        // Premier League
        "Manchester": "gb", "Liverpool": "gb", "Chelsea": "gb", "Arsenal": "gb",
        "Tottenham": "gb", "Newcastle": "gb", "Brighton": "gb", "West Ham": "gb",
        "Crystal Palace": "gb", "Aston Villa": "gb", "Everton": "gb", "Wolves": "gb",
        
        // Bundesliga
        "Bayern": "de", "Dortmund": "de", "Leipzig": "de", "Leverkusen": "de",
        "Frankfurt": "de", "Wolfsburg": "de", "Stuttgart": "de", "Bremen": "de",
        "Union Berlin": "de", "Gladbach": "de", "Köln": "de",
        
        // La Liga
        "Real": "es", "Barcelona": "es", "Atletico": "es", "Sevilla": "es",
        "Valencia": "es", "Villarreal": "es", "Athletic": "es",
        
        // Serie A
        "Juventus": "it", "Inter": "it", "Milan": "it", "Napoli": "it",
        "Roma": "it", "Lazio": "it", "Fiorentina": "it", "Atalanta": "it",
        
        // Ligue 1
        "PSG": "fr", "Marseille": "fr", "Monaco": "fr", "Lyon": "fr",
        "Lille": "fr", "Nice": "fr", "Rennes": "fr"
    };
    
    for (const [key, value] of Object.entries(flagMapping)) {
        if (teamName.toLowerCase().includes(key.toLowerCase())) {
            return value;
        }
    }
    return "eu";
}

// PROFESSIONELLE ANALYSE GENERIEREN
function generateProfessionalAnalysis(homeTeam, awayTeam, probabilities, trend, confidence, value) {
    const analysis = {
        summary: "",
        keyFactors: [],
        recommendation: "",
        riskLevel: "medium",
        confidence: confidence
    };

    const bestValue = Math.max(value.home, value.draw, value.away, value.over25);

    // Zusammenfassung
    switch(trend) {
        case "Strong Home":
            analysis.summary = `${homeTeam} dominiert mit starker Heimplatzpräsenz (${Math.round(probabilities.home * 100)}% Siegchance).`;
            analysis.recommendation = "Heimsieg empfehlenswert";
            analysis.riskLevel = "low";
            break;
        case "Strong Away":
            analysis.summary = `${awayTeam} zeigt überzeugende Auswärtsstärke (${Math.round(probabilities.away * 100)}% Siegchance).`;
            analysis.recommendation = "Auswärtssieg favorisieren";
            analysis.riskLevel = "low";
            break;
        case "Home":
            analysis.summary = `${homeTeam} hat klare Vorteile durch Heimspiel (${Math.round(probabilities.home * 100)}%).`;
            analysis.recommendation = "Leichter Heimplatzvorteil";
            analysis.riskLevel = "medium";
            break;
        case "Draw":
            analysis.summary = `Ausgeglichene Begegnung (${Math.round(probabilities.draw * 100)}% Unentschieden).`;
            analysis.recommendation = "Unentschieden in Erwägung ziehen";
            analysis.riskLevel = "medium";
            break;
        default:
            analysis.summary = "Balanciertes Spiel ohne klaren Favoriten.";
            analysis.recommendation = "Vorsichtige Einschätzung";
            analysis.riskLevel = "high";
    }

    // Key Factors
    if (probabilities.home > 0.5) {
        analysis.keyFactors.push(`Heimstärke: ${Math.round(probabilities.home * 100)}%`);
    }
    if (probabilities.away > 0.5) {
        analysis.keyFactors.push(`Auswärtsstärke: ${Math.round(probabilities.away * 100)}%`);
    }
    if (bestValue > 0.1) {
        analysis.keyFactors.push(`Guter Value: ${(bestValue * 100).toFixed(1)}%`);
    }

    return analysis;
    } 
// PROFESSIONELLE HAUPT-API ROUTE
app.get('/api/games', async (req, res) => {
    try {
        const requestedDate = req.query.date || new Date().toISOString().split('T')[0];
        console.log('🎯 Professional API Request for date:', requestedDate);
        
        const cacheKey = `professional-games-${requestedDate}`;
        
        // Cache prüfen
        const cached = cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
            console.log('✅ Serving from professional cache');
            return res.json({ 
                response: cached.data,
                info: { 
                    source: 'professional_cache', 
                    date: requestedDate,
                    cached: true
                }
            });
        }
        
        if (!FOOTBALL_DATA_KEY) {
            return res.status(400).json({
                error: 'Professional API Key nicht konfiguriert',
                message: 'Bitte setze FOOTBALL_DATA_API_KEY Environment Variable'
            });
        }
        
        console.log('🔄 Fetching professional match data...');
        const matches = await footballDataService.getMatchesByDate(requestedDate);
        
        if (matches.length === 0) {
            return res.json({
                response: [],
                info: {
                    date: requestedDate,
                    total: 0,
                    source: "professional_football_data",
                    message: "Keine Spiele für dieses Datum gefunden"
                }
            });
        }

        console.log('🤖 Starting professional analysis for', matches.length, 'matches...');
        
        // Parallele Verarbeitung für Performance
        const enhancedGames = await Promise.all(
            matches.map(async (match) => {
                try {
                    const homeTeam = match.homeTeam?.name || "Unknown Home";
                    const awayTeam = match.awayTeam?.name || "Unknown Away";
                    const league = match.competition?.name || "Unknown League";
                    
                    console.log(`🔍 Analyzing: ${homeTeam} vs ${awayTeam}`);
                    
                    // Team-Stärken für Torschützen-Analyse
                    const homeStrength = getProfessionalTeamStrength(homeTeam);
                    const awayStrength = getProfessionalTeamStrength(awayTeam);
                    
                    // Professionelle xG-Berechnung
                    const xgData = await calculateProfessionalXG(homeTeam, awayTeam, true, league);
                    
                    // Wahrscheinlichkeiten berechnen
                    const prob = computeProfessionalProbabilities(xgData.home, xgData.away);
                    const bttsProb = computeProfessionalBTTS(xgData.home, xgData.away);
                    
                    // Odds generieren
                    const odds = generateProfessionalOdds(prob);
                    
                    // Value berechnen
                    const value = {
                        home: calculateProfessionalValue(prob.home, odds.home),
                        draw: calculateProfessionalValue(prob.draw, odds.draw),
                        away: calculateProfessionalValue(prob.away, odds.away),
                        over25: calculateProfessionalValue(prob.over25, odds.over25),
                        under25: calculateProfessionalValue(1 - prob.over25, odds.under25)
                    };
                    
                    // Trend bestimmen
                    const trend = computeProfessionalTrend(prob, xgData.home, xgData.away);
                    
                    // Torschützen-Analyse
                    const goalscorerAnalysis = goalscorerPredictor.analyzeMatchGoalscorers(
                        homeTeam, 
                        awayTeam, 
                        xgData.home, 
                        xgData.away, 
                        homeStrength, 
                        awayStrength
                    );
                    
                    // KI-Score berechnen (vereinfacht)
                    const kiScore = 0.5 + (xgData.confidence * 0.3) + (Math.max(...Object.values(value)) * 0.2);
                    
                    return {
                        id: match.id,
                        home: homeTeam,
                        away: awayTeam,
                        league: league,
                        date: match.utcDate,
                        homeLogo: `https://flagsapi.com/${getProfessionalFlag(homeTeam)}/flat/64.png`,
                        awayLogo: `https://flagsapi.com/${getProfessionalFlag(awayTeam)}/flat/64.png`,
                        
                        // xG Daten
                        homeXG: xgData.home,
                        awayXG: xgData.away,
                        quality: xgData.quality,
                        
                        // Wahrscheinlichkeiten
                        prob: prob,
                        over25: prob.over25,
                        btts: bttsProb,
                        
                        // Value & Odds
                        value: value,
                        odds: odds,
                        
                        // KI-Analyse
                        trend: trend,
                        confidence: xgData.confidence,
                        kiScore: Math.min(0.95, kiScore),
                        analysis: generateProfessionalAnalysis(
                            homeTeam, awayTeam, prob, trend, xgData.confidence, value
                        ),
                        
                        // Torschützen-Prognosen
                        goalscorers: goalscorerAnalysis,
                        topScorerPredictions: {
                            anytime: [...goalscorerAnalysis.anytime.home, ...goalscorerAnalysis.anytime.away]
                                .sort((a, b) => b.probability - a.probability)
                                .slice(0, 5),
                            first: [goalscorerAnalysis.first.home, goalscorerAnalysis.first.away]
                                .filter(Boolean)
                                .sort((a, b) => b.probability - a.probability)
                                .slice(0, 3),
                            bestValue: goalscorerAnalysis.bestValue
                        },
                        
                        timestamp: new Date().toISOString()
                    };
                } catch (error) {
                    console.log(`❌ Error processing match ${match.id}:`, error.message);
                    return null;
                }
            })
        );

        // Filter und Sortierung
        const validGames = enhancedGames.filter(game => game !== null);
        validGames.sort((a, b) => (b.kiScore || 0) - (a.kiScore || 0));

        console.log(`✅ Professional analysis completed. Processed ${validGames.length} games`);

        const responseData = {
            response: validGames,
            info: {
                date: requestedDate,
                total: validGames.length,
                source: "professional_football_data",
                version: "3.1.0",
                features: ["ki_analysis", "goalscorer_predictions"],
                timestamp: new Date().toISOString()
            }
        };

        // Caching
        cache.set(cacheKey, {
            data: responseData.response,
            timestamp: Date.now()
        });

        res.json(responseData);

    } catch (error) {
        console.error('❌ Professional API Error:', error);
        res.status(500).json({
            error: error.message,
            info: {
                date: req.query.date,
                source: "professional_error",
                message: "Fehler bei der Datenverarbeitung"
            }
        });
    }
});

// Torschützen-API Route
app.get('/api/goalscorers/:team', async (req, res) => {
    try {
        const teamName = req.params.team;
        const teamStrength = getProfessionalTeamStrength(teamName);
        
        const scorers = goalscorerPredictor.predictTopGoalscorers(
            teamName, 
            1.8, // Standard xG
            true, 
            teamStrength.defense, 
            5
        );
        
        res.json({
            team: teamName,
            topScorers: scorers,
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
    console.log(`🚀 Professional Server running on port ${PORT}`);
    console.log(`🤖 ProFoot Analytics v3.1.0 - Mit Torschützen-Prognosen`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`⚽ Torschützen-API: http://localhost:${PORT}/api/goalscorers/Manchester%20City`);
});
