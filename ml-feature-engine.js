// ml-feature-engine.js - Machine Learning Feature Engine
export class MLFeatureEngine {
    constructor() {
        this.featureWeights = {
            strengthDifference: 0.18,
            formMomentum: 0.15,
            consistency: 0.12,
            restDays: 0.10,
            travelImpact: 0.08,
            marketEfficiency: 0.09,
            bettingVolume: 0.07,
            derbyFactor: 0.06,
            importance: 0.08,
            pressureHandling: 0.07
        };
        this.featureHistory = new Map();
    }

    extractAdvancedFeatures(homeTeam, awayTeam, league, context = {}) {
        const features = {
            // Statistische Features
            strengthDifference: this.calculateStrengthGap(homeTeam, awayTeam),
            formMomentum: this.calculateFormMomentum(homeTeam, awayTeam),
            consistency: this.calculateConsistency(homeTeam, awayTeam),
            
            // Zeitbasierte Features
            restDays: this.getRestDaysDifference(homeTeam, awayTeam),
            travelDistance: this.calculateTravelImpact(homeTeam, awayTeam),
            fatigueImpact: this.calculateFatigueImpact(homeTeam, awayTeam),
            
            // Markt-Features
            marketEfficiency: this.getMarketEfficiency(league),
            bettingVolume: this.getMarketVolume(homeTeam, awayTeam),
            oddsMovement: this.getOddsMovement(homeTeam, awayTeam),
            
            // Kontext-Features
            derbyFactor: this.isDerby(homeTeam, awayTeam),
            importanceFactor: this.getMatchImportance(homeTeam, awayTeam, league),
            pressureHandling: this.calculatePressureDifference(homeTeam, awayTeam),
            
            // Spielstil-Features
            styleCompatibility: this.analyzeStyleCompatibility(homeTeam, awayTeam),
            tacticalMatchup: this.analyzeTacticalMatchup(homeTeam, awayTeam),
            
            // Meta-Features
            confidence: this.calculateFeatureConfidence(homeTeam, awayTeam),
            dataQuality: this.getDataQuality(league)
        };

        // Feature Engineering
        features.interactionTerms = this.createInteractionTerms(features);
        features.normalizedFeatures = this.normalizeFeatures(features);
        
        // Feature Store
        this.storeFeatures(homeTeam, awayTeam, features);
        
        return features;
    }

    calculateStrengthGap(homeTeam, awayTeam) {
        const homeStrength = this.getTeamRating(homeTeam);
        const awayStrength = this.getTeamRating(awayTeam);
        const gap = (homeStrength.overall - awayStrength.overall) / Math.max(homeStrength.overall, awayStrength.overall);
        
        // Non-linear transformation for better ML performance
        return Math.tanh(gap * 2);
    }

    calculateFormMomentum(homeTeam, awayTeam) {
        const homeForm = this.getRecentForm(homeTeam, 6);
        const awayForm = this.getRecentForm(awayTeam, 6);
        
        // Exponentiell gewichtete Form mit Momentum
        const homeMomentum = homeForm.reduce((sum, result, i) => {
            const weight = Math.pow(0.82, i); // Stärkeres Decay für jüngere Spiele
            const points = this.matchResultToPoints(result);
            return sum + (points * weight);
        }, 0);
        
        const awayMomentum = awayForm.reduce((sum, result, i) => {
            const weight = Math.pow(0.82, i);
            const points = this.matchResultToPoints(result);
            return sum + (points * weight);
        }, 0);
        
        const totalWeight = homeForm.reduce((sum, _, i) => sum + Math.pow(0.82, i), 0);
        
        return (homeMomentum - awayMomentum) / totalWeight;
    }

    calculateConsistency(homeTeam, awayTeam) {
        const homeConsistency = this.getTeamConsistency(homeTeam);
        const awayConsistency = this.getTeamConsistency(awayTeam);
        
        // Kombinierte Konsistenz mit Gewichtung
        return (homeConsistency * 0.6 + awayConsistency * 0.4);
    }

    getRestDaysDifference(homeTeam, awayTeam) {
        const homeRest = this.getTeamRestDays(homeTeam);
        const awayRest = this.getTeamRestDays(awayTeam);
        
        // Normalisierte Rest-Tage Differenz
        const maxRest = Math.max(homeRest, awayRest, 1);
        return (homeRest - awayRest) / maxRest;
    }

    calculateTravelImpact(homeTeam, awayTeam) {
        const homeLocation = this.getTeamLocation(homeTeam);
        const awayLocation = this.getTeamLocation(awayTeam);
        
        if (!homeLocation || !awayLocation) return 0;
        
        const distance = this.calculateDistance(homeLocation, awayLocation);
        const travelImpact = Math.min(1, distance / 2000); // Normalize to 0-1
        
        // Auswärtsmannschaft bekommt Travel-Impact
        return travelImpact * 0.8; // Reduzierter Impact für moderne Reisebedingungen
    }

