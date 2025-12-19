/**
 * Geometry 3044 - Drone Companion Weapon
 * Small drones that orbit and shoot automatically
 */

import { CONFIG } from '../config.js';
import { config, bulletPool, particleSystem, soundSystem } from '../globals.js';

const DRONE = {
    name: 'DRONE COMPANIONS',
    maxDrones: 2,
    orbitRadius: 60,
    orbitSpeed: 0.03,
    fireRate: 30,
    bulletSpeed: 10,
    bulletDamage: 8,
    duration: 900,           // 15 seconds
    color: '#00ff88',
    thrusterColor: '#00ffff'
};

export class DroneCompanionSystem {
    constructor() {
        this.drones = [];
    }

    /**
     * Spawn companion drones
     */
    spawnDrones(player) {
        if (!player) return;

        // Clear existing
        this.drones = [];

        for (let i = 0; i < DRONE.maxDrones; i++) {
            const angleOffset = (Math.PI * 2 * i) / DRONE.maxDrones;

            this.drones.push({
                angle: angleOffset,
                x: player.x + Math.cos(angleOffset) * DRONE.orbitRadius,
                y: player.y + Math.sin(angleOffset) * DRONE.orbitRadius,
                fireTimer: Math.floor(Math.random() * DRONE.fireRate),
                life: DRONE.duration,
                targetEnemy: null,
                thrusterFlicker: 0
            });
        }

        if (soundSystem && soundSystem.play) {
            soundSystem.play('powerUp');
        }
    }

    /**
     * Update all drones
     */
    update(player, enemies) {
        if (!player) return;

        this.drones = this.drones.filter(drone => {
            drone.life--;
            if (drone.life <= 0) {
                this.destroyDrone(drone);
                return false;
            }

            // Orbit player
            drone.angle += DRONE.orbitSpeed;

            // Calculate position
            drone.x = player.x + Math.cos(drone.angle) * DRONE.orbitRadius;
            drone.y = player.y + Math.sin(drone.angle) * DRONE.orbitRadius;

            // Find target
            drone.targetEnemy = this.findTarget(drone, enemies);

            // Fire at target
            drone.fireTimer++;
            if (drone.fireTimer >= DRONE.fireRate && drone.targetEnemy) {
                this.fire(drone);
                drone.fireTimer = 0;
            }

            // Thruster animation
            drone.thrusterFlicker = Math.random();

            return true;
        });
    }

    /**
     * Find target for drone
     */
    findTarget(drone, enemies) {
        if (!enemies) return null;

        let nearest = null;
        let nearestDist = 250;  // Max range

        for (const enemy of enemies) {
            if (!enemy.active) continue;
            const dist = Math.hypot(enemy.x - drone.x, enemy.y - drone.y);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = enemy;
            }
        }

