/**
 * Geometry 3044 - Railgun Weapon
 * Charged shot that pierces through all enemies
 */

import { CONFIG } from '../config.js';
import { config, gameState, particleSystem, soundSystem } from '../globals.js';

const RAILGUN = {
    name: 'RAILGUN',
    chargeTime: 45,          // Frames to charge
    damage: 50,
    piercing: true,          // Goes through everything
    cooldown: 90,            // Frames between shots
    trailDuration: 20,
    color: '#8800ff',
    coreColor: '#ffffff',
    screenShake: 15
};

export class Railgun {
    constructor() {
        this.charging = false;
        this.chargeProgress = 0;
        this.cooldown = 0;
        this.trails = [];
        this.chargeParticles = [];
        this.flashTimer = 0;
    }

    /**
     * Start charging the railgun
     */
    startCharge() {
        if (this.cooldown > 0) return false;
        this.charging = true;
        this.chargeProgress = 0;
        return true;
    }

    /**
     * Update railgun state
     */
    update(player, enemies, keys) {
        // Cooldown
        if (this.cooldown > 0) this.cooldown--;
        if (this.flashTimer > 0) this.flashTimer--;

        // Update charge particles
        if (player) {
            this.chargeParticles = this.chargeParticles.filter(p => {
                // Move toward player
                const dx = player.x - p.x;
                const dy = player.y - p.y;
                const dist = Math.hypot(dx, dy);

                if (dist < 10) return false;

                p.x += (dx / dist) * p.speed;
                p.y += (dy / dist) * p.speed;
                p.life--;
                return p.life > 0;
            });
        }

        // Charge particles
        if (this.charging && player) {
            this.chargeProgress++;
            this.spawnChargeParticles(player);

            // Auto-fire when fully charged
            if (this.chargeProgress >= RAILGUN.chargeTime) {
                this.fire(player, enemies || []);
            }
        }

        // Update trails
        this.trails = this.trails.filter(t => {
            t.life--;
            return t.life > 0;
        });
    }

    /**
     * Spawn charge particles around player
     */
    spawnChargeParticles(player) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * 40;

