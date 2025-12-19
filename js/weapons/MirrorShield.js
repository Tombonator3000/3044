/**
 * Geometry 3044 - Mirror Shield Weapon
 * Reflective shield that sends bullets back
 */

import { CONFIG } from '../config.js';
import { config, soundSystem } from '../globals.js';

const MIRROR_SHIELD = {
    name: 'MIRROR SHIELD',
    duration: 180,           // 3 seconds
    cooldown: 600,           // 10 seconds
    radius: 50,
    reflectDamageMultiplier: 2,
    color: '#00ffff',
    hexagonSides: 6
};

export class MirrorShield {
    constructor() {
        this.active = false;
        this.timer = 0;
        this.cooldown = 0;
        this.ripples = [];
        this.rotation = 0;
    }

    /**
     * Activate the mirror shield
     */
    activate() {
        if (this.cooldown > 0 || this.active) return false;

        this.active = true;
        this.timer = MIRROR_SHIELD.duration;

        if (soundSystem && soundSystem.play) {
            soundSystem.play('powerUp');
        }

        return true;
    }

    /**
     * Update the mirror shield
     */
    update(player, enemyBulletPool, enemies) {
        // Cooldown
        if (this.cooldown > 0) this.cooldown--;

        if (!this.active || !player) return;

        this.timer--;
        this.rotation += 0.02;

        // Deactivate when timer runs out
        if (this.timer <= 0) {
            this.active = false;
            this.cooldown = MIRROR_SHIELD.cooldown;
            return;
        }

        // Check enemy bullets for reflection
        if (enemyBulletPool && enemyBulletPool.getActiveBullets) {
            const bullets = enemyBulletPool.getActiveBullets();

            for (const bullet of bullets) {
                if (!bullet.active || bullet.isPlayerBullet || bullet.reflected) continue;

                const dist = Math.hypot(bullet.x - player.x, bullet.y - player.y);

                if (dist < MIRROR_SHIELD.radius + 10) {
                    // Reflect bullet!
                    bullet.reflected = true;

                    // Reverse direction toward nearest enemy
                    const nearestEnemy = this.findNearestEnemy(bullet, enemies);

                    if (nearestEnemy) {
                        const angle = Math.atan2(
                            nearestEnemy.y - bullet.y,
                            nearestEnemy.x - bullet.x
                        );
                        const speed = Math.hypot(bullet.vx, bullet.vy) * 1.5;
                        bullet.vx = Math.cos(angle) * speed;
                        bullet.vy = Math.sin(angle) * speed;
                    } else {
                        // Just reverse
                        bullet.vx *= -1.5;
                        bullet.vy *= -1.5;
                    }

                    // Convert to player bullet
                    bullet.isPlayerBullet = true;
                    bullet.damage = (bullet.damage || 10) * MIRROR_SHIELD.reflectDamageMultiplier;
                    bullet.color = '#00ffff';

                    // Visual ripple
                    this.ripples.push({
                        x: bullet.x,
                        y: bullet.y,
                        radius: 5,
                        maxRadius: 40,
                        life: 15
                    });

                    if (soundSystem && soundSystem.play) {
                        soundSystem.play('playerShoot');
                    }
                }
            }
        }

        // Update ripples
        this.ripples = this.ripples.filter(r => {
            r.radius += (r.maxRadius - r.radius) * 0.3;
            r.life--;
            return r.life > 0;
        });
    }

    /**
     * Find nearest enemy to a bullet
     */
    findNearestEnemy(bullet, enemies) {
        if (!enemies) return null;

        let nearest = null;
        let nearestDist = Infinity;

        for (const enemy of enemies) {
            if (!enemy.active) continue;
            const dist = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = enemy;
            }
        }

