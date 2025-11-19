// server-real.js — Professioneller Server mit echten API-Daten
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProfessionalCalculator } from './professional-calculations.js';
import { HDAAnalyzer } from './hda-analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// API Keys
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_API_KEY;

// Middleware
app.use(express.static(__dirname));
app.use(express.json());

// Professionelle KI-Module initialisieren
const proCalculator = new ProfessionalCalculator();
const hdaAnalyzer = new HDAAnalyzer();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '5.0.0',
        features: ['Echte API-Daten', 'Professionelle KI-Analyse', 'HDH-Analyse']
    });
});

// PROFESSIONELLE FOOTBALL DATA SERVICE
class ProfessionalFootballDataService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.football-data.org/v4';
    }

    async getMatchesByDate(date) {
        if (!this.apiKey) {
            console.log('❌ Kein Football-Data API Key konfiguriert');
            return [];
        }

        try {
            const dateFrom = new Date(date);
            const dateTo = new Date(date);
            dateTo.setDate(dateTo.getDate() + 1);

            const url = `${this.baseURL}/matches?dateFrom=${dateFrom.toISOString().split('T')[0]}&dateTo=${dateTo.toISOString().split('T')[0]}`;
            
            console.log('🔗 Fetching real data from Football-Data.org...');

            const response = await fetch(url, {
                headers: {
                    'X-Auth-Token': this.apiKey,
                    'Accept': 'application/json'
                },
                timeout: 15000
            });

            if (!response.ok) {
                throw new Error(`API Error ${response.status}: ${await response.text()}`);
            }

            const data = await response.json();
            
            const filteredMatches = data.matches?.filter(match => {
                if (!match.utcDate) return false;
                const matchDate = new Date(match.utcDate).toISOString().split('T')[0];
                return matchDate === date && (match.status === 'SCHEDULED' || match.status === 'TIMED' || match.status === 'LIVE');
            }) || [];

            console.log(`✅ ${filteredMatches.length} echte Spiele gefunden für ${date}`);
            
            return filteredMatches;

        } catch (error) {
            console.log('❌ Football-Data API error:', error.message);
            return [];
        }
    }
}

// PROFESSIONELLE TEAM-STRENGTHS FÜR xG-BERECHNUNG
const PROFESSIONAL_TEAM_STRENGTHS = {
    "Bayern Munich": { attack: 2.45, defense: 0.75, homeStrength: 1.25, awayStrength: 1.15 },
    "Borussia Dortmund": { attack: 2.15, defense: 1.12, homeStrength: 1.22, awayStrength: 1.12 },
    "Manchester City": { attack: 2.40, defense: 0.78, homeStrength: 1.24, awayStrength: 1.14 },
    "Liverpool": { attack: 2.25, defense: 0.92, homeStrength: 1.21, awayStrength: 1.11 },
    "Real Madrid": { attack: 2.35, defense: 0.85, homeStrength: 1.23, awayStrength: 1.13 },
    "Barcelona": { attack: 2.20, defense: 0.95, homeStrength: 1.20, awayStrength: 1.10 },
    "PSG": { attack: 2.30, defense: 0.88, homeStrength: 1.22, awayStrength: 1.08 },
    "Inter Milan": { attack: 2.10, defense: 0.90, homeStrength: 1.18, awayStrength: 1.05 },
    "AC Milan": { attack: 2.05, defense: 1.05, homeStrength: 1.17, awayStrength: 1.03 },
    "Arsenal": { attack: 2.15, defense: 0.85, homeStrength: 1.19, awayStrength: 1.07 },
    "Chelsea": { attack: 1.90, defense: 1.20, homeStrength: 1.16, awayStrength: 1.02 },
    "Atletico Madrid": { attack: 1.85, defense: 0.80, homeStrength: 1.17, awayStrength: 1.04 },
    "Juventus": { attack: 1.95, defense: 0.95, homeStrength: 1.18, awayStrength: 1.06 },
    "Napoli": { attack: 1.88, defense: 1.15, homeStrength: 1.16, awayStrength: 1.04 },
    "Leipzig": { attack: 2.05, defense: 1.15, homeStrength: 1.18, awayStrength: 1.06 },
    "Leverkusen": { attack: 2.10, defense: 1.08, homeStrength: 1.19, awayStrength: 1.07 },
    "default": { attack: 1.50, defense: 1.50, homeStrength: 1.10, awayStrength: 0.95 }
};

function getProfessionalTeamStrength(teamName) {
    for (const [team, strength] of Object.entries(PROFESSIONAL_TEAM_STRENGTHS)) {
        if (teamName.toLowerCase().includes(team.toLowerCase())) {
            return strength;
        }
    }
    return PROFESSIONAL_TEAM_STRENGTHS.default;
}