        this.chargeParticles.push({
            x: player.x + Math.cos(angle) * dist,
            y: player.y + Math.sin(angle) * dist,
            speed: 3 + (this.chargeProgress / RAILGUN.chargeTime) * 5,
            life: 30,
            size: 2 + Math.random() * 2
        });
    }

    /**
     * Fire the railgun
     */
    fire(player, enemies) {
        this.charging = false;
        this.chargeProgress = 0;
        this.cooldown = RAILGUN.cooldown;

        // Calculate beam path (straight up from player)
        const startX = player.x;
        const startY = player.y;
        const endX = player.x;
        const endY = -50;  // Off screen top

        // Create trail
        this.trails.push({
            x1: startX, y1: startY,
            x2: endX, y2: endY,
            life: RAILGUN.trailDuration,
            maxLife: RAILGUN.trailDuration,
            width: 20
        });

        // Hit ALL enemies in path
        for (const enemy of enemies) {
            if (!enemy.active) continue;

            // Check if enemy is within beam width of the line
            if (Math.abs(enemy.x - startX) < 30) {
                if (enemy.takeDamage) {
                    enemy.takeDamage(RAILGUN.damage);
                } else {
                    enemy.hp -= RAILGUN.damage;
                    if (enemy.hp <= 0) enemy.active = false;
                }

                // Impact effect
                this.createImpactEffect(enemy.x, enemy.y);
            }
        }

        // Screen shake
        if (gameState && gameState.triggerScreenShake) {
            gameState.triggerScreenShake('heavy');
        }

        // White flash
        this.flashTimer = 5;

        // Sound
        if (soundSystem && soundSystem.play) {
            soundSystem.play('explosion');
        }
    }

    /**
     * Create impact effect at enemy position
     */
    createImpactEffect(x, y) {
        if (particleSystem) {
            // Horizontal shockwave
            for (let i = 0; i < 20; i++) {
                const angle = (Math.random() - 0.5) * Math.PI; // Horizontal spread
                const speed = 5 + Math.random() * 10;
                particleSystem.emit(x, y, 1, {
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed * 0.5,
                    color: i % 2 === 0 ? '#8800ff' : '#ffffff',
                    life: 20,
                    size: 3
                });
            }
        }
    }

    /**
     * Draw the railgun effects
     */
    draw(ctx, player) {
        if (!player) return;

        const time = Date.now() * 0.01;
        ctx.save();

        // Draw charge effect
        if (this.charging) {
            const progress = this.chargeProgress / RAILGUN.chargeTime;

            // Outer energy field
            ctx.strokeStyle = `rgba(136, 0, 255, ${progress * 0.2})`;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#8800ff';
            ctx.beginPath();
            ctx.arc(player.x, player.y, 40 - progress * 15, 0, Math.PI * 2);
            ctx.stroke();

            // Energy spiral effect
            for (let i = 0; i < 3; i++) {
                const spiralAngle = time * 5 + (i * Math.PI * 2 / 3);
                const spiralRadius = (30 - progress * 20) * (1 - progress * 0.3);

                ctx.strokeStyle = `rgba(170, 50, 255, ${progress * 0.6})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(player.x, player.y, spiralRadius, spiralAngle, spiralAngle + Math.PI * 0.5);
                ctx.stroke();
            }

            // Charging ring - main
            ctx.strokeStyle = `rgba(136, 0, 255, ${progress})`;
            ctx.lineWidth = 4;
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#8800ff';

            ctx.beginPath();
            ctx.arc(player.x, player.y, 25 - progress * 10, 0, Math.PI * 2 * progress);
            ctx.stroke();

            // Inner charging ring
            ctx.strokeStyle = `rgba(200, 100, 255, ${progress * 0.8})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(player.x, player.y, 15 - progress * 5, Math.PI * 2 * progress, Math.PI * 2);
            ctx.stroke();

            // Charge particles with trails
            for (const p of this.chargeParticles) {
                const particleAlpha = p.life / 30;

                // Particle trail
                const trailGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
                trailGrad.addColorStop(0, `rgba(170, 100, 255, ${particleAlpha})`);
                trailGrad.addColorStop(0.5, `rgba(136, 0, 255, ${particleAlpha * 0.5})`);
                trailGrad.addColorStop(1, 'rgba(136, 0, 255, 0)');

                ctx.fillStyle = trailGrad;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                ctx.fill();

                // Particle core
                ctx.fillStyle = `rgba(255, 200, 255, ${particleAlpha})`;
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#aa66ff';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }

            // Energy buildup indicator line pointing up
            if (progress > 0.3) {
                const lineAlpha = (progress - 0.3) / 0.7;
                ctx.strokeStyle = `rgba(136, 0, 255, ${lineAlpha * 0.5})`;
                ctx.lineWidth = 3 + progress * 5;
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#8800ff';
                ctx.beginPath();
                ctx.moveTo(player.x, player.y);
                ctx.lineTo(player.x, player.y - 50 * progress);
                ctx.stroke();
            }

            // Ready indicator with pulsing
            if (progress >= 1) {
                const readyPulse = 0.5 + Math.sin(time * 4) * 0.5;
                ctx.globalAlpha = readyPulse;
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#8800ff';
                ctx.font = 'bold 16px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('▲ READY ▲', player.x, player.y - 45);
                ctx.globalAlpha = 1;

                // Pulsing ready ring
                ctx.strokeStyle = `rgba(255, 255, 255, ${readyPulse * 0.5})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(player.x, player.y, 20 + readyPulse * 5, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Draw trails
        for (const trail of this.trails) {
            const alpha = trail.life / trail.maxLife;
            const width = trail.width * alpha;

            // Background energy field
            ctx.strokeStyle = `rgba(100, 0, 200, ${alpha * 0.1})`;
            ctx.lineWidth = width * 6;
            ctx.shadowBlur = 60;
            ctx.shadowColor = '#8800ff';
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(trail.x1, trail.y1);
            ctx.lineTo(trail.x2, trail.y2);
            ctx.stroke();

            // Outer plasma glow
            ctx.strokeStyle = `rgba(136, 0, 255, ${alpha * 0.3})`;
            ctx.lineWidth = width * 4;
            ctx.shadowBlur = 50;
            ctx.stroke();

            // Secondary glow
            ctx.strokeStyle = `rgba(170, 50, 255, ${alpha * 0.5})`;
            ctx.lineWidth = width * 2.5;
            ctx.shadowBlur = 35;
            ctx.stroke();

            // Main beam
            ctx.strokeStyle = `rgba(136, 0, 255, ${alpha})`;
            ctx.lineWidth = width * 1.5;
            ctx.shadowBlur = 25;
            ctx.stroke();

            // Inner glow
            ctx.strokeStyle = `rgba(200, 150, 255, ${alpha})`;
            ctx.lineWidth = width;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#cc99ff';
            ctx.stroke();

            // White hot core
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = width * 0.4;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffffff';
            ctx.stroke();

            // Energy crackles along the beam
            if (alpha > 0.5) {
                const crackleCount = 6;
                for (let i = 0; i < crackleCount; i++) {
                    const t = (i + Math.random() * 0.5) / crackleCount;
                    const crackleY = trail.y1 + (trail.y2 - trail.y1) * t;
                    const crackleX = trail.x1 + (Math.random() - 0.5) * width * 2;

                    ctx.strokeStyle = `rgba(200, 150, 255, ${alpha * 0.6})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(crackleX, crackleY);
                    ctx.lineTo(crackleX + (Math.random() - 0.5) * 30, crackleY + (Math.random() - 0.5) * 20);
                    ctx.stroke();
                }
            }

            // Impact rings at start
            if (alpha > 0.7) {
                const ringProgress = 1 - (alpha - 0.7) / 0.3;
                ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - ringProgress) * 0.5})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(trail.x1, trail.y1, 10 + ringProgress * 30, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Enhanced flash effect
        if (this.flashTimer > 0) {
            const flashAlpha = this.flashTimer / 8;

            // Purple tint first
            ctx.fillStyle = `rgba(136, 0, 255, ${flashAlpha * 0.3})`;
            ctx.fillRect(0, 0, config.width || 800, config.height || 600);

            // White flash
            ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.8})`;
            ctx.fillRect(0, 0, config.width || 800, config.height || 600);
        }

        ctx.restore();
    }
}
