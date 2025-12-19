// ============================================
// GEOMETRY 3044 — BOSS CLASS
// ============================================

import { config, getCurrentTheme } from '../config.js';

export class Boss {
    constructor(wave, canvas) {
        this.x = canvas.width / 2;
        this.y = -100;
        this.targetY = 120;
        this.canvas = canvas;
        this.wave = wave;
        this.active = true;
        this.entering = true;
        this.defeated = false;
        this.deathTimer = 0;

        // Determine boss type based on wave
        this.type = this.getBossType(wave);
        this.setupBoss();

        // Attack patterns
        this.attackTimer = 0;
        this.attackPattern = 0;
        this.phaseTimer = 0;
        this.currentPhase = 1;

        // Visual effects
        this.rotation = 0;
        this.pulsePhase = 0;
        this.shieldRotation = 0;
        this.damageFlash = 0;

        console.log(`🔥 BOSS SPAWNED: ${this.name} (Wave ${wave})`);
    }

    getBossType(wave) {
        // Boss every 5 waves, cycling through types
        const bossIndex = Math.floor((wave - 1) / 5) % 5;
        return ['guardian', 'destroyer', 'phantom', 'mothership', 'overlord'][bossIndex];
    }

    setupBoss() {
        const baseHP = 100;
        const waveMultiplier = 1 + (this.wave * 0.2);

        switch (this.type) {
            case 'guardian':
                this.name = 'THE GUARDIAN';
                this.size = 60;
                this.maxHp = Math.floor(baseHP * waveMultiplier);
                this.hp = this.maxHp;
                this.color = '#00ffff';
                this.secondaryColor = '#0088ff';
                this.speed = 2;
                this.points = 5000 * Math.ceil(this.wave / 5);
                this.shape = 'hexagon';
                this.hasShield = true;
                this.shieldHP = 50;
                this.attackPatterns = ['spread', 'laser', 'spiral'];
                break;

            case 'destroyer':
                this.name = 'THE DESTROYER';
                this.size = 80;
                this.maxHp = Math.floor(baseHP * 1.5 * waveMultiplier);
                this.hp = this.maxHp;
                this.color = '#ff0000';
                this.secondaryColor = '#ff6600';
                this.speed = 1.5;
                this.points = 7500 * Math.ceil(this.wave / 5);
                this.shape = 'square';
                this.hasShield = false;
                this.attackPatterns = ['barrage', 'missiles', 'slam'];
                break;

            case 'phantom':
                this.name = 'THE PHANTOM';
                this.size = 50;
                this.maxHp = Math.floor(baseHP * 0.8 * waveMultiplier);
                this.hp = this.maxHp;
                this.color = '#aa00ff';
                this.secondaryColor = '#ff00ff';
                this.speed = 4;
                this.points = 6000 * Math.ceil(this.wave / 5);
                this.shape = 'triangle';
                this.hasShield = false;
                this.canTeleport = true;
                this.attackPatterns = ['blink', 'clone', 'vortex'];
                break;

            case 'mothership':
                this.name = 'THE MOTHERSHIP';
                this.size = 100;
                this.maxHp = Math.floor(baseHP * 2 * waveMultiplier);
                this.hp = this.maxHp;
                this.color = '#ffff00';
                this.secondaryColor = '#ff8800';
                this.speed = 1;
                this.points = 10000 * Math.ceil(this.wave / 5);
                this.shape = 'diamond';
                this.hasShield = true;
                this.shieldHP = 100;
                this.canSpawnMinions = true;
                this.attackPatterns = ['spawn', 'beam', 'nova'];
                break;

            case 'overlord':
                this.name = '★ THE OVERLORD ★';
                this.size = 90;
                this.maxHp = Math.floor(baseHP * 2.5 * waveMultiplier);
                this.hp = this.maxHp;
                this.color = '#ffd700';
                this.secondaryColor = '#ff0080';
                this.speed = 2.5;
                this.points = 15000 * Math.ceil(this.wave / 5);
                this.shape = 'star';
                this.hasShield = true;
                this.shieldHP = 75;
                this.canTeleport = true;
                this.canSpawnMinions = true;
                this.attackPatterns = ['all']; // Uses all patterns
                break;
        }

        // Phase thresholds
        this.phase2Threshold = this.maxHp * 0.6;
        this.phase3Threshold = this.maxHp * 0.3;
    }

