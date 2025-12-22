/**
 * Geometry 3044 - Ship Manager
 * Unlockable ships with unique abilities and stats
 */

export const SHIPS = {
    neonFalcon: {
        id: 'neonFalcon',
        name: 'NEON FALCON',
        description: 'Balanced ship for all situations',
        color: '#00ff00',
        stats: {
            speed: 5.5,
            fireRate: 10,
            damage: 1.0,
            size: 20,
            lives: 3
        },
        special: null,
        unlockCondition: null, // Default ship
        unlocked: true
    },

    glassCannon: {
        id: 'glassCannon',
        name: 'GLASS CANNON',
        description: '2x damage but only 1 life',
        color: '#ff0000',
        stats: {
            speed: 6.0,
            fireRate: 8,
            damage: 2.0,
            size: 18,
            lives: 1
        },
        special: 'criticalHits', // 10% chance for 3x damage
        unlockCondition: { type: 'wave', value: 10 },
        unlocked: false
    },

    tank: {
        id: 'tank',
        name: 'HEAVY TANK',
        description: 'Slow but durable with auto-shield',
        color: '#0088ff',
        stats: {
            speed: 3.5,
            fireRate: 14,
            damage: 1.2,
            size: 28,
            lives: 5
        },
        special: 'autoShield', // Regenerating shield
        unlockCondition: { type: 'score', value: 500000 },
        unlocked: false
    },

    speedster: {
        id: 'speedster',
        name: 'SPEEDSTER',
        description: 'Lightning fast with tiny hitbox',
        color: '#ffff00',
        stats: {
            speed: 8.0,
            fireRate: 12,
            damage: 0.8,
            size: 12,
            lives: 2
        },
        special: 'dashAbility', // Double-tap to dash
        unlockCondition: { type: 'wave', value: 20 },
        unlocked: false
    },

    retroClassic: {
        id: 'retroClassic',
        name: 'RETRO CLASSIC',
        description: 'Pixelated look with classic shooting',
        color: '#00ffff',
        stats: {
            speed: 5.0,
            fireRate: 10,
            damage: 1.0,
            size: 20,
            lives: 3
        },
        special: 'retroBullets', // Classic spread pattern
        unlockCondition: { type: 'games', value: 50 },
        unlocked: false
    },

    phantom: {
        id: 'phantom',
        name: 'PHANTOM',
        description: 'Phase through enemies briefly',
        color: '#aa00ff',
        stats: {
            speed: 5.5,
            fireRate: 11,
            damage: 0.9,
            size: 18,
            lives: 2
        },
        special: 'phaseShift', // Brief invulnerability every 10 seconds
        unlockCondition: { type: 'grazes', value: 1000 },
        unlocked: false
    },

    berserker: {
        id: 'berserker',
        name: 'BERSERKER',
        description: 'Damage increases as health drops',
        color: '#ff6600',
        stats: {
            speed: 5.0,
            fireRate: 9,
            damage: 1.0,
            size: 22,
            lives: 4
        },
        special: 'rage', // +50% damage per lost life
        unlockCondition: { type: 'pointBlankKills', value: 100 },
        unlocked: false
    },

    synth: {
        id: 'synth',
        name: 'SYNTHWAVE',
        description: 'Music affects your power',
        color: '#ff00ff',
        stats: {
            speed: 5.5,
            fireRate: 10,
            damage: 1.0,
            size: 20,
            lives: 3
        },
        special: 'musicSync', // Stats pulse with music
        unlockCondition: { type: 'bossKills', value: 20 },
        unlocked: false
    }
};

export class ShipManager {
    constructor() {
        this.ships = { ...SHIPS };
        this.currentShip = 'neonFalcon';
        this.loadProgress();
    }