        return nearest;
    }

    /**
     * Fire at target
     */
    fire(drone) {
        if (!drone.targetEnemy) return;

        const angle = Math.atan2(
            drone.targetEnemy.y - drone.y,
            drone.targetEnemy.x - drone.x
        );

        if (bulletPool && bulletPool.get) {
            bulletPool.get(
                drone.x,
                drone.y,
                Math.cos(angle) * DRONE.bulletSpeed,
                Math.sin(angle) * DRONE.bulletSpeed,
                true  // isPlayerBullet
            );
        }

        if (soundSystem && soundSystem.play) {
            soundSystem.play('playerShoot');
        }
    }

    /**
     * Destroy drone with particles
     */
    destroyDrone(drone) {
        if (particleSystem) {
            particleSystem.explosion(drone.x, drone.y, DRONE.color, 10, 0.5);
        }
    }

    /**
     * Draw all drones
     */
    draw(ctx, player) {
        if (this.drones.length === 0 || !player) return;

        const time = Date.now() * 0.01;
        ctx.save();

        // Draw orbit trail
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.1)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 10]);
        ctx.beginPath();
        ctx.arc(player.x, player.y, DRONE.orbitRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        for (const drone of this.drones) {
            const x = drone.x;
            const y = drone.y;
            const facingAngle = drone.targetEnemy
                ? Math.atan2(drone.targetEnemy.y - y, drone.targetEnemy.x - x)
                : drone.angle + Math.PI / 2;

            // Shield bubble around drone
            const shieldPulse = 0.8 + Math.sin(time * 3 + drone.angle) * 0.2;
            const shieldGrad = ctx.createRadialGradient(x, y, 0, x, y, 18);
            shieldGrad.addColorStop(0, 'rgba(0, 255, 136, 0)');
            shieldGrad.addColorStop(0.7, `rgba(0, 255, 136, ${0.1 * shieldPulse})`);
            shieldGrad.addColorStop(1, `rgba(0, 255, 200, ${0.2 * shieldPulse})`);

            ctx.fillStyle = shieldGrad;
            ctx.beginPath();
            ctx.arc(x, y, 18, 0, Math.PI * 2);
            ctx.fill();

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(facingAngle);

            // Engine trail
            for (let i = 0; i < 4; i++) {
                const trailX = -12 - i * 4;
                const trailAlpha = (1 - i / 4) * 0.4;
                const trailSize = 2 + i * 0.5;

                ctx.fillStyle = `rgba(0, 255, 200, ${trailAlpha})`;
                ctx.beginPath();
                ctx.arc(trailX, 0, trailSize, 0, Math.PI * 2);
                ctx.fill();
            }

            // Drone body shadow
            ctx.fillStyle = '#005533';
            ctx.beginPath();
            ctx.moveTo(12, 0);
            ctx.lineTo(0, -7);
            ctx.lineTo(-9, 0);
            ctx.lineTo(0, 7);
            ctx.closePath();
            ctx.fill();

            // Drone main body
            ctx.fillStyle = DRONE.color;
            ctx.shadowBlur = 20;
            ctx.shadowColor = DRONE.color;

            ctx.beginPath();
            ctx.moveTo(10, 0);    // Front
            ctx.lineTo(0, -6);    // Top
            ctx.lineTo(-8, 0);    // Back
            ctx.lineTo(0, 6);     // Bottom
            ctx.closePath();
            ctx.fill();

            // Metallic highlight
            ctx.fillStyle = 'rgba(150, 255, 200, 0.5)';
            ctx.beginPath();
            ctx.moveTo(8, -1);
            ctx.lineTo(2, -4);
            ctx.lineTo(-2, -1);
            ctx.closePath();
            ctx.fill();

            // Wing lights
            const wingGlow = 0.5 + Math.sin(time * 5) * 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${wingGlow})`;
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#00ffff';
            ctx.beginPath();
            ctx.arc(0, -5, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(0, 5, 2, 0, Math.PI * 2);
            ctx.fill();

            // Nose sensor
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#ffffff';
            ctx.beginPath();
            ctx.arc(9, 0, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Thruster glow - multi-layered
            const thrusterSize = 3 + drone.thrusterFlicker * 3;

            // Outer thruster glow
            const thrusterGrad = ctx.createRadialGradient(-10, 0, 0, -10, 0, thrusterSize * 2);
            thrusterGrad.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
            thrusterGrad.addColorStop(0.5, 'rgba(0, 255, 136, 0.5)');
            thrusterGrad.addColorStop(1, 'rgba(0, 200, 100, 0)');

            ctx.fillStyle = thrusterGrad;
            ctx.shadowBlur = 15;
            ctx.shadowColor = DRONE.thrusterColor;
            ctx.beginPath();
            ctx.arc(-10, 0, thrusterSize * 2, 0, Math.PI * 2);
            ctx.fill();

            // Inner thruster core
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ffffff';
            ctx.beginPath();
            ctx.arc(-10, 0, thrusterSize * 0.5, 0, Math.PI * 2);
            ctx.fill();

            // Targeting laser (when has target)
            if (drone.targetEnemy) {
                const targetDist = Math.hypot(drone.targetEnemy.x - x, drone.targetEnemy.y - y);
                const laserPulse = 0.3 + Math.sin(time * 8) * 0.2;

                // Laser beam glow
                ctx.strokeStyle = `rgba(0, 255, 136, ${laserPulse * 0.3})`;
                ctx.lineWidth = 4;
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#00ff88';
                ctx.beginPath();
                ctx.moveTo(10, 0);
                ctx.lineTo(targetDist, 0);
                ctx.stroke();

                // Laser beam core
                ctx.strokeStyle = `rgba(100, 255, 200, ${laserPulse})`;
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.lineDashOffset = -time * 5;
                ctx.beginPath();
                ctx.moveTo(10, 0);
                ctx.lineTo(targetDist, 0);
                ctx.stroke();
                ctx.setLineDash([]);

                // Target reticle
                ctx.strokeStyle = `rgba(0, 255, 136, ${laserPulse})`;
                ctx.lineWidth = 1;
                const reticleSize = 8;
                ctx.beginPath();
                ctx.arc(targetDist, 0, reticleSize, 0, Math.PI * 2);
                ctx.stroke();
                // Crosshairs
                ctx.beginPath();
                ctx.moveTo(targetDist - reticleSize - 3, 0);
                ctx.lineTo(targetDist - reticleSize + 3, 0);
                ctx.moveTo(targetDist + reticleSize - 3, 0);
                ctx.lineTo(targetDist + reticleSize + 3, 0);
                ctx.moveTo(targetDist, -reticleSize - 3);
                ctx.lineTo(targetDist, -reticleSize + 3);
                ctx.moveTo(targetDist, reticleSize - 3);
                ctx.lineTo(targetDist, reticleSize + 3);
                ctx.stroke();
            }

            ctx.restore();

            // Life indicator with glow
            const lifePercent = drone.life / DRONE.duration;

            // Background
            ctx.fillStyle = 'rgba(0, 50, 50, 0.5)';
            ctx.fillRect(x - 9, y + 11, 18, 4);

            // Fill
            const lifeGrad = ctx.createLinearGradient(x - 8, 0, x + 8, 0);
            lifeGrad.addColorStop(0, '#00ff88');
            lifeGrad.addColorStop(0.5, '#88ffcc');
            lifeGrad.addColorStop(1, '#00ff88');

            ctx.fillStyle = lifeGrad;
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#00ff88';
            ctx.fillRect(x - 8, y + 12, 16 * lifePercent, 2);
        }

        ctx.restore();
    }
}
