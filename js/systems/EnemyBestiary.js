// ============================================
// GEOMETRY 3044 - ENEMY BESTIARY SYSTEM
// ============================================
// Tracks discovered enemies and provides a gallery UI
// Enemies are "discovered" when first encountered
// Additional stats are tracked per enemy type
// ============================================

// Enemy data - All enemy types with their info
const ENEMY_DATA = {
    triangle: {
        name: 'TRIANGLE',
        displayName: 'Scout',
        description: 'Fast, aggressive scout. Charges directly at the player.',
        unlockWave: 1,
        color: '#ff3366',
        role: 'scout',
        behavior: 'Aggressive charge',
        threat: 1,
        stats: { hp: 1, speed: 'Fast', fireRate: 'Medium' }
    },
    square: {
        name: 'SQUARE',
        displayName: 'Heavy Guard',
        description: 'Slow but durable. Can generate a shield at higher waves.',
        unlockWave: 2,
        color: '#ff8800',
        role: 'heavy',
        behavior: 'Patrol pattern',
        threat: 2,
        stats: { hp: 3, speed: 'Slow', fireRate: 'Slow' }
    },
    pixelinvader: {
        name: 'PIXEL INVADER',
        displayName: 'Classic Invader',
        description: 'Moves in the classic Space Invader pattern. Nostalgic but deadly.',
        unlockWave: 3,
        color: '#00ff00',
        role: 'invader',
        behavior: 'Step movement',
        threat: 2,
        stats: { hp: 2, speed: 'Medium', fireRate: 'Medium' }
    },
    pentagon: {
        name: 'PENTAGON',
        displayName: 'Sniper',
        description: 'Stays at range and fires accurately. Predicts player movement.',
        unlockWave: 4,
        color: '#aa00ff',
        role: 'sniper',
        behavior: 'Long range',
        threat: 3,
        stats: { hp: 2, speed: 'Slow', fireRate: 'Fast' }
    },
    ghostbyte: {
        name: 'GHOST BYTE',
        displayName: 'Phantom',
        description: 'Ethereal enemy that phases in and out. Hard to track.',
        unlockWave: 5,
        color: '#88ffff',
        role: 'ghost',
        behavior: 'Floating phase',
        threat: 3,
        stats: { hp: 2, speed: 'Medium', fireRate: 'Medium' }
    },
    divebomber: {
        name: 'DIVEBOMBER',
        displayName: 'Kamikaze',
        description: 'Approaches slowly, then dives at high speed. No guns, pure aggression.',
        unlockWave: 6,
        color: '#ff0044',
        role: 'bomber',
        behavior: 'Dive attack',
        threat: 3,
        stats: { hp: 2, speed: 'Variable', fireRate: 'None' }
    },
    laserdisc: {
        name: 'LASER DISC',
        displayName: 'Spinner',
        description: 'Spinning disc that orbits and fires lasers. Unpredictable movement.',
        unlockWave: 7,
        color: '#ff6600',
        role: 'laser',
        behavior: 'Orbit pattern',
        threat: 3,
        stats: { hp: 2, speed: 'Fast', fireRate: 'Very Fast' }
    },
    sinewave: {
        name: 'SINEWAVE',
        displayName: 'Wave Rider',
        description: 'Elite enemy with smooth sine wave movement. Fires spread shots.',
        unlockWave: 8,
        color: '#00ffaa',
        role: 'elite',
        behavior: 'Sine wave',
        threat: 4,
        stats: { hp: 4, speed: 'Medium', fireRate: 'Fast' }
    },
    synthwave: {
        name: 'SYNTHWAVE',
        displayName: 'Neon Phantom',
        description: 'Pulsing neon enemy with trailing effects. Pure synthwave aesthetic.',
        unlockWave: 9,
        color: '#ff0080',
        role: 'synthwave',
        behavior: 'Pulse pattern',
        threat: 3,
        stats: { hp: 2, speed: 'Medium', fireRate: 'Fast' }
    },
    pixelskull: {
        name: 'PIXEL SKULL',
        displayName: 'Phase Skull',
        description: '8-bit skull that phases through dimensions. Glowing eyes track you.',
        unlockWave: 10,
        color: '#ff00ff',
        role: 'phase',
        behavior: 'Phase shift',
        threat: 4,
        stats: { hp: 3, speed: 'Medium', fireRate: 'Medium' }
    },
    vhstracker: {
        name: 'VHS TRACKER',
        displayName: 'Glitch Hunter',
        description: 'Tracks player with glitch teleports. RGB distortion effect.',
        unlockWave: 12,
        color: '#00ff00',
        role: 'tracker',
        behavior: 'Glitch teleport',
        threat: 4,
        stats: { hp: 3, speed: 'Very Fast', fireRate: 'Fast' }
    },
    arcadeboss: {
        name: 'ARCADE BOSS',
        displayName: 'Cabinet Master',
        description: 'Mini-boss shaped like an arcade cabinet. Spawns smaller enemies.',
        unlockWave: 15,
        color: '#ffff00',
        role: 'miniboss',
        behavior: 'Boss pattern',
        threat: 5,
        stats: { hp: 8, speed: 'Slow', fireRate: 'Medium' }
    }
};

