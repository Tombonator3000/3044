/**
 * Geometry 3044 - Spread Nova Weapon
 * Expanding circle of bullets
 */

import { CONFIG } from '../config.js';
import { config, bulletPool, soundSystem } from '../globals.js';

const SPREAD_NOVA = {
    name: 'SPREAD NOVA',
    bulletCount: 16,
    bulletSpeed: 8,
    bulletDamage: 15,
    cooldown: 60,
    color: '#ffff00',
    glowColor: '#ffaa00'
};

export class SpreadNova {
    constructor() {
        this.cooldown = 0;
        this.novaEffects = [];
    }

    /**
     * Fire the spread nova
     */
    fire(player) {
        if (!player) return false;
        if (this.cooldown > 0) return false;
        this.cooldown = SPREAD_NOVA.cooldown;

        // Spawn bullets in circle
        for (let i = 0; i < SPREAD_NOVA.bulletCount; i++) {
            const angle = (Math.PI * 2 * i) / SPREAD_NOVA.bulletCount;

            if (bulletPool && bulletPool.get) {
                bulletPool.get(
                    player.x,
                    player.y,
                    Math.cos(angle) * SPREAD_NOVA.bulletSpeed,
                    Math.sin(angle) * SPREAD_NOVA.bulletSpeed,
                    true  // isPlayerBullet
                );
            }
        }

        // Visual nova ring effect
        this.novaEffects.push({
            x: player.x,
            y: player.y,
            radius: 10,
            maxRadius: 150,
            life: 20,
            maxLife: 20
        });

        // Sound
        if (soundSystem && soundSystem.play) {
            soundSystem.play('explosion');
        }

        return true;
    }

    /**
     * Update nova effects
     */
    update() {
        if (this.cooldown > 0) this.cooldown--;

        // Update nova visual effects
        this.novaEffects = this.novaEffects.filter(nova => {
            nova.radius += (nova.maxRadius - nova.radius) * 0.2;
            nova.life--;
            return nova.life > 0;
        });
    }

    /**
     * Draw nova effects
     */
    draw(ctx) {
        if (this.novaEffects.length === 0) return;

        ctx.save();

        for (const nova of this.novaEffects) {
            const alpha = nova.life / nova.maxLife;

            // Expanding ring
            ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
            ctx.lineWidth = 4 * alpha;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ffff00';

            ctx.beginPath();
            ctx.arc(nova.x, nova.y, nova.radius, 0, Math.PI * 2);
            ctx.stroke();

            // Inner ring
            ctx.strokeStyle = `rgba(255, 170, 0, ${alpha * 0.5})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(nova.x, nova.y, nova.radius * 0.7, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}
