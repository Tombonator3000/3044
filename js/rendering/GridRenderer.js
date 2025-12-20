// ============================================
// GEOMETRY 3044 — GEOMETRY WARS STYLE WAVING GRID
// ============================================

import { config, getCurrentTheme } from '../config.js';

// Performance settings - auto-adjusted based on device capability
const perfSettings = {
    enableWaving: true,
    maxImpacts: 10,          // Allow more concurrent impacts for better visual feedback
    updateFrequency: 1,      // Update every frame for smooth animation
    drawIntersections: true,
    enableShadows: true,
    frameCounter: 0
};

// Detect if mobile or low-performance device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isLowPerf = isMobile || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);

// Adjust settings for very low-performance devices only
if (isLowPerf) {
    perfSettings.updateFrequency = 2;
    perfSettings.maxImpacts = 5;
    perfSettings.drawIntersections = true;  // Keep intersections visible
    perfSettings.enableShadows = false;     // Only disable shadows on mobile
}

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
    // Limit number of concurrent impacts for performance
    if (gridState.impacts.length >= perfSettings.maxImpacts) {
        gridState.impacts.shift(); // Remove oldest
    }

    gridState.impacts.push({
        x,
        y,
        force,
        radius,
        radiusSq: radius * radius, // Pre-compute for faster distance checks
        time: 0,
        maxTime: 60
    });
}

/**
 * Update grid physics - OPTIMIZED
 */
function updateGrid(canvas) {
    if (!gridState.initialized || !canvas) {
        initGrid(canvas);
        return;
    }

    // Skip frames for performance
    perfSettings.frameCounter++;
    if (perfSettings.frameCounter % perfSettings.updateFrequency !== 0) {
        return;
    }

    gridState.time += 0.02 * perfSettings.updateFrequency;

    // Update impacts - remove expired ones
    let i = gridState.impacts.length;
    while (i--) {
        gridState.impacts[i].time++;
        if (gridState.impacts[i].time >= gridState.impacts[i].maxTime) {
            gridState.impacts.splice(i, 1);
        }
    }

    // Skip heavy physics if no impacts and grid is settled
    const hasImpacts = gridState.impacts.length > 0;

    // Update each grid point
    const dampening = 0.92;
    const springStrength = 0.03;
    const neighborInfluence = 0.01;
    const maxOffset = 30;
    const rows = gridState.gridRows;
    const cols = gridState.gridCols;
    const points = gridState.points;
    const time = gridState.time;

    for (let row = 0; row < rows; row++) {
        const pointRow = points[row];
        const prevRow = row > 0 ? points[row - 1] : null;
        const nextRow = row < rows - 1 ? points[row + 1] : null;

        for (let col = 0; col < cols; col++) {
            const point = pointRow[col];

            // Apply impacts - use squared distance to avoid sqrt
            if (hasImpacts) {
                for (let j = 0; j < gridState.impacts.length; j++) {
                    const impact = gridState.impacts[j];
                    const dx = point.baseX - impact.x;
                    const dy = point.baseY - impact.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < impact.radiusSq) {
                        const dist = Math.sqrt(distSq);
                        if (dist > 0) {
                            const progress = impact.time / impact.maxTime;
                            const distRatio = dist / impact.radius;
                            const wavePhase = distRatio * 6.283185 - progress * 12.56637; // 2*PI and 4*PI
                            const waveStrength = Math.sin(wavePhase) * impact.force * (1 - progress) * (1 - distRatio) * 0.1;
                            const invDist = 1 / dist;
                            point.vx += dx * invDist * waveStrength;
                            point.vy += dy * invDist * waveStrength;
                        }
                    }
                }
            }

            // Ambient wave motion - simplified trig
            const ambientWave = Math.sin(time + col * 0.3) * Math.cos(time * 0.7 + row * 0.2) * 0.02;
            point.vy += ambientWave;

            // Spring back to original position
            point.vx -= point.offsetX * springStrength;
            point.vy -= point.offsetY * springStrength;

            // Neighbor influence (tension) - inline for speed
            if (prevRow) {
                point.vy += (prevRow[col].offsetY - point.offsetY) * neighborInfluence;
            }
            if (nextRow) {
                point.vy += (nextRow[col].offsetY - point.offsetY) * neighborInfluence;
            }
            if (col > 0) {
                point.vx += (pointRow[col - 1].offsetX - point.offsetX) * neighborInfluence;
            }
            if (col < cols - 1) {
                point.vx += (pointRow[col + 1].offsetX - point.offsetX) * neighborInfluence;
            }

            // Apply velocity with dampening
            point.vx *= dampening;
            point.vy *= dampening;
            point.offsetX += point.vx;
            point.offsetY += point.vy;

            // Clamp offset
            if (point.offsetX > maxOffset) point.offsetX = maxOffset;
            else if (point.offsetX < -maxOffset) point.offsetX = -maxOffset;
            if (point.offsetY > maxOffset) point.offsetY = maxOffset;
            else if (point.offsetY < -maxOffset) point.offsetY = -maxOffset;

            // Update actual position
            point.x = point.baseX + point.offsetX;
            point.y = point.baseY + point.offsetY;
        }
    }
}

// Pre-cached color strings for performance
const colorCache = {
    lastHue: -1,
    horizontalColors: [],
    verticalColors: [],
    shadowColorH: '',
    shadowColorV: ''
};

/**
 * Draw the waving grid - Geometry Wars style - OPTIMIZED
 */
