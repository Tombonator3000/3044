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

        // Enemy type distribution per wave
        this.enemyTypes = ['triangle', 'square', 'pentagon', 'divebomber', 'sinewave'];

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

        // Adjust spawn rate for higher waves
        this.spawnDelay = Math.max(30, 90 - (waveNum * 3));

        console.log(`🌊 Wave ${waveNum} starting: ${this.enemiesPerWave} enemies, spawn delay: ${this.spawnDelay}`);
    }

    calculateEnemiesPerWave(wave) {
        // Base enemies + scaling
        const base = 5;
        const perWave = 3;
        const bonus = Math.floor(wave / 5) * 5;  // Bonus every 5 waves

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

        // Weight towards harder enemies in later waves
        if (wave >= 10) {
            // Double chance for harder enemies
            if (wave >= 8) availableTypes.push('sinewave');
            if (wave >= 6) availableTypes.push('divebomber');
        }

        // Pick random from available
        return availableTypes[Math.floor(Math.random() * availableTypes.length)];
    }

    getSpawnPosition(canvas, enemyType) {
        const padding = 50;
        let x, y;

        switch (enemyType) {
            case 'divebomber':
                // Divebombers come from top
                x = padding + Math.random() * (canvas.width - padding * 2);
                y = -30;
                break;

            case 'sinewave':
                // Sinewave enemies start from sides
                x = Math.random() > 0.5 ? -30 : canvas.width + 30;
                y = 50 + Math.random() * 100;
                break;

            default:
                // Standard enemies from top
                x = padding + Math.random() * (canvas.width - padding * 2);
                y = -30 - Math.random() * 50;
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

            // Spawn in pairs for later waves
            if (this.wave >= 5 && Math.random() < 0.3 && this.enemiesSpawned < this.enemiesPerWave) {
                const extraType = this.getEnemyTypeForWave(this.wave);
                const extraPos = this.getSpawnPosition(canvas, extraType);
                enemies.push(new Enemy(extraPos.x, extraPos.y, extraType, gameState));
                this.enemiesSpawned++;
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
        ctx.translate(canvas.width / 2, canvas.height / 2);
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
