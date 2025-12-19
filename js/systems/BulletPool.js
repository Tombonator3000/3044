/**
 * Geometry 3044 - BulletPool System Module
 * Object pool pattern for efficient bullet management
 */

import { CONFIG } from '../config.js';
import { config } from '../globals.js';
import { Bullet } from '../entities/Bullet.js';

/**
 * BulletPool Class
 * Manages a pool of bullets for memory-efficient projectile handling
 */
export class BulletPool {
    constructor(isPlayerPool = true) {
        this.bullets = [];
        this.maxBullets = CONFIG.bullets.poolSize;
        this.cleanupCounter = 0;
        this.lastCleanupCount = 0;
        this.isPlayerPool = isPlayerPool;
    }

    /**
     * Get a bullet from the pool (reuse inactive or create new)
     */
    get(x, y, vx, vy, isPlayerBullet) {
        // Early rejection if approaching limit for enemy bullets
        if (this.bullets.length > this.maxBullets * 0.9 && !isPlayerBullet) {
            return null;
        }

        // Find inactive bullet first
        for (let bullet of this.bullets) {
            if (!bullet.active) {
                bullet.reset(x, y, vx, vy, isPlayerBullet);
                return bullet;
            }
        }

        // Create new bullet only if under limit
        if (this.bullets.length < this.maxBullets) {
            const bullet = new Bullet(x, y, vx, vy, isPlayerBullet);
            this.bullets.push(bullet);
            return bullet;
        }

        // If at limit, reuse oldest enemy bullet (preserve player bullets)
        if (!isPlayerBullet) {
            for (let bullet of this.bullets) {
                if (!bullet.isPlayerBullet && (!bullet.active ||
                    bullet.x < -50 || bullet.x > config.width + 50 ||
                    bullet.y < -50 || bullet.y > config.height + 50)) {
                    bullet.reset(x, y, vx, vy, isPlayerBullet);
                    return bullet;
                }
            }
        }

        return null;
    }

    /**
     * Update all bullets in the pool
     */
    update() {
        this.cleanupCounter++;

        // Update active bullets
        for (let bullet of this.bullets) {
            if (bullet.active) {
                bullet.update();
            }
        }

        // Adaptive cleanup interval based on bullet count
        const cleanupInterval = this.bullets.length > 50 ?
            CONFIG.bullets.cleanupIntervalHigh : CONFIG.bullets.cleanupIntervalLow;

        if (this.cleanupCounter >= cleanupInterval) {
            this.performCleanup();
            this.cleanupCounter = 0;
        }
    }

    /**
     * Clean up inactive and off-screen bullets
     */
    performCleanup() {
        const activeBefore = this.getActiveCount();

        // Mark far off-screen bullets as inactive
        for (let bullet of this.bullets) {
            if (bullet.active && (
                bullet.x < -CONFIG.bullets.farOffScreenMargin ||
                bullet.x > config.width + CONFIG.bullets.farOffScreenMargin ||
                bullet.y < -CONFIG.bullets.farOffScreenMargin ||
                bullet.y > config.height + CONFIG.bullets.farOffScreenMargin
            )) {
                bullet.active = false;
            }
        }

        // Compact array when too many inactive bullets
        if (this.bullets.length > this.maxBullets * 0.8) {
            this.bullets = this.bullets.filter(b => b.active);
            console.log(`🧹 Bullet pool compacted: ${this.bullets.length} bullets remaining`);
        }

        const activeAfter = this.getActiveCount();
        if (activeBefore !== activeAfter && activeAfter < this.lastCleanupCount - 5) {
            console.log(`🧹 Bullet cleanup: ${activeBefore} → ${activeAfter} active bullets`);
        }
        this.lastCleanupCount = activeAfter;
    }

    /**
     * Draw all active bullets
     */
    draw(ctx) {
        ctx.save();
        for (let bullet of this.bullets) {
            if (bullet.active) {
                bullet.draw(ctx);
            }
        }
        ctx.restore();
    }

    /**
     * Deactivate all bullets
     */
    clear() {
        for (let bullet of this.bullets) {
            bullet.active = false;
        }
    }

    /**
     * Get array of active bullets (creates new array)
     */
    getActiveBullets() {
        return this.bullets.filter(b => b.active);
    }

    /**
     * Get count of active bullets (no array creation)
     */
    getActiveCount() {
        let count = 0;
        for (let bullet of this.bullets) {
            if (bullet.active) count++;
        }
        return count;
    }

    /**
     * Get total pool size
     */
    getTotalCount() {
        return this.bullets.length;
    }

    /**
     * Get pool stats for debugging
     */
    getStats() {
        return {
            total: this.bullets.length,
            active: this.getActiveCount(),
            maxAllowed: this.maxBullets,
            utilizationPercent: Math.round((this.bullets.length / this.maxBullets) * 100)
        };
    }
}