    calculateFatigueImpact(homeTeam, awayTeam) {
        const homeFixtures = this.getRecentFixtureDensity(homeTeam);
        const awayFixtures = this.getRecentFixtureDensity(awayTeam);
        
        // Fixture Density in den letzten 30 Tagen
        const homeFatigue = Math.min(1, homeFixtures / 8); // Max 8 Spiele in 30 Tagen
        const awayFatigue = Math.min(1, awayFixtures / 8);
        
        return (awayFatigue - homeFatigue) * 0.6; // Auswärtsfatigue hat stärkeren Impact
    }

    getMarketEfficiency(league) {
        const efficiencies = {
            "Premier League": 0.92,
            "Bundesliga": 0.89,
            "La Liga": 0.88,
            "Serie A": 0.85,
            "Champions League": 0.90,
            "Europa League": 0.87,
            "default": 0.80
        };
        
        return efficiencies[league] || efficiencies.default;
    }

    getMarketVolume(homeTeam, awayTeam) {
        // Simulierte Betting Volume basierend auf Team-Popularität
        const popularTeams = ["Manchester City", "Liverpool", "Bayern Munich", "Real Madrid", "Barcelona"];
        const homePopularity = popularTeams.includes(homeTeam) ? 0.8 : 0.4;
        const awayPopularity = popularTeams.includes(awayTeam) ? 0.8 : 0.4;
        
        return (homePopularity + awayPopularity) / 2;
    }

    getOddsMovement(homeTeam, awayTeam) {
        // Simulierte Odds Bewegung
        return (Math.random() - 0.5) * 0.2;
    }

    isDerby(homeTeam, awayTeam) {
        const derbies = [
            ["Manchester United", "Manchester City"],
            ["Liverpool", "Everton"],
            ["Real Madrid", "Barcelona"],
            ["Bayern Munich", "Borussia Dortmund"],
            ["AC Milan", "Inter Milan"],
            ["Arsenal", "Tottenham"],
            ["Celtic", "Rangers"],
            ["Boca Juniors", "River Plate"]
        ];
        
        return derbies.some(derby => 
            derby.includes(homeTeam) && derby.includes(awayTeam)
        ) ? 1 : 0;
    }

    getMatchImportance(homeTeam, awayTeam, league) {
        let importance = 0.5; // Base importance
        
        // Titelkampf
        const titleContenders = this.getTitleContenders(league);
        if (titleContenders.includes(homeTeam) && titleContenders.includes(awayTeam)) {
            importance += 0.3;
        }
        
        // Relegation Battle
        const relegationTeams = this.getRelegationTeams(league);
        if (relegationTeams.includes(homeTeam) || relegationTeams.includes(awayTeam)) {
            importance += 0.2;
        }
        
        // European Qualification
        const europeanTeams = this.getEuropeanTeams(league);
        if (europeanTeams.includes(homeTeam) && europeanTeams.includes(awayTeam)) {
            importance += 0.15;
        }
        
        return Math.min(1, importance);
    }

    calculatePressureDifference(homeTeam, awayTeam) {
        const homePressure = this.getTeamPressureHandling(homeTeam);
        const awayPressure = this.getTeamPressureHandling(awayTeam);
        
        return (homePressure - awayPressure) * 0.5;
    }

    analyzeStyleCompatibility(homeTeam, awayTeam) {
        const homeStyle = this.getTeamStyle(homeTeam);
        const awayStyle = this.getTeamStyle(awayTeam);
        
        const styleMatchups = {
            "possession": { "pressing": 0.7, "counter": 0.4, "defensive": 0.8 },
            "pressing": { "possession": 0.3, "counter": 0.6, "defensive": 0.5 },
            "counter": { "possession": 0.6, "pressing": 0.4, "defensive": 0.7 },
            "defensive": { "possession": 0.2, "pressing": 0.5, "counter": 0.3 }
        };
        
        return styleMatchups[homeStyle]?.[awayStyle] || 0.5;
    }

    analyzeTacticalMatchup(homeTeam, awayTeam) {
        // Simulierte taktische Analyse
        const homeFormation = this.getPreferredFormation(homeTeam);
        const awayFormation = this.getPreferredFormation(awayTeam);
        
        // Basic formation compatibility
        const formationAdvantages = {
            "4-3-3": { "4-4-2": 0.6, "3-5-2": 0.4, "4-2-3-1": 0.5 },
            "4-4-2": { "4-3-3": 0.4, "3-5-2": 0.7, "4-2-3-1": 0.6 },
            "3-5-2": { "4-3-3": 0.6, "4-4-2": 0.3, "4-2-3-1": 0.5 },
            "4-2-3-1": { "4-3-3": 0.5, "4-4-2": 0.4, "3-5-2": 0.5 }
        };
        
        return formationAdvantages[homeFormation]?.[awayFormation] || 0.5;
    }

