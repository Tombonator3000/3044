// ============================================
// GEOMETRY 3044 — MAIN GAME FILE
// ============================================

// === IMPORTS ===
import { config, getCurrentTheme, updateConfig } from './config.js';
import { Player } from './entities/Player.js';
import { Enemy } from './entities/Enemy.js';
import { Boss } from './entities/Boss.js';
import { PowerUp } from './entities/PowerUp.js';
import { BulletPool } from './systems/BulletPool.js';
import { WaveManager } from './systems/WaveManager.js';
import { PowerUpManager } from './systems/PowerUpManager.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
import { CollisionSystem } from './core/CollisionSystem.js';
import { Starfield } from './effects/Starfield.js';
import { RadicalSlang } from './effects/RadicalSlang.js';
import { VHSEffect } from './effects/VHSEffect.js';
import { SoundSystem } from './systems/SoundSystem.js';
import { HUD } from './ui/HUD.js';
import { drawThemedGrid, drawBackground } from './rendering/GridRenderer.js';
import { initCachedUI } from './globals.js';
import { MobileControls } from './ui/MobileControls.js';

// === GLOBAL STATE ===
let canvas, ctx;
let gameState = null;
let gameLoopId = null;
let lastTime = 0;

// === SYSTEMS ===
let player = null;
let bulletPool = null;
let enemyBulletPool = null;
let particleSystem = null;
let waveManager = null;
let collisionSystem = null;
let starfield = null;
let radicalSlang = null;
let vhsEffect = null;
let soundSystem = null;
let hud = null;
let powerUpManager = null;
let mobileControls = null;

// === INPUT ===
let keys = {};
let touchJoystick = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 };
let touchButtons = { fire: false, bomb: false };
let bombPressedLastFrame = false;

// === MENU STATE ===
let credits = 3;
let attractMode = false;
let attractModeTimeout = null;
let attractModeAI = null;
const ATTRACT_MODE_DELAY = 15000; // 15 seconds

// === PROMO TEXTS FOR ATTRACT MODE ===
const promoTexts = [
    "GEOMETRY 3044 — THE ULTIMATE ARCADE EXPERIENCE",
    "35+ POWER-UPS • 7 COMBO EFFECTS • 5 EPIC BOSSES",
    "PRESS START TO PLAY",
    "INSERT COIN FOR CREDITS",
    "RADICAL 80s ACTION • SYNTHWAVE SOUNDTRACK",
    "CHAIN COMBOS FOR MASSIVE SCORES",
    "CAN YOU REACH WAVE 30?",
    "FEVER MODE • GOD MODE • INFINITY POWER"
];
let currentPromoIndex = 0;
let promoTimer = 0;

console.log('🎮 Geometry 3044 — Loading...');

// ============================================
// INITIALIZATION
// ============================================

function init() {
    console.log('🚀 Initializing Geometry 3044...');

    // Get canvas
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('❌ Canvas not found!');
        return;
    }

    ctx = canvas.getContext('2d');

    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize input
    initInput();

    // Initialize cached UI elements
    initCachedUI();

    // Initialize sound system (needs user interaction to fully activate)
    soundSystem = new SoundSystem();

    // Initialize starfield for menu
    starfield = new Starfield(canvas.width, canvas.height);

    // Initialize VHS effect
    vhsEffect = new VHSEffect();

    // Initialize HUD
    hud = new HUD();
    hud.resize(canvas.width, canvas.height);

    // Initialize mobile controls
    mobileControls = new MobileControls(canvas);
    mobileControls.resize(canvas.width, canvas.height);

    // Update config
    updateConfig(canvas.width, canvas.height);

    // Setup menu
    setupMenu();

    // Start menu animation
    requestAnimationFrame(menuLoop);

    // Start attract mode timer
    resetAttractModeTimeout();

    console.log('✅ Canvas initialized:', canvas.width, 'x', canvas.height);
    console.log('🎮 Geometry 3044 — Ready!');
    console.log('💡 Press START GAME to play');
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    updateConfig(canvas.width, canvas.height);

    if (starfield) starfield.resize(canvas.width, canvas.height);
    if (hud) hud.resize(canvas.width, canvas.height);
    if (mobileControls) mobileControls.resize(canvas.width, canvas.height);
}

// ============================================
// INPUT HANDLING
// ============================================

