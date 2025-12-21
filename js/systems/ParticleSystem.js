/**
 * Geometry 3044 - ParticleSystem Module
 * Handles all particle effects: explosions, trails, sparks, etc.
 * OPTIMIZED for performance
 */

import { CONFIG, getCurrentTheme } from '../config.js';
import { GameSettings } from '../ui/MenuManager.js';

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

        switch (this.type) {
            case 'spark':
                this.drawSpark(ctx, currentSize);
                break;
            case 'trail':
                this.drawTrail(ctx, currentSize);
                break;
            case 'explosion':
                this.drawExplosion(ctx, currentSize);
                break;
            case 'glow':
                this.drawGlow(ctx, currentSize);
                break;
            case 'debris':
                this.drawDebris(ctx, currentSize);
                break;
            case 'score':
                this.drawScore(ctx, this.size);
                break;
            case 'shockwave':
                this.drawShockwave(ctx, currentSize);
                break;
            case 'pixel':
                this.drawPixel(ctx, currentSize);
                break;
            case 'ring':
                this.drawRing(ctx, currentSize);
                break;
            case 'lightning':
                this.drawLightning(ctx, currentSize);
                break;
            case 'fire':
                this.drawFire(ctx, currentSize);
                break;
            case 'smoke':
                this.drawSmoke(ctx, currentSize);
                break;
            case 'star':
                this.drawStar(ctx, currentSize);
                break;
            // Geometry Wars-style line particles
            case 'line':
            case 'gwline':
                this.drawLine(ctx, alpha);
                break;
            case 'gwglow':
                this.drawGWGlow(ctx, alpha);
                break;
            case 'gwshockwave':
                this.drawGWShockwave(ctx, alpha);
                break;
            default:
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
            this.particles.push(new Particle());
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
     * Update all particles
     */
    update() {
        // Early exit if no active particles
        if (this._activeCount === 0) return;

        let activeCount = 0;
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            if (particle.active) {
                particle.update();
                if (particle.active) activeCount++; // Still active after update
            }
        }
        this._activeCount = activeCount;
    }

    /**
     * Draw all active particles
     */
    draw(ctx) {
        // Early exit if no active particles
        if (this._activeCount === 0) return;

        // Debug: Count particle types periodically
        if (!this._lastDebugLog || Date.now() - this._lastDebugLog > 2000) {
            const typeCounts = {};
            let gwlinePositions = [];
            for (const p of this.particles) {
                if (p.active) {
                    typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
                    // Capture some gwline positions for debug
                    if (p.type === 'gwline' && gwlinePositions.length < 3) {
                        gwlinePositions.push({ x: Math.round(p.x), y: Math.round(p.y), alpha: (p.life / p.maxLife).toFixed(2) });
                    }
                }
            }
            if (Object.keys(typeCounts).length > 0) {
                console.log('[Particles Active]', JSON.stringify(typeCounts));
                if (gwlinePositions.length > 0) {
                    console.log('[GWLine Samples]', JSON.stringify(gwlinePositions));
                }
            }
            this._lastDebugLog = Date.now();
        }

        ctx.save();

        // CRITICAL: Reset ALL context state to ensure particles are visible
        // Previous draw calls may have modified these values unexpectedly
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.setLineDash([]);  // Reset any line dash pattern
        ctx.lineDashOffset = 0;
        ctx.lineJoin = 'miter';
        ctx.lineCap = 'butt';
        ctx.miterLimit = 10;
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.filter = 'none';  // Reset any CSS filters
        ctx.imageSmoothingEnabled = true;

        // Draw all active particles
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            if (particle.active) {
                // Reset alpha before each particle (in case previous particle didn't restore)
                ctx.globalAlpha = 1;
                ctx.globalCompositeOperation = 'source-over';
                particle.draw(ctx);
            }
        }
        ctx.restore();
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

        // Debug: Log when GW explosion is triggered
        console.log(`[GW Explosion] x:${Math.round(x)} y:${Math.round(y)} color:${color} intensity:${intensity.toFixed(2)} particles:${adjustedCount}`);

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
}
