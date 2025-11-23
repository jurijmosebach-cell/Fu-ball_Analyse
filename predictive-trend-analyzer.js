// predictive-trend-analyzer.js - Predictive Trend Analysis System
export class PredictiveTrendAnalyzer {
    constructor() {
        this.historicalPatterns = new Map();
        this.marketTrends = new Map();
        this.teamPatterns = new Map();
        this.leagueInsights = new Map();
        this.realTimeData = new Map();
        
        this.initializeHistoricalData();
        this.initializeLeagueInsights();
    }

    // INITIALISIERUNG DER DATENBANKEN
    initializeHistoricalData() {
        // Historische Erfolgsmuster für verschiedene Markttypen
        this.historicalPatterns.set('home_dominance', {
            description: 'Heimstärke Muster',
            successRate: 0.72,
            confidence: 0.85,
            conditions: ['strong_home_team', 'weak_away_team', 'home_advantage'],
            triggers: ['recent_home_wins', 'high_home_xg', 'poor_away_form']
        });

        this.historicalPatterns.set('goal_fest', {
            description: 'Torreiche Spiele Muster',
            successRate: 0.68,
            confidence: 0.78,
            conditions: ['both_teams_attacking', 'poor_defenses', 'high_total_xg'],
            triggers: ['recent_high_scoring', 'defensive_issues', 'attacking_lineups']
        });

        this.historicalPatterns.set('btts_regular', {
            description: 'Beide Teams treffen Muster',
            successRate: 0.65,
            confidence: 0.75,
            conditions: ['balanced_teams', 'both_score_often', 'open_play_style'],
            triggers: ['recent_btts_games', 'attacking_mentality', 'defensive_weaknesses']
        });

        this.historicalPatterns.set('under_value', {
            description: 'Under 2.5 Value Muster',
            successRate: 0.61,
            confidence: 0.70,
            conditions: ['strong_defenses', 'tactical_approach', 'low_total_xg'],
            triggers: ['recent_low_scoring', 'defensive_lineups', 'important_match']
        });

        // Team-spezifische Muster
        this.teamPatterns.set('Manchester City', {
            home_dominance: 0.88,
            goal_fest: 0.75,
            btts: 0.52,
            clean_sheets: 0.45
        });

        this.teamPatterns.set('Bayern Munich', {
            home_dominance: 0.85,
            goal_fest: 0.80,
            btts: 0.58,
            clean_sheets: 0.42
        });

        this.teamPatterns.set('Liverpool', {
            home_dominance: 0.82,
            goal_fest: 0.78,
            btts: 0.65,
            clean_sheets: 0.38
        });

        // Weitere Teams hinzufügen
        this.teamPatterns.set('Real Madrid', {
            home_dominance: 0.83,
            goal_fest: 0.72,
            btts: 0.55,
            clean_sheets: 0.48
        });

        this.teamPatterns.set('Inter Milan', {
            home_dominance: 0.80,
            goal_fest: 0.68,
            btts: 0.50,
            clean_sheets: 0.52
        });

        this.teamPatterns.set('Paris Saint-Germain', {
            home_dominance: 0.86,
            goal_fest: 0.77,
            btts: 0.58,
            clean_sheets: 0.44
        });
    }

    initializeLeagueInsights() {
        // Liga-spezifische Trends und Insights
        this.leagueInsights.set('Bundesliga', {
            avg_goals: 3.2,
            home_win_rate: 0.45,
            over25_rate: 0.68,
            btts_rate: 0.52,
            trend_strength: 0.82,
            predictability: 0.78
        });

        this.leagueInsights.set('Premier League', {
            avg_goals: 2.8,
            home_win_rate: 0.43,
            over25_rate: 0.52,
            btts_rate: 0.48,
            trend_strength: 0.75,
            predictability: 0.72
        });

        this.leagueInsights.set('La Liga', {
            avg_goals: 2.6,
            home_win_rate: 0.44,
            over25_rate: 0.48,
            btts_rate: 0.45,
            trend_strength: 0.70,
            predictability: 0.68
        });

        this.leagueInsights.set('Serie A', {
            avg_goals: 2.7,
            home_win_rate: 0.46,
            over25_rate: 0.51,
            btts_rate: 0.44,
            trend_strength: 0.73,
            predictability: 0.71
        });

        this.leagueInsights.set('Ligue 1', {
            avg_goals: 2.5,
            home_win_rate: 0.47,
            over25_rate: 0.46,
            btts_rate: 0.43,
            trend_strength: 0.69,
            predictability: 0.67
        });

        this.leagueInsights.set('Champions League', {
            avg_goals: 2.9,
            home_win_rate: 0.42,
            over25_rate: 0.55,
            btts_rate: 0.51,
            trend_strength: 0.76,
            predictability: 0.74
        });
    }

