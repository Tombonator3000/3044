/**
 * Geometry 3044 - VHS Glitch Effect Module
 * Retro VHS-style visual distortion effects
 */

import { config } from '../globals.js';

export class VHSGlitchEffects {
    constructor() {
        this.glitchTimer = 0;
        this.scanlineOffset = 0;
        this.colorSeparation = 0;
        this.noiseIntensity = 0;
        this.horizontalDistortion = [];
        this.staticLines = [];
        this.chromaShift = 0;
        this.trackingError = 0;

        this.generateStaticLines();
    }

    generateStaticLines() {
        this.staticLines = [];
        for (let i = 0; i < 200; i++) {
            this.staticLines.push({
                y: Math.random() * config.height,
                intensity: Math.random(),
                speed: Math.random() * 2 + 0.5,
                life: Math.random() * 60 + 30
            });
        }
    }

    triggerGlitch(intensity = 1) {
        this.glitchTimer = 60 * intensity;
        this.colorSeparation = 5 * intensity;
        this.noiseIntensity = 0.3 * intensity;
        this.trackingError = 10 * intensity;

        // Generate horizontal distortion lines
        this.horizontalDistortion = [];
        for (let i = 0; i < 10; i++) {
            this.horizontalDistortion.push({
                y: Math.random() * config.height,
                offset: (Math.random() - 0.5) * 50 * intensity,
                height: Math.random() * 20 + 5,
                life: Math.random() * 30 + 15
            });
        }
    }

    update() {
        if (this.glitchTimer > 0) {
            this.glitchTimer--;
            this.scanlineOffset = Math.sin(Date.now() * 0.01) * 2;
            this.chromaShift = Math.sin(Date.now() * 0.02) * this.colorSeparation;

            // Update distortion lines
            this.horizontalDistortion = this.horizontalDistortion.filter(line => {
                line.life--;
                line.offset += (Math.random() - 0.5) * 2;
                return line.life > 0;
            });

            // Update static lines
            this.staticLines.forEach(line => {
                line.y += line.speed;
                line.life--;
                if (line.y > config.height || line.life <= 0) {
                    line.y = -5;
                    line.intensity = Math.random();
                    line.life = Math.random() * 60 + 30;
                }
            });
        }
    }

    apply(ctx) {
        if (this.glitchTimer <= 0) return;

        ctx.save();

        // RGB color separation
        if (this.colorSeparation > 0) {
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = 0.1;

            // Red channel shift
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.chromaShift, 0, config.width, config.height);

            // Blue channel shift
            ctx.fillStyle = '#0000ff';
            ctx.fillRect(-this.chromaShift, 0, config.width, config.height);

            ctx.globalCompositeOperation = 'source-over';
        }

        // Horizontal distortion lines
        ctx.globalAlpha = 0.8;
        this.horizontalDistortion.forEach(line => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(line.offset, line.y, config.width, line.height);

            // Tracking error effect
            if (Math.random() < 0.3) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(0, line.y, config.width, 2);
            }
        });

        // TV static lines
        ctx.globalAlpha = this.noiseIntensity;
        this.staticLines.forEach(line => {
            if (line.life > 0) {
                ctx.fillStyle = `rgba(255, 255, 255, ${line.intensity})`;
                ctx.fillRect(0, line.y, config.width, 1);
            }
        });

        // Scanline interference
        if (this.trackingError > 0) {
            ctx.globalAlpha = 0.05;
            ctx.fillStyle = '#ffffff';
            for (let y = this.scanlineOffset; y < config.height; y += 4) {
                ctx.fillRect(0, y, config.width, 1);
            }
        }

        ctx.restore();
    }
}
