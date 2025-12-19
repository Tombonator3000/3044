/**
 * Geometry 3044 - WaveManager System Module
 * Handles enemy wave spawning, difficulty progression, and wave patterns
 */

import { CONFIG, getCurrentTheme } from '../config.js';
import { gameState, config } from '../globals.js';
import { Enemy } from '../entities/Enemy.js';

/**
 * WaveManager Class
 * Controls wave-based enemy spawning and progression
 */
export class WaveManager {
    constructor() {
        this.wave = 1;
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
        this.enemiesPerWave = CONFIG.waves.enemiesPerWave;
        this.spawnTimer = 0;
        this.spawnRate = CONFIG.waves.spawnRates.wave1_2;
        this.waveComplete = false;
        this.waveStarting = false;
        this.waveStartTimer = 0;
        this.waveStartDelay = 120; // 2 seconds at 60fps

        // Formation and pattern timers
        this.formationTimer = 0;
        this.swarmTimer = 0;
        this.miniBossTimer = 0;

        // Spawn weights for enemy types
        this.spawnWeights = {
            triangle: 40,
            square: 30,
            pentagon: 20,
            divebomber: 5,
            sinewave: 5
        };

        // Active enemies list reference
        this.enemies = [];
    }

    /**
     * Set the enemies array reference
     */
    setEnemiesArray(enemiesArray) {
        this.enemies = enemiesArray;
    }

    /**
     * Get current spawn rate based on wave
     */
    getSpawnRate() {
        if (this.wave <= 2) return CONFIG.waves.spawnRates.wave1_2;
        if (this.wave <= 4) return CONFIG.waves.spawnRates.wave3_4;
        if (this.wave <= 6) return CONFIG.waves.spawnRates.wave5_6;
        if (this.wave <= 10) return CONFIG.waves.spawnRates.wave7_10;
        return CONFIG.waves.spawnRates.wave11plus;
    }

    /**
     * Get max enemies on screen based on wave
     */
    getMaxEnemies() {
        return Math.min(
            CONFIG.waves.maxEnemiesOnScreen,
            CONFIG.waves.baseMaxEnemies + Math.floor(this.wave * CONFIG.waves.enemiesPerWaveIncrement)
        );
    }

    /**
     * Calculate enemies for current wave
     */
    getEnemiesForWave() {
        return Math.floor(CONFIG.waves.enemiesPerWave + (this.wave - 1) * 2);
    }

    /**
     * Update spawn weights based on wave
     */
    updateSpawnWeights() {
        // Adjust weights as waves progress
        if (this.wave >= 3) {
            this.spawnWeights.pentagon = 25;
            this.spawnWeights.sinewave = 10;
        }
        if (this.wave >= 5) {
            this.spawnWeights.divebomber = 10;
            this.spawnWeights.sinewave = 15;
        }
        if (this.wave >= 7) {
            this.spawnWeights.triangle = 30;
            this.spawnWeights.square = 25;
            this.spawnWeights.pentagon = 25;
            this.spawnWeights.divebomber = 10;
            this.spawnWeights.sinewave = 10;
        }
    }

    /**
     * Select enemy type based on weights
     */
    selectEnemyType() {
        const totalWeight = Object.values(this.spawnWeights).reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;

        for (const [type, weight] of Object.entries(this.spawnWeights)) {
            random -= weight;
            if (random <= 0) {
                return type;
            }
        }

        return 'triangle'; // Fallback
    }

    /**
     * Spawn a single enemy
     */
    spawnEnemy(type = null, x = null, y = null) {
        if (this.enemies.length >= this.getMaxEnemies()) {
            return null;
        }

        const enemyType = type || this.selectEnemyType();
        const spawnX = x !== null ? x : 50 + Math.random() * (config.width - 100);
        const spawnY = y !== null ? y : -30;

        const enemy = new Enemy(spawnX, spawnY, enemyType);
        this.enemies.push(enemy);
        this.enemiesSpawned++;

        return enemy;
    }

    /**
     * Spawn a formation of enemies
     */
    spawnFormation(pattern = 'v') {
        const formations = {
            'v': this.spawnVFormation.bind(this),
            'line': this.spawnLineFormation.bind(this),
            'diamond': this.spawnDiamondFormation.bind(this),
            'wall': this.spawnWallFormation.bind(this)
        };

        const spawnFn = formations[pattern] || formations['v'];
        spawnFn();
    }

    /**
     * Spawn V-shaped formation
     */
    spawnVFormation() {
        const centerX = config.width / 2;
        const startY = -30;
        const spacing = 40;

        // Leader
        const leader = this.spawnEnemy('pentagon', centerX, startY);
        if (leader) {
            leader.isFormationLeader = true;
        }

        // Wings
        for (let i = 1; i <= 3; i++) {
            this.spawnEnemy('triangle', centerX - i * spacing, startY - i * spacing * 0.5);
            this.spawnEnemy('triangle', centerX + i * spacing, startY - i * spacing * 0.5);
        }
    }

    /**
     * Spawn horizontal line formation
     */
    spawnLineFormation() {
        const count = Math.min(6, 3 + Math.floor(this.wave / 2));
        const spacing = config.width / (count + 1);
        const startY = -30;

        for (let i = 1; i <= count; i++) {
            this.spawnEnemy('square', spacing * i, startY);
        }
    }

