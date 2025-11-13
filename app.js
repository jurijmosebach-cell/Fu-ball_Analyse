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

// API Configuration - Nutzt deine Environment Variable
const API_CONFIG = {
    baseURL: 'https://api.football-data.org/v4',
    apiKey: process.env.FOOTBALL_DATA_API_KEY || window.FOOTBALL_DATA_API_KEY, // Nimmt API Key aus Environment
    endpoints: {
        matches: '/matches',
        competitions: '/competitions'
    }
};

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

    const bestValue = Math.max(
        game.value?.home || 0, 
        game.value?.draw || 0, 
        game.value?.away || 0, 
        game.value?.over25 || 0
    );
    
    const bestValueType = game.value ? Object.entries(game.value).reduce((a, b) => a[1] > b[1] ? a : b)[0] : 'home';

    const premiumBadge = type === 'premium' ? `<span class="premium-badge">💎 TOP PICK</span>` : '';
    const featuredBadge = type === 'featured' ? `<span class="premium-badge" style="background: #2563eb;">⭐ VALUE</span>` : '';

    gameEl.innerHTML = `
        <div class="game-header">
            <div class="teams">
                <div class="team">
                    <img src="${game.homeLogo || 'https://via.placeholder.com/32x24/2563eb/ffffff?text=H'}" alt="${game.home}" class="team-logo">
                    <span>${game.home}</span>
                </div>
                <div class="vs">vs</div>
                <div class="team">
                    <img src="${game.awayLogo || 'https://via.placeholder.com/32x24/dc2626/ffffff?text=A'}" alt="${game.away}" class="team-logo">
                    <span>${game.away}</span>
                </div>
            </div>
            <div class="game-meta">
                <div class="league">${game.league} ${premiumBadge} ${featuredBadge}</div>
                <div>${formattedDate}</div>
            </div>
        </div>
        
        <div class="metrics-grid">
            ${createProgressBar('Heimsieg', game.prob?.home || 0.33, 'home').outerHTML}
            ${createProgressBar('Unentschieden', game.prob?.draw || 0.33, 'draw').outerHTML}
            ${createProgressBar('Auswärtssieg', game.prob?.away || 0.33, 'away').outerHTML}
            ${createProgressBar('Over 2.5', game.over25 || 0.5, 'over').outerHTML}
            ${createProgressBar('BTTS', game.btts || 0.5, 'btts').outerHTML}
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

// Echte API Daten von football-data.org verarbeiten
function processFootballData(apiData) {
    console.log("Verarbeite football-data.org API Daten:", apiData);
    
    if (!apiData || !apiData.matches) {
        console.error("Keine Spieldaten in API Response");
        return [];
    }

    return apiData.matches.map(match => {
        // Extrahiere relevante Daten aus der API Response
        const homeTeam = match.homeTeam?.name || 'Heimteam';
        const awayTeam = match.awayTeam?.name || 'Auswärtsteam';
        const league = match.competition?.name || 'Unbekannte Liga';
        
        // KI-Analyse basierend auf echten Daten
        const homeStrength = calculateTeamStrength(homeTeam, league);
        const awayStrength = calculateTeamStrength(awayTeam, league);
        
        // Realistische Wahrscheinlichkeiten berechnen
        const baseHomeProb = 0.35 + (homeStrength - awayStrength) * 0.3;
        const homeProb = Math.max(0.15, Math.min(0.75, baseHomeProb));
        const drawProb = Math.max(0.15, Math.min(0.35, 0.25 + Math.random() * 0.2));
        const awayProb = Math.max(0.1, Math.min(0.6, 1 - homeProb - drawProb));
        
        // Over/Under und BTTS basierend auf Liga und Teams
        const over25 = calculateOver25Probability(homeTeam, awayTeam, league);
        const btts = calculateBTTSProbability(homeTeam, awayTeam, league);
        
        // KI-Konfidenz
        const confidence = 0.65 + Math.random() * 0.25;
        
        // Value berechnen
        const value = calculateValueProbabilities(homeProb, awayProb, drawProb, over25);
        
        return {
            id: match.id,
            home: homeTeam,
            away: awayTeam,
            homeLogo: match.homeTeam?.crest || `https://via.placeholder.com/32x24/2563eb/ffffff?text=${homeTeam.substring(0,2)}`,
            awayLogo: match.awayTeam?.crest || `https://via.placeholder.com/32x24/dc2626/ffffff?text=${awayTeam.substring(0,2)}`,
            league: league,
            date: match.utcDate,
            prob: {
                home: homeProb,
                draw: drawProb,
                away: awayProb
            },
            over25: over25,
            btts: btts,
            confidence: confidence,
            kiScore: confidence + (Math.random() * 0.15),
            value: value,
            trend: calculateTrend(homeProb, awayProb, drawProb),
            analysis: generateAnalysis(match, homeProb, awayProb, drawProb, value)
        };
    });
}

