// ============================================
// GEOMETRY 3044 — MAIN GAME FILE
// ============================================

// === IMPORTS ===
import { config, getCurrentTheme, updateConfig, getDifficultySettings } from './config.js';
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
import { drawWavingGrid, drawBackground, addGridImpact } from './rendering/GridRenderer.js';
import { initCachedUI } from './globals.js';
import { MenuManager, GameSettings } from './ui/MenuManager.js';
import { MobileControls } from './ui/MobileControls.js';

// New gameplay systems
import { GrazingSystem } from './systems/GrazingSystem.js';
import { RiskRewardSystem } from './systems/RiskRewardSystem.js';
import { SlowMotionSystem } from './systems/SlowMotionSystem.js';
import { ZoneSystem } from './systems/ZoneSystem.js';
import { ReactiveMusicSystem } from './systems/ReactiveMusicSystem.js';
import { MusicManager } from './systems/MusicManager.js';
import { ShipManager } from './systems/ShipManager.js';
import { GameModeManager } from './systems/GameModeManager.js';
import { DailyChallengeSystem } from './systems/DailyChallengeSystem.js';
import { AchievementSystem } from './systems/AchievementSystem.js';

// === GLOBAL STATE ===
let canvas, ctx;
const LOGICAL_CANVAS_SIZE = 900;
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
let menuManager = null;
let mobileControls = null;

// === LAYOUT STATE ===
let isPcLayout = false;
let isMobileDevice = false;

// === NEW GAMEPLAY SYSTEMS ===
let grazingSystem = null;
let riskRewardSystem = null;
let slowMotionSystem = null;
let zoneSystem = null;
let reactiveMusicSystem = null;
let musicManager = null;
let shipManager = null;
let gameModeManager = null;
let dailyChallengeSystem = null;
let achievementSystem = null;

// Achievement notification state
let achievementNotification = null;
let achievementNotificationTimer = 0;

// === INPUT ===
let keys = {};
let touchJoystick = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 };
let touchButtons = { fire: false, bomb: false };
let bombPressedLastFrame = false;

// === MENU STATE ===
let credits = 3;
let creditsPurchased = 0; // Tracks how many credits have been purchased (for escalating cost)
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

// === BACKSTORY FOR ATTRACT MODE ===
const backstoryTexts = [
    "THE YEAR IS 3044...",
    "EARTH'S LAST HOPE LIES IN THE STARS",
    "THE STAROVER COMMAND HAS SEARCHED THE GALAXY",
    "FOR A PILOT WORTHY OF THE ULTIMATE MISSION",
    "AFTER ANALYZING BILLIONS OF CANDIDATES...",
    "THEY HAVE CHOSEN YOU",
    "YOUR ARCADE SKILLS HAVE BEEN MONITORED",
    "THIS IS NOT A GAME — IT NEVER WAS",
    "YOU ARE THE CHOSEN ONE",
    "ONLY YOU CAN STOP THE GEOMETRY INVASION",
    "THE FATE OF THE UNIVERSE RESTS IN YOUR HANDS",
    "STAROVER COMMAND AWAITS YOUR RESPONSE",
    "INSERT COIN TO ACCEPT YOUR DESTINY"
];
let currentBackstoryIndex = 0;
let backstoryTimer = 0;
let backstoryCharIndex = 0;

console.log('🎮 Geometry 3044 — Loading...');

// ============================================
// INITIALIZATION
// ============================================

function applyGameSettings() {
    if (vhsEffect) {
        vhsEffect.setEnabled(GameSettings.vhsEffect);
    }

    const overlayEnabled = GameSettings.scanlines;
    const overlayElements = document.querySelectorAll('.scanlines-overlay, .vignette-overlay, .crt-flicker');
    overlayElements.forEach((overlay) => {
        overlay.style.display = overlayEnabled ? 'block' : 'none';
        overlay.style.opacity = overlayEnabled ? '1' : '0';
    });

    if (gameState?.screenShake) {
        gameState.screenShake.enabled = GameSettings.screenShake;
        if (!gameState.screenShake.enabled) {
            gameState.screenShake.intensity = 0;
            gameState.screenShake.duration = 0;
            gameState.screenShake.x = 0;
            gameState.screenShake.y = 0;
        }
    }

    if (particleSystem) {
        particleSystem.setIntensity(GameSettings.particleIntensity);
    }

    // Apply music settings
    if (musicManager) {
        if (GameSettings.musicEnabled) {
            musicManager.enableMusic();
        } else {
            musicManager.disableMusic();
        }
    }
}

function init() {
    console.log('🚀 Initializing Geometry 3044...');

    // Get canvas
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('❌ Canvas not found!');
        return;
    }

    ctx = canvas.getContext('2d');
    canvas.logicalWidth = LOGICAL_CANVAS_SIZE;
    canvas.logicalHeight = LOGICAL_CANVAS_SIZE;

    // Detect layout type
    detectLayoutType();
    window.addEventListener('resize', detectLayoutType);

    // IMPORTANT: Explicitly hide PC layout on init - ensures it's hidden during menu
    const pcLayoutEl = document.getElementById('pcLayout');
    if (pcLayoutEl) {
        pcLayoutEl.style.display = 'none';
        pcLayoutEl.style.visibility = 'hidden';
        pcLayoutEl.classList.remove('game-active');
    }

    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Handle fullscreen changes - resize canvas when entering/exiting fullscreen
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Initialize input
    initInput();

    // Initialize cached UI elements
    initCachedUI();

    // Initialize menu manager for options and high scores
    menuManager = new MenuManager();
    menuManager.init();
    menuManager.onSettingsChanged = applyGameSettings;

    // Initialize sound system (needs user interaction to fully activate)
    soundSystem = new SoundSystem();

    // Initialize starfield for menu
    starfield = new Starfield(canvas.logicalWidth, canvas.logicalHeight);

    // Initialize VHS effect
    vhsEffect = new VHSEffect();
    applyGameSettings();

    // Initialize HUD
    hud = new HUD();
    hud.resize(canvas.logicalWidth, canvas.logicalHeight);

    // Initialize mobile controls (canvas-based joystick for touch devices)
    mobileControls = new MobileControls(canvas);

    // Initialize DOM touch controls as fallback
    initDomTouchControls();

    // Initialize new gameplay systems
    shipManager = new ShipManager();
    gameModeManager = new GameModeManager();
    dailyChallengeSystem = new DailyChallengeSystem();
    achievementSystem = new AchievementSystem();

    // Initialize music manager (will load music on first user interaction)
    musicManager = new MusicManager();

    // Connect menu manager callback for music
    if (menuManager) {
        menuManager.onMenuShow = () => initAndPlayMenuMusic();
    }

    // Update config
    updateConfig(canvas.logicalWidth, canvas.logicalHeight);

    // Setup menu
    setupMenu();

    // Initialize credit cost display
    updateCreditsDisplay();

    console.log('🎮 New systems initialized: Grazing, Risk/Reward, SlowMo, Zones, Ships, Modes, Achievements');
    console.log(`📱 Layout: ${isPcLayout ? 'PC (3-part)' : 'Mobile'}, Touch: ${isMobileDevice}`);

    // Start menu animation
    requestAnimationFrame(menuLoop);

    // Start attract mode timer
    resetAttractModeTimeout();

    console.log('✅ Canvas initialized:', canvas.logicalWidth, 'x', canvas.logicalHeight);
    console.log('🎮 Geometry 3044 — Ready!');
    console.log('💡 Press START GAME to play');
}

function detectLayoutType() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspectRatio = width / height;

    // PC layout if wide screen (16:9 or wider) and min width 901px
    isPcLayout = width >= 901 && aspectRatio >= 4/3;

    // Mobile if touch device or narrow screen
    isMobileDevice = 'ontouchstart' in window ||
                     navigator.maxTouchPoints > 0 ||
                     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Update visibility based on game state
    const pcLayout = document.getElementById('pcLayout');
    const mobileHudLayer = document.getElementById('mobileHudLayer');

    if (gameState?.running) {
        // During gameplay
        if (pcLayout) {
            pcLayout.style.display = isPcLayout ? 'flex' : 'none';
        }
        if (mobileHudLayer) {
            mobileHudLayer.style.display = isPcLayout ? 'none' : 'block';
        }
    }
}

