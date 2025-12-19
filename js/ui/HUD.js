/**
 * Geometry 3044 - HUD Manager
 * Main HUD system with 4 selectable themes
 */

import { CONFIG, getCurrentTheme } from '../config.js';
import { cachedUI } from '../globals.js';
import { getTheme, DEFAULT_THEME } from './HUDThemes.js';
import { ScoreDisplay } from './components/ScoreDisplay.js';
import { LivesDisplay } from './components/LivesDisplay.js';
import { WaveDisplay } from './components/WaveDisplay.js';
import { BombsDisplay } from './components/BombsDisplay.js';
import { ComboMeter } from './components/ComboMeter.js';
import { BossHealthBar } from './components/BossHealthBar.js';
import { PowerUpSlots } from './components/PowerUpSlots.js';
import { HighScoreDisplay } from './components/HighScoreDisplay.js';
import { MultiplierPopup } from './components/MultiplierPopup.js';

export class HUD {
    constructor() {
        // Load saved theme or use default
        this.currentThemeId = this.loadThemePreference();
        this.theme = getTheme(this.currentThemeId);

        // Initialize components
        this.initComponents();

        // Screen dimensions (updated on resize)
        this.width = CONFIG.screen.width;
        this.height = CONFIG.screen.height;

        // Animation state
        this.time = 0;
        this.flickerOffset = 0;

        // Score popups pool
        this.scorePopups = [];
        this.maxPopups = 10;

        // Previous state tracking for DOM updates
        this.prevLives = 0;
        this.prevBombs = 0;
        this.prevWave = 0;
        this.prevScore = 0;
        this.prevHighScore = 0;

        // Track last combo for multiplier popups
        this.lastCombo = 0;
    }

    loadThemePreference() {
        try {
            return localStorage.getItem('hudTheme') || DEFAULT_THEME;
        } catch (e) {
            return DEFAULT_THEME;
        }
    }

    initComponents() {
        this.scoreDisplay = new ScoreDisplay(this.theme);
        this.livesDisplay = new LivesDisplay(this.theme);
        this.waveDisplay = new WaveDisplay(this.theme);
        this.bombsDisplay = new BombsDisplay(this.theme);
        this.comboMeter = new ComboMeter(this.theme);
        this.bossHealthBar = new BossHealthBar(this.theme);
        this.powerUpSlots = new PowerUpSlots(this.theme);
        this.highScoreDisplay = new HighScoreDisplay(this.theme);
        this.multiplierPopup = new MultiplierPopup(this.theme);
    }

    setTheme(themeId) {
        this.currentThemeId = themeId;
        this.theme = getTheme(themeId);

        try {
            localStorage.setItem('hudTheme', themeId);
        } catch (e) {
            // localStorage not available
        }

        // Re-initialize all components with new theme
        this.initComponents();

        // Re-apply resize
        this.resize(this.width, this.height);
    }

    getThemeId() {
        return this.currentThemeId;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;

        // Update all components
        this.scoreDisplay.resize(width, height);
        this.livesDisplay.resize(width, height);
        this.waveDisplay.resize(width, height);
        this.bombsDisplay.resize(width, height);
        this.comboMeter.resize(width, height);
        this.bossHealthBar.resize(width, height);
        this.powerUpSlots.resize(width, height);
        this.highScoreDisplay.resize(width, height);
        this.multiplierPopup.resize(width, height);
    }

    // Call when score increases for popup effect
    addScorePopup(x, y, amount, color = null) {
        if (this.scorePopups.length >= this.maxPopups) {
            this.scorePopups.shift();
        }

        this.scorePopups.push({
            x, y,
            amount,
            color: color || this.theme.colors.score,
            life: 60,
            maxLife: 60,
            vy: -2,
            scale: 1.5
        });
    }