    update(playerX, playerY, enemyBulletPool, gameState, particleSystem) {
        if (!this.active) return;

        // Death sequence
        if (this.defeated) {
            this.deathTimer++;
            if (this.deathTimer % 10 === 0 && particleSystem) {
                const offsetX = (Math.random() - 0.5) * this.size * 2;
                const offsetY = (Math.random() - 0.5) * this.size * 2;
                particleSystem.addExplosion(this.x + offsetX, this.y + offsetY, this.color, 20);
            }
            if (this.deathTimer > 120) {
                this.active = false;
                if (particleSystem) {
                    particleSystem.addBossExplosion(this.x, this.y);
                }
            }
            return;
        }

        // Entry animation
        if (this.entering) {
            this.y += 2;
            if (this.y >= this.targetY) {
                this.y = this.targetY;
                this.entering = false;
            }
            return;
        }

        // Update phase based on HP
        this.updatePhase();

        // Movement
        this.updateMovement(playerX);

        // Attack
        this.attackTimer++;
        if (this.attackTimer >= this.getAttackDelay()) {
            this.executeAttack(playerX, playerY, enemyBulletPool, gameState, particleSystem);
            this.attackTimer = 0;
            this.attackPattern = (this.attackPattern + 1) % this.attackPatterns.length;
        }

        // Visual updates
        this.rotation += 0.01;
        this.pulsePhase += 0.05;
        this.shieldRotation += 0.02;
        if (this.damageFlash > 0) this.damageFlash--;
    }

    updatePhase() {
        const oldPhase = this.currentPhase;

        if (this.hp <= this.phase3Threshold) {
            this.currentPhase = 3;
        } else if (this.hp <= this.phase2Threshold) {
            this.currentPhase = 2;
        } else {
            this.currentPhase = 1;
        }

        if (this.currentPhase !== oldPhase) {
            console.log(`⚠️ Boss entering Phase ${this.currentPhase}!`);
            this.phaseTimer = 60; // Phase transition effect
        }

        if (this.phaseTimer > 0) this.phaseTimer--;
    }

    updateMovement(playerX) {
        // Different movement per type
        switch (this.type) {
            case 'guardian':
                // Slow tracking
                const guardianDx = playerX - this.x;
                this.x += Math.sign(guardianDx) * Math.min(Math.abs(guardianDx) * 0.02, this.speed);
                break;

            case 'destroyer':
                // Side to side
                this.x += Math.sin(Date.now() * 0.001) * this.speed;
                break;

            case 'phantom':
                // Erratic movement
                if (Math.random() < 0.02 && this.canTeleport) {
                    this.x = 100 + Math.random() * (this.canvas.width - 200);
                } else {
                    this.x += (Math.random() - 0.5) * this.speed * 3;
                }
                break;

            case 'mothership':
                // Slow drift
                this.x += Math.sin(Date.now() * 0.0005) * this.speed;
                break;

            case 'overlord':
                // Combination - tracking with teleport
                if (Math.random() < 0.01 && this.canTeleport) {
                    this.x = playerX + (Math.random() - 0.5) * 200;
                } else {
                    const overlordDx = playerX - this.x;
                    this.x += Math.sign(overlordDx) * Math.min(Math.abs(overlordDx) * 0.03, this.speed);
                }
                break;
        }

        // Keep in bounds
        this.x = Math.max(this.size, Math.min(this.canvas.width - this.size, this.x));
    }

    getAttackDelay() {
        // Faster attacks in later phases
        const baseDelay = 90;
        const phaseMultiplier = 1 - (this.currentPhase - 1) * 0.2;
        return Math.floor(baseDelay * phaseMultiplier);
    }

