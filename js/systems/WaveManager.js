// ============================================
// GEOMETRY 3044 — WAVE MANAGER
// ============================================

import { config, getCurrentTheme } from '../config.js';
import { Enemy } from '../entities/Enemy.js';
import { logger } from '../utils/Logger.js';

// ============================================
// ENEMY SPAWN CONFIGURATION
// Data-driven configuration for enemy spawning
// ============================================

/**
 * Enemy type configuration: when they unlock and spawn behavior
 * - unlockWave: Wave number when this enemy type becomes available
 * - weight: Base spawn weight (higher = more common)
 * - lateGameBonus: Extra weight added at specified wave thresholds
 */
const ENEMY_CONFIG = {
    triangle:     { unlockWave: 1,  weight: 1 },
    square:       { unlockWave: 2,  weight: 1 },
    pixelinvader: { unlockWave: 3,  weight: 1 },
    pentagon:     { unlockWave: 4,  weight: 1 },
    ghostbyte:    { unlockWave: 5,  weight: 1 },
    divebomber:   { unlockWave: 6,  weight: 1, lateGameBonus: [{ wave: 10, extraWeight: 1 }] },
    laserdisc:    { unlockWave: 7,  weight: 1, lateGameBonus: [{ wave: 15, extraWeight: 1 }] },
    sinewave:     { unlockWave: 8,  weight: 1, lateGameBonus: [{ wave: 10, extraWeight: 1 }] },
    synthwave:    { unlockWave: 9,  weight: 1, lateGameBonus: [{ wave: 10, extraWeight: 1 }] },
    pixelskull:   { unlockWave: 10, weight: 1, lateGameBonus: [{ wave: 15, extraWeight: 1 }, { wave: 20, extraWeight: 1 }] },
    vhstracker:   { unlockWave: 12, weight: 1, lateGameBonus: [{ wave: 15, extraWeight: 1 }] },
    arcadeboss:   { unlockWave: 15, weight: 1, lateGameBonus: [{ wave: 20, extraWeight: 1 }] }
};

/**
 * Spawn position strategies for each enemy type
 * Each strategy is a function (canvas, padding) => { x, y }
 */
const SPAWN_STRATEGIES = {
    // Standard top spawn
    top: (canvas, padding) => ({
        x: padding + Math.random() * (canvas.logicalWidth - padding * 2),
        y: -5 - Math.random() * 10
    }),

    // Precise top spawn (no variation)
    topFixed: (canvas, padding) => ({
        x: padding + Math.random() * (canvas.logicalWidth - padding * 2),
        y: -5
    }),

    // Deep top spawn (for phasing enemies)
    topDeep: (canvas, padding) => ({
        x: padding + Math.random() * (canvas.logicalWidth - padding * 2),
        y: -10
    }),

    // Side spawn (left or right)
    sides: (canvas, padding) => ({
        x: Math.random() > 0.5 ? -5 : canvas.logicalWidth + 5,
        y: 50 + Math.random() * 100
    }),

    // Side spawn with more vertical range
    sidesWide: (canvas, padding) => ({
        x: Math.random() > 0.5 ? -5 : canvas.logicalWidth + 5,
        y: 30 + Math.random() * 150
    }),

    // Corner/mixed spawn (sides or top)
    mixed: (canvas, padding) => {
        if (Math.random() > 0.5) {
            return {
                x: Math.random() > 0.5 ? -5 : canvas.logicalWidth + 5,
                y: 50 + Math.random() * 100
            };
        }
        return {
            x: padding + Math.random() * (canvas.logicalWidth - padding * 2),
            y: -5
        };
    },

    // Center-top spread spawn
    centerTop: (canvas, padding) => ({
        x: canvas.logicalWidth * 0.3 + Math.random() * (canvas.logicalWidth * 0.4),
        y: -15
    }),

    // Wide center-top spawn
    centerTopWide: (canvas, padding) => ({
        x: canvas.logicalWidth * 0.2 + Math.random() * (canvas.logicalWidth * 0.6),
        y: -8
    })
};

/**
 * Sidescroller spawn strategies (enemies come from right)
 */
