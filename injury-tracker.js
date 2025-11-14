// injury-tracker.js - Professioneller Injury & Suspension Tracker
export class InjuryTracker {
    constructor() {
        this.teamInjuries = new Map();
        this.playerImpact = {
            'goalkeeper': 1.2,
            'defender': 1.0,
            'midfielder': 0.9,
            'forward': 0.8
        };
    }

    // Verletzungen für ein Team abrufen
    async getTeamInjuries(teamName) {
        // In einer echten Implementierung würde dies von einer API kommen
        const simulatedInjuries = this.simulateInjuries(teamName);
        
        const analysis = {
            team: teamName,
            missingPlayers: simulatedInjuries,
            overallImpact: this.calculateTeamImpact(simulatedInjuries),
            attackImpact: this.calculateAttackImpact(simulatedInjuries),
            defenseImpact: this.calculateDefenseImpact(simulatedInjuries),
            recommendations: this.generateRecommendations(simulatedInjuries)
        };
        
        this.teamInjuries.set(teamName, analysis);
        return analysis;
    }

    simulateInjuries(teamName) {
        const players = this.getTeamSquad(teamName);
        const injuries = [];
        
        // Simuliere 0-3 Verletzungen pro Team
        const injuryCount = Math.floor(Math.random() * 3);
        
        for (let i = 0; i < injuryCount; i++) {
            const player = players[Math.floor(Math.random() * players.length)];
            const injuryTypes = [
                { type: 'Muscle', severity: 'minor', duration: '1-2 weeks' },
                { type: 'Ligament', severity: 'moderate', duration: '3-4 weeks' },
                { type: 'Fracture', severity: 'major', duration: '2-3 months' },
                { type: 'Suspension', severity: 'minor', duration: '1 game' }
            ];
            
            const injury = injuryTypes[Math.floor(Math.random() * injuryTypes.length)];
            
            injuries.push({
                name: player.name,
                position: player.position,
                importance: player.importance,
                injuryType: injury.type,
                severity: injury.severity,
                expectedReturn: injury.duration,
                impact: this.calculatePlayerImpact(player, injury)
            });
        }
        
        return injuries;
    }

    calculatePlayerImpact(player, injury) {
        let impact = player.importance;
        
        // Verletzungsschwere anpassen
        const severityMultipliers = {
            'minor': 0.3,
            'moderate': 0.6, 
            'major': 0.9
        };
        
        impact *= severityMultipliers[injury.severity] || 0.5;
        
        // Positions-spezifischer Multiplikator
        impact *= this.playerImpact[player.position] || 1.0;
        
        return Math.min(1, impact);
    }

    calculateTeamImpact(injuries) {
        if (injuries.length === 0) return 0;
        
        const totalImpact = injuries.reduce((sum, injury) => sum + injury.impact, 0);
        return Math.min(1, totalImpact / 3); // Normalisiere auf 0-1 Skala
    }

    calculateAttackImpact(injuries) {
        const attackingInjuries = injuries.filter(i => 
            i.position === 'forward' || i.position === 'midfielder'
        );
        
        if (attackingInjuries.length === 0) return 0;
        
        const totalImpact = attackingInjuries.reduce((sum, injury) => sum + injury.impact, 0);
        return Math.min(1, totalImpact / 2);
    }

    calculateDefenseImpact(injuries) {
        const defenseInjuries = injuries.filter(i => 
            i.position === 'goalkeeper' || i.position === 'defender'
        );
        
        if (defenseInjuries.length === 0) return 0;
        
        const totalImpact = defenseInjuries.reduce((sum, injury) => sum + injury.impact, 0);
        return Math.min(1, totalImpact / 2);
    }

