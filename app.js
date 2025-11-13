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
const premiumPicksEl = document.getElementById("premiumPicks");

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
    const percentage = Math.round(value * 100);
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

    const bestValue = Math.max(game.value.home, game.value.draw, game.value.away, game.value.over25);
    const bestValueType = Object.entries(game.value).reduce((a, b) => a[1] > b[1] ? a : b)[0];

    // Premium Badge für Top-Spiele
    const premiumBadge = type === 'premium' ? `<span class="premium-badge">💎 TOP PICK</span>` : '';

    gameEl.innerHTML = `
        <div class="game-header">
            <div class="teams">
                <div class="team">
                    <img src="${game.homeLogo}" alt="${game.home}" class="team-logo">
                    <span>${game.home}</span>
                </div>
                <div class="vs">vs</div>
                <div class="team">
                    <img src="${game.awayLogo}" alt="${game.away}" class="team-logo">
                    <span>${game.away}</span>
                </div>
            </div>
            <div class="game-meta">
                <div class="league">${game.league} ${premiumBadge}</div>
                <div>${formattedDate}</div>
            </div>
        </div>
        
        <div class="metrics-grid">
            ${createProgressBar('Heimsieg', game.prob.home, 'home').outerHTML}
            ${createProgressBar('Unentschieden', game.prob.draw, 'draw').outerHTML}
            ${createProgressBar('Auswärtssieg', game.prob.away, 'away').outerHTML}
            ${createProgressBar('Over 2.5', game.over25, 'over').outerHTML}
            ${createProgressBar('BTTS', game.btts, 'btts').outerHTML}
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                ${createTrendBadge(game.trend).outerHTML}
                ${createKIBadge(game.confidence).outerHTML}
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
                ${game.analysis.summary}
            </div>
            <div style="margin-top: 0.5rem; font-size: 0.875rem; font-weight: 600; color: #2563eb;">
                <i class="fas fa-check-circle"></i> ${game.analysis.recommendation}
            </div>
        `;
        gameEl.appendChild(analysisSection);
    }

    return gameEl;
}

function updateStatistics(games) {
    const premiumGames = games.filter(g => g.kiScore > 0.8 && Math.max(g.value.home, g.value.draw, g.value.away, g.value.over25) > 0.15);
    const featuredGames = games.filter(g => g.kiScore > 0.7);
    const highValueGames = games.filter(g => Math.max(g.value.home, g.value.draw, g.value.away, g.value.over25) > 0.1);
    const strongTrendGames = games.filter(g => g.trend.includes('Strong') || g.trend === 'Home' || g.trend === 'Away');
    
    totalMatchesEl.textContent = games.length;
    premiumCountEl.textContent = `${premiumGames.length} Premium`;
    featuredCountEl.textContent = `${featuredGames.length} Spiele`;
    allGamesCountEl.textContent = `${games.length} Spiele`;

    const avgConfidence = games.reduce((sum, game) => sum + (game.confidence || 0.5), 0) / games.length;
    const over25Rate = games.reduce((sum, game) => sum + (game.over25 || 0), 0) / games.length;

    avgConfidenceEl.textContent = `${Math.round(avgConfidence * 100)}%`;
    highValueBetsEl.textContent = highValueGames.length;
    strongTrendsEl.textContent = strongTrendGames.length;
    over25RateEl.textContent = `${Math.round(over25Rate * 100)}%`;
    updateTimeEl.textContent = new Date().toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

async function loadGames() {
    try {
        // Show loading state
        premiumPicksDiv.innerHTML = topGamesDiv.innerHTML = gamesDiv.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <div>KI analysiert Spiele...</div>
            </div>
        `;

        let url = "/api/games";
        if (dateInput.value) url += "?date=" + dateInput.value;
        
        const res = await fetch(url);
        const data = await res.json();

        if (!data || !Array.isArray(data.response)) {
            gamesDiv.innerHTML = "<div class='loading'>Keine Spieldaten erhalten</div>";
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
                g.home.toLowerCase().includes(query) || 
                g.away.toLowerCase().includes(query)
            );
        }

        // Update statistics
        updateStatistics(games);

        // Premium Picks (Top 3 mit höchstem KI-Score und Value)
        premiumPicksDiv.innerHTML = "";
        const premiumPicks = games
            .filter(g => g.kiScore > 0.75 && Math.max(g.value.home, g.value.draw, g.value.away, g.value.over25) > 0.1)
            .sort((a, b) => b.kiScore - a.kiScore)
            .slice(0, 3);
        
        premiumPicks.forEach(game => {
            premiumPicksDiv.appendChild(createGameElement(game, 'premium'));
        });

        // Top Games (Nächste 5 beste Spiele)
        topGamesDiv.innerHTML = "";
        const topGames = games
            .filter(g => !premiumPicks.includes(g))
            .sort((a, b) => b.kiScore - a.kiScore)
            .slice(0, 5);
        
        topGames.forEach(game => {
            topGamesDiv.appendChild(createGameElement(game, 'featured'));
        });

        // Top Value Bets
        topValueBetsDiv.innerHTML = "";
        const valueBets = games
            .sort((a, b) => Math.max(...Object.values(b.value)) - Math.max(...Object.values(a.value)))
            .slice(0, 5);
        
        valueBets.forEach(game => {
            topValueBetsDiv.appendChild(createGameElement(game));
        });

        // Top Over 2.5
        topOver25Div.innerHTML = "";
        const overGames = games
            .filter(g => g.over25 > 0.5)
            .sort((a, b) => b.over25 - a.over25)
            .slice(0, 5);
        
        overGames.forEach(game => {
            topOver25Div.appendChild(createGameElement(game));
        });

        // Alle anderen Spiele
        gamesDiv.innerHTML = "";
        const otherGames = games.filter(g => !premiumPicks.includes(g) && !topGames.includes(g));
        
        if (otherGames.length === 0) {
            gamesDiv.innerHTML = `<div class="loading">Keine weiteren Spiele</div>`;
        } else {
            otherGames.forEach(game => {
                gamesDiv.appendChild(createGameElement(game));
            });
        }

    } catch (err) {
        console.error("Fehler beim Laden:", err);
        gamesDiv.innerHTML = `
            <div class="loading">
                <i class="fas fa-exclamation-triangle" style="color: #dc2626;"></i>
                <div>Fehler beim Laden</div>
            </div>
        `;
    }
}

// Event Listeners
loadBtn.addEventListener("click", loadGames);
window.addEventListener("load", loadGames);

// Auto-refresh every 5 minutes
setInterval(loadGames, 5 * 60 * 1000);
