/**
 * Geometry 3044 - Plasma Beam Weapon
 * Continuous laser beam that the player can sweep
 */

import { CONFIG } from '../config.js';
import { config, particleSystem, soundSystem } from '../globals.js';

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
        this.soundLoop = null; // Reference to continuous sound
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

        // Start plasma beam sound
        if (soundSystem && soundSystem.startPlasmaBeamSound) {
            this.soundLoop = soundSystem.startPlasmaBeamSound();
        }
    }

    /**
     * Deactivate the plasma beam
     */
    deactivate() {
        this.active = false;
        this.length = 0;
        this.particles = [];

        // Stop plasma beam sound
        if (soundSystem && soundSystem.stopPlasmaBeamSound && this.soundLoop) {
            soundSystem.stopPlasmaBeamSound(this.soundLoop);
            this.soundLoop = null;
        }
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
        const time = Date.now() * 0.01;

        ctx.save();

        // Pulsing width
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.3;
        const width = PLASMA_BEAM.beamWidth * pulse;

        // Heat distortion background effect
        ctx.strokeStyle = 'rgba(255, 100, 200, 0.08)';
        ctx.lineWidth = width * 8;
        ctx.shadowBlur = 60;
        ctx.shadowColor = '#ff00ff';
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Outer plasma field
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.2)';
        ctx.lineWidth = width * 5;
        ctx.shadowBlur = 50;
        ctx.stroke();

        // Secondary glow layer
        ctx.strokeStyle = 'rgba(255, 50, 255, 0.4)';
        ctx.lineWidth = width * 3;
        ctx.shadowBlur = 35;
        ctx.stroke();

        // Main beam with animated gradient
        const gradient = ctx.createLinearGradient(player.x, player.y, endX, endY);
        const colorShift = Math.sin(time * 2) * 0.5 + 0.5;
        gradient.addColorStop(0, '#ff00ff');
        gradient.addColorStop(0.25 + colorShift * 0.1, '#ff44ff');
        gradient.addColorStop(0.5, '#ff88ff');
        gradient.addColorStop(0.75 - colorShift * 0.1, '#ff44ff');
        gradient.addColorStop(1, '#ff00ff');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = width * 2;
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#ff00ff';
        ctx.stroke();

        // Energy core with pulsing
        const coreAlpha = 0.7 + Math.sin(this.pulsePhase * 2) * 0.3;
        ctx.strokeStyle = `rgba(255, 200, 255, ${coreAlpha})`;
        ctx.lineWidth = width;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffaaff';
        ctx.stroke();

        // White hot center
        ctx.strokeStyle = `rgba(255, 255, 255, ${coreAlpha})`;
        ctx.lineWidth = width * 0.4;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffffff';
        ctx.stroke();

        // Draw energy rings along the beam
        const ringCount = Math.floor(this.length / 40);
        for (let i = 0; i < ringCount; i++) {
            const t = (i + 1) / (ringCount + 1);
            const ringX = player.x + Math.cos(this.angle) * this.length * t;
            const ringY = player.y + Math.sin(this.angle) * this.length * t;
            const ringPhase = time * 3 + i * 0.5;
            const ringSize = width * (1.5 + Math.sin(ringPhase) * 0.5);
            const ringAlpha = 0.4 + Math.sin(ringPhase) * 0.2;

            // Ring glow
            ctx.strokeStyle = `rgba(255, 100, 255, ${ringAlpha})`;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff00ff';
            ctx.beginPath();
            ctx.arc(ringX, ringY, ringSize, 0, Math.PI * 2);
            ctx.stroke();

            // Inner ring
            ctx.strokeStyle = `rgba(255, 200, 255, ${ringAlpha * 0.7})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(ringX, ringY, ringSize * 0.6, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw particles with trails
        for (const p of this.particles) {
            const alpha = p.life / p.maxLife;

            // Particle glow
            const particleGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
            particleGrad.addColorStop(0, `rgba(255, 200, 255, ${alpha})`);
            particleGrad.addColorStop(0.5, `rgba(255, 0, 255, ${alpha * 0.5})`);
            particleGrad.addColorStop(1, 'rgba(255, 0, 255, 0)');

            ctx.fillStyle = particleGrad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            ctx.fill();

            // Particle core
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.5 * alpha, 0, Math.PI * 2);
            ctx.fill();
        }

        // Enhanced muzzle flare with multiple layers
        const muzzleSize = width * 2;

        // Outer flare
        const muzzleGrad = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, muzzleSize * 2);
        muzzleGrad.addColorStop(0, `rgba(255, 255, 255, ${0.9 + Math.sin(this.pulsePhase * 3) * 0.1})`);
        muzzleGrad.addColorStop(0.3, 'rgba(255, 150, 255, 0.7)');
        muzzleGrad.addColorStop(0.6, 'rgba(255, 0, 255, 0.4)');
        muzzleGrad.addColorStop(1, 'rgba(255, 0, 255, 0)');

        ctx.fillStyle = muzzleGrad;
        ctx.shadowBlur = 40;
        ctx.shadowColor = '#ff00ff';
        ctx.beginPath();
        ctx.arc(player.x, player.y, muzzleSize * 2, 0, Math.PI * 2);
        ctx.fill();

        // Muzzle rays
        ctx.globalAlpha = 0.6;
        for (let i = 0; i < 8; i++) {
            const rayAngle = this.angle + (i / 8) * Math.PI * 2;
            const rayLen = muzzleSize * (1 + Math.sin(time * 5 + i) * 0.3);

            ctx.strokeStyle = 'rgba(255, 200, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(player.x, player.y);
            ctx.lineTo(
                player.x + Math.cos(rayAngle) * rayLen,
                player.y + Math.sin(rayAngle) * rayLen
            );
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Beam end impact effect
        const impactGrad = ctx.createRadialGradient(endX, endY, 0, endX, endY, width * 3);
        impactGrad.addColorStop(0, `rgba(255, 255, 255, 0.8)`);
        impactGrad.addColorStop(0.4, 'rgba(255, 100, 255, 0.5)');
        impactGrad.addColorStop(1, 'rgba(255, 0, 255, 0)');

        ctx.fillStyle = impactGrad;
        ctx.beginPath();
        ctx.arc(endX, endY, width * 3, 0, Math.PI * 2);
        ctx.fill();

        // Duration bar with glow
        const durationPercent = this.duration / PLASMA_BEAM.duration;
        ctx.globalAlpha = 0.9;

        // Bar background
        ctx.fillStyle = 'rgba(100, 0, 100, 0.5)';
        ctx.fillRect(player.x - 26, player.y + 29, 52, 6);

        // Bar fill with gradient
        const barGrad = ctx.createLinearGradient(player.x - 25, 0, player.x + 25, 0);
        barGrad.addColorStop(0, '#ff00ff');
        barGrad.addColorStop(0.5, '#ff88ff');
        barGrad.addColorStop(1, '#ff00ff');
        ctx.fillStyle = barGrad;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff00ff';
        ctx.fillRect(player.x - 25, player.y + 30, 50 * durationPercent, 4);

        ctx.restore();
    }
}