    // FEHLENDE METHODE HINZUGEFÜGT
    async getHistoricalPatterns(league) {
        try {
            // Liga-spezifische Muster zurückgeben
            const leaguePatterns = this.leagueInsights.get(league) || this.leagueInsights.get('Bundesliga');
            
            // Allgemeine historische Muster mit Liga-Anpassung
            const patterns = {
                home_dominance: {
                    ...this.historicalPatterns.get('home_dominance'),
                    successRate: this.historicalPatterns.get('home_dominance').successRate * leaguePatterns.predictability
                },
                goal_fest: {
                    ...this.historicalPatterns.get('goal_fest'),
                    successRate: this.historicalPatterns.get('goal_fest').successRate * (leaguePatterns.avg_goals / 3.0)
                },
                btts_regular: {
                    ...this.historicalPatterns.get('btts_regular'),
                    successRate: this.historicalPatterns.get('btts_regular').successRate * (leaguePatterns.btts_rate / 0.5)
                },
                under_value: {
                    ...this.historicalPatterns.get('under_value'),
                    successRate: this.historicalPatterns.get('under_value').successRate * (1 - leaguePatterns.over25_rate)
                },
                league_specific: leaguePatterns
            };

            return patterns;
        } catch (error) {
            console.error('Error getting historical patterns:', error);
            // Fallback-Muster zurückgeben
            return {
                home_dominance: this.historicalPatterns.get('home_dominance'),
                goal_fest: this.historicalPatterns.get('goal_fest'),
                btts_regular: this.historicalPatterns.get('btts_regular'),
                under_value: this.historicalPatterns.get('under_value'),
                league_specific: this.leagueInsights.get('Bundesliga')
            };
        }
    }
    // MULTI-DIMENSIONALE TREND-ANALYSE
    async analyzeMultiDimensionalTrends(gameData, historicalPatterns) {
        try {
            const { probabilities, xgData, teams, league, mlFeatures } = gameData;
            
            const analysis = {
                primaryTrend: null,
                secondaryTrends: [],
                allTrends: [],
                confidence: 0,
                riskAssessment: {},
                recommendations: [],
                marketInsights: [],
                predictiveScore: 0
            };

            // Alle Trend-Analysen parallel durchführen
            const trendAnalyses = await Promise.all([
                this.analyzeHDHTrends(probabilities, teams, league),
                this.analyzeGoalTrends(xgData, probabilities, teams, league),
                this.analyzeBTTSBTrends(probabilities, xgData, teams),
                this.analyzeMarketTrends(probabilities, league),
                this.analyzeTeamPatterns(teams.home, teams.away, league),
                this.analyzeMLTrends(mlFeatures, probabilities)
            ]);

            // Trends kombinieren und gewichten
            const allTrends = trendAnalyses.flat();
            analysis.allTrends = this.rankTrendsByStrength(allTrends);
            
            // Primären Trend identifizieren
            analysis.primaryTrend = this.identifyPrimaryTrend(analysis.allTrends);
            
            // Sekundäre Trends (Top 3-5)
            analysis.secondaryTrends = analysis.allTrends
                .filter(trend => trend !== analysis.primaryTrend)
                .slice(0, 4);

            // Gesamt-Konfidenz berechnen
            analysis.confidence = this.calculateOverallConfidence(analysis.allTrends);
            
            // Risiko-Bewertung
            analysis.riskAssessment = this.assessTrendRisk(analysis.allTrends, probabilities);
            
            // Empfehlungen generieren
            analysis.recommendations = this.generateTrendRecommendations(analysis);
            
            // Predictive Score berechnen
            analysis.predictiveScore = this.calculatePredictiveScore(analysis);

            return analysis;
        } catch (error) {
            console.error('Error in analyzeMultiDimensionalTrends:', error);
            // Fallback-Analyse zurückgeben
            return this.getFallbackTrendAnalysis();
        }
    }