const SIDESCROLLER_SPAWN_STRATEGIES = {
    // Standard right spawn with full vertical range
    right: (canvas, padding) => ({
        x: canvas.logicalWidth + 5 + Math.random() * 10,
        y: padding + Math.random() * (canvas.logicalHeight - padding * 2)
    }),

    // Right spawn fixed position
    rightFixed: (canvas, padding) => ({
        x: canvas.logicalWidth + 5,
        y: padding + Math.random() * (canvas.logicalHeight - padding * 2)
    }),

    // Right spawn deep (for larger enemies)
    rightDeep: (canvas, padding) => ({
        x: canvas.logicalWidth + 10,
        y: padding + Math.random() * (canvas.logicalHeight - padding * 2)
    }),

    // Right spawn very deep (for bosses)
    rightVeryDeep: (canvas, padding) => ({
        x: canvas.logicalWidth + 15,
        y: canvas.logicalHeight * 0.3 + Math.random() * (canvas.logicalHeight * 0.4)
    }),

    // Center vertical
    rightCenter: (canvas, padding) => ({
        x: canvas.logicalWidth + 5,
        y: canvas.logicalHeight / 2
    }),

    // Center spread
    rightCenterSpread: (canvas, padding) => ({
        x: canvas.logicalWidth + 8,
        y: canvas.logicalHeight * 0.2 + Math.random() * (canvas.logicalHeight * 0.6)
    }),

    // Right or top/bottom edges
    rightOrEdges: (canvas, padding) => {
        if (Math.random() > 0.7) {
            return {
                x: canvas.logicalWidth + 5,
                y: padding + Math.random() * (canvas.logicalHeight - padding * 2)
            };
        }
        return {
            x: canvas.logicalWidth * 0.6 + Math.random() * (canvas.logicalWidth * 0.4),
            y: Math.random() > 0.5 ? -5 : canvas.logicalHeight + 5
        };
    }
};

/**
 * Enemy spawn position mapping
 * Maps enemy type to spawn strategy name
 */
const ENEMY_SPAWN_POSITIONS = {
    triangle:     { normal: 'top',          sidescroller: 'right' },
    square:       { normal: 'top',          sidescroller: 'right' },
    pentagon:     { normal: 'top',          sidescroller: 'right' },
    divebomber:   { normal: 'topFixed',     sidescroller: 'rightFixed' },
    sinewave:     { normal: 'sides',        sidescroller: 'rightCenter' },
    pixelskull:   { normal: 'topDeep',      sidescroller: 'rightDeep' },
    ghostbyte:    { normal: 'sidesWide',    sidescroller: 'rightFixed' },
    laserdisc:    { normal: 'mixed',        sidescroller: 'rightOrEdges' },
    vhstracker:   { normal: 'topDeep',      sidescroller: 'rightDeep' },
    arcadeboss:   { normal: 'centerTop',    sidescroller: 'rightVeryDeep' },
    synthwave:    { normal: 'centerTopWide', sidescroller: 'rightCenterSpread' },
    pixelinvader: { normal: 'topFixed',     sidescroller: 'rightFixed' }
};

// ============================================
// WAVE MANAGER CLASS
// ============================================

export class WaveManager {
    constructor() {
        this.wave = 1;
        this.enemiesPerWave = 5;
        this.enemiesSpawned = 0;
        this.spawnTimer = 0;
        this.spawnDelay = 90;  // Frames between spawns
        this.waveActive = false;
        this.waveComplete = false;
        this.waveStartDelay = 120;  // 2 seconds before wave starts
        this.waveStartTimer = 0;
        this.showingWaveText = false;
        this.waveTextTimer = 0;

        // Boss waves
        this.bossWaves = [5, 10, 15, 20, 25, 30];
    }

    startWave(waveNum, gameState = null) {
        this.wave = waveNum;
        this.enemiesSpawned = 0;
        this.waveComplete = false;
        this.showingWaveText = true;
        this.waveTextTimer = 120;  // Show wave text for 2 seconds
        this.waveStartTimer = this.waveStartDelay;
        this.waveActive = false;

        // Get difficulty settings
        const difficulty = gameState?.difficultySettings || { enemyCount: 1.0, spawnDelay: 1.0, waveScaling: 1.0 };
        this.currentDifficulty = difficulty;

        // Calculate enemies for this wave with difficulty multiplier
        const baseEnemies = this.calculateEnemiesPerWave(waveNum, difficulty.waveScaling);
        this.enemiesPerWave = Math.max(5, Math.floor(baseEnemies * difficulty.enemyCount));

        // Adjust spawn rate for higher waves (faster spawning) with difficulty multiplier
        // Wave 1: 60 frames, Wave 10: 30 frames, Wave 15+: 15 frames minimum
        const baseSpawnDelay = Math.max(15, 60 - (waveNum * 3));
        this.spawnDelay = Math.max(8, Math.floor(baseSpawnDelay * difficulty.spawnDelay));

        logger.game(`Wave ${waveNum} starting: ${this.enemiesPerWave} enemies, spawn delay: ${this.spawnDelay}, difficulty: ${difficulty.name || 'normal'}`);
    }