    update(gameState, deltaTime = 1) {
        this.time += deltaTime;

        // Flicker effect
        if (this.theme.effects.flicker) {
            this.flickerOffset = Math.random() < 0.05
                ? this.theme.effects.flickerIntensity
                : 0;
        }

        // Update all components
        this.scoreDisplay.update(gameState.score, deltaTime);
        this.livesDisplay.update(gameState.lives, deltaTime);

        // Get theme name from wave theme
        const waveTheme = getCurrentTheme(gameState.wave);
        const themeName = waveTheme ? waveTheme.name : '';
        this.waveDisplay.update(gameState.wave, themeName, deltaTime);

        this.bombsDisplay.update(gameState.bombs, deltaTime);

        // Combo meter - use combo timeout from CONFIG or default
        const comboTimeout = CONFIG.gameplay?.comboTimeout || 120;
        this.comboMeter.update(
            gameState.combo || 0,
            gameState.comboTimer || 0,
            comboTimeout,
            deltaTime
        );

        // Power-ups
        this.powerUpSlots.update(gameState.activePowerUps || [], deltaTime);

        // High score
        this.highScoreDisplay.update(gameState.highScore || 0, deltaTime);

        // Boss health - only show if boss is active
        if (gameState.bossActive && gameState.boss) {
            this.bossHealthBar.show(
                gameState.boss.name || 'BOSS',
                gameState.boss.health || 0,
                gameState.boss.maxHealth || 100
            );
        } else {
            this.bossHealthBar.hide();
        }
        this.bossHealthBar.update(deltaTime);

        // Multiplier popup
        const combo = gameState.combo || 0;
        if (combo > 0 && combo !== this.lastCombo) {
            if (combo > 5 && combo % 5 === 0) {
                this.multiplierPopup.trigger(combo);
            }
        }
        this.lastCombo = combo;
        this.multiplierPopup.update(deltaTime);

        // Score popups
        this.scorePopups = this.scorePopups.filter(popup => {
            popup.life -= deltaTime;
            popup.y += popup.vy;
            popup.vy *= 0.95;
            popup.scale = Math.max(1, popup.scale - 0.02);
            return popup.life > 0;
        });

        // Update DOM elements for backwards compatibility
        this.updateDOMElements(gameState);
    }

    updateDOMElements(gameState) {
        // Only update if values changed
        if (cachedUI.score && gameState.score !== this.prevScore) {
            cachedUI.score.textContent = Math.floor(gameState.score).toLocaleString();
            this.prevScore = gameState.score;
        }
        if (cachedUI.lives && gameState.lives !== this.prevLives) {
            cachedUI.lives.textContent = gameState.lives;
            this.prevLives = gameState.lives;
        }
        if (cachedUI.bombs && gameState.bombs !== this.prevBombs) {
            cachedUI.bombs.textContent = gameState.bombs;
            this.prevBombs = gameState.bombs;
        }
        if (cachedUI.wave && gameState.wave !== this.prevWave) {
            cachedUI.wave.textContent = gameState.wave;
            this.prevWave = gameState.wave;
        }
        if (cachedUI.highScore && gameState.highScore !== this.prevHighScore) {
            cachedUI.highScore.textContent = gameState.highScore.toLocaleString();
            this.prevHighScore = gameState.highScore;
        }
    }

    draw(ctx) {
        ctx.save();

        // Apply global flicker
        if (this.flickerOffset > 0) {
            ctx.globalAlpha = 1 - this.flickerOffset;
        }

        // Draw theme-specific background elements
        this.drawThemeBackground(ctx);

        // Draw all HUD components
        this.scoreDisplay.draw(ctx);
        this.livesDisplay.draw(ctx);
        this.waveDisplay.draw(ctx);
        this.bombsDisplay.draw(ctx);
        this.comboMeter.draw(ctx);
        this.bossHealthBar.draw(ctx);
        this.powerUpSlots.draw(ctx);
        this.highScoreDisplay.draw(ctx);
        this.multiplierPopup.draw(ctx);

        // Draw score popups
        this.drawScorePopups(ctx);

        // Draw theme-specific overlay effects
        this.drawThemeOverlay(ctx);

        ctx.restore();
    }

    drawThemeBackground(ctx) {
        const theme = this.theme;

        // Retro CRT top bar
        if (theme.layout.topBar && theme.layout.topBar.enabled) {
            const barHeight = theme.layout.topBar.height;

            ctx.fillStyle = theme.colors.panelBg;
            ctx.fillRect(0, 0, this.width, barHeight);

            ctx.strokeStyle = theme.colors.panelBorder;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, barHeight);
            ctx.lineTo(this.width, barHeight);
            ctx.stroke();

            if (theme.layout.topBar.showTitle) {
                ctx.font = `bold 20px ${theme.fonts.title}`;
                ctx.fillStyle = theme.colors.primary;
                ctx.textAlign = 'center';
                ctx.shadowBlur = theme.effects.glowIntensity;
                ctx.shadowColor = theme.colors.panelGlow;
                ctx.fillText(theme.layout.topBar.title, this.width / 2, barHeight / 2 + 7);
                ctx.shadowBlur = 0;
            }
        }