function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.logicalWidth = LOGICAL_CANVAS_SIZE;
    canvas.logicalHeight = LOGICAL_CANVAS_SIZE;
    canvas.width = canvas.logicalWidth * dpr;
    canvas.height = canvas.logicalHeight * dpr;

    if (isPcLayout) {
        // PC Layout: Canvas fills entire center area (stretches to fill, no black bars)
        const centerArea = document.getElementById('centerGameArea');
        if (centerArea) {
            const areaRect = centerArea.getBoundingClientRect();
            // Fill the entire center area - stretch to remove black bars
            canvas.style.width = `${areaRect.width}px`;
            canvas.style.height = `${areaRect.height}px`;
        } else {
            // Fallback to full available space
            const hudWidth = 360; // Approximate total HUD width (180px * 2)
            canvas.style.width = `${window.innerWidth - hudWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
        }
    } else {
        // Mobile/tablet: Canvas fills container
        const gameArea = document.getElementById('gameContainer');
        const rect = (gameArea || canvas).getBoundingClientRect();
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    updateConfig(canvas.logicalWidth, canvas.logicalHeight);

    if (starfield) starfield.resize(canvas.logicalWidth, canvas.logicalHeight);
    if (hud) hud.resize(canvas.logicalWidth, canvas.logicalHeight);
    if (mobileControls) mobileControls.resize(canvas.logicalWidth, canvas.logicalHeight);
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
            if (musicManager) {
                musicManager.toggleMusic();
            }
        }

        // FPS/Performance monitor toggle (F3)
        if (e.key === 'F3') {
            e.preventDefault();
            if (hud) {
                const visible = hud.togglePerformanceMonitor();
                console.log(`Performance monitor: ${visible ? 'ON' : 'OFF'}`);
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
        keys[e.code] = false;
    });

    // Legacy touch controls - allow touch on canvas as fallback
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

function initDomTouchControls() {
    const joystick = document.getElementById('touchJoystick');
    const fireButton = document.getElementById('touchFire');
    const bombButton = document.getElementById('touchBomb');

    if (!joystick || !fireButton || !bombButton) return;

    let joystickPointerId = null;

    const updateJoystick = (event) => {
        const rect = joystick.getBoundingClientRect();
        const baseX = rect.left + rect.width / 2;
        const baseY = rect.top + rect.height / 2;

        touchJoystick.active = true;
        touchJoystick.startX = baseX;
        touchJoystick.startY = baseY;
        touchJoystick.currentX = event.clientX;
        touchJoystick.currentY = event.clientY;
    };

    joystick.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        joystickPointerId = event.pointerId;
        joystick.setPointerCapture(event.pointerId);
        updateJoystick(event);
    });

    joystick.addEventListener('pointermove', (event) => {
        if (event.pointerId !== joystickPointerId) return;
        event.preventDefault();
        updateJoystick(event);
    });

    const endJoystick = (event) => {
        if (event.pointerId !== joystickPointerId) return;
        event.preventDefault();
        joystickPointerId = null;
        touchJoystick.active = false;
    };

    joystick.addEventListener('pointerup', endJoystick);
    joystick.addEventListener('pointercancel', endJoystick);
    joystick.addEventListener('pointerleave', endJoystick);

    const handleFireStart = (event) => {
        event.preventDefault();
        fireButton.setPointerCapture(event.pointerId);
        touchButtons.fire = true;
    };

    const handleFireEnd = (event) => {
        event.preventDefault();
        touchButtons.fire = false;
    };

    fireButton.addEventListener('pointerdown', handleFireStart);
    fireButton.addEventListener('pointerup', handleFireEnd);
    fireButton.addEventListener('pointercancel', handleFireEnd);
    fireButton.addEventListener('pointerleave', handleFireEnd);

    const handleBombStart = (event) => {
        event.preventDefault();
        bombButton.setPointerCapture(event.pointerId);
        touchButtons.bomb = true;
        if (gameState?.running && !gameState.paused) {
            useBomb();
        }
    };

    const handleBombEnd = (event) => {
        event.preventDefault();
        touchButtons.bomb = false;
    };

    bombButton.addEventListener('pointerdown', handleBombStart);
    bombButton.addEventListener('pointerup', handleBombEnd);
    bombButton.addEventListener('pointercancel', handleBombEnd);
    bombButton.addEventListener('pointerleave', handleBombEnd);
}

function handleTouchStart(e) {
    e.preventDefault();
    resetAttractModeTimeout();

    if (attractMode) {
        exitAttractMode();
        return;
    }

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (canvas.logicalWidth / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.logicalHeight / rect.height);

    // Left half = joystick
    if (x < canvas.logicalWidth / 2) {
        touchJoystick.active = true;
        touchJoystick.startX = x;
        touchJoystick.startY = y;
        touchJoystick.currentX = x;
        touchJoystick.currentY = y;
    } else {
        // Right half - top = bomb, bottom = fire
        if (y < canvas.logicalHeight / 2) {
            touchButtons.bomb = true;
            if (gameState?.running) useBomb();
        } else {
            touchButtons.fire = true;
        }
    }
}

function handleTouchMove(e) {
    e.preventDefault();

    if (touchJoystick.active && e.touches[0]) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        touchJoystick.currentX = (touch.clientX - rect.left) * (canvas.logicalWidth / rect.width);
        touchJoystick.currentY = (touch.clientY - rect.top) * (canvas.logicalHeight / rect.height);
    }
}

function handleTouchEnd(e) {
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
        let lastStartTrigger = 0;
        const triggerStart = (event) => {
            if (event.type === 'pointerdown' || event.type === 'touchstart') {
                event.preventDefault();
            } else if (performance.now() - lastStartTrigger < 500) {
                return;
            }

            lastStartTrigger = performance.now();
            resetAttractModeTimeout();
            window.startGame();
        };

        startButton.addEventListener('click', triggerStart);
        startButton.addEventListener('pointerdown', triggerStart, { passive: false });
        startButton.addEventListener('touchstart', triggerStart, { passive: false });
    }

    // Load high score (check both possible IDs)
    const highScore = localStorage.getItem('geometry3044_highScore') || 0;
    const highScoreEl = document.getElementById('menuHighScore') || document.getElementById('highScoreDisplay');
    if (highScoreEl) {
        highScoreEl.textContent = parseInt(highScore).toLocaleString();
    }

    // Setup new menu buttons
    setupShipSelectScreen();
    setupGameModeScreen();
    setupDailyChallengeScreen();
    setupAchievementsScreen();
}

// ============================================
// SHIP SELECT SCREEN
// ============================================

let selectedShipIndex = 0;

function setupShipSelectScreen() {
    const selectShipBtn = document.getElementById('selectShipBtn');
    const shipSelectScreen = document.getElementById('shipSelectScreen');
    const confirmShipBtn = document.getElementById('confirmShipBtn');
    const backFromShipBtn = document.getElementById('backFromShipBtn');
    const shipGrid = document.getElementById('shipGrid');

    if (selectShipBtn) {
        selectShipBtn.addEventListener('click', () => {
            resetAttractModeTimeout();
            showScreen('shipSelectScreen');
            populateShipGrid();
        });
    }

    if (confirmShipBtn) {
        confirmShipBtn.addEventListener('click', () => {
            const ships = shipManager.getAllShips();
            const selectedShip = ships[selectedShipIndex];
            if (selectedShip && selectedShip.unlocked) {
                shipManager.selectShip(selectedShip.id);
                if (soundSystem) soundSystem.playPowerUp(1);
            }
            showScreen('menuScreen');
        });
    }

    if (backFromShipBtn) {
        backFromShipBtn.addEventListener('click', () => {
            showScreen('menuScreen');
        });
    }
}

function populateShipGrid() {
    const shipGrid = document.getElementById('shipGrid');
    if (!shipGrid || !shipManager) return;

    const ships = shipManager.getAllShips();
    const currentShip = shipManager.getCurrentShip();

    shipGrid.innerHTML = '';

    ships.forEach((ship, index) => {
        const card = document.createElement('div');
        card.className = `ship-card ${ship.unlocked ? '' : 'locked'} ${ship.id === currentShip.id ? 'selected' : ''}`;
        card.style.borderColor = ship.unlocked ? ship.color : '#666';

        // Create canvas for ship preview
        const previewDiv = document.createElement('div');
        previewDiv.className = 'ship-preview';
        previewDiv.style.borderColor = ship.color;
        previewDiv.style.border = 'none';
        previewDiv.style.background = 'transparent';

        const canvas = document.createElement('canvas');
        canvas.width = 60;
        canvas.height = 60;
        canvas.style.width = '60px';
        canvas.style.height = '60px';
        previewDiv.appendChild(canvas);

        // Draw the actual ship preview
        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.translate(30, 30);
        drawShipPreviewOnCanvas(ctx, ship.id, ship.color, ship.unlocked);
        ctx.restore();

        const nameDiv = document.createElement('div');
        nameDiv.className = 'ship-name';
        nameDiv.style.color = ship.unlocked ? ship.color : '#666';
        nameDiv.textContent = ship.name;

        card.appendChild(previewDiv);
        card.appendChild(nameDiv);

        if (ship.unlocked) {
            card.addEventListener('click', () => {
                selectedShipIndex = index;
                updateShipSelection();
                if (soundSystem) soundSystem.playPowerUp(0);
            });
        }

        shipGrid.appendChild(card);
    });

    updateShipSelection();
}

/**
 * Draw ship preview on canvas with actual 8-bit pixel art
 */
function drawShipPreviewOnCanvas(ctx, shipId, color, unlocked) {
    const c = unlocked ? color : '#444444';
    const p = 3; // Pixel size for 8-bit style

    ctx.shadowBlur = unlocked ? 10 : 0;
    ctx.shadowColor = c;

    // Ship patterns (same as in Player.js)
    const shipPatterns = {
        neonFalcon: [
            [0,0,0,0,0,1,0,0,0,0,0],
            [0,0,0,0,1,1,1,0,0,0,0],
            [0,0,0,0,1,1,1,0,0,0,0],
            [0,0,0,1,1,1,1,1,0,0,0],
            [0,0,1,1,1,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,1,1,1,0],
            [1,1,0,1,1,1,1,1,0,1,1],
            [1,0,0,0,1,1,1,0,0,0,1],
            [1,0,0,0,0,1,0,0,0,0,1],
            [0,0,0,0,0,1,0,0,0,0,0],
        ],
        glassCannon: [
            [0,0,0,0,0,1,0,0,0,0,0],
            [0,0,0,0,1,1,1,0,0,0,0],
            [0,0,0,1,0,1,0,1,0,0,0],
            [0,0,1,0,1,1,1,0,1,0,0],
            [0,1,0,0,1,1,1,0,0,1,0],
            [1,0,0,1,1,1,1,1,0,0,1],
            [0,0,1,1,1,1,1,1,1,0,0],
            [0,1,1,0,1,1,1,0,1,1,0],
            [1,1,0,0,0,1,0,0,0,1,1],
            [1,0,0,0,0,0,0,0,0,0,1],
        ],
        tank: [
            [0,0,0,0,0,1,1,0,0,0,0,0],
            [0,0,0,0,1,1,1,1,0,0,0,0],
            [0,0,1,1,1,1,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,0,1,1,1,1,0,1,1,1],
            [1,1,1,0,1,1,1,1,0,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1],
            [0,1,1,1,1,1,1,1,1,1,1,0],
            [0,0,1,1,0,0,0,0,1,1,0,0],
        ],
        speedster: [
            [0,0,0,0,1,0,0,0,0],
            [0,0,0,1,1,1,0,0,0],
            [0,0,0,1,1,1,0,0,0],
            [0,0,0,1,1,1,0,0,0],
            [0,0,1,1,1,1,1,0,0],
            [0,0,1,1,1,1,1,0,0],
            [0,1,0,1,1,1,0,1,0],
            [1,0,0,1,1,1,0,0,1],
            [1,0,0,0,1,0,0,0,1],
            [0,0,0,0,1,0,0,0,0],
            [0,0,0,0,1,0,0,0,0],
        ],
        retroClassic: [
            [0,0,0,0,0,1,0,0,0,0,0],
            [0,0,0,0,1,1,1,0,0,0,0],
            [0,0,0,1,1,1,1,1,0,0,0],
            [0,0,1,1,1,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,1,1,1,0],
            [1,1,1,1,1,1,1,1,1,1,1],
            [1,1,0,1,1,1,1,1,0,1,1],
            [1,0,0,0,1,1,1,0,0,0,1],
            [1,0,0,0,0,1,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,1],
        ],
        phantom: [
            [0,0,0,1,1,1,1,0,0,0],
            [0,0,1,1,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,1,1,0],
            [1,1,0,0,1,1,0,0,1,1],
            [1,1,0,0,1,1,0,0,1,1],
            [1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1],
            [1,0,1,1,0,0,1,1,0,1],
            [1,0,0,1,0,0,1,0,0,1],
        ],
        berserker: [
            [0,0,0,0,0,1,0,0,0,0,0],
            [0,0,0,0,1,1,1,0,0,0,0],
            [1,0,0,1,1,1,1,1,0,0,1],
            [1,1,0,1,1,1,1,1,0,1,1],
            [0,1,1,1,1,1,1,1,1,1,0],
            [0,0,1,1,1,1,1,1,1,0,0],
            [0,1,1,0,1,1,1,0,1,1,0],
            [1,1,0,0,1,1,1,0,0,1,1],
            [1,0,0,0,0,1,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,1],
            [0,0,0,0,0,1,0,0,0,0,0],
        ],
        synth: [
            [0,0,0,1,1,1,1,0,0,0],
            [0,0,1,1,1,1,1,1,0,0],
            [0,1,1,1,1,1,1,1,1,0],
            [0,1,1,1,1,1,1,1,1,0],
            [1,1,0,1,1,1,1,0,1,1],
            [1,0,0,1,1,1,1,0,0,1],
            [1,0,0,0,1,1,0,0,0,1],
            [1,1,0,0,1,1,0,0,1,1],
            [0,1,1,0,1,1,0,1,1,0],
            [0,0,1,1,0,0,1,1,0,0],
        ],
    };

    const pattern = shipPatterns[shipId] || shipPatterns.neonFalcon;
    const offsetX = -pattern[0].length * p / 2;
    const offsetY = -pattern.length * p / 2;

    // Get accent color conditions per ship
    const accentColors = {
        neonFalcon: { condition: (x, y) => y < 4 && x >= 4 && x <= 6, color: '#ffffff' },
        glassCannon: { condition: (x, y) => y >= 4 && y <= 6 && x >= 4 && x <= 6, color: '#ffff00' },
        tank: { condition: (x, y) => y >= 4 && y <= 7 && x >= 4 && x <= 7, color: '#00ffff' },
        speedster: { condition: (x, y) => y <= 2 && x === 4, color: '#ffff00' },
        retroClassic: { condition: (x, y) => (x + y) % 3 === 0 && y < 5, color: '#ffffff' },
        phantom: { condition: (x, y) => y >= 3 && y <= 4 && (x === 2 || x === 3 || x === 6 || x === 7), color: '#ffffff' },
        berserker: { condition: (x, y) => y >= 3 && y <= 5 && x >= 4 && x <= 6, color: '#ff0000' },
        synth: { condition: (x, y) => y < 4, color: null }, // Special rainbow effect
    };

    const accent = accentColors[shipId] || accentColors.neonFalcon;

    // Special handling for phantom (transparency) and synth (rainbow)
    if (shipId === 'phantom' && unlocked) {
        ctx.globalAlpha = 0.7;
    }

    pattern.forEach((row, y) => {
        row.forEach((pixel, x) => {
            if (pixel) {
                if (shipId === 'synth' && unlocked && y < 4) {
                    // Rainbow effect for synth ship
                    const hue = (Date.now() * 0.1 + y * 30) % 360;
                    ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
                } else if (accent.condition && accent.condition(x, y) && unlocked) {
                    ctx.fillStyle = accent.color;
                } else {
                    ctx.fillStyle = unlocked ? c : '#444444';
                }
                ctx.fillRect(offsetX + x * p, offsetY + y * p, p - 1, p - 1);
            }
        });
    });

    ctx.globalAlpha = 1;
}

function updateShipSelection() {
    const ships = shipManager.getAllShips();
    const ship = ships[selectedShipIndex];

    // Update cards
    const cards = document.querySelectorAll('.ship-card');
    cards.forEach((card, i) => {
        card.classList.toggle('selected', i === selectedShipIndex);
    });

    // Update info panel
    const nameEl = document.getElementById('selectedShipName');
    const descEl = document.getElementById('selectedShipDesc');
    const statsEl = document.getElementById('selectedShipStats');

    if (nameEl) nameEl.textContent = ship.name;
    if (nameEl) nameEl.style.color = ship.color;
    if (descEl) descEl.textContent = ship.unlocked ? ship.description : getUnlockConditionText(ship.unlockCondition);

    if (statsEl && ship.unlocked) {
        statsEl.innerHTML = `
            <div class="stat-bar">
                <span class="stat-label">SPEED</span>
                <div class="stat-value"><div class="stat-fill" style="width: ${(ship.stats.speed / 10) * 100}%"></div></div>
            </div>
            <div class="stat-bar">
                <span class="stat-label">DAMAGE</span>
                <div class="stat-value"><div class="stat-fill" style="width: ${(ship.stats.damage / 2) * 100}%"></div></div>
            </div>
            <div class="stat-bar">
                <span class="stat-label">LIVES</span>
                <div class="stat-value"><div class="stat-fill" style="width: ${(ship.stats.lives / 5) * 100}%"></div></div>
            </div>
        `;
    } else if (statsEl) {
        statsEl.innerHTML = '<div style="color: #ff6666;">🔒 LOCKED</div>';
    }
}

// ============================================
// GAME MODE SCREEN
// ============================================

let selectedModeIndex = 0;

function setupGameModeScreen() {
    const gameModeBtn = document.getElementById('gameModeBtn');
    const confirmModeBtn = document.getElementById('confirmModeBtn');
    const backFromModeBtn = document.getElementById('backFromModeBtn');

    if (gameModeBtn) {
        gameModeBtn.addEventListener('click', () => {
            resetAttractModeTimeout();
            showScreen('gameModeScreen');
            populateModeGrid();
        });
    }

    if (confirmModeBtn) {
        confirmModeBtn.addEventListener('click', () => {
            const modes = gameModeManager.getAllModes();
            const selectedMode = modes[selectedModeIndex];
            if (selectedMode && (selectedMode.unlocked || !selectedMode.unlockCondition)) {
                gameModeManager.selectMode(selectedMode.id);
                if (soundSystem) soundSystem.playPowerUp(1);
            }
            showScreen('menuScreen');
        });
    }

    if (backFromModeBtn) {
        backFromModeBtn.addEventListener('click', () => {
            showScreen('menuScreen');
        });
    }
}

function populateModeGrid() {
    const modeGrid = document.getElementById('modeGrid');
    if (!modeGrid || !gameModeManager) return;

    const modes = gameModeManager.getAllModes();
    const currentMode = gameModeManager.getCurrentMode();

    modeGrid.innerHTML = '';

    modes.forEach((mode, index) => {
        const isLocked = !mode.unlocked && mode.unlockCondition;
        const card = document.createElement('div');
        card.className = `mode-card ${isLocked ? 'locked' : ''} ${mode.id === currentMode.id ? 'selected' : ''}`;
        card.style.borderColor = isLocked ? '#666' : mode.color;

        card.innerHTML = `
            <div class="mode-icon">${mode.icon}</div>
            <div class="mode-name" style="color: ${isLocked ? '#666' : mode.color}">${mode.name}</div>
            <div class="mode-desc">${isLocked ? getUnlockConditionText(mode.unlockCondition) : mode.description}</div>
            ${!isLocked ? `<div class="mode-multiplier">x${mode.settings.scoreMultiplier} SCORE</div>` : ''}
        `;

        if (!isLocked) {
            card.addEventListener('click', () => {
                selectedModeIndex = index;
                updateModeSelection();
                if (soundSystem) soundSystem.playPowerUp(0);
            });
        }

        modeGrid.appendChild(card);
    });

    updateModeSelection();
}

function updateModeSelection() {
    const modes = gameModeManager.getAllModes();
    const mode = modes[selectedModeIndex];

    // Update cards
    const cards = document.querySelectorAll('.mode-card');
    cards.forEach((card, i) => {
        card.classList.toggle('selected', i === selectedModeIndex);
    });

    // Update info panel
    const nameEl = document.getElementById('selectedModeName');
    const descEl = document.getElementById('selectedModeDesc');

    if (nameEl) {
        nameEl.textContent = mode.name;
        nameEl.style.color = mode.color;
    }
    if (descEl) {
        descEl.textContent = mode.description;
    }
}

// ============================================
// DAILY CHALLENGE SCREEN
// ============================================

function setupDailyChallengeScreen() {
    const dailyChallengeBtn = document.getElementById('dailyChallengeBtn');
    const playDailyChallengeBtn = document.getElementById('playDailyChallengeBtn');
    const backFromChallengeBtn = document.getElementById('backFromChallengeBtn');

    if (dailyChallengeBtn) {
        dailyChallengeBtn.addEventListener('click', () => {
            resetAttractModeTimeout();
            showScreen('dailyChallengeScreen');
            populateDailyChallenge();
        });
    }

    if (playDailyChallengeBtn) {
        playDailyChallengeBtn.addEventListener('click', () => {
            // Set game mode to include daily challenge modifiers
            if (dailyChallengeSystem) {
                gameModeManager.selectMode('classic');
                showScreen('menuScreen');
                // Start game with challenge modifiers
                setTimeout(() => {
                    window.startGame();
                    if (gameState && dailyChallengeSystem.currentChallenge) {
                        dailyChallengeSystem.applyChallenge(gameState);
                    }
                }, 100);
            }
        });
    }

    if (backFromChallengeBtn) {
        backFromChallengeBtn.addEventListener('click', () => {
            showScreen('menuScreen');
        });
    }
}

function populateDailyChallenge() {
    const challengeInfo = document.getElementById('challengeInfo');
    if (!challengeInfo || !dailyChallengeSystem) return;

    const challenge = dailyChallengeSystem.currentChallenge;
    if (!challenge) {
        dailyChallengeSystem.generateDailyChallenge();
    }

    const status = dailyChallengeSystem.getStatus();
    const timeLeft = dailyChallengeSystem.getTimeUntilNextChallenge();

    challengeInfo.innerHTML = `
        <div class="challenge-date">${challenge.dayName} - ${challenge.date}</div>

        <div class="challenge-modifier">
            <div class="modifier-icon">${challenge.primaryModifier.icon}</div>
            <div class="modifier-name">${challenge.primaryModifier.name}</div>
            <div class="modifier-desc">${challenge.primaryModifier.description}</div>
        </div>

        ${challenge.secondaryModifier ? `
            <div class="challenge-modifier" style="border-color: #00ffff;">
                <div class="modifier-icon">${challenge.secondaryModifier.icon}</div>
                <div class="modifier-name">${challenge.secondaryModifier.name}</div>
                <div class="modifier-desc">${challenge.secondaryModifier.description}</div>
            </div>
        ` : ''}

        <div class="challenge-target">TARGET: ${challenge.targetScore.toLocaleString()} POINTS</div>
        <div class="challenge-reward">REWARD: x${challenge.reward.toFixed(1)} SCORE BONUS</div>

        <div class="challenge-status ${status.completed ? 'completed' : 'pending'}">
            ${status.completed ? '✅ CHALLENGE COMPLETE!' : '⏳ Not yet completed'}
            ${status.score > 0 ? `<br>Your best: ${status.score.toLocaleString()}` : ''}
        </div>

        <div style="margin-top: 15px; color: #666; font-size: 0.9em;">
            Next challenge in: ${timeLeft.hours}h ${timeLeft.minutes}m
        </div>
    `;
}

// ============================================
// ACHIEVEMENTS SCREEN
// ============================================

function setupAchievementsScreen() {
    const achievementsBtn = document.getElementById('achievementsBtn');
    const backFromAchievementsBtn = document.getElementById('backFromAchievementsBtn');

    if (achievementsBtn) {
        achievementsBtn.addEventListener('click', () => {
            resetAttractModeTimeout();
            showScreen('achievementsScreen');
            populateAchievements();
        });
    }

    if (backFromAchievementsBtn) {
        backFromAchievementsBtn.addEventListener('click', () => {
            showScreen('menuScreen');
        });
    }
}

function populateAchievements() {
    const achievementsList = document.getElementById('achievementsList');
    const progressEl = document.getElementById('achievementsProgress');
    if (!achievementsList || !achievementSystem) return;

    const progress = achievementSystem.getProgress();
    if (progressEl) {
        progressEl.textContent = `${progress.unlocked}/${progress.total} Unlocked • ${progress.points} Points`;
    }

    const achievements = Object.values(achievementSystem.achievements);

    // Sort: unlocked first, then by points
    achievements.sort((a, b) => {
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        return b.points - a.points;
    });

    achievementsList.innerHTML = '';

    achievements.forEach(achievement => {
        const card = document.createElement('div');
        card.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;

        card.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
            </div>
            <div class="achievement-points">${achievement.points} pts</div>
        `;

        achievementsList.appendChild(card);
    });
}

