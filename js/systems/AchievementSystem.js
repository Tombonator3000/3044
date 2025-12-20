/**
 * Geometry 3044 - Achievement System
 * Track player accomplishments with 80s-themed achievements
 */

export const ACHIEVEMENTS = {
    // Score achievements
    firstBlood: {
        id: 'firstBlood',
        name: 'FIRST BLOOD',
        description: 'Destroy your first enemy',
        icon: '💀',
        category: 'combat',
        condition: { type: 'kills', value: 1 },
        points: 10
    },
    centurion: {
        id: 'centurion',
        name: 'CENTURION',
        description: 'Destroy 100 enemies',
        icon: '⚔️',
        category: 'combat',
        condition: { type: 'kills', value: 100 },
        points: 50
    },
    terminator: {
        id: 'terminator',
        name: 'TERMINATOR',
        description: 'Destroy 1000 enemies',
        icon: '🤖',
        category: 'combat',
        condition: { type: 'kills', value: 1000 },
        points: 200
    },

    // Combo achievements
    radToTheMax: {
        id: 'radToTheMax',
        name: 'RAD TO THE MAX',
        description: 'Achieve a 100x combo',
        icon: '🔥',
        category: 'skill',
        condition: { type: 'maxCombo', value: 100 },
        points: 100
    },
    totallyTubular: {
        id: 'totallyTubular',
        name: 'TOTALLY TUBULAR',
        description: 'Clear wave 20',
        icon: '🌊',
        category: 'progress',
        condition: { type: 'wave', value: 20 },
        points: 150
    },
    bodacious: {
        id: 'bodacious',
        name: 'BODACIOUS',
        description: 'Defeat all 5 boss types',
        icon: '👑',
        category: 'combat',
        condition: { type: 'uniqueBosses', value: 5 },
        points: 300
    },

    // Grazing achievements
    gnarlyDude: {
        id: 'gnarlyDude',
        name: 'GNARLY DUDE',
        description: 'Graze 1000 bullets',
        icon: '💨',
        category: 'skill',
        condition: { type: 'grazes', value: 1000 },
        points: 200
    },
    bulletDancer: {
        id: 'bulletDancer',
        name: 'BULLET DANCER',
        description: 'Get a 50x graze streak',
        icon: '💃',
        category: 'skill',
        condition: { type: 'grazeStreak', value: 50 },
        points: 150
    },

    // Risk/Reward achievements
    dangerZone: {
        id: 'dangerZone',
        name: 'HIGHWAY TO THE DANGER ZONE',
        description: '50 point blank kills',
        icon: '✈️',
        category: 'skill',
        condition: { type: 'pointBlankKills', value: 50 },
        points: 150
    },
    tooCloseForMissiles: {
        id: 'tooCloseForMissiles',
        name: 'TOO CLOSE FOR MISSILES',
        description: '10 point blank kills in one game',
        icon: '🎯',
        category: 'skill',
        condition: { type: 'sessionPointBlankKills', value: 10 },
        points: 100
    },

    // Score achievements
    scoreMaster: {
        id: 'scoreMaster',
        name: 'SCORE MASTER',
        description: 'Score 1,000,000 points',
        icon: '🏆',
        category: 'score',
        condition: { type: 'highScore', value: 1000000 },
        points: 300
    },
    millionaire: {
        id: 'millionaire',
        name: 'MILLIONAIRE',
        description: 'Total lifetime score of 10,000,000',
        icon: '💰',
        category: 'score',
        condition: { type: 'totalScore', value: 10000000 },
        points: 500
    },

    // Survival achievements
    survivor: {
        id: 'survivor',
        name: 'SURVIVOR',
        description: 'Complete wave 30',
        icon: '🛡️',
        category: 'progress',
        condition: { type: 'wave', value: 30 },
        points: 250
    },
    untouchable: {
        id: 'untouchable',
        name: 'UNTOUCHABLE',
        description: 'Complete 5 waves without taking damage',
        icon: '👻',
        category: 'skill',
        condition: { type: 'wavesNoDamage', value: 5 },
        points: 200
    },

    // Boss achievements
    bossSlayer: {
        id: 'bossSlayer',
        name: 'BOSS SLAYER',
        description: 'Defeat 10 bosses',
        icon: '⚡',
        category: 'combat',
        condition: { type: 'bossKills', value: 10 },
        points: 150
    },
    nemesis: {
        id: 'nemesis',
        name: 'NEMESIS',
        description: 'Defeat a boss without taking damage',
        icon: '🎖️',
        category: 'skill',
        condition: { type: 'perfectBoss', value: 1 },
        points: 300
    },

    // Power-up achievements
    powerHungry: {
        id: 'powerHungry',
        name: 'POWER HUNGRY',
        description: 'Collect 500 power-ups',
        icon: '⭐',
        category: 'collection',
        condition: { type: 'powerUpsCollected', value: 500 },
        points: 100
    },
    legendaryFind: {
        id: 'legendaryFind',
        name: 'LEGENDARY FIND',
        description: 'Collect a legendary power-up',
        icon: '🌟',
        category: 'collection',
        condition: { type: 'legendaryPowerUps', value: 1 },
        points: 200
    },

    // Game mode achievements
    speedDemon: {
        id: 'speedDemon',
        name: 'SPEED DEMON',
        description: 'Reach wave 10 in Time Attack',
        icon: '⏱️',
        category: 'modes',
        condition: { type: 'timeAttackWave', value: 10 },
        points: 150
    },
    pacifist: {
        id: 'pacifist',
        name: 'PACIFIST',
        description: 'Survive 3 minutes in Pacifist mode',
        icon: '☮️',
        category: 'modes',
        condition: { type: 'pacifistTime', value: 180 },
        points: 200
    },
    oneLifeWarrior: {
        id: 'oneLifeWarrior',
        name: 'ONE LIFE WARRIOR',
        description: 'Reach wave 15 in Survival mode',
        icon: '💪',
        category: 'modes',
        condition: { type: 'survivalWave', value: 15 },
        points: 250
    },
    bossRusher: {
        id: 'bossRusher',
        name: 'BOSS RUSHER',
        description: 'Complete Boss Rush mode',
        icon: '🏃',
        category: 'modes',
        condition: { type: 'bossRushComplete', value: 1 },
        points: 300
    },

    // Special achievements
    retro: {
        id: 'retro',
        name: 'RETRO GAMER',
        description: 'Play 100 games',
        icon: '🕹️',
        category: 'dedication',
        condition: { type: 'gamesPlayed', value: 100 },
        points: 100
    },
    dedication: {
        id: 'dedication',
        name: 'DEDICATED',
        description: 'Play for 10 hours total',
        icon: '⏰',
        category: 'dedication',
        condition: { type: 'totalPlayTime', value: 36000 },
        points: 200
    },
    perfectionist: {
        id: 'perfectionist',
        name: 'PERFECTIONIST',
        description: 'Unlock all achievements',
        icon: '💯',
        category: 'meta',
        condition: { type: 'achievements', value: 24 }, // All other achievements
        points: 1000
    }
};

