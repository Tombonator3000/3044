/**
 * Geometry 3044 - Global Variables Module
 * Shared state that needs to be accessible across modules
 */

import { CONFIG, legacyConfig } from './config.js';

// Canvas and rendering context
export let canvas = null;
export let ctx = null;

// Game state (will be initialized by GameState module)
export let gameState = null;

// Input state
export let keys = {};

// Touch controls state
export let touchJoystick = {
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0
};

export let touchButtons = {
    fire: false,
    bomb: false
};

// Cached DOM element references for performance
export const cachedUI = {
    score: null,
    wave: null,
    lives: null,
    bombs: null,
    highScore: null,
    menuScreen: null,
    gameUI: null,
    gameOverScreen: null,
    continueScreen: null,
    insertCoinText: null,
    creditsCount: null,
    highScoreEntryScreen: null,
    highScoreListScreen: null,
    startGameBtn: null
};

// Game systems (will be initialized by respective modules)
export let particleSystem = null;
export let bulletPool = null;
export let enemyBulletPool = null;
export let waveManager = null;
export let soundSystem = null;
export let starfield = null;
export let ufoManager = null;
export let formationManager = null;
export let bonusRound = null;
export let vhsGlitch = null;
export let weaponManager = null;

// Game control state
export let credits = CONFIG.game.credits;
export let continueTimer = 0;
export let maxContinueTime = CONFIG.game.continueTime;
export let showingContinueScreen = false;

// Music
export let menuMusic = null;
export let gameMusic = null;
export let musicEnabled = false;
export let musicMuted = false;

// Attract mode
export let attractMode = false;
export let attractModeTimer = null;
export let attractModeAI = null;

// High scores
export let newHighScoreIndex = -1;
export let highScoreFromAttractMode = false;

// Animation frame ID
export let gameLoopId = null;
export let bossDeathTimeoutId = null;

// Legacy config reference (for backwards compatibility during migration)
export const config = legacyConfig;

// Setters for mutable globals (needed because ES6 exports are read-only bindings)
export function setCanvas(c) { canvas = c; }
export function setCtx(c) { ctx = c; }
export function setGameState(gs) { gameState = gs; }
export function setKeys(k) { keys = k; }
export function setParticleSystem(ps) { particleSystem = ps; }
export function setBulletPool(bp) { bulletPool = bp; }
export function setEnemyBulletPool(ebp) { enemyBulletPool = ebp; }
export function setWaveManager(wm) { waveManager = wm; }
export function setSoundSystem(ss) { soundSystem = ss; }
export function setStarfield(sf) { starfield = sf; }
export function setUfoManager(um) { ufoManager = um; }
export function setFormationManager(fm) { formationManager = fm; }
export function setBonusRound(br) { bonusRound = br; }
export function setVhsGlitch(vg) { vhsGlitch = vg; }
export function setWeaponManager(wm) { weaponManager = wm; }
export function setCredits(c) { credits = c; }
export function setContinueTimer(t) { continueTimer = t; }
export function setShowingContinueScreen(s) { showingContinueScreen = s; }
export function setMenuMusic(m) { menuMusic = m; }
export function setGameMusic(m) { gameMusic = m; }
export function setMusicEnabled(e) { musicEnabled = e; }
export function setMusicMuted(m) { musicMuted = m; }
export function setAttractMode(a) { attractMode = a; }
export function setAttractModeTimer(t) { attractModeTimer = t; }
export function setAttractModeAI(ai) { attractModeAI = ai; }
export function setNewHighScoreIndex(i) { newHighScoreIndex = i; }
export function setHighScoreFromAttractMode(h) { highScoreFromAttractMode = h; }
export function setGameLoopId(id) { gameLoopId = id; }
export function setBossDeathTimeoutId(id) { bossDeathTimeoutId = id; }

// Initialize cached UI references
export function initCachedUI() {
    cachedUI.score = document.getElementById('scoreDisplay');
    cachedUI.wave = document.getElementById('waveDisplay');
    cachedUI.lives = document.getElementById('livesDisplay');
    cachedUI.bombs = document.getElementById('bombsDisplay');
    cachedUI.highScore = document.getElementById('highScoreDisplay');
    cachedUI.menuScreen = document.getElementById('menuScreen');
    cachedUI.gameUI = document.getElementById('gameUI');
    cachedUI.gameOverScreen = document.getElementById('gameOverScreen');
    cachedUI.continueScreen = document.getElementById('continueScreen');
    cachedUI.insertCoinText = document.getElementById('insertCoinText');
    cachedUI.creditsCount = document.getElementById('creditsCount');
    cachedUI.highScoreEntryScreen = document.getElementById('highScoreEntryScreen');
    cachedUI.highScoreListScreen = document.getElementById('highScoreListScreen');
    cachedUI.startGameBtn = document.getElementById('startGameBtn');
}
