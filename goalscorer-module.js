// goalscorer-module.js - KI-Torschützen-Prognosen
export class GoalscorerPredictor {
    constructor() {
        this.playerDatabase = {
            // Premier League
            "Erling Haaland": { team: "Manchester City", goals: 25, xG: 0.95, shotAccuracy: 0.32 },
            "Mohamed Salah": { team: "Liverpool", goals: 18, xG: 0.72, shotAccuracy: 0.28 },
            "Harry Kane": { team: "Bayern Munich", goals: 22, xG: 0.85, shotAccuracy: 0.30 },
            "Kylian Mbappé": { team: "PSG", goals: 21, xG: 0.88, shotAccuracy: 0.31 },
            "Victor Osimhen": { team: "Napoli", goals: 16, xG: 0.65, shotAccuracy: 0.27 },
            "Lautaro Martínez": { team: "Inter Milan", goals: 19, xG: 0.70, shotAccuracy: 0.29 },
            "Robert Lewandowski": { team: "Barcelona", goals: 17, xG: 0.68, shotAccuracy: 0.26 },
            "Jude Bellingham": { team: "Real Madrid", goals: 14, xG: 0.45, shotAccuracy: 0.22 },
            
            // Deutsche Spieler
            "Serge Gnabry": { team: "Bayern Munich", goals: 11, xG: 0.38, shotAccuracy: 0.25 },
            "Jamal Musiala": { team: "Bayern Munich", goals: 9, xG: 0.32, shotAccuracy: 0.23 },
            "Florian Wirtz": { team: "Bayer Leverkusen", goals: 8, xG: 0.35, shotAccuracy: 0.24 },
            
            // Standard-Spieler für unbekannte Teams
            "default_striker": { team: "Unknown", goals: 12, xG: 0.45, shotAccuracy: 0.25 },
            "default_midfielder": { team: "Unknown", goals: 6, xG: 0.25, shotAccuracy: 0.18 }
        };
    }

    // KI-basierte Torschützen-Wahrscheinlichkeit
    calculateGoalscorerProbability(playerName, teamXG, isHome, opponentDefense) {
        const player = this.playerDatabase[playerName] || this.getDefaultPlayer(playerName);
        
        // Basis-Wahrscheinlichkeit basierend auf Spieler-Qualität
        let baseProbability = player.xG * 0.4;
        
        // Team-xG Einfluss
        baseProbability += teamXG * 0.3;
        
        // Gegnerische Verteidigung
        baseProbability *= (1 - opponentDefense / 4);
        
        // Heimvorteil
        if (isHome) {
            baseProbability *= 1.15;
        }
        
        // Form-Faktor (simuliert)
        const formFactor = 0.9 + (Math.random() * 0.2);
        baseProbability *= formFactor;
        
        return Math.min(0.4, Math.max(0.02, baseProbability));
    }

    // Top-Torschützen für ein Team vorhersagen
    predictTopGoalscorers(teamName, teamXG, isHome, opponentDefense, count = 3) {
        const teamPlayers = this.getTeamPlayers(teamName);
        
        const playersWithProbabilities = teamPlayers.map(player => {
            const probability = this.calculateGoalscorerProbability(
                player.name, 
                teamXG, 
                isHome, 
                opponentDefense
            );
            
            return {
                name: player.name,
                probability: probability,
                odds: this.calculateGoalscorerOdds(probability),
                value: this.calculateGoalscorerValue(probability, this.calculateGoalscorerOdds(probability)),
                confidence: this.calculateConfidence(player, teamXG)
            };
        });
        
        // Sortieren nach Wahrscheinlichkeit
        return playersWithProbabilities
            .sort((a, b) => b.probability - a.probability)
            .slice(0, count);
    }

    // Ersten Torschützen vorhersagen
    predictFirstGoalscorer(teamName, teamXG, isHome, opponentDefense) {
        const topScorers = this.predictTopGoalscorers(teamName, teamXG, isHome, opponentDefense, 5);
        
        if (topScorers.length === 0) return null;
        
        // Ersten Torschützen hat etwas höhere Wahrscheinlichkeit
        const firstScorer = { ...topScorers[0] };
        firstScorer.probability *= 1.3; // Erhöhte Chance für ersten Treffer
        firstScorer.probability = Math.min(0.25, firstScorer.probability);
        firstScorer.odds = this.calculateGoalscorerOdds(firstScorer.probability);
        firstScorer.value = this.calculateGoalscorerValue(firstScorer.probability, firstScorer.odds);
        firstScorer.type = "first";
        
        return firstScorer;
    }

    // Jeden Torschützen vorhersagen
    predictAnytimeGoalscorer(teamName, teamXG, isHome, opponentDefense) {
        const topScorers = this.predictTopGoalscorers(teamName, teamXG, isHome, opponentDefense, 5);
        
        return topScorers.map(scorer => ({
            ...scorer,
            type: "anytime"
        }));
    }

    // Odds für Torschützen berechnen
    calculateGoalscorerOdds(probability) {
        const margin = 0.15; // Höhere Marge für Torschützen
        return +(1 / (probability * (1 - margin))).toFixed(2);
    }

    // Value berechnen
    calculateGoalscorerValue(probability, odds) {
        if (!odds || odds <= 1) return 0;
        const value = (probability * odds) - 1;
        return +(Math.max(-1, value).toFixed(4));
    }

    // Konfidenz berechnen
    calculateConfidence(player, teamXG) {
        let confidence = 0.5;
        
        // Basierend auf Spieler-Statistiken
        if (player.goals > 15) confidence += 0.2;
        if (player.xG > 0.6) confidence += 0.15;
        if (player.shotAccuracy > 0.25) confidence += 0.1;
        
        // Team-Stärke
        confidence += (teamXG - 1.5) * 0.1;
        
        return Math.min(0.95, Math.max(0.3, confidence));
    }

