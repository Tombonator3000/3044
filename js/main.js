/**
 * Geometry 3044 - Main Entry Point
 * ES6 Module version
 */

import { CONFIG, WAVE_THEMES, getCurrentTheme } from './config.js';
import {
    canvas, ctx, gameState, keys, config,
    cachedUI, setCanvas, setCtx, initCachedUI
} from './globals.js';

// Phase 2: Entity modules
import { Player } from './entities/Player.js';
import { Enemy } from './entities/Enemy.js';
import { Bullet } from './entities/Bullet.js';

// Phase 3: System modules
import { BulletPool, ParticleSystem, WaveManager, SoundSystem } from './systems/index.js';

// Phase 4: Effect modules
import { Starfield, VHSGlitchEffects, drawEnhancedCRT, Epic80sExplosion, RadicalSlang } from './effects/index.js';

// Phase 5: Core engine modules
import { GameState, InputHandler, CollisionSystem, GameLoop } from './core/index.js';

// Phase 6: UI modules
import { MenuManager, MenuState, HUD, ComboDisplay, RadicalSlangUI } from './ui/index.js';

// Temporary: Log that modules are loading
console.log('🎮 Geometry 3044 - Module System Loading...');
console.log('📦 CONFIG loaded:', CONFIG.screen);
console.log('🎨 WAVE_THEMES loaded:', Object.keys(WAVE_THEMES).length, 'themes');
console.log('🚀 Entity modules loaded: Player, Enemy, Bullet');
console.log('⚙️ System modules loaded: BulletPool, ParticleSystem, WaveManager, SoundSystem');
console.log('✨ Effect modules loaded: Starfield, VHSGlitchEffects, CRTEffect, Epic80sExplosion, RadicalSlang');
console.log('🎯 Core modules loaded: GameState, InputHandler, CollisionSystem, GameLoop');
console.log('🖥️ UI modules loaded: MenuManager, HUD, ComboDisplay, RadicalSlangUI');

/**
 * Initialize the game
 */
function init() {
    console.log('🚀 Initializing Geometry 3044...');

    // Get canvas element
    const canvasElement = document.getElementById('gameCanvas');
    if (!canvasElement) {
        console.error('❌ Canvas element not found!');
        return;
    }

    // Set canvas and context
    setCanvas(canvasElement);
    const context = canvasElement.getContext('2d');
    setCtx(context);

    // Set canvas dimensions from config
    canvasElement.width = CONFIG.screen.width;
    canvasElement.height = CONFIG.screen.height;

    // Initialize cached UI references
    initCachedUI();

    console.log('✅ Canvas initialized:', CONFIG.screen.width, 'x', CONFIG.screen.height);
    console.log('✅ UI elements cached');

    // Draw a test pattern to verify everything works
    drawTestPattern(context, canvasElement);

    // TODO: Initialize game systems (Phase 5+)
    // - FormationManager
    // - UfoManager
    // - BonusRound
    // - etc.

    console.log('🎮 Geometry 3044 - Module System Ready!');
    console.log('✅ Phase 2 Complete: Entity modules (Player, Enemy, Bullet)');
    console.log('✅ Phase 3 Complete: System modules (BulletPool, ParticleSystem, WaveManager, SoundSystem)');
    console.log('✅ Phase 4 Complete: Effect modules (Starfield, VHSGlitch, CRT, Explosions)');
    console.log('✅ Phase 5 Complete: Core engine (GameState, InputHandler, CollisionSystem, GameLoop)');
    console.log('✅ Phase 6 Complete: UI modules (MenuManager, HUD, ComboDisplay, RadicalSlang)');
    console.log('📝 Next: Wire up complete game with all modules');
}

/**
 * Draw a test pattern to verify canvas is working
 */
