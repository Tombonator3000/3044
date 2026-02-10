// ============================================
// GEOMETRY 3044 — ENHANCED STARFIELD
// ============================================

import { config, getCurrentTheme } from '../config.js';

export class Starfield {
    constructor(width, height) {
        this.width = width || config.width || 800;
        this.height = height || config.height || 600;
        this.layers = [];
        this.nebulae = [];
        this.distantNebulae = [];
        this.currentTheme = getCurrentTheme(1);

        this.initLayers();
        this.initNebulae();

        // Sidescroller mode flag
        this.sidescrollerMode = false;

        // Performance: Detect mobile for optimizations
        this.isMobile = this.detectMobile();

        // Performance: Cache current frame time for draw calls
        this._frameTime = 0;

        // Debug log only when enabled
        if (config.debug?.enabled) {
            console.log(`⭐ Enhanced starfield created with ${this.layers.length} star layers, ${this.nebulae.length} main nebulae, and ${this.distantNebulae.length} distant nebulae`);
        }
    }

    /**
     * Detect if device is mobile/touch
     */
    detectMobile() {
        return (
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        );
    }

    /**
     * Set sidescroller mode for horizontal star movement
     */
    setSidescrollerMode(enabled) {
        this.sidescrollerMode = enabled;
    }

    initLayers() {
        // 5 layers of stars with different speeds and sizes
        const layerConfigs = [
            { count: 60, speedMin: 0.1, speedMax: 0.3, sizeMin: 0.5, sizeMax: 1 },      // Distant tiny stars
            { count: 50, speedMin: 0.3, speedMax: 0.6, sizeMin: 0.8, sizeMax: 1.5 },    // Far stars
            { count: 40, speedMin: 0.6, speedMax: 1.0, sizeMin: 1, sizeMax: 2 },        // Mid stars
            { count: 30, speedMin: 1.0, speedMax: 1.5, sizeMin: 1.5, sizeMax: 2.5 },    // Close stars
            { count: 15, speedMin: 1.5, speedMax: 2.5, sizeMin: 2, sizeMax: 3.5 }       // Very close bright stars
        ];

        this.layers = layerConfigs.map(cfg => this.createLayer(cfg));
    }

