/**
 * Geometry 3044 - ParticleSystem Module
 * Handles all particle effects: explosions, trails, sparks, etc.
 * OPTIMIZED for performance
 */

import { CONFIG, getCurrentTheme } from '../config.js';
import { GameSettings } from '../ui/MenuManager.js';

// ============================================
// GEOMETRY WARS-STYLE COLOR UTILITIES
// ============================================

/**
 * Convert HSV to RGB hex color
 * HSV allows creating vivid neon colors by keeping high saturation and value
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-1)
 * @param {number} v - Value/Brightness (0-1)
 * @returns {string} Hex color string
 */
function hsvToHex(h, s, v) {
    h = h % 360;
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;

    let r, g, b;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }

    const toHex = (n) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generate a random vibrant neon color using HSV
 * High saturation (0.8-1.0) and high value (0.9-1.0) for neon look
 * @returns {string} Hex color string
 */
function randomNeonColor() {
    const hue = Math.random() * 360;
    const saturation = 0.8 + Math.random() * 0.2; // 0.8-1.0
    const value = 0.9 + Math.random() * 0.1; // 0.9-1.0
    return hsvToHex(hue, saturation, value);
}

/**
 * Get a random color near a base hue for colorful explosions
 * Interpolates between two nearby colors
 * @param {number} baseHue - Base hue (0-360)
 * @param {number} spread - Hue spread range (default 40)
 * @returns {string} Hex color string
 */
function randomNeonColorNear(baseHue, spread = 40) {
    const hue = baseHue + (Math.random() - 0.5) * spread;
    const saturation = 0.85 + Math.random() * 0.15;
    const value = 0.95 + Math.random() * 0.05;
    return hsvToHex(hue, saturation, value);
}

/**
 * Convert hex color to HSV
 * @param {string} hex - Hex color string
 * @returns {{h: number, s: number, v: number}} HSV object
 */
function hexToHsv(hex) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = (num >> 16) / 255;
    const g = ((num >> 8) & 0xFF) / 255;
    const b = (num & 0xFF) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    let h = 0;
    if (d !== 0) {
        if (max === r) h = ((g - b) / d) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
        if (h < 0) h += 360;
    }

    const s = max === 0 ? 0 : d / max;
    const v = max;

    return { h, s, v };
}

/**
 * Interpolate between two hex colors
 * @param {string} color1 - First hex color
 * @param {string} color2 - Second hex color
 * @param {number} t - Interpolation factor (0-1)
 * @returns {string} Interpolated hex color
 */
function lerpColor(color1, color2, t) {
    const num1 = parseInt(color1.replace('#', ''), 16);
    const num2 = parseInt(color2.replace('#', ''), 16);

    const r1 = num1 >> 16, g1 = (num1 >> 8) & 0xFF, b1 = num1 & 0xFF;
    const r2 = num2 >> 16, g2 = (num2 >> 8) & 0xFF, b2 = num2 & 0xFF;

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Performance settings for particles
const particlePerfSettings = {
    enableShadows: true,
    reducedParticles: false,
    intensityMultiplier: 1
};

const particleIntensityMap = {
    low: 0.4,
    medium: 0.7,
    high: 1
};

const resolveIntensityMultiplier = (level) => {
    if (typeof level === 'number') {
        return Math.max(0, Math.min(1, level));
    }

    return particleIntensityMap[level] ?? 1;
};

const getParticleCountMultiplier = () => {
    let multiplier = particlePerfSettings.intensityMultiplier;

    if (particlePerfSettings.reducedParticles) {
        multiplier *= 0.5;
    }

    return multiplier;
};

const getAdjustedCount = (baseCount) => {
    const multiplier = getParticleCountMultiplier();

    if (multiplier <= 0) {
        return 0;
    }

    return Math.max(1, Math.floor(baseCount * multiplier));
};

// Detect low-perf devices - only reduce on very low-end devices
const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
if (isMobileDevice || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2)) {
    particlePerfSettings.enableShadows = false;
    particlePerfSettings.reducedParticles = true;
}

particlePerfSettings.intensityMultiplier = resolveIntensityMultiplier(GameSettings.particleIntensity);

/**
 * Particle Class
 * Individual particle with physics and rendering
 * Enhanced with Geometry Wars-style line particles and motion blur
 */
class Particle {
    constructor() {
        this.reset();
        // Motion blur trail for line particles
        this.trail = [];
        this.maxTrail = 5;
    }

    reset(x = 0, y = 0, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || (Math.random() - 0.5) * 8;
        this.vy = options.vy || (Math.random() - 0.5) * 8;
        this.color = options.color || '#ffffff';
        this.size = options.size || Math.random() * 4 + 2;
        this.life = options.life || 60;
        this.maxLife = this.life;
        this.friction = options.friction || 0.98;
        this.gravity = options.gravity || 0;
        this.type = options.type || 'default';
        this.rotation = options.rotation || 0;
        this.rotationSpeed = options.rotationSpeed || 0;
        this.active = true;

        // Line particle specific properties
        this.length = options.length || 8;
        this.trail = [];
        this.maxTrail = options.maxTrail || 5;

        // Geometry Wars-style wall bouncing (default enabled for line/gwline particles)
        this.bounce = options.bounce !== undefined ? options.bounce :
            (this.type === 'gwline' || this.type === 'line' || this.type === 'spark');
        this.bounceDamping = options.bounceDamping || 0.8; // Energy loss on bounce

        return this;
    }

    update() {
        if (!this.active) return;

        // Store trail position for line particles with motion blur
        if (this.type === 'line' || this.type === 'gwline') {
            this.trail.unshift({ x: this.x, y: this.y, alpha: 1 });
            if (this.trail.length > this.maxTrail) this.trail.pop();
            // Update trail alpha
            for (let i = 0; i < this.trail.length; i++) {
                this.trail[i].alpha = 1 - (i / this.maxTrail);
            }
            // Line rotation follows velocity direction
            this.rotation = Math.atan2(this.vy, this.vx);
        }

        this.x += this.vx;
        this.y += this.vy;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;

        // Geometry Wars-style wall bouncing
        if (this.bounce) {
            const margin = this.size || 2;
            const width = CONFIG.canvas?.width || 800;
            const height = CONFIG.canvas?.height || 600;

            // Bounce off left/right walls
            if (this.x < margin) {
                this.x = margin;
                this.vx = -this.vx * this.bounceDamping;
            } else if (this.x > width - margin) {
                this.x = width - margin;
                this.vx = -this.vx * this.bounceDamping;
            }

            // Bounce off top/bottom walls
            if (this.y < margin) {
                this.y = margin;
                this.vy = -this.vy * this.bounceDamping;
            } else if (this.y > height - margin) {
                this.y = height - margin;
                this.vy = -this.vy * this.bounceDamping;
            }
        }

        // Only apply rotationSpeed for non-line particles
        if (this.type !== 'line' && this.type !== 'gwline') {
            this.rotation += this.rotationSpeed;
        }

        this.life--;

        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        const alpha = this.life / this.maxLife;
        const currentSize = this.size * (0.5 + alpha * 0.5);

        // Save context state for this particle
        ctx.save();
        ctx.globalAlpha = alpha;

        // Use data-driven lookup for particle rendering
        const renderer = Particle.renderers[this.type];
        if (renderer) {
            // Determine the second parameter based on renderer config:
            // 'alpha' = use alpha, 'size' = use this.size, default = use currentSize
            const param = renderer.param === 'alpha' ? alpha :
                          renderer.param === 'size' ? this.size : currentSize;
            renderer.fn.call(this, ctx, param);
        } else {
            this.drawDefault(ctx, currentSize);
        }

        // Restore context state after drawing
        ctx.restore();
    }

