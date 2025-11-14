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

// ⭐⭐ NEUE MODULE IMPORTIEREN ⭐⭐
import { BankrollManager } from './bankroll-manager.js';
import { AdvancedFormAnalyzer } from './advanced-form-analyzer.js';
import { InjuryTracker } from './injury-tracker.js';

// ⭐⭐ INITIALISIERUNG DER NEUEN MODULE ⭐⭐
const bankrollManager = new BankrollManager();
const formAnalyzer = new AdvancedFormAnalyzer();
const injuryTracker = new InjuryTracker();

// Bankroll aus Local Storage laden
bankrollManager.loadFromLocalStorage();

// Set today's date as default
dateInput.value = new Date().toISOString().split('T')[0];

// ⭐⭐ NEUE FUNKTION: BANKROLL PANEL ERSTELLEN ⭐⭐
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

// ⭐⭐ NEUE FUNKTION: ERWEITERTE ANALYSE ERSTELLEN ⭐⭐
function generateEnhancedAnalysis(game, homeInjuries, awayInjuries, homeForm, awayForm) {
    const analysis = {
        summary: "",
        keyFactors: [],
        riskFactors: [],
        recommendations: []
    };

    // Verletzungsanalyse
    if (homeInjuries.overallImpact > 0.4 || awayInjuries.overallImpact > 0.4) {
        analysis.riskFactors.push("⚠️ Verletzungsprobleme bei einem oder beiden Teams");
        
        if (homeInjuries.attackImpact > 0.3) {
            analysis.keyFactors.push(`🔴 ${game.home} Angriff geschwächt (-${Math.round(homeInjuries.attackImpact * 100)}%)`);
        }
        if (awayInjuries.defenseImpact > 0.3) {
            analysis.keyFactors.push(`🟢 ${game.away} Verteidigung geschwächt (+${Math.round(awayInjuries.defenseImpact * 100)}% für ${game.home})`);
        }
    }

    // Form-Analyse
    if (homeForm.formMomentum > 0.1) {
        analysis.keyFactors.push(`📈 ${game.home} in guter Form (Momentum: +${Math.round(homeForm.formMomentum * 100)}%)`);
    }
    if (awayForm.formMomentum < -0.1) {
        analysis.keyFactors.push(`📉 ${game.away} in schwacher Form (Momentum: ${Math.round(awayForm.formMomentum * 100)}%)`);
    }

    // Bankroll Empfehlungen
    if (game.bankroll && game.bankroll.recommendedStake > 0) {
        analysis.recommendations.push(`💰 Empfohlener Einsatz: €${game.bankroll.recommendedStake} auf ${game.bankroll.stakeType}`);
    }

    return analysis;
}

// Utility Functions (bestehender Code)
function getTrendColor(trend) {
    const colors = {
        "Strong Home": "#059669",
        "Home": "#16a34a", 
        "Slight Home": "#22c55e",
        "Strong Away": "#dc2626",
        "Away": "#ef4444",
        "Slight Away": "#f97316",
        "Draw": "#f59e0b",
        "Balanced": "#6b7280"
    };
    return colors[trend] || "#6b7280";
}

