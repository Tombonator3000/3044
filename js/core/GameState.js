/**
 * Geometry 3044 - GameState Module
 * Centralized game state management
 */

import { CONFIG, getDifficultySettings } from '../config.js';
import { GameSettings } from '../ui/MenuManager.js';

/**
 * GameState class - manages all game state
 */
export class GameState {
    constructor() {
        this.reset();
    }

    /**
     * Reset game state to initial values
     */
    reset() {
        // Get difficulty settings
        const difficulty = getDifficultySettings(GameSettings.difficulty);
        this.difficultySettings = difficulty;
        this.difficultyName = GameSettings.difficulty;

        // Core game state
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.lives = difficulty.lives;
        this.bombs = difficulty.bombs;
        this.wave = 1;

        // Game flow state
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;
        this.bossActive = false;
        this.miniBossActive = false;

        // Sidescroller mode (R-Type style)
        this.sidescrollerMode = false;
        this.sidescrollerWaves = [4, 9, 14, 19, 24, 29]; // Waves that use sidescroller mode

        // Player state
        this.player = null;
        this.playerInvulnerable = false;
        this.playerRespawnTimer = 0;

        // Entity collections
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.powerUps = [];
        this.explosions = [];
        this.asteroids = [];  // Classic Asteroids-style obstacles

        // Asteroid wave configuration (waves with asteroid fields)
        this.asteroidWaves = [3, 7, 11, 13, 17, 21, 23, 27];

        // Combo system
        this.combo = 0;
        this.comboTimer = 0;
        this.maxCombo = 0;

        // Score milestones for extra lives
        this.nextLifeScore = CONFIG.game.newLifeScoreThreshold;

        // Wave progression
        this.waveComplete = false;
        this.waveTransitionTimer = 0;
        this.enemiesKilledThisWave = 0;
        this.totalEnemiesThisWave = 0;

        // Time tracking
        this.frameCount = 0;
        this.lastFrameTime = 0;
        this.deltaTime = 0;

        // Screen effects
        this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
        this.flashEffect = { active: false, color: '#ffffff', alpha: 0 };
        this.slowMotion = { active: false, factor: 1, duration: 0 };

        // Theme
        this.themeChangeTimer = 0;
        this.showThemeName = false;
    }

    /**
     * Load high score from localStorage
     */
    loadHighScore() {
        try {
            const saved = localStorage.getItem('geometry3044_highScore');
            return saved ? parseInt(saved, 10) : 0;
        } catch (e) {
            return 0;
        }
    }

    /**
     * Save high score to localStorage
     */
    saveHighScore() {
        try {
            localStorage.setItem('geometry3044_highScore', this.highScore.toString());
        } catch (e) {
            console.warn('Could not save high score:', e);
        }
    }

    /**
     * Add points to score
     * @param {number} points - Points to add
     * @param {boolean} useCombo - Whether to apply combo multiplier
     */
    addScore(points, useCombo = true) {
        const comboMultiplier = useCombo ? Math.max(1, this.combo) : 1;
        const difficultyMultiplier = this.difficultySettings?.scoreMultiplier || 1;
        const totalPoints = Math.floor(points * comboMultiplier * difficultyMultiplier);
        this.score += totalPoints;

        // Check for new high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }

        // Check for extra life milestones (use while to catch multiple thresholds)
        while (this.score >= this.nextLifeScore && this.lives < CONFIG.game.maxLives) {
            this.addLife();
            this.nextLifeScore += CONFIG.game.newLifeScoreThreshold;
        }

        // Sanity check - hard cap lives at maxLives
        if (this.lives > CONFIG.game.maxLives) {
            this.lives = CONFIG.game.maxLives;
        }

        return totalPoints;
    }

    /**
     * Increment combo counter
     */
    incrementCombo() {
        this.combo++;
        this.comboTimer = CONFIG.game.comboTimeout;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
    }

    /**
     * Reset combo counter
     */
    resetCombo() {
        this.combo = 0;
        this.comboTimer = 0;
    }