        // Holographic corner brackets
        if (theme.special && theme.special.cornerBrackets) {
            this.drawCornerBrackets(ctx);
        }
    }

    drawCornerBrackets(ctx) {
        const size = 40;
        const padding = 10;
        const color = this.theme.colors.panelBorder;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(padding, padding + size);
        ctx.lineTo(padding, padding);
        ctx.lineTo(padding + size, padding);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(this.width - padding - size, padding);
        ctx.lineTo(this.width - padding, padding);
        ctx.lineTo(this.width - padding, padding + size);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(padding, this.height - padding - size);
        ctx.lineTo(padding, this.height - padding);
        ctx.lineTo(padding + size, this.height - padding);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(this.width - padding - size, this.height - padding);
        ctx.lineTo(this.width - padding, this.height - padding);
        ctx.lineTo(this.width - padding, this.height - padding - size);
        ctx.stroke();

        ctx.shadowBlur = 0;
    }

    drawScorePopups(ctx) {
        for (const popup of this.scorePopups) {
            const alpha = popup.life / popup.maxLife;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = `bold ${14 * popup.scale}px ${this.theme.fonts.score}`;
            ctx.fillStyle = popup.color;
            ctx.textAlign = 'center';
            ctx.shadowBlur = 10;
            ctx.shadowColor = popup.color;

            const text = popup.amount > 0 ? `+${popup.amount}` : `${popup.amount}`;
            ctx.fillText(text, popup.x, popup.y);

            ctx.restore();
        }
    }

    drawThemeOverlay(ctx) {
        const theme = this.theme;

        // Scanlines
        if (theme.effects.scanlines) {
            ctx.fillStyle = `rgba(0, 0, 0, ${theme.effects.scanlineAlpha || 0.05})`;
            const spacing = theme.effects.scanlineSpacing || 2;

            for (let y = 0; y < this.height; y += spacing * 2) {
                ctx.fillRect(0, y, this.width, spacing);
            }
        }

        // Phosphor glow (CRT)
        if (theme.effects.phosphorGlow) {
            const gradient = ctx.createRadialGradient(
                this.width / 2, this.height / 2, 0,
                this.width / 2, this.height / 2, Math.max(this.width, this.height) / 2
            );
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, this.width, this.height);
        }
    }

    // Legacy methods for backwards compatibility
    drawScore(ctx, gameState, theme) {
        this.scoreDisplay.draw(ctx);
    }

    drawHighScore(ctx, gameState, theme) {
        this.highScoreDisplay.draw(ctx);
    }

    drawWave(ctx, gameState, theme) {
        this.waveDisplay.draw(ctx);
    }

    drawLives(ctx, gameState, theme) {
        this.livesDisplay.draw(ctx);
    }

    drawBombs(ctx, gameState, theme) {
        this.bombsDisplay.draw(ctx);
    }

    drawWaveAnnouncement(ctx, gameState, theme) {
        // Wave announcement is now handled by WaveDisplay
        const x = this.width / 2;
        const y = this.height / 2 - 50;

        const alpha = Math.min(1, (gameState.themeChangeTimer || 0) / 30);
        const scale = 1 + (1 - alpha) * 0.2;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;

        // Wave number
        ctx.textAlign = 'center';
        ctx.font = `bold 64px ${this.theme.fonts.title}`;
        ctx.shadowBlur = 30;
        ctx.shadowColor = this.theme.colors.wave;
        ctx.fillStyle = this.theme.colors.wave;
        ctx.fillText(`WAVE ${gameState.wave}`, 0, 0);

        // Theme name
        const waveTheme = getCurrentTheme(gameState.wave);
        if (waveTheme) {
            ctx.font = `bold 32px ${this.theme.fonts.primary}`;
            ctx.shadowColor = this.theme.colors.secondary;
            ctx.fillStyle = this.theme.colors.secondary;
            ctx.fillText(waveTheme.name, 0, 50);
        }

        ctx.restore();
    }

    drawGetReady(ctx) {
        const x = this.width / 2;
        const y = this.height / 2;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold 48px ${this.theme.fonts.title}`;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.theme.colors.success;
        ctx.fillStyle = this.theme.colors.success;
        ctx.fillText('GET READY!', x, y);
        ctx.restore();
    }

    drawBossWarning(ctx) {
        const x = this.width / 2;
        const y = 100;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = `bold 36px ${this.theme.fonts.title}`;

        // Flashing effect
        const flash = Math.sin(Date.now() * 0.01) > 0;
        ctx.shadowBlur = flash ? 30 : 15;
        ctx.shadowColor = this.theme.colors.warning;
        ctx.fillStyle = flash ? this.theme.colors.warning : '#ff6600';
        ctx.fillText('WARNING: BOSS APPROACHING', x, y);
        ctx.restore();
    }
}
