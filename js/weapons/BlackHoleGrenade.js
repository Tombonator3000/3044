/**
 * Geometry 3044 - Black Hole Grenade Weapon
 * Throwable grenade that pulls in enemies and explodes
 */

import { CONFIG } from '../config.js';
import { config, gameState, particleSystem, soundSystem } from '../globals.js';

const BLACK_HOLE = {
    name: 'BLACK HOLE GRENADE',
    throwSpeed: 10,
    pullRadius: 200,
    pullStrength: 3,
    duration: 120,           // 2 seconds
    explosionDamage: 100,
    explosionRadius: 150,
    cooldown: 300,           // 5 seconds
    color: '#4400aa',
    ringColor: '#8800ff'
};

export class BlackHoleGrenade {
    constructor() {
        this.grenades = [];
        this.cooldown = 0;
    }

    /**
     * Throw a black hole grenade
     */
    throw(player, targetX, targetY) {
        if (!player) return false;
        if (this.cooldown > 0) return false;
        this.cooldown = BLACK_HOLE.cooldown;

        const angle = Math.atan2(targetY - player.y, targetX - player.x);
        const dist = Math.min(300, Math.hypot(targetX - player.x, targetY - player.y));

        this.grenades.push({
            x: player.x,
            y: player.y,
            targetX: player.x + Math.cos(angle) * dist,
            targetY: player.y + Math.sin(angle) * dist,
            vx: Math.cos(angle) * BLACK_HOLE.throwSpeed,
            vy: Math.sin(angle) * BLACK_HOLE.throwSpeed,
            phase: 'flying',     // flying -> pulling -> exploding
            timer: 0,
            rotation: 0,
            particles: []
        });

        if (soundSystem && soundSystem.play) {
            soundSystem.play('playerShoot');
        }

        return true;
    }

    /**
     * Update all grenades
     */
    update(enemies, enemyBullets) {
        if (this.cooldown > 0) this.cooldown--;

        this.grenades = this.grenades.filter(grenade => {
            switch (grenade.phase) {
                case 'flying':
                    // Move toward target
                    grenade.x += grenade.vx;
                    grenade.y += grenade.vy;
                    grenade.vx *= 0.95;
                    grenade.vy *= 0.95;

                    // Check if reached target
                    const dist = Math.hypot(grenade.x - grenade.targetX, grenade.y - grenade.targetY);
                    if (dist < 20 || Math.hypot(grenade.vx, grenade.vy) < 0.5) {
                        grenade.phase = 'pulling';
                        grenade.timer = BLACK_HOLE.duration;
                        if (soundSystem && soundSystem.play) {
                            soundSystem.play('powerUp');
                        }
                    }
                    break;

                case 'pulling':
                    grenade.timer--;
                    grenade.rotation += 0.1;

                    // Pull enemies
                    if (enemies) {
                        for (const enemy of enemies) {
                            if (!enemy.active) continue;
                            const dx = grenade.x - enemy.x;
                            const dy = grenade.y - enemy.y;
                            const dist = Math.hypot(dx, dy);

                            if (dist < BLACK_HOLE.pullRadius && dist > 20) {
                                const force = BLACK_HOLE.pullStrength * (1 - dist / BLACK_HOLE.pullRadius);
                                enemy.x += (dx / dist) * force;
                                enemy.y += (dy / dist) * force;
                            }
                        }
                    }

                    // Pull enemy bullets
                    if (enemyBullets && enemyBullets.getActiveBullets) {
                        for (const bullet of enemyBullets.getActiveBullets()) {
                            if (!bullet.active || bullet.isPlayerBullet) continue;
                            const dx = grenade.x - bullet.x;
                            const dy = grenade.y - bullet.y;
                            const dist = Math.hypot(dx, dy);

                            if (dist < BLACK_HOLE.pullRadius) {
                                const force = BLACK_HOLE.pullStrength * 2;
                                bullet.vx += (dx / dist) * force;
                                bullet.vy += (dy / dist) * force;

                                // Destroy if too close
                                if (dist < 30) bullet.active = false;
                            }
                        }
                    }

                    // Spawn swirl particles
                    if (Math.random() < 0.4) {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = BLACK_HOLE.pullRadius * (0.5 + Math.random() * 0.5);
                        grenade.particles.push({
                            x: grenade.x + Math.cos(angle) * dist,
                            y: grenade.y + Math.sin(angle) * dist,
                            angle: angle,
                            dist: dist,
                            life: 30
                        });
                    }

                    // Update particles (spiral inward)
                    grenade.particles = grenade.particles.filter(p => {
                        p.angle += 0.15;
                        p.dist -= 3;
                        p.x = grenade.x + Math.cos(p.angle) * p.dist;
                        p.y = grenade.y + Math.sin(p.angle) * p.dist;
                        p.life--;
                        return p.life > 0 && p.dist > 10;
                    });

                    // Explode when timer ends
                    if (grenade.timer <= 0) {
                        grenade.phase = 'exploding';
                        this.explode(grenade, enemies);
                    }
                    break;

                case 'exploding':
                    return false;
            }

            return true;
        });
    }

