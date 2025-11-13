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

// Erweiterte State Management
let currentGames = [];
let filteredGames = [];
let isLoading = false;

// Set today's date as default
dateInput.value = new Date().toISOString().split('T')[0];

// Professional KI Analysis Engine
class ProfessionalKIAnalyse {
    constructor() {
        this.historicalAccuracy = 0.83;
        this.modelVersion = "v2.1.0";
    }

    calculateAdvancedKIScore(game) {
        const factors = {
            confidence: game.confidence || 0.5,
            valueStrength: Math.max(...Object.values(game.value || {})),
            probabilityCertainty: 1 - Math.abs((game.prob?.home || 0.33) - (game.prob?.away || 0.33)),
            formStability: this.calculateFormStability(game),
            marketEfficiency: 0.92
        };

        let score = (
            factors.confidence * 0.35 +
            factors.valueStrength * 0.25 +
            factors.probabilityCertainty * 0.20 +
            factors.formStability * 0.15 +
            factors.marketEfficiency * 0.05
        );

        // Bonus für starke Trends
        if (game.trend?.includes('Strong')) {
            score += 0.12;
        }

        return Math.max(0.1, Math.min(0.98, score));
    }

    calculateFormStability(game) {
        // Simulierte Form-Stabilitäts-Berechnung
        const baseStability = 0.7;
        const confidenceBonus = (game.confidence - 0.5) * 0.3;
        return Math.max(0.3, Math.min(0.95, baseStability + confidenceBonus));
    }

    generateProfessionalAnalysis(game) {
        const bestValue = Math.max(...Object.values(game.value || {}));
        const bestValueType = game.value ? Object.entries(game.value).reduce((a, b) => a[1] > b[1] ? a : b)[0] : 'home';
        
        const analysisTemplates = {
            "Strong Home": {
                summary: `${game.home} zeigt überzeugende Heimplatzstärke mit ${Math.round((game.prob?.home || 0) * 100)}% Siegwahrscheinlichkeit. Gute Torausbeute erwartet.`,
                recommendation: "Heimsieg - Hohe Erfolgschance"
            },
            "Strong Away": {
                summary: `${game.away} demonstriert beeindruckende Auswärtsleistung. KI prognostiziert ${Math.round((game.prob?.away || 0) * 100)}% Siegchance.`,
                recommendation: "Auswärtssieg - Wertvolle Option"
            },
            "Home": {
                summary: `Klarer Heimplatzvorteil für ${game.home}. Stabile Performance bei ${Math.round((game.prob?.home || 0) * 100)}% Siegwahrscheinlichkeit.`,
                recommendation: "Heimsieg favorisieren"
            },
            "Draw": {
                summary: `Ausgeglichene Begegnung mit Tendenz zu Unentschieden (${Math.round((game.prob?.draw || 0) * 100)}%). Beide Teams torhungrig.`,
                recommendation: "Unentschieden mit Value"
            },
            "Balanced": {
                summary: `Gut balanciertes Spiel ohne klaren Favoriten. ${Math.round((game.over25 || 0) * 100)}% Chance auf Over 2.5 Tore.`,
                recommendation: "Over 2.5 Tore empfehlenswert"
            }
        };

        const template = analysisTemplates[game.trend] || analysisTemplates["Balanced"];
        
        return {
            summary: template.summary,
            recommendation: `${template.recommendation} | Value: ${(bestValue * 100).toFixed(1)}%`,
            riskLevel: bestValue > 0.15 ? "low" : bestValue > 0.08 ? "medium" : "high",
            confidence: game.confidence,
            timestamp: new Date().toISOString()
        };
    }
}

const kiEngine = new ProfessionalKIAnalyse();

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

function createValueIndicator(value) {
    const percentage = (value * 100).toFixed(1);
    let color = "#dc2626"; // red
    let icon = "fas fa-times";
    
    if (value > 0.15) {
        color = "#059669"; // green
        icon = "fas fa-check-circle";
    } else if (value > 0.08) {
        color = "#f59e0b"; // amber
        icon = "fas fa-exclamation-circle";
    }
    
    return `<span style="color: ${color}; font-weight: 600;">
        <i class="${icon}"></i> ${percentage}%
    </span>`;
}

