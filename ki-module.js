// ki-module.js - KI-Modul für erweiterte Fußballanalysen
import * as ss from 'simple-statistics';

export class KIAnalyse {
    constructor() {
        this.historicalData = [];
        this.modelWeights = {
            homeAdvantage: 0.15,
            formWeight: 0.25,
            strengthWeight: 0.35,
            momentumWeight: 0.20,
            externalFactors: 0.05
        };
        this.learningRate = 0.01;
        this.teamMomentum = new Map();
    }

    // Maschinelles Lernen: Gradient Descent
    optimizeWeights(historicalResults) {
        const iterations = 100;

        for (let iter = 0; iter < iterations; iter++) {
            let gradients = {
                homeAdvantage: 0,
                formWeight: 0,
                strengthWeight: 0,
                momentumWeight: 0,
                externalFactors: 0
            };

            historicalResults.forEach(result => {
                const prediction = this.predictMatch(result.features);
                const error = prediction - result.actual;

                gradients.homeAdvantage += error * result.features.homeAdvantage;
                gradients.formWeight += error * result.features.form;
                gradients.strengthWeight += error * result.features.strength;
                gradients.momentumWeight += error * result.features.momentum;
                gradients.externalFactors += error * result.features.external;
            });

            // Gewichte anpassen
            Object.keys(this.modelWeights).forEach(key => {
                this.modelWeights[key] -= this.learningRate * gradients[key] / historicalResults.length;
                // Gewichte begrenzen
                this.modelWeights[key] = Math.max(0, Math.min(1, this.modelWeights[key]));
            });
        }
    }

    // KI-Faktoren berechnen
    async calculateKIFactors(homeTeam, awayTeam, league) {
        const factors = {
            homeAdvantage: this.calculateHomeAdvantage(homeTeam, league),
            formImpact: await this.calculateFormImpact(homeTeam, awayTeam),
            strengthImpact: this.calculateStrengthImpact(homeTeam, awayTeam),
            momentumImpact: this.calculateMomentumImpact(homeTeam, awayTeam),
            consistencyImpact: this.calculateConsistencyImpact(homeTeam, awayTeam),
            confidence: 0.7, // Standard-Konfidenz
            kiScore: 0.5
        };

        // Gesamt-KI-Score berechnen
        factors.kiScore = this.calculateKIScore(factors);
        factors.confidence = factors.kiScore;

        return factors;
    }

    calculateHomeAdvantage(team, league) {
        const leagueAdvantages = {
            "Premier League": 1.0,
            "Bundesliga": 1.1,
            "La Liga": 0.9,
            "Serie A": 0.95,
            "Ligue 1": 0.9,
            "Champions League": 0.8,
            "Europa League": 0.85
        };
        
        const baseAdvantage = leagueAdvantages[league] || 1.0;
        
        // Team-spezifischer Heimvorteil
        const teamHomeAdvantages = {
            "Manchester City": 1.2,
            "Liverpool": 1.15,
            "Bayern Munich": 1.25,
            "Borussia Dortmund": 1.2,
            "Real Madrid": 1.1,
            "Barcelona": 1.1
        };
        
        const teamAdvantage = teamHomeAdvantages[team] || 1.0;
        
        return baseAdvantage * teamAdvantage;
    }

    async calculateFormImpact(homeTeam, awayTeam) {
        // Simulierte Form-Berechnung - in der Praxis mit echten Daten
        const homeForm = this.simulateForm(homeTeam);
        const awayForm = this.simulateForm(awayTeam);
        
        const formDiff = homeForm - awayForm;
        return Math.max(0.5, Math.min(1.5, 1 + formDiff));
    }

    calculateStrengthImpact(homeTeam, awayTeam) {
        const strengthDiff = this.calculateTeamStrength(homeTeam) - this.calculateTeamStrength(awayTeam);
        return Math.max(0.7, Math.min(1.3, 1 + strengthDiff * 0.1));
    }

    calculateMomentumImpact(homeTeam, awayTeam) {
        const homeMomentum = this.teamMomentum.get(homeTeam) || 0.5;
        const awayMomentum = this.teamMomentum.get(awayTeam) || 0.5;
        
        return 1 + (homeMomentum - awayMomentum) * 0.2;
    }

    calculateConsistencyImpact(homeTeam, awayTeam) {
        // Simulierte Konsistenz-Berechnung
        const homeConsistency = this.simulateConsistency(homeTeam);
        const awayConsistency = this.simulateConsistency(awayTeam);
        
        return (homeConsistency + awayConsistency) / 2;
    }

    calculateKIScore(factors) {
        const weights = {
            homeAdvantage: 0.25,
            formImpact: 0.30,
            strengthImpact: 0.25,
            momentumImpact: 0.15,
            consistencyImpact: 0.05
        };

        let score = 0;
        Object.keys(weights).forEach(key => {
            score += factors[key] * weights[key];
        });

        return Math.max(0.1, Math.min(1.0, score));
    }

    // Form-Korrektur berechnen
    calculateFormCorrection(homeForm, awayForm) {
        let homeCorrection = 0;
        let awayCorrection = 0;
        
        if (homeForm && awayForm) {
            const formDiff = homeForm.form - awayForm.form;
            
            if (formDiff > 0.3) {
                homeCorrection += 0.25;
                awayCorrection -= 0.15;
            } else if (formDiff > 0.15) {
                homeCorrection += 0.15;
                awayCorrection -= 0.08;
            } else if (formDiff < -0.3) {
                awayCorrection += 0.25;
                homeCorrection -= 0.15;
            } else if (formDiff < -0.15) {
                awayCorrection += 0.15;
                homeCorrection -= 0.08;
            }
        }
        
        return { home: homeCorrection, away: awayCorrection };
    }

