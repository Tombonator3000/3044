// ============================================
// GEOMETRY 3044 — POWER-UP MANAGER
// ============================================

export class PowerUpManager {
    constructor(player) {
        this.player = player;
        this.collectedPowerUps = [];
        this.comboEffects = [];
        this.comboTimer = 0;
        this.comboTimeout = 300;  // 5 seconds to collect another for combo
        this.lastCollectTime = 0;

        // Combo recipes
        this.comboRecipes = [
            {
                name: 'PULSE CANNON',
                requires: ['laser', 'speed'],
                color: '#ff0088',
                description: 'Rapid fire lasers!'
            },
            {
                name: 'DEATH BLOSSOM',
                requires: ['spread', 'homing'],
                color: '#ff8800',
                description: 'Homing spread shots!'
            },
            {
                name: 'CHAIN LIGHTNING',
                requires: ['chain', 'pierce'],
                color: '#88ffff',
                description: 'Piercing chain bolts!'
            },
            {
                name: 'BLACK HOLE',
                requires: ['vortex', 'nova'],
                color: '#8800ff',
                description: 'Gravity well of doom!'
            },
            {
                name: 'TIME WARP',
                requires: ['matrix', 'ghost'],
                color: '#00ff88',
                description: 'Phase through time!'
            },
            {
                name: 'ARMAGEDDON',
                requires: ['omega', 'infinity'],
                color: '#ff0000',
                description: 'Total destruction!'
            },
            {
                name: 'ASCENSION',
                requires: ['god', 'fever'],
                color: '#ffd700',
                description: 'Ultimate power!'
            }
        ];

        // Stats tracking
        this.totalCollected = 0;
        this.powerUpCounts = {};
    }

    registerPowerUp(type, tier) {
        const now = Date.now();

        // Track power-up
        this.collectedPowerUps.push({
            type: type,
            tier: tier,
            time: now
        });

        // Update stats
        this.totalCollected++;
        this.powerUpCounts[type] = (this.powerUpCounts[type] || 0) + 1;

        // Check for combos
        this.checkCombos();

        // Reset combo timer
        this.comboTimer = this.comboTimeout;
        this.lastCollectTime = now;

        // Clean old power-ups (older than combo timeout)
        const cutoff = now - (this.comboTimeout * 16.67);  // Convert frames to ms
        this.collectedPowerUps = this.collectedPowerUps.filter(p => p.time > cutoff);
    }

    checkCombos() {
        const recentTypes = this.collectedPowerUps.map(p => p.type);

        for (const recipe of this.comboRecipes) {
            // Check if we have all required types
            const hasAll = recipe.requires.every(req => recentTypes.includes(req));

            // Check if combo is not already active
            const alreadyActive = this.comboEffects.some(c => c.name === recipe.name);

            if (hasAll && !alreadyActive) {
                this.activateCombo(recipe);
            }
        }
    }

    activateCombo(recipe) {
        console.log(`🔥 COMBO ACTIVATED: ${recipe.name}`);

        this.comboEffects.push({
            name: recipe.name,
            color: recipe.color,
            description: recipe.description,
            duration: 600,  // 10 seconds
            maxDuration: 600,
            flashTimer: 60
        });

        // Apply combo effect to player
        this.applyComboEffect(recipe.name);
    }