    // HDH TREND-ANALYSE
    async analyzeHDHTrends(probabilities, teams, league) {
        const trends = [];
        const { home, draw, away } = probabilities;
        
        // Heimstärke Trend
        if (home > 0.6) {
            trends.push({
                market: 'home',
                description: 'Starke Heimvorteil',
                probability: home,
                confidence: this.calculateTrendConfidence(home, 0.6),
                strength: home > 0.7 ? 'strong' : home > 0.6 ? 'medium' : 'weak',
                triggers: ['high_home_probability', 'league_home_advantage'],
                historicalSupport: this.getHistoricalSupport('home_dominance', league)
            });
        }

        // Auswärtsstärke Trend
        if (away > 0.55) {
            trends.push({
                market: 'away',
                description: 'Auswärtsstärke erkennbar',
                probability: away,
                confidence: this.calculateTrendConfidence(away, 0.55),
                strength: away > 0.65 ? 'strong' : away > 0.55 ? 'medium' : 'weak',
                triggers: ['strong_away_team', 'home_weakness'],
                historicalSupport: this.getHistoricalSupport('away_strength', league)
            });
        }

        // Unentschieden Trend
        if (draw > 0.35 && Math.abs(home - away) < 0.15) {
            trends.push({
                market: 'draw',
                description: 'Ausgeglichene Begegnung',
                probability: draw,
                confidence: this.calculateTrendConfidence(draw, 0.35),
                strength: 'medium',
                triggers: ['balanced_teams', 'close_probabilities'],
                historicalSupport: this.getHistoricalSupport('balanced_game', league)
            });
        }

        return trends;
    }

    // GOAL TREND-ANALYSE
    async analyzeGoalTrends(xgData, probabilities, teams, league) {
        const trends = [];
        const { home, away } = xgData;
        const totalXG = home + away;
        const over25Prob = probabilities.over25;

        // Torfest Trend
        if (totalXG > 3.5 && over25Prob > 0.65) {
            trends.push({
                market: 'goal_fest',
                description: 'Hohe Torerwartung - Torfest möglich',
                probability: over25Prob,
                confidence: this.calculateTrendConfidence(over25Prob, 0.65),
                strength: totalXG > 4.0 ? 'strong' : 'medium',
                triggers: ['high_total_xg', 'attacking_teams', 'poor_defenses'],
                historicalSupport: this.getHistoricalSupport('goal_fest', league)
            });
        }

        // Over 2.5 Trend
        if (over25Prob > 0.58) {
            trends.push({
                market: 'over25',
                description: 'Über 2.5 Tore wahrscheinlich',
                probability: over25Prob,
                confidence: this.calculateTrendConfidence(over25Prob, 0.58),
                strength: over25Prob > 0.68 ? 'strong' : over25Prob > 0.58 ? 'medium' : 'weak',
                triggers: ['positive_goal_trend', 'league_scoring_rate'],
                historicalSupport: this.getHistoricalSupport('over25', league)
            });
        }

        // Under 2.5 Trend
        if (over25Prob < 0.45) {
            trends.push({
                market: 'under25',
                description: 'Unter 2.5 Tore wahrscheinlich',
                probability: 1 - over25Prob,
                confidence: this.calculateTrendConfidence(1 - over25Prob, 0.55),
                strength: over25Prob < 0.35 ? 'strong' : over25Prob < 0.45 ? 'medium' : 'weak',
                triggers: ['low_total_xg', 'strong_defenses', 'tactical_game'],
                historicalSupport: this.getHistoricalSupport('under_value', league)
            });
        }

        // High Scoring Trend
        if (totalXG > 3.0 && over25Prob > 0.6) {
            trends.push({
                market: 'high_scoring',
                description: 'Sehr torreiche Partie erwartet',
                probability: Math.min(0.95, over25Prob * 1.1),
                confidence: this.calculateTrendConfidence(totalXG, 3.0),
                strength: 'strong',
                triggers: ['exceptional_attacking', 'defensive_issues'],
                historicalSupport: this.getHistoricalSupport('high_scoring', league)
            });
        }

        return trends;
    }

