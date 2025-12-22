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
    gameHighScore: null,
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
export let weaponManager = null;

// Game control state
export let credits = CONFIG.game.credits;
export let continueTimer = 0;
export let maxContinueTime = CONFIG.game.continueTime;
export let showingContinueScreen = false;
export let gameStarting = false; // Guard against multiple startGame calls

// Music
export let menuMusic = null;
export let gameMusic = null;
export let musicEnabled = false;
export let musicMuted = false;

// Attract mode
export let attractMode = false;

// Animation frame ID
export let gameLoopId = null;

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
export function setWeaponManager(wm) { weaponManager = wm; }
export function setCredits(c) { credits = c; }
export function setContinueTimer(t) { continueTimer = t; }
export function setShowingContinueScreen(s) { showingContinueScreen = s; }
export function setMenuMusic(m) { menuMusic = m; }
export function setGameMusic(m) { gameMusic = m; }
export function setMusicEnabled(e) { musicEnabled = e; }
export function setMusicMuted(m) { musicMuted = m; }
export function setAttractMode(a) { attractMode = a; }
export function setGameLoopId(id) { gameLoopId = id; }
export function setGameStarting(s) { gameStarting = s; }

// Direct getter for credits (ensures fresh read)
export function getCredits() { return credits; }

// Initialize cached UI references
export function initCachedUI() {
    cachedUI.score = document.getElementById('scoreDisplay');
    cachedUI.wave = document.getElementById('waveDisplay');
    cachedUI.lives = document.getElementById('livesDisplay');
    cachedUI.bombs = document.getElementById('bombsDisplay');
    cachedUI.highScore = document.getElementById('highScoreDisplay'); // Menu high score
    cachedUI.gameHighScore = document.getElementById('gameHighScoreDisplay'); // In-game high score
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
