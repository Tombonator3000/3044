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

        const time = Date.now() * 0.01;
        ctx.save();

        for (const grenade of this.grenades) {
            if (grenade.phase === 'flying') {
                // Flying grenade with trail
                const trailLen = 5;
                for (let i = 0; i < trailLen; i++) {
                    const t = i / trailLen;
                    const trailX = grenade.x - grenade.vx * t * 3;
                    const trailY = grenade.y - grenade.vy * t * 3;

                    ctx.fillStyle = `rgba(68, 0, 170, ${(1 - t) * 0.5})`;
                    ctx.beginPath();
                    ctx.arc(trailX, trailY, 6 * (1 - t * 0.5), 0, Math.PI * 2);
                    ctx.fill();
                }

                // Grenade body glow
                const grenadeGrad = ctx.createRadialGradient(grenade.x, grenade.y, 0, grenade.x, grenade.y, 12);
                grenadeGrad.addColorStop(0, '#aa44ff');
                grenadeGrad.addColorStop(0.5, BLACK_HOLE.color);
                grenadeGrad.addColorStop(1, 'rgba(68, 0, 170, 0)');

                ctx.fillStyle = grenadeGrad;
                ctx.shadowBlur = 20;
                ctx.shadowColor = BLACK_HOLE.ringColor;
                ctx.beginPath();
                ctx.arc(grenade.x, grenade.y, 12, 0, Math.PI * 2);
                ctx.fill();

                // Core
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ffffff';
                ctx.beginPath();
                ctx.arc(grenade.x, grenade.y, 3, 0, Math.PI * 2);
                ctx.fill();

            } else if (grenade.phase === 'pulling') {
                // Black hole effect
                const progress = 1 - (grenade.timer / BLACK_HOLE.duration);
                const size = 20 + progress * 30;

                // Gravitational lensing effect (distortion rings)
                for (let i = 5; i >= 1; i--) {
                    const lensRadius = size + i * 15;
                    const lensAlpha = 0.1 / i;

                    const lensGrad = ctx.createRadialGradient(
                        grenade.x, grenade.y, lensRadius - 5,
                        grenade.x, grenade.y, lensRadius + 5
                    );
                    lensGrad.addColorStop(0, `rgba(100, 0, 200, 0)`);
                    lensGrad.addColorStop(0.5, `rgba(100, 0, 200, ${lensAlpha})`);
                    lensGrad.addColorStop(1, `rgba(100, 0, 200, 0)`);

                    ctx.fillStyle = lensGrad;
                    ctx.beginPath();
                    ctx.arc(grenade.x, grenade.y, lensRadius + 5, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Event horizon gradient
                const horizonGrad = ctx.createRadialGradient(
                    grenade.x, grenade.y, 0,
                    grenade.x, grenade.y, size
                );
                horizonGrad.addColorStop(0, '#000000');
                horizonGrad.addColorStop(0.7, '#000000');
                horizonGrad.addColorStop(0.85, '#110022');
                horizonGrad.addColorStop(1, '#220044');

                ctx.fillStyle = horizonGrad;
                ctx.beginPath();
                ctx.arc(grenade.x, grenade.y, size, 0, Math.PI * 2);
                ctx.fill();

                // Photon sphere (bright ring at event horizon edge)
                ctx.strokeStyle = `rgba(200, 100, 255, ${0.5 + Math.sin(time * 4) * 0.2})`;
                ctx.lineWidth = 2;
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#cc66ff';
                ctx.beginPath();
                ctx.arc(grenade.x, grenade.y, size + 2, 0, Math.PI * 2);
                ctx.stroke();

                // Accretion disk - multiple layers
                for (let layer = 0; layer < 4; layer++) {
                    const layerOffset = layer * 0.3;

                    for (let i = 0; i < 3; i++) {
                        const ringRadius = size + 15 + i * 20 + layer * 5;
                        const alpha = (0.7 - i * 0.15 - layer * 0.1);
                        const ringWidth = 4 - i - layer * 0.5;

                        // Color shifts from purple to pink
                        const hue = 280 + i * 20 + Math.sin(time + i) * 10;

                        ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${alpha})`;
                        ctx.lineWidth = Math.max(1, ringWidth);
                        ctx.shadowBlur = 25;
                        ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;

                        ctx.beginPath();
                        ctx.arc(grenade.x, grenade.y, ringRadius,
                                grenade.rotation + i + layerOffset,
                                grenade.rotation + i + layerOffset + Math.PI * 1.6);
                        ctx.stroke();
                    }
                }

                // Inner accretion glow
                const innerGlowGrad = ctx.createRadialGradient(
                    grenade.x, grenade.y, size,
                    grenade.x, grenade.y, size + 30
                );
                innerGlowGrad.addColorStop(0, 'rgba(255, 100, 255, 0.3)');
                innerGlowGrad.addColorStop(0.5, 'rgba(136, 0, 255, 0.15)');
                innerGlowGrad.addColorStop(1, 'rgba(68, 0, 170, 0)');

                ctx.fillStyle = innerGlowGrad;
                ctx.beginPath();
                ctx.arc(grenade.x, grenade.y, size + 30, 0, Math.PI * 2);
                ctx.fill();

                // Spiral particles with trails
                for (const p of grenade.particles) {
                    const alpha = p.life / 30;

                    // Particle trail
                    const trailGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 8);
                    trailGrad.addColorStop(0, `rgba(255, 150, 255, ${alpha})`);
                    trailGrad.addColorStop(0.5, `rgba(255, 0, 255, ${alpha * 0.5})`);
                    trailGrad.addColorStop(1, 'rgba(136, 0, 255, 0)');

                    ctx.fillStyle = trailGrad;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
                    ctx.fill();

                    // Particle core
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = '#ff88ff';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Energy jets (top and bottom)
                const jetAlpha = 0.3 + Math.sin(time * 5) * 0.1;
                for (let dir = -1; dir <= 1; dir += 2) {
                    const jetGrad = ctx.createLinearGradient(
                        grenade.x, grenade.y,
                        grenade.x, grenade.y + dir * 80
                    );
                    jetGrad.addColorStop(0, `rgba(200, 100, 255, ${jetAlpha})`);
                    jetGrad.addColorStop(0.5, `rgba(136, 0, 255, ${jetAlpha * 0.5})`);
                    jetGrad.addColorStop(1, 'rgba(68, 0, 170, 0)');

                    ctx.fillStyle = jetGrad;
                    ctx.beginPath();
                    ctx.moveTo(grenade.x - 5, grenade.y);
                    ctx.lineTo(grenade.x, grenade.y + dir * 80);
                    ctx.lineTo(grenade.x + 5, grenade.y);
                    ctx.closePath();
                    ctx.fill();
                }

                // Pull radius indicator with animation
                const dashOffset = time * 10;
                ctx.strokeStyle = `rgba(136, 0, 255, ${0.2 + Math.sin(time * 2) * 0.1})`;
                ctx.lineWidth = 1;
                ctx.setLineDash([8, 12]);
                ctx.lineDashOffset = dashOffset;
                ctx.beginPath();
                ctx.arc(grenade.x, grenade.y, BLACK_HOLE.pullRadius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);

                // Timer indicator
                const timerPercent = grenade.timer / BLACK_HOLE.duration;
                ctx.fillStyle = `rgba(136, 0, 255, 0.8)`;
                ctx.shadowBlur = 5;
                ctx.shadowColor = '#8800ff';
                ctx.fillRect(grenade.x - 30, grenade.y + size + 20, 60 * timerPercent, 4);
            }
        }

        ctx.restore();
    }
}