// ============================================
// SCREEN NAVIGATION HELPER
// ============================================

function showScreen(screenId) {
    // Hide all screens
    const screens = [
        'menuScreen', 'shipSelectScreen', 'gameModeScreen',
        'dailyChallengeScreen', 'achievementsScreen',
        'optionsScreen', 'highScoreListScreen'
    ];

    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // Show requested screen
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.style.display = 'flex';
    }
}

function getUnlockConditionText(condition) {
    if (!condition) return 'Already unlocked';

    switch (condition.type) {
        case 'wave': return `🔒 Reach Wave ${condition.value}`;
        case 'score': return `🔒 Score ${condition.value.toLocaleString()}`;
        case 'games': return `🔒 Play ${condition.value} games`;
        case 'grazes': return `🔒 ${condition.value.toLocaleString()} grazes`;
        case 'pointBlankKills': return `🔒 ${condition.value} point blank kills`;
        case 'bossKills': return `🔒 Defeat ${condition.value} bosses`;
        default: return '🔒 Complete requirements';
    }
}

function updateCreditsDisplay() {
    const creditsEl = document.getElementById('creditsCount');
    if (creditsEl) {
        creditsEl.textContent = credits;
    }

    // Update credit cost display
    updateCreditCostDisplay();
}

// Get the cost of the next credit (escalating price)
function getCreditCost() {
    const baseCost = 1000;
    const multiplier = 1.5;
    // Cost increases: 1000, 1500, 2250, 3375, 5063, etc.
    return Math.floor(baseCost * Math.pow(multiplier, creditsPurchased));
}

