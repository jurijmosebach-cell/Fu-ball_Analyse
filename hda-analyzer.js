// hda-analyzer.js - Professionelle Heim-Draw-Auswärts (HDH) Analyse
export class HDAAnalyzer {
    constructor() {
        this.historicalData = new Map();
        this.teamStats = new Map();
        this.leaguePatterns = new Map();
        this.initHistoricalData();
    }

    // Historische Daten initialisieren
    initHistoricalData() {
        // Simulierte historische Daten für bekannte Teams
        this.historicalData.set("Bayern Munich", {
            home: { wins: 85, draws: 10, losses: 5, goalsFor: 245, goalsAgainst: 65 },
            away: { wins: 70, draws: 15, losses: 15, goalsFor: 195, goalsAgainst: 85 },
            h2h: {
                "Borussia Dortmund": { home: { wins: 8, draws: 2, losses: 0 }, away: { wins: 5, draws: 3, losses: 2 } },
                "RB Leipzig": { home: { wins: 6, draws: 1, losses: 0 }, away: { wins: 4, draws: 2, losses: 1 } }
            }
        });

        this.historicalData.set("Borussia Dortmund", {
            home: { wins: 75, draws: 15, losses: 10, goalsFor: 210, goalsAgainst: 90 },
            away: { wins: 60, draws: 20, losses: 20, goalsFor: 165, goalsAgainst: 110 },
            h2h: {
                "Bayern Munich": { home: { wins: 0, draws: 2, losses: 8 }, away: { wins: 2, draws: 3, losses: 5 } }
            }
        });

        this.historicalData.set("Manchester City", {
            home: { wins: 88, draws: 8, losses: 4, goalsFor: 260, goalsAgainst: 60 },
            away: { wins: 72, draws: 12, losses: 16, goalsFor: 205, goalsAgainst: 95 }
        });

        this.historicalData.set("Liverpool", {
            home: { wins: 80, draws: 12, losses: 8, goalsFor: 235, goalsAgainst: 75 },
            away: { wins: 65, draws: 18, losses: 17, goalsFor: 190, goalsAgainst: 105 }
        });

        // Liga-spezifische Muster
        this.leaguePatterns.set("Bundesliga", {
            homeWinRate: 0.45,
            drawRate: 0.25,
            awayWinRate: 0.30,
            avgGoals: 3.2,
            over25Rate: 0.68
        });

        this.leaguePatterns.set("Premier League", {
            homeWinRate: 0.43,
            drawRate: 0.26,
            awayWinRate: 0.31,
            avgGoals: 2.8,
            over25Rate: 0.52
        });

        this.leaguePatterns.set("La Liga", {
            homeWinRate: 0.44,
            drawRate: 0.27,
            awayWinRate: 0.29,
            avgGoals: 2.6,
            over25Rate: 0.48
        });
    }

    // Komplette HDH-Analyse durchführen
    async analyzeHDA(homeTeam, awayTeam, league, currentForm = null) {
        const analysis = {
            homeTeam: homeTeam,
            awayTeam: awayTeam,
            league: league,
            timestamp: new Date().toISOString(),
            
            // Grundlegende Statistiken
            basicStats: this.getBasicStats(homeTeam, awayTeam, league),
            
            // Historische Performance
            historicalPerformance: this.getHistoricalPerformance(homeTeam, awayTeam),
            
            // Head-to-Head Analyse
            h2hAnalysis: this.getH2HAnalysis(homeTeam, awayTeam),
            
            // Liga-spezifische Muster
            leaguePatterns: this.getLeaguePatterns(league),
            
            // Form-Analyse
            formAnalysis: currentForm || await this.getCurrentForm(homeTeam, awayTeam),
            
            // HDH-Vorhersagen
            predictions: this.calculateHDHPredictions(homeTeam, awayTeam, league),
            
            // Value Opportunities
            valueOpportunities: this.calculateValueOpportunities(homeTeam, awayTeam, league),
            
            // Risiko-Bewertung
            riskAssessment: this.assessRisk(homeTeam, awayTeam, league),
            
            // Empfehlungen
            recommendations: this.generateRecommendations(homeTeam, awayTeam, league)
        };

        return analysis;
    }

