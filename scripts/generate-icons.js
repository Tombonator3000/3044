/**
 * Geometry 3044 - Icon Generator
 * Generates PWA icons in various sizes
 */

const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 72, 96, 128, 144, 152, 180, 192, 384, 512];

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

function generateIcon(size) {
    const png = new PNG({ width: size, height: size });
    const center = size / 2;

    // Colors
    const bgTop = hexToRgb('#1a0033');
    const bgMid = hexToRgb('#0a0015');
    const bgBot = hexToRgb('#000000');
    const cyan = hexToRgb('#00ffff');
    const magenta = hexToRgb('#ff00ff');
    const orange = hexToRgb('#ff6b35');
    const purple = hexToRgb('#8b00ff');
    const white = { r: 255, g: 255, b: 255 };

    // Fill each pixel
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const idx = (size * y + x) << 2;

            // Background gradient
            const gradT = y / size;
            let bgColor;
            if (gradT < 0.5) {
                const t = gradT * 2;
                bgColor = {
                    r: Math.round(lerp(bgTop.r, bgMid.r, t)),
                    g: Math.round(lerp(bgTop.g, bgMid.g, t)),
                    b: Math.round(lerp(bgTop.b, bgMid.b, t))
                };
            } else {
                const t = (gradT - 0.5) * 2;
                bgColor = {
                    r: Math.round(lerp(bgMid.r, bgBot.r, t)),
                    g: Math.round(lerp(bgMid.g, bgBot.g, t)),
                    b: Math.round(lerp(bgMid.b, bgBot.b, t))
                };
            }

            let color = bgColor;

            // Synthwave sun (bottom half of icon)
            const sunY = size * 0.75;
            const sunR = size * 0.25;
            const dx = x - center;
            const dy = y - sunY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < sunR && y < sunY) {
                // Sun gradient
                const sunT = (y - (sunY - sunR)) / sunR;
                if (sunT < 0.5) {
                    const t = sunT * 2;
                    color = {
                        r: Math.round(lerp(orange.r, magenta.r, t)),
                        g: Math.round(lerp(orange.g, magenta.g, t)),
                        b: Math.round(lerp(orange.b, magenta.b, t))
                    };
                } else {
                    const t = (sunT - 0.5) * 2;
                    color = {
                        r: Math.round(lerp(magenta.r, purple.r, t)),
                        g: Math.round(lerp(magenta.g, purple.g, t)),
                        b: Math.round(lerp(magenta.b, purple.b, t))
                    };
                }

                // Sun lines
                const linePositions = [0.2, 0.4, 0.6, 0.8];
                for (const lp of linePositions) {
                    const lineY = sunY - sunR + lp * sunR;
                    const lineHeight = size / 64 + lp * (size / 32);
                    if (y >= lineY && y < lineY + lineHeight) {
                        color = bgMid;
                        break;
                    }
                }
            }

            // Player ship (simplified triangle)
            const shipY = size * 0.28;
            const shipSize = size * 0.22;

            // Main body (triangle check)
            const shipTop = shipY - shipSize * 0.5;
            const shipBottom = shipY + shipSize * 0.35;
            if (y >= shipTop && y <= shipBottom) {
                const progress = (y - shipTop) / (shipBottom - shipTop);
                const halfWidth = progress * shipSize * 0.4;
                if (x >= center - halfWidth && x <= center + halfWidth) {
                    color = cyan;
                }
            }

            // Wings
            const wingY = shipY + shipSize * 0.1;
            const wingBottom = shipY + shipSize * 0.5;
            if (y >= wingY && y <= wingBottom) {
                const progress = (y - wingY) / (wingBottom - wingY);
                // Left wing
                const leftWingStart = center - shipSize * 0.4 - progress * shipSize * 0.2;
                const leftWingEnd = center - shipSize * 0.1;
                if (x >= leftWingStart && x <= leftWingEnd) {
                    color = magenta;
                }
                // Right wing
                const rightWingStart = center + shipSize * 0.1;
                const rightWingEnd = center + shipSize * 0.4 + progress * shipSize * 0.2;
                if (x >= rightWingStart && x <= rightWingEnd) {
                    color = magenta;
                }
            }

            // Ship core (circle)
            const coreDist = Math.sqrt((x - center) ** 2 + (y - shipY) ** 2);
            if (coreDist < shipSize * 0.12) {
                color = white;
            } else if (coreDist < shipSize * 0.08) {
                color = cyan;
            }

            // Engine trail
            const trailTop = shipY + shipSize * 0.35;
            const trailBottom = shipY + shipSize * 0.65;
            if (y >= trailTop && y <= trailBottom) {
                const progress = (y - trailTop) / (trailBottom - trailTop);
                const halfWidth = (1 - progress) * shipSize * 0.12;
                if (x >= center - halfWidth && x <= center + halfWidth) {
                    color = { r: 0, g: Math.round(255 * (1 - progress * 0.5)), b: Math.round(255 * (1 - progress * 0.3)) };
                }
            }

            // Random stars
            const starSeed = (x * 7 + y * 13) % 100;
            if (starSeed < 2 && y < size * 0.4 && color === bgColor) {
                const brightness = 150 + (starSeed * 50);
                color = { r: brightness, g: brightness, b: brightness };
            }

            png.data[idx] = color.r;
            png.data[idx + 1] = color.g;
            png.data[idx + 2] = color.b;
            png.data[idx + 3] = 255; // Alpha
        }
    }

    return png;
}

// Ensure icons directory exists
const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate all icons
console.log('Generating PWA icons for Geometry 3044...\n');

sizes.forEach(size => {
    const png = generateIcon(size);
    const filename = `icon-${size}x${size}.png`;
    const filepath = path.join(iconsDir, filename);

    const buffer = PNG.sync.write(png);
    fs.writeFileSync(filepath, buffer);
    console.log(`Created: ${filename}`);
});

// Also create apple-touch-icon
const applePng = generateIcon(180);
const appleBuffer = PNG.sync.write(applePng);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), appleBuffer);
console.log('Created: apple-touch-icon.png');

console.log('\nAll icons generated successfully!');
