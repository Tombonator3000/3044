/**
 * Geometry 3044 - Game Mode Manager
 * Manages different game modes: Classic, Boss Rush, Pacifist, Time Attack, Survival
 */

export const GAME_MODES = {
    classic: {
        id: 'classic',
        name: 'CLASSIC',
        description: 'Standard arcade mode with waves of enemies',
        icon: '🎮',
        color: '#00ffff',
        settings: {
            lives: 3,
            bombs: 3,
            canShoot: true,
            timeLimit: 0,
            powerUps: true,
            enemySpawn: 'wave',
            scoreMultiplier: 1.0
        }
    },

    bossRush: {
        id: 'bossRush',
        name: 'BOSS RUSH',
        description: 'Face all 5 bosses in sequence',
        icon: '👑',
        color: '#ff0000',
        settings: {
            lives: 3,
            bombs: 5,
            canShoot: true,
            timeLimit: 0,
            powerUps: true,
            enemySpawn: 'boss',
            scoreMultiplier: 2.0,
            bossSequence: ['guardian', 'destroyer', 'phantom', 'mothership', 'overlord']
        },
        unlockCondition: { type: 'wave', value: 15 }
    },

    pacifist: {
        id: 'pacifist',
        name: 'PACIFIST',
        description: 'Survive without shooting - enemies destroy each other',
        icon: '☮️',
        color: '#00ff00',
        settings: {
            lives: 1,
            bombs: 0,
            canShoot: false,
            timeLimit: 0,
            powerUps: false,
            enemySpawn: 'continuous',
            scoreMultiplier: 3.0,
            enemyFriendlyFire: true
        },
        unlockCondition: { type: 'wave', value: 10 }
    },

    timeAttack: {
        id: 'timeAttack',
        name: 'TIME ATTACK',
        description: 'Score as high as possible in 3 minutes',
        icon: '⏱️',
        color: '#ffff00',
        settings: {
            lives: 999,
            bombs: 999,
            canShoot: true,
            timeLimit: 180,
            powerUps: true,
            enemySpawn: 'rush',
            scoreMultiplier: 1.5,
            deathPenalty: -5000
        },
        unlockCondition: { type: 'score', value: 100000 }
    },

    survival: {
        id: 'survival',
        name: 'SURVIVAL',
        description: 'One life, no power-ups - pure skill',
        icon: '💀',
        color: '#ff00ff',
        settings: {
            lives: 1,
            bombs: 1,
            canShoot: true,
            timeLimit: 0,
            powerUps: false,
            enemySpawn: 'hardcore',
            scoreMultiplier: 5.0
        },
        unlockCondition: { type: 'wave', value: 20 }
    }
};

export class GameModeManager {
    constructor() {
        this.modes = { ...GAME_MODES };
        this.currentMode = 'classic';
        this.modeState = {};

        // Mode-specific timers and counters
        this.timeRemaining = 0;
        this.bossIndex = 0;
        this.survivalTime = 0;

        this.loadUnlocks();
    }

    /**
     * Load unlocked modes
     */
    loadUnlocks() {
        try {
            const saved = localStorage.getItem('geometry3044_modes');
            if (saved) {
                const data = JSON.parse(saved);
                for (const modeId in data) {
                    if (this.modes[modeId]) {
                        this.modes[modeId].unlocked = data[modeId].unlocked;
                    }
                }
            }
        } catch (e) {}

        // Classic is always unlocked
        this.modes.classic.unlocked = true;
    }

    /**
     * Save unlocked modes
     */
    saveUnlocks() {
        try {
            const data = {};
            for (const modeId in this.modes) {
                data[modeId] = { unlocked: this.modes[modeId].unlocked || false };
            }
            localStorage.setItem('geometry3044_modes', JSON.stringify(data));
        } catch (e) {}
    }

    /**
     * Check and unlock modes based on stats
     */
    checkUnlocks(stats) {
        const newUnlocks = [];

        for (const modeId in this.modes) {
            const mode = this.modes[modeId];
            if (mode.unlocked || !mode.unlockCondition) continue;

            const condition = mode.unlockCondition;
            let unlocked = false;

            switch (condition.type) {
                case 'wave':
                    unlocked = (stats.maxWave || 0) >= condition.value;
                    break;
                case 'score':
                    unlocked = (stats.highScore || 0) >= condition.value;
                    break;
            }

            if (unlocked) {
                mode.unlocked = true;
                newUnlocks.push(mode);
                console.log(`🎮 Game mode unlocked: ${mode.name}`);
            }
        }

        if (newUnlocks.length > 0) {
            this.saveUnlocks();
        }

        return newUnlocks;
    }