        return nearest;
    }

    /**
     * Draw the mirror shield
     */
    draw(ctx, player) {
        if (!this.active || !player) return;

        const time = Date.now() * 0.01;
        ctx.save();

        const alpha = Math.min(1, this.timer / 30);  // Fade in/out
        const pulse = 1 + Math.sin(time) * 0.08;

        ctx.translate(player.x, player.y);
        ctx.rotate(this.rotation);

        // Energy field background
        const fieldGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, MIRROR_SHIELD.radius * 1.2 * pulse);
        fieldGrad.addColorStop(0, `rgba(0, 100, 150, ${alpha * 0.1})`);
        fieldGrad.addColorStop(0.7, `rgba(0, 200, 255, ${alpha * 0.05})`);
        fieldGrad.addColorStop(1, 'rgba(0, 255, 255, 0)');

        ctx.fillStyle = fieldGrad;
        ctx.beginPath();
        ctx.arc(0, 0, MIRROR_SHIELD.radius * 1.2 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Outer hexagon glow
        ctx.strokeStyle = `rgba(0, 150, 200, ${alpha * 0.3})`;
        ctx.lineWidth = 8;
        ctx.shadowBlur = 40;
        ctx.shadowColor = '#00ffff';

        ctx.beginPath();
        for (let i = 0; i < MIRROR_SHIELD.hexagonSides; i++) {
            const angle = (Math.PI * 2 * i) / MIRROR_SHIELD.hexagonSides;
            const x = Math.cos(angle) * MIRROR_SHIELD.radius * pulse;
            const y = Math.sin(angle) * MIRROR_SHIELD.radius * pulse;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        // Main hexagon shield
        ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 25;
        ctx.stroke();

        // Animated holographic pattern
        for (let ring = 1; ring <= 3; ring++) {
            const ringRadius = MIRROR_SHIELD.radius * (ring / 4) * pulse;
            const ringAlpha = alpha * (0.5 - ring * 0.1);
            const ringRotation = time * (ring % 2 === 0 ? 1 : -1) * 0.5;

            ctx.save();
            ctx.rotate(ringRotation);

            ctx.strokeStyle = `rgba(100, 255, 255, ${ringAlpha})`;
            ctx.lineWidth = 1;
            ctx.shadowBlur = 10;

            ctx.beginPath();
            for (let i = 0; i < MIRROR_SHIELD.hexagonSides; i++) {
                const angle = (Math.PI * 2 * i) / MIRROR_SHIELD.hexagonSides;
                const x = Math.cos(angle) * ringRadius;
                const y = Math.sin(angle) * ringRadius;

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();

            ctx.restore();
        }

        // Vertex nodes
        for (let i = 0; i < MIRROR_SHIELD.hexagonSides; i++) {
            const angle = (Math.PI * 2 * i) / MIRROR_SHIELD.hexagonSides;
            const x = Math.cos(angle) * MIRROR_SHIELD.radius * pulse;
            const y = Math.sin(angle) * MIRROR_SHIELD.radius * pulse;
            const nodeGlow = 0.5 + Math.sin(time * 3 + i) * 0.5;

            // Node outer glow
            const nodeGrad = ctx.createRadialGradient(x, y, 0, x, y, 10);
            nodeGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * nodeGlow})`);
            nodeGrad.addColorStop(0.3, `rgba(0, 255, 255, ${alpha * nodeGlow * 0.8})`);
            nodeGrad.addColorStop(1, 'rgba(0, 255, 255, 0)');

            ctx.fillStyle = nodeGrad;
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.fill();

            // Node core
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * nodeGlow})`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Connection lines between nodes
        ctx.strokeStyle = `rgba(0, 200, 255, ${alpha * 0.3})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 6]);

        for (let i = 0; i < MIRROR_SHIELD.hexagonSides; i++) {
            const angle1 = (Math.PI * 2 * i) / MIRROR_SHIELD.hexagonSides;
            const angle2 = (Math.PI * 2 * ((i + 2) % MIRROR_SHIELD.hexagonSides)) / MIRROR_SHIELD.hexagonSides;

            ctx.beginPath();
            ctx.moveTo(
                Math.cos(angle1) * MIRROR_SHIELD.radius * pulse,
                Math.sin(angle1) * MIRROR_SHIELD.radius * pulse
            );
            ctx.lineTo(
                Math.cos(angle2) * MIRROR_SHIELD.radius * pulse,
                Math.sin(angle2) * MIRROR_SHIELD.radius * pulse
            );
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // Scanning line effect
        const scanAngle = time * 2;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffffff';

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(
            Math.cos(scanAngle) * MIRROR_SHIELD.radius * pulse,
            Math.sin(scanAngle) * MIRROR_SHIELD.radius * pulse
        );
        ctx.stroke();

        ctx.restore();

        // Draw ripples with enhanced effect
        ctx.save();
        for (const ripple of this.ripples) {
            const rippleAlpha = ripple.life / 15;

            // Outer ripple
            ctx.strokeStyle = `rgba(0, 200, 255, ${rippleAlpha * 0.5})`;
            ctx.lineWidth = 4;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ffff';
            ctx.beginPath();
            ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            ctx.stroke();

            // Inner ripple
            ctx.strokeStyle = `rgba(255, 255, 255, ${rippleAlpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(ripple.x, ripple.y, ripple.radius * 0.7, 0, Math.PI * 2);
            ctx.stroke();

            // Reflection flash
            const flashGrad = ctx.createRadialGradient(ripple.x, ripple.y, 0, ripple.x, ripple.y, ripple.radius);
            flashGrad.addColorStop(0, `rgba(255, 255, 255, ${rippleAlpha * 0.5})`);
            flashGrad.addColorStop(0.5, `rgba(0, 255, 255, ${rippleAlpha * 0.3})`);
            flashGrad.addColorStop(1, 'rgba(0, 255, 255, 0)');

            ctx.fillStyle = flashGrad;
            ctx.beginPath();
            ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Timer indicator with glow
        const timePercent = this.timer / MIRROR_SHIELD.duration;

        // Background bar
        ctx.fillStyle = `rgba(0, 100, 100, 0.5)`;
        ctx.fillRect(player.x - 26, player.y + MIRROR_SHIELD.radius + 9, 52, 6);

        // Fill bar
        const barGrad = ctx.createLinearGradient(player.x - 25, 0, player.x + 25, 0);
        barGrad.addColorStop(0, '#00ffff');
        barGrad.addColorStop(0.5, '#88ffff');
        barGrad.addColorStop(1, '#00ffff');

        ctx.fillStyle = barGrad;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00ffff';
        ctx.fillRect(player.x - 25, player.y + MIRROR_SHIELD.radius + 10, 50 * timePercent, 4);

        ctx.restore();
    }
}
