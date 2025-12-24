// ============================================
// GEOMETRY 3044 — ENEMY CLASS (REFACTORED)
// ============================================
// Refactored to use data-driven configuration
// for cleaner, more maintainable enemy definitions
// ============================================

import { config, getCurrentTheme } from '../config.js';

// ============================================
// ENEMY CONFIGURATION DATA
// Each enemy type is defined by a config object
// with base stats and wave/intelligence scaling
// ============================================
const ENEMY_CONFIG = {
    triangle: {
        sides: 3,
        size: 15,
        hp: { base: 1, waveScale: 0.15 },  // Now scales slightly (was no scaling)
        speed: { base: 2.2, waveScale: 0.15, min: 1.8 },  // Reduced speed scaling
        color: '#ff3366',
        points: { base: 100, waveScale: 15 },
        behavior: 'aggressive',
        fireRate: { base: 120, intScale: -12, min: 60 },  // Slightly slower min fire rate
        bulletSpeed: { base: 5, intScale: 0.4 },  // Reduced bullet speed scaling
        dodgeChance: { base: 0.05, intScale: 0.02 },  // Reduced dodge scaling
        role: 'scout'
    },
    square: {
        sides: 4,
        size: 25,
        hp: { base: 3, waveScale: 0.35 },  // Reduced HP scaling (was 0.5)
        speed: { base: 1.5, waveScale: 0.06, min: 1.0 },  // Slower speed scaling
        color: '#ff8800',
        points: { base: 200, waveScale: 25 },
        behavior: 'patrol',
        fireRate: { base: 180, intScale: -15, min: 100 },  // Slower fire rate
        bulletSpeed: { base: 4, intScale: 0.25 },  // Reduced bullet speed scaling
        dodgeChance: { base: 0.02, intScale: 0.015 },  // Reduced dodge scaling
        role: 'heavy',
        special: (enemy, wave, intelligence) => {
            enemy.shieldActive = intelligence >= 3;  // Higher intelligence required (was 2)
            enemy.shieldStrength = Math.max(1, intelligence - 1);  // Weaker shield
        }
    },
    pentagon: {
        sides: 5,
        size: 20,
        hp: { base: 2, waveScale: 0.25 },  // Reduced HP scaling (was 1/3)
        speed: { base: 1.2, waveScale: 0.05, min: 0.8 },
        color: '#aa00ff',
        points: { base: 300, waveScale: 35 },
        behavior: 'sniper',
        fireRate: { base: 200, intScale: -20, min: 120 },  // Slower min fire rate
        bulletSpeed: { base: 7, intScale: 0.5 },  // Reduced base and scaling (was 8/0.8)
        dodgeChance: { base: 0.08, intScale: 0.03 },  // Reduced dodge
        role: 'sniper',
        special: (enemy, wave, intelligence) => {
            enemy.aimPrediction = intelligence >= 2;  // Requires higher intelligence (was 1)
            enemy.burstFire = intelligence >= 4;  // Requires higher intelligence (was 3)
            enemy.burstCount = 2;  // Reduced burst count (was 3)
        }
    },
    divebomber: {
        sides: 3,
        size: 18,
        hp: { base: 2 },
        speed: { base: 0.5 },
        color: '#ff0044',
        points: { base: 250, waveScale: 30 },
        behavior: 'dive',
        fireRate: { base: 999 }, // Doesn't shoot, just dives
        role: 'bomber',
        special: (enemy, wave) => {
            enemy.diveSpeed = 12 + (wave * 0.5);
            enemy.diving = false;
            enemy.diveTarget = { x: 0, y: 0 };
        }
    },
    sinewave: {
        sides: 6,
        size: 22,
        hp: { base: 3, waveScale: 0.35 },  // Reduced HP (was 4/0.5)
        speed: { base: 2, waveScale: 0.08 },  // Slightly slower scaling
        color: '#00ffaa',
        points: { base: 400, waveScale: 50 },
        behavior: 'sinewave',
        fireRate: { base: 110, intScale: -8, min: 70 },  // Slower fire rate
        bulletSpeed: { base: 5.5, intScale: 0.4 },  // Slightly slower bullets
        bulletPattern: 'spread',
        role: 'elite',
        special: (enemy, wave) => {
            enemy.sineAmplitude = 80 + (wave * 4);  // Reduced amplitude
            enemy.sineFrequency = 0.02 + (wave * 0.0015);  // Slower frequency scaling
            enemy.sineOffset = Math.random() * Math.PI * 2;
        }
    },
    // 8-BIT INSPIRED ENEMIES
    pixelskull: {
        sides: 0,
        size: 24,
        hp: { base: 3, waveScale: 0.5 },
        speed: { base: 1.5, waveScale: 0.1 },
        color: '#ff00ff',
        secondaryColor: '#00ffff',
        points: { base: 350, waveScale: 40 },
        behavior: 'phase',
        fireRate: { base: 140, intScale: -15, min: 70 },
        bulletSpeed: { base: 5, intScale: 0.4 },
        role: 'phase',
        customDraw: 'skull',
        special: (enemy) => {
            enemy.phaseTimer = 0;
            enemy.isPhased = false;
            enemy.phaseDuration = 60;
            enemy.eyeGlow = 0;
        }
    },
    ghostbyte: {
        sides: 0,
        size: 20,
        hp: { base: 2, waveScale: 1/3 },
        speed: { base: 1.0, waveScale: 0.08 },
        color: '#88ffff',
        secondaryColor: '#ffffff',
        points: { base: 275, waveScale: 30 },
        behavior: 'ghost',
        fireRate: { base: 150, intScale: -12, min: 80 },
        bulletSpeed: { base: 4, intScale: 0.3 },
        role: 'ghost',
        customDraw: 'ghost',
        special: (enemy) => {
            enemy.floatOffset = Math.random() * Math.PI * 2;
            enemy.transparency = 1;
            enemy.ghostTimer = 0;
        }
    },
    laserdisc: {
        sides: 0,
        size: 18,
        hp: { base: 2, waveScale: 0.25 },  // Reduced HP scaling
        speed: { base: 2.2, waveScale: 0.12 },  // Slightly slower
        color: '#ff6600',
        secondaryColor: '#ffff00',
        points: { base: 325, waveScale: 35 },
        behavior: 'orbit',
        fireRate: { base: 110, intScale: -8, min: 70 },  // Much slower fire rate (was 80/40)
        bulletSpeed: { base: 6, intScale: 0.4 },  // Slower bullets
        bulletPattern: 'laser',
        role: 'laser',
        customDraw: 'disc',
        special: (enemy, wave, intelligence) => {
            enemy.spinSpeed = 0.12 + (intelligence * 0.015);  // Slower spin
            enemy.orbitRadius = 50 + (wave * 2);  // Smaller orbit growth
            enemy.orbitCenter = { x: 0, y: 0 };
            enemy.orbitAngle = Math.random() * Math.PI * 2;
        }
    },
    vhstracker: {
        sides: 0,
        size: 22,
        hp: { base: 3, waveScale: 0.5 },
        speed: { base: 3, waveScale: 0.2 },
        color: '#00ff00',
        secondaryColor: '#ff0000',
        tertiaryColor: '#0000ff',
        points: { base: 400, waveScale: 45 },
        behavior: 'glitch',
        fireRate: { base: 120, intScale: -12, min: 60 },
        bulletSpeed: { base: 6, intScale: 0.5 },
        role: 'tracker',
        customDraw: 'vhs',
        special: (enemy, wave, intelligence) => {
            enemy.glitchTimer = 0;
            enemy.glitchInterval = 90 - (intelligence * 10);
            enemy.scanlines = [];
            enemy.distortionAmount = 0;
        }
    },
    arcadeboss: {
        sides: 0,
        size: 32,  // Slightly smaller
        hp: { base: 5, waveScale: 0.5 },  // Reduced HP significantly (was 8/1)
        speed: { base: 0.8, waveScale: 0.04 },
        color: '#ffff00',
        secondaryColor: '#ff00ff',
        points: { base: 600, waveScale: 50 },  // Reduced points to match difficulty
        behavior: 'boss',
        fireRate: { base: 120, intScale: -8, min: 70 },  // Slower fire rate
        bulletSpeed: { base: 4.5, intScale: 0.3 },  // Slower bullets
        role: 'miniboss',
        customDraw: 'arcade',
        special: (enemy, wave, intelligence) => {
            enemy.spawnTimer = 0;
            enemy.spawnInterval = 200 - (intelligence * 10);  // Slower spawn interval
            enemy.screenGlow = 0;
        }
    },
    synthwave: {
        sides: 0,
        size: 20,
        hp: { base: 2, waveScale: 1/3 },
        speed: { base: 2, waveScale: 0.12 },
        color: '#ff0080',
        secondaryColor: '#00ffff',
        tertiaryColor: '#ffff00',
        points: { base: 300, waveScale: 35 },
        behavior: 'pulse',
        fireRate: { base: 90, intScale: -10, min: 45 },
        bulletSpeed: { base: 5.5, intScale: 0.45 },
        role: 'synthwave',
        customDraw: 'synthwave',
        special: (enemy) => {
            enemy.pulsePhase = Math.random() * Math.PI * 2;
            enemy.waveAmplitude = 30;
            enemy.neonTrails = [];
            enemy.neonTrailTimer = 0;
        }
    },
    pixelinvader: {
        sides: 0,
        size: 24,
        hp: { base: 2, waveScale: 0.25 },
        speed: { base: 1.2, waveScale: 0.08 },
        color: '#00ff00',
        secondaryColor: '#88ff88',
        points: { base: 250, waveScale: 25 },
        behavior: 'invader',
        fireRate: { base: 160, intScale: -15, min: 90 },
        bulletSpeed: { base: 4, intScale: 0.3 },
        role: 'invader',
        customDraw: 'invader',
        special: (enemy) => {
            enemy.stepTimer = 0;
            enemy.stepDirection = 1;
            enemy.stepDistance = 30;
            enemy.descendAmount = 20;
            enemy.legFrame = 0;
        }
    }
};

