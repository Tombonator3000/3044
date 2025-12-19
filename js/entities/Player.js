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
    }

    update(keys, canvas, bulletPool, gameState, touchJoystick, touchButtons, particleSystem, soundSystem) {
        // Handle death and respawn
        if (!this.isAlive) {
            this.respawnTimer--;
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

        if (keys['ArrowLeft'] === true || keys['a'] === true || keys['A'] === true) dx -= this.speed;
        if (keys['ArrowRight'] === true || keys['d'] === true || keys['D'] === true) dx += this.speed;
        if (keys['ArrowUp'] === true || keys['w'] === true || keys['W'] === true) dy -= this.speed;
        if (keys['ArrowDown'] === true || keys['s'] === true || keys['S'] === true) dy += this.speed;

        // Touch joystick support
        if (touchJoystick && touchJoystick.active) {
            const touchDx = touchJoystick.currentX - touchJoystick.startX;
            const touchDy = touchJoystick.currentY - touchJoystick.startY;
            const dist = Math.sqrt(touchDx * touchDx + touchDy * touchDy);
            if (dist > 10) {
                dx += (touchDx / dist) * this.speed;
                dy += (touchDy / dist) * this.speed;
            }
        }

        // Diagonal movement normalization
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        // Apply movement with bounds
        this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x + dx));
        this.y = Math.max(this.size, Math.min(canvas.height - this.size, this.y + dy));

        // Update mirror ship
        if (this.mirrorShip > 0) {
            this.mirrorShip--;
            this.mirrorX = canvas.width - this.x;
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
            point.life -= 0.1;
            return point.life > 0;
        });

        // Handle shooting
        this.fireTimer++;
        const currentFireRate = this.hasLaser ? Math.max(3, this.fireRate - this.laserPower) : this.fireRate;

        const shooting = keys[' '] === true || keys['Space'] === true ||
                        (touchButtons && touchButtons.fire) || this.autoFire;

        if (this.canShoot && shooting && this.fireTimer > currentFireRate) {
            this.shoot(bulletPool, gameState, soundSystem);
            this.fireTimer = 0;
        }

        // Update invulnerability
        if (this.invulnerable) {
            this.invulnerableTimer--;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
            }
        }

        // 🌈 Update fever mode
        if (this.feverMode > 0) {
            this.feverMode--;
            this.rainbowHue = (this.rainbowHue + 5) % 360;

            if (this.feverMode % 15 === 0 && soundSystem) {
                soundSystem.playFeverBeat?.();
            }

            if (this.feverMode <= 0) {
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
            this.ghostMode--;
            if (this.ghostMode <= 0) {
                this.invulnerable = false;
            }
        }

        if (this.reflectActive > 0) this.reflectActive--;
        if (this.quantumMode > 0) this.quantumMode--;

        if (this.plasmaMode > 0) {
            this.plasmaMode--;
            if (this.fireTimer > 1) this.fireTimer = 1;
        }

        if (this.matrixMode > 0) {
            this.matrixMode--;
            this.speed = Math.min(this.speed * 1.1, 8);
        }

        if (this.infinityMode > 0) this.infinityMode--;

        if (this.godMode > 0) {
            this.godMode--;
            if (this.godMode <= 0) {
                this.invulnerable = false;
                this.infinitePower = false;
                this.speed = 5.5;
            }
        }

        // Vortex effect
        if (this.vortexActive > 0) {
            this.vortexActive--;
            this.applyVortexEffect(gameState, particleSystem);
        }

        // Omega mode effects
        if (this.omegaMode > 0) {
            this.omegaMode--;
            if (this.omegaMode % 8 === 0) {
                this.createOmegaPulse(gameState);
            }
        }

        // Magnet effect
        if (this.magnetRange > 0) {
            this.applyMagnetEffect(gameState);
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

    applyVortexEffect(gameState, particleSystem) {
        if (!gameState) return;

        const baseRange = 200 + (this.vortexPower * 50);

        // Attract enemies
        gameState.enemies?.forEach(enemy => {
            if (enemy.active) {
                const dx = this.x - enemy.x;
                const dy = this.y - enemy.y;
                const dist = Math.hypot(dx, dy);

                if (dist < baseRange) {
                    const force = Math.max(1, (baseRange - dist) / baseRange * (3 + this.vortexPower));
                    const angle = Math.atan2(dy, dx);
                    enemy.x += Math.cos(angle) * force;
                    enemy.y += Math.sin(angle) * force;

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
                    powerUp.x += Math.cos(angle) * force;
                    powerUp.y += Math.sin(angle) * force;
                }
            }
        });
    }

    applyMagnetEffect(gameState) {
        if (!gameState?.powerUps) return;

        gameState.powerUps.forEach(powerUp => {
            if (powerUp.active) {
                const dx = this.x - powerUp.x;
                const dy = this.y - powerUp.y;
                const dist = Math.hypot(dx, dy);

                if (dist < this.magnetRange && dist > 0) {
                    const force = (this.magnetRange - dist) / this.magnetRange * 5;
                    powerUp.x += (dx / dist) * force;
                    powerUp.y += (dy / dist) * force;
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
        this.x = canvas ? canvas.width / 2 : 400;
        this.y = canvas ? canvas.height - 100 : 500;
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
                    ctx.fillStyle = this.color;
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = this.color;
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

        // Color effects for different modes
        if (this.feverMode > 0) {
            this.color = `hsl(${this.rainbowHue}, 100%, 50%)`;

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
            this.color = '#ff0000';
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 4;
            ctx.shadowBlur = 40;
            ctx.shadowColor = '#ff0000';
        } else if (this.ghostMode > 0) {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
            this.color = '#aaaaff';
        } else if (this.godMode > 0) {
            this.color = `hsl(${(Date.now() * 0.5) % 360}, 100%, 70%)`;
            ctx.shadowBlur = 50;
            ctx.shadowColor = this.color;
        } else {
            this.color = config.colors.player;
        }

        // Ship body
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 30;
        ctx.shadowColor = this.color;

        // Flicker when invulnerable
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.3;
        }

        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(-15, 20);
        ctx.lineTo(0, 10);
        ctx.lineTo(15, 20);
        ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = this.color + '44';
        ctx.fill();

        // Inner highlight
        ctx.globalAlpha = Math.min(ctx.globalAlpha || 1, 0.9);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.stroke();

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
}
