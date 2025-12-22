// ============================================
// GEOMETRY 3044 — ASTEROID CLASS
// ============================================
// Classic Asteroids-style obstacles in 8-bit pixel style
// Destructible obstacles that break into smaller pieces
// ============================================

import { config, getCurrentTheme } from '../config.js';

// ============================================
// ASTEROID CONFIGURATION
// Size tiers with different HP, points, and children
// ============================================
const ASTEROID_SIZES = {
    large: {
        size: 40,
        hp: 3,
        points: 100,
        speed: { min: 0.5, max: 1.5 },
        children: 2,          // Spawns 2 medium asteroids when destroyed
        childSize: 'medium'
    },
    medium: {
        size: 25,
        hp: 2,
        points: 150,
        speed: { min: 1.0, max: 2.0 },
        children: 2,          // Spawns 2 small asteroids when destroyed
        childSize: 'small'
    },
    small: {
        size: 12,
        hp: 1,
        points: 200,
        speed: { min: 1.5, max: 2.5 },
        children: 0,          // No children - fully destroyed
        childSize: null
    }
};

// 8-bit pixel patterns for different asteroid sizes
const ASTEROID_PATTERNS = {
    large: [
        [0,0,0,1,1,1,1,1,1,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,0,0],
        [0,1,1,1,0,0,1,1,1,1,1,0],
        [1,1,1,0,0,0,0,1,1,1,1,1],
        [1,1,1,1,0,0,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,0,1,1],
        [1,1,1,1,1,1,1,1,0,0,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,1,1,1,1,0],
        [0,1,1,1,0,0,1,1,1,1,1,0],
        [0,0,1,1,1,1,1,1,1,1,0,0],
        [0,0,0,1,1,1,1,1,1,0,0,0]
    ],
    medium: [
        [0,0,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,0],
        [1,1,0,1,1,1,1,1],
        [1,1,1,1,1,0,1,1],
        [1,1,1,1,1,1,1,1],
        [1,1,1,0,1,1,1,1],
        [0,1,1,1,1,1,1,0],
        [0,0,1,1,1,1,0,0]
    ],
    small: [
        [0,1,1,1,0],
        [1,1,0,1,1],
        [1,1,1,1,1],
        [1,0,1,1,1],
        [0,1,1,1,0]
    ]
};

export class Asteroid {
    constructor(x, y, sizeType = 'large', gameState = null) {
        this.x = x;
        this.y = y;
        this.sizeType = sizeType;
        this.active = true;

        // Get configuration for this size
        const cfg = ASTEROID_SIZES[sizeType] || ASTEROID_SIZES.large;
        this.size = cfg.size;
        this.hp = cfg.hp;
        this.maxHp = cfg.hp;
        this.points = cfg.points;
        this.children = cfg.children;
        this.childSize = cfg.childSize;

        // Random velocity
        const speed = cfg.speed.min + Math.random() * (cfg.speed.max - cfg.speed.min);
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        // Rotation
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.04;

        // Visual effects
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.hitFlash = 0;

        // Get theme colors
        const wave = gameState?.wave || 1;
        const theme = getCurrentTheme(wave);
        this.primaryColor = theme.secondary;
        this.accentColor = theme.accent;

        // Pixel pattern
        this.pattern = ASTEROID_PATTERNS[sizeType] || ASTEROID_PATTERNS.large;
        this.pixelSize = sizeType === 'large' ? 3 : (sizeType === 'medium' ? 3 : 2);

        // Store gameState reference
        this.gameState = gameState;

        // Sidescroller mode flag
        this.sidescrollerMode = false;
    }

    update(canvas, deltaTime = 1) {
        if (!this.active) return;

        const scaledDelta = Math.max(deltaTime, 0);

        // Update position
        if (this.sidescrollerMode) {
            // In sidescroller, asteroids drift left
            this.x += (this.vx - 1.5) * scaledDelta;
            this.y += this.vy * scaledDelta;
        } else {
            this.x += this.vx * scaledDelta;
            this.y += this.vy * scaledDelta;
        }

        // Update rotation
        this.rotation += this.rotationSpeed * scaledDelta;

        // Update pulse effect
        this.pulsePhase += 0.05 * scaledDelta;

        // Decrease hit flash
        if (this.hitFlash > 0) {
            this.hitFlash -= scaledDelta;
        }

        // Wrap around screen edges (classic Asteroids behavior)
        const margin = this.size;
        if (this.x < -margin) this.x = canvas.logicalWidth + margin;
        if (this.x > canvas.logicalWidth + margin) this.x = -margin;
        if (this.y < -margin) this.y = canvas.logicalHeight + margin;
        if (this.y > canvas.logicalHeight + margin) this.y = -margin;
    }