    drawDefault(ctx, size) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, 6.283185);
        ctx.fill();
    }

    drawScore(ctx, size) {
        ctx.font = `bold ${size}px "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = this.color;
        ctx.fillText(this.text || '+100', this.x, this.y);
    }

    drawSpark(ctx, size) {
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        const len = size * 3;  // Longer sparks

        // First layer: Solid spark with source-over for visibility
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = Math.max(3, size / 2);
        ctx.lineCap = 'round';

        if (particlePerfSettings.enableShadows) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
        }

        ctx.beginPath();
        ctx.moveTo(this.x - cos * len, this.y - sin * len);
        ctx.lineTo(this.x + cos * len, this.y + sin * len);
        ctx.stroke();
        ctx.restore();

        // Second layer: Additive glow
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = Math.max(5, size);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x - cos * len, this.y - sin * len);
        ctx.lineTo(this.x + cos * len, this.y + sin * len);
        ctx.stroke();
        ctx.restore();
    }

    drawTrail(ctx, size) {
        // Simple circle instead of gradient for performance
        ctx.fillStyle = this.color;
        ctx.globalAlpha *= 0.6;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 1.5, 0, 6.283185);
        ctx.fill();
    }

    drawExplosion(ctx, size) {
        // Simplified to circle for performance
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, 6.283185);
        ctx.fill();
    }

    drawGlow(ctx, size) {
        // Simple fading circle instead of expensive gradient
        ctx.fillStyle = this.color;
        ctx.globalAlpha *= 0.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 2, 0, 6.283185);
        ctx.fill();
    }

    drawDebris(ctx, size) {
        ctx.fillStyle = this.color;
        const halfSize = size / 2;
        // Simple rotation using canvas transform only when needed
        if (this.rotation !== 0) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.fillRect(-halfSize, -halfSize, size, size);
            ctx.restore();
        } else {
            ctx.fillRect(this.x - halfSize, this.y - halfSize, size, size);
        }
    }

    drawShockwave(ctx, size) {
        const alpha = this.life / this.maxLife;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3 * alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * (1 - alpha + 0.2), 0, 6.283185);
        ctx.stroke();
    }

    drawPixel(ctx, size) {
        const pixelSize = Math.max(2, size);
        ctx.fillStyle = this.color;
        const half = pixelSize / 2;
        ctx.fillRect(this.x - half, this.y - half, pixelSize, pixelSize);
    }

    drawRing(ctx, size) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, 6.283185);
        ctx.stroke();
    }

    drawLightning(ctx, size) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - size, this.y - size);
        ctx.lineTo(this.x, this.y);
        ctx.lineTo(this.x - size * 0.3, this.y + size * 0.3);
        ctx.lineTo(this.x + size, this.y + size);
        ctx.stroke();
    }

    drawFire(ctx, size) {
        // Simplified fire - just a colored circle
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, 6.283185);
        ctx.fill();
    }

    drawSmoke(ctx, size) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha *= 0.4;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, 6.283185);
        ctx.fill();
    }

    drawStar(ctx, size) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        // Simplified 4-pointed star
        const x = this.x;
        const y = this.y;
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size * 0.3, y - size * 0.3);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x + size * 0.3, y + size * 0.3);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size * 0.3, y + size * 0.3);
        ctx.lineTo(x - size, y);
        ctx.lineTo(x - size * 0.3, y - size * 0.3);
        ctx.closePath();
        ctx.fill();
    }

    // ============================================
    // NEW PARTICLE TYPES - Enhanced Effects
    // ============================================

    /**
     * Confetti particle - rotating colored paper/square
     * Great for celebrations, victories, power-ups
     */
    drawConfetti(ctx, size) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Simulate 3D rotation by scaling width
        const scaleX = Math.cos(this.rotation * 2) * 0.5 + 0.5;
        ctx.scale(scaleX, 1);

        ctx.fillStyle = this.color;
        const halfSize = size / 2;
        ctx.fillRect(-halfSize, -halfSize, size, size * 1.5);

        // Add shimmer highlight
        ctx.globalAlpha *= 0.5;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-halfSize, -halfSize, size * 0.3, size * 0.3);

        ctx.restore();
    }

    /**
     * Plasma particle - electric energy orb with pulsing glow
     * For shields, energy weapons, sci-fi effects
     */
    drawPlasma(ctx, size) {
        const pulse = Math.sin(this.life * 0.3) * 0.3 + 0.7;
        const currentSize = size * pulse;

        // Outer glow layer
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha *= 0.4;

        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, currentSize * 2
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize * 2, 0, 6.283185);
        ctx.fill();
        ctx.restore();

        // Core
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize, 0, 6.283185);
        ctx.fill();

        // Hot white center
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha *= 0.8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize * 0.4, 0, 6.283185);
        ctx.fill();
    }

    /**
     * Vortex particle - spiraling motion with trail
     * For black holes, portals, suction effects
     */
    drawVortex(ctx, size) {
        const spiralAngle = this.rotation + (this.life * 0.2);
        const spiralRadius = size * (1 + Math.sin(this.life * 0.1) * 0.3);

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Draw spiral trail
        ctx.strokeStyle = this.color;
        ctx.lineWidth = Math.max(1, size / 3);
        ctx.lineCap = 'round';
        ctx.beginPath();

        for (let i = 0; i < 6; i++) {
            const angle = spiralAngle + (i * 0.5);
            const r = spiralRadius * (1 - i * 0.15);
            const px = this.x + Math.cos(angle) * r;
            const py = this.y + Math.sin(angle) * r;

            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
            ctx.globalAlpha = (1 - i / 6) * 0.8;
        }
        ctx.stroke();

        // Center point
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 0.3, 0, 6.283185);
        ctx.fill();

        ctx.restore();
    }

    /**
     * Bubble particle - translucent sphere with highlight
     * For underwater, healing, magical effects
     */
    drawBubble(ctx, size) {
        const wobble = Math.sin(this.life * 0.2) * size * 0.1;
        const currentSize = size + wobble;

        // Outer bubble
        ctx.save();
        ctx.globalAlpha *= 0.3;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize, 0, 6.283185);
        ctx.fill();

        // Bubble rim
        ctx.globalAlpha = 1;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize, 0, 6.283185);
        ctx.stroke();

        // Highlight reflection
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha *= 0.7;
        ctx.beginPath();
        ctx.arc(
            this.x - currentSize * 0.3,
            this.y - currentSize * 0.3,
            currentSize * 0.25,
            0, 6.283185
        );
        ctx.fill();

        ctx.restore();
    }

    /**
     * Ember particle - glowing hot particle that fades
     * For fire trails, exhaust, heat effects
     */
    drawEmber(ctx, size) {
        const flicker = Math.random() * 0.3 + 0.7;

        // Outer glow
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha *= 0.5 * flicker;

        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, size * 3
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 3, 0, 6.283185);
        ctx.fill();
        ctx.restore();

        // Hot core
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 0.5, 0, 6.283185);
        ctx.fill();

        // Outer color
        ctx.fillStyle = this.color;
        ctx.globalAlpha *= 0.8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, 6.283185);
        ctx.fill();
    }

    /**
     * Snow particle - gently falling with slight drift
     * For weather effects, cold themes
     */
    drawSnow(ctx, size) {
        // Soft white circle with slight blue tint
        ctx.save();
        ctx.globalAlpha *= 0.8;

        // Outer glow
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, size
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, 6.283185);
        ctx.fill();

        ctx.restore();
    }

    /**
     * Disintegration particle - pixelated breaking apart
     * For enemy deaths, dissolve effects
     */
    drawDisintegrate(ctx, size) {
        const pixelSize = Math.max(2, size);
        const offset = Math.sin(this.life * 0.5) * 2;

        ctx.fillStyle = this.color;

        // Draw scattered pixels
        const half = pixelSize / 2;
        ctx.fillRect(this.x - half + offset, this.y - half, pixelSize, pixelSize);

        // Additional scattered pixel for broken look
        if (this.life % 3 === 0) {
            ctx.globalAlpha *= 0.6;
            ctx.fillRect(
                this.x - half - pixelSize,
                this.y - half + offset,
                pixelSize * 0.7,
                pixelSize * 0.7
            );
        }
    }

    /**
     * Comet particle - fast moving with elongated tail
     * For projectiles, speed effects
     */
    drawComet(ctx, size) {
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const tailLength = Math.min(size * 4, size + speed * 2);
        const angle = Math.atan2(this.vy, this.vx);

        ctx.save();

        // Tail gradient
        const gradient = ctx.createLinearGradient(
            this.x - Math.cos(angle) * tailLength,
            this.y - Math.sin(angle) * tailLength,
            this.x,
            this.y
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.7, this.color);
        gradient.addColorStop(1, '#ffffff');

        // Draw tail
        ctx.strokeStyle = gradient;
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x - Math.cos(angle) * tailLength, this.y - Math.sin(angle) * tailLength);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();

        // Bright head
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 0.6, 0, 6.283185);
        ctx.fill();

        ctx.restore();
    }

    /**
     * Geometry Wars-style LINE particle with motion blur trail
     * This is the signature look of Geometry Wars explosions
     * FIXED: Use source-over as base with bright colors, then add glow layer
     */
    drawLine(ctx, alpha) {
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        // Minimum length even when slow, so particles remain visible
        const dynamicLength = Math.max(12, this.length * (0.5 + speed * 0.25));
        // Ensure minimum alpha for visibility - higher minimum
        const visibleAlpha = Math.max(0.5, alpha);

        // Draw at particle's actual position (no translate needed for simple drawing)
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        const halfLen = dynamicLength / 2;

        // Calculate line endpoints
        const x1 = this.x - cos * halfLen;
        const y1 = this.y - sin * halfLen;
        const x2 = this.x + cos * halfLen;
        const y2 = this.y + sin * halfLen;

        // Draw motion blur trail using direct coordinates
        if (this.trail && this.trail.length > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'source-over';
            for (let i = 0; i < this.trail.length; i++) {
                const t = this.trail[i];
                const trailHalfLen = halfLen * 0.6;
                const tx1 = t.x - cos * trailHalfLen;
                const ty1 = t.y - sin * trailHalfLen;
                const tx2 = t.x + cos * trailHalfLen;
                const ty2 = t.y + sin * trailHalfLen;

                ctx.globalAlpha = visibleAlpha * t.alpha * 0.5;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(tx1, ty1);
                ctx.lineTo(tx2, ty2);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Main line particle - Draw with source-over first for solid visibility
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = visibleAlpha;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';

        // Shadow/glow effect
        if (particlePerfSettings.enableShadows) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
        }

        // Draw the main colored line
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // White/bright core for extra brightness
        ctx.globalAlpha = visibleAlpha * 0.95;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.restore();

        // ADDITIVE GLOW LAYER on top
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = visibleAlpha * 0.6;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
    }

    /**
     * Geometry Wars central GLOW effect
     * Creates a radial gradient glow at explosion center
     * FIXED: Draw solid base first, then add glow layer
     */
    drawGWGlow(ctx, alpha) {
        const currentSize = this.size * (2 - alpha);
        const visibleAlpha = Math.max(0.5, alpha);

        // First layer: Solid fill with source-over for guaranteed visibility
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = visibleAlpha * 0.8;

        // Create radial gradient for glow
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, currentSize
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.2, this.color);
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
        ctx.fill();

        // Bright white core
        ctx.globalAlpha = visibleAlpha;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize * 0.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Second layer: Additive glow for extra brightness
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = visibleAlpha * 0.5;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /**
     * Geometry Wars SHOCKWAVE ring
     * Expanding ring that fades out
     * FIXED: Draw solid ring first, then add glow
     */
    drawGWShockwave(ctx, alpha) {
        // Radius expands as life decreases
        const progress = 1 - alpha;
        const maxRadius = this.size;
        const radius = 5 + (maxRadius - 5) * progress;
        const visibleAlpha = Math.max(0.4, alpha);

        // First layer: Solid ring with source-over
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = visibleAlpha * 0.9;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = Math.max(3, 6 * alpha);

        if (particlePerfSettings.enableShadows) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = this.color;
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // White inner ring
        ctx.globalAlpha = visibleAlpha * 0.7;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1, 3 * alpha);
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();

        // Second layer: Additive glow ring
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = visibleAlpha * 0.4;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = Math.max(6, 12 * alpha);
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

/**
 * Data-driven renderer lookup table for particle types.
 * Maps particle type names to their rendering configuration.
 * - fn: The draw method to call
 * - param: What to pass as second argument ('alpha', 'size', or undefined for currentSize)
 *
 * This replaces the large switch statement for cleaner, more maintainable dispatch.
 * Adding a new particle type only requires adding an entry here and the draw method.
 */
Particle.renderers = {
    // Standard particle types (receive currentSize)
    spark:      { fn: Particle.prototype.drawSpark },
    trail:      { fn: Particle.prototype.drawTrail },
    explosion:  { fn: Particle.prototype.drawExplosion },
    glow:       { fn: Particle.prototype.drawGlow },
    debris:     { fn: Particle.prototype.drawDebris },
    shockwave:  { fn: Particle.prototype.drawShockwave },
    pixel:      { fn: Particle.prototype.drawPixel },
    ring:       { fn: Particle.prototype.drawRing },
    lightning:  { fn: Particle.prototype.drawLightning },
    fire:       { fn: Particle.prototype.drawFire },
    smoke:      { fn: Particle.prototype.drawSmoke },
    star:       { fn: Particle.prototype.drawStar },

    // NEW: Enhanced particle types for varied effects
    confetti:     { fn: Particle.prototype.drawConfetti },
    plasma:       { fn: Particle.prototype.drawPlasma },
    vortex:       { fn: Particle.prototype.drawVortex },
    bubble:       { fn: Particle.prototype.drawBubble },
    ember:        { fn: Particle.prototype.drawEmber },
    snow:         { fn: Particle.prototype.drawSnow },
    disintegrate: { fn: Particle.prototype.drawDisintegrate },
    comet:        { fn: Particle.prototype.drawComet },

    // Special case: score uses this.size instead of currentSize
    score:      { fn: Particle.prototype.drawScore, param: 'size' },
    // Geometry Wars-style particles (receive alpha instead of size)
    line:       { fn: Particle.prototype.drawLine, param: 'alpha' },
    gwline:     { fn: Particle.prototype.drawLine, param: 'alpha' },
    gwglow:     { fn: Particle.prototype.drawGWGlow, param: 'alpha' },
    gwshockwave: { fn: Particle.prototype.drawGWShockwave, param: 'alpha' }
};

/**
 * ParticleSystem Class
 * Manages particle pool and effect creation
 */
export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = CONFIG.particles.maxCount;
        this.poolIndex = 0;
        this._activeCount = 0; // Cached count for performance
        this.intensityMultiplier = 1;
        this.nullParticle = {
            active: false,
            reset() {
                return this;
            }
        };

        // Pre-allocate particle pool
        for (let i = 0; i < this.maxParticles; i++) {
            const particle = new Particle();
            particle.active = false; // CRITICAL: Start inactive so getParticle() can find them
            this.particles.push(particle);
        }
    }

    /**
     * Get a particle from the pool
     */
    getParticle() {
        if (this.intensityMultiplier <= 0) {
            return this.nullParticle;
        }

        if (this.intensityMultiplier < 1 && Math.random() > this.intensityMultiplier) {
            return this.nullParticle;
        }

        // Find inactive particle
        for (let i = 0; i < this.particles.length; i++) {
            const idx = (this.poolIndex + i) % this.particles.length;
            if (!this.particles[idx].active) {
                this.poolIndex = (idx + 1) % this.particles.length;
                this._activeCount++; // Track new activation
                return this.particles[idx];
            }
        }

        // If all active, reuse oldest (count stays the same)
        this.poolIndex = (this.poolIndex + 1) % this.particles.length;
        return this.particles[this.poolIndex];
    }

    setIntensity(level) {
        this.intensityMultiplier = resolveIntensityMultiplier(level);
        particlePerfSettings.intensityMultiplier = this.intensityMultiplier;
    }

    /**
     * Emit particles at a position
     */
    emit(x, y, count, options = {}) {
        const adjustedCount = getAdjustedCount(count);
        for (let i = 0; i < adjustedCount; i++) {
            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: options.vx !== undefined ? options.vx : (Math.random() - 0.5) * (options.speed || 8),
                vy: options.vy !== undefined ? options.vy : (Math.random() - 0.5) * (options.speed || 8),
                color: options.color || '#ffffff',
                size: options.size || Math.random() * 4 + 2,
                life: options.life || 60,
                friction: options.friction || 0.98,
                gravity: options.gravity || 0,
                type: options.type || 'default',
                rotationSpeed: options.rotationSpeed || 0
            });
        }
    }

    /**
     * Create explosion effect
     */
    explosion(x, y, color = '#ff6600', count = 20, power = 1) {
        const adjustedCount = getAdjustedCount(count);
        for (let i = 0; i < adjustedCount; i++) {
            const angle = (Math.PI * 2 * i) / adjustedCount + Math.random() * 0.3;
            const speed = (4 + Math.random() * 8) * power;
            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: 3 + Math.random() * 4,
                life: 40 + Math.random() * 30,
                friction: 0.96,
                type: Math.random() > 0.5 ? 'explosion' : 'default'
            });
        }
    }

    /**
     * Create enemy death effect
     */
    enemyDeath(x, y, color, sides = 4) {
        // Main explosion
        this.explosion(x, y, color, 15, 1);

        // Debris pieces
        for (let i = 0; i < sides; i++) {
            const angle = (Math.PI * 2 * i) / sides;
            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * (3 + Math.random() * 3),
                vy: Math.sin(angle) * (3 + Math.random() * 3),
                color: color,
                size: 6 + Math.random() * 4,
                life: 60,
                friction: 0.97,
                gravity: 0.05,
                type: 'debris',
                rotationSpeed: (Math.random() - 0.5) * 0.3
            });
        }
    }

    /**
     * Create player death effect
     */
    playerDeath(x, y) {
        const playerColor = CONFIG.colors.player;

        // Large explosion
        this.explosion(x, y, playerColor, 30, 1.5);

        // Ring of sparks
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 * i) / 16;
            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * 10,
                vy: Math.sin(angle) * 10,
                color: playerColor,
                size: 4,
                life: 50,
                friction: 0.94,
                type: 'spark'
            });
        }

        // Glow effect
        const glowParticle = this.getParticle();
        glowParticle.reset(x, y, {
            vx: 0,
            vy: 0,
            color: '#ffffff',
            size: 30,
            life: 30,
            friction: 1,
            type: 'glow'
        });
    }

    /**
     * Create bullet trail effect
     */
    bulletTrail(x, y, color) {
        const particle = this.getParticle();
        particle.reset(x, y, {
            vx: (Math.random() - 0.5) * 1,
            vy: (Math.random() - 0.5) * 1,
            color: color,
            size: 2,
            life: 15,
            friction: 0.95,
            type: 'trail'
        });
    }

    /**
     * Create spark effect
     */
    sparks(x, y, color, count = 5) {
        const adjustedCount = getAdjustedCount(count);
        for (let i = 0; i < adjustedCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: 2 + Math.random() * 2,
                life: 20 + Math.random() * 20,
                friction: 0.96,
                type: 'spark'
            });
        }
    }

    /**
     * Create power-up collect effect
     */
    powerUpCollect(x, y, color) {
        // Inward spiral
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const particle = this.getParticle();
            particle.reset(x + Math.cos(angle) * 30, y + Math.sin(angle) * 30, {
                vx: -Math.cos(angle) * 3,
                vy: -Math.sin(angle) * 3,
                color: color,
                size: 4,
                life: 25,
                friction: 0.9,
                type: 'glow'
            });
        }
    }

    /**
     * Create bomb explosion effect
     */
    bombExplosion(x, y, radius = 150, wave = 1) {
        const theme = getCurrentTheme(wave);

        // Massive ring expansion
        for (let ring = 0; ring < 3; ring++) {
            const ringDelay = ring * 5;
            const particleCount = 24 - ring * 4;

            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 * i) / particleCount;
                const speed = (radius / 15) * (1 - ring * 0.2);
                const particle = this.getParticle();
                particle.reset(x, y, {
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: ring === 0 ? '#ffffff' : (ring === 1 ? theme.primary : theme.secondary),
                    size: 6 - ring,
                    life: 60 - ring * 10,
                    friction: 0.97,
                    type: ring === 0 ? 'glow' : 'spark'
                });
            }
        }

        // Central flash
        const flash = this.getParticle();
        flash.reset(x, y, {
            vx: 0,
            vy: 0,
            color: '#ffffff',
            size: radius / 3,
            life: 20,
            friction: 1,
            type: 'glow'
        });
    }

    /**
     * Create boss death effect
     */
    bossDeath(x, y, color) {
        // Multiple explosions
        for (let i = 0; i < 5; i++) {
            const offsetX = (Math.random() - 0.5) * 60;
            const offsetY = (Math.random() - 0.5) * 60;
            this.explosion(x + offsetX, y + offsetY, color, 25, 1.5);
        }

        // Massive debris
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * (5 + Math.random() * 8),
                vy: Math.sin(angle) * (5 + Math.random() * 8),
                color: color,
                size: 8 + Math.random() * 8,
                life: 90,
                friction: 0.98,
                gravity: 0.02,
                type: 'debris',
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
    }

    /**
     * Update all particles - OPTIMIZED with chunk processing
     * Processes particles in chunks to be more cache-friendly
     */
    update() {
        // Early exit if no active particles
        if (this._activeCount === 0) return;

        const particles = this.particles;
        const len = particles.length;
        let activeCount = 0;

        // Process in chunks of 4 for better cache utilization (SIMD-like)
        const chunkSize = 4;
        const chunks = Math.floor(len / chunkSize);

        // Process full chunks
        for (let c = 0; c < chunks; c++) {
            const base = c * chunkSize;
            const p0 = particles[base];
            const p1 = particles[base + 1];
            const p2 = particles[base + 2];
            const p3 = particles[base + 3];

            // Update active particles in chunk
            if (p0.active) { p0.update(); if (p0.active) activeCount++; }
            if (p1.active) { p1.update(); if (p1.active) activeCount++; }
            if (p2.active) { p2.update(); if (p2.active) activeCount++; }
            if (p3.active) { p3.update(); if (p3.active) activeCount++; }
        }

        // Process remaining particles
        for (let i = chunks * chunkSize; i < len; i++) {
            const particle = particles[i];
            if (particle.active) {
                particle.update();
                if (particle.active) activeCount++;
            }
        }

        this._activeCount = activeCount;
    }

    /**
     * Draw all active particles - OPTIMIZED with batch rendering
     * Groups particles by type to minimize context state changes
     */
    draw(ctx) {
        // Early exit if no active particles
        if (this._activeCount === 0) return;

        ctx.save();

        // CRITICAL: Reset ALL context state to ensure particles are visible
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
        ctx.lineJoin = 'miter';
        ctx.lineCap = 'butt';
        ctx.miterLimit = 10;
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.filter = 'none';
        ctx.imageSmoothingEnabled = true;

        // Use batched rendering for better performance
        if (this._activeCount > 50) {
            this._drawBatched(ctx);
        } else {
            // For small counts, direct rendering is faster
            this._drawDirect(ctx);
        }

        ctx.restore();
    }

    /**
     * Direct particle rendering - used for small particle counts
     * @private
     */
    _drawDirect(ctx) {
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            if (particle.active) {
                ctx.globalAlpha = 1;
                ctx.globalCompositeOperation = 'source-over';
                particle.draw(ctx);
            }
        }
    }

    /**
     * Batched particle rendering - groups by type for fewer context switches
     * Particles using 'lighter' blend mode are drawn last for proper glow
     * @private
     */
    _drawBatched(ctx) {
        // Batch particles by rendering requirements
        const normalBatch = [];
        const glowBatch = [];  // Types that use additive blending

        const glowTypes = new Set(['gwline', 'line', 'gwglow', 'gwshockwave', 'plasma', 'ember', 'vortex']);

        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            if (particle.active) {
                if (glowTypes.has(particle.type)) {
                    glowBatch.push(particle);
                } else {
                    normalBatch.push(particle);
                }
            }
        }

        // Draw normal particles first (source-over)
        ctx.globalCompositeOperation = 'source-over';
        for (let i = 0; i < normalBatch.length; i++) {
            ctx.globalAlpha = 1;
            normalBatch[i].draw(ctx);
        }

        // Draw glow particles last (they use lighter blending internally)
        for (let i = 0; i < glowBatch.length; i++) {
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
            glowBatch[i].draw(ctx);
        }
    }

    /**
     * Clear all particles
     */
    clear() {
        for (let particle of this.particles) {
            particle.active = false;
        }
        this._activeCount = 0;
    }

    /**
     * Get active particle count (cached for performance)
     */
    getActiveCount() {
        return this._activeCount;
    }

    /**
     * Get stats for debugging
     */
    getStats() {
        return {
            total: this.particles.length,
            active: this.getActiveCount(),
            maxAllowed: this.maxParticles,
            utilizationPercent: Math.round((this.getActiveCount() / this.maxParticles) * 100)
        };
    }

    // ============================================
    // ADDITIONAL METHODS FROM ORIGINAL (Phase 3)
    // ============================================

    /**
     * Alias methods for compatibility with original API
     */
    addParticle(options) {
        const particle = this.getParticle();
        particle.reset(options.x || 0, options.y || 0, {
            vx: options.vx || (Math.random() - 0.5) * 4,
            vy: options.vy || (Math.random() - 0.5) * 4,
            life: options.life || 30,
            size: options.size || 3,
            color: options.color || '#ffffff',
            type: options.type || 'default',
            gravity: options.gravity || 0,
            friction: options.friction || 0.98,
            rotationSpeed: options.rotationSpeed || 0
        });
    }

    addExplosion(x, y, color = '#ff6600', count = 15, options = {}) {
        const speed = options.speed || 6;
        const life = options.life || 30;
        const size = options.size || 4;
        const adjustedCount = getAdjustedCount(count);

        for (let i = 0; i < adjustedCount; i++) {
            const angle = (Math.PI * 2 * i) / adjustedCount + Math.random() * 0.5;
            const velocity = speed * (0.5 + Math.random() * 0.5);

            this.addParticle({
                x: x,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                life: life + Math.random() * 20,
                size: size * (0.5 + Math.random() * 0.5),
                color: color,
                type: 'explosion',
                gravity: 0.1,
                friction: 0.96
            });
        }

        // Add bright center flash
        this.addParticle({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            life: 10,
            size: size * 3,
            color: '#ffffff',
            type: 'glow'
        });
    }

    addSparkle(x, y, color = '#ffff00', count = 5) {
        const adjustedCount = getAdjustedCount(count);
        for (let i = 0; i < adjustedCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;

            this.addParticle({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                life: 20 + Math.random() * 20,
                size: 2 + Math.random() * 2,
                color: color,
                type: 'spark',
                gravity: -0.05,
                friction: 0.99
            });
        }
    }

    addTrail(x, y, color = '#00ffff', size = 3) {
        this.addParticle({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 0.5,
            vy: Math.random() * 0.5,
            life: 15,
            size: size,
            color: color,
            type: 'trail',
            friction: 0.95
        });
    }

    addPowerUpCollect(x, y, color = '#00ff00') {
        // Ring of particles expanding outward
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            this.addParticle({
                x: x,
                y: y,
                vx: Math.cos(angle) * 4,
                vy: Math.sin(angle) * 4,
                life: 30,
                size: 5,
                color: color,
                type: 'glow',
                friction: 0.92
            });
        }

        // Rising sparkles
        for (let i = 0; i < 8; i++) {
            this.addParticle({
                x: x + (Math.random() - 0.5) * 30,
                y: y,
                vx: (Math.random() - 0.5) * 2,
                vy: -3 - Math.random() * 3,
                life: 40,
                size: 3,
                color: '#ffffff',
                type: 'spark',
                gravity: -0.02
            });
        }
    }

    addChainLightning(x1, y1, x2, y2, color = '#00ffff') {
        const segments = 8;
        const dx = (x2 - x1) / segments;
        const dy = (y2 - y1) / segments;

        for (let i = 0; i < segments; i++) {
            const offsetX = (Math.random() - 0.5) * 20;
            const offsetY = (Math.random() - 0.5) * 20;

            this.addParticle({
                x: x1 + dx * i + offsetX,
                y: y1 + dy * i + offsetY,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 10,
                size: 4,
                color: color,
                type: 'spark'
            });
        }
    }

    addScorePopup(x, y, score, color = '#ffff00') {
        // Score popup particle with text property
        const particle = this.getParticle();
        particle.reset(x, y, {
            vx: 0,
            vy: -2,
            life: 60,
            size: 16,
            color: color,
            type: 'score'
        });
        particle.text = '+' + score.toLocaleString();
        particle.maxLife = 60;
    }

    addShieldHit(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            this.addParticle({
                x: x,
                y: y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                life: 20,
                size: 4,
                color: '#00ffff',
                type: 'spark',
                friction: 0.9
            });
        }
    }

    addFeverParticle(x, y, hue) {
        this.addParticle({
            x: x + (Math.random() - 0.5) * 60,
            y: y + (Math.random() - 0.5) * 60,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 30 + Math.random() * 20,
            size: 5 + Math.random() * 5,
            color: `hsl(${hue}, 100%, 50%)`,
            type: 'glow',
            friction: 0.95
        });
    }

    addBossExplosion(x, y, color = '#ff6600') {
        // Use the new Geometry Wars massive explosion for boss death!
        if (this.addMassiveGeometryWarsExplosion) {
            this.addMassiveGeometryWarsExplosion(x, y, color);
        }

        // Additional classic explosion waves for extra impact
        const colors = ['#ff0000', '#ff6600', '#ffff00', '#ffffff'];

        for (let wave = 0; wave < 3; wave++) {
            setTimeout(() => {
                for (let i = 0; i < 30; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 4 + Math.random() * 8;
                    const particleColor = colors[Math.floor(Math.random() * colors.length)];

                    this.addParticle({
                        x: x + (Math.random() - 0.5) * 50,
                        y: y + (Math.random() - 0.5) * 50,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 50 + Math.random() * 30,
                        size: 5 + Math.random() * 8,
                        color: particleColor,
                        type: 'explosion',
                        gravity: 0.05,
                        friction: 0.97
                    });
                }
            }, wave * 100);
        }
    }

    /**
     * Alias for createExplosion (backwards compatibility)
     */
    createExplosion(x, y, color = '#ff6600', count = 15) {
        this.addExplosion(x, y, color, count);
    }

    getCount() {
        return this.getActiveCount();
    }

    // ============================================
    // ENHANCED EXPLOSION EFFECTS
    // ============================================

    /**
     * Epic 8-bit style pixel explosion
     */
    pixelExplosion(x, y, color = '#ff00ff', count = 30) {
        const colors = [color, '#ffffff', '#00ffff', '#ffff00'];
        const adjustedCount = getAdjustedCount(count);

        // Pixel particles
        for (let i = 0; i < adjustedCount; i++) {
            const angle = (Math.PI * 2 * i) / adjustedCount + Math.random() * 0.3;
            const speed = 3 + Math.random() * 8;
            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 4 + Math.random() * 4,
                life: 50 + Math.random() * 30,
                friction: 0.96,
                gravity: 0.08,
                type: 'pixel',
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }

        // Shockwave
        this.addShockwave(x, y, color, 80);
    }

    /**
     * Add expanding shockwave ring
     */
    addShockwave(x, y, color = '#ffffff', maxSize = 100) {
        const particle = this.getParticle();
        particle.reset(x, y, {
            vx: 0,
            vy: 0,
            color: color,
            size: maxSize,
            life: 25,
            friction: 1,
            type: 'shockwave'
        });
    }

    /**
     * Neon synthwave explosion
     */
    synthwaveExplosion(x, y) {
        const colors = ['#ff00ff', '#00ffff', '#ffff00', '#ff0080'];

        // Multi-colored burst
        for (let ring = 0; ring < 3; ring++) {
            const count = 16 - ring * 4;
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count;
                const speed = (8 - ring * 2) + Math.random() * 4;
                const particle = this.getParticle();
                particle.reset(x, y, {
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: colors[ring % colors.length],
                    size: 5 - ring,
                    life: 60 - ring * 10,
                    friction: 0.95,
                    type: 'star'
                });
            }
        }

        // Central flash
        const flash = this.getParticle();
        flash.reset(x, y, {
            vx: 0,
            vy: 0,
            color: '#ffffff',
            size: 50,
            life: 15,
            friction: 1,
            type: 'glow'
        });

        // Shockwaves
        this.addShockwave(x, y, '#ff00ff', 120);
    }

    /**
     * Fire and smoke explosion
     */
    fireExplosion(x, y, size = 1) {
        const count = getAdjustedCount(Math.floor(25 * size));

        // Fire particles
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (4 + Math.random() * 6) * size;
            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                color: Math.random() > 0.5 ? '#ff6600' : '#ff0000',
                size: (5 + Math.random() * 5) * size,
                life: 40 + Math.random() * 30,
                friction: 0.97,
                gravity: -0.05, // Fire rises
                type: 'fire'
            });
        }

        // Smoke particles
        for (let i = 0; i < Math.floor(count / 2); i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (2 + Math.random() * 3) * size;
            const particle = this.getParticle();
            particle.reset(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                color: '#444444',
                size: (8 + Math.random() * 8) * size,
                life: 60 + Math.random() * 40,
                friction: 0.98,
                gravity: -0.02,
                type: 'smoke'
            });
        }

        // Central glow
        const glow = this.getParticle();
        glow.reset(x, y, {
            vx: 0,
            vy: 0,
            color: '#ffff00',
            size: 40 * size,
            life: 20,
            friction: 1,
            type: 'glow'
        });
    }

    /**
     * Electric/lightning explosion
     */
    electricExplosion(x, y, color = '#00ffff') {
        // Lightning bolts
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.3;
            const speed = 6 + Math.random() * 6;
            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: 8 + Math.random() * 6,
                life: 20 + Math.random() * 15,
                friction: 0.92,
                type: 'lightning',
                rotation: angle
            });
        }

        // Electric sparks
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 4 + Math.random() * 8;
            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: i % 2 === 0 ? color : '#ffffff',
                size: 2 + Math.random() * 3,
                life: 25 + Math.random() * 20,
                friction: 0.94,
                type: 'spark'
            });
        }

        // Electric rings
        for (let i = 0; i < 3; i++) {
            const ring = this.getParticle();
            ring.reset(x, y, {
                vx: 0,
                vy: 0,
                color: color,
                size: 30 + i * 20,
                life: 15 - i * 3,
                friction: 1,
                type: 'ring'
            });
        }
    }

    /**
     * VHS glitch explosion effect
     */
    glitchExplosion(x, y) {
        const colors = ['#ff0000', '#00ff00', '#0000ff'];

        // RGB split effect
        for (let c = 0; c < 3; c++) {
            const offset = (c - 1) * 5;
            for (let i = 0; i < 10; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 3 + Math.random() * 5;
                const particle = this.getParticle();
                particle.reset(x + offset, y, {
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: colors[c],
                    size: 6 + Math.random() * 4,
                    life: 30 + Math.random() * 20,
                    friction: 0.96,
                    type: 'pixel'
                });
            }
        }

        // Scanline particles
        for (let i = 0; i < 8; i++) {
            const particle = this.getParticle();
            particle.reset(x, y - 30 + i * 8, {
                vx: (Math.random() - 0.5) * 10,
                vy: 0,
                color: '#ffffff',
                size: 2,
                life: 15 + Math.random() * 10,
                friction: 0.9,
                type: 'spark'
            });
        }
    }

    /**
     * Mega combo explosion - for big combos
     */
    megaComboExplosion(x, y, comboLevel = 1) {
        const intensity = Math.min(comboLevel, 5);
        const colors = ['#ff0080', '#00ffff', '#ffff00', '#ff00ff', '#00ff00'];

        // Expanding star bursts
        for (let ring = 0; ring < intensity; ring++) {
            const count = 8 + ring * 4;
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count + ring * 0.1;
                const speed = (5 + ring * 2) + Math.random() * 3;
                const particle = this.getParticle();
                particle.reset(x, y, {
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: colors[ring % colors.length],
                    size: 6 - ring * 0.5,
                    life: 50 + Math.random() * 20,
                    friction: 0.96,
                    type: 'star'
                });
            }
        }

        // Multiple shockwaves
        for (let i = 0; i < intensity; i++) {
            setTimeout(() => {
                this.addShockwave(x, y, colors[i % colors.length], 100 + i * 30);
            }, i * 50);
        }

        // Central supernova
        const nova = this.getParticle();
        nova.reset(x, y, {
            vx: 0,
            vy: 0,
            color: '#ffffff',
            size: 60 + intensity * 10,
            life: 25,
            friction: 1,
            type: 'glow'
        });
    }

    /**
     * Death explosion with screen shake worthy intensity
     */
    epicDeathExplosion(x, y, color = '#ff0000') {
        // Multiple explosion waves
        for (let wave = 0; wave < 3; wave++) {
            const delay = wave * 80;
            setTimeout(() => {
                this.fireExplosion(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 40, 0.8);
            }, delay);
        }

        // Main explosion
        this.synthwaveExplosion(x, y);

        // Extra debris
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 5 + Math.random() * 10;
            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: 8 + Math.random() * 8,
                life: 80 + Math.random() * 40,
                friction: 0.98,
                gravity: 0.1,
                type: 'debris',
                rotationSpeed: (Math.random() - 0.5) * 0.3
            });
        }
    }

    /**
     * Ship-specific death explosion with unique visual effects
     * Creates particles matching the ship's color and style
     */
    shipDeathExplosion(x, y, shipId = 'neonFalcon', shipColor = '#00ff00') {
        const adjustedCount = getAdjustedCount(40);

        // Ship-specific color palette
        const colorPalettes = {
            neonFalcon: [shipColor, '#00ffaa', '#aaffff', '#ffffff'],
            glassCannon: ['#ff0000', '#ff4400', '#ff8800', '#ffff00', '#ffffff'],
            tank: ['#0088ff', '#00aaff', '#00ddff', '#aaddff', '#ffffff'],
            speedster: ['#ffff00', '#ffff88', '#ffffaa', '#ffffff'],
            retroClassic: ['#00ffff', '#00ff88', '#88ffff', '#ffffff'],
            phantom: ['#aa00ff', '#cc44ff', '#dd88ff', '#ffffff'],
            berserker: ['#ff6600', '#ff8800', '#ffaa00', '#ffcc00', '#ffffff'],
            synth: ['#ff00ff', '#ff44ff', '#ff88ff', '#ffaaff', '#ffffff']
        };

        const colors = colorPalettes[shipId] || [shipColor, '#ffffff'];

        // Main colored explosion burst
        for (let i = 0; i < adjustedCount; i++) {
            const angle = (Math.PI * 2 * i) / adjustedCount + Math.random() * 0.3;
            const speed = 6 + Math.random() * 10;
            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 4 + Math.random() * 6,
                life: 50 + Math.random() * 40,
                friction: 0.96,
                type: Math.random() > 0.5 ? 'explosion' : 'star'
            });
        }

        // Ship silhouette debris (triangular pieces)
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const speed = 4 + Math.random() * 6;
            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: shipColor,
                size: 8 + Math.random() * 6,
                life: 70 + Math.random() * 30,
                friction: 0.97,
                gravity: 0.08,
                type: 'debris',
                rotationSpeed: (Math.random() - 0.5) * 0.4
            });
        }

        // Inner bright core flash
        const coreFlash = this.getParticle();
        coreFlash.reset(x, y, {
            vx: 0,
            vy: 0,
            color: '#ffffff',
            size: 60,
            life: 20,
            friction: 1,
            type: 'glow'
        });

        // Ship-colored ring shockwaves
        for (let ring = 0; ring < 3; ring++) {
            setTimeout(() => {
                this.addShockwave(x, y, colors[ring % colors.length], 80 + ring * 40);
            }, ring * 60);
        }

        // Spark trails outward
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 * i) / 16;
            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * 12,
                vy: Math.sin(angle) * 12,
                color: colors[i % colors.length],
                size: 3,
                life: 35,
                friction: 0.93,
                type: 'spark',
                rotation: angle
            });
        }

        // Rising embers (ship-specific effect)
        for (let i = 0; i < 12; i++) {
            const particle = this.getParticle();
            particle.reset(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 40, {
                vx: (Math.random() - 0.5) * 3,
                vy: -2 - Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 3 + Math.random() * 3,
                life: 60 + Math.random() * 40,
                friction: 0.99,
                gravity: -0.03,
                type: 'fire'
            });
        }
    }

    // ============================================
    // GEOMETRY WARS-STYLE EXPLOSION EFFECTS
    // These create the signature look with line particles,
    // grid distortion, and layered effects
    // ============================================

    /**
     * Helper: Lighten a hex color by percentage
     */
    lightenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    /**
     * GEOMETRY WARS EXPLOSION - The signature effect!
     * Creates hundreds of LINE particles radiating outward with:
     * - Central glow
     * - Expanding shockwave ring
     * - Line particles with motion blur
     * - Color variation (base + white + lighter version)
     *
     * ENHANCED: More particles, higher speeds, brighter colors
     *
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} color - Base color (e.g., '#ff6600')
     * @param {number} intensity - Explosion intensity multiplier (default 1)
     */
    addGeometryWarsExplosion(x, y, color = '#ff6600', intensity = 1) {
        // ENHANCED: Increased base count from 80 to 120
        const baseCount = Math.floor(120 * intensity);
        const adjustedCount = getAdjustedCount(baseCount);

        // === CENTRAL GLOW EFFECT ===
        const glow = this.getParticle();
        glow.reset(x, y, {
            vx: 0,
            vy: 0,
            color: color,
            size: 80 * intensity,  // ENHANCED: Increased from 50
            life: 20,  // ENHANCED: Increased from 15
            friction: 1,
            type: 'gwglow'
        });

        // === SHOCKWAVE RING ===
        const shockwave = this.getParticle();
        shockwave.reset(x, y, {
            vx: 0,
            vy: 0,
            color: color,
            size: 150 * intensity, // ENHANCED: Increased max radius from 100
            life: 25,  // ENHANCED: Increased from 20
            friction: 1,
            type: 'gwshockwave'
        });

        // === LINE PARTICLES (The signature Geometry Wars look!) ===
        // ENHANCED: More color variety including bright white
        const colors = ['#ffffff', color, this.lightenColor(color, 40), this.lightenColor(color, 60)];

        for (let i = 0; i < adjustedCount; i++) {
            const angle = (Math.PI * 2 * i) / adjustedCount + (Math.random() - 0.5) * 0.5;
            // ENHANCED: Higher speeds (6-16 instead of 4-12)
            const speed = 6 + Math.random() * 10 * intensity;
            // ENHANCED: Longer lines
            const lineLength = 10 + Math.random() * 10;
            const particleColor = colors[Math.floor(Math.random() * colors.length)];

            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: particleColor,
                size: 2,
                length: lineLength,
                life: 50 + Math.random() * 40,  // ENHANCED: Longer life (was 40+30)
                friction: 0.97,  // ENHANCED: Less friction for longer travel
                gravity: 0.01,  // ENHANCED: Less gravity
                type: 'gwline',
                maxTrail: 6  // ENHANCED: Longer trails
            });
        }

        // === EXTRA SPARK PARTICLES (Small gnister) ===
        const sparkCount = Math.floor(adjustedCount * 0.6);  // ENHANCED: More sparks
        for (let i = 0; i < sparkCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 8 + Math.random() * 12 * intensity;  // ENHANCED: Faster sparks

            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: i % 2 === 0 ? '#ffffff' : color,  // ENHANCED: More white sparks
                size: 2 + Math.random() * 3,  // ENHANCED: Bigger sparks
                life: 20 + Math.random() * 20,  // ENHANCED: Longer life
                friction: 0.94,
                gravity: 0.03,
                type: 'spark'
            });
        }
    }

    /**
     * MASSIVE GEOMETRY WARS EXPLOSION - For boss deaths!
     * Multiple waves of explosions with secondary bursts
     *
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} color - Base color
     */
    addMassiveGeometryWarsExplosion(x, y, color = '#ff6600') {
        // Initial massive explosion
        this.addGeometryWarsExplosion(x, y, color, 2.5);

        // Secondary explosions in a ring (delayed)
        setTimeout(() => {
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI * 2 * i) / 4;
                this.addGeometryWarsExplosion(
                    x + Math.cos(angle) * 40,
                    y + Math.sin(angle) * 40,
                    color,
                    1.2
                );
            }
        }, 50);

        // Third wave - outer ring
        setTimeout(() => {
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * 2 * i) / 6 + Math.PI / 6;
                this.addGeometryWarsExplosion(
                    x + Math.cos(angle) * 80,
                    y + Math.sin(angle) * 80,
                    color,
                    0.8
                );
            }
        }, 100);

        // Extra debris and fire
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 8;
            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: 8 + Math.random() * 8,
                life: 100 + Math.random() * 50,
                friction: 0.98,
                gravity: 0.05,
                type: 'debris',
                rotationSpeed: (Math.random() - 0.5) * 0.3
            });
        }
    }

    /**
     * Geometry Wars ENEMY DEATH - Standard enemy explosion
     * Combines line particles with grid-distortion trigger
     *
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} color - Enemy color
     * @param {number} size - Enemy size (affects intensity)
     */
    addGeometryWarsEnemyDeath(x, y, color = '#ff6600', size = 20) {
        const intensity = 0.6 + (size / 50); // Scale with enemy size
        this.addGeometryWarsExplosion(x, y, color, Math.min(intensity, 1.5));
    }

    /**
     * Geometry Wars PLAYER DEATH - Epic player explosion
     * Extra intense with multiple shockwaves
     */
    addGeometryWarsPlayerDeath(x, y, color = '#00ff00') {
        // Main explosion
        this.addGeometryWarsExplosion(x, y, color, 1.5);

        // Extra shockwaves
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const shockwave = this.getParticle();
                shockwave.reset(x, y, {
                    vx: 0,
                    vy: 0,
                    color: i === 0 ? '#ffffff' : color,
                    size: 80 + i * 40,
                    life: 15,
                    friction: 1,
                    type: 'gwshockwave'
                });
            }, i * 50);
        }

        // Fire/ember particles rising
        for (let i = 0; i < 20; i++) {
            const particle = this.getParticle();
            particle.reset(
                x + (Math.random() - 0.5) * 50,
                y + (Math.random() - 0.5) * 50,
                {
                    vx: (Math.random() - 0.5) * 4,
                    vy: -2 - Math.random() * 5,
                    color: color,
                    size: 4 + Math.random() * 4,
                    life: 60 + Math.random() * 40,
                    friction: 0.99,
                    gravity: -0.02,
                    type: 'fire'
                }
            );
        }
    }

    /**
     * Geometry Wars BOMB EXPLOSION - Screen-clearing effect
     * Maximum intensity with multiple waves
     */
    addGeometryWarsBombExplosion(x, y) {
        // Massive white central explosion
        this.addGeometryWarsExplosion(x, y, '#ffffff', 3);

        // Ring of colored explosions
        const colors = ['#ff00ff', '#00ffff', '#ffff00', '#ff0080'];
        for (let ring = 0; ring < 2; ring++) {
            setTimeout(() => {
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 * i) / 8 + ring * Math.PI / 8;
                    const dist = 60 + ring * 50;
                    this.addGeometryWarsExplosion(
                        x + Math.cos(angle) * dist,
                        y + Math.sin(angle) * dist,
                        colors[i % colors.length],
                        1 - ring * 0.3
                    );
                }
            }, ring * 80);
        }

        // Multiple expanding shockwaves
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const shockwave = this.getParticle();
                shockwave.reset(x, y, {
                    vx: 0,
                    vy: 0,
                    color: i % 2 === 0 ? '#ffffff' : '#ff00ff',
                    size: 150 + i * 50,
                    life: 25,
                    friction: 1,
                    type: 'gwshockwave'
                });
            }, i * 40);
        }
    }

    // ============================================
    // GEOMETRY WARS-STYLE SHIP EXHAUST TRAILS
    // Three streams: center (hot yellow-white) and
    // two side streams (red/orange) with sine-wave swivel
    // ============================================

    /**
     * Create Geometry Wars-style ship exhaust trail
     * Creates three particle streams that swivel using sine function
     *
     * @param {number} x - Ship X position
     * @param {number} y - Ship Y position
     * @param {number} shipAngle - Ship's facing angle in radians
     * @param {number} speed - Ship's current speed (affects trail intensity)
     * @param {string} color - Base ship color
     * @param {number} time - Current game time for sine wave animation
     */
    addShipExhaust(x, y, shipAngle, speed = 1, color = '#00ff00', time = 0) {
        // Only emit if ship is moving
        if (speed < 0.3) return;

        const intensity = Math.min(speed / 6, 1.8);
        const exhaustAngle = shipAngle + Math.PI; // Opposite of ship direction

        // Dual sine waves for smooth criss-cross swivel pattern (XNA Geometry Wars style)
        // The two side streams oscillate in opposite directions
        const swivelAmount = Math.sin(time * 0.12) * 0.5;
        const swivelSecondary = Math.cos(time * 0.08) * 0.15; // Secondary oscillation for organic feel

        // === CENTER STREAM (hot yellow-white core) ===
        // This is the hottest part - bright white/yellow particles
        const centerParticleCount = Math.ceil(2 * intensity);
        for (let i = 0; i < centerParticleCount; i++) {
            const particle = this.getParticle();
            const spreadAngle = exhaustAngle + (Math.random() - 0.5) * 0.15;
            const exhaustSpeed = 4 + Math.random() * 5 * intensity;

            // Alternate between hot white and yellow for heat gradient
            const centerColors = ['#ffffff', '#ffffcc', '#ffffaa', '#ffff88'];
            particle.reset(x, y, {
                vx: Math.cos(spreadAngle) * exhaustSpeed,
                vy: Math.sin(spreadAngle) * exhaustSpeed,
                color: centerColors[i % centerColors.length],
                size: 2.5 + Math.random() * 2,
                life: 18 + Math.random() * 12,
                friction: 0.91,
                type: 'gwline',
                length: 8 + Math.random() * 5,
                maxTrail: 4,
                bounce: false
            });
        }

        // === SIDE STREAMS (red/orange, criss-crossing) ===
        // These swivel back and forth in opposite directions
        const sideOffsets = [
            { offset: -0.6, swivel: swivelAmount + swivelSecondary },
            { offset: 0.6, swivel: -swivelAmount - swivelSecondary }
        ];
        // Gradient from orange to deep red for cooler outer flames
        const sideColorGradient = [
            ['#ff6600', '#ff7711', '#ff8822'], // Left stream - more orange
            ['#ff4400', '#ff5500', '#ff3300']  // Right stream - more red
        ];

        sideOffsets.forEach((side, streamIndex) => {
            // Criss-cross pattern: streams cross paths as they swivel
            const sideAngle = exhaustAngle + side.offset + side.swivel;
            const colors = sideColorGradient[streamIndex];

            // Emit 1-2 particles per side stream based on intensity
            const sideCount = Math.random() < intensity ? 2 : 1;
            for (let i = 0; i < sideCount; i++) {
                const particle = this.getParticle();
                const exhaustSpeed = 3 + Math.random() * 4 * intensity;
                const angleJitter = (Math.random() - 0.5) * 0.1;

                particle.reset(x, y, {
                    vx: Math.cos(sideAngle + angleJitter) * exhaustSpeed,
                    vy: Math.sin(sideAngle + angleJitter) * exhaustSpeed,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    size: 2 + Math.random() * 2.5,
                    life: 14 + Math.random() * 10,
                    friction: 0.89,
                    type: 'gwline',
                    length: 6 + Math.random() * 4,
                    maxTrail: 3,
                    bounce: false
                });
            }
        });

        // === GLOW PARTICLES (makes fire glow more brightly) ===
        // Additional glow particles tinted and blended with regular particles
        if (Math.random() < 0.6 * intensity) {
            const glowParticle = this.getParticle();
            const glowAngle = exhaustAngle + (Math.random() - 0.5) * 0.3;
            const glowSpeed = 2 + Math.random() * 3;
            // Glow colors blend from yellow to orange
            const glowColors = ['#ffaa44', '#ffcc66', '#ff9933', '#ffdd77'];

            glowParticle.reset(x, y, {
                vx: Math.cos(glowAngle) * glowSpeed,
                vy: Math.sin(glowAngle) * glowSpeed,
                color: glowColors[Math.floor(Math.random() * glowColors.length)],
                size: 6 + Math.random() * 4,
                life: 10 + Math.random() * 8,
                friction: 0.94,
                type: 'gwglow',
                alpha: 0.4 + Math.random() * 0.3
            });
        }

        // === SPARK PARTICLES (bright yellow accents) ===
        if (Math.random() < 0.35 * intensity) {
            const sparkAngle = exhaustAngle + (Math.random() - 0.5) * 0.9;
            const sparkSpeed = 5 + Math.random() * 7;
            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(sparkAngle) * sparkSpeed,
                vy: Math.sin(sparkAngle) * sparkSpeed,
                color: Math.random() > 0.5 ? '#ffff00' : '#ffff88',
                size: 1.5 + Math.random() * 1.5,
                life: 6 + Math.random() * 8,
                friction: 0.86,
                type: 'spark',
                bounce: true
            });
        }

        // === OCCASIONAL EMBER PARTICLES (trailing hot embers) ===
        if (Math.random() < 0.2 * intensity) {
            const emberAngle = exhaustAngle + (Math.random() - 0.5) * 0.6;
            const emberSpeed = 1.5 + Math.random() * 2.5;
            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(emberAngle) * emberSpeed,
                vy: Math.sin(emberAngle) * emberSpeed,
                color: '#ff4400',
                size: 2 + Math.random() * 2,
                life: 20 + Math.random() * 15,
                friction: 0.96,
                type: 'ember'
            });
        }
    }

    // ============================================
    // ENHANCED COLORFUL EXPLOSION WITH INTERPOLATION
    // Uses two nearby key colors and interpolates between them
    // ============================================

    /**
     * Create colorful Geometry Wars explosion with color interpolation
     * Each explosion picks two nearby hues and interpolates between them
     *
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} baseColor - Base color (will derive hue from this)
     * @param {number} count - Number of particles
     * @param {number} intensity - Explosion intensity
     */
    addColorfulExplosion(x, y, baseColor = '#ff6600', count = 60, intensity = 1) {
        const adjustedCount = getAdjustedCount(count);

        // Convert base color to HSV and pick two nearby hues
        const hsv = hexToHsv(baseColor);
        const hue1 = hsv.h;
        const hue2 = hue1 + (Math.random() > 0.5 ? 30 : -30); // Nearby hue
        const color1 = hsvToHex(hue1, 0.9, 1.0);
        const color2 = hsvToHex(hue2, 0.9, 1.0);

        // Central glow
        const glow = this.getParticle();
        glow.reset(x, y, {
            vx: 0,
            vy: 0,
            color: '#ffffff',
            size: 60 * intensity,
            life: 18,
            friction: 1,
            type: 'gwglow'
        });

        // Line particles with interpolated colors
        for (let i = 0; i < adjustedCount; i++) {
            const angle = (Math.PI * 2 * i) / adjustedCount + (Math.random() - 0.5) * 0.5;
            const speed = 5 + Math.random() * 10 * intensity;

            // Interpolate between the two colors
            const t = Math.random();
            const particleColor = Math.random() > 0.2 ? lerpColor(color1, color2, t) : '#ffffff';

            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: particleColor,
                size: 2,
                length: 8 + Math.random() * 8,
                life: 40 + Math.random() * 35,
                friction: 0.96,
                gravity: 0.015,
                type: 'gwline',
                maxTrail: 5,
                bounce: true
            });
        }

        // Shockwave ring
        const shockwave = this.getParticle();
        shockwave.reset(x, y, {
            vx: 0,
            vy: 0,
            color: color1,
            size: 120 * intensity,
            life: 22,
            friction: 1,
            type: 'gwshockwave'
        });
    }

    // ============================================
    // SPEED-BASED PARTICLE RENDERING
    // Fast particles get longer and brighter (Geometry Wars style)
    // This is already partially implemented in drawLine, but let's add
    // a method to spawn speed-enhanced particles
    // ============================================

    /**
     * Spawn a speed-enhanced line particle that gets longer when moving fast
     * Also glows brighter at high speeds
     *
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} vx - X velocity
     * @param {number} vy - Y velocity
     * @param {string} color - Particle color
     * @param {object} options - Additional options
     */
    addSpeedParticle(x, y, vx, vy, color = '#ffffff', options = {}) {
        const speed = Math.sqrt(vx * vx + vy * vy);
        const speedFactor = Math.min(speed / 10, 2); // Cap at 2x

        const particle = this.getParticle();
        particle.reset(x, y, {
            vx,
            vy,
            color,
            size: 2 + speedFactor,
            length: 8 + speedFactor * 8, // Longer when faster
            life: options.life || (30 + Math.random() * 20),
            friction: options.friction || 0.96,
            gravity: options.gravity || 0.02,
            type: 'gwline',
            maxTrail: Math.floor(3 + speedFactor * 2), // More trail when faster
            bounce: options.bounce !== false
        });

        // Add extra glow particle for very fast particles
        if (speed > 12) {
            const glowParticle = this.getParticle();
            glowParticle.reset(x, y, {
                vx: vx * 0.5,
                vy: vy * 0.5,
                color: '#ffffff',
                size: 4 + speedFactor * 2,
                life: 10,
                friction: 0.9,
                type: 'glow'
            });
        }
    }

    // ============================================
    // SECONDARY PARTICLE SPAWNING / CHAIN REACTIONS
    // Particles can spawn child particles for cascading effects
    // ============================================

    /**
     * Create an explosion with secondary particle spawning
     * Main particles spawn smaller child particles when they die
     * Creates cascading chain reaction effect
     *
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} color - Base color
     * @param {number} intensity - Explosion intensity
     */
    addChainReactionExplosion(x, y, color = '#ff6600', intensity = 1) {
        const adjustedCount = getAdjustedCount(Math.floor(40 * intensity));
        const hsv = hexToHsv(color);

        // Main explosion particles that will spawn children
        for (let i = 0; i < adjustedCount; i++) {
            const angle = (Math.PI * 2 * i) / adjustedCount + (Math.random() - 0.5) * 0.4;
            const speed = 6 + Math.random() * 8 * intensity;

            // Schedule secondary explosion at end position
            const lifetime = 35 + Math.random() * 25;
            const endX = x + Math.cos(angle) * speed * lifetime * 0.3;
            const endY = y + Math.sin(angle) * speed * lifetime * 0.3;

            // Spawn secondary mini-explosion after delay
            if (Math.random() < 0.4) { // 40% of particles spawn children
                setTimeout(() => {
                    this.addMiniExplosion(endX, endY, randomNeonColorNear(hsv.h, 60), 8);
                }, lifetime * 12); // Approximate timing
            }

            // Main particle
            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: randomNeonColorNear(hsv.h, 40),
                size: 2,
                length: 10 + Math.random() * 8,
                life: lifetime,
                friction: 0.97,
                gravity: 0.02,
                type: 'gwline',
                maxTrail: 5,
                bounce: true
            });
        }

        // Central glow
        const glow = this.getParticle();
        glow.reset(x, y, {
            vx: 0,
            vy: 0,
            color: '#ffffff',
            size: 70 * intensity,
            life: 20,
            friction: 1,
            type: 'gwglow'
        });

        // Main shockwave
        this.addShockwave(x, y, color, 130 * intensity);
    }

    /**
     * Small mini explosion for chain reactions
     */
    addMiniExplosion(x, y, color = '#ff6600', count = 8) {
        const adjustedCount = getAdjustedCount(count);

        for (let i = 0; i < adjustedCount; i++) {
            const angle = (Math.PI * 2 * i) / adjustedCount + (Math.random() - 0.5) * 0.5;
            const speed = 2 + Math.random() * 4;

            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: Math.random() > 0.3 ? color : '#ffffff',
                size: 2,
                length: 5 + Math.random() * 4,
                life: 20 + Math.random() * 15,
                friction: 0.94,
                gravity: 0.03,
                type: 'gwline',
                maxTrail: 3,
                bounce: true
            });
        }

        // Small flash
        const flash = this.getParticle();
        flash.reset(x, y, {
            vx: 0,
            vy: 0,
            color: '#ffffff',
            size: 15,
            life: 8,
            friction: 1,
            type: 'glow'
        });
    }

    // ============================================
    // RAINBOW EXPLOSION - Full HSV spectrum burst
    // ============================================

    /**
     * Create a rainbow explosion using full HSV color spectrum
     * Each particle gets a different hue from the rainbow
     */
    addRainbowExplosion(x, y, count = 80, intensity = 1) {
        const adjustedCount = getAdjustedCount(count);

        // Central white flash
        const flash = this.getParticle();
        flash.reset(x, y, {
            vx: 0,
            vy: 0,
            color: '#ffffff',
            size: 80 * intensity,
            life: 20,
            friction: 1,
            type: 'gwglow'
        });

        // Rainbow particles - each gets a different hue
        for (let i = 0; i < adjustedCount; i++) {
            const hue = (360 * i) / adjustedCount; // Spread across full spectrum
            const color = hsvToHex(hue, 0.95, 1.0);

            const angle = (Math.PI * 2 * i) / adjustedCount + (Math.random() - 0.5) * 0.3;
            const speed = 6 + Math.random() * 10 * intensity;

            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: 2,
                length: 10 + Math.random() * 8,
                life: 50 + Math.random() * 30,
                friction: 0.96,
                gravity: 0.015,
                type: 'gwline',
                maxTrail: 5,
                bounce: true
            });
        }

        // Multiple colored shockwaves
        const shockwaveColors = ['#ff0000', '#00ff00', '#0000ff'];
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const shockwave = this.getParticle();
                shockwave.reset(x, y, {
                    vx: 0,
                    vy: 0,
                    color: shockwaveColors[i],
                    size: 100 + i * 30,
                    life: 18,
                    friction: 1,
                    type: 'gwshockwave'
                });
            }, i * 40);
        }
    }

    // ============================================
    // NEW EXPLOSION EFFECTS - Using Enhanced Particle Types
    // ============================================

    /**
     * Celebration/Victory explosion with confetti
     * Perfect for level completion, achievements, high scores
     */
    addConfettiExplosion(x, y, count = 50, intensity = 1) {
        const adjustedCount = getAdjustedCount(count);
        const colors = ['#ff0080', '#00ff80', '#ffff00', '#00ffff', '#ff8000', '#ff00ff', '#80ff00'];

        // Confetti burst
        for (let i = 0; i < adjustedCount; i++) {
            const angle = (Math.PI * 2 * i) / adjustedCount + Math.random() * 0.5;
            const speed = (4 + Math.random() * 8) * intensity;

            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 3, // Upward bias
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 6 + Math.random() * 6,
                life: 80 + Math.random() * 40,
                friction: 0.98,
                gravity: 0.08,
                type: 'confetti',
                rotationSpeed: (Math.random() - 0.5) * 0.4
            });
        }

        // Star burst accent
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * 10 * intensity,
                vy: Math.sin(angle) * 10 * intensity,
                color: '#ffffff',
                size: 8,
                life: 30,
                friction: 0.92,
                type: 'star'
            });
        }

        // Central flash
        const flash = this.getParticle();
        flash.reset(x, y, {
            vx: 0,
            vy: 0,
            color: '#ffffff',
            size: 60 * intensity,
            life: 15,
            friction: 1,
            type: 'glow'
        });
    }

    /**
     * Plasma/Energy explosion
     * For shields breaking, energy weapons, sci-fi effects
     */
    addPlasmaExplosion(x, y, color = '#00ffff', count = 30, intensity = 1) {
        const adjustedCount = getAdjustedCount(count);

        // Plasma orbs
        for (let i = 0; i < adjustedCount; i++) {
            const angle = (Math.PI * 2 * i) / adjustedCount + Math.random() * 0.3;
            const speed = (5 + Math.random() * 8) * intensity;

            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: 5 + Math.random() * 5,
                life: 40 + Math.random() * 30,
                friction: 0.95,
                type: 'plasma'
            });
        }

        // Electric sparks
        for (let i = 0; i < adjustedCount / 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 8 + Math.random() * 12;

            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: '#ffffff',
                size: 2 + Math.random() * 2,
                life: 15 + Math.random() * 15,
                friction: 0.9,
                type: 'spark',
                bounce: true
            });
        }

        // Central plasma core
        const core = this.getParticle();
        core.reset(x, y, {
            vx: 0,
            vy: 0,
            color: color,
            size: 40 * intensity,
            life: 25,
            friction: 1,
            type: 'plasma'
        });

        // Shockwave
        this.addShockwave(x, y, color, 80 * intensity);
    }

    /**
     * Vortex/Portal explosion
     * For black holes, portals, suction effects
     */
    addVortexExplosion(x, y, color = '#aa00ff', count = 40, intensity = 1) {
        const adjustedCount = getAdjustedCount(count);

        // Spiraling vortex particles
        for (let i = 0; i < adjustedCount; i++) {
            const angle = (Math.PI * 2 * i) / adjustedCount;
            const speed = (3 + Math.random() * 6) * intensity;
            const distance = Math.random() * 30;

            const particle = this.getParticle();
            particle.reset(
                x + Math.cos(angle) * distance,
                y + Math.sin(angle) * distance,
                {
                    vx: Math.cos(angle + Math.PI / 2) * speed, // Spiral outward
                    vy: Math.sin(angle + Math.PI / 2) * speed,
                    color: i % 2 === 0 ? color : '#ffffff',
                    size: 8 + Math.random() * 8,
                    life: 50 + Math.random() * 30,
                    friction: 0.97,
                    type: 'vortex',
                    rotation: angle,
                    rotationSpeed: 0.1 * (Math.random() > 0.5 ? 1 : -1)
                }
            );
        }

        // Inner core glow
        const core = this.getParticle();
        core.reset(x, y, {
            vx: 0,
            vy: 0,
            color: '#ffffff',
            size: 50 * intensity,
            life: 30,
            friction: 1,
            type: 'gwglow'
        });

        // Multiple expanding rings
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.addShockwave(x, y, color, 60 + i * 30);
            }, i * 50);
        }
    }

    /**
     * Bubble burst explosion
     * For underwater, healing, magical effects
     */
    addBubbleExplosion(x, y, color = '#00aaff', count = 25) {
        const adjustedCount = getAdjustedCount(count);

        // Rising bubbles
        for (let i = 0; i < adjustedCount; i++) {
            const angle = (Math.PI * 2 * i) / adjustedCount + Math.random() * 0.5;
            const speed = 2 + Math.random() * 4;

            const particle = this.getParticle();
            particle.reset(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30, {
                vx: Math.cos(angle) * speed,
                vy: -Math.abs(Math.sin(angle) * speed) - 1, // Always rise
                color: color,
                size: 6 + Math.random() * 10,
                life: 60 + Math.random() * 40,
                friction: 0.99,
                gravity: -0.03, // Rise effect
                type: 'bubble'
            });
        }

        // Small sparkles for pop effect
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * 6,
                vy: Math.sin(angle) * 6,
                color: '#ffffff',
                size: 2,
                life: 20,
                friction: 0.9,
                type: 'spark'
            });
        }
    }

    /**
     * Ember/Fire trail explosion
     * For fire damage, burning effects, heat
     */
    addEmberExplosion(x, y, count = 40, intensity = 1) {
        const adjustedCount = getAdjustedCount(count);
        const colors = ['#ff0000', '#ff4400', '#ff8800', '#ffcc00'];

        // Embers flying outward and upward
        for (let i = 0; i < adjustedCount; i++) {
            const angle = (Math.PI * 2 * i) / adjustedCount + Math.random() * 0.5;
            const speed = (3 + Math.random() * 7) * intensity;

            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2, // Upward bias
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 3 + Math.random() * 4,
                life: 50 + Math.random() * 40,
                friction: 0.97,
                gravity: -0.04, // Rise like embers
                type: 'ember'
            });
        }

        // Comet-like fast embers
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.2;
            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * 12 * intensity,
                vy: Math.sin(angle) * 12 * intensity,
                color: '#ffff00',
                size: 4,
                life: 25,
                friction: 0.94,
                type: 'comet'
            });
        }

        // Central fire glow
        const glow = this.getParticle();
        glow.reset(x, y, {
            vx: 0,
            vy: 0,
            color: '#ff4400',
            size: 50 * intensity,
            life: 20,
            friction: 1,
            type: 'glow'
        });
    }

    /**
     * Disintegration effect
     * For enemy dissolving, teleport effects
     */
    addDisintegrationExplosion(x, y, color = '#00ff00', count = 60, intensity = 1) {
        const adjustedCount = getAdjustedCount(count);

        // Pixelated disintegration
        for (let i = 0; i < adjustedCount; i++) {
            const angle = (Math.PI * 2 * i) / adjustedCount + Math.random() * 0.5;
            const speed = (2 + Math.random() * 5) * intensity;
            const offset = Math.random() * 20;

            const particle = this.getParticle();
            particle.reset(
                x + Math.cos(angle) * offset,
                y + Math.sin(angle) * offset,
                {
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: Math.random() > 0.3 ? color : '#ffffff',
                    size: 4 + Math.random() * 4,
                    life: 40 + Math.random() * 40,
                    friction: 0.96,
                    gravity: 0.02,
                    type: 'disintegrate'
                }
            );
        }

        // Glitch effect - RGB split
        const rgbColors = ['#ff0000', '#00ff00', '#0000ff'];
        for (let c = 0; c < 3; c++) {
            const offsetX = (c - 1) * 5;
            for (let i = 0; i < 5; i++) {
                const particle = this.getParticle();
                particle.reset(x + offsetX, y, {
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    color: rgbColors[c],
                    size: 6,
                    life: 25,
                    friction: 0.95,
                    type: 'pixel'
                });
            }
        }
    }

    /**
     * Comet impact explosion
     * For projectile impacts, meteor strikes
     */
    addCometExplosion(x, y, color = '#ffaa00', count = 30, intensity = 1) {
        const adjustedCount = getAdjustedCount(count);

        // Comet fragments flying outward
        for (let i = 0; i < adjustedCount; i++) {
            const angle = (Math.PI * 2 * i) / adjustedCount + Math.random() * 0.3;
            const speed = (6 + Math.random() * 10) * intensity;

            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: i % 3 === 0 ? '#ffffff' : color,
                size: 3 + Math.random() * 4,
                life: 35 + Math.random() * 25,
                friction: 0.95,
                gravity: 0.05,
                type: 'comet'
            });
        }

        // Impact flash
        const flash = this.getParticle();
        flash.reset(x, y, {
            vx: 0,
            vy: 0,
            color: '#ffffff',
            size: 70 * intensity,
            life: 12,
            friction: 1,
            type: 'gwglow'
        });

        // Ground sparks
        for (let i = 0; i < 16; i++) {
            const angle = Math.PI + (Math.random() - 0.5) * Math.PI; // Lower half
            const speed = 8 + Math.random() * 8;

            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: 2,
                life: 20,
                friction: 0.9,
                gravity: 0.15,
                type: 'spark',
                bounce: true,
                bounceDamping: 0.5
            });
        }

        this.addShockwave(x, y, color, 100 * intensity);
    }

    /**
     * Snow/Ice explosion
     * For freeze effects, cold damage, winter themes
     */
    addSnowExplosion(x, y, count = 40) {
        const adjustedCount = getAdjustedCount(count);

        // Snowflakes
        for (let i = 0; i < adjustedCount; i++) {
            const angle = (Math.PI * 2 * i) / adjustedCount + Math.random() * 0.5;
            const speed = 2 + Math.random() * 4;

            const particle = this.getParticle();
            particle.reset(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 40, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed + 0.5, // Slight downward drift
                color: Math.random() > 0.3 ? '#ffffff' : '#aaddff',
                size: 4 + Math.random() * 6,
                life: 80 + Math.random() * 40,
                friction: 0.99,
                gravity: 0.01,
                type: 'snow'
            });
        }

        // Ice crystals
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * 6,
                vy: Math.sin(angle) * 6,
                color: '#88ddff',
                size: 10,
                life: 40,
                friction: 0.94,
                type: 'star'
            });
        }

        // Cold mist
        const mist = this.getParticle();
        mist.reset(x, y, {
            vx: 0,
            vy: 0,
            color: '#aaddff',
            size: 80,
            life: 30,
            friction: 1,
            type: 'glow'
        });
    }

    /**
     * Massive combined explosion - uses multiple new particle types
     * For boss deaths, mega events, level transitions
     */
    addMegaExplosion(x, y, color = '#ff00ff', intensity = 1.5) {
        // Initial flash
        const flash = this.getParticle();
        flash.reset(x, y, {
            vx: 0,
            vy: 0,
            color: '#ffffff',
            size: 100 * intensity,
            life: 15,
            friction: 1,
            type: 'gwglow'
        });

        // Plasma core
        this.addPlasmaExplosion(x, y, color, 40, intensity);

        // Delayed ember ring
        setTimeout(() => {
            this.addEmberExplosion(x, y, 30, intensity * 0.8);
        }, 50);

        // Delayed confetti celebration
        setTimeout(() => {
            this.addConfettiExplosion(x, y, 30, intensity * 0.6);
        }, 100);

        // Vortex effect
        setTimeout(() => {
            this.addVortexExplosion(x, y, color, 25, intensity * 0.5);
        }, 150);

        // Multiple shockwaves
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                this.addShockwave(x, y, i % 2 === 0 ? color : '#ffffff', 80 + i * 40);
            }, i * 60);
        }

        // Comet fragments
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const particle = this.getParticle();
            particle.reset(x, y, {
                vx: Math.cos(angle) * 15 * intensity,
                vy: Math.sin(angle) * 15 * intensity,
                color: color,
                size: 5,
                life: 40,
                friction: 0.96,
                type: 'comet'
            });
        }
    }
}
