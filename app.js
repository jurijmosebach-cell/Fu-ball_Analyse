// DOM Elements
const premiumPicksDiv = document.getElementById("premiumPicks");
const topGamesDiv = document.getElementById("topGames");
const topValueBetsDiv = document.getElementById("topValueBets");
const topOver25Div = document.getElementById("topOver25");
const gamesDiv = document.getElementById("games");
const loadBtn = document.getElementById("loadBtn");
const dateInput = document.getElementById("date");
const leagueSelect = document.getElementById("league");
const teamInput = document.getElementById("team");

// Statistic Elements
const totalMatchesEl = document.getElementById("totalMatches");
const premiumCountEl = document.getElementById("premiumCount");
const featuredCountEl = document.getElementById("featuredCount");
const allGamesCountEl = document.getElementById("allGamesCount");
const avgConfidenceEl = document.getElementById("avgConfidence");
const highValueBetsEl = document.getElementById("highValueBets");
const strongTrendsEl = document.getElementById("strongTrends");
const over25RateEl = document.getElementById("over25Rate");
const updateTimeEl = document.getElementById("updateTime");

// ⭐⭐ ERWEITERTE KI-KONFIDENZ MODULE ⭐⭐
class AdvancedConfidenceCalculator {
    constructor() {
        this.leagueFactors = {
            "Premier League": { dataQuality: 0.95, predictability: 0.88 },
            "Bundesliga": { dataQuality: 0.92, predictability: 0.91 },
            "La Liga": { dataQuality: 0.90, predictability: 0.86 },
            "Serie A": { dataQuality: 0.88, predictability: 0.84 },
            "Ligue 1": { dataQuality: 0.85, predictability: 0.82 },
            "Champions League": { dataQuality: 0.96, predictability: 0.89 },
            "Europa League": { dataQuality: 0.92, predictability: 0.85 },
            "Championship": { dataQuality: 0.82, predictability: 0.78 },
            "default": { dataQuality: 0.80, predictability: 0.75 }
        };
        
        this.teamKnowledgeBase = {
            "Manchester City": { consistency: 0.94, dataCompleteness: 0.98 },
            "Liverpool": { consistency: 0.91, dataCompleteness: 0.97 },
            "Bayern Munich": { consistency: 0.95, dataCompleteness: 0.98 },
            "Real Madrid": { consistency: 0.92, dataCompleteness: 0.97 },
            "Barcelona": { consistency: 0.89, dataCompleteness: 0.96 },
            "PSG": { consistency: 0.88, dataCompleteness: 0.95 },
            "default": { consistency: 0.75, dataCompleteness: 0.80 }
        };
    }

    // ⭐⭐ PRÄZISE KONFIDENZ-BERECHNUNG ⭐⭐
    calculateAdvancedConfidence(game, probabilities, xgData) {
        const baseConfidence = this.calculateBaseConfidence(game, probabilities);
        const dataQualityScore = this.calculateDataQuality(game);
        const predictionStability = this.calculatePredictionStability(probabilities, xgData);
        const marketEfficiency = this.calculateMarketEfficiency(game.league);
        
        // Gewichtete Gesamtkonfidenz
        const weights = {
            baseConfidence: 0.35,
            dataQuality: 0.25,
            predictionStability: 0.25,
            marketEfficiency: 0.15
        };
        
        let totalConfidence = (
            baseConfidence * weights.baseConfidence +
            dataQualityScore * weights.dataQuality +
            predictionStability * weights.predictionStability +
            marketEfficiency * weights.marketEfficiency
        );
        
        // Zusätzliche Faktoren
        totalConfidence *= this.applyTeamFamiliarity(game.home, game.away);
        totalConfidence *= this.applyMatchContext(game);
        
        return Math.max(0.1, Math.min(0.98, totalConfidence));
    }