    /**
     * Spawn diamond formation
     */
    spawnDiamondFormation() {
        const centerX = config.width / 2;
        const startY = -30;
        const spacing = 35;

        // Top point
        this.spawnEnemy('pentagon', centerX, startY);

        // Middle row
        this.spawnEnemy('square', centerX - spacing, startY - spacing);
        this.spawnEnemy('square', centerX + spacing, startY - spacing);

        // Bottom row
        this.spawnEnemy('triangle', centerX - spacing * 2, startY - spacing * 2);
        const center = this.spawnEnemy('sinewave', centerX, startY - spacing * 2);
        if (center) center.isElite = true;
        this.spawnEnemy('triangle', centerX + spacing * 2, startY - spacing * 2);

        // Bottom point
        this.spawnEnemy('pentagon', centerX, startY - spacing * 3);
    }

    /**
     * Spawn wall formation
     */
    spawnWallFormation() {
        const rows = 2;
        const cols = Math.min(8, 4 + Math.floor(this.wave / 3));
        const spacingX = config.width / (cols + 1);
        const spacingY = 40;

        for (let row = 0; row < rows; row++) {
            for (let col = 1; col <= cols; col++) {
                const type = row === 0 ? 'square' : 'triangle';
                this.spawnEnemy(type, spacingX * col, -30 - row * spacingY);
            }
        }
    }

    /**
     * Spawn a mini-boss
     */
    spawnMiniBoss() {
        const centerX = config.width / 2;
        const miniBoss = this.spawnEnemy('pentagon', centerX, -50);

        if (miniBoss) {
            miniBoss.isMiniBoss = true;
            miniBoss.hp *= 5;
            miniBoss.size *= 1.5;
            miniBoss.points *= 10;
            miniBoss.speed *= 0.7;
            console.log(`⚠️ Mini-boss spawned on wave ${this.wave}!`);
        }

        return miniBoss;
    }

    /**
     * Record enemy kill
     */
    onEnemyKilled(enemy) {
        this.enemiesKilled++;

        // Check wave completion
        if (this.enemiesKilled >= this.getEnemiesForWave() &&
            this.enemies.filter(e => e.active).length === 0) {
            this.completeWave();
        }
    }

    /**
     * Complete current wave
     */
    completeWave() {
        this.waveComplete = true;
        console.log(`✅ Wave ${this.wave} complete! Killed: ${this.enemiesKilled}`);
    }

    /**
     * Start next wave
     */
    nextWave() {
        this.wave++;
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
        this.waveComplete = false;
        this.waveStarting = true;
        this.waveStartTimer = this.waveStartDelay;
        this.spawnRate = this.getSpawnRate();
        this.updateSpawnWeights();

        console.log(`🌊 Wave ${this.wave} starting! Theme: ${getCurrentTheme(this.wave).name}`);
    }

    /**
     * Check if should spawn boss wave
     */
    isBossWave() {
        return this.wave % 5 === 0;
    }

    /**
     * Main update loop
     */
    update() {
        // Handle wave start delay
        if (this.waveStarting) {
            this.waveStartTimer--;
            if (this.waveStartTimer <= 0) {
                this.waveStarting = false;
            }
            return;
        }

        // Don't spawn if wave complete
        if (this.waveComplete) {
            return;
        }

        // Update timers
        this.spawnTimer++;
        this.formationTimer++;
        this.swarmTimer++;
        this.miniBossTimer++;

        // Regular enemy spawning
        if (this.spawnTimer >= this.spawnRate &&
            this.enemiesSpawned < this.getEnemiesForWave() &&
            this.enemies.filter(e => e.active).length < this.getMaxEnemies()) {

            // Decide spawn type
            const random = Math.random();

            if (this.formationTimer > CONFIG.waves.formationTimer &&
                random < CONFIG.waves.spawnProbability.formation) {
                // Formation spawn
                const patterns = ['v', 'line', 'diamond', 'wall'];
                const pattern = patterns[Math.floor(Math.random() * patterns.length)];
                this.spawnFormation(pattern);
                this.formationTimer = 0;
            } else if (this.wave >= 5 &&
                       this.miniBossTimer > CONFIG.waves.miniBossCooldown &&
                       random < 0.05) {
                // Mini-boss spawn
                this.spawnMiniBoss();
                this.miniBossTimer = 0;
            } else {
                // Regular spawn
                this.spawnEnemy();
            }

            this.spawnTimer = 0;
        }

        // Check for wave completion
        if (this.enemiesSpawned >= this.getEnemiesForWave() &&
            this.enemies.filter(e => e.active).length === 0) {
            this.completeWave();
        }
    }

    /**
     * Reset manager for new game
     */
    reset() {
        this.wave = 1;
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
        this.spawnTimer = 0;
        this.spawnRate = this.getSpawnRate();
        this.waveComplete = false;
        this.waveStarting = false;
        this.formationTimer = 0;
        this.swarmTimer = 0;
        this.miniBossTimer = 0;
        this.enemies = [];
        this.updateSpawnWeights();
    }

    /**
     * Get current wave info
     */
    getWaveInfo() {
        return {
            wave: this.wave,
            enemiesSpawned: this.enemiesSpawned,
            enemiesKilled: this.enemiesKilled,
            enemiesRemaining: this.getEnemiesForWave() - this.enemiesKilled,
            isComplete: this.waveComplete,
            isStarting: this.waveStarting,
            isBossWave: this.isBossWave(),
            theme: getCurrentTheme(this.wave)
        };
    }

    /**
     * Get stats for debugging
     */
    getStats() {
        return {
            wave: this.wave,
            spawned: this.enemiesSpawned,
            killed: this.enemiesKilled,
            target: this.getEnemiesForWave(),
            activeEnemies: this.enemies.filter(e => e.active).length,
            maxOnScreen: this.getMaxEnemies(),
            spawnRate: this.spawnRate
        };
    }
}
