// app-enhanced.js — Professionelle Frontend-Implementation mit Multi-Market Trends
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
    }

    calculateAdvancedConfidence(game, probabilities, xgData) {
        const baseConfidence = this.calculateBaseConfidence(probabilities);
        const dataQualityScore = this.calculateDataQuality(game);
        const predictionStability = this.calculatePredictionStability(probabilities, xgData);
        const marketEfficiency = this.calculateMarketEfficiency(game.league);
        
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
        
        totalConfidence *= this.applyTeamFamiliarity(game.home, game.away);
        totalConfidence *= this.applyMatchContext(game);
        
        return Math.max(0.1, Math.min(0.98, totalConfidence));
    }

    calculateBaseConfidence(probabilities) {
        const { home, draw, away } = probabilities;
        const maxProb = Math.max(home, draw, away);
        
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
        
        const sortedProbs = [home, draw, away].sort((a, b) => b - a);
        const probabilityGap = sortedProbs[0] - sortedProbs[1];
        const gapBonus = Math.min(0.2, probabilityGap * 0.8);
        
        return Math.min(0.95, clarityScore + gapBonus);
    }

    calculateDataQuality(game) {
        const leagueFactor = this.leagueFactors[game.league] || this.leagueFactors.default;
        return leagueFactor.dataQuality;
    }

    calculatePredictionStability(probabilities, xgData) {
        const { home, away } = xgData;
        const totalXG = home + away;
        
        let xgStability = 0;
        if (totalXG > 3.5) {
            xgStability = 0.9;
        } else if (totalXG > 2.5) {
            xgStability = 0.8;
        } else if (totalXG > 1.8) {
            xgStability = 0.7;
        } else {
            xgStability = 0.6;
        }
        
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
            contextFactor *= 0.85;
        }
        
        if (game.league.includes("Champions League") || game.league.includes("Europa League")) {
            contextFactor *= 1.08;
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
// ⭐⭐ INITIALISIERUNG DER MODULE ⭐⭐
const confidenceCalculator = new AdvancedConfidenceCalculator();
const bankrollManager = new SimpleBankrollManager();

// Set today's date as default
dateInput.value = new Date().toISOString().split('T')[0];

// ⭐⭐ BANKROLL PANEL ERSTELLEN ⭐⭐
function createBankrollPanel() {
    const metrics = bankrollManager.getPerformanceMetrics();
    const recommendations = bankrollManager.getBankrollRecommendations();
    
    const bankrollHTML = `
        <div class="bankroll-panel">
            <div class="bankroll-header">
                <h3>
                    <i class="fas fa-wallet"></i> 
                    EPISCHES BANKROLL MANAGEMENT
                </h3>
                <span class="bankroll-amount">€${metrics.bankroll.toFixed(2)}</span>
            </div>
            
            <div class="bankroll-stats">
                <div class="bankroll-stat">
                    <div>Win Rate</div>
                    <div style="color: ${metrics.winRate > 50 ? '#059669' : '#dc2626'};">
                        ${metrics.winRate.toFixed(1)}%
                    </div>
                </div>
                <div class="bankroll-stat">
                    <div>ROI</div>
                    <div style="color: ${metrics.roi > 0 ? '#059669' : '#dc2626'};">
                        ${metrics.roi.toFixed(1)}%
                    </div>
                </div>
                <div class="bankroll-stat">
                    <div>Aktuelle Serie</div>
                    <div style="color: ${metrics.currentStreak > 0 ? '#059669' : '#dc2626'};">
                        ${metrics.currentStreak > 0 ? '+' : ''}${metrics.currentStreak}
                    </div>
                </div>
            </div>
            
            ${recommendations.length > 0 ? `
                <div class="bankroll-recommendations">
                    <div>EPISCHE EMPFEHLUNGEN</div>
                    ${recommendations.map(rec => `
                        <div class="recommendation ${rec.type}">
                            <i class="fas fa-${rec.type === 'warning' ? 'exclamation-triangle' : rec.type === 'danger' ? 'exclamation-circle' : 'check-circle'}"></i>
                            <div>
                                <div>${rec.message}</div>
                                <div>${rec.action}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
    
    return bankrollHTML;
}

// ⭐⭐ ERWEITERTE TREND-BADGES FÜR MULTI-MARKET ⭐⭐
function createAdvancedTrendBadge(trendAnalysis) {
    if (!trendAnalysis || !trendAnalysis.allTrends) {
        return createTrendBadgeElement({ 
            market: "balanced", 
            description: "Ausgeglichen",
            probability: 0.5 
        });
    }
    
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "0.5rem";
    container.style.width = "100%";
    
    // Primary Trend (max 1)
    const primaryTrend = trendAnalysis.primaryTrend;
    if (primaryTrend && primaryTrend.market !== "balanced") {
        const primaryBadge = createTrendBadgeElement(primaryTrend, false);
        container.appendChild(primaryBadge);
    }
    
    // Secondary Trends (max 3 statt 2)
    const secondaryTrends = trendAnalysis.allTrends
        .filter(trend => trend !== primaryTrend)
        .slice(0, 3); // Erhöht auf 3 sekundäre Trends
    
    secondaryTrends.forEach(trend => {
        const secondaryBadge = createTrendBadgeElement(trend, true);
        container.appendChild(secondaryBadge);
    });
    
    // Fallback wenn keine Trends
    if (container.children.length === 0) {
        const balancedBadge = createTrendBadgeElement({ 
            market: "balanced", 
            description: "Ausgeglichen",
            probability: 0.5 
        }, false);
        container.appendChild(balancedBadge);
    }
    
    return container;
}

function createTrendBadgeElement(trend, isSecondary = false) {
    const badge = document.createElement("div");
    const trendClass = `trend-${trend.market}`;
    
    badge.className = `trend-indicator ${trendClass} ${isSecondary ? 'secondary' : ''}`;
    badge.style.marginLeft = "0";
    badge.style.marginBottom = isSecondary ? "0.25rem" : "0";
    
    const icons = {
        "home": "fas fa-home",
        "away": "fas fa-route", 
        "draw": "fas fa-minus",
        "over25": "fas fa-arrow-up",
        "under25": "fas fa-arrow-down",
        "btts_yes": "fas fa-exchange-alt",
        "btts_no": "fas fa-times",
        "goal_fest": "fas fa-fire",
        "high_scoring": "fas fa-rocket",
        "defensive_battle": "fas fa-shield-alt",
        "high_quality": "fas fa-star",
        "balanced_game": "fas fa-balance-scale",
        "balanced": "fas fa-equals"
    };
    
    const marketLabels = {
        "home": "HEIM",
        "away": "AUSWÄRTS", 
        "draw": "UNENTSCHIEDEN",
        "over25": "OVER 2.5",
        "under25": "UNDER 2.5",
        "btts_yes": "BTTS JA",
        "btts_no": "BTTS NEIN",
        "goal_fest": "TOR-FEST",
        "high_scoring": "SEHR TORREICH",
        "defensive_battle": "DEFENSIV",
        "high_quality": "HOHE QUALITÄT",
        "balanced_game": "AUSGEGLICHEN",
        "balanced": "AUSGEGLICHEN"
    };
    
    const icon = icons[trend.market] || 'fas fa-chart-line';
    const label = marketLabels[trend.market] || trend.market.toUpperCase();
    const probability = Math.round(trend.probability * 100);
    
    // Strength indicator
    const strengthIcons = {
        "strong": "🔴",
        "medium": "🟡", 
        "weak": "🟢",
        "high": "🔴",
        "very_high": "🔥"
    };
    
    const strengthIcon = strengthIcons[trend.strength] || "";
    
    badge.innerHTML = `
        <i class="${icon}"></i>
        ${label} 
        <span style="margin-left: 0.5rem; font-size: 0.8em; font-weight: 900;">
            ${probability}% ${strengthIcon}
        </span>
    `;
    
    if (isSecondary) {
        badge.style.opacity = "0.7";
        badge.style.fontSize = "0.8rem";
        badge.style.padding = "0.5rem 0.75rem";
    }
    
    return badge;
}
// ⭐⭐ ERWEITERTE TREND-STATISTIK BERECHNUNG ⭐⭐
function calculateAdvancedStatistics(games) {
    const total = games.length;
    const premium = Math.min(3, total);
    const featured = Math.min(5, total);
    
    // Value Bets zählen
    const highValue = games.filter(g => {
        const maxValue = Math.max(
            g.value?.home || 0,
            g.value?.draw || 0,
            g.value?.away || 0,
            g.value?.over25 || 0
        );
        return maxValue > 0.05;
    }).length;

    // Starke Trends zählen (Confidence > 70%)
    const strongTrends = games.filter(g => {
        const trendAnalysis = g.trendAnalysis;
        return trendAnalysis && 
               trendAnalysis.allTrends && 
               trendAnalysis.allTrends.some(trend => trend.confidence > 0.7);
    }).length;

    // Over 2.5 Spiele zählen
    const over25Games = games.filter(g => (g.over25 || 0) > 0.5).length;
    
    // BTTS Spiele zählen
    const bttsGames = games.filter(g => (g.btts || 0) > 0.6).length;
    
    // Durchschnittliche Confidence
    const avgConfidence = games.length > 0 ? 
        games.reduce((sum, game) => sum + (game.confidence || 0.5), 0) / games.length : 0;
    
    // Over 2.5 Rate
    const over25Rate = games.length > 0 ? 
        games.reduce((sum, game) => sum + (game.over25 || 0), 0) / games.length : 0;

    return {
        total: total,
        premium: premium,
        featured: featured,
        highValue: highValue,
        strongTrends: strongTrends,
        over25Games: over25Games,
        bttsGames: bttsGames,
        avgConfidence: avgConfidence,
        over25Rate: over25Rate
    };
}

function updateAdvancedStatistics(stats) {
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

// Utility Functions
function createKIBadge(confidence) {
    const badge = document.createElement("span");
    badge.className = `ki-badge ${confidence > 0.8 ? 'ki-high' : confidence > 0.7 ? 'ki-medium' : confidence > 0.6 ? 'ki-low' : 'ki-very-low'}`;
    badge.innerHTML = `<i class="fas fa-robot"></i> ${Math.round(confidence * 100)}%`;
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

function createHDASection(hdaAnalysis) {
    if (!hdaAnalysis) return '';
    
    const section = document.createElement('div');
    section.className = 'hda-analysis-section';
    
    const bestRecommendation = hdaAnalysis.recommendations && hdaAnalysis.recommendations.length > 0 
        ? hdaAnalysis.recommendations[0] 
        : null;

    section.innerHTML = `
        <div class="analysis-header">
            <i class="fas fa-chart-bar"></i>
            <span>PROFESSIONELLE HDH-ANALYSE</span>
        </div>
        
        <div class="hda-grid">
            <div class="hda-stat">
                <div class="hda-label">Historische Siegquote</div>
                <div class="hda-value">${Math.round((hdaAnalysis.basicStats?.homeWinRate || 0.5) * 100)}%</div>
            </div>
            
            <div class="hda-stat">
                <div class="hda-label">H2H Bilanz</div>
                <div class="hda-value">${hdaAnalysis.h2hAnalysis?.homeWins || 0}-${hdaAnalysis.h2hAnalysis?.draws || 0}-${hdaAnalysis.h2hAnalysis?.awayWins || 0}</div>
            </div>
            
            <div class="hda-stat">
                <div class="hda-label">HDH Confidence</div>
                <div class="hda-value">${Math.round((hdaAnalysis.predictions?.confidence || 0.5) * 100)}%</div>
            </div>
        </div>
        
        ${bestRecommendation ? `
            <div class="hda-recommendations">
                <div class="hda-rec-title">TOP EMPFEHLUNG:</div>
                <div class="hda-recommendation ${bestRecommendation.type}">
                    <span class="rec-market">${bestRecommendation.market}</span>
                    <span class="rec-value">${((bestRecommendation.value || 0) * 100).toFixed(1)}% Value</span>
                </div>
            </div>
        ` : ''}
    `;
    
    return section;
}

// ⭐⭐ VERBESSERTE GAME-ELEMENT ERSTELLUNG ⭐⭐
function createGameElement(game, type = 'standard') {
    console.log(`🎮 Creating game element: ${game.home} vs ${game.away}`);
    
    const gameEl = document.createElement("div");
    gameEl.className = `game-item ${type === 'premium' ? 'premium' : type === 'featured' ? 'featured' : ''}`;
    
    // Datum formatieren
    const dateObj = game.date ? new Date(game.date) : new Date();
    const formattedDate = dateObj.toLocaleDateString('de-DE', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Value berechnen
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

    // Sicherstellen, dass alle Werte vorhanden sind
    const homeProb = game.prob?.home || 0.33;
    const drawProb = game.prob?.draw || 0.33;
    const awayProb = game.prob?.away || 0.34;
    const over25Prob = game.over25 || 0.5;
    const bttsProb = game.btts || 0.5;
    const confidence = game.confidence || 0.5;

    // ERWEITERTE TREND-ANALYSE verwenden
    const trendAnalysis = game.trendAnalysis || {
        primaryTrend: { market: "balanced", description: "Ausgeglichen", probability: 0.5 },
        allTrends: []
    };

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
                <div class="game-date">${formattedDate}</div>
            </div>
        </div>
        
        <div class="metrics-grid">
            ${createProgressBar('Heimsieg', homeProb, 'home').outerHTML}
            ${createProgressBar('Unentschieden', drawProb, 'draw').outerHTML}
            ${createProgressBar('Auswärtssieg', awayProb, 'away').outerHTML}
            ${createProgressBar('Over 2.5', over25Prob, 'over').outerHTML}
            ${createProgressBar('BTTS', bttsProb, 'btts').outerHTML}
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 1.5rem; gap: 1rem;">
            <div style="display: flex; flex-direction: column; gap: 0.5rem; flex: 1;">
                <!-- ERWEITERTE TREND-BADGES -->
                ${createAdvancedTrendBadge(trendAnalysis).outerHTML}
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end;">
                ${createKIBadge(confidence).outerHTML}
                <div style="font-size: 0.95rem; color: #059669; font-weight: 800; text-align: right;">
                    Best Value: ${(bestValue * 100).toFixed(1)}%<br>
                    <span style="font-size: 0.8rem; color: #6b7280;">${bestValueType}</span>
                </div>
            </div>
        </div>
        
        ${game.analysis ? `
            <div class="analysis-section">
                <div class="analysis-title">
                    <i class="fas fa-chart-line"></i> KI-ANALYSE
                </div>
                <div class="analysis-text">
                    ${game.analysis.summary || 'Keine Analyse verfügbar.'}
                </div>
                ${game.analysis.keyFactors && game.analysis.keyFactors.length > 0 ? `
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(100, 116, 139, 0.3);">
                        <div style="font-size: 0.9rem; font-weight: 700; color: white; margin-bottom: 0.5rem;">
                            Key Factors:
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            ${game.analysis.keyFactors.map(factor => 
                                `<span style="background: rgba(37, 99, 235, 0.2); padding: 0.25rem 0.5rem; border-radius: 8px; font-size: 0.8rem; border: 1px solid rgba(37, 99, 235, 0.3);">${factor}</span>`
                            ).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        ` : ''}
    `;

    // HDH-Analyse hinzufügen
    if (game.hdaAnalysis) {
        const hdaSection = createHDASection(game.hdaAnalysis);
        if (hdaSection) {
            gameEl.appendChild(hdaSection);
        }
    }

    return gameEl;
}
// ⭐⭐ VERBESSERTE LOADGAMES FUNKTION ⭐⭐
async function loadGames() {
    try {
        console.log('🔄 Starte erweiterte KI-Analyse mit erweiterter Team-Datenbank...');
        
        // Show loading state
        const loadingHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <div>ERWEITERTE MULTI-MARKET ANALYSE MIT 300+ TEAMS...</div>
                <div style="font-size: 0.9rem; margin-top: 0.5rem; color: #94a3b8;">
                    Analysiere HDH, Over/Under, BTTS & Spezialmärkte
                </div>
            </div>
        `;
        
        premiumPicksDiv.innerHTML = loadingHTML;
        topGamesDiv.innerHTML = loadingHTML;
        gamesDiv.innerHTML = loadingHTML;
        topValueBetsDiv.innerHTML = loadingHTML;
        topOver25Div.innerHTML = loadingHTML;

        let url = "/api/games";
        const params = new URLSearchParams();
        
        if (dateInput.value) {
            params.append('date', dateInput.value);
        }
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        console.log('📡 Fetching from:', url);
        
        // Timeout für langsame Requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('✅ API Response received:', data);

        // WICHTIG: Korrekte Datenstruktur prüfen
        let games = [];
        if (data && data.response && Array.isArray(data.response)) {
            games = data.response;
        } else if (Array.isArray(data)) {
            games = data;
        } else {
            console.error('❌ Unexpected data format:', data);
            throw new Error('Unerwartetes Datenformat von der API');
        }

        console.log(`🎯 ${games.length} Spiele geladen von ${data.info?.leagues?.length || 'unbekannt'} Ligen`);

        // Apply filters
        if (leagueSelect.value) {
            games = games.filter(g => g.league === leagueSelect.value);
            console.log(`🔍 Nach Liga gefiltert: ${games.length} Spiele`);
        }
        if (teamInput.value) {
            const query = teamInput.value.toLowerCase();
            games = games.filter(g => 
                g.home?.toLowerCase().includes(query) || 
                g.away?.toLowerCase().includes(query)
            );
            console.log(`🔍 Nach Team gefiltert: ${games.length} Spiele`);
        }

        // ERWEITERTE STATISTIK berechnen
        const stats = calculateAdvancedStatistics(games);
        updateAdvancedStatistics(stats);

        // Premium Picks (erste 3 Spiele mit höchstem KI-Score)
        premiumPicksDiv.innerHTML = "";
        const premiumPicks = games.slice(0, 3);
        
        if (premiumPicks.length > 0) {
            console.log(`💎 Zeige ${premiumPicks.length} Premium Picks`);
            premiumPicks.forEach(game => {
                premiumPicksDiv.appendChild(createGameElement(game, 'premium'));
            });
        } else {
            premiumPicksDiv.innerHTML = `
                <div class="loading">
                    <i class="fas fa-info-circle"></i>
                    <div>Keine Premium Picks für heute</div>
                    <div style="font-size: 0.8rem; margin-top: 0.5rem;">
                        Versuche ein anderes Datum oder erweitere die Filter
                    </div>
                </div>
            `;
        }

        // Top Value Bets - verbesserte Sortierung
        topValueBetsDiv.innerHTML = "";
        const valueBets = games
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
            topValueBetsDiv.innerHTML = `
                <div class="loading">
                    <i class="fas fa-chart-line"></i>
                    <div>Keine Value Bets gefunden</div>
                </div>
            `;
        }

        // Top Over 2.5 - verbesserte Filterung
        topOver25Div.innerHTML = "";
        const overGames = games
            .filter(g => (g.over25 || 0) > 0.45) // Reduziert von 0.5 auf 0.45 für mehr Spiele
            .sort((a, b) => (b.over25 || 0) - (a.over25 || 0))
            .slice(0, 5);
        
        if (overGames.length > 0) {
            overGames.forEach(game => {
                topOver25Div.appendChild(createGameElement(game));
            });
        } else {
            topOver25Div.innerHTML = `
                <div class="loading">
                    <i class="fas fa-futbol"></i>
                    <div>Keine Over 2.5 Spiele gefunden</div>
                </div>
            `;
        }

        // Top Games (restliche Spiele mit gutem KI-Score)
        topGamesDiv.innerHTML = "";
        const remainingGames = games
            .filter(g => 
                !premiumPicks.includes(g) && 
                !valueBets.includes(g) && 
                !overGames.includes(g)
            )
            .slice(0, 5);
        
        if (remainingGames.length > 0) {
            remainingGames.forEach(game => {
                topGamesDiv.appendChild(createGameElement(game, 'featured'));
            });
        } else {
            topGamesDiv.innerHTML = `
                <div class="loading">
                    <i class="fas fa-star"></i>
                    <div>Keine weiteren Top Spiele</div>
                </div>
            `;
        }

        // Alle Spiele
        gamesDiv.innerHTML = "";
        const allGames = games.filter(g => 
            !premiumPicks.includes(g) && 
            !valueBets.includes(g) && 
            !overGames.includes(g) &&
            !remainingGames.includes(g)
        );
        
        if (allGames.length > 0) {
            allGames.forEach(game => {
                gamesDiv.appendChild(createGameElement(game));
            });
        } else {
            gamesDiv.innerHTML = `
                <div class="loading">
                    <i class="fas fa-list"></i>
                    <div>Keine weiteren Spiele</div>
                </div>
            `;
        }

        // Bankroll Panel einfügen
        const sidebar = document.querySelector('.sidebar');
        const existingBankrollPanel = document.querySelector('.bankroll-panel');
        if (existingBankrollPanel) {
            existingBankrollPanel.remove();
        }
        
        const bankrollPanelHTML = createBankrollPanel();
        sidebar.insertAdjacentHTML('afterbegin', bankrollPanelHTML);

        // System Info aktualisieren
        updateSystemInfo(data.info);

        console.log('✅ Alle Spiele erfolgreich geladen und angezeigt');

    } catch (err) {
        console.error("❌ Fehler beim Laden:", err);
        const errorHTML = `
            <div class="loading">
                <i class="fas fa-exclamation-triangle"></i>
                <div>Fehler beim Laden: ${err.message}</div>
                <div style="font-size: 0.9rem; margin-top: 0.75rem;">
                    Bitte überprüfe die Konsole für Details oder versuche es später erneut
                </div>
                ${err.name === 'AbortError' ? `
                    <div style="font-size: 0.8rem; margin-top: 0.5rem; color: #f59e0b;">
                        ⏰ Timeout: Der Server braucht zu lange zum Antworten
                    </div>
                ` : ''}
            </div>
        `;
        premiumPicksDiv.innerHTML = errorHTML;
        topGamesDiv.innerHTML = errorHTML;
        gamesDiv.innerHTML = errorHTML;
        topValueBetsDiv.innerHTML = errorHTML;
        topOver25Div.innerHTML = errorHTML;
    }
}
// NEUE FUNKTION: System Info aktualisieren
function updateSystemInfo(info) {
    const systemInfoSection = document.querySelector('.system-info');
    if (systemInfoSection && info) {
        const versionElement = systemInfoSection.querySelector('.version-info');
        const leaguesElement = systemInfoSection.querySelector('.leagues-info');
        
        if (versionElement) {
            versionElement.textContent = info.version || '6.2.0';
        }
        
        if (leaguesElement && info.leagues) {
            leaguesElement.textContent = `${info.leagues.length} Ligen verfügbar`;
        }
    }
}

// Event Listeners
loadBtn.addEventListener("click", loadGames);
window.addEventListener("load", loadGames);

// Auto-refresh every 5 minutes
setInterval(loadGames, 5 * 60 * 1000);

console.log('🚀 Erweiterte ProFoot Analytics v6.2.0 - Enhanced Team Database Initialisiert!');
