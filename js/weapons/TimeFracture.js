/**
 * Geometry 3044 - Time Fracture Weapon
 * Bullet-time zone around the player
 */

import { CONFIG } from '../config.js';
import { config, soundSystem } from '../globals.js';

const TIME_FRACTURE = {
    name: 'TIME FRACTURE',
    duration: 300,           // 5 seconds
    cooldown: 900,           // 15 seconds
    radius: 250,
    slowFactor: 0.2,         // 20% speed for enemies
    playerSpeedBoost: 1.5,
    color: '#0088ff',
    distortionColor: '#00aaff'
};

export class TimeFracture {
    constructor() {
        this.active = false;
        this.timer = 0;
        this.cooldown = 0;
        this.pulsePhase = 0;
        this.distortionLines = [];
        this.centerX = 0;
        this.centerY = 0;
    }

    /**
     * Activate time fracture
     */
    activate(player) {
        if (!player) return false;
        if (this.cooldown > 0 || this.active) return false;

        this.active = true;
        this.timer = TIME_FRACTURE.duration;
        this.centerX = player.x;
        this.centerY = player.y;

        // Generate distortion lines
        this.distortionLines = [];
        for (let i = 0; i < 12; i++) {
            this.distortionLines.push({
                angle: (Math.PI * 2 * i) / 12,
                offset: Math.random() * 20,
                speed: 0.5 + Math.random() * 0.5
            });
        }

        if (soundSystem && soundSystem.play) {
            soundSystem.play('powerUp');
        }

        return true;
    }

    /**
     * Update time fracture
     */
    update(player, enemies, enemyBullets) {
        if (this.cooldown > 0) this.cooldown--;

        if (!this.active) return { enemySpeedMult: 1, playerSpeedMult: 1 };

        this.timer--;
        this.pulsePhase += 0.1;

        // Follow player
        if (player) {
            this.centerX = player.x;
            this.centerY = player.y;
        }

        // Update distortion lines
        for (const line of this.distortionLines) {
            line.angle += 0.01 * line.speed;
        }

        if (this.timer <= 0) {
            this.active = false;
            this.cooldown = TIME_FRACTURE.cooldown;
            return { enemySpeedMult: 1, playerSpeedMult: 1 };
        }

        // Apply slow to enemies in radius
        if (enemies) {
            for (const enemy of enemies) {
                if (!enemy.active) continue;
                const dist = Math.hypot(enemy.x - this.centerX, enemy.y - this.centerY);

                if (dist < TIME_FRACTURE.radius) {
                    // Scale slow based on distance (slower near center)
                    const slowAmount = 1 - (dist / TIME_FRACTURE.radius);
                    enemy.timeScale = TIME_FRACTURE.slowFactor + (1 - TIME_FRACTURE.slowFactor) * (1 - slowAmount);
                } else {
                    enemy.timeScale = 1;
                }
            }
        }

        // Slow enemy bullets
        if (enemyBullets && enemyBullets.getActiveBullets) {
            for (const bullet of enemyBullets.getActiveBullets()) {
                if (!bullet.active || bullet.isPlayerBullet) continue;

                const dist = Math.hypot(bullet.x - this.centerX, bullet.y - this.centerY);

                if (dist < TIME_FRACTURE.radius) {
                    bullet.timeScale = TIME_FRACTURE.slowFactor;
                } else {
                    bullet.timeScale = 1;
                }
            }
        }

        return {
            enemySpeedMult: TIME_FRACTURE.slowFactor,
            playerSpeedMult: TIME_FRACTURE.playerSpeedBoost
        };
    }

    /**
     * Draw time fracture effect
     */
    draw(ctx) {
        if (!this.active) return;

        const screenWidth = config.width || 800;
        const screenHeight = config.height || 600;

        ctx.save();

        const alpha = Math.min(1, this.timer / 30);
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.05;
        const radius = TIME_FRACTURE.radius * pulse;

        // Outer distortion ring
        ctx.strokeStyle = `rgba(0, 136, 255, ${alpha * 0.5})`;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 30;
        ctx.shadowColor = TIME_FRACTURE.color;

        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner rings with distortion
        for (let i = 1; i <= 3; i++) {
            const ringRadius = radius * (i / 4);
            ctx.strokeStyle = `rgba(0, 170, 255, ${alpha * 0.3 / i})`;
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Distortion lines
        ctx.strokeStyle = `rgba(0, 136, 255, ${alpha * 0.4})`;
        ctx.lineWidth = 1;

        for (const line of this.distortionLines) {
            const x1 = this.centerX + Math.cos(line.angle) * 30;
            const y1 = this.centerY + Math.sin(line.angle) * 30;
            const x2 = this.centerX + Math.cos(line.angle) * (radius - line.offset);
            const y2 = this.centerY + Math.sin(line.angle) * (radius - line.offset);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        // Center clock icon
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
        ctx.font = 'bold 20px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00aaff';
        ctx.fillText('⏱', this.centerX, this.centerY - 40);

        // Chromatic aberration overlay hint
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = alpha * 0.1;

        // Red shift
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(this.centerX + 2, this.centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Blue shift
        ctx.fillStyle = '#0000ff';
        ctx.beginPath();
        ctx.arc(this.centerX - 2, this.centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = 'source-over';

        // Timer bar
        const timePercent = this.timer / TIME_FRACTURE.duration;
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = TIME_FRACTURE.color;
        ctx.fillRect(this.centerX - 40, this.centerY + radius + 10, 80 * timePercent, 4);

        ctx.restore();
    }
}
