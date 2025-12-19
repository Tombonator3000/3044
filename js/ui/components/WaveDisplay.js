/**
 * Geometry 3044 - Wave Display Component
 * Wave number and theme name display with animations
 */

export class WaveDisplay {
    constructor(theme) {
        this.theme = theme;
        this.config = theme.layout.wave;

        this.currentWave = 1;
        this.displayWave = 1;
        this.themeName = '';

        // Position
        this.x = 0;
        this.y = 0;
        this.screenWidth = 0;
        this.screenHeight = 0;

        // Animation
        this.flashTimer = 0;
        this.pulseScale = 1;
    }

    resize(width, height) {
        this.screenWidth = width;
        this.screenHeight = height;
        this.x = this.config.x >= 0 ? this.config.x : width + this.config.x;
        this.y = this.config.y >= 0 ? this.config.y : height + this.config.y;
    }

    update(wave, themeName, deltaTime = 1) {
        // Detect wave change
        if (wave !== this.currentWave) {
            this.flashTimer = 60;
            this.pulseScale = 1.3;
        }

        this.currentWave = wave;
        this.displayWave = wave;
        this.themeName = themeName || '';

        // Decay animations
        this.flashTimer = Math.max(0, this.flashTimer - deltaTime);
        this.pulseScale = Math.max(1, this.pulseScale - 0.02 * deltaTime);
    }

    draw(ctx) {
        const theme = this.theme;
        const config = this.config;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Panel background (if applicable)
        if (theme.effects.panelStyle !== 'none') {
            this.drawPanel(ctx, 0, 0, config.width, config.height);
        }

        // Flash effect
        const flashAlpha = this.flashTimer > 0 ? 0.5 + Math.sin(this.flashTimer * 0.3) * 0.5 : 1;
        ctx.globalAlpha = flashAlpha;

        // Wave text
        ctx.save();
        ctx.translate(config.width / 2, 35);
        ctx.scale(this.pulseScale, this.pulseScale);

        ctx.textAlign = 'center';
        ctx.font = `bold ${config.fontSize}px ${theme.fonts.primary}`;
        ctx.fillStyle = theme.colors.wave;

        if (theme.effects.glow) {
            ctx.shadowBlur = theme.effects.glowIntensity;
            ctx.shadowColor = theme.colors.wave;
        }

        const prefix = config.prefix || 'WAVE ';
        ctx.fillText(`${prefix}${this.displayWave}`, 0, 0);
        ctx.restore();

        // Theme name (if enabled)
        if (config.showThemeName && this.themeName) {
            ctx.font = `${10}px ${theme.fonts.primary}`;
            ctx.fillStyle = theme.colors.secondary;
            ctx.globalAlpha = 0.7;
            ctx.textAlign = 'center';
            ctx.fillText(this.themeName, config.width / 2, 55);
        }

        ctx.restore();
    }

    drawPanel(ctx, x, y, width, height) {
        const theme = this.theme;

        ctx.fillStyle = theme.colors.panelBg;
        ctx.strokeStyle = theme.colors.panelBorder;
        ctx.lineWidth = 2;

        if (theme.effects.panelStyle === 'rounded') {
            this.roundRect(ctx, x, y, width, height, 8);
            ctx.fill();
            ctx.stroke();
        } else if (theme.effects.panelStyle === 'angular' || theme.effects.panelStyle === 'hexagonal') {
            this.angularRect(ctx, x, y, width, height, 10);
            ctx.fill();
            ctx.stroke();
        } else if (theme.effects.panelStyle === 'terminal') {
            ctx.fillRect(x, y, width, height);
            ctx.strokeRect(x, y, width, height);
        } else {
            ctx.fillRect(x, y, width, height);
        }
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

    angularRect(ctx, x, y, w, h, cut) {
        ctx.beginPath();
        ctx.moveTo(x + cut, y);
        ctx.lineTo(x + w - cut, y);
        ctx.lineTo(x + w, y + cut);
        ctx.lineTo(x + w, y + h - cut);
        ctx.lineTo(x + w - cut, y + h);
        ctx.lineTo(x + cut, y + h);
        ctx.lineTo(x, y + h - cut);
        ctx.lineTo(x, y + cut);
        ctx.closePath();
    }
}