    calculateBaseConfidence(game, probabilities) {
        const { home, draw, away } = probabilities;
        const maxProb = Math.max(home, draw, away);
        
        // Höhere Konfidenz bei klaren Favoriten
        let clarityScore = 0;
        if (maxProb > 0.7) {
            clarityScore = 0.9 + (maxProb - 0.7) * 0.5;
        } else if (maxProb > 0.6) {
            clarityScore = 0.8 + (maxProb - 0.6);
        } else if (maxProb > 0.55) {
            clarityScore = 0.7 + (maxProb - 0.55) * 2;
        } else {
            clarityScore = 0.5 + (maxProb - 0.5) * 4;
        }
        
        // Berücksichtige die Differenz zwischen erster und zweiter Wahrscheinlichkeit
        const sortedProbs = [home, draw, away].sort((a, b) => b - a);
        const probabilityGap = sortedProbs[0] - sortedProbs[1];
        const gapBonus = Math.min(0.2, probabilityGap * 0.8);
        
        return Math.min(0.95, clarityScore + gapBonus);
    }

    calculateDataQuality(game) {
        const leagueFactor = this.leagueFactors[game.league] || this.leagueFactors.default;
        const homeTeamData = this.teamKnowledgeBase[game.home] || this.teamKnowledgeBase.default;
        const awayTeamData = this.teamKnowledgeBase[game.away] || this.teamKnowledgeBase.default;
        
        // Durchschnittliche Datenqualität beider Teams
        const teamDataQuality = (homeTeamData.dataCompleteness + awayTeamData.dataCompleteness) / 2;
        const teamConsistency = (homeTeamData.consistency + awayTeamData.consistency) / 2;
        
        return (leagueFactor.dataQuality * 0.6 + teamDataQuality * 0.3 + teamConsistency * 0.1);
    }

    calculatePredictionStability(probabilities, xgData) {
        const { home, away } = xgData;
        const totalXG = home + away;
        
        // Stabilität basierend auf xG-Verteilung
        let xgStability = 0;
        if (totalXG > 3.5) {
            xgStability = 0.9; // Hohe Torerwartung = stabilere Vorhersagen
        } else if (totalXG > 2.5) {
            xgStability = 0.8;
        } else if (totalXG > 1.8) {
            xgStability = 0.7;
        } else {
            xgStability = 0.6; // Niedrige Torerwartung = volatilere Ergebnisse
        }
        
        // Wahrscheinlichkeits-Stabilität
        const probStability = 1 - (Math.abs(probabilities.home - probabilities.away) * 0.5);
        
        return (xgStability * 0.6 + probStability * 0.4);
    }

    calculateMarketEfficiency(league) {
        const efficiencyScores = {
            "Premier League": 0.95,
            "Bundesliga": 0.92,
            "La Liga": 0.90,
            "Serie A": 0.88,
            "Ligue 1": 0.85,
            "Champions League": 0.93,
            "Europa League": 0.87,
            "Championship": 0.78,
            "default": 0.75
        };
        
        return efficiencyScores[league] || efficiencyScores.default;
    }

    applyTeamFamiliarity(homeTeam, awayTeam) {
        const knownTeams = [
            "Manchester City", "Liverpool", "Chelsea", "Arsenal", "Tottenham",
            "Bayern Munich", "Borussia Dortmund", "RB Leipzig", "Bayer Leverkusen",
            "Real Madrid", "Barcelona", "Atletico Madrid", "Sevilla",
            "Juventus", "Inter Milan", "AC Milan", "Napoli", "Roma",
            "PSG", "Marseille", "Monaco", "Lyon"
        ];
        
        const homeFamiliarity = knownTeams.includes(homeTeam) ? 1.05 : 0.95;
        const awayFamiliarity = knownTeams.includes(awayTeam) ? 1.05 : 0.95;
        
        return (homeFamiliarity + awayFamiliarity) / 2;
    }

    applyMatchContext(game) {
        let contextFactor = 1.0;
        
        // Derbys und wichtige Spiele sind schwerer vorherzusagen
        const derbies = [
            ["Manchester United", "Manchester City"],
            ["Liverpool", "Everton"],
            ["Real Madrid", "Barcelona"],
            ["Bayern Munich", "Borussia Dortmund"],
            ["AC Milan", "Inter Milan"],
            ["Arsenal", "Tottenham"]
        ];
        
        const isDerby = derbies.some(derby => 
            (derby.includes(game.home) && derby.includes(game.away))
        );
        
        if (isDerby) {
            contextFactor *= 0.85; // Derbys sind unberechenbarer
        }
        
        // Europapokal-Spiele
        if (game.league.includes("Champions League") || game.league.includes("Europa League")) {
            contextFactor *= 1.08; // Mehr Daten verfügbar
        }
        
        return contextFactor;
    }
}

