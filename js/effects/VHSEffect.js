// ============================================
// GEOMETRY 3044 — VHS/CRT EFFECTS - OPTIMIZED
// ============================================

// Performance detection
const isLowPerfDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

export class VHSEffect {
    constructor() {
        // Reduce or disable effects on low-perf devices
        this.enabled = !isLowPerfDevice;
        this.scanlineIntensity = isLowPerfDevice ? 0 : 0.12;
        this.noiseIntensity = isLowPerfDevice ? 0 : 0.02;
        this.chromaticAberration = isLowPerfDevice ? 0 : 1;
        this.glitchActive = false;
        this.glitchTimer = 0;
        this.glitchIntensity = 0;

        // Scanline pattern
        this.scanlineOffset = 0;
        this.frameSkip = 0; // Skip frames for performance

        // Noise buffer
        this.noiseCanvas = null;
        this.noiseCtx = null;
        if (!isLowPerfDevice) {
            this.initNoiseBuffer();
        }

        // Cache vignette gradient
        this.vignetteGradient = null;
        this.lastCanvasSize = { w: 0, h: 0 };
    }

    initNoiseBuffer() {
        this.noiseCanvas = document.createElement('canvas');
        this.noiseCanvas.width = 256;
        this.noiseCanvas.height = 256;
        this.noiseCtx = this.noiseCanvas.getContext('2d');
        this.generateNoise();
    }

    generateNoise() {
        const imageData = this.noiseCtx.createImageData(256, 256);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const noise = Math.random() * 255;
            data[i] = noise;     // R
            data[i + 1] = noise; // G
            data[i + 2] = noise; // B
            data[i + 3] = 255;   // A
        }

