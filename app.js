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

// Set today's date as default
dateInput.value = new Date().toISOString().split('T')[0];

// Utility Functions
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
    `;

    // Analysis section für Premium und Featured Games
    if ((type === 'premium' || type === 'featured') && game.analysis) {
        const analysisSection = document.createElement("div");
        analysisSection.className = "analysis-section";
        analysisSection.innerHTML = `
            <div class="analysis-title">
                <i class="fas fa-lightbulb"></i>
                KI-Analyse
            </div>
            <div class="analysis-text">
                ${game.analysis.summary || 'Keine Analyse verfügbar'}
            </div>
            <div style="margin-top: 0.5rem; font-size: 0.875rem; font-weight: 600; color: #2563eb;">
                <i class="fas fa-check-circle"></i> ${game.analysis.recommendation || 'Keine Empfehlung'}
            </div>
        `;
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
        const isPremium = kiScore > 0.75 && maxValue > 0.1;
        console.log(`Premium Check: ${g.home} vs ${g.away} - kiScore: ${kiScore}, maxValue: ${maxValue}, isPremium: ${isPremium}`);
        return isPremium;
    });
    
    const featuredGames = games.filter(g => (g.kiScore || 0) > 0.7);
    const highValueGames = games.filter(g => {
        const maxValue = Math.max(
            g.value?.home || 0,
            g.value?.draw || 0,
            g.value?.away || 0,
            g.value?.over25 || 0
        );
        return maxValue > 0.1;
    });
    
    const strongTrendGames = games.filter(g => 
        g.trend && (g.trend.includes('Strong') || g.trend === 'Home' || g.trend === 'Away')
    );

    const over25Games = games.filter(g => (g.over25 || 0) > 0.6);
    
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

        // Calculate statistics
        const stats = calculateStatistics(games);
        updateStatistics(stats);

        // 🔥 PROBLEM 1: Premium Picks - WENIGER STRENGE KRITERIEN
        premiumPicksDiv.innerHTML = "";
        let premiumPicks = games
            .filter(g => {
                const kiScore = g.kiScore || 0;
                const maxValue = Math.max(
                    g.value?.home || 0,
                    g.value?.draw || 0, 
                    g.value?.away || 0,
                    g.value?.over25 || 0
                );
                // Weniger strenge Kriterien für Premium
                return (kiScore > 0.65 || maxValue > 0.08);
            })
            .sort((a, b) => {
                const aScore = (a.kiScore || 0) + (Math.max(a.value?.home || 0, a.value?.draw || 0, a.value?.away || 0, a.value?.over25 || 0) * 2);
                const bScore = (b.kiScore || 0) + (Math.max(b.value?.home || 0, b.value?.draw || 0, b.value?.away || 0, b.value?.over25 || 0) * 2);
                return bScore - aScore;
            })
            .slice(0, 3);
        
        // Fallback: Wenn keine Premium Picks, nimm einfach die Top 3 nach KI-Score
        if (premiumPicks.length === 0 && games.length > 0) {
            premiumPicks = games
                .sort((a, b) => (b.kiScore || 0) - (a.kiScore || 0))
                .slice(0, 3);
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

        // 🔥 PROBLEM 3: Top Over 2.5 - KORREKTE FILTERUNG
        topOver25Div.innerHTML = "";
        const overGames = games
            .filter(g => (g.over25 || 0) > 0.5) // Filter für Over 2.5 Wahrscheinlichkeit
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
        const topGames = games
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
        const otherGames = games.filter(g => 
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