// Get available score (current game score if playing, otherwise highscore bank)
function getAvailableScore() {
    if (gameState && gameState.running) {
        return gameState.score || 0;
    }
    // When not in game, use the stored score bank
    return parseInt(localStorage.getItem('geometry3044_scoreBank') || '0');
}

// Deduct score (from current game or score bank)
function deductScore(amount) {
    if (gameState && gameState.running) {
        gameState.score = Math.max(0, (gameState.score || 0) - amount);
        // Update HUD
        if (hud) hud.update(gameState, player);
    } else {
        const currentBank = parseInt(localStorage.getItem('geometry3044_scoreBank') || '0');
        localStorage.setItem('geometry3044_scoreBank', Math.max(0, currentBank - amount).toString());
    }
}

// Update the credit cost display in the UI
function updateCreditCostDisplay() {
    const cost = getCreditCost();
    const available = getAvailableScore();
    const canAfford = available >= cost;

    // Update cost display element (menu)
    const costEl = document.getElementById('creditCostDisplay');
    if (costEl) {
        costEl.textContent = `CREDIT COST: ${cost.toLocaleString()} PTS`;
        costEl.style.color = canAfford ? '#00ff00' : '#ff4444';
    }

    // Update score bank display (menu)
    const bankEl = document.getElementById('scoreBankDisplay');
    if (bankEl) {
        bankEl.textContent = `SCORE BANK: ${available.toLocaleString()}`;
    }

    // Update continue screen displays
    const continueCreditsEl = document.getElementById('continueCreditsDisplay');
    if (continueCreditsEl) {
        continueCreditsEl.textContent = `CREDITS: ${credits}`;
    }

    const continueCostEl = document.getElementById('continueCreditCost');
    if (continueCostEl) {
        continueCostEl.textContent = `NEXT CREDIT: ${cost.toLocaleString()} PTS`;
        continueCostEl.style.color = canAfford ? '#00ff00' : '#ff4444';
    }
}

