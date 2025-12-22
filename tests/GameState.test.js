/**
 * Comprehensive tests for GameState.js
 * Tests core game state management including score, combo, lives, bombs, and effects
 */

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
        removeItem: jest.fn(key => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; })
    };
})();
global.localStorage = localStorageMock;

// Mock console.warn
console.warn = jest.fn();

// Mock GameSettings
jest.mock('../js/ui/MenuManager.js', () => ({
    GameSettings: {
        difficulty: 'normal'
    }
}));

// Mock config
jest.mock('../js/config.js', () => ({
    CONFIG: {
        game: {
            maxLives: 9,
            maxBombs: 9,
            newLifeScoreThreshold: 100000,
            comboTimeout: 180
        },
        screenShake: {
            light: { intensity: 3, duration: 10 },
            medium: { intensity: 8, duration: 20 },
            heavy: { intensity: 15, duration: 30 },
            massive: { intensity: 25, duration: 45 }
        },
        timing: {
            themeChangeDisplay: 180
        }
    },
    getDifficultySettings: jest.fn((difficulty) => {
        const settings = {
            easy: { lives: 5, bombs: 5, scoreMultiplier: 0.5 },
            normal: { lives: 3, bombs: 3, scoreMultiplier: 1.0 },
            hard: { lives: 2, bombs: 2, scoreMultiplier: 1.5 },
            extreme: { lives: 1, bombs: 1, scoreMultiplier: 3.0 }
        };
        return settings[difficulty] || settings.normal;
    })
}));

import { GameState } from '../js/core/GameState.js';
import { CONFIG, getDifficultySettings } from '../js/config.js';

