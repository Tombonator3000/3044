/**
 * Geometry 3044 - Mirror Shield Weapon
 * Reflective shield that sends bullets back
 */

import { CONFIG } from '../config.js';
import { config, soundSystem } from '../globals.js';

const MIRROR_SHIELD = {
    name: 'MIRROR SHIELD',
    duration: 180,           // 3 seconds
    cooldown: 600,           // 10 seconds
    radius: 50,
    reflectDamageMultiplier: 2,
    color: '#00ffff',
    hexagonSides: 6
};

export class MirrorShield {
    constructor() {
        this.active = false;
        this.timer = 0;
        this.cooldown = 0;
        this.ripples = [];
        this.rotation = 0;
    }

    /**
     * Activate the mirror shield
     */
    activate() {
        if (this.cooldown > 0 || this.active) return false;

        this.active = true;
        this.timer = MIRROR_SHIELD.duration;

        if (soundSystem && soundSystem.play) {
            soundSystem.play('powerUp');
        }

        return true;
    }

    /**
     * Update the mirror shield
     */
    update(player, enemyBulletPool, enemies) {
        // Cooldown
        if (this.cooldown > 0) this.cooldown--;

        if (!this.active || !player) return;

        this.timer--;
        this.rotation += 0.02;

        // Deactivate when timer runs out
        if (this.timer <= 0) {
            this.active = false;
            this.cooldown = MIRROR_SHIELD.cooldown;
            return;
        }

        // Check enemy bullets for reflection
        if (enemyBulletPool && enemyBulletPool.getActiveBullets) {
            const bullets = enemyBulletPool.getActiveBullets();

            for (const bullet of bullets) {
                if (!bullet.active || bullet.isPlayerBullet || bullet.reflected) continue;

                const dist = Math.hypot(bullet.x - player.x, bullet.y - player.y);

                if (dist < MIRROR_SHIELD.radius + 10) {
                    // Reflect bullet!
                    bullet.reflected = true;

                    // Reverse direction toward nearest enemy
                    const nearestEnemy = this.findNearestEnemy(bullet, enemies);

                    if (nearestEnemy) {
                        const angle = Math.atan2(
                            nearestEnemy.y - bullet.y,
                            nearestEnemy.x - bullet.x
                        );
                        const speed = Math.hypot(bullet.vx, bullet.vy) * 1.5;
                        bullet.vx = Math.cos(angle) * speed;
                        bullet.vy = Math.sin(angle) * speed;
                    } else {
                        // Just reverse
                        bullet.vx *= -1.5;
                        bullet.vy *= -1.5;
                    }

                    // Convert to player bullet
                    bullet.isPlayerBullet = true;
                    bullet.damage = (bullet.damage || 10) * MIRROR_SHIELD.reflectDamageMultiplier;
                    bullet.color = '#00ffff';

                    // Visual ripple
                    this.ripples.push({
                        x: bullet.x,
                        y: bullet.y,
                        radius: 5,
                        maxRadius: 40,
                        life: 15
                    });

                    if (soundSystem && soundSystem.play) {
                        soundSystem.play('playerShoot');
                    }
                }
            }
        }

        // Update ripples
        this.ripples = this.ripples.filter(r => {
            r.radius += (r.maxRadius - r.radius) * 0.3;
            r.life--;
            return r.life > 0;
        });
    }

    /**
     * Find nearest enemy to a bullet
     */
    findNearestEnemy(bullet, enemies) {
        if (!enemies) return null;

        let nearest = null;
        let nearestDist = Infinity;

        for (const enemy of enemies) {
            if (!enemy.active) continue;
            const dist = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = enemy;
            }
        }

        return nearest;
    }

    /**
     * Draw the mirror shield
     */
    draw(ctx, player) {
        if (!this.active || !player) return;

        ctx.save();

        const alpha = Math.min(1, this.timer / 30);  // Fade in/out
        const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.1;

        ctx.translate(player.x, player.y);
        ctx.rotate(this.rotation);

        // Hexagon shield
        ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#00ffff';

        ctx.beginPath();
        for (let i = 0; i < MIRROR_SHIELD.hexagonSides; i++) {
            const angle = (Math.PI * 2 * i) / MIRROR_SHIELD.hexagonSides;
            const x = Math.cos(angle) * MIRROR_SHIELD.radius * pulse;
            const y = Math.sin(angle) * MIRROR_SHIELD.radius * pulse;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        // Inner hexagon
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        ctx.lineWidth = 1;

        ctx.beginPath();
        for (let i = 0; i < MIRROR_SHIELD.hexagonSides; i++) {
            const angle = (Math.PI * 2 * i) / MIRROR_SHIELD.hexagonSides;
            const x = Math.cos(angle) * MIRROR_SHIELD.radius * 0.6 * pulse;
            const y = Math.sin(angle) * MIRROR_SHIELD.radius * 0.6 * pulse;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.restore();

        // Draw ripples
        ctx.save();
        for (const ripple of this.ripples) {
            const rippleAlpha = ripple.life / 15;
            ctx.strokeStyle = `rgba(0, 255, 255, ${rippleAlpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Timer indicator
        const timePercent = this.timer / MIRROR_SHIELD.duration;
        ctx.fillStyle = `rgba(0, 255, 255, 0.8)`;
        ctx.fillRect(player.x - 25, player.y + MIRROR_SHIELD.radius + 10, 50 * timePercent, 4);

        ctx.restore();
    }
}
