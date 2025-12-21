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
    gridState.gridCols = Math.ceil(canvas.logicalWidth / gridState.cellSize) + 2;
    gridState.gridRows = Math.ceil(canvas.logicalHeight / gridState.cellSize) + 2;
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
 * Enhanced for Geometry Wars-style distortion
 *
 * @param {number} x - X position of impact
 * @param {number} y - Y position of impact
 * @param {number} force - Strength of the distortion (default 50, use 100+ for big explosions)
 * @param {number} radius - How far the distortion spreads (default 150)
 */
export function addGridImpact(x, y, force = 50, radius = 150) {
    // Limit number of concurrent impacts for performance
    if (gridState.impacts.length >= perfSettings.maxImpacts) {
        gridState.impacts.shift(); // Remove oldest
    }

    // Enhanced impact with stronger wave propagation
    gridState.impacts.push({
        x,
        y,
        force: force * 1.5, // Boost force for more visible effect
        radius,
        radiusSq: radius * radius, // Pre-compute for faster distance checks
        time: 0,
        maxTime: Math.min(80, 60 + force / 10) // Longer duration for bigger impacts
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
    // Enhanced for Geometry Wars-style grid distortion
    const dampening = 0.94;          // Slightly less dampening for longer ripples
    const springStrength = 0.025;    // Softer springs for more fluid motion
    const neighborInfluence = 0.015; // Stronger neighbor influence for wave propagation
    const maxOffset = 45;            // Increased max offset for more dramatic distortion
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

// Background gradient cache
const bgCache = {
    gradient: null,
    lastThemeKey: null,
    lastHeight: 0
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

// NOTE: drawThemedGrid was removed during code audit - never called
// The game uses drawWavingGrid for the animated Geometry Wars-style grid

// Simplified background gradient with caching
export function drawBackground(ctx, canvas, wave = 1) {
    if (!ctx || !canvas) return;

    const theme = getCurrentTheme(wave);
    const themeKey = `${theme.bgStart}-${theme.bgEnd}`;
    const height = canvas.logicalHeight;

    // Only recreate gradient if theme or height changed
    if (bgCache.lastThemeKey !== themeKey || bgCache.lastHeight !== height) {
        bgCache.gradient = ctx.createLinearGradient(0, 0, 0, height);
        bgCache.gradient.addColorStop(0, theme.bgStart);
        bgCache.gradient.addColorStop(0.3, theme.bgEnd);
        bgCache.gradient.addColorStop(0.7, '#000011');
        bgCache.gradient.addColorStop(1, '#000000');
        bgCache.lastThemeKey = themeKey;
        bgCache.lastHeight = height;
    }

    ctx.fillStyle = bgCache.gradient;
    ctx.fillRect(0, 0, canvas.logicalWidth, canvas.logicalHeight);
}

// NOTE: resetGrid was removed during code audit - never called
// The grid auto-initializes when needed via initGrid()
