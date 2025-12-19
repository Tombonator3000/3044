/**
 * Geometry 3044 - MenuManager Module
 * Manages all game menu screens and transitions
 */

import { CONFIG, WAVE_THEMES, getCurrentTheme } from '../config.js';
import { cachedUI, getCredits, setCredits, gameStarting, setGameStarting } from '../globals.js';

/**
 * Menu screen states
 */
export const MenuState = {
    MAIN: 'main',
    GAME: 'game',
    PAUSED: 'paused',
    GAME_OVER: 'gameover',
    HIGH_SCORE_ENTRY: 'highscore_entry',
    HIGH_SCORE_LIST: 'highscore_list',
    CONTINUE: 'continue',
    OPTIONS: 'options'
};

// Game settings with defaults
export const GameSettings = {
    soundEnabled: true,
    musicEnabled: true,
    vhsEffect: true,
    scanlines: true,
    screenShake: true,
    particleIntensity: 'high', // low, medium, high
    difficulty: 'normal', // easy, normal, hard, extreme

    // Load from localStorage
    load() {
        try {
            const saved = localStorage.getItem('geometry3044_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.assign(this, parsed);
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }
    },

    // Save to localStorage
    save() {
        try {
            const toSave = {
                soundEnabled: this.soundEnabled,
                musicEnabled: this.musicEnabled,
                vhsEffect: this.vhsEffect,
                scanlines: this.scanlines,
                screenShake: this.screenShake,
                particleIntensity: this.particleIntensity,
                difficulty: this.difficulty
            };
            localStorage.setItem('geometry3044_settings', JSON.stringify(toSave));
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    }
};

/**
 * MenuManager class - handles all menu screens and transitions
 */
export class MenuManager {
    constructor() {
        this.currentState = MenuState.MAIN;
        this.previousState = null;
        this.transitionTimer = 0;
        this.transitionDuration = 30; // frames
        this.isTransitioning = false;

        // Animation state
        this.menuAnimTimer = 0;
        this.insertCoinBlink = true;
        this.blinkTimer = 0;

        // Callbacks
        this.onStartGame = null;
        this.onContinue = null;
        this.onQuit = null;
    }

    /**
     * Initialize menu manager and bind UI events
     */
    init() {
        console.log('🎮 MenuManager.init() called');

        // Load saved settings
        GameSettings.load();

        // Bind start button (with guard against multiple clicks)
        if (cachedUI.startGameBtn) {
            console.log('  - Start button found, binding click event');
            // Remove any existing handlers by cloning and replacing
            const newBtn = cachedUI.startGameBtn.cloneNode(true);
            cachedUI.startGameBtn.parentNode.replaceChild(newBtn, cachedUI.startGameBtn);
            cachedUI.startGameBtn = newBtn;

            cachedUI.startGameBtn.addEventListener('click', () => {
                console.log('🔘 START GAME button clicked!');

                // Guard against multiple calls
                if (gameStarting) {
                    console.log('  - Game already starting, ignoring click');
                    return;
                }

                console.log('  - onStartGame callback:', this.onStartGame ? '✅ set' : '❌ not set');
                if (this.onStartGame) {
                    console.log('  - Calling onStartGame()...');
                    this.onStartGame();
                } else {
                    console.error('  - ERROR: onStartGame callback not set!');
                }
            });
        } else {
            console.error('❌ Start button NOT found in cachedUI!');
        }

        // Note: playAgainBtn is handled in main.js to show main menu
        // Do NOT add a handler here to avoid duplicate calls

        // Bind continue button
        const continueBtn = document.getElementById('continueBtn');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                if (this.onContinue) {
                    this.onContinue();
                }
            });
        }

        // Initialize options menu bindings
        this.initOptionsBindings();

        // Initialize insert coin blink
        this.startInsertCoinBlink();
    }

    /**
     * Start insert coin blinking animation
     */
    startInsertCoinBlink() {
        setInterval(() => {
            if (cachedUI.insertCoinText) {
                this.insertCoinBlink = !this.insertCoinBlink;
                cachedUI.insertCoinText.style.opacity = this.insertCoinBlink ? '1' : '0.3';
            }
        }, 500);
    }

    /**
     * Transition to a new menu state
     * @param {MenuState} newState - The state to transition to
     */
    transitionTo(newState) {
        if (this.currentState === newState) return;

        this.previousState = this.currentState;
        this.currentState = newState;
        this.isTransitioning = true;
        this.transitionTimer = this.transitionDuration;

        this.updateScreenVisibility();
    }

    /**
     * Update screen visibility based on current state
     */
    updateScreenVisibility() {
        // Hide all screens first
        if (cachedUI.menuScreen) cachedUI.menuScreen.style.display = 'none';
        if (cachedUI.gameUI) cachedUI.gameUI.style.display = 'none';
        if (cachedUI.gameOverScreen) cachedUI.gameOverScreen.style.display = 'none';
        if (cachedUI.continueScreen) cachedUI.continueScreen.style.display = 'none';
        if (cachedUI.highScoreEntryScreen) cachedUI.highScoreEntryScreen.style.display = 'none';
        if (cachedUI.highScoreListScreen) cachedUI.highScoreListScreen.style.display = 'none';

        const pauseOverlay = document.getElementById('pauseOverlay');
        if (pauseOverlay) pauseOverlay.style.display = 'none';

        const optionsScreen = document.getElementById('optionsScreen');
        if (optionsScreen) optionsScreen.style.display = 'none';

        // Show appropriate screen
        switch (this.currentState) {
            case MenuState.MAIN:
                if (cachedUI.menuScreen) cachedUI.menuScreen.style.display = 'flex';
                break;
            case MenuState.GAME:
                // Canvas-based HUD is now used instead of DOM elements
                // if (cachedUI.gameUI) cachedUI.gameUI.style.display = 'block';
                break;
            case MenuState.PAUSED:
                // Canvas-based HUD is now used instead of DOM elements
                // if (cachedUI.gameUI) cachedUI.gameUI.style.display = 'block';
                if (pauseOverlay) pauseOverlay.style.display = 'flex';
                break;
            case MenuState.GAME_OVER:
                if (cachedUI.gameOverScreen) cachedUI.gameOverScreen.style.display = 'flex';
                break;
            case MenuState.HIGH_SCORE_ENTRY:
                if (cachedUI.highScoreEntryScreen) cachedUI.highScoreEntryScreen.style.display = 'flex';
                break;
            case MenuState.HIGH_SCORE_LIST:
                if (cachedUI.highScoreListScreen) cachedUI.highScoreListScreen.style.display = 'flex';
                break;
            case MenuState.CONTINUE:
                if (cachedUI.continueScreen) cachedUI.continueScreen.style.display = 'flex';
                break;
            case MenuState.OPTIONS:
                if (optionsScreen) optionsScreen.style.display = 'flex';
                break;
        }
    }

    /**
     * Show main menu
     */
    showMainMenu() {
        this.transitionTo(MenuState.MAIN);
    }

    /**
     * Show game UI (start game)
     */
    showGameUI() {
        this.transitionTo(MenuState.GAME);
    }

    /**
     * Show pause screen
     */
    showPauseScreen() {
        this.transitionTo(MenuState.PAUSED);
    }

    /**
     * Hide pause screen (resume game)
     */
    hidePauseScreen() {
        this.transitionTo(MenuState.GAME);
    }

    /**
     * Show game over screen
     * @param {number} finalScore - The player's final score
     */
    showGameOver(finalScore) {
        const finalScoreDisplay = document.getElementById('finalScoreDisplay');
        if (finalScoreDisplay) {
            finalScoreDisplay.textContent = finalScore.toLocaleString();
        }
        this.transitionTo(MenuState.GAME_OVER);
    }

    /**
     * Show continue screen
     * @param {number} remainingTime - Time remaining to continue (seconds)
     */
    showContinueScreen(remainingTime) {
        const timerDisplay = document.getElementById('continueTimerDisplay');
        if (timerDisplay) {
            timerDisplay.textContent = Math.ceil(remainingTime);
        }
        this.transitionTo(MenuState.CONTINUE);
    }

    /**
     * Update continue timer display
     * @param {number} remainingTime - Time remaining in seconds
     */
    updateContinueTimer(remainingTime) {
        const timerDisplay = document.getElementById('continueTimerDisplay');
        if (timerDisplay) {
            timerDisplay.textContent = Math.ceil(remainingTime);
        }
    }

    /**
     * Show high score entry screen
     * @param {number} score - The player's score
     */
    showHighScoreEntry(score) {
        const scoreDisplay = document.getElementById('entryScoreDisplay');
        if (scoreDisplay) {
            scoreDisplay.textContent = score.toLocaleString();
        }
        this.transitionTo(MenuState.HIGH_SCORE_ENTRY);

        // Focus first initial input
        const initial1 = document.getElementById('initial1');
        if (initial1) {
            initial1.focus();
        }
    }

    /**
     * Show high score list
     * @param {Array} scores - Array of high score objects
     */
    showHighScoreList(scores) {
        const listContainer = document.getElementById('highScoreListContainer');
        if (listContainer && scores) {
            listContainer.innerHTML = scores.map((score, index) =>
                `<div class="high-score-entry">
                    <span class="rank">${index + 1}.</span>
                    <span class="initials">${score.initials}</span>
                    <span class="score">${score.score.toLocaleString()}</span>
                </div>`
            ).join('');
        }
        this.transitionTo(MenuState.HIGH_SCORE_LIST);
    }

    /**
     * Update credits display
     * @param {number} creditsCount - Number of credits
     */
    updateCredits(creditsCount) {
        if (cachedUI.creditsCount) {
            cachedUI.creditsCount.textContent = creditsCount;
        }
        setCredits(creditsCount);
    }

    /**
     * Use a credit
     * @returns {boolean} True if credit was used successfully
     */
    useCredit() {
        const currentCredits = getCredits();
        console.log('🪙 useCredit() called');
        console.log('  - Current credits:', currentCredits);
        if (currentCredits > 0) {
            const newCredits = currentCredits - 1;
            this.updateCredits(newCredits);
            console.log('  - Credit used! New credits:', newCredits);
            return true;
        }
        console.log('  - No credits available!');
        return false;
    }

    /**
     * Add a credit
     */
    addCredit() {
        this.updateCredits(getCredits() + 1);
    }

    /**
     * Update menu animations
     */
    update() {
        this.menuAnimTimer++;
        this.blinkTimer++;

        // Handle transition
        if (this.isTransitioning && this.transitionTimer > 0) {
            this.transitionTimer--;
            if (this.transitionTimer <= 0) {
                this.isTransitioning = false;
            }
        }
    }

    /**
     * Draw menu overlay effects on canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        // Draw transition effect
        if (this.isTransitioning) {
            const progress = this.transitionTimer / this.transitionDuration;
            ctx.fillStyle = `rgba(0, 0, 0, ${progress * 0.5})`;
            ctx.fillRect(0, 0, CONFIG.screen.width, CONFIG.screen.height);
        }
    }

    /**
     * Get current menu state
     * @returns {MenuState} Current state
     */
    getState() {
        return this.currentState;
    }

    /**
     * Check if currently in game
     * @returns {boolean}
     */
    isInGame() {
        return this.currentState === MenuState.GAME;
    }

    /**
     * Check if game is paused
     * @returns {boolean}
     */
    isPaused() {
        return this.currentState === MenuState.PAUSED;
    }

    /**
     * Show options menu
     */
    showOptions() {
        this.transitionTo(MenuState.OPTIONS);
        this.updateOptionsUI();
    }

    /**
     * Close options menu and return to main menu
     */
    closeOptions() {
        GameSettings.save();
        this.transitionTo(MenuState.MAIN);
    }

    /**
     * Update options UI to reflect current settings
     */
    updateOptionsUI() {
        // Update toggle states
        this.updateToggle('soundToggle', GameSettings.soundEnabled);
        this.updateToggle('musicToggle', GameSettings.musicEnabled);
        this.updateToggle('vhsToggle', GameSettings.vhsEffect);
        this.updateToggle('scanlinesToggle', GameSettings.scanlines);
        this.updateToggle('screenShakeToggle', GameSettings.screenShake);

        // Update particle intensity selector
        const particleButtons = document.querySelectorAll('.particle-btn');
        particleButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.value === GameSettings.particleIntensity) {
                btn.classList.add('active');
            }
        });

        // Update difficulty selector
        const diffButtons = document.querySelectorAll('.difficulty-btn');
        diffButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.value === GameSettings.difficulty) {
                btn.classList.add('active');
            }
        });
    }

    /**
     * Update a toggle button's visual state
     */
    updateToggle(toggleId, isEnabled) {
        const toggle = document.getElementById(toggleId);
        if (toggle) {
            toggle.classList.toggle('active', isEnabled);
            toggle.textContent = isEnabled ? 'ON' : 'OFF';
        }
    }

    /**
     * Toggle a setting
     */
    toggleSetting(setting) {
        GameSettings[setting] = !GameSettings[setting];
        this.updateOptionsUI();
        GameSettings.save();
    }

    /**
     * Set particle intensity
     */
    setParticleIntensity(value) {
        GameSettings.particleIntensity = value;
        this.updateOptionsUI();
        GameSettings.save();
    }

    /**
     * Set difficulty
     */
    setDifficulty(value) {
        GameSettings.difficulty = value;
        this.updateOptionsUI();
        GameSettings.save();
    }

    /**
     * Initialize options menu bindings
     */
    initOptionsBindings() {
        // Options button in main menu
        const optionsBtn = document.getElementById('optionsBtn');
        if (optionsBtn) {
            optionsBtn.addEventListener('click', () => this.showOptions());
        }

        // Back button in options
        const backBtn = document.getElementById('optionsBackBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.closeOptions());
        }

        // Toggle buttons
        const toggleBindings = [
            { id: 'soundToggle', setting: 'soundEnabled' },
            { id: 'musicToggle', setting: 'musicEnabled' },
            { id: 'vhsToggle', setting: 'vhsEffect' },
            { id: 'scanlinesToggle', setting: 'scanlines' },
            { id: 'screenShakeToggle', setting: 'screenShake' }
        ];

        toggleBindings.forEach(({ id, setting }) => {
            const toggle = document.getElementById(id);
            if (toggle) {
                toggle.addEventListener('click', () => this.toggleSetting(setting));
            }
        });

        // Particle intensity buttons
        const particleButtons = document.querySelectorAll('.particle-btn');
        particleButtons.forEach(btn => {
            btn.addEventListener('click', () => this.setParticleIntensity(btn.dataset.value));
        });

        // Difficulty buttons
        const diffButtons = document.querySelectorAll('.difficulty-btn');
        diffButtons.forEach(btn => {
            btn.addEventListener('click', () => this.setDifficulty(btn.dataset.value));
        });
    }
}
