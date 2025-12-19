/**
 * Geometry 3044 - Main Entry Point
 * ES6 Module version - BULLETPROOF Edition
 *
 * Priority: Playable game > Perfect features
 * All systems have fallbacks - game will ALWAYS start
 */

import { CONFIG, WAVE_THEMES, getCurrentTheme } from './config.js';
import {
    canvas, ctx, gameState, keys, config,
    cachedUI, setCanvas, setCtx, initCachedUI,
    setGameState, setParticleSystem, setBulletPool,
    setEnemyBulletPool, setWaveManager, setSoundSystem,
    setStarfield, setVhsGlitch, setWeaponManager,
    gameStarting, setGameStarting, setKeys
} from './globals.js';

// Entity modules
import { Player } from './entities/Player.js';
import { Enemy } from './entities/Enemy.js';
import { Bullet } from './entities/Bullet.js';

// System modules
import { BulletPool, ParticleSystem, WaveManager, SoundSystem } from './systems/index.js';

// Effect modules
import { Starfield, VHSGlitchEffects, drawEnhancedCRT, Epic80sExplosion, RadicalSlang } from './effects/index.js';

// Core engine modules
import { GameState, InputHandler, CollisionSystem, GameLoop } from './core/index.js';

// UI modules
import {
    MenuManager, MenuState, HUD, ComboDisplay, RadicalSlangUI,
    OptionsMenu, HUD_THEMES, DEFAULT_THEME, getTheme, getAllThemes
} from './ui/index.js';

// Weapons modules
import { WeaponManager } from './weapons/index.js';

console.log('🎮 Geometry 3044 - BULLETPROOF Edition Loading...');

// ============================================
// FALLBACK CLASSES (used if real ones fail)
// ============================================

class FallbackPlayer {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 20;
        this.speed = 5;
        this.isAlive = true;
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        this.shootCooldown = 0;
        this.health = 100;
        this.maxHealth = 100;
    }

    update(deltaTime, inputHandler, canvas, bulletPool) {
        const keys = inputHandler?.keys || inputHandler?.getKeys?.() || {};

        // Movement
        if (keys['ArrowLeft'] || keys['KeyA']) this.x -= this.speed;
        if (keys['ArrowRight'] || keys['KeyD']) this.x += this.speed;
        if (keys['ArrowUp'] || keys['KeyW']) this.y -= this.speed;
        if (keys['ArrowDown'] || keys['KeyS']) this.y += this.speed;

        // Bounds
        this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));
        this.y = Math.max(this.size, Math.min(canvas.height - this.size, this.y));

        // Shooting
        if (this.shootCooldown > 0) this.shootCooldown -= deltaTime;
        if ((keys['Space'] || keys['KeyZ']) && this.shootCooldown <= 0) {
            this.shoot(bulletPool);
            this.shootCooldown = 10;
        }

        // Invulnerability
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= deltaTime;
            this.invulnerable = this.invulnerableTimer > 0;
        }
    }

    shoot(bulletPool) {
        if (bulletPool && bulletPool.spawn) {
            bulletPool.spawn(this.x, this.y - this.size, 0, -12, true);
        } else if (bulletPool && bulletPool.get) {
            bulletPool.get(this.x, this.y - this.size, 0, -12, true);
        }
    }

    draw(ctx) {
        if (!this.isAlive) return;

        // Flash when invulnerable
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) return;

        ctx.fillStyle = '#00ff00';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ff00';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size);
        ctx.lineTo(this.x - this.size * 0.7, this.y + this.size);
        ctx.lineTo(this.x + this.size * 0.7, this.y + this.size);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    takeDamage(amount = 1) {
        if (this.invulnerable) return false;
        this.isAlive = false;
        return true;
    }

    respawn(x, y) {
        this.x = x;
        this.y = y;
        this.isAlive = true;
        this.invulnerable = true;
        this.invulnerableTimer = 180; // 3 seconds
    }
}

class FallbackBulletPool {
    constructor() {
        this.bullets = [];
        this.maxBullets = 100;
    }

    spawn(x, y, vx, vy, isPlayer = true, options = {}) {
        if (this.bullets.length >= this.maxBullets) {
            this.bullets.shift();
        }

        this.bullets.push({
            x, y, vx, vy,
            isPlayer,
            active: true,
            size: options.size || 5,
            color: options.color || (isPlayer ? '#00ffff' : '#ff0066'),
            damage: options.damage || 10
        });
    }

    get(x, y, vx, vy, isPlayer, options) {
        this.spawn(x, y, vx, vy, isPlayer, options);
    }