    /**
     * Select a game mode
     */
    selectMode(modeId) {
        const mode = this.modes[modeId];
        if (!mode || (!mode.unlocked && mode.unlockCondition)) {
            return false;
        }

        this.currentMode = modeId;
        return true;
    }

    /**
     * Get current mode settings
     */
    getCurrentModeSettings() {
        return this.modes[this.currentMode]?.settings || GAME_MODES.classic.settings;
    }

    /**
     * Get current mode info
     */
    getCurrentMode() {
        return this.modes[this.currentMode] || GAME_MODES.classic;
    }

    /**
     * Initialize mode for a new game
     */
    initializeMode(gameState) {
        const mode = this.getCurrentMode();
        const settings = mode.settings;

        // Apply mode settings
        gameState.lives = settings.lives;
        gameState.bombs = settings.bombs;
        gameState.canShoot = settings.canShoot;
        gameState.scoreMultiplier = settings.scoreMultiplier;
        gameState.gameMode = this.currentMode;

        // Mode-specific initialization
        this.modeState = {};

        switch (this.currentMode) {
            case 'timeAttack':
                this.timeRemaining = settings.timeLimit * 60; // Convert to frames
                this.modeState.started = false;
                break;

            case 'bossRush':
                this.bossIndex = 0;
                this.modeState.currentBoss = settings.bossSequence[0];
                this.modeState.bossesDefeated = 0;
                break;

            case 'pacifist':
                this.survivalTime = 0;
                this.modeState.enemiesKilledByFriendlyFire = 0;
                break;

            case 'survival':
                this.modeState.waveReached = 0;
                break;
        }

        return settings;
    }

    /**
     * Update mode-specific logic
     */
    update(gameState, deltaTime = 1) {
        const mode = this.getCurrentMode();

        switch (this.currentMode) {
            case 'timeAttack':
                return this.updateTimeAttack(gameState, deltaTime);

            case 'bossRush':
                return this.updateBossRush(gameState);

            case 'pacifist':
                return this.updatePacifist(gameState, deltaTime);

            case 'survival':
                return this.updateSurvival(gameState);

            default:
                return { continue: true };
        }
    }

    /**
     * Time Attack mode update
     */
    updateTimeAttack(gameState, deltaTime) {
        if (!this.modeState.started && gameState.score > 0) {
            this.modeState.started = true;
        }

        if (this.modeState.started) {
            this.timeRemaining -= deltaTime;

            if (this.timeRemaining <= 0) {
                return {
                    continue: false,
                    reason: 'timeUp',
                    message: 'TIME UP!'
                };
            }
        }

        return {
            continue: true,
            timeRemaining: Math.ceil(this.timeRemaining / 60)
        };
    }

    /**
     * Boss Rush mode update
     */
    updateBossRush(gameState) {
        const settings = this.getCurrentModeSettings();

        // Check if current boss is defeated
        if (!gameState.boss || !gameState.boss.active) {
            if (this.bossIndex < settings.bossSequence.length) {
                // Spawn next boss
                this.modeState.currentBoss = settings.bossSequence[this.bossIndex];
                this.bossIndex++;
                this.modeState.bossesDefeated++;

                return {
                    continue: true,
                    spawnBoss: this.modeState.currentBoss,
                    bossNumber: this.bossIndex,
                    totalBosses: settings.bossSequence.length
                };
            } else {
                // All bosses defeated!
                return {
                    continue: false,
                    reason: 'victory',
                    message: 'BOSS RUSH COMPLETE!'
                };
            }
        }

        return {
            continue: true,
            currentBoss: this.bossIndex,
            totalBosses: settings.bossSequence.length
        };
    }

    /**
     * Pacifist mode update
     */
    updatePacifist(gameState, deltaTime) {
        this.survivalTime += deltaTime / 60; // In seconds

        // Check for enemy friendly fire kills
        // (This would need to be tracked in the collision system)

        return {
            continue: true,
            survivalTime: Math.floor(this.survivalTime),
            enemiesKilled: this.modeState.enemiesKilledByFriendlyFire || 0
        };
    }

    /**
     * Survival mode update
     */
    updateSurvival(gameState) {
        this.modeState.waveReached = Math.max(this.modeState.waveReached, gameState.wave);

        return {
            continue: true,
            waveReached: this.modeState.waveReached
        };
    }

