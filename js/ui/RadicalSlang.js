/**
 * Geometry 3044 - RadicalSlang UI Module
 * Enhanced 80s radical slang popup system with more effects
 */

import { CONFIG, getCurrentTheme } from '../config.js';

/**
 * RadicalSlangUI class - Enhanced radical slang with UI integration
 * Extends functionality from effects/Explosions.js RadicalSlang
 */
export class RadicalSlangUI {
    constructor(soundSystem = null) {
        this.soundSystem = soundSystem;

        // Phrase definitions with combo thresholds
        this.phrases = [
            { text: "RADICAL!", minCombo: 3, color: '#ff00ff' },
            { text: "TUBULAR!", minCombo: 5, color: '#00ffff' },
            { text: "GNARLY!", minCombo: 8, color: '#ffff00' },
            { text: "BODACIOUS!", minCombo: 12, color: '#ff6600' },
            { text: "WICKED!", minCombo: 15, color: '#00ff00' },
            { text: "AWESOME!", minCombo: 20, color: '#ff0066' },
            { text: "RIGHTEOUS!", minCombo: 25, color: '#00ff88' },
            { text: "GROOVY!", minCombo: 30, color: '#ff00aa' },
            { text: "FAR OUT!", minCombo: 40, color: '#ffff00' },
            { text: "TOTALLY RAD!", minCombo: 50, color: '#ffffff' },
            { text: "MEGA COOL!", minCombo: 75, color: '#00ffff' },
            { text: "EXTREME!!!", minCombo: 100, color: '#ff0000' }
        ];

        // Kill streak phrases
        this.killStreakPhrases = [
            { text: "DOUBLE KILL!", kills: 2, color: '#00ffff' },
            { text: "TRIPLE KILL!", kills: 3, color: '#ffff00' },
            { text: "MULTI KILL!", kills: 4, color: '#ff6600' },
            { text: "MEGA KILL!", kills: 5, color: '#ff00ff' },
            { text: "ULTRA KILL!", kills: 6, color: '#ff0066' },
            { text: "MONSTER KILL!", kills: 7, color: '#ff0000' },
            { text: "GODLIKE!", kills: 10, color: '#ffffff' }
        ];

        // Active text displays
        this.activeTexts = [];

        // Kill tracking for streaks
        this.recentKills = 0;
        this.killStreakTimer = 0;
        this.killStreakWindow = 30; // frames to count as streak
    }

    /**
     * Trigger slang based on combo
     * @param {number} combo - Current combo count
     */
    triggerCombo(combo) {
        let phrase = null;
        for (let i = this.phrases.length - 1; i >= 0; i--) {
            if (combo >= this.phrases[i].minCombo) {
                phrase = this.phrases[i];
                break;
            }
        }

        if (phrase) {
            this.addText(phrase.text, phrase.color);

            // Play voice sample for high combos
            if (this.soundSystem && combo >= 25) {
                setTimeout(() => this.soundSystem.playVoiceSample('RADICAL'), 100);
            }
        }
    }

    /**
     * Register a kill for streak tracking
     */
    registerKill() {
        this.recentKills++;
        this.killStreakTimer = this.killStreakWindow;

        // Check for kill streak phrase
        let phrase = null;
        for (let i = this.killStreakPhrases.length - 1; i >= 0; i--) {
            if (this.recentKills >= this.killStreakPhrases[i].kills) {
                phrase = this.killStreakPhrases[i];
                break;
            }
        }

        if (phrase && this.recentKills === phrase.kills) {
            this.addText(phrase.text, phrase.color, 'bottom');
        }
    }

