// value-intelligence-system.js - Intelligent Value Detection System
export class ValueIntelligenceSystem {
    constructor() {
        this.bankroll = 1000;
        this.riskProfile = 'medium';
        this.valueThreshold = 0.08;
        this.maxStakePercentage = 0.1;
        this.bettingHistory = [];
        this.marketModels = new Map();
        this.arbitrageOpportunities = new Map();
        
        this.initializeRiskProfiles();
    }

    initializeRiskProfiles() {
        this.riskProfiles = {
            conservative: {
                valueThreshold: 0.12,
                maxStake: 0.05,
                kellyFraction: 0.25,
                minOdds: 1.5,
                maxOdds: 4.0
            },
            medium: {
                valueThreshold: 0.08,
                maxStake: 0.08,
                kellyFraction: 0.5,
                minOdds: 1.3,
                maxOdds: 6.0
            },
            aggressive: {
                valueThreshold: 0.05,
                maxStake: 0.12,
                kellyFraction: 0.75,
                minOdds: 1.1,
                maxOdds: 10.0
            }
        };
    }

    async findSmartValueBets(predictions, marketOdds = null) {
        if (!marketOdds) {
            marketOdds = await this.generateSimulatedOdds(predictions);
        }

        const valueBets = [];
        const markets = this.analyzeAllMarkets(predictions, marketOdds);
        
        // Multi-Market Value Analyse
        for (const market of markets) {
            const marketValue = await this.analyzeMarketValue(predictions, marketOdds, market);
            
            if (marketValue.score > this.valueThreshold) {
                const stakeRecommendation = this.calculateOptimalStake(marketValue);
                
                valueBets.push({
                    market: market.type,
                    selection: market.selection,
                    value: marketValue.value,
                    confidence: marketValue.confidence,
                    score: marketValue.score,
                    odds: marketValue.odds,
                    probability: marketValue.probability,
                    stake: stakeRecommendation,
                    reasoning: marketValue.analysis,
                    riskLevel: marketValue.riskLevel,
                    expectedValue: marketValue.expectedValue,
                    marketContext: marketValue.context
                });
            }
        }

        // Arbitrage Opportunities
        const arbitrage = await this.findArbitrageOpportunities(marketOdds);
        valueBets.push(...arbitrage);

        // Portfolio Optimization
        const optimizedBets = this.optimizeBettingPortfolio(valueBets);
        
        return optimizedBets.sort((a, b) => b.score - a.score);
    }

    analyzeAllMarkets(predictions, marketOdds) {
        const markets = [];
        
        // 1X2 Markets
        markets.push({
            type: '1x2',
            selection: 'home',
            probability: predictions.home,
            odds: marketOdds.home
        });
        markets.push({
            type: '1x2', 
            selection: 'draw',
            probability: predictions.draw,
            odds: marketOdds.draw
        });
        markets.push({
            type: '1x2',
            selection: 'away',
            probability: predictions.away, 
            odds: marketOdds.away
        });

        // Over/Under Markets
        markets.push({
            type: 'over_under',
            selection: 'over25',
            probability: predictions.over25,
            odds: marketOdds.over25
        });
        markets.push({
            type: 'over_under',
            selection: 'under25',
            probability: 1 - predictions.over25,
            odds: marketOdds.under25
        });

        // BTTS Markets
        markets.push({
            type: 'btts',
            selection: 'yes',
            probability: predictions.btts,
            odds: marketOdds.bttsYes
        });
        markets.push({
            type: 'btts',
            selection: 'no',
            probability: 1 - predictions.btts,
            odds: marketOdds.bttsNo
        });

        // Double Chance
        markets.push({
            type: 'double_chance',
            selection: '1x',
            probability: predictions.home + predictions.draw,
            odds: marketOdds.doubleChance1X
        });
        markets.push({
            type: 'double_chance',
            selection: 'x2',
            probability: predictions.draw + predictions.away,
            odds: marketOdds.doubleChanceX2
        });

        return markets;
    }