    calculateFeatureConfidence(homeTeam, awayTeam) {
        let confidence = 0.7; // Base confidence
        
        // Datenverfügbarkeit
        const homeDataQuality = this.getTeamDataQuality(homeTeam);
        const awayDataQuality = this.getTeamDataQuality(awayTeam);
        confidence += (homeDataQuality + awayDataQuality) * 0.15;
        
        // Feature Completeness
        const completeness = this.getFeatureCompleteness(homeTeam, awayTeam);
        confidence += completeness * 0.15;
        
        return Math.min(0.95, confidence);
    }

    getDataQuality(league) {
        const qualities = {
            "Premier League": 0.95,
            "Bundesliga": 0.92,
            "La Liga": 0.90,
            "Serie A": 0.88,
            "Champions League": 0.94,
            "default": 0.80
        };
        
        return qualities[league] || qualities.default;
    }

    createInteractionTerms(features) {
        // Wichtige Feature-Interaktionen für ML-Modelle
        return {
            strengthForm: features.strengthDifference * features.formMomentum,
            momentumFatigue: features.formMomentum * (1 - features.fatigueImpact),
            pressureImportance: features.pressureHandling * features.importanceFactor,
            styleEfficiency: features.styleCompatibility * features.marketEfficiency
        };
    }

    normalizeFeatures(features) {
        const normalized = {};
        
        Object.keys(features).forEach(key => {
            if (typeof features[key] === 'number') {
                // Min-Max Normalisierung wo sinnvoll
                if (key.includes('Difference') || key.includes('Momentum')) {
                    normalized[key] = (features[key] + 1) / 2; // Von [-1,1] zu [0,1]
                } else if (features[key] >= 0 && features[key] <= 1) {
                    normalized[key] = features[key];
                } else {
                    // Sigmoid für unbegrenzte Werte
                    normalized[key] = 1 / (1 + Math.exp(-features[key]));
                }
            }
        });
        
        return normalized;
    }

    calculateFeatureConsistency(features) {
        const values = Object.values(features.normalizedFeatures || features);
        if (values.length === 0) return 0.5;
        
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        
        // Niedrigere Varianz = höhere Konsistenz
        return Math.max(0.1, 1 - Math.sqrt(variance));
    }

    calculateProbabilityCorrection(mlFeatures) {
        // ML-basierte Wahrscheinlichkeitskorrektur
        const correction = {
            home: 0,
            draw: 0,
            away: 0,
            over25: 0,
            btts: 0
        };
        
        // Feature-basierte Korrekturen
        correction.home += mlFeatures.strengthDifference * 0.15;
        correction.home += mlFeatures.formMomentum * 0.10;
        correction.home += mlFeatures.derbyFactor * 0.05;
        
        correction.away -= mlFeatures.strengthDifference * 0.15;
        correction.away -= mlFeatures.formMomentum * 0.10;
        correction.away += (1 - mlFeatures.derbyFactor) * 0.03;
        
        correction.draw += mlFeatures.styleCompatibility * 0.08;
        correction.draw -= Math.abs(mlFeatures.strengthDifference) * 0.12;
        
        correction.over25 += mlFeatures.importanceFactor * 0.10;
        correction.over25 += (1 - mlFeatures.styleCompatibility) * 0.08;
        
        correction.btts += (1 - Math.abs(mlFeatures.strengthDifference)) * 0.12;
        correction.btts += mlFeatures.marketEfficiency * 0.06;
        
        return correction;
    }

    storeFeatures(homeTeam, awayTeam, features) {
        const key = `${homeTeam}-${awayTeam}-${Date.now()}`;
        this.featureHistory.set(key, {
            timestamp: Date.now(),
            teams: { home: homeTeam, away: awayTeam },
            features: features
        });
        
        // Cleanup old entries
        this.cleanupFeatureHistory();
    }

    cleanupFeatureHistory() {
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        for (const [key, value] of this.featureHistory.entries()) {
            if (value.timestamp < oneWeekAgo) {
                this.featureHistory.delete(key);
            }
        }
    }