function createGameElement(game, type = 'standard') {
    const gameEl = document.createElement("div");
    gameEl.className = `game-item ${type === 'premium' ? 'premium' : type === 'featured' ? 'featured' : ''}`;
    gameEl.setAttribute('data-game-id', game.id);
    
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

    // Premium Badge für Top-Spiele
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
            <div style="font-size: 0.875rem; font-weight: 600;">
                Best Value: ${createValueIndicator(bestValue).outerHTML}
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
                <span style="margin-left: auto; font-size: 0.75rem; color: ${game.analysis.riskLevel === 'low' ? '#059669' : game.analysis.riskLevel === 'medium' ? '#f59e0b' : '#dc2626'}">
                    Risiko: ${game.analysis.riskLevel === 'low' ? 'Niedrig' : game.analysis.riskLevel === 'medium' ? 'Mittel' : 'Hoch'}
                </span>
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

    // Click Event für erweiterte Details
    gameEl.addEventListener('click', function() {
        showGameDetails(game);
    });

    return gameEl;
}

function showGameDetails(game) {
    // Einfache Detail-Anzeige - könnte durch Modal erweitert werden
    const detailHtml = `
        <strong>${game.home} vs ${game.away}</strong><br>
        Liga: ${game.league}<br>
        KI-Konfidenz: ${Math.round((game.confidence || 0.5) * 100)}%<br>
        Best Value: ${(Math.max(...Object.values(game.value || {})) * 100).toFixed(1)}%<br>
        Trend: ${game.trend}
    `;
    
    // Temporäre Notification
    showNotification(detailHtml, 'info', 3000);
}

function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'info' ? '#2563eb' : type === 'success' ? '#059669' : '#dc2626'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 10000;
        max-width: 400px;
        font-size: 0.9rem;
    `;
    notification.innerHTML = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transition = 'opacity 0.3s ease';
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, duration);
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

// Erweiterte Test-Daten mit realistischen Profi-Spielen
function createProfessionalTestGames() {
    const leagues = ["Premier League", "Bundesliga", "La Liga", "Serie A", "Ligue 1", "Champions League"];
    const teams = {
        "Premier League": ["Manchester City", "Liverpool", "Arsenal", "Chelsea", "Manchester United", "Tottenham"],
        "Bundesliga": ["Bayern Munich", "Borussia Dortmund", "RB Leipzig", "Bayer Leverkusen", "Eintracht Frankfurt"],
        "La Liga": ["Real Madrid", "Barcelona", "Atletico Madrid", "Sevilla", "Valencia"],
        "Serie A": ["Inter Milan", "AC Milan", "Juventus", "Napoli", "Roma"],
        "Ligue 1": ["PSG", "Monaco", "Lyon", "Marseille", "Lille"],
        "Champions League": ["Real Madrid", "Bayern Munich", "Manchester City", "PSG", "Barcelona"]
    };

    return Array.from({length: 20}, (_, i) => {
        const league = leagues[i % leagues.length];
        const leagueTeams = teams[league];
        const homeTeam = leagueTeams[Math.floor(Math.random() * leagueTeams.length)];
        let awayTeam = leagueTeams[Math.floor(Math.random() * leagueTeams.length)];
        
        // Sicherstellen, dass nicht gleiche Teams spielen
        while (awayTeam === homeTeam) {
            awayTeam = leagueTeams[Math.floor(Math.random() * leagueTeams.length)];
        }

        const confidence = 0.65 + Math.random() * 0.3;
        const kiScore = kiEngine.calculateAdvancedKIScore({ confidence });
        
        // Realistischere Wahrscheinlichkeiten basierend auf Team-Stärke
        const homeStrength = getTeamStrength(homeTeam);
        const awayStrength = getTeamStrength(awayTeam);
        const homeProb = 0.3 + (homeStrength - awayStrength) * 0.3 + Math.random() * 0.2;
        const drawProb = 0.2 + Math.random() * 0.25;
        const awayProb = 1 - homeProb - drawProb;

        const game = {
            id: i + 1,
            home: homeTeam,
            away: awayTeam,
            homeLogo: `https://via.placeholder.com/32x24/2563eb/ffffff?text=${homeTeam.substring(0,2)}`,
            awayLogo: `https://via.placeholder.com/32x24/dc2626/ffffff?text=${awayTeam.substring(0,2)}`,
            league: league,
            date: new Date(Date.now() + (i - 10) * 86400000).toISOString(), // Gemischte Daten
            prob: {
                home: Math.max(0.1, Math.min(0.8, homeProb)),
                draw: Math.max(0.1, Math.min(0.4, drawProb)),
                away: Math.max(0.1, Math.min(0.7, awayProb))
            },
            over25: 0.4 + Math.random() * 0.5,
            btts: 0.35 + Math.random() * 0.4,
            confidence: confidence,
            kiScore: kiScore,
            value: {
                home: Math.random() * 0.3,
                draw: Math.random() * 0.25,
                away: Math.random() * 0.28,
                over25: Math.random() * 0.35
            },
            trend: generateRealisticTrend(homeProb, awayProb, drawProb)
        };

        // KI-Analyse hinzufügen
        game.analysis = kiEngine.generateProfessionalAnalysis(game);
        
        return game;
    });

    function getTeamStrength(team) {
        const strengths = {
            "Manchester City": 0.95, "Bayern Munich": 0.94, "Real Madrid": 0.93,
            "Liverpool": 0.90, "PSG": 0.89, "Barcelona": 0.88,
            "Arsenal": 0.85, "Inter Milan": 0.84, "Borussia Dortmund": 0.83,
            "default": 0.75
        };
        return strengths[team] || strengths.default;
    }

    function generateRealisticTrend(homeProb, awayProb, drawProb) {
        if (homeProb > 0.6) return "Strong Home";
        if (awayProb > 0.6) return "Strong Away";
        if (homeProb > 0.5) return "Home";
        if (awayProb > 0.5) return "Away";
        if (drawProb > 0.35) return "Draw";
        return "Balanced";
    }
}

