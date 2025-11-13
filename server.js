// server.js — Professionelle KI-Fußballanalyse
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProfessionalKIAnalyse } from './ki-module.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// API Keys
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_API_KEY;
const SPORTS_DB_KEY = process.env.THE_SPORTS_DB_KEY || '3';

// Professionelles KI-Modul initialisieren
const kiAnalyse = new ProfessionalKIAnalyse();

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
        version: '3.0.0',
        features: ['Professionelle KI-Analyse', 'Machine Learning', 'Echtzeit-Berechnungen']
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
            dateTo.setDate(dateTo.getDate() + 1); // Nur +1 Tag für bessere Performance

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

            console.log(`✅ Found ${filteredMatches.length} professional matches for ${date}`);
            return filteredMatches;

        } catch (error) {
            console.log('❌ Professional API error:', error.message);
            throw error;
        }
    }

    async getTeamStats(teamId) {
        // Erweiterte Team-Statistiken
        try {
            const url = `${this.baseURL}/teams/${teamId}`;
            const response = await fetch(url, {
                headers: {
                    'X-Auth-Token': this.apiKey,
                    'Accept': 'application/json'
                }
            });
            
            return response.ok ? await response.json() : null;
        } catch (error) {
            console.log('❌ Team stats error:', error.message);
            return null;
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
            
            const lastMatches = await this.getTeamLastMatches(team.idTeam, 8); // Mehr Spiele für bessere Analyse
            
            let points = 0;
            let goalsFor = 0;
            let goalsAgainst = 0;
            let shotsFor = 0;
            let shotsAgainst = 0;
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
                maxPoints: matchesAnalyzed * 3,
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
    // Premier League - Aktuelle Daten
    "Manchester City": { 
        attack: 2.45, defense: 0.75, consistency: 0.92,
        homeStrength: 1.25, awayStrength: 1.15, form: 0.88
    },
    "Liverpool": { 
        attack: 2.35, defense: 0.85, consistency: 0.89,
        homeStrength: 1.22, awayStrength: 1.18, form: 0.85
    },
    "Arsenal": { 
        attack: 2.15, defense: 0.82, consistency: 0.87,
        homeStrength: 1.20, awayStrength: 1.10, form: 0.86
    },
    "Chelsea": { 
        attack: 1.85, defense: 1.25, consistency: 0.72,
        homeStrength: 1.15, awayStrength: 1.05, form: 0.70
    },
    "Tottenham": { 
        attack: 1.95, defense: 1.35, consistency: 0.75,
        homeStrength: 1.18, awayStrength: 1.08, form: 0.78
    },
    "Manchester United": { 
        attack: 1.72, defense: 1.42, consistency: 0.68,
        homeStrength: 1.16, awayStrength: 1.02, form: 0.65
    },
    "Newcastle": { 
        attack: 1.82, defense: 1.22, consistency: 0.78,
        homeStrength: 1.20, awayStrength: 1.05, form: 0.76
    },
    "Brighton": { 
        attack: 1.92, defense: 1.45, consistency: 0.80,
        homeStrength: 1.15, awayStrength: 1.10, form: 0.79
    },

    // Bundesliga
    "Bayern Munich": { 
        attack: 2.65, defense: 0.68, consistency: 0.94,
        homeStrength: 1.28, awayStrength: 1.20, form: 0.90
    },
    "Borussia Dortmund": { 
        attack: 2.25, defense: 1.12, consistency: 0.82,
        homeStrength: 1.22, awayStrength: 1.12, form: 0.80
    },
    "RB Leipzig": { 
        attack: 2.05, defense: 1.18, consistency: 0.79,
        homeStrength: 1.18, awayStrength: 1.08, form: 0.78
    },
    "Bayer Leverkusen": { 
        attack: 2.15, defense: 1.05, consistency: 0.85,
        homeStrength: 1.20, awayStrength: 1.10, form: 0.88
    },

    // La Liga
    "Real Madrid": { 
        attack: 2.35, defense: 0.78, consistency: 0.91,
        homeStrength: 1.22, awayStrength: 1.15, form: 0.89
    },
    "Barcelona": { 
        attack: 2.25, defense: 0.85, consistency: 0.86,
        homeStrength: 1.20, awayStrength: 1.12, form: 0.84
    },
    "Atletico Madrid": { 
        attack: 1.85, defense: 0.88, consistency: 0.84,
        homeStrength: 1.18, awayStrength: 1.08, form: 0.82
    },

    // Serie A
    "Inter Milan": { 
        attack: 2.15, defense: 0.85, consistency: 0.87,
        homeStrength: 1.18, awayStrength: 1.10, form: 0.85
    },
    "Juventus": { 
        attack: 1.95, defense: 0.95, consistency: 0.81,
        homeStrength: 1.16, awayStrength: 1.08, form: 0.78
    },
    "AC Milan": { 
        attack: 1.92, defense: 1.08, consistency: 0.79,
        homeStrength: 1.15, awayStrength: 1.05, form: 0.76
    },

    "default": { 
        attack: 1.45, defense: 1.55, consistency: 0.65,
        homeStrength: 1.08, awayStrength: 0.95, form: 0.60
    }
};

function getProfessionalTeamStrength(teamName) {
    // Exakte Match-Logik
    for (const [team, strength] of Object.entries(PROFESSIONAL_TEAM_STRENGTHS)) {
        if (teamName.toLowerCase().includes(team.toLowerCase()) || 
            team.toLowerCase().includes(teamName.toLowerCase())) {
            return strength;
        }
    }
    return PROFESSIONAL_TEAM_STRENGTHS.default;
}

// PROFESSIONELLE xG-BERECHNUNG
async function calculateProfessionalXG(homeTeam, awayTeam, isHome = true, league = "") {
    const homeStrength = getProfessionalTeamStrength(homeTeam);
    const awayStrength = getProfessionalTeamStrength(awayTeam);
    
    // Basis xG Berechnung mit erweiterten Faktoren
    let homeXG = homeStrength.attack * (1 - awayStrength.defense / 3.2);
    let awayXG = awayStrength.attack * (1 - homeStrength.defense / 3.2);
    
    // KI-Faktoren integrieren
    const kiFactors = await kiAnalyse.calculateProfessionalFactors(homeTeam, awayTeam, league);
    
    // Dynamischer Heimvorteil basierend auf Team-Stärke
    const homeAdvantageMultiplier = isHome ? homeStrength.homeStrength : awayStrength.awayStrength;
    const homeAdvantage = isHome ? 0.15 * homeAdvantageMultiplier : -0.10;
    
    homeXG += homeAdvantage;
    awayXG -= homeAdvantage * 0.8; // Reduzierter Effekt für Auswärtsteam
    
    // Form-Korrektur mit professionellen Daten
    const homeForm = await sportsDBService.getTeamForm(homeTeam);
    const awayForm = await sportsDBService.getTeamForm(awayTeam);
    
    if (homeForm && awayForm) {
        const formCorrection = kiAnalyse.calculateProfessionalFormCorrection(homeForm, awayForm);
        homeXG += formCorrection.home * kiFactors.formImpact;
        awayXG += formCorrection.away * kiFactors.formImpact;
        
        // Angriffs-/Verteidigungs-Stärke Korrektur
        homeXG *= homeForm.attackStrength;
        awayXG *= awayForm.attackStrength;
    }
    
    // Liga-spezifische Anpassungen
    const LEAGUE_ADJUSTMENTS = {
        "Premier League": { factor: 1.02, intensity: 1.05 },
        "Bundesliga": { factor: 1.08, intensity: 1.10 },
        "La Liga": { factor: 0.96, intensity: 0.95 },
        "Serie A": { factor: 0.92, intensity: 0.90 },
        "Ligue 1": { factor: 0.98, intensity: 1.00 },
        "Champions League": { factor: 1.12, intensity: 1.15 },
        "Europa League": { factor: 1.06, intensity: 1.08 }
    };
    
    const leagueAdjustment = LEAGUE_ADJUSTMENTS[league] || { factor: 1.0, intensity: 1.0 };
    homeXG *= leagueAdjustment.factor;
    awayXG *= leagueAdjustment.factor;
    
    // Finale KI-Korrektur
    const finalCorrection = kiAnalyse.applyProfessionalCorrections(homeXG, awayXG, homeTeam, awayTeam, league);
    homeXG += finalCorrection.home;
    awayXG += finalCorrection.away;
    
    // Realistische Begrenzungen
    return {
        home: Math.max(0.2, Math.min(3.8, +homeXG.toFixed(3))),
        away: Math.max(0.2, Math.min(3.2, +awayXG.toFixed(3))),
        confidence: kiFactors.confidence,
        kiFactors: kiFactors,
        quality: (homeXG + awayXG) / 2 // Spielqualitäts-Indikator
    };
}

// PROFESSIONELLE MATHEMATISCHE FUNKTIONEN
function professionalFactorial(n) {
    if (n <= 1) return 1;
    if (n > 20) return Infinity; // Vermeidet Overflow
    let f = 1;
    for (let i = 2; i <= n; i++) f *= i;
    return f;
}

function professionalPoisson(k, lambda) {
    if (lambda <= 0) return k === 0 ? 1 : 0;
    if (lambda > 10) lambda = 10; // Realistische Begrenzung
    return Math.pow(lambda, k) * Math.exp(-lambda) / professionalFactorial(k);
}

// ERWEITERTE BIVARIATE POISSON-VERTEILUNG
function bivariatePoisson(homeGoals, awayGoals, homeLambda, awayLambda, correlation = 0.2) {
    const baseProb = professionalPoisson(homeGoals, homeLambda) * professionalPoisson(awayGoals, awayLambda);
    
    // Korrelations-Korrektur für realistischere Ergebnisse
    if (homeGoals === awayGoals && homeGoals > 0) {
        return baseProb * (1 + correlation);
    }
    
    return baseProb;
} 
// PROFESSIONELLE WAHRSCHEINLICHKEITSBERECHNUNG
function computeProfessionalProbabilities(homeXG, awayXG) {
    let homeProb = 0, drawProb = 0, awayProb = 0;
    let scoreProbabilities = {};
    
    // Erweiterte Berechnung mit Korrelation
    for (let i = 0; i <= 10; i++) {
        for (let j = 0; j <= 10; j++) {
            const p = bivariatePoisson(i, j, homeXG, awayXG, 0.15);
            
            if (i > j) homeProb += p;
            else if (i === j) drawProb += p;
            else awayProb += p;
            
            // Speichere wichtige Spielstände für spätere Analyse
            if (i <= 5 && j <= 5) {
                scoreProbabilities[`${i}-${j}`] = +p.toFixed(6);
            }
        }
    }
    
    // Normalisierung für Präzision
    const total = homeProb + drawProb + awayProb;
    if (total > 0) {
        homeProb /= total;
        drawProb /= total;
        awayProb /= total;
    }
    
    return {
        home: +homeProb.toFixed(5),
        draw: +drawProb.toFixed(5),
        away: +awayProb.toFixed(5),
        scoreProbabilities: scoreProbabilities,
        expectedGoals: {
            home: homeXG,
            away: awayXG,
            total: +(homeXG + awayXG).toFixed(3)
        }
    };
}

// PROFESSIONELLE OVER/UNDER BERECHNUNG
function computeProfessionalOverUnder(homeXG, awayXG) {
    let probabilities = {
        over05: 0, over15: 0, over25: 0, over35: 0,
        under05: 0, under15: 0, under25: 0, under35: 0,
        exact05: 0, exact15: 0, exact25: 0, exact35: 0
    };
    
    for (let homeGoals = 0; homeGoals <= 8; homeGoals++) {
        for (let awayGoals = 0; awayGoals <= 8; awayGoals++) {
            const totalGoals = homeGoals + awayGoals;
            const p = bivariatePoisson(homeGoals, awayGoals, homeXG, awayXG);
            
            // Over/Under Wahrscheinlichkeiten
            if (totalGoals > 0.5) probabilities.over05 += p;
            if (totalGoals > 1.5) probabilities.over15 += p;
            if (totalGoals > 2.5) probabilities.over25 += p;
            if (totalGoals > 3.5) probabilities.over35 += p;
            
            if (totalGoals < 0.5) probabilities.under05 += p;
            if (totalGoals < 1.5) probabilities.under15 += p;
            if (totalGoals < 2.5) probabilities.under25 += p;
            if (totalGoals < 3.5) probabilities.under35 += p;
            
            // Exakte Wahrscheinlichkeiten
            if (totalGoals === 0) probabilities.exact05 += p;
            if (totalGoals === 1) probabilities.exact15 += p;
            if (totalGoals === 2) probabilities.exact25 += p;
            if (totalGoals === 3) probabilities.exact35 += p;
        }
    }
    
    // Rundung für bessere Lesbarkeit
    Object.keys(probabilities).forEach(key => {
        probabilities[key] = +(probabilities[key].toFixed(5));
    });
    
    return probabilities;
}

// PROFESSIONELLE BTTS & CLEAN SHEET BERECHNUNG
function computeProfessionalBTTS(homeXG, awayXG) {
    const pHomeScores = 1 - professionalPoisson(0, homeXG);
    const pAwayScores = 1 - professionalPoisson(0, awayXG);
    const pHomeCleanSheet = professionalPoisson(0, awayXG);
    const pAwayCleanSheet = professionalPoisson(0, homeXG);
    
    return {
        bttsYes: +(pHomeScores * pAwayScores).toFixed(5),
        bttsNo: +(1 - (pHomeScores * pAwayScores)).toFixed(5),
        homeCleanSheet: +pHomeCleanSheet.toFixed(5),
        awayCleanSheet: +pAwayCleanSheet.toFixed(5),
        bothTeamsScoreProbability: +(pHomeScores * pAwayScores).toFixed(5)
    };
}

// PROFESSIONELLE TREND-ANALYSE
function computeProfessionalTrend(prob, homeXG, awayTeam, kiFactors) {
    const { home, draw, away } = prob;
    const xgDifference = homeXG - prob.expectedGoals.away;
    
    // Mehrdimensionale Trend-Bewertung
    const trendFactors = {
        homeDominance: home - away,
        xgAdvantage: xgDifference,
        consistency: kiFactors.consistency,
        confidence: kiFactors.confidence
    };
    
    // Gewichtete Trend-Bewertung
    const homeScore = home * 0.4 + trendFactors.homeDominance * 0.3 + trendFactors.xgAdvantage * 0.2 + trendFactors.confidence * 0.1;
    const awayScore = away * 0.4 - trendFactors.homeDominance * 0.3 - trendFactors.xgAdvantage * 0.2 + trendFactors.confidence * 0.1;
    const drawScore = draw * 0.6 + trendFactors.consistency * 0.4;
    
    // Professionelle Trend-Klassifikation
    if (homeScore > 0.65 && homeScore > awayScore + 0.2) {
        return homeScore > 0.75 ? "Strong Home" : "Home";
    } else if (awayScore > 0.65 && awayScore > homeScore + 0.2) {
        return awayScore > 0.75 ? "Strong Away" : "Away";
    } else if (drawScore > 0.35 && drawScore > homeScore && drawScore > awayScore) {
        return "Draw";
    } else if (Math.abs(homeScore - awayScore) < 0.15) {
        return "Balanced";
    } else if (homeScore > awayScore) {
        return homeScore > 0.55 ? "Home" : "Slight Home";
    } else {
        return awayScore > 0.55 ? "Away" : "Slight Away";
    }
}

// PROFESSIONELLE VALUE-BERECHNUNG
function calculateProfessionalValue(probability, odds, marketType = '1x2') {
    if (!odds || odds <= 1) return 0;
    
    // Markt-spezifische Anpassungen
    const marketAdjustments = {
        '1x2': 1.0,
        'over_under': 0.95,
        'btts': 0.92
    };
    
    const adjustment = marketAdjustments[marketType] || 1.0;
    const rawValue = (probability * odds) - 1;
    const adjustedValue = rawValue * adjustment;
    
    return +(Math.max(-1, adjustedValue).toFixed(4));
}

// PROFESSIONELLE ODDS-GENERIERUNG
function generateProfessionalOdds(prob, market = '1x2') {
    const margins = {
        '1x2': 0.065,      // 6.5% Marge für 1X2
        'over_under': 0.055, // 5.5% Marge für Over/Under
        'btts': 0.060      // 6.0% Marge für BTTS
    };
    
    const margin = margins[market] || 0.06;
    
    if (market === '1x2') {
        return {
            home: +(1 / (prob.home * (1 - margin))).toFixed(2),
            draw: +(1 / (prob.draw * (1 - margin))).toFixed(2),
            away: +(1 / (prob.away * (1 - margin))).toFixed(2)
        };
    } else if (market === 'over_under') {
        return {
            over25: +(1 / (prob.over25 * (1 - margin))).toFixed(2),
            under25: +(1 / ((1 - prob.over25) * (1 - margin))).toFixed(2)
        };
    }
}

function getProfessionalFlag(teamName) {
    const flagMapping = {
        // Premier League
        "Manchester": "gb", "Liverpool": "gb", "Chelsea": "gb", "Arsenal": "gb",
        "Tottenham": "gb", "Newcastle": "gb", "Brighton": "gb", "West Ham": "gb",
        "Crystal Palace": "gb", "Aston Villa": "gb", "Sunderland": "gb", "Burnley": "gb",
        "Wolverhampton": "gb", "Hull City": "gb", "Portsmouth": "gb",
        
        // Bundesliga
        "Bayern": "de", "Dortmund": "de", "Leipzig": "de", "Leverkusen": "de",
        "Frankfurt": "de", "Wolfsburg": "de", "Stuttgart": "de", "Bremen": "de",
        "Union Berlin": "de", "Heidenheim": "de", "Mönchengladbach": "de", "Köln": "de",
        
        // La Liga
        "Real": "es", "Barcelona": "es", "Atletico": "es", "Sevilla": "es",
        "Valencia": "es", "Villarreal": "es", "Athletic": "es", "Espanyol": "es",
        
        // Serie A
        "Juventus": "it", "Inter": "it", "Milan": "it", "Napoli": "it",
        "Roma": "it", "Lazio": "it", "Fiorentina": "it", "Torino": "it", "Parma": "it",
        
        // Ligue 1
        "PSG": "fr", "Marseille": "fr", "Monaco": "fr", "Lyon": "fr",
        "Lille": "fr", "Nice": "fr", "Rennes": "fr", "Brest": "fr"
    };
    
    for (const [key, value] of Object.entries(flagMapping)) {
        if (teamName.toLowerCase().includes(key.toLowerCase())) {
            return value;
        }
    }
    return "eu";
} 
// PROFESSIONELLE HAUPT-API ROUTE
app.get('/api/games', async (req, res) => {
    try {
        const requestedDate = req.query.date || new Date().toISOString().split('T')[0];
        console.log('🎯 Professional API Request for date:', requestedDate);
        
        const cacheKey = `professional-games-${requestedDate}`;
        
        // Cache mit erweiterten Features
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
                    message: "Keine professionellen Spiele für dieses Datum gefunden"
                }
            });
        }

        console.log('🤖 Starting professional KI analysis for', matches.length, 'matches...');
        
        // Parallele Verarbeitung für Performance
        const enhancedGames = await Promise.all(
            matches.map(async (match) => {
                try {
                    const homeTeam = match.homeTeam?.name || "Unknown Home";
                    const awayTeam = match.awayTeam?.name || "Unknown Away";
                    const league = match.competition?.name || "Unknown League";
                    
                    console.log(`🔍 Analyzing: ${homeTeam} vs ${awayTeam}`);
                    
                    // Professionelle xG-Berechnung
                    const xgData = await calculateProfessionalXG(homeTeam, awayTeam, true, league);
                    
                    // Erweiterte Wahrscheinlichkeiten
                    const prob = computeProfessionalProbabilities(xgData.home, xgData.away);
                    const overUnder = computeProfessionalOverUnder(xgData.home, xgData.away);
                    const bttsData = computeProfessionalBTTS(xgData.home, xgData.away);
                    
                    // Professionelle Odds
                    const odds = {
                        ...generateProfessionalOdds(prob, '1x2'),
                        ...generateProfessionalOdds({ over25: overUnder.over25 }, 'over_under')
                    };
                    
                    // Value-Berechnung
                    const value = {
                        home: calculateProfessionalValue(prob.home, odds.home, '1x2'),
                        draw: calculateProfessionalValue(prob.draw, odds.draw, '1x2'),
                        away: calculateProfessionalValue(prob.away, odds.away, '1x2'),
                        over25: calculateProfessionalValue(overUnder.over25, odds.over25, 'over_under'),
                        under25: calculateProfessionalValue(1 - overUnder.over25, odds.under25, 'over_under')
                    };
                    
                    // Professionelle Trend-Analyse
                    const trend = computeProfessionalTrend(prob, xgData.home, awayTeam, xgData.kiFactors);
                    
                    // KI-Score berechnen
                    const kiScore = kiAnalyse.calculateProfessionalKIScore(
                        homeTeam, awayTeam, prob, trend, xgData.confidence
                    );
                    
                    return {
                        id: match.id,
                        home: homeTeam,
                        away: awayTeam,
                        league: league,
                        date: match.utcDate,
                        homeLogo: `https://flagsapi.com/${getProfessionalFlag(homeTeam)}/flat/64.png`,
                        awayLogo: `https://flagsapi.com/${getProfessionalFlag(awayTeam)}/flat/64.png`,
                        
                        // Erweiterte xG Daten
                        homeXG: xgData.home,
                        awayXG: xgData.away,
                        quality: xgData.quality,
                        
                        // Wahrscheinlichkeiten
                        prob: prob,
                        over25: overUnder.over25,
                        btts: bttsData.bttsYes,
                        
                        // Erweiterte Marktdaten
                        overUnder: overUnder,
                        bttsData: bttsData,
                        
                        // Value & Odds
                        value: value,
                        odds: odds,
                        
                        // KI-Analyse
                        trend: trend,
                        confidence: xgData.confidence,
                        kiScore: kiScore,
                        analysis: kiAnalyse.generateProfessionalAnalysis(
                            homeTeam, awayTeam, prob, trend, xgData.confidence, value
                        ),
                        
                        // Metadaten
                        expectedGoals: prob.expectedGoals,
                        scoreProbabilities: prob.scoreProbabilities,
                        timestamp: new Date().toISOString()
                    };
                } catch (error) {
                    console.log(`❌ Professional error processing match ${match.id}:`, error.message);
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
                source: "professional_football_data+ki_analysis",
                version: "3.0.0",
                ki_model: "professional_v1",
                timestamp: new Date().toISOString(),
                statistics: {
                    avgConfidence: +(validGames.reduce((sum, g) => sum + g.confidence, 0) / validGames.length).toFixed(3),
                    avgQuality: +(validGames.reduce((sum, g) => sum + g.quality, 0) / validGames.length).toFixed(3),
                    highValueGames: validGames.filter(g => Math.max(g.value.home, g.value.draw, g.value.away, g.value.over25) > 0.1).length
                }
            }
        };

        // Professionelles Caching
        cache.set(cacheKey, {
            data: responseData.response,
            timestamp: Date.now(),
            statistics: responseData.info.statistics
        });

        res.json(responseData);

    } catch (error) {
        console.error('❌ Professional API Error:', error);
        res.status(500).json({
            error: error.message,
            info: {
                date: req.query.date,
                source: "professional_error",
                message: "Fehler bei der professionellen Datenverarbeitung"
            }
        });
    }
});

// PROFESSIONELLE DETAILLIERTE ANALYSE ROUTE
app.get('/api/professional-analysis/:matchId', async (req, res) => {
    try {
        const matchId = req.params.matchId;
        const detailedAnalysis = await kiAnalyse.getProfessionalDetailedAnalysis(matchId);
        
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

// PROFESSIONELLE STATISTIK ROUTE
app.get('/api/professional-stats', async (req, res) => {
    try {
        const stats = await kiAnalyse.getProfessionalStatistics();
        res.json({
            statistics: stats,
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
    console.log(`🤖 ProFoot Analytics v3.0.0 - Professionelle KI-Analyse`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 Professional API: http://localhost:${PORT}/api/games`);
});
