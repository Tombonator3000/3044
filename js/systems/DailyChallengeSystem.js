/**
 * Geometry 3044 - Daily Challenge System
 * New challenges every day with special modifiers
 */

// Challenge modifiers
export const CHALLENGE_MODIFIERS = {
    mirror: {
        id: 'mirror',
        name: 'MIRROR MODE',
        description: 'Controls are reversed',
        icon: '🪞',
        apply: (gameState) => { gameState.mirrorControls = true; }
    },
    giant: {
        id: 'giant',
        name: 'GIANT ENEMIES',
        description: 'Enemies are 3x larger but slower',
        icon: '👹',
        apply: (gameState) => { gameState.enemySizeMultiplier = 3; gameState.enemySpeedMultiplier = 0.5; }
    },
    bulletHell: {
        id: 'bulletHell',
        name: 'BULLET HELL',
        description: 'Enemies fire 5x more bullets',
        icon: '🔥',
        apply: (gameState) => { gameState.enemyFireRateMultiplier = 5; }
    },
    speed: {
        id: 'speed',
        name: 'SPEED RUN',
        description: 'Everything moves 50% faster',
        icon: '⚡',
        apply: (gameState) => { gameState.globalSpeedMultiplier = 1.5; }
    },
    tiny: {
        id: 'tiny',
        name: 'TINY TERROR',
        description: 'Your ship is tiny but enemies are faster',
        icon: '🐜',
        apply: (gameState) => { gameState.playerSizeMultiplier = 0.5; gameState.enemySpeedMultiplier = 1.5; }
    },
    oneHit: {
        id: 'oneHit',
        name: 'ONE HIT WONDER',
        description: 'All enemies die in one hit, but so do you',
        icon: '💥',
        apply: (gameState) => { gameState.oneHitKill = true; }
    },
    noShield: {
        id: 'noShield',
        name: 'NO PROTECTION',
        description: 'Shield power-ups are disabled',
        icon: '🚫',
        apply: (gameState) => { gameState.noShields = true; }
    },
    doubleScore: {
        id: 'doubleScore',
        name: 'DOUBLE OR NOTHING',
        description: '2x score but enemies are tougher',
        icon: '💰',
        apply: (gameState) => { gameState.scoreMultiplier = 2; gameState.enemyHealthMultiplier = 2; }
    },
    invasion: {
        id: 'invasion',
        name: 'ALIEN INVASION',
        description: 'Continuous enemy spawn, no waves',
        icon: '👽',
        apply: (gameState) => { gameState.continuousSpawn = true; }
    },
    boss: {
        id: 'boss',
        name: 'BOSS BLITZ',
        description: 'Boss every 3 waves',
        icon: '👑',
        apply: (gameState) => { gameState.bossEveryNWaves = 3; }
    },
    slow: {
        id: 'slow',
        name: 'SLOW MOTION',
        description: 'Everything in slow motion, but you have 1 life',
        icon: '🐢',
        apply: (gameState) => { gameState.globalSpeedMultiplier = 0.5; gameState.lives = 1; }
    },
    chaos: {
        id: 'chaos',
        name: 'CHAOS MODE',
        description: 'Random modifiers change every 30 seconds',
        icon: '🎲',
        apply: (gameState) => { gameState.chaosMode = true; }
    }
};

// Days of the week have specific challenge types
const WEEKDAY_THEMES = {
    0: ['mirror', 'speed', 'slow'],         // Sunday - movement challenges
    1: ['giant', 'tiny', 'oneHit'],          // Monday - size challenges
    2: ['bulletHell', 'noShield', 'boss'],   // Tuesday - combat challenges
    3: ['doubleScore', 'invasion'],          // Wednesday - score challenges
    4: ['speed', 'chaos'],                   // Thursday - chaos
    5: ['giant', 'bulletHell', 'boss'],      // Friday - hard mode
    6: ['chaos', 'doubleScore', 'oneHit']    // Saturday - special
};

export class DailyChallengeSystem {
    constructor() {
        this.currentChallenge = null;
        this.challengeDate = null;
        this.challengeCompleted = false;
        this.challengeScore = 0;
        this.bestScore = 0;

        this.leaderboard = [];

        this.loadData();
        this.generateDailyChallenge();
    }

    /**
     * Load saved data
     */
    loadData() {
        try {
            const saved = localStorage.getItem('geometry3044_dailyChallenge');
            if (saved) {
                const data = JSON.parse(saved);
                this.bestScore = data.bestScore || 0;
                this.challengeDate = data.challengeDate;
                this.challengeCompleted = data.completed || false;
                this.challengeScore = data.score || 0;
            }
        } catch (e) {}
    }

    /**
     * Save data
     */
    saveData() {
        try {
            localStorage.setItem('geometry3044_dailyChallenge', JSON.stringify({
                challengeDate: this.challengeDate,
                completed: this.challengeCompleted,
                score: this.challengeScore,
                bestScore: this.bestScore
            }));
        } catch (e) {}
    }

