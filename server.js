// server-enhanced.js - ULTIMATIVE KI-FUSSBALLANALYSE MIT PRÄZISEN ENSEMBLE-MODELLEN
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProfessionalCalculator } from './professional-calculations.js';
import { HDAAnalyzer } from './hda-analyzer.js';
import { AdvancedFormAnalyzer } from './advanced-form-analyzer.js';
import { InjuryTracker } from './injury-tracker.js';
import { EnhancedEnsemblePredictionModel, PrecisionTrendAnalyzer } from './precision-models.js';
import { MLFeatureEngine } from './ml-feature-engine.js';
import { AdaptiveLearningSystem } from './adaptive-learning-system.js';
import { ValueIntelligenceSystem } from './value-intelligence-system.js';
import { SocialSentimentAnalyzer } from './social-sentiment-analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// Football-Data.org API Key
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_API_KEY;

// Middleware
app.use(express.static(__dirname));
app.use(express.json());

// ULTIMATIVE KI-MODULE INITIALISIEREN
const proCalculator = new ProfessionalCalculator();
const hdaAnalyzer = new HDAAnalyzer();
const formAnalyzer = new AdvancedFormAnalyzer();
const injuryTracker = new InjuryTracker();
const ensembleModel = new EnhancedEnsemblePredictionModel();
const mlFeatureEngine = new MLFeatureEngine();
const learningSystem = new AdaptiveLearningSystem();
const valueIntelligence = new ValueIntelligenceSystem();
const trendAnalyzer = new PrecisionTrendAnalyzer();
const sentimentAnalyzer = new SocialSentimentAnalyzer();

// [EXPANDED_TEAM_DATABASE, DYNAMIC_LEAGUE_FACTORS, REALISTIC_TEAM_STRENGTHS bleiben gleich...]

// FOOTBALL-DATA.ORG SERVICE
class FootballDataService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.football-data.org/v4';
    }

    async getMatchesByDate(date) {
        if (!this.apiKey) {
            return this.getEnhancedSimulatedMatches(date);
        }

        try {
            const dateFrom = new Date(date);
            const dateTo = new Date(date);
            dateTo.setDate(dateTo.getDate() + 1);

            const url = `${this.baseURL}/matches?dateFrom=${dateFrom.toISOString().split('T')[0]}&dateTo=${dateTo.toISOString().split('T')[0]}`;
            
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
            return this.getEnhancedSimulatedMatches(date);
        }
    }

    getEnhancedSimulatedMatches(date) {
        console.log('🎯 Generating enhanced simulated matches');
        
        const matches = [];
        const matchCount = 8 + Math.floor(Math.random() * 10);

        for (let i = 0; i < matchCount; i++) {
            const leagues = Object.keys(EXPANDED_TEAM_DATABASE);
            const league = leagues[Math.floor(Math.random() * leagues.length)];
            const teams = EXPANDED_TEAM_DATABASE[league];
            
            if (teams && teams.length >= 2) {
                const homeTeam = teams[Math.floor(Math.random() * teams.length)];
                let awayTeam = teams[Math.floor(Math.random() * teams.length)];
                
                while (awayTeam === homeTeam && teams.length > 1) {
                    awayTeam = teams[Math.floor(Math.random() * teams.length)];
                }
                
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
        }

        console.log(`🎯 Generated ${matches.length} simulated matches`);
        return matches;
    }
}
// ERWEITERTE TEAM-STRENGTH FUNKTION
function getRealisticTeamStrength(teamName) {
    if (REALISTIC_TEAM_STRENGTHS[teamName]) {
        return REALISTIC_TEAM_STRENGTHS[teamName];
    }
    
    for (const [team, strength] of Object.entries(REALISTIC_TEAM_STRENGTHS)) {
        if (teamName.toLowerCase().includes(team.toLowerCase()) || 
            team.toLowerCase().includes(teamName.toLowerCase())) {
            return strength;
        }
    }
    
    for (const leagueTeams of Object.values(EXPANDED_TEAM_DATABASE)) {
        if (leagueTeams.includes(teamName)) {
            return { 
                attack: 1.70, defense: 1.30, homeStrength: 1.15, awayStrength: 1.02, 
                consistency: 0.68, style: "balanced", pressureHandling: 0.65 
            };
        }
    }
    
    return REALISTIC_TEAM_STRENGTHS.default;
}

