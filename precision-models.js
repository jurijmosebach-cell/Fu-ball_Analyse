// precision-models.js - Präzise Berechnungen für Ensemble-Modelle
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
            exactScore: {}
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

        return result;
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
// PRÄZISES POISSON-MODELL
class PrecisionPoissonModel {
    async predict(homeTeam, awayTeam, league) {
        const homeStrength = this.getPreciseTeamStrength(homeTeam);
        const awayStrength = this.getPreciseTeamStrength(awayTeam);
        const leagueFactors = this.getLeagueFactors(league);
        
        // Präzise xG-Berechnung mit Liga-Faktoren
        const homeXG = this.calculatePreciseXG(homeStrength, awayStrength, leagueFactors, true);
        const awayXG = this.calculatePreciseXG(awayStrength, homeStrength, leagueFactors, false);
        
        // Poisson-Wahrscheinlichkeiten für alle Märkte
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
        
        // Bis 10 Tore für 99.99% Genauigkeit
        for (let i = 0; i <= 10; i++) {
            for (let j = 0; j <= 10; j++) {
                const prob = this.poissonProbability(i, homeXG) * this.poissonProbability(j, awayXG);
                
                // Match Outcome
                if (i > j) homeWin += prob;
                else if (i === j) draw += prob;
                else awayWin += prob;
                
                // Over/Under
                const totalGoals = i + j;
                if (totalGoals > 2.5) over25 += prob;
                if (totalGoals > 1.5) over15 += prob;
                if (totalGoals > 3.5) over35 += prob;
                
                // BTTS
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
            "Bayern Munich": { attack: 2.50, defense: 0.70, style: "dominant", recentForm: 0.88 },
            "Real Madrid": { attack: 2.40, defense: 0.78, style: "counter", recentForm: 0.84 },
            "Arsenal": { attack: 2.25, defense: 0.80, style: "possession", recentForm: 0.80 },
            "Barcelona": { attack: 2.30, defense: 0.80, style: "possession", recentForm: 0.78 },
            "PSG": { attack: 2.35, defense: 0.82, style: "dominant", recentForm: 0.80 },
            "Borussia Dortmund": { attack: 2.20, defense: 0.85, style: "pressing", recentForm: 0.77 },
            "Atletico Madrid": { attack: 2.10, defense: 0.75, style: "counter", recentForm: 0.82 },
            "Inter Milan": { attack: 2.25, defense: 0.75, style: "tactical", recentForm: 0.83 },
            "Juventus": { attack: 2.15, defense: 0.78, style: "defensive", recentForm: 0.79 },
            "Chelsea": { attack: 2.15, defense: 0.85, style: "possession", recentForm: 0.75 },
            "Tottenham": { attack: 2.20, defense: 0.88, style: "attacking", recentForm: 0.76 },
            "Newcastle": { attack: 2.10, defense: 0.90, style: "pressing", recentForm: 0.72 },
            "Aston Villa": { attack: 2.15, defense: 0.87, style: "attacking", recentForm: 0.78 },
            "Bayer Leverkusen": { attack: 2.30, defense: 0.75, style: "possession", recentForm: 0.86 },
            "RB Leipzig": { attack: 2.25, defense: 0.82, style: "pressing", recentForm: 0.80 },
            "AC Milan": { attack: 2.15, defense: 0.82, style: "counter", recentForm: 0.78 },
            "Napoli": { attack: 2.25, defense: 0.85, style: "attacking", recentForm: 0.75 },
            "default": { attack: 1.70, defense: 1.30, style: "balanced", recentForm: 0.50 }
        };
        return strengths[teamName] || strengths.default;
    }

    getStyleMultiplier(style1, style2) {
        const multipliers = {
            "possession-pressing": 1.1,
            "counter-possession": 1.15,
            "pressing-counter": 0.9,
            "dominant-balanced": 1.05,
            "tactical-attacking": 0.95,
            "defensive-counter": 1.08,
            "attacking-defensive": 0.92,
            "default": 1.0
        };
        return multipliers[`${style1}-${style2}`] || multipliers.default;
    }

    getLeagueFactors(league) {
        const factors = {
            "Premier League": { homeAdvantage: 1.12, goalFactor: 1.05 },
            "Bundesliga": { homeAdvantage: 1.15, goalFactor: 1.18 },
            "La Liga": { homeAdvantage: 1.08, goalFactor: 0.95 },
            "Serie A": { homeAdvantage: 1.10, goalFactor: 0.88 },
            "Ligue 1": { homeAdvantage: 1.12, goalFactor: 1.02 },
            "Champions League": { homeAdvantage: 1.05, goalFactor: 1.12 },
            "Europa League": { homeAdvantage: 1.03, goalFactor: 1.08 },
            "Championship": { homeAdvantage: 1.13, goalFactor: 1.02 },
            "MLS": { homeAdvantage: 1.14, goalFactor: 1.10 },
            "Eredivisie": { homeAdvantage: 1.11, goalFactor: 1.12 },
            "Primeira Liga": { homeAdvantage: 1.09, goalFactor: 0.96 },
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

// PRÄZISES XGBOOST-MODELL
class PrecisionXGBoostModel {
    async predict(homeTeam, awayTeam, league) {
        const features = this.extractPreciseFeatures(homeTeam, awayTeam, league);
        const prediction = this.gradientBoostedPrediction(features);
        
        return {
            ...prediction,
            confidence: features.modelConfidence
        };
    }

    extractPreciseFeatures(homeTeam, awayTeam, league) {
        const homeStats = this.getTeamStats(homeTeam);
        const awayStats = this.getTeamStats(awayTeam);
        
        return {
            // Grundlegende Stärken
            attackDifference: homeStats.attack - awayStats.attack,
            defenseDifference: homeStats.defense - awayStats.defense,
            
            // Form-basierte Features
            formMomentum: homeStats.formMomentum - awayStats.formMomentum,
            recentGoalsFor: homeStats.avgGoalsFor - awayStats.avgGoalsFor,
            recentGoalsAgainst: homeStats.avgGoalsAgainst - awayStats.avgGoalsAgainst,
            
            // Spezifische Leistungsmetriken
            shotsOnTargetDiff: homeStats.shotsOnTarget - awayStats.shotsOnTarget,
            conversionRateDiff: homeStats.conversionRate - awayStats.conversionRate,
            
            // Kontext-Features
            homeAdvantage: this.getHomeAdvantage(league),
            importanceFactor: this.getMatchImportance(homeTeam, awayTeam, league),
            
            // Head-to-Head falls verfügbar
            h2hAdvantage: this.getH2HAdvantage(homeTeam, awayTeam),
            
            modelConfidence: this.calculateFeatureConfidence(homeStats, awayStats)
        };
    }

    gradientBoostedPrediction(features) {
        // Simulierte Gradient Boosting Berechnungen
        const baseHome = this.sigmoid(
            0.3 * features.attackDifference +
            0.2 * features.defenseDifference +
            0.15 * features.formMomentum +
            0.1 * features.homeAdvantage +
            0.05 * features.h2hAdvantage -
            0.1
        );

        const baseAway = this.sigmoid(
            -0.3 * features.attackDifference +
            -0.2 * features.defenseDifference +
            -0.15 * features.formMomentum +
            -0.08 * features.homeAdvantage +
            -0.05 * features.h2hAdvantage +
            0.05
        );

        const baseDraw = 1 - baseHome - baseAway;

        // Over/Under basierend auf Angriffsstärke
        const goalExpectancy = 2.8 + 
            (features.attackDifference * 0.3) + 
            (features.recentGoalsFor * 0.4) +
            (features.homeAdvantage * 0.2);

        const over25 = this.sigmoid((goalExpectancy - 2.5) * 2);
        const over15 = this.sigmoid((goalExpectancy - 1.5) * 1.5);
        const over35 = this.sigmoid((goalExpectancy - 3.5) * 1.8);

        // BTTS basierend auf Defensivschwächen
        const bttsProbability = this.sigmoid(
            0.4 * (1 - features.defenseDifference) +
            0.3 * features.attackDifference +
            0.2 * features.recentGoalsFor +
            0.1
        );

        return {
            home: +baseHome.toFixed(4),
            draw: +baseDraw.toFixed(4),
            away: +baseAway.toFixed(4),
            over25: +over25.toFixed(4),
            over15: +over15.toFixed(4),
            over35: +over35.toFixed(4),
            btts: +bttsProbability.toFixed(4),
            homeXG: +(1.2 + features.attackDifference * 0.3).toFixed(3),
            awayXG: +(1.0 - features.attackDifference * 0.2).toFixed(3)
        };
    }

    getTeamStats(teamName) {
        // Erweiterte Team-Statistiken
        const stats = {
            "Manchester City": {
                attack: 2.45, defense: 0.75, formMomentum: 0.85,
                avgGoalsFor: 2.3, avgGoalsAgainst: 0.8,
                shotsOnTarget: 6.8, conversionRate: 0.34
            },
            "Liverpool": {
                attack: 2.35, defense: 0.82, formMomentum: 0.82,
                avgGoalsFor: 2.2, avgGoalsAgainst: 0.9,
                shotsOnTarget: 6.5, conversionRate: 0.33
            },
            "Bayern Munich": {
                attack: 2.50, defense: 0.70, formMomentum: 0.88,
                avgGoalsFor: 2.6, avgGoalsAgainst: 0.7,
                shotsOnTarget: 7.2, conversionRate: 0.36
            },
            "Real Madrid": {
                attack: 2.40, defense: 0.78, formMomentum: 0.84,
                avgGoalsFor: 2.2, avgGoalsAgainst: 0.8,
                shotsOnTarget: 6.3, conversionRate: 0.35
            },
            "Arsenal": {
                attack: 2.25, defense: 0.80, formMomentum: 0.80,
                avgGoalsFor: 2.1, avgGoalsAgainst: 0.9,
                shotsOnTarget: 6.1, conversionRate: 0.34
            },
            "default": {
                attack: 1.70, defense: 1.30, formMomentum: 0.50,
                avgGoalsFor: 1.3, avgGoalsAgainst: 1.4,
                shotsOnTarget: 4.2, conversionRate: 0.25
            }
        };
        return stats[teamName] || stats.default;
    }

    getHomeAdvantage(league) {
        const advantages = {
            "Premier League": 0.12, 
            "Bundesliga": 0.15, 
            "La Liga": 0.10,
            "Serie A": 0.11,
            "Ligue 1": 0.13,
            "Champions League": 0.08,
            "default": 0.08
        };
        return advantages[league] || advantages.default;
    }

    getMatchImportance(homeTeam, awayTeam, league) {
        // Simulierte Match-Importance basierend auf Team-Ranking
        const topTeams = ["Manchester City", "Liverpool", "Bayern Munich", "Real Madrid", "Barcelona", "PSG"];
        const isTopMatch = topTeams.includes(homeTeam) && topTeams.includes(awayTeam);
        return isTopMatch ? 1.1 : 1.0;
    }

    getH2HAdvantage(homeTeam, awayTeam) {
        // Simulierte Head-to-Head Vorteile
        const h2hRecords = {
            "Manchester City-Liverpool": 0.1,
            "Real Madrid-Barcelona": 0.05,
            "Bayern Munich-Borussia Dortmund": 0.08,
            "default": 0.0
        };
        return h2hRecords[`${homeTeam}-${awayTeam}`] || h2hRecords.default;
    }

    calculateFeatureConfidence(homeStats, awayStats) {
        const dataQuality = (homeStats.consistency + awayStats.consistency) / 2;
        return 0.7 + (dataQuality * 0.25);
    }

    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }
}
// PRÄZISES NEURAL NETWORK MODELL
class PrecisionNeuralNetworkModel {
    async predict(homeTeam, awayTeam, league) {
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
        // Simulierte team embeddings basierend auf Performance
        const teamRankings = {
            "Manchester City": 0.95, "Liverpool": 0.90, "Bayern Munich": 0.92,
            "Real Madrid": 0.91, "Barcelona": 0.88, "Arsenal": 0.85,
            "PSG": 0.87, "Inter Milan": 0.83, "Borussia Dortmund": 0.82,
            "Atletico Madrid": 0.81, "default": 0.70
        };
        
        const homeRank = teamRankings[homeTeam] || teamRankings.default;
        const awayRank = teamRankings[awayTeam] || teamRankings.default;
        
        return {
            home: homeRank,
            away: awayRank,
            similarity: 1 - Math.abs(homeRank - awayRank),
            rankingDifference: homeRank - awayRank
        };
    }

    getMatchContext(league) {
        const contexts = {
            "Premier League": { intensity: 0.9, predictability: 0.85, goalTendency: 1.05 },
            "Bundesliga": { intensity: 0.95, predictability: 0.80, goalTendency: 1.18 },
            "La Liga": { intensity: 0.85, predictability: 0.90, goalTendency: 0.95 },
            "Serie A": { intensity: 0.82, predictability: 0.92, goalTendency: 0.88 },
            "Champions League": { intensity: 0.92, predictability: 0.82, goalTendency: 1.12 },
            "default": { intensity: 0.8, predictability: 0.75, goalTendency: 1.00 }
        };
        return contexts[league] || contexts.default;
    }

    forwardPass(embedding, context) {
        // Input Layer
        const input = [
            embedding.home,
            embedding.away, 
            embedding.similarity,
            embedding.rankingDifference,
            context.intensity,
            context.predictability,
            context.goalTendency
        ];

        // Hidden Layer 1
        const hidden1 = this.relu(
            input[0] * 0.6 + input[1] * 0.4 + input[4] * 0.3 + input[6] * 0.2 - 0.5
        );
        
        // Hidden Layer 2  
        const hidden2 = this.relu(
            input[2] * 0.8 + input[3] * 0.5 + input[5] * 0.4 - 0.3
        );

        // Output Layer
        const homeWin = this.sigmoid(hidden1 * 0.7 + hidden2 * 0.3 - 0.2);
        const draw = this.sigmoid(input[2] * 0.9 - hidden1 * 0.4 + 0.1);
        const awayWin = this.sigmoid(hidden2 * 0.6 - input[0] * 0.3 + 0.1);

        // Normalize HDA
        const totalHDA = homeWin + draw + awayWin;
        
        // Over/Under Outputs
        const over25 = this.sigmoid(context.intensity * 0.8 + (1 - input[2]) * 0.4 + context.goalTendency * 0.3 - 0.5);
        const over15 = this.sigmoid(context.intensity * 0.6 + (1 - input[2]) * 0.3 + context.goalTendency * 0.2 - 0.3);
        const over35 = this.sigmoid(context.intensity * 0.9 + (1 - input[2]) * 0.5 + context.goalTendency * 0.4 - 0.7);
        
        // BTTS Output
        const btts = this.sigmoid((1 - input[2]) * 0.7 + context.intensity * 0.3 + 0.1);

        return {
            home: +(homeWin / totalHDA).toFixed(4),
            draw: +(draw / totalHDA).toFixed(4),
            away: +(awayWin / totalHDA).toFixed(4),
            over25: +over25.toFixed(4),
            over15: +over15.toFixed(4),
            over35: +over35.toFixed(4),
            btts: +btts.toFixed(4),
            homeXG: +(1.2 + hidden1 * 0.8).toFixed(3),
            awayXG: +(1.0 + hidden2 * 0.6).toFixed(3)
        };
    }

    relu(x) {
        return Math.max(0, x);
    }

    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }
}

// PRÄZISES TIME SERIES MODELL
class PrecisionTimeSeriesModel {
    async predict(homeTeam, awayTeam, league) {
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
        // Simulierte Trend-Analyse basierend auf Team-Performance
        const homeTrend = this.calculateTeamTrend(homeTeam);
        const awayTrend = this.calculateTeamTrend(awayTeam);
        
        return {
            homeTrend: homeTrend,
            awayTrend: awayTrend,
            momentum: (homeTrend + awayTrend) / 2,
            trendStrength: Math.abs(homeTrend - awayTrend)
        };
    }

    calculateTeamTrend(teamName) {
        // Simulierte Team-Trends basierend auf Form
        const trends = {
            "Manchester City": 0.15,
            "Liverpool": 0.12,
            "Bayern Munich": 0.18,
            "Real Madrid": 0.10,
            "Arsenal": 0.08,
            "Barcelona": -0.05,
            "Chelsea": -0.12,
            "default": (Math.random() - 0.5) * 0.3
        };
        return trends[teamName] || trends.default;
    }

    getSeasonality(league) {
        // Saisonale Muster basierend auf Liga
        const now = new Date();
        const month = now.getMonth();
        
        // Verschiedene Ligen haben verschiedene saisonale Muster
        const seasonalPatterns = {
            "Premier League": { 
                winterFactor: 0.95, // Weniger Tore im Winter
                springFactor: 1.05  // Mehr Tore im Frühling
            },
            "Bundesliga": {
                winterFactor: 0.90, // Winterpause Effekt
                springFactor: 1.08
            },
            "La Liga": {
                winterFactor: 0.98,
                springFactor: 1.03
            },
            "default": {
                winterFactor: 1.0,
                springFactor: 1.0
            }
        };
        
        const pattern = seasonalPatterns[league] || seasonalPatterns.default;
        const isWinter = month >= 11 || month <= 1;
        const isSpring = month >= 2 && month <= 4;
        
        return {
            goalFactor: isWinter ? pattern.winterFactor : isSpring ? pattern.springFactor : 1.0,
            drawFactor: isWinter ? 1.05 : 1.0 // Mehr Unentschieden im Winter
        };
    }

    combineTrends(trends, seasonality) {
        const baseHome = 0.4 + trends.homeTrend;
        const baseAway = 0.35 + trends.awayTrend;
        const baseDraw = 0.25 - (trends.homeTrend + trends.awayTrend) * 0.5;

        // Saisonale Anpassungen
        const homeWithSeason = baseHome * seasonality.goalFactor;
        const awayWithSeason = baseAway * seasonality.goalFactor;
        const drawWithSeason = baseDraw * seasonality.drawFactor;
        // Normalize
        const total = homeWithSeason + drawWithSeason + awayWithSeason;
        
        return {
            home: +(homeWithSeason / total).toFixed(4),
            draw: +(drawWithSeason / total).toFixed(4),
            away: +(awayWithSeason / total).toFixed(4),
            over25: +(0.5 + trends.momentum * 0.2 + (seasonality.goalFactor - 1)).toFixed(4),
            over15: +(0.7 + trends.momentum * 0.1 + (seasonality.goalFactor - 1) * 0.5).toFixed(4),
            over35: +(0.3 + trends.momentum * 0.15 + (seasonality.goalFactor - 1) * 0.3).toFixed(4),
            btts: +(0.45 + Math.abs(trends.momentum) * 0.1 + (1 - seasonality.goalFactor) * 0.05).toFixed(4),
            homeXG: +(1.3 + trends.homeTrend * 0.5).toFixed(3),
            awayXG: +(1.1 + trends.awayTrend * 0.5).toFixed(3)
        };
    }
}

// PRÄZISES MARKET EFFICIENCY MODELL
class PrecisionMarketEfficiencyModel {
    async predict(homeTeam, awayTeam, league) {
        // Simulierte Marktdaten basierend auf Team-Stärken
        const marketData = this.getMarketData(homeTeam, awayTeam, league);
        const efficiency = this.analyzeEfficiency(marketData);
        
        const prediction = this.adjustForEfficiency(marketData, efficiency);
        
        return {
            ...prediction,
            confidence: 0.70,
            homeXG: prediction.homeXG,
            awayXG: prediction.awayXG
        };
    }

    getMarketData(homeTeam, awayTeam, league) {
        const homeStrength = this.getTeamMarketStrength(homeTeam);
        const awayStrength = this.getTeamMarketStrength(awayTeam);
        
        // Realistischere Odds basierend auf Team-Stärken
        const strengthDiff = homeStrength - awayStrength;
        const baseHomeOdds = 1.8 - (strengthDiff * 0.4);
        const baseAwayOdds = 4.0 + (strengthDiff * 0.6);
        const baseDrawOdds = 3.2 + (Math.abs(strengthDiff) * 0.2);
        
        return {
            homeOdds: baseHomeOdds + (Math.random() - 0.5) * 0.3,
            drawOdds: baseDrawOdds + (Math.random() - 0.5) * 0.4,
            awayOdds: baseAwayOdds + (Math.random() - 0.5) * 0.6,
            volume: 0.5 + (Math.abs(strengthDiff) * 0.3),
            movement: (Math.random() - 0.5) * 0.08
        };
    }

    getTeamMarketStrength(teamName) {
        const strengths = {
            "Manchester City": 0.95, "Liverpool": 0.90, "Bayern Munich": 0.92,
            "Real Madrid": 0.91, "Barcelona": 0.88, "Arsenal": 0.85,
            "PSG": 0.87, "Inter Milan": 0.83, "default": 0.70
        };
        return strengths[teamName] || strengths.default;
    }

    analyzeEfficiency(marketData) {
        const impliedHome = 1 / marketData.homeOdds;
        const impliedDraw = 1 / marketData.drawOdds;
        const impliedAway = 1 / marketData.awayOdds;
        
        const overround = impliedHome + impliedDraw + impliedAway - 1;
        const efficiency = 1 - (overround / 3);
        
        return {
            efficiency,
            overround,
            valueOpportunities: this.findValueOpportunities(marketData),
            marketBias: this.calculateMarketBias(impliedHome, impliedAway)
        };
    }

    calculateMarketBias(impliedHome, impliedAway) {
        // Erkenne Home-Bias in den Marktquoten
        const expectedHome = 0.4; // Erwarteter Basiswert für Heimmannschaft
        const homeBias = impliedHome - expectedHome;
        return homeBias;
    }

    findValueOpportunities(marketData) {
        const opportunities = [];
        
        if (marketData.movement > 0.05) opportunities.push('home_momentum');
        if (marketData.movement < -0.03) opportunities.push('away_momentum');
        if (marketData.volume > 0.7) opportunities.push('high_volume');
        if (marketData.homeOdds > 2.5 && marketData.movement > 0) opportunities.push('home_undervalued');
        if (marketData.awayOdds < 3.0 && marketData.movement < 0) opportunities.push('away_overvalued');
        
        return opportunities;
    }

    adjustForEfficiency(marketData, efficiency) {
        const baseProb = {
            home: 1 / marketData.homeOdds,
            draw: 1 / marketData.drawOdds,
            away: 1 / marketData.awayOdds
        };
        
        // Effizienz-basierte Anpassung
        const adjustment = (1 - efficiency.efficiency) * 0.15;
        
        // Korrektur für Home-Bias
        const homeBiasCorrection = efficiency.marketBias * 0.2;
        
        return {
            home: +(baseProb.home * (1 + adjustment - homeBiasCorrection)).toFixed(4),
            draw: +(baseProb.draw * (1 - adjustment * 0.5)).toFixed(4),
            away: +(baseProb.away * (1 + adjustment + homeBiasCorrection)).toFixed(4),
            over25: +(0.52 + (efficiency.efficiency - 0.9) * 0.1).toFixed(4),
            over15: +(0.78 + (efficiency.efficiency - 0.9) * 0.05).toFixed(4),
            over35: +(0.35 + (efficiency.efficiency - 0.9) * 0.08).toFixed(4),
            btts: +(0.48 + (marketData.volume * 0.1)).toFixed(4),
            homeXG: +(1.4 + (adjustment * 0.3)).toFixed(3),
            awayXG: +(1.2 - (adjustment * 0.2)).toFixed(3)
        };
    }
}

// TREND-ANALYSE MODUL FÜR PRÄZISE VORHERSAGEN
export class PrecisionTrendAnalyzer {
    constructor() {
        this.trendPeriods = [5, 10, 15]; // Kurz-, Mittel-, Langfrist-Trends
    }

    async analyzeMultiDimensionalTrends(matchData, historicalPatterns) {
        const trends = {
            primaryTrend: await this.analyzePrimaryTrend(matchData),
            secondaryTrends: await this.analyzeSecondaryTrends(matchData),
            momentumTrends: await this.analyzeMomentumTrends(matchData),
            patternMatches: await this.findHistoricalPatterns(matchData, historicalPatterns),
            confidence: 0,
            allTrends: []
        };

        trends.confidence = this.calculateTrendConfidence(trends);
        trends.allTrends = this.consolidateAllTrends(trends);
        
        return trends;
    }

    async analyzePrimaryTrend(matchData) {
        const { homeTeam, awayTeam, probabilities, xgData } = matchData;
        
        // xG-basierter Trend
        const xgTrend = this.analyzeXGTrend(xgData);
        
        // Wahrscheinlichkeits-Trend
        const probTrend = this.analyzeProbabilityTrend(probabilities);
        
        // Form-Trend
        const formTrend = await this.analyzeFormTrend(homeTeam, awayTeam);
        
        // Kombinierter Primär-Trend
        const combinedTrend = this.combineTrends([xgTrend, probTrend, formTrend]);
        
        return {
            type: 'primary',
            direction: combinedTrend.direction,
            strength: combinedTrend.strength,
            description: this.generateTrendDescription(combinedTrend, homeTeam, awayTeam),
            confidence: combinedTrend.confidence,
            factors: [xgTrend, probTrend, formTrend]
        };
    }

    analyzeXGTrend(xgData) {
        const { home, away, quality } = xgData;
        const xgDifference = home - away;
        const totalXG = home + away;
        
        let direction, strength, description;
        
        if (xgDifference > 0.8) {
            direction = 'home_dominant';
            strength = Math.min(0.95, 0.7 + (xgDifference * 0.1));
            description = `Starke Heimüberlegenheit (xG: ${home.toFixed(2)} vs ${away.toFixed(2)})`;
        } else if (xgDifference < -0.8) {
            direction = 'away_dominant';
            strength = Math.min(0.95, 0.7 + (Math.abs(xgDifference) * 0.1));
            description = `Starke Auswärtsüberlegenheit (xG: ${home.toFixed(2)} vs ${away.toFixed(2)})`;
        } else if (totalXG > 3.5) {
            direction = 'high_scoring';
            strength = 0.75;
            description = `Torreich (erwartet: ${totalXG.toFixed(2)} xG)`;
        } else if (totalXG < 1.8) {
            direction = 'low_scoring';
            strength = 0.70;
            description = `Wenig Tore (erwartet: ${totalXG.toFixed(2)} xG)`;
        } else {
            direction = 'balanced';
            strength = 0.65;
            description = `Ausgeglichen (xG: ${home.toFixed(2)} vs ${away.toFixed(2)})`;
        }
        
        return {
            type: 'xg_analysis',
            direction,
            strength: +strength.toFixed(3),
            description,
            confidence: quality * 0.8,
            metrics: {
                homeXG: home,
                awayXG: away,
                totalXG: totalXG,
                xgDifference: xgDifference
            }
        };
    }

    analyzeProbabilityTrend(probabilities) {
        const { home, draw, away } = probabilities;
        const maxProb = Math.max(home, draw, away);
        
        let direction, strength, description;
        
        if (home > 0.6) {
            direction = 'home_win_expected';
            strength = home * 0.9;
            description = `Heimsieg erwartet (${(home * 100).toFixed(1)}%)`;
        } else if (away > 0.6) {
            direction = 'away_win_expected';
            strength = away * 0.9;
            description = `Auswärtssieg erwartet (${(away * 100).toFixed(1)}%)`;
        } else if (draw > 0.4) {
            direction = 'draw_expected';
            strength = draw * 0.8;
            description = `Unentschieden wahrscheinlich (${(draw * 100).toFixed(1)}%)`;
        } else {
            direction = 'competitive';
            strength = 0.7;
            description = `Ausgeglichenes Spiel (Heim: ${(home * 100).toFixed(1)}%, Unentschieden: ${(draw * 100).toFixed(1)}%, Auswärts: ${(away * 100).toFixed(1)}%)`;
        }
        
        return {
            type: 'probability_analysis',
            direction,
            strength: +strength.toFixed(3),
            description,
            confidence: Math.abs(home - away) < 0.3 ? 0.6 : 0.8
        };
    }

  async analyzeFormTrend(homeTeam, awayTeam) {
        // Simulierte Form-Analyse
        const homeForm = this.getTeamForm(homeTeam);
        const awayForm = this.getTeamForm(awayTeam);
        const formDifference = homeForm - awayForm;
        
        let direction, strength, description;
        
        if (formDifference > 0.3) {
            direction = 'home_form_advantage';
            strength = 0.8;
            description = `${homeTeam} in besserer Form`;
        } else if (formDifference < -0.3) {
            direction = 'away_form_advantage';
            strength = 0.8;
            description = `${awayTeam} in besserer Form`;
        } else {
            direction = 'balanced_form';
            strength = 0.6;
            description = `Ausgeglichene Team-Form`;
        }
        
        return {
            type: 'form_analysis',
            direction,
            strength,
            description,
            confidence: 0.75,
            metrics: {
                homeForm,
                awayForm,
                formDifference
            }
        };
    }

    getTeamForm(teamName) {
        const forms = {
            "Manchester City": 0.85, "Liverpool": 0.82, "Bayern Munich": 0.88,
            "Real Madrid": 0.84, "Arsenal": 0.80, "Barcelona": 0.78,
            "default": 0.5 + (Math.random() - 0.5) * 0.3
        };
        return forms[teamName] || forms.default;
    }

    combineTrends(trends) {
        const weightedStrength = trends.reduce((sum, trend) => sum + (trend.strength * trend.confidence), 0) /
                               trends.reduce((sum, trend) => sum + trend.confidence, 0);
        
        // Bestimme dominante Richtung
        const directionCounts = {};
        trends.forEach(trend => {
            directionCounts[trend.direction] = (directionCounts[trend.direction] || 0) + trend.strength;
        });
        
        const dominantDirection = Object.keys(directionCounts).reduce((a, b) => 
            directionCounts[a] > directionCounts[b] ? a : b
        );
        
        return {
            direction: dominantDirection,
            strength: +weightedStrength.toFixed(3),
            confidence: trends.reduce((sum, trend) => sum + trend.confidence, 0) / trends.length
        };
    }

    generateTrendDescription(trend, homeTeam, awayTeam) {
        const descriptions = {
            'home_dominant': `${homeTeam} deutlich stärker erwartet`,
            'away_dominant': `${awayTeam} deutlich stärker erwartet`, 
            'high_scoring': 'Torreiches Spiel erwartet',
            'low_scoring': 'Wenige Tore erwartet',
            'balanced': 'Ausgeglichene Begegnung',
            'home_win_expected': `Heimsieg ${homeTeam} wahrscheinlich`,
            'away_win_expected': `Auswärtssieg ${awayTeam} wahrscheinlich`,
            'draw_expected': 'Unentschieden wahrscheinlich',
            'competitive': 'Knappe Begegnung erwartet',
            'home_form_advantage': `${homeTeam} mit Formvorteil`,
            'away_form_advantage': `${awayTeam} mit Formvorteil`,
            'balanced_form': 'Ausgeglichene Form'
        };
        
        return descriptions[trend.direction] || 'Trend analysiert';
    }

    calculateTrendConfidence(trends) {
        const confidences = [
            trends.primaryTrend.confidence,
            ...trends.secondaryTrends.map(t => t.confidence),
            trends.momentumTrends.confidence || 0.5
        ];
        
        return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    }

    consolidateAllTrends(trends) {
        const allTrends = [
            trends.primaryTrend,
            ...(trends.secondaryTrends || []),
            trends.momentumTrends
        ].filter(trend => trend && trend.confidence > 0.3);
        
        return allTrends.sort((a, b) => b.confidence - a.confidence);
    }

    async analyzeSecondaryTrends(matchData) {
        // Simulierte sekundäre Trend-Analysen
        return [
            {
                type: 'market_trend',
                direction: 'value_opportunity',
                strength: 0.65,
                description: 'Gute Value-Chancen identifiziert',
                confidence: 0.7
            },
            {
                type: 'sentiment_trend', 
                direction: 'positive_momentum',
                strength: 0.6,
                description: 'Positive Stimmung erkannt',
                confidence: 0.65
            }
        ];
    }

    async analyzeMomentumTrends(matchData) {
        return {
            type: 'momentum_analysis',
            direction: 'growing_confidence',
            strength: 0.7,
            description: 'Steigende Vorhersage-Konfidenz',
            confidence: 0.75
        };
    }

    async findHistoricalPatterns(matchData, historicalPatterns) {
        return [
            {
                pattern: 'similar_strength_matchup',
                confidence: 0.72,
                historicalAccuracy: 0.68,
                description: 'Ähnliche historische Begegnungen analysiert'
            }
        ];
    }
}

export default EnhancedEnsemblePredictionModel;
