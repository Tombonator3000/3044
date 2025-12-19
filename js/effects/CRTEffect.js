/**
 * Geometry 3044 - CRT Effect Module
 * Enhanced CRT monitor effect with chromatic aberration and scanlines
 */

import { config } from '../globals.js';

/**
 * Draw enhanced CRT effect with chromatic aberration
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 */
export function drawEnhancedCRT(ctx) {
    ctx.save();

    // Scanlines
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = '#000000';

    for (let y = 0; y < config.height; y += 4) {
        ctx.fillRect(0, y, config.width, 2);
    }

    // Chromatic aberration (RGB shift)
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.03;

    // Red shift
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(2, 0, config.width, config.height);

    // Blue shift
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(-2, 0, config.width, config.height);

    ctx.globalCompositeOperation = 'source-over';

    // Vignette
    const gradient = ctx.createRadialGradient(
        config.width/2, config.height/2, Math.min(config.width, config.height)/3,
        config.width/2, config.height/2, Math.max(config.width, config.height)/2
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.7, 'rgba(0,0,0,0.1)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.4)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, config.width, config.height);

    // Random flicker
    if (Math.random() < 0.02) {
        ctx.globalAlpha = 0.02;
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(0, 0, config.width, config.height);
    }

    // Horizontal distortion lines (like old TVs)
    if (Math.random() < 0.05) {
        const y = Math.random() * config.height;
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, y, config.width, 2);
    }

    ctx.restore();
}