class SimpleBankrollManager {
    constructor() {
        this.bankroll = 1000;
        this.riskProfile = 'medium';
        this.bettingHistory = [];
        this.performance = {
            totalBets: 0, wins: 0, losses: 0, pushes: 0,
            totalStaked: 0, totalReturn: 0, roi: 0,
            currentStreak: 0, longestWinStreak: 0, longestLossStreak: 0
        };
        this.loadFromLocalStorage();
    }

    calculateValueStake(value, probability, baseStake = 25) {
        if (value <= 0) return 0;
        const stake = baseStake * (1 + (value * 3)) * (probability * 1.5);
        const maxStake = this.bankroll * 0.05;
        return Math.max(5, Math.min(Math.round(stake), maxStake));
    }

    getPerformanceMetrics() {
        const winRate = this.performance.totalBets > 0 
            ? (this.performance.wins / this.performance.totalBets) * 100 
            : 0;
        return {
            bankroll: this.bankroll,
            winRate: winRate,
            roi: this.performance.roi,
            totalBets: this.performance.totalBets,
            currentStreak: this.performance.currentStreak
        };
    }

    getBankrollRecommendations() {
        const metrics = this.getPerformanceMetrics();
        const recommendations = [];
        
        if (metrics.winRate < 45) {
            recommendations.push({
                type: 'warning',
                message: 'Win Rate unter 45%',
                action: 'Stake-Größen reduzieren'
            });
        }
        
        if (metrics.currentStreak < -3) {
            recommendations.push({
                type: 'danger',
                message: `Verlustserie: ${Math.abs(metrics.currentStreak)} Spiele`,
                action: 'Pause einlegen'
            });
        }
        
        return recommendations;
    }

    loadFromLocalStorage() {
        try {
            const data = JSON.parse(localStorage.getItem('profoot_bankroll'));
            if (data) {
                this.bankroll = data.bankroll || 1000;
                this.performance = data.performance || this.performance;
            }
        } catch (e) {
            console.log('Could not load bankroll data');
        }
    }
}

class SimpleFormAnalyzer {
    analyzeTeamForm(teamName) {
        return {
            currentForm: 0.5 + (Math.random() * 0.4),
            formMomentum: (Math.random() - 0.5) * 0.3,
            overallRating: 0.5 + (Math.random() * 0.4)
        };
    }
}

class SimpleInjuryTracker {
    async getTeamInjuries(teamName) {
        const injuryCount = Math.floor(Math.random() * 2);
        const injuries = [];
        
        for (let i = 0; i < injuryCount; i++) {
            injuries.push({
                name: `Spieler ${i+1}`,
                position: ['goalkeeper', 'defender', 'midfielder', 'forward'][Math.floor(Math.random() * 4)],
                severity: ['minor', 'moderate', 'major'][Math.floor(Math.random() * 3)]
            });
        }
        
        return {
            team: teamName,
            missingPlayers: injuries,
            overallImpact: injuries.length * 0.2,
            attackImpact: injuries.filter(i => i.position === 'forward' || i.position === 'midfielder').length * 0.25,
            defenseImpact: injuries.filter(i => i.position === 'goalkeeper' || i.position === 'defender').length * 0.25
        };
    }
}

// ⭐⭐ INITIALISIERUNG DER MODULE ⭐⭐
const confidenceCalculator = new AdvancedConfidenceCalculator();
const bankrollManager = new SimpleBankrollManager();
const formAnalyzer = new SimpleFormAnalyzer();
const injuryTracker = new SimpleInjuryTracker();

// Set today's date as default
dateInput.value = new Date().toISOString().split('T')[0];

