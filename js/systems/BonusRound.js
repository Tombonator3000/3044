/**
 * Geometry 3044 - Bonus Round System
 * Special bonus stages every 3 waves with collectible diamonds
 */

import { config } from '../globals.js';
import { calculateDistance } from '../utils/MathUtils.js';

/**
 * Diamond collectible for bonus rounds
 */
class Diamond {
    constructor(x, y, points) {
        this.x = x;
        this.y = y;
        this.points = points;
        this.collected = false;
        this.size = 15;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = 0.05 + Math.random() * 0.03;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.color = '#ffff00';
        this.active = true;
    }

    update() {
        this.rotation += this.rotationSpeed;
        this.pulsePhase += 0.1;
    }

    draw(ctx) {
        if (this.collected || !this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        const pulse = 1 + Math.sin(this.pulsePhase) * 0.2;
        const size = this.size * pulse;

        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        // Draw diamond shape
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size * 0.6, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size * 0.6, 0);
        ctx.closePath();

        ctx.fillStyle = this.color + 'cc';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner shine
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.5);
        ctx.lineTo(size * 0.3, 0);
        ctx.lineTo(0, size * 0.5);
        ctx.lineTo(-size * 0.3, 0);
        ctx.closePath();
        ctx.fillStyle = '#ffffff88';
        ctx.fill();

        ctx.restore();
    }
}

/**
 * BonusRound class - Manages bonus round state and collectibles
 */
export class BonusRound {
    constructor(wave) {
        this.wave = wave;
        this.active = true;
        this.diamonds = [];
        this.timer = 600; // 10 seconds at 60fps
        this.maxTime = 600;
        this.collectedCount = 0;
        this.totalPoints = 0;
        this.pattern = this.getPatternForWave(wave);

        this.spawnPattern(this.pattern);

        console.log(`🎰 BONUS ROUND started! Wave ${wave}, Pattern: ${this.pattern}`);
    }

    /**
     * Get pattern based on wave number
     */
    getPatternForWave(wave) {
        const patterns = ['circle', 'heart', 'star', 'spiral', 'diamond'];
        return patterns[Math.min(Math.floor(wave / 3) - 1, patterns.length - 1)];
    }

    /**
     * Spawn diamonds in specified pattern
     */
    spawnPattern(pattern) {
        const centerX = config.width / 2;
        const centerY = config.height / 2;
        const basePoints = 500 * Math.ceil(this.wave / 3);

        switch (pattern) {
            case 'circle':
                this.spawnCirclePattern(centerX, centerY, basePoints);
                break;
            case 'heart':
                this.spawnHeartPattern(centerX, centerY, basePoints);
                break;
            case 'star':
                this.spawnStarPattern(centerX, centerY, basePoints);
                break;
            case 'spiral':
                this.spawnSpiralPattern(centerX, centerY, basePoints);
                break;
            case 'diamond':
                this.spawnDiamondPattern(centerX, centerY, basePoints);
                break;
            default:
                this.spawnCirclePattern(centerX, centerY, basePoints);
        }
    }

    spawnCirclePattern(cx, cy, points) {
        const count = 12;
        const radius = 150;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            this.diamonds.push(new Diamond(x, y, points));
        }
    }

    spawnHeartPattern(cx, cy, points) {
        const count = 20;
        for (let i = 0; i < count; i++) {
            const t = (Math.PI * 2 * i) / count;
            const x = cx + 16 * Math.pow(Math.sin(t), 3) * 8;
            const y = cy - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 8;
            this.diamonds.push(new Diamond(x, y, points));
        }
    }

    spawnStarPattern(cx, cy, points) {
        const outerRadius = 180;
        const innerRadius = 80;
        const pointsCount = 5;

        for (let i = 0; i < pointsCount * 2; i++) {
            const angle = (Math.PI * 2 * i) / (pointsCount * 2) - Math.PI / 2;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            this.diamonds.push(new Diamond(x, y, points));
        }
    }

    spawnSpiralPattern(cx, cy, points) {
        const count = 15;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 4 * i) / count;
            const radius = 50 + i * 10;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            this.diamonds.push(new Diamond(x, y, points));
        }
    }

    spawnDiamondPattern(cx, cy, points) {
        const size = 150;
        const count = 4;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI / 2) * i + Math.PI / 4;
            const x = cx + Math.cos(angle) * size;
            const y = cy + Math.sin(angle) * size;
            this.diamonds.push(new Diamond(x, y, points));
        }
        // Center diamond worth double
        this.diamonds.push(new Diamond(cx, cy, points * 2));
    }

    /**
     * Update bonus round state
     * @param {Object} player - Player object for collision detection
     * @returns {Object} Collected points this frame
     */
    update(player) {
        if (!this.active) return { points: 0, collected: false };

        this.timer--;
        let framePoints = 0;
        let collected = false;

        // Update diamonds
        this.diamonds.forEach(diamond => {
            if (!diamond.collected && diamond.active) {
                diamond.update();

                // Check collision with player
                if (player) {
                    const distance = calculateDistance(player.x, player.y, diamond.x, diamond.y);

                    if (distance < player.size + diamond.size) {
                        diamond.collected = true;
                        this.collectedCount++;
                        this.totalPoints += diamond.points;
                        framePoints += diamond.points;
                        collected = true;
                    }
                }
            }
        });

        // Check if bonus round is complete
        if (this.timer <= 0 || this.diamonds.every(d => d.collected)) {
            this.endBonusRound();
        }

        return { points: framePoints, collected };
    }

    /**
     * End the bonus round
     */
    endBonusRound() {
        this.active = false;

        // Calculate bonus for collecting all diamonds
        const allCollected = this.diamonds.every(d => d.collected);
        let bonusMultiplier = 1;

        if (allCollected) {
            bonusMultiplier = 2;
            console.log('🎰 PERFECT BONUS! All diamonds collected! 2x bonus!');
        }

        const finalScore = this.totalPoints * bonusMultiplier;
        console.log(`🎰 Bonus Round complete! Collected: ${this.collectedCount}/${this.diamonds.length}, Score: ${finalScore}`);

        return {
            collected: this.collectedCount,
            total: this.diamonds.length,
            points: finalScore,
            perfect: allCollected
        };
    }

    /**
     * Get time remaining as percentage
     */
    getTimeRemaining() {
        return this.timer / this.maxTime;
    }

    /**
     * Draw bonus round elements
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        if (!this.active) return;

        // Draw title
        ctx.save();
        ctx.font = 'bold 48px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffff00';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffff00';
        ctx.fillText('BONUS ROUND!', config.width / 2, 80);

        // Draw timer bar
        const barWidth = 300;
        const barHeight = 10;
        const barX = (config.width - barWidth) / 2;
        const barY = 100;

        ctx.fillStyle = '#333333';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const timePercent = this.getTimeRemaining();
        ctx.fillStyle = timePercent > 0.3 ? '#00ff00' : '#ff0000';
        ctx.fillRect(barX, barY, barWidth * timePercent, barHeight);

        // Draw collection counter
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.fillText(`${this.collectedCount} / ${this.diamonds.length}`, config.width / 2, 140);

        ctx.restore();

        // Draw diamonds
        this.diamonds.forEach(diamond => diamond.draw(ctx));
    }
}