// Get all enemy type keys
const ENEMY_TYPES = Object.keys(ENEMY_DATA);

export class EnemyBestiary {
    constructor() {
        this.storageKey = 'geometry3044_bestiary';
        this.data = this.load();
    }

    /**
     * Load bestiary data from localStorage
     */
    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load bestiary:', e);
        }

        // Return default empty data
        const defaultData = {};
        ENEMY_TYPES.forEach(type => {
            defaultData[type] = {
                discovered: false,
                kills: 0,
                firstEncounterWave: null,
                firstEncounterDate: null
            };
        });
        return defaultData;
    }

    /**
     * Save bestiary data to localStorage
     */
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (e) {
            console.warn('Failed to save bestiary:', e);
        }
    }

    /**
     * Record an enemy encounter (first discovery)
     * @param {string} enemyType - The type of enemy encountered
     * @param {number} wave - Current wave number
     */
    recordEncounter(enemyType, wave) {
        if (!ENEMY_DATA[enemyType]) return false;

        const entry = this.data[enemyType];
        if (!entry) {
            this.data[enemyType] = {
                discovered: false,
                kills: 0,
                firstEncounterWave: null,
                firstEncounterDate: null
            };
        }

        if (!this.data[enemyType].discovered) {
            this.data[enemyType].discovered = true;
            this.data[enemyType].firstEncounterWave = wave;
            this.data[enemyType].firstEncounterDate = new Date().toISOString();
            this.save();
            return true; // New discovery!
        }
        return false;
    }

    /**
     * Record an enemy kill
     * @param {string} enemyType - The type of enemy killed
     * @param {number} wave - Current wave number
     */
    recordKill(enemyType, wave) {
        if (!ENEMY_DATA[enemyType]) return;

        // Ensure discovered
        this.recordEncounter(enemyType, wave);

        // Increment kills
        if (!this.data[enemyType].kills) {
            this.data[enemyType].kills = 0;
        }
        this.data[enemyType].kills++;

        // Save periodically (every 10 kills to reduce localStorage writes)
        if (this.data[enemyType].kills % 10 === 0) {
            this.save();
        }
    }

    /**
     * Force save (call at end of game)
     */
    forceSave() {
        this.save();
    }

    /**
     * Check if an enemy type is discovered
     * @param {string} enemyType - The type of enemy
     */
    isDiscovered(enemyType) {
        return this.data[enemyType]?.discovered || false;
    }

    /**
     * Get kill count for an enemy type
     * @param {string} enemyType - The type of enemy
     */
    getKills(enemyType) {
        return this.data[enemyType]?.kills || 0;
    }

    /**
     * Get total discovered count
     */
    getDiscoveredCount() {
        return Object.values(this.data).filter(e => e.discovered).length;
    }

    /**
     * Get total enemy types
     */
    getTotalCount() {
        return ENEMY_TYPES.length;
    }

    /**
     * Get all enemy types with their data and discovery status
     */
    getAllEnemies() {
        return ENEMY_TYPES.map(type => ({
            type,
            ...ENEMY_DATA[type],
            discovered: this.isDiscovered(type),
            kills: this.getKills(type),
            firstEncounterWave: this.data[type]?.firstEncounterWave,
            firstEncounterDate: this.data[type]?.firstEncounterDate
        }));
    }

    /**
     * Get enemy info by type
     * @param {string} enemyType - The type of enemy
     */
    getEnemyInfo(enemyType) {
        if (!ENEMY_DATA[enemyType]) return null;
        return {
            type: enemyType,
            ...ENEMY_DATA[enemyType],
            discovered: this.isDiscovered(enemyType),
            kills: this.getKills(enemyType),
            firstEncounterWave: this.data[enemyType]?.firstEncounterWave
        };
    }

    /**
     * Reset all bestiary data (for testing)
     */
    reset() {
        const defaultData = {};
        ENEMY_TYPES.forEach(type => {
            defaultData[type] = {
                discovered: false,
                kills: 0,
                firstEncounterWave: null,
                firstEncounterDate: null
            };
        });
        this.data = defaultData;
        this.save();
    }
}

// Export enemy data for use in UI
export { ENEMY_DATA, ENEMY_TYPES };