    update(canvas, deltaTime = 1) {
        // Update bullets in place to preserve array reference
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            if (!b.active) {
                this.bullets.splice(i, 1);
                continue;
            }

            b.x += b.vx * deltaTime;
            b.y += b.vy * deltaTime;

            if (b.x < -50 || b.x > canvas.width + 50 ||
                b.y < -50 || b.y > canvas.height + 50) {
                this.bullets.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (const b of this.bullets) {
            if (!b.active) continue;

            ctx.fillStyle = b.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = b.color;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    clear() {
        // Clear array in place to preserve reference
        this.bullets.length = 0;
    }

    getActiveBullets() {
        return this.bullets.filter(b => b.active);
    }

    getPlayerBullets() {
        return this.bullets.filter(b => b.active && b.isPlayer);
    }

    getEnemyBullets() {
        return this.bullets.filter(b => b.active && !b.isPlayer);
    }
}

class FallbackParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 200;
    }

    addParticle(options) {
        if (this.particles.length >= this.maxParticles) {
            this.particles.shift();
        }

        this.particles.push({
            x: options.x || 0,
            y: options.y || 0,
            vx: options.vx || (Math.random() - 0.5) * 4,
            vy: options.vy || (Math.random() - 0.5) * 4,
            life: options.life || 30,
            maxLife: options.life || 30,
            size: options.size || 3,
            color: options.color || '#ffffff'
        });
    }

    createExplosion(x, y, color = '#ff6600', count = 15) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 6;
            this.addParticle({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 20 + Math.random() * 20,
                size: 2 + Math.random() * 4,
                color
            });
        }
    }

    update(deltaTime = 1) {
        this.particles = this.particles.filter(p => {
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vx *= 0.98;
            p.vy *= 0.98;
            p.life -= deltaTime;
            return p.life > 0;
        });
    }

    draw(ctx) {
        for (const p of this.particles) {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}

class FallbackEnemy {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = 20;
        this.health = 30;
        this.maxHealth = 30;
        this.speed = 2;
        this.active = true;
        this.points = 100;
        this.shootTimer = 60 + Math.random() * 60;
    }

    update(playerX, playerY, canvas, deltaTime = 1) {
        this.y += this.speed * deltaTime;

        if (this.x < playerX) this.x += 0.5 * deltaTime;
        if (this.x > playerX) this.x -= 0.5 * deltaTime;

        this.shootTimer -= deltaTime;
        if (this.shootTimer <= 0) {
            this.shootTimer = 90 + Math.random() * 60;
        }

        if (this.y > canvas.height + 50) {
            this.active = false;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.active = false;
            return true;
        }
        return false;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.fillStyle = '#ff0066';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff0066';

        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size);
        ctx.lineTo(this.x + this.size, this.y);
        ctx.lineTo(this.x, this.y + this.size);
        ctx.lineTo(this.x - this.size, this.y);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class FallbackWaveManager {
    constructor() {
        this.wave = 1;
        this.enemiesPerWave = 5;
        this.spawnTimer = 0;
        this.spawnDelay = 60;
        this.enemiesSpawned = 0;
        this.waveActive = false;
        this.enemies = [];
    }

    startWave(waveNum) {
        this.wave = waveNum;
        this.enemiesPerWave = 5 + waveNum * 2;
        this.enemiesSpawned = 0;
        this.spawnTimer = 0;
        this.waveActive = true;
    }

    update(canvas, deltaTime = 1) {
        if (!this.waveActive) return;

        this.spawnTimer -= deltaTime;

        if (this.spawnTimer <= 0 && this.enemiesSpawned < this.enemiesPerWave) {
            const x = 50 + Math.random() * (canvas.width - 100);
            const enemy = new FallbackEnemy(x, -30);
            this.enemies.push(enemy);
            this.enemiesSpawned++;
            this.spawnTimer = this.spawnDelay;
        }

        // Update enemies
        for (const enemy of this.enemies) {
            if (enemy.active) {
                enemy.update(canvas.width / 2, canvas.height - 100, canvas, deltaTime);
            }
        }

        // Remove inactive
        this.enemies = this.enemies.filter(e => e.active);

        // Check wave complete
        if (this.enemiesSpawned >= this.enemiesPerWave && this.enemies.length === 0) {
            this.waveActive = false;
        }
    }

    isWaveComplete() {
        return !this.waveActive;
    }

    getEnemies() {
        return this.enemies;
    }
}

class FallbackInputHandler {
    constructor() {
        this.keys = {};
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            this.keys[e.code] = true;

            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            this.keys[e.code] = false;
        });

        console.log('✅ FallbackInputHandler initialized');
    }

    isKeyPressed(key) {
        return this.keys[key] === true;
    }

    getKeys() {
        return this.keys;
    }

    update() {}

    isActionActive(action) {
        const actionMap = {
            moveUp: ['ArrowUp', 'KeyW'],
            moveDown: ['ArrowDown', 'KeyS'],
            moveLeft: ['ArrowLeft', 'KeyA'],
            moveRight: ['ArrowRight', 'KeyD'],
            fire: ['Space', 'KeyZ'],
            bomb: ['KeyX'],
            pause: ['Escape', 'KeyP']
        };

        const keys = actionMap[action] || [];
        return keys.some(k => this.keys[k]);
    }

    isActionPressed(action) {
        return this.isActionActive(action);
    }

    getMovement() {
        let dx = 0, dy = 0;
        if (this.isActionActive('moveLeft')) dx -= 1;
        if (this.isActionActive('moveRight')) dx += 1;
        if (this.isActionActive('moveUp')) dy -= 1;
        if (this.isActionActive('moveDown')) dy += 1;
        return { x: dx, y: dy };
    }
}

