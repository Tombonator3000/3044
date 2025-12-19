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
        const time = Date.now() * 0.001;

        ctx.save();

        const alpha = Math.min(1, this.timer / 30);
        const color = this.getCurrentColor();
        const colorIndex = Math.floor(this.colorPhase) % SYNTHWAVE_ANNIHILATOR.colors.length;

        // Gradient sky background
        const skyGrad = ctx.createLinearGradient(0, 0, 0, screenHeight);
        skyGrad.addColorStop(0, `rgba(20, 0, 40, ${alpha * 0.4})`);
        skyGrad.addColorStop(0.4, `rgba(80, 0, 120, ${alpha * 0.3})`);
        skyGrad.addColorStop(0.6, `rgba(${this.hexToRgb(color)}, ${alpha * 0.2})`);
        skyGrad.addColorStop(1, `rgba(0, 0, 0, ${alpha * 0.1})`);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, screenWidth, screenHeight);

        // Sun at top center
        const sunY = 80;
        const sunRadius = 50 + Math.sin(time * 2) * 5;

        // Sun glow layers
        for (let i = 4; i >= 0; i--) {
            const glowRadius = sunRadius + i * 20;
            const glowGrad = ctx.createRadialGradient(
                screenWidth / 2, sunY, 0,
                screenWidth / 2, sunY, glowRadius
            );
            const glowAlpha = alpha * (0.15 - i * 0.025);
            glowGrad.addColorStop(0, `rgba(255, 100, 200, ${glowAlpha})`);
            glowGrad.addColorStop(0.5, `rgba(255, 50, 150, ${glowAlpha * 0.5})`);
            glowGrad.addColorStop(1, 'rgba(255, 0, 100, 0)');

            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(screenWidth / 2, sunY, glowRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Sun body with horizontal stripes
        const sunGrad = ctx.createLinearGradient(0, sunY - sunRadius, 0, sunY + sunRadius);
        sunGrad.addColorStop(0, '#ff6090');
        sunGrad.addColorStop(0.3, '#ff4080');
        sunGrad.addColorStop(0.5, '#ff2060');
        sunGrad.addColorStop(0.7, '#cc1050');
        sunGrad.addColorStop(1, '#880040');

        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(screenWidth / 2, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        // Sun stripes (synthwave style)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        for (let i = 0; i < 5; i++) {
            const stripeY = sunY + sunRadius * 0.2 + i * 8;
            const stripeHeight = 3 + i;
            const stripeWidth = Math.sqrt(sunRadius * sunRadius - Math.pow(stripeY - sunY, 2)) * 2;

            if (stripeWidth > 0) {
                ctx.fillRect(screenWidth / 2 - stripeWidth / 2, stripeY, stripeWidth, stripeHeight);
            }
        }

        // Grid lines with glow - vertical
        ctx.globalAlpha = alpha * 0.9;

        for (let x = -SYNTHWAVE_ANNIHILATOR.gridSpacing + this.gridOffset; x < screenWidth + SYNTHWAVE_ANNIHILATOR.gridSpacing; x += SYNTHWAVE_ANNIHILATOR.gridSpacing) {
            // Outer glow
            ctx.strokeStyle = `rgba(${this.hexToRgb(color)}, 0.2)`;
            ctx.lineWidth = 8;
            ctx.shadowBlur = 30;
            ctx.shadowColor = color;

            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, screenHeight);
            ctx.stroke();

            // Main line
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 15;
            ctx.stroke();

            // Bright core
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.globalAlpha = alpha * 0.5;
            ctx.stroke();
            ctx.globalAlpha = alpha * 0.9;
        }

        // Grid lines - horizontal
        for (let y = -SYNTHWAVE_ANNIHILATOR.gridSpacing + this.gridOffset; y < screenHeight + SYNTHWAVE_ANNIHILATOR.gridSpacing; y += SYNTHWAVE_ANNIHILATOR.gridSpacing) {
            // Outer glow
            ctx.strokeStyle = `rgba(${this.hexToRgb(color)}, 0.2)`;
            ctx.lineWidth = 8;
            ctx.shadowBlur = 30;
            ctx.shadowColor = color;

            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(screenWidth, y);
            ctx.stroke();

            // Main line
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 15;
            ctx.stroke();

            // Bright core
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.globalAlpha = alpha * 0.5;
            ctx.stroke();
            ctx.globalAlpha = alpha * 0.9;
        }

        // Grid intersections with animated glow
        for (let x = -SYNTHWAVE_ANNIHILATOR.gridSpacing + this.gridOffset; x < screenWidth + SYNTHWAVE_ANNIHILATOR.gridSpacing; x += SYNTHWAVE_ANNIHILATOR.gridSpacing) {
            for (let y = -SYNTHWAVE_ANNIHILATOR.gridSpacing + this.gridOffset; y < screenHeight + SYNTHWAVE_ANNIHILATOR.gridSpacing; y += SYNTHWAVE_ANNIHILATOR.gridSpacing) {
                const nodePhase = time * 3 + (x + y) * 0.01;
                const nodePulse = 0.7 + Math.sin(nodePhase) * 0.3;

                // Outer glow
                const nodeGrad = ctx.createRadialGradient(x, y, 0, x, y, 12);
                nodeGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * nodePulse})`);
                nodeGrad.addColorStop(0.3, `rgba(${this.hexToRgb(color)}, ${alpha * nodePulse * 0.7})`);
                nodeGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

                ctx.fillStyle = nodeGrad;
                ctx.beginPath();
                ctx.arc(x, y, 12, 0, Math.PI * 2);
                ctx.fill();

                // Core
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ffffff';
                ctx.beginPath();
                ctx.arc(x, y, 3 * nodePulse, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Pulse waves with multiple rings
        for (const wave of this.pulseWaves) {
            const waveAlpha = wave.life / 40;

            // Outer wave
            ctx.strokeStyle = `rgba(${this.hexToRgb(color)}, ${waveAlpha * 0.3})`;
            ctx.lineWidth = 4;
            ctx.shadowBlur = 20;
            ctx.shadowColor = color;
            ctx.beginPath();
            ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
            ctx.stroke();

            // Inner wave
            ctx.strokeStyle = `rgba(255, 255, 255, ${waveAlpha * 0.6})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(wave.x, wave.y, wave.radius * 0.7, 0, Math.PI * 2);
            ctx.stroke();

            // Center flash
            const flashGrad = ctx.createRadialGradient(wave.x, wave.y, 0, wave.x, wave.y, wave.radius * 0.3);
            flashGrad.addColorStop(0, `rgba(255, 255, 255, ${waveAlpha * 0.5})`);
            flashGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = flashGrad;
            ctx.beginPath();
            ctx.arc(wave.x, wave.y, wave.radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        // "SYNTHWAVE" text with chrome effect
        ctx.globalAlpha = 0.6 + Math.sin(this.colorPhase * 2) * 0.3;

        // Text shadow layers
        for (let i = 3; i >= 0; i--) {
            ctx.font = 'bold 52px Courier New';
            ctx.textAlign = 'center';
            ctx.fillStyle = i === 0 ? '#ffffff' : color;
            ctx.shadowBlur = 20 + i * 10;
            ctx.shadowColor = color;
            ctx.fillText('SYNTHWAVE', screenWidth / 2 + i, 60 + i * 0.5);
        }

        // Chrome gradient on text
        const textGrad = ctx.createLinearGradient(screenWidth / 2 - 150, 40, screenWidth / 2 + 150, 70);
        textGrad.addColorStop(0, '#ff00ff');
        textGrad.addColorStop(0.25, '#ffffff');
        textGrad.addColorStop(0.5, '#00ffff');
        textGrad.addColorStop(0.75, '#ffffff');
        textGrad.addColorStop(1, '#ff00ff');

        ctx.fillStyle = textGrad;
        ctx.globalAlpha = 0.8 + Math.sin(time * 4) * 0.2;
        ctx.fillText('SYNTHWAVE', screenWidth / 2, 60);

        // Subtitle
        ctx.font = 'bold 16px Courier New';
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.7;
        ctx.shadowBlur = 10;
        ctx.fillText('A N N I H I L A T O R', screenWidth / 2, 85);

        // Animated scanlines
        ctx.globalAlpha = 0.12 + Math.sin(time * 10) * 0.03;
        ctx.fillStyle = '#000000';
        for (let y = (time * 50) % 4; y < screenHeight; y += 4) {
            ctx.fillRect(0, y, screenWidth, 2);
        }

        // VHS tracking noise at edges
        ctx.globalAlpha = 0.1;
        for (let i = 0; i < 5; i++) {
            const noiseY = Math.random() * screenHeight;
            const noiseHeight = 2 + Math.random() * 4;
            ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : color;
            ctx.fillRect(0, noiseY, screenWidth, noiseHeight);
        }

        // Timer bar at bottom
        const timerPercent = this.timer / SYNTHWAVE_ANNIHILATOR.duration;

        // Background
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(screenWidth / 2 - 101, screenHeight - 25, 202, 12);

        // Fill with gradient
        const timerGrad = ctx.createLinearGradient(screenWidth / 2 - 100, 0, screenWidth / 2 + 100, 0);
        timerGrad.addColorStop(0, '#ff00ff');
        timerGrad.addColorStop(0.33, '#00ffff');
        timerGrad.addColorStop(0.66, '#ffff00');
        timerGrad.addColorStop(1, '#ff00ff');

        ctx.globalAlpha = 0.9;
        ctx.fillStyle = timerGrad;
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.fillRect(screenWidth / 2 - 100, screenHeight - 24, 200 * timerPercent, 10);

        ctx.restore();
    }
}
