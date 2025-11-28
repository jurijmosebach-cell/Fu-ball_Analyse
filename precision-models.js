// precision-models.js - Präzise Berechnungen für Ensemble-Modelle mit Multi-Market Trends
export class EnhancedEnsemblePredictionModel {
    constructor() {
        this.models = {
            poisson: new PrecisionPoissonModel(),
            xgBoost: new PrecisionXGBoostModel(),
            neuralNet: new PrecisionNeuralNetworkModel(),
            timeSeries: new PrecisionTimeSeriesModel(),
            marketModel: new PrecisionMarketEfficiencyModel()
        };
        
        this.weights = {
            poisson: 0.28,
            xgBoost: 0.24,
            neuralNet: 0.20,
            timeSeries: 0.16,
            marketModel: 0.12
        };
        
        this.performanceHistory = new Map();
        this.learningRate = 0.015;
    }

    async predictProbabilities(homeTeam, awayTeam, league) {
        const predictions = await Promise.all([
            this.models.poisson.predict(homeTeam, awayTeam, league),
            this.models.xgBoost.predict(homeTeam, awayTeam, league),
            this.models.neuralNet.predict(homeTeam, awayTeam, league),
            this.models.timeSeries.predict(homeTeam, awayTeam, league),
            this.models.marketModel.predict(homeTeam, awayTeam, league)
        ]);

        return this.precisionWeightedAverage(predictions, homeTeam, awayTeam, league);
    }

    precisionWeightedAverage(predictions, homeTeam, awayTeam, league) {
        const result = {
            home: 0, draw: 0, away: 0,
            over25: 0, over15: 0, over35: 0,
            btts: 0, bttsProbability: 0,
            homeXG: 0, awayXG: 0,
            confidence: 0,
            exactScore: {},
            // NEUE FELDER FÜR TREND-ANALYSE
            marketTrends: {
                bestMarket: '',
                bestTrend: {},
                allTrends: [],
                confidence: 0
            }
        };

        // Gewichtete Mittelwerte berechnen
        Object.keys(this.weights).forEach((model, index) => {
            const weight = this.weights[model];
            const pred = predictions[index];
            
            result.home += pred.home * weight;
            result.draw += pred.draw * weight;
            result.away += pred.away * weight;
            result.over25 += pred.over25 * weight;
            result.over15 += pred.over15 * weight;
            result.over35 += pred.over35 * weight;
            result.btts += pred.btts * weight;
            result.homeXG += pred.homeXG * weight;
            result.awayXG += pred.awayXG * weight;
            result.confidence += (pred.confidence || 0.7) * weight;
        });

        // HDA Normalisierung
        const totalHDA = result.home + result.draw + result.away;
        result.home /= totalHDA;
        result.draw /= totalHDA;
        result.away /= totalHDA;

        // Exakte Score-Wahrscheinlichkeiten berechnen
        result.exactScore = this.calculateExactScoreProbabilities(result.homeXG, result.awayXG);

        // BTTS Probability basierend auf beiden Teams Scoring
        result.bttsProbability = this.calculatePreciseBTTS(result.homeXG, result.awayXG);

        // MARKT-TREND ANALYSE FÜR ALLE MÄRKTE
        result.marketTrends = this.analyzeAllMarketTrends(result, homeTeam, awayTeam, league);

        return result;
    }

    // NEUE METHODE: ANALYSE ALLER MARKT-TRENDS
    analyzeAllMarketTrends(probabilities, homeTeam, awayTeam, league) {
        const marketProbabilities = {
            'Heimsieg': { probability: probabilities.home, market: 'home', type: '1x2' },
            'Unentschieden': { probability: probabilities.draw, market: 'draw', type: '1x2' },
            'Auswärtssieg': { probability: probabilities.away, market: 'away', type: '1x2' },
            'Over 1.5 Goals': { probability: probabilities.over15, market: 'over15', type: 'goals' },
            'Over 2.5 Goals': { probability: probabilities.over25, market: 'over25', type: 'goals' },
            'Over 3.5 Goals': { probability: probabilities.over35, market: 'over35', type: 'goals' },
            'Beide Teams Schießen': { probability: probabilities.btts, market: 'btts', type: 'btts' }
        };

        const trends = [];
        
        // Analysiere jeden Markt
        Object.entries(marketProbabilities).forEach(([marketName, data]) => {
            const trend = this.analyzeSingleMarketTrend(data.probability, marketName, data.type, probabilities, homeTeam, awayTeam, league);
            trends.push(trend);
        });

        // Finde den besten Trend (höchste Confidence + hohe Probability)
        const bestTrend = this.findBestTrend(trends);
        
        return {
            bestMarket: bestTrend.market,
            bestTrend: bestTrend,
            allTrends: trends.sort((a, b) => b.confidence - a.confidence),
            confidence: Math.max(...trends.map(t => t.confidence))
        };
    }