export class AchievementSystem {
    constructor() {
        this.achievements = {};
        this.unlockedAchievements = [];
        this.pendingNotifications = [];
        this.stats = this.loadStats();

        // Initialize achievements
        for (const id in ACHIEVEMENTS) {
            this.achievements[id] = {
                ...ACHIEVEMENTS[id],
                unlocked: false,
                unlockedAt: null
            };
        }

        this.loadProgress();
    }

    /**
     * Load achievement progress
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem('geometry3044_achievements');
            if (saved) {
                const data = JSON.parse(saved);
                for (const id in data) {
                    if (this.achievements[id]) {
                        this.achievements[id].unlocked = data[id].unlocked;
                        this.achievements[id].unlockedAt = data[id].unlockedAt;
                        if (data[id].unlocked) {
                            this.unlockedAchievements.push(id);
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to load achievements:', e);
        }
    }

    /**
     * Save achievement progress
     */
    saveProgress() {
        try {
            const data = {};
            for (const id in this.achievements) {
                data[id] = {
                    unlocked: this.achievements[id].unlocked,
                    unlockedAt: this.achievements[id].unlockedAt
                };
            }
            localStorage.setItem('geometry3044_achievements', JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save achievements:', e);
        }
    }

    /**
     * Load player stats
     */
    loadStats() {
        try {
            const saved = localStorage.getItem('geometry3044_stats');
            return saved ? JSON.parse(saved) : this.getDefaultStats();
        } catch (e) {
            return this.getDefaultStats();
        }
    }

    /**
     * Save player stats
     */
    saveStats() {
        try {
            localStorage.setItem('geometry3044_stats', JSON.stringify(this.stats));
        } catch (e) {}
    }

    /**
     * Get default stats
     */
    getDefaultStats() {
        return {
            kills: 0,
            maxCombo: 0,
            maxWave: 0,
            highScore: 0,
            totalScore: 0,
            grazes: 0,
            maxGrazeStreak: 0,
            pointBlankKills: 0,
            bossKills: 0,
            uniqueBosses: [],
            powerUpsCollected: 0,
            legendaryPowerUps: 0,
            gamesPlayed: 0,
            totalPlayTime: 0,
            wavesNoDamage: 0,
            perfectBoss: 0,
            sessionPointBlankKills: 0,
            timeAttackWave: 0,
            pacifistTime: 0,
            survivalWave: 0,
            bossRushComplete: 0
        };
    }

    /**
     * Update stats from game session
     * @param {Object} sessionStats - Stats from current game session
     */
    updateStats(sessionStats) {
        // Accumulate stats
        this.stats.kills += sessionStats.kills || 0;
        this.stats.totalScore += sessionStats.score || 0;
        this.stats.grazes += sessionStats.grazes || 0;
        this.stats.pointBlankKills += sessionStats.pointBlankKills || 0;
        this.stats.powerUpsCollected += sessionStats.powerUpsCollected || 0;
        this.stats.legendaryPowerUps += sessionStats.legendaryPowerUps || 0;
        this.stats.bossKills += sessionStats.bossKills || 0;
        this.stats.gamesPlayed++;

        // Track unique bosses
        if (sessionStats.bossType && !this.stats.uniqueBosses.includes(sessionStats.bossType)) {
            this.stats.uniqueBosses.push(sessionStats.bossType);
        }

        // Update max values
        this.stats.maxCombo = Math.max(this.stats.maxCombo, sessionStats.maxCombo || 0);
        this.stats.maxWave = Math.max(this.stats.maxWave, sessionStats.wave || 0);
        this.stats.highScore = Math.max(this.stats.highScore, sessionStats.score || 0);
        this.stats.maxGrazeStreak = Math.max(this.stats.maxGrazeStreak, sessionStats.maxGrazeStreak || 0);

        // Session-specific stats
        this.stats.sessionPointBlankKills = sessionStats.pointBlankKills || 0;
        this.stats.wavesNoDamage = Math.max(this.stats.wavesNoDamage, sessionStats.wavesNoDamage || 0);
        this.stats.perfectBoss = Math.max(this.stats.perfectBoss, sessionStats.perfectBoss || 0);

        // Game mode stats
        if (sessionStats.gameMode === 'timeAttack') {
            this.stats.timeAttackWave = Math.max(this.stats.timeAttackWave, sessionStats.wave || 0);
        }
        if (sessionStats.gameMode === 'pacifist') {
            this.stats.pacifistTime = Math.max(this.stats.pacifistTime, sessionStats.survivalTime || 0);
        }
        if (sessionStats.gameMode === 'survival') {
            this.stats.survivalWave = Math.max(this.stats.survivalWave, sessionStats.wave || 0);
        }
        if (sessionStats.gameMode === 'bossRush' && sessionStats.completed) {
            this.stats.bossRushComplete = 1;
        }

        this.saveStats();
        return this.checkAchievements();
    }

    /**
     * Check for newly unlocked achievements
     * @returns {Array} Newly unlocked achievements
     */
    checkAchievements() {
        const newlyUnlocked = [];

        for (const id in this.achievements) {
            const achievement = this.achievements[id];
            if (achievement.unlocked) continue;

            const condition = achievement.condition;
            let unlocked = false;

            switch (condition.type) {
                case 'kills':
                    unlocked = this.stats.kills >= condition.value;
                    break;
                case 'maxCombo':
                    unlocked = this.stats.maxCombo >= condition.value;
                    break;
                case 'wave':
                    unlocked = this.stats.maxWave >= condition.value;
                    break;
                case 'highScore':
                    unlocked = this.stats.highScore >= condition.value;
                    break;
                case 'totalScore':
                    unlocked = this.stats.totalScore >= condition.value;
                    break;
                case 'grazes':
                    unlocked = this.stats.grazes >= condition.value;
                    break;
                case 'grazeStreak':
                    unlocked = this.stats.maxGrazeStreak >= condition.value;
                    break;
                case 'pointBlankKills':
                    unlocked = this.stats.pointBlankKills >= condition.value;
                    break;
                case 'sessionPointBlankKills':
                    unlocked = this.stats.sessionPointBlankKills >= condition.value;
                    break;
                case 'bossKills':
                    unlocked = this.stats.bossKills >= condition.value;
                    break;
                case 'uniqueBosses':
                    unlocked = this.stats.uniqueBosses.length >= condition.value;
                    break;
                case 'powerUpsCollected':
                    unlocked = this.stats.powerUpsCollected >= condition.value;
                    break;
                case 'legendaryPowerUps':
                    unlocked = this.stats.legendaryPowerUps >= condition.value;
                    break;
                case 'gamesPlayed':
                    unlocked = this.stats.gamesPlayed >= condition.value;
                    break;
                case 'totalPlayTime':
                    unlocked = this.stats.totalPlayTime >= condition.value;
                    break;
                case 'wavesNoDamage':
                    unlocked = this.stats.wavesNoDamage >= condition.value;
                    break;
                case 'perfectBoss':
                    unlocked = this.stats.perfectBoss >= condition.value;
                    break;
                case 'timeAttackWave':
                    unlocked = this.stats.timeAttackWave >= condition.value;
                    break;
                case 'pacifistTime':
                    unlocked = this.stats.pacifistTime >= condition.value;
                    break;
                case 'survivalWave':
                    unlocked = this.stats.survivalWave >= condition.value;
                    break;
                case 'bossRushComplete':
                    unlocked = this.stats.bossRushComplete >= condition.value;
                    break;
                case 'achievements':
                    unlocked = this.unlockedAchievements.length >= condition.value;
                    break;
            }

            if (unlocked) {
                achievement.unlocked = true;
                achievement.unlockedAt = Date.now();
                this.unlockedAchievements.push(id);
                newlyUnlocked.push(achievement);
                this.pendingNotifications.push(achievement);
                console.log(`🏆 Achievement unlocked: ${achievement.name}`);
            }
        }

        if (newlyUnlocked.length > 0) {
            this.saveProgress();
        }

        return newlyUnlocked;
    }

    /**
     * Get next notification to display
     */
    getNextNotification() {
        return this.pendingNotifications.shift();
    }

    /**
     * Draw achievement notification
     */
    drawNotification(ctx, canvas, achievement, progress = 1) {
        if (!achievement) return;

        const width = 300;
        const height = 80;
        const x = canvas.logicalWidth - width - 20;
        const y = 20 + (1 - progress) * -100;
        const alpha = progress;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffd700';

        ctx.fillRect(x, y, width, height);
        ctx.strokeRect(x, y, width, height);

        // Icon
        ctx.font = '36px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(achievement.icon, x + 15, y + 50);

        // Text
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.fillStyle = '#ffd700';
        ctx.fillText('ACHIEVEMENT UNLOCKED!', x + 70, y + 25);

        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(achievement.name, x + 70, y + 45);

        ctx.font = '11px "Courier New", monospace';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(achievement.description, x + 70, y + 65);

        ctx.restore();
    }

    /**
     * Draw achievements list
     */
    drawAchievementsList(ctx, canvas, scrollOffset = 0) {
        const startY = 100 - scrollOffset;
        const cardHeight = 70;
        const cardWidth = 400;
        const startX = (canvas.logicalWidth - cardWidth) / 2;

        ctx.save();

        // Title
        ctx.font = 'bold 36px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd700';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffd700';
        ctx.fillText('ACHIEVEMENTS', canvas.logicalWidth / 2, 60);

        // Progress
        const unlocked = this.unlockedAchievements.length;
        const total = Object.keys(this.achievements).length;
        ctx.font = '16px "Courier New", monospace';
        ctx.fillStyle = '#00ffff';
        ctx.fillText(`${unlocked}/${total} Unlocked`, canvas.logicalWidth / 2, 85);

        // Draw each achievement
        let y = startY;
        for (const id in this.achievements) {
            const achievement = this.achievements[id];

            if (y > -cardHeight && y < canvas.logicalHeight) {
                const alpha = achievement.unlocked ? 1 : 0.5;
                ctx.globalAlpha = alpha;

                // Card background
                ctx.fillStyle = achievement.unlocked ? '#1a2a1a' : '#1a1a2e';
                ctx.strokeStyle = achievement.unlocked ? '#00ff00' : '#666666';
                ctx.lineWidth = 2;
                ctx.shadowBlur = achievement.unlocked ? 10 : 0;
                ctx.shadowColor = '#00ff00';

                ctx.fillRect(startX, y, cardWidth, cardHeight - 5);
                ctx.strokeRect(startX, y, cardWidth, cardHeight - 5);

                // Icon
                ctx.font = '28px sans-serif';
                ctx.textAlign = 'left';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(achievement.icon, startX + 15, y + 42);

                // Name
                ctx.font = 'bold 14px "Courier New", monospace';
                ctx.fillStyle = achievement.unlocked ? '#00ff00' : '#888888';
                ctx.fillText(achievement.name, startX + 60, y + 25);

                // Description
                ctx.font = '11px "Courier New", monospace';
                ctx.fillStyle = achievement.unlocked ? '#aaaaaa' : '#666666';
                ctx.fillText(achievement.description, startX + 60, y + 45);

                // Points
                ctx.textAlign = 'right';
                ctx.font = 'bold 12px "Courier New", monospace';
                ctx.fillStyle = '#ffd700';
                ctx.fillText(`${achievement.points} pts`, startX + cardWidth - 15, y + 25);

                // Category
                ctx.font = '10px "Courier New", monospace';
                ctx.fillStyle = '#888888';
                ctx.fillText(achievement.category.toUpperCase(), startX + cardWidth - 15, y + 45);
            }

            y += cardHeight;
        }

        ctx.restore();
    }

    /**
     * Get total achievement points
     */
    getTotalPoints() {
        return this.unlockedAchievements.reduce((sum, id) => {
            return sum + (this.achievements[id]?.points || 0);
        }, 0);
    }

    /**
     * Get achievement progress
     */
    getProgress() {
        return {
            unlocked: this.unlockedAchievements.length,
            total: Object.keys(this.achievements).length,
            points: this.getTotalPoints()
        };
    }

    /**
     * Reset all achievements (for testing)
     */
    reset() {
        for (const id in this.achievements) {
            this.achievements[id].unlocked = false;
            this.achievements[id].unlockedAt = null;
        }
        this.unlockedAchievements = [];
        this.stats = this.getDefaultStats();
        this.saveProgress();
        this.saveStats();
    }
}