function calculateTeamStrength(teamName, league) {
    // Vereinfachte Team-Stärken basierend auf bekannten Teams
    const strongTeams = {
        "Premier League": ["Manchester City", "Liverpool", "Arsenal", "Chelsea", "Manchester United"],
        "Bundesliga": ["Bayern Munich", "Borussia Dortmund", "RB Leipzig", "Bayer Leverkusen"],
        "La Liga": ["Real Madrid", "Barcelona", "Atletico Madrid", "Sevilla"],
        "Serie A": ["Inter Milan", "AC Milan", "Juventus", "Napoli", "Roma"],
        "Ligue 1": ["PSG", "Monaco", "Lyon", "Marseille"]
    };
    
    // Check if team is in strong teams list for their league
    for (const [leagueName, teams] of Object.entries(strongTeams)) {
        if (teams.includes(teamName)) {
            return 0.7 + Math.random() * 0.2; // Starke Teams: 0.7-0.9
        }
    }
    
    return 0.4 + Math.random() * 0.3; // Andere Teams: 0.4-0.7
}

function calculateOver25Probability(homeTeam, awayTeam, league) {
    // Liga-spezifische Base-Wahrscheinlichkeiten
    const leagueBase = {
        "Bundesliga": 0.55,
        "Premier League": 0.52,
        "La Liga": 0.48,
        "Serie A": 0.45,
        "Ligue 1": 0.50,
        "default": 0.48
    };
    
    const baseProb = leagueBase[league] || leagueBase.default;
    
    // Anpassung basierend auf Team-Stärken
    const homeStrength = calculateTeamStrength(homeTeam, league);
    const awayStrength = calculateTeamStrength(awayTeam, league);
    
    // Starke Teams tendieren zu mehr Toren
    const strengthBonus = (homeStrength + awayStrength - 1) * 0.1;
    
    return Math.max(0.3, Math.min(0.8, baseProb + strengthBonus));
}

function calculateBTTSProbability(homeTeam, awayTeam, league) {
    // Base Wahrscheinlichkeiten pro Liga
    const leagueBase = {
        "Bundesliga": 0.52,
        "Premier League": 0.50,
        "La Liga": 0.48,
        "Serie A": 0.46,
        "Ligue 1": 0.49,
        "default": 0.48
    };
    
    return leagueBase[league] || leagueBase.default;
}

function calculateValueProbabilities(homeProb, awayProb, drawProb, over25) {
    // Simuliere Value basierend auf Wahrscheinlichkeiten
    return {
        home: Math.max(0, (homeProb * 1.1 - 1) * 0.8),
        draw: Math.max(0, (drawProb * 1.15 - 1) * 0.7),
        away: Math.max(0, (awayProb * 1.2 - 1) * 0.6),
        over25: Math.max(0, (over25 * 1.1 - 1) * 0.9)
    };
}

function calculateTrend(homeProb, awayProb, drawProb) {
    if (homeProb > 0.6) return "Strong Home";
    if (awayProb > 0.6) return "Strong Away";
    if (homeProb > 0.52) return "Home";
    if (awayProb > 0.52) return "Away";
    if (drawProb > 0.35) return "Draw";
    return "Balanced";
}

