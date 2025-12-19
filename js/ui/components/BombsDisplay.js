/**
 * Geometry 3044 - Bombs Display Component
 * Bomb counter with various icon styles
 */

export class BombsDisplay {
    constructor(theme) {
        this.theme = theme;
        this.config = theme.layout.bombs;

        this.currentBombs = 0;
        this.displayBombs = [];
        this.x = 0;
        this.y = 0;
        this.screenWidth = 0;
        this.screenHeight = 0;

        // Animation
        this.flashTimer = 0;
    }

    resize(width, height) {
        this.screenWidth = width;
        this.screenHeight = height;
        this.x = this.config.x >= 0 ? this.config.x : width + this.config.x;
        this.y = this.config.y >= 0 ? this.config.y : height + this.config.y;
    }

    update(bombs, deltaTime = 1) {
        // Detect bomb usage
        if (bombs < this.currentBombs) {
            this.flashTimer = 30;
        }

        // Update display array with animation
        while (this.displayBombs.length < bombs) {
            this.displayBombs.push({ scale: 0, alpha: 0 });
        }
        while (this.displayBombs.length > bombs) {
            this.displayBombs.pop();
        }

        // Animate in
        this.displayBombs.forEach((bomb) => {
            bomb.scale = Math.min(1, bomb.scale + 0.1 * deltaTime);
            bomb.alpha = Math.min(1, bomb.alpha + 0.1 * deltaTime);
        });

        this.currentBombs = bombs;

        // Decay flash timer
        this.flashTimer = Math.max(0, this.flashTimer - deltaTime);
    }

    draw(ctx) {
        const theme = this.theme;
        const config = this.config;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Prefix text (for CRT style)
        if (config.prefix) {
            ctx.font = `${config.iconSize}px ${theme.fonts.primary}`;
            ctx.fillStyle = theme.colors.bombs;
            ctx.textAlign = 'left';
            if (theme.effects.glow) {
                ctx.shadowBlur = theme.effects.glowIntensity;
                ctx.shadowColor = theme.colors.bombs;
            }
            ctx.fillText(config.prefix, 0, config.iconSize * 0.8);
            ctx.translate(config.prefix.length * 10, 0);
            ctx.shadowBlur = 0;
        }

        // Flash effect on bomb use
        const flashAlpha = this.flashTimer > 0 ? 0.5 + Math.sin(this.flashTimer * 0.5) * 0.5 : 1;
        ctx.globalAlpha = flashAlpha;

        // Draw bomb icons
        for (let i = 0; i < config.maxDisplay; i++) {
            const hasBomb = i < this.displayBombs.length;
            const bomb = this.displayBombs[i];
            const x = i * config.spacing;

            ctx.save();
            ctx.translate(x + config.iconSize / 2, config.iconSize / 2);

            if (hasBomb && bomb) {
                ctx.scale(bomb.scale, bomb.scale);
                ctx.globalAlpha = bomb.alpha * flashAlpha;
            } else {
                ctx.globalAlpha = 0.2;
            }

            // Draw based on style
            if (config.style === 'bombs') {
                this.drawBomb(ctx, config.iconSize, theme.colors.bombs, hasBomb);
            } else if (config.style === 'icons') {
                this.drawIcon(ctx, config.iconSize, theme.colors.bombs, hasBomb);
            } else {
                this.drawDot(ctx, config.iconSize, theme.colors.bombs, hasBomb);
            }

            ctx.restore();
        }

        ctx.restore();
    }

    drawBomb(ctx, size, color, filled) {
        ctx.fillStyle = filled ? color : 'transparent';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        if (this.theme.effects.glow && filled) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
        }

        // Bomb body
        const radius = size * 0.35;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        if (filled) ctx.fill();
        ctx.stroke();

        // Fuse
        ctx.beginPath();
        ctx.moveTo(radius * 0.5, -radius * 0.7);
        ctx.lineTo(radius * 0.8, -radius * 1.2);
        ctx.stroke();

        // Spark
        if (filled) {
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(radius * 0.8, -radius * 1.2, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 0;
    }

    drawIcon(ctx, size, color, filled) {
        ctx.fillStyle = filled ? color : 'transparent';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;

        if (this.theme.effects.glow && filled) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
        }

        // Hexagonal icon
        const s = size / 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3 - Math.PI / 6;
            const x = Math.cos(angle) * s * 0.6;
            const y = Math.sin(angle) * s * 0.6;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
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