    analyzeSingleMarketTrend(probability, marketName, marketType, allProbabilities, homeTeam, awayTeam, league) {
        let strength, confidence, description, reasoning;
        
        // Stärke basierend auf Wahrscheinlichkeit und Konfidenz
        if (probability > 0.75) {
            strength = 'sehr_hoch';
            confidence = 0.85 + (probability - 0.75) * 0.6;
        } else if (probability > 0.65) {
            strength = 'hoch';
            confidence = 0.75 + (probability - 0.65) * 0.5;
        } else if (probability > 0.55) {
            strength = 'mittel';
            confidence = 0.65 + (probability - 0.55) * 0.4;
        } else if (probability > 0.45) {
            strength = 'gering';
            confidence = 0.55 + (probability - 0.45) * 0.3;
        } else {
            strength = 'sehr_gering';
            confidence = 0.45 + probability * 0.2;
        }

        // Begrenze Confidence
        confidence = Math.min(0.95, Math.max(0.3, confidence));

        // Generiere beschreibenden Text basierend auf Markttyp
        description = this.generateMarketDescription(marketName, probability, strength, homeTeam, awayTeam, allProbabilities);
        
        // Generiere detaillierte Begründung
        reasoning = this.generateMarketReasoning(marketName, marketType, probability, allProbabilities, homeTeam, awayTeam, league);

        return {
            market: marketName,
            probability: +probability.toFixed(4),
            strength: strength,
            confidence: +confidence.toFixed(3),
            description: description,
            reasoning: reasoning,
            type: marketType,
            value: this.calculateMarketValue(probability, marketType)
        };
    }

    generateMarketDescription(marketName, probability, strength, homeTeam, awayTeam, allProbabilities) {
        const strengthTexts = {
            'sehr_hoch': 'sehr hohe',
            'hoch': 'hohe', 
            'mittel': 'solide',
            'gering': 'leichte',
            'sehr_gering': 'sehr geringe'
        };

        const probabilityPercent = (probability * 100).toFixed(1);
        const strengthText = strengthTexts[strength];

        // Spezifische Beschreibungen für verschiedene Märkte
        switch(marketName) {
            case 'Heimsieg':
                return `${homeTeam} mit ${strengthText} Siegchance (${probabilityPercent}%)`;
            case 'Auswärtssieg':
                return `${awayTeam} mit ${strengthText} Auswärtschance (${probabilityPercent}%)`;
            case 'Unentschieden':
                return `Unentschieden mit ${strengthText} Wahrscheinlichkeit (${probabilityPercent}%)`;
            case 'Over 1.5 Goals':
                return `${strengthText} Chance auf mind. 2 Tore (${probabilityPercent}%)`;
            case 'Over 2.5 Goals':
                return `${strengthText} Chance auf mind. 3 Tore (${probabilityPercent}%)`;
            case 'Over 3.5 Goals':
                return `${strengthText} Chance auf mind. 4 Tore (${probabilityPercent}%)`;
            case 'Beide Teams Schießen':
                return `${strengthText} Chance dass beide Teams treffen (${probabilityPercent}%)`;
            default:
                return `${marketName} mit ${strengthText} Wahrscheinlichkeit (${probabilityPercent}%)`;
        }
    }

