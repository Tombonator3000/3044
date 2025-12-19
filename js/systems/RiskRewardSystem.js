/**
 * Geometry 3044 - Risk/Reward System
 * Rewards aggressive play with score multipliers
 * The closer you are to enemies when killing them, the higher the multiplier
 */

export class RiskRewardSystem {
    constructor() {
        // Distance thresholds for multipliers
        this.thresholds = [
            { distance: 50,  multiplier: 8, name: 'POINT BLANK', color: '#ff0000' },
            { distance: 100, multiplier: 4, name: 'DANGER ZONE', color: '#ff8800' },
            { distance: 200, multiplier: 2, name: 'CLOSE CALL', color: '#ffff00' },
            { distance: 400, multiplier: 1.5, name: 'RISKY', color: '#00ff00' },
            { distance: Infinity, multiplier: 1, name: '', color: '#ffffff' }
        ];

        // Visual effects
        this.killEffects = [];
        this.maxEffects = 15;

        // Stats
        this.pointBlankKills = 0;
        this.dangerZoneKills = 0;
        this.totalBonusPoints = 0;
    }

    /**
     * Calculate score multiplier based on distance
     * @param {number} distance - Distance from player to killed enemy
     * @returns {Object} Multiplier info {multiplier, name, color}
     */
    getMultiplier(distance) {
        for (const threshold of this.thresholds) {
            if (distance <= threshold.distance) {
                return threshold;
            }
        }
        return this.thresholds[this.thresholds.length - 1];
    }

    /**
     * Calculate and apply risk/reward bonus for an enemy kill
     * @param {Object} player - Player object
     * @param {Object} enemy - Killed enemy
     * @param {number} baseScore - Base score for the kill
     * @param {Object} gameState - Game state for scoring
     * @param {Object} particleSystem - For visual effects
     * @param {Object} soundSystem - For audio feedback
     * @returns {number} Final score after multiplier
     */
    processKill(player, enemy, baseScore, gameState, particleSystem, soundSystem) {
        if (!player || !enemy) return baseScore;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const multiplierInfo = this.getMultiplier(distance);
        const finalScore = Math.floor(baseScore * multiplierInfo.multiplier);
        const bonusPoints = finalScore - baseScore;

        // Track stats
        if (multiplierInfo.multiplier >= 8) {
            this.pointBlankKills++;
        } else if (multiplierInfo.multiplier >= 4) {
            this.dangerZoneKills++;
        }
        this.totalBonusPoints += bonusPoints;

        // Add bonus to game state
        if (gameState) {
            gameState.riskRewardBonus = (gameState.riskRewardBonus || 0) + bonusPoints;
        }

        // Show visual effect only for significant multipliers
        if (multiplierInfo.multiplier > 1) {
            this.addKillEffect(enemy.x, enemy.y, multiplierInfo);

            // Extra particles for high multipliers
            if (particleSystem && multiplierInfo.multiplier >= 4) {
                this.addBonusParticles(particleSystem, enemy.x, enemy.y, multiplierInfo);
            }

            // Sound feedback for point blank kills
            if (soundSystem && multiplierInfo.multiplier >= 8) {
                soundSystem.play?.('combo', 0.8, 0.8);
            }
        }

        return finalScore;
    }

    /**
     * Add visual effect for kill
     */
    addKillEffect(x, y, multiplierInfo) {
        if (this.killEffects.length >= this.maxEffects) {
            this.killEffects.shift();
        }

        this.killEffects.push({
            x, y,
            multiplier: multiplierInfo.multiplier,
            name: multiplierInfo.name,
            color: multiplierInfo.color,
            life: 45,
            maxLife: 45,
            scale: 1,
            vy: -2
        });
    }

    /**
     * Add bonus particles for high multiplier kills
     */
    addBonusParticles(particleSystem, x, y, multiplierInfo) {
        const count = multiplierInfo.multiplier >= 8 ? 20 : 10;

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 3 + Math.random() * 3;

            particleSystem.addParticle?.({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 30 + Math.random() * 20,
                size: 4 + multiplierInfo.multiplier,
                color: multiplierInfo.color,
                glow: true
            });
        }
    }

    /**
     * Update visual effects
     */
    update() {
        for (const effect of this.killEffects) {
            effect.life--;
            effect.y += effect.vy;
            effect.vy *= 0.95;
            effect.scale = 1 + (1 - effect.life / effect.maxLife) * 0.3;
        }

        this.killEffects = this.killEffects.filter(e => e.life > 0);
    }

    /**
     * Draw risk/reward effects
     */
    draw(ctx) {
        ctx.save();

        for (const effect of this.killEffects) {
            const alpha = effect.life / effect.maxLife;
            const scale = effect.scale;

            ctx.globalAlpha = alpha;
            ctx.font = `bold ${16 * scale}px "Courier New", monospace`;
            ctx.textAlign = 'center';
            ctx.fillStyle = effect.color;
            ctx.shadowBlur = 20;
            ctx.shadowColor = effect.color;

            // Draw multiplier text
            const text = effect.multiplier >= 8
                ? `x${effect.multiplier} ${effect.name}!`
                : `x${effect.multiplier}`;

            ctx.fillText(text, effect.x, effect.y);

            // Extra glow for point blank
            if (effect.multiplier >= 8) {
                ctx.globalAlpha = alpha * 0.3;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y + 10, 30 * (1 - alpha) + 20, 0, Math.PI * 2);
                ctx.fillStyle = effect.color;
                ctx.fill();
            }
        }

        ctx.restore();
    }

    /**
     * Draw danger zone indicator around player
     */
    drawPlayerZones(ctx, player) {
        if (!player || !player.isAlive) return;

        ctx.save();
        ctx.globalAlpha = 0.1;

        // Draw zone rings (subtle)
        for (let i = 0; i < this.thresholds.length - 1; i++) {
            const threshold = this.thresholds[i];
            const pulseScale = 1 + Math.sin(Date.now() * 0.003 + i) * 0.05;

            ctx.strokeStyle = threshold.color;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 10]);

            ctx.beginPath();
            ctx.arc(player.x, player.y, threshold.distance * pulseScale, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * Reset system
     */
    reset() {
        this.killEffects = [];
    }

    /**
     * Get stats
     */
    getStats() {
        return {
            pointBlankKills: this.pointBlankKills,
            dangerZoneKills: this.dangerZoneKills,
            totalBonusPoints: this.totalBonusPoints
        };
    }
}
