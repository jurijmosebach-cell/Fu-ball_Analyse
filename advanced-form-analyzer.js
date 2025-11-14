// advanced-form-analyzer.js - Erweiterte Team-Form Analyse
export class AdvancedFormAnalyzer {
    constructor() {
        this.formHistory = new Map();
        this.performanceMetrics = {
            homeAdvantage: 1.15,
            awayDisadvantage: 0.85,
            formMomentum: 0.7,
            consistencyWeight: 0.6
        };
    }

    // Erweiterte Form-Analyse
    analyzeTeamForm(teamName, recentMatches = []) {
        const analysis = {
            currentForm: this.calculateCurrentForm(recentMatches),
            formMomentum: this.calculateFormMomentum(recentMatches),
            homePerformance: this.calculateHomePerformance(recentMatches),
            awayPerformance: this.calculateAwayPerformance(recentMatches),
            attackStrength: this.calculateAttackStrength(recentMatches),
            defenseStrength: this.calculateDefenseStrength(recentMatches),
            consistency: this.calculateConsistency(recentMatches),
            motivation: this.calculateMotivationFactor(recentMatches),
            overallRating: 0
        };

        // Gesamt-Rating berechnen
        analysis.overallRating = this.calculateOverallRating(analysis);
        
        return analysis;
    }

    calculateCurrentForm(matches) {
        if (matches.length === 0) return 0.5;
        
        const weightedResults = matches.map((match, index) => {
            const weight = 1 / (index + 1); // Neuere Spiele stärker gewichtet
            let points = 0;
            
            if (match.result === 'win') points = 1;
            else if (match.result === 'draw') points = 0.5;
            else if (match.result === 'loss') points = 0;
            
            // Berücksichtige Heim/Auswärts
            if (match.isHome) points *= this.performanceMetrics.homeAdvantage;
            else points *= this.performanceMetrics.awayDisadvantage;
            
            return points * weight;
        });
        
        const totalWeight = weightedResults.reduce((sum, _, index) => sum + (1 / (index + 1)), 0);
        const formScore = weightedResults.reduce((sum, points) => sum + points, 0) / totalWeight;
        
        return Math.max(0, Math.min(1, formScore));
    }

    calculateFormMomentum(matches) {
        if (matches.length < 3) return 0.5;
        
        const recent = matches.slice(0, 3);
        const older = matches.slice(3, 6);
        
        const recentForm = this.calculateCurrentForm(recent);
        const olderForm = older.length > 0 ? this.calculateCurrentForm(older) : 0.5;
        
        return recentForm - olderForm; // Positive = Verbesserung
    }

    calculateHomePerformance(matches) {
        const homeMatches = matches.filter(m => m.isHome);
        if (homeMatches.length === 0) return 0.5;
        
        return this.calculateCurrentForm(homeMatches);
    }

    calculateAwayPerformance(matches) {
        const awayMatches = matches.filter(m => !m.isHome);
        if (awayMatches.length === 0) return 0.5;
        
        return this.calculateCurrentForm(awayMatches);
    }

    calculateAttackStrength(matches) {
        if (matches.length === 0) return 0.5;
        
        const totalGoals = matches.reduce((sum, match) => sum + (match.goalsFor || 0), 0);
        const avgGoals = totalGoals / matches.length;
        
        // Normalisiere auf 0-1 Skala (angenommen 0-4 Tore pro Spiel)
        return Math.max(0, Math.min(1, avgGoals / 4));
    }

    calculateDefenseStrength(matches) {
        if (matches.length === 0) return 0.5;
        
        const totalConceded = matches.reduce((sum, match) => sum + (match.goalsAgainst || 0), 0);
        const avgConceded = totalConceded / matches.length;
        
        // Umgekehrte Skala: Weniger Tore = bessere Verteidigung
        return Math.max(0, Math.min(1, 1 - (avgConceded / 4)));
    }

    calculateConsistency(matches) {
        if (matches.length < 3) return 0.5;
        
        const results = matches.map(match => {
            if (match.result === 'win') return 1;
            if (match.result === 'draw') return 0.5;
            return 0;
        });
        
        // Standardabweichung der Ergebnisse
        const mean = results.reduce((sum, val) => sum + val, 0) / results.length;
        const variance = results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / results.length;
        const stdDev = Math.sqrt(variance);
        
        // Niedrigere Standardabweichung = höhere Konsistenz
        return Math.max(0, Math.min(1, 1 - stdDev));
    }

    calculateMotivationFactor(matches) {
        if (matches.length === 0) return 0.5;
        
        let motivation = 0.5;
        
        // Gewinnserie erhöht Motivation
        const recentWins = matches.filter(m => m.result === 'win').length;
        if (recentWins >= 3) motivation += 0.2;
        
        // Verlustserie verringert Motivation
        const recentLosses = matches.filter(m => m.result === 'loss').length;
        if (recentLosses >= 3) motivation -= 0.15;
        
        // Wichtige Spiele (gegen Top-Teams)
        const importantMatches = matches.filter(m => m.importance === 'high').length;
        if (importantMatches > 0) motivation += 0.1;
        
        return Math.max(0.1, Math.min(0.9, motivation));
    }

    calculateOverallRating(analysis) {
        const weights = {
            currentForm: 0.25,
            formMomentum: 0.15,
            homePerformance: 0.12,
            awayPerformance: 0.12,
            attackStrength: 0.12,
            defenseStrength: 0.12,
            consistency: 0.08,
            motivation: 0.04
        };
        
        let totalScore = 0;
        let totalWeight = 0;
        
        Object.keys(weights).forEach(key => {
            if (analysis[key] !== undefined) {
                totalScore += analysis[key] * weights[key];
                totalWeight += weights[key];
            }
        });
        
        return totalWeight > 0 ? totalScore / totalWeight : 0.5;
    }

    // Simulierte Match-Daten für Demo
    generateSimulatedForm(teamName, matchCount = 6) {
        const matches = [];
        const results = ['win', 'draw', 'loss'];
        const teams = ['Top Team', 'Mid Table', 'Relegation Candidate'];
        
        for (let i = 0; i < matchCount; i++) {
            const result = results[Math.floor(Math.random() * results.length)];
            const isHome = Math.random() > 0.5;
            const opponent = teams[Math.floor(Math.random() * teams.length)];
            
            matches.push({
                date: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
                opponent: opponent,
                isHome: isHome,
                result: result,
                goalsFor: Math.floor(Math.random() * 4),
                goalsAgainst: Math.floor(Math.random() * 3),
                importance: Math.random() > 0.7 ? 'high' : 'normal'
            });
        }
        
        return matches;
    }
}