    takeDamage(amount = 1) {
        this.hp -= amount;
        this.hitFlash = 10; // Flash white when hit

        if (this.hp <= 0) {
            this.active = false;
            return true; // Destroyed
        }
        return false;
    }

    /**
     * Get child asteroids to spawn when this one is destroyed
     * @returns {Array} Array of {x, y, sizeType} objects for new asteroids
     */
    getChildAsteroids() {
        if (this.children === 0 || !this.childSize) return [];

        const children = [];
        for (let i = 0; i < this.children; i++) {
            // Spawn children with slight offset and different velocity
            const angle = (Math.PI * 2 * i / this.children) + (Math.random() - 0.5);
            const offset = this.size * 0.5;
            children.push({
                x: this.x + Math.cos(angle) * offset,
                y: this.y + Math.sin(angle) * offset,
                sizeType: this.childSize
            });
        }
        return children;
    }

    draw(ctx) {
        if (!this.active) return;

        const shadowsEnabled = typeof config !== 'undefined' && config.rendering?.shadowsEnabled !== false;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Glow effect
        if (shadowsEnabled) {
            const glowIntensity = 0.5 + Math.sin(this.pulsePhase) * 0.2;
            ctx.shadowBlur = 8 * glowIntensity;
            ctx.shadowColor = this.primaryColor;
        }

        // Hit flash effect
        const baseColor = this.hitFlash > 0 ? '#ffffff' : this.primaryColor;
        const accentColor = this.hitFlash > 0 ? '#ffffff' : this.accentColor;

        // Draw 8-bit pixel pattern
        this.draw8BitAsteroid(ctx, baseColor, accentColor);

        // HP indicator for larger asteroids
        if (this.hp > 1 && this.sizeType !== 'small') {
            ctx.rotate(-this.rotation); // Reset rotation for text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px Courier New';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.hp.toString(), 0, 0);
        }

        ctx.restore();
    }

    draw8BitAsteroid(ctx, primaryColor, accentColor) {
        const pattern = this.pattern;
        const p = this.pixelSize;

        const offsetX = -pattern[0].length * p / 2;
        const offsetY = -pattern.length * p / 2;

        // Create a gradient for depth effect
        const damageRatio = this.hp / this.maxHp;

        pattern.forEach((row, y) => {
            row.forEach((pixel, x) => {
                if (pixel) {
                    // Vary color slightly for texture
                    const isEdge = (y === 0 || y === pattern.length - 1 ||
                                   x === 0 || x === row.length - 1 ||
                                   (x > 0 && !pattern[y][x-1]) ||
                                   (x < row.length - 1 && !pattern[y][x+1]) ||
                                   (y > 0 && !pattern[y-1][x]) ||
                                   (y < pattern.length - 1 && !pattern[y+1][x]));

                    // Inner pixels are darker, edges are brighter
                    if (isEdge) {
                        ctx.fillStyle = primaryColor;
                    } else {
                        // Darker inner color
                        ctx.fillStyle = this.darkenColor(primaryColor, 0.6);
                    }

                    // Add damage cracks (missing pixels when damaged)
                    if (damageRatio < 1 && Math.random() > damageRatio + 0.3) {
                        ctx.fillStyle = accentColor;
                        ctx.globalAlpha = 0.5;
                    }

                    ctx.fillRect(offsetX + x * p, offsetY + y * p, p - 1, p - 1);
                    ctx.globalAlpha = 1;
                }
            });
        });

        // Add some crater details for larger asteroids
        if (this.sizeType === 'large') {
            ctx.fillStyle = this.darkenColor(primaryColor, 0.4);
            // Small crater marks
            ctx.fillRect(offsetX + 3 * p, offsetY + 3 * p, p, p);
            ctx.fillRect(offsetX + 7 * p, offsetY + 6 * p, p, p);
        }
    }

    darkenColor(hex, factor) {
        // Convert hex to RGB, darken, convert back
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        const newR = Math.floor(r * factor);
        const newG = Math.floor(g * factor);
        const newB = Math.floor(b * factor);

        return `rgb(${newR}, ${newG}, ${newB})`;
    }

    /**
     * Check collision with a circle (player or bullet)
     */
    checkCollision(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distSq = dx * dx + dy * dy;
        const radiusSum = this.size * 0.8 + (other.radius || other.size || 5);
        return distSq < radiusSum * radiusSum;
    }
}

// Export size types for external use
export const ASTEROID_SIZE_TYPES = Object.keys(ASTEROID_SIZES);