    generateMarketReasoning(marketName, marketType, probability, allProbabilities, homeTeam, awayTeam, league) {
        const reasons = [];
        const { homeXG, awayXG, bttsProbability, over25, over15 } = allProbabilities;

        switch(marketType) {
            case '1x2':
                if (marketName === 'Heimsieg') {
                    if (homeXG > 2.0) reasons.push(`${homeTeam} mit starkem Heim-xG (${homeXG})`);
                    if (homeXG - awayXG > 0.8) reasons.push(`Deutliche Heimüberlegenheit im xG (${homeXG} vs ${awayXG})`);
                    if (allProbabilities.home > 0.6) reasons.push('Klar favorisierte Heimmannschaft');
                } else if (marketName === 'Auswärtssieg') {
                    if (awayXG > 1.8) reasons.push(`${awayTeam} mit starkem Auswärts-xG (${awayXG})`);
                    if (awayXG - homeXG > 0.5) reasons.push(`Auswärtsstärke im xG (${awayXG} vs ${homeXG})`);
                } else if (marketName === 'Unentschieden') {
                    if (Math.abs(allProbabilities.home - allProbabilities.away) < 0.2) reasons.push('Ausgeglichene Mannschaftsstärken');
                    if (homeXG + awayXG < 2.2) reasons.push('Geringe Torerwartung begünstigt Unentschieden');
                }
                break;

            case 'goals':
                const totalXG = homeXG + awayXG;
                if (marketName.includes('Over')) {
                    const goalThreshold = parseInt(marketName.split(' ')[1]);
                    if (totalXG > goalThreshold) reasons.push(`Hohe Gesamt-Torerwartung (${totalXG.toFixed(2)} xG)`);
                    if (homeXG > 1.5 && awayXG > 1.2) reasons.push('Beide Teams mit starkem Angriff');
                    if (league.includes('Bundesliga')) reasons.push('Liga mit traditionell vielen Toren');
                }
                break;

            case 'btts':
                if (bttsProbability > 0.6) reasons.push('Hohe BTTS-Wahrscheinlichkeit basierend auf xG');
                if (homeXG > 1.2 && awayXG > 1.0) reasons.push('Beide Teams mit guter Torerwartung');
                if (allProbabilities.home < 0.7 && allProbabilities.away < 0.7) reasons.push('Ausgeglichenes Spiel begünstigt BTTS');
                break;
        }

        // Füge allgemeine Gründe hinzu
        if (probability > 0.7) reasons.push('Sehr hohe Modell-Konfidenz');
        if (probability > 0.6 && probability < 0.7) reasons.push('Hohe Vorhersage-Sicherheit');

        return reasons.length > 0 ? reasons : ['Basierend auf Ensemble-Modell Berechnungen'];
    }

    calculateMarketValue(probability, marketType) {
        // Berechne Value basierend auf Wahrscheinlichkeit und Markttyp
        const baseValue = probability * 100;
        let multiplier = 1.0;
        
        switch(marketType) {
            case '1x2': multiplier = 1.1; break;
            case 'goals': multiplier = 1.05; break;
            case 'btts': multiplier = 1.08; break;
        }
        
        return +(baseValue * multiplier).toFixed(1);
    }

    findBestTrend(trends) {
        // Bewerte Trends basierend auf Confidence, Probability und Value
        const scoredTrends = trends.map(trend => {
            let score = trend.confidence * 0.4 + trend.probability * 0.4 + (trend.value / 100) * 0.2;
            
            // Bonus für bestimmte Markttypen
            if (trend.type === 'goals') score *= 1.05;
            if (trend.type === 'btts') score *= 1.03;
            
            return { ...trend, score: +score.toFixed(3) };
        });

        // Rücke den Trend mit der höchsten Bewertung
        return scoredTrends.sort((a, b) => b.score - a.score)[0];
    }

    calculateExactScoreProbabilities(homeXG, awayXG) {
        const scores = {};
        let totalProb = 0;
        
        // Bis zu 5 Tore pro Team berechnen (99.9% Abdeckung)
        for (let i = 0; i <= 5; i++) {
            for (let j = 0; j <= 5; j++) {
                const prob = this.poissonProbability(i, homeXG) * this.poissonProbability(j, awayXG);
                scores[`${i}-${j}`] = +prob.toFixed(4);
                totalProb += prob;
            }
        }
        
        // Normalisieren auf 100%
        Object.keys(scores).forEach(score => {
            scores[score] = +(scores[score] / totalProb).toFixed(4);
        });
        
        return scores;
    }

