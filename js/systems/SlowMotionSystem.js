/**
 * Geometry 3044 - Slow Motion System
 * Triggers cinematic slow-motion for clutch moments
 * - Near death experiences
 * - Wave completions
 * - Boss kills
 */

export class SlowMotionSystem {
    constructor() {
        // Slow motion configuration
        this.slowFactor = 0.3;          // How slow (0.3 = 30% speed)
        this.duration = 0;               // Current slow-mo duration
        this.maxDuration = 30;           // Max frames of slow-mo
        this.cooldown = 0;               // Cooldown between slow-mo triggers
        this.cooldownTime = 120;         // Frames between slow-mo triggers

        // Current state
        this.isActive = false;
        this.currentFactor = 1;
        this.targetFactor = 1;
        this.transitionSpeed = 0.1;

        // Trigger types with different settings
        this.triggers = {
            nearDeath: { factor: 0.2, duration: 45, color: '#ff0000' },
            waveComplete: { factor: 0.4, duration: 30, color: '#00ffff' },
            bossKill: { factor: 0.15, duration: 60, color: '#ff00ff' },
            pointBlankKill: { factor: 0.5, duration: 15, color: '#ffff00' }
        };

        // Visual effects
        this.currentTrigger = null;
        this.visualIntensity = 0;

        // Stats
        this.totalSlowMoTime = 0;
        this.triggerCount = 0;
    }

    /**
     * Trigger slow motion
     * @param {string} type - Trigger type (nearDeath, waveComplete, bossKill, pointBlankKill)
     */
    trigger(type) {
        if (this.cooldown > 0) return;

        const config = this.triggers[type] || this.triggers.nearDeath;

        this.isActive = true;
        this.targetFactor = config.factor;
        this.duration = config.duration;
        this.cooldown = this.cooldownTime;
        this.currentTrigger = { type, ...config };
        this.visualIntensity = 1;
        this.triggerCount++;

        console.log(`🎬 Slow-mo triggered: ${type}`);
    }

