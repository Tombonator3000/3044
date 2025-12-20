/**
 * Geometry 3044 - Explosions Module
 * Epic 80s-style explosion effects and radical slang popups
 * OPTIMIZED for performance
 */

import { config } from '../globals.js';

// Performance settings
const explosionPerfSettings = {
    particleMultiplier: 1.0,
    enableTrails: true,
    enableShadows: true,
    maxShockwaves: 3
};

// Reduce particles on low-perf devices
const isLowPerfDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

if (isLowPerfDevice) {
    explosionPerfSettings.particleMultiplier = 0.4;
    explosionPerfSettings.enableTrails = false;
    explosionPerfSettings.enableShadows = false;
    explosionPerfSettings.maxShockwaves = 1;
}

/**
 * Epic 80s-style explosion with shockwaves, sparks, and debris - OPTIMIZED
 */
export class Epic80sExplosion {
    constructor(x, y, size = 1) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.particles = [];
        this.shockwaves = [];
        this.sparks = [];
        this.debris = [];
        this.life = 90; // Reduced from 120
        this.maxLife = 90;
        this.active = true;

        this.generateParticles();
        this.generateShockwaves();
        this.generateSparks();
        this.generateDebris();
    }

    generateParticles() {
        // Reduced particle count significantly
        const particleCount = Math.floor(20 * this.size * explosionPerfSettings.particleMultiplier);
        const colors = ['#ffffff', '#ffff00', '#ff6600', '#ff0000'];

        for (let i = 0; i < particleCount; i++) {
            const angle = (6.283185 * i) / particleCount;
            const speed = (5 + Math.random() * 12) * this.size;

            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[i & 3],
                size: Math.random() * 5 + 2,
                life: 50 + Math.random() * 30,
                maxLife: 80,
                gravity: 0.1,
                friction: 0.97
            });
        }
    }

    generateShockwaves() {
        const count = Math.min(2, explosionPerfSettings.maxShockwaves);
        const colors = ['#ffffff', '#ffff00'];
        for (let i = 0; i < count; i++) {
            this.shockwaves.push({
                x: this.x,
                y: this.y,
                radius: 0,
                maxRadius: (80 + i * 40) * this.size,
                speed: (10 + i * 3) * this.size,
                life: 40,
                maxLife: 40,
                color: colors[i]
            });
        }
    }

    generateSparks() {
        // Significantly reduced spark count
        const sparkCount = Math.floor(12 * this.size * explosionPerfSettings.particleMultiplier);

        for (let i = 0; i < sparkCount; i++) {
            const angle = Math.random() * 6.283185;
            const speed = (3 + Math.random() * 6) * this.size;

            this.sparks.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: '#ffffff',
                size: Math.random() * 2 + 1,
                life: 25 + Math.random() * 15,
                // Removed trail for performance
                prevX: this.x,
                prevY: this.y
            });
        }
    }

    generateDebris() {
        // Reduced debris count
        const debrisCount = Math.floor(8 * this.size * explosionPerfSettings.particleMultiplier);

        for (let i = 0; i < debrisCount; i++) {
            const angle = Math.random() * 6.283185;
            const speed = (2 + Math.random() * 5) * this.size;

            this.debris.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                color: Math.random() > 0.5 ? '#666666' : '#444444',
                size: Math.random() * 3 + 2,
                life: 60 + Math.random() * 30,
                rotation: Math.random() * 6.283185,
                rotationSpeed: (Math.random() - 0.5) * 0.3,
                gravity: 0.15,
                bounce: 0.3
            });
        }
    }

    update() {
        this.life--;

        // Update particles - avoid creating new array with filter
        let i = this.particles.length;
        while (i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.vx *= p.friction;
            p.vy *= p.friction;
            p.life--;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update shockwaves
        i = this.shockwaves.length;
        while (i--) {
            const s = this.shockwaves[i];
            s.radius += s.speed;
            s.life--;
            if (s.life <= 0 || s.radius >= s.maxRadius) {
                this.shockwaves.splice(i, 1);
            }
        }

        // Update sparks - simplified without trails
        i = this.sparks.length;
        while (i--) {
            const s = this.sparks[i];
            s.prevX = s.x;
            s.prevY = s.y;
            s.x += s.vx;
            s.y += s.vy;
            s.vy += 0.1;
            s.vx *= 0.99;
            s.life--;
            if (s.life <= 0) {
                this.sparks.splice(i, 1);
            }
        }

        // Update debris
        i = this.debris.length;
        while (i--) {
            const d = this.debris[i];
            d.x += d.vx;
            d.y += d.vy;
            d.vy += d.gravity;
            d.rotation += d.rotationSpeed;

            // Ground bounce
            if (d.y > config.height - d.size && d.vy > 0) {
                d.vy *= -d.bounce;
                d.vx *= 0.8;
            }

            d.life--;
            if (d.life <= 0) {
                this.debris.splice(i, 1);
            }
        }

        if (this.life <= 0 && this.particles.length === 0 &&
            this.shockwaves.length === 0 && this.sparks.length === 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.save();

        // Draw shockwaves - simplified
        for (let i = 0; i < this.shockwaves.length; i++) {
            const s = this.shockwaves[i];
            const alpha = s.life / s.maxLife;
            ctx.strokeStyle = s.color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, 6.283185);
            ctx.stroke();
        }

        // Draw debris - batch when possible
        for (let i = 0; i < this.debris.length; i++) {
            const d = this.debris[i];
            const alpha = d.life / 90;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = d.color;

            if (d.rotation !== 0) {
                ctx.save();
                ctx.translate(d.x, d.y);
                ctx.rotate(d.rotation);
                ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size);
                ctx.restore();
            } else {
                ctx.fillRect(d.x - d.size / 2, d.y - d.size / 2, d.size, d.size);
            }
        }

        // Draw sparks as simple lines from prev position
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        for (let i = 0; i < this.sparks.length; i++) {
            const s = this.sparks[i];
            ctx.globalAlpha = s.life / 40;
            ctx.beginPath();
            ctx.moveTo(s.prevX, s.prevY);
            ctx.lineTo(s.x, s.y);
            ctx.stroke();
        }

        // Draw fire particles - no shadows
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, 6.283185);
            ctx.fill();
        }

        ctx.restore();
    }
}

