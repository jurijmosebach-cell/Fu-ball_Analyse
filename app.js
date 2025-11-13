// DOM Elements
const top3Div = document.getElementById("top3");
const top7ValueDiv = document.getElementById("top7Value");
const top5OverDiv = document.getElementById("top5Over25");
const gamesDiv = document.getElementById("games");
const loadBtn = document.getElementById("loadBtn");
const dateInput = document.getElementById("date");
const leagueSelect = document.getElementById("league");
const teamInput = document.getElementById("team");

// Statistic Elements
const totalMatchesEl = document.getElementById("totalMatches");
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

function getTrendIcon(trend) {
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
    return icons[trend] || "fas fa-chart-line";
}

function createKIBadge(confidence) {
    const badge = document.createElement("span");
    badge.className = `ki-badge ${confidence > 0.8 ? 'ki-high' : confidence > 0.6 ? 'ki-medium' : 'ki-low'}`;
    badge.innerHTML = `<i class="fas fa-robot"></i> ${Math.round(confidence * 100)}%`;
    badge.title = `KI-Konfidenz: ${Math.round(confidence * 100)}%`;
    return badge;
}

function createTrendBadge(trend) {
    const badge = document.createElement("span");
    badge.className = `trend-indicator trend-${trend.toLowerCase().includes('home') ? 'home' : trend.toLowerCase().includes('away') ? 'away' : trend.toLowerCase().includes('draw') ? 'draw' : 'balanced'}`;
    badge.innerHTML = `<i class="${getTrendIcon(trend)}"></i> ${trend}`;
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

// Torschützen-Anzeige erstellen
function createGoalscorerDisplay(goalscorers) {
    if (!goalscorers || !goalscorers.anytime) return '';

    const container = document.createElement('div');
    container.className = 'goalscorer-section';
    container.style.marginTop = '1rem';
    container.style.padding = '1rem';
    container.style.background = '#f8fafc';
    container.style.borderRadius = '8px';
    container.style.border = '1px solid #e2e8f0';

    // Header
    const header = document.createElement('div');
    header.className = 'goalscorer-header';
    header.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
            <i class="fas fa-futbol" style="color: #059669;"></i>
            <h4 style="margin: 0; font-size: 1rem; color: #1f2937;">KI-Torschützen Prognose</h4>
        </div>
    `;
    container.appendChild(header);

    // Top Anytime Scorer
    const anytimeSection = document.createElement('div');
    anytimeSection.innerHTML = `
        <div style="font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">
            ⚽ Jeder Torschütze (Top 3)
        </div>
    `;

    const topAnytime = [...(goalscorers.anytime.home || []), ...(goalscorers.anytime.away || [])]
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 3);

    topAnytime.forEach(scorer => {
        const scorerEl = document.createElement('div');
        scorerEl.style.display = 'flex';
        scorerEl.style.justifyContent = 'space-between';
        scorerEl.style.alignItems = 'center';
        scorerEl.style.padding = '0.5rem';
        scorerEl.style.marginBottom = '0.25rem';
        scorerEl.style.background = 'white';
        scorerEl.style.borderRadius = '4px';
        scorerEl.style.fontSize = '0.8rem';

        scorerEl.innerHTML = `
            <div>
                <strong>${scorer.name}</strong>
                <span style="color: #6b7280; font-size: 0.75rem; margin-left: 0.5rem;">
                    ${Math.round(scorer.probability * 100)}%
                </span>
            </div>
            <div style="display: flex; gap: 1rem; align-items: center;">
                <span style="color: #059669; font-weight: 600;">${scorer.odds}</span>
                <span style="color: ${scorer.value > 0.1 ? '#059669' : scorer.value > 0 ? '#f59e0b' : '#ef4444'}; 
                              font-size: 0.7rem; font-weight: 600;">
                    ${(scorer.value * 100).toFixed(1)}%
                </span>
            </div>
        `;
        anytimeSection.appendChild(scorerEl);
    });

    container.appendChild(anytimeSection);

    // Best Value Bets
    if (goalscorers.bestValue && goalscorers.bestValue.length > 0) {
        const valueSection = document.createElement('div');
        valueSection.style.marginTop = '1rem';
        valueSection.innerHTML = `
            <div style="font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">
                💎 Beste Value-Wetten
            </div>
        `;

        goalscorers.bestValue.slice(0, 2).forEach(bet => {
            const betEl = document.createElement('div');
            betEl.style.display = 'flex';
            betEl.style.justifyContent = 'space-between';
            betEl.style.alignItems = 'center';
            betEl.style.padding = '0.5rem';
            betEl.style.background = '#dcfce7';
            betEl.style.borderRadius = '4px';
            betEl.style.marginBottom = '0.25rem';
            betEl.style.fontSize = '0.8rem';
            betEl.style.border = '1px solid #bbf7d0';

            betEl.innerHTML = `
                <div>
                    <strong>${bet.player}</strong>
                    <div style="color: #6b7280; font-size: 0.7rem;">${bet.type}</div>
                </div>
                <div style="text-align: right;">
                    <div style="color: #059669; font-weight: 600;">${bet.odds}</div>
                    <div style="color: #059669; font-size: 0.7rem; font-weight: 600;">
                        +${(bet.value * 100).toFixed(1)}% Value
                    </div>
                </div>
            `;
            valueSection.appendChild(betEl);
        });

        container.appendChild(valueSection);
    }

    return container;
}

function createGameElement(game, featured = false) {
    const gameEl = document.createElement("div");
    gameEl.className = `game-item ${featured ? 'featured' : ''}`;
    
    const dateObj = game.date ? new Date(game.date) : new Date();
    const formattedDate = dateObj.toLocaleDateString('de-DE', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Calculate best value
    const bestValue = Math.max(game.value.home, game.value.draw, game.value.away, game.value.over25, game.value.under25);
    const bestValueType = bestValue === game.value.home ? 'home' : 
                         bestValue === game.value.draw ? 'draw' : 
                         bestValue === game.value.away ? 'away' :
                         bestValue === game.value.over25 ? 'over25' : 'under25';

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
                <div class="league">${game.league}</div>
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

    // Add analysis section for featured games
    if (featured && game.analysis) {
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
            ${game.analysis.recommendation ? `
            <div style="margin-top: 0.5rem; font-size: 0.875rem; font-weight: 600; color: #2563eb;">
                <i class="fas fa-check-circle"></i> Empfehlung: ${game.analysis.recommendation}
            </div>
            ` : ''}
        `;
        gameEl.appendChild(analysisSection);
    }

    // Torschützen anzeigen
    if (game.goalscorers) {
        const goalscorerDisplay = createGoalscorerDisplay(game.goalscorers);
        if (goalscorerDisplay) {
            gameEl.appendChild(goalscorerDisplay);
        }
    }

    return gameEl;
}