function initInput() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        keys[e.code] = true;

        // Prevent default for game keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Escape'].includes(e.key)) {
            e.preventDefault();
        }

        // Exit attract mode on any key
        if (attractMode) {
            exitAttractMode();
        }

        // Reset attract mode timeout
        resetAttractModeTimeout();

        // Menu controls
        if (e.key === 'c' || e.key === 'C') {
            if (!gameState || !gameState.running) {
                addCredit();
            }
        }

        // Pause
        if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && gameState?.running) {
            togglePause();
        }

        // Bomb
        if ((e.key === 'b' || e.key === 'B') && gameState?.running && !gameState.paused) {
            useBomb();
        }

        // Music toggle
        if (e.key === 'm' || e.key === 'M') {
            if (soundSystem) {
                soundSystem.toggleMusic();
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
        keys[e.code] = false;
    });

    // Legacy touch controls - only used as fallback when MobileControls is not active
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Mouse click to exit attract mode
    canvas.addEventListener('click', () => {
        if (attractMode) {
            exitAttractMode();
        }
        resetAttractModeTimeout();
    });
}

function handleTouchStart(e) {
    // Skip if mobileControls is handling touch
    if (mobileControls && mobileControls.enabled) {
        // Still handle attract mode exit and timeout reset
        resetAttractModeTimeout();
        if (attractMode) {
            exitAttractMode();
        }
        return;
    }

    e.preventDefault();
    resetAttractModeTimeout();

    if (attractMode) {
        exitAttractMode();
        return;
    }

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Left half = joystick
    if (x < canvas.width / 2) {
        touchJoystick.active = true;
        touchJoystick.startX = x;
        touchJoystick.startY = y;
        touchJoystick.currentX = x;
        touchJoystick.currentY = y;
    } else {
        // Right half - top = bomb, bottom = fire
        if (y < canvas.height / 2) {
            touchButtons.bomb = true;
            if (gameState?.running) useBomb();
        } else {
            touchButtons.fire = true;
        }
    }
}

function handleTouchMove(e) {
    // Skip if mobileControls is handling touch
    if (mobileControls && mobileControls.enabled) return;

    e.preventDefault();

    if (touchJoystick.active && e.touches[0]) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        touchJoystick.currentX = touch.clientX - rect.left;
        touchJoystick.currentY = touch.clientY - rect.top;
    }
}

function handleTouchEnd(e) {
    // Skip if mobileControls is handling touch
    if (mobileControls && mobileControls.enabled) return;

    e.preventDefault();
    touchJoystick.active = false;
    touchButtons.fire = false;
    touchButtons.bomb = false;
}

// ============================================
// MENU SYSTEM
// ============================================

function setupMenu() {
    // Update credits display
    updateCreditsDisplay();

    // Setup start button (check both possible IDs)
    const startButton = document.getElementById('startButton') || document.getElementById('startGameBtn');
    if (startButton) {
        startButton.addEventListener('click', () => {
            resetAttractModeTimeout();
            window.startGame();
        });
    }

    // Load high score (check both possible IDs)
    const highScore = localStorage.getItem('geometry3044_highScore') || 0;
    const highScoreEl = document.getElementById('menuHighScore') || document.getElementById('highScoreDisplay');
    if (highScoreEl) {
        highScoreEl.textContent = parseInt(highScore).toLocaleString();
    }
}

function updateCreditsDisplay() {
    const creditsEl = document.getElementById('creditsCount');
    if (creditsEl) {
        creditsEl.textContent = credits;
    }
}

function addCredit() {
    credits++;
    updateCreditsDisplay();

    if (soundSystem) {
        soundSystem.playCoin();
    }

    console.log('💰 Credit inserted! Total:', credits);

    // Flash insert coin text
    const insertCoinEl = document.getElementById('insertCoinText');
    if (insertCoinEl) {
        insertCoinEl.style.color = '#00ff00';
        setTimeout(() => {
            insertCoinEl.style.color = '#ffff00';
        }, 200);
    }
}

window.addCredit = addCredit;

// ============================================
// ATTRACT MODE
// ============================================

function resetAttractModeTimeout() {
    if (attractModeTimeout) {
        clearTimeout(attractModeTimeout);
    }

    attractModeTimeout = setTimeout(() => {
        if (!gameState || !gameState.running) {
            startAttractMode();
        }
    }, ATTRACT_MODE_DELAY);
}