class FallbackSoundSystem {
    constructor() {
        this.initialized = true;
        console.log('✅ FallbackSoundSystem initialized (silent mode)');
    }

    init() { return Promise.resolve(); }
    play() {}
    playShoot() {}
    playExplosion() {}
    playPowerUp() {}
    playHit() {}
    playBomb() {}
    playGameOver() {}
    playMusic() {}
    stopMusic() {}
    pauseMusic() {}
    resumeMusic() {}
    loadMusic() { return Promise.resolve(); }
}

class FallbackStarfield {
    constructor(canvas) {
        this.stars = [];
        this.width = canvas?.width || 800;
        this.height = canvas?.height || 600;

        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                speed: 0.5 + Math.random() * 2,
                size: Math.random() * 2
            });
        }
    }

    update(deltaTime = 1) {
        for (const star of this.stars) {
            star.y += star.speed * deltaTime;
            if (star.y > this.height) {
                star.y = 0;
                star.x = Math.random() * this.width;
            }
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#ffffff';
        for (const star of this.stars) {
            ctx.globalAlpha = 0.3 + star.speed * 0.2;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}

class FallbackHUD {
    constructor() {
        this.currentThemeId = 'neoArcade';
        this.width = 800;
        this.height = 600;
    }

    getThemeId() {
        return this.currentThemeId;
    }

    setTheme(themeId) {
        this.currentThemeId = themeId;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
    }

    update(gameState, deltaTime) {}

    draw(ctx, gameState) {
        if (!gameState) return;

        ctx.save();
        ctx.font = 'bold 20px Courier New';
        ctx.shadowBlur = 10;

        // Score
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${(gameState.score || 0).toLocaleString()}`, 20, 30);

        // Lives
        ctx.fillStyle = '#ff0066';
        ctx.shadowColor = '#ff0066';
        ctx.fillText(`LIVES: ${gameState.lives || 0}`, 20, 55);

        // Wave
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.textAlign = 'right';
        ctx.fillText(`WAVE: ${gameState.wave || 1}`, this.width - 20, 30);

        // Bombs
        ctx.fillStyle = '#ff8800';
        ctx.shadowColor = '#ff8800';
        ctx.fillText(`BOMBS: ${gameState.bombs || 0}`, this.width - 20, 55);

        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

// ============================================
// SAFE INITIALIZATION HELPER
// ============================================

function safeInit(name, initFn, fallbackFn) {
    try {
        const result = initFn();
        console.log(`✅ ${name} initialized`);
        return result;
    } catch (error) {
        console.warn(`⚠️ ${name} failed:`, error.message);
        if (fallbackFn) {
            const fallback = fallbackFn();
            console.log(`   ↳ Using fallback for ${name}`);
            return fallback;
        }
        return null;
    }
}

// Game instances
let canvasElement = null;
let context = null;
let menuManager = null;
let soundSystem = null;
let gameStateInstance = null;
let inputHandler = null;
let collisionSystem = null;
let gameLoop = null;
let starfield = null;
let particleSystem = null;
let bulletPool = null;
let enemyBulletPool = null;
let waveManager = null;
let vhsGlitch = null;
let hud = null;
let optionsMenu = null;
let weaponManager = null;

/**
 * Initialize the game
 */
function init() {
    console.log('🚀 Initializing Geometry 3044 (Bulletproof)...');

    // Get canvas element
    canvasElement = document.getElementById('gameCanvas');
    if (!canvasElement) {
        console.error('❌ Canvas element not found!');
        return;
    }

    // Set canvas and context
    setCanvas(canvasElement);
    context = canvasElement.getContext('2d');
    setCtx(context);

    // Set canvas dimensions from config
    canvasElement.width = CONFIG.screen.width;
    canvasElement.height = CONFIG.screen.height;

    // Initialize cached UI references
    initCachedUI();

    console.log('✅ Canvas initialized:', CONFIG.screen.width, 'x', CONFIG.screen.height);

    // Initialize sound system with fallback
    soundSystem = safeInit('SoundSystem',
        () => new SoundSystem(),
        () => new FallbackSoundSystem()
    );
    setSoundSystem(soundSystem);

    // Initialize menu manager
    menuManager = new MenuManager();
    menuManager.init();

    // Set up start game callback
    menuManager.onStartGame = () => {
        startGame();
    };

    // Initialize starfield for menu background
    starfield = safeInit('Starfield',
        () => new Starfield(),
        () => new FallbackStarfield(canvasElement)
    );
    setStarfield(starfield);

    // Draw menu background
    drawMenuBackground();

    // Set up keyboard listener for coin insert
    document.addEventListener('keydown', handleGlobalKeyPress);

    // Update high score display
    const savedHighScore = localStorage.getItem('geometry3044_highscore') || 0;
    if (cachedUI.highScore) {
        cachedUI.highScore.textContent = parseInt(savedHighScore).toLocaleString();
    }

    console.log('🎮 Geometry 3044 - Ready!');
    console.log('💡 Press START GAME to play');
}

/**
 * Handle global key presses (works in menu)
 */
function handleGlobalKeyPress(e) {
    // Insert coin with 'C' key
    if (e.key.toLowerCase() === 'c') {
        if (menuManager && menuManager.getState() === MenuState.MAIN) {
            menuManager.addCredit();
            if (soundSystem && soundSystem.initialized) {
                soundSystem.play('coin');
            }
            console.log('🪙 Coin inserted!');
        }
    }
}

/**
 * Draw the menu background on canvas
 */
function drawMenuBackground() {
    if (!context || !canvasElement) return;

    const theme = getCurrentTheme(1);

    // Clear and draw gradient background
    const gradient = context.createLinearGradient(0, 0, 0, canvasElement.height);
    gradient.addColorStop(0, theme.bgStart);
    gradient.addColorStop(1, theme.bgEnd);
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvasElement.width, canvasElement.height);

    // Draw subtle grid
    context.strokeStyle = `hsla(${theme.gridHue}, 100%, 50%, 0.1)`;
    context.lineWidth = 1;

    for (let x = 0; x < canvasElement.width; x += 50) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, canvasElement.height);
        context.stroke();
    }

    for (let y = 0; y < canvasElement.height; y += 50) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(canvasElement.width, y);
        context.stroke();
    }

    // Draw starfield if available
    if (starfield) {
        starfield.draw(context);
    }
}

/**
 * Start the game — BULLETPROOF VERSION
 */
function startGame() {
    console.log('');
    console.log('🎮 ========== STARTING GEOMETRY 3044 (BULLETPROOF) ==========');
    console.log('');

    // Guard against multiple startGame calls
    if (gameStarting) {
        console.log('🎮 [!] startGame already in progress, ignoring');
        return;
    }
    setGameStarting(true);

    try {
        // ==================
        // STEP 1: Sound System
        // ==================
        console.log('Step 1: Checking sound system...');
        if (soundSystem && !soundSystem.initialized) {
            try {
                soundSystem.init();
            } catch (e) {
                console.warn('⚠️ Sound init failed:', e.message);
            }
        }

        if (soundSystem) {
            try {
                soundSystem.play('menuSelect');
            } catch (e) {
                // Ignore sound errors
            }
        }

        // ==================
        // STEP 2: Credits
        // ==================
        console.log('Step 2: Checking credits...');
        if (!menuManager.useCredit()) {
            console.log('❌ No credits available!');
            setGameStarting(false);
            return;
        }
        console.log('✅ Credit used successfully');

        // ==================
        // STEP 3: Game State
        // ==================
        console.log('Step 3: Creating GameState...');
        gameStateInstance = safeInit('GameState',
            () => new GameState(),
            () => ({
                score: 0,
                lives: 3,
                bombs: 3,
                wave: 1,
                combo: 0,
                comboTimer: 0,
                multiplier: 1,
                highScore: parseInt(localStorage.getItem('geometry3044_highscore')) || 0,
                gameRunning: false,
                paused: false,
                playerInvulnerable: false,
                invulnerabilityTimer: 0,
                player: null,
                enemies: [],
                activePowerUps: [],
                addScore: function(points) { this.score += points * this.multiplier; },
                incrementCombo: function() {
                    this.combo++;
                    this.comboTimer = 120;
                    this.multiplier = 1 + Math.floor(this.combo / 5);
                }
            })
        );
        setGameState(gameStateInstance);

        // ==================
        // STEP 4: Player
        // ==================
        console.log('Step 4: Creating Player...');
        const playerX = canvasElement.width / 2;
        const playerY = canvasElement.height - (CONFIG.player?.startYOffset || 100);

        const player = safeInit('Player',
            () => new Player(playerX, playerY),
            () => new FallbackPlayer(playerX, playerY)
        );
        gameStateInstance.player = player;

        // ==================
        // STEP 5: Core Systems
        // ==================
        console.log('Step 5: Initializing core systems...');
        console.log('');

        // Particle System
        particleSystem = safeInit('ParticleSystem',
            () => new ParticleSystem(),
            () => new FallbackParticleSystem()
        );
        setParticleSystem(particleSystem);

        // Bullet Pool (player)
        bulletPool = safeInit('BulletPool',
            () => new BulletPool(CONFIG.bullets?.poolSize || 100),
            () => new FallbackBulletPool()
        );
        setBulletPool(bulletPool);

        // Bullet Pool (enemies)
        enemyBulletPool = safeInit('EnemyBulletPool',
            () => new BulletPool(CONFIG.bullets?.poolSize || 100),
            () => new FallbackBulletPool()
        );
        setEnemyBulletPool(enemyBulletPool);

        // CRITICAL: Connect bullet arrays to gameState
        // GameLoop reads from gameState.bullets, but Player spawns to bulletPool.bullets
        // This ensures they reference the SAME array!
        if (bulletPool && bulletPool.bullets) {
            gameStateInstance.bullets = bulletPool.bullets;
            console.log('✅ Player bullets connected to gameState');
        }
        if (enemyBulletPool && enemyBulletPool.bullets) {
            gameStateInstance.enemyBullets = enemyBulletPool.bullets;
            console.log('✅ Enemy bullets connected to gameState');
        }

        // Input Handler
        inputHandler = safeInit('InputHandler',
            () => new InputHandler(canvasElement),
            () => new FallbackInputHandler()
        );

        // CRITICAL: Connect InputHandler keys to global keys
        // This allows Player.js to read input via the global keys object
        if (inputHandler && inputHandler.keys) {
            setKeys(inputHandler.keys);
            console.log('✅ InputHandler keys connected to global keys');
        }

        // Collision System
        collisionSystem = safeInit('CollisionSystem',
            () => new CollisionSystem({
                gameState: gameStateInstance,
                particleSystem: particleSystem,
                soundSystem: soundSystem,
                onEnemyDestroyed: (enemy, bullet) => {
                    gameStateInstance.addScore(enemy.points || 100);
                    gameStateInstance.incrementCombo();
                },
                onPlayerHit: () => {
                    if (!gameStateInstance.playerInvulnerable) {
                        playerDeath();
                    }
                }
            }),
            () => null // Manual collision check in fallback mode
        );

        // Wave Manager
        waveManager = safeInit('WaveManager',
            () => new WaveManager({
                gameState: gameStateInstance,
                canvas: canvasElement,
                onWaveComplete: (waveNum) => {
                    console.log(`🌊 Wave ${waveNum} complete!`);
                    if (soundSystem) {
                        try { soundSystem.play('waveComplete'); } catch (e) {}
                    }
                }
            }),
            () => new FallbackWaveManager()
        );
        setWaveManager(waveManager);

        // CRITICAL: Connect WaveManager enemies array to gameState
        // This ensures spawned enemies are rendered by GameLoop
        if (waveManager && waveManager.setEnemiesArray) {
            waveManager.setEnemiesArray(gameStateInstance.enemies);
            console.log('✅ WaveManager enemies array connected to gameState');
        }

        // VHS Glitch Effect
        vhsGlitch = safeInit('VHSGlitch',
            () => new VHSGlitchEffects(),
            () => null
        );
        setVhsGlitch(vhsGlitch);

        // HUD
        hud = safeInit('HUD',
            () => {
                const h = new HUD();
                h.resize(canvasElement.width, canvasElement.height);
                return h;
            },
            () => new FallbackHUD()
        );

        // Options Menu — with safe HUD access
        optionsMenu = safeInit('OptionsMenu',
            () => {
                if (!hud || typeof hud.getThemeId !== 'function') {
                    throw new Error('HUD not available or missing getThemeId');
                }
                return new OptionsMenu(hud, () => {
                    gameStateInstance.paused = false;
                });
            },
            () => null
        );

        // Weapon Manager
        weaponManager = safeInit('WeaponManager',
            () => new WeaponManager({
                gameState: gameStateInstance,
                bulletPool: bulletPool,
                particleSystem: particleSystem,
                soundSystem: soundSystem
            }),
            () => null
        );
        setWeaponManager(weaponManager);

        console.log('');

        // ==================
        // STEP 6: Game Loop
        // ==================
        console.log('Step 6: Creating GameLoop...');
        gameLoop = safeInit('GameLoop',
            () => new GameLoop({
                canvas: canvasElement,
                ctx: context,
                gameState: gameStateInstance,
                inputHandler: inputHandler,
                collisionSystem: collisionSystem,
                particleSystem: particleSystem,
                bulletPool: bulletPool,
                waveManager: waveManager,
                soundSystem: soundSystem,
                starfield: starfield,
                vhsGlitch: vhsGlitch,
                hud: hud,
                optionsMenu: optionsMenu,
                weaponManager: weaponManager,
                renderCRT: (ctx) => drawEnhancedCRT(ctx, canvasElement.width, canvasElement.height)
            }),
            () => null // Use fallback game loop
        );

        // ==================
        // STEP 7: Start Game
        // ==================
        console.log('Step 7: Starting game...');
        gameStateInstance.gameRunning = true;

        // Switch to game UI
        menuManager.showGameUI();

        // Start game loop
        if (gameLoop && gameLoop.start) {
            gameLoop.start();
            console.log('✅ GameLoop started');
        } else {
            console.log('⚠️ Using fallback game loop');
            requestAnimationFrame(fallbackGameLoop);
        }

        // Load and play game music
        loadAndPlayMusic('game');

        console.log('');
        console.log('🎮 ========== GAME STARTED SUCCESSFULLY! ==========');
        console.log('');

    } catch (error) {
        console.error('🎮 [CRITICAL ERROR] Game failed to start:', error);
        console.error('Stack trace:', error.stack);
        setGameStarting(false);

        // Try to show error to user
        try {
            alert('Game failed to start: ' + error.message + '\nPlease refresh the page.');
        } catch (e) {}
    }
}

/**
 * Fallback game loop — used if GameLoop class fails
 */
let lastTime = 0;
function fallbackGameLoop(currentTime) {
    if (!gameStateInstance || !gameStateInstance.gameRunning) {
        console.log('Fallback game loop stopped');
        return;
    }

    const deltaTime = Math.min((currentTime - lastTime) / 16.67, 3);
    lastTime = currentTime;

    requestAnimationFrame(fallbackGameLoop);

    // Paused?
    if (gameStateInstance.paused) {
        drawPauseScreen();
        return;
    }

    // Update
    try {
        fallbackUpdate(deltaTime);
    } catch (e) {
        console.error('Fallback update error:', e);
    }

    // Render
    try {
        fallbackRender();
    } catch (e) {
        console.error('Fallback render error:', e);
    }
}

function fallbackUpdate(deltaTime) {
    // Handle pause
    if (inputHandler) {
        if (inputHandler.isActionPressed?.('pause') ||
            inputHandler.keys?.['Escape'] ||
            inputHandler.keys?.['KeyP']) {
            if (!window._pauseHeld) {
                gameStateInstance.paused = !gameStateInstance.paused;
                window._pauseHeld = true;
            }
        } else {
            window._pauseHeld = false;
        }
    }

    if (gameStateInstance.paused) return;

    // Update starfield
    if (starfield?.update) starfield.update(deltaTime);

    // Update player
    if (gameStateInstance.player?.update) {
        gameStateInstance.player.update(deltaTime, inputHandler, canvasElement, bulletPool);
    }

    // Update bullets
    if (bulletPool?.update) bulletPool.update(canvasElement, deltaTime);
    if (enemyBulletPool?.update) enemyBulletPool.update(canvasElement, deltaTime);

    // Update wave manager (spawns enemies)
    if (waveManager?.update) {
        waveManager.update(canvasElement, deltaTime);
    }

    // Update particles
    if (particleSystem?.update) particleSystem.update(deltaTime);

    // Collision detection (fallback)
    fallbackCollisionCheck();

    // Combo decay
    if (gameStateInstance.comboTimer > 0) {
        gameStateInstance.comboTimer -= deltaTime;
        if (gameStateInstance.comboTimer <= 0) {
            gameStateInstance.combo = 0;
            gameStateInstance.multiplier = 1;
        }
    }

    // Check player death
    if (gameStateInstance.player && !gameStateInstance.player.isAlive) {
        playerDeath();
    }

    // Check wave complete
    if (waveManager?.isWaveComplete?.()) {
        gameStateInstance.wave++;
        if (waveManager.startWave) {
            waveManager.startWave(gameStateInstance.wave);
        }
    }

    // Update HUD
    if (hud?.update) {
        hud.update(gameStateInstance, deltaTime);
    }
}

function fallbackCollisionCheck() {
    const player = gameStateInstance.player;
    if (!player || !player.isAlive) return;

    // Get enemies
    const enemies = waveManager?.enemies || waveManager?.getEnemies?.() || gameStateInstance.enemies || [];

    // Get bullets
    const playerBullets = bulletPool?.getPlayerBullets?.() ||
                          bulletPool?.getActiveBullets?.()?.filter(b => b.isPlayer) || [];
    const enemyBullets = enemyBulletPool?.getActiveBullets?.() ||
                         enemyBulletPool?.getEnemyBullets?.() || [];

    // Player bullets vs enemies
    for (const bullet of playerBullets) {
        if (!bullet.active) continue;

        for (const enemy of enemies) {
            if (!enemy.active) continue;

            const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
            if (dist < (bullet.size || 5) + (enemy.size || 20)) {
                bullet.active = false;
                const killed = enemy.takeDamage?.(bullet.damage || 10);

                if (killed || !enemy.active) {
                    gameStateInstance.addScore(enemy.points || 100);
                    gameStateInstance.incrementCombo();

                    if (particleSystem?.createExplosion) {
                        particleSystem.createExplosion(enemy.x, enemy.y, '#ff6600', 15);
                    }
                }
                break;
            }
        }
    }

    // Enemy bullets vs player
    if (!player.invulnerable) {
        for (const bullet of enemyBullets) {
            if (!bullet.active) continue;

            const dist = Math.hypot(bullet.x - player.x, bullet.y - player.y);
            if (dist < (bullet.size || 5) + (player.size || 20) * 0.5) {
                bullet.active = false;
                player.takeDamage?.(1);
                break;
            }
        }
    }

    // Enemies vs player collision
    if (!player.invulnerable) {
        for (const enemy of enemies) {
            if (!enemy.active) continue;

            const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
            if (dist < (enemy.size || 20) + (player.size || 20) * 0.5) {
                enemy.active = false;
                player.takeDamage?.(1);

                if (particleSystem?.createExplosion) {
                    particleSystem.createExplosion(enemy.x, enemy.y, '#ff00ff', 25);
                }
                break;
            }
        }
    }
}

function fallbackRender() {
    // Clear
    context.fillStyle = '#0a0015';
    context.fillRect(0, 0, canvasElement.width, canvasElement.height);

    // Draw starfield
    if (starfield?.draw) starfield.draw(context);

    // Draw grid
    drawGrid();

    // Draw particles
    if (particleSystem?.draw) particleSystem.draw(context);

    // Draw bullets
    if (bulletPool?.draw) bulletPool.draw(context);
    if (enemyBulletPool?.draw) enemyBulletPool.draw(context);

    // Draw enemies
    const enemies = waveManager?.enemies || waveManager?.getEnemies?.() || gameStateInstance.enemies || [];
    for (const enemy of enemies) {
        if (enemy.draw) enemy.draw(context);
    }

    // Draw player
    if (gameStateInstance.player?.draw) {
        gameStateInstance.player.draw(context);
    }

    // Draw HUD
    if (hud?.draw) {
        hud.draw(context, gameStateInstance);
    }
}

function drawGrid() {
    context.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    context.lineWidth = 1;

    const spacing = 50;

    for (let x = 0; x < canvasElement.width; x += spacing) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, canvasElement.height);
        context.stroke();
    }

    for (let y = 0; y < canvasElement.height; y += spacing) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(canvasElement.width, y);
        context.stroke();
    }
}

function drawPauseScreen() {
    fallbackRender();

    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvasElement.width, canvasElement.height);

    context.fillStyle = '#00ffff';
    context.font = 'bold 48px Courier New';
    context.textAlign = 'center';
    context.shadowBlur = 20;
    context.shadowColor = '#00ffff';
    context.fillText('PAUSED', canvasElement.width / 2, canvasElement.height / 2);

    context.font = '20px Courier New';
    context.fillStyle = '#ffffff';
    context.shadowBlur = 0;
    context.fillText('Press P or ESC to continue', canvasElement.width / 2, canvasElement.height / 2 + 50);
}

/**
 * Handle player death
 */
function playerDeath() {
    if (!gameStateInstance) return;

    gameStateInstance.lives--;
    gameStateInstance.playerInvulnerable = true;
    gameStateInstance.invulnerabilityTimer = 180;

    if (soundSystem) {
        try { soundSystem.play('playerDeath'); } catch (e) {}
    }

    // Create explosion effect
    if (particleSystem && gameStateInstance.player) {
        particleSystem.createExplosion(
            gameStateInstance.player.x,
            gameStateInstance.player.y,
            '#00ff00',
            30
        );
    }

    // Check for game over
    if (gameStateInstance.lives <= 0) {
        gameOver();
    } else {
        // Respawn player
        if (gameStateInstance.player?.respawn) {
            gameStateInstance.player.respawn(
                canvasElement.width / 2,
                canvasElement.height - (CONFIG.player?.startYOffset || 100)
            );
        } else {
            gameStateInstance.player.x = canvasElement.width / 2;
            gameStateInstance.player.y = canvasElement.height - (CONFIG.player?.startYOffset || 100);
            gameStateInstance.player.isAlive = true;
            gameStateInstance.player.invulnerable = true;
            gameStateInstance.player.invulnerableTimer = 180;
        }
    }
}

/**
 * Game over
 */
function gameOver() {
    console.log('💀 Game Over!');

    if (gameLoop) {
        gameLoop.stop();
    }

    if (gameStateInstance) {
        gameStateInstance.gameRunning = false;

        // Update high score
        if (gameStateInstance.score > gameStateInstance.highScore) {
            gameStateInstance.highScore = gameStateInstance.score;
            localStorage.setItem('geometry3044_highscore', gameStateInstance.score);
        }

        // Update final score display
        const finalScoreDisplay = document.getElementById('finalScoreDisplay');
        const finalWaveDisplay = document.getElementById('finalWaveDisplay');
        const finalComboDisplay = document.getElementById('finalComboDisplay');

        if (finalScoreDisplay) finalScoreDisplay.textContent = gameStateInstance.score.toLocaleString();
        if (finalWaveDisplay) finalWaveDisplay.textContent = gameStateInstance.wave;
        if (finalComboDisplay) finalComboDisplay.textContent = gameStateInstance.maxCombo || 0;
    }

    if (soundSystem) {
        try {
            soundSystem.play('explosionLarge');
            soundSystem.stopMusic();
        } catch (e) {}
    }

    // Show game over screen
    menuManager.showGameOver(gameStateInstance ? gameStateInstance.score : 0);

    // Reset game starting guard so player can start a new game
    setGameStarting(false);

    // Set up play again button
    const playAgainBtn = document.getElementById('playAgainBtn');
    if (playAgainBtn) {
        playAgainBtn.onclick = () => {
            menuManager.showMainMenu();
            drawMenuBackground();
            loadAndPlayMusic('menu');
        };
    }

    const mainMenuBtn = document.getElementById('mainMenuBtn');
    if (mainMenuBtn) {
        mainMenuBtn.onclick = () => {
            menuManager.showMainMenu();
            drawMenuBackground();
            loadAndPlayMusic('menu');
        };
    }
}

/**
 * Load and play music
 */
async function loadAndPlayMusic(type) {
    if (!soundSystem) return;

    // Initialize sound system if needed
    if (!soundSystem.initialized) {
        try {
            await soundSystem.init();
        } catch (e) {
            console.warn('Sound system init failed:', e);
            return;
        }
    }

    try {
        const url = type === 'menu'
            ? CONFIG.audio?.urls?.menuMusic
            : CONFIG.audio?.urls?.gameMusic;

        if (url) {
            await soundSystem.loadMusic(type, url);
            soundSystem.playMusic(type, true);
        }
    } catch (error) {
        console.warn(`Could not load ${type} music:`, error);

        // Try fallback
        try {
            const fallbackUrl = type === 'menu'
                ? CONFIG.audio?.urls?.fallbackMenuMusic
                : CONFIG.audio?.urls?.fallbackGameMusic;

            if (fallbackUrl) {
                await soundSystem.loadMusic(type, fallbackUrl);
                soundSystem.playMusic(type, true);
            }
        } catch (fallbackError) {
            console.warn(`Fallback music also failed:`, fallbackError);
        }
    }
}

// Make startGame available globally for the button
window.startGame = startGame;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Diagnostic function
window.diagnoseGame = function() {
    console.log('');
    console.log('='.repeat(50));
    console.log('=== GAME DIAGNOSTICS (BULLETPROOF) ===');
    console.log('='.repeat(50));
    console.log('');

    // Canvas
    const canvasEl = document.getElementById('gameCanvas');
    console.log('📺 CANVAS:');
    console.log('  - Element found:', canvasEl ? '✅' : '❌');
    if (canvasEl) {
        console.log('  - Width:', canvasEl.width);
        console.log('  - Height:', canvasEl.height);
        console.log('  - Display style:', getComputedStyle(canvasEl).display);
    }

    // Systems status
    console.log('');
    console.log('📊 SYSTEMS STATUS:');
    console.log('  - menuManager:', menuManager ? '✅' : '❌');
    console.log('  - soundSystem:', soundSystem ? '✅' : '❌', soundSystem?.constructor?.name);
    console.log('  - gameStateInstance:', gameStateInstance ? '✅' : '❌');
    console.log('  - inputHandler:', inputHandler ? '✅' : '❌', inputHandler?.constructor?.name);
    console.log('  - particleSystem:', particleSystem ? '✅' : '❌', particleSystem?.constructor?.name);
    console.log('  - bulletPool:', bulletPool ? '✅' : '❌', bulletPool?.constructor?.name);
    console.log('  - waveManager:', waveManager ? '✅' : '❌', waveManager?.constructor?.name);
    console.log('  - hud:', hud ? '✅' : '❌', hud?.constructor?.name);
    console.log('  - gameLoop:', gameLoop ? '✅' : '❌');

    console.log('');
    console.log('='.repeat(50));
    console.log('=== END DIAGNOSTICS ===');
    console.log('='.repeat(50));
    console.log('');

    return {
        canvas: !!canvasEl,
        menuManager: !!menuManager,
        soundSystem: !!soundSystem,
        gameState: !!gameStateInstance,
        inputHandler: !!inputHandler,
        ready: !!canvasEl && !!menuManager
    };
};

// Quick test function
window.testCanvas = function() {
    const canvasEl = document.getElementById('gameCanvas');
    if (!canvasEl) {
        console.error('Canvas not found!');
        return;
    }

    const ctx = canvasEl.getContext('2d');

    // Hide menu, show canvas
    const menu = document.getElementById('menuScreen');
    if (menu) menu.style.display = 'none';

    // Draw test pattern
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);

    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CANVAS TEST OK!', canvasEl.width/2, canvasEl.height/2);

    console.log('✅ Test canvas drawn - you should see a red screen with white text');
};

// Export for debugging
window.DEBUG = {
    CONFIG,
    WAVE_THEMES,
    getCurrentTheme,
    // Core systems
    getMenuManager: () => menuManager,
    getSoundSystem: () => soundSystem,
    getGameState: () => gameStateInstance,
    getGameLoop: () => gameLoop,
    getInputHandler: () => inputHandler,
    getHUD: () => hud,
    // Classes
    Player,
    Enemy,
    Bullet,
    BulletPool,
    ParticleSystem,
    WaveManager,
    SoundSystem,
    Starfield,
    VHSGlitchEffects,
    GameState,
    InputHandler,
    CollisionSystem,
    GameLoop,
    MenuManager,
    MenuState,
    HUD,
    OptionsMenu,
    WeaponManager,
    // Fallback classes
    FallbackPlayer,
    FallbackBulletPool,
    FallbackParticleSystem,
    FallbackInputHandler,
    FallbackSoundSystem,
    FallbackStarfield,
    FallbackHUD,
    FallbackWaveManager,
    // HUD Themes
    HUD_THEMES,
    getTheme,
    getAllThemes,
    // Diagnostic functions
    diagnose: window.diagnoseGame,
    testCanvas: window.testCanvas
};