    applyComboEffect(comboName) {
        if (!this.player) return;

        switch (comboName) {
            case 'PULSE CANNON':
                // Handled in player.shoot()
                this.player.pulseCannonActive = true;
                break;
            case 'DEATH BLOSSOM':
                this.player.hasSpread = true;
                this.player.hasHoming = true;
                this.player.spreadCount = 7;
                this.player.homingStrength = 0.1;
                break;
            case 'CHAIN LIGHTNING':
                this.player.hasChain = true;
                this.player.hasPierce = true;
                this.player.chainRange = 150;
                this.player.pierceCount = 3;
                break;
            case 'BLACK HOLE':
                this.player.vortexActive = 600;
                this.player.vortexPower = 5;
                this.player.novaReady = true;
                this.player.novaPower = 3;
                break;
            case 'TIME WARP':
                this.player.matrixMode = 600;
                this.player.ghostMode = 600;
                this.player.invulnerable = true;
                break;
            case 'ARMAGEDDON':
                this.player.omegaMode = 600;
                this.player.infinityMode = 600;
                this.player.infinitePower = true;
                break;
            case 'ASCENSION':
                this.player.godMode = 900;
                this.player.feverMode = 900;
                this.player.invulnerable = true;
                this.player.speed = 8;
                break;
        }
    }

    update() {
        // Update combo timer
        if (this.comboTimer > 0) {
            this.comboTimer--;
        } else {
            // Clear recent power-ups when combo window expires
            if (this.collectedPowerUps.length > 0) {
                this.collectedPowerUps = [];
            }
        }

        // Update active combo effects
        this.comboEffects = this.comboEffects.filter(combo => {
            combo.duration--;
            if (combo.flashTimer > 0) combo.flashTimer--;
            return combo.duration > 0;
        });

        // Clean up expired combo effects on player
        if (this.player) {
            for (const recipe of this.comboRecipes) {
                const isActive = this.comboEffects.some(c => c.name === recipe.name);
                if (!isActive) {
                    this.cleanupComboEffect(recipe.name);
                }
            }
        }
    }

    cleanupComboEffect(comboName) {
        if (!this.player) return;

        // Reset combo-specific flags when combo expires
        switch (comboName) {
            case 'PULSE CANNON':
                this.player.pulseCannonActive = false;
                break;
            // Other combos are handled by their individual timers
        }
    }

    drawUI(ctx) {
        if (!ctx) return;

        const canvas = ctx.canvas;

        // Draw active combos
        let y = 150;
        for (const combo of this.comboEffects) {
            const alpha = combo.flashTimer > 0 ?
                (0.5 + Math.sin(Date.now() * 0.02) * 0.5) :
                Math.min(1, combo.duration / 60);

            ctx.save();
            ctx.globalAlpha = alpha;

            // Background
            ctx.fillStyle = combo.color + '44';
            ctx.fillRect(10, y, 180, 35);

            // Border
            ctx.strokeStyle = combo.color;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = combo.color;
            ctx.strokeRect(10, y, 180, 35);

            // Name
            ctx.fillStyle = combo.color;
            ctx.font = 'bold 12px "Courier New", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(combo.name, 20, y + 15);

            // Duration bar
            const barWidth = 160 * (combo.duration / combo.maxDuration);
            ctx.fillStyle = combo.color;
            ctx.fillRect(20, y + 22, barWidth, 5);

            ctx.restore();

            y += 45;
        }

        // Draw combo timer (when collecting)
        if (this.comboTimer > 0 && this.collectedPowerUps.length > 0) {
            const timerWidth = 100 * (this.comboTimer / this.comboTimeout);

            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(canvas.logicalWidth / 2 - 50, 10, timerWidth, 5);
            ctx.restore();
        }
    }

    getStats() {
        return {
            total: this.totalCollected,
            counts: { ...this.powerUpCounts },
            activeCombos: this.comboEffects.map(c => c.name)
        };
    }

    // Check if a specific combo is active
    isComboActive(comboName) {
        return this.comboEffects.some(c => c.name === comboName);
    }

    // Get remaining duration for a combo
    getComboDuration(comboName) {
        const combo = this.comboEffects.find(c => c.name === comboName);
        return combo ? combo.duration : 0;
    }

    // Reset all combos and power-ups
    reset() {
        this.collectedPowerUps = [];
        this.comboEffects = [];
        this.comboTimer = 0;
        this.totalCollected = 0;
        this.powerUpCounts = {};
    }
}