function startAttractMode() {
    if (attractMode) return;

    console.log('🎬 Starting Attract Mode');
    attractMode = true;
    currentPromoIndex = 0;
    promoTimer = 0;

    // Initialize attract mode game
    initGame(true);

    // Create AI controller
    attractModeAI = {
        targetX: canvas.width / 2,
        targetY: canvas.height - 100,
        shootTimer: 0,
        moveTimer: 0
    };
}

function exitAttractMode() {
    if (!attractMode) return;

    console.log('🎬 Exiting Attract Mode');
    attractMode = false;
    attractModeAI = null;

    // Stop game
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }

    gameState = null;

    // Show menu
    const menuScreen = document.getElementById('menuScreen');
    if (menuScreen) menuScreen.style.display = 'flex';

    // Start menu loop
    requestAnimationFrame(menuLoop);

    resetAttractModeTimeout();
}

function updateAttractModeAI() {
    if (!attractModeAI || !player) return;

    // Find nearest enemy
    let nearestEnemy = null;
    let nearestDist = Infinity;

    for (const enemy of gameState.enemies) {
        if (!enemy.active) continue;
        const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (dist < nearestDist) {
            nearestDist = dist;
            nearestEnemy = enemy;
        }
    }

    // Move toward enemy centroid or dodge bullets
    if (nearestEnemy) {
        attractModeAI.targetX = nearestEnemy.x;
        attractModeAI.targetY = Math.min(nearestEnemy.y + 100, canvas.height - 100);
    }

    // Dodge enemy bullets
    const enemyBullets = enemyBulletPool?.getActiveBullets() || [];
    for (const bullet of enemyBullets) {
        const dist = Math.hypot(bullet.x - player.x, bullet.y - player.y);
        if (dist < 100 && bullet.y > player.y - 50) {
            // Dodge!
            attractModeAI.targetX = player.x + (bullet.x > player.x ? -100 : 100);
        }
    }

    // Simulate input
    const dx = attractModeAI.targetX - player.x;
    const dy = attractModeAI.targetY - player.y;

    keys['ArrowLeft'] = dx < -20;
    keys['ArrowRight'] = dx > 20;
    keys['ArrowUp'] = dy < -20;
    keys['ArrowDown'] = dy > 20;

    // Auto-shoot
    attractModeAI.shootTimer++;
    keys[' '] = attractModeAI.shootTimer % 10 < 5;

    // Update promo text
    promoTimer++;
    if (promoTimer > 120) {
        promoTimer = 0;
        currentPromoIndex = (currentPromoIndex + 1) % promoTexts.length;
    }
}

// ============================================
// GAME START
// ============================================

window.startGame = function() {
    console.log('🎮 Starting game...');

    // Check credits
    if (credits <= 0) {
        console.log('❌ No credits available!');

        const insertCoinEl = document.getElementById('insertCoinText');
        if (insertCoinEl) {
            insertCoinEl.style.color = '#ff0000';
            insertCoinEl.style.animation = 'blink 0.2s ease-in-out 6';
            setTimeout(() => {
                insertCoinEl.style.color = '#ffff00';
                insertCoinEl.style.animation = 'blink 1s ease-in-out infinite';
            }, 1200);
        }
        return;
    }

    credits--;
    updateCreditsDisplay();

    // Exit attract mode if active
    if (attractMode) {
        attractMode = false;
        attractModeAI = null;
    }

    // Hide menu, show game
    const menuScreen = document.getElementById('menuScreen');
    const gameUI = document.getElementById('gameUI');

    if (menuScreen) menuScreen.style.display = 'none';
    // Canvas-based HUD is now used instead of DOM elements
    // if (gameUI) gameUI.style.display = 'block';

    // Initialize game
    initGame(false);

    // Start game loop
    lastTime = performance.now();
    gameLoopId = requestAnimationFrame(gameLoop);

    // Play music
    if (soundSystem) {
        soundSystem.init();
        soundSystem.playMusic('game');
    }

    // VHS glitch on start
    if (vhsEffect) {
        vhsEffect.triggerGlitch(1.5, 30);
    }

    console.log('🎮 Game started!');
};