    // Trend-Score berechnen
    calculateTrendScore(homeProb, drawProb, awayProb, homeXG, awayXG) {
        const xgRatio = homeXG / (homeXG + awayXG);
        const probRatio = homeProb / (homeProb + awayProb);
        
        return {
            home: (homeProb * 0.7 + xgRatio * 0.3),
            draw: drawProb,
            away: (awayProb * 0.7 + (1 - xgRatio) * 0.3)
        };
    }

    // Finale KI-Korrektur
    finalPredictionCorrection(homeXG, awayXG, homeTeam, awayTeam) {
        // Komplexitäts-Korrektur für extreme Szenarien
        let homeCorrection = 0;
        let awayCorrection = 0;
        
        const totalXG = homeXG + awayXG;
        
        // Korrektur für high-scoring Spiele
        if (totalXG > 4.0) {
            homeCorrection -= 0.1;
            awayCorrection -= 0.1;
        }
        
        // Korrektur für low-scoring Spiele
        if (totalXG < 1.5) {
            homeCorrection += 0.05;
            awayCorrection += 0.05;
        }
        
        return { home: homeCorrection, away: awayCorrection };
    }

    // Detaillierte Analyse generieren
    generateAnalysis(homeTeam, awayTeam, probabilities, trend, confidence) {
        const analysis = {
            summary: "",
            keyFactors: [],
            recommendation: "",
            riskLevel: "medium",
            confidence: confidence
        };

        // Zusammenfassung basierend auf Trend
        switch(trend) {
            case "Strong Home":
                analysis.summary = `${homeTeam} zeigt eine starke Heimplatzdominanz mit hoher Siegwahrscheinlichkeit.`;
                analysis.recommendation = "Heimsieg favorisieren";
                analysis.riskLevel = "low";
                break;
            case "Strong Away":
                analysis.summary = `${awayTeam} ist in starker Auswärtsform und hat beste Chancen.`;
                analysis.recommendation = "Auswärtssieg favorisieren";
                analysis.riskLevel = "low";
                break;
            case "Home":
                analysis.summary = `${homeTeam} hat leichte Vorteile durch Heimspiel.`;
                analysis.recommendation = "Leichter Heimplatzvorteil";
                analysis.riskLevel = "medium";
                break;
            case "Away":
                analysis.summary = `${awayTeam} zeigt bessere Form als der Gegner.`;
                analysis.recommendation = "Auswärtsmannschaft im Vorteil";
                analysis.riskLevel = "medium";
                break;
            case "Draw":
                analysis.summary = "Ausgeglichene Begegnung mit Tendenz zu Unentschieden.";
                analysis.recommendation = "Unentschieden in Betracht ziehen";
                analysis.riskLevel = "high";
                break;
            default:
                analysis.summary = "Ausgeglichenes Spiel ohne klaren Favoriten.";
                analysis.recommendation = "Vorsichtige Einschätzung empfohlen";
                analysis.riskLevel = "high";
        }

        // Key Factors basierend auf Wahrscheinlichkeiten
        if (probabilities.home > 0.5) {
            analysis.keyFactors.push(`Heimstärke von ${homeTeam} (${Math.round(probabilities.home * 100)}%)`);
        }
        if (probabilities.away > 0.5) {
            analysis.keyFactors.push(`Auswärtsstärke von ${awayTeam} (${Math.round(probabilities.away * 100)}%)`);
        }
        if (probabilities.draw > 0.35) {
            analysis.keyFactors.push(`Hohe Unentschieden-Wahrscheinlichkeit (${Math.round(probabilities.draw * 100)}%)`);
        }

        return analysis;
    }

    // Hilfsfunktionen
    calculateTeamStrength(teamName) {
        const strengths = {
            "Manchester City": 0.95, "Liverpool": 0.92, "Arsenal": 0.88,
            "Bayern Munich": 0.94, "Borussia Dortmund": 0.85, "Real Madrid": 0.93,
            "Barcelona": 0.90, "Inter Milan": 0.87, "PSG": 0.89
        };
        
        return strengths[teamName] || 0.7;
    }

    simulateForm(teamName) {
        // Simulierte Form-Berechnung
        const baseForm = 0.5 + (Math.random() * 0.5);
        return Math.round(baseForm * 100) / 100;
    }

    simulateConsistency(teamName) {
        // Simulierte Konsistenz-Berechnung
        const baseConsistency = 0.6 + (Math.random() * 0.3);
        return Math.round(baseConsistency * 100) / 100;
    }

    predictMatch(features) {
        let prediction = 0;
        Object.keys(this.modelWeights).forEach(key => {
            prediction += features[key] * this.modelWeights[key];
        });
        return prediction;
    }

    async getDetailedAnalysis(matchId) {
        // Detaillierte KI-Analyse für ein spezifisches Spiel
        return {
            matchId: matchId,
            kiScore: 0.7 + (Math.random() * 0.3),
            factors: {
                teamStrength: this.simulateForm("Team"),
                recentForm: this.simulateForm("Form"),
                momentum: this.simulateForm("Momentum"),
                consistency: this.simulateConsistency("Consistency")
            },
            prediction: {
                homeWin: 0.4 + (Math.random() * 0.3),
                draw: 0.2 + (Math.random() * 0.2),
                awayWin: 0.3 + (Math.random() * 0.3)
            },
            confidence: 0.7 + (Math.random() * 0.2)
        };
    }
}
