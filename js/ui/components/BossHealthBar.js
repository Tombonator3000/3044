/**
 * Geometry 3044 - Boss Health Bar Component
 * Animated boss health display with multiple styles
 */

export class BossHealthBar {
    constructor(theme) {
        this.theme = theme;
        this.config = theme.layout.bossHealth;

        this.visible = false;
        this.fadeAlpha = 0;
        this.bossName = '';
        this.health = 0;
        this.maxHealth = 0;
        this.displayHealth = 0;

        this.shakeOffset = 0;
        this.damageFlash = 0;

        this.x = 0;
        this.y = 0;
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
    }

    show(name, health, maxHealth) {
        this.visible = true;
        this.bossName = name;
        this.maxHealth = maxHealth;

        // Check for damage
        if (health < this.health) {
            this.damageFlash = 1;
            this.shakeOffset = 5;
        }

        this.health = health;
    }

    hide() {
        this.visible = false;
    }

    update(deltaTime = 1) {
        // Fade in/out
        if (this.visible) {
            this.fadeAlpha = Math.min(1, this.fadeAlpha + 0.05 * deltaTime);
        } else {
            this.fadeAlpha = Math.max(0, this.fadeAlpha - 0.05 * deltaTime);
        }

        // Smooth health
        const healthDiff = this.health - this.displayHealth;
        this.displayHealth += healthDiff * 0.1;

        // Decay effects
        this.damageFlash = Math.max(0, this.damageFlash - 0.05 * deltaTime);
        this.shakeOffset *= 0.9;
    }

    draw(ctx) {
        if (this.fadeAlpha <= 0) return;

        const theme = this.theme;
        const config = this.config;

        ctx.save();
        ctx.globalAlpha = this.fadeAlpha;

        const shakeX = (Math.random() - 0.5) * this.shakeOffset;
        const shakeY = (Math.random() - 0.5) * this.shakeOffset;
        ctx.translate(this.x + shakeX, this.y + shakeY);

        const halfWidth = config.width / 2;
        const healthPercent = this.maxHealth > 0 ? this.displayHealth / this.maxHealth : 0;

        // Choose style
        if (config.style === 'segmented') {
            this.drawSegmentedStyle(ctx, halfWidth, healthPercent);
        } else if (config.style === 'ascii') {
            this.drawAsciiStyle(ctx, halfWidth, healthPercent);
        } else if (config.style === 'thin') {
            this.drawThinStyle(ctx, halfWidth, healthPercent);
        } else {
            this.drawDefaultStyle(ctx, halfWidth, healthPercent);
        }

        ctx.restore();
    }

    drawDefaultStyle(ctx, halfWidth, healthPercent) {
        const theme = this.theme;
        const config = this.config;

        // Boss name
        if (config.showName) {
            ctx.font = `bold 16px ${theme.fonts.primary}`;
            ctx.fillStyle = theme.colors.warning;
            ctx.textAlign = 'center';
            ctx.shadowBlur = 10;
            ctx.shadowColor = theme.colors.warning;
            ctx.fillText(this.bossName, 0, -10);
            ctx.shadowBlur = 0;
        }

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(-halfWidth, 0, config.width, config.height);

        // Health gradient (green to red)
        const gradient = ctx.createLinearGradient(-halfWidth, 0, halfWidth, 0);
        if (healthPercent > 0.5) {
            gradient.addColorStop(0, '#00ff00');
            gradient.addColorStop(1, '#ffff00');
        } else if (healthPercent > 0.25) {
            gradient.addColorStop(0, '#ffff00');
            gradient.addColorStop(1, '#ff8800');
        } else {
            gradient.addColorStop(0, '#ff8800');
            gradient.addColorStop(1, '#ff0000');
        }

        ctx.fillStyle = gradient;
        ctx.shadowBlur = 15;
        ctx.shadowColor = healthPercent > 0.5 ? '#00ff00' : '#ff0000';
        ctx.fillRect(-halfWidth + 2, 2, (config.width - 4) * healthPercent, config.height - 4);
        ctx.shadowBlur = 0;

        // Damage flash overlay
        if (this.damageFlash > 0) {
            ctx.fillStyle = `rgba(255, 0, 0, ${this.damageFlash * 0.5})`;
            ctx.fillRect(-halfWidth, 0, config.width, config.height);
        }

        // Border
        ctx.strokeStyle = theme.colors.warning;
        ctx.lineWidth = 2;
        ctx.strokeRect(-halfWidth, 0, config.width, config.height);

        // Percentage
        if (config.showPercent) {
            ctx.font = `bold 14px ${theme.fonts.primary}`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${Math.ceil(healthPercent * 100)}%`, 0, config.height / 2);
        }
    }

    drawSegmentedStyle(ctx, halfWidth, healthPercent) {
        const theme = this.theme;
        const config = this.config;
        const segments = 20;
        const segmentWidth = (config.width - 10) / segments;
        const filledSegments = Math.ceil(segments * healthPercent);

        // Boss name
        if (config.showName) {
            ctx.font = `bold 14px ${theme.fonts.primary}`;
            ctx.fillStyle = theme.colors.warning;
            ctx.textAlign = 'center';
            ctx.fillText(`\u25C4 ${this.bossName} \u25BA`, 0, -8);
        }

        // Segments
        for (let i = 0; i < segments; i++) {
            const x = -halfWidth + 5 + i * segmentWidth;
            const filled = i < filledSegments;

            if (filled) {
                const hue = 120 * (i / segments);  // Green to yellow to red
                ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
                ctx.shadowBlur = 8;
                ctx.shadowColor = ctx.fillStyle;
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.shadowBlur = 0;
            }

            ctx.fillRect(x, 0, segmentWidth - 2, config.height);
        }

        ctx.shadowBlur = 0;
    }

    drawAsciiStyle(ctx, halfWidth, healthPercent) {
        const theme = this.theme;
        const barLength = 30;
        const filled = Math.ceil(barLength * healthPercent);

        ctx.font = `14px ${theme.fonts.primary}`;
        ctx.fillStyle = healthPercent > 0.25 ? theme.colors.success : theme.colors.warning;
        ctx.textAlign = 'center';
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;

        const filledBar = '\u2588'.repeat(filled);
        const emptyBar = '\u2591'.repeat(barLength - filled);
        const bar = `[${this.bossName}] [${filledBar}${emptyBar}] ${Math.ceil(healthPercent * 100)}%`;
        ctx.fillText(bar, 0, 10);

        ctx.shadowBlur = 0;
    }

    drawThinStyle(ctx, halfWidth, healthPercent) {
        const theme = this.theme;
        const config = this.config;

        // Very thin bar
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(-halfWidth, 0, config.width, config.height);

        const gradient = ctx.createLinearGradient(-halfWidth, 0, halfWidth, 0);
        gradient.addColorStop(0, '#00ff00');
        gradient.addColorStop(0.5, '#ffff00');
        gradient.addColorStop(1, '#ff0000');

        ctx.fillStyle = gradient;
        ctx.fillRect(-halfWidth, 0, config.width * healthPercent, config.height);

        // Boss name above
        if (config.showName) {
            ctx.font = `12px ${theme.fonts.primary}`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.globalAlpha = 0.8;
            ctx.fillText(this.bossName, 0, -5);
        }
    }
}