function initGame(isAttractMode = false) {
    // Clear previous state
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
    }

    // Initialize pools
    bulletPool = new BulletPool(200);
    enemyBulletPool = new BulletPool(300);
    particleSystem = new ParticleSystem(500);

    // Initialize systems
    waveManager = new WaveManager();
    collisionSystem = new CollisionSystem();
    radicalSlang = new RadicalSlang();

    // Reset starfield
    if (starfield) {
        starfield.resize(canvas.width, canvas.height);
    } else {
        starfield = new Starfield(canvas.width, canvas.height);
    }

    // Create player
    player = new Player(canvas.width / 2, canvas.height - 100);

    // Initialize power-up manager
    powerUpManager = new PowerUpManager(player);

    // Game state
    gameState = {
        running: true,
        paused: false,
        gameOver: false,
        score: 0,
        lives: 3,
        bombs: 3,
        wave: 1,
        combo: 0,
        maxCombo: 0,
        comboTimer: 0,
        comboTimeout: 180,
        enemies: [],
        powerUps: [],
        boss: null,
        player: player,
        powerUpManager: powerUpManager,
        radicalSlang: radicalSlang,
        screenShake: { x: 0, y: 0, intensity: 0, duration: 0 },
        highScore: parseInt(localStorage.getItem('geometry3044_highScore')) || 0,
        isAttractMode: isAttractMode
    };

    // Start wave 1
    waveManager.startWave(1);

    // Reset keys
    keys = {};
}

// ============================================
// GAME LOOP
// ============================================

function gameLoop(currentTime) {
    // Calculate delta time
    const deltaTime = Math.min((currentTime - lastTime) / 16.67, 3);
    lastTime = currentTime;

    // Continue loop
    gameLoopId = requestAnimationFrame(gameLoop);

    // Check game state
    if (!gameState || !gameState.running) {
        return;
    }

    // Update VHS effect
    if (vhsEffect) vhsEffect.update();

    // Paused?
    if (gameState.paused) {
        render();
        drawPauseScreen();
        return;
    }

    // Game over?
    if (gameState.gameOver) {
        render();
        drawGameOverScreen();
        return;
    }

    // Attract mode AI
    if (attractMode && attractModeAI) {
        updateAttractModeAI();
    }

    // Update
    update(deltaTime);

    // Render
    render();

    // VHS effect overlay
    if (vhsEffect) {
        vhsEffect.apply(ctx, canvas);
    }

    // Attract mode overlay
    if (attractMode) {
        drawAttractModeOverlay();
    }
}

// ============================================
// UPDATE
// ============================================

