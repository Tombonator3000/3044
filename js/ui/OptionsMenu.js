/**
 * Geometry 3044 - Options Menu
 * Theme selection and game options
 */

import { getAllThemes, getTheme } from './HUDThemes.js';

export class OptionsMenu {
    constructor(hud, onClose) {
        this.hud = hud;
        this.onClose = onClose;
        this.visible = false;

        this.themes = getAllThemes();

        // Safe theme ID access - handle missing HUD or missing getThemeId method
        const currentThemeId = hud?.currentThemeId || hud?.getThemeId?.() || 'neoArcade';
        this.selectedIndex = this.themes.findIndex(t => t.id === currentThemeId);
        if (this.selectedIndex < 0) this.selectedIndex = 0;

        this.options = [
            {
                name: 'HUD THEME',
                type: 'theme',
                getValue: () => this.themes[this.selectedIndex].name,
                onLeft: () => this.prevTheme(),
                onRight: () => this.nextTheme(),
                onSelect: () => this.applyTheme()
            },
            {
                name: 'MUSIC VOLUME',
                type: 'slider',
                value: this.loadSetting('musicVolume', 0.5),
                getValue: () => Math.round(this.options[1].value * 100) + '%',
                onLeft: () => { this.options[1].value = Math.max(0, this.options[1].value - 0.1); this.saveSetting('musicVolume', this.options[1].value); },
                onRight: () => { this.options[1].value = Math.min(1, this.options[1].value + 0.1); this.saveSetting('musicVolume', this.options[1].value); }
            },
            {
                name: 'SFX VOLUME',
                type: 'slider',
                value: this.loadSetting('sfxVolume', 0.7),
                getValue: () => Math.round(this.options[2].value * 100) + '%',
                onLeft: () => { this.options[2].value = Math.max(0, this.options[2].value - 0.1); this.saveSetting('sfxVolume', this.options[2].value); },
                onRight: () => { this.options[2].value = Math.min(1, this.options[2].value + 0.1); this.saveSetting('sfxVolume', this.options[2].value); }
            },
            {
                name: 'SCREEN SHAKE',
                type: 'toggle',
                value: this.loadSetting('screenShake', true),
                getValue: () => this.options[3].value ? 'ON' : 'OFF',
                onSelect: () => { this.options[3].value = !this.options[3].value; this.saveSetting('screenShake', this.options[3].value); }
            },
            {
                name: 'CRT EFFECTS',
                type: 'toggle',
                value: this.loadSetting('crtEffects', true),
                getValue: () => this.options[4].value ? 'ON' : 'OFF',
                onSelect: () => { this.options[4].value = !this.options[4].value; this.saveSetting('crtEffects', this.options[4].value); }
            },
            {
                name: 'BACK',
                type: 'button',
                onSelect: () => this.close()
            }
        ];

        this.currentOption = 0;
        this.previewTheme = null;

        // Animation
        this.openProgress = 0;

        // Input cooldown to prevent rapid input
        this.inputCooldown = 0;
    }

    loadSetting(key, defaultValue) {
        try {
            const value = localStorage.getItem(`game_${key}`);
            if (value === null) return defaultValue;
            if (typeof defaultValue === 'boolean') return value === 'true';
            if (typeof defaultValue === 'number') return parseFloat(value);
            return value;
        } catch (e) {
            return defaultValue;
        }
    }

    saveSetting(key, value) {
        try {
            localStorage.setItem(`game_${key}`, String(value));
        } catch (e) {
            // localStorage not available
        }
    }

    show() {
        this.visible = true;
        this.openProgress = 0;
        // Refresh selected theme index - safe access
        const currentThemeId = this.hud?.currentThemeId || this.hud?.getThemeId?.() || 'neoArcade';
        this.selectedIndex = this.themes.findIndex(t => t.id === currentThemeId);
        if (this.selectedIndex < 0) this.selectedIndex = 0;
    }

    close() {
        this.visible = false;
        this.previewTheme = null;
        if (this.onClose) this.onClose();
    }

    isVisible() {
        return this.visible;
    }

    prevTheme() {
        this.selectedIndex = (this.selectedIndex - 1 + this.themes.length) % this.themes.length;
        this.previewTheme = getTheme(this.themes[this.selectedIndex].id);
    }

    nextTheme() {
        this.selectedIndex = (this.selectedIndex + 1) % this.themes.length;
        this.previewTheme = getTheme(this.themes[this.selectedIndex].id);
    }