    executeAttack(playerX, playerY, enemyBulletPool, gameState, particleSystem) {
        if (!enemyBulletPool) return;

        const pattern = this.attackPatterns[this.attackPattern];

        // Overlord uses random pattern
        const actualPattern = pattern === 'all' ?
            ['spread', 'laser', 'spiral', 'barrage', 'missiles'][Math.floor(Math.random() * 5)] :
            pattern;

        switch (actualPattern) {
            case 'spread':
                this.attackSpread(playerX, playerY, enemyBulletPool);
                break;
            case 'laser':
                this.attackLaser(playerX, playerY, enemyBulletPool, particleSystem);
                break;
            case 'spiral':
                this.attackSpiral(enemyBulletPool);
                break;
            case 'barrage':
                this.attackBarrage(playerX, playerY, enemyBulletPool);
                break;
            case 'missiles':
                this.attackMissiles(playerX, playerY, enemyBulletPool);
                break;
            case 'slam':
                this.attackSlam(playerX, playerY, gameState, particleSystem);
                break;
            case 'blink':
                this.attackBlink(playerX, playerY, enemyBulletPool);
                break;
            case 'clone':
                this.attackClone(enemyBulletPool, particleSystem);
                break;
            case 'vortex':
                this.attackVortex(enemyBulletPool, particleSystem);
                break;
            case 'spawn':
                this.attackSpawn(gameState);
                break;
            case 'beam':
                this.attackBeam(playerX, enemyBulletPool, particleSystem);
                break;
            case 'nova':
                this.attackNova(enemyBulletPool, particleSystem);
                break;
        }
    }

    // Attack patterns
    attackSpread(playerX, playerY, bulletPool) {
        const bulletCount = 5 + this.currentPhase * 2;
        const spreadAngle = Math.PI / 3;
        const baseAngle = Math.atan2(playerY - this.y, playerX - this.x);

        for (let i = 0; i < bulletCount; i++) {
            const angle = baseAngle - spreadAngle / 2 + (spreadAngle * i / (bulletCount - 1));
            bulletPool.spawn(this.x, this.y + this.size / 2,
                Math.cos(angle) * 6, Math.sin(angle) * 6, false,
                { color: this.color, size: 8, damage: 1 });
        }
    }

    attackLaser(playerX, playerY, bulletPool, particleSystem) {
        // Rapid fire line of bullets toward player
        const angle = Math.atan2(playerY - this.y, playerX - this.x);
        const bulletCount = 8;

        for (let i = 0; i < bulletCount; i++) {
            setTimeout(() => {
                if (this.active && !this.defeated) {
                    bulletPool.spawn(this.x, this.y + this.size / 2,
                        Math.cos(angle) * 10, Math.sin(angle) * 10, false,
                        { color: '#ff0000', size: 6, damage: 1 });
                }
            }, i * 50);
        }
    }

    attackSpiral(bulletPool) {
        const bulletCount = 12 * this.currentPhase;

        for (let i = 0; i < bulletCount; i++) {
            setTimeout(() => {
                if (this.active && !this.defeated) {
                    const angle = (Date.now() * 0.005) + (Math.PI * 2 * i / 12);
                    bulletPool.spawn(this.x, this.y,
                        Math.cos(angle) * 5, Math.sin(angle) * 5, false,
                        { color: this.secondaryColor, size: 7, damage: 1 });
                }
            }, i * 30);
        }
    }

    attackBarrage(playerX, playerY, bulletPool) {
        // Random spread of many bullets
        const bulletCount = 15 + this.currentPhase * 5;

        for (let i = 0; i < bulletCount; i++) {
            const angle = Math.atan2(playerY - this.y, playerX - this.x) + (Math.random() - 0.5) * 0.8;
            const speed = 4 + Math.random() * 4;

            bulletPool.spawn(this.x + (Math.random() - 0.5) * this.size,
                this.y + this.size / 2,
                Math.cos(angle) * speed, Math.sin(angle) * speed, false,
                { color: this.color, size: 6, damage: 1 });
        }
    }

    attackMissiles(playerX, playerY, bulletPool) {
        // Slower homing-ish bullets
        const missileCount = 3 + this.currentPhase;

        for (let i = 0; i < missileCount; i++) {
            const offsetX = (i - missileCount / 2) * 30;

            bulletPool.spawn(this.x + offsetX, this.y + this.size / 2,
                0, 3, false,
                {
                    color: '#ff8800',
                    size: 10,
                    damage: 2,
                    homing: true,
                    homingStrength: 0.02
                });
        }
    }