function update(deltaTime) {
    // Update starfield
    if (starfield) starfield.update(deltaTime);

    // Update mobile controls and sync touch state
    if (mobileControls && mobileControls.enabled) {
        mobileControls.update(deltaTime);

        // Sync mobile controls state with legacy touch variables
        const movement = mobileControls.getMovement();
        touchJoystick.active = mobileControls.joystick.active;
        touchJoystick.startX = mobileControls.joystick.baseX;
        touchJoystick.startY = mobileControls.joystick.baseY;
        touchJoystick.currentX = mobileControls.joystick.stickX;
        touchJoystick.currentY = mobileControls.joystick.stickY;

        touchButtons.fire = mobileControls.isFiring();
        touchButtons.bomb = mobileControls.isBombing();

        // Trigger bomb on button press (not hold)
        if (touchButtons.bomb && !bombPressedLastFrame && gameState?.running && !gameState.paused) {
            useBomb();
        }
        bombPressedLastFrame = touchButtons.bomb;
    }

    // Update player
    if (player && player.isAlive) {
        player.update(keys, canvas, bulletPool, gameState, touchJoystick, touchButtons, particleSystem, soundSystem);
    }

    // Update bullets
    if (bulletPool) bulletPool.update(canvas, gameState);
    if (enemyBulletPool) enemyBulletPool.update(canvas, gameState);

    // Update enemies
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const enemy = gameState.enemies[i];
        if (!enemy.active) {
            gameState.enemies.splice(i, 1);
            continue;
        }
        enemy.update(player?.x || canvas.width / 2, player?.y || canvas.height - 100,
                    canvas, enemyBulletPool, gameState, particleSystem);
    }

    // Update boss
    if (gameState.boss) {
        gameState.boss.update(player?.x || canvas.width / 2, player?.y || canvas.height - 100,
                             enemyBulletPool, gameState, particleSystem);

        if (!gameState.boss.active) {
            // Boss defeated!
            gameState.score += gameState.boss.points || 5000;

            if (particleSystem) {
                particleSystem.addBossExplosion(gameState.boss.x, gameState.boss.y);
            }

            if (soundSystem) {
                soundSystem.playExplosion();
            }

            gameState.boss = null;
        }
    }

    // Update wave manager
    if (waveManager && !gameState.boss) {
        waveManager.update(gameState.enemies, canvas, gameState);

        // Check for wave complete
        if (waveManager.isWaveComplete()) {
            gameState.wave++;

            // Update starfield theme
            if (starfield) starfield.updateTheme(gameState.wave);

            // Boss wave?
            if (waveManager.isBossWave() || gameState.wave % 5 === 0) {
                spawnBoss();
            } else {
                waveManager.startWave(gameState.wave);
            }
        }
    }

    // Update power-ups
    for (let i = gameState.powerUps.length - 1; i >= 0; i--) {
        const powerUp = gameState.powerUps[i];
        if (!powerUp.active) {
            gameState.powerUps.splice(i, 1);
            continue;
        }
        powerUp.update(canvas);
    }

    // Update particles
    if (particleSystem) particleSystem.update(deltaTime);

    // Update radical slang
    if (radicalSlang) radicalSlang.update();

    // Update power-up manager
    if (powerUpManager) powerUpManager.update();

    // Collision detection
    if (collisionSystem) {
        collisionSystem.checkCollisions(gameState, bulletPool, enemyBulletPool, particleSystem, soundSystem);
    }

    // Update combo
    if (gameState.comboTimer > 0) {
        gameState.comboTimer--;
        if (gameState.comboTimer <= 0) {
            gameState.combo = 0;
            if (radicalSlang) radicalSlang.resetCombo();
        }
    }

    // Update screen shake
    if (gameState.screenShake.duration > 0) {
        gameState.screenShake.duration--;
        gameState.screenShake.x = (Math.random() - 0.5) * gameState.screenShake.intensity;
        gameState.screenShake.y = (Math.random() - 0.5) * gameState.screenShake.intensity;
        gameState.screenShake.intensity *= 0.95;
    } else {
        gameState.screenShake.x = 0;
        gameState.screenShake.y = 0;
    }

    // Check player death
    if (player && !player.isAlive && !gameState.gameOver) {
        handlePlayerDeath();
    }

    // Update HUD
    if (hud) hud.update(gameState, deltaTime);

    // Extra life at 100000 points
    const extraLifeThreshold = 100000;
    const currentExtraLives = Math.floor(gameState.score / extraLifeThreshold);
    const previousExtraLives = Math.floor((gameState.score - 100) / extraLifeThreshold);

    if (currentExtraLives > previousExtraLives && gameState.score > 0) {
        gameState.lives++;
        if (particleSystem) {
            particleSystem.addPowerUpCollect(canvas.width / 2, canvas.height / 2, '#ff6666');
        }
        if (soundSystem) soundSystem.playPowerUp(3);
    }
}

// ============================================
// RENDER
// ============================================

function render() {
    // Clear
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // Apply screen shake
    ctx.translate(gameState.screenShake.x, gameState.screenShake.y);

    // Background
    drawBackground(ctx, canvas, gameState.wave);

    // Starfield
    if (starfield) starfield.draw(ctx);

    // Grid
    drawThemedGrid(ctx, canvas, gameState.wave);

    // Particles (behind entities)
    if (particleSystem) particleSystem.draw(ctx);

    // Power-ups
    for (const powerUp of gameState.powerUps) {
        if (powerUp.draw) powerUp.draw(ctx);
    }

    // Enemy bullets
    if (enemyBulletPool) enemyBulletPool.draw(ctx);

    // Enemies
    for (const enemy of gameState.enemies) {
        if (enemy.draw) enemy.draw(ctx);
    }

    // Boss
    if (gameState.boss) {
        gameState.boss.draw(ctx);
    }

    // Player bullets
    if (bulletPool) bulletPool.draw(ctx);

    // Player
    if (player && player.isAlive) {
        if (!player.invulnerable || Math.floor(Date.now() / 100) % 2) {
            player.draw(ctx);
        }
    }

    // Radical slang
    if (radicalSlang) radicalSlang.draw(ctx, canvas.width, canvas.height);

    // Wave text
    if (waveManager) waveManager.drawWaveText(ctx, canvas);

    ctx.restore();

    // HUD (not affected by screen shake)
    if (hud) hud.draw(ctx, gameState);

    // Power-up manager UI
    if (powerUpManager) powerUpManager.drawUI(ctx);

    // Mobile controls (rendered on top)
    if (mobileControls && mobileControls.enabled) {
        mobileControls.draw(ctx);
    }
}

