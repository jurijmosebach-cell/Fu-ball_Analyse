// ensemble-prediction-model.js - Ensemble Prediction System
export class EnsemblePredictionModel {
    constructor() {
        this.models = {
            poisson: new PoissonModel(),
            xgBoost: new XGBoostModel(),
            neuralNet: new NeuralNetworkModel(),
            timeSeries: new TimeSeriesModel(),
            marketModel: new MarketEfficiencyModel()
        };
        
        this.weights = {
            poisson: 0.25,
            xgBoost: 0.22,
            neuralNet: 0.20,
            timeSeries: 0.18,
            marketModel: 0.15
        };
        
        this.performanceHistory = new Map();
        this.learningRate = 0.015;
    }

    async predict(homeTeam, awayTeam, league) {
        const predictions = await Promise.all([
            this.models.poisson.predict(homeTeam, awayTeam, league),
            this.models.xgBoost.predict(homeTeam, awayTeam, league),
            this.models.neuralNet.predict(homeTeam, awayTeam, league),
            this.models.timeSeries.predict(homeTeam, awayTeam, league),
            this.models.marketModel.predict(homeTeam, awayTeam, league)
        ]);

        return this.weightedEnsembleAverage(predictions);
    }

    async predictProbabilities(homeTeam, awayTeam, league) {
        const predictions = await this.predict(homeTeam, awayTeam, league);
        
        return {
            home: predictions.homeWin,
            draw: predictions.draw,
            away: predictions.awayWin,
            over25: predictions.over25,
            btts: predictions.btts,
            confidence: predictions.confidence,
            modelContributions: predictions.modelContributions
        };
    }

    // ERSETZE DIESE METHODE komplett:
weightedEnsembleAverage(predictions) {
    const result = {
        homeWin: 0,
        draw: 0,
        awayWin: 0,
        over25: 0,
        btts: 0,
        confidence: 0,
        homeXG: 0,
        awayXG: 0,
        modelContributions: {}
    };

    Object.keys(this.weights).forEach((model, index) => {
        const weight = this.weights[model];
        const prediction = predictions[index];
        
        // ✅ SICHERE WERTE - Home-Bias reduzieren
        const safeHome = Math.max(0.1, Math.min(0.8, prediction.homeWin || 0.33));
        const safeDraw = Math.max(0.1, Math.min(0.5, prediction.draw || 0.33));
        const safeAway = Math.max(0.1, Math.min(0.8, prediction.awayWin || 0.34));
        const safeOver25 = Math.max(0.1, Math.min(0.9, prediction.over25 || 0.5));
        const safeBtts = Math.max(0.1, Math.min(0.9, prediction.btts || 0.5));
        
        result.homeWin += safeHome * weight;
        result.draw += safeDraw * weight;
        result.awayWin += safeAway * weight;
        result.over25 += safeOver25 * weight;
        result.btts += safeBtts * weight;
        result.confidence += (prediction.confidence || 0.5) * weight;
        result.homeXG += (prediction.homeXG || 1.2) * weight;
        result.awayXG += (prediction.awayXG || 1.0) * weight;
        
        result.modelContributions[model] = {
            homeWin: safeHome,
            confidence: prediction.confidence || 0.5,
            weight: weight
        };
    });

    // ✅ KORREKTE NORMALISIERUNG
    const totalHD = result.homeWin + result.draw + result.awayWin;
    if (totalHD > 0.8 && totalHD < 1.2) { // Nur normalisieren wenn sinnvoll
        result.homeWin /= totalHD;
        result.draw /= totalHD;
        result.awayWin /= totalHD;
    } else {
        // Fallback: Ausgeglichene Verteilung
        result.homeWin = 0.35;
        result.draw = 0.30;
        result.awayWin = 0.35;
    }
    
    // ✅ FINALE BEGRENZUNG
    result.homeWin = Math.max(0.15, Math.min(0.75, result.homeWin));
    result.draw = Math.max(0.15, Math.min(0.45, result.draw));
    result.awayWin = Math.max(0.15, Math.min(0.75, result.awayWin));
    result.over25 = Math.max(0.2, Math.min(0.9, result.over25));
    result.btts = Math.max(0.2, Math.min(0.9, result.btts));

    return result;
}

    async updateWeights(actualResults, predictions) {
        const errors = this.calculateModelErrors(actualResults, predictions);
        
        Object.keys(this.weights).forEach(model => {
            const modelError = errors[model];
            const performanceAdjustment = this.learningRate * (1 - modelError);
            
            // Adaptive weight adjustment
            this.weights[model] = Math.max(0.05, Math.min(0.35, 
                this.weights[model] * (1 - performanceAdjustment)
            ));
        });

        // Normalize weights
        this.normalizeWeights();
        
        // Update performance history
        this.performanceHistory.set(Date.now(), {
            errors,
            weights: { ...this.weights }
        });
    }

