/**
 * Geometry 3044 - Starfield Effect Module
 * Multi-layered parallax starfield with nebulae and warp stars
 */

import { getCurrentTheme } from '../config.js';
import { config } from '../globals.js';

export class Starfield {
    constructor() {
        this.layers = [];
        this.nebulae = [];
        this.distantNebulae = [];
        this.transitionTimer = 0;
        this.currentTheme = getCurrentTheme();
        this.warpStars = [];

        // Create multiple star layers for depth
        for (let layer = 0; layer < 5; layer++) {
            const stars = [];
            const numStars = 80 - (layer * 12);

            for (let i = 0; i < numStars; i++) {
                stars.push({
                    x: Math.random() * config.width,
                    y: Math.random() * config.height,
                    brightness: Math.random() * 0.8 + 0.2,
                    twinkleSpeed: 0.005 + Math.random() * 0.015,
                    twinklePhase: Math.random() * Math.PI * 2,
                    size: 0.5 + layer * 0.4,
                    speed: 0.1 + layer * 0.4,
                    color: Math.random() > 0.9 ? 'colored' : 'white'
                });
            }
            this.layers.push(stars);
        }

        // Create main nebulae (closer, more detailed)
        for (let i = 0; i < 4; i++) {
            this.nebulae.push({
                x: Math.random() * config.width * 1.5 - config.width * 0.25,
                y: Math.random() * config.height * 1.2 - config.height * 0.1,
                size: 150 + Math.random() * 250,
                baseHue: Math.random() * 90,
                speed: 0.08 + Math.random() * 0.15,
                opacity: 0.06 + Math.random() * 0.08,
                pulseSpeed: 0.008 + Math.random() * 0.012,
                pulsePhase: Math.random() * Math.PI * 2,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.002,
                type: Math.random() > 0.5 ? 'spiral' : 'cloud'
            });
        }

        // Create distant nebulae (background layer)
        for (let i = 0; i < 6; i++) {
            this.distantNebulae.push({
                x: Math.random() * config.width * 2 - config.width * 0.5,
                y: Math.random() * config.height * 1.5 - config.height * 0.25,
                size: 200 + Math.random() * 400,
                baseHue: Math.random() * 120,
                speed: 0.02 + Math.random() * 0.05,
                opacity: 0.03 + Math.random() * 0.04,
                pulseSpeed: 0.003 + Math.random() * 0.005,
                pulsePhase: Math.random() * Math.PI * 2,
                swayAmount: 20 + Math.random() * 40,
                swaySpeed: 0.001 + Math.random() * 0.002,
                swayPhase: Math.random() * Math.PI * 2
            });
        }

        // Warp stars for hyperspeed effect
        for (let i = 0; i < 15; i++) {
            this.warpStars.push({
                x: Math.random() * config.width,
                y: Math.random() * config.height,
                length: 5 + Math.random() * 15,
                speed: 8 + Math.random() * 12,
                opacity: 0.15 + Math.random() * 0.2,
                active: Math.random() > 0.7
            });
        }

        console.log('⭐ Enhanced starfield created with', this.layers.length, 'star layers,', this.nebulae.length, 'main nebulae, and', this.distantNebulae.length, 'distant nebulae');
    }

