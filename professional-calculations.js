// professional-calculations.js - Ultra-professionelle Berechnungen
export class ProfessionalCalculator {
    constructor() {
        this.leagueModels = this.initLeagueModels();
        this.marketEfficiency = 0.94;
        this.kiConfidence = 0.88;
    }

    initLeagueModels() {
        return {
            "Premier League": { 
                goalFactor: 1.05, intensity: 1.12, homeAdvantage: 1.15,
                over25Base: 0.52, bttsBase: 0.48
            },
            "Bundesliga": { 
                goalFactor: 1.18, intensity: 1.25, homeAdvantage: 1.12,
                over25Base: 0.58, bttsBase: 0.52
            },
            "La Liga": { 
                goalFactor: 0.95, intensity: 0.92, homeAdvantage: 1.08,
                over25Base: 0.46, bttsBase: 0.44
            },
            "Serie A": { 
                goalFactor: 0.88, intensity: 0.85, homeAdvantage: 1.10,
                over25Base: 0.42, bttsBase: 0.41
            },
            "Ligue 1": { 
                goalFactor: 1.02, intensity: 0.98, homeAdvantage: 1.12,
                over25Base: 0.49, bttsBase: 0.46
            },
            "Champions League": { 
                goalFactor: 1.12, intensity: 1.18, homeAdvantage: 1.05,
                over25Base: 0.55, bttsBase: 0.51
            },
            "default": { 
                goalFactor: 1.00, intensity: 1.00, homeAdvantage: 1.10,
                over25Base: 0.48, bttsBase: 0.45
            }
        };
    }

    // ULTRA-PRÄZISE xG-BERECHNUNG
    calculateAdvancedXG(homeTeam, awayTeam, homeStrength, awayStrength, league, formData = null) {
        const leagueModel = this.leagueModels[league] || this.leagueModels.default;
        
        // Basis xG mit Elo-ähnlichem System
        const homeBaseXG = this.calculateBaseXG(homeStrength, awayStrength, true);
        const awayBaseXG = this.calculateBaseXG(awayStrength, homeStrength, false);
        
        // Dynamische Korrekturen
        const dynamicCorrections = this.calculateDynamicCorrections(homeTeam, awayTeam, formData);
        
        // Liga-Anpassung
        const homeXG = (homeBaseXG + dynamicCorrections.home) * leagueModel.goalFactor;
        const awayXG = (awayBaseXG + dynamicCorrections.away) * leagueModel.goalFactor;
        
        // Heimvorteil mit Liga-spezifischer Stärke
        const finalHomeXG = homeXG * leagueModel.homeAdvantage;
        const finalAwayXG = awayXG * (2 - leagueModel.homeAdvantage); // Kompensation für Auswärtsteam
        
        return {
            home: Math.max(0.15, Math.min(4.2, +finalHomeXG.toFixed(3))),
            away: Math.max(0.15, Math.min(3.8, +finalAwayXG.toFixed(3))),
            quality: this.calculateMatchQuality(finalHomeXG, finalAwayXG),
            confidence: this.calculateXGConfidence(homeTeam, awayTeam, league),
            expectedGoals: finalHomeXG + finalAwayXG
        };
    }

    calculateBaseXG(teamStrength, opponentStrength, isHome) {
        // Elo-ähnliches Rating System
        const strengthRatio = teamStrength.attack / (opponentStrength.defense + 0.5);
        const baseXG = 1.2 * Math.log(strengthRatio + 1);
        
        // Position-basierte Korrektur
        const positionCorrection = this.calculatePositionCorrection(teamStrength, opponentStrength);
        
        return baseXG + positionCorrection;
    }

