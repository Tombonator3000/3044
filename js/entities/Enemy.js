/**
 * Geometry 3044 - Enemy Entity Module
 * Enemy class with advanced AI and roles
 */

import { CONFIG } from '../config.js';
import {
    gameState,
    particleSystem,
    enemyBulletPool,
    config
} from '../globals.js';

export class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;
        this.rotation = 0;
        this.moveTimer = 0;
        this.fireTimer = 0;
        this.glowPulse = 0;
        this.smokeTrail = [];
        this.lastPlayerX = 0;
        this.lastPlayerY = 0;
        this.alertLevel = 0;
        this.formationRole = 'none';
        this.communicationTimer = 0;

        const currentWave = (gameState && gameState.wave) ? gameState.wave : 1;

        // Base stats influenced by wave
        const waveMultiplier = Math.min(1 + (currentWave * 0.1), 3.0);
        const intelligenceLevel = Math.min(Math.floor(currentWave / 3), 5);

        switch(type) {
            case 'triangle':
                this.setupTriangleScout(currentWave, intelligenceLevel);
                break;
            case 'square':
                this.setupSquareHeavy(currentWave, intelligenceLevel);
                break;
            case 'pentagon':
                this.setupPentagonSniper(currentWave, intelligenceLevel);
                break;
            case 'divebomber':
                this.setupDiveBomber(currentWave, intelligenceLevel);
                break;
            case 'sinewave':
                this.setupSineWaveElite(currentWave, intelligenceLevel);
                break;
        }

        // Store original values for fever mode
        this.originalBehavior = this.behavior;
        this.originalColor = this.color;
        this.originalSpeed = this.speed;
        this.intelligence = intelligenceLevel;
        this.reactionTime = Math.max(10, 60 - (intelligenceLevel * 10));
    }

    setupTriangleScout(wave, intelligence) {
        this.sides = 3;
        this.size = 15;
        this.hp = 1;
        this.speed = Math.max(1.8, 2.2 + (wave * 0.18));
        this.points = 100;
        this.fireRate = Math.max(35, 85 - (wave * 5));
        this.bulletSpeed = Math.max(3.5, 4.5 + (wave * 0.12));
        this.color = CONFIG.colors.enemyTriangle;
        this.behavior = intelligence >= 2 ? 'scout_aggressive' : 'aggressive';
        this.role = 'scout';
        this.detectionRange = 150 + (intelligence * 20);
        this.canCallReinforcements = intelligence >= 3;
    }

    setupSquareHeavy(wave, intelligence) {
        this.sides = 4;
        this.size = 22;
        this.hp = 2 + Math.floor(wave / 4);
        this.speed = Math.max(0.8, 1.2 + (wave * 0.08));
        this.points = 200;
        this.fireRate = Math.max(30, 70 - (wave * 4));
        this.bulletSpeed = Math.max(4, 5.5 + (wave * 0.1));
        this.color = CONFIG.colors.enemySquare;
        this.behavior = intelligence >= 3 ? 'heavy_tactical' : 'zigzag';
        this.role = 'heavy';
        this.canBlock = intelligence >= 2;
        this.shieldTimer = 0;
        this.zigzagTimer = 0;
    }

    setupPentagonSniper(wave, intelligence) {
        this.sides = 5;
        this.size = 25;
        this.hp = 3 + Math.floor(wave / 3);
        this.speed = Math.max(0.6, 1.0 + (wave * 0.06));
        this.points = 300;
        this.fireRate = Math.max(80, 130 - (wave * 6));
        this.bulletSpeed = Math.max(6, 8 + (wave * 0.15));
        this.color = CONFIG.colors.enemyPentagon;
        this.behavior = intelligence >= 4 ? 'sniper_elite' : 'chaser';
        this.role = 'sniper';
        this.aimPrediction = intelligence >= 3;
        this.chargeTime = 0;
        this.isCharging = false;
    }

    setupDiveBomber(wave, intelligence) {
        this.sides = 3;
        this.size = 18;
        this.hp = 1;
        this.speed = Math.max(2.8, 3.2 + (wave * 0.25));
        this.points = 150;
        this.fireRate = 999;
        this.bulletSpeed = 0;
        this.color = '#ff3300';
        this.behavior = intelligence >= 2 ? 'kamikaze_smart' : 'kamikaze';
        this.role = 'kamikaze';
        this.isDiveBomber = true;
        this.explosionRadius = 60 + (intelligence * 15);
        this.updateTargetTimer = 0;

        if (gameState && gameState.player) {
            this.targetX = gameState.player.x;
            this.targetY = gameState.player.y;
        }
    }

    setupSineWaveElite(wave, intelligence) {
        this.sides = 4;
        this.size = 24;
        this.hp = 2 + Math.floor(wave / 3);
        this.speed = Math.max(1.4, 2.0 + (wave * 0.12));
        this.points = 250;
        this.fireRate = Math.max(35, 70 - (wave * 4));
        this.bulletSpeed = Math.max(4.5, 6 + (wave * 0.12));
        this.color = '#9900ff';
        this.behavior = intelligence >= 3 ? 'sine_tactical' : 'sine_wave';
        this.role = 'elite';
        this.sineTimer = Math.random() * Math.PI * 2;
        this.amplitude = 60 + Math.random() * 40;
        this.centerX = this.x;
        this.canTeleport = intelligence >= 4;
        this.teleportCooldown = 0;
    }

    update() {
        if (!this.active) return;

        this.moveTimer++;
        this.fireTimer++;
        this.rotation += 0.02;
        this.glowPulse += 0.05;
        this.communicationTimer++;

        // Update player tracking for intelligent enemies
        if (gameState && gameState.player && this.intelligence >= 1) {
            this.lastPlayerX = gameState.player.x;
            this.lastPlayerY = gameState.player.y;

            const distToPlayer = Math.hypot(this.x - gameState.player.x, this.y - gameState.player.y);
            if (distToPlayer < this.detectionRange) {
                this.alertLevel = Math.min(this.alertLevel + 1, 100);

                // Smart enemies communicate threats to nearby allies
                if (this.canCallReinforcements && this.communicationTimer > 120 && Math.random() < 0.1) {
                    this.alertNearbyEnemies();
                    this.communicationTimer = 0;
                }
            } else {
                this.alertLevel = Math.max(this.alertLevel - 0.5, 0);
            }
        }

        // Generate smoke trail for dive bombers (with limit)
        if (this.isDiveBomber && Math.random() < 0.5 && this.smokeTrail.length < 20) {
            this.smokeTrail.push({
                x: this.x + (Math.random() - 0.5) * 10,
                y: this.y + (Math.random() - 0.5) * 10,
                life: 40,
                size: Math.random() * 4 + 2,
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * 3 + 1
            });
        }

        // Update smoke trail (optimized)
        for (let i = this.smokeTrail.length - 1; i >= 0; i--) {
            const smoke = this.smokeTrail[i];
            smoke.x += smoke.vx;
            smoke.y += smoke.vy;
            smoke.life--;
            smoke.vy += 0.1;
            if (smoke.life <= 0) {
                this.smokeTrail.splice(i, 1);
            }
        }

        // FEVER MODE - enemies flee!
        if (this.behavior === 'flee' && gameState && gameState.player) {
            const dx = this.x - gameState.player.x;
            const dy = this.y - gameState.player.y;
            const dist = Math.hypot(dx, dy);

            if (dist < 200) {
                const angle = Math.atan2(dy, dx);
                this.x += Math.cos(angle) * this.speed * 1.5;
                this.y += Math.sin(angle) * this.speed * 1.5;
            } else {
                this.y += this.speed;
            }
            return;
        }

        // Advanced AI behaviors based on role and intelligence
        switch(this.behavior) {
            case 'scout_aggressive':
                this.updateScoutBehavior();
                break;
            case 'heavy_tactical':
                this.updateHeavyBehavior();
                break;
            case 'sniper_elite':
                this.updateSniperBehavior();
                break;
            case 'kamikaze_smart':
                this.updateSmartKamikazeBehavior();
                break;
            case 'sine_tactical':
                this.updateTacticalSineBehavior();
                break;
            default:
                this.updateBasicBehavior();
                break;
        }

        // Shooting logic (except for kamikaze)
        if (!this.isDiveBomber && this.fireTimer > this.fireRate) {
            this.attemptFire();
            this.fireTimer = 0;
        }

        // Additional random shots based on intelligence
        if (!this.isDiveBomber && Math.random() < 0.002 * (this.intelligence + 1)) {
            this.attemptFire();
        }

        // Cleanup when off-screen
        if (this.y > config.height + 50 || this.x < -50 || this.x > config.width + 50) {
            this.active = false;
        }
    }

    // Advanced AI Behavior Methods
    updateScoutBehavior() {
        // Scouts move fast and try to flank the player
        this.y += this.speed;

        if (gameState && gameState.player && this.alertLevel > 20) {
            const dx = gameState.player.x - this.x;
            const dy = gameState.player.y - this.y;

            // Try to position for flanking
            if (Math.abs(dx) > 100) {
                this.x += Math.sign(dx) * Math.min(3, Math.abs(dx * 0.03));
            } else {
                // Strafe to avoid being directly in front
                this.x += Math.sin(this.moveTimer * 0.1) * 2;
            }
        }
    }

    updateHeavyBehavior() {
        // Heavy units move slower but more strategically
        this.y += this.speed * 0.8;
        this.zigzagTimer += 0.05;

        // Defensive positioning
        if (gameState && gameState.player) {
            const dx = gameState.player.x - this.x;

            // Try to stay in firing lanes
            if (Math.abs(dx) < 50) {
                this.x += Math.sin(this.zigzagTimer) * 1.5;
            } else {
                this.x += Math.sign(dx) * Math.min(1.5, Math.abs(dx * 0.015));
            }

            // Shield behavior for advanced heavies
            if (this.canBlock && this.intelligence >= 3) {
                this.shieldTimer++;
                if (this.shieldTimer > 180) {
                    this.temporaryShield = 60;
                    this.shieldTimer = 0;
                }
            }
        }
    }

    updateSniperBehavior() {
        // Snipers try to maintain optimal range
        this.y += this.speed * 0.6;

        if (gameState && gameState.player) {
            const distToPlayer = Math.hypot(this.x - gameState.player.x, this.y - gameState.player.y);
            const optimalRange = 200;

            if (distToPlayer < optimalRange * 0.7) {
                // Too close, back away
                const dx = this.x - gameState.player.x;
                const dy = this.y - gameState.player.y;
                const angle = Math.atan2(dy, dx);
                this.x += Math.cos(angle) * this.speed * 0.5;
                this.y += Math.sin(angle) * this.speed * 0.3;
            } else if (distToPlayer > optimalRange) {
                // Too far, close in slowly
                const dx = gameState.player.x - this.x;
                this.x += Math.sign(dx) * Math.min(1, Math.abs(dx * 0.01));
            }

            // Charge powerful shots
            if (this.fireTimer > this.fireRate * 0.7 && !this.isCharging) {
                this.isCharging = true;
                this.chargeTime = 0;
            }

            if (this.isCharging) {
                this.chargeTime++;
            }
        }
    }

    updateSmartKamikazeBehavior() {
        // Smart kamikaze predicts player movement
        if (gameState && gameState.player) {
            this.updateTargetTimer++;

            // Update target prediction more frequently
            if (this.updateTargetTimer > this.reactionTime) {
                const playerVx = gameState.player.x - this.lastPlayerX;
                const playerVy = gameState.player.y - this.lastPlayerY;

                // Predict where player will be
                const predictionTime = 30;
                this.targetX = gameState.player.x + playerVx * predictionTime;
                this.targetY = gameState.player.y + playerVy * predictionTime;

                this.updateTargetTimer = 0;
            }

            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const angle = Math.atan2(dy, dx);

            // Accelerate as we get closer
            const distToTarget = Math.hypot(dx, dy);
            const speedMultiplier = Math.min(2.5, 1 + (200 - distToTarget) / 100);

            this.x += Math.cos(angle) * this.speed * speedMultiplier;
            this.y += Math.sin(angle) * this.speed * speedMultiplier;
            this.rotation += 0.15;
        }
    }

    updateTacticalSineBehavior() {
        // Tactical sine wave with teleportation and unpredictable patterns
        this.y += this.speed;
        this.sineTimer += 0.08 + (this.alertLevel * 0.001);

        // Dynamic amplitude based on threat level
        const dynamicAmplitude = this.amplitude + (this.alertLevel * 0.5);
        this.x = this.centerX + Math.sin(this.sineTimer) * dynamicAmplitude;

        // Advanced sine users can teleport
        if (this.canTeleport) {
            this.teleportCooldown--;
            if (this.teleportCooldown <= 0 && this.alertLevel > 50 && Math.random() < 0.02) {
                this.performTeleport();
                this.teleportCooldown = 300;
            }
        }

        // Change sine pattern occasionally
        if (Math.random() < 0.005) {
            this.amplitude = 40 + Math.random() * 80;
            this.centerX = Math.max(50, Math.min(config.width - 50, this.x));
        }
    }

    updateBasicBehavior() {
        // Fallback to original behaviors
        switch(this.originalBehavior) {
            case 'aggressive':
                this.y += this.speed;
                if (gameState && gameState.player) {
                    const dx = gameState.player.x - this.x;
                    this.x += Math.sign(dx) * Math.min(2, Math.abs(dx * 0.02));
                }
                break;

            case 'zigzag':
                this.y += this.speed;
                this.zigzagTimer += 0.1;
                this.x += Math.sin(this.zigzagTimer) * 4;
                break;

            case 'chaser':
                if (gameState && gameState.player) {
                    const dx = gameState.player.x - this.x;
                    const dy = gameState.player.y - this.y;
                    const angle = Math.atan2(dy, dx);
                    this.x += Math.cos(angle) * this.speed;
                    this.y += Math.sin(angle) * this.speed * 0.7;
                } else {
                    this.y += this.speed;
                }
                break;

            case 'sine_wave':
                this.y += this.speed;
                this.sineTimer += 0.08;
                this.x = this.centerX + Math.sin(this.sineTimer) * this.amplitude;
                break;

            case 'kamikaze':
                if (this.targetX !== undefined && this.targetY !== undefined) {
                    const dx = this.targetX - this.x;
                    const dy = this.targetY - this.y;
                    const angle = Math.atan2(dy, dx);
                    this.x += Math.cos(angle) * this.speed;
                    this.y += Math.sin(angle) * this.speed;
                    this.rotation += 0.1;
                } else {
                    this.y += this.speed * 1.5;
                }
                break;

            default:
                this.y += this.speed;
        }
    }

    // Support Methods
    alertNearbyEnemies() {
        if (!gameState || !gameState.enemies) return;

        const alertRadius = 120;
        gameState.enemies.forEach(enemy => {
            if (enemy !== this && enemy.active) {
                const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (dist < alertRadius) {
                    enemy.alertLevel = Math.min(enemy.alertLevel + 30, 100);
                    enemy.speed *= 1.1; // Slight speed boost when alerted
                }
            }
        });
    }

    performTeleport() {
        // Teleport to a strategic position
        if (particleSystem) {
            // Teleport out effect
            for (let i = 0; i < 15; i++) {
                const angle = (Math.PI * 2 * i) / 15;
                particleSystem.particles.push({
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(angle) * 6,
                    vy: Math.sin(angle) * 6,
                    color: this.color,
                    life: 20,
                    maxLife: 20,
                    size: 3,
                    active: true,
                    update() {
                        this.x += this.vx;
                        this.y += this.vy;
                        this.vx *= 0.9;
                        this.vy *= 0.9;
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

        // Choose new position strategically
        const newX = Math.max(50, Math.min(config.width - 50,
            this.lastPlayerX + (Math.random() - 0.5) * 200));
        const newY = Math.max(50, Math.min(this.y + 100,
            this.y + (Math.random() - 0.5) * 100));

        this.x = newX;
        this.y = newY;
        this.centerX = newX;

        // Teleport in effect
        if (particleSystem) {
            setTimeout(() => {
                for (let i = 0; i < 15; i++) {
                    const angle = (Math.PI * 2 * i) / 15;
                    particleSystem.particles.push({
                        x: this.x + Math.cos(angle) * 20,
                        y: this.y + Math.sin(angle) * 20,
                        vx: -Math.cos(angle) * 6,
                        vy: -Math.sin(angle) * 6,
                        color: this.color,
                        life: 20,
                        maxLife: 20,
                        size: 3,
                        active: true,
                        update() {
                            this.x += this.vx;
                            this.y += this.vy;
                            this.vx *= 0.9;
                            this.vy *= 0.9;
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
            }, 100);
        }
    }

    attemptFire() {
        if (!gameState || !gameState.player || this.behavior === 'flee') return;

        // Mini-bosses use a special firing pattern
        if (this.isMiniBoss && enemyBulletPool) {
            const bullets = 8 + Math.min(this.intelligence * 2, 8);
            for (let i = 0; i < bullets; i++) {
                const angle = (Math.PI * 2 * i) / bullets;
                const vx = Math.cos(angle) * this.bulletSpeed;
                const vy = Math.sin(angle) * this.bulletSpeed;
                enemyBulletPool.get(this.x, this.y, vx, vy, false);
            }
            return;
        }

        let shouldFire = false;
        let fireAngle = 0;
        let bulletSpeed = this.bulletSpeed;

        switch(this.role) {
            case 'scout':
                // Scouts fire quick bursts
                shouldFire = this.alertLevel > 10;
                fireAngle = this.calculateAimAngle(false);
                break;

            case 'heavy':
                // Heavies fire powerful shots
                shouldFire = this.alertLevel > 30;
                fireAngle = this.calculateAimAngle(false);
                bulletSpeed *= 1.2;
                break;

            case 'sniper':
                // Snipers fire precise, charged shots
                shouldFire = this.isCharging && this.chargeTime > 30;
                fireAngle = this.calculateAimAngle(this.aimPrediction);
                bulletSpeed *= (1.5 + this.chargeTime / 20);
                if (shouldFire) {
                    this.isCharging = false;
                    this.chargeTime = 0;
                }
                break;

            case 'elite':
                // Elites use advanced firing patterns
                shouldFire = this.alertLevel > 20;
                if (shouldFire && this.intelligence >= 3) {
                    this.fireSpreadPattern();
                    return;
                }
                fireAngle = this.calculateAimAngle(true);
                break;

            default:
                // Basic firing
                shouldFire = true;
                fireAngle = this.calculateAimAngle(false);
                break;
        }

        if (shouldFire) {
            const vx = Math.cos(fireAngle) * bulletSpeed;
            const vy = Math.sin(fireAngle) * bulletSpeed;

            if (enemyBulletPool) {
                enemyBulletPool.get(this.x, this.y, vx, vy, false);

                // Advanced enemies fire bursts
                if (this.intelligence >= 3 && Math.random() < 0.4) {
                    setTimeout(() => {
                        if (this.active && enemyBulletPool) {
                            enemyBulletPool.get(this.x, this.y, vx, vy, false);
                        }
                    }, 150);
                }
            }
        }
    }

    calculateAimAngle(usePrediction) {
        if (!gameState || !gameState.player) return 0;

        let targetX = gameState.player.x;
        let targetY = gameState.player.y;

        if (usePrediction && this.intelligence >= 2) {
            // Predict player movement
            const playerVx = gameState.player.x - this.lastPlayerX;
            const playerVy = gameState.player.y - this.lastPlayerY;
            const predictionFrames = 20 + (this.intelligence * 5);

            targetX += playerVx * predictionFrames;
            targetY += playerVy * predictionFrames;
        }

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        return Math.atan2(dy, dx);
    }

    fireSpreadPattern() {
        // Elite enemies fire spread shots
        const baseAngle = this.calculateAimAngle(true);
        const spreadAngles = [-0.3, -0.15, 0, 0.15, 0.3];

        spreadAngles.forEach((spread, index) => {
            setTimeout(() => {
                if (this.active && enemyBulletPool) {
                    const angle = baseAngle + spread;
                    const vx = Math.cos(angle) * this.bulletSpeed;
                    const vy = Math.sin(angle) * this.bulletSpeed;
                    enemyBulletPool.get(this.x, this.y, vx, vy, false);
                }
            }, index * 50);
        });
    }

    shoot() {
        if (!gameState || !gameState.player || this.behavior === 'flee') return;

        const dx = gameState.player.x - this.x;
        const dy = gameState.player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            const vx = (dx / dist) * this.bulletSpeed;
            const vy = (dy / dist) * this.bulletSpeed;
            if (enemyBulletPool) {
                enemyBulletPool.get(this.x, this.y, vx, vy, false);
            }
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();

        // Draw smoke trail for dive bombers
        if (this.isDiveBomber && this.smokeTrail.length > 0) {
            this.smokeTrail.forEach(smoke => {
                const alpha = smoke.life / 60;
                ctx.save();
                ctx.globalAlpha = alpha * 0.6;

                const gradient = ctx.createRadialGradient(smoke.x, smoke.y, 0, smoke.x, smoke.y, smoke.size);
                gradient.addColorStop(0, '#ff4400');
                gradient.addColorStop(0.5, '#ff6600');
                gradient.addColorStop(1, 'transparent');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(smoke.x, smoke.y, smoke.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        }

        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        const pulseIntensity = Math.sin(this.glowPulse) * 0.3 + 0.7;

        // Special visual indicators for different roles
        if (this.role === 'scout' && this.alertLevel > 30) {
            // Scout radar pulse
            ctx.save();
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.4 + Math.sin(this.moveTimer * 0.2) * 0.3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ffff00';
            ctx.beginPath();
            ctx.arc(0, 0, this.size + 15, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        } else if (this.role === 'heavy' && this.temporaryShield > 0) {
            // Heavy shield indicator
            this.temporaryShield--;
            ctx.save();
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.6 + Math.sin(this.moveTimer * 0.3) * 0.4;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00ffff';
            ctx.beginPath();
            ctx.arc(0, 0, this.size + 12, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        } else if (this.role === 'sniper' && this.isCharging) {
            // Sniper charging indicator
            const chargePercent = Math.min(this.chargeTime / 30, 1);
            ctx.save();
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 4;
            ctx.globalAlpha = 0.5 + chargePercent * 0.5;
            ctx.shadowBlur = 25 + (chargePercent * 15);
            ctx.shadowColor = '#ff00ff';

            // Charging ring
            ctx.beginPath();
            ctx.arc(0, 0, this.size + 8, 0, Math.PI * 2 * chargePercent);
            ctx.stroke();

            // Targeting laser
            if (chargePercent > 0.7 && gameState && gameState.player) {
                const dx = gameState.player.x - this.x;
                const dy = gameState.player.y - this.y;
                const dist = Math.hypot(dx, dy);
                const angle = Math.atan2(dy, dx);

                ctx.strokeStyle = '#ff00ff';
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.8;
                ctx.shadowBlur = 30;
                ctx.shadowColor = '#ff00ff';
                ctx.beginPath();
                ctx.moveTo(this.size, 0);
                ctx.lineTo(dist - this.size, 0);
                ctx.rotate(angle);
                ctx.stroke();
            }
            ctx.restore();
        } else if (this.role === 'elite' && this.teleportCooldown <= 60 && this.canTeleport) {
            // Elite ready to teleport
            ctx.save();
            ctx.strokeStyle = '#9900ff';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.4 + Math.sin(this.moveTimer * 0.4) * 0.4;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#9900ff';

            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * 2 * i) / 6 + this.moveTimer * 0.1;
                const radius = this.size + 10 + Math.sin(this.moveTimer * 0.2 + i) * 5;
                ctx.beginPath();
                ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, 3, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Formation and group indicators
        if (this.isFormationLeader) {
            ctx.shadowBlur = 40 + (pulseIntensity * 30);
            ctx.shadowColor = this.color;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 4;

            ctx.save();
            ctx.rotate(this.glowPulse * 0.5);
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * (this.size + 15), Math.sin(angle) * (this.size + 15));
                ctx.stroke();
            }
            ctx.restore();
        } else if (this.isGroupLeader) {
            // Group leader crown
            ctx.save();
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ffaa00';
            ctx.globalAlpha = 0.8;

            // Crown points
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 * i) / 5 - Math.PI/2;
                const radius = this.size + 8 + (i % 2 === 0 ? 5 : 0);
                ctx.beginPath();
                ctx.moveTo(0, -this.size - 3);
                ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
                ctx.stroke();
            }
            ctx.restore();
        } else if (this.isDiveBomber && this.behavior === 'kamikaze_smart') {
            // Smart kamikaze warning indicator
            ctx.save();
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6 + Math.sin(this.moveTimer * 0.5) * 0.4;
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#ff0000';

            // Warning triangles
            for (let i = 0; i < 3; i++) {
                const angle = (Math.PI * 2 * i) / 3 + this.moveTimer * 0.1;
                const radius = this.size + 12;
                const triangleSize = 6;

                ctx.save();
                ctx.translate(Math.cos(angle) * radius, Math.sin(angle) * radius);
                ctx.rotate(angle);
                ctx.beginPath();
                ctx.moveTo(-triangleSize, triangleSize);
                ctx.lineTo(triangleSize, triangleSize);
                ctx.lineTo(0, -triangleSize);
                ctx.closePath();
                ctx.stroke();
                ctx.restore();
            }
            ctx.restore();
        } else if (this.isElite) {
            // Elite enemy special aura
            ctx.save();
            for (let i = 0; i < 3; i++) {
                ctx.strokeStyle = `hsla(280, 100%, 50%, ${0.3 - i * 0.1})`;
                ctx.lineWidth = 2 + i;
                ctx.shadowBlur = 20 + (i * 10);
                ctx.shadowColor = this.color;
                ctx.beginPath();
                ctx.arc(0, 0, this.size + (i * 8), 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        } else if (this.isMiniBoss) {
            // Mini-boss special effects
            ctx.save();
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#ff00ff';
            ctx.globalAlpha = 0.7 + Math.sin(this.glowPulse * 2) * 0.3;

            // Rotating aura
            ctx.rotate(this.moveTimer * 0.05);
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * 2 * i) / 6;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * (this.size + 20), Math.sin(angle) * (this.size + 20));
                ctx.stroke();
            }
            ctx.restore();
        } else if (this.type === 'sinewave') {
            // Special sine wave glow effect
            ctx.save();
            for (let i = 0; i < 3; i++) {
                ctx.strokeStyle = `hsla(280, 100%, 50%, ${0.3 - i * 0.1})`;
                ctx.lineWidth = 2 + i;
                ctx.shadowBlur = 20 + (i * 10);
                ctx.shadowColor = this.color;
                ctx.beginPath();
                ctx.arc(0, 0, this.size + (i * 8), 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        } else {
            // Standard enemy appearance
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 30 + (pulseIntensity * 20);
            ctx.shadowColor = this.color;
        }

        // Alert level visual feedback
        if (this.alertLevel > 50) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#ff0000';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff0000';
            ctx.beginPath();
            ctx.arc(0, 0, this.size + 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.globalAlpha = 0.8;

        // Draw the main shape
        if (this.type === 'sinewave') {
            // Special diamond shape for sine wave enemies
            ctx.beginPath();
            ctx.moveTo(0, -this.size);
            ctx.lineTo(this.size, 0);
            ctx.lineTo(0, this.size);
            ctx.lineTo(-this.size, 0);
            ctx.closePath();
        } else {
            // Regular polygon
            ctx.beginPath();
            for (let i = 0; i < this.sides; i++) {
                const angle = (Math.PI * 2 * i) / this.sides - Math.PI / 2;
                const x = Math.cos(angle) * this.size;
                const y = Math.sin(angle) * this.size;

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
        }

        ctx.stroke();

        ctx.fillStyle = this.color + '44';
        ctx.fill();

        // Role indicators inside shapes
        ctx.globalAlpha = pulseIntensity;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.stroke();

        // Role symbols
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.globalAlpha = 0.8;

        let roleSymbol = '';
        switch(this.role) {
            case 'scout': roleSymbol = '⚡'; break;
            case 'heavy': roleSymbol = '▣'; break;
            case 'sniper': roleSymbol = '◎'; break;
            case 'kamikaze': roleSymbol = '💀'; break;
            case 'elite': roleSymbol = '★'; break;
        }

        if (roleSymbol && this.intelligence >= 2) {
            ctx.fillText(roleSymbol, 0, 0);
        }

        if (this.isFormationFollower) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(0, 0, this.size + 8, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}
