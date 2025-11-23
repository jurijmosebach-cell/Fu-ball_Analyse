// social-sentiment-analyzer.js - Advanced Social Media Sentiment Analysis
export class SocialSentimentAnalyzer {
    constructor() {
        this.sentimentData = new Map();
        this.teamKeywords = new Map();
        this.fanBaseMetrics = new Map();
        this.crisisPatterns = new Map();
        
        this.initializeTeamKeywords();
        this.initializeFanBaseMetrics();
        this.initializeCrisisPatterns();
    }

    // INITIALISIERUNG DER DATENBANKEN
    initializeTeamKeywords() {
        this.teamKeywords.set("Manchester City", {
            positive: ["champions", "pep masterclass", "haaland goal", "dominant", "beautiful football"],
            negative: ["bottlers", "ucl curse", "financial fair play", "overrated"],
            neutral: ["city", "sky blues", "etihad"]
        });

        this.teamKeywords.set("Bayern Munich", {
            positive: ["bayern machine", "bundesliga kings", "kane record", "efficient", "european giants"],
            negative: ["tuchel out", "krise", "defensive issues", "leverkusen champions"],
            neutral: ["bayern", "fcb", "allianz arena"]
        });

        this.teamKeywords.set("Borussia Dortmund", {
            positive: ["yellow wall", "signal iduna park", "young talents", "reus legend", "passionate"],
            negative: ["bottling", "defensive mistakes", "bayern shadow", "inconsistent"],
            neutral: ["bvb", "schwarzgelben", "westfalenstadion"]
        });

        this.teamKeywords.set("Real Madrid", {
            positive: ["kings of europe", "galacticos", "vini jr magic", "bernabeu", "winning mentality"],
            negative: ["benzema missing", "defensive gaps", "overreliance veterans"],
            neutral: ["madrid", "los blancos", "santiago bernabeu"]
        });

        this.teamKeywords.set("Liverpool", {
            positive: ["anfield night", "klopp effect", "heavy metal football", "salah goal", "passionate fans"],
            negative: ["transition phase", "aging squad", "defensive issues", "inconsistent"],
            neutral: ["reds", "anfield", "youll never walk alone"]
        });

        // Weitere Teams...
        this.teamKeywords.set("default", {
            positive: ["win", "great", "amazing", "brilliant", "fantastic"],
            negative: ["loss", "terrible", "awful", "disaster", "embarrassing"],
            neutral: ["match", "game", "play", "team"]
        });
    }

    initializeFanBaseMetrics() {
        this.fanBaseMetrics.set("Borussia Dortmund", {
            passion: 0.95,
            patience: 0.6,
            expectation: 0.8,
            reactionSpeed: 0.9  // Schnelle emotionale Reaktion
        });

        this.fanBaseMetrics.set("Manchester City", {
            passion: 0.75,
            patience: 0.8,
            expectation: 0.95, // Hohe Erwartungen
            reactionSpeed: 0.7
        });

        this.fanBaseMetrics.set("Bayern Munich", {
            passion: 0.85,
            patience: 0.5,     // Wenig Geduld bei Niederlagen
            expectation: 0.98, // Sehr hohe Erwartungen
            reactionSpeed: 0.8
        });

        this.fanBaseMetrics.set("default", {
            passion: 0.7,
            patience: 0.7,
            expectation: 0.7,
            reactionSpeed: 0.7
        });
    }

    initializeCrisisPatterns() {
        this.crisisPatterns.set("manager_crisis", {
            keywords: ["sack", "fire", "out", "resign", "replacement"],
            threshold: 0.7,
            impact: -0.15
        });

        this.crisisPatterns.set("player_rebellion", {
            keywords: ["mutiny", "rebellion", "dressing room", "divided", "conflict"],
            threshold: 0.8,
            impact: -0.20
        });

        this.crisisPatterns.set("transfer_chaos", {
            keywords: ["transfer request", "want out", "leave", "agent meeting"],
            threshold: 0.6,
            impact: -0.12
        });

        this.crisisPatterns.set("injury_crisis", {
            keywords: ["injury crisis", "all injured", "medical room", "treatment table"],
            threshold: 0.65,
            impact: -0.18
        });
    }