    calculateDynamicCorrections(homeTeam, awayTeam, formData) {
        let homeCorrection = 0;
        let awayCorrection = 0;
        
        // Form-Korrektur (0.1 bis 0.3)
        if (formData) {
            homeCorrection += (formData.home.form - 0.5) * 0.3;
            awayCorrection += (formData.away.form - 0.5) * 0.3;
        }
        
        // Momentum-Korrektur basierend auf Team-Namen (simuliert)
        const homeMomentum = this.calculateTeamMomentum(homeTeam);
        const awayMomentum = this.calculateTeamMomentum(awayTeam);
        
        homeCorrection += homeMomentum * 0.15;
        awayCorrection += awayMomentum * 0.15;
        
        return {
            home: Math.max(-0.5, Math.min(0.5, homeCorrection)),
            away: Math.max(-0.5, Math.min(0.5, awayCorrection))
        };
    }

    calculateTeamMomentum(teamName) {
        // Simulierte Momentum-Berechnung basierend auf Team-Performance
        const momentumFactors = {
            "Manchester City": 0.8, "Bayern Munich": 0.75, "Real Madrid": 0.7,
            "Liverpool": 0.65, "Arsenal": 0.6, "Barcelona": 0.55,
            "default": 0.3
        };
        
        return momentumFactors[teamName] || momentumFactors.default;
    }

    calculatePositionCorrection(teamStrength, opponentStrength) {
        const strengthDiff = teamStrength.attack - opponentStrength.defense;
        return strengthDiff * 0.08; // 0.08 pro Stärke-Einheit
    }

    calculateMatchQuality(homeXG, awayXG) {
        const totalXG = homeXG + awayXG;
        const balance = 1 - Math.abs(homeXG - awayXG) / totalXG;
        
        // Qualität basierend auf erwarteten Toren und Ausgeglichenheit
        return Math.min(0.95, (totalXG * 0.3 + balance * 0.7));
    }

    calculateXGConfidence(homeTeam, awayTeam, league) {
        let confidence = 0.7;
        
        // Höhere Konfidenz für bekannte Teams
        const knownTeams = ["Manchester City", "Bayern Munich", "Real Madrid", "Liverpool", "Barcelona"];
        if (knownTeams.includes(homeTeam) && knownTeams.includes(awayTeam)) {
            confidence += 0.15;
        }
        
        // Liga-Konfidenz
        const leagueConfidence = {
            "Premier League": 0.1, "Bundesliga": 0.08, "Champions League": 0.12,
            "La Liga": 0.09, "Serie A": 0.07
        };
        
        confidence += leagueConfidence[league] || 0.05;
        
        return Math.min(0.95, confidence);
    }

    // ERWEITERTE WAHRSCHEINLICHKEITS-BERECHNUNG
    calculateAdvancedProbabilities(homeXG, awayXG, league) {
        const leagueModel = this.leagueModels[league] || this.leagueModels.default;
        
        // Bivariate Poisson mit Korrelation
        const probs = this.bivariatePoissonCalculation(homeXG, awayXG, 0.18);
        
        // Over/Under mit erweiterter Berechnung
        const overUnder = this.calculateAdvancedOverUnder(homeXG, awayXG, leagueModel);
        
        // BTTS mit Verteidigungs-Korrektur
        const btts = this.calculateAdvancedBTTS(homeXG, awayXG);
        
        return {
            ...probs,
            over25: overUnder.over25,
            under25: overUnder.under25,
            over15: overUnder.over15,
            under15: overUnder.under15,
            btts: btts.bttsYes,
            bttsNo: btts.bttsNo,
            exactScore: this.calculateExactScoreProbabilities(homeXG, awayXG),
            goalExpectancy: {
                home: homeXG,
                away: awayXG,
                total: homeXG + awayXG
            }
        };
    }

    bivariatePoissonCalculation(homeXG, awayXG, correlation = 0.18) {
        let homeWin = 0, draw = 0, awayWin = 0;
        
        // Erweiterte Berechnung mit mehr Iterationen für Präzision
        for (let i = 0; i <= 12; i++) {
            for (let j = 0; j <= 12; j++) {
                let prob = this.poisson(i, homeXG) * this.poisson(j, awayXG);
                
                // Korrelations-Korrektur für realistischere Ergebnisse
                if (i === j && i > 0) prob *= (1 + correlation); // Erhöhte Draw-Wahrscheinlichkeit
                if (i === 0 && j === 0) prob *= (1 - correlation * 0.5); // Reduzierte 0-0 Wahrscheinlichkeit
                
                if (i > j) homeWin += prob;
                else if (i === j) draw += prob;
                else awayWin += prob;
            }
        }
        
        // Normalisierung
        const total = homeWin + draw + awayWin;
        
        return {
            home: +(homeWin / total).toFixed(5),
            draw: +(draw / total).toFixed(5),
            away: +(awayWin / total).toFixed(5)
        };
    }