// ⭐⭐ BANKROLL PANEL ERSTELLEN ⭐⭐
function createBankrollPanel() {
    const metrics = bankrollManager.getPerformanceMetrics();
    const recommendations = bankrollManager.getBankrollRecommendations();
    
    const bankrollHTML = `
        <div class="bankroll-panel" style="
            background: linear-gradient(135deg, #f8fafc, #e2e8f0);
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            border: 2px solid #e2e8f0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        ">
            <div class="bankroll-header" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
                padding-bottom: 1rem;
                border-bottom: 2px solid #cbd5e1;
            ">
                <h3 style="margin: 0; font-size: 1.2rem; font-weight: 700; color: #1e293b;">
                    <i class="fas fa-wallet" style="color: #059669;"></i> 
                    Bankroll Management
                </h3>
                <span class="bankroll-amount" style="
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #059669;
                    background: white;
                    padding: 0.5rem 1rem;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                ">€${metrics.bankroll.toFixed(2)}</span>
            </div>
            
            <div class="bankroll-stats" style="
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1rem;
                margin-bottom: 1rem;
            ">
                <div class="bankroll-stat" style="
                    background: white;
                    padding: 1rem;
                    border-radius: 12px;
                    text-align: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                ">
                    <div style="font-size: 0.8rem; color: #64748b; font-weight: 600; margin-bottom: 0.5rem;">Win Rate</div>
                    <div style="font-size: 1.25rem; font-weight: 800; color: ${metrics.winRate > 50 ? '#059669' : '#dc2626'};">
                        ${metrics.winRate.toFixed(1)}%
                    </div>
                </div>
                <div class="bankroll-stat" style="
                    background: white;
                    padding: 1rem;
                    border-radius: 12px;
                    text-align: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                ">
                    <div style="font-size: 0.8rem; color: #64748b; font-weight: 600; margin-bottom: 0.5rem;">ROI</div>
                    <div style="font-size: 1.25rem; font-weight: 800; color: ${metrics.roi > 0 ? '#059669' : '#dc2626'};">
                        ${metrics.roi.toFixed(1)}%
                    </div>
                </div>
                <div class="bankroll-stat" style="
                    background: white;
                    padding: 1rem;
                    border-radius: 12px;
                    text-align: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                ">
                    <div style="font-size: 0.8rem; color: #64748b; font-weight: 600; margin-bottom: 0.5rem;">Aktuelle Serie</div>
                    <div style="font-size: 1.25rem; font-weight: 800; color: ${metrics.currentStreak > 0 ? '#059669' : '#dc2626'};">
                        ${metrics.currentStreak > 0 ? '+' : ''}${metrics.currentStreak}
                    </div>
                </div>
            </div>
            
            ${recommendations.length > 0 ? `
                <div class="bankroll-recommendations">
                    <div style="font-size: 0.9rem; font-weight: 700; color: #374151; margin-bottom: 0.75rem;">
                        <i class="fas fa-lightbulb"></i> Empfehlungen
                    </div>
                    ${recommendations.map(rec => `
                        <div class="recommendation" style="
                            background: ${rec.type === 'warning' ? '#fef3c7' : rec.type === 'danger' ? '#fee2e2' : '#d1fae5'};
                            border: 1px solid ${rec.type === 'warning' ? '#fbbf24' : rec.type === 'danger' ? '#f87171' : '#34d399'};
                            border-left: 4px solid ${rec.type === 'warning' ? '#f59e0b' : rec.type === 'danger' ? '#dc2626' : '#059669'};
                            padding: 1rem;
                            border-radius: 8px;
                            margin-bottom: 0.75rem;
                            display: flex;
                            align-items: flex-start;
                            gap: 0.75rem;
                        ">
                            <i class="fas fa-${rec.type === 'warning' ? 'exclamation-triangle' : rec.type === 'danger' ? 'exclamation-circle' : 'check-circle'}" 
                               style="color: ${rec.type === 'warning' ? '#d97706' : rec.type === 'danger' ? '#dc2626' : '#059669'}; margin-top: 0.1rem;"></i>
                            <div style="flex: 1;">
                                <div style="font-weight: 700; color: ${rec.type === 'warning' ? '#92400e' : rec.type === 'danger' ? '#991b1b' : '#065f46'}; margin-bottom: 0.25rem;">
                                    ${rec.message}
                                </div>
                                <div style="font-size: 0.85rem; color: #6b7280;">
                                    ${rec.action}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
    
    return bankrollHTML;
}

// Utility Functions
function getTrendColor(trend) {
    const colors = {
        "Strong Home": "#059669", "Home": "#16a34a", "Slight Home": "#22c55e",
        "Strong Away": "#dc2626", "Away": "#ef4444", "Slight Away": "#f97316",
        "Draw": "#f59e0b", "Balanced": "#6b7280"
    };
    return colors[trend] || "#6b7280";
}

function createKIBadge(confidence) {
    const badge = document.createElement("span");
    badge.className = `ki-badge ${confidence > 0.8 ? 'ki-high' : confidence > 0.7 ? 'ki-medium' : confidence > 0.6 ? 'ki-low' : 'ki-very-low'}`;
    badge.innerHTML = `<i class="fas fa-robot"></i> ${Math.round(confidence * 100)}%`;
    return badge;
}

function createTrendBadge(trend) {
    const badge = document.createElement("span");
    badge.className = `trend-indicator trend-${trend.toLowerCase().includes('home') ? 'home' : trend.toLowerCase().includes('away') ? 'away' : trend.toLowerCase().includes('draw') ? 'draw' : 'balanced'}`;
    
    const icons = {
        "Strong Home": "fas fa-arrow-up", "Home": "fas fa-arrow-up",
        "Slight Home": "fas fa-arrow-up-right", "Strong Away": "fas fa-arrow-up",
        "Away": "fas fa-arrow-up", "Slight Away": "fas fa-arrow-up-right",
        "Draw": "fas fa-minus", "Balanced": "fas fa-equals"
    };
    
    badge.innerHTML = `<i class="${icons[trend] || 'fas fa-chart-line'}"></i> ${trend}`;
    return badge;
}

function createProgressBar(label, value, type) {
    const safeValue = value || 0;
    const percentage = Math.round(safeValue * 100);
    const container = document.createElement("div");
    container.className = "metric";
    
    container.innerHTML = `
        <div class="metric-label">
            <span>${label}</span>
            <span class="metric-value">${percentage}%</span>
        </div>
        <div class="progress-bar">
            <div class="progress-fill progress-${type}" style="width: ${percentage}%"></div>
        </div>
    `;
    
    return container;
}

function createGameElement(game, type = 'standard') {
    const gameEl = document.createElement("div");
    gameEl.className = `game-item ${type === 'premium' ? 'premium' : type === 'featured' ? 'featured' : ''}`;
    
    const dateObj = game.date ? new Date(game.date) : new Date();
    const formattedDate = dateObj.toLocaleDateString('de-DE', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });

    const homeValue = game.value?.home || 0;
    const drawValue = game.value?.draw || 0;
    const awayValue = game.value?.away || 0;
    const over25Value = game.value?.over25 || 0;
    
    const bestValue = Math.max(homeValue, drawValue, awayValue, over25Value);
    
    let bestValueType = 'home';
    if (bestValue === homeValue) bestValueType = 'home';
    else if (bestValue === drawValue) bestValueType = 'draw';
    else if (bestValue === awayValue) bestValueType = 'away';
    else if (bestValue === over25Value) bestValueType = 'over25';

    const premiumBadge = type === 'premium' ? `<span class="premium-badge">💎 TOP PICK</span>` : '';

    // Bankroll Empfehlung
    const bankrollInfo = game.bankroll && game.bankroll.recommendedStake > 0 
        ? `<div style="font-size: 0.8rem; color: #059669; font-weight: 600; margin-top: 0.5rem;">
             <i class="fas fa-coins"></i> Empfohlener Einsatz: €${game.bankroll.recommendedStake}
           </div>`
        : '';

    // ⭐⭐ KONFIDENZ-DETAILS ANZEIGEN ⭐⭐
    const confidenceDetails = type === 'premium' ? `
        <div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.5rem; padding: 0.5rem; background: #f8fafc; border-radius: 6px;">
            <div style="display: flex; justify-content: space-between;">
                <span>Datenqualität:</span>
                <span style="font-weight: 600;">${Math.round((game.confidenceFactors?.dataQuality || 0.7) * 100)}%</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Vorhersagestabilität:</span>
                <span style="font-weight: 600;">${Math.round((game.confidenceFactors?.predictionStability || 0.7) * 100)}%</span>
            </div>
        </div>
    ` : '';

    gameEl.innerHTML = `
        <div class="game-header">
            <div class="teams">
                <div class="team">
                    <img src="${game.homeLogo || 'https://flagsapi.com/EU/flat/64.png'}" alt="${game.home}" class="team-logo">
                    <span>${game.home}</span>
                </div>
                <div class="vs">vs</div>
                <div class="team">
                    <img src="${game.awayLogo || 'https://flagsapi.com/EU/flat/64.png'}" alt="${game.away}" class="team-logo">
                    <span>${game.away}</span>
                </div>
            </div>
            <div class="game-meta">
                <div class="league">${game.league || 'Unknown League'} ${premiumBadge}</div>
                <div>${formattedDate}</div>
            </div>
        </div>
        
        <div class="metrics-grid">
            ${createProgressBar('Heimsieg', game.prob?.home, 'home').outerHTML}
            ${createProgressBar('Unentschieden', game.prob?.draw, 'draw').outerHTML}
            ${createProgressBar('Auswärtssieg', game.prob?.away, 'away').outerHTML}
            ${createProgressBar('Over 2.5', game.over25, 'over').outerHTML}
            ${createProgressBar('BTTS', game.btts, 'btts').outerHTML}
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                ${createTrendBadge(game.trend || 'Balanced').outerHTML}
                ${createKIBadge(game.confidence || 0.5).outerHTML}
            </div>
            <div style="font-size: 0.875rem; color: #059669; font-weight: 600;">
                Best Value: ${(bestValue * 100).toFixed(1)}% (${bestValueType})
            </div>
        </div>
        ${bankrollInfo}
        ${confidenceDetails}
    `;

    return gameEl;
}

function calculateStatistics(games) {
    const premiumGames = games.filter(g => {
        const kiScore = g.kiScore || 0;
        const maxValue = Math.max(
            g.value?.home || 0,
            g.value?.draw || 0, 
            g.value?.away || 0,
            g.value?.over25 || 0
        );
        return kiScore > 0.55 || maxValue > 0.05;
    });
    
    const featuredGames = games.filter(g => (g.kiScore || 0) > 0.6);
    const highValueGames = games.filter(g => {
        const maxValue = Math.max(
            g.value?.home || 0,
            g.value?.draw || 0,
            g.value?.away || 0,
            g.value?.over25 || 0
        );
        return maxValue > 0.05;
    });
    
    const strongTrendGames = games.filter(g => 
        g.trend && (g.trend.includes('Strong') || g.trend === 'Home' || g.trend === 'Away')
    );

    const over25Games = games.filter(g => (g.over25 || 0) > 0.4);
    
    const avgConfidence = games.length > 0 ? games.reduce((sum, game) => sum + (game.confidence || 0.5), 0) / games.length : 0;
    const over25Rate = games.length > 0 ? games.reduce((sum, game) => sum + (game.over25 || 0), 0) / games.length : 0;

    return {
        total: games.length,
        premium: premiumGames.length,
        featured: featuredGames.length,
        highValue: highValueGames.length,
        strongTrends: strongTrendGames.length,
        over25Games: over25Games.length,
        avgConfidence: avgConfidence,
        over25Rate: over25Rate
    };
}

function updateStatistics(stats) {
    totalMatchesEl.textContent = stats.total;
    premiumCountEl.textContent = `${stats.premium} Premium`;
    featuredCountEl.textContent = `${stats.featured} Spiele`;
    allGamesCountEl.textContent = `${stats.total} Spiele`;

    avgConfidenceEl.textContent = `${Math.round(stats.avgConfidence * 100)}%`;
    highValueBetsEl.textContent = stats.highValue;
    strongTrendsEl.textContent = stats.strongTrends;
    over25RateEl.textContent = `${Math.round(stats.over25Rate * 100)}%`;
    updateTimeEl.textContent = new Date().toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// ⭐⭐ ERWEITERTE LOADGAMES FUNKTION MIT PRÄZISER KONFIDENZ ⭐⭐
async function loadGames() {
    try {
        console.log('Loading games with advanced confidence calculation...');
        
        // Show loading state
        premiumPicksDiv.innerHTML = topGamesDiv.innerHTML = gamesDiv.innerHTML = topValueBetsDiv.innerHTML = topOver25Div.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <div>KI analysiert Spiele mit erweiterter Konfidenz-Berechnung...</div>
            </div>
        `;

        let url = "/api/games";
        if (dateInput.value) url += "?date=" + dateInput.value;
        
        console.log('Fetching from:', url);
        const res = await fetch(url);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('API Response received');

        if (!data || !Array.isArray(data.response)) {
            throw new Error('Invalid API response format');
        }

        let games = data.response.slice();

        // Apply filters
        if (leagueSelect.value) {
            games = games.filter(g => g.league === leagueSelect.value);
        }
        if (teamInput.value) {
            const query = teamInput.value.toLowerCase();
            games = games.filter(g => 
                g.home?.toLowerCase().includes(query) || 
                g.away?.toLowerCase().includes(query)
            );
        }

        console.log('Games after filtering:', games.length);

        // ⭐⭐ ERWEITERTE KONFIDENZ-BERECHNUNG FÜR JEDES SPIEL ⭐⭐
        const enhancedGames = games.map(game => {
            try {
                // Berechne präzise Konfidenz
                const advancedConfidence = confidenceCalculator.calculateAdvancedConfidence(
                    game, 
                    game.prob || { home: 0.33, draw: 0.33, away: 0.33 },
                    { home: game.homeXG || 1.5, away: game.awayXG || 1.5 }
                );
                
                // Bankroll Empfehlungen
                const bestValue = Math.max(
                    game.value?.home || 0,
                    game.value?.draw || 0, 
                    game.value?.away || 0,
                    game.value?.over25 || 0
                );
                
                let recommendedStake = 0;
                let stakeType = 'none';
                
                if (bestValue > 0.1) {
                    const bestValueType = Object.entries(game.value || {})
                        .reduce((a, b) => (a[1] || 0) > (b[1] || 0) ? a : b)[0];
                        
                    const probability = game.prob?.[bestValueType] || game.over25 || 0.5;
                    
                    recommendedStake = bankrollManager.calculateValueStake(bestValue, probability);
                    stakeType = bestValueType;
                }
                
                return {
                    ...game,
                    confidence: advancedConfidence,
                    bankroll: {
                        recommendedStake: recommendedStake,
                        stakeType: stakeType,
                        value: bestValue
                    },
                    // KI-Score mit neuer Konfidenz aktualisieren
                    kiScore: 0.5 + (advancedConfidence * 0.3) + (bestValue * 0.2)
                };
                
            } catch (error) {
                console.error('Error enhancing game confidence:', error);
                return game;
            }
        });

        console.log('Games enhanced with advanced confidence');

        // ⭐⭐ BANKROLL PANEL EINFÜGEN ⭐⭐
        const sidebar = document.querySelector('.sidebar');
        const existingBankrollPanel = document.querySelector('.bankroll-panel');
        if (existingBankrollPanel) {
            existingBankrollPanel.remove();
        }
        
        const bankrollPanelHTML = createBankrollPanel();
        sidebar.insertAdjacentHTML('afterbegin', bankrollPanelHTML);

        // Calculate statistics
        const stats = calculateStatistics(enhancedGames);
        updateStatistics(stats);

        // Premium Picks mit verbesserter Konfidenz
        premiumPicksDiv.innerHTML = "";
        let premiumPicks = enhancedGames
            .filter(g => {
                const kiScore = g.kiScore || 0;
                const maxValue = Math.max(
                    g.value?.home || 0,
                    g.value?.draw || 0, 
                    g.value?.away || 0,
                    g.value?.over25 || 0
                );
                return (kiScore > 0.55 || maxValue > 0.05) && (g.confidence || 0) > 0.6;
            })
            .sort((a, b) => {
                const aScore = (a.kiScore || 0) + (Math.max(a.value?.home || 0, a.value?.draw || 0, a.value?.away || 0, a.value?.over25 || 0) * 3);
                const bScore = (b.kiScore || 0) + (Math.max(b.value?.home || 0, b.value?.draw || 0, b.value?.away || 0, b.value?.over25 || 0) * 3);
                return bScore - aScore;
            })
            .slice(0, 3);

        if (premiumPicks.length === 0 && enhancedGames.length > 0) {
            premiumPicks = enhancedGames.slice(0, 3);
        }
        
        if (premiumPicks.length > 0) {
            console.log('Displaying premium picks with advanced confidence:', premiumPicks.length);
            premiumPicks.forEach(game => {
                premiumPicksDiv.appendChild(createGameElement(game, 'premium'));
            });
        } else {
            premiumPicksDiv.innerHTML = `
                <div class="loading">
                    <i class="fas fa-info-circle" style="color: #6b7280;"></i>
                    <div>Keine Premium Picks für heute</div>
                </div>
            `;
         } 
           // Top Value Bets
        topValueBetsDiv.innerHTML = "";
        const valueBets = enhancedGames
            .sort((a, b) => {
                const aValue = Math.max(
                    a.value?.home || 0,
                    a.value?.draw || 0,
                    a.value?.away || 0,
                    a.value?.over25 || 0
                );
                const bValue = Math.max(
                    b.value?.home || 0,
                    b.value?.draw || 0,
                    b.value?.away || 0,
                    b.value?.over25 || 0
                );
                return bValue - aValue;
            })
            .slice(0, 5);
        
        if (valueBets.length > 0) {
            valueBets.forEach(game => {
                topValueBetsDiv.appendChild(createGameElement(game, 'featured'));
            });
        } else {
            topValueBetsDiv.innerHTML = `<div class="loading">Keine Value Bets gefunden</div>`;
        }

        // Top Over 2.5
        topOver25Div.innerHTML = "";
        const overGames = enhancedGames
            .filter(g => (g.over25 || 0) > 0.4)
            .sort((a, b) => (b.over25 || 0) - (a.over25 || 0))
            .slice(0, 5);
        
        if (overGames.length > 0) {
            overGames.forEach(game => {
                topOver25Div.appendChild(createGameElement(game));
            });
        } else {
            topOver25Div.innerHTML = `<div class="loading">Keine Over 2.5 Spiele gefunden</div>`;
        }

        // Top Games
        topGamesDiv.innerHTML = "";
        const topGames = enhancedGames
            .filter(g => !premiumPicks.includes(g) && !valueBets.includes(g) && !overGames.includes(g))
            .sort((a, b) => (b.kiScore || 0) - (a.kiScore || 0))
            .slice(0, 5);
        
        if (topGames.length > 0) {
            topGames.forEach(game => {
                topGamesDiv.appendChild(createGameElement(game, 'featured'));
            });
        } else {
            topGamesDiv.innerHTML = `<div class="loading">Keine Top Spiele gefunden</div>`;
        }

        // Alle anderen Spiele
        gamesDiv.innerHTML = "";
        const otherGames = enhancedGames.filter(g => 
            !premiumPicks.includes(g) && 
            !topGames.includes(g) && 
            !valueBets.includes(g) && 
            !overGames.includes(g)
        );
        
        if (otherGames.length === 0) {
            gamesDiv.innerHTML = `<div class="loading">Keine weiteren Spiele</div>`;
        } else {
            otherGames.forEach(game => {
                gamesDiv.appendChild(createGameElement(game));
            });
        }

        console.log('All games loaded with advanced confidence calculation');

    } catch (err) {
        console.error("Fehler beim Laden:", err);
        const errorHTML = `
            <div class="loading">
                <i class="fas fa-exclamation-triangle" style="color: #dc2626;"></i>
                <div>Fehler beim Laden: ${err.message}</div>
                <div style="font-size: 0.8rem; margin-top: 0.5rem;">Bitte versuche es später erneut</div>
            </div>
        `;
        premiumPicksDiv.innerHTML = topGamesDiv.innerHTML = gamesDiv.innerHTML = topValueBetsDiv.innerHTML = topOver25Div.innerHTML = errorHTML;
    }
}

// Event Listeners
loadBtn.addEventListener("click", loadGames);
window.addEventListener("load", loadGames);

// Auto-refresh every 5 minutes
setInterval(loadGames, 5 * 60 * 1000);

console.log('App with advanced confidence calculation initialized');
        