    /**
     * Handle player death in current mode
     */
    handleDeath(gameState) {
        const settings = this.getCurrentModeSettings();

        switch (this.currentMode) {
            case 'timeAttack':
                if (settings.deathPenalty) {
                    gameState.score = Math.max(0, gameState.score + settings.deathPenalty);
                }
                return { respawn: true };

            case 'pacifist':
            case 'survival':
                return {
                    respawn: false,
                    gameOver: true,
                    finalStats: {
                        survivalTime: this.survivalTime,
                        wave: gameState.wave
                    }
                };

            default:
                return { respawn: gameState.lives > 0 };
        }
    }

    /**
     * Get mode-specific HUD info
     */
    getHUDInfo() {
        const mode = this.getCurrentMode();

        switch (this.currentMode) {
            case 'timeAttack':
                return {
                    showTimer: true,
                    timeRemaining: Math.ceil(this.timeRemaining / 60),
                    label: 'TIME'
                };

            case 'bossRush':
                return {
                    showBossProgress: true,
                    current: this.bossIndex,
                    total: mode.settings.bossSequence.length,
                    label: 'BOSS'
                };

            case 'pacifist':
                return {
                    showSurvivalTime: true,
                    survivalTime: Math.floor(this.survivalTime),
                    label: 'SURVIVAL'
                };

            case 'survival':
                return {
                    showMultiplier: true,
                    multiplier: mode.settings.scoreMultiplier,
                    label: 'x5 SCORE'
                };

            default:
                return null;
        }
    }

    /**
     * Draw mode selection screen
     */
    drawModeSelect(ctx, canvas, selectedIndex) {
        const modes = Object.values(this.modes);
        const cardWidth = 250;
        const cardHeight = 120;
        const spacing = 20;
        const startX = (canvas.logicalWidth - (cardWidth * 2 + spacing)) / 2;
        const startY = 150;

        ctx.save();

        // Title
        ctx.font = 'bold 36px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00ffff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        ctx.fillText('SELECT GAME MODE', canvas.logicalWidth / 2, 80);

        // Draw each mode
        modes.forEach((mode, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            const x = startX + col * (cardWidth + spacing);
            const y = startY + row * (cardHeight + spacing);
            const isSelected = index === selectedIndex;
            const isLocked = !mode.unlocked && mode.unlockCondition;

            // Card background
            ctx.fillStyle = isSelected ? '#333366' : '#1a1a2e';
            ctx.strokeStyle = isLocked ? '#666666' : mode.color;
            ctx.lineWidth = isSelected ? 3 : 1;
            ctx.shadowBlur = isSelected ? 15 : 5;
            ctx.shadowColor = isLocked ? '#333333' : mode.color;

            ctx.fillRect(x, y, cardWidth, cardHeight);
            ctx.strokeRect(x, y, cardWidth, cardHeight);

            // Icon
            ctx.globalAlpha = isLocked ? 0.5 : 1;
            ctx.font = '32px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(mode.icon, x + 15, y + 45);

            // Name
            ctx.font = 'bold 18px "Courier New", monospace';
            ctx.fillStyle = isLocked ? '#666666' : mode.color;
            ctx.fillText(mode.name, x + 60, y + 35);

            // Description
            ctx.font = '11px "Courier New", monospace';
            ctx.fillStyle = isLocked ? '#444444' : '#aaaaaa';
            const desc = isLocked ? `Unlock: ${this.getUnlockText(mode.unlockCondition)}` : mode.description;
            ctx.fillText(desc, x + 60, y + 55);

            // Multiplier
            if (!isLocked) {
                ctx.font = 'bold 12px "Courier New", monospace';
                ctx.fillStyle = '#ffd700';
                ctx.fillText(`x${mode.settings.scoreMultiplier} SCORE`, x + 60, y + 75);
            }

            // Lock icon
            if (isLocked) {
                ctx.font = '40px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#666666';
                ctx.fillText('🔒', x + cardWidth / 2, y + cardHeight / 2 + 10);
            }

            ctx.globalAlpha = 1;
        });

        ctx.restore();
    }

    /**
     * Get unlock condition text
     */
    getUnlockText(condition) {
        if (!condition) return '';

        switch (condition.type) {
            case 'wave':
                return `Reach Wave ${condition.value}`;
            case 'score':
                return `Score ${condition.value.toLocaleString()}`;
            default:
                return 'Complete requirements';
        }
    }

    /**
     * Get all available modes
     */
    getAllModes() {
        return Object.values(this.modes);
    }

    /**
     * Get unlocked modes
     */
    getUnlockedModes() {
        return Object.values(this.modes).filter(m => m.unlocked || !m.unlockCondition);
    }
}
