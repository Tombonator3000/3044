// ============================================
// GEOMETRY 3044 — CONFIGURATION
// ============================================

export const config = {
    // Debug settings
    debug: {
        enabled: false,          // Master debug flag - set to true for development
        logGameEvents: false,    // Log game events (waves, spawns, etc.)
        logAudio: false,         // Log audio events
        logInput: false,         // Log input events
        logPerformance: false,   // Log performance metrics
        showFPS: false           // Show FPS counter
    },

    width: 900,
    height: 900,

    // Screen configuration (updated dynamically)
    screen: {
        width: 900,
        height: 900
    },

    // Colors
    colors: {
        player: '#00ff00',
        enemy: '#ff0066',
        bullet: '#00ffff',
        particle: '#ffff00',
        playerBullet: '#00ffff',
        enemyBullet: '#ff0066',
        score: '#00ffff',
        wave: '#ff00ff',
        lives: '#00ff00',
        bombs: '#ffff00'
    },

    // Game settings
    game: {
        credits: 3,
        continueTime: 10,
        initialLives: 3,
        initialBombs: 3,
        maxLives: 9,
        maxBombs: 9,
        newLifeScoreThreshold: 100000,
        comboTimeout: 180
    },

    // Audio configuration
    audio: {
        musicVolume: 0.5,
        sfxVolume: 0.7,
        masterVolume: 1.0
    },

    // Player settings
    player: {
        size: 20,
        speed: 5.5,
        invulnerableTime: 180
    },

    // Bullet settings
    bullets: {
        offScreenMargin: 50,
        shadowBlur: 5,  // Reduced from 10 for better performance
        playerRadius: 5,
        enemyRadius: 6,
        playerInnerRadius: 2,
        enemyInnerRadius: 3
    },

    // Rendering performance settings
    rendering: {
        shadowsEnabled: true,           // Can be disabled for mobile/low-end devices
        maxShadowBlur: 15,              // Cap shadow blur values (reduced from 30-50)
        reducedEffectsMode: false,      // Enable for low-end devices
        particleQuality: 1.0            // 0.5 = half particles, 1.0 = full
    },

    // Particle settings
    particles: {
        maxCount: 1000
    },

    // Screen shake presets
    screenShake: {
        light: { intensity: 3, duration: 10 },
        medium: { intensity: 8, duration: 20 },
        heavy: { intensity: 15, duration: 30 },
        massive: { intensity: 25, duration: 45 }
    },

    // Timing
    timing: {
        themeChangeDisplay: 180,
        fpsTarget: 60,
        frameTime: 16.67
    },

    // Common magic numbers extracted
    constants: {
        // Math constants (pre-calculated for performance)
        TWO_PI: Math.PI * 2,            // 6.283185...
        HALF_PI: Math.PI / 2,

        // Animation & effects
        defaultPulseSpeed: 0.005,
        defaultRotationSpeed: 0.02,
        defaultGlowIntensity: 20,

        // Physics
        defaultFriction: 0.97,
        defaultGravity: 0.1,
        defaultBounce: 0.3,

        // Spawn & lifetime
        defaultLifetime: 600,           // 10 seconds at 60fps
        powerUpLifetime: 600,
        warningThreshold: 120,          // Blink when < 2 seconds left

        // Damage & combat
        defaultDamage: 1,
        critMultiplier: 2,

        // UI
        defaultFontSize: 16,
        headerFontSize: 48,
        hudPadding: 20
    },

    // Power-up drop rates (in percentages)
    dropRates: {
        legendary: 0.003,   // 0.3%
        epic: 0.018,        // 1.5% cumulative
        rare: 0.098,        // 8% cumulative
        uncommon: 0.318,    // 22% cumulative
        common: 1.0         // Rest (~68%)
    },

    // Effect durations (in frames at 60fps)
    durations: {
        short: 300,         // 5 seconds
        medium: 480,        // 8 seconds
        long: 600,          // 10 seconds
        veryLong: 900       // 15 seconds
    },

    // Difficulty multipliers - drastically different per level
    difficulty: {
        easy: {
            name: 'EASY',
            // Player advantages
            lives: 5,                    // More lives
            bombs: 5,                    // More bombs
            playerSpeed: 1.1,            // Slightly faster player
            // Enemy nerfs
            enemyCount: 0.5,             // Half the enemies
            enemySpeed: 0.6,             // Much slower enemies
            enemyFireRate: 2.0,          // Enemies shoot half as often (higher = slower)
            enemyBulletSpeed: 0.5,       // Slower bullets
            enemyHP: 0.7,                // Less HP
            spawnDelay: 1.5,             // Slower spawning
            // Rewards
            scoreMultiplier: 0.5,        // Half score
            powerUpDropRate: 1.5,        // More power-ups
            // Wave progression
            waveScaling: 0.5             // Slower difficulty ramp
        },
        normal: {
            name: 'NORMAL',
            // Balanced settings
            lives: 3,
            bombs: 3,
            playerSpeed: 1.0,
            enemyCount: 1.0,
            enemySpeed: 1.0,
            enemyFireRate: 1.0,
            enemyBulletSpeed: 1.0,
            enemyHP: 1.0,
            spawnDelay: 1.0,
            scoreMultiplier: 1.0,
            powerUpDropRate: 1.0,
            waveScaling: 1.0
        },
        hard: {
            name: 'HARD',
            // Player disadvantages
            lives: 2,                    // Fewer lives
            bombs: 2,                    // Fewer bombs
            playerSpeed: 1.0,
            // Enemy buffs
            enemyCount: 1.5,             // 50% more enemies
            enemySpeed: 1.4,             // Faster enemies
            enemyFireRate: 0.7,          // Enemies shoot 43% faster
            enemyBulletSpeed: 1.3,       // Faster bullets
            enemyHP: 1.3,                // More HP
            spawnDelay: 0.7,             // Faster spawning
            // Rewards
            scoreMultiplier: 1.5,        // 50% more score
            powerUpDropRate: 0.8,        // Fewer power-ups
            waveScaling: 1.3             // Faster difficulty ramp
        },
        extreme: {
            name: 'EXTREME',
            // Brutal settings
            lives: 1,                    // One life only!
            bombs: 1,                    // One bomb only!
            playerSpeed: 0.9,            // Slightly slower player
            // Nightmare enemies
            enemyCount: 2.0,             // Double enemies
            enemySpeed: 1.8,             // Much faster enemies
            enemyFireRate: 0.5,          // Enemies shoot twice as fast
            enemyBulletSpeed: 1.6,       // Very fast bullets
            enemyHP: 1.5,                // More HP
            spawnDelay: 0.4,             // Rapid spawning
            // Rewards
            scoreMultiplier: 3.0,        // Triple score!
            powerUpDropRate: 0.5,        // Rare power-ups
            waveScaling: 1.8             // Aggressive difficulty ramp
        }
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
    config.screen.width = width;
    config.screen.height = height;
}

// Get difficulty settings for current difficulty level
export function getDifficultySettings(difficultyName = 'normal') {
    return config.difficulty[difficultyName] || config.difficulty.normal;
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
