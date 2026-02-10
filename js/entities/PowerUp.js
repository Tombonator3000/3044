// ============================================
// GEOMETRY 3044 — POWER-UP CLASS
// ============================================

export class PowerUp {
    constructor(x, y, type = null) {
        this.x = x;
        this.y = y;
        this.size = 15;
        this.speed = 1.5;
        this.active = true;
        this.rotation = 0;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.lifetime = 600;  // 10 seconds at 60fps
        this.collected = false;

        // Assign random type if not specified
        this.type = type || this.getRandomType();
        this.setupType();
    }

    getRandomType() {
        const types = [
            // Common (60% chance)
            'weapon', 'weapon', 'weapon',
            'shield', 'shield',
            'bomb', 'bomb',
            'points', 'points', 'points',
            'speed', 'speed',

            // Uncommon (25% chance)
            'laser', 'spread', 'homing',
            'magnet', 'autofire', 'life',

            // Rare (12% chance)
            'pierce', 'bounce', 'chain',
            'freeze', 'mirror', 'vortex',

            // Epic (3% chance)
            'nova', 'omega', 'ghost',
            'quantum', 'plasma', 'matrix',

            // Legendary (<1% chance)
            'fever', 'infinity', 'god'
        ];

        // Weighted random (balanced for difficulty - rarer drops)
        const roll = Math.random();
        if (roll < 0.003) {
            // Legendary (0.3% - reduced from 1%)
            return ['fever', 'infinity', 'god'][Math.floor(Math.random() * 3)];
        } else if (roll < 0.018) {
            // Epic (1.5% - reduced from 3%)
            return ['nova', 'omega', 'ghost', 'quantum', 'plasma', 'matrix'][Math.floor(Math.random() * 6)];
        } else if (roll < 0.098) {
            // Rare (8% - reduced from 12%)
            return ['pierce', 'bounce', 'chain', 'freeze', 'mirror', 'vortex'][Math.floor(Math.random() * 6)];
        } else if (roll < 0.318) {
            // Uncommon (22% - reduced from 25%)
            return ['laser', 'spread', 'homing', 'magnet', 'autofire', 'life'][Math.floor(Math.random() * 6)];
        } else {
            // Common (68.2% - increased from 59%)
            return ['weapon', 'shield', 'bomb', 'points', 'speed'][Math.floor(Math.random() * 5)];
        }
    }

    setupType() {
        const typeData = {
            // Common
            weapon: { color: '#00ff00', symbol: 'W', name: 'WEAPON UP', tier: 1 },
            shield: { color: '#00ffff', symbol: 'S', name: 'SHIELD', tier: 1 },
            bomb: { color: '#ff8800', symbol: 'B', name: 'BOMB', tier: 1 },
            points: { color: '#ffff00', symbol: '$', name: 'BONUS', tier: 1 },
            speed: { color: '#ff00ff', symbol: '>', name: 'SPEED UP', tier: 1 },

            // Uncommon
            laser: { color: '#ff0000', symbol: 'L', name: 'LASER', tier: 2 },
            spread: { color: '#ffaa00', symbol: '*', name: 'SPREAD', tier: 2 },
            homing: { color: '#00ffaa', symbol: 'H', name: 'HOMING', tier: 2 },
            magnet: { color: '#ff00aa', symbol: 'M', name: 'MAGNET', tier: 2 },
            autofire: { color: '#aaffaa', symbol: 'A', name: 'AUTO FIRE', tier: 2 },
            life: { color: '#ff6666', symbol: '♥', name: 'EXTRA LIFE', tier: 2 },

            // Rare
            pierce: { color: '#00ff88', symbol: '→', name: 'PIERCE', tier: 3 },
            bounce: { color: '#88ff00', symbol: '◊', name: 'BOUNCE', tier: 3 },
            chain: { color: '#8800ff', symbol: '⚡', name: 'CHAIN', tier: 3 },
            freeze: { color: '#88ffff', symbol: '❄', name: 'FREEZE', tier: 3 },
            mirror: { color: '#aaaaff', symbol: '◑', name: 'MIRROR', tier: 3 },
            vortex: { color: '#80ff80', symbol: '◉', name: 'VORTEX', tier: 3 },

            // Epic
            nova: { color: '#ffff88', symbol: '✦', name: 'NOVA', tier: 4 },
            omega: { color: '#ff4444', symbol: 'Ω', name: 'OMEGA', tier: 4 },
            ghost: { color: '#aaaaff', symbol: '👻', name: 'GHOST', tier: 4 },
            quantum: { color: '#aa00ff', symbol: 'Q', name: 'QUANTUM', tier: 4 },
            plasma: { color: '#ff00ff', symbol: 'P', name: 'PLASMA', tier: 4 },
            matrix: { color: '#00ff00', symbol: '▣', name: 'MATRIX', tier: 4 },

            // Legendary
            fever: { color: '#ff0080', symbol: '★', name: 'FEVER MODE', tier: 5 },
            infinity: { color: '#ffd700', symbol: '∞', name: 'INFINITY', tier: 5 },
            god: { color: '#ffffff', symbol: '✧', name: 'GOD MODE', tier: 5 }
        };

        const data = typeData[this.type] || typeData.points;
        this.color = data.color;
        this.symbol = data.symbol;
        this.name = data.name;
        this.tier = data.tier;

        // Size based on tier
        this.size = 12 + this.tier * 3;
    }