function getProfessionalFlag(teamName) {
    const flagMapping = {
        "Bayern": "de", "Dortmund": "de", "Leipzig": "de", "Leverkusen": "de", "Frankfurt": "de",
        "Manchester": "gb", "Liverpool": "gb", "Arsenal": "gb", "Chelsea": "gb", "Tottenham": "gb",
        "Real": "es", "Barcelona": "es", "Atletico": "es", "Sevilla": "es", "Valencia": "es",
        "PSG": "fr", "Marseille": "fr", "Lyon": "fr", "Monaco": "fr",
        "Inter": "it", "Milan": "it", "Juventus": "it", "Napoli": "it", "Roma": "it"
    };
    
    for (const [key, value] of Object.entries(flagMapping)) {
        if (teamName.toLowerCase().includes(key.toLowerCase())) {
            return value;
        }
    }
    return "eu";
}

// PROFESSIONELLE xG-BERECHNUNG
async function calculateProfessionalXG(homeTeam, awayTeam, league = "") {
    const homeStrength = getProfessionalTeamStrength(homeTeam);
    const awayStrength = getProfessionalTeamStrength(awayTeam);
    
    return proCalculator.calculateAdvancedXG(
        homeTeam, 
        awayTeam, 
        homeStrength, 
        awayStrength, 
        league
    );
}

// PROFESSIONELLE WAHRSCHEINLICHKEITEN
function computeProfessionalProbabilities(homeXG, awayXG, league) {
    return proCalculator.calculateAdvancedProbabilities(homeXG, awayXG, league);
}

// PROFESSIONELLE VALUE-BERECHNUNG
function calculateProfessionalValue(probabilities) {
    return proCalculator.calculateAdvancedValue(probabilities);
}

// PROFESSIONELLE TREND-ANALYSE
function computeProfessionalTrend(prob, xgData) {
    const home = prob.home || 0;
    const draw = prob.draw || 0;
    const away = prob.away || 0;
    
    if (home > 0.65 && home > away + 0.2) {
        return home > 0.75 ? "Strong Home" : "Home";
    } else if (away > 0.65 && away > home + 0.2) {
        return away > 0.75 ? "Strong Away" : "Away";
    } else if (draw > 0.35 && draw > home && draw > away) {
        return "Draw";
    } else if (Math.abs(home - away) < 0.15) {
        return "Balanced";
    } else if (home > away) {
        return home > 0.55 ? "Home" : "Slight Home";
    } else {
        return away > 0.55 ? "Away" : "Slight Away";
    }
}

// PROFESSIONELLE ANALYSE GENERIEREN
function generateProfessionalAnalysis(homeTeam, awayTeam, probabilities, trend, xgData, value) {
    const analysis = {
        summary: "",
        keyFactors: [],
        recommendation: "",
        riskLevel: "medium",
        confidence: xgData?.confidence || 0.5
    };

    const homeProb = probabilities.home || 0;
    const awayProb = probabilities.away || 0;
    const drawProb = probabilities.draw || 0;
    const bestValue = Math.max(
        value.home || 0,
        value.draw || 0,
        value.away || 0,
        value.over25 || 0
    );

    switch(trend) {
        case "Strong Home":
            analysis.summary = `${homeTeam} dominiert mit starker Heimplatzpräsenz (${Math.round(homeProb * 100)}% Siegwahrscheinlichkeit).`;
            analysis.recommendation = "Heimsieg empfehlenswert";
            analysis.riskLevel = "low";
            break;
        case "Strong Away":
            analysis.summary = `${awayTeam} zeigt überzeugende Auswärtsstärke (${Math.round(awayProb * 100)}% Siegchance).`;
            analysis.recommendation = "Auswärtssieg favorisieren";
            analysis.riskLevel = "low";
            break;
        case "Home":
            analysis.summary = `${homeTeam} hat klare Vorteile durch Heimspiel (${Math.round(homeProb * 100)}%).`;
            analysis.recommendation = "Leichter Heimplatzvorteil";
            analysis.riskLevel = "medium";
            break;
        case "Draw":
            analysis.summary = `Ausgeglichene Begegnung (${Math.round(drawProb * 100)}% Unentschieden).`;
            analysis.recommendation = "Unentschieden in Erwägung ziehen";
            analysis.riskLevel = "medium";
            break;
        default:
            analysis.summary = "Balanciertes Spiel ohne klaren Favoriten.";
            analysis.recommendation = "Vorsichtige Einschätzung";
            analysis.riskLevel = "high";
    }

    if (homeProb > 0.5) {
        analysis.keyFactors.push(`Heimstärke: ${Math.round(homeProb * 100)}%`);
    }
    if (awayProb > 0.5) {
        analysis.keyFactors.push(`Auswärtsstärke: ${Math.round(awayProb * 100)}%`);
    }
    if (bestValue > 0.1) {
        analysis.keyFactors.push(`Guter Value: ${(bestValue * 100).toFixed(1)}%`);
    }

    return analysis;
}

// CACHE FÜR PERFORMANCE
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 Minuten

const footballDataService = new ProfessionalFootballDataService(FOOTBALL_DATA_KEY);

