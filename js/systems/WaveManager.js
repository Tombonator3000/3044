// ============================================
// GEOMETRY 3044 — WAVE MANAGER
// ============================================

import { config, getCurrentTheme } from '../config.js';
import { Enemy } from '../entities/Enemy.js';

export class WaveManager {
    constructor() {
        this.wave = 1;
        this.enemiesPerWave = 5;
        this.enemiesSpawned = 0;
        this.spawnTimer = 0;
        this.spawnDelay = 90;  // Frames between spawns
        this.waveActive = false;
        this.waveComplete = false;
        this.waveStartDelay = 120;  // 2 seconds before wave starts
        this.waveStartTimer = 0;
        this.showingWaveText = false;
        this.waveTextTimer = 0;

        // Enemy type distribution per wave (includes new 8-bit enemies)
        this.enemyTypes = [
            'triangle', 'square', 'pentagon', 'divebomber', 'sinewave',
            'pixelskull', 'ghostbyte', 'laserdisc', 'vhstracker',
            'arcadeboss', 'synthwave', 'pixelinvader'
        ];

        // Boss waves
        this.bossWaves = [5, 10, 15, 20, 25, 30];
    }

    startWave(waveNum) {
        this.wave = waveNum;
        this.enemiesSpawned = 0;
        this.waveComplete = false;
        this.showingWaveText = true;
        this.waveTextTimer = 120;  // Show wave text for 2 seconds
        this.waveStartTimer = this.waveStartDelay;
        this.waveActive = false;

        // Calculate enemies for this wave
        this.enemiesPerWave = this.calculateEnemiesPerWave(waveNum);

        // Adjust spawn rate for higher waves (faster spawning)
        // Wave 1: 60 frames, Wave 10: 30 frames, Wave 15+: 15 frames minimum
        this.spawnDelay = Math.max(15, 60 - (waveNum * 3));

        console.log(`🌊 Wave ${waveNum} starting: ${this.enemiesPerWave} enemies, spawn delay: ${this.spawnDelay}`);
    }

    calculateEnemiesPerWave(wave) {
        // Base enemies + scaling (increased for more intense gameplay)
        const base = 10;           // Increased from 5
        const perWave = 5;         // Increased from 3
        const bonus = Math.floor(wave / 5) * 8;  // Bonus every 5 waves (increased from 5)

        // Wave 1: 10 + 5 + 0 = 15 enemies
        // Wave 5: 10 + 25 + 8 = 43 enemies
        // Wave 10: 10 + 50 + 16 = 76 enemies
        // Wave 20: 10 + 100 + 32 = 142 enemies
        return base + (wave * perWave) + bonus;
    }

    getEnemyTypeForWave(wave) {
        // Determine which enemy types are available based on wave
        const availableTypes = [];

        // Triangles always available
        availableTypes.push('triangle');

        // Squares from wave 2
        if (wave >= 2) availableTypes.push('square');

        // Pentagons from wave 4
        if (wave >= 4) availableTypes.push('pentagon');

        // Divebombers from wave 6
        if (wave >= 6) availableTypes.push('divebomber');

        // Sinewave elites from wave 8
        if (wave >= 8) availableTypes.push('sinewave');

        // ============================================
        // NEW 8-BIT INSPIRED ENEMIES
        // ============================================

        // Pixel Invaders from wave 3 (classic retro enemy)
        if (wave >= 3) availableTypes.push('pixelinvader');

        // Ghost Byte from wave 5 (floaty ghost)
        if (wave >= 5) availableTypes.push('ghostbyte');

        // Laser Disc from wave 7 (spinning disc)
        if (wave >= 7) availableTypes.push('laserdisc');

        // Synthwave enemy from wave 9 (pulsing neon)
        if (wave >= 9) availableTypes.push('synthwave');

        // Pixel Skull from wave 10 (phasing skull)
        if (wave >= 10) availableTypes.push('pixelskull');

        // VHS Tracker from wave 12 (glitchy teleporter)
        if (wave >= 12) availableTypes.push('vhstracker');

        // Arcade Boss from wave 15 (mini-boss type)
        if (wave >= 15) availableTypes.push('arcadeboss');

        // Weight towards harder enemies in later waves
        if (wave >= 10) {
            // Double chance for harder enemies
            if (wave >= 8) availableTypes.push('sinewave');
            if (wave >= 6) availableTypes.push('divebomber');
            availableTypes.push('synthwave');
        }

        if (wave >= 15) {
            // Triple chance for 8-bit enemies in late game
            availableTypes.push('pixelskull');
            availableTypes.push('vhstracker');
            availableTypes.push('laserdisc');
        }

        if (wave >= 20) {
            // More arcade bosses in very late game
            availableTypes.push('arcadeboss');
            availableTypes.push('pixelskull');
        }

        // Pick random from available
        return availableTypes[Math.floor(Math.random() * availableTypes.length)];
    }