function updateStatistics(games) {
    // Basic counts
    totalMatchesEl.textContent = games.length;
    featuredCountEl.textContent = `${Math.min(3, games.length)} Spiele`;
    allGamesCountEl.textContent = `${games.length} Spiele`;

    // Advanced statistics
    const avgConfidence = games.reduce((sum, game) => sum + (game.confidence || 0.5), 0) / games.length;
    const highValueBets = games.filter(game => 
        Math.max(game.value.home, game.value.draw, game.value.away, game.value.over25) > 0.1
    ).length;
    const strongTrends = games.filter(game => 
        game.trend.includes('Strong') || game.trend === 'Home' || game.trend === 'Away'
    ).length;
    const over25Rate = games.reduce((sum, game) => sum + (game.over25 || 0), 0) / games.length;

    avgConfidenceEl.textContent = `${Math.round(avgConfidence * 100)}%`;
    highValueBetsEl.textContent = highValueBets;
    strongTrendsEl.textContent = strongTrends;
    over25RateEl.textContent = `${Math.round(over25Rate * 100)}%`;
    updateTimeEl.textContent = new Date().toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

async function loadGames() {
    try {
        // Show loading state
        gamesDiv.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <div>KI analysiert Spiele und Torschützen...</div>
            </div>
        `;

        let url = "/api/games";
        if (dateInput.value) url += "?date=" + dateInput.value;
        
        const res = await fetch(url);
        const data = await res.json();

        if (!data || !Array.isArray(data.response)) {
            gamesDiv.innerHTML = "<div class='loading'>Fehler: Keine Spieldaten erhalten</div>";
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

        // Render featured games (Top 3)
        top3Div.innerHTML = "";
        const featuredGames = games.slice(0, 3);
        featuredGames.forEach(game => {
            top3Div.appendChild(createGameElement(game, true));
        });

        // Render value bets (Top 7)
        top7ValueDiv.innerHTML = "";
        const valueGames = games
            .slice()
            .sort((a, b) => {
                const aValue = Math.max(a.value.home, a.value.draw, a.value.away, a.value.over25);
                const bValue = Math.max(b.value.home, b.value.draw, b.value.away, b.value.over25);
                return bValue - aValue;
            })
            .slice(0, 7);
        
        valueGames.forEach(game => {
            top7ValueDiv.appendChild(createGameElement(game));
        });

        // Render over 2.5 games
        top5OverDiv.innerHTML = "";
        const overGames = games
            .slice()
            .filter(g => (g.over25 || 0) > 0.35)
            .sort((a, b) => (b.over25 || 0) - (a.over25 || 0))
            .slice(0, 5);
        
        overGames.forEach(game => {
            top5OverDiv.appendChild(createGameElement(game));
        });

        // Render all games
        gamesDiv.innerHTML = "";
        const otherGames = games.slice(3);
        if (otherGames.length === 0) {
            gamesDiv.innerHTML = `<div class="loading">Keine weiteren Spiele gefunden</div>`;
        } else {
            otherGames.forEach(game => {
                gamesDiv.appendChild(createGameElement(game));
            });
        }

    } catch (err) {
        console.error("Fehler beim Laden:", err);
        gamesDiv.innerHTML = `
            <div class="loading">
                <i class="fas fa-exclamation-triangle" style="color: #dc2626; font-size: 2rem; margin-bottom: 1rem;"></i>
                <div>Fehler beim Laden der Spiele</div>
                <div style="font-size: 0.875rem; margin-top: 0.5rem;">Bitte überprüfe die Konsole für Details</div>
            </div>
        `;
    }
}

// Event Listeners
loadBtn.addEventListener("click", loadGames);
window.addEventListener("load", loadGames);

// Auto-refresh every 5 minutes
setInterval(loadGames, 5 * 60 * 1000);