// PROFESSIONELLE HAUPT-API ROUTE
app.get('/api/games', async (req, res) => {
    try {
        const requestedDate = req.query.date || new Date().toISOString().split('T')[0];
        console.log('🎯 Professional API Request for date:', requestedDate);
        
        const cacheKey = `professional-games-${requestedDate}`;
        
        // Cache prüfen
        const cached = cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
            console.log('✅ Serving from cache');
            return res.json({ 
                response: cached.data,
                info: { source: 'cache', date: requestedDate, cached: true }
            });
        }
        
        console.log('🔄 Fetching real match data from API...');
        const matches = await footballDataService.getMatchesByDate(requestedDate);
        
        if (matches.length === 0) {
            console.log('❌ Keine Spiele für dieses Datum gefunden');
            return res.json({
                response: [],
                info: {
                    date: requestedDate,
                    total: 0,
                    source: "football_data_api",
                    message: "Keine Spiele für dieses Datum gefunden"
                }
            });
        }

        console.log('🤖 Starting professional analysis for', matches.length, 'matches...');
        
        // Parallele Verarbeitung
        const enhancedGames = await Promise.all(
            matches.map(async (match) => {
                try {
                    const homeTeam = match.homeTeam?.name || "Unknown Home";
                    const awayTeam = match.awayTeam?.name || "Unknown Away";
                    const league = match.competition?.name || "Unknown League";
                    
                    console.log(`🔍 Analyzing: ${homeTeam} vs ${awayTeam} (${league})`);
                    
                    // PROFESSIONELLE xG-BERECHNUNG
                    const xgData = await calculateProfessionalXG(homeTeam, awayTeam, league);
                    
                    // WAHRSCHEINLICHKEITEN
                    const probabilities = computeProfessionalProbabilities(xgData.home, xgData.away, league);
                    
                    // VALUE-BERECHNUNG
                    const value = calculateProfessionalValue(probabilities);
                    
                    // TREND-ANALYSE
                    const trend = computeProfessionalTrend(probabilities, xgData);
                    
                    // HDH-ANALYSE
                    const hdaAnalysis = await hdaAnalyzer.analyzeHDA(homeTeam, awayTeam, league);
                    
                    // ANALYSE
                    const analysis = generateProfessionalAnalysis(homeTeam, awayTeam, probabilities, trend, xgData, value);

                    return {
                        id: match.id,
                        home: homeTeam,
                        away: awayTeam,
                        league: league,
                        date: match.utcDate,
                        homeLogo: `https://flagsapi.com/${getProfessionalFlag(homeTeam)}/flat/64.png`,
                        awayLogo: `https://flagsapi.com/${getProfessionalFlag(awayTeam)}/flat/64.png`,
                        
                        // xG Daten
                        homeXG: xgData.home,
                        awayXG: xgData.away,
                        quality: xgData.quality,
                        
                        // Wahrscheinlichkeiten
                        prob: {
                            home: probabilities.home,
                            draw: probabilities.draw,
                            away: probabilities.away
                        },
                        over25: probabilities.over25,
                        btts: probabilities.btts,
                        
                        // Value & Odds
                        value: value,
                        
                        // KI-Analyse
                        trend: trend,
                        confidence: xgData.confidence,
                        kiScore: 0.5 + (xgData.confidence * 0.3) + (Math.max(
                            value.home || 0,
                            value.draw || 0,
                            value.away || 0,
                            value.over25 || 0
                        ) * 0.2),
                        analysis: analysis,
                        
                        // HDH-Analyse
                        hdaAnalysis: hdaAnalysis,
                        
                        timestamp: new Date().toISOString()
                    };
                } catch (error) {
                    console.log(`❌ Error processing match ${match.id}:`, error.message);
                    return null;
                }
            })
        );

        // Filter und Sortierung
        const validGames = enhancedGames.filter(game => game !== null);
        validGames.sort((a, b) => (b.kiScore || 0) - (a.kiScore || 0));

        console.log(`✅ Professional analysis completed. Processed ${validGames.length} games`);

        const responseData = {
            response: validGames,
            info: {
                date: requestedDate,
                total: validGames.length,
                source: "football_data_api",
                version: "5.0.0",
                timestamp: new Date().toISOString()
            }
        };

        // Caching
        cache.set(cacheKey, {
            data: responseData.response,
            timestamp: Date.now()
        });

        res.json(responseData);

    } catch (error) {
        console.error('❌ Professional API Error:', error);
        res.status(500).json({
            error: error.message,
            info: {
                date: req.query.date,
                source: "api_error", 
                message: "Fehler beim Laden der Spieldaten"
            }
        });
    }
});

// Server starten
app.listen(PORT, () => {
    console.log(`🚀 Professional Server running on port ${PORT}`);
    console.log(`🤖 ProFoot Analytics v5.0.0 - Echte API-Daten`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🏆 Unterstützte Ligen: Alle Top-Ligen über Football-Data.org`);
});
