// ============================================
// GEOMETRY 3044 — THEMED GRID RENDERER
// ============================================

import { config, getCurrentTheme } from '../config.js';

export function drawThemedGrid(ctx, canvas, wave = 1) {
    if (!ctx || !canvas) return;

    const theme = getCurrentTheme(wave);

    ctx.save();

    const pulse = Math.sin(Date.now() * 0.001) * 0.3 + 0.7;
    const colorShift = Math.sin(Date.now() * 0.0005) * 30;

    const hue = theme.gridHue + colorShift;
    ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${0.15 * pulse})`;
    ctx.lineWidth = 1;
    ctx.shadowBlur = 8 * pulse;
    ctx.shadowColor = `hsla(${hue}, 100%, 50%, 0.4)`;

    const gridSize = 60;
    const offset = (Date.now() * 0.02) % gridSize;

    // Vertical grid lines with perspective
    for (let x = -gridSize; x < canvas.width + gridSize; x += gridSize) {
        const perspectiveFactor = 1 + (canvas.height - 400) / canvas.height * 0.5;
        const startX = x + offset;
        const endX = (x - canvas.width / 2) * perspectiveFactor + canvas.width / 2 + offset;

        ctx.beginPath();
        ctx.moveTo(startX, 0);
        ctx.lineTo(endX, canvas.height);
        ctx.stroke();
    }

    // Horizontal grid lines with depth fade
    for (let y = 0; y < canvas.height; y += gridSize) {
        const depthAlpha = 0.5 + (y / canvas.height) * 0.5;
        ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${0.15 * pulse * depthAlpha})`;

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Themed horizon gradient
    ctx.globalAlpha = 0.12;
    const gradient = ctx.createLinearGradient(0, canvas.height - 150, 0, canvas.height);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.5, `hsla(${theme.gridHue}, 100%, 50%, 0.25)`);
    gradient.addColorStop(1, `hsla(${theme.gridHue + 60}, 100%, 50%, 0.35)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvas.height - 150, canvas.width, 150);

    ctx.restore();
}

// Simplified background gradient
export function drawBackground(ctx, canvas, wave = 1) {
    if (!ctx || !canvas) return;

    const theme = getCurrentTheme(wave);

    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, theme.bgStart);
    bgGradient.addColorStop(0.3, theme.bgEnd);
    bgGradient.addColorStop(0.7, '#000011');
    bgGradient.addColorStop(1, '#000000');

    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