    // Spieler-Datenbank
    getTeamPlayers(teamName) {
        const teamPlayers = {
            "Manchester City": [
                { name: "Erling Haaland", goals: 25, xG: 0.95, shotAccuracy: 0.32 },
                { name: "Phil Foden", goals: 11, xG: 0.35, shotAccuracy: 0.24 },
                { name: "Kevin De Bruyne", goals: 8, xG: 0.28, shotAccuracy: 0.21 }
            ],
            "Liverpool": [
                { name: "Mohamed Salah", goals: 18, xG: 0.72, shotAccuracy: 0.28 },
                { name: "Darwin Núñez", goals: 12, xG: 0.48, shotAccuracy: 0.23 },
                { name: "Diogo Jota", goals: 10, xG: 0.42, shotAccuracy: 0.25 }
            ],
            "Bayern Munich": [
                { name: "Harry Kane", goals: 22, xG: 0.85, shotAccuracy: 0.30 },
                { name: "Serge Gnabry", goals: 11, xG: 0.38, shotAccuracy: 0.25 },
                { name: "Jamal Musiala", goals: 9, xG: 0.32, shotAccuracy: 0.23 }
            ],
            "Real Madrid": [
                { name: "Jude Bellingham", goals: 14, xG: 0.45, shotAccuracy: 0.22 },
                { name: "Vinícius Júnior", goals: 13, xG: 0.52, shotAccuracy: 0.26 },
                { name: "Rodrygo", goals: 10, xG: 0.41, shotAccuracy: 0.24 }
            ],
            "Barcelona": [
                { name: "Robert Lewandowski", goals: 17, xG: 0.68, shotAccuracy: 0.26 },
                { name: "Ferran Torres", goals: 9, xG: 0.34, shotAccuracy: 0.22 },
                { name: "Raphinha", goals: 7, xG: 0.29, shotAccuracy: 0.20 }
            ],
            "Borussia Dortmund": [
                { name: "Niclas Füllkrug", goals: 12, xG: 0.42, shotAccuracy: 0.24 },
                { name: "Donyell Malen", goals: 9, xG: 0.35, shotAccuracy: 0.22 },
                { name: "Marco Reus", goals: 7, xG: 0.28, shotAccuracy: 0.20 }
            ],
            "RB Leipzig": [
                { name: "Lois Openda", goals: 14, xG: 0.52, shotAccuracy: 0.25 },
                { name: "Benjamin Šeško", goals: 8, xG: 0.32, shotAccuracy: 0.21 },
                { name: "Xavi Simons", goals: 6, xG: 0.25, shotAccuracy: 0.19 }
            ]
        };
        
        return teamPlayers[teamName] || [this.getDefaultPlayer(teamName)];
    }

    getDefaultPlayer(teamName) {
        // Entscheide basierend auf Team-Namen ob Stürmer oder Mittelfeld
        const isTopTeam = teamName.includes("City") || teamName.includes("Bayern") || 
                         teamName.includes("Real") || teamName.includes("Barcelona") ||
                         teamName.includes("Liverpool") || teamName.includes("Dortmund");
        
        return isTopTeam ? this.playerDatabase.default_striker : this.playerDatabase.default_midfielder;
    }

    // Torschützen-Analyse für ein Spiel
    analyzeMatchGoalscorers(homeTeam, awayTeam, homeXG, awayXG, homeStrength, awayStrength) {
        const homeScorers = this.predictAnytimeGoalscorer(homeTeam, homeXG, true, awayStrength.defense);
        const awayScorers = this.predictAnytimeGoalscorer(awayTeam, awayXG, false, homeStrength.defense);
        
        const firstHomeScorer = this.predictFirstGoalscorer(homeTeam, homeXG, true, awayStrength.defense);
        const firstAwayScorer = this.predictFirstGoalscorer(awayTeam, awayXG, false, homeStrength.defense);
        
        return {
            anytime: {
                home: homeScorers,
                away: awayScorers
            },
            first: {
                home: firstHomeScorer,
                away: firstAwayScorer
            },
            bestValue: this.findBestValueBets([...homeScorers, ...awayScorers], firstHomeScorer, firstAwayScorer)
        };
    }

    // Beste Value-Wetten finden
    findBestValueBets(anytimeScorers, firstHome, firstAway) {
        const allBets = [];
        
        // Anytime Scorer
        anytimeScorers.forEach(scorer => {
            if (scorer.value > 0.05) {
                allBets.push({
                    type: "Anytime Goalscorer",
                    player: scorer.name,
                    probability: scorer.probability,
                    odds: scorer.odds,
                    value: scorer.value,
                    confidence: scorer.confidence
                });
            }
        });
        
        // First Scorer
        if (firstHome && firstHome.value > 0.05) {
            allBets.push({
                type: "First Goalscorer",
                player: firstHome.name,
                probability: firstHome.probability,
                odds: firstHome.odds,
                value: firstHome.value,
                confidence: firstHome.confidence
            });
        }
        
        if (firstAway && firstAway.value > 0.05) {
            allBets.push({
                type: "First Goalscorer", 
                player: firstAway.name,
                probability: firstAway.probability,
                odds: firstAway.odds,
                value: firstAway.value,
                confidence: firstAway.confidence
            });
        }
        
        // Nach Value sortieren
        return allBets.sort((a, b) => b.value - a.value).slice(0, 5);
    }
}