    // Hilfsfunktionen mit simulierten Daten
    getTeamRating(teamName) {
        const ratings = {
            "Manchester City": { overall: 0.95, attack: 0.96, defense: 0.92 },
            "Liverpool": { overall: 0.90, attack: 0.92, defense: 0.86 },
            "Bayern Munich": { overall: 0.92, attack: 0.94, defense: 0.88 },
            "Real Madrid": { overall: 0.91, attack: 0.93, defense: 0.87 },
            "default": { overall: 0.70, attack: 0.68, defense: 0.72 }
        };
        return ratings[teamName] || ratings.default;
    }

    getRecentForm(teamName, matches = 6) {
        // Simulierte Form-Daten
        const results = ['win', 'draw', 'loss', 'win', 'draw', 'win'];
        return results.slice(0, matches);
    }

    matchResultToPoints(result) {
        const points = { 'win': 1, 'draw': 0.5, 'loss': 0 };
        return points[result] || 0;
    }

    getTeamConsistency(teamName) {
        const consistencies = {
            "Manchester City": 0.92, "Bayern Munich": 0.90, "Real Madrid": 0.88,
            "Liverpool": 0.85, "default": 0.70
        };
        return consistencies[teamName] || consistencies.default;
    }

    getTeamRestDays(teamName) {
        // Simulierte Rest-Tage (3-10 Tage)
        return 5 + Math.floor(Math.random() * 5);
    }

    getTeamLocation(teamName) {
        const locations = {
            "Manchester City": { lat: 53.483, lng: -2.200 },
            "Bayern Munich": { lat: 48.135, lng: 11.582 },
            "Real Madrid": { lat: 40.453, lng: -3.688 },
            "default": { lat: 51.507, lng: -0.128 } // London
        };
        return locations[teamName] || locations.default;
    }

    calculateDistance(loc1, loc2) {
        // Vereinfachte Entfernungsberechnung
        const latDiff = Math.abs(loc1.lat - loc2.lat);
        const lngDiff = Math.abs(loc1.lng - loc2.lng);
        return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // Grobe km-Schätzung
    }

    getRecentFixtureDensity(teamName) {
        // Simulierte Fixture-Dichte (4-10 Spiele in 30 Tagen)
        return 6 + Math.floor(Math.random() * 4);
    }

    getTeamPressureHandling(teamName) {
        const pressure = {
            "Manchester City": 0.88, "Real Madrid": 0.92, "Bayern Munich": 0.90,
            "Liverpool": 0.85, "default": 0.70
        };
        return pressure[teamName] || pressure.default;
    }

    getTeamStyle(teamName) {
        const styles = {
            "Manchester City": "possession",
            "Liverpool": "pressing", 
            "Real Madrid": "counter",
            "Atletico Madrid": "defensive",
            "default": "balanced"
        };
        return styles[teamName] || styles.default;
    }

    getPreferredFormation(teamName) {
        const formations = {
            "Manchester City": "4-3-3",
            "Liverpool": "4-3-3",
            "Bayern Munich": "4-2-3-1", 
            "default": "4-4-2"
        };
        return formations[teamName] || formations.default;
    }

    getTeamDataQuality(teamName) {
        const qualities = {
            "Manchester City": 0.95, "Liverpool": 0.93, "Bayern Munich": 0.94,
            "default": 0.80
        };
        return qualities[teamName] || qualities.default;
    }

    getFeatureCompleteness(homeTeam, awayTeam) {
        // Simulierte Feature-Completeness
        return 0.85 + (Math.random() * 0.1);
    }

    getTitleContenders(league) {
        const contenders = {
            "Premier League": ["Manchester City", "Liverpool", "Arsenal"],
            "Bundesliga": ["Bayern Munich", "Bayer Leverkusen", "Borussia Dortmund"],
            "default": []
        };
        return contenders[league] || contenders.default;
    }

    getRelegationTeams(league) {
        // Simulierte Abstiegskandidaten
        return ["Sheffield United", "Burnley", "Luton Town"];
    }

    getEuropeanTeams(league) {
        const european = {
            "Premier League": ["Manchester City", "Liverpool", "Arsenal", "Aston Villa"],
            "default": []
        };
        return european[league] || european.default;
    }

    getPerformanceStats() {
        return {
            totalFeaturesExtracted: this.featureHistory.size,
            averageConfidence: 0.82,
            featureWeights: this.featureWeights,
            dataCoverage: this.calculateDataCoverage()
        };
    }

    calculateDataCoverage() {
        const totalTeams = Object.values(EXPANDED_TEAM_DATABASE).reduce((sum, teams) => sum + teams.length, 0);
        const coveredTeams = new Set();
        
        for (const entry of this.featureHistory.values()) {
            coveredTeams.add(entry.teams.home);
            coveredTeams.add(entry.teams.away);
        }
        
        return coveredTeams.size / totalTeams;
    }
  }
