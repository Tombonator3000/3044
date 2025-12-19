/**
 * Geometry 3044 - Power-Up Slots Component
 * Active power-up display with cooldown indicators
 */

export class PowerUpSlots {
    constructor(theme) {
        this.theme = theme;
        this.config = theme.layout.powerUps;

        this.slots = [];
        this.x = 0;
        this.y = 0;
        this.screenWidth = 0;
        this.screenHeight = 0;

        // Animation
        this.time = 0;
    }

    resize(width, height) {
        this.screenWidth = width;
        this.screenHeight = height;
        this.x = this.config.x >= 0 ? this.config.x : width + this.config.x;
        this.y = this.config.y >= 0 ? this.config.y : height + this.config.y;
    }

    update(activePowerUps, deltaTime = 1) {
        this.time += deltaTime;

        // Update slots based on active power-ups
        this.slots = [];

        if (activePowerUps && Array.isArray(activePowerUps)) {
            for (let i = 0; i < Math.min(activePowerUps.length, this.config.maxSlots); i++) {
                const powerUp = activePowerUps[i];
                if (powerUp) {
                    this.slots.push({
                        name: powerUp.name || 'POWER',
                        icon: powerUp.icon || 'P',
                        color: powerUp.color || this.theme.colors.accent,
                        duration: powerUp.duration || 0,
                        maxDuration: powerUp.maxDuration || 1,
                        cooldown: powerUp.cooldown || 0,
                        maxCooldown: powerUp.maxCooldown || 1
                    });
                }
            }
        }
    }

    draw(ctx) {
        const theme = this.theme;
        const config = this.config;

        if (this.slots.length === 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        this.slots.forEach((slot, index) => {
            const slotY = index * config.spacing;

            ctx.save();
            ctx.translate(0, slotY);

            // Draw based on style
            if (config.style === 'circular') {
                this.drawCircularSlot(ctx, slot);
            } else if (config.style === 'brackets') {
                this.drawBracketSlot(ctx, slot);
            } else if (config.style === 'minimal') {
                this.drawMinimalSlot(ctx, slot);
            } else {
                this.drawDefaultSlot(ctx, slot);
            }

            ctx.restore();
        });

        ctx.restore();
    }

    drawDefaultSlot(ctx, slot) {
        const theme = this.theme;
        const config = this.config;
        const size = config.slotSize;

        // Background
        ctx.fillStyle = theme.colors.panelBg;
        ctx.strokeStyle = slot.color;
        ctx.lineWidth = 2;

        if (theme.effects.glow) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = slot.color;
        }

        ctx.fillRect(0, 0, size, size);
        ctx.strokeRect(0, 0, size, size);
        ctx.shadowBlur = 0;

        // Icon
        ctx.font = `bold ${size * 0.5}px ${theme.fonts.primary}`;
        ctx.fillStyle = slot.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(slot.icon, size / 2, size / 2);

        // Duration bar
        if (config.showCooldown && slot.maxDuration > 0) {
            const progress = slot.duration / slot.maxDuration;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, size - 6, size, 6);
            ctx.fillStyle = slot.color;
            ctx.fillRect(0, size - 6, size * progress, 6);
        }

        // Name
        if (config.showName) {
            ctx.font = `10px ${theme.fonts.primary}`;
            ctx.fillStyle = slot.color;
            ctx.textAlign = 'center';
            ctx.fillText(slot.name, size / 2, size + 12);
        }
    }

    drawCircularSlot(ctx, slot) {
        const theme = this.theme;
        const config = this.config;
        const radius = config.slotSize / 2;

        // Outer ring
        ctx.strokeStyle = slot.color;
        ctx.lineWidth = 3;

        if (theme.effects.glow) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = slot.color;
        }

        ctx.beginPath();
        ctx.arc(radius, radius, radius - 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Progress arc
        if (config.showCooldown && slot.maxDuration > 0) {
            const progress = slot.duration / slot.maxDuration;
            ctx.strokeStyle = slot.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(radius, radius, radius - 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
            ctx.stroke();
        }

        // Icon
        ctx.font = `bold ${radius}px ${theme.fonts.primary}`;
        ctx.fillStyle = slot.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(slot.icon, radius, radius);

        // Name
        if (config.showName) {
            ctx.font = `9px ${theme.fonts.primary}`;
            ctx.fillStyle = slot.color;
            ctx.textAlign = 'center';
            ctx.fillText(slot.name, radius, config.slotSize + 10);
        }
    }

    drawBracketSlot(ctx, slot) {
        const theme = this.theme;
        const config = this.config;
        const size = config.slotSize;

        // ASCII-style brackets
        ctx.font = `${size * 0.4}px ${theme.fonts.primary}`;
        ctx.fillStyle = slot.color;
        ctx.textAlign = 'left';

        if (theme.effects.glow) {
            ctx.shadowBlur = theme.effects.glowIntensity;
            ctx.shadowColor = slot.color;
        }

        // Duration indicator
        const progress = slot.maxDuration > 0 ? slot.duration / slot.maxDuration : 0;
        const barLength = 8;
        const filled = Math.ceil(barLength * progress);
        const filledBar = '\u2588'.repeat(filled);
        const emptyBar = '\u2591'.repeat(barLength - filled);

        const text = `[${slot.icon}] ${filledBar}${emptyBar}`;
        ctx.fillText(text, 0, size / 2);

        ctx.shadowBlur = 0;

        // Name below
        if (config.showName) {
            ctx.font = `10px ${theme.fonts.primary}`;
            ctx.fillText(slot.name, 0, size / 2 + 15);
        }
    }

    drawMinimalSlot(ctx, slot) {
        const theme = this.theme;
        const config = this.config;
        const size = config.slotSize;

        // Simple dot with progress
        const progress = slot.maxDuration > 0 ? slot.duration / slot.maxDuration : 0;

        ctx.fillStyle = slot.color;
        ctx.globalAlpha = 0.3 + progress * 0.7;

        if (theme.effects.glow) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = slot.color;
        }

        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
}
