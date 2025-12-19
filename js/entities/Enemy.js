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
            // NEW 8-BIT INSPIRED ENEMIES
            case 'pixelskull':
                this.setupPixelSkull(currentWave, intelligenceLevel);
                break;
            case 'ghostbyte':
                this.setupGhostByte(currentWave, intelligenceLevel);
                break;
            case 'laserdisc':
                this.setupLaserDisc(currentWave, intelligenceLevel);
                break;
            case 'vhstracker':
                this.setupVHSTracker(currentWave, intelligenceLevel);
                break;
            case 'arcadeboss':
                this.setupArcadeBoss(currentWave, intelligenceLevel);
                break;
            case 'synthwave':
                this.setupSynthwaveEnemy(currentWave, intelligenceLevel);
                break;
            case 'pixelinvader':
                this.setupPixelInvader(currentWave, intelligenceLevel);
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

    // ============================================
    // NEW 8-BIT INSPIRED ENEMY TYPES
    // ============================================

    // PIXEL SKULL - Menacing 8-bit skull that phases in/out
    setupPixelSkull(wave, intelligence) {
        this.sides = 0; // Custom draw
        this.size = 24;
        this.hp = 3 + Math.floor(wave / 2);
        this.speed = 1.5 + (wave * 0.1);
        this.color = '#ff00ff';
        this.secondaryColor = '#00ffff';
        this.points = 350 + (wave * 40);
        this.behavior = 'phase';
        this.fireRate = Math.max(70, 140 - (intelligence * 15));
        this.bulletSpeed = 5 + (intelligence * 0.4);
        this.role = 'phase';
        this.phaseTimer = 0;
        this.isPhased = false;
        this.phaseDuration = 60;
        this.eyeGlow = 0;
        this.customDraw = 'skull';
    }

    // GHOST BYTE - Floaty ghost that passes through bullets occasionally
    setupGhostByte(wave, intelligence) {
        this.sides = 0; // Custom draw
        this.size = 20;
        this.hp = 2 + Math.floor(wave / 3);
        this.speed = 1.0 + (wave * 0.08);
        this.color = '#88ffff';
        this.secondaryColor = '#ffffff';
        this.points = 275 + (wave * 30);
        this.behavior = 'ghost';
        this.fireRate = Math.max(80, 150 - (intelligence * 12));
        this.bulletSpeed = 4 + (intelligence * 0.3);
        this.role = 'ghost';
        this.floatOffset = Math.random() * Math.PI * 2;
        this.transparency = 1;
        this.ghostTimer = 0;
        this.customDraw = 'ghost';
    }

    // LASER DISC - Spinning disc that fires lasers in patterns
    setupLaserDisc(wave, intelligence) {
        this.sides = 0; // Custom draw
        this.size = 18;
        this.hp = 2 + Math.floor(wave / 3);
        this.speed = 2.5 + (wave * 0.15);
        this.color = '#ff6600';
        this.secondaryColor = '#ffff00';
        this.points = 325 + (wave * 35);
        this.behavior = 'orbit';
        this.fireRate = Math.max(40, 80 - (intelligence * 8));
        this.bulletSpeed = 7 + (intelligence * 0.6);
        this.role = 'laser';
        this.spinSpeed = 0.15 + (intelligence * 0.02);
        this.orbitRadius = 50 + (wave * 3);
        this.orbitCenter = { x: 0, y: 0 };
        this.orbitAngle = Math.random() * Math.PI * 2;
        this.bulletPattern = 'laser';
        this.customDraw = 'disc';
    }

    // VHS TRACKER - Glitchy enemy that teleports and leaves trails
    setupVHSTracker(wave, intelligence) {
        this.sides = 0; // Custom draw
        this.size = 22;
        this.hp = 3 + Math.floor(wave / 2);
        this.speed = 3 + (wave * 0.2);
        this.color = '#00ff00';
        this.secondaryColor = '#ff0000';
        this.tertiaryColor = '#0000ff';
        this.points = 400 + (wave * 45);
        this.behavior = 'glitch';
        this.fireRate = Math.max(60, 120 - (intelligence * 12));
        this.bulletSpeed = 6 + (intelligence * 0.5);
        this.role = 'tracker';
        this.glitchTimer = 0;
        this.glitchInterval = 90 - (intelligence * 10);
        this.scanlines = [];
        this.distortionAmount = 0;
        this.customDraw = 'vhs';
    }

    // ARCADE BOSS - Retro arcade cabinet that spawns mini enemies
    setupArcadeBoss(wave, intelligence) {
        this.sides = 0; // Custom draw
        this.size = 35;
        this.hp = 8 + wave;
        this.speed = 0.8 + (wave * 0.05);
        this.color = '#ffff00';
        this.secondaryColor = '#ff00ff';
        this.points = 800 + (wave * 80);
        this.behavior = 'boss';
        this.fireRate = Math.max(50, 100 - (intelligence * 10));
        this.bulletSpeed = 5 + (intelligence * 0.4);
        this.role = 'miniboss';
        this.spawnTimer = 0;
        this.spawnInterval = 180 - (intelligence * 15);
        this.screenGlow = 0;
        this.customDraw = 'arcade';
    }

    // SYNTHWAVE - Pulsing neon enemy that fires to the beat
    setupSynthwaveEnemy(wave, intelligence) {
        this.sides = 0; // Custom draw
        this.size = 20;
        this.hp = 2 + Math.floor(wave / 3);
        this.speed = 2 + (wave * 0.12);
        this.color = '#ff0080';
        this.secondaryColor = '#00ffff';
        this.tertiaryColor = '#ffff00';
        this.points = 300 + (wave * 35);
        this.behavior = 'pulse';
        this.fireRate = Math.max(45, 90 - (intelligence * 10));
        this.bulletSpeed = 5.5 + (intelligence * 0.45);
        this.role = 'synthwave';
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.waveAmplitude = 30;
        this.neonTrails = [];
        this.customDraw = 'synthwave';
    }

    // PIXEL INVADER - Classic space invader style enemy
    setupPixelInvader(wave, intelligence) {
        this.sides = 0; // Custom draw
        this.size = 24;
        this.hp = 2 + Math.floor(wave / 4);
        this.speed = 1.2 + (wave * 0.08);
        this.color = '#00ff00';
        this.secondaryColor = '#88ff88';
        this.points = 250 + (wave * 25);
        this.behavior = 'invader';
        this.fireRate = Math.max(90, 160 - (intelligence * 15));
        this.bulletSpeed = 4 + (intelligence * 0.3);
        this.role = 'invader';
        this.stepTimer = 0;
        this.stepDirection = 1;
        this.stepDistance = 30;
        this.descendAmount = 20;
        this.legFrame = 0;
        this.customDraw = 'invader';
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
            // NEW 8-BIT BEHAVIORS
            case 'phase':
                this.phaseBehavior(playerX, playerY, canvas);
                break;
            case 'ghost':
                this.ghostBehavior(playerX, playerY, canvas);
                break;
            case 'orbit':
                this.orbitBehavior(playerX, playerY, canvas);
                break;
            case 'glitch':
                this.glitchBehavior(playerX, playerY, canvas);
                break;
            case 'boss':
                this.bossBehavior(playerX, playerY, canvas);
                break;
            case 'pulse':
                this.pulseBehavior(playerX, playerY, canvas);
                break;
            case 'invader':
                this.invaderBehavior(canvas);
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

    // ============================================
    // NEW 8-BIT ENEMY BEHAVIORS
    // ============================================

    phaseBehavior(playerX, playerY, canvas) {
        this.phaseTimer++;
        this.eyeGlow = (Math.sin(this.moveTimer * 0.1) + 1) / 2;

        // Phase in/out every phaseDuration frames
        if (this.phaseTimer >= this.phaseDuration) {
            this.isPhased = !this.isPhased;
            this.phaseTimer = 0;
        }

        // Move toward player when visible
        if (!this.isPhased) {
            const dx = playerX - this.x;
            const dy = playerY - this.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed * 0.5;
            }
        } else {
            // Float down slowly when phased
            this.y += this.speed * 0.3;
        }

        this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));
    }

    ghostBehavior(playerX, playerY, canvas) {
        this.ghostTimer++;
        this.floatOffset += 0.05;

        // Ghostly floating movement
        const floatX = Math.sin(this.floatOffset) * 2;
        const floatY = Math.cos(this.floatOffset * 0.7) * 1.5;

        this.x += floatX;
        this.y += this.speed + floatY;

        // Transparency fluctuation - become intangible sometimes
        this.transparency = 0.4 + Math.sin(this.ghostTimer * 0.03) * 0.6;

        this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));
    }

    orbitBehavior(playerX, playerY, canvas) {
        // Set orbit center if not set
        if (this.orbitCenter.x === 0 && this.orbitCenter.y === 0) {
            this.orbitCenter = { x: this.x, y: this.y };
        }

        // Move orbit center down
        this.orbitCenter.y += this.speed * 0.5;

        // Orbit around center
        this.orbitAngle += this.spinSpeed;
        this.x = this.orbitCenter.x + Math.cos(this.orbitAngle) * this.orbitRadius;
        this.y = this.orbitCenter.y + Math.sin(this.orbitAngle) * this.orbitRadius * 0.5;

        this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));
    }

    glitchBehavior(playerX, playerY, canvas) {
        this.glitchTimer++;
        this.distortionAmount = Math.sin(this.moveTimer * 0.2) * 5;

        // Track toward player
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed * 0.3;
        }

        // Glitch teleport
        if (this.glitchTimer >= this.glitchInterval) {
            this.glitchTimer = 0;
            // Teleport randomly nearby
            this.x += (Math.random() - 0.5) * 100;
            this.y += (Math.random() - 0.5) * 50;
        }

        this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));
        this.y = Math.max(this.size, Math.min(canvas.height - this.size, this.y));
    }

    bossBehavior(playerX, playerY, canvas) {
        this.screenGlow = (Math.sin(this.moveTimer * 0.05) + 1) / 2;

        // Move slowly side to side at top
        if (this.y < 100) {
            this.y += this.speed;
        } else {
            this.x += Math.sin(this.moveTimer * 0.02) * this.speed * 2;
        }

        this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));
    }

    pulseBehavior(playerX, playerY, canvas) {
        this.pulsePhase += 0.08;

        // Pulsing movement with wave pattern
        const pulseOffset = Math.sin(this.pulsePhase) * this.waveAmplitude;
        this.x = (canvas.width / 2) + pulseOffset + Math.sin(this.moveTimer * 0.03) * 50;
        this.y += this.speed;

        // Update neon trail
        if (this.moveTimer % 3 === 0) {
            this.neonTrails.push({ x: this.x, y: this.y, life: 20 });
        }
        this.neonTrails = this.neonTrails.filter(t => {
            t.life--;
            return t.life > 0;
        });

        this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));
    }

    invaderBehavior(canvas) {
        this.stepTimer++;
        this.legFrame = Math.floor(this.moveTimer / 15) % 2;

        // Classic space invader movement
        if (this.stepTimer >= 30) {
            this.stepTimer = 0;
            this.x += this.stepDirection * this.stepDistance;

            // Hit edge - descend and reverse
            if (this.x >= canvas.width - this.size || this.x <= this.size) {
                this.stepDirection *= -1;
                this.y += this.descendAmount;
            }
        }

        // Slow constant downward drift
        this.y += this.speed * 0.2;
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

        // Custom draw for 8-bit enemies
        if (this.customDraw) {
            ctx.rotate(-this.rotation); // Reset rotation for pixel-perfect drawing
            this.drawCustom8Bit(ctx);
        } else {
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
        }

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

    // ============================================
    // CUSTOM 8-BIT DRAWING METHODS
    // ============================================

    drawCustom8Bit(ctx) {
        const s = this.size;
        const pixelSize = 3;

        switch(this.customDraw) {
            case 'skull':
                this.drawPixelSkull(ctx, s, pixelSize);
                break;
            case 'ghost':
                this.drawGhostByte(ctx, s, pixelSize);
                break;
            case 'disc':
                this.drawLaserDisc(ctx, s, pixelSize);
                break;
            case 'vhs':
                this.drawVHSTracker(ctx, s, pixelSize);
                break;
            case 'arcade':
                this.drawArcadeBoss(ctx, s, pixelSize);
                break;
            case 'synthwave':
                this.drawSynthwave(ctx, s, pixelSize);
                break;
            case 'invader':
                this.drawPixelInvader(ctx, s, pixelSize);
                break;
        }
    }

    drawPixelSkull(ctx, s, p) {
        // Phase effect
        if (this.isPhased) {
            ctx.globalAlpha = 0.3 + Math.sin(this.phaseTimer * 0.2) * 0.2;
        }

        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        // 8-bit skull pattern
        const skull = [
            [0,0,1,1,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1,1,1],
            [1,1,0,0,1,1,0,0,1,1],
            [1,1,0,0,1,1,0,0,1,1],
            [1,1,1,1,1,1,1,1,1,1],
            [0,1,1,0,0,0,0,1,1,0],
            [0,0,1,1,0,0,1,1,0,0],
        ];

        const offsetX = -skull[0].length * p / 2;
        const offsetY = -skull.length * p / 2;

        skull.forEach((row, y) => {
            row.forEach((pixel, x) => {
                if (pixel) {
                    ctx.fillStyle = this.color;
                    ctx.fillRect(offsetX + x * p, offsetY + y * p, p - 1, p - 1);
                }
            });
        });

        // Glowing eyes
        const eyeColor = `rgba(255, ${Math.floor(this.eyeGlow * 255)}, 0, 1)`;
        ctx.fillStyle = eyeColor;
        ctx.shadowColor = eyeColor;
        ctx.shadowBlur = 20;
        ctx.fillRect(offsetX + 2 * p, offsetY + 3 * p, p * 2 - 1, p * 2 - 1);
        ctx.fillRect(offsetX + 6 * p, offsetY + 3 * p, p * 2 - 1, p * 2 - 1);

        ctx.globalAlpha = 1;
    }

    drawGhostByte(ctx, s, p) {
        ctx.globalAlpha = this.transparency;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;

        // Floating effect
        const floatOffset = Math.sin(this.floatOffset) * 3;

        // 8-bit ghost pattern
        const ghost = [
            [0,0,0,1,1,1,1,0,0,0],
            [0,0,1,1,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,1,1,0],
            [1,1,0,0,1,1,0,0,1,1],
            [1,1,0,0,1,1,0,0,1,1],
            [1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1],
            [1,0,1,1,0,0,1,1,0,1],
        ];

        const offsetX = -ghost[0].length * p / 2;
        const offsetY = -ghost.length * p / 2 + floatOffset;

        ghost.forEach((row, y) => {
            row.forEach((pixel, x) => {
                if (pixel) {
                    const gradient = ctx.createLinearGradient(0, offsetY, 0, offsetY + ghost.length * p);
                    gradient.addColorStop(0, this.color);
                    gradient.addColorStop(1, this.secondaryColor);
                    ctx.fillStyle = gradient;
                    ctx.fillRect(offsetX + x * p, offsetY + y * p, p - 1, p - 1);
                }
            });
        });

        // Eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(offsetX + 2 * p, offsetY + 3 * p, p * 2 - 1, p * 2 - 1);
        ctx.fillRect(offsetX + 6 * p, offsetY + 3 * p, p * 2 - 1, p * 2 - 1);

        ctx.globalAlpha = 1;
    }

    drawLaserDisc(ctx, s, p) {
        ctx.shadowBlur = 25;
        ctx.shadowColor = this.color;

        // Spinning disc
        const spin = this.moveTimer * this.spinSpeed;

        // Outer ring
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, Math.PI * 2);
        ctx.stroke();

        // Inner rings
        ctx.strokeStyle = this.secondaryColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
        ctx.stroke();

        // Spinning laser lines
        for (let i = 0; i < 4; i++) {
            const angle = spin + (Math.PI / 2) * i;
            ctx.strokeStyle = i % 2 === 0 ? this.color : this.secondaryColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * s, Math.sin(angle) * s);
            ctx.stroke();
        }

        // Center glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.3);
        gradient.addColorStop(0, this.secondaryColor);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawVHSTracker(ctx, s, p) {
        const distort = this.distortionAmount;

        // Scanline effect
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        for (let y = -s; y < s; y += 4) {
            ctx.globalAlpha = 0.3 + Math.random() * 0.3;
            ctx.beginPath();
            ctx.moveTo(-s + distort, y);
            ctx.lineTo(s + distort, y);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // RGB split effect - draw three offset shapes
        const offsets = [
            { color: this.secondaryColor, x: -2, y: -1 },
            { color: this.tertiaryColor, x: 2, y: 1 },
            { color: this.color, x: 0, y: 0 }
        ];

        offsets.forEach(offset => {
            ctx.fillStyle = offset.color;
            ctx.globalAlpha = offset.color === this.color ? 1 : 0.5;

            // VHS tape shape
            ctx.fillRect(-s * 0.8 + offset.x, -s * 0.5 + offset.y, s * 1.6, s);

            // Tape reels
            ctx.beginPath();
            ctx.arc(-s * 0.4 + offset.x, offset.y, s * 0.25, 0, Math.PI * 2);
            ctx.arc(s * 0.4 + offset.x, offset.y, s * 0.25, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.globalAlpha = 1;

        // "TRACKING" text effect
        if (Math.random() > 0.9) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 8px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('TRACKING', distort, s + 10);
        }
    }

    drawArcadeBoss(ctx, s, p) {
        ctx.shadowBlur = 30;
        ctx.shadowColor = this.color;

        // Arcade cabinet body
        ctx.fillStyle = '#222222';
        ctx.fillRect(-s * 0.7, -s, s * 1.4, s * 2);

        // Screen with glow
        const screenGlow = this.screenGlow || 0.5;
        ctx.fillStyle = `rgba(0, 255, 255, ${0.3 + screenGlow * 0.4})`;
        ctx.fillRect(-s * 0.5, -s * 0.8, s, s * 0.9);

        // Screen content - flickering game
        ctx.fillStyle = this.color;
        const gameY = Math.sin(this.moveTimer * 0.1) * s * 0.2;
        ctx.fillRect(-s * 0.2, -s * 0.5 + gameY, s * 0.4, s * 0.1);

        // Pixel enemies on screen
        ctx.fillStyle = this.secondaryColor;
        for (let i = 0; i < 3; i++) {
            const ex = -s * 0.3 + i * s * 0.25;
            const ey = -s * 0.7 + Math.sin(this.moveTimer * 0.05 + i) * s * 0.1;
            ctx.fillRect(ex, ey, s * 0.15, s * 0.1);
        }

        // Cabinet decoration
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(-s * 0.7, -s, s * 1.4, s * 2);

        // Side art stripes
        ctx.fillStyle = this.secondaryColor;
        ctx.fillRect(-s * 0.7, -s * 0.3, s * 0.1, s * 0.6);
        ctx.fillRect(s * 0.6, -s * 0.3, s * 0.1, s * 0.6);

        // Control panel
        ctx.fillStyle = '#444444';
        ctx.fillRect(-s * 0.5, s * 0.2, s, s * 0.3);

        // Joystick
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(-s * 0.2, s * 0.35, s * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Buttons
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(s * 0.1, s * 0.35, s * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.arc(s * 0.3, s * 0.35, s * 0.06, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSynthwave(ctx, s, p) {
        ctx.shadowBlur = 25;

        // Draw neon trails
        if (this.neonTrails) {
            this.neonTrails.forEach(trail => {
                const alpha = trail.life / 20;
                ctx.globalAlpha = alpha * 0.5;
                ctx.fillStyle = this.secondaryColor;
                ctx.beginPath();
                ctx.arc(trail.x - this.x, trail.y - this.y, s * 0.3, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        ctx.globalAlpha = 1;

        // Pulsing size
        const pulse = Math.sin(this.pulsePhase) * 0.2 + 1;
        const pulsedSize = s * pulse;

        // Outer glow ring
        const gradient = ctx.createRadialGradient(0, 0, pulsedSize * 0.5, 0, 0, pulsedSize);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, this.secondaryColor);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, pulsedSize, 0, Math.PI * 2);
        ctx.fill();

        // Inner geometric shape - rotating triangle
        ctx.shadowColor = this.tertiaryColor;
        ctx.strokeStyle = this.tertiaryColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 * i / 3) + this.moveTimer * 0.05;
            const px = Math.cos(angle) * pulsedSize * 0.6;
            const py = Math.sin(angle) * pulsedSize * 0.6;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // Center core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, pulsedSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }

    drawPixelInvader(ctx, s, p) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        // Classic space invader patterns (2 frames for animation)
        const invader1 = [
            [0,0,1,0,0,0,0,0,1,0,0],
            [0,0,0,1,0,0,0,1,0,0,0],
            [0,0,1,1,1,1,1,1,1,0,0],
            [0,1,1,0,1,1,1,0,1,1,0],
            [1,1,1,1,1,1,1,1,1,1,1],
            [1,0,1,1,1,1,1,1,1,0,1],
            [1,0,1,0,0,0,0,0,1,0,1],
            [0,0,0,1,1,0,1,1,0,0,0],
        ];

        const invader2 = [
            [0,0,1,0,0,0,0,0,1,0,0],
            [1,0,0,1,0,0,0,1,0,0,1],
            [1,0,1,1,1,1,1,1,1,0,1],
            [1,1,1,0,1,1,1,0,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1],
            [0,1,1,1,1,1,1,1,1,1,0],
            [0,0,1,0,0,0,0,0,1,0,0],
            [0,1,0,0,0,0,0,0,0,1,0],
        ];

        const pattern = this.legFrame === 0 ? invader1 : invader2;
        const offsetX = -pattern[0].length * p / 2;
        const offsetY = -pattern.length * p / 2;

        pattern.forEach((row, y) => {
            row.forEach((pixel, x) => {
                if (pixel) {
                    ctx.fillStyle = y < 3 ? this.secondaryColor : this.color;
                    ctx.fillRect(offsetX + x * p, offsetY + y * p, p - 1, p - 1);
                }
            });
        });
    }
}
