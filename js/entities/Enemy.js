// ============================================
// GEOMETRY 3044 — ENEMY CLASS (COMPLETE)
// ============================================

import { config, getCurrentTheme } from '../config.js';

export class Enemy {
    constructor(x, y, type, gameState) {
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
            default:
                this.setupTriangleScout(currentWave, intelligenceLevel);
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
        this.color = '#ff3366';
        this.points = 100 + (wave * 15);
        this.behavior = 'aggressive';
        this.fireRate = Math.max(50, 120 - (intelligence * 15));
        this.bulletSpeed = 5 + (intelligence * 0.5);
        this.dodgeChance = 0.05 + (intelligence * 0.03);
        this.role = 'scout';
    }

    setupSquareHeavy(wave, intelligence) {
        this.sides = 4;
        this.size = 25;
        this.hp = 3 + Math.floor(wave / 2);
        this.speed = Math.max(1.0, 1.5 + (wave * 0.08));
        this.color = '#ff8800';
        this.points = 200 + (wave * 25);
        this.behavior = 'patrol';
        this.fireRate = Math.max(80, 180 - (intelligence * 20));
        this.bulletSpeed = 4 + (intelligence * 0.3);
        this.dodgeChance = 0.02 + (intelligence * 0.02);
        this.role = 'heavy';
        this.shieldActive = intelligence >= 2;
        this.shieldStrength = intelligence;
    }

    setupPentagonSniper(wave, intelligence) {
        this.sides = 5;
        this.size = 20;
        this.hp = 2 + Math.floor(wave / 3);
        this.speed = Math.max(0.8, 1.2 + (wave * 0.05));
        this.color = '#aa00ff';
        this.points = 300 + (wave * 35);
        this.behavior = 'sniper';
        this.fireRate = Math.max(100, 200 - (intelligence * 25));
        this.bulletSpeed = 8 + (intelligence * 0.8);
        this.dodgeChance = 0.1 + (intelligence * 0.05);
        this.role = 'sniper';
        this.aimPrediction = intelligence >= 1;
        this.burstFire = intelligence >= 3;
        this.burstCount = 3;
    }

    setupDiveBomber(wave, intelligence) {
        this.sides = 3;
        this.size = 18;
        this.hp = 2;
        this.speed = 0.5;
        this.diveSpeed = 12 + (wave * 0.5);
        this.color = '#ff0044';
        this.points = 250 + (wave * 30);
        this.behavior = 'dive';
        this.diving = false;
        this.diveTarget = { x: 0, y: 0 };
        this.fireRate = 999; // Doesn't shoot, just dives
        this.role = 'bomber';
    }

    setupSineWaveElite(wave, intelligence) {
        this.sides = 6;
        this.size = 22;
        this.hp = 4 + Math.floor(wave / 2);
        this.speed = 2 + (wave * 0.1);
        this.color = '#00ffaa';
        this.points = 400 + (wave * 50);
        this.behavior = 'sinewave';
        this.sineAmplitude = 100 + (wave * 5);
        this.sineFrequency = 0.02 + (wave * 0.002);
        this.sineOffset = Math.random() * Math.PI * 2;
        this.fireRate = Math.max(60, 100 - (intelligence * 10));
        this.bulletSpeed = 6 + (intelligence * 0.5);
        this.bulletPattern = 'spread';
        this.role = 'elite';
    }

    update(playerX, playerY, canvas, enemyBulletPool, gameState, particleSystem) {
        if (!this.active) return;

        this.moveTimer++;
        this.fireTimer++;
        this.glowPulse = (this.glowPulse + 0.1) % (Math.PI * 2);
        this.rotation += 0.02;

        // Store player position for AI
        this.lastPlayerX = playerX;
        this.lastPlayerY = playerY;

        // Execute behavior
        switch (this.behavior) {
            case 'aggressive':
                this.aggressiveBehavior(playerX, playerY, canvas);
                break;
            case 'patrol':
                this.patrolBehavior(canvas);
                break;
            case 'sniper':
                this.sniperBehavior(playerX, playerY, canvas);
                break;
            case 'dive':
                this.diveBehavior(playerX, playerY, canvas);
                break;
            case 'sinewave':
                this.sinewaveBehavior(canvas);
                break;
            case 'flee':
                this.fleeBehavior(playerX, playerY, canvas);
                break;
            default:
                this.y += this.speed;
        }

        // Try to dodge player bullets
        if (this.dodgeChance > 0 && Math.random() < this.dodgeChance * 0.1) {
            this.tryDodge(gameState);
        }

        // Fire at player
        if (this.fireTimer >= this.fireRate && this.behavior !== 'dive') {
            this.shoot(playerX, playerY, enemyBulletPool);
            this.fireTimer = 0;
        }

        // Remove if off screen
        if (this.y > canvas.height + 50 || this.x < -50 || this.x > canvas.width + 50) {
            this.active = false;
        }
    }

