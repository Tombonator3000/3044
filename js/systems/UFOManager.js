/**
 * Geometry 3044 - UFO Manager
 * Handles mystery UFO spawning and behavior for bonus points
 */

import { config } from '../globals.js';

/**
 * UFO class - Mystery bonus enemy
 */
class UFO {
    constructor(x, y, type, direction) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.direction = direction;
        this.speed = type.speed;
        this.size = type.size;
        this.color = type.color;
        this.points = type.points;
        this.active = true;
        this.health = type.health || 3;
        this.wobbleOffset = Math.random() * Math.PI * 2;
        this.glowPulse = 0;
    }

    update() {
        // Move across screen
        this.x += this.speed * this.direction;

        // Wobble up and down
        this.wobbleOffset += 0.05;
        this.y += Math.sin(this.wobbleOffset) * 0.5;

        // Glow pulse
        this.glowPulse = (this.glowPulse + 0.1) % (Math.PI * 2);

        // Deactivate if off screen
        if (this.direction > 0 && this.x > config.width + 100) {
            this.active = false;
        } else if (this.direction < 0 && this.x < -100) {
            this.active = false;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Glow effect
        const glowIntensity = 0.5 + Math.sin(this.glowPulse) * 0.3;
        ctx.shadowBlur = 20 * glowIntensity;
        ctx.shadowColor = this.color;

        // Draw UFO body (classic saucer shape)
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color + '88';
        ctx.fill();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw dome
        ctx.beginPath();
        ctx.ellipse(0, -this.size * 0.2, this.size * 0.5, this.size * 0.3, 0, Math.PI, 0);
        ctx.fillStyle = this.color + 'aa';
        ctx.fill();
        ctx.stroke();

        // Draw lights
        const lightCount = 5;
        for (let i = 0; i < lightCount; i++) {
            const angle = (Math.PI / (lightCount - 1)) * i;
            const lx = Math.cos(angle) * this.size * 0.8;
            const ly = Math.sin(angle) * this.size * 0.2;

            const lightOn = Math.sin(this.glowPulse + i) > 0;
            ctx.beginPath();
            ctx.arc(lx, ly, 3, 0, Math.PI * 2);
            ctx.fillStyle = lightOn ? '#ffffff' : '#666666';
            ctx.fill();
        }

        // Draw points indicator
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.fillText(this.points.toLocaleString(), 0, -this.size - 10);

        ctx.restore();
    }
}

/**
 * UFOManager class - Manages UFO spawning and updates
 */
export class UFOManager {
    constructor() {
        this.ufos = [];
        this.spawnTimer = 0;
        this.baseSpawnRate = 1800; // Frames between spawn checks
        this.lastSpawnTime = 0;
        this.ufoTypes = [
            { type: 'scout', points: 1000, color: '#00ffff', size: 25, speed: 2.5, health: 2 },
            { type: 'cruiser', points: 2500, color: '#ff6600', size: 30, speed: 2, health: 4 },
            { type: 'mothership', points: 5000, color: '#ff00ff', size: 40, speed: 1.5, health: 6 }
        ];
    }

    /**
     * Reset manager state
     */
    reset() {
        this.ufos = [];
        this.spawnTimer = 0;
    }

    /**
     * Update all UFOs
     */
    update() {
        this.spawnTimer++;

        // Random spawn chance after base spawn rate
        if (this.spawnTimer > this.baseSpawnRate) {
            if (Math.random() < 0.002 && this.ufos.length === 0) {
                this.spawnUFO();
                this.spawnTimer = 0;
            }
        }

        // Update all UFOs
        this.ufos.forEach(ufo => {
            if (ufo.active) {
                ufo.update();
            }
        });

        // Remove inactive UFOs
        this.ufos = this.ufos.filter(ufo => ufo.active);
    }

    /**
     * Spawn a new UFO
     */
    spawnUFO() {
        let ufoType;
        const rand = Math.random();
        if (rand < 0.6) {
            ufoType = this.ufoTypes[0]; // Scout - 60%
        } else if (rand < 0.85) {
            ufoType = this.ufoTypes[1]; // Cruiser - 25%
        } else {
            ufoType = this.ufoTypes[2]; // Mothership - 15%
        }

        const direction = Math.random() < 0.5 ? 1 : -1;
        const startX = direction > 0 ? -100 : config.width + 100;
        const y = 60 + Math.random() * 100;

        const ufo = new UFO(startX, y, ufoType, direction);
        this.ufos.push(ufo);

        console.log(`🛸 UFO spawned: ${ufoType.type} worth ${ufoType.points} points!`);

        return ufoType;
    }

    /**
     * Get all active UFOs for collision detection
     * @returns {Array} Active UFOs
     */
    getActiveUFOs() {
        return this.ufos.filter(ufo => ufo.active);
    }

    /**
     * Draw all UFOs
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        this.ufos.forEach(ufo => {
            if (ufo.active) {
                ufo.draw(ctx);
            }
        });
    }
}