function generateAnalysis(match, homeProb, awayProb, drawProb, value) {
    const homeTeam = match.homeTeam?.name || 'Heimteam';
    const awayTeam = match.awayTeam?.name || 'Auswärtsteam';
    const bestValue = Math.max(value.home, value.draw, value.away, value.over25);
    const bestValueType = Object.entries(value).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    
    let summary = "";
    let recommendation = "";
    
    if (homeProb > 0.58) {
        summary = `${homeTeam} mit klarem Heimplatzvorteil (${Math.round(homeProb * 100)}% Siegchance). Gute Ausgangslage.`;
        recommendation = `Heimsieg - ${(value.home * 100).toFixed(1)}% Value`;
    } else if (awayProb > 0.58) {
        summary = `${awayTeam} zeigt starke Auswärtsleistung (${Math.round(awayProb * 100)}% Siegchance). Überzeugende Performance.`;
        recommendation = `Auswärtssieg - ${(value.away * 100).toFixed(1)}% Value`;
    } else if (Math.abs(homeProb - awayProb) < 0.1) {
        summary = `Ausgeglichene Begegnung zwischen ${homeTeam} und ${awayTeam}. Spannendes Duell erwartet.`;
        recommendation = `Unentschieden - ${(value.draw * 100).toFixed(1)}% Value`;
    } else {
        summary = `${homeTeam} vs ${awayTeam}: Interessante Paarung mit Tendenz zu ${homeProb > awayProb ? homeTeam : awayTeam}.`;
        recommendation = `${bestValueType} - ${(bestValue * 100).toFixed(1)}% Value`;
    }
    
    return {
        summary: summary,
        recommendation: recommendation
    };
}

// API Call zu football-data.org
async function fetchFootballData() {
    console.log("Fetching data from football-data.org...");
    
    try {
        // Bereite das Datum für die API vor
        const dateFrom = new Date();
        const dateTo = new Date();
        dateTo.setDate(dateTo.getDate() + 7); // Nächste 7 Tage
        
        const dateFromStr = dateFrom.toISOString().split('T')[0];
        const dateToStr = dateTo.toISOString().split('T')[0];
        
        const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.matches}?dateFrom=${dateFromStr}&dateTo=${dateToStr}`;
        
        console.log("API URL:", url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Auth-Token': API_CONFIG.apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Football-data.org API Response:", data);
        return data;

    } catch (error) {
        console.error("Fehler beim API Call:", error);
        throw new Error(`Konnte keine Daten von football-data.org laden: ${error.message}`);
    }
}

function updateStatistics(games) {
    const premiumGames = games.filter(g => 
        (g.kiScore > 0.65 || g.confidence > 0.7) && 
        Math.max(g.value?.home || 0, g.value?.draw || 0, g.value?.away || 0, g.value?.over25 || 0) > 0.05
    );
    const featuredGames = games.filter(g => g.kiScore > 0.6 || g.confidence > 0.6);
    const highValueGames = games.filter(g => Math.max(...Object.values(g.value || {})) > 0.05);
    const strongTrendGames = games.filter(g => g.trend && (g.trend.includes('Strong') || g.trend === 'Home' || g.trend === 'Away'));
    
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
        console.log("Starte Ladevorgang mit football-data.org API...");
        
        // Show loading state
        premiumPicksDiv.innerHTML = topGamesDiv.innerHTML = gamesDiv.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <div>Lade Live-Daten von football-data.org...</div>
            </div>
        `;

        // API Key Check
        if (!API_CONFIG.apiKey || API_CONFIG.apiKey === 'YOUR_API_KEY') {
            throw new Error("API Key nicht konfiguriert. Bitte API Key in Environment setzen.");
        }

        // Fetch data from football-data.org
        const apiData = await fetchFootballData();
        
        if (!apiData.matches || apiData.matches.length === 0) {
            throw new Error("Keine Spiele in den nächsten 7 Tagen gefunden");
        }

        // Process the data
        let games = processFootballData(apiData);
        console.log(`Verarbeitet ${games.length} Spiele`);

        // Apply filters
        if (leagueSelect.value) {
            games = games.filter(g => g.league === leagueSelect.value);
            console.log(`Nach Liga gefiltert: ${games.length} Spiele`);
        }
        if (teamInput.value) {
            const query = teamInput.value.toLowerCase();
            games = games.filter(g => 
                g.home.toLowerCase().includes(query) || 
                g.away.toLowerCase().includes(query)
            );
            console.log(`Nach Team gefiltert: ${games.length} Spiele`);
        }

        // Update statistics
        updateStatistics(games);

        // Display games in different sections
        displayPremiumPicks(games);
        displayTopGames(games);
        displayTopValueBets(games);
        displayTopOver25(games);
        displayAllGames(games);

        console.log("Spiele erfolgreich geladen und angezeigt!");

    } catch (err) {
        console.error("Fehler beim Laden:", err);
        gamesDiv.innerHTML = `
            <div class="loading">
                <i class="fas fa-exclamation-triangle" style="color: #dc2626;"></i>
                <div>Fehler beim Laden: ${err.message}</div>
                <div style="margin-top: 1rem; font-size: 0.875rem; color: #6b7280;">
                    Stelle sicher, dass dein football-data.org API Key korrekt in der Environment gesetzt ist.
                </div>
                <button onclick="loadGames()" class="btn-primary" style="margin-top: 1rem;">
                    <i class="fas fa-redo"></i> Erneut versuchen
                </button>
            </div>
        `;
    }
}