// PRÄZISE xG-BERECHNUNG
async function calculatePreciseXG(homeTeam, awayTeam, league = "", context = {}) {
    const homeStrength = getRealisticTeamStrength(homeTeam);
    const awayStrength = getRealisticTeamStrength(awayTeam);
    
    const mlFeatures = await mlFeatureEngine.extractAdvancedFeatures(homeTeam, awayTeam, league);
    const ensemblePrediction = await ensembleModel.predictProbabilities(homeTeam, awayTeam, league);
    
    const homeForm = await formAnalyzer.analyzeTeamForm(homeTeam, formAnalyzer.generateSimulatedForm(homeTeam, 8));
    const awayForm = await formAnalyzer.analyzeTeamForm(awayTeam, formAnalyzer.generateSimulatedForm(awayTeam, 8));
    
    const weightedHomeForm = calculateWeightedForm(homeForm.recentMatches || []);
    const weightedAwayForm = calculateWeightedForm(awayForm.recentMatches || []);
    
    const leagueFactor = DYNAMIC_LEAGUE_FACTORS[league] || DYNAMIC_LEAGUE_FACTORS.default;
    
    const homeBaseXG = ensemblePrediction.homeXG * (2 - awayStrength.defense);
    const awayBaseXG = ensemblePrediction.awayXG * (2 - homeStrength.defense);
    
    const homeMomentum = 1 + (homeForm.formMomentum * 0.3) + (mlFeatures.formMomentum * 0.2);
    const awayMomentum = 1 + (awayForm.formMomentum * 0.3) - (mlFeatures.formMomentum * 0.2);
    
    const finalHomeXG = homeBaseXG * homeStrength.homeStrength * leagueFactor.goalFactor * homeMomentum;
    const finalAwayXG = awayBaseXG * awayStrength.awayStrength * leagueFactor.goalFactor * awayMomentum;
    
    const [homeSentiment, awaySentiment] = await Promise.all([
        sentimentAnalyzer.analyzeTeamSentiment(homeTeam, {
            recentForm: homeForm.overallRating > 0.6 ? "good" : "average",
            nextOpponent: awayTeam,
            isHomeGame: true
        }),
        sentimentAnalyzer.analyzeTeamSentiment(awayTeam, {
            recentForm: awayForm.overallRating > 0.6 ? "good" : "average",
            nextOpponent: homeTeam,
            isHomeGame: false
        })
    ]);
    
    const homeXGWithSentiment = finalHomeXG * (1 + homeSentiment.performanceImpact);
    const awayXGWithSentiment = finalAwayXG * (1 + awaySentiment.performanceImpact);
    
    const confidence = calculateAdvancedConfidence(
        ensemblePrediction.confidence, 
        mlFeatures,
        homeStrength.consistency,
        awayStrength.consistency
    );
    
    return {
        home: Math.max(0.15, Math.min(4.5, +homeXGWithSentiment.toFixed(3))),
        away: Math.max(0.15, Math.min(4.0, +awayXGWithSentiment.toFixed(3))),
        quality: (homeXGWithSentiment + awayXGWithSentiment) * 0.2 + (1 - Math.abs(homeXGWithSentiment - awayXGWithSentiment) / (homeXGWithSentiment + awayXGWithSentiment)) * 0.8,
        confidence: confidence,
        exactScores: ensemblePrediction.exactScore,
        bttsProbability: ensemblePrediction.bttsProbability,
        overUnder: {
            over15: ensemblePrediction.over15,
            over25: ensemblePrediction.over25,
            over35: ensemblePrediction.over35
        },
        marketTrends: ensemblePrediction.marketTrends, // NEU: Market Trends hier übernehmen
        formImpact: {
            home: weightedHomeForm,
            away: weightedAwayForm,
            homeMomentum: homeForm.formMomentum,
            awayMomentum: awayForm.formMomentum
        },
        mlFeatures: mlFeatures,
        ensemblePrediction: ensemblePrediction,
        sentimentAnalysis: {
            home: homeSentiment,
            away: awaySentiment
        }
    };
}

// WEIGHTED FORM CALCULATION
function calculateWeightedForm(matches) {
    if (matches.length === 0) return 0.5;
    
    const weightedSum = matches.reduce((sum, match, index) => {
        const weight = Math.pow(0.85, index);
        const points = match.result === 'win' ? 1 : match.result === 'draw' ? 0.5 : 0;
        return sum + (points * weight);
    }, 0);
    
    const totalWeight = matches.reduce((sum, _, index) => sum + Math.pow(0.85, index), 0);
    
    return weightedSum / totalWeight;
}