async function loadGames() {
    if (isLoading) return;
    
    isLoading = true;
    loadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Lade...';
    loadBtn.disabled = true;

    try {
        // Show loading state
        premiumPicksDiv.innerHTML = topGamesDiv.innerHTML = gamesDiv.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <div>KI analysiert Spiele... <small>${kiEngine.modelVersion}</small></div>
            </div>
        `;

        let games = [];
        
        // Versuche echte Daten zu laden, fallback zu Testdaten
        try {
            let url = "/api/games";
            const params = new URLSearchParams();
            if (dateInput.value) params.append('date', dateInput.value);
            
            const queryString = params.toString();
            if (queryString) url += '?' + queryString;
            
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 10000
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data && Array.isArray(data.response)) {
                    games = data.response;
                    showNotification('✅ Live-Daten erfolgreich geladen', 'success', 2000);
                } else {
                    throw new Error('Ungültiges Datenformat von API');
                }
            } else {
                throw new Error(`API Fehler: ${res.status}`);
            }
        } catch (apiError) {
            console.log('API nicht verfügbar, verwende professionelle Testdaten:', apiError.message);
            games = createProfessionalTestGames();
            showNotification('📊 Testdaten geladen - KI-Analyse aktiv', 'info', 3000);
        }

        currentGames = games;
        filteredGames = [...games];

        // Filter anwenden
        applyFilters();

        // KI-Scores und Analysen berechnen
        filteredGames = filteredGames.map(game => {
            if (!game.kiScore) {
                game.kiScore = kiEngine.calculateAdvancedKIScore(game);
            }
            if (!game.analysis) {
                game.analysis = kiEngine.generateProfessionalAnalysis(game);
            }
            return game;
        });

        // Update statistics
        updateStatistics(filteredGames);

        // Premium Picks anzeigen
        displayPremiumPicks();

        // Top Games anzeigen
        displayTopGames();

        // Top Value Bets anzeigen
        displayTopValueBets();

        // Top Over 2.5 anzeigen
        displayTopOver25();

        // Alle anderen Spiele anzeigen
        displayAllGames();

    } catch (err) {
        console.error("Kritischer Fehler beim Laden:", err);
        showNotification(`❌ Fehler: ${err.message}`, 'error', 5000);
        
        gamesDiv.innerHTML = `
            <div class="loading">
                <i class="fas fa-exclamation-triangle" style="color: #dc2626;"></i>
                <div>Systemfehler: ${err.message}</div>
                <button onclick="loadGames()" class="btn-primary" style="margin-top: 1rem;">
                    <i class="fas fa-redo"></i> Erneut versuchen
                </button>
            </div>
        `;
    } finally {
        isLoading = false;
        loadBtn.innerHTML = '<i class="fas fa-robot"></i> KI-Analyse starten';
        loadBtn.disabled = false;
    }
} 
        
        
