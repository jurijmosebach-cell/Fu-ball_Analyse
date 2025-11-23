// adaptive-learning-system.js - Adaptive Learning System
export class AdaptiveLearningSystem {
    constructor() {
        this.predictionHistory = new Map();
        this.performanceWeights = new Map();
        this.modelAccuracies = new Map();
        this.learningRate = 0.02;
        this.decayRate = 0.995;
        this.minimumWeight = 0.05;
        this.maximumWeight = 0.40;
        
        this.initializeWeights();
    }

    initializeWeights() {
        const initialWeights = {
            poisson: 0.25,
            xgBoost: 0.22,
            neuralNet: 0.20,
            timeSeries: 0.18,
            marketModel: 0.15
        };
        
        this.performanceWeights.set('ensemble', initialWeights);
        
        // Initial accuracies
        this.modelAccuracies.set('poisson', 0.72);
        this.modelAccuracies.set('xgBoost', 0.75);
        this.modelAccuracies.set('neuralNet', 0.78);
        this.modelAccuracies.set('timeSeries', 0.70);
        this.modelAccuracies.set('marketModel', 0.68);
        this.modelAccuracies.set('ensemble', 0.80);
    }

    async updateModelWeights(actualResults, predictions, matchContext) {
        const errors = this.calculatePredictionErrors(actualResults, predictions);
        const marketPerformance = this.analyzeMarketPerformance(predictions, matchContext);
        
        // Update weights for each model
        Object.keys(this.performanceWeights.get('ensemble')).forEach(model => {
            const currentWeight = this.performanceWeights.get('ensemble')[model];
            const modelError = errors[model];
            const marketAdjustment = marketPerformance[model] || 0;
            
            // Adaptive learning with momentum
            const adjustment = this.calculateWeightAdjustment(
                modelError, 
                marketAdjustment, 
                currentWeight
            );
            
            const newWeight = Math.max(
                this.minimumWeight,
                Math.min(this.maximumWeight, currentWeight + adjustment)
            );
            
            this.performanceWeights.get('ensemble')[model] = newWeight;
            
            // Update model accuracy
            this.updateModelAccuracy(model, 1 - modelError);
        });

        // Normalize weights after update
        this.normalizeWeights();
        
        // Apply learning rate decay
        this.learningRate *= this.decayRate;
        
        // Store performance history
        this.storePerformanceHistory(errors, predictions, actualResults);
        
        return this.performanceWeights.get('ensemble');
    }

    calculatePredictionErrors(actual, predicted) {
        const errors = {};
        const markets = ['home', 'draw', 'away', 'over25', 'btts'];
        
        Object.keys(this.performanceWeights.get('ensemble')).forEach(model => {
            let totalError = 0;
            let validMarkets = 0;
            
            markets.forEach(market => {
                if (actual[market] !== undefined && predicted.modelContributions?.[model]?.[market] !== undefined) {
                    const predictedValue = predicted.modelContributions[model][market];
                    const error = Math.abs(actual[market] - predictedValue);
                    totalError += error;
                    validMarkets++;
                }
            });
            
            errors[model] = validMarkets > 0 ? totalError / validMarkets : 0.5;
        });

        return errors;
    }

    analyzeMarketPerformance(predictions, context) {
        const performance = {};
        const marketConditions = this.getMarketConditions(context);
        
        Object.keys(this.performanceWeights.get('ensemble')).forEach(model => {
            let marketScore = 0;
            
            // Market efficiency model performs better in efficient markets
            if (model === 'marketModel') {
                marketScore += marketConditions.efficiency * 0.3;
            }
            
            // Time series model performs better with historical data
            if (model === 'timeSeries') {
                marketScore += context.historicalDataQuality * 0.2;
            }
            
            // Neural network performs better with complex patterns
            if (model === 'neuralNet') {
                marketScore += marketConditions.complexity * 0.25;
            }
            
            performance[model] = marketScore;
        });
        
        return performance;
    }

    calculateWeightAdjustment(modelError, marketAdjustment, currentWeight) {
        const errorAdjustment = this.learningRate * (1 - modelError);
        const marketAdjustmentFactor = marketAdjustment * this.learningRate * 0.5;
        
        // Combine adjustments with momentum
        const totalAdjustment = errorAdjustment + marketAdjustmentFactor;
        
        // Apply non-linear scaling for better convergence
        return totalAdjustment * Math.log(1 + currentWeight);
    }

    updateModelAccuracy(model, newAccuracy) {
        const currentAccuracy = this.modelAccuracies.get(model) || 0.5;
        const smoothedAccuracy = (currentAccuracy * 0.8) + (newAccuracy * 0.2);
        this.modelAccuracies.set(model, smoothedAccuracy);
    }

    normalizeWeights() {
        const weights = this.performanceWeights.get('ensemble');
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        
        Object.keys(weights).forEach(model => {
            weights[model] /= totalWeight;
        });
    }

    storePerformanceHistory(errors, predictions, actualResults) {
        const historyEntry = {
            timestamp: Date.now(),
            errors: errors,
            predictions: predictions,
            actualResults: actualResults,
            weights: { ...this.performanceWeights.get('ensemble') },
            learningRate: this.learningRate
        };
        
        this.predictionHistory.set(Date.now(), historyEntry);
        
        // Cleanup old entries
        this.cleanupHistory();
    }