    calculateEnemiesPerWave(wave, waveScaling = 1.0) {
        // Base enemies + scaling (increased for more intense gameplay)
        // waveScaling affects how fast difficulty ramps up per wave
        const base = 10;
        const perWave = Math.floor(5 * waveScaling);
        const bonus = Math.floor(wave / 5) * Math.floor(8 * waveScaling);

        // Normal difficulty - Wave 1: 10 + 5 + 0 = 15 enemies
        // Easy difficulty (0.5x scaling) - Wave 1: 10 + 2 + 0 = 12 enemies
        // Extreme difficulty (1.8x scaling) - Wave 1: 10 + 9 + 0 = 19 enemies
        return base + (wave * perWave) + bonus;
    }

    /**
     * Build weighted pool of available enemy types for the current wave.
     * Uses ENEMY_CONFIG to determine which enemies are unlocked and their spawn weights.
     */
    getEnemyTypeForWave(wave) {
        const availableTypes = [];

        for (const [enemyType, config] of Object.entries(ENEMY_CONFIG)) {
            // Skip enemies not yet unlocked
            if (wave < config.unlockWave) continue;

            // Add base weight entries
            for (let i = 0; i < config.weight; i++) {
                availableTypes.push(enemyType);
            }

            // Add late-game bonus weights if applicable
            if (config.lateGameBonus) {
                for (const bonus of config.lateGameBonus) {
                    if (wave >= bonus.wave) {
                        for (let i = 0; i < bonus.extraWeight; i++) {
                            availableTypes.push(enemyType);
                        }
                    }
                }
            }
        }

        // Pick random from weighted pool
        return availableTypes[Math.floor(Math.random() * availableTypes.length)];
    }

    /**
     * Get spawn position for an enemy type.
     * Uses strategy pattern via ENEMY_SPAWN_POSITIONS and SPAWN_STRATEGIES.
     */
    getSpawnPosition(canvas, enemyType, sidescrollerMode = false) {
        const padding = 50;

        // Get spawn config for this enemy type, fallback to default
        const spawnConfig = ENEMY_SPAWN_POSITIONS[enemyType] || { normal: 'top', sidescroller: 'right' };

        if (sidescrollerMode) {
            const strategyName = spawnConfig.sidescroller;
            const strategy = SIDESCROLLER_SPAWN_STRATEGIES[strategyName];
            return strategy ? strategy(canvas, padding) : SIDESCROLLER_SPAWN_STRATEGIES.right(canvas, padding);
        }

        const strategyName = spawnConfig.normal;
        const strategy = SPAWN_STRATEGIES[strategyName];
        return strategy ? strategy(canvas, padding) : SPAWN_STRATEGIES.top(canvas, padding);
    }