    update(canvas) {
        if (!this.active) return;

        // Float down slowly
        this.y += this.speed;

        // Slight horizontal wobble
        this.x += Math.sin(Date.now() * 0.003 + this.pulsePhase) * 0.3;

        // Rotate
        this.rotation += 0.02;

        // Decrease lifetime
        this.lifetime--;

        // Deactivate if off screen or expired
        if (this.y > canvas.logicalHeight + 50 || this.lifetime <= 0) {
            this.active = false;
        }
    }

    collect(player, gameState, soundSystem, particleSystem) {
        if (!this.active || this.collected) return false;

        this.collected = true;
        this.active = false;

        // Apply effect based on type
        this.applyEffect(player, gameState);

        // Sound
        if (soundSystem?.playPowerUp) {
            soundSystem.playPowerUp(this.tier);
        } else if (soundSystem?.play) {
            soundSystem.play('powerUp');
        }

        // Particles
        if (particleSystem?.addPowerUpCollect) {
            particleSystem.addPowerUpCollect(this.x, this.y, this.color);
        } else if (particleSystem?.powerUpCollect) {
            particleSystem.powerUpCollect(this.x, this.y, this.color);
        }

        // Show 80s slang phrase for power-up collection
        if (gameState?.radicalSlang?.showPowerUpPhrase) {
            gameState.radicalSlang.showPowerUpPhrase(this.x, this.y);
        }

        // Track session stats
        if (gameState?.sessionStats) {
            gameState.sessionStats.powerUpsCollected = (gameState.sessionStats.powerUpsCollected || 0) + 1;
        }

        return true;
    }