    update() {
        // Check for theme change
        const newTheme = getCurrentTheme();
        if (newTheme.name !== this.currentTheme.name) {
            this.currentTheme = newTheme;
            this.transitionTimer = 60;
        }

        if (this.transitionTimer > 0) {
            this.transitionTimer--;
        }

        // Update star layers
        this.layers.forEach((layer, layerIndex) => {
            layer.forEach(star => {
                star.y += star.speed;
                star.twinklePhase += star.twinkleSpeed;

                if (star.y > config.height + 20) {
                    star.y = -20;
                    star.x = Math.random() * config.width;
                    star.brightness = Math.random() * 0.8 + 0.2;
                }
            });
        });

        // Update main nebulae
        this.nebulae.forEach(nebula => {
            nebula.y += nebula.speed;
            nebula.pulsePhase += nebula.pulseSpeed;
            nebula.rotation += nebula.rotationSpeed;

            if (nebula.y > config.height + nebula.size) {
                nebula.y = -nebula.size;
                nebula.x = Math.random() * config.width * 1.5 - config.width * 0.25;
                nebula.baseHue = Math.random() * 90;
            }
        });

        // Update distant nebulae
        this.distantNebulae.forEach(nebula => {
            nebula.y += nebula.speed;
            nebula.pulsePhase += nebula.pulseSpeed;
            nebula.swayPhase += nebula.swaySpeed;

            // Add horizontal swaying motion
            nebula.swayOffset = Math.sin(nebula.swayPhase) * nebula.swayAmount;

            if (nebula.y > config.height + nebula.size) {
                nebula.y = -nebula.size;
                nebula.x = Math.random() * config.width * 2 - config.width * 0.5;
            }
        });

        // Update warp stars
        this.warpStars.forEach(star => {
            if (star.active) {
                star.y += star.speed;

                if (star.y > config.height + 50) {
                    star.y = -50;
                    star.x = Math.random() * config.width;
                    star.length = 5 + Math.random() * 15;
                    star.speed = 8 + Math.random() * 12;
                    star.active = Math.random() > 0.5;
                }
            } else {
                // Randomly reactivate
                if (Math.random() < 0.002) {
                    star.active = true;
                    star.x = Math.random() * config.width;
                    star.y = -50;
                }
            }
        });
    }