    // Grundlegende Statistiken
    getBasicStats(homeTeam, awayTeam, league) {
        const homeStats = this.historicalData.get(homeTeam) || this.getDefaultStats();
        const awayStats = this.historicalData.get(awayTeam) || this.getDefaultStats();
        const leaguePattern = this.leaguePatterns.get(league) || this.leaguePatterns.get("Bundesliga");

        return {
            homeWinRate: this.calculateWinRate(homeStats.home),
            homeDrawRate: this.calculateDrawRate(homeStats.home),
            homeLossRate: this.calculateLossRate(homeStats.home),
            
            awayWinRate: this.calculateWinRate(awayStats.away),
            awayDrawRate: this.calculateDrawRate(awayStats.away),
            awayLossRate: this.calculateLossRate(awayStats.away),
            
            homeGoalsFor: homeStats.home.goalsFor / (homeStats.home.wins + homeStats.home.draws + homeStats.home.losses),
            homeGoalsAgainst: homeStats.home.goalsAgainst / (homeStats.home.wins + homeStats.home.draws + homeStats.home.losses),
            
            awayGoalsFor: awayStats.away.goalsFor / (awayStats.away.wins + awayStats.away.draws + awayStats.away.losses),
            awayGoalsAgainst: awayStats.away.goalsAgainst / (awayStats.away.wins + awayStats.away.draws + awayStats.away.losses),
            
            leagueHomeWinRate: leaguePattern.homeWinRate,
            leagueDrawRate: leaguePattern.drawRate,
            leagueAwayWinRate: leaguePattern.awayWinRate
        };
    }

    // Historische Performance
    getHistoricalPerformance(homeTeam, awayTeam) {
        const homeStats = this.historicalData.get(homeTeam) || this.getDefaultStats();
        const awayStats = this.historicalData.get(awayTeam) || this.getDefaultStats();

        return {
            home: {
                totalMatches: homeStats.home.wins + homeStats.home.draws + homeStats.home.losses,
                winRate: this.calculateWinRate(homeStats.home),
                unbeatenRate: (homeStats.home.wins + homeStats.home.draws) / (homeStats.home.wins + homeStats.home.draws + homeStats.home.losses),
                cleanSheetRate: this.estimateCleanSheetRate(homeStats.home),
                avgGoals: homeStats.home.goalsFor / (homeStats.home.wins + homeStats.home.draws + homeStats.home.losses)
            },
            away: {
                totalMatches: awayStats.away.wins + awayStats.away.draws + awayStats.away.losses,
                winRate: this.calculateWinRate(awayStats.away),
                unbeatenRate: (awayStats.away.wins + awayStats.away.draws) / (awayStats.away.wins + awayStats.away.draws + awayStats.away.losses),
                cleanSheetRate: this.estimateCleanSheetRate(awayStats.away),
                avgGoals: awayStats.away.goalsFor / (awayStats.away.wins + awayStats.away.draws + awayStats.away.losses)
            }
        };
    }

    // Head-to-Head Analyse
    getH2HAnalysis(homeTeam, awayTeam) {
        const homeStats = this.historicalData.get(homeTeam);
        const awayStats = this.historicalData.get(awayTeam);

        if (!homeStats || !homeStats.h2h || !homeStats.h2h[awayTeam]) {
            return this.getDefaultH2H();
        }

        const h2h = homeStats.h2h[awayTeam];
        const totalMatches = h2h.home.wins + h2h.home.draws + h2h.home.losses + 
                           h2h.away.wins + h2h.away.draws + h2h.away.losses;

        return {
            totalMatches: totalMatches,
            homeWins: h2h.home.wins + h2h.away.wins,
            draws: h2h.home.draws + h2h.away.draws,
            awayWins: h2h.home.losses + h2h.away.losses,
            homeWinRate: (h2h.home.wins + h2h.away.wins) / totalMatches,
            drawRate: (h2h.home.draws + h2h.away.draws) / totalMatches,
            awayWinRate: (h2h.home.losses + h2h.away.losses) / totalMatches,
            trend: this.analyzeH2HTrend(h2h),
            last5Matches: this.getLast5H2HMatches(homeTeam, awayTeam)
        };
    }

    // Liga-spezifische Muster
    getLeaguePatterns(league) {
        return this.leaguePatterns.get(league) || this.leaguePatterns.get("Bundesliga");
    }