    calculatePreciseBTTS(homeXG, awayXG) {
        const probHomeScores = 1 - Math.exp(-homeXG);
        const probAwayScores = 1 - Math.exp(-awayXG);
        return +(probHomeScores * probAwayScores).toFixed(3);
    }

    poissonProbability(k, lambda) {
        return (Math.pow(lambda, k) * Math.exp(-lambda)) / this.factorial(k);
    }

    factorial(n) {
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return result;
    }

    // Rest der Methoden (updateWeights, calculateModelErrors, etc.) bleiben gleich
    async updateWeights(actualResults, predictions) {
        const errors = this.calculateModelErrors(actualResults, predictions);
        
        Object.keys(this.weights).forEach(model => {
            const modelError = errors[model];
            const performanceAdjustment = this.learningRate * (1 - modelError);
            
            this.weights[model] = Math.max(0.05, Math.min(0.35, 
                this.weights[model] * (1 - performanceAdjustment)
            ));
        });

        this.normalizeWeights();
        
        this.performanceHistory.set(Date.now(), {
            errors,
            weights: { ...this.weights }
        });
    }

    calculateModelErrors(actual, predicted) {
        const errors = {};
        const markets = ['home', 'draw', 'away', 'over25', 'btts'];
        
        Object.keys(this.weights).forEach(model => {
            let totalError = 0;
            markets.forEach(market => {
                if (actual[market] !== undefined) {
                    totalError += Math.abs(actual[market] - predicted[market]);
                }
            });
            errors[model] = totalError / markets.length;
        });

        return errors;
    }

    normalizeWeights() {
        const weights = this.weights;
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        
        Object.keys(weights).forEach(model => {
            weights[model] /= totalWeight;
        });
    }

    getModelPerformance() {
        return {
            weights: this.weights,
            recentPerformance: this.getRecentPerformance(),
            learningRate: this.learningRate
        };
    }

    getRecentPerformance() {
        const recentEntries = Array.from(this.performanceHistory.entries())
            .slice(-10)
            .map(([timestamp, data]) => data);
        
        if (recentEntries.length === 0) return { averageError: 0.3 };
        
        const averageErrors = {};
        Object.keys(this.weights).forEach(model => {
            averageErrors[model] = recentEntries.reduce((sum, entry) => sum + entry.errors[model], 0) / recentEntries.length;
        });
        
        return {
            averageError: Object.values(averageErrors).reduce((sum, error) => sum + error, 0) / Object.keys(averageErrors).length,
            modelErrors: averageErrors
        };
    }
 }
// PRÄZISES POISSON-MODELL (angepasst für bessere Markt-Trends)
class PrecisionPoissonModel {
    async predict(homeTeam, awayTeam, league) {
        const homeStrength = this.getPreciseTeamStrength(homeTeam);
        const awayStrength = this.getPreciseTeamStrength(awayTeam);
        const leagueFactors = this.getLeagueFactors(league);
        
        const homeXG = this.calculatePreciseXG(homeStrength, awayStrength, leagueFactors, true);
        const awayXG = this.calculatePreciseXG(awayStrength, homeStrength, leagueFactors, false);
        
        const probs = this.calculateAllPoissonProbabilities(homeXG, awayXG);
        
        return {
            ...probs,
            homeXG: +homeXG.toFixed(3),
            awayXG: +awayXG.toFixed(3),
            confidence: this.calculatePoissonConfidence(homeXG, awayXG)
        };
    }

    calculatePreciseXG(attackingTeam, defendingTeam, leagueFactors, isHome) {
        const baseXG = attackingTeam.attack * (2 - defendingTeam.defense);
        const homeAdvantage = isHome ? leagueFactors.homeAdvantage : 1;
        const styleMultiplier = this.getStyleMultiplier(attackingTeam.style, defendingTeam.style);
        const formImpact = 1 + (attackingTeam.recentForm * 0.2 - defendingTeam.recentForm * 0.1);
        
        return baseXG * homeAdvantage * styleMultiplier * formImpact * leagueFactors.goalFactor;
    }