    createLayer(config) {
        const stars = [];
        for (let i = 0; i < config.count; i++) {
            stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                speed: config.speedMin + Math.random() * (config.speedMax - config.speedMin),
                size: config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin),
                brightness: 0.3 + Math.random() * 0.7,
                twinkleSpeed: 0.02 + Math.random() * 0.05,
                twinkleOffset: Math.random() * Math.PI * 2,
                color: this.getStarColor()
            });
        }
        return stars;
    }

    getStarColor() {
        const colors = [
            '#ffffff',  // White
            '#ffffee',  // Warm white
            '#eeeeff',  // Cool white
            '#aaddff',  // Blue-white
            '#ffddaa',  // Yellow-white
            '#ffcccc',  // Red-white
            '#ccffff'   // Cyan-white
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    initNebulae() {
        // Main nebulae (4 large ones)
        for (let i = 0; i < 4; i++) {
            this.nebulae.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: 80 + Math.random() * 120,
                color: this.getNebulaColor(),
                alpha: 0.03 + Math.random() * 0.05,
                speed: 0.05 + Math.random() * 0.1,
                pulseSpeed: 0.001 + Math.random() * 0.002,
                pulseOffset: Math.random() * Math.PI * 2
            });
        }

        // Distant nebulae (6 smaller, fainter ones)
        for (let i = 0; i < 6; i++) {
            this.distantNebulae.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: 40 + Math.random() * 60,
                color: this.getNebulaColor(),
                alpha: 0.01 + Math.random() * 0.02,
                speed: 0.02 + Math.random() * 0.05
            });
        }
    }

    getNebulaColor() {
        const theme = this.currentTheme;
        const colors = [
            theme.primary,
            theme.secondary,
            theme.accent,
            '#ff0080',  // Pink
            '#0080ff',  // Blue
            '#8000ff',  // Purple
            '#00ff80',  // Cyan-green
            '#ff8000'   // Orange
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update(deltaTime = 1) {
        const dt = deltaTime || 1;

        // Update star layers
        for (const layer of this.layers) {
            for (const star of layer) {
                if (this.sidescrollerMode) {
                    // Horizontal scrolling (R-Type style)
                    star.x -= star.speed * dt * 1.5; // Faster horizontal movement

                    // Wrap around horizontally
                    if (star.x < -5) {
                        star.x = this.width + 5;
                        star.y = Math.random() * this.height;
                    }
                } else {
                    // Vertical scrolling (normal mode)
                    star.y += star.speed * dt;

                    // Wrap around
                    if (star.y > this.height) {
                        star.y = -5;
                        star.x = Math.random() * this.width;
                    }
                }
            }
        }

        // Update nebulae
        for (const nebula of this.nebulae) {
            if (this.sidescrollerMode) {
                nebula.x -= nebula.speed * dt * 1.5;
                if (nebula.x < -nebula.radius) {
                    nebula.x = this.width + nebula.radius;
                    nebula.y = Math.random() * this.height;
                    nebula.color = this.getNebulaColor();
                }
            } else {
                nebula.y += nebula.speed * dt;
                if (nebula.y > this.height + nebula.radius) {
                    nebula.y = -nebula.radius;
                    nebula.x = Math.random() * this.width;
                    nebula.color = this.getNebulaColor();
                }
            }
        }

        // Update distant nebulae
        for (const nebula of this.distantNebulae) {
            if (this.sidescrollerMode) {
                nebula.x -= nebula.speed * dt;
                if (nebula.x < -nebula.radius) {
                    nebula.x = this.width + nebula.radius;
                    nebula.y = Math.random() * this.height;
                }
            } else {
                nebula.y += nebula.speed * dt;
                if (nebula.y > this.height + nebula.radius) {
                    nebula.y = -nebula.radius;
                    nebula.x = Math.random() * this.width;
                }
            }
        }
    }

    updateTheme(wave) {
        this.currentTheme = getCurrentTheme(wave);

        // Update some nebula colors to match new theme
        for (let i = 0; i < this.nebulae.length; i++) {
            if (Math.random() < 0.5) {
                this.nebulae[i].color = this.getNebulaColor();
            }
        }
    }

    resize(width, height) {
        this.width = width;
        this.height = height;

        // Reposition elements that are out of bounds
        for (const layer of this.layers) {
            for (const star of layer) {
                if (star.x > width) star.x = Math.random() * width;
                if (star.y > height) star.y = Math.random() * height;
            }
        }

        for (const nebula of this.nebulae) {
            if (nebula.x > width) nebula.x = Math.random() * width;
            if (nebula.y > height) nebula.y = Math.random() * height;
        }
    }

    draw(ctx) {
        if (!ctx) return;

        // Performance: Cache time once per frame instead of calling Date.now() for each star
        this._frameTime = Date.now();

        // Draw distant nebulae first (background)
        // Performance: Skip distant nebulae on mobile
        if (!this.isMobile) {
            for (const nebula of this.distantNebulae) {
                this.drawNebula(ctx, nebula);
            }
        }

        // Draw stars layer by layer (back to front)
        // Performance: On mobile, skip the first layer (most distant, least visible)
        // OPTIMIZED: Single save/restore wrapping all stars instead of per-star
        ctx.save();
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        const startLayer = this.isMobile ? 1 : 0;
        for (let i = startLayer; i < this.layers.length; i++) {
            const layer = this.layers[i];
            const layerAlpha = 0.3 + (i / this.layers.length) * 0.7;

            for (const star of layer) {
                this.drawStar(ctx, star, layerAlpha);
            }
        }
        ctx.restore();

        // Draw main nebulae (foreground glow)
        // Performance: Draw fewer nebulae on mobile
        const nebulaLimit = this.isMobile ? 2 : this.nebulae.length;
        for (let i = 0; i < nebulaLimit; i++) {
            this.drawNebula(ctx, this.nebulae[i]);
        }
    }

    drawStar(ctx, star, layerAlpha) {
        // Performance: Use cached frame time instead of Date.now() per star
        const time = this._frameTime * star.twinkleSpeed + star.twinkleOffset;
        const twinkle = 0.7 + Math.sin(time) * 0.3;
        const alpha = star.brightness * twinkle * layerAlpha;

        // OPTIMIZED: Only use save/restore for stars that need shadow (large stars)
        // Small stars just set fillStyle and alpha directly (cheaper)
        const needsShadow = star.size > 2 && !this.isMobile;

        if (needsShadow) {
            ctx.save();
            ctx.shadowBlur = star.size * 3;
            ctx.shadowColor = star.color;
        }

        ctx.globalAlpha = Math.min(alpha, 0.9);
        ctx.fillStyle = star.color;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw cross-sparkle for bright stars - skip on mobile for performance
        if (!this.isMobile && star.size > 2.5 && alpha > 0.6) {
            ctx.strokeStyle = star.color;
            ctx.lineWidth = 0.5;
            ctx.globalAlpha = alpha * 0.5;

            const sparkleSize = star.size * 3;
            ctx.beginPath();
            ctx.moveTo(star.x - sparkleSize, star.y);
            ctx.lineTo(star.x + sparkleSize, star.y);
            ctx.moveTo(star.x, star.y - sparkleSize);
            ctx.lineTo(star.x, star.y + sparkleSize);
            ctx.stroke();
        }

        if (needsShadow) {
            ctx.restore();
        }
    }

    drawNebula(ctx, nebula) {
        // Performance: Use cached frame time instead of Date.now() per nebula
        const time = this._frameTime;
        const pulse = nebula.pulseSpeed ?
            1 + Math.sin(time * nebula.pulseSpeed + (nebula.pulseOffset || 0)) * 0.2 : 1;

        ctx.save();

        // Performance: On mobile, use simpler rendering without gradients
        if (this.isMobile) {
            ctx.globalAlpha = nebula.alpha * pulse * 0.5;
            ctx.fillStyle = nebula.color;
            ctx.beginPath();
            ctx.arc(nebula.x, nebula.y, nebula.radius * pulse * 0.7, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // OPTIMIZED: Cache gradient per nebula, only recreate when color changes
            // Pulse is applied via radius scaling and alpha, gradient shape stays the same
            const radius = nebula.radius * pulse;
            if (!nebula._cachedGradient || nebula._cachedColor !== nebula.color
                || nebula._cachedX !== nebula.x || nebula._cachedY !== nebula.y
                || Math.abs(nebula._cachedRadius - radius) > 5) {
                nebula._cachedGradient = ctx.createRadialGradient(
                    nebula.x, nebula.y, 0,
                    nebula.x, nebula.y, radius
                );
                nebula._cachedGradient.addColorStop(0, nebula.color + '40');
                nebula._cachedGradient.addColorStop(0.3, nebula.color + '20');
                nebula._cachedGradient.addColorStop(0.6, nebula.color + '10');
                nebula._cachedGradient.addColorStop(1, 'transparent');
                nebula._cachedColor = nebula.color;
                nebula._cachedX = nebula.x;
                nebula._cachedY = nebula.y;
                nebula._cachedRadius = radius;
            }

            ctx.globalAlpha = nebula.alpha * pulse;
            ctx.fillStyle = nebula._cachedGradient;
            ctx.beginPath();
            ctx.arc(nebula.x, nebula.y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