    // BTTS TREND-ANALYSE
    async analyzeBTTSBTrends(probabilities, xgData, teams) {
        const trends = [];
        const bttsProb = probabilities.btts;
        const { home, away } = xgData;

        // BTTS Ja Trend
        if (bttsProb > 0.55) {
            trends.push({
                market: 'btts_yes',
                description: 'Beide Teams treffen wahrscheinlich',
                probability: bttsProb,
                confidence: this.calculateTrendConfidence(bttsProb, 0.55),
                strength: bttsProb > 0.65 ? 'strong' : bttsProb > 0.55 ? 'medium' : 'weak',
                triggers: ['both_teams_scoring', 'open_game_expected'],
                historicalSupport: this.getHistoricalSupport('btts_regular', teams.home)
            });
        }

        // BTTS Nein Trend
        if (bttsProb < 0.4) {
            trends.push({
                market: 'btts_no',
                description: 'Clean Sheet wahrscheinlich',
                probability: 1 - bttsProb,
                confidence: this.calculateTrendConfidence(1 - bttsProb, 0.6),
                strength: bttsProb < 0.3 ? 'strong' : bttsProb < 0.4 ? 'medium' : 'weak',
                triggers: ['strong_defense', 'poor_attack'],
                historicalSupport: this.getHistoricalSupport('clean_sheet', teams.home)
            });
        }

        return trends;
    }

    // MARKT TREND-ANALYSE
    async analyzeMarketTrends(probabilities, league) {
        const trends = [];
        const leagueInsights = this.leagueInsights.get(league) || this.leagueInsights.get('Bundesliga');

        // Liga-spezifische Trends
        if (probabilities.over25 > leagueInsights.over25_rate + 0.1) {
            trends.push({
                market: 'over25',
                description: `Überdurchschnittliche Torerwartung in der ${league}`,
                probability: probabilities.over25,
                confidence: leagueInsights.trend_strength,
                strength: 'medium',
                triggers: ['league_comparison', 'above_average_goals'],
                historicalSupport: leagueInsights.over25_rate
            });
        }

        if (probabilities.btts > leagueInsights.btts_rate + 0.08) {
            trends.push({
                market: 'btts_yes',
                description: `Überdurchschnittliche BTTS-Wahrscheinlichkeit in der ${league}`,
                probability: probabilities.btts,
                confidence: leagueInsights.trend_strength,
                strength: 'medium',
                triggers: ['league_comparison', 'above_average_btts'],
                historicalSupport: leagueInsights.btts_rate
            });
        }

        return trends;
    }
       // TEAM-SPEZIFISCHE MUSTER
    async analyzeTeamPatterns(homeTeam, awayTeam, league) {
        const trends = [];
        const homePatterns = this.teamPatterns.get(homeTeam);
        const awayPatterns = this.teamPatterns.get(awayTeam);

        if (homePatterns) {
            // Heimstärke Muster
            if (homePatterns.home_dominance > 0.8) {
                trends.push({
                    market: 'home',
                    description: `${homeTeam} Heimstärke Muster bestätigt`,
                    probability: homePatterns.home_dominance,
                    confidence: 0.75,
                    strength: 'strong',
                    triggers: ['team_specific_pattern', 'historical_home_performance'],
                    historicalSupport: homePatterns.home_dominance
                });
            }

            // Goal Fest Muster
            if (homePatterns.goal_fest > 0.7) {
                trends.push({
                    market: 'goal_fest',
                    description: `${homeTeam} neigt zu torreichen Spielen`,
                    probability: homePatterns.goal_fest,
                    confidence: 0.70,
                    strength: 'medium',
                    triggers: ['team_attacking_style', 'historical_high_scoring'],
                    historicalSupport: homePatterns.goal_fest
                });
            }
        }

        if (awayPatterns) {
            // Auswärtsstärke Muster
            if (awayPatterns.home_dominance > 0.75) {
                trends.push({
                    market: 'away',
                    description: `${awayTeam} starke Auswärtsperformance`,
                    probability: awayPatterns.home_dominance,
                    confidence: 0.70,
                    strength: 'medium',
                    triggers: ['team_away_performance', 'consistent_travel_form'],
                    historicalSupport: awayPatterns.home_dominance
                });
            }
        }

        return trends;
    }