    update(enemies, canvas, gameState) {
        // Show wave text countdown
        if (this.showingWaveText) {
            this.waveTextTimer--;
            if (this.waveTextTimer <= 0) {
                this.showingWaveText = false;
            }
        }

        // Wave start delay
        if (!this.waveActive && !this.waveComplete) {
            this.waveStartTimer--;
            if (this.waveStartTimer <= 0) {
                this.waveActive = true;
            }
            return;
        }

        // Don't spawn if wave complete (unless in continuous spawn mode)
        const continuousSpawn = gameState?.continuousSpawn || false;
        if (this.waveComplete && !continuousSpawn) return;

        // Spawn enemies
        this.spawnTimer--;

        // Check if we're in sidescroller mode
        const sidescrollerMode = gameState?.sidescrollerMode || false;

        // Daily Challenge: Continuous spawn mode - keep spawning endlessly
        const canSpawn = continuousSpawn || this.enemiesSpawned < this.enemiesPerWave;

        if (this.spawnTimer <= 0 && canSpawn) {
            const enemyType = this.getEnemyTypeForWave(this.wave);
            const pos = this.getSpawnPosition(canvas, enemyType, sidescrollerMode);

            const enemy = new Enemy(pos.x, pos.y, enemyType, gameState);
            // Mark enemy for sidescroller movement
            enemy.sidescrollerMode = sidescrollerMode;
            enemies.push(enemy);

            // Track encounter in bestiary (first time seeing this enemy type)
            if (gameState?.bestiary) {
                gameState.bestiary.recordEncounter(enemyType, this.wave);
            }

            this.enemiesSpawned++;
            this.spawnTimer = this.spawnDelay;

            // Spawn in pairs/groups for later waves (increased chance and earlier start)
            if (this.wave >= 3 && Math.random() < 0.5 && this.enemiesSpawned < this.enemiesPerWave) {
                const extraType = this.getEnemyTypeForWave(this.wave);
                const extraPos = this.getSpawnPosition(canvas, extraType, sidescrollerMode);
                const extraEnemy = new Enemy(extraPos.x, extraPos.y, extraType, gameState);
                extraEnemy.sidescrollerMode = sidescrollerMode;
                enemies.push(extraEnemy);

                // Track encounter in bestiary
                if (gameState?.bestiary) {
                    gameState.bestiary.recordEncounter(extraType, this.wave);
                }

                this.enemiesSpawned++;

                // Triple spawn chance for wave 10+
                if (this.wave >= 10 && Math.random() < 0.4 && this.enemiesSpawned < this.enemiesPerWave) {
                    const thirdType = this.getEnemyTypeForWave(this.wave);
                    const thirdPos = this.getSpawnPosition(canvas, thirdType, sidescrollerMode);
                    const thirdEnemy = new Enemy(thirdPos.x, thirdPos.y, thirdType, gameState);
                    thirdEnemy.sidescrollerMode = sidescrollerMode;
                    enemies.push(thirdEnemy);

                    // Track encounter in bestiary
                    if (gameState?.bestiary) {
                        gameState.bestiary.recordEncounter(thirdType, this.wave);
                    }

                    this.enemiesSpawned++;
                }
            }
        }

        // Check if wave is complete - count directly instead of filter()
        // Daily Challenge: Continuous spawn never completes waves
        if (continuousSpawn) {
            // In continuous spawn, waves don't complete - just keep spawning
            return;
        }

        let aliveEnemies = 0;
        for (let i = 0; i < enemies.length; i++) {
            if (enemies[i].active) aliveEnemies++;
        }

        if (this.enemiesSpawned >= this.enemiesPerWave && aliveEnemies === 0) {
            this.waveComplete = true;
            this.waveActive = false;
            console.log(`✅ Wave ${this.wave} complete!`);
        }
    }

    isWaveComplete() {
        return this.waveComplete;
    }

    isBossWave(gameState = null) {
        // Daily Challenge: Boss every N waves modifier
        if (gameState && gameState.bossEveryNWaves) {
            return this.wave % gameState.bossEveryNWaves === 0;
        }
        return this.bossWaves.includes(this.wave);
    }

    getWaveProgress() {
        if (this.enemiesPerWave === 0) return 0;
        return this.enemiesSpawned / this.enemiesPerWave;
    }

    drawWaveText(ctx, canvas, sidescrollerMode = false) {
        if (!this.showingWaveText) return;

        const theme = getCurrentTheme(this.wave);
        const alpha = Math.min(1, this.waveTextTimer / 30);
        const scale = 1 + (1 - this.waveTextTimer / 120) * 0.5;

        ctx.save();
        ctx.translate(canvas.logicalWidth / 2, canvas.logicalHeight / 2);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;

        // Wave number
        ctx.font = 'bold 72px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 30;
        ctx.shadowColor = theme.primary;

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;
        ctx.strokeText(`WAVE ${this.wave}`, 0, -20);

        ctx.fillStyle = theme.primary;
        ctx.fillText(`WAVE ${this.wave}`, 0, -20);

        // Theme name or sidescroller indicator
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.shadowColor = theme.secondary;
        ctx.fillStyle = theme.secondary;

        if (sidescrollerMode) {
            // Show R-TYPE style indicator for sidescroller waves
            ctx.fillText('R-TYPE ASSAULT', 0, 40);

            // Additional indicator
            ctx.font = 'bold 16px "Courier New", monospace';
            ctx.fillStyle = '#ff00ff';
            ctx.shadowColor = '#ff00ff';
            ctx.fillText('← HORIZONTAL ATTACK →', 0, 70);
        } else {
            ctx.fillText(theme.name, 0, 40);
        }

        ctx.restore();
    }
}
