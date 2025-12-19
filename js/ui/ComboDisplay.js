/**
 * Geometry 3044 - ComboDisplay Module
 * Visual combo meter and multiplier display
 */

import { CONFIG, getCurrentTheme } from '../config.js';

/**
 * ComboDisplay class - renders combo meter and multiplier
 */
export class ComboDisplay {
    constructor() {
        // Position (right side of screen)
        this.x = CONFIG.screen.width - 120;
        this.y = 150;
        this.width = 100;
        this.height = 200;

        // Animation state
        this.displayCombo = 0;
        this.targetCombo = 0;
        this.meterFill = 0;
        this.pulseTimer = 0;
        this.shakeX = 0;
        this.shakeY = 0;

        // Combo tier thresholds
        this.tiers = [
            { threshold: 0, color: '#666666', name: '' },
            { threshold: 3, color: '#00ff00', name: 'NICE!' },
            { threshold: 5, color: '#00ffff', name: 'COOL!' },
            { threshold: 10, color: '#ffff00', name: 'GREAT!' },
            { threshold: 15, color: '#ff6600', name: 'AWESOME!' },
            { threshold: 20, color: '#ff00ff', name: 'AMAZING!' },
            { threshold: 30, color: '#ff0066', name: 'INCREDIBLE!' },
            { threshold: 50, color: '#ffffff', name: 'LEGENDARY!' }
        ];

        // Floating score popups
        this.popups = [];
    }

    /**
     * Get current tier based on combo
     * @param {number} combo - Current combo count
     * @returns {Object} Tier object
     */
    getCurrentTier(combo) {
        let tier = this.tiers[0];
        for (let i = this.tiers.length - 1; i >= 0; i--) {
            if (combo >= this.tiers[i].threshold) {
                tier = this.tiers[i];
                break;
            }
        }
        return tier;
    }

    /**
     * Add a score popup
     * @param {number} score - Points scored
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} combo - Current combo for color
     */
    addScorePopup(score, x, y, combo = 1) {
        const tier = this.getCurrentTier(combo);
        this.popups.push({
            score: score,
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 2,
            vy: -3,
            life: 60,
            maxLife: 60,
            color: tier.color,
            size: Math.min(24, 14 + combo * 0.5)
        });
    }

    /**
     * Update combo display
     * @param {GameState} gameState - Current game state
     */
    update(gameState) {
        // Smooth combo animation
        if (this.targetCombo !== gameState.combo) {
            // Check if combo increased
            if (gameState.combo > this.targetCombo) {
                this.pulseTimer = 20;
                this.shakeX = (Math.random() - 0.5) * 10;
                this.shakeY = (Math.random() - 0.5) * 10;
            }
            this.targetCombo = gameState.combo;
        }

        // Smooth display value
        const diff = this.targetCombo - this.displayCombo;
        if (Math.abs(diff) > 0.1) {
            this.displayCombo += diff * 0.2;
        } else {
            this.displayCombo = this.targetCombo;
        }

        // Update meter fill based on combo timer
        if (gameState.comboTimer > 0) {
            this.meterFill = gameState.comboTimer / CONFIG.game.comboTimeout;
        } else {
            this.meterFill = 0;
        }

        // Decay pulse and shake
        if (this.pulseTimer > 0) this.pulseTimer--;
        this.shakeX *= 0.9;
        this.shakeY *= 0.9;

        // Update popups
        this.popups = this.popups.filter(popup => {
            popup.x += popup.vx;
            popup.y += popup.vy;
            popup.vy += 0.05; // gravity
            popup.life--;
            return popup.life > 0;
        });
    }

