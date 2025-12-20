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
     * Get unlocked ships
     */
    getUnlockedShips() {
        return Object.values(this.ships).filter(s => s.unlocked);
    }

    /**
     * Get locked ships
     */
    getLockedShips() {
        return Object.values(this.ships).filter(s => !s.unlocked);
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
     * Get ship special ability handler
     */
    getSpecialAbility(shipId) {
        const ship = this.ships[shipId];
        if (!ship || !ship.special) return null;

        switch (ship.special) {
            case 'criticalHits':
                return {
                    name: 'Critical Hits',
                    onShoot: (bullet) => {
                        if (Math.random() < 0.1) {
                            bullet.damage *= 3;
                            bullet.color = '#ff0000';
                            bullet.size *= 1.5;
                            bullet.critical = true;
                        }
                    }
                };

            case 'autoShield':
                return {
                    name: 'Auto Shield',
                    onUpdate: (player, deltaTime) => {
                        if (!player.shieldActive && player.shieldCooldown <= 0) {
                            player.shield = 1;
                            player.shieldActive = true;
                            player.shieldCooldown = 300; // 5 seconds
                        }
                        if (player.shieldCooldown > 0) {
                            player.shieldCooldown -= deltaTime;
                        }
                    },
                    onInit: (player) => {
                        player.shieldCooldown = 0;
                    }
                };

            case 'dashAbility':
                return {
                    name: 'Dash',
                    onDoubleTap: (player, direction) => {
                        if (player.dashCooldown <= 0) {
                            player.x += direction.x * 100;
                            player.y += direction.y * 100;
                            player.invulnerable = true;
                            player.invulnerableTimer = 30;
                            player.dashCooldown = 120;
                        }
                    },
                    onUpdate: (player, deltaTime) => {
                        if (player.dashCooldown > 0) {
                            player.dashCooldown -= deltaTime;
                        }
                    },
                    onInit: (player) => {
                        player.dashCooldown = 0;
                    }
                };

            case 'phaseShift':
                return {
                    name: 'Phase Shift',
                    onUpdate: (player, deltaTime) => {
                        if (!player.phaseTimer) player.phaseTimer = 0;
                        player.phaseTimer += deltaTime;

                        if (player.phaseTimer >= 600) { // Every 10 seconds
                            player.invulnerable = true;
                            player.invulnerableTimer = 60;
                            player.phaseTimer = 0;
                        }
                    }
                };

            case 'rage':
                return {
                    name: 'Berserker Rage',
                    getDamageMultiplier: (player, gameState) => {
                        const livesLost = 4 - (gameState.lives || 0);
                        return 1 + (livesLost * 0.5); // +50% per life lost
                    }
                };

            case 'musicSync':
                return {
                    name: 'Music Sync',
                    onUpdate: (player, deltaTime) => {
                        const beat = Math.sin(Date.now() * 0.01);
                        player.speed = 5.5 + beat;
                        player.fireRate = 10 - Math.floor(beat * 2);
                    }
                };

            default:
                return null;
        }
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
     * Draw ship preview with unique design per ship type
     */
    drawShipPreview(ctx, shipId, color, unlocked) {
        const c = unlocked ? color : '#444444';
        const fill = unlocked ? color + '44' : '#22222244';

        switch (shipId) {
            case 'glassCannon':
                // Sharp angular design
                ctx.beginPath();
                ctx.moveTo(0, -20);
                ctx.lineTo(-8, -4);
                ctx.lineTo(-14, 14);
                ctx.lineTo(-4, 6);
                ctx.lineTo(0, 16);
                ctx.lineTo(4, 6);
                ctx.lineTo(14, 14);
                ctx.lineTo(8, -4);
                ctx.closePath();
                ctx.stroke();
                ctx.fillStyle = fill;
                ctx.fill();
                if (unlocked) {
                    ctx.fillStyle = '#ffff00';
                    ctx.beginPath();
                    ctx.arc(0, 0, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;

            case 'tank':
                // Hexagonal armored design
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(0, -18);
                ctx.lineTo(-14, -6);
                ctx.lineTo(-14, 10);
                ctx.lineTo(-8, 18);
                ctx.lineTo(8, 18);
                ctx.lineTo(14, 10);
                ctx.lineTo(14, -6);
                ctx.closePath();
                ctx.stroke();
                ctx.fillStyle = fill;
                ctx.fill();
                if (unlocked) {
                    ctx.strokeStyle = '#00ffff';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(0, 2, 5, 0, Math.PI * 2);
                    ctx.stroke();
                }
                break;

            case 'speedster':
                // Ultra-slim design
                ctx.beginPath();
                ctx.moveTo(0, -22);
                ctx.lineTo(-5, -8);
                ctx.lineTo(-8, 12);
                ctx.lineTo(-3, 6);
                ctx.lineTo(0, 14);
                ctx.lineTo(3, 6);
                ctx.lineTo(8, 12);
                ctx.lineTo(5, -8);
                ctx.closePath();
                ctx.stroke();
                ctx.fillStyle = fill;
                ctx.fill();
                if (unlocked) {
                    // Speed lines
                    ctx.globalAlpha = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(-6, 16);
                    ctx.lineTo(-6, 22);
                    ctx.moveTo(6, 16);
                    ctx.lineTo(6, 22);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
                break;

            case 'retroClassic':
                // Pixelated design
                const px = 3;
                ctx.fillStyle = unlocked ? color : '#444444';
                const pixels = [
                    [0, -5], [-1, -4], [0, -4], [1, -4],
                    [-1, -3], [0, -3], [1, -3],
                    [-2, -2], [-1, -2], [0, -2], [1, -2], [2, -2],
                    [-2, -1], [0, -1], [2, -1],
                    [-3, 0], [-2, 0], [0, 0], [2, 0], [3, 0],
                    [-3, 1], [0, 1], [3, 1],
                    [-3, 2], [3, 2]
                ];
                pixels.forEach(([px_x, px_y]) => {
                    ctx.fillRect(px_x * px - px/2, px_y * px - px/2, px, px);
                });
                break;

            case 'phantom':
                // Ghostly curved design
                ctx.globalAlpha = unlocked ? 0.3 : 0.1;
                ctx.beginPath();
                ctx.arc(0, 0, 20, 0, Math.PI * 2);
                ctx.fillStyle = fill;
                ctx.fill();
                ctx.globalAlpha = 1;
                ctx.beginPath();
                ctx.moveTo(0, -16);
                ctx.quadraticCurveTo(-16, 0, -10, 16);
                ctx.lineTo(0, 10);
                ctx.lineTo(10, 16);
                ctx.quadraticCurveTo(16, 0, 0, -16);
                ctx.stroke();
                ctx.fillStyle = fill;
                ctx.fill();
                break;

            case 'berserker':
                // Spiked aggressive design
                ctx.beginPath();
                ctx.moveTo(0, -18);
                ctx.lineTo(-6, -10);
                ctx.lineTo(-16, -6);
                ctx.lineTo(-10, 0);
                ctx.lineTo(-12, 14);
                ctx.lineTo(-5, 10);
                ctx.lineTo(0, 18);
                ctx.lineTo(5, 10);
                ctx.lineTo(12, 14);
                ctx.lineTo(10, 0);
                ctx.lineTo(16, -6);
                ctx.lineTo(6, -10);
                ctx.closePath();
                ctx.stroke();
                ctx.fillStyle = fill;
                ctx.fill();
                if (unlocked) {
                    ctx.fillStyle = '#ff0000';
                    ctx.beginPath();
                    ctx.arc(0, -4, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;

            case 'synth':
                // Flowing music design
                ctx.beginPath();
                ctx.moveTo(0, -16);
                ctx.bezierCurveTo(-12, -8, -12, 8, -10, 16);
                ctx.lineTo(0, 12);
                ctx.lineTo(10, 16);
                ctx.bezierCurveTo(12, 8, 12, -8, 0, -16);
                ctx.stroke();
                ctx.fillStyle = fill;
                ctx.fill();
                if (unlocked) {
                    // Sound wave bars
                    ctx.fillStyle = '#00ffff';
                    for (let i = -2; i <= 2; i++) {
                        const h = 3 + Math.abs(i) * 1.5;
                        ctx.fillRect(i * 3 - 1, 4 - h, 2, h);
                    }
                }
                break;

            case 'neonFalcon':
            default:
                // Classic arrow design
                ctx.beginPath();
                ctx.moveTo(0, -16);
                ctx.lineTo(-12, 16);
                ctx.lineTo(0, 8);
                ctx.lineTo(12, 16);
                ctx.closePath();
                ctx.stroke();
                ctx.fillStyle = fill;
                ctx.fill();
                // Wing accents
                if (unlocked) {
                    ctx.beginPath();
                    ctx.moveTo(-6, 4);
                    ctx.lineTo(-9, 12);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(6, 4);
                    ctx.lineTo(9, 12);
                    ctx.stroke();
                }
                break;
        }
    }
}
