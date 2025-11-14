// bankroll-manager.js - Professionelles Bankroll Management
export class BankrollManager {
    constructor() {
        this.bankroll = 1000; // Standard Bankroll
        this.riskProfile = 'medium'; // low, medium, high
        this.bettingHistory = [];
        this.performance = {
            totalBets: 0,
            wins: 0,
            losses: 0,
            pushes: 0,
            totalStaked: 0,
            totalReturn: 0,
            roi: 0,
            currentStreak: 0,
            longestWinStreak: 0,
            longestLossStreak: 0
        };
    }

    // Kelly Criterion für professionelles Staking
    calculateKellyStake(probability, odds, bankrollPercentage = 0.02) {
        if (probability <= 0 || odds <= 1) return 0;
        
        const fairProbability = 1 / odds;
        const edge = probability - fairProbability;
        
        if (edge <= 0) return 0;
        
        // Kelly Formula: (bp - q) / b
        const kellyFraction = (odds * probability - 1) / (odds - 1);
        
        // Konservative Anpassung basierend auf Risk Profile
        const riskFactors = {
            low: 0.25,    // Quarter Kelly
            medium: 0.5,  // Half Kelly  
            high: 0.75    // Three Quarter Kelly
        };
        
        const adjustedFraction = kellyFraction * riskFactors[this.riskProfile];
        const stake = this.bankroll * Math.min(adjustedFraction, bankrollPercentage);
        
        return Math.max(1, Math.round(stake)); // Mindestens 1€
    }

    // Value-based Staking
    calculateValueStake(value, probability, baseStake = 25) {
        if (value <= 0) return 0;
        
        const valueMultiplier = 1 + (value * 3); // Value verstärkt den Einsatz
        const probabilityMultiplier = probability * 1.5; // Höhere Wahrscheinlichkeit = höherer Einsatz
        
        let stake = baseStake * valueMultiplier * probabilityMultiplier;
        
        // Bankroll Protection - nie mehr als 5% des Bankrolls
        const maxStake = this.bankroll * 0.05;
        stake = Math.min(stake, maxStake);
        
        return Math.max(5, Math.round(stake)); // Mindestens 5€
    }

    // Platzieren einer Wette
    placeBet(match, betType, stake, odds, probability, value) {
        const bet = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            match: `${match.home} vs ${match.away}`,
            league: match.league,
            betType: betType,
            stake: stake,
            odds: odds,
            probability: probability,
            value: value,
            expectedValue: (probability * odds - 1) * stake,
            status: 'pending', // pending, won, lost, push
            result: null
        };
        
        this.bettingHistory.unshift(bet);
        this.performance.totalBets++;
        this.performance.totalStaked += stake;
        
        this.saveToLocalStorage();
        return bet;
    }

    // Wettergebnis eintragen
    recordBetResult(betId, result, actualOdds = null) {
        const bet = this.bettingHistory.find(b => b.id === betId);
        if (!bet) return;
        
        bet.status = result;
        bet.result = actualOdds;
        
        if (result === 'won') {
            const winnings = bet.stake * (actualOdds || bet.odds);
            this.bankroll += winnings;
            this.performance.totalReturn += winnings;
            this.performance.wins++;
            this.performance.currentStreak = Math.max(0, this.performance.currentStreak) + 1;
        } else if (result === 'lost') {
            this.bankroll -= bet.stake;
            this.performance.losses++;
            this.performance.currentStreak = Math.min(0, this.performance.currentStreak) - 1;
        } else if (result === 'push') {
            this.performance.pushes++;
            this.bankroll += bet.stake; // Einsatz zurück
        }
        
        // Streaks aktualisieren
        if (this.performance.currentStreak > 0) {
            this.performance.longestWinStreak = Math.max(
                this.performance.longestWinStreak, 
                this.performance.currentStreak
            );
        } else {
            this.performance.longestLossStreak = Math.max(
                this.performance.longestLossStreak, 
                Math.abs(this.performance.currentStreak)
            );
        }
        
        // ROI berechnen
        this.performance.roi = ((this.performance.totalReturn - this.performance.totalStaked) / this.performance.totalStaked) * 100;
        
        this.saveToLocalStorage();
    }

    // Performance Analytics
    getPerformanceMetrics() {
        const winRate = this.performance.totalBets > 0 
            ? (this.performance.wins / this.performance.totalBets) * 100 
            : 0;
            
        const averageOdds = this.bettingHistory.length > 0
            ? this.bettingHistory.reduce((sum, bet) => sum + bet.odds, 0) / this.bettingHistory.length
            : 0;
            
        return {
            bankroll: this.bankroll,
            winRate: winRate,
            roi: this.performance.roi,
            totalBets: this.performance.totalBets,
            averageOdds: averageOdds,
            currentStreak: this.performance.currentStreak,
            longestWinStreak: this.performance.longestWinStreak,
            longestLossStreak: this.performance.longestLossStreak,
            expectedValue: this.bettingHistory.reduce((sum, bet) => sum + bet.expectedValue, 0)
        };
    }

    // Bankroll Empfehlungen
    getBankrollRecommendations() {
        const metrics = this.getPerformanceMetrics();
        const recommendations = [];
        
        if (metrics.winRate < 45) {
            recommendations.push({
                type: 'warning',
                message: 'Win Rate unter 45% - Stake-Größen reduzieren',
                action: 'Stake auf 1-2% des Bankrolls begrenzen'
            });
        }
        
        if (metrics.currentStreak < -3) {
            recommendations.push({
                type: 'danger',
                message: `Aktuelle Verlustserie: ${Math.abs(metrics.currentStreak)} Spiele`,
                action: 'Pause einlegen oder Stake deutlich reduzieren'
            });
        }
        
        if (metrics.roi > 10) {
            recommendations.push({
                type: 'success', 
                message: `Positive ROI von ${metrics.roi.toFixed(1)}%`,
                action: 'Aktuelle Strategie beibehalten'
            });
        }
        
        return recommendations;
    }

    // Local Storage
    saveToLocalStorage() {
        const data = {
            bankroll: this.bankroll,
            riskProfile: this.riskProfile,
            bettingHistory: this.bettingHistory,
            performance: this.performance
        };
        localStorage.setItem('profoot_bankroll', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const data = JSON.parse(localStorage.getItem('profoot_bankroll'));
        if (data) {
            this.bankroll = data.bankroll || 1000;
            this.riskProfile = data.riskProfile || 'medium';
            this.bettingHistory = data.bettingHistory || [];
            this.performance = data.performance || this.performance;
        }
    }

    // Bankroll zurücksetzen
    resetBankroll(newAmount = 1000) {
        this.bankroll = newAmount;
        this.bettingHistory = [];
        this.performance = {
            totalBets: 0,
            wins: 0,
            losses: 0,
            pushes: 0,
            totalStaked: 0,
            totalReturn: 0,
            roi: 0,
            currentStreak: 0,
            longestWinStreak: 0,
            longestLossStreak: 0
        };
        this.saveToLocalStorage();
    }
}
