/**
 * Geometry 3044 - Configuration Module
 * All game constants and configuration values
 */

export const CONFIG = {
    // Screen dimensions
    screen: {
        width: 800,
        height: 600
    },

    // Player settings
    player: {
        speed: 5.5,
        size: 20,
        fireRate: 10,
        respawnDelay: 60,
        maxTrailLength: 10,
        startYOffset: 100,
        // Power-up defaults
        chainRange: 80,
        spreadCount: 3,
        pierceCount: 2,
        bounceCount: 3,
        quantumShots: 3,
        laserPower: 1,
        homingStrength: 1,
        novaPower: 1,
        vortexPower: 1
    },

    // Bullet settings
    bullets: {
        poolSize: 100,
        playerRadius: 4,
        enemyRadius: 3,
        playerInnerRadius: 2,
        enemyInnerRadius: 1.5,
        shadowBlur: 15,
        cleanupIntervalLow: 180,
        cleanupIntervalHigh: 90,
        offScreenMargin: 10,
        farOffScreenMargin: 120
    },

    // Particle settings
    particles: {
        maxCount: 80,
        minKeepCount: 5,
        keepRatio: 0.5
    },

    // Game rules
    game: {
        initialLives: 3,
        initialBombs: 3,
        maxLives: 7,
        maxBombs: 9,
        comboTimeout: 180,
        credits: 3,
        continueTime: 600,
        newLifeScoreThreshold: 50000 // Points needed for extra life
    },

    // Wave spawning
    waves: {
        enemiesPerWave: 10,
        maxEnemiesOnScreen: 16,
        baseMaxEnemies: 4,
        enemiesPerWaveIncrement: 0.5,
        spawnRates: {
            wave1_2: 150,
            wave3_4: 120,
            wave5_6: 90,
            wave7_10: 70,
            wave11plus: 50
        },
        formationTimer: 400,
        swarmTimer: 600,
        miniBossCooldown: 600,
        spawnProbability: {
            regular: 0.7,
            tactical: 0.3,
            formation: 0.3,
            swarm: 0.2
        },
        intensityMultiplier: 0.15
    },

    // Enemy settings
    enemies: {
        fireRates: {
            triangle: { base: 85, min: 35, decrease: 5 },
            square: { base: 70, min: 30, decrease: 4 },
            pentagon: { base: 130, min: 80, decrease: 6 },
            diamond: { base: 999 }, // Doesn't shoot
            hexagon: { base: 70, min: 35, decrease: 4 }
        }
    },

    // UFO types
    ufos: {
        scout: { points: 1000, size: 25, speed: 2.5, color: '#00ffff' },
        cruiser: { points: 2500, size: 30, speed: 2, color: '#ff6600' },
        mothership: { points: 5000, size: 40, speed: 1.5, color: '#ff00ff' }
    },

    // Boss settings
    boss: {
        baseFireRate: 60,
        fireRateDecreasePerWave: 1.5,
        minFireRate: 15
    },

    // Mini-boss settings
    miniBoss: {
        fireRate: 20
    },

    // Screen shake presets
    screenShake: {
        light: { intensity: 5, duration: 10 },
        medium: { intensity: 10, duration: 20 },
        heavy: { intensity: 15, duration: 30 },
        explosion: { intensity: 20, duration: 30 },
        bomb: { intensity: 25, duration: 40 }
    },

    // Audio settings
    audio: {
        musicVolume: 0.4,
        fallbackMusicVolume: 0.5,
        urls: {
            menuMusic: "https://archive.org/download/voyager-1-synthwave/Voyager1.mp3",
            gameMusic: "https://archive.org/download/neon-underworld-synthwave/NeonUnderworld.mp3",
            fallbackMenuMusic: "https://raw.githubusercontent.com/Tombonator3000/temp-mp3/main/Start%20Screen%20Arcade.mp3",
            fallbackGameMusic: "https://raw.githubusercontent.com/Tombonator3000/temp-mp3/main/Pixel%20Blitz.mp3"
        }
    },

    // Colors
    colors: {
        player: '#00ff00',
        playerBullet: '#00ff00',
        enemyBullet: '#ff0066',
        enemyTriangle: '#ff0066',
        enemySquare: '#0099ff',
        enemyPentagon: '#00ff66',
        boss: '#ff00ff',
        bullet: '#ffff00',
        grid: '#00ffff',
        particle: '#ffffff',
        // UI colors
        score: '#00ffff',
        lives: '#00ff00',
        bombs: '#ffff00',
        wave: '#ff00ff',
        health: '#ff0000'
    },

    // Visual effects
    effects: {
        starfield: {
            layers: 5,
            baseStarsPerLayer: 80,
            starsDecreasePerLayer: 12,
            mainNebulaeCount: 4,
            distantNebulaeCount: 6,
            warpStarsCount: 15
        },
        trail: {
            fadeRate: 0.1
        }
    },

    // Timing constants (in frames, 60fps)
    timing: {
        themeChangeDisplay: 120,
        attractModeDelay: 30000, // 30 seconds
        gameOverDelay: 500
    }
};