function addCredit() {
    const cost = getCreditCost();
    const available = getAvailableScore();

    // Check if player can afford the credit
    if (available < cost) {
        console.log('❌ Not enough score! Need:', cost, 'Have:', available);

        // Flash error
        const costEl = document.getElementById('creditCostDisplay');
        if (costEl) {
            costEl.style.color = '#ff0000';
            costEl.textContent = `NOT ENOUGH! NEED ${cost.toLocaleString()} PTS`;
            setTimeout(() => {
                updateCreditCostDisplay();
            }, 1000);
        }

        if (soundSystem) {
            soundSystem.playError?.() || soundSystem.playHit?.();
        }
        return;
    }

    // Deduct the cost
    deductScore(cost);
    creditsPurchased++;
    credits++;
    updateCreditsDisplay();

    if (soundSystem) {
        soundSystem.playCoin();
    }

    console.log('💰 Credit purchased for', cost, 'pts! Total credits:', credits, 'Next cost:', getCreditCost());

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
    currentBackstoryIndex = 0;
    backstoryTimer = 0;
    backstoryCharIndex = 0;

    // Initialize attract mode game
    initGame(true);

    // Create AI controller
    attractModeAI = {
        targetX: canvas.logicalWidth / 2,
        targetY: canvas.logicalHeight - 100,
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

    // Hide PC layout when exiting attract mode
    const pcLayout = document.getElementById('pcLayout');
    if (pcLayout) {
        pcLayout.classList.remove('game-active');
        pcLayout.style.display = 'none';
        pcLayout.style.visibility = 'hidden';
    }

    // Show menu
    const menuScreen = document.getElementById('menuScreen');
    if (menuScreen) menuScreen.style.display = 'flex';

    // Initialize and play menu music
    initAndPlayMenuMusic();

    // Start menu loop
    requestAnimationFrame(menuLoop);

    resetAttractModeTimeout();
}

/**
 * Initialize music manager and play menu music
 * Called on first user interaction
 */
async function initAndPlayMenuMusic() {
    if (!musicManager) return;

    try {
        if (!musicManager.initialized) {
            await musicManager.init();
        }
        musicManager.playMenuMusic();
    } catch (error) {
        console.warn('Failed to initialize/play menu music:', error);
    }
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
        attractModeAI.targetY = Math.min(nearestEnemy.y + 100, canvas.logicalHeight - 100);
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

function requestGameFullscreen() {
    // Use document.documentElement for fullscreen to ensure all game elements are visible
    // (including pcLayout which is a sibling of gameContainer)
    const fullscreenElement = document.documentElement;
    const requestFullscreen = fullscreenElement.requestFullscreen
        || fullscreenElement.webkitRequestFullscreen
        || fullscreenElement.mozRequestFullScreen
        || fullscreenElement.msRequestFullscreen;

    if (!requestFullscreen) {
        return;
    }

    try {
        const fullscreenResult = requestFullscreen.call(fullscreenElement);
        if (fullscreenResult && typeof fullscreenResult.catch === 'function') {
            fullscreenResult.catch((error) => {
                console.warn('⚠️ Fullscreen request was denied:', error);
            });
        }
    } catch (error) {
        console.warn('⚠️ Fullscreen request failed:', error);
    }
}

function handleFullscreenChange() {
    // Small delay to let the browser finish the fullscreen transition
    setTimeout(() => {
        detectLayoutType();
        resizeCanvas();
        console.log('🖥️ Fullscreen changed, canvas resized');
    }, 100);
}

// ============================================
// GAME START
// ============================================

window.startGame = async function() {
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

    requestGameFullscreen();

    // Exit attract mode if active
    if (attractMode) {
        attractMode = false;
        attractModeAI = null;
    }

    // Hide menu, show game UI elements
    const menuScreen = document.getElementById('menuScreen');
    if (menuScreen) menuScreen.style.display = 'none';

    // Setup layout for gameplay
    setupGameplayLayout();

    // Initialize game
    initGame(false);

    // Start game loop
    lastTime = performance.now();
    gameLoopId = requestAnimationFrame(gameLoop);

    // Initialize sound system
    if (soundSystem) {
        soundSystem.init();
    }

    // Play game music
    if (musicManager) {
        if (!musicManager.initialized) {
            await musicManager.init();
        }
        musicManager.playGameMusic();
    }

    // VHS glitch on start
    if (vhsEffect) {
        vhsEffect.triggerGlitch(1.5, 30);
    }

    console.log('🎮 Game started!');
};

function setupGameplayLayout() {
    // Detect layout type
    detectLayoutType();

    const pcLayout = document.getElementById('pcLayout');
    const centerGameArea = document.getElementById('centerGameArea');
    const mobileHudLayer = document.getElementById('mobileHudLayer');
    const gameContainer = document.getElementById('gameContainer');

    if (isPcLayout) {
        // PC Layout: Move canvas to center area
        if (pcLayout) {
            pcLayout.classList.add('game-active');
            pcLayout.style.display = 'flex';
            pcLayout.style.visibility = 'visible';
        }
        if (centerGameArea && canvas) {
            centerGameArea.appendChild(canvas);
        }
        if (mobileHudLayer) mobileHudLayer.style.display = 'none';

        // Disable canvas-based mobile controls on PC
        if (mobileControls) {
            mobileControls.disable();
            mobileControls.setVisible(false);
        }

        console.log('🖥️ PC Layout active - 3-part view');
    } else {
        // Mobile Layout
        if (pcLayout) {
            pcLayout.classList.remove('game-active');
            pcLayout.style.display = 'none';
            pcLayout.style.visibility = 'hidden';
        }
        // Keep canvas in gameContainer for mobile
        if (gameContainer && canvas && canvas.parentNode !== gameContainer) {
            gameContainer.appendChild(canvas);
        }
        if (mobileHudLayer) mobileHudLayer.style.display = 'block';

        // Enable canvas-based mobile controls on touch devices
        if (isMobileDevice && mobileControls) {
            mobileControls.enable();
            mobileControls.setVisible(true);
        }

        console.log('📱 Mobile Layout active');
    }

    // Resize canvas for new layout
    resizeCanvas();
}

function initGame(isAttractMode = false) {
    // Reset death screen state
    deathScreenState = 'none';
    isNewHighScore = false;

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

    // Initialize new gameplay systems
    grazingSystem = new GrazingSystem();
    riskRewardSystem = new RiskRewardSystem();
    slowMotionSystem = new SlowMotionSystem();
    zoneSystem = new ZoneSystem(canvas.logicalWidth, canvas.logicalHeight);
    reactiveMusicSystem = new ReactiveMusicSystem(soundSystem);

    // Initialize reactive music
    if (soundSystem?.initialized) {
        reactiveMusicSystem.init();
    }

    // Reset starfield
    if (starfield) {
        starfield.resize(canvas.logicalWidth, canvas.logicalHeight);
    } else {
        starfield = new Starfield(canvas.logicalWidth, canvas.logicalHeight);
    }

    // Get difficulty settings FIRST
    const difficultySettings = getDifficultySettings(GameSettings.difficulty);
    console.log(`🎮 Starting game with difficulty: ${difficultySettings.name}`);

    // Create player
    player = new Player(canvas.logicalWidth / 2, canvas.logicalHeight - 100);

    // Apply difficulty speed modifier to player
    player.speed = player.speed * difficultySettings.playerSpeed;

    // Apply selected ship stats
    const shipLives = shipManager?.applyShipStats(player) || 3;

    // Initialize power-up manager
    powerUpManager = new PowerUpManager(player);

    // Get current game mode settings
    const modeSettings = gameModeManager?.getCurrentModeSettings() || {};

    // Game state
    gameState = {
        running: true,
        paused: false,
        gameOver: false,
        score: 0,
        lives: modeSettings.lives || difficultySettings.lives || shipLives,
        bombs: modeSettings.bombs || difficultySettings.bombs || 3,
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
        screenShake: { x: 0, y: 0, intensity: 0, duration: 0, enabled: GameSettings.screenShake },
        highScore: parseInt(localStorage.getItem('geometry3044_highScore')) || 0,
        isAttractMode: isAttractMode,

        // New gameplay stats
        grazeCount: 0,
        grazeStreak: 0,
        riskRewardBonus: 0,
        pointBlankKills: 0,
        zoneKills: 0,
        sessionStats: {
            kills: 0,
            grazes: 0,
            pointBlankKills: 0,
            powerUpsCollected: 0,
            bossKills: 0
        },

        // Game mode settings
        gameMode: gameModeManager?.currentMode || 'classic',
        canShoot: modeSettings.canShoot !== false,
        scoreMultiplier: (modeSettings.scoreMultiplier || 1.0) * difficultySettings.scoreMultiplier,

        // Difficulty settings for enemies and wave manager
        difficultySettings: difficultySettings,
        difficultyName: GameSettings.difficulty
    };

    applyGameSettings();

    // Initialize game mode
    if (gameModeManager) {
        gameModeManager.initializeMode(gameState);
    }

    // Start wave 1 with difficulty settings
    waveManager.startWave(1, gameState);

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
    // Apply slow motion if active
    let adjustedDeltaTime = deltaTime;
    if (slowMotionSystem) {
        const timeFactor = slowMotionSystem.update();
        adjustedDeltaTime = slowMotionSystem.adjustDeltaTime(deltaTime);

        // Check for near-death slow motion
        if (player?.isAlive && !player.invulnerable) {
            slowMotionSystem.checkNearDeath(player, enemyBulletPool);
        }
    }

    // Update starfield
    if (starfield) starfield.update(adjustedDeltaTime);

    // Trigger bomb on button press (not hold)
    if (touchButtons.bomb && !bombPressedLastFrame && gameState?.running && !gameState.paused) {
        useBomb();
    }
    bombPressedLastFrame = touchButtons.bomb;

    // Update player
    if (player && player.isAlive) {
        player.update(keys, canvas, bulletPool, gameState, touchJoystick, touchButtons, particleSystem, soundSystem, adjustedDeltaTime);
    }

    // Update bullets
    if (bulletPool) bulletPool.update(canvas, gameState, adjustedDeltaTime);
    if (enemyBulletPool) enemyBulletPool.update(canvas, gameState, adjustedDeltaTime);

    // Update enemies
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const enemy = gameState.enemies[i];
        if (!enemy.active) {
            gameState.enemies.splice(i, 1);
            continue;
        }
        enemy.update(player?.x || canvas.logicalWidth / 2, player?.y || canvas.logicalHeight - 100,
                    canvas, enemyBulletPool, gameState, particleSystem, adjustedDeltaTime);
    }

    // Update boss
    if (gameState.boss) {
        gameState.boss.update(player?.x || canvas.logicalWidth / 2, player?.y || canvas.logicalHeight - 100,
                             enemyBulletPool, gameState, particleSystem, adjustedDeltaTime);

        if (!gameState.boss.active) {
            // Boss defeated!
            gameState.score += gameState.boss.points || 5000;

            if (particleSystem) {
                particleSystem.addBossExplosion(gameState.boss.x, gameState.boss.y);
                // Epic additional effects
                if (particleSystem.megaComboExplosion) {
                    particleSystem.megaComboExplosion(gameState.boss.x, gameState.boss.y, 5);
                }
            }

            if (soundSystem) {
                soundSystem.playExplosion();
            }

            // Show boss defeat phrase
            if (radicalSlang?.showBossDefeatPhrase) {
                radicalSlang.showBossDefeatPhrase(gameState.boss.x, gameState.boss.y);
            }

            // Massive grid impact for boss death
            addGridImpact(gameState.boss.x, gameState.boss.y, 150, 400);

            // Track boss kill
            if (gameState.sessionStats) {
                gameState.sessionStats.bossKills = (gameState.sessionStats.bossKills || 0) + 1;
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

            // Show wave clear phrase
            if (radicalSlang?.showWaveClearPhrase) {
                radicalSlang.showWaveClearPhrase();
            }

            // Update starfield theme
            if (starfield) starfield.updateTheme(gameState.wave);

            // Trigger wave complete effects
            if (slowMotionSystem) {
                slowMotionSystem.trigger('waveComplete');
            }
            if (reactiveMusicSystem) {
                reactiveMusicSystem.triggerWaveComplete();
            }

            // Boss wave?
            if (waveManager.isBossWave() || gameState.wave % 5 === 0) {
                spawnBoss();
            } else {
                waveManager.startWave(gameState.wave, gameState);
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

    // Update new gameplay systems
    if (grazingSystem && player?.isAlive) {
        grazingSystem.update(player, enemyBulletPool, gameState, particleSystem, soundSystem);
    }

    if (riskRewardSystem) {
        riskRewardSystem.update();
    }

    if (zoneSystem) {
        zoneSystem.update(adjustedDeltaTime);
    }

    if (reactiveMusicSystem) {
        reactiveMusicSystem.update(gameState, adjustedDeltaTime);
    }

    // Update game mode
    if (gameModeManager) {
        const modeResult = gameModeManager.update(gameState, adjustedDeltaTime);
        if (modeResult && !modeResult.continue) {
            // Mode ended (time up, victory, etc.)
            if (modeResult.reason === 'victory') {
                // Victory - show celebration
                if (vhsEffect) vhsEffect.triggerGlitch(2, 60);
                if (reactiveMusicSystem) reactiveMusicSystem.triggerWaveComplete();
            }
        }
    }

    // Achievement notification update
    if (achievementNotification) {
        achievementNotificationTimer++;
        if (achievementNotificationTimer > 180) {
            achievementNotification = null;
            achievementNotificationTimer = 0;
            // Check for next notification
            if (achievementSystem) {
                achievementNotification = achievementSystem.getNextNotification();
            }
        }
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
    if (gameState.screenShake.enabled && gameState.screenShake.duration > 0) {
        gameState.screenShake.duration--;
        gameState.screenShake.x = (Math.random() - 0.5) * gameState.screenShake.intensity;
        gameState.screenShake.y = (Math.random() - 0.5) * gameState.screenShake.intensity;
        gameState.screenShake.intensity *= 0.95;
    } else {
        gameState.screenShake.x = 0;
        gameState.screenShake.y = 0;
        if (!gameState.screenShake.enabled) {
            gameState.screenShake.intensity = 0;
            gameState.screenShake.duration = 0;
        }
    }

    // Check player death
    if (player && !player.isAlive && !gameState.gameOver) {
        handlePlayerDeath();
    }

    // Update HUD
    if (hud) {
        hud.update(gameState, deltaTime);
        // Update performance monitor entity counts
        hud.updatePerformanceEntityCounts(bulletPool, enemyBulletPool, particleSystem);
    }

    // Update mobile controls (canvas-based)
    if (mobileControls && mobileControls.enabled) {
        mobileControls.update(deltaTime);

        // Get input from mobile controls
        const movement = mobileControls.getMovement();
        if (movement.x !== 0 || movement.y !== 0) {
            touchJoystick.active = true;
            touchJoystick.currentX = touchJoystick.startX + movement.x * 50;
            touchJoystick.currentY = touchJoystick.startY + movement.y * 50;
        }

        touchButtons.fire = mobileControls.isFiring();
        if (mobileControls.isBombing() && !bombPressedLastFrame) {
            touchButtons.bomb = true;
        }
    }

    // Update PC HUD elements
    if (isPcLayout) {
        updatePcHud();
    } else {
        updateMobileHud();
    }

    // Extra life at 100000 points
    const extraLifeThreshold = 100000;
    const currentExtraLives = Math.floor(gameState.score / extraLifeThreshold);
    const previousExtraLives = Math.floor((gameState.score - 100) / extraLifeThreshold);

    if (currentExtraLives > previousExtraLives && gameState.score > 0) {
        gameState.lives++;
        if (particleSystem) {
            particleSystem.addPowerUpCollect(canvas.logicalWidth / 2, canvas.logicalHeight / 2, '#ff6666');
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
    ctx.fillRect(0, 0, canvas.logicalWidth, canvas.logicalHeight);

    ctx.save();

    // Apply screen shake
    if (gameState.screenShake.enabled) {
        ctx.translate(gameState.screenShake.x, gameState.screenShake.y);
    }

    // Background
    drawBackground(ctx, canvas, gameState.wave);

    // Starfield
    if (starfield) starfield.draw(ctx);

    // Waving Grid (Geometry Wars-style with ripple effects)
    drawWavingGrid(ctx, canvas, gameState.wave);

    // Zone system (behind everything)
    if (zoneSystem) zoneSystem.draw(ctx);

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

    // Draw grazing effects
    if (grazingSystem && player) {
        grazingSystem.draw(ctx, player);
    }

    // Draw risk/reward effects
    if (riskRewardSystem) {
        riskRewardSystem.draw(ctx);
    }

    // Radical slang
    if (radicalSlang) radicalSlang.draw(ctx, canvas.logicalWidth, canvas.logicalHeight);

    // Wave text
    if (waveManager) waveManager.drawWaveText(ctx, canvas);

    ctx.restore();

    // HUD (not affected by screen shake)
    if (hud) hud.draw(ctx, gameState);

    // Power-up manager UI
    if (powerUpManager) powerUpManager.drawUI(ctx);

    // Slow motion overlay
    if (slowMotionSystem) {
        slowMotionSystem.draw(ctx, canvas);
    }

    // Achievement notification
    if (achievementNotification && achievementSystem) {
        const progress = Math.min(1, achievementNotificationTimer / 30);
        achievementSystem.drawNotification(ctx, canvas, achievementNotification, progress);
    }

    // Game mode HUD info
    if (gameModeManager) {
        const modeInfo = gameModeManager.getHUDInfo();
        if (modeInfo) {
            drawModeHUD(ctx, modeInfo);
        }
    }

    // Draw mobile controls (on top of everything for visibility)
    if (mobileControls && mobileControls.enabled && mobileControls.visible) {
        mobileControls.draw(ctx);
    }
}

// Draw game mode specific HUD
function drawModeHUD(ctx, modeInfo) {
    ctx.save();
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffff00';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffff00';

    const x = canvas.logicalWidth - 20;
    const y = 60;

    if (modeInfo.showTimer) {
        const minutes = Math.floor(modeInfo.timeRemaining / 60);
        const seconds = modeInfo.timeRemaining % 60;
        ctx.fillText(`${modeInfo.label}: ${minutes}:${seconds.toString().padStart(2, '0')}`, x, y);
    } else if (modeInfo.showBossProgress) {
        ctx.fillText(`${modeInfo.label}: ${modeInfo.current}/${modeInfo.total}`, x, y);
    } else if (modeInfo.showSurvivalTime) {
        ctx.fillText(`${modeInfo.label}: ${modeInfo.survivalTime}s`, x, y);
    } else if (modeInfo.showMultiplier) {
        ctx.fillStyle = '#ffd700';
        ctx.fillText(modeInfo.label, x, y);
    }

    ctx.restore();
}

// ============================================
// PC/MOBILE HUD UPDATES
// ============================================

function updatePcHud() {
    if (!gameState) return;

    // Left panel elements
    const livesEl = document.getElementById('pcLivesDisplay');
    const bombsEl = document.getElementById('pcBombsDisplay');
    const weaponEl = document.getElementById('pcWeaponDisplay');
    const comboEl = document.getElementById('pcComboDisplay');

    // Right panel elements
    const scoreEl = document.getElementById('pcScoreDisplay');
    const highScoreEl = document.getElementById('pcHighScoreDisplay');
    const waveEl = document.getElementById('pcWaveDisplay');
    const multiplierEl = document.getElementById('pcMultiplierDisplay');
    const bossSection = document.getElementById('pcBossSection');
    const bossHealthFill = document.getElementById('pcBossHealthFill');

    // Update left panel
    if (livesEl) livesEl.textContent = gameState.lives || 0;
    if (bombsEl) bombsEl.textContent = gameState.bombs || 0;
    if (weaponEl) {
        const weaponName = player?.currentWeapon?.name || 'STANDARD';
        weaponEl.textContent = weaponName.toUpperCase();
    }
    if (comboEl) {
        const combo = gameState.combo || 0;
        comboEl.textContent = combo > 1 ? `x${combo}` : 'x1';
    }

    // Update right panel
    if (scoreEl) scoreEl.textContent = Math.floor(gameState.score || 0).toLocaleString();
    if (highScoreEl) highScoreEl.textContent = Math.floor(gameState.highScore || 0).toLocaleString();
    if (waveEl) waveEl.textContent = gameState.wave || 1;

    // Calculate multiplier from combo
    const multiplier = 1 + (gameState.combo || 0) * 0.1;
    if (multiplierEl) multiplierEl.textContent = `x${multiplier.toFixed(1)}`;

    // Boss health bar
    if (bossSection && bossHealthFill) {
        if (gameState.boss && gameState.boss.active) {
            bossSection.classList.add('visible');
            const healthPercent = (gameState.boss.health / gameState.boss.maxHealth) * 100;
            bossHealthFill.style.width = `${healthPercent}%`;
        } else {
            bossSection.classList.remove('visible');
        }
    }

    // Update power-up slots
    updatePcPowerUpSlots();
}

function updatePcPowerUpSlots() {
    const slotsContainer = document.getElementById('pcPowerUpSlots');
    if (!slotsContainer || !powerUpManager) return;

    const activePowerUps = powerUpManager.getActivePowerUps ? powerUpManager.getActivePowerUps() : [];

    // Create slots if needed
    if (slotsContainer.children.length === 0) {
        for (let i = 0; i < 3; i++) {
            const slot = document.createElement('div');
            slot.className = 'power-up-slot';
            slot.textContent = '-';
            slotsContainer.appendChild(slot);
        }
    }

    // Update slots
    for (let i = 0; i < 3; i++) {
        const slot = slotsContainer.children[i];
        if (slot) {
            if (activePowerUps[i]) {
                slot.className = 'power-up-slot active';
                slot.textContent = activePowerUps[i].name || activePowerUps[i].type || 'PWR';
            } else {
                slot.className = 'power-up-slot';
                slot.textContent = '-';
            }
        }
    }
}

function updateMobileHud() {
    if (!gameState) return;

    const scoreEl = document.getElementById('mobileScoreDisplay');
    const livesEl = document.getElementById('mobileLivesDisplay');
    const waveEl = document.getElementById('mobileWaveDisplay');

    if (scoreEl) scoreEl.textContent = Math.floor(gameState.score || 0).toLocaleString();
    if (livesEl) livesEl.textContent = gameState.lives || 0;
    if (waveEl) waveEl.textContent = gameState.wave || 1;
}

// ============================================
// MENU LOOP
// ============================================

function menuLoop() {
    if (gameState?.running) return;
    if (attractMode) return;

    // Clear
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.logicalWidth, canvas.logicalHeight);

    // Draw starfield
    if (starfield) {
        starfield.update(1);
        starfield.draw(ctx);
    }

    // Draw waving grid (subtle)
    drawWavingGrid(ctx, canvas, 1);

    // VHS effect
    if (vhsEffect) vhsEffect.apply(ctx, canvas);

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

    // Show boss phrase
    if (radicalSlang?.showBossPhrase) {
        radicalSlang.showBossPhrase();
    }

    // Add massive grid impact for boss spawn
    addGridImpact(canvas.logicalWidth / 2, 100, 80, 250);

    // Trigger reactive music boss effect
    if (reactiveMusicSystem) {
        reactiveMusicSystem.triggerBossMusic();
    }

    // Trigger slow motion for boss appearance
    if (slowMotionSystem) {
        slowMotionSystem.trigger('bossKill');
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
    gameState.screenShake.intensity = 25;
    gameState.screenShake.duration = 60;

    // VHS glitch
    if (vhsEffect) vhsEffect.triggerGlitch(2.5, 45);

    // MASSIVE grid impact for bomb
    if (player) {
        addGridImpact(player.x, player.y, 200, 500);
    }

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

    // Epic radial explosion from player
    if (player && particleSystem) {
        // Use mega combo explosion for bomb
        if (particleSystem.megaComboExplosion) {
            particleSystem.megaComboExplosion(player.x, player.y, 5);
        }

        // Add synthwave explosion
        if (particleSystem.synthwaveExplosion) {
            particleSystem.synthwaveExplosion(player.x, player.y);
        }

        // Multiple shockwaves
        if (particleSystem.addShockwave) {
            particleSystem.addShockwave(player.x, player.y, '#ffff00', 200);
            setTimeout(() => particleSystem.addShockwave(player.x, player.y, '#ff00ff', 250), 50);
            setTimeout(() => particleSystem.addShockwave(player.x, player.y, '#00ffff', 300), 100);
        }

        // Traditional radial particles as well
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 16) {
            particleSystem.addParticle({
                x: player.x,
                y: player.y,
                vx: Math.cos(angle) * 15,
                vy: Math.sin(angle) * 15,
                life: 40,
                size: 10,
                color: '#ffff00',
                type: 'star'
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
    ctx.fillRect(0, 0, canvas.logicalWidth, canvas.logicalHeight);

    // Pause text
    ctx.save();
    ctx.font = 'bold 64px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00ffff';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#00ffff';
    ctx.fillText('PAUSED', canvas.logicalWidth / 2, canvas.logicalHeight / 2 - 20);

    ctx.font = '24px "Courier New", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillText('Press P or ESC to continue', canvas.logicalWidth / 2, canvas.logicalHeight / 2 + 40);
    ctx.restore();
}

// ============================================
// PLAYER DEATH & GAME OVER
// ============================================

// Death screen state
let deathScreenState = 'none'; // 'none', 'highscore_entry', 'death_choice'
let playerInitials = ['A', 'A', 'A'];
let currentInitialIndex = 0;
let isNewHighScore = false;

function handlePlayerDeath() {
    gameState.lives--;

    // Reset combo
    gameState.combo = 0;
    if (radicalSlang) radicalSlang.resetCombo();

    // Show danger phrase
    if (radicalSlang?.showDangerPhrase && player) {
        radicalSlang.showDangerPhrase(player.x, player.y);
    }

    // Epic death explosion with ship-specific particles
    if (particleSystem && player) {
        // Use ship-specific death explosion if available
        if (particleSystem.shipDeathExplosion) {
            const shipColor = player.shipColor || '#00ff00';
            const shipId = player.shipId || 'neonFalcon';
            particleSystem.shipDeathExplosion(player.x, player.y, shipId, shipColor);
        } else if (particleSystem.epicDeathExplosion) {
            particleSystem.epicDeathExplosion(player.x, player.y, player.shipColor || '#00ff00');
        } else {
            particleSystem.addExplosion(player.x, player.y, player.shipColor || '#00ff00', 30);
        }
    }

    // Massive grid impact for player death
    if (player) {
        addGridImpact(player.x, player.y, 100, 300);
    }

    // Sound
    if (soundSystem) soundSystem.playExplosion();

    // Screen shake
    gameState.screenShake.intensity = 20;
    gameState.screenShake.duration = 45;

    // VHS glitch
    if (vhsEffect) vhsEffect.triggerGlitch(2.5, 60);

    if (gameState.lives <= 0) {
        // Game over
        gameState.gameOver = true;

        if (soundSystem) {
            soundSystem.stopMusic();
            soundSystem.playGameOver();
        }

        // Check if this is a new high score (top 10)
        isNewHighScore = menuManager?.isHighScore(gameState.score) || false;

        // Update high score if needed
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            localStorage.setItem('geometry3044_highScore', gameState.highScore);
        }

        // Add score to score bank (for purchasing credits)
        const currentBank = parseInt(localStorage.getItem('geometry3044_scoreBank') || '0');
        const newBank = currentBank + gameState.score;
        localStorage.setItem('geometry3044_scoreBank', newBank.toString());
        console.log('💰 Score added to bank:', gameState.score, '| Total bank:', newBank);

        // Update achievements and stats
        if (achievementSystem && grazingSystem && riskRewardSystem) {
            const sessionStats = {
                kills: gameState.sessionStats?.kills || 0,
                score: gameState.score,
                wave: gameState.wave,
                maxCombo: gameState.maxCombo,
                grazes: grazingSystem.getStats().sessionGrazes,
                maxGrazeStreak: grazingSystem.getStats().maxStreak,
                pointBlankKills: riskRewardSystem.getStats().pointBlankKills,
                powerUpsCollected: gameState.sessionStats?.powerUpsCollected || 0,
                bossKills: gameState.sessionStats?.bossKills || 0,
                gameMode: gameState.gameMode
            };

            const newAchievements = achievementSystem.updateStats(sessionStats);
            if (newAchievements.length > 0) {
                achievementNotification = newAchievements[0];
                achievementNotificationTimer = 0;
            }

            // Check for new ship/mode unlocks
            if (shipManager) {
                shipManager.checkUnlocks(achievementSystem.stats);
            }
            if (gameModeManager) {
                gameModeManager.checkUnlocks(achievementSystem.stats);
            }
        }

        // Set death screen state
        if (isNewHighScore) {
            deathScreenState = 'highscore_entry';
            playerInitials = ['A', 'A', 'A'];
            currentInitialIndex = 0;
        } else {
            deathScreenState = 'death_choice';
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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.logicalWidth, canvas.logicalHeight);

    ctx.save();
    ctx.textAlign = 'center';

    if (deathScreenState === 'highscore_entry') {
        drawHighScoreEntryScreen();
    } else {
        drawDeathChoiceScreen();
    }

    ctx.restore();
}

function drawHighScoreEntryScreen() {
    const centerX = canvas.logicalWidth / 2;
    const centerY = canvas.logicalHeight / 2;

    // Title
    ctx.font = 'bold 48px "Courier New", monospace';
    ctx.fillStyle = '#ffd700';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ffd700';
    ctx.fillText('NEW HIGH SCORE!', centerX, centerY - 150);

    // Score display
    ctx.font = 'bold 36px "Courier New", monospace';
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.fillText(gameState.score.toLocaleString(), centerX, centerY - 90);

    // Enter initials prompt
    ctx.font = '24px "Courier New", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillText('ENTER YOUR INITIALS', centerX, centerY - 40);

    // Draw initials boxes
    const boxWidth = 60;
    const boxGap = 20;
    const totalWidth = boxWidth * 3 + boxGap * 2;
    const startX = centerX - totalWidth / 2;

    for (let i = 0; i < 3; i++) {
        const x = startX + i * (boxWidth + boxGap);
        const isSelected = i === currentInitialIndex;

        // Box background
        ctx.fillStyle = isSelected ? 'rgba(0, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, centerY, boxWidth, boxWidth);

        // Box border
        ctx.strokeStyle = isSelected ? '#00ffff' : '#666666';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.strokeRect(x, centerY, boxWidth, boxWidth);

        // Letter
        ctx.font = 'bold 40px "Courier New", monospace';
        ctx.fillStyle = isSelected ? '#00ffff' : '#ffffff';
        ctx.shadowBlur = isSelected ? 15 : 0;
        ctx.shadowColor = '#00ffff';
        ctx.fillText(playerInitials[i], x + boxWidth / 2, centerY + boxWidth / 2 + 14);
    }

    // Up/Down arrows for selected letter
    const selectedX = startX + currentInitialIndex * (boxWidth + boxGap) + boxWidth / 2;
    const blink = Math.sin(Date.now() * 0.01) > 0;
    if (blink) {
        ctx.font = '24px "Courier New", monospace';
        ctx.fillStyle = '#ffff00';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffff00';
        ctx.fillText('▲', selectedX, centerY - 10);
        ctx.fillText('▼', selectedX, centerY + boxWidth + 30);
    }

    // Instructions
    ctx.font = '18px "Courier New", monospace';
    ctx.fillStyle = '#888888';
    ctx.shadowBlur = 0;
    ctx.fillText('UP/DOWN: Change Letter   LEFT/RIGHT: Select   ENTER: Confirm', centerX, centerY + 130);
    ctx.fillText('Press ESC to skip', centerX, centerY + 160);

    // Handle input
    handleHighScoreEntryInput();
}

function handleHighScoreEntryInput() {
    // Change letter up
    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        keys['ArrowUp'] = false;
        keys['w'] = false;
        keys['W'] = false;
        const current = playerInitials[currentInitialIndex].charCodeAt(0);
        playerInitials[currentInitialIndex] = String.fromCharCode(current >= 90 ? 65 : current + 1); // A-Z wrap
        if (soundSystem) soundSystem.playPowerUp(0);
    }

    // Change letter down
    if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        keys['ArrowDown'] = false;
        keys['s'] = false;
        keys['S'] = false;
        const current = playerInitials[currentInitialIndex].charCodeAt(0);
        playerInitials[currentInitialIndex] = String.fromCharCode(current <= 65 ? 90 : current - 1); // A-Z wrap
        if (soundSystem) soundSystem.playPowerUp(0);
    }

    // Move selection left
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        keys['ArrowLeft'] = false;
        keys['a'] = false;
        keys['A'] = false;
        currentInitialIndex = (currentInitialIndex - 1 + 3) % 3;
        if (soundSystem) soundSystem.playPowerUp(0);
    }

    // Move selection right
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        keys['ArrowRight'] = false;
        keys['d'] = false;
        keys['D'] = false;
        currentInitialIndex = (currentInitialIndex + 1) % 3;
        if (soundSystem) soundSystem.playPowerUp(0);
    }

    // Confirm/Submit
    if (keys['Enter']) {
        keys['Enter'] = false;
        const initials = playerInitials.join('');
        if (menuManager) {
            menuManager.addHighScore(initials, gameState.score);
        }
        if (soundSystem) soundSystem.playPowerUp(2);
        deathScreenState = 'death_choice';
    }

    // Skip (ESC)
    if (keys['Escape']) {
        keys['Escape'] = false;
        deathScreenState = 'death_choice';
    }
}

function drawDeathChoiceScreen() {
    const centerX = canvas.logicalWidth / 2;
    const centerY = canvas.logicalHeight / 2;

    // Game Over title
    ctx.font = 'bold 64px "Courier New", monospace';
    ctx.fillStyle = '#ff0000';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ff0000';
    ctx.fillText('GAME OVER', centerX, centerY - 120);

    // Score display
    ctx.font = 'bold 32px "Courier New", monospace';
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    ctx.fillText(`SCORE: ${gameState.score.toLocaleString()}`, centerX, centerY - 60);

    // Stats
    ctx.font = '20px "Courier New", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillText(`Wave Reached: ${gameState.wave}   Max Combo: ${gameState.maxCombo}x`, centerX, centerY - 20);

    // Options box
    const boxY = centerY + 20;
    const boxHeight = 160;
    ctx.fillStyle = 'rgba(0, 0, 50, 0.7)';
    ctx.fillRect(centerX - 250, boxY, 500, boxHeight);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - 250, boxY, 500, boxHeight);

    // Option 1: Continue with credits
    const option1Y = boxY + 50;
    const creditCost = getCreditCost();
    const canAffordCredit = gameState.score >= creditCost;

    if (credits > 0) {
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.fillStyle = '#00ff00';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ff00';
        ctx.fillText(`[1] CONTINUE (${credits} CREDITS)`, centerX, option1Y);

        ctx.font = '16px "Courier New", monospace';
        ctx.fillStyle = '#888888';
        ctx.shadowBlur = 0;
        ctx.fillText('Use 1 credit to continue playing', centerX, option1Y + 25);
    } else {
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.fillStyle = '#666666';
        ctx.shadowBlur = 0;
        ctx.fillText('[1] NO CREDITS', centerX, option1Y);

        // Show credit purchase option
        ctx.font = '16px "Courier New", monospace';
        ctx.fillStyle = canAffordCredit ? '#00ff00' : '#ff6666';
        ctx.fillText(`Press C to buy credit (${creditCost.toLocaleString()} pts)`, centerX, option1Y + 25);
    }

    // Option 2: Return to menu
    const option2Y = boxY + 120;
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff00ff';
    ctx.fillText('[2] RETURN TO MENU', centerX, option2Y);

    // Footer hint
    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = '#666666';
    ctx.shadowBlur = 0;
    ctx.fillText('Press 1, 2, or SPACE/ENTER', centerX, centerY + 210);

    // Handle input
    handleDeathChoiceInput();
}

function handleDeathChoiceInput() {
    // Option 1: Continue (if credits available)
    if (keys['1'] || keys['Digit1'] || keys['Numpad1']) {
        keys['1'] = false;
        keys['Digit1'] = false;
        keys['Numpad1'] = false;

        if (credits > 0) {
            continueGame();
        }
    }

    // Option 2: Return to menu
    if (keys['2'] || keys['Digit2'] || keys['Numpad2'] || keys['Escape']) {
        keys['2'] = false;
        keys['Digit2'] = false;
        keys['Numpad2'] = false;
        keys['Escape'] = false;

        deathScreenState = 'none';
        returnToMenu();
    }

    // Space/Enter - Continue if credits, else return to menu
    if (keys[' '] || keys['Space'] || keys['Enter']) {
        keys[' '] = false;
        keys['Space'] = false;
        keys['Enter'] = false;

        if (credits > 0) {
            continueGame();
        } else {
            deathScreenState = 'none';
            returnToMenu();
        }
    }

    // C key - Insert coin
    if (keys['c'] || keys['C']) {
        keys['c'] = false;
        keys['C'] = false;
        addCredit();
    }
}

function continueGame() {
    credits--;
    updateCreditsDisplay();

    gameState.lives = 3;
    gameState.gameOver = false;
    deathScreenState = 'none';

    if (player) {
        player.respawn(canvas);
    }

    if (enemyBulletPool) enemyBulletPool.clear();

    // Resume game music
    if (musicManager) {
        musicManager.playGameMusic();
    }

    console.log('🎮 Game continued with credits');
}

function returnToMenu() {
    // Reset death screen state
    deathScreenState = 'none';
    isNewHighScore = false;

    // Stop game
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }

    gameState = null;
    player = null;

    // Reset layout - move canvas back to gameContainer
    resetMenuLayout();

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

    // Update credits and score bank display
    updateCreditsDisplay();

    // Play menu music
    if (musicManager) {
        musicManager.playMenuMusic();
    }

    // Start menu loop
    requestAnimationFrame(menuLoop);

    resetAttractModeTimeout();
}

function resetMenuLayout() {
    const pcLayout = document.getElementById('pcLayout');
    const mobileHudLayer = document.getElementById('mobileHudLayer');
    const touchControlsLayer = document.getElementById('touchControlsLayer');
    const gameContainer = document.getElementById('gameContainer');

    // Hide PC layout and HUD layers
    if (pcLayout) {
        pcLayout.classList.remove('game-active');
        pcLayout.style.display = 'none';
        pcLayout.style.visibility = 'hidden';
    }
    if (mobileHudLayer) mobileHudLayer.style.display = 'none';
    if (touchControlsLayer) touchControlsLayer.style.display = 'none';

    // Move canvas back to gameContainer
    if (gameContainer && canvas && canvas.parentNode !== gameContainer) {
        gameContainer.appendChild(canvas);
    }

    // Disable mobile controls
    if (mobileControls) {
        mobileControls.disable();
        mobileControls.setVisible(false);
    }

    // Resize canvas for menu
    resizeCanvas();
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
    ctx.fillText('★ DEMO MODE ★', canvas.logicalWidth / 2, 40);

    // Backstory with typewriter effect
    const backstoryY = 80;
    ctx.font = 'bold 16px "Courier New", monospace';

    // Update backstory animation
    backstoryTimer++;
    if (backstoryTimer % 3 === 0) { // Typewriter speed
        backstoryCharIndex++;
    }

    const currentText = backstoryTexts[currentBackstoryIndex];
    const displayText = currentText.substring(0, backstoryCharIndex);

    // Move to next line when current is complete
    if (backstoryCharIndex > currentText.length + 30) { // +30 for pause
        backstoryCharIndex = 0;
        currentBackstoryIndex = (currentBackstoryIndex + 1) % backstoryTexts.length;
    }

    // Draw backstory text with green terminal effect
    ctx.fillStyle = '#00ff00';
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 10;
    ctx.fillText(displayText, canvas.logicalWidth / 2, backstoryY);

    // Blinking cursor
    if (backstoryCharIndex <= currentText.length && Math.sin(Date.now() * 0.01) > 0) {
        const textWidth = ctx.measureText(displayText).width;
        ctx.fillText('█', canvas.logicalWidth / 2 + textWidth / 2 + 5, backstoryY);
    }

    // Starover Command logo/text
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillStyle = '#ffaa00';
    ctx.shadowColor = '#ffaa00';
    ctx.fillText('▲ STAROVER COMMAND TRANSMISSION ▲', canvas.logicalWidth / 2, backstoryY + 25);

    // Promo text
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.fillText(promoTexts[currentPromoIndex], canvas.logicalWidth / 2, canvas.logicalHeight - 60);

    // Press any key
    const blink = Math.sin(Date.now() * 0.005) > 0;
    if (blink) {
        ctx.font = '18px "Courier New", monospace';
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.fillText('PRESS ANY KEY TO START', canvas.logicalWidth / 2, canvas.logicalHeight - 25);
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
