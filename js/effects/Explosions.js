/**
 * Geometry 3044 - Explosions Module
 * Epic 80s-style explosion effects and radical slang popups
 */

import { config } from '../globals.js';

/**
 * Epic 80s-style explosion with shockwaves, sparks, and debris
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
        this.life = 120;
        this.maxLife = 120;
        this.active = true;

        this.generateParticles();
        this.generateShockwaves();
        this.generateSparks();
        this.generateDebris();
    }

    generateParticles() {
        const particleCount = 60 * this.size;

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = (5 + Math.random() * 15) * this.size;

            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: i % 4 === 0 ? '#ffffff' :
                       i % 4 === 1 ? '#ffff00' :
                       i % 4 === 2 ? '#ff6600' : '#ff0000',
                size: Math.random() * 6 + 3,
                life: 80 + Math.random() * 40,
                maxLife: 120,
                gravity: 0.1,
                friction: 0.98,
                type: 'fire'
            });
        }
    }

    generateShockwaves() {
        for (let i = 0; i < 3; i++) {
            this.shockwaves.push({
                x: this.x,
                y: this.y,
                radius: 0,
                maxRadius: (100 + i * 50) * this.size,
                speed: (8 + i * 3) * this.size,
                life: 60,
                maxLife: 60,
                color: i === 0 ? '#ffffff' : i === 1 ? '#ffff00' : '#ff6600'
            });
        }
    }

    generateSparks() {
        const sparkCount = 40 * this.size;

        for (let i = 0; i < sparkCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (3 + Math.random() * 8) * this.size;

            this.sparks.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: '#ffffff',
                size: Math.random() * 2 + 1,
                life: 30 + Math.random() * 20,
                trail: [],
                maxTrailLength: 8
            });
        }
    }

    generateDebris() {
        const debrisCount = 20 * this.size;

        for (let i = 0; i < debrisCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (2 + Math.random() * 6) * this.size;

            this.debris.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                color: Math.random() > 0.5 ? '#666666' : '#444444',
                size: Math.random() * 4 + 2,
                life: 100 + Math.random() * 50,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.3,
                gravity: 0.15,
                bounce: 0.3
            });
        }
    }

    update() {
        this.life--;

        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.vx *= p.friction;
            p.vy *= p.friction;
            p.life--;
            return p.life > 0;
        });

        // Update shockwaves
        this.shockwaves = this.shockwaves.filter(s => {
            s.radius += s.speed;
            s.life--;
            return s.life > 0 && s.radius < s.maxRadius;
        });

        // Update sparks
        this.sparks = this.sparks.filter(s => {
            s.trail.push({x: s.x, y: s.y, life: 10});
            s.trail = s.trail.filter(t => {
                t.life--;
                return t.life > 0;
            });

            if (s.trail.length > s.maxTrailLength) {
                s.trail.shift();
            }

            s.x += s.vx;
            s.y += s.vy;
            s.vy += 0.1;
            s.vx *= 0.99;
            s.life--;
            return s.life > 0;
        });

        // Update debris
        this.debris = this.debris.filter(d => {
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
            return d.life > 0;
        });

        if (this.life <= 0 && this.particles.length === 0 &&
            this.shockwaves.length === 0 && this.sparks.length === 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.save();

        // Draw shockwaves
        this.shockwaves.forEach(s => {
            const alpha = s.life / s.maxLife;
            ctx.strokeStyle = s.color;
            ctx.lineWidth = 4;
            ctx.globalAlpha = alpha;
            ctx.shadowBlur = 20;
            ctx.shadowColor = s.color;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.stroke();
        });

        // Draw debris
        this.debris.forEach(d => {
            const alpha = d.life / 150;
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.rotate(d.rotation);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = d.color;
            ctx.fillRect(-d.size/2, -d.size/2, d.size, d.size);
            ctx.restore();
        });

        // Draw spark trails
        this.sparks.forEach(s => {
            if (s.trail.length > 1) {
                ctx.strokeStyle = s.color;
                ctx.lineWidth = 2;
                ctx.shadowBlur = 10;
                ctx.shadowColor = s.color;

                ctx.beginPath();
                ctx.moveTo(s.trail[0].x, s.trail[0].y);

                for (let i = 1; i < s.trail.length; i++) {
                    const alpha = s.trail[i].life / 10;
                    ctx.globalAlpha = alpha;
                    ctx.lineTo(s.trail[i].x, s.trail[i].y);
                }
                ctx.stroke();
            }
        });

        // Draw fire particles
        this.particles.forEach(p => {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

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

            const gradient = ctx.createLinearGradient(-100, 0, 100, 0);
            gradient.addColorStop(0, '#ff00ff');
            gradient.addColorStop(0.5, '#00ffff');
            gradient.addColorStop(1, '#ffff00');

            ctx.fillStyle = gradient;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.globalAlpha = this.alpha;

            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ff00ff';

            ctx.strokeText(this.activeText, 0, 0);
            ctx.fillText(this.activeText, 0, 0);

            ctx.restore();
        }
    }
}
