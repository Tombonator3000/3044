// ============================================
// GEOMETRY 3044 — RADICAL 80s SLANG SYSTEM
// ============================================

export class RadicalSlang {
    constructor() {
        this.activeTexts = [];
        this.comboThresholds = [
            { combo: 5, text: 'RADICAL!', color: '#ff0080' },
            { combo: 10, text: 'TUBULAR!', color: '#00ffff' },
            { combo: 15, text: 'GNARLY!', color: '#ffff00' },
            { combo: 20, text: 'BODACIOUS!', color: '#ff00ff' },
            { combo: 30, text: 'WICKED!', color: '#00ff00' },
            { combo: 40, text: 'AWESOME!', color: '#ff8800' },
            { combo: 50, text: 'RIGHTEOUS!', color: '#8800ff' },
            { combo: 75, text: 'GROOVY!', color: '#ff0044' },
            { combo: 100, text: 'FAR OUT!', color: '#00ff88' },
            { combo: 150, text: 'TOTALLY TUBULAR!', color: '#ffff00' },
            { combo: 200, text: 'MEGA RADICAL!', color: '#ff00ff' },
            { combo: 300, text: 'SUPREMELY BODACIOUS!', color: '#00ffff' },
            { combo: 500, text: '★ LEGENDARY ★', color: '#ffd700' }
        ];

        this.lastComboTier = 0;
    }

    checkCombo(combo) {
        // Find the highest threshold reached
        let currentTier = 0;
        let slangData = null;

        for (let i = this.comboThresholds.length - 1; i >= 0; i--) {
            if (combo >= this.comboThresholds[i].combo) {
                currentTier = i + 1;
                slangData = this.comboThresholds[i];
                break;
            }
        }

        // Only trigger if we reached a NEW tier
        if (currentTier > this.lastComboTier && slangData) {
            this.lastComboTier = currentTier;
            this.addText(slangData.text, slangData.color, combo);
            return true;
        }

        return false;
    }

    resetCombo() {
        this.lastComboTier = 0;
    }

    addText(text, color, combo) {
        this.activeTexts.push({
            text: text,
            color: color,
            combo: combo,
            x: 0,  // Will be centered
            y: 0,  // Will be set based on canvas
            life: 120,  // 2 seconds at 60fps
            maxLife: 120,
            scale: 0,
            targetScale: 1.5,
            rotation: (Math.random() - 0.5) * 0.2,
            vx: (Math.random() - 0.5) * 2,
            vy: -1
        });
    }

    update() {
        this.activeTexts = this.activeTexts.filter(text => {
            text.life--;

            // Scale animation
            if (text.life > text.maxLife - 15) {
                // Pop in
                text.scale += (text.targetScale - text.scale) * 0.3;
            } else if (text.life < 30) {
                // Fade out
                text.scale *= 0.95;
            }

            // Movement
            text.x += text.vx;
            text.y += text.vy;
            text.vy += 0.02;  // Gentle gravity

            return text.life > 0;
        });
    }

    draw(ctx, canvasWidth, canvasHeight) {
        if (!ctx) return;

        for (const text of this.activeTexts) {
            const alpha = Math.min(1, text.life / 30);
            const x = canvasWidth / 2 + text.x;
            const y = canvasHeight * 0.35 + text.y;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(text.rotation);
            ctx.scale(text.scale, text.scale);

            // Glow effect
            ctx.shadowBlur = 30;
            ctx.shadowColor = text.color;
            ctx.globalAlpha = alpha;

            // Main text
            ctx.font = 'bold 48px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Outline
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 6;
            ctx.strokeText(text.text, 0, 0);

            // Fill with gradient
            const gradient = ctx.createLinearGradient(-100, -20, 100, 20);
            gradient.addColorStop(0, text.color);
            gradient.addColorStop(0.5, '#ffffff');
            gradient.addColorStop(1, text.color);
            ctx.fillStyle = gradient;
            ctx.fillText(text.text, 0, 0);

            // Combo number below
            if (text.combo) {
                ctx.font = 'bold 24px "Courier New", monospace';
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 15;
                ctx.fillText(`${text.combo}x COMBO`, 0, 40);
            }

            ctx.restore();
        }
    }
}
