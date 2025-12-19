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
import { Bullet, BulletPool } from './entities/Bullet.js';

// Temporary: Log that modules are loading
console.log('🎮 Geometry 3044 - Module System Loading...');
console.log('📦 CONFIG loaded:', CONFIG.screen);
console.log('🎨 WAVE_THEMES loaded:', Object.keys(WAVE_THEMES).length, 'themes');
console.log('🚀 Entity modules loaded: Player, Enemy, Bullet, BulletPool');

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

    // TODO: Initialize game systems (Phase 3+)
    // - ParticleSystem
    // - WaveManager
    // - SoundSystem
    // - FormationManager
    // - etc.

    console.log('🎮 Geometry 3044 - Module System Ready!');
    console.log('✅ Phase 2 Complete: Entity modules (Player, Enemy, Bullet)');
    console.log('📝 Next: Implement game systems (Phase 3)');
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

    // Entity modules status
    ctx.shadowColor = theme.accent;
    ctx.fillStyle = theme.accent;
    ctx.fillText('✓ Player.js loaded', canvas.width / 2, canvas.height / 2 + 145);
    ctx.fillText('✓ Enemy.js loaded', canvas.width / 2, canvas.height / 2 + 170);
    ctx.fillText('✓ Bullet.js loaded', canvas.width / 2, canvas.height / 2 + 195);

    ctx.shadowBlur = 0;

    // Info box
    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = '#666666';
    ctx.fillText('Phase 2 Complete - Entity Modules Ready', canvas.width / 2, canvas.height - 50);
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
    BulletPool
};