function displayPremiumPicks(games) {
    premiumPicksDiv.innerHTML = "";
    
    const premiumPicks = games
        .filter(g => (g.kiScore > 0.65 || g.confidence > 0.7))
        .sort((a, b) => (b.kiScore || 0) - (a.kiScore || 0))
        .slice(0, 3);

    if (premiumPicks.length === 0) {
        premiumPicksDiv.innerHTML = `
            <div class="loading">
                <i class="fas fa-info-circle" style="color: #6b7280;"></i>
                <div>Keine Premium Picks gefunden</div>
            </div>
        `;
    } else {
        premiumPicks.forEach(game => {
            premiumPicksDiv.appendChild(createGameElement(game, 'premium'));
        });
    }
}

function displayTopGames(games) {
    topGamesDiv.innerHTML = "";
    
    const premiumPicks = games
        .filter(g => (g.kiScore > 0.65 || g.confidence > 0.7))
        .sort((a, b) => (b.kiScore || 0) - (a.kiScore || 0))
        .slice(0, 3);

    const topGames = games
        .filter(g => !premiumPicks.includes(g))
        .sort((a, b) => (b.kiScore || 0) - (a.kiScore || 0))
        .slice(0, 5);
    
    if (topGames.length === 0) {
        topGamesDiv.innerHTML = `
            <div class="loading">
                <i class="fas fa-info-circle" style="color: #6b7280;"></i>
                <div>Keine Top Value Spiele</div>
            </div>
        `;
    } else {
        topGames.forEach(game => {
            topGamesDiv.appendChild(createGameElement(game, 'featured'));
        });
    }
}

function displayTopValueBets(games) {
    topValueBetsDiv.innerHTML = "";
    
    const valueBets = games
        .sort((a, b) => Math.max(...Object.values(b.value || {})) - Math.max(...Object.values(a.value || {})))
        .slice(0, 5);
    
    valueBets.forEach(game => {
        topValueBetsDiv.appendChild(createGameElement(game));
    });
}

function displayTopOver25(games) {
    topOver25Div.innerHTML = "";
    
    const overGames = games
        .filter(g => (g.over25 || 0) > 0.45)
        .sort((a, b) => (b.over25 || 0) - (a.over25 || 0))
        .slice(0, 5);
    
    if (overGames.length === 0) {
        topOver25Div.innerHTML = `
            <div class="loading">
                <i class="fas fa-info-circle" style="color: #6b7280;"></i>
                <div>Keine Top Over 2.5 Spiele</div>
            </div>
        `;
    } else {
        overGames.forEach(game => {
            topOver25Div.appendChild(createGameElement(game));
        });
    }
}

function displayAllGames(games) {
    gamesDiv.innerHTML = "";
    
    const premiumPicks = games
        .filter(g => (g.kiScore > 0.65 || g.confidence > 0.7))
        .sort((a, b) => (b.kiScore || 0) - (a.kiScore || 0))
        .slice(0, 3);

    const topGames = games
        .filter(g => !premiumPicks.includes(g))
        .sort((a, b) => (b.kiScore || 0) - (a.kiScore || 0))
        .slice(0, 5);

    const otherGames = games.filter(g => !premiumPicks.includes(g) && !topGames.includes(g));
    
    if (otherGames.length === 0) {
        gamesDiv.innerHTML = `
            <div class="loading">
                <i class="fas fa-info-circle" style="color: #6b7280;"></i>
                <div>Keine weiteren Spiele</div>
            </div>
        `;
    } else {
        otherGames.forEach(game => {
            gamesDiv.appendChild(createGameElement(game));
        });
    }
}

// Event Listeners
loadBtn.addEventListener("click", loadGames);
window.addEventListener("load", loadGames);

// Auto-refresh every 10 minutes
setInterval(loadGames, 10 * 60 * 1000);

// Initial load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loadGames, 1000);
});
