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
        const time = Date.now() * 0.001;

        ctx.save();

        const alpha = Math.min(1, this.timer / 30);
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.05;
        const radius = TIME_FRACTURE.radius * pulse;

        // Space warping background effect
        const warpGrad = ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, radius
        );
        warpGrad.addColorStop(0, `rgba(0, 50, 100, ${alpha * 0.15})`);
        warpGrad.addColorStop(0.5, `rgba(0, 100, 200, ${alpha * 0.08})`);
        warpGrad.addColorStop(0.8, `rgba(0, 136, 255, ${alpha * 0.05})`);
        warpGrad.addColorStop(1, 'rgba(0, 136, 255, 0)');

        ctx.fillStyle = warpGrad;
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Outer distortion ring with glow layers
        ctx.strokeStyle = `rgba(0, 100, 200, ${alpha * 0.2})`;
        ctx.lineWidth = 10;
        ctx.shadowBlur = 50;
        ctx.shadowColor = TIME_FRACTURE.color;

        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(0, 136, 255, ${alpha * 0.5})`;
        ctx.lineWidth = 4;
        ctx.shadowBlur = 30;
        ctx.stroke();

        ctx.strokeStyle = `rgba(100, 200, 255, ${alpha * 0.8})`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.stroke();

        // Animated inner rings with wave effect
        for (let i = 1; i <= 5; i++) {
            const waveOffset = Math.sin(time * 2 + i * 0.5) * 10;
            const ringRadius = radius * (i / 6) + waveOffset;
            const ringAlpha = alpha * (0.4 - i * 0.06);

            ctx.strokeStyle = `rgba(0, 170, 255, ${ringAlpha})`;
            ctx.lineWidth = 2 - i * 0.2;
            ctx.shadowBlur = 10;

            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, Math.max(10, ringRadius), 0, Math.PI * 2);
            ctx.stroke();
        }

        // Time spiral effect
        ctx.strokeStyle = `rgba(100, 200, 255, ${alpha * 0.3})`;
        ctx.lineWidth = 1.5;

        for (let spiral = 0; spiral < 2; spiral++) {
            ctx.beginPath();
            for (let t = 0; t < Math.PI * 4; t += 0.1) {
                const spiralRadius = 20 + (t / (Math.PI * 4)) * (radius - 30);
                const spiralAngle = t + time * 2 + spiral * Math.PI;
                const x = this.centerX + Math.cos(spiralAngle) * spiralRadius;
                const y = this.centerY + Math.sin(spiralAngle) * spiralRadius;

                if (t === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // Distortion lines with gradients
        for (const line of this.distortionLines) {
            const x1 = this.centerX + Math.cos(line.angle) * 30;
            const y1 = this.centerY + Math.sin(line.angle) * 30;
            const x2 = this.centerX + Math.cos(line.angle) * (radius - line.offset);
            const y2 = this.centerY + Math.sin(line.angle) * (radius - line.offset);

            const lineGrad = ctx.createLinearGradient(x1, y1, x2, y2);
            lineGrad.addColorStop(0, `rgba(100, 200, 255, ${alpha * 0.6})`);
            lineGrad.addColorStop(0.5, `rgba(0, 136, 255, ${alpha * 0.3})`);
            lineGrad.addColorStop(1, 'rgba(0, 136, 255, 0)');

            ctx.strokeStyle = lineGrad;
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#00aaff';

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            // Particle at end
            const particleGlow = 0.5 + Math.sin(time * 5 + line.angle) * 0.5;
            ctx.fillStyle = `rgba(200, 230, 255, ${alpha * particleGlow})`;
            ctx.beginPath();
            ctx.arc(x2, y2, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Clock face
        ctx.save();
        ctx.translate(this.centerX, this.centerY);

        // Clock circle
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.stroke();

        // Hour markers
        for (let i = 0; i < 12; i++) {
            const markerAngle = (i / 12) * Math.PI * 2 - Math.PI / 2;
            const innerR = 18;
            const outerR = 22;

            ctx.strokeStyle = `rgba(200, 230, 255, ${alpha * 0.7})`;
            ctx.lineWidth = i % 3 === 0 ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(Math.cos(markerAngle) * innerR, Math.sin(markerAngle) * innerR);
            ctx.lineTo(Math.cos(markerAngle) * outerR, Math.sin(markerAngle) * outerR);
            ctx.stroke();
        }

        // Clock hands - frozen/slow motion
        const hourAngle = time * 0.1 - Math.PI / 2;
        const minuteAngle = time * 0.5 - Math.PI / 2;
        const secondAngle = time * 2 - Math.PI / 2;

        // Hour hand
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(hourAngle) * 10, Math.sin(hourAngle) * 10);
        ctx.stroke();

        // Minute hand
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(minuteAngle) * 15, Math.sin(minuteAngle) * 15);
        ctx.stroke();

        // Second hand (glowing, slow)
        ctx.strokeStyle = `rgba(0, 200, 255, ${alpha})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ccff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(secondAngle) * 18, Math.sin(secondAngle) * 18);
        ctx.stroke();

        // Center dot
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Enhanced chromatic aberration
        ctx.globalCompositeOperation = 'screen';

        // Red shift (right)
        ctx.globalAlpha = alpha * 0.08;
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(this.centerX + 4, this.centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Green slight shift
        ctx.globalAlpha = alpha * 0.05;
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY + 2, radius, 0, Math.PI * 2);
        ctx.fill();

        // Blue shift (left)
        ctx.globalAlpha = alpha * 0.08;
        ctx.fillStyle = '#0000ff';
        ctx.beginPath();
        ctx.arc(this.centerX - 4, this.centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;

        // Floating time particles
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const particleAngle = (i / particleCount) * Math.PI * 2 + time;
            const particleRadius = 50 + Math.sin(time * 2 + i) * 30 + i * 8;

            if (particleRadius < radius - 10) {
                const px = this.centerX + Math.cos(particleAngle) * particleRadius;
                const py = this.centerY + Math.sin(particleAngle) * particleRadius;
                const particleSize = 1 + Math.sin(time * 3 + i) * 0.5;

                ctx.fillStyle = `rgba(150, 220, 255, ${alpha * 0.6})`;
                ctx.shadowBlur = 5;
                ctx.shadowColor = '#88ccff';
                ctx.beginPath();
                ctx.arc(px, py, particleSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Timer bar with gradient
        const timePercent = this.timer / TIME_FRACTURE.duration;

        // Background
        ctx.fillStyle = 'rgba(0, 50, 100, 0.5)';
        ctx.fillRect(this.centerX - 41, this.centerY + radius + 9, 82, 6);

        // Fill
        const barGrad = ctx.createLinearGradient(this.centerX - 40, 0, this.centerX + 40, 0);
        barGrad.addColorStop(0, '#0088ff');
        barGrad.addColorStop(0.5, '#00ccff');
        barGrad.addColorStop(1, '#0088ff');

        ctx.globalAlpha = 0.9;
        ctx.fillStyle = barGrad;
        ctx.shadowBlur = 8;
        ctx.shadowColor = TIME_FRACTURE.color;
        ctx.fillRect(this.centerX - 40, this.centerY + radius + 10, 80 * timePercent, 4);

        ctx.restore();
    }
}