    async analyzeMarketValue(predictions, marketOdds, market) {
        const probability = market.probability;
        const odds = market.odds;
        
        // Basis Value Berechnung
        const rawValue = (probability * odds) - 1;
        
        // Erweiterte Value-Metriken
        const confidenceAdjustedValue = this.adjustValueForConfidence(rawValue, predictions.confidence);
        const riskAdjustedValue = this.adjustValueForRisk(confidenceAdjustedValue, market);
        const marketAdjustedValue = this.adjustValueForMarketConditions(riskAdjustedValue, marketOdds);
        
        // Value Score berechnen
        const valueScore = this.calculateValueScore(marketAdjustedValue, probability, odds);
        
        // Erwarteter Wert
        const expectedValue = this.calculateExpectedValue(probability, odds);
        
        return {
            value: marketAdjustedValue,
            score: valueScore,
            confidence: predictions.confidence,
            odds: odds,
            probability: probability,
            expectedValue: expectedValue,
            analysis: this.generateValueAnalysis(marketAdjustedValue, probability, odds),
            riskLevel: this.assessRiskLevel(probability, odds),
            context: {
                market: market.type,
                selection: market.selection,
                rawValue: rawValue,
                adjustments: {
                    confidence: confidenceAdjustedValue - rawValue,
                    risk: riskAdjustedValue - confidenceAdjustedValue,
                    market: marketAdjustedValue - riskAdjustedValue
                }
            }
        };
    }

    adjustValueForConfidence(value, confidence) {
        // Höhere Confidence = weniger Value-Abzug
        const confidenceFactor = Math.pow(confidence, 1.5);
        return value * confidenceFactor;
    }

    adjustValueForRisk(value, market) {
        const probability = market.probability;
        
        // Risiko-Anpassung basierend auf Wahrscheinlichkeit
        let riskAdjustment = 1;
        
        if (probability < 0.2) {
            // Sehr niedrige Wahrscheinlichkeit - höheres Risiko
            riskAdjustment = 0.7;
        } else if (probability < 0.35) {
            // Niedrige Wahrscheinlichkeit - moderates Risiko
            riskAdjustment = 0.85;
        } else if (probability > 0.65) {
            // Hohe Wahrscheinlichkeit - geringeres Risiko
            riskAdjustment = 1.1;
        } else if (probability > 0.8) {
            // Sehr hohe Wahrscheinlichkeit - noch geringeres Risiko
            riskAdjustment = 1.15;
        }
        
        return value * riskAdjustment;
    }

    adjustValueForMarketConditions(value, marketOdds) {
        // Anpassung basierend auf Marktbedingungen
        const overround = this.calculateOverround(marketOdds);
        const marketEfficiency = 1 - (overround / 3);
        
        // Ineffiziente Märkte bieten mehr Value
        return value * (1.2 - marketEfficiency);
    }

    calculateValueScore(value, probability, odds) {
        // Multi-Faktor Value Score
        const valueComponent = Math.max(0, value) * 0.6;
        const probabilityComponent = probability * 0.2;
        const oddsComponent = (odds > 2 ? Math.log(odds) / 2 : 0) * 0.2;
        
        return valueComponent + probabilityComponent + oddsComponent;
    }

    calculateExpectedValue(probability, odds) {
        return (probability * (odds - 1)) - (1 - probability);
    }

    calculateOptimalStake(valueBet) {
        const riskProfile = this.riskProfiles[this.riskProfile];
        const kellyFraction = this.calculateKellyFraction(valueBet.probability, valueBet.odds);
        
        // Risiko-angepasster Kelly
        const adjustedKelly = kellyFraction * riskProfile.kellyFraction;
        
        // Stake begrenzen
        const stakePercentage = Math.min(
            riskProfile.maxStake,
            Math.max(0.01, adjustedKelly)
        );
        
        const stakeAmount = this.bankroll * stakePercentage;
        
        return {
            percentage: stakePercentage,
            amount: Math.round(stakeAmount),
            kellyFraction: kellyFraction,
            reasoning: this.generateStakeReasoning(stakePercentage, valueBet),
            riskAdjusted: true
        };
    }

    calculateKellyFraction(probability, odds) {
        if (odds <= 1) return 0;
        
        const kelly = (probability * odds - 1) / (odds - 1);
        return Math.max(0, kelly);
    }

    async findArbitrageOpportunities(marketOdds) {
        const arbitrageBets = [];
        
        // Einfache Arbitrage-Checks
        const arbitrageChecks = [
            this.check1X2Arbitrage(marketOdds),
            this.checkOverUnderArbitrage(marketOdds),
            this.checkBTTSArbitrage(marketOdds)
        ];
        
        const results = await Promise.all(arbitrageChecks);
        
        results.forEach(arbitrage => {
            if (arbitrage.found) {
                arbitrageBets.push({
                    market: 'arbitrage',
                    selection: arbitrage.selection,
                    value: arbitrage.value,
                    confidence: 0.95,
                    score: arbitrage.value * 2, // Höheres Scoring für Arbitrage
                    odds: arbitrage.odds,
                    probability: 1.0, // Arbitrage ist risikofrei
                    stake: {
                        percentage: 0.05, // Konservativer Stake für Arbitrage
                        amount: this.bankroll * 0.05,
                        reasoning: 'Risk-free arbitrage opportunity'
                    },
                    reasoning: arbitrage.description,
                    riskLevel: 'very_low',
                    expectedValue: arbitrage.value,
                    arbitrage: true
                });
            }
        });
        
        return arbitrageBets;
    }

