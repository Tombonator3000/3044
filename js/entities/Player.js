/**
 * Geometry 3044 - Player Entity Module
 * Player class with enhanced power-up support
 */

import { CONFIG } from '../config.js';
import {
    gameState,
    particleSystem,
    bulletPool,
    soundSystem,
    keys,
    touchJoystick,
    touchButtons,
    config
} from '../globals.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = CONFIG.player.speed;
        this.size = CONFIG.player.size;
        this.color = CONFIG.colors.player;
        this.weaponLevel = 1;
        this.fireRate = CONFIG.player.fireRate;
        this.fireTimer = 0;
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        this.shield = 0;
        this.shieldActive = false;
        this.autoFire = false;
        this.canShoot = true;
        this.isAlive = true;
        this.respawnTimer = 0;
        this.respawnDelay = CONFIG.player.respawnDelay;

        // FEVER MODE properties
        this.feverMode = 0;
        this.rainbowHue = 0;

        // NEON TRAIL properties
        this.trail = [];
        this.maxTrailLength = CONFIG.player.maxTrailLength;
        this.lastX = x;
        this.lastY = y;

        // ENHANCED POWER-UP PROPERTIES
        this.hasLaser = false;
        this.laserPower = CONFIG.player.laserPower;
        this.hasHoming = false;
        this.homingStrength = CONFIG.player.homingStrength;
        this.hasSpread = false;
        this.spreadCount = CONFIG.player.spreadCount;
        this.hasPierce = false;
        this.pierceCount = CONFIG.player.pierceCount;
        this.hasBounce = false;
        this.bounceCount = CONFIG.player.bounceCount;
        this.hasChain = false;
        this.chainRange = CONFIG.player.chainRange;
        this.magnetRange = 0;
        this.ghostMode = 0;
        this.mirrorShip = 0;
        this.novaReady = false;
        this.novaPower = CONFIG.player.novaPower;
        this.vortexActive = 0;
        this.vortexPower = CONFIG.player.vortexPower;
        this.omegaMode = 0;
        this.freezePower = 0;
        this.reflectActive = 0;
        this.quantumMode = 0;
        this.quantumShots = CONFIG.player.quantumShots;
        this.plasmaMode = 0;
        this.matrixMode = 0;
        this.infinityMode = 0;
        this.infinitePower = false;
        this.godMode = 0;

        // Mirror ship properties
        this.mirrorX = x;
        this.mirrorY = y;
    }

    update() {
        // Handle death and respawn
        if (!this.isAlive) {
            this.respawnTimer--;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return;
        }

        // Store previous position for trail
        this.lastX = this.x;
        this.lastY = this.y;

        // Normal movement
        let dx = 0, dy = 0;

        if (keys['ArrowLeft'] === true || keys['a'] === true) dx -= this.speed;
        if (keys['ArrowRight'] === true || keys['d'] === true) dx += this.speed;
        if (keys['ArrowUp'] === true || keys['w'] === true) dy -= this.speed;
        if (keys['ArrowDown'] === true || keys['s'] === true) dy += this.speed;

        if (touchJoystick.active) {
            const touchDx = touchJoystick.currentX - touchJoystick.startX;
            const touchDy = touchJoystick.currentY - touchJoystick.startY;
            const dist = Math.sqrt(touchDx * touchDx + touchDy * touchDy);
            if (dist > 10) {
                dx += (touchDx / dist) * this.speed;
                dy += (touchDy / dist) * this.speed;
            }
        }

        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        this.x = Math.max(this.size, Math.min(config.width - this.size, this.x + dx));
        this.y = Math.max(this.size, Math.min(config.height - this.size, this.y + dy));

        // Update mirror ship
        if (this.mirrorShip > 0) {
            this.mirrorShip--;
            this.mirrorX = config.width - this.x;
            this.mirrorY = this.y;
        }

        // Update trail
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
            point.life -= CONFIG.effects.trail.fadeRate;
            return point.life > 0;
        });

        // Handle shooting
        this.fireTimer++;
        const currentFireRate = this.hasLaser ? Math.max(3, this.fireRate - this.laserPower) : this.fireRate;

        if (this.canShoot && (keys[' '] === true || touchButtons.fire || this.autoFire) && this.fireTimer > currentFireRate) {
            this.shoot();
            this.fireTimer = 0;
        }

        if (this.invulnerable) {
            this.invulnerableTimer--;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
            }
        }

        // Update fever mode
        if (this.feverMode > 0) {
            this.feverMode--;
            this.rainbowHue = (this.rainbowHue + 5) % 360;

            if (this.feverMode % 15 === 0 && soundSystem) {
                soundSystem.playFeverBeat();
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

        if (this.reflectActive > 0) {
            this.reflectActive--;
        }

        if (this.quantumMode > 0) {
            this.quantumMode--;
        }

        if (this.plasmaMode > 0) {
            this.plasmaMode--;
            // Plasma mode gives unlimited energy
            if (this.fireTimer > 1) this.fireTimer = 1;
        }

        if (this.matrixMode > 0) {
            this.matrixMode--;
            // Matrix mode enhances perception
            this.speed = Math.min(this.speed * 1.1, 8);
        }

        if (this.infinityMode > 0) {
            this.infinityMode--;
        }

        if (this.godMode > 0) {
            this.godMode--;
            if (this.godMode <= 0) {
                this.invulnerable = false;
                this.infinitePower = false;
                this.speed = CONFIG.player.speed;
            }
        }

        // Vortex effect - attract enemies and power-ups
        if (this.vortexActive > 0) {
            this.vortexActive--;
            this.applyEnhancedVortexEffect();
        }

        // Enhanced Omega mode effects
        if (this.omegaMode > 0) {
            this.omegaMode--;
            if (this.omegaMode % 8 === 0) {
                this.createEnhancedOmegaPulse();
            }
        }

        // Magnet effect for power-ups
        if (this.magnetRange > 0) {
            this.applyMagnetEffect();
        }
    }

    shoot() {
        const hasCombo = gameState.powerUpManager &&
            gameState.powerUpManager.comboEffects.some(c => c.name === 'PULSE CANNON');

        if (hasCombo) {
            // Pulse cannon - rapid laser beams
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    if (bulletPool) {
                        bulletPool.get(this.x, this.y - 20 - i * 5, 0, -18, true);
                    }
                }, i * 15);
            }
        } else if (this.quantumMode > 0) {
            // Quantum shots - multiple parallel dimensions
            for (let i = 0; i < this.quantumShots; i++) {
                const offsetX = (i - (this.quantumShots - 1) / 2) * 15;
                if (bulletPool) {
                    const bullet = bulletPool.get(this.x + offsetX, this.y - 20, 0, -12, true);
                    if (bullet) {
                        bullet.isQuantum = true;
                        bullet.quantumPhase = i;
                        bullet.damage = 3;
                    }
                }
            }
        } else if (this.hasChain) {
            // Chain lightning shots
            if (bulletPool) {
                const bullet = bulletPool.get(this.x, this.y - 20, 0, -10, true);
                if (bullet) {
                    bullet.isChain = true;
                    bullet.chainRange = this.chainRange;
                    bullet.chainCount = 3;
                    bullet.damage = 2;
                }
            }
        } else if (this.hasBounce) {
            // Bouncing projectiles
            if (bulletPool) {
                const bullet = bulletPool.get(this.x, this.y - 20, 0, -10, true);
                if (bullet) {
                    bullet.isBouncing = true;
                    bullet.bounceCount = this.bounceCount;
                    bullet.damage = 2;
                }
            }
        } else if (this.hasSpread) {
            // Enhanced spread shot
            const spreadAngle = Math.PI / 6;
            const count = Math.min(this.spreadCount + (this.weaponLevel - 1), 9);
            for (let i = 0; i < count; i++) {
                const angle = -spreadAngle + (i * (spreadAngle * 2) / (count - 1));
                if (bulletPool) {
                    bulletPool.get(
                        this.x + Math.sin(angle) * 15,
                        this.y - 20,
                        Math.sin(angle) * 8,
                        -10 - Math.cos(angle) * 3,
                        true
                    );
                }
            }
        } else if (this.hasLaser) {
            // Enhanced laser beam
            const beamCount = Math.min(this.laserPower + Math.floor(this.weaponLevel / 2), 6);
            for (let i = 0; i < beamCount; i++) {
                const offsetX = (i - (beamCount - 1) / 2) * 8;
                if (bulletPool) {
                    const bullet = bulletPool.get(this.x + offsetX, this.y - 20, 0, -18, true);
                    if (bullet) {
                        bullet.isLaser = true;
                        bullet.damage = 2 + Math.floor(this.laserPower / 2);
                    }
                }
            }
        } else {
            // Enhanced normal weapon levels
            switch(this.weaponLevel) {
                case 1:
                    if (bulletPool) bulletPool.get(this.x, this.y - 20, 0, -12, true);
                    break;
                case 2:
                    if (bulletPool) {
                        bulletPool.get(this.x - 12, this.y - 20, 0, -12, true);
                        bulletPool.get(this.x + 12, this.y - 20, 0, -12, true);
                    }
                    break;
                case 3:
                    if (bulletPool) {
                        bulletPool.get(this.x, this.y - 20, 0, -12, true);
                        bulletPool.get(this.x - 18, this.y - 20, -2, -12, true);
                        bulletPool.get(this.x + 18, this.y - 20, 2, -12, true);
                    }
                    break;
                case 4:
                    if (bulletPool) {
                        bulletPool.get(this.x - 8, this.y - 20, 0, -12, true);
                        bulletPool.get(this.x + 8, this.y - 20, 0, -12, true);
                        bulletPool.get(this.x - 20, this.y - 20, -3, -12, true);
                        bulletPool.get(this.x + 20, this.y - 20, 3, -12, true);
                    }
                    break;
                case 5:
                    if (bulletPool) {
                        bulletPool.get(this.x, this.y - 20, 0, -12, true);
                        bulletPool.get(this.x - 12, this.y - 20, -1, -12, true);
                        bulletPool.get(this.x + 12, this.y - 20, 1, -12, true);
                        bulletPool.get(this.x - 24, this.y - 20, -4, -12, true);
                        bulletPool.get(this.x + 24, this.y - 20, 4, -12, true);
                    }
                    break;
            }
        }

        // Mirror ship shooting (enhanced)
        if (this.mirrorShip > 0 && bulletPool) {
            const mirrorCount = this.godMode > 0 ? 3 : 1;
            for (let i = 0; i < mirrorCount; i++) {
                const offsetY = i * -10;
                bulletPool.get(this.mirrorX, this.mirrorY - 20 + offsetY, 0, -12, true);
            }
        }

        // God mode multi-directional shooting
        if (this.godMode > 0) {
            const directions = 8;
            for (let i = 0; i < directions; i++) {
                const angle = (Math.PI * 2 * i) / directions;
                if (bulletPool) {
                    bulletPool.get(
                        this.x + Math.cos(angle) * 20,
                        this.y + Math.sin(angle) * 20,
                        Math.cos(angle) * 8,
                        Math.sin(angle) * 8,
                        true
                    );
                }
            }
        }

        // Infinity mode continuous fire
        if (this.infinityMode > 0 || this.infinitePower) {
            setTimeout(() => {
                if ((this.infinityMode > 0 || this.infinitePower) && bulletPool) {
                    bulletPool.get(this.x + Math.random() * 40 - 20, this.y - 25,
                                 (Math.random() - 0.5) * 4, -15, true);
                }
            }, 50);
        }

        // Enhanced nova blast
        if (this.novaReady && keys[' '] === true) {
            this.triggerEnhancedNova();
            this.novaReady = false;
        }

        if (particleSystem) {
            particleSystem.addMuzzleFlash(this.x, this.y - 20, -Math.PI/2, this.color);
        }
        if (soundSystem) {
            soundSystem.playShoot();
        }
    }

    applyEnhancedVortexEffect() {
        if (!gameState) return;

        const baseRange = 200 + (this.vortexPower * 50);

        // Attract enemies with enhanced force
        gameState.enemies.forEach(enemy => {
            if (enemy.active) {
                const dx = this.x - enemy.x;
                const dy = this.y - enemy.y;
                const dist = Math.hypot(dx, dy);

                if (dist < baseRange) {
                    const force = Math.max(1, (baseRange - dist) / baseRange * (3 + this.vortexPower));
                    const angle = Math.atan2(dy, dx);
                    enemy.x += Math.cos(angle) * force;
                    enemy.y += Math.sin(angle) * force;

                    // Damage enemies that get too close
                    if (dist < 50 && Math.random() < 0.1) {
                        enemy.takeDamage(1);
                        if (particleSystem) {
                            particleSystem.addExplosion(enemy.x, enemy.y, '#80ff80', 8);
                        }
                    }
                }
            }
        });

        // Attract power-ups with stronger force
        gameState.powerUps.forEach(powerUp => {
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

        // Enhanced visual vortex effect
        if (Math.random() < 0.3) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 60 + Math.random() * baseRange;
            const particleX = this.x + Math.cos(angle) * radius;
            const particleY = this.y + Math.sin(angle) * radius;

            if (particleSystem) {
                particleSystem.particles.push({
                    x: particleX,
                    y: particleY,
                    vx: -Math.cos(angle) * 5,
                    vy: -Math.sin(angle) * 5,
                    color: '#80ff80',
                    life: 20,
                    maxLife: 20,
                    size: 2,
                    active: true,
                    update() {
                        this.x += this.vx;
                        this.y += this.vy;
                        this.life--;
                        if (this.life <= 0) this.active = false;
                    },
                    draw(ctx) {
                        const alpha = this.life / this.maxLife;
                        ctx.save();
                        ctx.globalAlpha = alpha;
                        ctx.fillStyle = this.color;
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = this.color;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }
                });
            }
        }
    }

    createEnhancedOmegaPulse() {
        // Enhanced omega mode creates more destructive pulses
        if (gameState && gameState.particles) {
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

                        // Damage enemies in range
                        if (gameState && gameState.enemies && this.life % 5 === 0) {
                            gameState.enemies.forEach(enemy => {
                                if (enemy.active) {
                                    const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                                    if (dist < this.radius && dist > this.radius - 20) {
                                        enemy.takeDamage(this.damage);
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
    }

    triggerEnhancedNova() {
        // Enhanced nova with variable power
        const baseRadius = 300;
        const maxRadius = baseRadius * (this.novaPower + (this.godMode > 0 ? 2 : 0));

        if (gameState && gameState.particles) {
            gameState.particles.push({
                x: this.x,
                y: this.y,
                radius: 0,
                maxRadius: maxRadius,
                life: 80,
                maxLife: 80,
                active: true,
                power: this.novaPower,
                waves: this.godMode > 0 ? 3 : 1,
                currentWave: 0,
                update() {
                    this.radius += (this.maxRadius / this.maxLife) * 2;
                    this.life--;

                    // Multi-wave effect for god mode
                    if (this.currentWave < this.waves - 1 && this.radius >= this.maxRadius * 0.8) {
                        this.currentWave++;
                        this.radius = 0;
                        this.life = this.maxLife;
                    }

                    if (this.life <= 0) this.active = false;
                },
                draw(ctx) {
                    const alpha = this.life / this.maxLife;
                    ctx.save();

                    // Multiple colored rings
                    const colors = ['#ffff00', '#ff8800', '#ff4400'];
                    colors.forEach((color, index) => {
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 6 - index;
                        ctx.globalAlpha = alpha * (1 - index * 0.2);
                        ctx.shadowBlur = 40;
                        ctx.shadowColor = color;
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.radius - (index * 10), 0, Math.PI * 2);
                        ctx.stroke();
                    });

                    ctx.restore();
                }
            });
        }

        // Enhanced damage area
        if (gameState && gameState.enemies) {
            gameState.enemies.forEach(enemy => {
                if (enemy.active) {
                    const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                    if (dist < maxRadius) {
                        const damage = Math.ceil((4 + this.novaPower) * (1 - dist / maxRadius));
                        enemy.takeDamage(damage);
                    }
                }
            });
        }
    }

    applyMagnetEffect() {
        if (!gameState || !gameState.powerUps) return;

        gameState.powerUps.forEach(powerUp => {
            if (powerUp.active) {
                const dx = this.x - powerUp.x;
                const dy = this.y - powerUp.y;
                const dist = Math.hypot(dx, dy);

                if (dist < this.magnetRange) {
                    const force = (this.magnetRange - dist) / this.magnetRange * 3;
                    const angle = Math.atan2(dy, dx);
                    powerUp.x += Math.cos(angle) * force;
                    powerUp.y += Math.sin(angle) * force;
                }
            }
        });
    }

    draw(ctx) {
        ctx.save();

        // Draw neon trail
        if (this.trail.length > 0) {
            this.trail.forEach((point, index) => {
                ctx.save();
                ctx.globalAlpha = point.life * 0.6;

                // Rainbow trail in fever mode
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

        // Rainbow effect in fever mode
        if (this.feverMode > 0) {
            this.color = `hsl(${this.rainbowHue}, 100%, 50%)`;

            // Extra rainbow aura
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
            // Omega mode red glow
            this.color = '#ff0000';
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 4;
            ctx.shadowBlur = 40;
            ctx.shadowColor = '#ff0000';
        } else if (this.ghostMode > 0) {
            // Ghost mode transparency
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
            this.color = '#aaaaff';
        } else {
            this.color = config.colors.player;
        }

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 30;
        ctx.shadowColor = this.color;
        ctx.globalAlpha = Math.min(ctx.globalAlpha, 0.9);

        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(-15, 20);
        ctx.lineTo(0, 10);
        ctx.lineTo(15, 20);
        ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = this.color + '44';
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.stroke();

        // Draw vortex effect
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

            // Swirling lines
            for (let i = 0; i < 8; i++) {
                const angle = (Date.now() * 0.005) + (i * Math.PI / 4);
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * 40, Math.sin(angle) * 40);
                ctx.lineTo(Math.cos(angle) * vortexRadius, Math.sin(angle) * vortexRadius);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Afterburner effect when moving
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

        if (this.autoFire) {
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 10px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('AUTO', 0, -35);
        }

        ctx.restore();
    }

    takeDamage() {
        // Ignore damage if already invulnerable or in special modes
        if (this.invulnerable || this.ghostMode > 0 || this.godMode > 0 || this.infinityMode > 0 || this.infinitePower) {
            return false;
        }
        // Shield absorbs a hit without consuming a life
        if (this.shieldActive && this.shield > 0) {
            this.shield--;
            if (this.shield <= 0) {
                this.shieldActive = false;
            }
            // Play shield hit sound if available
            try {
                if (soundSystem && soundSystem.playShieldHit) {
                    soundSystem.playShieldHit();
                }
            } catch (e) {
                /* ignore sound errors */
            }
            return false;
        }
        // If already dead, ignore further damage
        if (!this.isAlive) {
            return false;
        }
        // Trigger death: set flags and timers
        this.isAlive = false;
        this.respawnTimer = this.respawnDelay;
        this.invulnerable = true;
        this.invulnerableTimer = 120;
        // Explosion and sound effects on death
        try {
            if (particleSystem && typeof particleSystem.addExplosion === 'function') {
                particleSystem.addExplosion(this.x, this.y, '#ff6666', 25);
            }
            if (soundSystem) {
                if (soundSystem.playExplosion) soundSystem.playExplosion();
                if (soundSystem.playVoiceSample) soundSystem.playVoiceSample('OOPS');
            }
        } catch (e) {
            /* ignore particle/sound errors */
        }
        return true;
    }

    respawn() {
        // Reset position to bottom centre and clear motion
        this.x = config.width / 2;
        this.y = config.height - 80;
        this.fireTimer = 0;
        this.isAlive = true;
        // Brief invulnerability after respawn
        this.invulnerable = true;
        this.invulnerableTimer = 120;
        // Remove any remaining shield
        this.shieldActive = false;
        this.shield = 0;
    }
}
