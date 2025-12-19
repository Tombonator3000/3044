/**
 * Geometry 3044 - Bullet Entity Module
 * Bullet class for individual projectiles
 * Note: BulletPool has moved to systems/BulletPool.js
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