    // HAUPTANALYSE METHODE
    async analyzeTeamSentiment(teamName, context = {}) {
        try {
            // Simulierte Social Media Daten sammeln
            const socialData = await this.collectSimulatedSocialData(teamName, context);
            
            // Sentiment Analyse durchführen
            const sentimentResult = this.analyzeSentimentData(socialData, teamName);
            
            // Krisen-Erkennung
            const crisisAnalysis = this.detectCrisisPatterns(sentimentResult, teamName);
            
            // Performance Impact berechnen
            const performanceImpact = this.calculatePerformanceImpact(sentimentResult, crisisAnalysis, teamName);
            
            return {
                team: teamName,
                sentimentScore: sentimentResult.overallScore,
                confidence: sentimentResult.confidence,
                dominantEmotion: sentimentResult.dominantEmotion,
                keyThemes: sentimentResult.keyThemes,
                crisisAlerts: crisisAnalysis.alerts,
                fanMood: sentimentResult.fanMood,
                performanceImpact: performanceImpact,
                recommendation: this.generateSentimentRecommendation(sentimentResult, crisisAnalysis),
                dataPoints: socialData.length,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error(`Error in sentiment analysis for ${teamName}:`, error);
            return this.getFallbackSentiment(teamName);
        }
    }

    // SIMULIERTE SOCIAL MEDIA DATEN
    async collectSimulatedSocialData(teamName, context) {
        const keywords = this.teamKeywords.get(teamName) || this.teamKeywords.get("default");
        const fanMetrics = this.fanBaseMetrics.get(teamName) || this.fanBaseMetrics.get("default");
        
        // Kontext-basierte Sentiment-Simulation
        const recentForm = context.recentForm || "average";
        const nextOpponent = context.nextOpponent || "unknown";
        const isHomeGame = context.isHomeGame !== undefined ? context.isHomeGame : true;
        
        const posts = [];
        const postCount = 50 + Math.floor(Math.random() * 100); // 50-150 Posts
        
        for (let i = 0; i < postCount; i++) {
            const sentiment = this.generateSimulatedSentiment(recentForm, fanMetrics);
            const post = this.generateSimulatedPost(teamName, keywords, sentiment, context);
            posts.push(post);
        }
        
        return posts;
    }

    generateSimulatedSentiment(recentForm, fanMetrics) {
        let baseSentiment = 0.5; // Neutral
        
        // Form-basierte Anpassung
        if (recentForm === "excellent") baseSentiment += 0.3;
        else if (recentForm === "good") baseSentiment += 0.15;
        else if (recentForm === "poor") baseSentiment -= 0.2;
        else if (recentForm === "terrible") baseSentiment -= 0.35;
        
        // Fan-Patience Faktor
        baseSentiment += (fanMetrics.patience - 0.5) * 0.1;
        
        // Zufällige Variation
        baseSentiment += (Math.random() - 0.5) * 0.2;
        
        return Math.max(0, Math.min(1, baseSentiment));
    }

    generateSimulatedPost(teamName, keywords, sentiment, context) {
        const sentimentType = sentiment > 0.6 ? "positive" : sentiment < 0.4 ? "negative" : "neutral";
        const wordPool = keywords[sentimentType];
        
        const templates = {
            positive: [
                `Great performance from ${teamName}! ${this.getRandomWord(wordPool)}`,
                `So proud of ${teamName} today! ${this.getRandomWord(wordPool)}`,
                `${teamName} showing why they're champions! ${this.getRandomWord(wordPool)}`
            ],
            negative: [
                `Disappointing from ${teamName}. ${this.getRandomWord(wordPool)}`,
                `${teamName} need to improve. ${this.getRandomWord(wordPool)}`,
                `Not good enough from ${teamName}. ${this.getRandomWord(wordPool)}`
            ],
            neutral: [
                `${teamName} match today. ${this.getRandomWord(wordPool)}`,
                `Looking forward to ${teamName} game. ${this.getRandomWord(wordPool)}`,
                `${teamName} needs to focus. ${this.getRandomWord(wordPool)}`
            ]
        };
        
        const template = templates[sentimentType];
        const text = template[Math.floor(Math.random() * template.length)];
        
        return {
            text,
            sentiment: sentimentType,
            confidence: 0.7 + Math.random() * 0.3,
            engagement: Math.floor(Math.random() * 1000),
            timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Letzte 7 Tage
        };
    }

    // SENTIMENT ANALYSE KERN
    analyzeSentimentData(posts, teamName) {
        let positiveScore = 0;
        let negativeScore = 0;
        let neutralScore = 0;
        let totalEngagement = 0;
        
        const themeCounts = new Map();
        const fanMetrics = this.fanBaseMetrics.get(teamName) || this.fanBaseMetrics.get("default");
        
        posts.forEach(post => {
            const engagementWeight = Math.log(post.engagement + 1) / 10; // Logarithmisches Engagement
            
            switch (post.sentiment) {
                case "positive":
                    positiveScore += post.confidence * engagementWeight;
                    break;
                case "negative":
                    negativeScore += post.confidence * engagementWeight;
                    break;
                default:
                    neutralScore += engagementWeight;
            }
            
            totalEngagement += engagementWeight;
            
            // Theme Extraction
            this.extractThemes(post.text, themeCounts);
        });
        
        const totalScore = positiveScore + negativeScore + neutralScore;
        const overallScore = totalScore > 0 ? (positiveScore - negativeScore) / totalScore : 0;
        
        return {
            overallScore: Math.max(-1, Math.min(1, overallScore)),
            confidence: Math.min(0.95, totalEngagement / 100), // Confidence basierend auf Engagement
            dominantEmotion: this.getDominantEmotion(positiveScore, negativeScore, neutralScore),
            keyThemes: this.getTopThemes(themeCounts, 5),
            fanMood: this.calculateFanMood(overallScore, fanMetrics),
            positiveScore: positiveScore / totalScore,
            negativeScore: negativeScore / totalScore,
            neutralScore: neutralScore / totalScore
        };
    }

    // KRISEN-ERKENNUNG
    detectCrisisPatterns(sentimentResult, teamName) {
        const alerts = [];
        let totalImpact = 0;
        
        for (const [crisisType, pattern] of this.crisisPatterns.entries()) {
            const crisisScore = this.calculateCrisisScore(sentimentResult, pattern);
            
            if (crisisScore > pattern.threshold) {
                alerts.push({
                    type: crisisType,
                    score: crisisScore,
                    impact: pattern.impact,
                    description: this.getCrisisDescription(crisisType, teamName)
                });
                totalImpact += pattern.impact;
            }
        }
        
        return {
            alerts,
            totalImpact: Math.max(-0.3, totalImpact), // Max -30% Impact
            hasCrisis: alerts.length > 0
        };
    }

    calculateCrisisScore(sentimentResult, pattern) {
        let score = 0;
        
        // Negative Sentiment als Basis
        score += sentimentResult.negativeScore * 0.6;
        
        // Theme-basierte Krisen-Signale
        const crisisThemes = sentimentResult.keyThemes.filter(theme =>
            pattern.keywords.some(keyword => 
                theme.toLowerCase().includes(keyword.toLowerCase())
            )
        );
        
        score += crisisThemes.length * 0.1;
        
        return Math.min(1, score);
    }

    // PERFORMANCE IMPACT BERECHNUNG
    calculatePerformanceImpact(sentimentResult, crisisAnalysis, teamName) {
        let impact = 0;
        
        // Basis Sentiment Impact
        impact += sentimentResult.overallScore * 0.15;
        
        // Krisen Impact
        impact += crisisAnalysis.totalImpact;
        
        // Fan Base spezifische Anpassung
        const fanMetrics = this.fanBaseMetrics.get(teamName) || this.fanBaseMetrics.get("default");
        
        // Passionate Fans können Performance boosten/bremsen
        if (sentimentResult.overallScore > 0.3) {
            impact += fanMetrics.passion * 0.05; // Positive Verstärkung
        } else if (sentimentResult.overallScore < -0.3) {
            impact -= fanMetrics.passion * 0.08; // Negative Verstärkung
        }
        
        return Math.max(-0.25, Math.min(0.25, impact));
    }

    // HILFSFUNKTIONEN
    getRandomWord(wordArray) {
        return wordArray[Math.floor(Math.random() * wordArray.length)];
    }

    extractThemes(text, themeCounts) {
        const words = text.toLowerCase().split(/\s+/);
        words.forEach(word => {
            if (word.length > 3) { // Ignoriere kurze Wörter
                themeCounts.set(word, (themeCounts.get(word) || 0) + 1);
            }
        });
    }

    getTopThemes(themeCounts, limit) {
        return Array.from(themeCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([theme]) => theme);
    }

    getDominantEmotion(positive, negative, neutral) {
        const max = Math.max(positive, negative, neutral);
        if (max === positive) return "positive";
        if (max === negative) return "negative";
        return "neutral";
    }

    calculateFanMood(sentimentScore, fanMetrics) {
        let mood = "neutral";
        
        if (sentimentScore > 0.3) mood = "euphoric";
        else if (sentimentScore > 0.1) mood = "optimistic";
        else if (sentimentScore < -0.3) mood = "angry";
        else if (sentimentScore < -0.1) mood = "frustrated";
        
        // Fan-Patient Anpassung
        if (mood === "angry" && fanMetrics.patience > 0.7) mood = "concerned";
        if (mood === "frustrated" && fanMetrics.patience > 0.8) mood = "patient";
        
        return mood;
    }

    getCrisisDescription(crisisType, teamName) {
        const descriptions = {
            manager_crisis: `${teamName} fans calling for manager change`,
            player_rebellion: `Dressing room unrest at ${teamName}`,
            transfer_chaos: `Transfer speculation affecting ${teamName}`,
            injury_crisis: `Injury problems mounting for ${teamName}`
        };
        return descriptions[crisisType] || "Team facing challenges";
    }

    generateSentimentRecommendation(sentimentResult, crisisAnalysis) {
        if (crisisAnalysis.hasCrisis) {
            return "Caution: Team in crisis - performance likely affected";
        }
        
        if (sentimentResult.overallScore > 0.2) {
            return "Positive momentum - team likely to perform well";
        }
        
        if (sentimentResult.overallScore < -0.2) {
            return "Negative sentiment - potential underperformance risk";
        }
        
        return "Neutral sentiment - standard analysis applies";
    }

    getFallbackSentiment(teamName) {
        return {
            team: teamName,
            sentimentScore: 0,
            confidence: 0.5,
            dominantEmotion: "neutral",
            keyThemes: [],
            crisisAlerts: [],
            fanMood: "neutral",
            performanceImpact: 0,
            recommendation: "Insufficient data for sentiment analysis",
            dataPoints: 0,
            timestamp: new Date().toISOString()
        };
    }

    // BATCH ANALYSE FÜR MEHRERE TEAMS
    async analyzeMultipleTeams(teamNames, context = {}) {
        const results = {};
        
        for (const teamName of teamNames) {
            results[teamName] = await this.analyzeTeamSentiment(teamName, context);
        }
        
        return results;
    }
 }
