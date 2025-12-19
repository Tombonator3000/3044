/**
 * Geometry 3044 - High Score Display Component
 * Shows high score with various style options
 */

export class HighScoreDisplay {
    constructor(theme) {
        this.theme = theme;
        this.config = theme.layout.highScore;

        this.highScore = 0;
        this.displayScore = 0;
        this.x = 0;
        this.y = 0;
        this.screenWidth = 0;
        this.screenHeight = 0;

        // Animation
        this.pulsePhase = 0;
        this.isNewHighScore = false;
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
    }

    update(highScore, deltaTime = 1) {
        // Detect new high score
        if (highScore > this.highScore) {
            this.isNewHighScore = true;
            this.pulsePhase = 1;
        }

        this.highScore = highScore;

        // Smooth display animation
        const diff = this.highScore - this.displayScore;
        if (Math.abs(diff) > 1) {
            this.displayScore += diff * 0.1;
        } else {
            this.displayScore = this.highScore;
        }

        // Decay pulse
        if (this.isNewHighScore) {
            this.pulsePhase += 0.1 * deltaTime;
        }
    }

    draw(ctx) {
        if (this.config.style === 'hidden') return;

        const theme = this.theme;
        const config = this.config;

        ctx.save();
        ctx.translate(this.x, this.y);

        if (config.style === 'boxed') {
            this.drawBoxedStyle(ctx);
        } else if (config.style === 'terminal') {
            this.drawTerminalStyle(ctx);
        } else {
            this.drawMinimalStyle(ctx);
        }

        ctx.restore();
    }

    drawMinimalStyle(ctx) {
        const theme = this.theme;
        const config = this.config;

        ctx.font = `${config.fontSize}px ${theme.fonts.primary}`;
        ctx.fillStyle = theme.colors.secondary;
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.7;

        if (theme.effects.glow) {
            ctx.shadowBlur = theme.effects.glowIntensity / 2;
            ctx.shadowColor = theme.colors.secondary;
        }

        const prefix = config.prefix || 'HI: ';
        const scoreText = Math.floor(this.displayScore).toLocaleString();
        ctx.fillText(`${prefix}${scoreText}`, 0, 0);

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }

    drawBoxedStyle(ctx) {
        const theme = this.theme;
        const config = this.config;
        const scoreText = Math.floor(this.displayScore).toLocaleString();

        ctx.font = `bold ${config.fontSize}px ${theme.fonts.primary}`;
        const textWidth = ctx.measureText(`HIGH SCORE: ${scoreText}`).width;
        const boxWidth = textWidth + 30;
        const boxHeight = config.fontSize + 16;

        // Box background
        ctx.fillStyle = theme.colors.panelBg;
        ctx.strokeStyle = theme.colors.secondary;
        ctx.lineWidth = 1;

        if (this.isNewHighScore) {
            ctx.strokeStyle = `hsl(${(this.pulsePhase * 60) % 360}, 100%, 50%)`;
        }

        ctx.fillRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);
        ctx.strokeRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);

        // Text
        ctx.fillStyle = theme.colors.secondary;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (theme.effects.glow) {
            ctx.shadowBlur = theme.effects.glowIntensity;
            ctx.shadowColor = theme.colors.secondary;
        }

        ctx.fillText(`HIGH SCORE: ${scoreText}`, 0, 0);
        ctx.shadowBlur = 0;

        // New high score indicator
        if (this.isNewHighScore) {
            ctx.font = `10px ${theme.fonts.primary}`;
            ctx.fillStyle = theme.colors.accent;
            const flash = Math.sin(this.pulsePhase * 5) > 0;
            if (flash) {
                ctx.fillText('NEW!', boxWidth / 2 - 20, -boxHeight / 2 + 8);
            }
        }
    }

    drawTerminalStyle(ctx) {
        const theme = this.theme;
        const config = this.config;

        ctx.font = `${config.fontSize}px ${theme.fonts.primary}`;
        ctx.fillStyle = theme.colors.primary;
        ctx.textAlign = 'center';

        if (theme.effects.glow) {
            ctx.shadowBlur = theme.effects.glowIntensity;
            ctx.shadowColor = theme.colors.primary;
        }

        const prefix = config.prefix || 'HI-';
        const scoreText = Math.floor(this.displayScore).toLocaleString();
        ctx.fillText(`${prefix}${scoreText}`, 0, 0);

        ctx.shadowBlur = 0;
    }
}