    calculateAdvancedOverUnder(homeXG, awayXG, leagueModel) {
        let over05 = 0, over15 = 0, over25 = 0, over35 = 0;
        let under05 = 0, under15 = 0, under25 = 0, under35 = 0;
        
        for (let i = 0; i <= 8; i++) {
            for (let j = 0; j <= 8; j++) {
                const totalGoals = i + j;
                const prob = this.poisson(i, homeXG) * this.poisson(j, awayXG);
                
                // Over/Under Berechnung
                if (totalGoals > 0.5) over05 += prob;
                if (totalGoals > 1.5) over15 += prob;
                if (totalGoals > 2.5) over25 += prob;
                if (totalGoals > 3.5) over35 += prob;
                
                if (totalGoals < 0.5) under05 += prob;
                if (totalGoals < 1.5) under15 += prob;
                if (totalGoals < 2.5) under25 += prob;
                if (totalGoals < 3.5) under35 += prob;
            }
        }
        
        // Liga-spezifische Anpassung
        const leagueAdjustment = leagueModel.over25Base / 0.48; // Basis ist 48%
        
        return {
            over05: +(over05 * leagueAdjustment).toFixed(5),
            over15: +(over15 * leagueAdjustment).toFixed(5),
            over25: +(over25 * leagueAdjustment).toFixed(5),
            over35: +(over35 * leagueAdjustment).toFixed(5),
            under05: +(under05 * (2 - leagueAdjustment)).toFixed(5),
            under15: +(under15 * (2 - leagueAdjustment)).toFixed(5),
            under25: +(under25 * (2 - leagueAdjustment)).toFixed(5),
            under35: +(under35 * (2 - leagueAdjustment)).toFixed(5)
        };
    }

    calculateAdvancedBTTS(homeXG, awayXG) {
        // Erweiterte BTTS-Berechnung mit Clean Sheet Wahrscheinlichkeit
        const pHomeScores = 1 - this.poisson(0, homeXG);
        const pAwayScores = 1 - this.poisson(0, awayXG);
        const pHomeCleanSheet = this.poisson(0, awayXG);
        const pAwayCleanSheet = this.poisson(0, homeXG);
        
        const bttsYes = pHomeScores * pAwayScores;
        const bttsNo = 1 - bttsYes;
        
        return {
            bttsYes: +bttsYes.toFixed(5),
            bttsNo: +bttsNo.toFixed(5),
            homeCleanSheet: +pHomeCleanSheet.toFixed(5),
            awayCleanSheet: +pAwayCleanSheet.toFixed(5)
        };
    }

    calculateExactScoreProbabilities(homeXG, awayXG) {
        const scores = {};
        
        // Wichtigste Spielstände berechnen
        const importantScores = [
            '0-0', '1-0', '0-1', '1-1', '2-0', '0-2', '2-1', '1-2', '2-2',
            '3-0', '0-3', '3-1', '1-3', '3-2', '2-3'
        ];
        
        importantScores.forEach(score => {
            const [home, away] = score.split('-').map(Number);
            scores[score] = +(this.poisson(home, homeXG) * this.poisson(away, awayXG)).toFixed(6);
        });
        
        return scores;
    }

