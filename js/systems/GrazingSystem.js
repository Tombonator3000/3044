/**
 * Geometry 3044 - Grazing System
 * Bullet hell inspired system that rewards near-misses
 * Get bonus points for being close to enemy bullets without getting hit
 */

import { calculateDistance } from '../utils/MathUtils.js';

export class GrazingSystem {
    constructor() {
        // Grazing configuration (balanced - reduced from original values)
        this.grazeRadius = 32;          // Distance to trigger graze (was 40 - too generous)
        this.minGrazeRadius = 18;       // Too close = danger zone (was 15)
        this.pointsPerGraze = 35;       // Base points per graze (was 50)
        this.maxGrazeMultiplier = 5;    // Max multiplier for consecutive grazes (was 8)

        // State
        this.grazeCount = 0;            // Current graze streak
        this.grazeTimer = 0;            // Timer to reset streak
        this.grazeTimeout = 60;         // Frames before streak resets
        this.totalGrazePoints = 0;      // Total points earned from grazing
        this.grazedBullets = new Set(); // Track which bullets have been grazed

        // Visual effects
        this.grazeEffects = [];         // Active graze visual effects
        this.maxEffects = 20;

        // Stats for achievements
        this.totalGrazes = 0;
        this.maxGrazeStreak = 0;
        this.sessionGrazes = 0;
    }

    /**
     * Update grazing detection
     * @param {Object} player - Player object
     * @param {Array} enemyBullets - Array of enemy bullets
     * @param {Object} gameState - Game state for scoring
     * @param {Object} particleSystem - For visual effects
     * @param {Object} soundSystem - For audio feedback
     */
    update(player, enemyBullets, gameState, particleSystem, soundSystem) {
        if (!player || !player.isAlive || player.invulnerable) return;

        // Decrease graze timer
        if (this.grazeTimer > 0) {
            this.grazeTimer--;
            if (this.grazeTimer <= 0) {
                // Streak ended
                if (this.grazeCount > 5) {
                    this.addStreakEndEffect(player.x, player.y);
                }
                this.grazeCount = 0;
            }
        }

        // Check each bullet for grazing
        const bullets = enemyBullets?.getActiveBullets?.() || enemyBullets?.bullets || enemyBullets || [];

        for (const bullet of bullets) {
            if (!bullet.active) continue;

            // Skip if already grazed this bullet
            const bulletId = `${bullet.x.toFixed(0)}_${bullet.y.toFixed(0)}_${bullet.id || Math.random()}`;
            if (this.grazedBullets.has(bulletId)) continue;

            const dist = calculateDistance(bullet.x, bullet.y, player.x, player.y);

            // Check if in graze zone (not too close, not too far)
            if (dist < this.grazeRadius && dist > this.minGrazeRadius) {
                this.triggerGraze(player, bullet, dist, gameState, particleSystem, soundSystem);
                this.grazedBullets.add(bulletId);
            }
        }

        // Clean up old bullet IDs (prevent memory leak)
        if (this.grazedBullets.size > 500) {
            this.grazedBullets.clear();
        }

        // Update visual effects
        this.updateEffects();
    }

    /**
     * Trigger a graze event
     */
    triggerGraze(player, bullet, distance, gameState, particleSystem, soundSystem) {
        // Increase streak
        this.grazeCount++;
        this.grazeTimer = this.grazeTimeout;
        this.totalGrazes++;
        this.sessionGrazes++;

        // Track max streak
        if (this.grazeCount > this.maxGrazeStreak) {
            this.maxGrazeStreak = this.grazeCount;
        }

        // Calculate points with multiplier
        const multiplier = Math.min(this.grazeCount, this.maxGrazeMultiplier);
        const distanceBonus = 1 + ((this.grazeRadius - distance) / this.grazeRadius);
        const points = Math.floor(this.pointsPerGraze * multiplier * distanceBonus);

        this.totalGrazePoints += points;

        // Add to game score
        if (gameState) {
            gameState.score = (gameState.score || 0) + points;
            gameState.grazeCount = (gameState.grazeCount || 0) + 1;
            gameState.grazeStreak = this.grazeCount;
        }

        // Visual effect
        this.addGrazeEffect(player.x, player.y, bullet.x, bullet.y, multiplier);

        // Particle effects
        if (particleSystem) {
            // Spark effect between player and bullet
            const midX = (player.x + bullet.x) / 2;
            const midY = (player.y + bullet.y) / 2;

            for (let i = 0; i < 3; i++) {
                particleSystem.addParticle?.({
                    x: midX + (Math.random() - 0.5) * 10,
                    y: midY + (Math.random() - 0.5) * 10,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    life: 15 + Math.random() * 10,
                    size: 3 + multiplier,
                    color: this.getGrazeColor(multiplier),
                    glow: true
                });
            }
        }

        // Sound effect (subtle, high-pitched tick)
        if (soundSystem && this.grazeCount % 3 === 1) {
            soundSystem.play?.('hit', 0.2, 1.5 + multiplier * 0.1);
        }
    }