// ADVANCED CONFIDENCE CALCULATION
function calculateAdvancedConfidence(baseConfidence, mlFeatures, homeConsistency, awayConsistency) {
    const featureConfidence = mlFeatureEngine.calculateFeatureConsistency(mlFeatures);
    const consistencyScore = (homeConsistency + awayConsistency) / 2;
    const historicalAccuracy = learningSystem.getModelAccuracy('ensemble');
    
    return (baseConfidence * 0.4) + (featureConfidence * 0.35) + (consistencyScore * 0.15) + (historicalAccuracy * 0.10);
}

// ENSEMBLE WAHRSCHEINLICHKEITEN
async function computeEnsembleProbabilities(homeXG, awayXG, league, homeTeam, awayTeam, mlFeatures) {
    const baseProbs = proCalculator.calculateAdvancedProbabilities(homeXG, awayXG, league);
    const ensembleProbs = await ensembleModel.predictProbabilities(homeTeam, awayTeam, league);
    
    console.log(`🔍 ENSEMBLE CHECK: ${homeTeam} vs ${awayTeam}`);
    console.log(`   Home: ${(ensembleProbs.home * 100).toFixed(1)}% | Draw: ${(ensembleProbs.draw * 100).toFixed(1)}% | Away: ${(ensembleProbs.away * 100).toFixed(1)}%`);
    
    if (ensembleProbs.home > 0.6 && ensembleProbs.away < 0.2) {
        console.log(`⚠️  Home-Bias erkannt! Korrigiere...`);
        const correction = (ensembleProbs.home - 0.5) * 0.3;
        ensembleProbs.home -= correction;
        ensembleProbs.away += correction;
    }
    
    const mlCorrection = mlFeatureEngine.calculateProbabilityCorrection(mlFeatures);
    
    const combinedProbs = {
        home: (baseProbs.home * 0.4 + ensembleProbs.home * 0.4 + mlCorrection.home * 0.2),
        draw: (baseProbs.draw * 0.4 + ensembleProbs.draw * 0.4 + mlCorrection.draw * 0.2),
        away: (baseProbs.away * 0.4 + ensembleProbs.away * 0.4 + mlCorrection.away * 0.2),
        over25: (baseProbs.over25 * 0.5 + ensembleProbs.over25 * 0.3 + mlCorrection.over25 * 0.2),
        over15: (baseProbs.over15 * 0.5 + ensembleProbs.over15 * 0.3 + mlCorrection.over15 * 0.2),
        over35: (baseProbs.over35 * 0.5 + ensembleProbs.over35 * 0.3 + mlCorrection.over35 * 0.2),
        btts: (baseProbs.btts * 0.5 + ensembleProbs.btts * 0.3 + mlCorrection.btts * 0.2)
    };
    
    const totalHD = combinedProbs.home + combinedProbs.draw + combinedProbs.away;
    combinedProbs.home /= totalHD;
    combinedProbs.draw /= totalHD;
    combinedProbs.away /= totalHD;
    
    return {
        ...combinedProbs,
        confidence: calculateAdvancedConfidence(
            ensembleProbs.confidence,
            mlFeatures,
            getRealisticTeamStrength(homeTeam).consistency,
            getRealisticTeamStrength(awayTeam).consistency
        ),
        modelBreakdown: {
            poisson: baseProbs,
            ensemble: ensembleProbs,
            mlCorrection: mlCorrection
        }
    };
}
// PREDICTIVE TREND-ANALYSE
async function computePredictiveTrends(probabilities, xgData, homeTeam, awayTeam, league, mlFeatures) {
    const historicalPatterns = await trendAnalyzer.getHistoricalPatterns(league);
    const currentGameData = {
        probabilities,
        xgData,
        teams: { home: homeTeam, away: awayTeam },
        league,
        mlFeatures
    };
    
    return await trendAnalyzer.analyzeMultiDimensionalTrends(currentGameData, historicalPatterns);
}

// INTELLIGENTE VALUE-ERKENNUNG
async function findSmartValueOpportunities(probabilities, homeTeam, awayTeam, league) {
    const marketOdds = await valueIntelligence.fetchMarketOdds(homeTeam, awayTeam, league);
    return await valueIntelligence.findSmartValueBets(probabilities, marketOdds);
}

