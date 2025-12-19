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
import { MenuManager, GameSettings } from './ui/MenuManager.js';

// New gameplay systems
import { GrazingSystem } from './systems/GrazingSystem.js';
import { RiskRewardSystem } from './systems/RiskRewardSystem.js';
import { SlowMotionSystem } from './systems/SlowMotionSystem.js';
import { ZoneSystem } from './systems/ZoneSystem.js';
import { ReactiveMusicSystem } from './systems/ReactiveMusicSystem.js';
import { ShipManager } from './systems/ShipManager.js';
import { GameModeManager } from './systems/GameModeManager.js';
import { DailyChallengeSystem } from './systems/DailyChallengeSystem.js';
import { AchievementSystem } from './systems/AchievementSystem.js';

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
let menuManager = null;

// === NEW GAMEPLAY SYSTEMS ===
let grazingSystem = null;
let riskRewardSystem = null;
let slowMotionSystem = null;
let zoneSystem = null;
let reactiveMusicSystem = null;
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

    // Initialize menu manager for options and high scores
    menuManager = new MenuManager();
    menuManager.init();

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

    // Initialize new gameplay systems
    shipManager = new ShipManager();
    gameModeManager = new GameModeManager();
    dailyChallengeSystem = new DailyChallengeSystem();
    achievementSystem = new AchievementSystem();

    // Update config
    updateConfig(canvas.width, canvas.height);

    // Setup menu
    setupMenu();

    console.log('🎮 New systems initialized: Grazing, Risk/Reward, SlowMo, Zones, Ships, Modes, Achievements');

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

        card.innerHTML = `
            <div class="ship-preview" style="border-color: ${ship.color}">
                <svg width="56" height="56" viewBox="0 0 56 56">
                    <polygon points="28,5 8,50 28,40 48,50"
                             fill="${ship.unlocked ? ship.color + '44' : '#33333344'}"
                             stroke="${ship.unlocked ? ship.color : '#666'}"
                             stroke-width="2"/>
                </svg>
            </div>
            <div class="ship-name" style="color: ${ship.unlocked ? ship.color : '#666'}">${ship.name}</div>
        `;

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

    // Initialize new gameplay systems
    grazingSystem = new GrazingSystem();
    riskRewardSystem = new RiskRewardSystem();
    slowMotionSystem = new SlowMotionSystem();
    zoneSystem = new ZoneSystem(canvas.width, canvas.height);
    reactiveMusicSystem = new ReactiveMusicSystem(soundSystem);

    // Initialize reactive music
    if (soundSystem?.initialized) {
        reactiveMusicSystem.init();
    }

    // Reset starfield
    if (starfield) {
        starfield.resize(canvas.width, canvas.height);
    } else {
        starfield = new Starfield(canvas.width, canvas.height);
    }

    // Create player
    player = new Player(canvas.width / 2, canvas.height - 100);

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
        lives: modeSettings.lives || shipLives,
        bombs: modeSettings.bombs || 3,
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
        scoreMultiplier: modeSettings.scoreMultiplier || 1.0
    };

    // Initialize game mode
    if (gameModeManager) {
        gameModeManager.initializeMode(gameState);
    }

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
}

// Draw game mode specific HUD
function drawModeHUD(ctx, modeInfo) {
    ctx.save();
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffff00';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffff00';

    const x = canvas.width - 20;
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