    // ML-FEATURE TREND-ANALYSE
    async analyzeMLTrends(mlFeatures, probabilities) {
        const trends = [];

        if (mlFeatures) {
            // Form Momentum Trend
            if (mlFeatures.formMomentum > 0.7) {
                trends.push({
                    market: 'home',
                    description: 'Starkes Form-Momentum erkennbar',
                    probability: Math.min(0.95, probabilities.home * 1.1),
                    confidence: mlFeatures.confidence || 0.7,
                    strength: 'medium',
                    triggers: ['positive_momentum', 'improving_form'],
                    historicalSupport: 0.68
                });
            }

            // Fatigue Impact Trend
            if (mlFeatures.fatigueImpact > 0.6) {
                trends.push({
                    market: 'under25',
                    description: 'Ermüdungsfaktor könnte Tore reduzieren',
                    probability: Math.min(0.95, (1 - probabilities.over25) * 1.15),
                    confidence: 0.65,
                    strength: 'medium',
                    triggers: ['team_fatigue', 'congested_schedule'],
                    historicalSupport: 0.62
                });
            }
        }

        return trends;
    }

    // HILFSFUNKTIONEN
    calculateTrendConfidence(probability, threshold) {
        const baseConfidence = (probability - threshold) / (1 - threshold);
        return Math.max(0.3, Math.min(0.95, baseConfidence));
    }

    getHistoricalSupport(pattern, context) {
        const patternData = this.historicalPatterns.get(pattern);
        if (!patternData) return 0.5;
        
        // Kontext-spezifische Anpassung
        let support = patternData.successRate;
        
        if (typeof context === 'string' && this.leagueInsights.has(context)) {
            const leagueData = this.leagueInsights.get(context);
            support *= leagueData.predictability;
        }
        
        return support;
    }

    rankTrendsByStrength(trends) {
        return trends.sort((a, b) => {
            const scoreA = (a.probability * 0.6) + (a.confidence * 0.4);
            const scoreB = (b.probability * 0.6) + (b.confidence * 0.4);
            return scoreB - scoreA;
        });
    }

    identifyPrimaryTrend(trends) {
        if (trends.length === 0) {
            return {
                market: 'balanced',
                description: 'Kein klarer Trend erkennbar',
                probability: 0.5,
                confidence: 0.5,
                strength: 'weak',
                triggers: [],
                historicalSupport: 0.5
            };
        }

        return trends[0];
    }

    calculateOverallConfidence(trends) {
        if (trends.length === 0) return 0.5;
        
        const weightedConfidence = trends.reduce((sum, trend, index) => {
            const weight = 1 / (index + 1); // Höhere Gewichtung für stärkere Trends
            return sum + (trend.confidence * weight);
        }, 0);
        
        const totalWeight = trends.reduce((sum, _, index) => sum + (1 / (index + 1)), 0);
        
        return weightedConfidence / totalWeight;
    }

    assessTrendRisk(trends, probabilities) {
        const riskFactors = [];
        let overallRisk = 'medium';

        // Trend-Stabilität prüfen
        if (trends.length === 0) {
            riskFactors.push('Keine klaren Trends erkennbar');
            overallRisk = 'high';
        }

        // Widersprüchliche Trends
        const conflictingTrends = this.findConflictingTrends(trends);
        if (conflictingTrends.length > 0) {
            riskFactors.push('Widersprüchliche Trend-Signale');
            overallRisk = 'high';
        }

        // Niedrige Wahrscheinlichkeiten
        if (Math.max(probabilities.home, probabilities.draw, probabilities.away) < 0.4) {
            riskFactors.push('Keine klare Favoritenstellung');
            overallRisk = 'high';
        }

        // Hohe Konfidenz bei starken Trends
        if (trends.some(t => t.confidence > 0.8 && t.strength === 'strong')) {
            overallRisk = 'low';
        }

        return {
            level: overallRisk,
            factors: riskFactors,
            score: this.calculateRiskScore(overallRisk)
        };
    }

    findConflictingTrends(trends) {
        const conflicts = [];
        const marketGroups = {
            home: ['away', 'draw'],
            away: ['home', 'draw'],
            over25: ['under25'],
            under25: ['over25'],
            btts_yes: ['btts_no'],
            btts_no: ['btts_yes']
        };

        trends.forEach(trend => {
            const conflictingMarkets = marketGroups[trend.market] || [];
            trends.forEach(otherTrend => {
                if (conflictingMarkets.includes(otherTrend.market) && 
                    trend.confidence > 0.6 && otherTrend.confidence > 0.6) {
                    conflicts.push(`${trend.market} vs ${otherTrend.market}`);
                }
            });
        });

        return conflicts;
    }

    calculateRiskScore(riskLevel) {
        const riskScores = {
            'low': 0.2,
            'medium': 0.5,
            'high': 0.8
        };
        return riskScores[riskLevel] || 0.5;
    }