    /**
     * Generate daily challenge based on current date
     */
    generateDailyChallenge() {
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];

        // Check if we need a new challenge
        if (this.challengeDate === dateString && this.currentChallenge) {
            return this.currentChallenge;
        }

        // Reset for new day
        if (this.challengeDate !== dateString) {
            this.challengeCompleted = false;
            this.challengeScore = 0;
        }

        this.challengeDate = dateString;

        // Use date as seed for deterministic challenge
        const seed = this.dateToSeed(today);
        const dayOfWeek = today.getDay();

        // Select modifiers based on day and seed
        const availableModifiers = WEEKDAY_THEMES[dayOfWeek];
        const modifierIndex = seed % availableModifiers.length;
        const modifierId = availableModifiers[modifierIndex];
        const modifier = CHALLENGE_MODIFIERS[modifierId];

        // Generate secondary modifier for harder challenges
        const hasSecondary = seed % 3 === 0;
        let secondaryModifier = null;

        if (hasSecondary) {
            const allModifiers = Object.keys(CHALLENGE_MODIFIERS).filter(m => m !== modifierId);
            const secondaryIndex = (seed * 7) % allModifiers.length;
            secondaryModifier = CHALLENGE_MODIFIERS[allModifiers[secondaryIndex]];
        }

        // Generate target score based on difficulty
        const baseTarget = 50000;
        const difficultyMultiplier = 1 + (dayOfWeek === 5 || dayOfWeek === 6 ? 0.5 : 0);
        const targetScore = Math.floor(baseTarget * difficultyMultiplier * (1 + (seed % 5) * 0.1));

        this.currentChallenge = {
            date: dateString,
            dayName: this.getDayName(dayOfWeek),
            primaryModifier: modifier,
            secondaryModifier,
            targetScore,
            reward: this.calculateReward(modifier, secondaryModifier),
            seed
        };