    aggressiveBehavior(playerX, playerY, canvas) {
        // Move toward player horizontally, down vertically
        const dx = playerX - this.x;
        this.x += Math.sign(dx) * Math.min(Math.abs(dx) * 0.02, this.speed);
        this.y += this.speed;

        // Bounds
        this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));
    }

    patrolBehavior(canvas) {
        // Move in a pattern
        this.x += Math.sin(this.moveTimer * 0.03) * this.speed * 2;
        this.y += this.speed * 0.5;

        // Bounds
        this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));
    }

    sniperBehavior(playerX, playerY, canvas) {
        // Stay at top, strafe slowly
        if (this.y < 100) {
            this.y += this.speed;
        } else {
            // Strafe to get better angle
            const dx = playerX - this.x;
            this.x += Math.sign(dx) * Math.min(0.5, Math.abs(dx) * 0.005);
        }

        this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));
    }

    diveBehavior(playerX, playerY, canvas) {
        if (!this.diving) {
            // Approach slowly
            this.y += this.speed;

            // Start dive when close enough
            if (this.y > 100 && Math.random() < 0.02) {
                this.diving = true;
                this.diveTarget = { x: playerX, y: playerY + 50 };
            }
        } else {
            // DIVE!
            const angle = Math.atan2(this.diveTarget.y - this.y, this.diveTarget.x - this.x);
            this.x += Math.cos(angle) * this.diveSpeed;
            this.y += Math.sin(angle) * this.diveSpeed;
        }
    }

    sinewaveBehavior(canvas) {
        this.y += this.speed;
        this.x = (canvas.width / 2) + Math.sin(this.moveTimer * this.sineFrequency + this.sineOffset) * this.sineAmplitude;
    }

    fleeBehavior(playerX, playerY, canvas) {
        // Run away from player (fever mode)
        const dx = this.x - playerX;
        const dy = this.y - playerY;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            this.x += (dx / dist) * this.speed * 2;
            this.y += (dy / dist) * this.speed * 0.5;
        }

        this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));
        this.y = Math.max(this.size, Math.min(canvas.height - this.size, this.y));
    }

    tryDodge(gameState) {
        if (!gameState?.bulletPool) return;

        // Use optimized nearby bullet iterator
        if (gameState.bulletPool.iterateNearbyPlayerBullets) {
            for (const bullet of gameState.bulletPool.iterateNearbyPlayerBullets(this.x, this.y, 80)) {
                if (bullet.y < this.y) {
                    // Dodge!
                    this.x += (Math.random() > 0.5 ? 1 : -1) * 20;
                    return;
                }
            }
        } else {
            // Fallback for old API - iterate directly
            const bullets = gameState.bulletPool.bullets || [];
            for (const bullet of bullets) {
                if (!bullet.active || !bullet.isPlayer) continue;
                const dx = bullet.x - this.x;
                const dy = bullet.y - this.y;
                if (dx * dx + dy * dy < 6400 && bullet.y < this.y) { // 80^2 = 6400
                    this.x += (Math.random() > 0.5 ? 1 : -1) * 20;
                    return;
                }
            }
        }
    }

    shoot(playerX, playerY, enemyBulletPool) {
        if (!enemyBulletPool) return;

        let angle = Math.atan2(playerY - this.y, playerX - this.x);

        // Aim prediction for smart enemies
        if (this.aimPrediction) {
            const leadTime = 0.3;
            angle = Math.atan2(
                playerY + (playerY - this.lastPlayerY) * leadTime * 10 - this.y,
                playerX + (playerX - this.lastPlayerX) * leadTime * 10 - this.x
            );
        }

        if (this.burstFire && this.burstCount > 1) {
            // Burst fire - fire all at once with slight angle variation instead of setTimeout
            for (let i = 0; i < this.burstCount; i++) {
                const burstAngle = angle + (i - 1) * 0.05; // Small angle spread
                enemyBulletPool.spawn?.(
                    this.x, this.y,
                    Math.cos(burstAngle) * this.bulletSpeed,
                    Math.sin(burstAngle) * this.bulletSpeed,
                    false,
                    { color: this.color, size: 6, damage: 1 }
                );
            }
        } else if (this.bulletPattern === 'spread') {
            // Spread pattern
            for (let i = -1; i <= 1; i++) {
                const spreadAngle = angle + (i * 0.2);
                enemyBulletPool.spawn?.(
                    this.x, this.y,
                    Math.cos(spreadAngle) * this.bulletSpeed,
                    Math.sin(spreadAngle) * this.bulletSpeed,
                    false,
                    { color: this.color, size: 5, damage: 1 }
                );
            }
        } else {
            // Single shot
            enemyBulletPool.spawn?.(
                this.x, this.y,
                Math.cos(angle) * this.bulletSpeed,
                Math.sin(angle) * this.bulletSpeed,
                false,
                { color: this.color, size: 6, damage: 1 }
            );
        }
    }

    takeDamage(amount = 1) {
        // Shield absorbs damage first
        if (this.shieldActive && this.shieldStrength > 0) {
            this.shieldStrength -= amount;
            if (this.shieldStrength <= 0) {
                this.shieldActive = false;
            }
            return false;
        }

        this.hp -= amount;

        if (this.hp <= 0) {
            this.active = false;
            return true; // Killed
        }

        return false;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Glow effect
        const glowIntensity = 0.5 + Math.sin(this.glowPulse) * 0.3;
        ctx.shadowBlur = 20 * glowIntensity;
        ctx.shadowColor = this.color;

        // Shield
        if (this.shieldActive && this.shieldStrength > 0) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(0, 0, this.size + 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Draw shape based on sides
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color + '44';
        ctx.lineWidth = 2;

        ctx.beginPath();
        for (let i = 0; i < this.sides; i++) {
            const angle = (Math.PI * 2 * i / this.sides) - Math.PI / 2;
            const x = Math.cos(angle) * this.size;
            const y = Math.sin(angle) * this.size;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // HP indicator for enemies with more than 1 HP
        if (this.hp > 1) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(this.hp.toString(), 0, 4);
        }

        // Dive indicator
        if (this.diving) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, this.size);
            ctx.lineTo(0, this.size + 15);
            ctx.stroke();
        }

        ctx.restore();
    }
}