// ============================================
// BEHAVIOR DISPATCH MAP
// Maps behavior names to method names for cleaner dispatching
// All behavior methods receive (playerX, playerY, canvas, deltaTime)
// ============================================
const BEHAVIOR_DISPATCH = {
    aggressive: 'aggressiveBehavior',
    patrol: 'patrolBehavior',
    sniper: 'sniperBehavior',
    dive: 'diveBehavior',
    sinewave: 'sinewaveBehavior',
    flee: 'fleeBehavior',
    phase: 'phaseBehavior',
    ghost: 'ghostBehavior',
    orbit: 'orbitBehavior',
    glitch: 'glitchBehavior',
    boss: 'bossBehavior',
    pulse: 'pulseBehavior',
    invader: 'invaderBehavior'
};

// ============================================
// CUSTOM DRAW DISPATCH MAP
// Maps customDraw types to method names
// ============================================
const CUSTOM_DRAW_DISPATCH = {
    skull: 'drawPixelSkull',
    ghost: 'drawGhostByte',
    disc: 'drawLaserDisc',
    vhs: 'drawVHSTracker',
    arcade: 'drawArcadeBoss',
    synthwave: 'drawSynthwave',
    invader: 'drawPixelInvader'
};

export class Enemy {
    constructor(x, y, type, gameState) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;
        this.alive = true;
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
        const intelligenceLevel = Math.min(Math.floor(currentWave / 3), 5);