    generateTrendRecommendations(analysis) {
        const recommendations = [];
        const { primaryTrend, secondaryTrends, riskAssessment } = analysis;

        // Primär-Trend Empfehlung
        if (primaryTrend && primaryTrend.confidence > 0.6) {
            recommendations.push({
                type: 'primary',
                trend: primaryTrend.market,
                confidence: primaryTrend.confidence,
                reasoning: `Starker Trend für ${primaryTrend.description}`,
                action: this.getTrendAction(primaryTrend.market, primaryTrend.strength)
            });
        }

        // Sekundär-Trend Empfehlungen
        secondaryTrends
            .filter(trend => trend.confidence > 0.55)
            .forEach(trend => {
                recommendations.push({
                    type: 'secondary',
                    trend: trend.market,
                    confidence: trend.confidence,
                    reasoning: `Unterstützender Trend für ${trend.description}`,
                    action: this.getTrendAction(trend.market, trend.strength)
                });
            });

        // Risiko-basierte Empfehlungen
        if (riskAssessment.level === 'high') {
            recommendations.push({
                type: 'risk_warning',
                trend: 'all',
                confidence: 0.8,
                reasoning: 'Hohes Risiko durch widersprüchliche Signale',
                action: 'Kleine Einsätze oder Beobachten empfohlen'
            });
        }

        return recommendations;
    }

    getTrendAction(market, strength) {
        const actions = {
            'home': {
                'strong': 'Starke Heimsieg-Quote in Betracht ziehen',
                'medium': 'Heimsieg als Hauptoption',
                'weak': 'Vorsichtige Heimsieg-Quote'
            },
            'away': {
                'strong': 'Attraktive Auswärts-Quote nutzen',
                'medium': 'Auswärtssieg als Value Bet',
                'weak': 'Risikobewusste Auswärts-Quote'
            },
            'over25': {
                'strong': 'Over 2.5 als Top-Empfehlung',
                'medium': 'Over 2.5 für Portfolio',
                'weak': 'Kleine Over 2.5 Position'
            },
            'btts_yes': {
                'strong': 'BTTS Ja als starke Option',
                'medium': 'BTTS Ja für Diversifikation',
                'weak': 'BTTS Ja als Nebenwette'
            }
        };

        return actions[market]?.[strength] || 'Trend beobachten';
    }

    calculatePredictiveScore(analysis) {
        const { primaryTrend, confidence, riskAssessment } = analysis;
        
        let score = 0;
        
        // Trend-Stärke Beitrag
        if (primaryTrend) {
            const strengthScores = { 'strong': 0.8, 'medium': 0.6, 'weak': 0.4 };
            score += primaryTrend.probability * (strengthScores[primaryTrend.strength] || 0.5) * 0.4;
        }
        
        // Konfidenz Beitrag
        score += confidence * 0.3;
        
        // Risiko Beitrag (invers)
        score += (1 - riskAssessment.score) * 0.2;
        
        // Historische Unterstützung Beitrag
        if (primaryTrend) {
            score += (primaryTrend.historicalSupport || 0.5) * 0.1;
        }
        
        return Math.max(0.1, Math.min(0.95, score));
    }

    // FALLBACK FÜR FEHLERBEHANDLUNG
    getFallbackTrendAnalysis() {
        return {
            primaryTrend: {
                market: 'balanced',
                description: 'Standard-Analyse aufgrund von Systemfehler',
                probability: 0.5,
                confidence: 0.5,
                strength: 'weak',
                triggers: ['system_fallback'],
                historicalSupport: 0.5
            },
            secondaryTrends: [],
            allTrends: [],
            confidence: 0.5,
            riskAssessment: {
                level: 'medium',
                factors: ['System verwendet Fallback-Analyse'],
                score: 0.5
            },
            recommendations: [{
                type: 'system_warning',
                trend: 'all',
                confidence: 0.5,
                reasoning: 'System verwendet Standard-Analyse aufgrund von Fehlern',
                action: 'Vorsichtige Herangehensweise empfohlen'
            }],
            marketInsights: [],
            predictiveScore: 0.5
        };
    }
     // REAL-TIME TREND UPDATES
    async updateTrendWithRealTimeData(trendAnalysis, realTimeData) {
        const updatedTrends = [...trendAnalysis.allTrends];
        
        // Lineup-basierte Updates
        if (realTimeData.lineups) {
            const lineupImpact = this.analyzeLineupImpact(realTimeData.lineups);
            updatedTrends.forEach(trend => {
                trend.confidence *= lineupImpact[trend.market] || 1.0;
            });
        }

        // Weather-basierte Updates
        if (realTimeData.weather) {
            const weatherImpact = this.analyzeWeatherImpact(realTimeData.weather);
            updatedTrends.forEach(trend => {
                if (['over25', 'goal_fest', 'high_scoring'].includes(trend.market)) {
                    trend.confidence *= weatherImpact.goalFactor;
                }
            });
        }

        return {
            ...trendAnalysis,
            allTrends: this.rankTrendsByStrength(updatedTrends),
            realTimeUpdated: true,
            updateTimestamp: new Date().toISOString()
        };
    }