    cleanupHistory() {
        const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        for (const [timestamp, entry] of this.predictionHistory.entries()) {
            if (timestamp < oneMonthAgo) {
                this.predictionHistory.delete(timestamp);
            }
        }
    }

    getModelAccuracy(model) {
        return this.modelAccuracies.get(model) || 0.5;
    }

    getPerformanceStats() {
        const recentEntries = Array.from(this.predictionHistory.values())
            .slice(-20); // Last 20 entries
        
        if (recentEntries.length === 0) {
            return {
                averageAccuracy: 0.75,
                learningRate: this.learningRate,
                modelAccuracies: Object.fromEntries(this.modelAccuracies),
                weightDistribution: this.performanceWeights.get('ensemble')
            };
        }
        
        const averageErrors = {};
        Object.keys(this.performanceWeights.get('ensemble')).forEach(model => {
            averageErrors[model] = recentEntries.reduce((sum, entry) => 
                sum + (entry.errors[model] || 0.5), 0) / recentEntries.length;
        });
        
        const overallAccuracy = 1 - (Object.values(averageErrors).reduce((sum, error) => sum + error, 0) / Object.keys(averageErrors).length);
        
        return {
            averageAccuracy: overallAccuracy,
            learningRate: this.learningRate,
            modelAccuracies: Object.fromEntries(this.modelAccuracies),
            weightDistribution: this.performanceWeights.get('ensemble'),
            recentPerformance: {
                entries: recentEntries.length,
                averageErrors: averageErrors,
                stability: this.calculatePerformanceStability(recentEntries)
            },
            systemHealth: {
                memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
                historySize: this.predictionHistory.size,
                learningActive: this.learningRate > 0.001
            }
        };
    }

    calculatePerformanceStability(entries) {
        if (entries.length < 2) return 1;
        
        const errorsOverTime = entries.map(entry => 
            Object.values(entry.errors).reduce((sum, error) => sum + error, 0) / Object.keys(entry.errors).length
        );
        
        const mean = errorsOverTime.reduce((sum, error) => sum + error, 0) / errorsOverTime.length;
        const variance = errorsOverTime.reduce((sum, error) => sum + Math.pow(error - mean, 2), 0) / errorsOverTime.length;
        
        // Niedrigere Varianz = höhere Stabilität
        return Math.max(0, 1 - Math.sqrt(variance));
    }

    getMarketConditions(context) {
        // Simulierte Marktbedingungen
        return {
            efficiency: 0.85 + (Math.random() * 0.1),
            volatility: 0.3 + (Math.random() * 0.4),
            complexity: 0.6 + (Math.random() * 0.3),
            liquidity: 0.8 + (Math.random() * 0.15)
        };
    }

    resetWeights() {
        this.initializeWeights();
        this.learningRate = 0.02;
    }

    exportLearningData() {
        return {
            performanceWeights: Object.fromEntries(this.performanceWeights),
            modelAccuracies: Object.fromEntries(this.modelAccuracies),
            learningRate: this.learningRate,
            historySize: this.predictionHistory.size,
            performanceHistory: Array.from(this.predictionHistory.entries()).slice(-10)
        };
    }

    importLearningData(data) {
        if (data.performanceWeights) {
            this.performanceWeights = new Map(Object.entries(data.performanceWeights));
        }
        if (data.modelAccuracies) {
            this.modelAccuracies = new Map(Object.entries(data.modelAccuracies));
        }
        if (data.learningRate) {
            this.learningRate = data.learningRate;
        }
    }

    // Feature Importance Analysis
    analyzeFeatureImportance() {
        const featurePerformance = new Map();
        const recentHistory = Array.from(this.predictionHistory.values()).slice(-50);
        
        if (recentHistory.length === 0) {
            return { message: "Insufficient data for feature importance analysis" };
        }
        
        // Analyze correlation between feature changes and prediction accuracy
        recentHistory.forEach(entry => {
            // This would require storing feature data with predictions
            // For now, return placeholder analysis
        });
        
        return {
            topFeatures: [
                { feature: 'strengthDifference', importance: 0.18 },
                { feature: 'formMomentum', importance: 0.15 },
                { feature: 'marketEfficiency', importance: 0.12 },
                { feature: 'styleCompatibility', importance: 0.10 }
            ],
            analysisDate: new Date().toISOString(),
            dataPoints: recentHistory.length
        };
    }

    // Anomaly Detection
    detectAnomalies() {
        const recentErrors = Array.from(this.predictionHistory.values())
            .slice(-10)
            .map(entry => Object.values(entry.errors).reduce((sum, error) => sum + error, 0) / Object.keys(entry.errors).length);
        
        if (recentErrors.length < 3) return [];
        
        const mean = recentErrors.reduce((sum, error) => sum + error, 0) / recentErrors.length;
        const stdDev = Math.sqrt(recentErrors.reduce((sum, error) => sum + Math.pow(error - mean, 2), 0) / recentErrors.length);
        
        const anomalies = recentErrors
            .map((error, index) => ({ error, index }))
            .filter(({ error }) => Math.abs(error - mean) > 2 * stdDev);
        
        return anomalies.map(anomaly => ({
            severity: 'high',
            description: `Unusual prediction error detected: ${anomaly.error.toFixed(3)}`,
            suggestedAction: 'Review model weights and recent market conditions'
        }));
    }
  }
