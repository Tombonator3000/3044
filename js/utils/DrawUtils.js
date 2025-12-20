/**
 * Geometry 3044 - Drawing Utilities
 * Reusable canvas drawing functions to reduce code duplication
 */

import { config, CONFIG } from '../config.js';

/**
 * Apply glow effect to context
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} color - Glow color
 * @param {number} blur - Blur amount (default from config)
 */
export function applyGlow(ctx, color, blur = config.constants.defaultGlowIntensity) {
    ctx.shadowBlur = blur;
    ctx.shadowColor = color;
}

/**
 * Clear glow effect from context
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 */
export function clearGlow(ctx) {
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
}

/**
 * Draw a glowing circle (common pattern in game)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - Center X
 * @param {number} y - Center Y
 * @param {number} radius - Circle radius
 * @param {string} color - Fill color
 * @param {Object} options - Optional settings
 */
export function drawGlowingCircle(ctx, x, y, radius, color, options = {}) {
    const {
        glow = true,
        glowBlur = config.constants.defaultGlowIntensity,
        alpha = 1,
        innerColor = '#ffffff',
        innerRadius = radius * 0.4
    } = options;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (glow) {
        applyGlow(ctx, color, glowBlur);
    }

    // Outer circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, config.constants.TWO_PI);
    ctx.fill();

    // Inner bright core
    if (innerColor && innerRadius > 0) {
        clearGlow(ctx);
        ctx.fillStyle = innerColor;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(x, y, innerRadius, 0, config.constants.TWO_PI);
        ctx.fill();
    }

    ctx.restore();
}

/**
 * Draw a trail/motion line (used for bullets, sparks)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x1 - Start X
 * @param {number} y1 - Start Y
 * @param {number} x2 - End X
 * @param {number} y2 - End Y
 * @param {string} color - Line color
 * @param {Object} options - Optional settings
 */
export function drawTrail(ctx, x1, y1, x2, y2, color, options = {}) {
    const {
        lineWidth = 2,
        alpha = 0.5,
        glow = false,
        glowBlur = 10
    } = options;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    if (glow) {
        applyGlow(ctx, color, glowBlur);
    }

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.restore();
}

/**
 * Draw a star shape (used for power-ups, effects)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} innerRadius - Inner radius
 * @param {number} outerRadius - Outer radius
 * @param {number} points - Number of points
 * @param {Object} options - Optional settings
 */
export function drawStar(ctx, cx, cy, innerRadius, outerRadius, points, options = {}) {
    const {
        fill = true,
        stroke = true,
        fillColor = '#ffffff',
        strokeColor = '#ffffff',
        lineWidth = 2,
        rotation = 0
    } = options;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI * i) / points - config.constants.HALF_PI;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();

    if (fill) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    if (stroke) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }

    ctx.restore();
}

/**
 * Draw a diamond shape
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} width - Diamond width
 * @param {number} height - Diamond height
 * @param {Object} options - Optional settings
 */
export function drawDiamond(ctx, cx, cy, width, height, options = {}) {
    const {
        fill = true,
        stroke = true,
        fillColor = '#ffffff',
        strokeColor = '#ffffff',
        lineWidth = 2,
        rotation = 0
    } = options;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    ctx.beginPath();
    ctx.moveTo(0, -height / 2);
    ctx.lineTo(width / 2, 0);
    ctx.lineTo(0, height / 2);
    ctx.lineTo(-width / 2, 0);
    ctx.closePath();

    if (fill) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    if (stroke) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }

    ctx.restore();
}

/**
 * Draw glowing text (common for HUD elements)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} text - Text to draw
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {Object} options - Optional settings
 */
export function drawGlowingText(ctx, text, x, y, options = {}) {
    const {
        font = 'bold 16px "Courier New", monospace',
        fillColor = '#ffffff',
        strokeColor = null,
        strokeWidth = 3,
        glow = true,
        glowColor = fillColor,
        glowBlur = 10,
        align = 'center',
        baseline = 'middle',
        alpha = 1
    } = options;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;

    if (glow) {
        applyGlow(ctx, glowColor, glowBlur);
    }

    // Draw stroke first if specified
    if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.strokeText(text, x, y);
    }

    // Draw fill
    ctx.fillStyle = fillColor;
    ctx.fillText(text, x, y);

    ctx.restore();
}

/**
 * Draw a shockwave ring (explosion effect)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - Center X
 * @param {number} y - Center Y
 * @param {number} radius - Ring radius
 * @param {string} color - Ring color
 * @param {Object} options - Optional settings
 */
export function drawShockwave(ctx, x, y, radius, color, options = {}) {
    const {
        lineWidth = 3,
        alpha = 1
    } = options;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, config.constants.TWO_PI);
    ctx.stroke();
    ctx.restore();
}

/**
 * Calculate pulse value for animations
 * @param {number} speed - Pulse speed (default from config)
 * @param {number} offset - Phase offset
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Pulse value between min and max
 */
export function getPulseValue(speed = config.constants.defaultPulseSpeed, offset = 0, min = 0.7, max = 1.0) {
    const range = (max - min) / 2;
    const mid = min + range;
    return mid + Math.sin(Date.now() * speed + offset) * range;
}

/**
 * Hex color to RGBA string
 * @param {string} hex - Hex color (#RRGGBB or #RGB)
 * @param {number} alpha - Alpha value (0-1)
 * @returns {string} RGBA color string
 */
export function hexToRgba(hex, alpha = 1) {
    // Remove # if present
    hex = hex.replace('#', '');

    // Handle short format (#RGB)
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Lighten a hex color
 * @param {string} hex - Hex color
 * @param {number} amount - Lighten amount (0-1)
 * @returns {string} Lightened hex color
 */
export function lightenColor(hex, amount = 0.2) {
    hex = hex.replace('#', '');

    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    r = Math.min(255, Math.floor(r + (255 - r) * amount));
    g = Math.min(255, Math.floor(g + (255 - g) * amount));
    b = Math.min(255, Math.floor(b + (255 - b) * amount));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