    /**
     * Create explosion effect
     */
    explode(grenade, enemies) {
        // Damage all enemies in radius
        if (enemies) {
            for (const enemy of enemies) {
                if (!enemy.active) continue;
                const dist = Math.hypot(enemy.x - grenade.x, enemy.y - grenade.y);

                if (dist < BLACK_HOLE.explosionRadius) {
                    const damage = BLACK_HOLE.explosionDamage * (1 - dist / BLACK_HOLE.explosionRadius);
                    if (enemy.takeDamage) {
                        enemy.takeDamage(damage);
                    } else {
                        enemy.hp -= damage;
                        if (enemy.hp <= 0) enemy.active = false;
                    }
                }
            }
        }

        // Explosion particles
        if (particleSystem) {
            particleSystem.explosion(grenade.x, grenade.y, '#8800ff', 30, 2);
            particleSystem.explosion(grenade.x, grenade.y, '#ff00ff', 20, 1.5);
        }

        // Screen shake
        if (gameState && gameState.triggerScreenShake) {
            gameState.triggerScreenShake('explosion');
        }

        if (soundSystem && soundSystem.play) {
            soundSystem.play('explosion');
        }
    }

    /**
     * Draw all grenades
     */
    draw(ctx) {
        if (this.grenades.length === 0) return;

        ctx.save();

        for (const grenade of this.grenades) {
            if (grenade.phase === 'flying') {
                // Flying grenade
                ctx.fillStyle = BLACK_HOLE.color;
                ctx.shadowBlur = 15;
                ctx.shadowColor = BLACK_HOLE.ringColor;
                ctx.beginPath();
                ctx.arc(grenade.x, grenade.y, 8, 0, Math.PI * 2);
                ctx.fill();

            } else if (grenade.phase === 'pulling') {
                // Black hole effect
                const progress = 1 - (grenade.timer / BLACK_HOLE.duration);
                const size = 20 + progress * 30;

                // Event horizon (black center)
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(grenade.x, grenade.y, size, 0, Math.PI * 2);
                ctx.fill();

                // Accretion disk rings
                for (let i = 0; i < 3; i++) {
                    const ringRadius = size + 20 + i * 25;
                    const alpha = 0.6 - i * 0.15;

                    ctx.strokeStyle = `rgba(136, 0, 255, ${alpha})`;
                    ctx.lineWidth = 3 - i;
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = '#8800ff';

                    ctx.beginPath();
                    ctx.arc(grenade.x, grenade.y, ringRadius,
                            grenade.rotation + i,
                            grenade.rotation + i + Math.PI * 1.5);
                    ctx.stroke();
                }

                // Spiral particles
                for (const p of grenade.particles) {
                    const alpha = p.life / 30;
                    ctx.fillStyle = `rgba(255, 0, 255, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Pull radius indicator
                ctx.strokeStyle = 'rgba(136, 0, 255, 0.2)';
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 10]);
                ctx.beginPath();
                ctx.arc(grenade.x, grenade.y, BLACK_HOLE.pullRadius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        ctx.restore();
    }
}