        this.noiseCtx.putImageData(imageData, 0, 0);
        // Invalidate cached pattern so it gets recreated on next use
        this._cachedNoisePattern = null;
    }

    triggerGlitch(intensity = 1, duration = 30) {
        this.glitchActive = true;
        this.glitchIntensity = intensity;
        this.glitchTimer = duration;
    }

    update() {
        // Skip updates on low-perf devices
        if (!this.enabled) return;

        // Update scanline animation - less frequently
        this.frameSkip++;
        if (this.frameSkip >= 2) {
            this.frameSkip = 0;
            this.scanlineOffset = (this.scanlineOffset + 1) % 6;
        }

        // Update glitch
        if (this.glitchTimer > 0) {
            this.glitchTimer--;
            if (this.glitchTimer <= 0) {
                this.glitchActive = false;
            }
        }

        // Regenerate noise very occasionally (was 10%, now 2%)
        if (this.noiseCanvas && Math.random() < 0.02) {
            this.generateNoise();
        }
    }

    apply(ctx, canvas) {
        if (!this.enabled || !ctx || !canvas) return;

        ctx.save();

        // Chromatic aberration
        if (this.chromaticAberration > 0) {
            this.applyChromaticAberration(ctx, canvas);
        }

        // Scanlines
        if (this.scanlineIntensity > 0) {
            this.applyScanlines(ctx, canvas);
        }

        // Noise
        if (this.noiseIntensity > 0) {
            this.applyNoise(ctx, canvas);
        }

        // Glitch effect
        if (this.glitchActive) {
            this.applyGlitch(ctx, canvas);
        }

        // Vignette
        this.applyVignette(ctx, canvas);

        ctx.restore();
    }

    applyChromaticAberration(ctx, canvas) {
        const { width, height } = this.getCanvasSize(canvas);
        // Simple RGB shift simulation
        // Note: True chromatic aberration requires pixel manipulation
        // This is a simplified version using shadow effects

        const offset = this.chromaticAberration * (this.glitchActive ? this.glitchIntensity * 2 : 1);

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.1;

        // Red shift left
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = -offset;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = 'transparent';
        ctx.fillRect(0, 0, width, height);

        // Blue shift right
        ctx.shadowColor = '#0000ff';
        ctx.shadowOffsetX = offset;
        ctx.fillRect(0, 0, width, height);

        ctx.restore();
    }

    applyScanlines(ctx, canvas) {
        const { width, height } = this.getCanvasSize(canvas);
        ctx.save();
        ctx.globalAlpha = this.scanlineIntensity;
        ctx.fillStyle = '#000000';

        // Draw fewer scanlines - every 6 pixels instead of 4
        for (let y = this.scanlineOffset; y < height; y += 6) {
            ctx.fillRect(0, y, width, 2);
        }

        ctx.restore();
    }

    applyNoise(ctx, canvas) {
        if (!this.noiseCanvas) return;
        const { width, height } = this.getCanvasSize(canvas);

        ctx.save();
        ctx.globalAlpha = this.noiseIntensity * (this.glitchActive ? 3 : 1);
        ctx.globalCompositeOperation = 'overlay';

        // OPTIMIZED: Cache pattern instead of creating new one every frame
        if (!this._cachedNoisePattern) {
            this._cachedNoisePattern = ctx.createPattern(this.noiseCanvas, 'repeat');
        }
        ctx.fillStyle = this._cachedNoisePattern;
        ctx.fillRect(0, 0, width, height);

        ctx.restore();
    }

    applyGlitch(ctx, canvas) {
        if (!this.glitchActive) return;
        const { width, height } = this.getCanvasSize(canvas);

        const intensity = this.glitchIntensity * (this.glitchTimer / 30);

        // OPTIMIZED: Use drawImage slicing instead of getImageData/putImageData
        // getImageData stalls the GPU pipeline (15-40ms), drawImage stays on GPU
        const sliceCount = Math.floor(2 + Math.random() * 3 * intensity);
        const sourceCanvas = ctx.canvas;

        for (let i = 0; i < sliceCount; i++) {
            const y = Math.floor(Math.random() * height);
            const sliceHeight = Math.floor(5 + Math.random() * 30 * intensity);
            const offsetX = Math.floor((Math.random() - 0.5) * 50 * intensity);

            // Use drawImage to copy and offset a slice - stays on GPU
            try {
                ctx.drawImage(sourceCanvas, 0, y, width, sliceHeight, offsetX, y, width, sliceHeight);
            } catch (e) {
                // Security error if canvas is tainted
            }
        }

        // Color shift
        if (Math.random() < 0.3) {
            ctx.save();
            ctx.globalCompositeOperation = 'exclusion';
            ctx.globalAlpha = 0.2 * intensity;
            ctx.fillStyle = ['#ff0000', '#00ff00', '#0000ff'][Math.floor(Math.random() * 3)];
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
        }
    }

    applyVignette(ctx, canvas) {
        const { width, height } = this.getCanvasSize(canvas);
        // Cache gradient if canvas size hasn't changed
        if (this.lastCanvasSize.w !== width || this.lastCanvasSize.h !== height) {
            this.vignetteGradient = ctx.createRadialGradient(
                width / 2, height / 2, 0,
                width / 2, height / 2, Math.max(width, height) * 0.7
            );
            this.vignetteGradient.addColorStop(0, 'transparent');
            this.vignetteGradient.addColorStop(0.5, 'transparent');
            this.vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
            this.lastCanvasSize.w = width;
            this.lastCanvasSize.h = height;
        }

        ctx.fillStyle = this.vignetteGradient;
        ctx.fillRect(0, 0, width, height);
    }

    getCanvasSize(canvas) {
        return {
            width: canvas.logicalWidth || canvas.width,
            height: canvas.logicalHeight || canvas.height
        };
    }

    // CRT screen curvature effect (optional, performance heavy)
    applyCurvature(ctx, canvas) {
        // This would require pixel manipulation and is too performance heavy
        // Keeping as placeholder for future WebGL implementation
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    setScanlineIntensity(intensity) {
        this.scanlineIntensity = Math.max(0, Math.min(1, intensity));
    }

    setNoiseIntensity(intensity) {
        this.noiseIntensity = Math.max(0, Math.min(1, intensity));
    }

    setChromaticAberration(amount) {
        this.chromaticAberration = Math.max(0, Math.min(10, amount));
    }
}
