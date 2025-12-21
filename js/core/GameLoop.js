/**
 * Geometry 3044 - GameLoop Module
 * Main game loop with update and render phases
 */

import { CONFIG, getCurrentTheme } from '../config.js';
import { drawWavingGrid, addGridImpact, drawBackground } from '../rendering/GridRenderer.js';
import { logger } from '../utils/Logger.js';

/**
 * GameLoop class - manages the main game loop
 */
export class GameLoop {
    constructor(options = {}) {
        // Core references
        this.canvas = options.canvas;
        this.ctx = options.ctx;
        this.gameState = options.gameState;
        this.inputHandler = options.inputHandler;
        this.collisionSystem = options.collisionSystem;

        // Systems (optional, can be set later)
        this.particleSystem = options.particleSystem || null;
        this.bulletPool = options.bulletPool || null;
        this.waveManager = options.waveManager || null;
        this.soundSystem = options.soundSystem || null;
        this.starfield = options.starfield || null;
        this.vhsGlitch = options.vhsGlitch || null;
        this.weaponManager = options.weaponManager || null;

        // UI Systems
        this.hud = options.hud || null;
        this.optionsMenu = options.optionsMenu || null;

        // Render functions (can be customized)
        this.renderCRT = options.renderCRT || null;

        // Loop state
        this.running = false;
        this.paused = false;
        this.animationFrameId = null;

        // Timing
        this.targetFPS = 60;
        this.frameTime = 1000 / this.targetFPS;
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.frameCount = 0;

        // Performance monitoring
        this.fpsHistory = [];
        this.fpsHistoryMaxLength = 60;
        this.currentFPS = 60;
        this.showFPS = false;

        // Callbacks
        this.onUpdate = options.onUpdate || null;
        this.onRender = options.onRender || null;
        this.onPreRender = options.onPreRender || null;
        this.onPostRender = options.onPostRender || null;

        // Bound loop function
        this._boundLoop = this.loop.bind(this);
    }

    /**
     * Set a system reference
     */
    setSystem(name, system) {
        this[name] = system;
    }

    /**
     * Set callback function
     */
    setCallback(name, callback) {
        if (name === 'update') this.onUpdate = callback;
        else if (name === 'render') this.onRender = callback;
        else if (name === 'preRender') this.onPreRender = callback;
        else if (name === 'postRender') this.onPostRender = callback;
    }

    /**
     * Start the game loop
     */
    start() {
        if (this.running) return;

        this.running = true;
        this.lastFrameTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this._boundLoop);

