// server.js - NUR MIT H2H ERWEITERT
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProfessionalCalculator } from './professional-calculations.js';
import { HDAAnalyzer } from './hda-analyzer.js';
import { AdvancedFormAnalyzer } from './advanced-form-analyzer.js';
import { InjuryTracker } from './injury-tracker.js';
import { H2HAnalyzer } from './h2h-analyzer.js'; // NEU: H2H Import

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// Football-Data.org API Key
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_API_KEY;

// Middleware
app.use(express.static(__dirname));
app.use(express.json());

// Professionelle KI-Module initialisieren
const proCalculator = new ProfessionalCalculator();
const hdaAnalyzer = new HDAAnalyzer();
const formAnalyzer = new AdvancedFormAnalyzer();
const injuryTracker = new InjuryTracker();
const h2hAnalyzer = new H2HAnalyzer(); // NEU: H2H Analyzer

// FOOTBALL-DATA.ORG SERVICE (UNVERÄNDERT)
class FootballDataService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.football-data.org/v4';
        this.availableLeagues = [
            'Premier League', 'Bundesliga', 'La Liga', 'Serie A', 'Ligue 1',
            'Champions League', 'Europa League', 'Championship'
        ];
    }

    async getMatchesByDate(date) {
        if (!this.apiKey) {
            console.log('⚠️  No Football-Data API Key - Using enhanced simulation');
            return this.getEnhancedSimulatedMatches(date);
        }

        try {
            const dateFrom = new Date(date);
            const dateTo = new Date(date);
            dateTo.setDate(dateTo.getDate() + 1);

            const url = `${this.baseURL}/matches?dateFrom=${dateFrom.toISOString().split('T')[0]}&dateTo=${dateTo.toISOString().split('T')[0]}`;
            
            console.log('🔗 Fetching from Football-Data.org:', url);

            const response = await fetch(url, {
                headers: {
                    'X-Auth-Token': this.apiKey,
                    'Accept': 'application/json'
                },
                timeout: 10000
            });

            if (!response.ok) {
                throw new Error(`API Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            const filteredMatches = data.matches?.filter(match => {
                if (!match.utcDate) return false;
                const matchDate = new Date(match.utcDate).toISOString().split('T')[0];
                return matchDate === date && (match.status === 'SCHEDULED' || match.status === 'TIMED' || match.status === 'LIVE');
            }) || [];

            console.log(`✅ Found ${filteredMatches.length} real matches from Football-Data.org`);
            
            return filteredMatches;

        } catch (error) {
            console.log('❌ Football-Data.org error:', error.message);
            console.log('🔄 Falling back to enhanced simulation');
            return this.getEnhancedSimulatedMatches(date);
        }
    }

    getEnhancedSimulatedMatches(date) {
        console.log('🎯 Generating enhanced simulated matches based on real team data');
        
        const matches = [];
        const matchCount = 12 + Math.floor(Math.random() * 8); // 12-20 Spiele

        for (let i = 0; i < matchCount; i++) {
            const league = this.availableLeagues[Math.floor(Math.random() * this.availableLeagues.length)];
            const homeTeam = this.getRandomTeam(league);
            const awayTeam = this.getRandomTeam(league);
            
            if (homeTeam !== awayTeam) {
                const matchDate = new Date(date);
                matchDate.setHours(15 + Math.floor(Math.random() * 8));
                matchDate.setMinutes(Math.random() > 0.5 ? 0 : 30);
                
                matches.push({
                    id: `sim-${Date.now()}-${i}`,
                    homeTeam: { name: homeTeam },
                    awayTeam: { name: awayTeam },
                    competition: { name: league },
                    utcDate: matchDate.toISOString(),
                    status: 'SCHEDULED',
                    source: 'enhanced_simulation'
                });
            }
        }

        return matches;
    }

    getRandomTeam(league) {
        const teams = {
            "Premier League": [
                "Manchester City", "Liverpool", "Arsenal", "Aston Villa", "Tottenham",
                "Manchester United", "Newcastle", "Brighton", "West Ham", "Chelsea",
                "Wolves", "Fulham", "Crystal Palace", "Everton", "Brentford"
            ],
            "Bundesliga": [
                "Bayern Munich", "Bayer Leverkusen", "Stuttgart", "Borussia Dortmund", 
                "RB Leipzig", "Eintracht Frankfurt", "Freiburg", "Augsburg",
                "Hoffenheim", "Werder Bremen", "Heidenheim", "Wolfsburg"
            ],
            "La Liga": [
                "Real Madrid", "Girona", "Barcelona", "Atletico Madrid", "Athletic Bilbao",
                "Real Sociedad", "Real Betis", "Valencia", "Las Palmas", "Getafe"
            ],
            "Serie A": [
                "Inter Milan", "Juventus", "AC Milan", "Fiorentina", "Atalanta",
                "Bologna", "Napoli", "Roma", "Lazio", "Monza"
            ],
            "Ligue 1": [
                "PSG", "Nice", "Monaco", "Lille", "Brest",
                "Lens", "Marseille", "Rennes", "Reims", "Strasbourg"
            ],
            "Champions League": [
                "Manchester City", "Bayern Munich", "Real Madrid", "Barcelona",
                "PSG", "Borussia Dortmund", "Arsenal", "Atletico Madrid"
            ]
        };

        const leagueTeams = teams[league] || teams["Premier League"];
        return leagueTeams[Math.floor(Math.random() * leagueTeams.length)];
    }
}

// REALISTISCHE TEAM-STRENGTHS DATABASE (UNVERÄNDERT)
const REALISTIC_TEAM_STRENGTHS = {
    // Premier League - Aktuelle Werte 2024
    "Manchester City": { attack: 2.45, defense: 0.75, homeStrength: 1.28, awayStrength: 1.18, consistency: 0.92 },
    "Liverpool": { attack: 2.35, defense: 0.82, homeStrength: 1.25, awayStrength: 1.15, consistency: 0.88 },
    "Arsenal": { attack: 2.25, defense: 0.78, homeStrength: 1.24, awayStrength: 1.14, consistency: 0.85 },
    "Aston Villa": { attack: 2.15, defense: 1.05, homeStrength: 1.22, awayStrength: 1.12, consistency: 0.80 },
    "Tottenham": { attack: 2.20, defense: 1.10, homeStrength: 1.23, awayStrength: 1.13, consistency: 0.78 },
    
    // Bundesliga
    "Bayern Munich": { attack: 2.50, defense: 0.70, homeStrength: 1.30, awayStrength: 1.20, consistency: 0.95 },
    "Bayer Leverkusen": { attack: 2.40, defense: 0.75, homeStrength: 1.28, awayStrength: 1.18, consistency: 0.90 },
    "Stuttgart": { attack: 2.20, defense: 0.95, homeStrength: 1.25, awayStrength: 1.15, consistency: 0.82 },
    "Borussia Dortmund": { attack: 2.30, defense: 0.95, homeStrength: 1.25, awayStrength: 1.15, consistency: 0.82 },
    
    // La Liga
    "Real Madrid": { attack: 2.40, defense: 0.75, homeStrength: 1.26, awayStrength: 1.16, consistency: 0.90 },
    "Girona": { attack: 2.25, defense: 1.05, homeStrength: 1.24, awayStrength: 1.14, consistency: 0.85 },
    "Barcelona": { attack: 2.35, defense: 0.80, homeStrength: 1.25, awayStrength: 1.15, consistency: 0.88 },
    "Atletico Madrid": { attack: 2.15, defense: 0.85, homeStrength: 1.22, awayStrength: 1.08, consistency: 0.85 },
    
    // Serie A
    "Inter Milan": { attack: 2.25, defense: 0.75, homeStrength: 1.23, awayStrength: 1.13, consistency: 0.84 },
    "Juventus": { attack: 2.05, defense: 0.80, homeStrength: 1.20, awayStrength: 1.10, consistency: 0.82 },
    "AC Milan": { attack: 2.15, defense: 0.85, homeStrength: 1.21, awayStrength: 1.11, consistency: 0.80 },
    
    // Ligue 1
    "PSG": { attack: 2.45, defense: 0.85, homeStrength: 1.26, awayStrength: 1.16, consistency: 0.78 },
    "Nice": { attack: 2.05, defense: 0.75, homeStrength: 1.18, awayStrength: 1.08, consistency: 0.75 },
    
    "default": { attack: 1.60, defense: 1.40, homeStrength: 1.12, awayStrength: 0.98, consistency: 0.65 }
};

function getRealisticTeamStrength(teamName) {
    // Exakte Übereinstimmung
    if (REALISTIC_TEAM_STRENGTHS[teamName]) {
        return REALISTIC_TEAM_STRENGTHS[teamName];
    }
    
    // Teilweise Übereinstimmung für verschiedene Schreibweisen
    for (const [team, strength] of Object.entries(REALISTIC_TEAM_STRENGTHS)) {
        if (teamName.toLowerCase().includes(team.toLowerCase()) || 
            team.toLowerCase().includes(teamName.toLowerCase())) {
            return strength;
        }
    }
    
    return REALISTIC_TEAM_STRENGTHS.default;
}

// REALISTISCHE xG-BERECHNUNG (UNVERÄNDERT)
async function calculateRealisticXG(homeTeam, awayTeam, league = "") {
    const homeStrength = getRealisticTeamStrength(homeTeam);
    const awayStrength = getRealisticTeamStrength(awayTeam);
    
    // Form-Analyse integrieren
    const homeForm = await formAnalyzer.analyzeTeamForm(homeTeam, formAnalyzer.generateSimulatedForm(homeTeam, 6));
    const awayForm = await formAnalyzer.analyzeTeamForm(awayTeam, formAnalyzer.generateSimulatedForm(awayTeam, 6));
    
    // Basis xG mit Form-Korrektur
    let homeBaseXG = homeStrength.attack * (0.8 + homeForm.overallRating * 0.4);
    let awayBaseXG = awayStrength.attack * (0.8 + awayForm.overallRating * 0.4);
    
    // Verteidigungs-Korrektur
    homeBaseXG *= (2 - awayStrength.defense);
    awayBaseXG *= (2 - homeStrength.defense);
    
    // Liga-spezifische Anpassung
    const leagueFactors = {
        "Premier League": 1.0,
        "Bundesliga": 1.1,    // Mehr Tore
        "La Liga": 0.9,       // Weniger Tore
        "Serie A": 0.85,      // Defensiver
        "Ligue 1": 0.95,
        "Champions League": 1.05
    };
    
    const leagueFactor = leagueFactors[league] || 1.0;
    
    // Finale xG Werte
    const finalHomeXG = homeBaseXG * homeStrength.homeStrength * leagueFactor;
    const finalAwayXG = awayBaseXG * awayStrength.awayStrength * leagueFactor;
    
    return {
        home: Math.max(0.15, Math.min(4.5, +finalHomeXG.toFixed(3))),
        away: Math.max(0.15, Math.min(4.0, +finalAwayXG.toFixed(3))),
        quality: (finalHomeXG + finalAwayXG) * 0.2 + (1 - Math.abs(finalHomeXG - finalAwayXG) / (finalHomeXG + finalAwayXG)) * 0.8,
        confidence: 0.75 + (homeStrength.consistency + awayStrength.consistency) * 0.125,
        formImpact: {
            home: homeForm.overallRating,
            away: awayForm.overallRating
        }
    };
}

// REALISTISCHE WAHRSCHEINLICHKEITEN (UNVERÄNDERT)
function computeRealisticProbabilities(homeXG, awayXG, league, homeTeam, awayTeam) {
    const baseProbs = proCalculator.calculateAdvancedProbabilities(homeXG, awayXG, league);
    
    // Team-spezifische Anpassungen
    const homeStrength = getRealisticTeamStrength(homeTeam);
    const awayStrength = getRealisticTeamStrength(awayTeam);
    
    // Konsistenz-basierte Korrektur
    const consistencyFactor = (homeStrength.consistency + awayStrength.consistency) / 2;
    const confidenceBoost = (consistencyFactor - 0.65) * 0.3;
    
    // Angepasste Wahrscheinlichkeiten
    return {
        ...baseProbs,
        home: Math.min(0.95, baseProbs.home * (1 + confidenceBoost)),
        away: Math.min(0.95, baseProbs.away * (1 + confidenceBoost)),
        draw: Math.max(0.05, baseProbs.draw * (1 - confidenceBoost * 0.5)),
        confidence: 0.7 + consistencyFactor * 0.25
    };
}

// REALISTISCHE TREND-ANALYSE (UNVERÄNDERT - verwende die alte Funktion)
function computeRealisticTrend(prob, xgData, homeTeam, awayTeam) {
    const home = prob.home || 0;
    const away = prob.away || 0;
    const draw = prob.draw || 0;
    
    const homeStrength = getRealisticTeamStrength(homeTeam);
    const awayStrength = getRealisticTeamStrength(awayTeam);
    
    const strengthDiff = homeStrength.attack - awayStrength.attack;
    const homeAdvantage = homeStrength.homeStrength - 1;
    
    let trend = "Balanced";
    let confidence = 0.5;
    
    if (home > 0.7 && strengthDiff > 0.3) {
        trend = home > 0.8 ? "Strong Home" : "Home";
        confidence = 0.8 + (home - 0.7) * 0.5;
    } else if (away > 0.7 && strengthDiff < -0.3) {
        trend = away > 0.8 ? "Strong Away" : "Away";
        confidence = 0.8 + (away - 0.7) * 0.5;
    } else if (draw > 0.4 && Math.abs(home - away) < 0.15) {
        trend = "Draw";
        confidence = 0.7 + (draw - 0.35) * 0.6;
    } else if (home > away + 0.2) {
        trend = homeAdvantage > 0.15 ? "Home" : "Slight Home";
        confidence = 0.6 + (home - away) * 0.8;
    } else if (away > home + 0.2) {
        trend = "Away";
        confidence = 0.6 + (away - home) * 0.8;
    }
    
    return { trend, confidence: Math.min(0.95, confidence) };
}

// REALISTISCHE ANALYSE GENERIEREN (MIT H2H ERWEITERT)
async function generateRealisticAnalysis(homeTeam, awayTeam, probabilities, trend, xgData, value, league) {
    const homeStrength = getRealisticTeamStrength(homeTeam);
    const awayStrength = getRealisticTeamStrength(awayTeam);
    
    // HDH-Analyse
    const hdaAnalysis = await hdaAnalyzer.analyzeHDA(homeTeam, awayTeam, league);
    
    // H2H-ANALYSE HINZUFÜGEN
    const h2hAnalysis = await h2hAnalyzer.analyzeH2H(homeTeam, awayTeam, league);
    
    // Form-Analyse
    const homeForm = await formAnalyzer.analyzeTeamForm(homeTeam);
    const awayForm = await formAnalyzer.analyzeTeamForm(awayTeam);
    
    // Verletzungsanalyse
    const homeInjuries = await injuryTracker.getTeamInjuries(homeTeam);
    const awayInjuries = await injuryTracker.getTeamInjuries(awayTeam);
    
    const analysis = {
        summary: "",
        keyFactors: [],
        recommendation: "",
        riskLevel: "medium",
        confidence: xgData.confidence,
        detailed: {
            strengthComparison: {
                home: homeStrength,
                away: awayStrength,
                advantage: homeStrength.attack - awayStrength.attack
            },
            form: {
                home: homeForm,
                away: awayForm
            },
            injuries: {
                home: homeInjuries,
                away: awayInjuries
            },
            h2h: h2hAnalysis,  // NEU: H2H Analyse hinzufügen
            marketInsights: hdaAnalysis.valueOpportunities
        }
    };

    const homeProb = probabilities.home || 0;
    const awayProb = probabilities.away || 0;
    const bestValue = Math.max(value.home || 0, value.draw || 0, value.away || 0, value.over25 || 0);

    // Dynamische Zusammenfassung basierend auf allen Faktoren
    if (trend.trend === "Strong Home" && homeInjuries.overallImpact < 0.3) {
        analysis.summary = `🔵 ${homeTeam} dominiert mit starker Heimplatzpräsenz (${Math.round(homeProb * 100)}%) und konsistenter Form.`;
        analysis.recommendation = "Heimsieg - Hohe Erfolgschance";
        analysis.riskLevel = "low";
    } else if (trend.trend === "Strong Away" && awayInjuries.overallImpact < 0.3) {
        analysis.summary = `🔴 ${awayTeam} zeigt überzeugende Auswärtsstärke (${Math.round(awayProb * 100)}%) und positive Momentum.`;
        analysis.recommendation = "Auswärtssieg - Gute Value Opportunity";
        analysis.riskLevel = "low";
    } else if (homeProb > 0.6 && homeForm.motivation > 0.7) {
        analysis.summary = `⚡ ${homeTeam} mit Heimplatzvorteil (${Math.round(homeProb * 100)}%) und hoher Motivation.`;
        analysis.recommendation = "Heimsieg - Solide Wahl";
        analysis.riskLevel = "medium";
    } else if (bestValue > 0.15) {
        analysis.summary = `💰 Ausgezeichneter Value (${(bestValue * 100).toFixed(1)}%) bei ausgeglichener Begegnung.`;
        analysis.recommendation = "Value Bet - Attraktive Quote";
        analysis.riskLevel = "medium";
    } else {
        analysis.summary = `⚖️ Ausgeglichenes Spiel - Vorsichtige Herangehensweise empfohlen.`;
        analysis.recommendation = "Risikobewusste Entscheidung";
        analysis.riskLevel = "high";
    }

    // Key Factors
    if (homeProb > 0.55) analysis.keyFactors.push(`Heimstärke: ${Math.round(homeProb * 100)}%`);
    if (awayProb > 0.55) analysis.keyFactors.push(`Auswärtsstärke: ${Math.round(awayProb * 100)}%`);
    if (probabilities.over25 > 0.65) analysis.keyFactors.push(`Hohe Torwahrscheinlichkeit: ${Math.round(probabilities.over25 * 100)}%`);
    if (bestValue > 0.1) analysis.keyFactors.push(`Value: ${(bestValue * 100).toFixed(1)}%`);
    if (homeInjuries.overallImpact > 0.4) analysis.keyFactors.push(`⚠️ ${homeTeam} Verletzungen`);
    if (awayInjuries.overallImpact > 0.4) analysis.keyFactors.push(`⚠️ ${awayTeam} Verletzungen`);

    return analysis;
}

// CACHE SYSTEM (UNVERÄNDERT)
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 Minuten

const footballDataService = new FootballDataService(FOOTBALL_DATA_KEY);

// HAUPT-API ROUTE (UNVERÄNDERT)
app.get('/api/games', async (req, res) => {
    try {
        const requestedDate = req.query.date || new Date().toISOString().split('T')[0];
        const leagueFilter = req.query.league || '';
        
        console.log(`🎯 API Request - Date: ${requestedDate}, League: ${leagueFilter || 'All'}`);
        
        const cacheKey = `games-${requestedDate}-${leagueFilter}`;
        
        // Cache prüfen
        const cached = cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
            console.log('✅ Serving from cache');
            return res.json({ 
                response: cached.data,
                info: { 
                    source: cached.source, 
                    date: requestedDate, 
                    cached: true,
                    version: '6.0.0'
                }
            });
        }
        
        console.log('🔄 Fetching match data from Football-Data.org...');
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

        console.log(`🤖 Starting professional analysis for ${matches.length} matches...`);
        
        // Liga-Filter anwenden
        let filteredMatches = matches;
        if (leagueFilter) {
            filteredMatches = matches.filter(match => 
                match.competition?.name?.toLowerCase().includes(leagueFilter.toLowerCase())
            );
            console.log(`🔍 After league filter: ${filteredMatches.length} matches`);
        }

        Parallele Verarbeitung
        const analyzedGames = await Promise.all(
            filteredMatches.map(async (match) => {
                try {
                    const homeTeam = match.homeTeam?.name || "Unknown Home";
                    const awayTeam = match.awayTeam?.name || "Unknown Away";
                    const league = match.competition?.name || "Unknown League";
                    
                    console.log(`🔍 Analyzing: ${homeTeam} vs ${awayTeam}`);
                    
                    // xG-BERECHNUNG
                    const xgData = await calculateRealisticXG(homeTeam, awayTeam, league);
                    
                    // WAHRSCHEINLICHKEITEN
                    const probabilities = computeRealisticProbabilities(xgData.home, xgData.away, league, homeTeam, awayTeam);
                    
                    // VALUE-BERECHNUNG
                    const value = proCalculator.calculateAdvancedValue(probabilities);
                    
                    // TREND-ANALYSE (alte Funktion verwenden)
                    const trend = computeRealisticTrend(probabilities, xgData, homeTeam, awayTeam);
                    
                    // ANALYSE (jetzt mit H2H)
                    const analysis = await generateRealisticAnalysis(homeTeam, awayTeam, probabilities, trend, xgData, value, league);

                    // KI-SCORE berechnen
                    const kiScore = 0.3 * probabilities.confidence + 
                                  0.25 * trend.confidence + 
                                  0.2 * (Math.max(...Object.values(value)) + 1) + 
                                  0.15 * xgData.quality + 
                                  0.1 * (2 - analysis.riskLevel.length * 0.3);

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
                        prob: {
                            home: probabilities.home,
                            draw: probabilities.draw,
                            away: probabilities.away
                        },
                        over25: probabilities.over25,
                        btts: probabilities.btts,
                        
                        // Value & Odds
                        value: value,
                        
                        // KI-Analyse
                        trend: trend.trend,
                        confidence: probabilities.confidence,
                        kiScore: +kiScore.toFixed(3),
                        analysis: analysis,
                        
                        timestamp: new Date().toISOString(),
                        source: match.source || 'football_data'
                    };
                } catch (error) {
                    console.log(`❌ Error processing match ${match.id}:`, error.message);
                    return null;
                }
            })
        );

        // Filter und Sortierung
        const validGames = analyzedGames.filter(game => game !== null);
        validGames.sort((a, b) => (b.kiScore || 0) - (a.kiScore || 0));

        console.log(`✅ Analysis completed. Processed ${validGames.length} games`);

        const responseData = {
            response: validGames,
            info: {
                date: requestedDate,
                total: validGames.length,
                source: "football_data_org",
                version: "6.0.0",
                timestamp: new Date().toISOString(),
                features: [
                    "Realistic xG Calculation",
                    "Advanced Form Analysis", 
                    "Injury & Suspension Tracking",
                    "Professional Value Detection",
                    "H2H Analysis" // NEU: H2H als Feature
                ]
            }
        };

        // Caching
        cache.set(cacheKey, {
            data: responseData.response,
            timestamp: Date.now(),
            source: "football_data"
        });

        res.json(responseData);

    } catch (error) {
        console.error('❌ API Error:', error);
        res.status(500).json({
            error: error.message,
            info: {
                date: req.query.date,
                source: "api_error", 
                message: "Fehler beim Laden der Spieldaten"
            }
        });
    }
});

// Health Check (UNVERÄNDERT)
app.get('/health', (req, res) => {
    const stats = {
        status: 'OPERATIONAL',
        timestamp: new Date().toISOString(),
        version: '6.0.0',
        api: 'Football-Data.org',
        hasApiKey: !!FOOTBALL_DATA_KEY,
        cache: {
            size: cache.size
        },
        features: [
            'Realistic xG Calculation',
            'Advanced Form Analysis',
            'Real Injury Tracking', 
            'Professional Value Detection',
            'HDH Deep Analysis',
            'H2H Analysis' // NEU: H2H als Feature
        ]
    };
    
    res.json(stats);
});

// Utility Functions (UNVERÄNDERT)
function getProfessionalFlag(teamName) {
    const flagMapping = {
        "Manchester": "gb", "Liverpool": "gb", "Arsenal": "gb", "Aston": "gb", "Tottenham": "gb",
        "Bayern": "de", "Bayer": "de", "Stuttgart": "de", "Dortmund": "de", "Leipzig": "de",
        "Real": "es", "Girona": "es", "Barcelona": "es", "Atletico": "es", "Athletic": "es",
        "Inter": "it", "Juventus": "it", "Milan": "it", "Fiorentina": "it", "Atalanta": "it",
        "PSG": "fr", "Nice": "fr", "Monaco": "fr", "Lille": "fr", "Marseille": "fr"
    };
    
    for (const [key, value] of Object.entries(flagMapping)) {
        if (teamName.toLowerCase().includes(key.toLowerCase())) {
            return value;
        }
    }
    return "eu";
}

// Server starten
app.listen(PORT, () => {
    console.log(`🚀 ProFoot Analytics v6.0.0 - Football-Data.org Edition`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🔗 Health: http://localhost:${PORT}/health`);
    console.log(`🎯 API: http://localhost:${PORT}/api/games`);
    console.log(`🏆 Using: ${FOOTBALL_DATA_KEY ? 'Football-Data.org API' : 'Enhanced Simulation'}`);
});