describe('GameState', () => {
    let gameState;

    beforeEach(() => {
        // Clear mocks before each test
        jest.clearAllMocks();
        localStorageMock.clear();
        gameState = new GameState();
    });

    describe('constructor and reset', () => {
        test('should initialize with default values on construction', () => {
            expect(gameState.score).toBe(0);
            expect(gameState.wave).toBe(1);
            expect(gameState.combo).toBe(0);
            expect(gameState.comboTimer).toBe(0);
            expect(gameState.maxCombo).toBe(0);
            expect(gameState.gameRunning).toBe(false);
            expect(gameState.gamePaused).toBe(false);
            expect(gameState.gameOver).toBe(false);
        });

        test('should set lives and bombs from difficulty settings', () => {
            expect(gameState.lives).toBe(3);
            expect(gameState.bombs).toBe(3);
        });

        test('should initialize empty entity collections', () => {
            expect(gameState.enemies).toEqual([]);
            expect(gameState.bullets).toEqual([]);
            expect(gameState.enemyBullets).toEqual([]);
            expect(gameState.powerUps).toEqual([]);
            expect(gameState.explosions).toEqual([]);
        });

        test('should initialize screen effects to default state', () => {
            expect(gameState.screenShake).toEqual({ x: 0, y: 0, intensity: 0, duration: 0 });
            expect(gameState.flashEffect).toEqual({ active: false, color: '#ffffff', alpha: 0 });
            expect(gameState.slowMotion).toEqual({ active: false, factor: 1, duration: 0 });
        });

        test('should reset all values when reset() is called', () => {
            // Modify state
            gameState.score = 50000;
            gameState.lives = 1;
            gameState.combo = 10;
            gameState.gameRunning = true;

            // Reset
            gameState.reset();

            expect(gameState.score).toBe(0);
            expect(gameState.lives).toBe(3);
            expect(gameState.combo).toBe(0);
            expect(gameState.gameRunning).toBe(false);
        });

        test('should initialize sidescroller mode properties', () => {
            expect(gameState.sidescrollerMode).toBe(false);
            expect(gameState.sidescrollerWaves).toEqual([4, 9, 14, 19, 24, 29]);
        });
    });

    describe('loadHighScore and saveHighScore', () => {
        test('should return 0 when no high score is saved', () => {
            const score = gameState.loadHighScore();
            expect(score).toBe(0);
        });

        test('should load saved high score from localStorage', () => {
            localStorageMock.getItem.mockReturnValueOnce('50000');
            const newGameState = new GameState();
            expect(newGameState.highScore).toBe(50000);
        });

        test('should save high score to localStorage', () => {
            gameState.highScore = 75000;
            gameState.saveHighScore();
            expect(localStorageMock.setItem).toHaveBeenCalledWith('geometry3044_highScore', '75000');
        });

        test('should handle localStorage errors gracefully on load', () => {
            localStorageMock.getItem.mockImplementationOnce(() => { throw new Error('Storage error'); });
            const score = gameState.loadHighScore();
            expect(score).toBe(0);
        });

        test('should handle localStorage errors gracefully on save', () => {
            localStorageMock.setItem.mockImplementationOnce(() => { throw new Error('Storage error'); });
            gameState.highScore = 50000;
            gameState.saveHighScore();
            expect(console.warn).toHaveBeenCalled();
        });
    });

    describe('addScore', () => {
        test('should add basic score without combo', () => {
            const result = gameState.addScore(100, false);
            expect(result).toBe(100);
            expect(gameState.score).toBe(100);
        });

        test('should apply combo multiplier when combo is active', () => {
            gameState.combo = 5;
            const result = gameState.addScore(100, true);
            expect(result).toBe(500);
            expect(gameState.score).toBe(500);
        });

        test('should apply minimum combo multiplier of 1', () => {
            gameState.combo = 0;
            const result = gameState.addScore(100, true);
            expect(result).toBe(100);
        });

        test('should apply difficulty score multiplier', () => {
            gameState.difficultySettings = { scoreMultiplier: 2.0 };
            const result = gameState.addScore(100, false);
            expect(result).toBe(200);
        });

        test('should combine combo and difficulty multipliers', () => {
            gameState.combo = 3;
            gameState.difficultySettings = { scoreMultiplier: 2.0 };
            const result = gameState.addScore(100, true);
            expect(result).toBe(600); // 100 * 3 * 2.0
        });

        test('should update high score when current score exceeds it', () => {
            gameState.highScore = 1000;
            gameState.addScore(2000, false);
            expect(gameState.highScore).toBe(2000);
            expect(localStorageMock.setItem).toHaveBeenCalled();
        });

        test('should not update high score when current score is lower', () => {
            gameState.highScore = 5000;
            gameState.addScore(1000, false);
            expect(gameState.highScore).toBe(5000);
        });

        test('should award extra life at score threshold', () => {
            gameState.nextLifeScore = 100000;
            gameState.lives = 3;
            gameState.addScore(100000, false);
            expect(gameState.lives).toBe(4);
            expect(gameState.nextLifeScore).toBe(200000);
        });

        test('should award multiple lives for large scores', () => {
            gameState.nextLifeScore = 100000;
            gameState.lives = 3;
            gameState.addScore(250000, false);
            expect(gameState.lives).toBe(5);
            expect(gameState.nextLifeScore).toBe(300000);
        });

        test('should not exceed max lives from score threshold', () => {
            gameState.lives = 8;
            gameState.nextLifeScore = 100000;
            gameState.addScore(300000, false);
            expect(gameState.lives).toBe(CONFIG.game.maxLives);
        });

        test('should floor the calculated score', () => {
            gameState.difficultySettings = { scoreMultiplier: 1.5 };
            const result = gameState.addScore(33, false);
            expect(result).toBe(49); // Math.floor(33 * 1.5)
        });

        test('should handle missing difficulty settings gracefully', () => {
            gameState.difficultySettings = null;
            const result = gameState.addScore(100, false);
            expect(result).toBe(100);
        });
    });

    describe('combo system', () => {
        test('should increment combo count', () => {
            gameState.incrementCombo();
            expect(gameState.combo).toBe(1);
            gameState.incrementCombo();
            expect(gameState.combo).toBe(2);
        });

        test('should reset combo timer on increment', () => {
            gameState.incrementCombo();
            expect(gameState.comboTimer).toBe(CONFIG.game.comboTimeout);
        });

        test('should track max combo', () => {
            gameState.incrementCombo();
            gameState.incrementCombo();
            gameState.incrementCombo();
            expect(gameState.maxCombo).toBe(3);

            gameState.resetCombo();
            expect(gameState.maxCombo).toBe(3);

            gameState.incrementCombo();
            expect(gameState.maxCombo).toBe(3);
        });

        test('should update max combo when exceeded', () => {
            gameState.maxCombo = 5;
            gameState.combo = 5;
            gameState.incrementCombo();
            expect(gameState.maxCombo).toBe(6);
        });

        test('should reset combo and timer', () => {
            gameState.combo = 5;
            gameState.comboTimer = 100;
            gameState.resetCombo();
            expect(gameState.combo).toBe(0);
            expect(gameState.comboTimer).toBe(0);
        });

        test('should decrement combo timer on update', () => {
            gameState.comboTimer = 10;
            gameState.combo = 5;
            gameState.updateCombo();
            expect(gameState.comboTimer).toBe(9);
        });

        test('should reset combo when timer reaches zero', () => {
            gameState.combo = 5;
            gameState.comboTimer = 1;
            gameState.updateCombo();
            expect(gameState.combo).toBe(0);
            expect(gameState.comboTimer).toBe(0);
        });

        test('should not change anything when timer is already zero', () => {
            gameState.combo = 0;
            gameState.comboTimer = 0;
            gameState.updateCombo();
            expect(gameState.combo).toBe(0);
            expect(gameState.comboTimer).toBe(0);
        });
    });

    describe('lives management', () => {
        test('should add a life when below max', () => {
            gameState.lives = 3;
            const result = gameState.addLife();
            expect(result).toBe(true);
            expect(gameState.lives).toBe(4);
        });

        test('should not add life when at max', () => {
            gameState.lives = CONFIG.game.maxLives;
            const result = gameState.addLife();
            expect(result).toBe(false);
            expect(gameState.lives).toBe(CONFIG.game.maxLives);
        });

        test('should clamp lives to max when adding', () => {
            gameState.lives = CONFIG.game.maxLives - 1;
            gameState.addLife();
            expect(gameState.lives).toBeLessThanOrEqual(CONFIG.game.maxLives);
        });

        test('should lose a life and reset combo', () => {
            gameState.lives = 3;
            gameState.combo = 5;
            const isGameOver = gameState.loseLife();
            expect(isGameOver).toBe(false);
            expect(gameState.lives).toBe(2);
            expect(gameState.combo).toBe(0);
        });

        test('should return game over when losing last life', () => {
            gameState.lives = 1;
            const isGameOver = gameState.loseLife();
            expect(isGameOver).toBe(true);
            expect(gameState.lives).toBe(0);
        });

        test('should return clamped lives from getLives', () => {
            gameState.lives = 15; // Invalid high value
            expect(gameState.getLives()).toBe(CONFIG.game.maxLives);

            gameState.lives = -5; // Invalid negative value
            expect(gameState.getLives()).toBe(0);

            gameState.lives = 5; // Valid value
            expect(gameState.getLives()).toBe(5);
        });
    });

    describe('bombs management', () => {
        test('should add a bomb when below max', () => {
            gameState.bombs = 3;
            const result = gameState.addBomb();
            expect(result).toBe(true);
            expect(gameState.bombs).toBe(4);
        });

        test('should not add bomb when at max', () => {
            gameState.bombs = CONFIG.game.maxBombs;
            const result = gameState.addBomb();
            expect(result).toBe(false);
            expect(gameState.bombs).toBe(CONFIG.game.maxBombs);
        });

        test('should use a bomb when available', () => {
            gameState.bombs = 2;
            const result = gameState.useBomb();
            expect(result).toBe(true);
            expect(gameState.bombs).toBe(1);
        });

        test('should not use bomb when none available', () => {
            gameState.bombs = 0;
            const result = gameState.useBomb();
            expect(result).toBe(false);
            expect(gameState.bombs).toBe(0);
        });
    });

    describe('wave management', () => {
        test('should start a new wave', () => {
            gameState.startWave(5);
            expect(gameState.wave).toBe(5);
            expect(gameState.waveComplete).toBe(false);
            expect(gameState.waveTransitionTimer).toBe(0);
            expect(gameState.enemiesKilledThisWave).toBe(0);
            expect(gameState.totalEnemiesThisWave).toBe(0);
        });

        test('should enable sidescroller mode for sidescroller waves', () => {
            gameState.startWave(4);
            expect(gameState.sidescrollerMode).toBe(true);

            gameState.startWave(9);
            expect(gameState.sidescrollerMode).toBe(true);

            gameState.startWave(14);
            expect(gameState.sidescrollerMode).toBe(true);
        });

        test('should disable sidescroller mode for non-sidescroller waves', () => {
            gameState.startWave(1);
            expect(gameState.sidescrollerMode).toBe(false);

            gameState.startWave(5);
            expect(gameState.sidescrollerMode).toBe(false);
        });

        test('should return correct sidescroller mode status', () => {
            gameState.sidescrollerMode = true;
            expect(gameState.isSidescrollerWave()).toBe(true);

            gameState.sidescrollerMode = false;
            expect(gameState.isSidescrollerWave()).toBe(false);
        });

        test('should show theme name for early waves', () => {
            gameState.startWave(3);
            expect(gameState.themeChangeTimer).toBe(CONFIG.timing.themeChangeDisplay);
            expect(gameState.showThemeName).toBe(true);
        });

        test('should not show theme name for later waves', () => {
            gameState.startWave(7);
            expect(gameState.showThemeName).toBe(false);
        });

        test('should complete wave properly', () => {
            gameState.completeWave();
            expect(gameState.waveComplete).toBe(true);
            expect(gameState.waveTransitionTimer).toBe(120);
        });
    });

    describe('screen effects', () => {
        describe('screen shake', () => {
            test('should trigger screen shake with preset', () => {
                gameState.triggerScreenShake('heavy');
                expect(gameState.screenShake.intensity).toBe(15);
                expect(gameState.screenShake.duration).toBe(30);
            });

            test('should use medium preset as default', () => {
                gameState.triggerScreenShake();
                expect(gameState.screenShake.intensity).toBe(8);
                expect(gameState.screenShake.duration).toBe(20);
            });

            test('should fall back to medium for unknown preset', () => {
                gameState.triggerScreenShake('nonexistent');
                expect(gameState.screenShake.intensity).toBe(8);
                expect(gameState.screenShake.duration).toBe(20);
            });
        });

        describe('flash effect', () => {
            test('should trigger flash effect with defaults', () => {
                gameState.triggerFlash();
                expect(gameState.flashEffect.active).toBe(true);
                expect(gameState.flashEffect.color).toBe('#ffffff');
                expect(gameState.flashEffect.alpha).toBe(0.5);
            });

            test('should trigger flash with custom color and alpha', () => {
                gameState.triggerFlash('#ff0000', 0.8);
                expect(gameState.flashEffect.color).toBe('#ff0000');
                expect(gameState.flashEffect.alpha).toBe(0.8);
            });
        });

        describe('slow motion', () => {
            test('should trigger slow motion with defaults', () => {
                gameState.triggerSlowMotion();
                expect(gameState.slowMotion.active).toBe(true);
                expect(gameState.slowMotion.factor).toBe(0.5);
                expect(gameState.slowMotion.duration).toBe(30);
            });

            test('should trigger slow motion with custom values', () => {
                gameState.triggerSlowMotion(0.3, 60);
                expect(gameState.slowMotion.factor).toBe(0.3);
                expect(gameState.slowMotion.duration).toBe(60);
            });
        });
    });

    describe('updateEffects', () => {
        test('should update screen shake position and decrement duration', () => {
            gameState.screenShake = { x: 0, y: 0, intensity: 10, duration: 5 };
            gameState.updateEffects();
            expect(gameState.screenShake.duration).toBe(4);
            // x and y should be random values based on intensity
            expect(typeof gameState.screenShake.x).toBe('number');
            expect(typeof gameState.screenShake.y).toBe('number');
        });

        test('should reset screen shake when duration ends', () => {
            gameState.screenShake = { x: 5, y: 5, intensity: 10, duration: 1 };
            gameState.updateEffects();
            expect(gameState.screenShake.duration).toBe(0);
            gameState.updateEffects();
            expect(gameState.screenShake.x).toBe(0);
            expect(gameState.screenShake.y).toBe(0);
            expect(gameState.screenShake.intensity).toBe(0);
        });

        test('should fade flash effect alpha', () => {
            gameState.flashEffect = { active: true, color: '#ffffff', alpha: 0.5 };
            gameState.updateEffects();
            expect(gameState.flashEffect.alpha).toBe(0.45);
        });

        test('should deactivate flash when alpha reaches zero', () => {
            gameState.flashEffect = { active: true, color: '#ffffff', alpha: 0.03 };
            gameState.updateEffects();
            expect(gameState.flashEffect.active).toBe(false);
            expect(gameState.flashEffect.alpha).toBe(0);
        });

        test('should decrement slow motion duration', () => {
            gameState.slowMotion = { active: true, factor: 0.5, duration: 10 };
            gameState.updateEffects();
            expect(gameState.slowMotion.duration).toBe(9);
        });

        test('should deactivate slow motion when duration ends', () => {
            gameState.slowMotion = { active: true, factor: 0.5, duration: 1 };
            gameState.updateEffects();
            expect(gameState.slowMotion.active).toBe(false);
            expect(gameState.slowMotion.factor).toBe(1);
        });

        test('should decrement theme change timer', () => {
            gameState.themeChangeTimer = 10;
            gameState.showThemeName = true;
            gameState.updateEffects();
            expect(gameState.themeChangeTimer).toBe(9);
        });

        test('should hide theme name when timer ends', () => {
            gameState.themeChangeTimer = 1;
            gameState.showThemeName = true;
            gameState.updateEffects();
            expect(gameState.showThemeName).toBe(false);
        });
    });

    describe('game flow', () => {
        test('should start game properly', () => {
            gameState.score = 5000;
            gameState.gameOver = true;
            gameState.startGame();
            expect(gameState.score).toBe(0);
            expect(gameState.gameRunning).toBe(true);
            expect(gameState.gameOver).toBe(false);
            expect(gameState.gamePaused).toBe(false);
        });

        test('should end game properly', () => {
            gameState.gameRunning = true;
            gameState.highScore = 5000;
            gameState.endGame();
            expect(gameState.gameRunning).toBe(false);
            expect(gameState.gameOver).toBe(true);
            expect(localStorageMock.setItem).toHaveBeenCalled();
        });

        test('should toggle pause when game is running', () => {
            gameState.gameRunning = true;
            gameState.gamePaused = false;

            const result = gameState.togglePause();
            expect(result).toBe(true);
            expect(gameState.gamePaused).toBe(true);

            const result2 = gameState.togglePause();
            expect(result2).toBe(false);
            expect(gameState.gamePaused).toBe(false);
        });

        test('should not toggle pause when game is not running', () => {
            gameState.gameRunning = false;
            const result = gameState.togglePause();
            expect(gameState.gamePaused).toBe(false);
        });

        test('should not toggle pause when game is over', () => {
            gameState.gameRunning = true;
            gameState.gameOver = true;
            const result = gameState.togglePause();
            expect(gameState.gamePaused).toBe(false);
        });
    });

    describe('getDebugInfo', () => {
        test('should return complete debug information', () => {
            gameState.score = 1234;
            gameState.highScore = 5678;
            gameState.lives = 2;
            gameState.bombs = 1;
            gameState.wave = 3;
            gameState.combo = 5;
            gameState.enemies = [1, 2, 3];
            gameState.bullets = [1, 2];
            gameState.enemyBullets = [1];
            gameState.gameRunning = true;
            gameState.gamePaused = false;
            gameState.frameCount = 1000;

            const info = gameState.getDebugInfo();

            expect(info).toEqual({
                score: 1234,
                highScore: 5678,
                lives: 2,
                bombs: 1,
                wave: 3,
                combo: 5,
                enemies: 3,
                bullets: 2,
                enemyBullets: 1,
                gameRunning: true,
                gamePaused: false,
                frameCount: 1000
            });
        });
    });

    describe('edge cases and boundary conditions', () => {
        test('should handle zero score correctly', () => {
            const result = gameState.addScore(0, true);
            expect(result).toBe(0);
            expect(gameState.score).toBe(0);
        });

        test('should handle very large scores', () => {
            gameState.addScore(999999999, false);
            expect(gameState.score).toBe(999999999);
        });

        test('should handle negative combo (edge case)', () => {
            gameState.combo = -1;
            const result = gameState.addScore(100, true);
            expect(result).toBe(100); // Should use Math.max(1, combo)
        });

        test('should handle rapid life add/remove cycles', () => {
            for (let i = 0; i < 10; i++) {
                gameState.addLife();
            }
            expect(gameState.lives).toBeLessThanOrEqual(CONFIG.game.maxLives);

            for (let i = 0; i < 15; i++) {
                gameState.loseLife();
            }
            expect(gameState.lives).toBeLessThan(0); // Can go negative
        });

        test('should handle rapid bomb add/use cycles', () => {
            for (let i = 0; i < 20; i++) {
                gameState.addBomb();
            }
            expect(gameState.bombs).toBeLessThanOrEqual(CONFIG.game.maxBombs);

            for (let i = 0; i < 20; i++) {
                gameState.useBomb();
            }
            expect(gameState.bombs).toBe(0);
        });

        test('should handle multiple rapid combo increments', () => {
            for (let i = 0; i < 100; i++) {
                gameState.incrementCombo();
            }
            expect(gameState.combo).toBe(100);
            expect(gameState.maxCombo).toBe(100);
        });

        test('should handle all sidescroller waves correctly', () => {
            const sidescrollerWaves = [4, 9, 14, 19, 24, 29];
            sidescrollerWaves.forEach(wave => {
                gameState.startWave(wave);
                expect(gameState.isSidescrollerWave()).toBe(true);
            });

            const normalWaves = [1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15];
            normalWaves.forEach(wave => {
                gameState.startWave(wave);
                expect(gameState.isSidescrollerWave()).toBe(false);
            });
        });
    });
});
