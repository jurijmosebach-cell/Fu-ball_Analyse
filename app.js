// app-enhanced.js — Professionelle Frontend-Implementation
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

// Utility Functions
function createKIBadge(confidence) {
    const badge = document.createElement("span");
    badge.className = `ki-badge ${confidence > 0.8 ? 'ki-high' : confidence > 0.7 ? 'ki-medium' : confidence > 0.6 ? 'ki-low' : 'ki-very-low'}`;
    badge.innerHTML = `<i class="fas fa-robot"></i> ${Math.round(confidence * 100)}%`;
    return badge;
}

function createTrendBadge(trend) {
    if (!trend) trend = 'Balanced';
    
    const badge = document.createElement("span");
    const trendType = trend.toLowerCase().includes('home') ? 'home' : 
                     trend.toLowerCase().includes('away') ? 'away' : 
                     trend.toLowerCase().includes('draw') ? 'draw' : 'balanced';
    
    badge.className = `trend-indicator trend-${trendType}`;
    
    const icons = {
        "Strong Home": "fas fa-arrow-up", 
        "Home": "fas fa-arrow-up",
        "Slight Home": "fas fa-arrow-up-right", 
        "Strong Away": "fas fa-arrow-up",
        "Away": "fas fa-arrow-up", 
        "Slight Away": "fas fa-arrow-up-right",
        "Draw": "fas fa-minus", 
        "Balanced": "fas fa-equals"
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

// KORRIGIERTE createGameElement Funktion
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
    const trend = game.trend || 'Balanced';

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
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem;">
            <div style="display: flex; gap: 0.75rem; align-items: center;">
                ${createTrendBadge(trend).outerHTML}
                ${createKIBadge(confidence).outerHTML}
            </div>
            <div style="font-size: 0.95rem; color: #059669; font-weight: 800;">
                Best Value: ${(bestValue * 100).toFixed(1)}% (${bestValueType})
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

function calculateStatistics(games) {
    const total = games.length;
    const premium = Math.min(3, total);
    const featured = Math.min(5, total);
    const highValue = games.filter(g => {
        const maxValue = Math.max(
            g.value?.home || 0,
            g.value?.draw || 0,
            g.value?.away || 0,
            g.value?.over25 || 0
        );
        return maxValue > 0.05;
    }).length;

    const strongTrends = games.filter(g => 
        g.trend && (g.trend.includes('Strong') || g.trend === 'Home' || g.trend === 'Away')
    ).length;

    const over25Games = games.filter(g => (g.over25 || 0) > 0.4).length;
    
    const avgConfidence = games.length > 0 ? 
        games.reduce((sum, game) => sum + (game.confidence || 0.5), 0) / games.length : 0;
    
    const over25Rate = games.length > 0 ? 
        games.reduce((sum, game) => sum + (game.over25 || 0), 0) / games.length : 0;

    return {
        total: total,
        premium: premium,
        featured: featured,
        highValue: highValue,
        strongTrends: strongTrends,
        over25Games: over25Games,
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

// ⭐⭐ VERBESSERTE LOADGAMES FUNKTION ⭐⭐
async function loadGames() {
    try {
        console.log('🔄 Starte KI-Analyse...');
        
        // Show loading state
        const loadingHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <div>EPISCHE KI-ANALYSE GESTARTET...</div>
            </div>
        `;
        
        premiumPicksDiv.innerHTML = loadingHTML;
        topGamesDiv.innerHTML = loadingHTML;
        gamesDiv.innerHTML = loadingHTML;
        topValueBetsDiv.innerHTML = loadingHTML;
        topOver25Div.innerHTML = loadingHTML;

        let url = "/api/games";
        if (dateInput.value) {
            url += "?date=" + dateInput.value;
        }
        
        console.log('📡 Fetching from:', url);
        const res = await fetch(url);
        
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

        console.log(`🎯 ${games.length} Spiele geladen`);

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

        // Calculate statistics
        const stats = calculateStatistics(games);
        updateStatistics(stats);

        // Premium Picks (erste 3 Spiele)
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
                </div>
            `;
        }

        // Top Value Bets
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
            topValueBetsDiv.innerHTML = `<div class="loading">Keine Value Bets gefunden</div>`;
        }

        // Top Over 2.5
        topOver25Div.innerHTML = "";
        const overGames = games
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

        // Top Games (restliche Spiele)
        topGamesDiv.innerHTML = "";
        const remainingGames = games.filter(g => 
            !premiumPicks.includes(g) && 
            !valueBets.includes(g) && 
            !overGames.includes(g)
        ).slice(0, 5);
        
        if (remainingGames.length > 0) {
            remainingGames.forEach(game => {
                topGamesDiv.appendChild(createGameElement(game, 'featured'));
            });
        } else {
            topGamesDiv.innerHTML = `<div class="loading">Keine weiteren Top Spiele</div>`;
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
            gamesDiv.innerHTML = `<div class="loading">Keine weiteren Spiele</div>`;
        }

        // Bankroll Panel einfügen
        const sidebar = document.querySelector('.sidebar');
        const existingBankrollPanel = document.querySelector('.bankroll-panel');
        if (existingBankrollPanel) {
            existingBankrollPanel.remove();
        }
        
        const bankrollPanelHTML = createBankrollPanel();
        sidebar.insertAdjacentHTML('afterbegin', bankrollPanelHTML);

        console.log('✅ Alle Spiele erfolgreich geladen und angezeigt');

    } catch (err) {
        console.error("❌ Fehler beim Laden:", err);
        const errorHTML = `
            <div class="loading">
                <i class="fas fa-exclamation-triangle"></i>
                <div>Fehler beim Laden: ${err.message}</div>
                <div style="font-size: 0.9rem; margin-top: 0.75rem;">
                    Bitte öffne die Browser-Konsole für Details
                </div>
            </div>
        `;
        premiumPicksDiv.innerHTML = errorHTML;
        topGamesDiv.innerHTML = errorHTML;
        gamesDiv.innerHTML = errorHTML;
        topValueBetsDiv.innerHTML = errorHTML;
        topOver25Div.innerHTML = errorHTML;
    }
}

// Event Listeners
loadBtn.addEventListener("click", loadGames);
window.addEventListener("load", loadGames);

// Auto-refresh every 5 minutes
setInterval(loadGames, 5 * 60 * 1000);

console.log('🚀 Epische ProFoot Analytics - Initialisiert!');
    