        // Get difficulty settings (default to normal if not available)
        const difficulty = gameState?.difficultySettings || {
            enemySpeed: 1.0,
            enemyFireRate: 1.0,
            enemyBulletSpeed: 1.0,
            enemyHP: 1.0
        };
        this.difficultySettings = difficulty;

        // Setup enemy from configuration (defaults to triangle if unknown type)
        const cfg = ENEMY_CONFIG[type] || ENEMY_CONFIG.triangle;
        this.setupFromConfig(cfg, currentWave, intelligenceLevel, difficulty, gameState);

        // Store original values for fever mode
        this.originalBehavior = this.behavior;
        this.originalColor = this.color;
        this.originalSpeed = this.speed;
        this.intelligence = intelligenceLevel;
        this.reactionTime = Math.max(10, 60 - (intelligenceLevel * 10));

        // Sidescroller mode flag (set by WaveManager when spawning)
        this.sidescrollerMode = false;
    }

    /**
     * Applies configuration to this enemy instance
     * Handles scaling calculations for wave and intelligence level
     * @param {Object} cfg - Enemy configuration
     * @param {number} wave - Current wave number
     * @param {number} intelligence - Intelligence level (0-5)
     * @param {Object} difficulty - Difficulty settings with multipliers
     */
    setupFromConfig(cfg, wave, intelligence, difficulty = {}, gameState = null) {
        const {
            enemySpeed = 1.0,
            enemyFireRate = 1.0,
            enemyBulletSpeed = 1.0,
            enemyHP = 1.0
        } = difficulty;

        // Daily Challenge modifiers from gameState
        const challengeSizeMultiplier = gameState?.enemySizeMultiplier || 1.0;
        const challengeSpeedMultiplier = gameState?.enemySpeedMultiplier || 1.0;
        const challengeFireRateMultiplier = gameState?.enemyFireRateMultiplier || 1.0;
        const challengeHealthMultiplier = gameState?.enemyHealthMultiplier || 1.0;

        // Static properties
        this.sides = cfg.sides;
        this.baseSize = cfg.size;
        this.size = cfg.size * challengeSizeMultiplier;
        this.color = cfg.color;
        this.behavior = cfg.behavior;
        this.role = cfg.role;

        // Optional colors for 8-bit enemies
        if (cfg.secondaryColor) this.secondaryColor = cfg.secondaryColor;
        if (cfg.tertiaryColor) this.tertiaryColor = cfg.tertiaryColor;
        if (cfg.customDraw) this.customDraw = cfg.customDraw;
        if (cfg.bulletPattern) this.bulletPattern = cfg.bulletPattern;

        // Scaled HP with difficulty multiplier and challenge modifier
        const baseHP = this.calcScaledInt(cfg.hp, wave);
        this.hp = Math.max(1, Math.ceil(baseHP * enemyHP * challengeHealthMultiplier));

        // Scaled speed with difficulty multiplier and challenge modifier
        const baseSpeed = this.calcScaledValue(cfg.speed, wave);
        this.speed = baseSpeed * enemySpeed * challengeSpeedMultiplier;

        // Scaled points
        this.points = this.calcScaledInt(cfg.points, wave);

        // Scaled fire rate with difficulty multiplier and challenge modifier
        // Lower fireRate value = faster shooting
        // challengeFireRateMultiplier > 1 means FASTER shooting (bullet hell)
        const baseFireRate = cfg.fireRate
            ? this.calcScaledValue(cfg.fireRate, intelligence, 'intScale')
            : 999;
        this.fireRate = Math.max(5, Math.floor(baseFireRate * enemyFireRate / challengeFireRateMultiplier));

        // Scaled bullet speed with difficulty multiplier
        const baseBulletSpeed = cfg.bulletSpeed
            ? this.calcScaledValue(cfg.bulletSpeed, intelligence, 'intScale')
            : 0;
        this.bulletSpeed = baseBulletSpeed * enemyBulletSpeed;

        // Scaled dodge chance (optional)
        this.dodgeChance = cfg.dodgeChance
            ? this.calcScaledValue(cfg.dodgeChance, intelligence, 'intScale')
            : 0;

        // Apply type-specific special initialization
        if (cfg.special) {
            cfg.special(this, wave, intelligence);
        }
    }

    /**
     * Calculate a scaled value: base + (multiplier * scale), with optional min/max
     */
    calcScaledValue(prop, multiplier, scaleKey = 'waveScale') {
        if (typeof prop === 'number') return prop;
        let value = prop.base + (multiplier * (prop[scaleKey] || 0));
        if (prop.min !== undefined) value = Math.max(prop.min, value);
        if (prop.max !== undefined) value = Math.min(prop.max, value);
        return value;
    }

    /**
     * Calculate a scaled integer value (uses floor for partial wave scaling)
     */
    calcScaledInt(prop, multiplier) {
        if (typeof prop === 'number') return prop;
        return prop.base + Math.floor(multiplier * (prop.waveScale || 0));
    }

    update(playerX, playerY, canvas, enemyBulletPool, gameState, particleSystem, deltaTime = 1) {
        if (!this.active) return;

        // Store gameState reference for use in takeDamage
        this.gameState = gameState;

        const scaledDeltaTime = Math.max(deltaTime, 0);
        this.moveTimer += scaledDeltaTime;
        this.fireTimer += scaledDeltaTime;
        this.glowPulse = (this.glowPulse + 0.1 * scaledDeltaTime) % (Math.PI * 2);
        this.rotation += 0.02 * scaledDeltaTime;

        // Store player position for AI
        this.lastPlayerX = playerX;
        this.lastPlayerY = playerY;

        // Execute behavior using dispatch map for cleaner code
        const behaviorMethod = BEHAVIOR_DISPATCH[this.behavior];
        if (behaviorMethod && typeof this[behaviorMethod] === 'function') {
            this[behaviorMethod](playerX, playerY, canvas, scaledDeltaTime);
        } else {
            // Default behavior for unknown behavior types
            this.defaultBehavior(canvas, scaledDeltaTime);
        }

        // Try to dodge player bullets
        if (this.dodgeChance > 0 && Math.random() < this.dodgeChance * 0.1 * scaledDeltaTime) {
            this.tryDodge(gameState);
        }

        // Fire at player
        if (this.fireTimer >= this.fireRate && this.behavior !== 'dive') {
            this.shoot(playerX, playerY, enemyBulletPool);
            this.fireTimer = 0;
        }

        // Remove if off screen (different bounds for sidescroller mode)
        if (this.sidescrollerMode) {
            // In sidescroller, enemies exit on the left side
            if (this.x < -50 || this.y < -50 || this.y > canvas.logicalHeight + 50) {
                this.active = false;
            }
        } else {
            // Normal mode: enemies exit at bottom
            if (this.y > canvas.logicalHeight + 50 || this.x < -50 || this.x > canvas.logicalWidth + 50) {
                this.active = false;
            }
        }
    }

    /**
     * Default behavior for unknown behavior types
     * Moves enemy in the appropriate direction based on game mode
     */
    defaultBehavior(canvas, deltaTime) {
        if (this.sidescrollerMode) {
            this.x -= this.speed * deltaTime; // Move left in sidescroller
        } else {
            this.y += this.speed * deltaTime; // Move down in normal
        }
    }

    aggressiveBehavior(playerX, playerY, canvas, deltaTime) {
        if (this.sidescrollerMode) {
            // Sidescroller: Move toward player vertically, left horizontally
            const dy = playerY - this.y;
            const step = Math.min(Math.abs(dy) * 0.02, this.speed);
            this.y += Math.sign(dy) * step * deltaTime;
            this.x -= this.speed * deltaTime; // Move left

            // Bounds
            this.y = Math.max(this.size, Math.min(canvas.logicalHeight - this.size, this.y));
        } else {
            // Normal: Move toward player horizontally, down vertically
            const dx = playerX - this.x;
            const step = Math.min(Math.abs(dx) * 0.02, this.speed);
            this.x += Math.sign(dx) * step * deltaTime;
            this.y += this.speed * deltaTime;

            // Bounds
            this.x = Math.max(this.size, Math.min(canvas.logicalWidth - this.size, this.x));
        }
    }

    patrolBehavior(playerX, playerY, canvas, deltaTime) {
        if (this.sidescrollerMode) {
            // Sidescroller: Move in vertical wave pattern, left horizontally
            this.y += Math.sin(this.moveTimer * 0.03) * this.speed * 2 * deltaTime;
            this.x -= this.speed * 0.5 * deltaTime;

            // Bounds
            this.y = Math.max(this.size, Math.min(canvas.logicalHeight - this.size, this.y));
        } else {
            // Normal: Move in horizontal pattern, down
            this.x += Math.sin(this.moveTimer * 0.03) * this.speed * 2 * deltaTime;
            this.y += this.speed * 0.5 * deltaTime;

            // Bounds
            this.x = Math.max(this.size, Math.min(canvas.logicalWidth - this.size, this.x));
        }
    }

    sniperBehavior(playerX, playerY, canvas, deltaTime) {
        // Stay at top, strafe slowly
        if (this.y < 100) {
            this.y += this.speed * deltaTime;
        } else {
            // Strafe to get better angle
            const dx = playerX - this.x;
            this.x += Math.sign(dx) * Math.min(0.5, Math.abs(dx) * 0.005) * deltaTime;
        }

        this.x = Math.max(this.size, Math.min(canvas.logicalWidth - this.size, this.x));
    }

    diveBehavior(playerX, playerY, canvas, deltaTime) {
        if (!this.diving) {
            // Approach slowly
            this.y += this.speed * deltaTime;

            // Start dive when close enough
            if (this.y > 100 && Math.random() < 0.02 * deltaTime) {
                this.diving = true;
                this.diveTarget = { x: playerX, y: playerY + 50 };
            }
        } else {
            // DIVE!
            const angle = Math.atan2(this.diveTarget.y - this.y, this.diveTarget.x - this.x);
            this.x += Math.cos(angle) * this.diveSpeed * deltaTime;
            this.y += Math.sin(angle) * this.diveSpeed * deltaTime;
        }
    }

    sinewaveBehavior(playerX, playerY, canvas, deltaTime) {
        if (this.sidescrollerMode) {
            // Sidescroller: Wave up/down while moving left
            this.x -= this.speed * deltaTime;
            this.y = (canvas.logicalHeight / 2) + Math.sin(this.moveTimer * this.sineFrequency + this.sineOffset) * this.sineAmplitude;
        } else {
            // Normal: Wave left/right while moving down
            this.y += this.speed * deltaTime;
            this.x = (canvas.logicalWidth / 2) + Math.sin(this.moveTimer * this.sineFrequency + this.sineOffset) * this.sineAmplitude;
        }
    }

    fleeBehavior(playerX, playerY, canvas, deltaTime) {
        // Run away from player (fever mode)
        const dx = this.x - playerX;
        const dy = this.y - playerY;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            this.x += (dx / dist) * this.speed * 2 * deltaTime;
            this.y += (dy / dist) * this.speed * 0.5 * deltaTime;
        }

        this.x = Math.max(this.size, Math.min(canvas.logicalWidth - this.size, this.x));
        this.y = Math.max(this.size, Math.min(canvas.logicalHeight - this.size, this.y));
    }

    // ============================================
    // NEW 8-BIT ENEMY BEHAVIORS
    // ============================================

    phaseBehavior(playerX, playerY, canvas, deltaTime) {
        this.phaseTimer += deltaTime;
        this.eyeGlow = (Math.sin(this.moveTimer * 0.1) + 1) / 2;

        // Phase in/out every phaseDuration frames
        if (this.phaseTimer >= this.phaseDuration) {
            this.isPhased = !this.isPhased;
            this.phaseTimer -= this.phaseDuration;
        }

        // Move toward player when visible
        if (!this.isPhased) {
            const dx = playerX - this.x;
            const dy = playerY - this.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0) {
                this.x += (dx / dist) * this.speed * deltaTime;
                this.y += (dy / dist) * this.speed * 0.5 * deltaTime;
            }
        } else {
            // Float down slowly when phased
            this.y += this.speed * 0.3 * deltaTime;
        }

        this.x = Math.max(this.size, Math.min(canvas.logicalWidth - this.size, this.x));
    }

    ghostBehavior(playerX, playerY, canvas, deltaTime) {
        this.ghostTimer += deltaTime;
        this.floatOffset += 0.05 * deltaTime;

        // Ghostly floating movement
        const floatX = Math.sin(this.floatOffset) * 2;
        const floatY = Math.cos(this.floatOffset * 0.7) * 1.5;

        this.x += floatX * deltaTime;
        this.y += (this.speed + floatY) * deltaTime;

        // Transparency fluctuation - become intangible sometimes
        this.transparency = 0.4 + Math.sin(this.ghostTimer * 0.03) * 0.6;

        this.x = Math.max(this.size, Math.min(canvas.logicalWidth - this.size, this.x));
    }

    orbitBehavior(playerX, playerY, canvas, deltaTime) {
        // Set orbit center if not set
        if (this.orbitCenter.x === 0 && this.orbitCenter.y === 0) {
            this.orbitCenter = { x: this.x, y: this.y };
        }

        // Move orbit center down
        this.orbitCenter.y += this.speed * 0.5 * deltaTime;

        // Orbit around center
        this.orbitAngle += this.spinSpeed * deltaTime;
        this.x = this.orbitCenter.x + Math.cos(this.orbitAngle) * this.orbitRadius;
        this.y = this.orbitCenter.y + Math.sin(this.orbitAngle) * this.orbitRadius * 0.5;

        this.x = Math.max(this.size, Math.min(canvas.logicalWidth - this.size, this.x));
    }

    glitchBehavior(playerX, playerY, canvas, deltaTime) {
        this.glitchTimer += deltaTime;
        this.distortionAmount = Math.sin(this.moveTimer * 0.2) * 5;

        // Track toward player
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            this.x += (dx / dist) * this.speed * deltaTime;
            this.y += (dy / dist) * this.speed * 0.3 * deltaTime;
        }

        // Glitch teleport
        if (this.glitchTimer >= this.glitchInterval) {
            this.glitchTimer -= this.glitchInterval;
            // Teleport randomly nearby
            this.x += (Math.random() - 0.5) * 100;
            this.y += (Math.random() - 0.5) * 50;
        }

        this.x = Math.max(this.size, Math.min(canvas.logicalWidth - this.size, this.x));
        this.y = Math.max(this.size, Math.min(canvas.logicalHeight - this.size, this.y));
    }

    bossBehavior(playerX, playerY, canvas, deltaTime) {
        this.screenGlow = (Math.sin(this.moveTimer * 0.05) + 1) / 2;

        // Move slowly side to side at top
        if (this.y < 100) {
            this.y += this.speed * deltaTime;
        } else {
            this.x += Math.sin(this.moveTimer * 0.02) * this.speed * 2 * deltaTime;
        }

        this.x = Math.max(this.size, Math.min(canvas.logicalWidth - this.size, this.x));
    }

    pulseBehavior(playerX, playerY, canvas, deltaTime) {
        this.pulsePhase += 0.08 * deltaTime;

        // Pulsing movement with wave pattern
        const pulseOffset = Math.sin(this.pulsePhase) * this.waveAmplitude;
        this.x = (canvas.logicalWidth / 2) + pulseOffset + Math.sin(this.moveTimer * 0.03) * 50;
        this.y += this.speed * deltaTime;

        // Update neon trail
        this.neonTrailTimer = (this.neonTrailTimer || 0) + deltaTime;
        while (this.neonTrailTimer >= 3) {
            this.neonTrails.push({ x: this.x, y: this.y, life: 20 });
            this.neonTrailTimer -= 3;
        }
        this.neonTrails = this.neonTrails.filter(t => {
            t.life -= deltaTime;
            return t.life > 0;
        });

        this.x = Math.max(this.size, Math.min(canvas.logicalWidth - this.size, this.x));
    }

    invaderBehavior(playerX, playerY, canvas, deltaTime) {
        this.stepTimer += deltaTime;
        this.legFrame = Math.floor(this.moveTimer / 15) % 2;

        // Classic space invader movement
        if (this.stepTimer >= 30) {
            this.stepTimer -= 30;
            this.x += this.stepDirection * this.stepDistance;

            // Hit edge - descend and reverse
            if (this.x >= canvas.logicalWidth - this.size || this.x <= this.size) {
                this.stepDirection *= -1;
                this.y += this.descendAmount;
            }
        }

        // Slow constant downward drift
        this.y += this.speed * 0.2 * deltaTime;
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
        // Daily Challenge: One-hit kill modifier - any damage kills enemy
        if (this.gameState && this.gameState.oneHitKill) {
            this.hp = 0;
            this.active = false;
            return true; // Killed
        }

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

        const shadowsEnabled = typeof config !== 'undefined' && config.rendering?.shadowsEnabled !== false;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Glow effect (reduced shadow blur for performance)
        if (shadowsEnabled) {
            const glowIntensity = 0.5 + Math.sin(this.glowPulse) * 0.3;
            ctx.shadowBlur = 10 * glowIntensity; // Reduced from 20
            ctx.shadowColor = this.color;
        }

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

        // Use dispatch map for cleaner custom drawing
        const drawMethod = CUSTOM_DRAW_DISPATCH[this.customDraw];
        if (drawMethod && typeof this[drawMethod] === 'function') {
            this[drawMethod](ctx, s, pixelSize);
        }
    }

    drawPixelSkull(ctx, s, p) {
        // Phase effect
        if (this.isPhased) {
            ctx.globalAlpha = 0.3 + Math.sin(this.phaseTimer * 0.2) * 0.2;
        }

        ctx.shadowBlur = 8; // Reduced from 15
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
        ctx.shadowBlur = 10; // Reduced from 20
        ctx.fillRect(offsetX + 2 * p, offsetY + 3 * p, p * 2 - 1, p * 2 - 1);
        ctx.fillRect(offsetX + 6 * p, offsetY + 3 * p, p * 2 - 1, p * 2 - 1);

        ctx.globalAlpha = 1;
    }

    drawGhostByte(ctx, s, p) {
        ctx.globalAlpha = this.transparency;
        ctx.shadowBlur = 10; // Reduced from 20
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
        ctx.shadowBlur = 12; // Reduced from 25
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
        ctx.shadowBlur = 15; // Reduced from 30
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
        ctx.shadowBlur = 12; // Reduced from 25

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
        ctx.shadowBlur = 8; // Reduced from 15
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