    draw(ctx) {
        ctx.save();

        // Draw distant nebulae first (background layer)
        this.distantNebulae.forEach(nebula => {
            const pulse = Math.sin(nebula.pulsePhase) * 0.2 + 0.8;
            const hue = this.currentTheme.nebulaHue + nebula.baseHue;
            const currentX = nebula.x + (nebula.swayOffset || 0);

            const gradient = ctx.createRadialGradient(
                currentX, nebula.y, 0,
                currentX, nebula.y, nebula.size * pulse
            );
            gradient.addColorStop(0, `hsla(${hue}, 60%, 40%, ${nebula.opacity * pulse * 0.4})`);
            gradient.addColorStop(0.3, `hsla(${hue + 20}, 50%, 35%, ${nebula.opacity * pulse * 0.25})`);
            gradient.addColorStop(0.6, `hsla(${hue + 40}, 40%, 30%, ${nebula.opacity * pulse * 0.1})`);
            gradient.addColorStop(1, 'transparent');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(currentX, nebula.y, nebula.size * pulse, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw far stars (smallest, dimmest)
        this.layers[0].forEach(star => {
            const twinkle = Math.sin(star.twinklePhase) * 0.2 + 0.8;
            const alpha = star.brightness * twinkle * 0.15;

            ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw main nebulae
        this.nebulae.forEach(nebula => {
            const pulse = Math.sin(nebula.pulsePhase) * 0.3 + 0.7;
            const hue = this.currentTheme.nebulaHue + nebula.baseHue;

            ctx.save();
            ctx.translate(nebula.x, nebula.y);
            ctx.rotate(nebula.rotation);

            if (nebula.type === 'spiral') {
                // Spiral galaxy-like nebula
                for (let i = 0; i < 3; i++) {
                    ctx.save();
                    ctx.rotate((i * Math.PI * 2) / 3);

                    const gradient = ctx.createRadialGradient(
                        0, 0, 0,
                        nebula.size * 0.8, 0, nebula.size * pulse
                    );
                    gradient.addColorStop(0, `hsla(${hue + i * 15}, 70%, 50%, ${nebula.opacity * pulse * 0.6})`);
                    gradient.addColorStop(0.4, `hsla(${hue + i * 15 + 30}, 60%, 40%, ${nebula.opacity * pulse * 0.35})`);
                    gradient.addColorStop(0.8, `hsla(${hue + i * 15 + 60}, 50%, 30%, ${nebula.opacity * pulse * 0.15})`);
                    gradient.addColorStop(1, 'transparent');

                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.ellipse(0, 0, nebula.size * pulse * 0.8, nebula.size * pulse * 0.3, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            } else {
                // Cloud-like nebula
                for (let i = 0; i < 4; i++) {
                    const offsetX = Math.sin(nebula.pulsePhase + i) * 20;
                    const offsetY = Math.cos(nebula.pulsePhase + i * 0.7) * 15;
                    const size = nebula.size * (0.6 + i * 0.1) * pulse;

                    const gradient = ctx.createRadialGradient(
                        offsetX, offsetY, 0,
                        offsetX, offsetY, size
                    );
                    gradient.addColorStop(0, `hsla(${hue + i * 10}, 70%, 50%, ${nebula.opacity * pulse * (0.6 - i * 0.1)})`);
                    gradient.addColorStop(0.5, `hsla(${hue + i * 10 + 30}, 60%, 40%, ${nebula.opacity * pulse * 0.25 * (0.6 - i * 0.1)})`);
                    gradient.addColorStop(1, 'transparent');

                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(offsetX, offsetY, size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            ctx.restore();
        });

        // Draw middle distance stars
        for (let layerIndex = 1; layerIndex < 3; layerIndex++) {
            this.layers[layerIndex].forEach(star => {
                const twinkle = Math.sin(star.twinklePhase) * 0.3 + 0.7;
                const alpha = star.brightness * twinkle * (0.25 + layerIndex * 0.1);

                if (star.color === 'colored') {
                    const hue = (this.currentTheme.gridHue + layerIndex * 30) % 360;
                    ctx.fillStyle = `hsla(${hue}, 80%, 70%, ${alpha})`;
                    ctx.shadowBlur = star.size * 2;
                    ctx.shadowColor = `hsla(${hue}, 80%, 70%, ${alpha * 0.6})`;
                } else {
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.shadowBlur = star.size * 1.5;
                    ctx.shadowColor = `rgba(255, 255, 255, ${alpha * 0.4})`;
                }

                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();

                // Add cross flare for bright stars
                if (star.brightness > 0.7 && twinkle > 0.8) {
                    const flareLength = star.size * 3;
                    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
                    ctx.lineWidth = 0.4;
                    ctx.beginPath();
                    ctx.moveTo(star.x - flareLength, star.y);
                    ctx.lineTo(star.x + flareLength, star.y);
                    ctx.moveTo(star.x, star.y - flareLength);
                    ctx.lineTo(star.x, star.y + flareLength);
                    ctx.stroke();
                }

                ctx.shadowBlur = 0;
            });
        }

        // Draw warp stars
        this.warpStars.forEach(star => {
            if (star.active) {
                ctx.save();
                ctx.globalAlpha = star.opacity;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.shadowBlur = 4;
                ctx.shadowColor = '#ffffff';

                ctx.beginPath();
                ctx.moveTo(star.x, star.y);
                ctx.lineTo(star.x, star.y - star.length);
                ctx.stroke();

                ctx.restore();
            }
        });

        // Draw closest stars (brightest, largest)
        for (let layerIndex = 3; layerIndex < this.layers.length; layerIndex++) {
            this.layers[layerIndex].forEach(star => {
                const twinkle = Math.sin(star.twinklePhase) * 0.4 + 0.6;
                const alpha = star.brightness * twinkle * (0.35 + layerIndex * 0.1);

                if (star.color === 'colored') {
                    const hue = (this.currentTheme.gridHue + layerIndex * 40) % 360;
                    ctx.fillStyle = `hsla(${hue}, 90%, 80%, ${alpha})`;
                    ctx.shadowBlur = star.size * 3;
                    ctx.shadowColor = `hsla(${hue}, 90%, 80%, ${alpha * 0.7})`;
                } else {
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.shadowBlur = star.size * 2;
                    ctx.shadowColor = `rgba(255, 255, 255, ${alpha * 0.6})`;
                }

                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();

                // Bright star effects
                if (star.brightness > 0.6) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
                    ctx.beginPath();
                    ctx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2);
                    ctx.fill();

                    if (twinkle > 0.9) {
                        const flareLength = star.size * 5;
                        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
                        ctx.lineWidth = 0.8;
                        ctx.beginPath();
                        ctx.moveTo(star.x - flareLength, star.y);
                        ctx.lineTo(star.x + flareLength, star.y);
                        ctx.moveTo(star.x, star.y - flareLength);
                        ctx.lineTo(star.x, star.y + flareLength);
                        ctx.stroke();
                    }
                }

                ctx.shadowBlur = 0;
            });
        }

        ctx.restore();
    }
}
