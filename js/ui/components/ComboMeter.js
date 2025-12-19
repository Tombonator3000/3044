/**
 * Geometry 3044 - Combo Meter Component
 * Animated combo bar with multiple style options
 */

export class ComboMeter {
    constructor(theme) {
        this.theme = theme;
        this.config = theme.layout.combo;

        this.combo = 0;
        this.displayCombo = 0;
        this.comboPercent = 0;
        this.visible = false;
        this.fadeAlpha = 0;
        this.pulsePhase = 0;
        this.rainbowPhase = 0;

        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.screenWidth = 0;
        this.screenHeight = 0;
    }

    resize(width, height) {
        this.screenWidth = width;
        this.screenHeight = height;

        if (this.config.x === 'center') {
            this.x = width / 2;
        } else {
            this.x = this.config.x >= 0 ? this.config.x : width + this.config.x;
        }

        this.y = this.config.y >= 0 ? this.config.y : height + this.config.y;
        this.width = this.config.width;
    }

    update(combo, comboTimer, comboTimeout, deltaTime = 1) {
        this.combo = combo;
        this.comboPercent = comboTimeout > 0 ? comboTimer / comboTimeout : 0;

        // Visibility
        if (combo > 0) {
            this.visible = true;
            this.fadeAlpha = Math.min(1, this.fadeAlpha + 0.1 * deltaTime);
        } else {
            this.fadeAlpha = Math.max(0, this.fadeAlpha - 0.05 * deltaTime);
            if (this.fadeAlpha <= 0) this.visible = false;
        }

        // Animate display combo
        if (this.displayCombo !== combo) {
            this.displayCombo += Math.sign(combo - this.displayCombo);
            this.pulsePhase = 1;
        }

        // Decay pulse
        this.pulsePhase = Math.max(0, this.pulsePhase - 0.05 * deltaTime);

        // Rainbow animation for high combos
        if (this.config.rainbowWhenHigh && combo >= this.config.highThreshold) {
            this.rainbowPhase += 0.05 * deltaTime;
        }
    }

    draw(ctx) {
        if (!this.visible && this.fadeAlpha <= 0) return;

        const theme = this.theme;
        const config = this.config;

        ctx.save();
        ctx.globalAlpha = this.fadeAlpha;
        ctx.translate(this.x, this.y);

        const halfWidth = config.width / 2;

        // Choose style
        if (config.style === 'line') {
            this.drawLineStyle(ctx, halfWidth);
        } else if (config.style === 'ascii') {
            this.drawAsciiStyle(ctx, halfWidth);
        } else if (config.style === 'holographic') {
            this.drawHolographicStyle(ctx, halfWidth);
        } else {
            this.drawDefaultStyle(ctx, halfWidth);
        }

        ctx.restore();
    }

    drawDefaultStyle(ctx, halfWidth) {
        const theme = this.theme;
        const config = this.config;
        const height = config.height;

        // Background bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.roundRect(ctx, -halfWidth, -height / 2, config.width, height, 5);
        ctx.fill();

        // Progress bar
        const progressWidth = config.width * (1 - this.comboPercent);

        if (config.rainbowWhenHigh && this.combo >= config.highThreshold) {
            // Rainbow gradient
            const gradient = ctx.createLinearGradient(-halfWidth, 0, halfWidth, 0);
            const hue1 = (this.rainbowPhase * 360) % 360;
            const hue2 = (this.rainbowPhase * 360 + 60) % 360;
            const hue3 = (this.rainbowPhase * 360 + 120) % 360;
            gradient.addColorStop(0, `hsl(${hue1}, 100%, 50%)`);
            gradient.addColorStop(0.5, `hsl(${hue2}, 100%, 50%)`);
            gradient.addColorStop(1, `hsl(${hue3}, 100%, 50%)`);
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = theme.colors.combo;
        }

        ctx.shadowBlur = theme.effects.glowIntensity;
        ctx.shadowColor = theme.colors.combo;

        this.roundRect(ctx, -halfWidth + 2, -height / 2 + 2, progressWidth - 4, height - 4, 3);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Combo text
        const scale = 1 + this.pulsePhase * 0.3;
        ctx.save();
        ctx.scale(scale, scale);

        ctx.font = `bold 24px ${theme.fonts.primary}`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 15;
        ctx.shadowColor = theme.colors.combo;

        const comboText = `${this.displayCombo}x COMBO`;
        ctx.fillText(comboText, 0, 0);

        ctx.restore();

        // Multiplier indicator
        if (config.showMultiplier && this.combo > 0) {
            ctx.font = `14px ${theme.fonts.primary}`;
            ctx.fillStyle = theme.colors.accent;
            ctx.textAlign = 'center';
            ctx.fillText(`SCORE x${this.combo}`, 0, height / 2 + 15);
        }
    }