// Wave themes (kept separate for clarity)
export const WAVE_THEMES = {
    1: {
        name: "MIAMI VICE",
        primary: '#ff006e',
        secondary: '#00ffff',
        accent: '#8b00ff',
        bgStart: '#1a0033',
        bgEnd: '#330066',
        gridHue: 320,
        nebulaHue: 190
    },
    2: {
        name: "NEON NIGHTS",
        primary: '#00ff00',
        secondary: '#ff0080',
        accent: '#ffff00',
        bgStart: '#001a00',
        bgEnd: '#003300',
        gridHue: 120,
        nebulaHue: 300
    },
    3: {
        name: "LASER DREAMS",
        primary: '#ff4500',
        secondary: '#00bfff',
        accent: '#ff1493',
        bgStart: '#1a0800',
        bgEnd: '#330f00',
        gridHue: 20,
        nebulaHue: 200
    },
    4: {
        name: "CYBER PUNK",
        primary: '#ff00ff',
        secondary: '#00ff88',
        accent: '#ffff00',
        bgStart: '#200020',
        bgEnd: '#400040',
        gridHue: 300,
        nebulaHue: 150
    },
    5: {
        name: "RETRO WAVE",
        primary: '#ff6600',
        secondary: '#0066ff',
        accent: '#ff00cc',
        bgStart: '#1a0d00',
        bgEnd: '#331a00',
        gridHue: 30,
        nebulaHue: 240
    },
    6: {
        name: "ELECTRIC STORM",
        primary: '#ffff00',
        secondary: '#8000ff',
        accent: '#00ffff',
        bgStart: '#1a1a00',
        bgEnd: '#333300',
        gridHue: 60,
        nebulaHue: 270
    }
};

// Power-up types configuration
export const POWER_UP_TYPES = {
    health: { color: '#ff0000', symbol: '♥', rarity: 'common', description: 'Restore life' },
    spread: { color: '#ff6600', symbol: '◆', rarity: 'common', description: 'Spread shot' },
    laser: { color: '#00ff00', symbol: '║', rarity: 'uncommon', description: 'Laser beam' },
    homing: { color: '#ff00ff', symbol: '◎', rarity: 'uncommon', description: 'Homing missiles' },
    shield: { color: '#00ffff', symbol: '◯', rarity: 'rare', description: 'Shield' },
    bomb: { color: '#ffff00', symbol: '★', rarity: 'common', description: 'Extra bomb' },
    speed: { color: '#ff0080', symbol: '»', rarity: 'common', description: 'Speed boost' }
};

// Helper function to get current theme based on wave
export function getCurrentTheme(wave) {
    const themeKey = Math.min(wave || 1, 6);
    return WAVE_THEMES[themeKey] || WAVE_THEMES[1];
}

// Legacy config object for backwards compatibility during migration
export const legacyConfig = {
    width: CONFIG.screen.width,
    height: CONFIG.screen.height,
    colors: CONFIG.colors
};