    /**
     * Load unlock progress from localStorage
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem('geometry3044_ships');
            if (saved) {
                const data = JSON.parse(saved);
                for (const shipId in data) {
                    if (this.ships[shipId]) {
                        this.ships[shipId].unlocked = data[shipId].unlocked;
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to load ship progress:', e);
        }
    }

    /**
     * Save unlock progress
     */
    saveProgress() {
        try {
            const data = {};
            for (const shipId in this.ships) {
                data[shipId] = { unlocked: this.ships[shipId].unlocked };
            }
            localStorage.setItem('geometry3044_ships', JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save ship progress:', e);
        }
    }

    /**
     * Check and unlock ships based on player stats
     * @param {Object} stats - Player statistics
     * @returns {Array} Newly unlocked ships
     */
    checkUnlocks(stats) {
        const newUnlocks = [];

        for (const shipId in this.ships) {
            const ship = this.ships[shipId];
            if (ship.unlocked || !ship.unlockCondition) continue;

            const condition = ship.unlockCondition;
            let unlocked = false;

            switch (condition.type) {
                case 'wave':
                    unlocked = (stats.maxWave || 0) >= condition.value;
                    break;
                case 'score':
                    unlocked = (stats.highScore || 0) >= condition.value;
                    break;
                case 'games':
                    unlocked = (stats.gamesPlayed || 0) >= condition.value;
                    break;
                case 'grazes':
                    unlocked = (stats.totalGrazes || 0) >= condition.value;
                    break;
                case 'pointBlankKills':
                    unlocked = (stats.pointBlankKills || 0) >= condition.value;
                    break;
                case 'bossKills':
                    unlocked = (stats.bossKills || 0) >= condition.value;
                    break;
            }

            if (unlocked) {
                ship.unlocked = true;
                newUnlocks.push(ship);
                console.log(`🚀 Ship unlocked: ${ship.name}`);
            }
        }

        if (newUnlocks.length > 0) {
            this.saveProgress();
        }

        return newUnlocks;
    }

    /**
     * Select a ship
     * @param {string} shipId - Ship ID to select
     * @returns {boolean} Whether selection was successful
     */
    selectShip(shipId) {
        const ship = this.ships[shipId];
        if (!ship || !ship.unlocked) return false;

        this.currentShip = shipId;
        try {
            localStorage.setItem('geometry3044_selectedShip', shipId);
        } catch (e) {}

        return true;
    }

    /**
     * Get currently selected ship
     */
    getCurrentShip() {
        return this.ships[this.currentShip] || this.ships.neonFalcon;
    }

    /**
     * Get all ships
     */
    getAllShips() {
        return Object.values(this.ships);
    }

    /**
     * Apply ship stats to player
     * @param {Object} player - Player object
     */
    applyShipStats(player) {
        const ship = this.getCurrentShip();

        player.speed = ship.stats.speed;
        player.fireRate = ship.stats.fireRate;
        player.damageMultiplier = ship.stats.damage;
        player.size = ship.stats.size;
        player.shipColor = ship.color;
        player.shipSpecial = ship.special;
        player.shipId = ship.id;

        // Return initial lives for game state
        return ship.stats.lives;
    }

    /**
     * Draw ship selection menu
     */
    drawShipSelect(ctx, canvas, selectedIndex) {
        const ships = this.getAllShips();
        const startX = 100;
        const startY = 150;
        const shipWidth = 150;
        const shipHeight = 200;
        const spacing = 20;

        ctx.save();

        // Title
        ctx.font = 'bold 36px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00ffff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        ctx.fillText('SELECT YOUR SHIP', canvas.logicalWidth / 2, 80);

        // Draw each ship
        ships.forEach((ship, index) => {
            const x = startX + (index % 4) * (shipWidth + spacing);
            const y = startY + Math.floor(index / 4) * (shipHeight + spacing);
            const isSelected = index === selectedIndex;

            // Background
            ctx.fillStyle = isSelected ? '#333366' : '#1a1a2e';
            ctx.strokeStyle = ship.unlocked ? ship.color : '#666666';
            ctx.lineWidth = isSelected ? 3 : 1;
            ctx.shadowBlur = isSelected ? 15 : 5;
            ctx.shadowColor = ship.unlocked ? ship.color : '#333333';

            ctx.fillRect(x, y, shipWidth, shipHeight);
            ctx.strokeRect(x, y, shipWidth, shipHeight);

            // Ship name
            ctx.font = 'bold 14px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = ship.unlocked ? ship.color : '#666666';
            ctx.shadowBlur = ship.unlocked ? 10 : 0;
            ctx.fillText(ship.name, x + shipWidth / 2, y + 25);

            // Ship preview - unique design per ship type
            ctx.save();
            ctx.translate(x + shipWidth / 2, y + 80);

            if (ship.unlocked) {
                ctx.strokeStyle = ship.color;
                ctx.fillStyle = ship.color + '44';
                ctx.shadowBlur = 15;
                ctx.shadowColor = ship.color;
            } else {
                ctx.strokeStyle = '#444444';
                ctx.fillStyle = '#22222244';
            }

            ctx.lineWidth = 2;
            this.drawShipPreview(ctx, ship.id, ship.color, ship.unlocked);
            ctx.restore();

            // Stats bars
            if (ship.unlocked) {
                const statsY = y + 120;
                this.drawStatBar(ctx, x + 10, statsY, 'SPD', ship.stats.speed / 10, ship.color);
                this.drawStatBar(ctx, x + 10, statsY + 15, 'DMG', ship.stats.damage / 2, ship.color);
                this.drawStatBar(ctx, x + 10, statsY + 30, 'HP', ship.stats.lives / 5, ship.color);
            } else {
                // Locked text
                ctx.font = '12px "Courier New", monospace';
                ctx.fillStyle = '#666666';
                ctx.fillText('LOCKED', x + shipWidth / 2, y + 130);

                // Unlock condition
                ctx.font = '10px "Courier New", monospace';
                const condition = ship.unlockCondition;
                let conditionText = '';
                switch (condition.type) {
                    case 'wave': conditionText = `Reach Wave ${condition.value}`; break;
                    case 'score': conditionText = `Score ${condition.value.toLocaleString()}`; break;
                    case 'games': conditionText = `Play ${condition.value} games`; break;
                    case 'grazes': conditionText = `${condition.value} grazes`; break;
                    case 'pointBlankKills': conditionText = `${condition.value} point blank kills`; break;
                    case 'bossKills': conditionText = `${condition.value} boss kills`; break;
                }
                ctx.fillText(conditionText, x + shipWidth / 2, y + 145);
            }

            // Description
            if (ship.unlocked) {
                ctx.font = '10px "Courier New", monospace';
                ctx.fillStyle = '#aaaaaa';
                ctx.fillText(ship.description, x + shipWidth / 2, y + shipHeight - 15);
            }
        });

        ctx.restore();
    }

    /**
     * Draw a stat bar
     */
    drawStatBar(ctx, x, y, label, value, color) {
        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#888888';
        ctx.fillText(label, x, y + 8);

        const barX = x + 30;
        const barWidth = 100;
        const barHeight = 8;

        ctx.fillStyle = '#333333';
        ctx.fillRect(barX, y, barWidth, barHeight);

        ctx.fillStyle = color;
        ctx.fillRect(barX, y, barWidth * Math.min(1, value), barHeight);
    }

    /**
     * Draw ship preview with unique 8-bit pixel art design per ship type
     */
    drawShipPreview(ctx, shipId, color, unlocked) {
        const c = unlocked ? color : '#444444';
        const p = 3; // Pixel size for 8-bit style

        ctx.shadowBlur = unlocked ? 10 : 0;
        ctx.shadowColor = c;

        // Helper function to draw pixel patterns
        const drawPixelPattern = (pattern, mainColor, accentColor, accentCondition) => {
            const offsetX = -pattern[0].length * p / 2;
            const offsetY = -pattern.length * p / 2;

            pattern.forEach((row, y) => {
                row.forEach((pixel, x) => {
                    if (pixel) {
                        if (accentCondition && accentCondition(x, y)) {
                            ctx.fillStyle = unlocked ? accentColor : '#666666';
                        } else {
                            ctx.fillStyle = unlocked ? mainColor : '#444444';
                        }
                        ctx.fillRect(offsetX + x * p, offsetY + y * p, p - 1, p - 1);
                    }
                });
            });
        };

        switch (shipId) {
            case 'glassCannon': {
                const cannon = [
                    [0,0,0,0,0,1,0,0,0,0,0],
                    [0,0,0,0,1,1,1,0,0,0,0],
                    [0,0,0,1,0,1,0,1,0,0,0],
                    [0,0,1,0,1,1,1,0,1,0,0],
                    [0,1,0,0,1,1,1,0,0,1,0],
                    [1,0,0,1,1,1,1,1,0,0,1],
                    [0,0,1,1,1,1,1,1,1,0,0],
                    [0,1,1,0,1,1,1,0,1,1,0],
                    [1,1,0,0,0,1,0,0,0,1,1],
                    [1,0,0,0,0,0,0,0,0,0,1],
                ];
                drawPixelPattern(cannon, c, '#ffff00', (x, y) => y >= 4 && y <= 6 && x >= 4 && x <= 6);
                break;
            }

            case 'tank': {
                const tank = [
                    [0,0,0,0,0,1,1,0,0,0,0,0],
                    [0,0,0,0,1,1,1,1,0,0,0,0],
                    [0,0,1,1,1,1,1,1,1,1,0,0],
                    [0,1,1,1,1,1,1,1,1,1,1,0],
                    [1,1,1,1,1,1,1,1,1,1,1,1],
                    [1,1,1,0,1,1,1,1,0,1,1,1],
                    [1,1,1,0,1,1,1,1,0,1,1,1],
                    [1,1,1,1,1,1,1,1,1,1,1,1],
                    [0,1,1,1,1,1,1,1,1,1,1,0],
                    [0,0,1,1,0,0,0,0,1,1,0,0],
                ];
                drawPixelPattern(tank, c, '#00ffff', (x, y) => y >= 4 && y <= 7 && x >= 4 && x <= 7);
                break;
            }

            case 'speedster': {
                const speedster = [
                    [0,0,0,0,1,0,0,0,0],
                    [0,0,0,1,1,1,0,0,0],
                    [0,0,0,1,1,1,0,0,0],
                    [0,0,0,1,1,1,0,0,0],
                    [0,0,1,1,1,1,1,0,0],
                    [0,0,1,1,1,1,1,0,0],
                    [0,1,0,1,1,1,0,1,0],
                    [1,0,0,1,1,1,0,0,1],
                    [1,0,0,0,1,0,0,0,1],
                    [0,0,0,0,1,0,0,0,0],
                    [0,0,0,0,1,0,0,0,0],
                ];
                drawPixelPattern(speedster, c, '#ffff00', (x, y) => y <= 2 && x === 4);
                break;
            }

            case 'retroClassic': {
                const retro = [
                    [0,0,0,0,0,1,0,0,0,0,0],
                    [0,0,0,0,1,1,1,0,0,0,0],
                    [0,0,0,1,1,1,1,1,0,0,0],
                    [0,0,1,1,1,1,1,1,1,0,0],
                    [0,1,1,1,1,1,1,1,1,1,0],
                    [1,1,1,1,1,1,1,1,1,1,1],
                    [1,1,0,1,1,1,1,1,0,1,1],
                    [1,0,0,0,1,1,1,0,0,0,1],
                    [1,0,0,0,0,1,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,1],
                ];
                drawPixelPattern(retro, c, '#ffffff', (x, y) => (x + y) % 3 === 0 && y < 5);
                break;
            }

            case 'phantom': {
                const phantom = [
                    [0,0,0,1,1,1,1,0,0,0],
                    [0,0,1,1,1,1,1,1,0,0],
                    [0,1,1,1,1,1,1,1,1,0],
                    [1,1,0,0,1,1,0,0,1,1],
                    [1,1,0,0,1,1,0,0,1,1],
                    [1,1,1,1,1,1,1,1,1,1],
                    [1,1,1,1,1,1,1,1,1,1],
                    [1,1,1,1,1,1,1,1,1,1],
                    [1,0,1,1,0,0,1,1,0,1],
                    [1,0,0,1,0,0,1,0,0,1],
                ];
                ctx.globalAlpha = unlocked ? 0.7 : 0.4;
                drawPixelPattern(phantom, c, '#ffffff', (x, y) => y >= 3 && y <= 4 && (x === 2 || x === 3 || x === 6 || x === 7));
                ctx.globalAlpha = 1;
                break;
            }

            case 'berserker': {
                const berserker = [
                    [0,0,0,0,0,1,0,0,0,0,0],
                    [0,0,0,0,1,1,1,0,0,0,0],
                    [1,0,0,1,1,1,1,1,0,0,1],
                    [1,1,0,1,1,1,1,1,0,1,1],
                    [0,1,1,1,1,1,1,1,1,1,0],
                    [0,0,1,1,1,1,1,1,1,0,0],
                    [0,1,1,0,1,1,1,0,1,1,0],
                    [1,1,0,0,1,1,1,0,0,1,1],
                    [1,0,0,0,0,1,0,0,0,0,1],
                    [1,0,0,0,0,0,0,0,0,0,1],
                    [0,0,0,0,0,1,0,0,0,0,0],
                ];
                drawPixelPattern(berserker, c, '#ff0000', (x, y) => y >= 3 && y <= 5 && x >= 4 && x <= 6);
                break;
            }

            case 'synth': {
                const synth = [
                    [0,0,0,1,1,1,1,0,0,0],
                    [0,0,1,1,1,1,1,1,0,0],
                    [0,1,1,1,1,1,1,1,1,0],
                    [0,1,1,1,1,1,1,1,1,0],
                    [1,1,0,1,1,1,1,0,1,1],
                    [1,0,0,1,1,1,1,0,0,1],
                    [1,0,0,0,1,1,0,0,0,1],
                    [1,1,0,0,1,1,0,0,1,1],
                    [0,1,1,0,1,1,0,1,1,0],
                    [0,0,1,1,0,0,1,1,0,0],
                ];
                const hue = (Date.now() * 0.1) % 360;
                const offsetX = -synth[0].length * p / 2;
                const offsetY = -synth.length * p / 2;
                synth.forEach((row, y) => {
                    row.forEach((pixel, x) => {
                        if (pixel) {
                            if (unlocked && y < 4) {
                                ctx.fillStyle = `hsl(${(hue + y * 30) % 360}, 100%, 60%)`;
                            } else {
                                ctx.fillStyle = unlocked ? c : '#444444';
                            }
                            ctx.fillRect(offsetX + x * p, offsetY + y * p, p - 1, p - 1);
                        }
                    });
                });
                break;
            }

            case 'neonFalcon':
            default: {
                const falcon = [
                    [0,0,0,0,0,1,0,0,0,0,0],
                    [0,0,0,0,1,1,1,0,0,0,0],
                    [0,0,0,0,1,1,1,0,0,0,0],
                    [0,0,0,1,1,1,1,1,0,0,0],
                    [0,0,1,1,1,1,1,1,1,0,0],
                    [0,1,1,1,1,1,1,1,1,1,0],
                    [1,1,0,1,1,1,1,1,0,1,1],
                    [1,0,0,0,1,1,1,0,0,0,1],
                    [1,0,0,0,0,1,0,0,0,0,1],
                    [0,0,0,0,0,1,0,0,0,0,0],
                ];
                drawPixelPattern(falcon, c, '#ffffff', (x, y) => y < 4 && x >= 4 && x <= 6);
                break;
            }
        }
    }
}
