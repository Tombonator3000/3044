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

        ctx.save();

        for (const drone of this.drones) {
            const x = drone.x;
            const y = drone.y;
            const facingAngle = drone.targetEnemy
                ? Math.atan2(drone.targetEnemy.y - y, drone.targetEnemy.x - x)
                : drone.angle + Math.PI / 2;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(facingAngle);

            // Drone body (diamond shape)
            ctx.fillStyle = DRONE.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = DRONE.color;

            ctx.beginPath();
            ctx.moveTo(10, 0);    // Front
            ctx.lineTo(0, -6);    // Top
            ctx.lineTo(-8, 0);    // Back
            ctx.lineTo(0, 6);     // Bottom
            ctx.closePath();
            ctx.fill();

            // Thruster glow
            const thrusterSize = 3 + drone.thrusterFlicker * 3;
            ctx.fillStyle = DRONE.thrusterColor;
            ctx.shadowColor = DRONE.thrusterColor;
            ctx.beginPath();
            ctx.arc(-10, 0, thrusterSize, 0, Math.PI * 2);
            ctx.fill();

            // Targeting laser (when has target)
            if (drone.targetEnemy) {
                ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 6]);
                ctx.beginPath();
                ctx.moveTo(10, 0);
                const targetDist = Math.hypot(drone.targetEnemy.x - x, drone.targetEnemy.y - y);
                ctx.lineTo(targetDist, 0);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            ctx.restore();

            // Life indicator
            const lifePercent = drone.life / DRONE.duration;
            ctx.fillStyle = `rgba(0, 255, 136, 0.5)`;
            ctx.fillRect(x - 8, y + 12, 16 * lifePercent, 2);
        }

        ctx.restore();
    }
}