    /**
     * Trigger specific phrase
     * @param {string} text - Text to display
     * @param {string} color - Color of text
     * @param {string} position - 'center', 'top', or 'bottom'
     */
    addText(text, color = '#ff00ff', position = 'center') {
        let y;
        switch (position) {
            case 'top':
                y = CONFIG.screen.height * 0.25;
                break;
            case 'bottom':
                y = CONFIG.screen.height * 0.75;
                break;
            default:
                y = CONFIG.screen.height / 2 + (Math.random() - 0.5) * 100;
        }

        this.activeTexts.push({
            text: text,
            x: CONFIG.screen.width / 2 + (Math.random() - 0.5) * 150,
            y: y,
            color: color,
            scale: 0.3,
            targetScale: 1.2,
            alpha: 1,
            rotation: (Math.random() - 0.5) * 0.3,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            lifetime: 90,
            maxLifetime: 90,
            vy: -0.5
        });
    }

    /**
     * Trigger boss defeated text
     */
    triggerBossDefeated() {
        this.addText("BOSS DESTROYED!", '#ff0000', 'center');
        setTimeout(() => this.addText("EXCELLENT!", '#ffff00', 'bottom'), 500);
    }

    /**
     * Trigger wave complete text
     * @param {number} wave - Wave number completed
     */
    triggerWaveComplete(wave) {
        this.addText(`WAVE ${wave} COMPLETE!`, '#00ff00', 'center');
    }

    /**
     * Trigger power-up collected text
     * @param {string} powerUpName - Name of power-up
     */
    triggerPowerUp(powerUpName) {
        this.addText(powerUpName.toUpperCase() + "!", '#00ffff', 'top');
    }

    /**
     * Update all active texts
     */
    update() {
        // Update kill streak timer
        if (this.killStreakTimer > 0) {
            this.killStreakTimer--;
            if (this.killStreakTimer <= 0) {
                this.recentKills = 0;
            }
        }

        // Update active texts
        this.activeTexts = this.activeTexts.filter(text => {
            text.lifetime--;

            // Scale animation
            if (text.scale < text.targetScale) {
                text.scale += (text.targetScale - text.scale) * 0.15;
            }

            // Shrink at end
            if (text.lifetime < 20) {
                text.targetScale = 0.5;
            }

            // Fade out
            if (text.lifetime < 30) {
                text.alpha -= 0.033;
            }

            // Movement
            text.y += text.vy;
            text.rotation += text.rotationSpeed;

            return text.lifetime > 0 && text.alpha > 0;
        });
    }

    /**
     * Draw all active texts
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        this.activeTexts.forEach(text => {
            this.drawText(ctx, text);
        });
    }

    /**
     * Draw a single text effect
     */
    drawText(ctx, text) {
        ctx.save();
        ctx.translate(text.x, text.y);
        ctx.scale(text.scale, text.scale);
        ctx.rotate(text.rotation);

        ctx.font = 'bold 48px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = text.alpha;

        // Create rainbow gradient for special texts
        let fillStyle;
        if (text.text.includes('!!!') || text.text === 'GODLIKE!') {
            const gradient = ctx.createLinearGradient(-150, 0, 150, 0);
            gradient.addColorStop(0, '#ff0000');
            gradient.addColorStop(0.17, '#ff6600');
            gradient.addColorStop(0.33, '#ffff00');
            gradient.addColorStop(0.5, '#00ff00');
            gradient.addColorStop(0.67, '#00ffff');
            gradient.addColorStop(0.83, '#0066ff');
            gradient.addColorStop(1, '#ff00ff');
            fillStyle = gradient;
        } else {
            fillStyle = text.color;
        }

        // Glow effect
        ctx.shadowBlur = 25;
        ctx.shadowColor = text.color;

        // Outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText(text.text, 0, 0);

        // Fill
        ctx.fillStyle = fillStyle;
        ctx.fillText(text.text, 0, 0);

        // Extra glow pass
        ctx.shadowBlur = 15;
        ctx.globalAlpha = text.alpha * 0.5;
        ctx.fillText(text.text, 0, 0);

        ctx.restore();
    }

    /**
     * Clear all active texts
     */
    clear() {
        this.activeTexts = [];
        this.recentKills = 0;
        this.killStreakTimer = 0;
    }
}