// SENTIMENT SUMMARY GENERATOR
function generateSentimentSummary(sentimentAnalysis) {
    const { home, away } = sentimentAnalysis;
    
    let summary = "";
    
    if (home.crisisAlerts.length > 0 || away.crisisAlerts.length > 0) {
        summary = `⚠️ Krisen-Alerts: ${home.crisisAlerts.length} (Heim) / ${away.crisisAlerts.length} (Auswärts)`;
    } else if (home.sentimentScore > 0.2 && away.sentimentScore > 0.2) {
        summary = "✅ Beide Teams mit positiver Stimmung";
    } else if (home.sentimentScore < -0.2 && away.sentimentScore < -0.2) {
        summary = "🔻 Beide Teams mit negativer Stimmung";
    } else {
        summary = `⚖️ Gemischte Stimmung: ${(home.sentimentScore * 100).toFixed(0)}% vs ${(away.sentimentScore * 100).toFixed(0)}%`;
    }
    
    return summary;
}

// ULTIMATIVE ANALYSE GENERIERUNG
async function generateUltimateAnalysis(homeTeam, awayTeam, probabilities, trendAnalysis, xgData, value, league, mlFeatures) {
    const homeStrength = getRealisticTeamStrength(homeTeam);
    const awayStrength = getRealisticTeamStrength(awayTeam);
    
    const [hdaAnalysis, homeForm, awayForm, homeInjuries, awayInjuries, valueOpportunities] = await Promise.all([
        hdaAnalyzer.analyzeHDA(homeTeam, awayTeam, league),
        formAnalyzer.analyzeTeamForm(homeTeam),
        formAnalyzer.analyzeTeamForm(awayTeam),
        injuryTracker.getTeamInjuries(homeTeam),
        injuryTracker.getTeamInjuries(awayTeam),
        findSmartValueOpportunities(probabilities, homeTeam, awayTeam, league)
    ]);
    
    const analysis = {
        summary: "",
        keyFactors: [],
        recommendation: "",
        riskLevel: "medium",
        confidence: xgData.confidence,
        trends: trendAnalysis,
        detailed: {
            strengthComparison: {
                home: homeStrength,
                away: awayStrength,
                advantage: homeStrength.attack - awayStrength.attack,
                styleMatchup: mlFeatureEngine.analyzeStyleCompatibility(homeStrength.style, awayStrength.style)
            },
            form: {
                home: homeForm,
                away: awayForm,
                momentumDifference: homeForm.formMomentum - awayForm.formMomentum,
                weightedForm: {
                    home: calculateWeightedForm(homeForm.recentMatches || []),
                    away: calculateWeightedForm(awayForm.recentMatches || [])
                }
            },
            injuries: {
                home: homeInjuries,
                away: awayInjuries,
                totalImpact: (homeInjuries.overallImpact + awayInjuries.overallImpact) / 2
            },
            marketInsights: valueOpportunities,
            qualityMetrics: {
                matchQuality: xgData.quality,
                expectedGoals: xgData.home + xgData.away,
                balance: 1 - Math.abs(probabilities.home - probabilities.away),
                predictability: DYNAMIC_LEAGUE_FACTORS[league]?.predictability || 0.8
            },
            mlAnalysis: {
                features: mlFeatures,
                confidence: xgData.confidence,
                ensembleBreakdown: xgData.ensemblePrediction
            },
            sentiment: xgData.sentimentAnalysis
        }
    };
    
    // BEST MARKET TREND AUS XG DATA HOLEN
    const bestMarketTrend = xgData.marketTrends?.bestTrend;
    const bestMarket = xgData.marketTrends?.bestMarket;
    
    const bestValue = Math.max(value.home || 0, value.draw || 0, value.away || 0, value.over25 || 0);
    const topTrend = trendAnalysis.primaryTrend;
    const sentimentImpact = xgData.sentimentAnalysis;

    // ERWEITERTE ENTSCHEIDUNGSLOGIK MIT MARKET TRENDS
    if (bestMarketTrend && bestMarketTrend.confidence > 0.8 && bestValue > 0.15) {
        analysis.summary = `🎯 TOP TREND: ${bestMarket} - ${bestMarketTrend.description}`;
        analysis.recommendation = `Starke Empfehlung für ${bestMarket} (${(bestMarketTrend.probability * 100).toFixed(1)}% Wahrscheinlichkeit)`;
        analysis.riskLevel = "low";
    } else if (topTrend.confidence > 0.8 && bestValue > 0.15 && sentimentImpact.home.sentimentScore > 0.1) {
        analysis.summary = `🎯 HOHE KONFIDENZ: ${topTrend.description} mit ${(bestValue * 100).toFixed(1)}% Value & positiver Stimmung`;
        analysis.recommendation = "Starke Empfehlung - Hohe KI-Konfidenz + Positive Stimmung";
        analysis.riskLevel = "low";
    } else if (topTrend.confidence > 0.7 && bestValue > 0.08) {
        analysis.summary = `📈 GUTE CHANCE: ${topTrend.description} mit ${(bestValue * 100).toFixed(1)}% Value`;
        analysis.recommendation = "Solide Option - Gute Erfolgsaussichten";
        analysis.riskLevel = "medium";
    } else if (sentimentImpact.home.crisisAlerts.length > 0 || sentimentImpact.away.crisisAlerts.length > 0) {
        analysis.summary = `⚠️ VORSICHT: Krisen-Stimmung bei ${sentimentImpact.home.crisisAlerts.length > 0 ? homeTeam : awayTeam}`;
        analysis.recommendation = "Risikobewusste Entscheidung - Krisensituation";
        analysis.riskLevel = "high";
    } else {
        analysis.summary = `⚖️ AUSGEGLICHEN: ${generateSentimentSummary(sentimentImpact)}`;
        analysis.recommendation = "Risikobewusste Entscheidung";
        analysis.riskLevel = "medium";
    }

    // KEY FACTORS MIT MARKET TRENDS
    analysis.keyFactors = [];
    
    // Füge besten Market Trend hinzu
    if (bestMarketTrend) {
        analysis.keyFactors.push(`🏆 Top Trend: ${bestMarket} (${(bestMarketTrend.probability * 100).toFixed(1)}%)`);
    }
    
    // Füge andere Trends hinzu
    analysis.keyFactors.push(
        ...trendAnalysis.allTrends.slice(0, 2).map(trend => `${trend.description} (${Math.round(trend.confidence * 100)}%)`),
        `ML Confidence: ${Math.round(mlFeatures.confidence * 100)}%`,
        `Value Opportunity: ${(bestValue * 100).toFixed(1)}%`
    );

    // Füge alle Market Trends als separate Liste hinzu
    analysis.marketTrends = xgData.marketTrends;

    // Warnungen hinzufügen
    if (homeInjuries.overallImpact > 0.4) analysis.keyFactors.push(`⚠️ ${homeTeam} stark von Verletzungen betroffen`);
    if (awayInjuries.overallImpact > 0.4) analysis.keyFactors.push(`⚠️ ${awayTeam} stark von Verletzungen betroffen`);
    if (mlFeatures.fatigueImpact > 0.3) analysis.keyFactors.push(`🕒 Ermüdungsfaktor beachten`);
    if (sentimentImpact.home.crisisAlerts.length > 0) analysis.keyFactors.push(`🔥 ${homeTeam} in Krisensituation`);
    if (sentimentImpact.away.crisisAlerts.length > 0) analysis.keyFactors.push(`🔥 ${awayTeam} in Krisensituation`);

    return analysis;
}

