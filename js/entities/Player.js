// ============================================
// GEOMETRY 3044 — PLAYER CLASS (COMPLETE)
// ============================================

import { config, getCurrentTheme } from '../config.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 5.5;
        this.size = 20;
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
    }

    update(keys, canvas, bulletPool, gameState, touchJoystick, touchButtons, particleSystem, soundSystem, deltaTime = 1) {
        const scaledDeltaTime = Math.max(deltaTime, 0);
        // Handle death and respawn
        if (!this.isAlive) {
            this.respawnTimer -= scaledDeltaTime;
            if (this.respawnTimer <= 0) {
                this.respawn(canvas);
            }
            return;
        }

        // Store previous position for trail
        this.lastX = this.x;
        this.lastY = this.y;

        // Normal movement
        let dx = 0, dy = 0;

        if (keys['ArrowLeft'] === true || keys['a'] === true || keys['A'] === true) dx -= this.speed * scaledDeltaTime;
        if (keys['ArrowRight'] === true || keys['d'] === true || keys['D'] === true) dx += this.speed * scaledDeltaTime;
        if (keys['ArrowUp'] === true || keys['w'] === true || keys['W'] === true) dy -= this.speed * scaledDeltaTime;
        if (keys['ArrowDown'] === true || keys['s'] === true || keys['S'] === true) dy += this.speed * scaledDeltaTime;

        // Touch joystick support
        if (touchJoystick && touchJoystick.active) {
            const touchDx = touchJoystick.currentX - touchJoystick.startX;
            const touchDy = touchJoystick.currentY - touchJoystick.startY;
            const dist = Math.sqrt(touchDx * touchDx + touchDy * touchDy);
            if (dist > 10) {
                dx += (touchDx / dist) * this.speed * scaledDeltaTime;
                dy += (touchDy / dist) * this.speed * scaledDeltaTime;
            }
        }

        // Diagonal movement normalization
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        // Apply movement with screen wrap (Asteroids-style) or bounded
        if (this.screenWrap) {
            this.x += dx;
            this.y += dy;

            // Wrap horizontally
            if (this.x < -this.size) {
                this.x = canvas.logicalWidth + this.size;
            } else if (this.x > canvas.logicalWidth + this.size) {
                this.x = -this.size;
            }

            // Wrap vertically
            if (this.y < -this.size) {
                this.y = canvas.logicalHeight + this.size;
            } else if (this.y > canvas.logicalHeight + this.size) {
                this.y = -this.size;
            }
        } else {
            // Standard bounded movement
            this.x = Math.max(this.size, Math.min(canvas.logicalWidth - this.size, this.x + dx));
            this.y = Math.max(this.size, Math.min(canvas.logicalHeight - this.size, this.y + dy));
        }

        // Update mirror ship
        if (this.mirrorShip > 0) {
            this.mirrorShip = Math.max(0, this.mirrorShip - scaledDeltaTime);
            this.mirrorX = canvas.logicalWidth - this.x;
            this.mirrorY = this.y;
        }

        // 🔥 Update trail
        if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
            this.trail.push({
                x: this.lastX,
                y: this.lastY,
                life: 1.0
            });

            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
        }

        // Update trail fade
        this.trail = this.trail.filter(point => {
            point.life -= 0.1 * scaledDeltaTime;
            return point.life > 0;
        });

        // Handle shooting
        this.fireTimer += scaledDeltaTime;
        const currentFireRate = this.hasLaser ? Math.max(3, this.fireRate - this.laserPower) : this.fireRate;

        const shooting = keys[' '] === true || keys['Space'] === true ||
                        (touchButtons && touchButtons.fire) || this.autoFire;

        if (this.canShoot && shooting && this.fireTimer > currentFireRate) {
            this.shoot(bulletPool, gameState, soundSystem);
            this.fireTimer = 0;
        }

        // Update invulnerability
        if (this.invulnerable) {
            this.invulnerableTimer -= scaledDeltaTime;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
            }
        }

        // 🌈 Update fever mode
        if (this.feverMode > 0) {
            this.feverMode -= scaledDeltaTime;
            this.feverBeatTimer += scaledDeltaTime;
            this.rainbowHue = (this.rainbowHue + 5 * scaledDeltaTime) % 360;

            if (this.feverBeatTimer >= 15 && soundSystem) {
                soundSystem.playFeverBeat?.();
                this.feverBeatTimer -= 15;
            }

            if (this.feverMode <= 0) {
                this.feverMode = 0;
                this.feverBeatTimer = 0;
                this.invulnerable = false;
                if (gameState && gameState.enemies) {
                    gameState.enemies.forEach(e => {
                        if (e.behavior === 'flee') {
                            e.behavior = e.originalBehavior || 'aggressive';
                            e.points = Math.floor(e.points / 2);
                            e.color = e.originalColor || '#ff0066';
                        }
                    });
                }
            }
        }

        // Update enhanced power-up timers
        if (this.ghostMode > 0) {
            this.ghostMode -= scaledDeltaTime;
            if (this.ghostMode <= 0) {
                this.ghostMode = 0;
                this.invulnerable = false;
            }
        }

        if (this.reflectActive > 0) this.reflectActive = Math.max(0, this.reflectActive - scaledDeltaTime);
        if (this.quantumMode > 0) this.quantumMode = Math.max(0, this.quantumMode - scaledDeltaTime);

        if (this.plasmaMode > 0) {
            this.plasmaMode = Math.max(0, this.plasmaMode - scaledDeltaTime);
            if (this.fireTimer > 1) this.fireTimer = 1;
        }

        if (this.matrixMode > 0) {
            this.matrixMode = Math.max(0, this.matrixMode - scaledDeltaTime);
            this.speed = Math.min(this.speed * Math.pow(1.1, scaledDeltaTime), 8);
        }

        if (this.infinityMode > 0) this.infinityMode = Math.max(0, this.infinityMode - scaledDeltaTime);

        if (this.godMode > 0) {
            this.godMode -= scaledDeltaTime;
            if (this.godMode <= 0) {
                this.godMode = 0;
                this.invulnerable = false;
                this.infinitePower = false;
                this.speed = 5.5;
            }
        }

        // Vortex effect
        if (this.vortexActive > 0) {
            this.vortexActive -= scaledDeltaTime;
            this.applyVortexEffect(gameState, particleSystem, scaledDeltaTime);
        }

        // Omega mode effects
        if (this.omegaMode > 0) {
            this.omegaMode -= scaledDeltaTime;
            this.omegaPulseTimer += scaledDeltaTime;
            while (this.omegaPulseTimer >= 8) {
                this.createOmegaPulse(gameState);
                this.omegaPulseTimer -= 8;
            }
            if (this.omegaMode <= 0) {
                this.omegaMode = 0;
                this.omegaPulseTimer = 0;
            }
        }

        // Magnet effect
        if (this.magnetRange > 0) {
            this.applyMagnetEffect(gameState, scaledDeltaTime);
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
        const bulletSpeed = -12;
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

        switch (this.weaponLevel) {
            case 1:
                bulletPool.spawn?.(this.x, this.y - 20, 0, bulletSpeed, true, bulletOptions);
                break;
            case 2:
                bulletPool.spawn?.(this.x - 8, this.y - 15, 0, bulletSpeed, true, bulletOptions);
                bulletPool.spawn?.(this.x + 8, this.y - 15, 0, bulletSpeed, true, bulletOptions);
                break;
            case 3:
                bulletPool.spawn?.(this.x, this.y - 20, 0, bulletSpeed, true, bulletOptions);
                bulletPool.spawn?.(this.x - 12, this.y - 10, -1, bulletSpeed, true, bulletOptions);
                bulletPool.spawn?.(this.x + 12, this.y - 10, 1, bulletSpeed, true, bulletOptions);
                break;
            case 4:
                bulletPool.spawn?.(this.x - 8, this.y - 20, 0, bulletSpeed, true, bulletOptions);
                bulletPool.spawn?.(this.x + 8, this.y - 20, 0, bulletSpeed, true, bulletOptions);
                bulletPool.spawn?.(this.x - 16, this.y - 10, -2, bulletSpeed, true, bulletOptions);
                bulletPool.spawn?.(this.x + 16, this.y - 10, 2, bulletSpeed, true, bulletOptions);
                break;
            default:
                // Level 5+
                bulletPool.spawn?.(this.x, this.y - 20, 0, bulletSpeed * 1.2, true, bulletOptions);
                bulletPool.spawn?.(this.x - 10, this.y - 15, -1, bulletSpeed, true, bulletOptions);
                bulletPool.spawn?.(this.x + 10, this.y - 15, 1, bulletSpeed, true, bulletOptions);
                bulletPool.spawn?.(this.x - 20, this.y - 5, -2, bulletSpeed * 0.9, true, bulletOptions);
                bulletPool.spawn?.(this.x + 20, this.y - 5, 2, bulletSpeed * 0.9, true, bulletOptions);
        }

        // Spread shot
        if (this.hasSpread) {
            const spreadAngle = Math.PI / 8;
            for (let i = 0; i < this.spreadCount; i++) {
                const angle = -Math.PI / 2 + spreadAngle * (i - (this.spreadCount - 1) / 2);
                bulletPool.spawn?.(this.x, this.y - 10,
                    Math.cos(angle) * 10,
                    Math.sin(angle) * 10,
                    true, { ...bulletOptions, color: '#ffff00', size: 4 });
            }
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
        this.x = canvas ? canvas.logicalWidth / 2 : 400;
        this.y = canvas ? canvas.logicalHeight - 100 : 500;
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

    draw(ctx) {
        if (!this.isAlive) return;

        ctx.save();

        // 🔥 Draw neon trail
        if (this.trail.length > 0) {
            this.trail.forEach((point, index) => {
                ctx.save();
                ctx.globalAlpha = point.life * 0.6;

                if (this.feverMode > 0) {
                    ctx.fillStyle = `hsl(${(this.rainbowHue - index * 10) % 360}, 100%, 50%)`;
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = ctx.fillStyle;
                } else {
                    ctx.fillStyle = this.shipColor || this.color;
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = this.shipColor || this.color;
                }

                const size = (this.size * 0.5) * point.life;
                ctx.beginPath();
                ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        }

        // Draw mirror ship
        if (this.mirrorShip > 0) {
            ctx.save();
            ctx.translate(this.mirrorX, this.mirrorY);
            ctx.globalAlpha = 0.7;

            ctx.strokeStyle = '#aaffff';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#aaffff';

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

        ctx.translate(this.x, this.y);

        // Determine ship color based on modes
        let activeColor = this.shipColor || config.colors.player;

        // Color effects for different modes
        if (this.feverMode > 0) {
            activeColor = `hsl(${this.rainbowHue}, 100%, 50%)`;

            for (let i = 0; i < 3; i++) {
                ctx.strokeStyle = `hsla(${(this.rainbowHue + i * 30) % 360}, 100%, 50%, ${0.3 - i * 0.1})`;
                ctx.lineWidth = 2;
                ctx.shadowBlur = 30;
                ctx.shadowColor = ctx.strokeStyle;
                ctx.beginPath();
                ctx.arc(0, 0, this.size + 10 + i * 5, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (this.omegaMode > 0) {
            activeColor = '#ff0000';
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 4;
            ctx.shadowBlur = 40;
            ctx.shadowColor = '#ff0000';
        } else if (this.ghostMode > 0) {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
            activeColor = '#aaaaff';
        } else if (this.godMode > 0) {
            activeColor = `hsl(${(Date.now() * 0.5) % 360}, 100%, 70%)`;
            ctx.shadowBlur = 50;
            ctx.shadowColor = activeColor;
        }

        this.color = activeColor;

        // Flicker when invulnerable
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.3;
        }

        // Draw ship based on ship type
        this.drawShipByType(ctx, activeColor);

        // Vortex effect ring
        if (this.vortexActive > 0) {
            ctx.save();
            const vortexRadius = 80 + Math.sin(Date.now() * 0.01) * 20;
            ctx.strokeStyle = '#80ff80';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6;
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#80ff80';
            ctx.beginPath();
            ctx.arc(0, 0, vortexRadius, 0, Math.PI * 2);
            ctx.stroke();

            for (let i = 0; i < 8; i++) {
                const angle = (Date.now() * 0.005) + (i * Math.PI / 4);
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * 40, Math.sin(angle) * 40);
                ctx.lineTo(Math.cos(angle) * vortexRadius, Math.sin(angle) * vortexRadius);
                ctx.stroke();
            }
            ctx.restore();
        }

        // 🔥 Afterburner effect when moving
        const moving = Math.abs(this.x - this.lastX) > 1 || Math.abs(this.y - this.lastY) > 1;
        if (moving) {
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

        // Weapon level indicators
        if (this.weaponLevel > 1) {
            ctx.fillStyle = '#ffff00';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffff00';
            for (let i = 0; i < this.weaponLevel - 1; i++) {
                ctx.beginPath();
                ctx.arc(-10 + i * 10, -25, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Shield display
        if (this.shieldActive && this.shield > 0) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00ffff';
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
            ctx.beginPath();
            ctx.arc(0, 0, 35, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Auto-fire indicator
        if (this.autoFire) {
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 10px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('AUTO', 0, -35);
        }

        ctx.restore();
    }

    /**
     * Draw ship based on ship type - each ship has a unique design
     */
    drawShipByType(ctx, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 30;
        ctx.shadowColor = color;

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
     * Sleek arrow design with neon glow
     */
    drawNeonFalconShip(ctx, color) {
        // Main body - sleek arrow
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(-15, 20);
        ctx.lineTo(0, 10);
        ctx.lineTo(15, 20);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = color + '44';
        ctx.fill();

        // Inner highlight
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 15;
        ctx.stroke();

        // Wing accents
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-8, 5);
        ctx.lineTo(-12, 15);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(8, 5);
        ctx.lineTo(12, 15);
        ctx.stroke();
    }

    /**
     * GLASS CANNON - Angular, aggressive design
     * Sharp edges, red accents, looks dangerous
     */
    drawGlassCannonShip(ctx, color) {
        // Sharp angular body
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(-10, -5);
        ctx.lineTo(-18, 18);
        ctx.lineTo(-5, 8);
        ctx.lineTo(0, 20);
        ctx.lineTo(5, 8);
        ctx.lineTo(18, 18);
        ctx.lineTo(10, -5);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = color + '33';
        ctx.fill();

        // Inner core - glowing energy
        ctx.fillStyle = '#ffff00';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffff00';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        // Danger stripes
        ctx.strokeStyle = '#ff4400';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-6, -10);
        ctx.lineTo(-10, 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(6, -10);
        ctx.lineTo(10, 5);
        ctx.stroke();
    }

    /**
     * HEAVY TANK - Bulky, armored design
     * Thick lines, hexagonal shape, looks sturdy
     */
    drawTankShip(ctx, color) {
        ctx.lineWidth = 4;

        // Hexagonal armored body
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(-18, -8);
        ctx.lineTo(-18, 12);
        ctx.lineTo(-10, 22);
        ctx.lineTo(10, 22);
        ctx.lineTo(18, 12);
        ctx.lineTo(18, -8);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = color + '55';
        ctx.fill();

        // Armor plates
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-12, -5);
        ctx.lineTo(-12, 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(12, -5);
        ctx.lineTo(12, 10);
        ctx.stroke();

        // Shield generator in center
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00ffff';
        ctx.beginPath();
        ctx.arc(0, 2, 6, 0, Math.PI * 2);
        ctx.stroke();

        // Front cannon
        ctx.fillStyle = color;
        ctx.fillRect(-3, -25, 6, 8);
    }

    /**
     * SPEEDSTER - Streamlined, aerodynamic design
     * Thin, elongated, built for speed
     */
    drawSpeedsterShip(ctx, color) {
        ctx.lineWidth = 2;

        // Ultra-slim body
        ctx.beginPath();
        ctx.moveTo(0, -28);
        ctx.lineTo(-6, -10);
        ctx.lineTo(-10, 15);
        ctx.lineTo(-4, 8);
        ctx.lineTo(0, 18);
        ctx.lineTo(4, 8);
        ctx.lineTo(10, 15);
        ctx.lineTo(6, -10);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = color + '44';
        ctx.fill();

        // Speed lines (motion blur effect)
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        for (let i = 1; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-4 - i * 3, 20 + i * 5);
            ctx.lineTo(-4 - i * 3, 15);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(4 + i * 3, 20 + i * 5);
            ctx.lineTo(4 + i * 3, 15);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Boost indicator
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, -15, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * RETRO CLASSIC - Pixelated 8-bit style
     * Blocky, nostalgic design
     */
    drawRetroClassicShip(ctx, color) {
        const px = 4; // Pixel size
        ctx.lineWidth = 1;
        ctx.fillStyle = color;
        ctx.shadowBlur = 15;

        // Pixelated ship shape
        const pixels = [
            [0, -5],   // Top
            [-1, -4], [0, -4], [1, -4],
            [-1, -3], [0, -3], [1, -3],
            [-2, -2], [-1, -2], [0, -2], [1, -2], [2, -2],
            [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1],
            [-3, 0], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [3, 0],
            [-3, 1], [-2, 1], [0, 1], [2, 1], [3, 1],
            [-4, 2], [-3, 2], [0, 2], [3, 2], [4, 2],
            [-4, 3], [0, 3], [4, 3],
            [-4, 4], [4, 4],
        ];

        pixels.forEach(([px_x, px_y]) => {
            ctx.fillRect(px_x * px - px/2, px_y * px - px/2, px, px);
        });

        // Outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(-2 * px, -5 * px, 4 * px, 9 * px);
    }

    /**
     * PHANTOM - Ethereal, ghostly design
     * Translucent with phase effect
     */
    drawPhantomShip(ctx, color) {
        const phase = Math.sin(Date.now() * 0.005) * 0.3;

        // Ghostly outer aura
        ctx.globalAlpha = 0.3 + phase;
        ctx.fillStyle = color;
        ctx.shadowBlur = 40;
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;

        // Ethereal body shape
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.quadraticCurveTo(-20, 0, -12, 20);
        ctx.lineTo(0, 12);
        ctx.lineTo(12, 20);
        ctx.quadraticCurveTo(20, 0, 0, -20);
        ctx.stroke();
        ctx.fillStyle = color + '22';
        ctx.fill();

        // Inner spirit core
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#ffffff';
        ctx.globalAlpha = 0.7 + phase;
        ctx.beginPath();
        ctx.arc(0, -2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Phase ripples
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.4;
        for (let i = 1; i <= 2; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, 15 + i * 8 + phase * 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    /**
     * BERSERKER - Aggressive, spiked design
     * Angular with rage indicators
     */
    drawBerserkerShip(ctx, color) {
        ctx.lineWidth = 3;

        // Angry angular body
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(-8, -12);
        ctx.lineTo(-20, -8); // Left spike
        ctx.lineTo(-12, 0);
        ctx.lineTo(-16, 18);
        ctx.lineTo(-6, 12);
        ctx.lineTo(0, 22);
        ctx.lineTo(6, 12);
        ctx.lineTo(16, 18);
        ctx.lineTo(12, 0);
        ctx.lineTo(20, -8);  // Right spike
        ctx.lineTo(8, -12);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = color + '44';
        ctx.fill();

        // Rage eye in center
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 20;
        const eyePulse = 3 + Math.sin(Date.now() * 0.01) * 1.5;
        ctx.beginPath();
        ctx.arc(0, -5, eyePulse, 0, Math.PI * 2);
        ctx.fill();

        // Battle scars
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-5, 2);
        ctx.lineTo(-8, 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(5, 2);
        ctx.lineTo(8, 10);
        ctx.stroke();
    }

    /**
     * SYNTHWAVE - Music-reactive, rhythmic design
     * Flowing lines that pulse with beat
     */
    drawSynthShip(ctx, color) {
        const beat = Math.sin(Date.now() * 0.008) * 0.5 + 0.5;
        const pulse = 1 + beat * 0.15;

        ctx.lineWidth = 2;

        // Main flowing body
        ctx.beginPath();
        ctx.moveTo(0, -20 * pulse);
        ctx.bezierCurveTo(-15, -10, -15, 10, -12, 20);
        ctx.lineTo(0, 15);
        ctx.lineTo(12, 20);
        ctx.bezierCurveTo(15, 10, 15, -10, 0, -20 * pulse);
        ctx.stroke();
        ctx.fillStyle = color + '44';
        ctx.fill();

        // Sound wave rings
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const ringPulse = (beat + i * 0.33) % 1;
            ctx.globalAlpha = 1 - ringPulse;
            ctx.beginPath();
            ctx.arc(0, 0, 10 + ringPulse * 20, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Equalizer bars
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        for (let i = -2; i <= 2; i++) {
            const barHeight = 3 + Math.sin(Date.now() * 0.01 + i) * 4;
            ctx.fillRect(i * 4 - 1.5, 5 - barHeight, 3, barHeight);
        }

        // Central music note glow
        ctx.fillStyle = color;
        ctx.shadowBlur = 25;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.arc(0, -5, 4 * pulse, 0, Math.PI * 2);
        ctx.fill();
    }
}
