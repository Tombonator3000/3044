/**
 * Geometry 3044 - Main Entry Point
 * ES6 Module version - Full Game Integration
 */

import { CONFIG, WAVE_THEMES, getCurrentTheme } from './config.js';
import {
    canvas, ctx, gameState, keys, config,
    cachedUI, setCanvas, setCtx, initCachedUI,
    setGameState, setParticleSystem, setBulletPool,
    setEnemyBulletPool, setWaveManager, setSoundSystem,
    setStarfield, setVhsGlitch, setWeaponManager
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

console.log('🎮 Geometry 3044 - Loading...');

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
    console.log('🚀 Initializing Geometry 3044...');

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

    // Initialize sound system
    soundSystem = new SoundSystem();
    setSoundSystem(soundSystem);

    // Initialize menu manager
    menuManager = new MenuManager();
    menuManager.init();

    // Set up start game callback
    menuManager.onStartGame = () => {
        startGame();
    };

    // Initialize starfield for menu background
    starfield = new Starfield();
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
 * Start the game
 */
function startGame() {
    console.log('🎮 Starting game...');

    // Initialize sound system if not already done
    if (soundSystem && !soundSystem.initialized) {
        soundSystem.init();
    }

    // Play menu select sound
    if (soundSystem) {
        soundSystem.play('menuSelect');
    }

    // Check credits
    if (!menuManager.useCredit()) {
        console.log('❌ No credits available!');
        return;
    }

    // Create game state
    gameStateInstance = new GameState();
    setGameState(gameStateInstance);

    // Create player
    const player = new Player(
        canvasElement.width / 2,
        canvasElement.height - CONFIG.player.startYOffset
    );
    gameStateInstance.player = player;

    // Initialize systems
    particleSystem = new ParticleSystem();
    setParticleSystem(particleSystem);

    bulletPool = new BulletPool(CONFIG.bullets.poolSize);
    setBulletPool(bulletPool);

    enemyBulletPool = new BulletPool(CONFIG.bullets.poolSize);
    setEnemyBulletPool(enemyBulletPool);

    // Initialize input handler
    inputHandler = new InputHandler();
    inputHandler.init();

    // Initialize collision system
    collisionSystem = new CollisionSystem({
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
    });

    // Initialize wave manager
    waveManager = new WaveManager({
        gameState: gameStateInstance,
        canvas: canvasElement,
        onWaveComplete: (waveNum) => {
            console.log(`🌊 Wave ${waveNum} complete!`);
            if (soundSystem) soundSystem.play('waveComplete');
        }
    });
    setWaveManager(waveManager);

    // Initialize VHS glitch effect
    vhsGlitch = new VHSGlitchEffects();
    setVhsGlitch(vhsGlitch);

    // Initialize HUD
    hud = new HUD(getTheme(DEFAULT_THEME));

    // Initialize options menu
    optionsMenu = new OptionsMenu({
        currentTheme: DEFAULT_THEME,
        onThemeChange: (themeName) => {
            hud.setTheme(getTheme(themeName));
        }
    });

    // Initialize weapon manager
    weaponManager = new WeaponManager({
        gameState: gameStateInstance,
        bulletPool: bulletPool,
        particleSystem: particleSystem,
        soundSystem: soundSystem
    });
    setWeaponManager(weaponManager);

    // Create game loop
    gameLoop = new GameLoop({
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
    });

    // Set game as running
    gameStateInstance.gameRunning = true;

    // Switch to game UI
    menuManager.showGameUI();

    // Start the game loop
    gameLoop.start();

    // Load and play game music
    loadAndPlayMusic('game');

    console.log('🎮 Game started!');
}

/**
 * Handle player death
 */
function playerDeath() {
    if (!gameStateInstance) return;

    gameStateInstance.lives--;
    gameStateInstance.playerInvulnerable = true;
    gameStateInstance.invulnerabilityTimer = 180; // 3 seconds at 60fps

    if (soundSystem) {
        soundSystem.play('playerDeath');
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
        setTimeout(() => {
            if (gameStateInstance && gameStateInstance.player) {
                gameStateInstance.player.x = canvasElement.width / 2;
                gameStateInstance.player.y = canvasElement.height - CONFIG.player.startYOffset;
            }
        }, 1000);
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
        soundSystem.play('explosionLarge');
        soundSystem.stopMusic();
    }

    // Show game over screen
    menuManager.showGameOver(gameStateInstance ? gameStateInstance.score : 0);

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
        await soundSystem.init();
    }

    try {
        const url = type === 'menu'
            ? CONFIG.audio.urls.menuMusic
            : CONFIG.audio.urls.gameMusic;

        // Try to load and play music
        await soundSystem.loadMusic(type, url);
        soundSystem.playMusic(type, true);
    } catch (error) {
        console.warn(`Could not load ${type} music:`, error);

        // Try fallback
        try {
            const fallbackUrl = type === 'menu'
                ? CONFIG.audio.urls.fallbackMenuMusic
                : CONFIG.audio.urls.fallbackGameMusic;

            await soundSystem.loadMusic(type, fallbackUrl);
            soundSystem.playMusic(type, true);
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
    // HUD Themes
    HUD_THEMES,
    getTheme,
    getAllThemes
};
