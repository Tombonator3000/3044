// ============================================
// GEOMETRY 3044 — GEOMETRY WARS STYLE WAVING GRID
// ============================================

import { config, getCurrentTheme } from '../config.js';

// Grid state for wave simulation
const gridState = {
    points: [],
    initialized: false,
    gridCols: 0,
    gridRows: 0,
    cellSize: 40,
    impacts: [],
    time: 0
};

/**
 * Initialize the grid points
 */
function initGrid(canvas) {
    if (!canvas) return;

    gridState.cellSize = 40;
    gridState.gridCols = Math.ceil(canvas.width / gridState.cellSize) + 2;
    gridState.gridRows = Math.ceil(canvas.height / gridState.cellSize) + 2;
    gridState.points = [];

    for (let row = 0; row < gridState.gridRows; row++) {
        gridState.points[row] = [];
        for (let col = 0; col < gridState.gridCols; col++) {
            gridState.points[row][col] = {
                x: col * gridState.cellSize,
                y: row * gridState.cellSize,
                baseX: col * gridState.cellSize,
                baseY: row * gridState.cellSize,
                vx: 0,
                vy: 0,
                offsetX: 0,
                offsetY: 0
            };
        }
    }

    gridState.initialized = true;
}

/**
 * Add an impact to the grid (causes ripple effect)
 */
export function addGridImpact(x, y, force = 50, radius = 150) {
    gridState.impacts.push({
        x,
        y,
        force,
        radius,
        time: 0,
        maxTime: 60
    });
}

/**
 * Update grid physics
 */
function updateGrid(canvas) {
    if (!gridState.initialized || !canvas) {
        initGrid(canvas);
        return;
    }

    gridState.time += 0.02;

    // Update impacts
    gridState.impacts = gridState.impacts.filter(impact => {
        impact.time++;
        return impact.time < impact.maxTime;
    });

    // Update each grid point
    const dampening = 0.92;
    const springStrength = 0.03;
    const neighborInfluence = 0.01;

    for (let row = 0; row < gridState.gridRows; row++) {
        for (let col = 0; col < gridState.gridCols; col++) {
            const point = gridState.points[row][col];

            // Apply impacts
            for (const impact of gridState.impacts) {
                const dx = point.baseX - impact.x;
                const dy = point.baseY - impact.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < impact.radius) {
                    const progress = impact.time / impact.maxTime;
                    const wavePhase = (dist / impact.radius) * Math.PI * 2 - progress * Math.PI * 4;
                    const waveStrength = Math.sin(wavePhase) * impact.force * (1 - progress) * (1 - dist / impact.radius);

                    if (dist > 0) {
                        point.vx += (dx / dist) * waveStrength * 0.1;
                        point.vy += (dy / dist) * waveStrength * 0.1;
                    }
                }
            }

            // Ambient wave motion
            const ambientWave = Math.sin(gridState.time + col * 0.3) * Math.cos(gridState.time * 0.7 + row * 0.2) * 2;
            point.vy += ambientWave * 0.01;

            // Spring back to original position
            point.vx += (point.baseX - (point.baseX + point.offsetX)) * springStrength;
            point.vy += (point.baseY - (point.baseY + point.offsetY)) * springStrength;

            // Neighbor influence (tension)
            if (row > 0) {
                const neighbor = gridState.points[row - 1][col];
                point.vy += (neighbor.offsetY - point.offsetY) * neighborInfluence;
            }
            if (row < gridState.gridRows - 1) {
                const neighbor = gridState.points[row + 1][col];
                point.vy += (neighbor.offsetY - point.offsetY) * neighborInfluence;
            }
            if (col > 0) {
                const neighbor = gridState.points[row][col - 1];
                point.vx += (neighbor.offsetX - point.offsetX) * neighborInfluence;
            }
            if (col < gridState.gridCols - 1) {
                const neighbor = gridState.points[row][col + 1];
                point.vx += (neighbor.offsetX - point.offsetX) * neighborInfluence;
            }

            // Apply velocity with dampening
            point.vx *= dampening;
            point.vy *= dampening;
            point.offsetX += point.vx;
            point.offsetY += point.vy;

            // Limit offset
            const maxOffset = 30;
            point.offsetX = Math.max(-maxOffset, Math.min(maxOffset, point.offsetX));
            point.offsetY = Math.max(-maxOffset, Math.min(maxOffset, point.offsetY));

            // Update actual position
            point.x = point.baseX + point.offsetX;
            point.y = point.baseY + point.offsetY;
        }
    }
}

/**
 * Draw the waving grid - Geometry Wars style
 */
export function drawWavingGrid(ctx, canvas, wave = 1) {
    if (!ctx || !canvas) return;

    // Initialize or update grid
    updateGrid(canvas);

    if (!gridState.initialized) return;

    const theme = getCurrentTheme(wave);
    const time = Date.now() * 0.001;

    ctx.save();

    // Calculate grid intensity based on wave
    const intensity = Math.min(0.3 + (wave * 0.02), 0.6);
    const pulseIntensity = Math.sin(time * 2) * 0.1 + 0.9;

    // Draw horizontal lines
    for (let row = 0; row < gridState.gridRows; row++) {
        const rowProgress = row / gridState.gridRows;
        const depthFade = 0.3 + rowProgress * 0.7;

        ctx.strokeStyle = `hsla(${theme.gridHue}, 100%, 50%, ${intensity * depthFade * pulseIntensity})`;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 8 * pulseIntensity;
        ctx.shadowColor = `hsla(${theme.gridHue}, 100%, 50%, 0.5)`;

        ctx.beginPath();
        for (let col = 0; col < gridState.gridCols; col++) {
            const point = gridState.points[row][col];
            if (col === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        ctx.stroke();
    }

    // Draw vertical lines
    for (let col = 0; col < gridState.gridCols; col++) {
        const colProgress = col / gridState.gridCols;
        const perspectiveFade = 0.5 + Math.abs(colProgress - 0.5) * 0.5;

        ctx.strokeStyle = `hsla(${theme.gridHue + 30}, 100%, 50%, ${intensity * perspectiveFade * pulseIntensity * 0.8})`;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 6 * pulseIntensity;
        ctx.shadowColor = `hsla(${theme.gridHue + 30}, 100%, 50%, 0.4)`;

        ctx.beginPath();
        for (let row = 0; row < gridState.gridRows; row++) {
            const point = gridState.points[row][col];
            if (row === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        ctx.stroke();
    }

    // Draw intersection glow points
    ctx.shadowBlur = 0;
    for (let row = 0; row < gridState.gridRows; row += 2) {
        for (let col = 0; col < gridState.gridCols; col += 2) {
            const point = gridState.points[row][col];
            const distortion = Math.abs(point.offsetX) + Math.abs(point.offsetY);

            if (distortion > 2) {
                const glowSize = Math.min(distortion * 0.3, 4);
                const glowAlpha = Math.min(distortion * 0.02, 0.4);

                ctx.fillStyle = `hsla(${theme.gridHue}, 100%, 70%, ${glowAlpha})`;
                ctx.beginPath();
                ctx.arc(point.x, point.y, glowSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    ctx.restore();
}

/**
 * Original themed grid (kept for compatibility)
 */
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

/**
 * Reset grid state (call when canvas size changes)
 */
export function resetGrid() {
    gridState.initialized = false;
    gridState.points = [];
    gridState.impacts = [];
}