        this.saveData();
        return this.currentChallenge;
    }

    /**
     * Convert date to numeric seed
     */
    dateToSeed(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return year * 10000 + month * 100 + day;
    }

    /**
     * Get day name
     */
    getDayName(dayOfWeek) {
        const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        return days[dayOfWeek];
    }

    /**
     * Calculate reward multiplier
     */
    calculateReward(primary, secondary) {
        let base = 1.5;
        if (secondary) base += 0.5;

        // Harder modifiers give more reward
        const hardModifiers = ['bulletHell', 'oneHit', 'chaos', 'boss'];
        if (hardModifiers.includes(primary.id)) base += 0.5;
        if (secondary && hardModifiers.includes(secondary.id)) base += 0.3;

        return base;
    }

    /**
     * Apply challenge modifiers to game state
     */
    applyChallenge(gameState) {
        if (!this.currentChallenge) return;

        // Apply primary modifier
        this.currentChallenge.primaryModifier.apply(gameState);

        // Apply secondary modifier if present
        if (this.currentChallenge.secondaryModifier) {
            this.currentChallenge.secondaryModifier.apply(gameState);
        }

        gameState.isDailyChallenge = true;
        gameState.challengeTargetScore = this.currentChallenge.targetScore;
    }

    /**
     * Complete challenge with score
     */
    completeChallenge(score) {
        if (this.challengeCompleted) {
            // Already completed, but track best score
            if (score > this.challengeScore) {
                this.challengeScore = score;
            }
        } else {
            this.challengeScore = score;

            if (score >= this.currentChallenge.targetScore) {
                this.challengeCompleted = true;
            }
        }

        if (score > this.bestScore) {
            this.bestScore = score;
        }

        this.saveData();

        return {
            completed: this.challengeCompleted,
            score,
            targetScore: this.currentChallenge.targetScore,
            reward: this.challengeCompleted ? this.currentChallenge.reward : 0,
            isNewBest: score >= this.bestScore
        };
    }

    /**
     * Get time until next challenge
     */
    getTimeUntilNextChallenge() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const diff = tomorrow - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return { hours, minutes, total: diff };
    }

    /**
     * Draw daily challenge info
     */
    draw(ctx, canvas) {
        if (!this.currentChallenge) return;

        ctx.save();

        const x = canvas.logicalWidth / 2;
        const startY = 150;

        // Title
        ctx.font = 'bold 36px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd700';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffd700';
        ctx.fillText('DAILY CHALLENGE', x, 80);

        // Date
        ctx.font = '18px "Courier New", monospace';
        ctx.fillStyle = '#00ffff';
        ctx.fillText(`${this.currentChallenge.dayName} - ${this.currentChallenge.date}`, x, 110);

        // Primary modifier card
        this.drawModifierCard(ctx, x, startY, this.currentChallenge.primaryModifier, true);

        // Secondary modifier card (if present)
        if (this.currentChallenge.secondaryModifier) {
            ctx.font = 'bold 24px "Courier New", monospace';
            ctx.fillStyle = '#ff00ff';
            ctx.fillText('+', x, startY + 100);
            this.drawModifierCard(ctx, x, startY + 130, this.currentChallenge.secondaryModifier, false);
        }

        // Target score
        const targetY = this.currentChallenge.secondaryModifier ? startY + 250 : startY + 130;
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('TARGET SCORE', x, targetY);

        ctx.font = 'bold 32px "Courier New", monospace';
        ctx.fillStyle = this.challengeCompleted ? '#00ff00' : '#ffff00';
        ctx.fillText(this.currentChallenge.targetScore.toLocaleString(), x, targetY + 35);

        // Reward
        ctx.font = '16px "Courier New", monospace';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(`REWARD: x${this.currentChallenge.reward.toFixed(1)} SCORE BONUS`, x, targetY + 65);

        // Status
        if (this.challengeCompleted) {
            ctx.font = 'bold 24px "Courier New", monospace';
            ctx.fillStyle = '#00ff00';
            ctx.shadowColor = '#00ff00';
            ctx.fillText('CHALLENGE COMPLETE!', x, targetY + 110);

            ctx.font = '16px "Courier New", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`Your Score: ${this.challengeScore.toLocaleString()}`, x, targetY + 140);
        } else {
            ctx.font = '16px "Courier New", monospace';
            ctx.fillStyle = '#888888';
            ctx.fillText('Complete the challenge to earn bonus!', x, targetY + 100);
        }

        // Time remaining
        const timeLeft = this.getTimeUntilNextChallenge();
        ctx.font = '14px "Courier New", monospace';
        ctx.fillStyle = '#666666';
        ctx.fillText(`Next challenge in: ${timeLeft.hours}h ${timeLeft.minutes}m`, x, canvas.logicalHeight - 50);

        ctx.restore();
    }

    /**
     * Draw modifier card
     */
    drawModifierCard(ctx, x, y, modifier, isPrimary) {
        const width = 300;
        const height = 80;
        const cardX = x - width / 2;

        // Card background
        ctx.fillStyle = isPrimary ? '#2a1a3a' : '#1a2a3a';
        ctx.strokeStyle = isPrimary ? '#ff00ff' : '#00ffff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = ctx.strokeStyle;

        ctx.fillRect(cardX, y, width, height);
        ctx.strokeRect(cardX, y, width, height);

        // Icon
        ctx.font = '36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(modifier.icon, cardX + 40, y + 52);

        // Name
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = isPrimary ? '#ff00ff' : '#00ffff';
        ctx.fillText(modifier.name, cardX + 75, y + 32);

        // Description
        ctx.font = '12px "Courier New", monospace';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(modifier.description, cardX + 75, y + 55);
    }

    /**
     * Check if today's challenge is available
     */
    isChallengeAvailable() {
        const today = new Date().toISOString().split('T')[0];
        return this.challengeDate === today;
    }

    /**
     * Get challenge status
     */
    getStatus() {
        return {
            available: this.isChallengeAvailable(),
            completed: this.challengeCompleted,
            score: this.challengeScore,
            bestScore: this.bestScore,
            challenge: this.currentChallenge
        };
    }

    /**
     * Update chaos mode - randomly change modifiers every 30 seconds
     * Call this from the main game loop
     */
    updateChaosMode(gameState, deltaTime = 1) {
        if (!gameState || !gameState.chaosMode) return;

        // Initialize chaos timer if not set
        if (!gameState.chaosTimer) {
            gameState.chaosTimer = 0;
            gameState.chaosInterval = 30 * 60; // 30 seconds at 60fps
        }

        gameState.chaosTimer += deltaTime;

        // Change modifier every 30 seconds
        if (gameState.chaosTimer >= gameState.chaosInterval) {
            gameState.chaosTimer = 0;

            // Get list of possible modifiers (excluding chaos itself)
            const modifierKeys = Object.keys(CHALLENGE_MODIFIERS).filter(k => k !== 'chaos');
            const randomKey = modifierKeys[Math.floor(Math.random() * modifierKeys.length)];
            const randomModifier = CHALLENGE_MODIFIERS[randomKey];

            // Clear previous modifier effects
            this.clearModifierEffects(gameState);

            // Apply new random modifier
            randomModifier.apply(gameState);

            // Store current chaos modifier for display
            gameState.currentChaosModifier = randomModifier;

            console.log(`🎲 CHAOS MODE: Switching to ${randomModifier.name}`);
        }
    }

    /**
     * Clear modifier effects before applying a new one in chaos mode
     */
    clearModifierEffects(gameState) {
        // Reset all modifier-related properties
        gameState.mirrorControls = false;
        gameState.enemySizeMultiplier = 1;
        gameState.enemySpeedMultiplier = 1;
        gameState.enemyFireRateMultiplier = 1;
        gameState.globalSpeedMultiplier = 1;
        gameState.playerSizeMultiplier = 1;
        gameState.oneHitKill = false;
        gameState.noShields = false;
        gameState.enemyHealthMultiplier = 1;
        gameState.continuousSpawn = false;
        gameState.bossEveryNWaves = 0;
        // Note: don't clear chaosMode itself, lives, or scoreMultiplier
    }
}