    calculateAllPoissonProbabilities(homeXG, awayXG) {
        let homeWin = 0, draw = 0, awayWin = 0;
        let over25 = 0, over15 = 0, over35 = 0;
        let btts = 0;
        
        for (let i = 0; i <= 10; i++) {
            for (let j = 0; j <= 10; j++) {
                const prob = this.poissonProbability(i, homeXG) * this.poissonProbability(j, awayXG);
                
                if (i > j) homeWin += prob;
                else if (i === j) draw += prob;
                else awayWin += prob;
                
                const totalGoals = i + j;
                if (totalGoals > 2.5) over25 += prob;
                if (totalGoals > 1.5) over15 += prob;
                if (totalGoals > 3.5) over35 += prob;
                
                if (i > 0 && j > 0) btts += prob;
            }
        }
        
        return {
            home: +homeWin.toFixed(4),
            draw: +draw.toFixed(4),
            away: +awayWin.toFixed(4),
            over25: +over25.toFixed(4),
            over15: +over15.toFixed(4),
            over35: +over35.toFixed(4),
            btts: +btts.toFixed(4)
        };
    }

    getPreciseTeamStrength(teamName) {
        const strengths = {
            "Manchester City": { attack: 2.45, defense: 0.75, style: "possession", recentForm: 0.85 },
            "Liverpool": { attack: 2.35, defense: 0.82, style: "pressing", recentForm: 0.82 },
            // ... (weitere Teams wie zuvor)
            "default": { attack: 1.70, defense: 1.30, style: "balanced", recentForm: 0.50 }
        };
        return strengths[teamName] || strengths.default;
    }

    getStyleMultiplier(style1, style2) {
        const multipliers = {
            "possession-pressing": 1.1,
            "counter-possession": 1.15,
            // ... (weitere Multipliers)
            "default": 1.0
        };
        return multipliers[`${style1}-${style2}`] || multipliers.default;
    }

    getLeagueFactors(league) {
        const factors = {
            "Premier League": { homeAdvantage: 1.12, goalFactor: 1.05 },
            "Bundesliga": { homeAdvantage: 1.15, goalFactor: 1.18 },
            // ... (weitere Ligen)
            "default": { homeAdvantage: 1.08, goalFactor: 1.00 }
        };
        return factors[league] || factors.default;
    }

    calculatePoissonConfidence(homeXG, awayXG) {
        const xGDiff = Math.abs(homeXG - awayXG);
        const totalXG = homeXG + awayXG;
        const confidence = 0.6 + (xGDiff * 0.1) + (Math.min(totalXG, 4) * 0.05);
        return Math.min(0.95, +confidence.toFixed(3));
    }

    poissonProbability(k, lambda) {
        return (Math.pow(lambda, k) * Math.exp(-lambda)) / this.factorial(k);
    }

    factorial(n) {
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return result;
    }
}

// Die anderen Modelle (XGBoost, NeuralNetwork, TimeSeries, MarketEfficiency) bleiben gleich
// ... [Hier die unveränderten Modelle einfügen]

// ERWEITERTER TREND-ANALYZER FÜR ALLE MÄRKTE
export class PrecisionTrendAnalyzer {
    constructor() {
        this.trendPeriods = [5, 10, 15];
    }

    async analyzeMultiDimensionalTrends(matchData, historicalPatterns) {
        const trends = {
            primaryTrend: await this.analyzePrimaryTrend(matchData),
            secondaryTrends: await this.analyzeSecondaryTrends(matchData),
            momentumTrends: await this.analyzeMomentumTrends(matchData),
            marketTrends: await this.analyzeMarketTrends(matchData), // NEUE METHODE
            patternMatches: await this.findHistoricalPatterns(matchData, historicalPatterns),
            confidence: 0,
            allTrends: [],
            bestMarketOpportunity: {} // NEU: Bester Markt-Opportunity
        };

        trends.confidence = this.calculateTrendConfidence(trends);
        trends.allTrends = this.consolidateAllTrends(trends);
        trends.bestMarketOpportunity = this.findBestMarketOpportunity(trends, matchData);
        
        return trends;
    }

