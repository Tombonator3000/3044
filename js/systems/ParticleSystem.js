/**
 * Geometry 3044 - ParticleSystem Module
 * Handles all particle effects: explosions, trails, sparks, etc.
 */

import { CONFIG, getCurrentTheme } from '../config.js';

/**
 * Particle Class
 * Individual particle with physics and rendering
 */
class Particle {
    constructor() {
        this.reset();
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
        return this;
    }

    update() {
        if (!this.active) return;

        this.x += this.vx;
        this.y += this.vy;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.rotation += this.rotationSpeed;
        this.life--;

        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        const alpha = this.life / this.maxLife;
        const currentSize = this.size * (0.5 + alpha * 0.5);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

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
            default:
                this.drawDefault(ctx, currentSize);
        }

        ctx.restore();
    }

    drawDefault(ctx, size) {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
    }

    drawScore(ctx, size) {
        // Score popup text
        ctx.font = `bold ${size}px "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillText(this.text || '+100', 0, 0);
    }

    drawSpark(ctx, size) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = size / 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.moveTo(-size * 2, 0);
        ctx.lineTo(size * 2, 0);
        ctx.stroke();
    }

    drawTrail(ctx, size) {
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 2);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, size * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawExplosion(ctx, size) {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;

        // Star shape
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const outerX = Math.cos(angle) * size;
            const outerY = Math.sin(angle) * size;
            const innerAngle = angle + Math.PI / 5;
            const innerX = Math.cos(innerAngle) * (size / 2);
            const innerY = Math.sin(innerAngle) * (size / 2);

            if (i === 0) ctx.moveTo(outerX, outerY);
            else ctx.lineTo(outerX, outerY);
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
    }

    drawGlow(ctx, size) {
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 3);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, this.color + '88');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, size * 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawDebris(ctx, size) {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = this.color;
        ctx.fillRect(-size / 2, -size / 2, size, size);
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

        // Pre-allocate particle pool
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push(new Particle());
        }
    }

    /**
     * Get a particle from the pool
     */
    getParticle() {
        // Find inactive particle
        for (let i = 0; i < this.particles.length; i++) {
            const idx = (this.poolIndex + i) % this.particles.length;
            if (!this.particles[idx].active) {
                this.poolIndex = (idx + 1) % this.particles.length;
                return this.particles[idx];
            }
        }

        // If all active, reuse oldest
        this.poolIndex = (this.poolIndex + 1) % this.particles.length;
        return this.particles[this.poolIndex];
    }

    /**
     * Emit particles at a position
     */
    emit(x, y, count, options = {}) {
        for (let i = 0; i < count; i++) {
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
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
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
        for (let i = 0; i < count; i++) {
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
        for (let particle of this.particles) {
            if (particle.active) {
                particle.update();
            }
        }
    }

    /**
     * Draw all active particles
     */
    draw(ctx) {
        ctx.save();
        for (let particle of this.particles) {
            if (particle.active) {
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
    }

    /**
     * Get active particle count
     */
    getActiveCount() {
        let count = 0;
        for (let particle of this.particles) {
            if (particle.active) count++;
        }
        return count;
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

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
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
        for (let i = 0; i < count; i++) {
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

    addBossExplosion(x, y) {
        // Massive explosion for boss death
        const colors = ['#ff0000', '#ff6600', '#ffff00', '#ffffff'];

        for (let wave = 0; wave < 3; wave++) {
            setTimeout(() => {
                for (let i = 0; i < 30; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 4 + Math.random() * 8;
                    const color = colors[Math.floor(Math.random() * colors.length)];

                    this.addParticle({
                        x: x + (Math.random() - 0.5) * 50,
                        y: y + (Math.random() - 0.5) * 50,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 50 + Math.random() * 30,
                        size: 5 + Math.random() * 8,
                        color: color,
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
}
