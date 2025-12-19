/**
 * Geometry 3044 - Synthwave Annihilator (ULTIMATE)
 * Fills screen with neon grid destruction
 */

import { CONFIG } from '../config.js';
import { config, gameState, particleSystem, soundSystem } from '../globals.js';

const SYNTHWAVE_ANNIHILATOR = {
    name: 'SYNTHWAVE ANNIHILATOR',
    duration: 180,           // 3 seconds of chaos
    gridDamage: 5,           // Damage per frame for touching grid
    cooldown: 1800,          // 30 seconds (ULTIMATE!)
    gridSpacing: 60,
    gridSpeed: 2,
    colors: ['#ff00ff', '#00ffff', '#ffff00', '#ff0088', '#00ff88']
};

export class SynthwaveAnnihilator {
    constructor() {
        this.active = false;
        this.timer = 0;
        this.cooldown = 0;
        this.gridOffset = 0;
        this.colorPhase = 0;
        this.pulseWaves = [];
    }

    /**
     * Activate the ultimate
     */
    activate() {
        if (this.cooldown > 0 || this.active) return false;

        this.active = true;
        this.timer = SYNTHWAVE_ANNIHILATOR.duration;
        this.gridOffset = 0;
        this.colorPhase = 0;

        const screenWidth = config.width || 800;
        const screenHeight = config.height || 600;

        // Initial pulse wave
        this.pulseWaves.push({
            x: screenWidth / 2,
            y: screenHeight / 2,
            radius: 0,
            maxRadius: Math.max(screenWidth, screenHeight),
            life: 60
        });

        // Screen shake
        if (gameState && gameState.triggerScreenShake) {
            gameState.triggerScreenShake('bomb');
        }

        if (soundSystem && soundSystem.play) {
            soundSystem.play('explosion');
        }

        return true;
    }

    /**
     * Update the synthwave annihilator
     */
    update(enemies, enemyBullets) {
        if (this.cooldown > 0) this.cooldown--;

        if (!this.active) return;

        const screenWidth = config.width || 800;
        const screenHeight = config.height || 600;

        this.timer--;
        this.gridOffset = (this.gridOffset + SYNTHWAVE_ANNIHILATOR.gridSpeed) % SYNTHWAVE_ANNIHILATOR.gridSpacing;
        this.colorPhase += 0.05;

        // Add periodic pulse waves
        if (this.timer % 30 === 0) {
            this.pulseWaves.push({
                x: Math.random() * screenWidth,
                y: Math.random() * screenHeight,
                radius: 0,
                maxRadius: 200 + Math.random() * 200,
                life: 40
            });
        }

        // Damage ALL enemies continuously
        if (enemies) {
            for (const enemy of enemies) {
                if (!enemy.active) continue;

                // Check if enemy is on a grid line
                const onVertical = Math.abs((enemy.x + this.gridOffset) % SYNTHWAVE_ANNIHILATOR.gridSpacing) < 10;
                const onHorizontal = Math.abs((enemy.y + this.gridOffset) % SYNTHWAVE_ANNIHILATOR.gridSpacing) < 10;

                if (onVertical || onHorizontal) {
                    if (enemy.takeDamage) {
                        enemy.takeDamage(SYNTHWAVE_ANNIHILATOR.gridDamage);
                    } else {
                        enemy.hp -= SYNTHWAVE_ANNIHILATOR.gridDamage;
                        if (enemy.hp <= 0) enemy.active = false;
                    }

                    // Sparks
                    if (Math.random() < 0.2 && particleSystem) {
                        particleSystem.sparks(enemy.x, enemy.y, this.getCurrentColor(), 3);
                    }
                }
            }
        }

        // Destroy enemy bullets on grid
        if (enemyBullets && enemyBullets.getActiveBullets) {
            for (const bullet of enemyBullets.getActiveBullets()) {
                if (!bullet.active || bullet.isPlayerBullet) continue;

                const onVertical = Math.abs((bullet.x + this.gridOffset) % SYNTHWAVE_ANNIHILATOR.gridSpacing) < 8;
                const onHorizontal = Math.abs((bullet.y + this.gridOffset) % SYNTHWAVE_ANNIHILATOR.gridSpacing) < 8;

                if (onVertical || onHorizontal) {
                    bullet.active = false;
                }
            }
        }

        // Update pulse waves
        this.pulseWaves = this.pulseWaves.filter(wave => {
            wave.radius += (wave.maxRadius - wave.radius) * 0.1;
            wave.life--;
            return wave.life > 0;
        });

        if (this.timer <= 0) {
            this.active = false;
            this.cooldown = SYNTHWAVE_ANNIHILATOR.cooldown;
        }
    }

    /**
     * Get current cycling color
     */
    getCurrentColor() {
        const index = Math.floor(this.colorPhase) % SYNTHWAVE_ANNIHILATOR.colors.length;
        return SYNTHWAVE_ANNIHILATOR.colors[index];
    }

    /**
     * Convert hex to RGB string
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
            : '255, 0, 255';
    }

    /**
     * Draw the synthwave annihilator effect
     */
    draw(ctx) {
        if (!this.active) return;

        const screenWidth = config.width || 800;
        const screenHeight = config.height || 600;

        ctx.save();

        const alpha = Math.min(1, this.timer / 30);
        const color = this.getCurrentColor();

        // Pulsing background overlay
        ctx.fillStyle = `rgba(${this.hexToRgb(color)}, ${alpha * 0.1})`;
        ctx.fillRect(0, 0, screenWidth, screenHeight);

        // Vertical grid lines
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
        ctx.globalAlpha = alpha * 0.8;

        for (let x = -SYNTHWAVE_ANNIHILATOR.gridSpacing + this.gridOffset; x < screenWidth + SYNTHWAVE_ANNIHILATOR.gridSpacing; x += SYNTHWAVE_ANNIHILATOR.gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, screenHeight);
            ctx.stroke();
        }

        // Horizontal grid lines
        for (let y = -SYNTHWAVE_ANNIHILATOR.gridSpacing + this.gridOffset; y < screenHeight + SYNTHWAVE_ANNIHILATOR.gridSpacing; y += SYNTHWAVE_ANNIHILATOR.gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(screenWidth, y);
            ctx.stroke();
        }

        // Grid intersections (brighter)
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';

        for (let x = -SYNTHWAVE_ANNIHILATOR.gridSpacing + this.gridOffset; x < screenWidth + SYNTHWAVE_ANNIHILATOR.gridSpacing; x += SYNTHWAVE_ANNIHILATOR.gridSpacing) {
            for (let y = -SYNTHWAVE_ANNIHILATOR.gridSpacing + this.gridOffset; y < screenHeight + SYNTHWAVE_ANNIHILATOR.gridSpacing; y += SYNTHWAVE_ANNIHILATOR.gridSpacing) {
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Pulse waves
        for (const wave of this.pulseWaves) {
            const waveAlpha = wave.life / 40;
            ctx.strokeStyle = `rgba(255, 255, 255, ${waveAlpha * 0.5})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // SYNTHWAVE text
        ctx.globalAlpha = 0.5 + Math.sin(this.colorPhase * 2) * 0.3;
        ctx.font = 'bold 48px Courier New';
        ctx.textAlign = 'center';
        ctx.fillStyle = color;
        ctx.shadowBlur = 30;
        ctx.shadowColor = color;
        ctx.fillText('SYNTHWAVE', screenWidth / 2, 60);

        // Scanlines (extra during ultimate)
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#000000';
        for (let y = 0; y < screenHeight; y += 3) {
            ctx.fillRect(0, y, screenWidth, 1);
        }

        ctx.restore();
    }
}