    getSpawnPosition(canvas, enemyType) {
        const padding = 50;
        let x, y;

        // Spawn enemies just above visible screen (y = -5 to -15)
        // so they appear immediately and can't be shot before they're visible
        switch (enemyType) {
            case 'divebomber':
                // Divebombers come from top
                x = padding + Math.random() * (canvas.logicalWidth - padding * 2);
                y = -5;
                break;

            case 'sinewave':
                // Sinewave enemies start from sides (just off screen)
                x = Math.random() > 0.5 ? -5 : canvas.logicalWidth + 5;
                y = 50 + Math.random() * 100;
                break;

            // ============================================
            // NEW 8-BIT ENEMY SPAWN POSITIONS
            // ============================================

            case 'pixelskull':
                // Skulls phase in from anywhere at top
                x = padding + Math.random() * (canvas.logicalWidth - padding * 2);
                y = -10;
                break;

            case 'ghostbyte':
                // Ghosts float in from sides (just off screen)
                x = Math.random() > 0.5 ? -5 : canvas.logicalWidth + 5;
                y = 30 + Math.random() * 150;
                break;

            case 'laserdisc':
                // Discs orbit in from corners
                if (Math.random() > 0.5) {
                    x = Math.random() > 0.5 ? -5 : canvas.logicalWidth + 5;
                    y = 50 + Math.random() * 100;
                } else {
                    x = padding + Math.random() * (canvas.logicalWidth - padding * 2);
                    y = -5;
                }
                break;

            case 'vhstracker':
                // VHS trackers glitch in from random top positions
                x = padding + Math.random() * (canvas.logicalWidth - padding * 2);
                y = -10;
                break;

            case 'arcadeboss':
                // Arcade cabinets descend from center-top
                x = canvas.logicalWidth * 0.3 + Math.random() * (canvas.logicalWidth * 0.4);
                y = -15;
                break;

            case 'synthwave':
                // Synthwave enemies pulse in from center-top with spread
                x = canvas.logicalWidth * 0.2 + Math.random() * (canvas.logicalWidth * 0.6);
                y = -8;
                break;

            case 'pixelinvader':
                // Classic invaders line up at top like the original game
                x = padding + Math.random() * (canvas.logicalWidth - padding * 2);
                y = -5;
                break;

            default:
                // Standard enemies from top
                x = padding + Math.random() * (canvas.logicalWidth - padding * 2);
                y = -5 - Math.random() * 10;
        }

        return { x, y };
    }

    update(enemies, canvas, gameState) {
        // Show wave text countdown
        if (this.showingWaveText) {
            this.waveTextTimer--;
            if (this.waveTextTimer <= 0) {
                this.showingWaveText = false;
            }
        }

        // Wave start delay
        if (!this.waveActive && !this.waveComplete) {
            this.waveStartTimer--;
            if (this.waveStartTimer <= 0) {
                this.waveActive = true;
            }
            return;
        }

        // Don't spawn if wave complete
        if (this.waveComplete) return;

        // Spawn enemies
        this.spawnTimer--;

        if (this.spawnTimer <= 0 && this.enemiesSpawned < this.enemiesPerWave) {
            const enemyType = this.getEnemyTypeForWave(this.wave);
            const pos = this.getSpawnPosition(canvas, enemyType);

            const enemy = new Enemy(pos.x, pos.y, enemyType, gameState);
            enemies.push(enemy);

            this.enemiesSpawned++;
            this.spawnTimer = this.spawnDelay;

            // Spawn in pairs/groups for later waves (increased chance and earlier start)
            if (this.wave >= 3 && Math.random() < 0.5 && this.enemiesSpawned < this.enemiesPerWave) {
                const extraType = this.getEnemyTypeForWave(this.wave);
                const extraPos = this.getSpawnPosition(canvas, extraType);
                enemies.push(new Enemy(extraPos.x, extraPos.y, extraType, gameState));
                this.enemiesSpawned++;

                // Triple spawn chance for wave 10+
                if (this.wave >= 10 && Math.random() < 0.4 && this.enemiesSpawned < this.enemiesPerWave) {
                    const thirdType = this.getEnemyTypeForWave(this.wave);
                    const thirdPos = this.getSpawnPosition(canvas, thirdType);
                    enemies.push(new Enemy(thirdPos.x, thirdPos.y, thirdType, gameState));
                    this.enemiesSpawned++;
                }
            }
        }

        // Check if wave is complete - count directly instead of filter()
        let aliveEnemies = 0;
        for (let i = 0; i < enemies.length; i++) {
            if (enemies[i].active) aliveEnemies++;
        }

        if (this.enemiesSpawned >= this.enemiesPerWave && aliveEnemies === 0) {
            this.waveComplete = true;
            this.waveActive = false;
            console.log(`✅ Wave ${this.wave} complete!`);
        }
    }

    isWaveComplete() {
        return this.waveComplete;
    }

    isBossWave() {
        return this.bossWaves.includes(this.wave);
    }

    getWaveProgress() {
        if (this.enemiesPerWave === 0) return 0;
        return this.enemiesSpawned / this.enemiesPerWave;
    }

    drawWaveText(ctx, canvas) {
        if (!this.showingWaveText) return;

        const theme = getCurrentTheme(this.wave);
        const alpha = Math.min(1, this.waveTextTimer / 30);
        const scale = 1 + (1 - this.waveTextTimer / 120) * 0.5;

        ctx.save();
        ctx.translate(canvas.logicalWidth / 2, canvas.logicalHeight / 2);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;

        // Wave number
        ctx.font = 'bold 72px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 30;
        ctx.shadowColor = theme.primary;

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;
        ctx.strokeText(`WAVE ${this.wave}`, 0, -20);

        ctx.fillStyle = theme.primary;
        ctx.fillText(`WAVE ${this.wave}`, 0, -20);

        // Theme name
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.shadowColor = theme.secondary;
        ctx.fillStyle = theme.secondary;
        ctx.fillText(theme.name, 0, 40);

        ctx.restore();
    }
}
