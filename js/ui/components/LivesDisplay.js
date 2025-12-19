/**
 * Geometry 3044 - Lives Display Component
 * Animated life icons with theme support
 */

export class LivesDisplay {
    constructor(theme) {
        this.theme = theme;
        this.config = theme.layout.lives;

        this.currentLives = 0;
        this.displayLives = [];
        this.x = 0;
        this.y = 0;
        this.screenWidth = 0;
        this.screenHeight = 0;
    }

    resize(width, height) {
        this.screenWidth = width;
        this.screenHeight = height;
        this.x = this.config.x >= 0 ? this.config.x : width + this.config.x;
        this.y = this.config.y >= 0 ? this.config.y : height + this.config.y;
    }

    update(lives, deltaTime = 1) {
        // Update with animation
        while (this.displayLives.length < lives) {
            this.displayLives.push({ scale: 0, alpha: 0 });
        }
        while (this.displayLives.length > lives) {
            this.displayLives.pop();
        }

        // Animate in
        this.displayLives.forEach((life) => {
            life.scale = Math.min(1, life.scale + 0.1 * deltaTime);
            life.alpha = Math.min(1, life.alpha + 0.1 * deltaTime);
        });

        this.currentLives = lives;
    }

    draw(ctx) {
        const theme = this.theme;
        const config = this.config;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Prefix text (for CRT style)
        if (config.prefix) {
            ctx.font = `${config.iconSize}px ${theme.fonts.primary}`;
            ctx.fillStyle = theme.colors.lives;
            ctx.textAlign = 'left';
            if (theme.effects.glow) {
                ctx.shadowBlur = theme.effects.glowIntensity;
                ctx.shadowColor = theme.colors.lives;
            }
            ctx.fillText(config.prefix, 0, config.iconSize * 0.8);
            ctx.translate(config.prefix.length * 10, 0);
            ctx.shadowBlur = 0;
        }

        // Draw life icons
        for (let i = 0; i < config.maxDisplay; i++) {
            const hasLife = i < this.displayLives.length;
            const life = this.displayLives[i];
            const x = i * config.spacing;

            ctx.save();
            ctx.translate(x + config.iconSize / 2, config.iconSize / 2);

            if (hasLife && life) {
                ctx.scale(life.scale, life.scale);
                ctx.globalAlpha = life.alpha;
            } else {
                ctx.globalAlpha = 0.2;
            }

            // Draw based on style
            if (config.style === 'ships') {
                this.drawShip(ctx, config.iconSize, theme.colors.lives, hasLife);
            } else if (config.style === 'hearts') {
                this.drawHeart(ctx, config.iconSize, theme.colors.lives, hasLife);
            } else {
                this.drawDot(ctx, config.iconSize, theme.colors.lives, hasLife);
            }

            ctx.restore();
        }

        ctx.restore();
    }

    drawShip(ctx, size, color, filled) {
        ctx.fillStyle = filled ? color : 'transparent';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        if (this.theme.effects.glow && filled) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
        }

        const s = size / 2;
        ctx.beginPath();
        ctx.moveTo(0, -s);        // Top
        ctx.lineTo(s * 0.7, s);   // Bottom right
        ctx.lineTo(0, s * 0.5);   // Bottom middle
        ctx.lineTo(-s * 0.7, s);  // Bottom left
        ctx.closePath();

        if (filled) ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    drawHeart(ctx, size, color, filled) {
        ctx.fillStyle = filled ? color : 'transparent';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;

        if (this.theme.effects.glow && filled) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
        }

        const s = size / 2;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.3);
        ctx.bezierCurveTo(-s, -s * 0.5, -s, s * 0.3, 0, s);
        ctx.bezierCurveTo(s, s * 0.3, s, -s * 0.5, 0, s * 0.3);
        ctx.closePath();

        if (filled) ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    drawDot(ctx, size, color, filled) {
        ctx.fillStyle = filled ? color : 'rgba(255,255,255,0.2)';

        if (this.theme.effects.glow && filled) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = color;
        }

        ctx.beginPath();
        ctx.arc(0, 0, size / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}