    check1X2Arbitrage(marketOdds) {
        const totalImplied = (1/marketOdds.home) + (1/marketOdds.draw) + (1/marketOdds.away);
        const arbitrageValue = 1 - totalImplied;
        
        return {
            found: arbitrageValue > 0.01, // 1% Arbitrage
            value: arbitrageValue,
            selection: '1X2 Arbitrage',
            odds: marketOdds,
            description: `1X2 Arbitrage opportunity with ${(arbitrageValue * 100).toFixed(2)}% edge`
        };
    }

    checkOverUnderArbitrage(marketOdds) {
        const totalImplied = (1/marketOdds.over25) + (1/marketOdds.under25);
        const arbitrageValue = 1 - totalImplied;
        
        return {
            found: arbitrageValue > 0.01,
            value: arbitrageValue,
            selection: 'Over/Under Arbitrage',
            odds: { over25: marketOdds.over25, under25: marketOdds.under25 },
            description: `Over/Under Arbitrage with ${(arbitrageValue * 100).toFixed(2)}% edge`
        };
    }

    checkBTTSArbitrage(marketOdds) {
        const totalImplied = (1/marketOdds.bttsYes) + (1/marketOdds.bttsNo);
        const arbitrageValue = 1 - totalImplied;
        
        return {
            found: arbitrageValue > 0.01,
            value: arbitrageValue,
            selection: 'BTTS Arbitrage',
            odds: { bttsYes: marketOdds.bttsYes, bttsNo: marketOdds.bttsNo },
            description: `BTTS Arbitrage with ${(arbitrageValue * 100).toFixed(2)}% edge`
        };
    }

    optimizeBettingPortfolio(valueBets) {
        if (valueBets.length <= 3) return valueBets;
        
        // Portfolio Optimization basierend auf Korrelation und Risiko
        const optimizedBets = [];
        let allocatedBudget = 0;
        const maxBudget = this.bankroll * this.maxStakePercentage;
        
        // Sort by value score descending
        const sortedBets = valueBets.sort((a, b) => b.score - a.score);
        
        for (const bet of sortedBets) {
            if (allocatedBudget + bet.stake.amount <= maxBudget) {
                // Check correlation with existing bets
                const correlation = this.calculatePortfolioCorrelation(optimizedBets, bet);
                
                if (correlation < 0.7) { // Accept bets with low correlation
                    optimizedBets.push(bet);
                    allocatedBudget += bet.stake.amount;
                }
            }
        }
        
        return optimizedBets;
    }

    calculatePortfolioCorrelation(existingBets, newBet) {
        if (existingBets.length === 0) return 0;
        
        // Vereinfachte Korrelationsberechnung basierend auf Markttyp
        let totalCorrelation = 0;
        
        existingBets.forEach(existingBet => {
            let correlation = 0.5; // Base correlation
            
            if (existingBet.market === newBet.market) {
                correlation = 0.8; // Same market type = high correlation
            }
            
            if (this.areMarketsRelated(existingBet.market, newBet.market)) {
                correlation = 0.6; // Related markets = medium correlation
            }
            
            totalCorrelation += correlation;
        });
        
        return totalCorrelation / existingBets.length;
    }

    areMarketsRelated(market1, market2) {
        const relatedGroups = {
            '1x2': ['double_chance'],
            'over_under': ['btts'],
            'btts': ['over_under']
        };
        
        return relatedGroups[market1]?.includes(market2) || 
               relatedGroups[market2]?.includes(market1);
    }

    generateValueAnalysis(value, probability, odds) {
        if (value > 0.15) {
            return `Ausgezeichneter Value (${(value * 100).toFixed(1)}%) - Starke Empfehlung`;
        } else if (value > 0.08) {
            return `Guter Value (${(value * 100).toFixed(1)}%) - Solide Opportunity`;
        } else if (value > 0.05) {
            return `Leichter Value (${(value * 100).toFixed(1)}%) - Vorsichtige Empfehlung`;
        } else {
            return `Geringer Value (${(value * 100).toFixed(1)}%) - Nur für aggressive Spieler`;
        }
    }