    // Aktuelle Form (simuliert)
    async getCurrentForm(homeTeam, awayTeam) {
        // In einer echten Implementation würde dies von einer API kommen
        return {
            home: {
                last5: ['W', 'W', 'D', 'W', 'L'],
                formRating: 0.75,
                goalsScored: 12,
                goalsConceded: 4,
                cleanSheets: 2
            },
            away: {
                last5: ['W', 'L', 'W', 'D', 'W'],
                formRating: 0.65,
                goalsScored: 8,
                goalsConceded: 6,
                cleanSheets: 1
            }
        };
    }

    // HDH-Vorhersagen berechnen
    calculateHDHPredictions(homeTeam, awayTeam, league) {
        const basicStats = this.getBasicStats(homeTeam, awayTeam, league);
        const h2h = this.getH2HAnalysis(homeTeam, awayTeam);
        const leaguePattern = this.getLeaguePatterns(league);

        // Gewichtete Berechnung
        const weights = {
            historical: 0.35,
            h2h: 0.25,
            league: 0.20,
            form: 0.20
        };

        const homeWin = (basicStats.homeWinRate * weights.historical) + 
                       (h2h.homeWinRate * weights.h2h) + 
                       (leaguePattern.homeWinRate * weights.league) + 
                       (0.7 * weights.form); // Annahme für Form

        const draw = (basicStats.homeDrawRate * weights.historical) + 
                    (h2h.drawRate * weights.h2h) + 
                    (leaguePattern.drawRate * weights.league) + 
                    (0.2 * weights.form);

        const awayWin = (basicStats.awayWinRate * weights.historical) + 
                       (h2h.awayWinRate * weights.h2h) + 
                       (leaguePattern.awayWinRate * weights.league) + 
                       (0.1 * weights.form);

        // Normalisierung
        const total = homeWin + draw + awayWin;

        return {
            home: homeWin / total,
            draw: draw / total,
            away: awayWin / total,
            confidence: this.calculatePredictionConfidence(homeTeam, awayTeam, league),
            expectedGoals: {
                home: basicStats.homeGoalsFor,
                away: basicStats.awayGoalsFor,
                total: basicStats.homeGoalsFor + basicStats.awayGoalsFor
            }
        };
    }

    // Value Opportunities berechnen
    calculateValueOpportunities(homeTeam, awayTeam, league) {
        const predictions = this.calculateHDHPredictions(homeTeam, awayTeam, league);
        const marketMargins = {
            "Bundesliga": 0.065,
            "Premier League": 0.068,
            "La Liga": 0.062,
            "Serie A": 0.060,
            "Ligue 1": 0.063,
            "default": 0.065
        };

        const margin = marketMargins[league] || marketMargins.default;

        return {
            home: this.calculateValue(predictions.home, margin),
            draw: this.calculateValue(predictions.draw, margin),
            away: this.calculateValue(predictions.away, margin),
            over25: this.calculateOver25Value(predictions.expectedGoals.total, margin),
            btts: this.calculateBTTSValue(homeTeam, awayTeam, margin)
        };
    }

    // Risiko-Bewertung
    assessRisk(homeTeam, awayTeam, league) {
        const h2h = this.getH2HAnalysis(homeTeam, awayTeam);
        const predictions = this.calculateHDHPredictions(homeTeam, awayTeam, league);

        let riskLevel = "medium";
        let riskFactors = [];

        if (h2h.totalMatches < 5) {
            riskFactors.push("Wenige historische Aufeinandertreffen");
            riskLevel = "high";
        }

        if (Math.abs(predictions.home - predictions.away) < 0.1) {
            riskFactors.push("Ausgeglichene Mannschaftsstärke");
            riskLevel = "medium";
        }

        if (predictions.confidence < 0.6) {
            riskFactors.push("Geringe Vorhersage-Konfidenz");
            riskLevel = "high";
        }

        return {
            level: riskLevel,
            factors: riskFactors,
            confidence: predictions.confidence
        };
    }