// CACHE SYSTEM
const cache = new Map();
const CACHE_DURATION = 8 * 60 * 1000;

const footballDataService = new FootballDataService(FOOTBALL_DATA_KEY);

// HAUPT-API ROUTE MIT ALLEN VERBESSERUNGEN
app.get('/api/games', async (req, res) => {
    try {
        const requestedDate = req.query.date || new Date().toISOString().split('T')[0];
        const leagueFilter = req.query.league || '';
        
        console.log(`🎯 ULTIMATE API Request - Date: ${requestedDate}, League: ${leagueFilter || 'All'}`);
        
        const cacheKey = `games-${requestedDate}-${leagueFilter}`;
        
        const cached = cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
            console.log('✅ Serving from cache');
            return res.json({ 
                response: cached.data,
                info: { 
                    source: cached.source, 
                    date: requestedDate, 
                    cached: true,
                    version: '8.2.0',
                    features: ['Multi-Market Trends', 'Precise Ensemble Models', 'ML Features']
                }
            });
        }
        
        console.log('🔄 Fetching match data with MULTI-MARKET TREND analysis...');
        const matches = await footballDataService.getMatchesByDate(requestedDate);
        
        if (matches.length === 0) {
            return res.json({
                response: [],
                info: {
                    date: requestedDate,
                    total: 0,
                    source: "football_data",
                    message: "Keine Spiele für dieses Datum gefunden",
                    version: '8.2.0'
                }
            });
        }

        console.log(`🤖 Starting MULTI-MARKET TREND analysis for ${matches.length} matches...`);
        
        let filteredMatches = matches;
        if (leagueFilter) {
            filteredMatches = matches.filter(match => 
                match.competition?.name?.toLowerCase().includes(leagueFilter.toLowerCase())
            );
            console.log(`🔍 After league filter: ${filteredMatches.length} matches`);
        }

        const analyzedGames = await Promise.all(
            filteredMatches.map(async (match) => {
                try {
                    const homeTeam = match.homeTeam?.name || "Unknown Home";
                    const awayTeam = match.awayTeam?.name || "Unknown Away";
                    const league = match.competition?.name || "Unknown League";
                    
                    console.log(`🔍 MULTI-MARKET Analysis: ${homeTeam} vs ${awayTeam}`);
                    
                    const mlFeatures = await mlFeatureEngine.extractAdvancedFeatures(homeTeam, awayTeam, league);
                    const xgData = await calculatePreciseXG(homeTeam, awayTeam, league, mlFeatures);
                    const probabilities = await computeEnsembleProbabilities(xgData.home, xgData.away, league, homeTeam, awayTeam, mlFeatures);
                    const value = await valueIntelligence.findSmartValueBets(probabilities);
                    const trendAnalysis = await computePredictiveTrends(probabilities, xgData, homeTeam, awayTeam, league, mlFeatures);
                    const analysis = await generateUltimateAnalysis(homeTeam, awayTeam, probabilities, trendAnalysis, xgData, value, league, mlFeatures);

                    // KI-SCORE MIT MARKET TRENDS
                    const marketTrendBonus = xgData.marketTrends?.bestTrend?.confidence || 0;
                    const kiScore = 0.18 * probabilities.confidence + 
                                  0.16 * trendAnalysis.confidence + 
                                  0.14 * (Math.max(...Object.values(value)) + 1) + 
                                  0.12 * xgData.quality + 
                                  0.10 * (2 - analysis.riskLevel.length * 0.3) +
                                  0.10 * analysis.detailed.qualityMetrics.balance +
                                  0.08 * mlFeatures.confidence +
                                  0.12 * marketTrendBonus;

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
                        over15: probabilities.over15,
                        over35: probabilities.over35,
                        btts: probabilities.btts,
                        bttsProbability: xgData.bttsProbability,
                        
                        // Exakte Score-Wahrscheinlichkeiten
                        exactScores: xgData.exactScores,
                        
                        // NEU: Market Trends in Haupt-Response
                        marketTrends: xgData.marketTrends,
                        
                        // Value & Odds
                        value: value,
                        
                        // ULTIMATIVE KI-Analyse
                        trendAnalysis: trendAnalysis,
                        confidence: probabilities.confidence,
                        kiScore: +kiScore.toFixed(3),
                        analysis: analysis,
                        mlFeatures: mlFeatures,
                        sentimentImpact: {
                            home: xgData.sentimentAnalysis.home.performanceImpact,
                            away: xgData.sentimentAnalysis.away.performanceImpact
                        },
                        
                        timestamp: new Date().toISOString(),
                        source: match.source || 'football_data',
                        teamStrengths: {
                            home: getRealisticTeamStrength(homeTeam),
                            away: getRealisticTeamStrength(awayTeam)
                        },
                        modelInfo: {
                            version: '8.2.0',
                            ensemble: true,
                            mlEnhanced: true,
                            adaptiveLearning: true,
                            sentimentAnalysis: true,
                            multiMarketTrends: true
                        }
                    };
                } catch (error) {
                    console.log(`❌ Error processing match ${match.id}:`, error.message);
                    return null;
                }
            })
        );

        const validGames = analyzedGames.filter(game => game !== null);
        validGames.sort((a, b) => (b.kiScore || 0) - (a.kiScore || 0));

        console.log(`✅ MULTI-MARKET analysis completed. Processed ${validGames.length} games`);

        const responseData = {
            response: validGames,
            info: {
                date: requestedDate,
                total: validGames.length,
                source: "football_data_org",
                version: "8.2.0",
                timestamp: new Date().toISOString(),
                features: [
                    "Multi-Market Trend Analysis",
                    "Precise Ensemble Prediction Models",
                    "Machine Learning Feature Engine", 
                    "Adaptive Learning System",
                    "Predictive Trend Analysis",
                    "Intelligent Value Detection",
                    "Social Media Sentiment Analysis",
                    "Exact Score Probabilities",
                    "Multiple Over/Under Markets"
                ],
                leagues: Object.keys(EXPANDED_TEAM_DATABASE),
                teamCount: Object.values(EXPANDED_TEAM_DATABASE).reduce((sum, teams) => sum + teams.length, 0),
                modelPerformance: await learningSystem.getPerformanceStats()
            }
        };

        cache.set(cacheKey, {
            data: responseData.response,
            timestamp: Date.now(),
            source: "football_data"
        });

        res.json(responseData);

    } catch (error) {
        console.error('❌ MULTI-MARKET API Error:', error);
        res.status(500).json({
            error: error.message,
            info: {
                date: req.query.date,
                source: "api_error", 
                message: "Fehler beim Laden der Spieldaten",
                version: "8.2.0"
            }
        });
    }
});
    // Health Check