    applyEffect(player, gameState) {
        if (!player) return;

        switch (this.type) {
            // Common
            case 'weapon':
                player.weaponLevel = Math.min((player.weaponLevel || 1) + 1, 5);
                break;
            case 'shield':
                // Daily Challenge: No shields modifier - skip shield power-ups
                if (gameState && gameState.noShields) {
                    // Convert to points bonus instead
                    if (gameState) gameState.score += 500 * (gameState.wave || 1);
                    break;
                }
                // Shield gives +1 point, max 3 shield points total (reduced from +3 with no cap)
                player.shield = Math.min((player.shield || 0) + 1, 3);
                player.shieldActive = true;
                break;
            case 'bomb':
                if (gameState) gameState.bombs = Math.min((gameState.bombs || 0) + 1, 9);
                break;
            case 'points':
                if (gameState) gameState.score += 1000 * (gameState.wave || 1);
                break;
            case 'speed':
                player.speed = Math.min((player.speed || 5.5) + 0.5, 8);
                player.schedulePowerUpTimer?.('speed', 600, () => { player.speed = Math.max(player.speed - 0.5, 5.5); });
                break;

            // Uncommon (now with 45 second duration)
            case 'laser':
                player.hasLaser = true;
                player.laserPower = Math.min((player.laserPower || 0) + 1, 5);
                player.schedulePowerUpTimer?.('laser', 2700, () => {
                    player.laserPower = Math.max(1, player.laserPower - 1);
                    if (player.laserPower <= 1) player.hasLaser = false;
                });
                break;
            case 'spread':
                player.hasSpread = true;
                player.spreadCount = Math.min((player.spreadCount || 3) + 2, 9);
                player.schedulePowerUpTimer?.('spread', 2700, () => {
                    player.spreadCount = Math.max(3, player.spreadCount - 2);
                    if (player.spreadCount <= 3) player.hasSpread = false;
                });
                break;
            case 'homing':
                player.hasHoming = true;
                player.homingStrength = Math.min((player.homingStrength || 0) + 0.02, 0.15);
                player.schedulePowerUpTimer?.('homing', 2700, () => {
                    player.homingStrength = Math.max(0, player.homingStrength - 0.02);
                    if (player.homingStrength <= 0) player.hasHoming = false;
                });
                break;
            case 'magnet':
                player.magnetRange = Math.min((player.magnetRange || 0) + 100, 400);
                player.schedulePowerUpTimer?.('magnet', 2700, () => {
                    player.magnetRange = Math.max(0, player.magnetRange - 100);
                });
                break;
            case 'autofire':
                player.autoFire = true;
                player.schedulePowerUpTimer?.('autofire', 900, () => { player.autoFire = false; });
                break;
            case 'life':
                if (gameState) gameState.lives = Math.min((gameState.lives || 0) + 1, 9);
                break;

            // Rare (now with 45 second duration)
            case 'pierce':
                player.hasPierce = true;
                player.pierceCount = Math.min((player.pierceCount || 0) + 1, 5);
                player.schedulePowerUpTimer?.('pierce', 2700, () => {
                    player.pierceCount = Math.max(0, player.pierceCount - 1);
                    if (player.pierceCount <= 0) player.hasPierce = false;
                });
                break;
            case 'bounce':
                player.hasBounce = true;
                player.bounceCount = Math.min((player.bounceCount || 0) + 1, 5);
                player.schedulePowerUpTimer?.('bounce', 2700, () => {
                    player.bounceCount = Math.max(0, player.bounceCount - 1);
                    if (player.bounceCount <= 0) player.hasBounce = false;
                });
                break;
            case 'chain':
                player.hasChain = true;
                player.chainRange = Math.min((player.chainRange || 0) + 30, 200);
                player.schedulePowerUpTimer?.('chain', 2700, () => {
                    player.chainRange = Math.max(0, player.chainRange - 30);
                    if (player.chainRange <= 0) player.hasChain = false;
                });
                break;
            case 'freeze':
                player.freezePower = 300;  // 5 seconds
                if (gameState?.enemies) {
                    gameState.enemies.forEach(e => {
                        e.frozen = 300;
                        e.originalSpeed = e.speed;
                        e.speed = 0;
                    });
                }
                break;
            case 'mirror':
                player.mirrorShip = 600;  // 10 seconds
                break;
            case 'vortex':
                player.vortexActive = 480;  // 8 seconds
                player.vortexPower = Math.min((player.vortexPower || 0) + 1, 5);
                break;

            // Epic
            case 'nova':
                player.novaReady = true;
                player.novaPower = Math.min((player.novaPower || 0) + 1, 5);
                player.triggerEnhancedNova?.();
                break;
            case 'omega':
                player.omegaMode = 600;  // 10 seconds
                break;
            case 'ghost':
                player.ghostMode = 480;  // 8 seconds
                player.invulnerable = true;
                break;
            case 'quantum':
                player.quantumMode = 600;
                player.quantumShots = Math.min((player.quantumShots || 1) + 1, 7);
                break;
            case 'plasma':
                player.plasmaMode = 480;
                break;
            case 'matrix':
                player.matrixMode = 600;
                // Slow down time for enemies
                if (gameState?.enemies) {
                    gameState.enemies.forEach(e => {
                        e.speed *= 0.5;
                    });
                }
                break;

            // Legendary
            case 'fever':
                player.feverMode = 900;  // 15 seconds
                player.invulnerable = true;
                // Make enemies flee and worth double
                if (gameState?.enemies) {
                    gameState.enemies.forEach(e => {
                        e.originalBehavior = e.behavior;
                        e.behavior = 'flee';
                        e.points *= 2;
                        e.color = '#ffff00';
                    });
                }
                break;
            case 'infinity':
                player.infinityMode = 600;
                player.infinitePower = true;
                break;
            case 'god':
                player.godMode = 900;  // 15 seconds
                player.invulnerable = true;
                player.infinitePower = true;
                player.speed = 8;
                break;
        }

        // Register with PowerUpManager for combos
        if (gameState?.powerUpManager) {
            gameState.powerUpManager.registerPowerUp(this.type, this.tier);
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Pulsing glow effect
        const pulse = 0.7 + Math.sin(Date.now() * 0.005 + this.pulsePhase) * 0.3;
        const glowSize = this.size * (1 + (this.tier * 0.1));

        // Outer glow
        ctx.shadowBlur = 20 * pulse * this.tier;
        ctx.shadowColor = this.color;

        // Background circle
        ctx.fillStyle = this.color + '44';
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Main shape based on tier
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.fillStyle = this.color;

        if (this.tier >= 4) {
            // Epic/Legendary: Star shape
            this.drawStar(ctx, 0, 0, this.size * 0.5, this.size, 6);
        } else if (this.tier >= 3) {
            // Rare: Diamond
            ctx.beginPath();
            ctx.moveTo(0, -this.size);
            ctx.lineTo(this.size * 0.7, 0);
            ctx.lineTo(0, this.size);
            ctx.lineTo(-this.size * 0.7, 0);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
        } else {
            // Common/Uncommon: Circle
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.7, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Symbol
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${this.size}px "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.symbol, 0, 0);

        // Tier indicator (small dots)
        if (this.tier > 1) {
            ctx.fillStyle = this.color;
            for (let i = 0; i < this.tier; i++) {
                const angle = (Math.PI * 2 * i) / this.tier - Math.PI / 2;
                const dotX = Math.cos(angle) * (this.size + 8);
                const dotY = Math.sin(angle) * (this.size + 8);
                ctx.beginPath();
                ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Blinking warning when about to expire
        if (this.lifetime < 120 && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 1.2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawStar(ctx, cx, cy, innerRadius, outerRadius, points) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI * i) / points - Math.PI / 2;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}