    calculateModelErrors(actual, predicted) {
        const errors = {};
        const markets = ['homeWin', 'draw', 'awayWin', 'over25', 'btts'];
        
        Object.keys(this.weights).forEach(model => {
            let totalError = 0;
            markets.forEach(market => {
                if (actual[market] !== undefined) {
                    totalError += Math.abs(actual[market] - predicted.modelContributions[model][market]);
                }
            });
            errors[model] = totalError / markets.length;
        });

        return errors;
    }

    normalizeWeights() {
        const totalWeight = Object.values(this.weights).reduce((sum, weight) => sum + weight, 0);
        Object.keys(this.weights).forEach(model => {
            this.weights[model] /= totalWeight;
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
// Supporting Model Classes
class PoissonModel {
    async predict(homeTeam, awayTeam, league) {
        // Simplified Poisson implementation
        const homeStrength = this.getTeamStrength(homeTeam);
        const awayStrength = this.getTeamStrength(awayTeam);
        
        const homeXG = homeStrength.attack * (2 - awayStrength.defense);
        const awayXG = awayStrength.attack * (2 - homeStrength.defense);
        
        return {
            homeWin: this.calculateWinProbability(homeXG, awayXG, 'home'),
            draw: this.calculateDrawProbability(homeXG, awayXG),
            awayWin: this.calculateWinProbability(homeXG, awayXG, 'away'),
            over25: this.calculateOver25Probability(homeXG, awayXG),
            btts: this.calculateBTTSProbability(homeXG, awayXG),
            confidence: 0.75 + (homeStrength.consistency + awayStrength.consistency) * 0.125,
            homeXG,
            awayXG
        };
    }

    calculateWinProbability(homeXG, awayXG, side) {
        let winProb = 0;
        for (let i = 0; i <= 10; i++) {
            for (let j = 0; j <= 10; j++) {
                const prob = this.poisson(i, homeXG) * this.poisson(j, awayXG);
                if ((side === 'home' && i > j) || (side === 'away' && j > i)) {
                    winProb += prob;
                }
            }
        }
        return winProb;
    }

    calculateDrawProbability(homeXG, awayXG) {
        let drawProb = 0;
        for (let i = 0; i <= 10; i++) {
            drawProb += this.poisson(i, homeXG) * this.poisson(i, awayXG);
        }
        return drawProb;
    }

    calculateOver25Probability(homeXG, awayXG) {
        let over25Prob = 0;
        for (let i = 0; i <= 10; i++) {
            for (let j = 0; j <= 10; j++) {
                if (i + j > 2.5) {
                    over25Prob += this.poisson(i, homeXG) * this.poisson(j, awayXG);
                }
            }
        }
        return over25Prob;
    }

    calculateBTTSProbability(homeXG, awayXG) {
        const homeScoreProb = 1 - this.poisson(0, homeXG);
        const awayScoreProb = 1 - this.poisson(0, awayXG);
        return homeScoreProb * awayScoreProb;
    }

    poisson(k, lambda) {
        return (Math.pow(lambda, k) * Math.exp(-lambda)) / this.factorial(k);
    }

    factorial(n) {
        if (n <= 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return result;
    }

    getTeamStrength(teamName) {
        // Simplified team strength lookup
        const strengths = {
            "Manchester City": { attack: 2.45, defense: 0.75, consistency: 0.92 },
            "Liverpool": { attack: 2.35, defense: 0.82, consistency: 0.88 },
            "Bayern Munich": { attack: 2.50, defense: 0.70, consistency: 0.95 },
            "default": { attack: 1.70, defense: 1.30, consistency: 0.70 }
        };
        return strengths[teamName] || strengths.default;
    }
}

class XGBoostModel {
    async predict(homeTeam, awayTeam, league) {
        // Simulated XGBoost predictions based on features
        const features = this.extractFeatures(homeTeam, awayTeam, league);
        const prediction = this.predictWithFeatures(features);
        
        return {
            ...prediction,
            confidence: 0.78,
            homeXG: prediction.homeXG,
            awayXG: prediction.awayXG
        };
    }

    extractFeatures(homeTeam, awayTeam, league) {
        return {
            strengthDifference: this.getStrengthDifference(homeTeam, awayTeam),
            formDifference: this.getFormDifference(homeTeam, awayTeam),
            homeAdvantage: this.getHomeAdvantage(league),
            historicalPerformance: this.getHistoricalEdge(homeTeam, awayTeam)
        };
    }

    predictWithFeatures(features) {
        // Simplified XGBoost-like prediction
        const baseHomeWin = 0.4 + (features.strengthDifference * 0.2) + (features.homeAdvantage * 0.1);
        const baseDraw = 0.25 - Math.abs(features.strengthDifference * 0.1);
        const baseAwayWin = 0.35 - (features.strengthDifference * 0.2) + (features.homeAdvantage * -0.1);
        
        // Normalize
        const total = baseHomeWin + baseDraw + baseAwayWin;
        
        return {
            homeWin: baseHomeWin / total,
            draw: baseDraw / total,
            awayWin: baseAwayWin / total,
            over25: 0.5 + (features.strengthDifference * 0.1),
            btts: 0.45 + (Math.abs(features.strengthDifference) * 0.05),
            homeXG: 1.5 + (features.strengthDifference * 0.3),
            awayXG: 1.2 - (features.strengthDifference * 0.2)
        };
    }

    getStrengthDifference(homeTeam, awayTeam) {
        const strengths = {
            "Manchester City": 0.95, "Liverpool": 0.90, "Bayern Munich": 0.92,
            "default": 0.70
        };
        const homeStrength = strengths[homeTeam] || strengths.default;
        const awayStrength = strengths[awayTeam] || strengths.default;
        return homeStrength - awayStrength;
    }

    getFormDifference(homeTeam, awayTeam) {
        // Simulated form difference
        return (Math.random() - 0.5) * 0.4;
    }

    getHomeAdvantage(league) {
        const advantages = {
            "Premier League": 0.12, "Bundesliga": 0.15, "La Liga": 0.10,
            "default": 0.08
        };
        return advantages[league] || advantages.default;
    }

    getHistoricalEdge(homeTeam, awayTeam) {
        // Simulated historical edge
        return (Math.random() - 0.5) * 0.2;
    }
}

class NeuralNetworkModel {
    async predict(homeTeam, awayTeam, league) {
        // Simulated neural network predictions
        const embedding = this.getTeamEmbedding(homeTeam, awayTeam);
        const context = this.getMatchContext(league);
        
        const prediction = this.forwardPass(embedding, context);
        
        return {
            ...prediction,
            confidence: 0.82,
            homeXG: prediction.homeXG,
            awayXG: prediction.awayXG
        };
    }

    getTeamEmbedding(homeTeam, awayTeam) {
        // Simulated team embeddings
        const teams = ["Manchester City", "Liverpool", "Bayern Munich", "Real Madrid"];
        const homeIndex = teams.indexOf(homeTeam);
        const awayIndex = teams.indexOf(awayTeam);
        
        return {
            home: homeIndex !== -1 ? homeIndex / teams.length : 0.5,
            away: awayIndex !== -1 ? awayIndex / teams.length : 0.5,
            similarity: Math.abs((homeIndex / teams.length) - (awayIndex / teams.length))
        };
    }

    getMatchContext(league) {
        const contexts = {
            "Premier League": { intensity: 0.9, predictability: 0.85 },
            "Bundesliga": { intensity: 0.95, predictability: 0.80 },
            "Champions League": { intensity: 0.92, predictability: 0.82 },
            "default": { intensity: 0.8, predictability: 0.75 }
        };
        return contexts[league] || contexts.default;
    }

    forwardPass(embedding, context) {
        // Simplified neural network forward pass
        const hidden1 = this.relu(embedding.home * 0.6 + embedding.away * 0.4 + context.intensity * 0.3);
        const hidden2 = this.relu(embedding.similarity * 0.8 + context.predictability * 0.5);
        
        const homeWin = this.sigmoid(hidden1 * 0.7 + hidden2 * 0.3 - 0.2);
        const draw = this.sigmoid(embedding.similarity * 0.9 - hidden1 * 0.4 + 0.1);
        const awayWin = this.sigmoid(hidden2 * 0.6 - embedding.home * 0.3 + 0.1);
        
        // Normalize
        const total = homeWin + draw + awayWin;
        
        return {
            homeWin: homeWin / total,
            draw: draw / total,
            awayWin: awayWin / total,
            over25: this.sigmoid(context.intensity * 0.8 + (1 - embedding.similarity) * 0.4),
            btts: this.sigmoid((1 - embedding.similarity) * 0.7 + context.intensity * 0.3),
            homeXG: 1.2 + hidden1 * 0.8,
            awayXG: 1.0 + hidden2 * 0.6
        };
    }

    relu(x) {
        return Math.max(0, x);
    }

    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }
}

class TimeSeriesModel {
    async predict(homeTeam, awayTeam, league) {
        // Simulated time series analysis
        const trends = this.analyzeTrends(homeTeam, awayTeam);
        const seasonality = this.getSeasonality(league);
        
        const prediction = this.combineTrends(trends, seasonality);
        
        return {
            ...prediction,
            confidence: 0.75,
            homeXG: prediction.homeXG,
            awayXG: prediction.awayXG
        };
    }

    analyzeTrends(homeTeam, awayTeam) {
        // Simulated trend analysis
        return {
            homeTrend: (Math.random() - 0.5) * 0.3,
            awayTrend: (Math.random() - 0.5) * 0.3,
            momentum: Math.random() * 0.4 - 0.2
        };
    }

    getSeasonality(league) {
        // Simulated seasonal patterns
        const now = new Date();
        const month = now.getMonth();
        
        // More goals in certain months (simulated)
        const seasonalFactor = Math.sin((month / 12) * 2 * Math.PI) * 0.1;
        
        return {
            goalFactor: 1 + seasonalFactor,
            drawFactor: 1 - Math.abs(seasonalFactor * 0.5)
        };
    }

    combineTrends(trends, seasonality) {
        const baseHome = 0.4 + trends.homeTrend;
        const baseAway = 0.35 + trends.awayTrend;
        const baseDraw = 0.25 - (trends.homeTrend + trends.awayTrend) * 0.5;
        
        // Normalize
        const total = baseHome + baseDraw + baseAway;
        
        return {
            homeWin: baseHome / total,
            draw: baseDraw / total,
            awayWin: baseAway / total,
            over25: 0.5 + trends.momentum * 0.2 + (seasonality.goalFactor - 1),
            btts: 0.45 + Math.abs(trends.momentum) * 0.1,
            homeXG: 1.3 + trends.homeTrend * 0.5,
            awayXG: 1.1 + trends.awayTrend * 0.5
        };
    }
}

class MarketEfficiencyModel {
    async predict(homeTeam, awayTeam, league) {
        // Simulated market efficiency analysis
        const marketData = this.getMarketData(homeTeam, awayTeam);
        const efficiency = this.analyzeEfficiency(marketData);
        
        const prediction = this.adjustForEfficiency(marketData, efficiency);
        
        return {
            ...prediction,
            confidence: 0.70,
            homeXG: prediction.homeXG,
            awayXG: prediction.awayXG
        };
    }

    getMarketData(homeTeam, awayTeam) {
        // Simulated market data
        return {
            homeOdds: 1.8 + (Math.random() - 0.5) * 0.6,
            drawOdds: 3.2 + (Math.random() - 0.5) * 0.8,
            awayOdds: 4.0 + (Math.random() - 0.5) * 1.2,
            volume: Math.random(),
            movement: (Math.random() - 0.5) * 0.1
        };
    }

    analyzeEfficiency(marketData) {
        // Analyze market efficiency
        const impliedHome = 1 / marketData.homeOdds;
        const impliedDraw = 1 / marketData.drawOdds;
        const impliedAway = 1 / marketData.awayOdds;
        
        const overround = impliedHome + impliedDraw + impliedAway - 1;
        const efficiency = 1 - (overround / 3); // Basic efficiency measure
        
        return {
            efficiency,
            overround,
            valueOpportunities: this.findValueOpportunities(marketData)
        };
    }

    findValueOpportunities(marketData) {
        // Simplified value detection
        const opportunities = [];
        
        if (marketData.movement > 0.05) opportunities.push('home');
        if (marketData.movement < -0.03) opportunities.push('away');
        if (marketData.volume > 0.7) opportunities.push('high_volume');
        
        return opportunities;
    }

    adjustForEfficiency(marketData, efficiency) {
        const baseProb = {
            homeWin: 1 / marketData.homeOdds,
            draw: 1 / marketData.drawOdds,
            awayWin: 1 / marketData.awayOdds
        };
        
        // Adjust for market efficiency
        const adjustment = (1 - efficiency.efficiency) * 0.1;
        
        return {
            homeWin: baseProb.homeWin * (1 + adjustment),
            draw: baseProb.draw * (1 - adjustment * 0.5),
            awayWin: baseProb.awayWin * (1 + adjustment),
            over25: 0.52 + (efficiency.efficiency - 0.9) * 0.1,
            btts: 0.48 + (marketData.volume * 0.1),
            homeXG: 1.4 + (adjustment * 0.3),
            awayXG: 1.2 - (adjustment * 0.2)
        };
    }
  }
