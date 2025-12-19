// ============================================
// GEOMETRY 3044 — CONFIGURATION
// ============================================

export const config = {
    width: 800,
    height: 600,
    colors: {
        player: '#00ff00',
        enemy: '#ff0066',
        bullet: '#00ffff',
        particle: '#ffff00'
    },
    game: {
        credits: 3,
        continueTime: 10
    }
};

// 🎨 WAVE THEMES — 6 unike temaer som bytter per wave
export const waveThemes = {
    1: { 
        name: 'MIAMI VICE', 
        primary: '#ff0080', 
        secondary: '#00ffff', 
        accent: '#ff00ff',
        bgStart: '#1a0033',
        bgEnd: '#330066',
        gridHue: 300
    },
    2: { 
        name: 'TRON LEGACY', 
        primary: '#00ffff', 
        secondary: '#ff8000', 
        accent: '#0080ff',
        bgStart: '#000520',
        bgEnd: '#001040',
        gridHue: 180
    },
    3: { 
        name: 'OUTRUN', 
        primary: '#ff0066', 
        secondary: '#ffff00', 
        accent: '#ff3300',
        bgStart: '#1a0011',
        bgEnd: '#330022',
        gridHue: 330
    },
    4: { 
        name: 'BLADE RUNNER', 
        primary: '#0088ff', 
        secondary: '#ff0044', 
        accent: '#00ff88',
        bgStart: '#0a0a1a',
        bgEnd: '#1a1a3a',
        gridHue: 210
    },
    5: { 
        name: 'AKIRA', 
        primary: '#ff0000', 
        secondary: '#ffcc00', 
        accent: '#ff6600',
        bgStart: '#1a0500',
        bgEnd: '#3a1100',
        gridHue: 15
    },
    6: { 
        name: 'GHOST IN SHELL', 
        primary: '#00ff66', 
        secondary: '#00ccff', 
        accent: '#66ffcc',
        bgStart: '#001a0d',
        bgEnd: '#003320',
        gridHue: 150
    }
};

// Hent tema basert på wave nummer
export function getCurrentTheme(wave = 1) {
    const themeKey = ((wave - 1) % 6) + 1;
    return waveThemes[themeKey] || waveThemes[1];
}

// Update config dimensions
export function updateConfig(width, height) {
    config.width = width;
    config.height = height;
}

// ============================================
// LEGACY EXPORTS (for backwards compatibility)
// ============================================

// CONFIG with uppercase (alias for config)
export const CONFIG = config;

// legacyConfig for old files that use it
export const legacyConfig = {
    ...config,
    waveThemes: waveThemes,
    getCurrentTheme: getCurrentTheme
};