    // NEUE METHODE: ANALYSE MARKT-TRENDS
    async analyzeMarketTrends(matchData) {
        const { probabilities, xgData, homeTeam, awayTeam, league } = matchData;
        
        const marketTrends = [];
        
        // Analysiere alle verfügbaren Märkte
        const markets = [
            { name: 'Heimsieg', probability: probabilities.home, type: '1x2' },
            { name: 'Unentschieden', probability: probabilities.draw, type: '1x2' },
            { name: 'Auswärtssieg', probability: probabilities.away, type: '1x2' },
            { name: 'Over 1.5 Goals', probability: probabilities.over15, type: 'goals' },
            { name: 'Over 2.5 Goals', probability: probabilities.over25, type: 'goals' },
            { name: 'Over 3.5 Goals', probability: probabilities.over35, type: 'goals' },
            { name: 'Beide Teams Schießen', probability: probabilities.btts, type: 'btts' }
        ];

        markets.forEach(market => {
            const trend = this.analyzeMarketTrend(market, xgData, homeTeam, awayTeam, league);
            marketTrends.push(trend);
        });

        return marketTrends.sort((a, b) => b.confidence - a.confidence);
    }

    analyzeMarketTrend(market, xgData, homeTeam, awayTeam, league) {
        const { homeXG, awayXG } = xgData;
        const totalXG = homeXG + awayXG;
        
        let confidence = market.probability * 0.8;
        let reasoning = [];

        switch(market.type) {
            case '1x2':
                if (market.name === 'Heimsieg') {
                    if (homeXG > 2.0) reasoning.push('Starke Heim-Torerwartung');
                    if (homeXG - awayXG > 0.8) reasoning.push('Deutliche Heimüberlegenheit');
                } else if (market.name === 'Auswärtssieg') {
                    if (awayXG > 1.8) reasoning.push('Starke Auswärts-Torerwartung');
                }
                break;
                
            case 'goals':
                const goalThreshold = parseInt(market.name.split(' ')[1]);
                if (totalXG > goalThreshold + 0.3) {
                    reasoning.push(`Hohe Gesamttorerwartung (${totalXG.toFixed(2)} xG)`);
                    confidence *= 1.1;
                }
                break;
                
            case 'btts':
                const bttsXG = (1 - Math.exp(-homeXG)) * (1 - Math.exp(-awayXG));
                if (bttsXG > 0.6) {
                    reasoning.push('Hohe xG-basierte BTTS-Wahrscheinlichkeit');
                    confidence *= 1.05;
                }
                break;
        }

        return {
            market: market.name,
            probability: market.probability,
            confidence: +confidence.toFixed(3),
            reasoning: reasoning,
            type: market.type,
            valueScore: this.calculateMarketValueScore(market.probability, market.type)
        };
    }

    calculateMarketValueScore(probability, marketType) {
        const baseScore = probability * 100;
        let multiplier = 1.0;
        
        // Höherer Value für spezifische Märkte
        if (marketType === 'goals') multiplier = 1.1;
        if (marketType === 'btts') multiplier = 1.05;
        
        return +(baseScore * multiplier).toFixed(1);
    }

    findBestMarketOpportunity(trends, matchData) {
        const marketTrends = trends.marketTrends || [];
        if (marketTrends.length === 0) return null;

        // Bewerte jeden Markt-Trend
        const scoredMarkets = marketTrends.map(trend => {
            const score = trend.confidence * 0.5 + (trend.valueScore / 100) * 0.3 + trend.probability * 0.2;
            return { ...trend, opportunityScore: +score.toFixed(3) };
        });

        const bestMarket = scoredMarkets.sort((a, b) => b.opportunityScore - a.opportunityScore)[0];
        
        return {
            market: bestMarket.market,
            probability: bestMarket.probability,
            confidence: bestMarket.confidence,
            opportunityScore: bestMarket.opportunityScore,
            reasoning: bestMarket.reasoning,
            recommendation: `Top Opportunity: ${bestMarket.market} mit ${(bestMarket.probability * 100).toFixed(1)}% Wahrscheinlichkeit`
        };
    }

    // ... (restliche Methoden wie zuvor)
    async analyzePrimaryTrend(matchData) {
        // Implementierung wie zuvor
    }

    async analyzeSecondaryTrends(matchData) {
        // Implementierung wie zuvor
    }

    // ... etc.
}

export default EnhancedEnsemblePredictionModel;
