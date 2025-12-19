/**
 * Geometry 3044 - Plasma Beam Weapon
 * Continuous laser beam that the player can sweep
 */

import { CONFIG } from '../config.js';
import { config, particleSystem } from '../globals.js';

const PLASMA_BEAM = {
    name: 'PLASMA BEAM',
    duration: 480,           // 8 seconds
    damagePerFrame: 2,       // Continuous damage
    beamWidth: 8,
    maxLength: 800,
    rotationSpeed: 0.03,     // Radians per frame
    color: '#ff00ff',
    coreColor: '#ffffff',
    chargeTime: 30           // Frames before beam starts
};

export class PlasmaBeam {
    constructor() {
        this.active = false;
        this.angle = -Math.PI / 2;  // Start pointing up
        this.length = 0;
        this.targetLength = PLASMA_BEAM.maxLength;
        this.chargeTimer = 0;
        this.pulsePhase = 0;
        this.particles = [];
        this.duration = 0;
    }

    /**
     * Activate the plasma beam
     */
    activate() {
        this.active = true;
        this.chargeTimer = PLASMA_BEAM.chargeTime;
        this.length = 0;
        this.duration = PLASMA_BEAM.duration;
        this.angle = -Math.PI / 2;
    }

    /**
     * Deactivate the plasma beam
     */
    deactivate() {
        this.active = false;
        this.length = 0;
        this.particles = [];
    }

    /**
     * Update the plasma beam
     */
    update(player, keys, enemies) {
        if (!this.active || !player) return;

        // Duration countdown
        this.duration--;
        if (this.duration <= 0) {
            this.deactivate();
            return;
        }

        // Charge up phase
        if (this.chargeTimer > 0) {
            this.chargeTimer--;
            this.length = (1 - this.chargeTimer / PLASMA_BEAM.chargeTime) * 50;
            return;
        }

        // Extend beam
        this.length = Math.min(this.length + 30, this.targetLength);

        // Rotate with A/D or arrow keys
        if (keys && (keys['a'] || keys['ArrowLeft'])) {
            this.angle -= PLASMA_BEAM.rotationSpeed;
        }
        if (keys && (keys['d'] || keys['ArrowRight'])) {
            this.angle += PLASMA_BEAM.rotationSpeed;
        }

        // Clamp angle (-180° to 0°, only upward)
        this.angle = Math.max(-Math.PI, Math.min(0, this.angle));

        // Pulse animation
        this.pulsePhase += 0.2;

        // Collision with enemies along beam
        if (enemies) {
            this.checkBeamCollisions(player, enemies);
        }

        // Spawn edge particles
        this.spawnBeamParticles(player);

        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            return p.life > 0;
        });
    }

    /**
     * Check for collisions along the beam
     */
    checkBeamCollisions(player, enemies) {
        const endX = player.x + Math.cos(this.angle) * this.length;
        const endY = player.y + Math.sin(this.angle) * this.length;

        for (const enemy of enemies) {
            if (!enemy.active) continue;

            // Point-to-line distance
            const dist = this.pointToLineDistance(
                enemy.x, enemy.y,
                player.x, player.y,
                endX, endY
            );

            const enemySize = enemy.size || 20;
            if (dist < PLASMA_BEAM.beamWidth + enemySize) {
                if (enemy.takeDamage) {
                    enemy.takeDamage(PLASMA_BEAM.damagePerFrame);
                } else {
                    enemy.hp -= PLASMA_BEAM.damagePerFrame;
                    if (enemy.hp <= 0) enemy.active = false;
                }

                // Impact particles
                if (Math.random() < 0.3) {
                    this.createImpactParticle(enemy.x, enemy.y);
                }
            }
        }
    }

    /**
     * Calculate point-to-line distance
     */
    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = x1; yy = y1;
        } else if (param > 1) {
            xx = x2; yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        return Math.hypot(px - xx, py - yy);
    }

    /**
     * Spawn particles along the beam
     */
    spawnBeamParticles(player) {
        if (Math.random() > 0.4) return;

        const t = Math.random();
        const x = player.x + Math.cos(this.angle) * this.length * t;
        const y = player.y + Math.sin(this.angle) * this.length * t;

        // Perpendicular offset
        const perpAngle = this.angle + Math.PI / 2;
        const offset = (Math.random() - 0.5) * PLASMA_BEAM.beamWidth * 2;

        this.particles.push({
            x: x + Math.cos(perpAngle) * offset,
            y: y + Math.sin(perpAngle) * offset,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 20,
            maxLife: 20,
            size: 2 + Math.random() * 2,
            color: Math.random() > 0.5 ? '#ff00ff' : '#ff88ff'
        });
    }

    /**
     * Create impact particle
     */
    createImpactParticle(x, y) {
        this.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 15,
            maxLife: 15,
            size: 3,
            color: '#ffffff'
        });
    }

    /**
     * Draw the plasma beam
     */
    draw(ctx, player) {
        if (!this.active || !player || this.length < 10) return;

        const endX = player.x + Math.cos(this.angle) * this.length;
        const endY = player.y + Math.sin(this.angle) * this.length;

        ctx.save();

        // Pulsing width
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.3;
        const width = PLASMA_BEAM.beamWidth * pulse;

        // Outer glow
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)';
        ctx.lineWidth = width * 4;
        ctx.shadowBlur = 40;
        ctx.shadowColor = '#ff00ff';
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Main beam
        const gradient = ctx.createLinearGradient(player.x, player.y, endX, endY);
        gradient.addColorStop(0, '#ff00ff');
        gradient.addColorStop(0.5, '#ff44ff');
        gradient.addColorStop(1, '#ff00ff');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = width * 2;
        ctx.shadowBlur = 20;
        ctx.stroke();

        // White core
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 + Math.sin(this.pulsePhase * 2) * 0.3})`;
        ctx.lineWidth = width * 0.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffffff';
        ctx.stroke();

        // Draw particles
        for (const p of this.particles) {
            const alpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Muzzle flare
        ctx.globalAlpha = 0.8 + Math.sin(this.pulsePhase * 3) * 0.2;
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ff00ff';
        ctx.beginPath();
        ctx.arc(player.x, player.y, width * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Duration bar
        const durationPercent = this.duration / PLASMA_BEAM.duration;
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(player.x - 25, player.y + 30, 50 * durationPercent, 4);

        ctx.restore();
    }
}
