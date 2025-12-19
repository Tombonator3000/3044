/**
 * Geometry 3044 - HUD Theme Definitions
 * 4 selectable themes for the HUD system
 */

export const HUD_THEMES = {
    // ═══════════════════════════════════════════════════════════
    // THEME 1: NEO-ARCADE (DEFAULT)
    // Modern hybrid with classic arcade feel
    // ═══════════════════════════════════════════════════════════
    neoArcade: {
        id: 'neoArcade',
        name: 'NEO-ARCADE',
        description: 'Modern hybrid with classic arcade feel',

        colors: {
            primary: '#00ffff',
            secondary: '#ff00ff',
            accent: '#ffff00',
            warning: '#ff0000',
            success: '#00ff00',

            score: '#00ffff',
            lives: '#ff0066',
            wave: '#ffff00',
            bombs: '#ff8800',
            combo: '#ff00ff',

            panelBg: 'rgba(0, 0, 0, 0.5)',
            panelBorder: 'rgba(0, 255, 255, 0.6)',
            panelGlow: '#00ffff'
        },

        fonts: {
            primary: 'Courier New',
            score: 'Courier New',
            title: 'Courier New'
        },

        layout: {
            // Score - Top Left
            score: {
                x: 20, y: 20,
                width: 200, height: 70,
                fontSize: 28,
                labelSize: 12,
                showProgress: true,
                showPopups: true
            },

            // Lives - Below Score
            lives: {
                x: 20, y: 95,
                iconSize: 20,
                spacing: 25,
                maxDisplay: 5,
                style: 'ships'  // 'ships', 'hearts', 'dots'
            },

            // Wave - Top Right
            wave: {
                x: -160, y: 20,  // Negative = from right
                width: 140, height: 70,
                fontSize: 32,
                showThemeName: true
            },

            // Bombs - Below Wave
            bombs: {
                x: -160, y: 95,
                iconSize: 24,
                spacing: 30,
                maxDisplay: 5,
                style: 'bombs'  // 'bombs', 'icons', 'bar'
            },

            // Boss HP - Top Center (only during boss)
            bossHealth: {
                x: 'center', y: 30,
                width: 400, height: 25,
                showName: true,
                showPercent: true
            },

            // Combo - Bottom Center
            combo: {
                x: 'center', y: -80,
                width: 500, height: 40,
                showMultiplier: true,
                rainbowWhenHigh: true,
                highThreshold: 10
            },

            // Power-ups - Left Side
            powerUps: {
                x: 20, y: 150,
                slotSize: 50,
                spacing: 60,
                maxSlots: 4,
                showCooldown: true,
                showName: true
            },

            // High Score - Bottom Center
            highScore: {
                x: 'center', y: -30,
                fontSize: 16,
                style: 'boxed'  // 'boxed', 'minimal', 'hidden'
            }
        },

        effects: {
            scanlines: false,
            flicker: true,
            flickerIntensity: 0.03,
            glow: true,
            glowIntensity: 15,
            panelStyle: 'rounded',  // 'rounded', 'angular', 'none'
            animations: true
        }
    },

    // ═══════════════════════════════════════════════════════════
    // THEME 2: HOLOGRAPHIC COCKPIT
    // Sci-fi cockpit with holographic panels
    // ═══════════════════════════════════════════════════════════
    holographicCockpit: {
        id: 'holographicCockpit',
        name: 'HOLOGRAPHIC COCKPIT',
        description: 'Sci-fi cockpit with holographic panels',

        colors: {
            primary: '#00ffaa',
            secondary: '#00aaff',
            accent: '#ffffff',
            warning: '#ff4444',
            success: '#44ff44',

            score: '#00ffaa',
            lives: '#00ffaa',
            wave: '#00aaff',
            bombs: '#ffaa00',
            combo: '#00ffff',

            panelBg: 'rgba(0, 40, 40, 0.7)',
            panelBorder: 'rgba(0, 255, 170, 0.8)',
            panelGlow: '#00ffaa'
        },

        fonts: {
            primary: 'Courier New',
            score: 'Courier New',
            title: 'Courier New'
        },

        layout: {
            score: {
                x: 20, y: 20,
                width: 180, height: 90,
                fontSize: 24,
                labelSize: 10,
                showProgress: true,
                showPopups: true,
                panelStyle: 'hexagonal'
            },

            lives: {
                x: 20, y: 115,
                iconSize: 18,
                spacing: 22,
                maxDisplay: 5,
                style: 'hearts',
                insidePanel: true
            },

            wave: {
                x: -180, y: 20,
                width: 160, height: 90,
                fontSize: 28,
                showThemeName: true,
                panelStyle: 'hexagonal'
            },

            bombs: {
                x: -180, y: 115,
                iconSize: 22,
                spacing: 28,
                maxDisplay: 5,
                style: 'icons',
                insidePanel: true
            },

            bossHealth: {
                x: 'center', y: 25,
                width: 350, height: 30,
                showName: true,
                showPercent: true,
                style: 'segmented'
            },

            combo: {
                x: 'center', y: -90,
                width: 450, height: 50,
                showMultiplier: true,
                rainbowWhenHigh: true,
                highThreshold: 8,
                style: 'holographic'
            },

            powerUps: {
                x: 20, y: 170,
                slotSize: 45,
                spacing: 55,
                maxSlots: 4,
                showCooldown: true,
                showName: true,
                style: 'circular'
            },

            highScore: {
                x: 'center', y: -35,
                fontSize: 14,
                style: 'minimal'
            }
        },

        effects: {
            scanlines: true,
            scanlineSpacing: 3,
            scanlineAlpha: 0.05,
            flicker: true,
            flickerIntensity: 0.05,
            glow: true,
            glowIntensity: 20,
            panelStyle: 'hexagonal',
            holographicWobble: true,
            animations: true
        },

        // Special elements for this theme
        special: {
            cornerBrackets: true,
            targetingReticle: true,
            radarMinimap: false
        }
    },

    // ═══════════════════════════════════════════════════════════
    // THEME 3: MINIMALIST NEON
    // Clean design with neon accents
    // ═══════════════════════════════════════════════════════════
    minimalistNeon: {
        id: 'minimalistNeon',
        name: 'MINIMALIST NEON',
        description: 'Clean design with neon accents',

        colors: {
            primary: '#ffffff',
            secondary: '#ff00ff',
            accent: '#00ffff',
            warning: '#ff0000',
            success: '#00ff00',

            score: '#ffffff',
            lives: '#ff0066',
            wave: '#ffffff',
            bombs: '#ffaa00',
            combo: '#ff00ff',

            panelBg: 'transparent',
            panelBorder: 'rgba(255, 255, 255, 0.2)',
            panelGlow: '#ffffff'
        },

        fonts: {
            primary: 'Courier New',
            score: 'Courier New',
            title: 'Courier New'
        },

        layout: {
            score: {
                x: 30, y: 25,
                width: 150, height: 50,
                fontSize: 32,
                labelSize: 10,
                showProgress: true,
                progressBelow: true,
                showPopups: false
            },

            lives: {
                x: 30, y: 75,
                iconSize: 12,
                spacing: 18,
                maxDisplay: 5,
                style: 'dots'
            },

            wave: {
                x: -120, y: 25,
                width: 100, height: 50,
                fontSize: 36,
                showThemeName: false
            },

            bombs: {
                x: -120, y: 75,
                iconSize: 12,
                spacing: 18,
                maxDisplay: 5,
                style: 'dots'
            },

            bossHealth: {
                x: 'center', y: 20,
                width: 500, height: 8,
                showName: true,
                showPercent: false,
                style: 'thin'
            },

            combo: {
                x: 'center', y: -60,
                width: 600, height: 20,
                showMultiplier: true,
                rainbowWhenHigh: false,
                style: 'line'
            },

            powerUps: {
                x: 30, y: 110,
                slotSize: 30,
                spacing: 40,
                maxSlots: 4,
                showCooldown: true,
                showName: false,
                style: 'minimal'
            },

            highScore: {
                x: 'center', y: -25,
                fontSize: 12,
                style: 'minimal'
            }
        },

        effects: {
            scanlines: false,
            flicker: false,
            glow: true,
            glowIntensity: 8,
            panelStyle: 'none',
            animations: true,
            minimalistBars: true
        }
    },

    // ═══════════════════════════════════════════════════════════
    // THEME 4: RETRO CRT
    // Classic CRT monitor aesthetic
    // ═══════════════════════════════════════════════════════════
    retroCRT: {
        id: 'retroCRT',
        name: 'RETRO CRT',
        description: 'Classic CRT monitor aesthetic',

        colors: {
            primary: '#33ff33',
            secondary: '#33ff33',
            accent: '#66ff66',
            warning: '#ff3333',
            success: '#33ff33',

            score: '#33ff33',
            lives: '#33ff33',
            wave: '#33ff33',
            bombs: '#33ff33',
            combo: '#33ff33',

            panelBg: 'rgba(0, 20, 0, 0.8)',
            panelBorder: 'rgba(51, 255, 51, 0.6)',
            panelGlow: '#33ff33'
        },

        fonts: {
            primary: 'Courier New',
            score: 'Courier New',
            title: 'Courier New'
        },

        layout: {
            score: {
                x: 15, y: 15,
                width: 220, height: 35,
                fontSize: 20,
                labelSize: 12,
                showProgress: false,
                showPopups: true,
                style: 'terminal'
            },

            lives: {
                x: 15, y: 52,
                iconSize: 14,
                spacing: 18,
                maxDisplay: 5,
                style: 'dots',
                prefix: 'LIVES:'
            },

            wave: {
                x: -200, y: 15,
                width: 180, height: 35,
                fontSize: 20,
                showThemeName: false,
                prefix: 'WAVE-'
            },

            bombs: {
                x: -200, y: 52,
                iconSize: 14,
                spacing: 18,
                maxDisplay: 5,
                style: 'dots',
                prefix: 'BOMB:'
            },

            bossHealth: {
                x: 'center', y: 15,
                width: 300, height: 20,
                showName: true,
                showPercent: true,
                style: 'ascii'
            },

            combo: {
                x: 'center', y: -70,
                width: 400, height: 30,
                showMultiplier: true,
                rainbowWhenHigh: false,
                style: 'ascii'
            },

            powerUps: {
                x: 15, y: 85,
                slotSize: 35,
                spacing: 45,
                maxSlots: 4,
                showCooldown: true,
                showName: true,
                style: 'brackets'
            },

            highScore: {
                x: 'center', y: 15,
                fontSize: 20,
                style: 'terminal',
                prefix: 'HI-'
            },

            // Special top bar for CRT
            topBar: {
                enabled: true,
                height: 40,
                showTitle: true,
                title: 'GEOMETRY 3044'
            }
        },

        effects: {
            scanlines: true,
            scanlineSpacing: 2,
            scanlineAlpha: 0.1,
            flicker: true,
            flickerIntensity: 0.08,
            glow: true,
            glowIntensity: 10,
            panelStyle: 'terminal',
            chromaticAberration: true,
            phosphorGlow: true,
            curvedScreen: true,
            animations: true
        },

        special: {
            asciiArt: true,
            blinkingCursor: true,
            bootSequence: true  // Shows "boot" animation at game start
        }
    }
};

// Default theme
export const DEFAULT_THEME = 'neoArcade';

// Get theme by ID
export function getTheme(themeId) {
    return HUD_THEMES[themeId] || HUD_THEMES[DEFAULT_THEME];
}

// List all themes for options menu
export function getAllThemes() {
    return Object.values(HUD_THEMES).map(theme => ({
        id: theme.id,
        name: theme.name,
        description: theme.description
    }));
}