    attackSlam(playerX, playerY, gameState, particleSystem) {
        // Destroyer charges down briefly
        const originalY = this.y;
        this.y += 150;

        if (particleSystem) {
            particleSystem.addExplosion(this.x, this.y + this.size, '#ff6600', 25);
        }

        // Screen shake
        if (gameState?.screenShake) {
            gameState.screenShake.intensity = 20;
            gameState.screenShake.duration = 30;
        }

        // Return after delay
        setTimeout(() => {
            this.y = originalY;
        }, 500);
    }

    attackBlink(playerX, playerY, bulletPool) {
        // Teleport and fire in all directions
        this.x = 100 + Math.random() * (this.canvas.width - 200);

        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            bulletPool.spawn(this.x, this.y,
                Math.cos(angle) * 6, Math.sin(angle) * 6, false,
                { color: this.color, size: 7, damage: 1 });
        }
    }

    attackClone(bulletPool, particleSystem) {
        // Fire from multiple positions
        const positions = [
            this.canvas.width * 0.25,
            this.canvas.width * 0.5,
            this.canvas.width * 0.75
        ];

        for (const x of positions) {
            if (particleSystem) {
                particleSystem.addExplosion(x, this.y, this.color, 10);
            }

            for (let i = 0; i < 3; i++) {
                const angle = Math.PI / 2 + (i - 1) * 0.3;
                bulletPool.spawn(x, this.y,
                    Math.cos(angle) * 5, Math.sin(angle) * 5, false,
                    { color: this.secondaryColor, size: 6, damage: 1 });
            }
        }
    }

    attackVortex(bulletPool, particleSystem) {
        // Circular expanding pattern
        const rings = 2 + this.currentPhase;

        for (let ring = 0; ring < rings; ring++) {
            setTimeout(() => {
                if (this.active && !this.defeated) {
                    const bulletCount = 16;
                    for (let i = 0; i < bulletCount; i++) {
                        const angle = (Math.PI * 2 * i) / bulletCount;
                        bulletPool.spawn(this.x, this.y,
                            Math.cos(angle) * (3 + ring), Math.sin(angle) * (3 + ring), false,
                            { color: this.color, size: 5, damage: 1 });
                    }
                }
            }, ring * 200);
        }
    }

    attackSpawn(gameState) {
        if (!gameState || !this.canSpawnMinions) return;

        // Dynamically import Enemy to avoid circular dependencies
        import('./Enemy.js').then(({ Enemy }) => {
            const minionCount = 2 + this.currentPhase;

            for (let i = 0; i < minionCount; i++) {
                const x = this.x + (Math.random() - 0.5) * 100;
                const enemy = new Enemy(x, this.y + this.size, 'triangle', gameState);
                if (gameState.enemies) {
                    gameState.enemies.push(enemy);
                }
            }
        }).catch(() => {
            console.warn('Could not spawn minions - Enemy import failed');
        });
    }

    attackBeam(playerX, bulletPool, particleSystem) {
        // Vertical beam of bullets
        const beamX = playerX;

        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                if (this.active && !this.defeated) {
                    bulletPool.spawn(beamX + (Math.random() - 0.5) * 30, -10,
                        0, 12, false,
                        { color: '#ffff00', size: 8, damage: 1 });
                }
            }, i * 30);
        }

        // Warning line
        if (particleSystem) {
            for (let y = 0; y < this.canvas.height; y += 30) {
                particleSystem.addParticle({
                    x: beamX,
                    y: y,
                    vx: 0,
                    vy: 0,
                    life: 20,
                    size: 3,
                    color: '#ffff00'
                });
            }
        }
    }

    attackNova(bulletPool, particleSystem) {
        // Massive expanding ring
        const bulletCount = 32;

        for (let wave = 0; wave < 3; wave++) {
            setTimeout(() => {
                if (this.active && !this.defeated) {
                    for (let i = 0; i < bulletCount; i++) {
                        const angle = (Math.PI * 2 * i) / bulletCount + (wave * 0.1);
                        bulletPool.spawn(this.x, this.y,
                            Math.cos(angle) * 4, Math.sin(angle) * 4, false,
                            { color: wave === 1 ? '#ffffff' : this.color, size: 6, damage: 1 });
                    }
                }
            }, wave * 300);
        }
    }

    takeDamage(amount = 1) {
        // Shield absorbs damage first
        if (this.hasShield && this.shieldHP > 0) {
            this.shieldHP -= amount;
            this.damageFlash = 10;

            if (this.shieldHP <= 0) {
                this.hasShield = false;
                console.log('🛡️ Boss shield destroyed!');
            }
            return false;
        }

        this.hp -= amount;
        this.damageFlash = 15;

        if (this.hp <= 0) {
            this.defeated = true;
            return true;
        }

        return false;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Death animation
        if (this.defeated) {
            ctx.rotate(this.deathTimer * 0.1);
            ctx.globalAlpha = 1 - (this.deathTimer / 120);
        }

        // Damage flash
        if (this.damageFlash > 0) {
            ctx.shadowBlur = 50;
            ctx.shadowColor = '#ffffff';
        } else {
            ctx.shadowBlur = 30;
            ctx.shadowColor = this.color;
        }

        // Phase transition effect
        if (this.phaseTimer > 0) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.globalAlpha = this.phaseTimer / 60;
            ctx.beginPath();
            ctx.arc(0, 0, this.size + 30 + (60 - this.phaseTimer), 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Shield
        if (this.hasShield && this.shieldHP > 0) {
            ctx.save();
            ctx.rotate(this.shieldRotation);
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.2;
            ctx.setLineDash([10, 10]);
            ctx.beginPath();
            ctx.arc(0, 0, this.size + 20, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }

        // Draw shape
        ctx.fillStyle = this.damageFlash > 0 ? '#ffffff' : this.color + '88';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;

        this.drawShape(ctx);

        // Inner glow
        ctx.strokeStyle = this.secondaryColor;
        ctx.lineWidth = 2;
        ctx.scale(0.7, 0.7);
        this.drawShape(ctx);

        ctx.restore();

        // Health bar
        this.drawHealthBar(ctx);

        // Name
        this.drawName(ctx);
    }

    drawShape(ctx) {
        ctx.beginPath();

        switch (this.shape) {
            case 'hexagon':
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                    const x = Math.cos(angle) * this.size;
                    const y = Math.sin(angle) * this.size;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                break;

            case 'square':
                ctx.rect(-this.size, -this.size, this.size * 2, this.size * 2);
                break;

            case 'triangle':
                ctx.moveTo(0, -this.size);
                ctx.lineTo(-this.size, this.size);
                ctx.lineTo(this.size, this.size);
                break;

            case 'diamond':
                ctx.moveTo(0, -this.size);
                ctx.lineTo(this.size, 0);
                ctx.lineTo(0, this.size);
                ctx.lineTo(-this.size, 0);
                break;

            case 'star':
                for (let i = 0; i < 10; i++) {
                    const radius = i % 2 === 0 ? this.size : this.size * 0.5;
                    const angle = (Math.PI * i) / 5 - Math.PI / 2;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                break;
        }

        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawHealthBar(ctx) {
        const barWidth = 200;
        const barHeight = 20;
        const x = this.canvas.width / 2 - barWidth / 2;
        const y = 20;

        // Background
        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y, barWidth, barHeight);

        // Health
        const healthPercent = this.hp / this.maxHp;
        const healthColor = healthPercent > 0.5 ? '#00ff00' :
                           healthPercent > 0.25 ? '#ffff00' : '#ff0000';

        ctx.fillStyle = healthColor;
        ctx.shadowBlur = 10;
        ctx.shadowColor = healthColor;
        ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

        // Shield bar (if applicable)
        if (this.hasShield && this.shieldHP > 0) {
            const shieldPercent = this.shieldHP / 100;
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(x, y + barHeight + 5, barWidth * shieldPercent, 5);
        }

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
        ctx.strokeRect(x, y, barWidth, barHeight);

        // Phase indicators
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + barWidth * 0.6, y, 2, barHeight);
        ctx.fillRect(x + barWidth * 0.3, y, 2, barHeight);
    }

    drawName(ctx) {
        ctx.save();
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillText(this.name, this.canvas.width / 2, 55);

        // Phase indicator
        ctx.font = '12px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`PHASE ${this.currentPhase}`, this.canvas.width / 2, 70);
        ctx.restore();
    }
}