app.get('/health', async (req, res) => {
    const stats = {
        status: 'MULTI-MARKET TRENDS OPERATIONAL',
        timestamp: new Date().toISOString(),
        version: '8.2.0',
        api: 'Football-Data.org',
        hasApiKey: !!FOOTBALL_DATA_KEY,
        cache: {
            size: cache.size
        },
        features: [
            'Multi-Market Trend Analysis',
            'Precise Ensemble Prediction Models',
            'Machine Learning Feature Engine',
            'Adaptive Learning System',
            'Predictive Trend Analysis',
            'Intelligent Value Detection',
            'Social Media Sentiment Analysis'
        ],
        teamDatabase: {
            totalLeagues: Object.keys(EXPANDED_TEAM_DATABASE).length,
            totalTeams: Object.values(EXPANDED_TEAM_DATABASE).reduce((sum, teams) => sum + teams.length, 0)
        }
    };
    
    res.json(stats);
});

// Utility Functions
function getProfessionalFlag(teamName) {
    const flagMapping = {
        "Manchester": "gb", "Liverpool": "gb", "Arsenal": "gb", "Aston": "gb", "Tottenham": "gb",
        "Bayern": "de", "Bayer": "de", "Stuttgart": "de", "Dortmund": "de", "Leipzig": "de",
        "Real": "es", "Girona": "es", "Barcelona": "es", "Atletico": "es", "Athletic": "es",
        "Inter": "it", "Juventus": "it", "Milan": "it", "Fiorentina": "it", "Atalanta": "it",
        "PSG": "fr", "Nice": "fr", "Monaco": "fr", "Lille": "fr", "Marseille": "fr",
        "Leicester": "gb", "Leeds": "gb", "Southampton": "gb", "Norwich": "gb",
        "Miami": "us", "Los Angeles": "us", "Philadelphia": "us", "Austin": "us",
        "PSV": "nl", "Feyenoord": "nl", "Ajax": "nl", "AZ": "nl",
        "Benfica": "pt", "Porto": "pt", "Sporting": "pt", "Braga": "pt"
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
    console.log(`🚀 ULTIMATE ProFoot Analytics v8.2.0 - Multi-Market Trend System`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🔗 Health: http://localhost:${PORT}/health`);
    console.log(`🎯 API: http://localhost:${PORT}/api/games`);
    console.log(`🏆 Using: ${FOOTBALL_DATA_KEY ? 'Football-Data.org API' : 'Enhanced Simulation'}`);
    console.log(`🤖 Features: Multi-Market Trends, Precise Ensemble Models, ML Engine`);
    console.log(`📊 Team Database: ${Object.values(EXPANDED_TEAM_DATABASE).reduce((sum, teams) => sum + teams.length, 0)} teams across ${Object.keys(EXPANDED_TEAM_DATABASE).length} leagues`);
    console.log(`🎯 Multi-Market: Over/Under, BTTS, 1X2 mit individuellen Trend-Analysen`);
});        