    generateStakeReasoning(stakePercentage, valueBet) {
        const riskProfile = this.riskProfiles[this.riskProfile];
        
        if (stakePercentage >= riskProfile.maxStake * 0.8) {
            return `Maximaler Stake für ${this.riskProfile} Risk Profile`;
        } else if (stakePercentage >= riskProfile.maxStake * 0.5) {
            return `Hoher Stake - Starke Value Opportunity`;
        } else if (stakePercentage >= riskProfile.maxStake * 0.3) {
            return `Moderater Stake - Gute Value Chance`;
        } else {
            return `Konservativer Stake - Geringeres Risiko`;
        }
    }

    assessRiskLevel(probability, odds) {
        const impliedProbability = 1 / odds;
        const edge = probability - impliedProbability;
        
        if (edge > 0.1) return 'low';
        if (edge > 0.05) return 'medium';
        if (edge > 0.02) return 'high';
        return 'very_high';
    }

    calculateOverround(marketOdds) {
        const impliedHome = 1 / marketOdds.home;
        const impliedDraw = 1 / marketOdds.draw;
        const impliedAway = 1 / marketOdds.away;
        
        return impliedHome + impliedDraw + impliedAway - 1;
    }

    async generateSimulatedOdds(predictions) {
        // Simulierte Odds basierend auf Wahrscheinlichkeiten mit Buchmacher-Marge
        const margin = 0.065; // 6.5% Buchmacher-Marge
        
        return {
            home: 1 / (predictions.home * (1 - margin)),
            draw: 1 / (predictions.draw * (1 - margin)),
            away: 1 / (predictions.away * (1 - margin)),
            over25: 1 / (predictions.over25 * (1 - margin)),
            under25: 1 / ((1 - predictions.over25) * (1 - margin)),
            bttsYes: 1 / (predictions.btts * (1 - margin)),
            bttsNo: 1 / ((1 - predictions.btts) * (1 - margin)),
            doubleChance1X: 1 / ((predictions.home + predictions.draw) * (1 - margin)),
            doubleChanceX2: 1 / ((predictions.draw + predictions.away) * (1 - margin))
        };
    }

    async fetchMarketOdds(homeTeam, awayTeam, league) {
        // In einer echten Implementation würde dies von einer Odds-API kommen
        // Für jetzt verwenden wir simulierte Odds
        return this.generateSimulatedOdds({
            home: 0.45,
            draw: 0.25,
            away: 0.30,
            over25: 0.52,
            btts: 0.48
        });
    }

    recordBetResult(bet, result, actualOdds = null) {
        const betRecord = {
            ...bet,
            result: result,
            actualOdds: actualOdds || bet.odds,
            timestamp: new Date().toISOString(),
            profit: this.calculateProfit(bet, result, actualOdds)
        };
        
        this.bettingHistory.push(betRecord);
        
        // Update bankroll
        this.bankroll += betRecord.profit;
        
        // Cleanup old records
        this.cleanupBettingHistory();
    }

    calculateProfit(bet, result, actualOdds) {
        if (result === 'win') {
            return (bet.stake.amount * (actualOdds || bet.odds)) - bet.stake.amount;
        } else if (result === 'push') {
            return 0; // Stake zurück
        } else {
            return -bet.stake.amount; // Verlust
        }
    }

    cleanupBettingHistory() {
        const threeMonthsAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
        this.bettingHistory = this.bettingHistory.filter(
            bet => new Date(bet.timestamp).getTime() > threeMonthsAgo
        );
    }

    getPerformanceStats() {
        const totalBets = this.bettingHistory.length;
        const winningBets = this.bettingHistory.filter(bet => bet.result === 'win').length;
        const totalStaked = this.bettingHistory.reduce((sum, bet) => sum + bet.stake.amount, 0);
        const totalProfit = this.bettingHistory.reduce((sum, bet) => sum + bet.profit, 0);
        
        const winRate = totalBets > 0 ? (winningBets / totalBets) * 100 : 0;
        const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;
        
        return {
            bankroll: this.bankroll,
            totalBets: totalBets,
            winningBets: winningBets,
            winRate: winRate,
            totalStaked: totalStaked,
            totalProfit: totalProfit,
            roi: roi,
            riskProfile: this.riskProfile,
            valueThreshold: this.valueThreshold
        };
    }

    setRiskProfile(profile) {
        if (this.riskProfiles[profile]) {
            this.riskProfile = profile;
            this.valueThreshold = this.riskProfiles[profile].valueThreshold;
            this.maxStakePercentage = this.riskProfiles[profile].maxStake;
            return true;
        }
        return false;
    }

    getRiskProfile() {
        return {
            current: this.riskProfile,
            settings: this.riskProfiles[this.riskProfile],
            available: Object.keys(this.riskProfiles)
        };
    }
 }
