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

        ctx.save();

        // Draw charge effect
        if (this.charging) {
            const progress = this.chargeProgress / RAILGUN.chargeTime;

            // Charging ring
            ctx.strokeStyle = `rgba(136, 0, 255, ${progress})`;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#8800ff';

            ctx.beginPath();
            ctx.arc(player.x, player.y, 25 - progress * 10, 0, Math.PI * 2 * progress);
            ctx.stroke();

            // Charge particles
            for (const p of this.chargeParticles) {
                ctx.fillStyle = '#8800ff';
                ctx.globalAlpha = p.life / 30;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            // Ready indicator
            if (progress >= 1) {
                ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.5;
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 14px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('READY', player.x, player.y - 40);
                ctx.globalAlpha = 1;
            }
        }

        // Draw trails
        for (const trail of this.trails) {
            const alpha = trail.life / trail.maxLife;
            const width = trail.width * alpha;

            // Outer glow
            ctx.strokeStyle = `rgba(136, 0, 255, ${alpha * 0.3})`;
            ctx.lineWidth = width * 3;
            ctx.shadowBlur = 50;
            ctx.shadowColor = '#8800ff';
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(trail.x1, trail.y1);
            ctx.lineTo(trail.x2, trail.y2);
            ctx.stroke();

            // Main beam
            ctx.strokeStyle = `rgba(136, 0, 255, ${alpha})`;
            ctx.lineWidth = width;
            ctx.stroke();

            // White core
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = width * 0.3;
            ctx.shadowColor = '#ffffff';
            ctx.stroke();
        }

        // Flash effect
        if (this.flashTimer > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.flashTimer / 10})`;
            ctx.fillRect(0, 0, config.width || 800, config.height || 600);
        }

        ctx.restore();
    }
}
