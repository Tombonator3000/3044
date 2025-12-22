// ============================================
// GEOMETRY 3044 — PLAYER CLASS (COMPLETE)
// ============================================

import { config, getCurrentTheme } from '../config.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 5.5;
        this.baseSize = 20;
        this.size = 20;
        this.sizeMultiplier = 1;
        this.color = config.colors.player;
        this.weaponLevel = 1;
        this.fireRate = 10;
        this.fireTimer = 0;
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        this.shield = 0;
        this.shieldActive = false;
        this.autoFire = false;
        this.canShoot = true;
        this.isAlive = true;
        this.respawnTimer = 0;
        this.respawnDelay = 60;

        // 🌈 FEVER MODE properties
        this.feverMode = 0;
        this.rainbowHue = 0;
        this.feverBeatTimer = 0;

        // 🔥 NEON TRAIL properties
        this.trail = [];
        this.maxTrailLength = 10;
        this.lastX = x;
        this.lastY = y;

        // ⚡ ENHANCED POWER-UP PROPERTIES
        this.hasLaser = false;
        this.laserPower = 1;
        this.hasHoming = false;
        this.homingStrength = 1;
        this.hasSpread = false;
        this.spreadCount = 3;
        this.hasPierce = false;
        this.pierceCount = 2;
        this.hasBounce = false;
        this.bounceCount = 3;
        this.hasChain = false;
        this.chainRange = 80;
        this.magnetRange = 0;
        this.ghostMode = 0;
        this.mirrorShip = 0;
        this.novaReady = false;
        this.novaPower = 1;
        this.vortexActive = 0;
        this.vortexPower = 1;
        this.omegaMode = 0;
        this.omegaPulseTimer = 0;
        this.freezePower = 0;
        this.reflectActive = 0;
        this.quantumMode = 0;
        this.quantumShots = 3;
        this.plasmaMode = 0;
        this.matrixMode = 0;
        this.infinityMode = 0;
        this.infinitePower = false;
        this.godMode = 0;

        // Mirror ship properties
        this.mirrorX = x;
        this.mirrorY = y;

        // Screen wrap mode (Asteroids-style)
        this.screenWrap = true;

        // Ship customization (for unlockable ships)
        this.shipId = 'neonFalcon';
        this.shipColor = config.colors.player;
        this.shipSpecial = null;
        this.damageMultiplier = 1.0;

        // Dash ability (for speedster ship)
        this.dashCooldown = 0;

        // Phase shift timer (for phantom ship)
        this.phaseTimer = 0;

        // Shield cooldown (for tank ship auto-shield)
        this.shieldCooldown = 0;

        // Sidescroller mode (R-Type style)
        this.sidescrollerMode = false;
    }

    /**
     * Set sidescroller mode - repositions player for horizontal gameplay
     */
    setSidescrollerMode(enabled, canvas) {
        this.sidescrollerMode = enabled;
        if (enabled && canvas) {
            // Position player on the left side for R-Type style gameplay
            this.x = 80;
            this.y = canvas.logicalHeight / 2;
        } else if (canvas) {
            // Reset to normal position (bottom center)
            this.x = canvas.logicalWidth / 2;
            this.y = canvas.logicalHeight - 100;
        }
    }

    /**
     * Main update loop - orchestrates all player subsystems
     * Refactored for clarity: each responsibility is delegated to a focused helper method
     */
    update(keys, canvas, bulletPool, gameState, touchJoystick, touchButtons, particleSystem, soundSystem, deltaTime = 1) {
        const scaledDeltaTime = Math.max(deltaTime, 0);

        this.updateSizeMultiplier(gameState);

        if (!this.isAlive) {
            this.handleRespawn(canvas, scaledDeltaTime);
            return;
        }

        // Store previous position for trail calculation
        this.lastX = this.x;
        this.lastY = this.y;

        const movement = this.calculateMovement(keys, touchJoystick, gameState, scaledDeltaTime);
        this.applyMovement(movement, canvas);
        this.updateMirrorShip(canvas, scaledDeltaTime);
        this.updateTrail(movement, scaledDeltaTime);
        this.handleShooting(keys, touchButtons, bulletPool, gameState, soundSystem, scaledDeltaTime);
        this.updateInvulnerability(scaledDeltaTime);
        this.updatePowerUpTimers(gameState, particleSystem, soundSystem, scaledDeltaTime);
    }

    /**
     * Apply daily challenge size multiplier
     */
    updateSizeMultiplier(gameState) {
        if (gameState?.playerSizeMultiplier) {
            this.sizeMultiplier = gameState.playerSizeMultiplier;
            this.size = this.baseSize * this.sizeMultiplier;
        }
    }

    /**
     * Handle respawn countdown when player is dead
     */
    handleRespawn(canvas, deltaTime) {
        this.respawnTimer -= deltaTime;
        if (this.respawnTimer <= 0) {
            this.respawn(canvas);
        }
    }

    /**
     * Calculate movement delta from all input sources
     * Returns { dx, dy } representing the movement vector
     */
    calculateMovement(keys, touchJoystick, gameState, deltaTime) {
        let dx = 0, dy = 0;

        // Keyboard input
        if (keys['ArrowLeft'] === true || keys['a'] === true || keys['A'] === true) dx -= this.speed * deltaTime;
        if (keys['ArrowRight'] === true || keys['d'] === true || keys['D'] === true) dx += this.speed * deltaTime;
        if (keys['ArrowUp'] === true || keys['w'] === true || keys['W'] === true) dy -= this.speed * deltaTime;
        if (keys['ArrowDown'] === true || keys['s'] === true || keys['S'] === true) dy += this.speed * deltaTime;

        // Touch joystick input
        if (touchJoystick?.active) {
            const touchDx = touchJoystick.currentX - touchJoystick.startX;
            const touchDy = touchJoystick.currentY - touchJoystick.startY;
            const dist = Math.sqrt(touchDx * touchDx + touchDy * touchDy);
            if (dist > 10) {
                dx += (touchDx / dist) * this.speed * deltaTime;
                dy += (touchDy / dist) * this.speed * deltaTime;
            }
        }

        // Diagonal movement normalization
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        // Daily Challenge: Mirror controls modifier
        if (gameState?.mirrorControls) {
            dx = -dx;
            dy = -dy;
        }

        return { dx, dy };
    }

    /**
     * Apply movement with screen wrap or bounded mode
     */
    applyMovement({ dx, dy }, canvas) {
        if (this.screenWrap) {
            this.x += dx;
            this.y += dy;
            this.wrapPosition(canvas);
        } else {
            this.x = Math.max(this.size, Math.min(canvas.logicalWidth - this.size, this.x + dx));
            this.y = Math.max(this.size, Math.min(canvas.logicalHeight - this.size, this.y + dy));
        }
    }

    /**
     * Wrap position around screen edges (Asteroids-style)
     */
    wrapPosition(canvas) {
        if (this.x < -this.size) {
            this.x = canvas.logicalWidth + this.size;
        } else if (this.x > canvas.logicalWidth + this.size) {
            this.x = -this.size;
        }

        if (this.y < -this.size) {
            this.y = canvas.logicalHeight + this.size;
        } else if (this.y > canvas.logicalHeight + this.size) {
            this.y = -this.size;
        }
    }

    /**
     * Update mirror ship position and timer
     */
    updateMirrorShip(canvas, deltaTime) {
        if (this.mirrorShip > 0) {
            this.mirrorShip = Math.max(0, this.mirrorShip - deltaTime);
            this.mirrorX = canvas.logicalWidth - this.x;
            this.mirrorY = this.y;
        }
    }

    /**
     * Update neon trail when moving
     */
    updateTrail({ dx, dy }, deltaTime) {
        if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
            this.trail.push({ x: this.lastX, y: this.lastY, life: 1.0 });
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
        }

        // Fade out trail points
        this.trail = this.trail.filter(point => {
            point.life -= 0.1 * deltaTime;
            return point.life > 0;
        });
    }

    /**
     * Handle shooting input and fire rate
     */
    handleShooting(keys, touchButtons, bulletPool, gameState, soundSystem, deltaTime) {
        this.fireTimer += deltaTime;
        const currentFireRate = this.hasLaser ? Math.max(3, this.fireRate - this.laserPower) : this.fireRate;
        const isShooting = keys[' '] === true || keys['Space'] === true ||
                          touchButtons?.fire || this.autoFire;

        if (this.canShoot && isShooting && this.fireTimer > currentFireRate) {
            this.shoot(bulletPool, gameState, soundSystem);
            this.fireTimer = 0;
        }
    }

    /**
     * Update invulnerability timer
     */
    updateInvulnerability(deltaTime) {
        if (this.invulnerable) {
            this.invulnerableTimer -= deltaTime;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
            }
        }
    }

    /**
     * Update all power-up timers and effects
     */
    updatePowerUpTimers(gameState, particleSystem, soundSystem, deltaTime) {
        this.updateFeverMode(gameState, soundSystem, deltaTime);
        this.updateGhostMode(deltaTime);
        this.updateSimpleTimers(deltaTime);
        this.updateGodMode(deltaTime);
        this.updateVortexMode(gameState, particleSystem, deltaTime);
        this.updateOmegaMode(gameState, deltaTime);
        this.updateMagnetMode(gameState, deltaTime);
    }

    /**
     * Update fever mode (rainbow invulnerability)
     */
    updateFeverMode(gameState, soundSystem, deltaTime) {
        if (this.feverMode <= 0) return;

        this.feverMode -= deltaTime;
        this.feverBeatTimer += deltaTime;
        this.rainbowHue = (this.rainbowHue + 5 * deltaTime) % 360;

        if (this.feverBeatTimer >= 15 && soundSystem) {
            soundSystem.playFeverBeat?.();
            this.feverBeatTimer -= 15;
        }

        if (this.feverMode <= 0) {
            this.feverMode = 0;
            this.feverBeatTimer = 0;
            this.invulnerable = false;
            this.resetFleeingEnemies(gameState);
        }
    }

    /**
     * Reset enemies that were fleeing during fever mode
     */
    resetFleeingEnemies(gameState) {
        gameState?.enemies?.forEach(e => {
            if (e.behavior === 'flee') {
                e.behavior = e.originalBehavior || 'aggressive';
                e.points = Math.floor(e.points / 2);
                e.color = e.originalColor || '#ff0066';
            }
        });
    }

    /**
     * Update ghost mode (phasing through enemies)
     */
    updateGhostMode(deltaTime) {
        if (this.ghostMode <= 0) return;

        this.ghostMode -= deltaTime;
        if (this.ghostMode <= 0) {
            this.ghostMode = 0;
            this.invulnerable = false;
        }
    }

    /**
     * Update simple countdown timers (reflect, quantum, plasma, matrix, infinity)
     */
    updateSimpleTimers(deltaTime) {
        if (this.reflectActive > 0) {
            this.reflectActive = Math.max(0, this.reflectActive - deltaTime);
        }

        if (this.quantumMode > 0) {
            this.quantumMode = Math.max(0, this.quantumMode - deltaTime);
        }

        if (this.plasmaMode > 0) {
            this.plasmaMode = Math.max(0, this.plasmaMode - deltaTime);
            if (this.fireTimer > 1) this.fireTimer = 1;
        }

        if (this.matrixMode > 0) {
            this.matrixMode = Math.max(0, this.matrixMode - deltaTime);
            this.speed = Math.min(this.speed * Math.pow(1.1, deltaTime), 8);
        }

        if (this.infinityMode > 0) {
            this.infinityMode = Math.max(0, this.infinityMode - deltaTime);
        }
    }

    /**
     * Update god mode (ultimate power)
     */
    updateGodMode(deltaTime) {
        if (this.godMode <= 0) return;

        this.godMode -= deltaTime;
        if (this.godMode <= 0) {
            this.godMode = 0;
            this.invulnerable = false;
            this.infinitePower = false;
            this.speed = 5.5;
        }
    }

    /**
     * Update vortex attraction effect
     */
    updateVortexMode(gameState, particleSystem, deltaTime) {
        if (this.vortexActive <= 0) return;

        this.vortexActive -= deltaTime;
        this.applyVortexEffect(gameState, particleSystem, deltaTime);
    }

    /**
     * Update omega mode pulse attacks
     */
    updateOmegaMode(gameState, deltaTime) {
        if (this.omegaMode <= 0) return;

        this.omegaMode -= deltaTime;
        this.omegaPulseTimer += deltaTime;

        while (this.omegaPulseTimer >= 8) {
            this.createOmegaPulse(gameState);
            this.omegaPulseTimer -= 8;
        }

        if (this.omegaMode <= 0) {
            this.omegaMode = 0;
            this.omegaPulseTimer = 0;
        }
    }

    /**
     * Update magnet power-up attraction
     */
    updateMagnetMode(gameState, deltaTime) {
        if (this.magnetRange > 0) {
            this.applyMagnetEffect(gameState, deltaTime);
        }
    }

    shoot(bulletPool, gameState, soundSystem) {
        if (!bulletPool) return;

        const hasCombo = gameState?.powerUpManager?.comboEffects?.some(c => c.name === 'PULSE CANNON');

        if (hasCombo) {
            // Pulse cannon - rapid laser beams
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    if (bulletPool) {
                        bulletPool.spawn?.(this.x, this.y - 20 - i * 5, 0, -18, true);
                    }
                }, i * 15);
            }
        } else if (this.quantumMode > 0) {
            // Quantum shots
            for (let i = 0; i < this.quantumShots; i++) {
                const offsetX = (i - (this.quantumShots - 1) / 2) * 15;
                bulletPool.spawn?.(this.x + offsetX, this.y - 15, 0, -14, true, {
                    color: '#aa00ff',
                    size: 6,
                    damage: 12,
                    quantum: true
                });
            }
        } else if (this.infinityMode > 0 || this.infinitePower) {
            // Infinity beam
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
                bulletPool.spawn?.(this.x, this.y, Math.cos(angle) * 12, Math.sin(angle) * 12, true, {
                    color: '#ffff00',
                    size: 5,
                    damage: 8,
                    pierce: true
                });
            }
        } else if (this.godMode > 0) {
            // God mode - massive spread
            for (let angle = -Math.PI / 3; angle <= Math.PI / 3; angle += Math.PI / 12) {
                const speed = 15;
                bulletPool.spawn?.(this.x, this.y - 10,
                    Math.sin(angle) * speed,
                    -Math.cos(angle) * speed,
                    true, {
                        color: '#ff0000',
                        size: 8,
                        damage: 25,
                        pierce: true,
                        explosive: true
                    });
            }
        } else {
            // Normal shooting based on weapon level
            this.normalShoot(bulletPool, soundSystem);
        }

        // Mirror ship also shoots
        if (this.mirrorShip > 0 && bulletPool) {
            bulletPool.spawn?.(this.mirrorX, this.mirrorY - 15, 0, -12, true, {
                color: '#aaffff',
                size: 5
            });
        }

        if (soundSystem?.playShoot) soundSystem.playShoot();
    }

    normalShoot(bulletPool, soundSystem) {
        const bulletOptions = {
            color: '#00ffff',
            size: 5,
            damage: 10,
            pierce: this.hasPierce,
            pierceCount: this.pierceCount,
            bounce: this.hasBounce,
            bounceCount: this.bounceCount,
            homing: this.hasHoming,
            homingStrength: this.homingStrength,
            chain: this.hasChain,
            chainRange: this.chainRange
        };

        const patterns = this.getWeaponPattern(this.weaponLevel);
        const baseSpeed = this.sidescrollerMode ? 14 : 12;

        for (const bullet of patterns) {
            const { offsetX, offsetY, velocityX, velocityY, speedMult = 1 } = bullet;
            const speed = baseSpeed * speedMult;

            // Transform coordinates based on mode
            // Sidescroller: shoots right (positive X), vertical: shoots up (negative Y)
            const [finalOffsetX, finalOffsetY] = this.sidescrollerMode
                ? [offsetY, -offsetX]  // Rotate 90° for sidescroller
                : [offsetX, offsetY];

            const [finalVelX, finalVelY] = this.sidescrollerMode
                ? [speed + velocityY, velocityX]  // Rotate velocity for sidescroller
                : [velocityX, -speed + velocityY];

            bulletPool.spawn?.(
                this.x + finalOffsetX,
                this.y + finalOffsetY,
                finalVelX,
                finalVelY,
                true,
                bulletOptions
            );
        }

        // Spread shot
        if (this.hasSpread) {
            this.fireSpreadShot(bulletPool, bulletOptions);
        }
    }

    /**
     * Returns weapon pattern configuration for the given level.
     * Each bullet definition uses a normalized coordinate system:
     * - offsetX/Y: position offset from player (positive Y = forward)
     * - velocityX/Y: additional velocity adjustments
     * - speedMult: speed multiplier (default 1)
     */
    getWeaponPattern(level) {
        const patterns = {
            1: [
                { offsetX: 0, offsetY: -20, velocityX: 0, velocityY: 0 }
            ],
            2: [
                { offsetX: -8, offsetY: -15, velocityX: 0, velocityY: 0 },
                { offsetX: 8, offsetY: -15, velocityX: 0, velocityY: 0 }
            ],
            3: [
                { offsetX: 0, offsetY: -20, velocityX: 0, velocityY: 0 },
                { offsetX: -12, offsetY: -10, velocityX: -1, velocityY: 0 },
                { offsetX: 12, offsetY: -10, velocityX: 1, velocityY: 0 }
            ],
            4: [
                { offsetX: -8, offsetY: -20, velocityX: 0, velocityY: 0 },
                { offsetX: 8, offsetY: -20, velocityX: 0, velocityY: 0 },
                { offsetX: -16, offsetY: -10, velocityX: -2, velocityY: 0 },
                { offsetX: 16, offsetY: -10, velocityX: 2, velocityY: 0 }
            ],
            5: [
                { offsetX: 0, offsetY: -20, velocityX: 0, velocityY: 0, speedMult: 1.2 },
                { offsetX: -10, offsetY: -15, velocityX: -1, velocityY: 0 },
                { offsetX: 10, offsetY: -15, velocityX: 1, velocityY: 0 },
                { offsetX: -20, offsetY: -5, velocityX: -2, velocityY: 0, speedMult: 0.9 },
                { offsetX: 20, offsetY: -5, velocityX: 2, velocityY: 0, speedMult: 0.9 }
            ]
        };

        return patterns[Math.min(level, 5)] || patterns[5];
    }

    /**
     * Fires spread shot bullets in a fan pattern
     */
    fireSpreadShot(bulletPool, bulletOptions) {
        const spreadAngle = Math.PI / 8;
        const spreadOptions = { ...bulletOptions, color: '#ffff00', size: 4 };

        // Base angle: right for sidescroller, up for vertical
        const baseAngle = this.sidescrollerMode ? 0 : -Math.PI / 2;
        const forwardMomentum = this.sidescrollerMode ? 8 : 0;
        const spawnOffset = this.sidescrollerMode ? { x: 10, y: 0 } : { x: 0, y: -10 };

        for (let i = 0; i < this.spreadCount; i++) {
            const angle = baseAngle + spreadAngle * (i - (this.spreadCount - 1) / 2);
            bulletPool.spawn?.(
                this.x + spawnOffset.x,
                this.y + spawnOffset.y,
                Math.cos(angle) * 10 + forwardMomentum,
                Math.sin(angle) * 10,
                true,
                spreadOptions
            );
        }
    }

    applyVortexEffect(gameState, particleSystem, deltaTime = 1) {
        if (!gameState) return;

        const baseRange = 200 + (this.vortexPower * 50);
        const scaledDeltaTime = Math.max(deltaTime, 0);

        // Attract enemies
        gameState.enemies?.forEach(enemy => {
            if (enemy.active) {
                const dx = this.x - enemy.x;
                const dy = this.y - enemy.y;
                const dist = Math.hypot(dx, dy);

                if (dist < baseRange) {
                    const force = Math.max(1, (baseRange - dist) / baseRange * (3 + this.vortexPower));
                    const angle = Math.atan2(dy, dx);
                    enemy.x += Math.cos(angle) * force * scaledDeltaTime;
                    enemy.y += Math.sin(angle) * force * scaledDeltaTime;

                    // Damage enemies too close
                    if (dist < 50 && Math.random() < 0.1) {
                        enemy.takeDamage?.(1);
                        particleSystem?.addExplosion?.(enemy.x, enemy.y, '#80ff80', 8);
                    }
                }
            }
        });

        // Attract power-ups
        gameState.powerUps?.forEach(powerUp => {
            if (powerUp.active) {
                const dx = this.x - powerUp.x;
                const dy = this.y - powerUp.y;
                const dist = Math.hypot(dx, dy);

                if (dist < baseRange) {
                    const force = (baseRange - dist) / baseRange * (4 + this.vortexPower);
                    const angle = Math.atan2(dy, dx);
                    powerUp.x += Math.cos(angle) * force * scaledDeltaTime;
                    powerUp.y += Math.sin(angle) * force * scaledDeltaTime;
                }
            }
        });
    }

    applyMagnetEffect(gameState, deltaTime = 1) {
        if (!gameState?.powerUps) return;
        const scaledDeltaTime = Math.max(deltaTime, 0);

        gameState.powerUps.forEach(powerUp => {
            if (powerUp.active) {
                const dx = this.x - powerUp.x;
                const dy = this.y - powerUp.y;
                const dist = Math.hypot(dx, dy);

                if (dist < this.magnetRange && dist > 0) {
                    const force = (this.magnetRange - dist) / this.magnetRange * 5;
                    powerUp.x += (dx / dist) * force * scaledDeltaTime;
                    powerUp.y += (dy / dist) * force * scaledDeltaTime;
                }
            }
        });
    }

    createOmegaPulse(gameState) {
        if (!gameState?.particles) return;

        const pulseCount = this.godMode > 0 ? 5 : 3;

        for (let p = 0; p < pulseCount; p++) {
            gameState.particles.push({
                x: this.x + (Math.random() - 0.5) * 120,
                y: this.y + (Math.random() - 0.5) * 120,
                radius: 0,
                maxRadius: 100 + (p * 20),
                life: 40,
                maxLife: 40,
                active: true,
                damage: 2 + p,
                update() {
                    this.radius += this.maxRadius / this.maxLife;
                    this.life--;

                    if (gameState?.enemies && this.life % 5 === 0) {
                        gameState.enemies.forEach(enemy => {
                            if (enemy.active) {
                                const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                                if (dist < this.radius && dist > this.radius - 20) {
                                    enemy.takeDamage?.(this.damage);
                                }
                            }
                        });
                    }

                    if (this.life <= 0) this.active = false;
                },
                draw(ctx) {
                    const alpha = this.life / this.maxLife;
                    ctx.save();
                    ctx.strokeStyle = '#ff0000';
                    ctx.lineWidth = 4;
                    ctx.globalAlpha = alpha;
                    ctx.shadowBlur = 35;
                    ctx.shadowColor = '#ff0000';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
            });
        }
    }

    takeDamage(amount = 1) {
        if (this.invulnerable || this.ghostMode > 0 || this.godMode > 0) return false;
        if (this.feverMode > 0) return false;

        // Shield absorbs damage first
        if (this.shieldActive && this.shield > 0) {
            this.shield -= amount;
            if (this.shield <= 0) {
                this.shieldActive = false;
                this.shield = 0;
            }
            return false;
        }

        this.isAlive = false;
        return true;
    }

    respawn(canvas) {
        if (this.sidescrollerMode && canvas) {
            // Sidescroller respawn position (left side)
            this.x = 80;
            this.y = canvas.logicalHeight / 2;
        } else {
            // Normal respawn position (bottom center)
            this.x = canvas ? canvas.logicalWidth / 2 : 400;
            this.y = canvas ? canvas.logicalHeight - 100 : 500;
        }
        this.isAlive = true;
        this.invulnerable = true;
        this.invulnerableTimer = 180;
        this.trail = [];
    }

    die() {
        this.isAlive = false;
        this.respawnTimer = this.respawnDelay;

        // Weapon loss on death - lose 1-2 weapon levels
        const levelsLost = Math.floor(Math.random() * 2) + 1;  // 1 or 2
        this.weaponLevel = Math.max(1, this.weaponLevel - levelsLost);

        // Lose some special weapon upgrades on death
        if (this.hasLaser && Math.random() < 0.5) {
            this.laserPower = Math.max(1, this.laserPower - 1);
            if (this.laserPower <= 1) this.hasLaser = false;
        }
        if (this.hasSpread && Math.random() < 0.5) {
            this.spreadCount = Math.max(3, this.spreadCount - 2);
            if (this.spreadCount <= 3) this.hasSpread = false;
        }
        if (this.hasHoming && Math.random() < 0.5) {
            this.homingStrength = Math.max(0, this.homingStrength - 0.02);
            if (this.homingStrength <= 0) this.hasHoming = false;
        }
        if (this.hasPierce && Math.random() < 0.5) {
            this.pierceCount = Math.max(0, this.pierceCount - 1);
            if (this.pierceCount <= 0) this.hasPierce = false;
        }
        if (this.hasBounce && Math.random() < 0.5) {
            this.bounceCount = Math.max(0, this.bounceCount - 1);
            if (this.bounceCount <= 0) this.hasBounce = false;
        }
        if (this.hasChain && Math.random() < 0.5) {
            this.chainRange = Math.max(0, this.chainRange - 30);
            if (this.chainRange <= 0) this.hasChain = false;
        }

        // Reset magnet range on death
        this.magnetRange = Math.max(0, this.magnetRange - 100);
    }

    /**
     * Main draw method - orchestrates all visual components
     * Refactored for clarity: each effect is in its own helper method
     */
    draw(ctx) {
        if (!this.isAlive) return;

        ctx.save();

        // Draw effects that are positioned in world space (before translation)
        this.drawNeonTrail(ctx);
        this.drawMirrorShipEffect(ctx);

        // Position context at player location
        ctx.translate(this.x, this.y);
        if (this.sidescrollerMode) {
            ctx.rotate(Math.PI / 2);
        }

        // Determine and apply active color based on current mode
        const activeColor = this.getActiveColor();
        this.color = activeColor;
        this.applyModeVisualEffects(ctx, activeColor);

        // Apply invulnerability flicker
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.3;
        }

        // Draw the ship itself
        this.drawShipByType(ctx, activeColor);

        // Draw active effects around the ship
        this.drawVortexEffect(ctx);
        this.drawAfterburnerEffect(ctx);
        this.drawWeaponIndicators(ctx);
        this.drawShieldEffect(ctx);
        this.drawAutoFireIndicator(ctx);

        ctx.restore();
    }

    /**
     * Draw neon trail behind the ship
     */
    drawNeonTrail(ctx) {
        if (this.trail.length === 0) return;

        const shadowsEnabled = config.rendering?.shadowsEnabled !== false;

        this.trail.forEach((point, index) => {
            ctx.save();
            ctx.globalAlpha = point.life * 0.6;

            if (this.feverMode > 0) {
                ctx.fillStyle = `hsl(${(this.rainbowHue - index * 10) % 360}, 100%, 50%)`;
                if (shadowsEnabled) {
                    ctx.shadowBlur = 10; // Reduced from 20
                    ctx.shadowColor = ctx.fillStyle;
                }
            } else {
                ctx.fillStyle = this.shipColor || this.color;
                if (shadowsEnabled) {
                    ctx.shadowBlur = 8; // Reduced from 15
                    ctx.shadowColor = this.shipColor || this.color;
                }
            }

            const size = (this.size * 0.5) * point.life;
            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    /**
     * Draw ghost mirror ship effect
     */
    drawMirrorShipEffect(ctx) {
        if (this.mirrorShip <= 0) return;

        const shadowsEnabled = config.rendering?.shadowsEnabled !== false;

        ctx.save();
        ctx.translate(this.mirrorX, this.mirrorY);
        ctx.globalAlpha = 0.7;

        ctx.strokeStyle = '#aaffff';
        ctx.lineWidth = 3;
        if (shadowsEnabled) {
            ctx.shadowBlur = 15; // Reduced from 30
            ctx.shadowColor = '#aaffff';
        }

        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(-15, 20);
        ctx.lineTo(0, 10);
        ctx.lineTo(15, 20);
        ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = '#aaffff44';
        ctx.fill();
        ctx.restore();
    }

    /**
     * Get the active ship color based on current mode
     */
    getActiveColor() {
        if (this.feverMode > 0) {
            return `hsl(${this.rainbowHue}, 100%, 50%)`;
        }
        if (this.omegaMode > 0) {
            return '#ff0000';
        }
        if (this.ghostMode > 0) {
            return '#aaaaff';
        }
        if (this.godMode > 0) {
            return `hsl(${(Date.now() * 0.5) % 360}, 100%, 70%)`;
        }
        return this.shipColor || config.colors.player;
    }

    /**
     * Apply visual glow/alpha effects based on active mode
     */
    applyModeVisualEffects(ctx, activeColor) {
        const shadowsEnabled = config.rendering?.shadowsEnabled !== false;

        if (this.feverMode > 0) {
            // Rainbow rings around ship
            for (let i = 0; i < 3; i++) {
                ctx.strokeStyle = `hsla(${(this.rainbowHue + i * 30) % 360}, 100%, 50%, ${0.3 - i * 0.1})`;
                ctx.lineWidth = 2;
                if (shadowsEnabled) {
                    ctx.shadowBlur = 15; // Reduced from 30
                    ctx.shadowColor = ctx.strokeStyle;
                }
                ctx.beginPath();
                ctx.arc(0, 0, this.size + 10 + i * 5, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (this.omegaMode > 0) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 4;
            if (shadowsEnabled) {
                ctx.shadowBlur = 20; // Reduced from 40
                ctx.shadowColor = '#ff0000';
            }
        } else if (this.ghostMode > 0) {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
        } else if (this.godMode > 0 && shadowsEnabled) {
            ctx.shadowBlur = 25; // Reduced from 50
            ctx.shadowColor = activeColor;
        }
    }

    /**
     * Draw vortex attraction ring effect
     */
    drawVortexEffect(ctx) {
        if (this.vortexActive <= 0) return;

        const shadowsEnabled = config.rendering?.shadowsEnabled !== false;

        ctx.save();
        const vortexRadius = 80 + Math.sin(Date.now() * 0.01) * 20;
        ctx.strokeStyle = '#80ff80';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        if (shadowsEnabled) {
            ctx.shadowBlur = 12; // Reduced from 25
            ctx.shadowColor = '#80ff80';
        }

        // Outer ring
        ctx.beginPath();
        ctx.arc(0, 0, vortexRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Rotating spokes
        for (let i = 0; i < 8; i++) {
            const angle = (Date.now() * 0.005) + (i * Math.PI / 4);
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * 40, Math.sin(angle) * 40);
            ctx.lineTo(Math.cos(angle) * vortexRadius, Math.sin(angle) * vortexRadius);
            ctx.stroke();
        }
        ctx.restore();
    }

    /**
     * Draw engine flame when moving
     */
    drawAfterburnerEffect(ctx) {
        const moving = Math.abs(this.x - this.lastX) > 1 || Math.abs(this.y - this.lastY) > 1;
        if (!moving) return;

        ctx.save();
        const flameLength = 10 + Math.random() * 15;
        const gradient = ctx.createLinearGradient(0, 15, 0, 15 + flameLength);

        if (this.feverMode > 0) {
            gradient.addColorStop(0, `hsla(${this.rainbowHue}, 100%, 70%, 0.8)`);
            gradient.addColorStop(0.5, `hsla(${(this.rainbowHue + 60) % 360}, 100%, 50%, 0.5)`);
            gradient.addColorStop(1, 'transparent');
        } else {
            gradient.addColorStop(0, 'rgba(255, 255, 100, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.5)');
            gradient.addColorStop(1, 'transparent');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(-5, 15);
        ctx.lineTo(-8, 15 + flameLength);
        ctx.lineTo(0, 15 + flameLength * 0.7);
        ctx.lineTo(8, 15 + flameLength);
        ctx.lineTo(5, 15);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    /**
     * Draw weapon power level indicators
     */
    drawWeaponIndicators(ctx) {
        if (this.weaponLevel <= 1) return;

        const shadowsEnabled = config.rendering?.shadowsEnabled !== false;

        ctx.fillStyle = '#ffff00';
        if (shadowsEnabled) {
            ctx.shadowBlur = 5; // Reduced from 10
            ctx.shadowColor = '#ffff00';
        }
        for (let i = 0; i < this.weaponLevel - 1; i++) {
            ctx.beginPath();
            ctx.arc(-10 + i * 10, -25, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Draw shield bubble effect
     */
    drawShieldEffect(ctx) {
        if (!this.shieldActive || this.shield <= 0) return;

        const shadowsEnabled = config.rendering?.shadowsEnabled !== false;

        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        if (shadowsEnabled) {
            ctx.shadowBlur = 10; // Reduced from 20
            ctx.shadowColor = '#00ffff';
        }
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, 35, 0, Math.PI * 2);
        ctx.stroke();
    }

    /**
     * Draw auto-fire text indicator
     */
    drawAutoFireIndicator(ctx) {
        if (!this.autoFire) return;

        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 10px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('AUTO', 0, -35);
    }

    /**
     * Draw ship based on ship type - each ship has a unique design
     */
    drawShipByType(ctx, color) {
        const shadowsEnabled = config.rendering?.shadowsEnabled !== false;

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        if (shadowsEnabled) {
            ctx.shadowBlur = 15; // Reduced from 30
            ctx.shadowColor = color;
        }

        switch (this.shipId) {
            case 'glassCannon':
                this.drawGlassCannonShip(ctx, color);
                break;
            case 'tank':
                this.drawTankShip(ctx, color);
                break;
            case 'speedster':
                this.drawSpeedsterShip(ctx, color);
                break;
            case 'retroClassic':
                this.drawRetroClassicShip(ctx, color);
                break;
            case 'phantom':
                this.drawPhantomShip(ctx, color);
                break;
            case 'berserker':
                this.drawBerserkerShip(ctx, color);
                break;
            case 'synth':
                this.drawSynthShip(ctx, color);
                break;
            case 'neonFalcon':
            default:
                this.drawNeonFalconShip(ctx, color);
                break;
        }
    }

    /**
     * NEON FALCON - Classic balanced ship (default)
     * 8-bit pixel art - sleek fighter design
     */
    drawNeonFalconShip(ctx, color) {
        const p = 3; // Pixel size
        // Shadow already set by drawShipByType

        // 8-bit falcon fighter pattern
        const falcon = [
            [0,0,0,0,0,1,0,0,0,0,0],
            [0,0,0,0,1,1,1,0,0,0,0],
            [0,0,0,0,1,1,1,0,0,0,0],
            [0,0,0,1,1,1,1,1,0,0,0],
            [0,0,1,1,1,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,1,1,1,0],
            [1,1,0,1,1,1,1,1,0,1,1],
            [1,0,0,0,1,1,1,0,0,0,1],
            [1,0,0,0,0,1,0,0,0,0,1],
            [0,0,0,0,0,1,0,0,0,0,0],
        ];

        const offsetX = -falcon[0].length * p / 2;
        const offsetY = -falcon.length * p / 2;

        falcon.forEach((row, y) => {
            row.forEach((pixel, x) => {
                if (pixel) {
                    // Cockpit area (center top) is brighter
                    if (y < 4 && x >= 4 && x <= 6) {
                        ctx.fillStyle = '#ffffff';
                    } else {
                        ctx.fillStyle = color;
                    }
                    ctx.fillRect(offsetX + x * p, offsetY + y * p, p - 1, p - 1);
                }
            });
        });
    }

    /**
     * GLASS CANNON - Angular, aggressive design
     * 8-bit pixel art - sharp angular deadly look
     */
    drawGlassCannonShip(ctx, color) {
        const p = 3; // Pixel size
        // Shadow already set by drawShipByType

        // 8-bit angular cannon pattern
        const cannon = [
            [0,0,0,0,0,1,0,0,0,0,0],
            [0,0,0,0,1,1,1,0,0,0,0],
            [0,0,0,1,0,1,0,1,0,0,0],
            [0,0,1,0,1,1,1,0,1,0,0],
            [0,1,0,0,1,1,1,0,0,1,0],
            [1,0,0,1,1,1,1,1,0,0,1],
            [0,0,1,1,1,1,1,1,1,0,0],
            [0,1,1,0,1,1,1,0,1,1,0],
            [1,1,0,0,0,1,0,0,0,1,1],
            [1,0,0,0,0,0,0,0,0,0,1],
        ];

        const offsetX = -cannon[0].length * p / 2;
        const offsetY = -cannon.length * p / 2;

        cannon.forEach((row, y) => {
            row.forEach((pixel, x) => {
                if (pixel) {
                    // Glowing energy core in center
                    if (y >= 4 && y <= 6 && x >= 4 && x <= 6) {
                        ctx.fillStyle = '#ffff00';
                        ctx.shadowColor = '#ffff00';
                    } else {
                        ctx.fillStyle = color;
                        ctx.shadowColor = color;
                    }
                    ctx.fillRect(offsetX + x * p, offsetY + y * p, p - 1, p - 1);
                }
            });
        });
    }

    /**
     * HEAVY TANK - Bulky, armored design
     * 8-bit pixel art - wide armored fortress
     */
    drawTankShip(ctx, color) {
        const p = 3; // Pixel size
        // Shadow already set by drawShipByType

        // 8-bit tank pattern - wide and bulky
        const tank = [
            [0,0,0,0,0,1,1,0,0,0,0,0],
            [0,0,0,0,1,1,1,1,0,0,0,0],
            [0,0,1,1,1,1,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,0,1,1,1,1,0,1,1,1],
            [1,1,1,0,1,1,1,1,0,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1],
            [0,1,1,1,1,1,1,1,1,1,1,0],
            [0,0,1,1,0,0,0,0,1,1,0,0],
        ];

        const offsetX = -tank[0].length * p / 2;
        const offsetY = -tank.length * p / 2;

        tank.forEach((row, y) => {
            row.forEach((pixel, x) => {
                if (pixel) {
                    // Shield generator in center (cyan glow)
                    if (y >= 4 && y <= 7 && x >= 4 && x <= 7) {
                        ctx.fillStyle = '#00ffff';
                        ctx.shadowColor = '#00ffff';
                    } else {
                        ctx.fillStyle = color;
                        ctx.shadowColor = color;
                    }
                    ctx.fillRect(offsetX + x * p, offsetY + y * p, p - 1, p - 1);
                }
            });
        });
    }

    /**
     * SPEEDSTER - Streamlined, aerodynamic design
     * 8-bit pixel art - slim and fast looking
     */
    drawSpeedsterShip(ctx, color) {
        const p = 3; // Pixel size
        // Shadow already set by drawShipByType

        // 8-bit speedster pattern - slim and elongated
        const speedster = [
            [0,0,0,0,1,0,0,0,0],
            [0,0,0,1,1,1,0,0,0],
            [0,0,0,1,1,1,0,0,0],
            [0,0,0,1,1,1,0,0,0],
            [0,0,1,1,1,1,1,0,0],
            [0,0,1,1,1,1,1,0,0],
            [0,1,0,1,1,1,0,1,0],
            [1,0,0,1,1,1,0,0,1],
            [1,0,0,0,1,0,0,0,1],
            [0,0,0,0,1,0,0,0,0],
            [0,0,0,0,1,0,0,0,0],
        ];

        const offsetX = -speedster[0].length * p / 2;
        const offsetY = -speedster.length * p / 2;

        speedster.forEach((row, y) => {
            row.forEach((pixel, x) => {
                if (pixel) {
                    // Boost indicator (yellow) at top
                    if (y <= 2 && x === 4) {
                        ctx.fillStyle = '#ffff00';
                        ctx.shadowColor = '#ffff00';
                    } else {
                        ctx.fillStyle = color;
                        ctx.shadowColor = color;
                    }
                    ctx.fillRect(offsetX + x * p, offsetY + y * p, p - 1, p - 1);
                }
            });
        });

        // Speed trail pixels behind
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = color;
        for (let i = 1; i <= 3; i++) {
            ctx.globalAlpha = 0.5 - i * 0.15;
            ctx.fillRect(offsetX + 4 * p, offsetY + (10 + i) * p, p - 1, p - 1);
        }
        ctx.globalAlpha = 1;
    }

    /**
     * RETRO CLASSIC - Pixelated 8-bit style
     * 8-bit pixel art - classic arcade ship
     */
    drawRetroClassicShip(ctx, color) {
        const p = 3; // Pixel size
        // Shadow already set by drawShipByType

        // 8-bit classic arcade ship pattern
        const retro = [
            [0,0,0,0,0,1,0,0,0,0,0],
            [0,0,0,0,1,1,1,0,0,0,0],
            [0,0,0,1,1,1,1,1,0,0,0],
            [0,0,1,1,1,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1,1,1,1],
            [1,1,0,1,1,1,1,1,0,1,1],
            [1,0,0,0,1,1,1,0,0,0,1],
            [1,0,0,0,0,1,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,1],
        ];

        const offsetX = -retro[0].length * p / 2;
        const offsetY = -retro.length * p / 2;

        retro.forEach((row, y) => {
            row.forEach((pixel, x) => {
                if (pixel) {
                    // Alternating colors for retro effect
                    if ((x + y) % 3 === 0 && y < 5) {
                        ctx.fillStyle = '#ffffff';
                    } else {
                        ctx.fillStyle = color;
                    }
                    ctx.fillRect(offsetX + x * p, offsetY + y * p, p - 1, p - 1);
                }
            });
        });
    }

    /**
     * PHANTOM - Ethereal, ghostly design
     * 8-bit pixel art - ghost-like with phase effect
     */
    drawPhantomShip(ctx, color) {
        const p = 3; // Pixel size
        const phase = Math.sin(Date.now() * 0.005) * 0.3;
        // Shadow already set by drawShipByType (uses 15)

        // 8-bit ghost/phantom pattern
        const phantom = [
            [0,0,0,1,1,1,1,0,0,0],
            [0,0,1,1,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,1,1,0],
            [1,1,0,0,1,1,0,0,1,1],
            [1,1,0,0,1,1,0,0,1,1],
            [1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1],
            [1,0,1,1,0,0,1,1,0,1],
            [1,0,0,1,0,0,1,0,0,1],
        ];

        const offsetX = -phantom[0].length * p / 2;
        const offsetY = -phantom.length * p / 2;

        // Ghost phasing effect
        ctx.globalAlpha = 0.6 + phase;

        phantom.forEach((row, y) => {
            row.forEach((pixel, x) => {
                if (pixel) {
                    // Glowing eyes
                    if (y >= 3 && y <= 4 && (x === 2 || x === 3 || x === 6 || x === 7)) {
                        ctx.fillStyle = '#ffffff';
                        ctx.shadowColor = '#ffffff';
                    } else {
                        ctx.fillStyle = color;
                        ctx.shadowColor = color;
                    }
                    ctx.fillRect(offsetX + x * p, offsetY + y * p, p - 1, p - 1);
                }
            });
        });

        ctx.globalAlpha = 1;
    }

    /**
     * BERSERKER - Aggressive, spiked design
     * 8-bit pixel art - angry spiked warrior
     */
    drawBerserkerShip(ctx, color) {
        const p = 3; // Pixel size
        // Shadow already set by drawShipByType

        // 8-bit berserker pattern - spiked and aggressive
        const berserker = [
            [0,0,0,0,0,1,0,0,0,0,0],
            [0,0,0,0,1,1,1,0,0,0,0],
            [1,0,0,1,1,1,1,1,0,0,1],
            [1,1,0,1,1,1,1,1,0,1,1],
            [0,1,1,1,1,1,1,1,1,1,0],
            [0,0,1,1,1,1,1,1,1,0,0],
            [0,1,1,0,1,1,1,0,1,1,0],
            [1,1,0,0,1,1,1,0,0,1,1],
            [1,0,0,0,0,1,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,1],
            [0,0,0,0,0,1,0,0,0,0,0],
        ];

        const offsetX = -berserker[0].length * p / 2;
        const offsetY = -berserker.length * p / 2;

        // Rage pulse effect
        const ragePulse = Math.sin(Date.now() * 0.01) > 0;

        berserker.forEach((row, y) => {
            row.forEach((pixel, x) => {
                if (pixel) {
                    // Rage eye in center (pulsing red)
                    if (y >= 3 && y <= 5 && x >= 4 && x <= 6) {
                        ctx.fillStyle = ragePulse ? '#ff0000' : '#ff4400';
                        ctx.shadowColor = '#ff0000';
                    }
                    // Spikes are brighter
                    else if ((y === 2 || y === 3) && (x === 0 || x === 1 || x === 9 || x === 10)) {
                        ctx.fillStyle = '#ffaa00';
                        ctx.shadowColor = '#ffaa00';
                    } else {
                        ctx.fillStyle = color;
                        ctx.shadowColor = color;
                    }
                    ctx.fillRect(offsetX + x * p, offsetY + y * p, p - 1, p - 1);
                }
            });
        });
    }

    /**
     * SYNTHWAVE - Music-reactive, rhythmic design
     * 8-bit pixel art - music/wave themed with beat pulse
     */
    drawSynthShip(ctx, color) {
        const p = 3; // Pixel size
        const beat = Math.sin(Date.now() * 0.008) * 0.5 + 0.5;
        // Shadow already set by drawShipByType

        // 8-bit synthwave pattern - music note inspired
        const synth = [
            [0,0,0,1,1,1,1,0,0,0],
            [0,0,1,1,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,1,1,0],
            [0,1,1,1,1,1,1,1,1,0],
            [1,1,0,1,1,1,1,0,1,1],
            [1,0,0,1,1,1,1,0,0,1],
            [1,0,0,0,1,1,0,0,0,1],
            [1,1,0,0,1,1,0,0,1,1],
            [0,1,1,0,1,1,0,1,1,0],
            [0,0,1,1,0,0,1,1,0,0],
        ];

        const offsetX = -synth[0].length * p / 2;
        const offsetY = -synth.length * p / 2;

        synth.forEach((row, y) => {
            row.forEach((pixel, x) => {
                if (pixel) {
                    // Rainbow gradient based on y position and beat
                    const hue = (y * 30 + Date.now() * 0.1) % 360;
                    if (y < 4) {
                        ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
                        ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
                    } else {
                        ctx.fillStyle = color;
                        ctx.shadowColor = color;
                    }
                    ctx.fillRect(offsetX + x * p, offsetY + y * p, p - 1, p - 1);
                }
            });
        });

        // Animated equalizer bars below ship
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        for (let i = -2; i <= 2; i++) {
            const barHeight = Math.floor(2 + Math.sin(Date.now() * 0.01 + i) * 2);
            for (let h = 0; h < barHeight; h++) {
                ctx.fillRect(offsetX + (4 + i) * p, offsetY + (10 + h) * p, p - 1, p - 1);
            }
        }
    }
}