        if (CONFIG.debug?.enabled) {
            console.log('🎮 GameLoop started');
        }
    }

    /**
     * Stop the game loop
     */
    stop() {
        this.running = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        if (CONFIG.debug?.enabled) {
            console.log('🛑 GameLoop stopped');
        }
    }

    /**
     * Pause the game loop (renders but doesn't update)
     */
    pause() {
        this.paused = true;
        if (this.gameState) {
            this.gameState.gamePaused = true;
        }
    }

    /**
     * Resume the game loop
     */
    resume() {
        this.paused = false;
        if (this.gameState) {
            this.gameState.gamePaused = false;
        }
        this.lastFrameTime = performance.now();
    }

    /**
     * Toggle pause state
     */
    togglePause() {
        if (this.paused) {
            this.resume();
        } else {
            this.pause();
        }
        return this.paused;
    }

    /**
     * Main loop function
     */
    loop(currentTime) {
        if (!this.running) return;

        // Calculate delta time
        this.deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        // Calculate FPS
        this.updateFPS(this.deltaTime);

        // Update game state timing
        if (this.gameState) {
            this.gameState.frameCount++;
            this.gameState.deltaTime = this.deltaTime;
            this.gameState.lastFrameTime = currentTime;
        }

        // Update phase (skip if paused)
        if (!this.paused) {
            this.update(this.deltaTime);
        }

        // Render phase (always render)
        this.render();

        // Schedule next frame
        this.animationFrameId = requestAnimationFrame(this._boundLoop);

        this.frameCount++;
    }

    /**
     * Update game state
     */
    update(deltaTime) {
        const gs = this.gameState;
        if (!gs || !gs.gameRunning) return;

        // Apply slow motion if active
        const timeFactor = gs.slowMotion.active ? gs.slowMotion.factor : 1;

        // Update input
        if (this.inputHandler) {
            // Check for options menu toggle (O key)
            if (this.inputHandler.isKeyPressed('o') || this.inputHandler.isKeyPressed('O')) {
                if (this.optionsMenu) {
                    if (this.optionsMenu.isVisible()) {
                        this.optionsMenu.close();
                        this.resume();
                    } else {
                        this.optionsMenu.show();
                        this.pause();
                    }
                    return;
                }
            }

            // Handle options menu input if visible
            if (this.optionsMenu && this.optionsMenu.isVisible()) {
                const keys = this.inputHandler.getKeys();
                for (const key in keys) {
                    if (keys[key]) {
                        this.optionsMenu.handleInput(key);
                        break;
                    }
                }
                return; // Don't process other input while menu is open
            }

            // Check for pause
            if (this.inputHandler.isActionPressed('pause')) {
                this.togglePause();
                return;
            }
        }

        // Update player
        if (gs.player && gs.player.update) {
            const movement = this.inputHandler ? this.inputHandler.getMovement() : { x: 0, y: 0 };
            const firing = this.inputHandler ? this.inputHandler.isActionActive('fire') : false;
            gs.player.update(movement, firing, timeFactor);
        }

        // Update enemies - use swap-and-pop for O(1) removal
        let enemyWriteIdx = 0;
        for (let i = 0; i < gs.enemies.length; i++) {
            const enemy = gs.enemies[i];
            if (enemy && enemy.update) {
                enemy.update(timeFactor);
            }
            if (enemy && enemy.alive) {
                gs.enemies[enemyWriteIdx++] = enemy;
            }
        }
        gs.enemies.length = enemyWriteIdx;

        // Update player bullets - use swap-and-pop for O(1) removal
        let bulletWriteIdx = 0;
        for (let i = 0; i < gs.bullets.length; i++) {
            const bullet = gs.bullets[i];
            if (bullet && bullet.update) {
                bullet.update(timeFactor);
            }
            if (bullet && bullet.active) {
                gs.bullets[bulletWriteIdx++] = bullet;
            }
        }
        gs.bullets.length = bulletWriteIdx;

        // Update enemy bullets - use swap-and-pop for O(1) removal
        let enemyBulletWriteIdx = 0;
        for (let i = 0; i < gs.enemyBullets.length; i++) {
            const bullet = gs.enemyBullets[i];
            if (bullet && bullet.update) {
                bullet.update(timeFactor);
            }
            if (bullet && bullet.active) {
                gs.enemyBullets[enemyBulletWriteIdx++] = bullet;
            }
        }
        gs.enemyBullets.length = enemyBulletWriteIdx;

        // Update power-ups - use swap-and-pop for O(1) removal
        let powerUpWriteIdx = 0;
        for (let i = 0; i < gs.powerUps.length; i++) {
            const powerUp = gs.powerUps[i];
            if (powerUp && powerUp.update) {
                powerUp.update(timeFactor);
            }
            if (powerUp && powerUp.active) {
                gs.powerUps[powerUpWriteIdx++] = powerUp;
            }
        }
        gs.powerUps.length = powerUpWriteIdx;

        // Update explosions - use swap-and-pop for O(1) removal
        let explosionWriteIdx = 0;
        for (let i = 0; i < gs.explosions.length; i++) {
            const explosion = gs.explosions[i];
            if (explosion && explosion.update) {
                explosion.update();
            }
            if (explosion && !explosion.finished) {
                gs.explosions[explosionWriteIdx++] = explosion;
            }
        }
        gs.explosions.length = explosionWriteIdx;

        // Update collision detection
        if (this.collisionSystem) {
            this.collisionSystem.update();
        }

        // Update game systems
        if (this.particleSystem) {
            this.particleSystem.update();
        }

        if (this.waveManager && gs.gameRunning) {
            this.waveManager.update();
        }

        if (this.starfield) {
            this.starfield.update();
        }

        if (this.vhsGlitch) {
            this.vhsGlitch.update();
        }

        // Update weapon manager
        if (this.weaponManager && gs.player) {
            const keys = this.inputHandler ? this.inputHandler.getKeys() : {};
            const timeEffects = this.weaponManager.update(gs.player, gs.enemies, keys);

            // Apply time effects from weapons like Time Fracture
            if (timeEffects && timeEffects.playerSpeedMult !== 1) {
                // Could modify player speed here if needed
            }
        }

        // Update game state effects
        gs.updateCombo();
        gs.updateEffects();

        // Update HUD system
        if (this.hud) {
            this.hud.update(gs, timeFactor);
        }

        // Update options menu
        if (this.optionsMenu) {
            this.optionsMenu.update(timeFactor);
        }

        // Update input state (clear single-frame flags)
        if (this.inputHandler) {
            this.inputHandler.update();
        }

        // Custom update callback
        if (this.onUpdate) {
            this.onUpdate(deltaTime, gs);
        }
    }

    /**
     * Render game
     */
    render() {
        const ctx = this.ctx;
        const gs = this.gameState;
        const canvas = this.canvas;

        if (!ctx || !canvas) return;

        // Pre-render callback
        if (this.onPreRender) {
            this.onPreRender(ctx, gs);
        }

        // Apply screen shake
        ctx.save();
        if (gs && gs.screenShake.duration > 0) {
            ctx.translate(gs.screenShake.x, gs.screenShake.y);
        }

        // Clear screen
        this.renderBackground(ctx, canvas, gs);

        // Render starfield (background layer)
        if (this.starfield) {
            this.starfield.draw(ctx);
        }

        // Render game entities
        this.renderEntities(ctx, gs);

        // Render particles
        if (this.particleSystem) {
            this.particleSystem.draw(ctx);
        }

        // Render explosions
        if (gs) {
            for (const explosion of gs.explosions) {
                if (explosion && explosion.draw) {
                    explosion.draw(ctx);
                }
            }
        }

        // Render weapon effects
        if (this.weaponManager && gs && gs.player) {
            this.weaponManager.draw(ctx, gs.player);
        }

        // Render UI
        this.renderUI(ctx, gs);

        // Custom render callback
        if (this.onRender) {
            this.onRender(ctx, gs);
        }

        // Restore transform (before effects)
        ctx.restore();

        // Render VHS glitch effect
        if (this.vhsGlitch) {
            this.vhsGlitch.draw(ctx);
        }

        // Render CRT effect (last layer)
        if (this.renderCRT) {
            this.renderCRT(ctx);
        }

        // Render flash effect
        if (gs && gs.flashEffect.active) {
            ctx.fillStyle = gs.flashEffect.color;
            ctx.globalAlpha = gs.flashEffect.alpha;
            ctx.fillRect(0, 0, canvas.logicalWidth, canvas.logicalHeight);
            ctx.globalAlpha = 1;
        }

        // Render touch controls
        if (this.inputHandler) {
            this.inputHandler.drawTouchControls(ctx);
        }

        // Render FPS counter
        if (this.showFPS) {
            this.renderFPS(ctx);
        }

        // Render pause overlay
        if (this.paused) {
            this.renderPauseOverlay(ctx, canvas);
        }

        // Post-render callback
        if (this.onPostRender) {
            this.onPostRender(ctx, gs);
        }
    }

    /**
     * Render background with Geometry Wars-style waving grid
     */
    renderBackground(ctx, canvas, gs) {
        const wave = gs ? gs.wave : 1;

        // Draw gradient background
        drawBackground(ctx, canvas, wave);

        // Draw Geometry Wars-style waving grid with physics
        drawWavingGrid(ctx, canvas, wave);
    }

    /**
     * Add grid impact for ripple effects (called on explosions)
     */
    triggerGridImpact(x, y, force = 50, radius = 150) {
        addGridImpact(x, y, force, radius);
    }

    /**
     * Render game entities
     */
    renderEntities(ctx, gs) {
        if (!gs) return;

        // Render power-ups
        for (const powerUp of gs.powerUps) {
            if (powerUp && powerUp.draw) {
                powerUp.draw(ctx);
            }
        }

        // Render enemy bullets
        for (const bullet of gs.enemyBullets) {
            if (bullet && bullet.draw) {
                bullet.draw(ctx);
            }
        }

        // Render player bullets
        for (const bullet of gs.bullets) {
            if (bullet && bullet.draw) {
                bullet.draw(ctx);
            }
        }

        // Render enemies
        for (const enemy of gs.enemies) {
            if (enemy && enemy.draw) {
                enemy.draw(ctx);
            }
        }

        // Render player
        if (gs.player && gs.player.draw) {
            // Flash during invulnerability
            if (gs.playerInvulnerable && Math.floor(gs.frameCount / 4) % 2 === 0) {
                ctx.globalAlpha = 0.5;
            }
            gs.player.draw(ctx);
            ctx.globalAlpha = 1;
        }
    }

    /**
     * Render UI elements
     */
    renderUI(ctx, gs) {
        if (!gs) return;

        // Use new HUD system if available
        if (this.hud) {
            this.hud.draw(ctx);

            // Draw wave announcement if active
            if (gs.showThemeName && gs.themeChangeTimer > 0) {
                this.hud.drawWaveAnnouncement(ctx, gs);
            }
        } else {
            // Fallback to legacy UI rendering
            this.renderLegacyUI(ctx, gs);
        }

        // Render options menu if available and visible
        if (this.optionsMenu && this.optionsMenu.isVisible()) {
            this.optionsMenu.draw(ctx, this.canvas.logicalWidth, this.canvas.logicalHeight);
        }
    }

    /**
     * Legacy UI rendering (fallback when HUD system is not available)
     */
    renderLegacyUI(ctx, gs) {
        const wave = gs.wave;
        const theme = getCurrentTheme(wave);

        ctx.save();

        // Score
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.shadowBlur = 10;
        ctx.shadowColor = CONFIG.colors.score;
        ctx.fillStyle = CONFIG.colors.score;
        ctx.fillText(`SCORE: ${gs.score.toLocaleString()}`, 20, 20);

        // High score
        ctx.font = '16px "Courier New", monospace';
        ctx.fillText(`HI: ${gs.highScore.toLocaleString()}`, 20, 50);

        // Wave
        ctx.textAlign = 'center';
        ctx.shadowColor = CONFIG.colors.wave;
        ctx.fillStyle = CONFIG.colors.wave;
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillText(`WAVE ${wave}`, this.canvas.logicalWidth / 2, 20);

        // Lives
        ctx.textAlign = 'right';
        ctx.shadowColor = CONFIG.colors.lives;
        ctx.fillStyle = CONFIG.colors.lives;
        ctx.font = '20px "Courier New", monospace';
        ctx.fillText(`\u2665 ${gs.lives}`, this.canvas.logicalWidth - 20, 20);

        // Bombs
        ctx.shadowColor = CONFIG.colors.bombs;
        ctx.fillStyle = CONFIG.colors.bombs;
        ctx.fillText(`\u2605 ${gs.bombs}`, this.canvas.logicalWidth - 20, 50);

        // Combo
        if (gs.combo > 1) {
            ctx.textAlign = 'center';
            ctx.shadowColor = theme.accent;
            ctx.fillStyle = theme.accent;
            ctx.font = 'bold 28px "Courier New", monospace';
            ctx.fillText(`${gs.combo}x COMBO!`, this.canvas.logicalWidth / 2, 60);
        }

        // Theme name display
        if (gs.showThemeName && gs.themeChangeTimer > 0) {
            const alpha = Math.min(1, gs.themeChangeTimer / 30);
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 36px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = theme.primary;
            ctx.fillStyle = theme.primary;
            ctx.fillText(theme.name, this.canvas.logicalWidth / 2, this.canvas.logicalHeight / 2 - 50);
            ctx.globalAlpha = 1;
        }

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    /**
     * Render pause overlay
     */
    renderPauseOverlay(ctx, canvas) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.logicalWidth, canvas.logicalHeight);

        ctx.font = 'bold 48px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        ctx.fillStyle = '#00ffff';
        ctx.fillText('PAUSED', canvas.logicalWidth / 2, canvas.logicalHeight / 2);

        ctx.font = '20px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Press ESC or P to resume', canvas.logicalWidth / 2, canvas.logicalHeight / 2 + 50);

        ctx.shadowBlur = 0;
    }

    /**
     * Update FPS tracking
     */
    updateFPS(deltaTime) {
        const fps = 1000 / deltaTime;
        this.fpsHistory.push(fps);

        if (this.fpsHistory.length > this.fpsHistoryMaxLength) {
            this.fpsHistory.shift();
        }

        // Calculate average FPS
        const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
        this.currentFPS = Math.round(sum / this.fpsHistory.length);
    }

    /**
     * Render FPS counter
     */
    renderFPS(ctx) {
        ctx.save();
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = this.currentFPS < 30 ? '#ff0000' : this.currentFPS < 50 ? '#ffff00' : '#00ff00';
        ctx.fillText(`FPS: ${this.currentFPS}`, 10, this.canvas.logicalHeight - 10);

        if (this.collisionSystem) {
            const stats = this.collisionSystem.getStats();
            ctx.fillText(`Checks: ${stats.checksPerFrame}`, 10, this.canvas.logicalHeight - 30);
        }

        ctx.restore();
    }

    /**
     * Toggle FPS display
     */
    toggleFPS() {
        this.showFPS = !this.showFPS;
        return this.showFPS;
    }

    /**
     * Get current FPS
     */
    getFPS() {
        return this.currentFPS;
    }

    /**
     * Check if loop is running
     */
    isRunning() {
        return this.running;
    }

    /**
     * Check if loop is paused
     */
    isPaused() {
        return this.paused;
    }
}
