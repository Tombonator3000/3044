/**
 * Geometry 3044 - Score Display Component
 * Animated score counter with theme support
 */

export class ScoreDisplay {
    constructor(theme) {
        this.theme = theme;
        this.config = theme.layout.score;

        this.currentScore = 0;
        this.displayScore = 0;
        this.targetScore = 0;

        // Position (calculated on resize)
        this.x = 0;
        this.y = 0;
        this.screenWidth = 0;
        this.screenHeight = 0;

        // Animation
        this.pulseScale = 1;
        this.glowIntensity = 0;

        // Progress to next life
        this.progressPercent = 0;
        this.nextLifeThreshold = 100000;
    }

    resize(width, height) {
        this.screenWidth = width;
        this.screenHeight = height;
        // Handle negative values (from right edge)
        this.x = this.config.x >= 0 ? this.config.x : width + this.config.x;
        this.y = this.config.y >= 0 ? this.config.y : height + this.config.y;
    }

    update(score, deltaTime = 1) {
        this.targetScore = score;

        // Smooth interpolation
        const diff = this.targetScore - this.displayScore;
        if (Math.abs(diff) > 1) {
            // Faster when larger difference
            const speed = Math.max(1, Math.abs(diff) * 0.1);
            this.displayScore += Math.sign(diff) * Math.min(speed, Math.abs(diff));

            // Pulse when score increases
            this.pulseScale = 1.1;
            this.glowIntensity = 1;
        } else {
            this.displayScore = this.targetScore;
        }

        // Decay animations
        this.pulseScale = Math.max(1, this.pulseScale - 0.01 * deltaTime);
        this.glowIntensity = Math.max(0, this.glowIntensity - 0.02 * deltaTime);

        // Progress calculation
        this.progressPercent = (score % this.nextLifeThreshold) / this.nextLifeThreshold;
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

        // Label
        ctx.font = `${config.labelSize}px ${theme.fonts.primary}`;
        ctx.fillStyle = theme.colors.primary;
        ctx.globalAlpha = 0.7;
        ctx.textAlign = 'left';
        ctx.fillText('SCORE', 10, 18);
        ctx.globalAlpha = 1;

        // Score value with animation
        ctx.save();
        ctx.translate(10, 45);
        ctx.scale(this.pulseScale, this.pulseScale);

        ctx.font = `bold ${config.fontSize}px ${theme.fonts.score}`;
        ctx.fillStyle = theme.colors.score;

        // Glow effect
        if (theme.effects.glow) {
            ctx.shadowBlur = theme.effects.glowIntensity + (this.glowIntensity * 10);
            ctx.shadowColor = theme.colors.score;
        }

        // Format score with thousands separator
        const scoreText = Math.floor(this.displayScore).toLocaleString();
        ctx.fillText(scoreText, 0, 0);

        ctx.restore();

        // Progress bar to next life
        if (config.showProgress) {
            const barY = config.progressBelow ? config.height - 8 : 55;
            const barWidth = config.width - 20;

            // Background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(10, barY, barWidth, 4);

            // Progress
            const gradient = ctx.createLinearGradient(10, 0, 10 + barWidth, 0);
            gradient.addColorStop(0, theme.colors.score);
            gradient.addColorStop(1, theme.colors.accent);
            ctx.fillStyle = gradient;
            ctx.fillRect(10, barY, barWidth * this.progressPercent, 4);
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
