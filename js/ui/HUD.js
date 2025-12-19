/**
 * Geometry 3044 - HUD Module
 * In-game heads-up display rendering
 */

import { CONFIG, getCurrentTheme } from '../config.js';
import { cachedUI } from '../globals.js';

/**
 * HUD class - renders in-game HUD elements
 */
export class HUD {
    constructor() {
        // HUD positioning
        this.padding = 20;
        this.fontSize = 24;
        this.fontFamily = '"Courier New", monospace';

        // Animation states
        this.scoreAnimValue = 0;
        this.targetScore = 0;
        this.livesFlash = 0;
        this.bombsFlash = 0;
        this.waveFlash = 0;

        // Previous values for change detection
        this.prevLives = 0;
        this.prevBombs = 0;
        this.prevWave = 0;
    }

    /**
     * Update HUD animations and DOM elements
     * @param {GameState} gameState - Current game state
     */
    update(gameState) {
        // Animate score counter
        if (this.targetScore !== gameState.score) {
            this.targetScore = gameState.score;
        }

        // Smooth score animation
        const scoreDiff = this.targetScore - this.scoreAnimValue;
        if (Math.abs(scoreDiff) > 1) {
            this.scoreAnimValue += scoreDiff * 0.1;
        } else {
            this.scoreAnimValue = this.targetScore;
        }

        // Detect changes for flash effects
        if (gameState.lives !== this.prevLives) {
            this.livesFlash = 30;
            this.prevLives = gameState.lives;
        }
        if (gameState.bombs !== this.prevBombs) {
            this.bombsFlash = 30;
            this.prevBombs = gameState.bombs;
        }
        if (gameState.wave !== this.prevWave) {
            this.waveFlash = 60;
            this.prevWave = gameState.wave;
        }

        // Decay flash timers
        if (this.livesFlash > 0) this.livesFlash--;
        if (this.bombsFlash > 0) this.bombsFlash--;
        if (this.waveFlash > 0) this.waveFlash--;

        // Update DOM elements
        this.updateDOMElements(gameState);
    }

    /**
     * Update DOM HUD elements
     * @param {GameState} gameState - Current game state
     */
    updateDOMElements(gameState) {
        if (cachedUI.score) {
            cachedUI.score.textContent = Math.floor(this.scoreAnimValue).toLocaleString();
        }
        if (cachedUI.lives) {
            cachedUI.lives.textContent = gameState.lives;
        }
        if (cachedUI.bombs) {
            cachedUI.bombs.textContent = gameState.bombs;
        }
        if (cachedUI.wave) {
            cachedUI.wave.textContent = gameState.wave;
        }
        if (cachedUI.highScore) {
            cachedUI.highScore.textContent = gameState.highScore.toLocaleString();
        }
    }

    /**
     * Draw HUD on canvas (for retro effects)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {GameState} gameState - Current game state
     */
    draw(ctx, gameState) {
        const theme = getCurrentTheme(gameState.wave);

        ctx.save();
        ctx.font = `bold ${this.fontSize}px ${this.fontFamily}`;
        ctx.textBaseline = 'top';

        // Draw score (top left)
        this.drawScore(ctx, gameState, theme);

        // Draw high score (top center)
        this.drawHighScore(ctx, gameState, theme);

        // Draw wave (top right)
        this.drawWave(ctx, gameState, theme);

        // Draw lives (bottom left)
        this.drawLives(ctx, gameState, theme);

        // Draw bombs (bottom right)
        this.drawBombs(ctx, gameState, theme);

        // Draw wave announcement
        if (gameState.showThemeName && gameState.themeChangeTimer > 0) {
            this.drawWaveAnnouncement(ctx, gameState, theme);
        }

        ctx.restore();
    }

    /**
     * Draw score display
     */
    drawScore(ctx, gameState, theme) {
        const x = this.padding;
        const y = this.padding;

        ctx.textAlign = 'left';
        ctx.shadowBlur = 10;
        ctx.shadowColor = CONFIG.colors.score;
        ctx.fillStyle = CONFIG.colors.score;
        ctx.fillText('SCORE', x, y);

        ctx.font = `bold ${this.fontSize + 4}px ${this.fontFamily}`;
        ctx.fillText(Math.floor(this.scoreAnimValue).toLocaleString(), x, y + 28);
    }

    /**
     * Draw high score display
     */
    drawHighScore(ctx, gameState, theme) {
        const x = CONFIG.screen.width / 2;
        const y = this.padding;

        ctx.textAlign = 'center';
        ctx.font = `${this.fontSize - 4}px ${this.fontFamily}`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = theme.secondary;
        ctx.fillStyle = theme.secondary;
        ctx.fillText('HIGH SCORE', x, y);

        ctx.font = `bold ${this.fontSize}px ${this.fontFamily}`;
        ctx.fillText(gameState.highScore.toLocaleString(), x, y + 22);
    }