// ============================================
// MENU LOOP
// ============================================

function menuLoop() {
    if (gameState?.running) return;
    if (attractMode) return;

    // Clear
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw starfield
    if (starfield) {
        starfield.update(1);
        starfield.draw(ctx);
    }

    // Draw grid (subtle)
    drawThemedGrid(ctx, canvas, 1);

    // VHS effect
    if (vhsEffect) vhsEffect.apply(ctx, canvas);

    // Update and draw mobile controls in menu
    if (mobileControls && mobileControls.enabled) {
        mobileControls.update(1);
        mobileControls.draw(ctx);
    }

    requestAnimationFrame(menuLoop);
}

// ============================================
// BOSS SPAWNING
// ============================================

function spawnBoss() {
    console.log(`🔥 Spawning boss for wave ${gameState.wave}`);

    gameState.boss = new Boss(gameState.wave, canvas);

    if (soundSystem) {
        soundSystem.playBossAppear();
    }

    if (vhsEffect) {
        vhsEffect.triggerGlitch(2, 60);
    }

    // Screen shake
    gameState.screenShake.intensity = 10;
    gameState.screenShake.duration = 60;
}

// ============================================
// BOMB
// ============================================

function useBomb() {
    if (!gameState || gameState.bombs <= 0 || gameState.paused || gameState.gameOver) return;

    gameState.bombs--;

    console.log('💣 BOMB USED!');

    // Sound
    if (soundSystem) soundSystem.playBomb();

    // Screen shake
    gameState.screenShake.intensity = 20;
    gameState.screenShake.duration = 45;

    // VHS glitch
    if (vhsEffect) vhsEffect.triggerGlitch(2, 30);

    // Clear enemy bullets
    if (enemyBulletPool) enemyBulletPool.clear();

    // Damage all enemies
    for (const enemy of gameState.enemies) {
        if (enemy.active) {
            enemy.takeDamage(50);
            if (particleSystem) {
                particleSystem.addExplosion(enemy.x, enemy.y, enemy.color || '#ff6600', 15);
            }
        }
    }

    // Damage boss
    if (gameState.boss && gameState.boss.active) {
        gameState.boss.takeDamage(20);
    }

    // Radial explosion from player
    if (player && particleSystem) {
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 16) {
            particleSystem.addParticle({
                x: player.x,
                y: player.y,
                vx: Math.cos(angle) * 15,
                vy: Math.sin(angle) * 15,
                life: 30,
                size: 8,
                color: '#ffff00',
                glow: true
            });
        }
    }

    // Brief invulnerability
    if (player) {
        player.invulnerable = true;
        player.invulnerableTimer = 60;
    }
}

// ============================================
// PAUSE
// ============================================

function togglePause() {
    if (!gameState || gameState.gameOver) return;

    gameState.paused = !gameState.paused;

    if (gameState.paused) {
        if (soundSystem) soundSystem.pauseMusic();
    } else {
        if (soundSystem) soundSystem.resumeMusic();
    }
}

function drawPauseScreen() {
    // Darken
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Pause text
    ctx.save();
    ctx.font = 'bold 64px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00ffff';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#00ffff';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 20);

    ctx.font = '24px "Courier New", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillText('Press P or ESC to continue', canvas.width / 2, canvas.height / 2 + 40);
    ctx.restore();
}

// ============================================
// PLAYER DEATH & GAME OVER
// ============================================