    analyzeLineupImpact(lineups) {
        const impact = {
            'home': 1.0,
            'away': 1.0,
            'over25': 1.0,
            'btts_yes': 1.0
        };

        // Vereinfachte Lineup-Analyse
        if (lineups.home.strength > lineups.away.strength) {
            impact.home *= 1.1;
        }
        
        if (lineups.away.missingPlayers > 2) {
            impact.away *= 0.9;
            impact.btts_yes *= 0.95;
        }

        return impact;
    }

    analyzeWeatherImpact(weather) {
        const impact = { goalFactor: 1.0 };
        
        if (weather.condition === 'rain' || weather.condition === 'snow') {
            impact.goalFactor = 0.9;
        } else if (weather.condition === 'clear') {
            impact.goalFactor = 1.05;
        }
        
        if (weather.windSpeed > 30) {
            impact.goalFactor *= 0.95;
        }

        return impact;
    }

    // PERFORMANCE TRACKING
    async trackTrendPerformance(prediction, actualResult) {
        const performance = {
            timestamp: new Date().toISOString(),
            predictedTrend: prediction.primaryTrend?.market,
            actualResult: actualResult,
            confidence: prediction.confidence,
            wasAccurate: this.evaluateTrendAccuracy(prediction, actualResult)
        };

        // Performance in lokaler Datenbank speichern
        this.storePerformanceRecord(performance);
        
        return performance;
    }

    evaluateTrendAccuracy(prediction, actualResult) {
        const primaryTrend = prediction.primaryTrend;
        if (!primaryTrend) return false;

        // Vereinfachte Genauigkeitsbewertung
        const trendMapping = {
            'home': 'home',
            'away': 'away', 
            'draw': 'draw',
            'over25': 'over25',
            'btts_yes': 'btts'
        };

        const expected = trendMapping[primaryTrend.market];
        return actualResult[expected] === true;
    }

    storePerformanceRecord(performance) {
        const historyKey = 'trend_performance_history';
        let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        
        history.push(performance);
        
        // Nur letzte 100 Einträge behalten
        if (history.length > 100) {
            history = history.slice(-100);
        }
        
        localStorage.setItem(historyKey, JSON.stringify(history));
    }

    getTrendPerformanceStats() {
        const history = JSON.parse(localStorage.getItem('trend_performance_history') || '[]');
        
        if (history.length === 0) {
            return { total: 0, accuracy: 0, recentPerformance: [] };
        }

        const accuratePredictions = history.filter(record => record.wasAccurate).length;
        const accuracy = accuratePredictions / history.length;

        return {
            total: history.length,
            accuracy: accuracy,
            recentPerformance: history.slice(-10),
            confidenceAccuracy: this.calculateConfidenceAccuracy(history)
        };
    }

    calculateConfidenceAccuracy(history) {
        const confidenceRanges = [
            { min: 0.8, max: 1.0, accurate: 0, total: 0 },
            { min: 0.6, max: 0.8, accurate: 0, total: 0 },
            { min: 0.4, max: 0.6, accurate: 0, total: 0 },
            { min: 0.0, max: 0.4, accurate: 0, total: 0 }
        ];

        history.forEach(record => {
            const range = confidenceRanges.find(r => 
                record.confidence >= r.min && record.confidence < r.max
            );
            if (range) {
                range.total++;
                if (record.wasAccurate) range.accurate++;
            }
        });

        return confidenceRanges.map(range => ({
            range: `${(range.min * 100).toFixed(0)}-${(range.max * 100).toFixed(0)}%`,
            accuracy: range.total > 0 ? range.accurate / range.total : 0,
            samples: range.total
        }));
    }
}