export function drawWavingGrid(ctx, canvas, wave = 1) {
    if (!ctx || !canvas) return;

    // Initialize or update grid
    updateGrid(canvas);

    if (!gridState.initialized) return;

    const theme = getCurrentTheme(wave);
    const rows = gridState.gridRows;
    const cols = gridState.gridCols;
    const points = gridState.points;

    // Only recalculate colors when hue changes
    if (colorCache.lastHue !== theme.gridHue) {
        colorCache.lastHue = theme.gridHue;
        colorCache.horizontalColors = [];
        colorCache.verticalColors = [];

        for (let row = 0; row < rows; row++) {
            const depthFade = 0.3 + (row / rows) * 0.7;
            const alpha = (0.4 * depthFade).toFixed(2);
            colorCache.horizontalColors[row] = `hsla(${theme.gridHue}, 100%, 50%, ${alpha})`;
        }
        for (let col = 0; col < cols; col++) {
            const perspectiveFade = 0.5 + Math.abs(col / cols - 0.5) * 0.5;
            const alpha = (0.32 * perspectiveFade).toFixed(2);
            colorCache.verticalColors[col] = `hsla(${theme.gridHue + 30}, 100%, 50%, ${alpha})`;
        }
        colorCache.shadowColorH = `hsla(${theme.gridHue}, 100%, 50%, 0.5)`;
        colorCache.shadowColorV = `hsla(${theme.gridHue + 30}, 100%, 50%, 0.4)`;
    }

    ctx.save();
    ctx.lineWidth = 1;

    // Only enable shadows on high-performance devices
    if (perfSettings.enableShadows) {
        ctx.shadowBlur = 6;
        ctx.shadowColor = colorCache.shadowColorH;
    }

    // Draw horizontal lines - batch by color groups
    for (let row = 0; row < rows; row++) {
        ctx.strokeStyle = colorCache.horizontalColors[row];
        ctx.beginPath();
        const pointRow = points[row];
        ctx.moveTo(pointRow[0].x, pointRow[0].y);
        for (let col = 1; col < cols; col++) {
            ctx.lineTo(pointRow[col].x, pointRow[col].y);
        }
        ctx.stroke();
    }

    // Update shadow color for vertical lines
    if (perfSettings.enableShadows) {
        ctx.shadowColor = colorCache.shadowColorV;
    }

    // Draw vertical lines
    for (let col = 0; col < cols; col++) {
        ctx.strokeStyle = colorCache.verticalColors[col];
        ctx.beginPath();
        ctx.moveTo(points[0][col].x, points[0][col].y);
        for (let row = 1; row < rows; row++) {
            ctx.lineTo(points[row][col].x, points[row][col].y);
        }
        ctx.stroke();
    }

    // Draw intersection glow points only on high-perf devices
    if (perfSettings.drawIntersections) {
        ctx.shadowBlur = 0;
        const glowColor = `hsla(${theme.gridHue}, 100%, 70%, 0.3)`;
        ctx.fillStyle = glowColor;

        for (let row = 0; row < rows; row += 2) {
            const pointRow = points[row];
            for (let col = 0; col < cols; col += 2) {
                const point = pointRow[col];
                const distortion = Math.abs(point.offsetX) + Math.abs(point.offsetY);

                if (distortion > 3) {
                    const glowSize = Math.min(distortion * 0.25, 3);
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, glowSize, 0, 6.283185);
                    ctx.fill();
                }
            }
        }
    }

    ctx.restore();
}

// Cached gradient for themed grid
let cachedHorizonGradient = null;
let cachedGradientHue = -1;
let cachedGradientHeight = 0;

/**
 * Original themed grid (kept for compatibility) - OPTIMIZED
 */
export function drawThemedGrid(ctx, canvas, wave = 1) {
    if (!ctx || !canvas) return;

    const theme = getCurrentTheme(wave);

    ctx.save();

    const now = Date.now();
    const pulse = Math.sin(now * 0.001) * 0.3 + 0.7;
    const hue = theme.gridHue + Math.sin(now * 0.0005) * 30;
    const alpha = (0.15 * pulse).toFixed(2);

    ctx.strokeStyle = `hsla(${hue | 0}, 100%, 50%, ${alpha})`;
    ctx.lineWidth = 1;

    // Only enable shadow on high-perf devices
    if (perfSettings.enableShadows) {
        ctx.shadowBlur = 6;
        ctx.shadowColor = `hsla(${hue | 0}, 100%, 50%, 0.4)`;
    }

    const gridSize = 60;
    const offset = (now * 0.02) % gridSize;
    const width = canvas.width;
    const height = canvas.height;
    const perspectiveFactor = 1 + (height - 400) / height * 0.5;
    const halfWidth = width / 2;

    // Batch all vertical lines into single path
    ctx.beginPath();
    for (let x = -gridSize; x < width + gridSize; x += gridSize) {
        const startX = x + offset;
        const endX = (x - halfWidth) * perspectiveFactor + halfWidth + offset;
        ctx.moveTo(startX, 0);
        ctx.lineTo(endX, height);
    }
    ctx.stroke();

    // Batch all horizontal lines into single path
    ctx.beginPath();
    const baseAlpha = 0.15 * pulse;
    ctx.strokeStyle = `hsla(${hue | 0}, 100%, 50%, ${(baseAlpha * 0.75).toFixed(2)})`;
    for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Cache horizon gradient
    if (cachedGradientHue !== theme.gridHue || cachedGradientHeight !== height) {
        cachedHorizonGradient = ctx.createLinearGradient(0, height - 150, 0, height);
        cachedHorizonGradient.addColorStop(0, 'transparent');
        cachedHorizonGradient.addColorStop(0.5, `hsla(${theme.gridHue}, 100%, 50%, 0.25)`);
        cachedHorizonGradient.addColorStop(1, `hsla(${theme.gridHue + 60}, 100%, 50%, 0.35)`);
        cachedGradientHue = theme.gridHue;
        cachedGradientHeight = height;
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = cachedHorizonGradient;
    ctx.fillRect(0, height - 150, width, 150);

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