    generateRecommendations(injuries) {
        const recommendations = [];
        const teamImpact = this.calculateTeamImpact(injuries);
        
        if (teamImpact > 0.7) {
            recommendations.push({
                type: 'high',
                message: 'Kritische Verletzungssituation - Team stark geschwächt',
                suggestion: 'Gegen dieses Team wetten vermeiden'
            });
        } else if (teamImpact > 0.4) {
            recommendations.push({
                type: 'medium',
                message: 'Mehrere Schlüsselspieler verletzt',
                suggestion: 'Vorsicht bei Wetten auf dieses Team'
            });
        } else if (teamImpact > 0.1) {
            recommendations.push({
                type: 'low', 
                message: 'Geringfügige Verletzungen',
                suggestion: 'Kleine Auswirkungen auf Teamleistung'
            });
        }
        
        // Positions-spezifische Empfehlungen
        const gkInjured = injuries.some(i => i.position === 'goalkeeper' && i.impact > 0.3);
        const defenseInjured = injuries.some(i => i.position === 'defender' && i.impact > 0.3);
        const attackInjured = injuries.some(i => i.position === 'forward' && i.impact > 0.3);
        
        if (gkInjured) {
            recommendations.push({
                type: 'specific',
                message: 'Torhüter verletzt',
                suggestion: 'BTTS YES und Over 2.5 in Betracht ziehen'
            });
        }
        
        if (defenseInjured) {
            recommendations.push({
                type: 'specific',
                message: 'Verteidigung geschwächt',
                suggestion: 'Over 2.5 und Both Teams to Score favorisieren'
            });
        }
        
        if (attackInjured) {
            recommendations.push({
                type: 'specific',
                message: 'Angriff geschwächt', 
                suggestion: 'Under 2.5 und Clean Sheet in Erwägung ziehen'
            });
        }
        
        return recommendations;
    }

    getTeamSquad(teamName) {
        // Simulierte Kader-Daten
        const squads = {
            'Bayern Munich': [
                { name: 'Manuel Neuer', position: 'goalkeeper', importance: 0.9 },
                { name: 'Harry Kane', position: 'forward', importance: 0.95 },
                { name: 'Joshua Kimmich', position: 'midfielder', importance: 0.85 },
                { name: 'Matthijs de Ligt', position: 'defender', importance: 0.8 }
            ],
            'Borussia Dortmund': [
                { name: 'Gregor Kobel', position: 'goalkeeper', importance: 0.85 },
                { name: 'Marco Reus', position: 'forward', importance: 0.8 },
                { name: 'Jude Bellingham', position: 'midfielder', importance: 0.9 },
                { name: 'Mats Hummels', position: 'defender', importance: 0.75 }
            ],
            'default': [
                { name: 'Torhüter', position: 'goalkeeper', importance: 0.7 },
                { name: 'Stürmer', position: 'forward', importance: 0.6 },
                { name: 'Mittelfeld', position: 'midfielder', importance: 0.5 },
                { name: 'Verteidiger', position: 'defender', importance: 0.55 }
            ]
        };
        
        return squads[teamName] || squads.default;
    }

    // xG Korrekturen basierend auf Verletzungen
    applyInjuryCorrections(homeXG, awayXG, homeInjuries, awayInjuries) {
        const homeImpact = this.calculateTeamImpact(homeInjuries);
        const awayImpact = this.calculateTeamImpact(awayInjuries);
        
        const homeAttackImpact = this.calculateAttackImpact(homeInjuries);
        const homeDefenseImpact = this.calculateDefenseImpact(homeInjuries);
        const awayAttackImpact = this.calculateAttackImpact(awayInjuries);
        const awayDefenseImpact = this.calculateDefenseImpact(awayInjuries);
        
        // Korrigiere xG basierend auf Verletzungen
        const correctedHomeXG = homeXG * (1 - homeAttackImpact * 0.3) * (1 + awayDefenseImpact * 0.2);
        const correctedAwayXG = awayXG * (1 - awayAttackImpact * 0.3) * (1 + homeDefenseImpact * 0.2);
        
        return {
            home: Math.max(0.1, correctedHomeXG),
            away: Math.max(0.1, correctedAwayXG),
            homeImpact: homeImpact,
            awayImpact: awayImpact,
            corrections: {
                homeAttack: homeAttackImpact,
                homeDefense: homeDefenseImpact,
                awayAttack: awayAttackImpact,
                awayDefense: awayDefenseImpact
            }
        };
    }
}