/**
 * Radical 80s slang popup text (RADICAL!, TUBULAR!, etc.)
 */
export class RadicalSlang {
    constructor(soundSystem = null) {
        this.soundSystem = soundSystem;
        this.phrases = [
            { text: "RADICAL!", minCombo: 3 },
            { text: "TUBULAR!", minCombo: 5 },
            { text: "GNARLY!", minCombo: 8 },
            { text: "BODACIOUS!", minCombo: 12 },
            { text: "WICKED!", minCombo: 15 },
            { text: "AWESOME!", minCombo: 20 },
            { text: "RIGHTEOUS!", minCombo: 25 },
            { text: "GROOVY!", minCombo: 30 },
            { text: "FAR OUT!", minCombo: 40 }
        ];
        this.activeText = null;
        this.x = config.width / 2;
        this.y = config.height / 2;
        this.scale = 0;
        this.alpha = 0;
        this.lifetime = 0;
    }

    trigger(combo) {
        for (let i = this.phrases.length - 1; i >= 0; i--) {
            if (combo >= this.phrases[i].minCombo) {
                this.activeText = this.phrases[i].text;
                this.scale = 0.5;
                this.alpha = 1;
                this.lifetime = 60;
                this.x = config.width / 2 + (Math.random() - 0.5) * 100;
                this.y = config.height / 2 + (Math.random() - 0.5) * 100;

                if (this.soundSystem && combo >= 25) {
                    setTimeout(() => this.soundSystem.playVoiceSample('RADICAL'), 100);
                }

                break;
            }
        }
    }

    update() {
        if (this.lifetime > 0) {
            this.lifetime--;
            this.scale += 0.02;
            if (this.lifetime < 20) {
                this.alpha -= 0.05;
            }
        }
    }

    draw(ctx) {
        if (this.lifetime > 0 && this.activeText) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.scale(this.scale, this.scale);
            ctx.rotate(Math.sin(this.lifetime * 0.1) * 0.1);

            ctx.font = 'bold 48px Courier New';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = this.alpha;

            // Simple solid colors instead of gradient for performance
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.strokeText(this.activeText, 0, 0);

            ctx.fillStyle = '#ff00ff';
            ctx.fillText(this.activeText, 0, 0);

            ctx.restore();
        }
    }
}