    // Empfehlungen generieren
    generateRecommendations(homeTeam, awayTeam, league) {
        const predictions = this.calculateHDHPredictions(homeTeam, awayTeam, league);
        const value = this.calculateValueOpportunities(homeTeam, awayTeam, league);
        const risk = this.assessRisk(homeTeam, awayTeam, league);

        const recommendations = [];
        const bestValue = Math.max(value.home, value.draw, value.away, value.over25);

        if (predictions.home > 0.5 && value.home > 0.05) {
            recommendations.push({
                type: "strong",
                market: "Heimsieg",
                confidence: predictions.confidence,
                value: value.home,
                reasoning: `${homeTeam} zeigt starke Heimperformance mit ${Math.round(predictions.home * 100)}% Siegwahrscheinlichkeit`
            });
        }

        if (predictions.away > 0.4 && value.away > 0.08) {
            recommendations.push({
                type: "value",
                market: "Auswärtssieg", 
                confidence: predictions.confidence,
                value: value.away,
                reasoning: `Guter Value bei ${awayTeam} mit ${Math.round(predictions.away * 100)}% Siegchance`
            });
        }

        if (value.over25 > 0.1) {
            recommendations.push({
                type: "over_under",
                market: "Over 2.5",
                confidence: 0.7,
                value: value.over25,
                reasoning: `Hohe Torerwartung (${predictions.expectedGoals.total.toFixed(1)} erwartete Tore)`
            });
        }

        return recommendations;
    }

    // Hilfsfunktionen
    calculateWinRate(stats) {
        const total = stats.wins + stats.draws + stats.losses;
        return total > 0 ? stats.wins / total : 0.33;
    }

    calculateDrawRate(stats) {
        const total = stats.wins + stats.draws + stats.losses;
        return total > 0 ? stats.draws / total : 0.33;
    }

    calculateLossRate(stats) {
        const total = stats.wins + stats.draws + stats.losses;
        return total > 0 ? stats.losses / total : 0.34;
    }

    estimateCleanSheetRate(stats) {
        // Vereinfachte Schätzung basierend auf Gegentoren
        const totalMatches = stats.wins + stats.draws + stats.losses;
        const avgGoalsConceded = stats.goalsAgainst / totalMatches;
        return Math.max(0, 1 - (avgGoalsConceded / 2));
    }

    analyzeH2HTrend(h2h) {
        const homeDominance = h2h.home.wins / (h2h.home.wins + h2h.home.draws + h2h.home.losses);
        if (homeDominance > 0.6) return "Home Dominance";
        if (homeDominance < 0.3) return "Away Advantage";
        return "Balanced";
    }

    getLast5H2HMatches(homeTeam, awayTeam) {
        // Simulierte letzte 5 Aufeinandertreffen
        return [
            { result: "H", score: "2-1", date: "2024-03-15" },
            { result: "D", score: "1-1", date: "2023-11-20" },
            { result: "H", score: "3-0", date: "2023-04-10" },
            { result: "A", score: "0-2", date: "2022-12-05" },
            { result: "H", score: "2-1", date: "2022-08-20" }
        ];
    }

    calculatePredictionConfidence(homeTeam, awayTeam, league) {
        const h2h = this.getH2HAnalysis(homeTeam, awayTeam);
        let confidence = 0.7;

        // Mehr Daten = höhere Konfidenz
        if (h2h.totalMatches >= 10) confidence += 0.15;
        else if (h2h.totalMatches >= 5) confidence += 0.08;

        // Bekannte Teams = höhere Konfidenz
        const knownTeams = ["Bayern Munich", "Borussia Dortmund", "Manchester City", "Liverpool", "Real Madrid", "Barcelona"];
        if (knownTeams.includes(homeTeam) && knownTeams.includes(awayTeam)) {
            confidence += 0.1;
        }

        return Math.min(0.95, confidence);
    }

    calculateValue(probability, margin) {
        const fairOdds = 1 / (probability * (1 - margin));
        const value = (probability * fairOdds) - 1;
        return Math.max(-1, value);
    }

    calculateOver25Value(expectedGoals, margin) {
        const over25Prob = 1 / (1 + Math.exp(-(expectedGoals - 2.5) * 1.5));
        return this.calculateValue(over25Prob, margin);
    }

