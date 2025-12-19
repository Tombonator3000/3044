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

        const time = Date.now() * 0.01;
        ctx.save();

        for (const nova of this.novaEffects) {
            const alpha = nova.life / nova.maxLife;
            const progress = 1 - alpha;

            // Background energy field
            const fieldGrad = ctx.createRadialGradient(nova.x, nova.y, 0, nova.x, nova.y, nova.radius * 1.2);
            fieldGrad.addColorStop(0, `rgba(255, 200, 0, ${alpha * 0.1})`);
            fieldGrad.addColorStop(0.5, `rgba(255, 150, 0, ${alpha * 0.05})`);
            fieldGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');

            ctx.fillStyle = fieldGrad;
            ctx.beginPath();
            ctx.arc(nova.x, nova.y, nova.radius * 1.2, 0, Math.PI * 2);
            ctx.fill();

            // Outer expanding ring with glow
            ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
            ctx.lineWidth = 6 * alpha;
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#ffff00';

            ctx.beginPath();
            ctx.arc(nova.x, nova.y, nova.radius, 0, Math.PI * 2);
            ctx.stroke();

            // Secondary ring
            ctx.strokeStyle = `rgba(255, 200, 50, ${alpha * 0.7})`;
            ctx.lineWidth = 3 * alpha;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(nova.x, nova.y, nova.radius * 0.85, 0, Math.PI * 2);
            ctx.stroke();

            // Inner ring
            ctx.strokeStyle = `rgba(255, 170, 0, ${alpha * 0.5})`;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ffaa00';
            ctx.beginPath();
            ctx.arc(nova.x, nova.y, nova.radius * 0.7, 0, Math.PI * 2);
            ctx.stroke();

            // Radial rays
            const rayCount = SPREAD_NOVA.bulletCount;
            for (let i = 0; i < rayCount; i++) {
                const rayAngle = (Math.PI * 2 * i) / rayCount;
                const rayLength = nova.radius * (0.9 + Math.sin(time * 3 + i) * 0.1);

                // Ray gradient
                const rayGrad = ctx.createLinearGradient(
                    nova.x, nova.y,
                    nova.x + Math.cos(rayAngle) * rayLength,
                    nova.y + Math.sin(rayAngle) * rayLength
                );
                rayGrad.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
                rayGrad.addColorStop(0.3, `rgba(255, 255, 0, ${alpha * 0.8})`);
                rayGrad.addColorStop(1, `rgba(255, 150, 0, 0)`);

                ctx.strokeStyle = rayGrad;
                ctx.lineWidth = 2;
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ffff00';

                ctx.beginPath();
                ctx.moveTo(nova.x, nova.y);
                ctx.lineTo(
                    nova.x + Math.cos(rayAngle) * rayLength,
                    nova.y + Math.sin(rayAngle) * rayLength
                );
                ctx.stroke();
            }

            // Center flash
            const centerGrad = ctx.createRadialGradient(nova.x, nova.y, 0, nova.x, nova.y, 20 * alpha);
            centerGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
            centerGrad.addColorStop(0.5, `rgba(255, 255, 100, ${alpha * 0.6})`);
            centerGrad.addColorStop(1, 'rgba(255, 200, 0, 0)');

            ctx.fillStyle = centerGrad;
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#ffffff';
            ctx.beginPath();
            ctx.arc(nova.x, nova.y, 20 * alpha, 0, Math.PI * 2);
            ctx.fill();

            // Sparkling particles at the edge
            if (alpha > 0.3) {
                const sparkCount = 12;
                for (let i = 0; i < sparkCount; i++) {
                    const sparkAngle = (Math.PI * 2 * i) / sparkCount + time * 0.5;
                    const sparkDist = nova.radius * (0.95 + Math.sin(time * 5 + i * 2) * 0.05);
                    const sparkX = nova.x + Math.cos(sparkAngle) * sparkDist;
                    const sparkY = nova.y + Math.sin(sparkAngle) * sparkDist;

                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = '#ffff00';
                    ctx.beginPath();
                    ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        ctx.restore();
    }
}