    /**
     * Get color based on graze multiplier
     */
    getGrazeColor(multiplier) {
        const colors = [
            '#ffffff',  // 1x - white
            '#00ffff',  // 2x - cyan
            '#00ff00',  // 3x - green
            '#ffff00',  // 4x - yellow
            '#ff8800',  // 5x - orange
            '#ff00ff',  // 6x - magenta
            '#ff0000',  // 7x - red
            '#ff00ff'   // 8x - magenta (god tier)
        ];
        return colors[Math.min(multiplier - 1, colors.length - 1)] || '#ffffff';
    }

    /**
     * Add a graze visual effect
     */
    addGrazeEffect(playerX, playerY, bulletX, bulletY, multiplier) {
        if (this.grazeEffects.length >= this.maxEffects) {
            this.grazeEffects.shift();
        }

        this.grazeEffects.push({
            playerX, playerY,
            bulletX, bulletY,
            multiplier,
            life: 20,
            maxLife: 20
        });
    }

    /**
     * Add streak end effect
     */
    addStreakEndEffect(x, y) {
        this.grazeEffects.push({
            type: 'streakEnd',
            x, y,
            streak: this.grazeCount,
            life: 60,
            maxLife: 60
        });
    }

    /**
     * Update visual effects
     */
    updateEffects() {
        this.grazeEffects = this.grazeEffects.filter(effect => {
            effect.life--;
            return effect.life > 0;
        });
    }

    /**
     * Draw graze effects
     */
    draw(ctx, player) {
        if (!player) return;

        ctx.save();

        // Draw graze zone indicator (subtle)
        if (this.grazeCount > 0) {
            const alpha = Math.min(0.3, this.grazeCount * 0.05);
            const pulseScale = 1 + Math.sin(Date.now() * 0.01) * 0.1;

            ctx.strokeStyle = this.getGrazeColor(this.grazeCount);
            ctx.lineWidth = 1;
            ctx.globalAlpha = alpha;
            ctx.shadowBlur = 10;
            ctx.shadowColor = ctx.strokeStyle;

            ctx.beginPath();
            ctx.arc(player.x, player.y, this.grazeRadius * pulseScale, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw graze effects
        for (const effect of this.grazeEffects) {
            if (effect.type === 'streakEnd') {
                this.drawStreakEndEffect(ctx, effect);
            } else {
                this.drawGrazeEffect(ctx, effect);
            }
        }

        // Draw graze streak counter (if active)
        if (this.grazeCount > 0 && player.isAlive) {
            this.drawGrazeCounter(ctx, player);
        }

        ctx.restore();
    }

    /**
     * Draw individual graze effect
     */
    drawGrazeEffect(ctx, effect) {
        const alpha = effect.life / effect.maxLife;
        const color = this.getGrazeColor(effect.multiplier);

        ctx.globalAlpha = alpha * 0.6;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;

        // Draw line from player to bullet
        ctx.beginPath();
        ctx.moveTo(effect.playerX, effect.playerY);
        ctx.lineTo(effect.bulletX, effect.bulletY);
        ctx.stroke();

        // Draw spark at midpoint
        const midX = (effect.playerX + effect.bulletX) / 2;
        const midY = (effect.playerY + effect.bulletY) / 2;
        const sparkSize = 5 * alpha * effect.multiplier;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(midX, midY, sparkSize, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw streak end effect
     */
    drawStreakEndEffect(ctx, effect) {
        const alpha = effect.life / effect.maxLife;
        const scale = 1 + (1 - alpha) * 0.5;

        ctx.globalAlpha = alpha;
        ctx.font = `bold ${20 * scale}px "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffff00';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffff00';

        ctx.fillText(`${effect.streak}x GRAZE!`, effect.x, effect.y - 40 - (1 - alpha) * 30);
    }

    /**
     * Draw graze counter near player
     */
    drawGrazeCounter(ctx, player) {
        const x = player.x + 30;
        const y = player.y - 30;
        const color = this.getGrazeColor(Math.min(this.grazeCount, this.maxGrazeMultiplier));

        // Pulsing effect
        const pulse = 1 + Math.sin(Date.now() * 0.02) * 0.1;
        const timerRatio = this.grazeTimer / this.grazeTimeout;

        ctx.globalAlpha = 0.8;
        ctx.font = `bold ${14 * pulse}px "Courier New", monospace`;
        ctx.textAlign = 'left';
        ctx.fillStyle = color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;

        // Graze count
        ctx.fillText(`GRAZE x${this.grazeCount}`, x, y);

        // Timer bar
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y + 5, 60, 4);

        ctx.fillStyle = color;
        ctx.fillRect(x, y + 5, 60 * timerRatio, 4);
    }

    /**
     * Reset graze system
     */
    reset() {
        this.grazeCount = 0;
        this.grazeTimer = 0;
        this.grazedBullets.clear();
        this.grazeEffects = [];
        this.sessionGrazes = 0;
    }

    /**
     * Get graze stats
     */
    getStats() {
        return {
            currentStreak: this.grazeCount,
            maxStreak: this.maxGrazeStreak,
            totalGrazes: this.totalGrazes,
            sessionGrazes: this.sessionGrazes,
            totalPoints: this.totalGrazePoints
        };
    }
}