    calculateBTTSValue(homeTeam, awayTeam, margin) {
        const homeStats = this.historicalData.get(homeTeam) || this.getDefaultStats();
        const awayStats = this.historicalData.get(awayTeam) || this.getDefaultStats();
        
        const homeAttack = homeStats.home.goalsFor / (homeStats.home.wins + homeStats.home.draws + homeStats.home.losses);
        const awayAttack = awayStats.away.goalsFor / (awayStats.away.wins + awayStats.away.draws + awayStats.away.losses);
        
        const bttsProb = 1 - (Math.exp(-homeAttack) * Math.exp(-awayAttack));
        return this.calculateValue(bttsProb, margin);
    }

    getDefaultStats() {
        return {
            home: { wins: 30, draws: 15, losses: 15, goalsFor: 85, goalsAgainst: 60 },
            away: { wins: 20, draws: 20, losses: 20, goalsFor: 65, goalsAgainst: 75 },
            h2h: {}
        };
    }

    getDefaultH2H() {
        return {
            totalMatches: 0,
            homeWins: 0,
            draws: 0,
            awayWins: 0,
            homeWinRate: 0.33,
            drawRate: 0.33,
            awayWinRate: 0.34,
            trend: "Unknown",
            last5Matches: []
        };
    }

    // Erweiterte Analyse für spezifische Märkte
    async getAdvancedHDAnalysis(matchId, homeTeam, awayTeam, league) {
        const basicAnalysis = await this.analyzeHDA(homeTeam, awayTeam, league);
        
        return {
            matchId: matchId,
            ...basicAnalysis,
            advancedMetrics: {
                poissonPrediction: this.calculatePoissonPrediction(homeTeam, awayTeam),
                eloRating: this.calculateEloRating(homeTeam, awayTeam),
                momentum: this.calculateMomentum(homeTeam, awayTeam),
                marketEfficiency: this.assessMarketEfficiency(league)
            },
            bettingSuggestions: this.generateBettingSuggestions(basicAnalysis)
        };
    }

    calculatePoissonPrediction(homeTeam, awayTeam) {
        const homeStats = this.historicalData.get(homeTeam) || this.getDefaultStats();
        const awayStats = this.historicalData.get(awayTeam) || this.getDefaultStats();
        
        const homeLambda = homeStats.home.goalsFor / (homeStats.home.wins + homeStats.home.draws + homeStats.home.losses);
        const awayLambda = awayStats.away.goalsFor / (awayStats.away.wins + awayStats.away.draws + awayStats.away.losses);
        
        return { homeLambda, awayLambda };
    }

    calculateEloRating(homeTeam, awayTeam) {
        // Vereinfachte Elo-Berechnung
        const baseRating = 1500;
        const homeRating = baseRating + (this.historicalData.get(homeTeam) ? 100 : 0);
        const awayRating = baseRating + (this.historicalData.get(awayTeam) ? 80 : 0);
        
        return { homeRating, awayRating, difference: homeRating - awayRating };
    }

    calculateMomentum(homeTeam, awayTeam) {
          // Simulierte Momentum-Berechnung
        return {
            home: 0.7 + Math.random() * 0.2,
            away: 0.5 + Math.random() * 0.3,
            advantage: homeTeam // Welches Team Momentum-Vorteil hat
        };
    }

    assessMarketEfficiency(league) {
        const efficiencies = {
            "Premier League": 0.92,
            "Bundesliga": 0.89,
            "La Liga": 0.88,
            "Serie A": 0.85,
            "Ligue 1": 0.83,
            "default": 0.80
        };
        
        return efficiencies[league] || efficiencies.default;
    }

    generateBettingSuggestions(analysis) {
        const suggestions = [];
        const { predictions, valueOpportunities, riskAssessment } = analysis;

        if (valueOpportunities.home > 0.1 && riskAssessment.level !== "high") {
            suggestions.push({
                type: "MAIN_BET",
                market: "Heimsieg",
                stake: "3-5%",
                reasoning: `Starke Heimperformance mit ${(valueOpportunities.home * 100).toFixed(1)}% Value`
            });
        }

        if (valueOpportunities.over25 > 0.15) {
            suggestions.push({
                type: "VALUE_BET", 
                market: "Over 2.5 Goals",
                stake: "2-3%",
                reasoning: `Hohe Torerwartung mit ${(valueOpportunities.over25 * 100).toFixed(1)}% Value`
            });
        }

        return suggestions;
    }
}
