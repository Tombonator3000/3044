/**
 * Geometry 3044 - Railgun Weapon
 * Charged shot that pierces through all enemies
 */

import { CONFIG } from '../config.js';
import { GameSettings } from '../ui/MenuManager.js';
import { config, gameState as legacyState, particleSystem as legacyParticles, soundSystem as legacySound } from '../globals.js';

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
    constructor(context = {}) {
        this.context = context;
        this.charging = false;
        this.chargeProgress = 0;
        this.cooldown = 0;
        this.trails = [];
        this.chargeParticles = [];
        this.flashTimer = 0;
        this._chargeIndex = 0;
        this._trailIndex = 0;
        this._chargePool = Array.from({ length: 64 }, () => ({ active: false, x: 0, y: 0, speed: 0, life: 0, size: 0 }));
        this._trailPool = Array.from({ length: 4 }, () => ({ active: false, x1: 0, y1: 0, x2: 0, y2: 0, life: 0, maxLife: RAILGUN.trailDuration, width: 20 }));
    }

    /**
     * Start charging the railgun
     */
    startCharge() {
        const soundSystem = this.context.soundSystem || legacySound;
        const gameState = this.context.gameState || legacyState;
        if (this.cooldown > 0) return false;
        this.charging = true;
        this.chargeProgress = 0;

        // Play charge sound
        if (soundSystem && soundSystem.playRailgunChargeSound) {
            soundSystem.playRailgunChargeSound();
        }

        return true;
    }

    /**
     * Update railgun state
     */
    update(player, enemies, keys) {
        // Cooldown
        if (this.cooldown > 0) this.cooldown--;
        if (this.flashTimer > 0) this.flashTimer--;

        // Compact active charge particles without allocating a new array.
        let count = 0;
        for (const p of this.chargeParticles) {
            const dx = player ? player.x - p.x : 0;
            const dy = player ? player.y - p.y : 0;
            const dist = Math.hypot(dx, dy);
            p.active = !!player && dist >= 10 && --p.life > 0;
            if (!p.active) continue;
            p.x += dx / dist * p.speed;
            p.y += dy / dist * p.speed;
            this.chargeParticles[count++] = p;
        }
        this.chargeParticles.length = count;

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
        count = 0;
        for (const trail of this.trails) {
            trail.active = --trail.life > 0;
            if (trail.active) this.trails[count++] = trail;
        }
        this.trails.length = count;
    }

    /**
     * Spawn charge particles around player
     */
    spawnChargeParticles(player) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * 40;

        const p = this._chargePool[this._chargeIndex];
        this._chargeIndex = (this._chargeIndex + 1) % this._chargePool.length;
        if (!p.active) this.chargeParticles.push(p);
        p.active = true;
        p.x = player.x + Math.cos(angle) * dist;
        p.y = player.y + Math.sin(angle) * dist;
        p.speed = 3 + (this.chargeProgress / RAILGUN.chargeTime) * 5;
        p.life = 30;
        p.size = 2 + Math.random() * 2;
    }

    /**
     * Fire the railgun
     */
    fire(player, enemies) {
        const soundSystem = this.context.soundSystem || legacySound;
        const gameState = this.context.gameState || legacyState;
        this.charging = false;
        this.chargeProgress = 0;
        this.cooldown = RAILGUN.cooldown;

        // Calculate beam path (straight up from player)
        const startX = player.x;
        const startY = player.y;
        const sideways = !!player.sidescrollerMode;
        const endX = sideways ? (this.context.canvas?.logicalWidth || config.width) + 50 : player.x;
        const endY = sideways ? player.y : -50;

        // Create trail
        const trail = this._trailPool[this._trailIndex];
        this._trailIndex = (this._trailIndex + 1) % this._trailPool.length;
        if (!trail.active) this.trails.push(trail);
        trail.active = true;
        trail.x1 = startX; trail.y1 = startY;
        trail.x2 = endX; trail.y2 = endY;
        trail.life = RAILGUN.trailDuration;

        // Hit ALL enemies in path
        for (const enemy of enemies) {
            if (!enemy.active) continue;

            // Check if enemy is within beam width of the line
            const radius = enemy.size || 20;
            const inBeam = sideways
                ? enemy.x >= startX - radius && enemy.x <= endX + radius && Math.abs(enemy.y - startY) < radius + 10
                : enemy.y <= startY + radius && enemy.y >= endY - radius && Math.abs(enemy.x - startX) < radius + 10;
            if (inBeam) {
                if (this.context.damageEnemy) {
                    this.context.damageEnemy(enemy, RAILGUN.damage);
                } else if (enemy.takeDamage) {
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
        this.flashTimer = this.context.gameState?.reducedFlash ? 0 : 3;

        // Play railgun fire sound
        if (soundSystem && soundSystem.playRailgunFireSound) {
            soundSystem.playRailgunFireSound();
        }
    }

    /**
     * Create impact effect at enemy position
     */
    createImpactEffect(x, y) {
        const particleSystem = this.context.particleSystem || legacyParticles;
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
            ctx.shadowBlur = (CONFIG.rendering.reducedEffectsMode || GameSettings.neonGlowIntensity === 'low') ? 0 : Math.min(8, 30);
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
            ctx.shadowBlur = (CONFIG.rendering.reducedEffectsMode || GameSettings.neonGlowIntensity === 'low') ? 0 : Math.min(8, 25);
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
                ctx.shadowBlur = (CONFIG.rendering.reducedEffectsMode || GameSettings.neonGlowIntensity === 'low') ? 0 : Math.min(8, 10);
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
                ctx.shadowBlur = (CONFIG.rendering.reducedEffectsMode || GameSettings.neonGlowIntensity === 'low') ? 0 : Math.min(8, 20);
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
                ctx.shadowBlur = (CONFIG.rendering.reducedEffectsMode || GameSettings.neonGlowIntensity === 'low') ? 0 : Math.min(8, 20);
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
            ctx.shadowBlur = (CONFIG.rendering.reducedEffectsMode || GameSettings.neonGlowIntensity === 'low') ? 0 : Math.min(8, 60);
            ctx.shadowColor = '#8800ff';
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(trail.x1, trail.y1);
            ctx.lineTo(trail.x2, trail.y2);
            ctx.stroke();

            // Outer plasma glow
            ctx.strokeStyle = `rgba(136, 0, 255, ${alpha * 0.3})`;
            ctx.lineWidth = width * 4;
            ctx.shadowBlur = (CONFIG.rendering.reducedEffectsMode || GameSettings.neonGlowIntensity === 'low') ? 0 : Math.min(8, 50);
            ctx.stroke();

            // Secondary glow
            ctx.strokeStyle = `rgba(170, 50, 255, ${alpha * 0.5})`;
            ctx.lineWidth = width * 2.5;
            ctx.shadowBlur = (CONFIG.rendering.reducedEffectsMode || GameSettings.neonGlowIntensity === 'low') ? 0 : Math.min(8, 35);
            ctx.stroke();

            // Main beam
            ctx.strokeStyle = `rgba(136, 0, 255, ${alpha})`;
            ctx.lineWidth = width * 1.5;
            ctx.shadowBlur = (CONFIG.rendering.reducedEffectsMode || GameSettings.neonGlowIntensity === 'low') ? 0 : Math.min(8, 25);
            ctx.stroke();

            // Inner glow
            ctx.strokeStyle = `rgba(200, 150, 255, ${alpha})`;
            ctx.lineWidth = width;
            ctx.shadowBlur = (CONFIG.rendering.reducedEffectsMode || GameSettings.neonGlowIntensity === 'low') ? 0 : Math.min(8, 15);
            ctx.shadowColor = '#cc99ff';
            ctx.stroke();

            // White hot core
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = width * 0.4;
            ctx.shadowBlur = (CONFIG.rendering.reducedEffectsMode || GameSettings.neonGlowIntensity === 'low') ? 0 : Math.min(8, 10);
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
