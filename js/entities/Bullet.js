/**
 * Geometry 3044 - Bullet Entity Module
 * Bullet and BulletPool classes for projectile management
 */

import { CONFIG } from '../config.js';
import { config } from '../globals.js';

/**
 * Bullet Class
 * Individual projectile with velocity and rendering
 */
export class Bullet {
    constructor(x, y, vx, vy, isPlayerBullet) {
        this.reset(x, y, vx, vy, isPlayerBullet);
    }

    reset(x, y, vx, vy, isPlayerBullet) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.isPlayerBullet = isPlayerBullet;
        this.active = true;
        this.damage = isPlayerBullet ? 1 : 1;
    }

    update() {
        if (!this.active) return;

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < -CONFIG.bullets.offScreenMargin ||
            this.x > config.width + CONFIG.bullets.offScreenMargin ||
            this.y < -CONFIG.bullets.offScreenMargin ||
            this.y > config.height + CONFIG.bullets.offScreenMargin) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();

        const color = this.isPlayerBullet ? CONFIG.colors.playerBullet : CONFIG.colors.enemyBullet;

        ctx.fillStyle = color;
        ctx.shadowBlur = CONFIG.bullets.shadowBlur;
        ctx.shadowColor = color;
        ctx.globalAlpha = 0.8;

        ctx.beginPath();
        ctx.arc(this.x, this.y,
            this.isPlayerBullet ? CONFIG.bullets.playerRadius : CONFIG.bullets.enemyRadius,
            0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y,
            this.isPlayerBullet ? CONFIG.bullets.playerInnerRadius : CONFIG.bullets.enemyInnerRadius,
            0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 2, this.y - this.vy * 2);
        ctx.stroke();

        ctx.restore();
    }
}

/**
 * BulletPool Class
 * Object pool pattern for efficient bullet management
 */
export class BulletPool {
    constructor() {
        this.bullets = [];
        this.maxBullets = CONFIG.bullets.poolSize;
        this.cleanupCounter = 0;
        this.lastCleanupCount = 0;
    }

    get(x, y, vx, vy, isPlayerBullet) {
        // Early rejection if approaching limit
        if (this.bullets.length > this.maxBullets * 0.9 && !isPlayerBullet) {
            return null; // Don't spawn enemy bullets when near limit
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

    update() {
        this.cleanupCounter++;

        // Regular update
        this.bullets.forEach(bullet => {
            if (bullet.active) {
                bullet.update();
            }
        });

        // More frequent cleanup when high bullet count
        const cleanupInterval = this.bullets.length > 50 ?
            CONFIG.bullets.cleanupIntervalHigh : CONFIG.bullets.cleanupIntervalLow;

        if (this.cleanupCounter >= cleanupInterval) {
            this.performCleanup();
            this.cleanupCounter = 0;
        }
    }

    performCleanup() {
        const activeBefore = this.bullets.filter(b => b.active).length;

        // Remove bullets that are far off-screen
        this.bullets.forEach(bullet => {
            if (bullet.active && (
                bullet.x < -CONFIG.bullets.farOffScreenMargin ||
                bullet.x > config.width + CONFIG.bullets.farOffScreenMargin ||
                bullet.y < -CONFIG.bullets.farOffScreenMargin ||
                bullet.y > config.height + CONFIG.bullets.farOffScreenMargin
            )) {
                bullet.active = false;
            }
        });

        // Remove inactive bullets from array when too many
        if (this.bullets.length > this.maxBullets * 0.8) {
            this.bullets = this.bullets.filter(b => b.active);
            console.log(`🧹 Bullet pool compacted: ${this.bullets.length} bullets remaining`);
        }

        const activeAfter = this.bullets.filter(b => b.active).length;
        if (activeBefore !== activeAfter && activeAfter < this.lastCleanupCount - 5) {
            console.log(`🧹 Bullet cleanup: ${activeBefore} → ${activeAfter} active bullets`);
        }
        this.lastCleanupCount = activeAfter;
    }

    draw(ctx) {
        ctx.save();
        this.bullets.forEach(bullet => {
            if (bullet.active) bullet.draw(ctx);
        });
        ctx.restore();
    }

    clear() {
        this.bullets.forEach(bullet => bullet.active = false);
    }

    getActiveBullets() {
        return this.bullets.filter(b => b.active);
    }

    // Get active count without filtering
    getActiveCount() {
        let count = 0;
        for (let bullet of this.bullets) {
            if (bullet.active) count++;
        }
        return count;
    }
}
