/**
 * Geometry 3044 - Multiplier Popup Component
 * Shows score multiplier notifications
 */

export class MultiplierPopup {
    constructor(theme) {
        this.theme = theme;

        this.active = false;
        this.multiplier = 0;
        this.life = 0;
        this.maxLife = 90;
        this.scale = 1;

        this.x = 0;
        this.y = 0;
        this.screenWidth = 0;
        this.screenHeight = 0;
    }

    resize(width, height) {
        this.screenWidth = width;
        this.screenHeight = height;
        this.x = width / 2;
        this.y = height / 2 - 50;
    }

    trigger(multiplier) {
        this.active = true;
        this.multiplier = multiplier;
        this.life = this.maxLife;
        this.scale = 2;
    }

    update(deltaTime = 1) {
        if (!this.active) return;

        this.life -= deltaTime;
        this.scale = Math.max(1, this.scale - 0.05 * deltaTime);

        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active || this.life <= 0) return;

        const theme = this.theme;
        const alpha = Math.min(1, this.life / 30);

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        ctx.globalAlpha = alpha;

        // Rainbow effect for high multipliers
        let color = theme.colors.combo;
        if (this.multiplier >= 20) {
            const hue = (Date.now() * 0.5) % 360;
            color = `hsl(${hue}, 100%, 50%)`;
        } else if (this.multiplier >= 15) {
            color = '#ff00ff';
        } else if (this.multiplier >= 10) {
            color = '#ffff00';
        }

        // Glow
        ctx.shadowBlur = 30;
        ctx.shadowColor = color;

        // Text
        ctx.font = `bold 48px ${theme.fonts.title}`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText(`${this.multiplier}x`, 0, 0);

        // Sub text
        ctx.font = `bold 20px ${theme.fonts.primary}`;
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.fillText('MULTIPLIER!', 0, 35);

        ctx.restore();
    }
}