    /**
     * Draw combo display
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {GameState} gameState - Current game state
     */
    draw(ctx, gameState) {
        if (gameState.combo <= 0) {
            // Only draw popups if no combo
            this.drawPopups(ctx);
            return;
        }

        const tier = this.getCurrentTier(gameState.combo);
        const pulseScale = 1 + (this.pulseTimer / 20) * 0.2;

        ctx.save();
        ctx.translate(this.x + this.shakeX, this.y + this.shakeY);

        // Draw combo meter background
        this.drawMeterBackground(ctx);

        // Draw meter fill
        this.drawMeterFill(ctx, tier);

        // Draw combo number
        this.drawComboNumber(ctx, gameState, tier, pulseScale);

        // Draw multiplier text
        this.drawMultiplierText(ctx, gameState, tier);

        // Draw tier name
        if (tier.name) {
            this.drawTierName(ctx, tier, pulseScale);
        }

        ctx.restore();

        // Draw score popups
        this.drawPopups(ctx);
    }

    /**
     * Draw meter background
     */
    drawMeterBackground(ctx) {
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 3;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';

        // Meter outline
        ctx.beginPath();
        ctx.roundRect(-40, 0, 80, this.height, 5);
        ctx.fill();
        ctx.stroke();
    }

    /**
     * Draw meter fill
     */
    drawMeterFill(ctx, tier) {
        const fillHeight = this.height * this.meterFill;

        if (fillHeight > 0) {
            // Create gradient
            const gradient = ctx.createLinearGradient(0, this.height, 0, this.height - fillHeight);
            gradient.addColorStop(0, tier.color);
            gradient.addColorStop(1, this.adjustColor(tier.color, 0.5));

            ctx.fillStyle = gradient;
            ctx.shadowBlur = 15;
            ctx.shadowColor = tier.color;

            ctx.beginPath();
            ctx.roundRect(-38, this.height - fillHeight + 2, 76, fillHeight - 4, 3);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    /**
     * Draw combo number
     */
    drawComboNumber(ctx, gameState, tier, pulseScale) {
        ctx.save();
        ctx.translate(0, -40);
        ctx.scale(pulseScale, pulseScale);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 48px "Courier New", monospace';
        ctx.shadowBlur = 20;
        ctx.shadowColor = tier.color;
        ctx.fillStyle = tier.color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;

        const comboText = Math.floor(this.displayCombo).toString();
        ctx.strokeText(comboText, 0, 0);
        ctx.fillText(comboText, 0, 0);

        ctx.restore();
    }

    /**
     * Draw multiplier text
     */
    drawMultiplierText(ctx, gameState, tier) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.shadowBlur = 10;
        ctx.shadowColor = tier.color;
        ctx.fillStyle = tier.color;
        ctx.fillText(`x${Math.max(1, gameState.combo)}`, 0, -70);
        ctx.fillText('COMBO', 0, this.height + 20);
    }

    /**
     * Draw tier name
     */
    drawTierName(ctx, tier, pulseScale) {
        ctx.save();
        ctx.translate(0, this.height + 45);
        ctx.scale(pulseScale, pulseScale);

        ctx.textAlign = 'center';
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.shadowBlur = 15;
        ctx.shadowColor = tier.color;
        ctx.fillStyle = tier.color;
        ctx.fillText(tier.name, 0, 0);

        ctx.restore();
    }

    /**
     * Draw floating score popups
     */
    drawPopups(ctx) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        this.popups.forEach(popup => {
            const alpha = popup.life / popup.maxLife;
            ctx.globalAlpha = alpha;
            ctx.font = `bold ${popup.size}px "Courier New", monospace`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = popup.color;
            ctx.fillStyle = popup.color;
            ctx.fillText(`+${popup.score}`, popup.x, popup.y);
        });

        ctx.restore();
    }

    /**
     * Adjust color brightness
     * @param {string} color - Hex color
     * @param {number} factor - Brightness factor (0-2)
     * @returns {string} Adjusted color
     */
    adjustColor(color, factor) {
        const hex = color.replace('#', '');
        const r = Math.min(255, Math.floor(parseInt(hex.substr(0, 2), 16) * factor));
        const g = Math.min(255, Math.floor(parseInt(hex.substr(2, 2), 16) * factor));
        const b = Math.min(255, Math.floor(parseInt(hex.substr(4, 2), 16) * factor));
        return `rgb(${r}, ${g}, ${b})`;
    }
}