    applyTheme() {
        if (this.hud?.setTheme) {
            this.hud.setTheme(this.themes[this.selectedIndex].id);
        }
        this.previewTheme = null;
    }

    getMusicVolume() {
        return this.options[1].value;
    }

    getSFXVolume() {
        return this.options[2].value;
    }

    getScreenShake() {
        return this.options[3].value;
    }

    getCRTEffects() {
        return this.options[4].value;
    }

    handleInput(key) {
        if (!this.visible) return false;
        if (this.inputCooldown > 0) return true;

        this.inputCooldown = 8; // Frames of cooldown

        const option = this.options[this.currentOption];

        switch (key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.currentOption = (this.currentOption - 1 + this.options.length) % this.options.length;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.currentOption = (this.currentOption + 1) % this.options.length;
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (option.onLeft) option.onLeft();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (option.onRight) option.onRight();
                break;
            case 'Enter':
            case ' ':
                if (option.onSelect) option.onSelect();
                break;
            case 'Escape':
                this.close();
                break;
            default:
                return false;
        }

        return true; // Input was handled
    }

    update(deltaTime = 1) {
        // Decay input cooldown
        this.inputCooldown = Math.max(0, this.inputCooldown - deltaTime);

        if (this.visible) {
            this.openProgress = Math.min(1, this.openProgress + 0.1 * deltaTime);
        } else {
            this.openProgress = Math.max(0, this.openProgress - 0.1 * deltaTime);
        }
    }

    draw(ctx, width, height) {
        if (this.openProgress <= 0) return;

        ctx.save();

        // Darken background
        ctx.fillStyle = `rgba(0, 0, 0, ${0.8 * this.openProgress})`;
        ctx.fillRect(0, 0, width, height);

        // Menu panel
        const panelWidth = 500;
        const panelHeight = 400;
        const panelX = (width - panelWidth) / 2;
        const panelY = (height - panelHeight) / 2;

        ctx.globalAlpha = this.openProgress;

        // Panel background
        ctx.fillStyle = 'rgba(20, 0, 40, 0.95)';
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';

        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        ctx.shadowBlur = 0;

        // Title
        ctx.font = 'bold 32px Courier New';
        ctx.fillStyle = '#00ffff';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ffff';
        ctx.fillText('\u2699 OPTIONS \u2699', width / 2, panelY + 50);
        ctx.shadowBlur = 0;

        // Options
        const startY = panelY + 100;
        const optionHeight = 45;

        this.options.forEach((option, i) => {
            const y = startY + i * optionHeight;
            const selected = i === this.currentOption;

            // Selection highlight
            if (selected) {
                ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
                ctx.fillRect(panelX + 20, y - 15, panelWidth - 40, 35);

                // Selection arrows
                ctx.fillStyle = '#00ffff';
                ctx.font = '20px Courier New';
                ctx.textAlign = 'left';
                ctx.fillText('\u25BA', panelX + 30, y + 5);
                ctx.textAlign = 'right';
                ctx.fillText('\u25C4', panelX + panelWidth - 30, y + 5);
            }

            // Option name
            ctx.font = `${selected ? 'bold ' : ''}18px Courier New`;
            ctx.fillStyle = selected ? '#ffffff' : '#888888';
            ctx.textAlign = 'left';
            ctx.fillText(option.name, panelX + 60, y + 5);

            // Option value
            if (option.getValue) {
                ctx.textAlign = 'right';
                ctx.fillStyle = selected ? '#00ffff' : '#666666';

                // Arrows for adjustable options
                if (option.type === 'theme' || option.type === 'slider') {
                    ctx.fillText(`\u25C4 ${option.getValue()} \u25BA`, panelX + panelWidth - 60, y + 5);
                } else {
                    ctx.fillText(option.getValue(), panelX + panelWidth - 60, y + 5);
                }
            }
        });

        // Theme preview (if selecting theme)
        if (this.previewTheme && this.currentOption === 0) {
            ctx.font = '12px Courier New';
            ctx.fillStyle = '#888888';
            ctx.textAlign = 'center';
            ctx.fillText(this.themes[this.selectedIndex].description, width / 2, panelY + panelHeight - 60);
            ctx.fillText('Press ENTER to apply', width / 2, panelY + panelHeight - 40);
        }

        // Controls hint
        ctx.font = '14px Courier New';
        ctx.fillStyle = '#666666';
        ctx.textAlign = 'center';
        ctx.fillText('\u2191\u2193 Navigate  |  \u2190\u2192 Adjust  |  ENTER Select  |  ESC Close', width / 2, panelY + panelHeight - 15);

        ctx.restore();
    }
}