    // PROFESSIONELLE VALUE-BERECHNUNG
    calculateAdvancedValue(probabilities, market = '1x2') {
        const marketMargins = {
            '1x2': 0.068,      // 6.8% Marge
            'over_under': 0.055, // 5.5% Marge  
            'btts': 0.062,     // 6.2% Marge
            'double_chance': 0.072 // 7.2% Marge
        };
        
        const margin = marketMargins[market] || 0.06;
        
        if (market === '1x2') {
            return {
                home: this.calculateSingleValue(probabilities.home, margin),
                draw: this.calculateSingleValue(probabilities.draw, margin),
                away: this.calculateSingleValue(probabilities.away, margin)
            };
        } else if (market === 'over_under') {
            return {
                over25: this.calculateSingleValue(probabilities.over25, margin),
                under25: this.calculateSingleValue(probabilities.under25, margin)
            };
        } else if (market === 'btts') {
            return {
                bttsYes: this.calculateSingleValue(probabilities.btts, margin),
                bttsNo: this.calculateSingleValue(probabilities.bttsNo, margin)
            };
        }
    }

    calculateSingleValue(probability, margin) {
        const fairOdds = 1 / (probability * (1 - margin));
        const value = (probability * fairOdds) - 1;
        
        // Value-Korrektur für Risiko
        const adjustedValue = this.adjustValueForRisk(value, probability);
        
        return +(Math.max(-1, adjustedValue).toFixed(4));
    }

    adjustValueForRisk(value, probability) {
        // Höheres Risiko für niedrige Wahrscheinlichkeiten
        if (probability < 0.2) {
            return value * 0.7; // 30% Risiko-Abzug
        } else if (probability < 0.35) {
            return value * 0.85; // 15% Risiko-Abzug
        }
        return value;
    }

    // PROFESSIONELLE ODDS-GENERIERUNG
    generateProfessionalOdds(probabilities, market = '1x2') {
        const marketMargins = {
            '1x2': 0.068,
            'over_under': 0.055,
            'btts': 0.062,
            'double_chance': 0.072
        };
        
        const margin = marketMargins[market] || 0.06;
        
        if (market === '1x2') {
            return {
                home: this.calculateOdds(probabilities.home, margin),
                draw: this.calculateOdds(probabilities.draw, margin),
                away: this.calculateOdds(probabilities.away, margin)
            };
        } else if (market === 'over_under') {
            return {
                over25: this.calculateOdds(probabilities.over25, margin),
                under25: this.calculateOdds(probabilities.under25, margin)
            };
        } else if (market === 'btts') {
            return {
                bttsYes: this.calculateOdds(probabilities.btts, margin),
                bttsNo: this.calculateOdds(probabilities.bttsNo, margin)
            };
        }
    }

    calculateOdds(probability, margin) {
        if (probability <= 0.01) return 101.00; // Max Odds begrenzen
        const odds = 1 / (probability * (1 - margin));
        return +(Math.min(101, Math.max(1.01, odds)).toFixed(2));
    }

    // KELLY CRITERION FÜR BET-SIZING
    calculateKellyStake(value, probability, bankroll = 1000) {
        if (value <= 0) return 0;
        
        const odds = 1 / probability;
        const kellyFraction = (odds * probability - 1) / (odds - 1);
        const stake = bankroll * kellyFraction * 0.5; // Half-Kelly für weniger Risiko
        
        return Math.max(0, Math.min(stake, bankroll * 0.1)); // Max 10% des Bankrolls
    }

    // HILFSFUNKTIONEN
    poisson(k, lambda) {
        if (lambda <= 0) return k === 0 ? 1 : 0;
        if (lambda > 10) lambda = 10;
        return (Math.pow(lambda, k) * Math.exp(-lambda)) / this.factorial(k);
    }

    factorial(n) {
        if (n <= 1) return 1;
        if (n > 20) return Infinity;
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return result;
    }

    // QUALITÄTS-BEWERTUNG FÜR DAS GESAMTE SPIEL
    calculateOverallQuality(xgData, probabilities, value) {
        const factors = {
            xgConfidence: xgData.confidence * 0.3,
            matchQuality: xgData.quality * 0.25,
            valueStrength: (Math.max(...Object.values(value)) + 1) * 0.25,
            probabilityCertainty: (1 - Math.abs(probabilities.home - probabilities.away)) * 0.2
        };
        
        const totalScore = Object.values(factors).reduce((sum, score) => sum + score, 0);
        return Math.min(0.95, totalScore);
    }
}
