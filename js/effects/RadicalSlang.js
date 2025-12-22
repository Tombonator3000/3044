// ============================================
// GEOMETRY 3044 — RADICAL 80s SLANG SYSTEM
// Enhanced with more gnarly vocabulary!
// ============================================

export class RadicalSlang {
    constructor() {
        this.activeTexts = [];

        // Main combo thresholds with varied slang
        this.comboThresholds = [
            { combo: 3, text: 'FRESH!', color: '#00ff88' },
            { combo: 5, text: 'RADICAL!', color: '#ff0080' },
            { combo: 8, text: 'STELLAR!', color: '#ffaa00' },
            { combo: 10, text: 'TUBULAR!', color: '#00ffff' },
            { combo: 12, text: 'BITCHIN!', color: '#ff6600' },
            { combo: 15, text: 'GNARLY!', color: '#ffff00' },
            { combo: 18, text: 'MONDO!', color: '#ff00aa' },
            { combo: 20, text: 'BODACIOUS!', color: '#ff00ff' },
            { combo: 25, text: 'CHOICE!', color: '#88ff00' },
            { combo: 30, text: 'WICKED!', color: '#00ff00' },
            { combo: 35, text: 'PRIMO!', color: '#ff4400' },
            { combo: 40, text: 'AWESOME!', color: '#ff8800' },
            { combo: 45, text: 'GRODY!', color: '#aa00ff' },
            { combo: 50, text: 'RIGHTEOUS!', color: '#8800ff' },
            { combo: 60, text: 'TRIPPIN!', color: '#00aaff' },
            { combo: 75, text: 'GROOVY!', color: '#ff0044' },
            { combo: 85, text: 'PSYCH!', color: '#ff88ff' },
            { combo: 100, text: 'FAR OUT!', color: '#00ff88' },
            { combo: 120, text: 'OUTRAGEOUS!', color: '#ffcc00' },
            { combo: 150, text: 'TOTALLY TUBULAR!', color: '#ffff00' },
            { combo: 175, text: 'HEINOUS COMBO!', color: '#ff3366' },
            { combo: 200, text: 'MEGA RADICAL!', color: '#ff00ff' },
            { combo: 250, text: 'MOST TRIUMPHANT!', color: '#00ffaa' },
            { combo: 300, text: 'SUPREMELY BODACIOUS!', color: '#00ffff' },
            { combo: 400, text: 'BOGUS DESTRUCTION!', color: '#ff6699' },
            { combo: 500, text: '★ LEGENDARY ★', color: '#ffd700' },
            { combo: 750, text: '★★ EXCELLENT! ★★', color: '#ffffff' },
            { combo: 1000, text: '★★★ MOST EXCELLENT! ★★★', color: '#ffd700' }
        ];

        // Random kill phrases (shown occasionally on kills)
        this.killPhrases = [
            { text: 'WASTED!', color: '#ff0000' },
            { text: 'TOASTED!', color: '#ff6600' },
            { text: 'SMOKED!', color: '#888888' },
            { text: 'DUSTED!', color: '#ffcc00' },
            { text: 'BURNED!', color: '#ff4400' },
            { text: 'ZAPPED!', color: '#00ffff' },
            { text: 'VAPORIZED!', color: '#ff00ff' },
            { text: 'ANNIHILATED!', color: '#ff0080' },
            { text: 'TERMINATED!', color: '#ff0000' },
            { text: 'OBLITERATED!', color: '#ff00aa' },
            { text: 'PWNED!', color: '#00ff00' },
            { text: 'REKT!', color: '#ffff00' },
            { text: 'NO WAY!', color: '#00ffff' },
            { text: 'COWABUNGA!', color: '#ff8800' },
            { text: 'LATER DUDE!', color: '#88ff00' }
        ];

        // Power-up collection phrases
        this.powerUpPhrases = [
            { text: 'SCORE!', color: '#00ff00' },
            { text: 'SWEET!', color: '#ff00ff' },
            { text: 'RIGHTEOUS!', color: '#ffff00' },
            { text: 'GNARLY!', color: '#00ffff' },
            { text: 'KILLER!', color: '#ff0080' },
            { text: 'SICK!', color: '#ff6600' },
            { text: 'DOPE!', color: '#88ff00' },
            { text: 'TIGHT!', color: '#ff00aa' }
        ];

        // Boss-related phrases
        this.bossPhrases = [
            { text: 'BOSS FIGHT!', color: '#ff0000' },
            { text: 'BRING IT!', color: '#ffff00' },
            { text: 'GAME ON!', color: '#00ffff' },
            { text: 'LET\'S DO THIS!', color: '#ff00ff' }
        ];

        // Boss defeat phrases
        this.bossDefeatPhrases = [
            { text: 'BOSS DESTROYED!', color: '#ffd700' },
            { text: 'EXCELLENT!', color: '#00ff00' },
            { text: 'PARTY ON!', color: '#ff00ff' },
            { text: 'MOST TRIUMPHANT!', color: '#00ffff' },
            { text: 'VICTORY!', color: '#ffff00' }
        ];

        // Wave clear phrases
        this.waveClearPhrases = [
            { text: 'WAVE CLEARED!', color: '#00ff00' },
            { text: 'ALL CLEAR!', color: '#00ffff' },
            { text: 'RADICAL!', color: '#ff00ff' },
            { text: 'NEXT WAVE!', color: '#ffff00' }
        ];

        // Danger/warning phrases
        this.dangerPhrases = [
            { text: 'BOGUS!', color: '#ff0000' },
            { text: 'WEAK SAUCE!', color: '#ff6600' },
            { text: 'BUMMER!', color: '#ff4400' },
            { text: 'HARSH!', color: '#ff0080' }
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
        // Randomize position on screen (20%-80% range to avoid edges)
        const randomX = 0.2 + Math.random() * 0.6; // 20% to 80% of width
        const randomY = 0.2 + Math.random() * 0.4; // 20% to 60% of height

        this.activeTexts.push({
            text: text,
            color: color,
            combo: combo,
            x: 0,
            y: 0,
            randomXFactor: randomX, // Store random position factor
            randomYFactor: randomY,
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
            // Use random position factors if available, otherwise fall back to screenX/screenY or center
            let x, y;
            if (text.screenX !== undefined) {
                x = text.screenX + text.x;
            } else if (text.randomXFactor !== undefined) {
                x = canvasWidth * text.randomXFactor + text.x;
            } else {
                x = canvasWidth / 2 + text.x;
            }

            if (text.screenY !== undefined) {
                y = text.screenY + text.y;
            } else if (text.randomYFactor !== undefined) {
                y = canvasHeight * text.randomYFactor + text.y;
            } else {
                y = canvasHeight * 0.35 + text.y;
            }

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(text.rotation);
            ctx.scale(text.scale, text.scale);

            // Glow effect
            ctx.shadowBlur = 30;
            ctx.shadowColor = text.color;
            ctx.globalAlpha = alpha;

            // Main text - size based on type
            const fontSize = text.fontSize || 48;
            ctx.font = `bold ${fontSize}px "Courier New", monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Outline
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = Math.max(3, fontSize / 8);
            ctx.strokeText(text.text, 0, 0);

            // Fill with gradient
            const gradient = ctx.createLinearGradient(-100, -20, 100, 20);
            gradient.addColorStop(0, text.color);
            gradient.addColorStop(0.5, '#ffffff');
            gradient.addColorStop(1, text.color);
            ctx.fillStyle = gradient;
            ctx.fillText(text.text, 0, 0);

            // Combo number below (only for combo texts)
            if (text.combo) {
                ctx.font = 'bold 24px "Courier New", monospace';
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 15;
                ctx.fillText(`${text.combo}x COMBO`, 0, 40);
            }

            ctx.restore();
        }
    }

    // ============================================
    // NEW SLANG TRIGGER METHODS
    // ============================================

    /**
     * Show a random kill phrase at position (10% chance)
     */
    showKillPhrase(x, y, forceShow = false) {
        if (!forceShow && Math.random() > 0.1) return; // 10% chance

        const phrase = this.killPhrases[Math.floor(Math.random() * this.killPhrases.length)];
        this.addTextAtPosition(phrase.text, phrase.color, x, y, 24);
    }

    /**
     * Show a power-up collection phrase
     */
    showPowerUpPhrase(x, y) {
        const phrase = this.powerUpPhrases[Math.floor(Math.random() * this.powerUpPhrases.length)];
        this.addTextAtPosition(phrase.text, phrase.color, x, y, 28);
    }

    /**
     * Show a boss encounter phrase
     */
    showBossPhrase() {
        const phrase = this.bossPhrases[Math.floor(Math.random() * this.bossPhrases.length)];
        this.addText(phrase.text, phrase.color);
    }

    /**
     * Show a boss defeat phrase
     */
    showBossDefeatPhrase(x, y) {
        const phrase = this.bossDefeatPhrases[Math.floor(Math.random() * this.bossDefeatPhrases.length)];
        this.addTextAtPosition(phrase.text, phrase.color, x, y, 56);
    }

    /**
     * Show a wave clear phrase
     */
    showWaveClearPhrase() {
        const phrase = this.waveClearPhrases[Math.floor(Math.random() * this.waveClearPhrases.length)];
        this.addText(phrase.text, phrase.color);
    }

    /**
     * Show a danger/death phrase
     */
    showDangerPhrase(x, y) {
        const phrase = this.dangerPhrases[Math.floor(Math.random() * this.dangerPhrases.length)];
        this.addTextAtPosition(phrase.text, phrase.color, x, y, 32);
    }

    /**
     * Add text at specific screen position
     */
    addTextAtPosition(text, color, x, y, fontSize = 32) {
        this.activeTexts.push({
            text: text,
            color: color,
            screenX: x,
            screenY: y,
            x: 0,
            y: 0,
            life: 60,
            maxLife: 60,
            scale: 0,
            targetScale: 1.2,
            rotation: (Math.random() - 0.5) * 0.3,
            vx: (Math.random() - 0.5) * 3,
            vy: -2,
            fontSize: fontSize
        });
    }

    /**
     * Show multiple combo milestone texts for huge combos
     */
    showMegaCombo(combo) {
        // Show main combo text
        const tier = this.comboThresholds.find(t => t.combo === combo);
        if (tier) {
            this.addText(tier.text, tier.color, combo);

            // Add extra celebratory effects for really big combos
            if (combo >= 100) {
                setTimeout(() => {
                    this.addText('UNSTOPPABLE!', '#ffffff');
                }, 200);
            }
            if (combo >= 250) {
                setTimeout(() => {
                    this.addText('GODLIKE!', '#ffd700');
                }, 400);
            }
        }
    }

    /**
     * Get a random 80s exclamation
     */
    getRandomExclamation() {
        const exclamations = [
            'TUBULAR!', 'RADICAL!', 'GNARLY!', 'BODACIOUS!',
            'WICKED!', 'AWESOME!', 'STELLAR!', 'CHOICE!',
            'PRIMO!', 'FRESH!', 'MONDO!', 'BITCHIN!'
        ];
        return exclamations[Math.floor(Math.random() * exclamations.length)];
    }
}