function drawTestPattern(ctx, canvas) {
    // Clear canvas
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid using config colors
    ctx.strokeStyle = CONFIG.colors.grid;
    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    ctx.globalAlpha = 1;

    // Draw title text
    const theme = getCurrentTheme(1);
    ctx.font = 'bold 48px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Glow effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = theme.primary;
    ctx.fillStyle = theme.primary;
    ctx.fillText('GEOMETRY 3044', canvas.width / 2, canvas.height / 2 - 50);

    // Subtitle
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.shadowColor = theme.secondary;
    ctx.fillStyle = theme.secondary;
    ctx.fillText('MODULE SYSTEM ACTIVE', canvas.width / 2, canvas.height / 2 + 20);

    // Status
    ctx.font = '16px "Courier New", monospace';
    ctx.shadowBlur = 10;
    ctx.shadowColor = CONFIG.colors.player;
    ctx.fillStyle = CONFIG.colors.player;
    ctx.fillText('✓ config.js loaded', canvas.width / 2, canvas.height / 2 + 60);
    ctx.fillText('✓ globals.js loaded', canvas.width / 2, canvas.height / 2 + 85);
    ctx.fillText('✓ main.js loaded', canvas.width / 2, canvas.height / 2 + 110);

    // Entity modules status (Phase 2)
    ctx.shadowColor = theme.accent;
    ctx.fillStyle = theme.accent;
    ctx.fillText('✓ Player.js', canvas.width / 2 - 120, canvas.height / 2 + 145);
    ctx.fillText('✓ Enemy.js', canvas.width / 2 - 120, canvas.height / 2 + 170);
    ctx.fillText('✓ Bullet.js', canvas.width / 2 - 120, canvas.height / 2 + 195);

    // System modules status (Phase 3)
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#00ffff';
    ctx.fillText('✓ BulletPool.js', canvas.width / 2 + 100, canvas.height / 2 + 145);
    ctx.fillText('✓ ParticleSystem.js', canvas.width / 2 + 100, canvas.height / 2 + 170);

    // Effect modules status (Phase 4)
    ctx.shadowColor = '#ff00ff';
    ctx.fillStyle = '#ff00ff';
    ctx.fillText('✓ Starfield.js', canvas.width / 2 - 120, canvas.height / 2 + 220);
    ctx.fillText('✓ VHSGlitch.js', canvas.width / 2 + 100, canvas.height / 2 + 220);

    // Core modules status (Phase 5)
    ctx.shadowColor = '#ffff00';
    ctx.fillStyle = '#ffff00';
    ctx.fillText('✓ GameState.js', canvas.width / 2 - 120, canvas.height / 2 + 245);
    ctx.fillText('✓ InputHandler.js', canvas.width / 2 + 100, canvas.height / 2 + 245);

    // UI modules status (Phase 6)
    ctx.shadowColor = '#ff6600';
    ctx.fillStyle = '#ff6600';
    ctx.fillText('✓ MenuManager.js', canvas.width / 2 - 120, canvas.height / 2 + 270);
    ctx.fillText('✓ HUD.js', canvas.width / 2 + 100, canvas.height / 2 + 270);
    ctx.fillText('✓ ComboDisplay.js', canvas.width / 2 - 120, canvas.height / 2 + 295);
    ctx.fillText('✓ RadicalSlang.js', canvas.width / 2 + 100, canvas.height / 2 + 295);

    ctx.shadowBlur = 0;

    // Info box
    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = '#666666';
    ctx.fillText('Phase 6 Complete - UI System Ready', canvas.width / 2, canvas.height - 50);
}

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
    // Entity classes (Phase 2)
    Player,
    Enemy,
    Bullet,
    // System classes (Phase 3)
    BulletPool,
    ParticleSystem,
    WaveManager,
    SoundSystem,
    // Effect classes (Phase 4)
    Starfield,
    VHSGlitchEffects,
    drawEnhancedCRT,
    Epic80sExplosion,
    RadicalSlang,
    // Core engine classes (Phase 5)
    GameState,
    InputHandler,
    CollisionSystem,
    GameLoop,
    // UI classes (Phase 6)
    MenuManager,
    MenuState,
    HUD,
    ComboDisplay,
    RadicalSlangUI
};