function handlePlayerDeath() {
    gameState.lives--;

    // Reset combo
    gameState.combo = 0;
    if (radicalSlang) radicalSlang.resetCombo();

    // Explosion
    if (particleSystem && player) {
        particleSystem.addExplosion(player.x, player.y, '#00ff00', 30);
    }

    // Sound
    if (soundSystem) soundSystem.playExplosion();

    // Screen shake
    gameState.screenShake.intensity = 15;
    gameState.screenShake.duration = 30;

    // VHS glitch
    if (vhsEffect) vhsEffect.triggerGlitch(2, 45);

    if (gameState.lives <= 0) {
        // Game over
        gameState.gameOver = true;

        if (soundSystem) {
            soundSystem.stopMusic();
            soundSystem.playGameOver();
        }

        // Save high score
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            localStorage.setItem('geometry3044_highScore', gameState.highScore);
        }
    } else {
        // Respawn
        if (player) {
            player.respawn(canvas);
        }
    }
}

function drawGameOverScreen() {
    // Darken
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.textAlign = 'center';

    // Game Over
    ctx.font = 'bold 72px "Courier New", monospace';
    ctx.fillStyle = '#ff0000';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ff0000';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 60);

    // Score
    ctx.font = 'bold 36px "Courier New", monospace';
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.fillText(`SCORE: ${gameState.score.toLocaleString()}`, canvas.width / 2, canvas.height / 2 + 10);

    // Wave
    ctx.font = '24px "Courier New", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`REACHED WAVE ${gameState.wave}`, canvas.width / 2, canvas.height / 2 + 50);

    // Max combo
    ctx.fillText(`MAX COMBO: ${gameState.maxCombo}x`, canvas.width / 2, canvas.height / 2 + 80);

    // High score
    if (gameState.score >= gameState.highScore) {
        ctx.font = 'bold 28px "Courier New", monospace';
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.fillText('★ NEW HIGH SCORE! ★', canvas.width / 2, canvas.height / 2 + 130);
    }

    // Continue prompt
    ctx.font = '20px "Courier New", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;

    if (credits > 0) {
        ctx.fillText(`Press SPACE to continue (${credits} credits)`, canvas.width / 2, canvas.height / 2 + 180);
    } else {
        ctx.fillText('Press C to insert coin, SPACE to return to menu', canvas.width / 2, canvas.height / 2 + 180);
    }

    ctx.restore();

    // Handle continue
    if (keys[' '] || keys['Space']) {
        keys[' '] = false;
        keys['Space'] = false;

        if (credits > 0) {
            // Continue game
            credits--;
            updateCreditsDisplay();

            gameState.lives = 3;
            gameState.gameOver = false;

            if (player) {
                player.respawn(canvas);
            }

            if (enemyBulletPool) enemyBulletPool.clear();

            if (soundSystem) soundSystem.playMusic('game');
        } else {
            // Return to menu
            returnToMenu();
        }
    }
}

function returnToMenu() {
    // Stop game
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }

    gameState = null;
    player = null;

    // Show menu
    const menuScreen = document.getElementById('menuScreen');
    const gameUI = document.getElementById('gameUI');

    if (menuScreen) menuScreen.style.display = 'flex';
    if (gameUI) gameUI.style.display = 'none';

    // Update high score display
    const highScore = localStorage.getItem('geometry3044_highScore') || 0;
    const highScoreEl = document.getElementById('menuHighScore') || document.getElementById('highScoreDisplay');
    if (highScoreEl) {
        highScoreEl.textContent = parseInt(highScore).toLocaleString();
    }

    // Start menu loop
    requestAnimationFrame(menuLoop);

    resetAttractModeTimeout();
}

// ============================================
// ATTRACT MODE OVERLAY
// ============================================

function drawAttractModeOverlay() {
    ctx.save();

    // Demo mode indicator
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff00ff';
    ctx.fillText('★ DEMO MODE ★', canvas.width / 2, 40);

    // Promo text
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.fillText(promoTexts[currentPromoIndex], canvas.width / 2, canvas.height - 60);

    // Press any key
    const blink = Math.sin(Date.now() * 0.005) > 0;
    if (blink) {
        ctx.font = '18px "Courier New", monospace';
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.fillText('PRESS ANY KEY TO START', canvas.width / 2, canvas.height - 25);
    }

    ctx.restore();
}

// ============================================
// EXPOSE GLOBALS
// ============================================

window.gameState = gameState;
window.startGame = window.startGame;

// ============================================
// START
// ============================================

// Wait for DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