    /**
     * Check for near-death slow motion trigger
     * @param {Object} player - Player object
     * @param {Array} enemyBullets - Enemy bullets to check
     * @returns {boolean} Whether near-death was triggered
     */
    checkNearDeath(player, enemyBullets) {
        if (!player || !player.isAlive || player.invulnerable) return false;
        if (this.cooldown > 0 || this.isActive) return false;

        const bullets = enemyBullets?.getActiveBullets?.() || enemyBullets?.bullets || enemyBullets || [];
        // Use squared distances to avoid sqrt - optimization
        const dangerRadiusSq = 25 * 25; // 625
        const playerHitboxSq = 10 * 10; // 100

        for (const bullet of bullets) {
            if (!bullet.active) continue;

            const dx = bullet.x - player.x;
            const dy = bullet.y - player.y;
            const distSq = dx * dx + dy * dy;

            // Check if bullet is extremely close and heading toward player (using squared distances)
            if (distSq < dangerRadiusSq && distSq > playerHitboxSq) {
                // Check bullet direction
                const bulletAngle = Math.atan2(bullet.vy || 0, bullet.vx || 0);
                const toPlayerAngle = Math.atan2(dy, dx);
                const angleDiff = Math.abs(bulletAngle - toPlayerAngle);

                // Bullet is heading roughly toward player
                if (angleDiff > Math.PI / 2 && angleDiff < Math.PI * 1.5) {
                    this.trigger('nearDeath');
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Update slow motion state
     * @returns {number} Current time scale factor (0-1)
     */
    update() {
        // Update cooldown
        if (this.cooldown > 0) {
            this.cooldown--;
        }

        // Update slow motion
        if (this.isActive) {
            this.duration--;
            this.totalSlowMoTime++;

            // Smoothly transition to target
            this.currentFactor += (this.targetFactor - this.currentFactor) * this.transitionSpeed;

            if (this.duration <= 0) {
                this.isActive = false;
                this.targetFactor = 1;
                this.currentTrigger = null;
            }
        } else {
            // Smoothly return to normal
            this.currentFactor += (1 - this.currentFactor) * this.transitionSpeed;
            if (Math.abs(this.currentFactor - 1) < 0.01) {
                this.currentFactor = 1;
            }
        }

        // Update visual intensity
        if (this.isActive) {
            this.visualIntensity = Math.min(1, this.visualIntensity + 0.1);
        } else {
            this.visualIntensity = Math.max(0, this.visualIntensity - 0.05);
        }

        return this.currentFactor;
    }

    /**
     * Get adjusted delta time
     * @param {number} deltaTime - Original delta time
     * @returns {number} Adjusted delta time
     */
    adjustDeltaTime(deltaTime) {
        return deltaTime * this.currentFactor;
    }

    /**
     * Draw slow motion visual effects
     */
    draw(ctx, canvas) {
        if (this.visualIntensity <= 0) return;

        ctx.save();

        const alpha = this.visualIntensity * 0.3;
        const color = this.currentTrigger?.color || '#ffffff';

        // Vignette effect
        const gradient = ctx.createRadialGradient(
            canvas.logicalWidth / 2, canvas.logicalHeight / 2, 0,
            canvas.logicalWidth / 2, canvas.logicalHeight / 2, Math.max(canvas.logicalWidth, canvas.logicalHeight) / 2
        );

        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(0, 0, 0, ${alpha * 0.8})`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.logicalWidth, canvas.logicalHeight);

        // Color tint at edges
        const colorAlpha = Math.floor(alpha * 40).toString(16).padStart(2, '0');
        const gradientColor = ctx.createRadialGradient(
            canvas.logicalWidth / 2, canvas.logicalHeight / 2, canvas.logicalWidth * 0.3,
            canvas.logicalWidth / 2, canvas.logicalHeight / 2, Math.max(canvas.logicalWidth, canvas.logicalHeight) / 2
        );

        gradientColor.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradientColor.addColorStop(1, color + colorAlpha);

        ctx.fillStyle = gradientColor;
        ctx.fillRect(0, 0, canvas.logicalWidth, canvas.logicalHeight);

        // Slow-mo text indicator
        if (this.isActive && this.currentTrigger) {
            const textAlpha = this.visualIntensity * 0.8;
            const textScale = 1 + (1 - this.currentFactor) * 0.3;

            ctx.globalAlpha = textAlpha;
            ctx.font = `bold ${24 * textScale}px "Courier New", monospace`;
            ctx.textAlign = 'center';
            ctx.fillStyle = color;
            ctx.shadowBlur = 30;
            ctx.shadowColor = color;

            let text = '';
            switch (this.currentTrigger.type) {
                case 'nearDeath': text = 'CLOSE CALL!'; break;
                case 'waveComplete': text = 'WAVE CLEAR!'; break;
                case 'bossKill': text = 'BOSS DESTROYED!'; break;
                case 'pointBlankKill': text = 'POINT BLANK!'; break;
            }

            if (text) {
                ctx.fillText(text, canvas.logicalWidth / 2, canvas.logicalHeight / 2);
            }
        }

        // Time scale indicator
        if (this.currentFactor < 0.9) {
            ctx.globalAlpha = 0.6;
            ctx.font = 'bold 14px "Courier New", monospace';
            ctx.textAlign = 'right';
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#ffffff';
            ctx.fillText(`TIME: ${Math.floor(this.currentFactor * 100)}%`, canvas.logicalWidth - 20, 30);
        }

        ctx.restore();
    }

    /**
     * Check if slow motion is active
     */
    isSlowMotionActive() {
        return this.isActive;
    }

    /**
     * Get current time factor
     */
    getTimeFactor() {
        return this.currentFactor;
    }

    /**
     * Reset system
     */
    reset() {
        this.isActive = false;
        this.duration = 0;
        this.cooldown = 0;
        this.currentFactor = 1;
        this.targetFactor = 1;
        this.currentTrigger = null;
        this.visualIntensity = 0;
    }

    /**
     * Get stats
     */
    getStats() {
        return {
            totalSlowMoTime: this.totalSlowMoTime,
            triggerCount: this.triggerCount,
            isActive: this.isActive,
            currentFactor: this.currentFactor
        };
    }
}