    drawLineStyle(ctx, halfWidth) {
        const theme = this.theme;
        const config = this.config;

        // Thin line background
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-halfWidth, 0);
        ctx.lineTo(halfWidth, 0);
        ctx.stroke();

        // Progress line
        const progressWidth = config.width * (1 - this.comboPercent);
        ctx.strokeStyle = theme.colors.combo;
        ctx.shadowBlur = 8;
        ctx.shadowColor = theme.colors.combo;
        ctx.beginPath();
        ctx.moveTo(-halfWidth, 0);
        ctx.lineTo(-halfWidth + progressWidth, 0);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Combo text above
        ctx.font = `bold 18px ${theme.fonts.primary}`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.displayCombo}x`, 0, -15);
    }

    drawAsciiStyle(ctx, halfWidth) {
        const theme = this.theme;
        const barLength = 20;
        const filled = Math.floor(barLength * (1 - this.comboPercent));

        ctx.font = `16px ${theme.fonts.primary}`;
        ctx.fillStyle = theme.colors.combo;
        ctx.textAlign = 'center';
        ctx.shadowBlur = theme.effects.glowIntensity;
        ctx.shadowColor = theme.colors.combo;

        const filledBar = '\u2588'.repeat(filled);
        const emptyBar = '\u2591'.repeat(barLength - filled);
        const bar = '[' + filledBar + emptyBar + ']';
        ctx.fillText(`COMBO ${this.displayCombo}x ${bar}`, 0, 0);

        ctx.shadowBlur = 0;
    }

    drawHolographicStyle(ctx, halfWidth) {
        const theme = this.theme;
        const config = this.config;

        // Hexagonal container
        ctx.strokeStyle = theme.colors.panelBorder;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = theme.colors.panelGlow;

        this.hexagonalRect(ctx, -halfWidth, -config.height / 2, config.width, config.height, 15);
        ctx.fillStyle = theme.colors.panelBg;
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Inner glow bar
        const progressWidth = (config.width - 30) * (1 - this.comboPercent);
        ctx.fillStyle = theme.colors.combo;
        ctx.shadowBlur = 20;
        ctx.shadowColor = theme.colors.combo;
        ctx.fillRect(-halfWidth + 15, -5, progressWidth, 10);
        ctx.shadowBlur = 0;

        // Holographic text with wobble
        const wobble = Math.sin(Date.now() * 0.005) * 2;
        ctx.font = `bold 22px ${theme.fonts.primary}`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`\u25C4 ${this.displayCombo}x COMBO \u25BA`, wobble, 0);
    }

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    hexagonalRect(ctx, x, y, w, h, cut) {
        ctx.beginPath();
        ctx.moveTo(x + cut, y);
        ctx.lineTo(x + w - cut, y);
        ctx.lineTo(x + w, y + h / 2);
        ctx.lineTo(x + w - cut, y + h);
        ctx.lineTo(x + cut, y + h);
        ctx.lineTo(x, y + h / 2);
        ctx.closePath();
    }
}