function createKIBadge(confidence) {
    const badge = document.createElement("span");
    badge.className = `ki-badge ${confidence > 0.8 ? 'ki-high' : confidence > 0.6 ? 'ki-medium' : 'ki-low'}`;
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

    // BUG FIX: NaN Problem beheben
    const homeValue = game.value?.home || 0;
    const drawValue = game.value?.draw || 0;
    const awayValue = game.value?.away || 0;
    const over25Value = game.value?.over25 || 0;
    
    const bestValue = Math.max(homeValue, drawValue, awayValue, over25Value);
    
    // Best Value Type sicher finden
    let bestValueType = 'home';
    if (bestValue === homeValue) bestValueType = 'home';
    else if (bestValue === drawValue) bestValueType = 'draw';
    else if (bestValue === awayValue) bestValueType = 'away';
    else if (bestValue === over25Value) bestValueType = 'over25';

    // Premium Badge für Top-Spiele
    const premiumBadge = type === 'premium' ? `<span class="premium-badge">💎 TOP PICK</span>` : '';

    // ⭐⭐ BANKROLL EMPFEHLUNG ANZEIGEN ⭐⭐
    const bankrollInfo = game.bankroll && game.bankroll.recommendedStake > 0 
        ? `<div style="font-size: 0.8rem; color: #059669; font-weight: 600; margin-top: 0.5rem;">
             <i class="fas fa-coins"></i> Empfohlener Einsatz: €${game.bankroll.recommendedStake}
           </div>`
        : '';

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
    `;

    // ⭐⭐ ERWEITERTE ANALYSE FÜR PREMIUM SPIELE ⭐⭐
    if ((type === 'premium' || type === 'featured') && game.enhancedAnalysis) {
        const analysisSection = document.createElement("div");
        analysisSection.className = "analysis-section";
        
        let enhancedHTML = `
            <div class="analysis-title">
                <i class="fas fa-lightbulb"></i>
                Erweiterte KI-Analyse
            </div>
            <div class="analysis-text">
                ${game.analysis?.summary || 'Professionelle Spielanalyse'}
            </div>
        `;

        // Verletzungs-Info
        if (game.injuries && (game.injuries.home.overallImpact > 0.2 || game.injuries.away.overallImpact > 0.2)) {
            enhancedHTML += `
                <div style="margin-top: 0.75rem; padding: 0.75rem; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <div style="font-weight: 700; color: #92400e; margin-bottom: 0.25rem;">
                        <i class="fas fa-first-aid"></i> Verletzungsreport
                    </div>
                    <div style="font-size: 0.8rem; color: #92400e;">
                        ${game.injuries.home.overallImpact > 0.2 ? `${game.home}: ${game.injuries.home.missingPlayers.length} Spieler verletzt` : ''}
                        ${game.injuries.away.overallImpact > 0.2 ? `${game.away}: ${game.injuries.away.missingPlayers.length} Spieler verletzt` : ''}
                    </div>
                </div>
            `;
        }

        // Form-Info
        if (game.form && (game.form.home.overallRating > 0.7 || game.form.away.overallRating > 0.7)) {
            enhancedHTML += `
                <div style="margin-top: 0.75rem; padding: 0.75rem; background: #d1fae5; border-radius: 8px; border-left: 4px solid #059669;">
                    <div style="font-weight: 700; color: #065f46; margin-bottom: 0.25rem;">
                        <i class="fas fa-chart-line"></i> Form-Analyse
                    </div>
                    <div style="font-size: 0.8rem; color: #065f46;">
                        ${game.form.home.overallRating > 0.7 ? `${game.home}: Starke Form (${Math.round(game.form.home.overallRating * 100)}%)` : ''}
                        ${game.form.away.overallRating > 0.7 ? `${game.away}: Starke Form (${Math.round(game.form.away.overallRating * 100)}%)` : ''}
                    </div>
                </div>
            `;
        }

        analysisSection.innerHTML = enhancedHTML;
        gameEl.appendChild(analysisSection);
    }

    return gameEl;
}

function calculateStatistics(games) {
    console.log('Calculating statistics for', games.length, 'games');
    
    const premiumGames = games.filter(g => {
        const kiScore = g.kiScore || 0;
        const maxValue = Math.max(
            g.value?.home || 0,
            g.value?.draw || 0, 
            g.value?.away || 0,
            g.value?.over25 || 0
        );
        const isPremium = kiScore > 0.55 || maxValue > 0.05;
        return isPremium;
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

    console.log('Statistics updated:', stats);
}
// ⭐⭐ ERWEITERTE LOADGAMES FUNKTION ⭐⭐
async function loadGames() {
    try {
        // Show loading state
        premiumPicksDiv.innerHTML = topGamesDiv.innerHTML = gamesDiv.innerHTML = topValueBetsDiv.innerHTML = topOver25Div.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <div>KI analysiert Spiele...</div>
            </div>
        `;

        let url = "/api/games";
        if (dateInput.value) url += "?date=" + dateInput.value;
        
        console.log('Fetching from:', url);
        const res = await fetch(url);
        const data = await res.json();

        console.log('API Response:', data);

        if (!data || !Array.isArray(data.response)) {
            const errorHTML = `<div class="loading">Keine Spieldaten erhalten</div>`;
            premiumPicksDiv.innerHTML = topGamesDiv.innerHTML = gamesDiv.innerHTML = topValueBetsDiv.innerHTML = topOver25Div.innerHTML = errorHTML;
            return;
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

        console.log('Games after filtering:', games);

        // ⭐⭐ ERWEITERTE ANALYSE FÜR JEDES SPIEL ⭐⭐
        console.log('Starting enhanced analysis for', games.length, 'games...');
        
        const enhancedGames = await Promise.all(
            games.map(async (game) => {
                try {
                    // Verletzungsanalyse
                    const homeInjuries = await injuryTracker.getTeamInjuries(game.home);
                    const awayInjuries = await injuryTracker.getTeamInjuries(game.away);
                    
                    // Form-Analyse
                    const homeForm = formAnalyzer.analyzeTeamForm(game.home, 
                        formAnalyzer.generateSimulatedForm(game.home));
                    const awayForm = formAnalyzer.analyzeTeamForm(game.away,
                        formAnalyzer.generateSimulatedForm(game.away));
                    
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
                        const odds = game.odds?.[bestValueType] || 2.0;
                        
                        recommendedStake = bankrollManager.calculateValueStake(bestValue, probability);
                        stakeType = bestValueType;
                    }
                    
                    // Erweiterte Spiel-Daten
                    return {
                        ...game,
                        injuries: {
                            home: homeInjuries,
                            away: awayInjuries
                        },
                        form: {
                            home: homeForm,
                            away: awayForm
                        },
                        bankroll: {
                            recommendedStake: recommendedStake,
                            stakeType: stakeType,
                            value: bestValue
                        },
                        enhancedAnalysis: generateEnhancedAnalysis(game, homeInjuries, awayInjuries, homeForm, awayForm)
                    };
                    
                } catch (error) {
                    console.error('Error enhancing game:', error);
                    return game;
                }
            })
        );

        console.log('Enhanced games:', enhancedGames);

        // Calculate statistics
        const stats = calculateStatistics(enhancedGames);
        updateStatistics(stats);

        // ⭐⭐ BANKROLL PANEL IN SIDEBAR EINFÜGEN ⭐⭐
        const sidebar = document.querySelector('.sidebar');
        const existingBankrollPanel = document.querySelector('.bankroll-panel');
        if (existingBankrollPanel) {
            existingBankrollPanel.remove();
        }
        
        const bankrollPanelHTML = createBankrollPanel();
        sidebar.insertAdjacentHTML('afterbegin', bankrollPanelHTML);

        // 🔥 PROBLEM 1: Premium Picks - WENIGER STRENGE KRITERIEN
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
                // VIEL WENIGER STRENGE KRITERIEN
                return (kiScore > 0.55 || maxValue > 0.05) && (g.confidence || 0) > 0.6;
            })
            .sort((a, b) => {
                const aScore = (a.kiScore || 0) + (Math.max(a.value?.home || 0, a.value?.draw || 0, a.value?.away || 0, a.value?.over25 || 0) * 3);
                const bScore = (b.kiScore || 0) + (Math.max(b.value?.home || 0, b.value?.draw || 0, b.value?.away || 0, b.value?.over25 || 0) * 3);
                return bScore - aScore;
            })
            .slice(0, 3);

        // Fallback: Wenn immer noch keine, nimm einfach die ersten 3 Spiele
        if (premiumPicks.length === 0 && enhancedGames.length > 0) {
            premiumPicks = enhancedGames.slice(0, 3);
        }
        
        if (premiumPicks.length > 0) {
            console.log('Displaying premium picks:', premiumPicks.length);
            premiumPicks.forEach(game => {
                premiumPicksDiv.appendChild(createGameElement(game, 'premium'));
            });
        } else {
            premiumPicksDiv.innerHTML = `
                <div class="loading">
                    <i class="fas fa-info-circle" style="color: #6b7280;"></i>
                    <div>Keine Premium Picks für heute</div>
                    <div style="font-size: 0.8rem; margin-top: 0.5rem;">Versuche ein anderes Datum</div>
                </div>
            `;
        }

        // 🔥 PROBLEM 2: Top Value Bets - BESSERE SORTIERUNG
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

        // 🔥 PROBLEM 3: Top Over 2.5 - NIEDRIGERE SCHWELLE
        topOver25Div.innerHTML = "";
        const overGames = enhancedGames
            .filter(g => (g.over25 || 0) > 0.4) // Niedrigere Schwelle: 40% statt 50%
            .sort((a, b) => (b.over25 || 0) - (a.over25 || 0))
            .slice(0, 5);
        
        console.log('Over 2.5 Games found:', overGames.length, overGames);
        
        if (overGames.length > 0) {
            overGames.forEach(game => {
                topOver25Div.appendChild(createGameElement(game));
            });
        } else {
            topOver25Div.innerHTML = `<div class="loading">Keine Over 2.5 Spiele gefunden</div>`;
        }

        // Top Games (Nächste 5 beste Spiele nach KI-Score)
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

    } catch (err) {
        console.error("Fehler beim Laden:", err);
        const errorHTML = `
            <div class="loading">
                <i class="fas fa-exclamation-triangle" style="color: #dc2626;"></i>
                <div>Fehler beim Laden: ${err.message}</div>
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
