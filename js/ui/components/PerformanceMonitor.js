/**
 * Geometry 3044 - Performance Monitor Component
 * FPS counter and performance metrics display
 */

export class PerformanceMonitor {
    constructor(theme) {
        this.theme = theme;

        // Position (bottom-left corner)
        this.x = 10;
        this.y = 0;
        this.screenWidth = 0;
        this.screenHeight = 0;

        // FPS tracking
        this.fpsHistory = [];
        this.fpsHistoryMaxLength = 60;
        this.currentFPS = 60;
        this.lastFrameTime = performance.now();

        // Frame time tracking
        this.frameTimeHistory = [];
        this.avgFrameTime = 16.67;
        this.minFrameTime = 16.67;
        this.maxFrameTime = 16.67;

        // Entity counts
        this.entityCounts = {
            enemies: 0,
            bullets: 0,
            particles: 0
        };

        // Visibility toggle
        this.visible = false;

        // Graph settings
        this.graphWidth = 120;
        this.graphHeight = 40;

        // Performance thresholds
        this.goodFPS = 55;
        this.warnFPS = 30;
    }

    resize(width, height) {
        this.screenWidth = width;
        this.screenHeight = height;
        this.y = height - 100;
    }

    toggle() {
        this.visible = !this.visible;
        return this.visible;
    }

    show() {
        this.visible = true;
    }

    hide() {
        this.visible = false;
    }

    update(gameState, deltaTime = 1) {
        if (!this.visible) return;

        const now = performance.now();
        const frameTime = now - this.lastFrameTime;
        this.lastFrameTime = now;

        // Update frame time history
        this.frameTimeHistory.push(frameTime);
        if (this.frameTimeHistory.length > this.fpsHistoryMaxLength) {
            this.frameTimeHistory.shift();
        }

        // Calculate FPS from frame time
        const fps = 1000 / frameTime;
        this.fpsHistory.push(fps);
        if (this.fpsHistory.length > this.fpsHistoryMaxLength) {
            this.fpsHistory.shift();
        }

        // Calculate stats
        if (this.fpsHistory.length > 0) {
            const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
            this.currentFPS = Math.round(sum / this.fpsHistory.length);
        }

        if (this.frameTimeHistory.length > 0) {
            const sum = this.frameTimeHistory.reduce((a, b) => a + b, 0);
            this.avgFrameTime = sum / this.frameTimeHistory.length;
            this.minFrameTime = Math.min(...this.frameTimeHistory);
            this.maxFrameTime = Math.max(...this.frameTimeHistory);
        }

        // Update entity counts if gameState is available
        if (gameState) {
            this.entityCounts.enemies = gameState.enemies?.length || 0;
            this.entityCounts.bullets = (gameState.bulletCount || 0) + (gameState.enemyBulletCount || 0);
            this.entityCounts.particles = gameState.particleCount || 0;
        }
    }

    /**
     * Update bullet and particle counts from systems
     */
    updateEntityCounts(bulletPool, enemyBulletPool, particleSystem) {
        if (bulletPool) {
            this.entityCounts.bullets = bulletPool.getActiveCount?.() || bulletPool.bullets?.filter(b => b.active).length || 0;
        }
        if (enemyBulletPool) {
            this.entityCounts.bullets += enemyBulletPool.getActiveCount?.() || enemyBulletPool.bullets?.filter(b => b.active).length || 0;
        }
        if (particleSystem) {
            this.entityCounts.particles = particleSystem.getParticleCount?.() || particleSystem.particles?.length || 0;
        }
    }

    draw(ctx) {
        if (!this.visible) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Background panel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.strokeStyle = this.getFPSColor();
        ctx.lineWidth = 1;
        ctx.fillRect(0, 0, 160, 90);
        ctx.strokeRect(0, 0, 160, 90);

        // Title
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#888888';
        ctx.fillText('PERFORMANCE', 5, 12);

        // FPS display
        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = this.getFPSColor();
        ctx.fillText(`${this.currentFPS} FPS`, 5, 35);

        // Frame time
        ctx.font = '10px monospace';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(`${this.avgFrameTime.toFixed(1)}ms avg`, 5, 50);
        ctx.fillText(`${this.minFrameTime.toFixed(1)}-${this.maxFrameTime.toFixed(1)}ms`, 5, 62);

        // Entity counts
        ctx.fillStyle = '#666666';
        ctx.fillText(`E:${this.entityCounts.enemies} B:${this.entityCounts.bullets} P:${this.entityCounts.particles}`, 5, 82);

        // FPS Graph
        this.drawFPSGraph(ctx, 85, 18, 70, 35);

        ctx.restore();
    }

    drawFPSGraph(ctx, x, y, width, height) {
        if (this.fpsHistory.length < 2) return;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, width, height);

        // 60 FPS line
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        const targetY = y + height - (60 / 80 * height);
        ctx.moveTo(x, targetY);
        ctx.lineTo(x + width, targetY);
        ctx.stroke();
        ctx.setLineDash([]);

        // FPS line
        ctx.strokeStyle = this.getFPSColor();
        ctx.lineWidth = 1;
        ctx.beginPath();

        const step = width / (this.fpsHistoryMaxLength - 1);

        for (let i = 0; i < this.fpsHistory.length; i++) {
            const fps = Math.min(80, this.fpsHistory[i]);
            const graphX = x + i * step;
            const graphY = y + height - (fps / 80 * height);

            if (i === 0) {
                ctx.moveTo(graphX, graphY);
            } else {
                ctx.lineTo(graphX, graphY);
            }
        }

        ctx.stroke();

        // Border
        ctx.strokeStyle = '#444444';
        ctx.strokeRect(x, y, width, height);
    }

    getFPSColor() {
        if (this.currentFPS >= this.goodFPS) {
            return '#00ff00'; // Green - good
        } else if (this.currentFPS >= this.warnFPS) {
            return '#ffff00'; // Yellow - warning
        } else {
            return '#ff0000'; // Red - bad
        }
    }
}