    /**
     * Update combo timer
     */
    updateCombo() {
        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) {
                this.resetCombo();
            }
        }
    }

    /**
     * Add a life (up to max)
     */
    addLife() {
        if (this.lives < CONFIG.game.maxLives) {
            this.lives++;
            // Extra safety: clamp to maxLives
            this.lives = Math.min(this.lives, CONFIG.game.maxLives);
            return true;
        }
        return false;
    }

    /**
     * Get current lives (with safety clamp)
     */
    getLives() {
        // Always return clamped value
        return Math.min(Math.max(this.lives, 0), CONFIG.game.maxLives);
    }

    /**
     * Remove a life
     * @returns {boolean} True if game over
     */
    loseLife() {
        this.lives--;
        this.resetCombo();
        return this.lives <= 0;
    }

    /**
     * Add a bomb (up to max)
     */
    addBomb() {
        if (this.bombs < CONFIG.game.maxBombs) {
            this.bombs++;
            return true;
        }
        return false;
    }

    /**
     * Use a bomb
     * @returns {boolean} True if bomb was available
     */
    useBomb() {
        if (this.bombs > 0) {
            this.bombs--;
            return true;
        }
        return false;
    }

    /**
     * Start a new wave
     */
    startWave(waveNumber) {
        this.wave = waveNumber;
        this.waveComplete = false;
        this.waveTransitionTimer = 0;
        this.enemiesKilledThisWave = 0;
        this.totalEnemiesThisWave = 0;

        // Check if this wave should be sidescroller mode
        this.sidescrollerMode = this.sidescrollerWaves.includes(waveNumber);

        // Show theme name for new theme waves
        if (waveNumber <= 6) {
            this.themeChangeTimer = CONFIG.timing.themeChangeDisplay;
            this.showThemeName = true;
        }
    }

    /**
     * Check if current wave is a sidescroller wave
     */
    isSidescrollerWave() {
        return this.sidescrollerMode;
    }

    /**
     * Check if current wave is an asteroid wave
     */
    isAsteroidWave(waveNumber = this.wave) {
        return this.asteroidWaves.includes(waveNumber);
    }

    /**
     * Complete current wave
     */
    completeWave() {
        this.waveComplete = true;
        this.waveTransitionTimer = 120; // 2 seconds at 60fps
    }

    /**
     * Trigger screen shake
     * @param {string} preset - Preset name from CONFIG.screenShake
     */
    triggerScreenShake(preset = 'medium') {
        const shake = CONFIG.screenShake[preset] || CONFIG.screenShake.medium;
        this.screenShake.intensity = shake.intensity;
        this.screenShake.duration = shake.duration;
    }

    /**
     * Trigger flash effect
     * @param {string} color - Flash color
     * @param {number} alpha - Initial alpha
     */
    triggerFlash(color = '#ffffff', alpha = 0.5) {
        this.flashEffect.active = true;
        this.flashEffect.color = color;
        this.flashEffect.alpha = alpha;
    }

    /**
     * Trigger slow motion
     * @param {number} factor - Slow motion factor (0-1)
     * @param {number} duration - Duration in frames
     */
    triggerSlowMotion(factor = 0.5, duration = 30) {
        this.slowMotion.active = true;
        this.slowMotion.factor = factor;
        this.slowMotion.duration = duration;
    }

    /**
     * Update screen effects
     */
    updateEffects() {
        // Screen shake
        if (this.screenShake.duration > 0) {
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity * 2;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity * 2;
            this.screenShake.duration--;
        } else {
            this.screenShake.x = 0;
            this.screenShake.y = 0;
            this.screenShake.intensity = 0;
        }

        // Flash effect
        if (this.flashEffect.active) {
            this.flashEffect.alpha -= 0.05;
            if (this.flashEffect.alpha <= 0) {
                this.flashEffect.active = false;
                this.flashEffect.alpha = 0;
            }
        }

        // Slow motion
        if (this.slowMotion.active) {
            this.slowMotion.duration--;
            if (this.slowMotion.duration <= 0) {
                this.slowMotion.active = false;
                this.slowMotion.factor = 1;
            }
        }

        // Theme name display
        if (this.themeChangeTimer > 0) {
            this.themeChangeTimer--;
            if (this.themeChangeTimer <= 0) {
                this.showThemeName = false;
            }
        }
    }

    /**
     * Start the game
     */
    startGame() {
        this.reset();
        this.gameRunning = true;
        this.gameOver = false;
        this.gamePaused = false;
    }

    /**
     * End the game
     */
    endGame() {
        this.gameRunning = false;
        this.gameOver = true;
        this.saveHighScore();
    }

    /**
     * Pause/unpause the game
     */
    togglePause() {
        if (this.gameRunning && !this.gameOver) {
            this.gamePaused = !this.gamePaused;
        }
        return this.gamePaused;
    }

    /**
     * Get current state summary for debugging
     */
    getDebugInfo() {
        return {
            score: this.score,
            highScore: this.highScore,
            lives: this.lives,
            bombs: this.bombs,
            wave: this.wave,
            combo: this.combo,
            enemies: this.enemies.length,
            bullets: this.bullets.length,
            enemyBullets: this.enemyBullets.length,
            gameRunning: this.gameRunning,
            gamePaused: this.gamePaused,
            frameCount: this.frameCount
        };
    }
}
