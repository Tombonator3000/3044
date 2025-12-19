/**
 * Geometry 3044 - Homing Missile Weapon
 * Rockets that seek toward enemies
 */

import { CONFIG } from '../config.js';
import { config, particleSystem, soundSystem } from '../globals.js';

const HOMING_MISSILE = {
    name: 'HOMING MISSILES',
    maxMissiles: 4,
    missileSpeed: 6,
    turnRate: 0.08,          // Radians per frame
    damage: 30,
    cooldown: 45,
    lifetime: 300,           // Frames before self-destruct
    color: '#ff4400',
    trailColor: '#ff8800'
};

export class HomingMissileSystem {
    constructor() {
        this.missiles = [];
        this.cooldown = 0;
        this.maxMissiles = HOMING_MISSILE.maxMissiles;
    }

    /**
     * Fire a homing missile
     */
    fire(player, enemies) {
        if (!player) return false;
        if (this.cooldown > 0) return false;
        if (this.missiles.length >= this.maxMissiles) return false;

        // Find target
        const target = this.findBestTarget(player, enemies);
        if (!target) return false;

        this.cooldown = HOMING_MISSILE.cooldown;

        // Launch missile
        const angle = Math.atan2(target.y - player.y, target.x - player.x);

        this.missiles.push({
            x: player.x,
            y: player.y,
            angle: angle,
            speed: HOMING_MISSILE.missileSpeed,
            target: target,
            life: HOMING_MISSILE.lifetime,
            trail: []
        });

        if (soundSystem && soundSystem.play) {
            soundSystem.play('playerShoot');
        }

        return true;
    }

    /**
     * Find the best target for the missile
     */
    findBestTarget(player, enemies) {
        if (!enemies) return null;

        let best = null;
        let bestDist = Infinity;

        for (const enemy of enemies) {
            if (!enemy.active) continue;

            const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
            if (dist < bestDist) {
                bestDist = dist;
                best = enemy;
            }
        }

        return best;
    }

    /**
     * Update all missiles
     */
    update(enemies) {
        if (this.cooldown > 0) this.cooldown--;

        const screenWidth = config.width || 800;
        const screenHeight = config.height || 600;

        this.missiles = this.missiles.filter(missile => {
            missile.life--;
            if (missile.life <= 0) {
                this.explode(missile.x, missile.y, false);
                return false;
            }

            // Re-acquire target if current is dead
            if (!missile.target || !missile.target.active) {
                missile.target = this.findNearestEnemy(missile, enemies);
            }

            // Home toward target
            if (missile.target && missile.target.active) {
                const targetAngle = Math.atan2(
                    missile.target.y - missile.y,
                    missile.target.x - missile.x
                );

                // Smooth rotation toward target
                let angleDiff = targetAngle - missile.angle;

                // Normalize to -PI to PI
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                // Apply turn rate
                if (Math.abs(angleDiff) < HOMING_MISSILE.turnRate) {
                    missile.angle = targetAngle;
                } else {
                    missile.angle += Math.sign(angleDiff) * HOMING_MISSILE.turnRate;
                }
            }

            // Move
            missile.x += Math.cos(missile.angle) * missile.speed;
            missile.y += Math.sin(missile.angle) * missile.speed;

            // Add trail point
            missile.trail.push({x: missile.x, y: missile.y, life: 15});
            if (missile.trail.length > 20) missile.trail.shift();

            // Update trail
            missile.trail = missile.trail.filter(t => {
                t.life--;
                return t.life > 0;
            });

            // Check collision with target
            if (missile.target && missile.target.active) {
                const targetSize = missile.target.size || 20;
                const dist = Math.hypot(
                    missile.x - missile.target.x,
                    missile.y - missile.target.y
                );

                if (dist < targetSize + 10) {
                    if (missile.target.takeDamage) {
                        missile.target.takeDamage(HOMING_MISSILE.damage);
                    } else {
                        missile.target.hp -= HOMING_MISSILE.damage;
                        if (missile.target.hp <= 0) missile.target.active = false;
                    }
                    this.explode(missile.x, missile.y, true);
                    return false;
                }
            }

            // Off screen check
            if (missile.x < -50 || missile.x > screenWidth + 50 ||
                missile.y < -50 || missile.y > screenHeight + 50) {
                return false;
            }

            return true;
        });
    }

    /**
     * Find nearest enemy to a missile
     */
    findNearestEnemy(missile, enemies) {
        if (!enemies) return null;

        let nearest = null;
        let nearestDist = 300;  // Max lock range

        for (const enemy of enemies) {
            if (!enemy.active) continue;
            const dist = Math.hypot(enemy.x - missile.x, enemy.y - missile.y);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = enemy;
            }
        }

        return nearest;
    }

    /**
     * Create explosion effect
     */
    explode(x, y, hit) {
        if (particleSystem) {
            const count = hit ? 20 : 10;
            particleSystem.explosion(x, y, hit ? '#ff4400' : '#888888', count, 1);
        }

        if (hit && soundSystem && soundSystem.play) {
            soundSystem.play('explosion');
        }
    }

    /**
     * Draw all missiles
     */
    draw(ctx) {
        if (this.missiles.length === 0) return;

        ctx.save();

        for (const missile of this.missiles) {
            // Draw trail
            if (missile.trail.length > 1) {
                ctx.strokeStyle = HOMING_MISSILE.trailColor;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';

                ctx.beginPath();
                ctx.moveTo(missile.trail[0].x, missile.trail[0].y);

                for (let i = 1; i < missile.trail.length; i++) {
                    const alpha = missile.trail[i].life / 15;
                    ctx.globalAlpha = alpha * 0.6;
                    ctx.lineTo(missile.trail[i].x, missile.trail[i].y);
                }
                ctx.stroke();
            }

            // Draw missile body
            ctx.globalAlpha = 1;
            ctx.save();
            ctx.translate(missile.x, missile.y);
            ctx.rotate(missile.angle);

            // Missile shape
            ctx.fillStyle = HOMING_MISSILE.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = HOMING_MISSILE.color;

            ctx.beginPath();
            ctx.moveTo(12, 0);      // Nose
            ctx.lineTo(-6, -5);     // Top fin
            ctx.lineTo(-4, 0);      // Body
            ctx.lineTo(-6, 5);      // Bottom fin
            ctx.closePath();
            ctx.fill();

            // Thruster glow
            ctx.fillStyle = '#ffff00';
            ctx.shadowColor = '#ffaa00';
            ctx.beginPath();
            ctx.arc(-6, 0, 3 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        ctx.restore();
    }
}