    /**
     * Draw wave display
     */
    drawWave(ctx, gameState, theme) {
        const x = CONFIG.screen.width - this.padding;
        const y = this.padding;

        const flashAlpha = this.waveFlash > 0 ? 0.5 + Math.sin(this.waveFlash * 0.3) * 0.5 : 1;

        ctx.textAlign = 'right';
        ctx.font = `bold ${this.fontSize}px ${this.fontFamily}`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = CONFIG.colors.wave;
        ctx.fillStyle = CONFIG.colors.wave;
        ctx.globalAlpha = flashAlpha;
        ctx.fillText(`WAVE ${gameState.wave}`, x, y);
        ctx.globalAlpha = 1;
    }

    /**
     * Draw lives display
     */
    drawLives(ctx, gameState, theme) {
        const x = this.padding;
        const y = CONFIG.screen.height - this.padding - 30;

        const flashAlpha = this.livesFlash > 0 ? 0.5 + Math.sin(this.livesFlash * 0.5) * 0.5 : 1;

        ctx.textAlign = 'left';
        ctx.font = `bold ${this.fontSize}px ${this.fontFamily}`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = CONFIG.colors.lives;
        ctx.fillStyle = CONFIG.colors.lives;
        ctx.globalAlpha = flashAlpha;

        // Draw life icons
        let lifeX = x;
        for (let i = 0; i < gameState.lives; i++) {
            this.drawLifeIcon(ctx, lifeX + i * 25, y + 5);
        }
        ctx.globalAlpha = 1;
    }

    /**
     * Draw a single life icon (triangle ship)
     */
    drawLifeIcon(ctx, x, y) {
        ctx.beginPath();
        ctx.moveTo(x, y - 8);
        ctx.lineTo(x + 10, y + 8);
        ctx.lineTo(x - 10, y + 8);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Draw bombs display
     */
    drawBombs(ctx, gameState, theme) {
        const x = CONFIG.screen.width - this.padding;
        const y = CONFIG.screen.height - this.padding - 30;

        const flashAlpha = this.bombsFlash > 0 ? 0.5 + Math.sin(this.bombsFlash * 0.5) * 0.5 : 1;

        ctx.textAlign = 'right';
        ctx.font = `bold ${this.fontSize}px ${this.fontFamily}`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = CONFIG.colors.bombs;
        ctx.fillStyle = CONFIG.colors.bombs;
        ctx.globalAlpha = flashAlpha;

        // Draw bomb icons
        for (let i = 0; i < gameState.bombs; i++) {
            this.drawBombIcon(ctx, x - i * 25, y + 5);
        }
        ctx.globalAlpha = 1;
    }

    /**
     * Draw a single bomb icon
     */
    drawBombIcon(ctx, x, y) {
        ctx.beginPath();
        ctx.arc(x - 5, y, 8, 0, Math.PI * 2);
        ctx.fill();

        // Fuse
        ctx.beginPath();
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x + 4, y - 10);
        ctx.strokeStyle = CONFIG.colors.bombs;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    /**
     * Draw wave announcement with theme name
     */
    drawWaveAnnouncement(ctx, gameState, theme) {
        const x = CONFIG.screen.width / 2;
        const y = CONFIG.screen.height / 2 - 50;

        const alpha = Math.min(1, gameState.themeChangeTimer / 30);
        const scale = 1 + (1 - alpha) * 0.2;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;

        // Wave number
        ctx.textAlign = 'center';
        ctx.font = `bold 64px ${this.fontFamily}`;
        ctx.shadowBlur = 30;
        ctx.shadowColor = theme.primary;
        ctx.fillStyle = theme.primary;
        ctx.fillText(`WAVE ${gameState.wave}`, 0, 0);

        // Theme name
        ctx.font = `bold 32px ${this.fontFamily}`;
        ctx.shadowColor = theme.secondary;
        ctx.fillStyle = theme.secondary;
        ctx.fillText(theme.name, 0, 50);

        ctx.restore();
    }

    /**
     * Draw "Get Ready" text
     */
    drawGetReady(ctx) {
        const x = CONFIG.screen.width / 2;
        const y = CONFIG.screen.height / 2;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold 48px ${this.fontFamily}`;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ff00';
        ctx.fillStyle = '#00ff00';
        ctx.fillText('GET READY!', x, y);
        ctx.restore();
    }

    /**
     * Draw boss warning
     */
    drawBossWarning(ctx) {
        const x = CONFIG.screen.width / 2;
        const y = 100;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = `bold 36px ${this.fontFamily}`;

        // Flashing effect
        const flash = Math.sin(Date.now() * 0.01) > 0;
        ctx.shadowBlur = flash ? 30 : 15;
        ctx.shadowColor = '#ff0000';
        ctx.fillStyle = flash ? '#ff0000' : '#ff6600';
        ctx.fillText('WARNING: BOSS APPROACHING', x, y);
        ctx.restore();
    }
}
