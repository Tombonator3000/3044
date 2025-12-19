/**
 * Geometry 3044 - CollisionSystem Module
 * Handles all collision detection between game entities
 */

import { CONFIG } from '../config.js';
import { PowerUp } from '../entities/PowerUp.js';

/**
 * CollisionSystem class - manages collision detection with spatial hashing
 */
export class CollisionSystem {
    constructor(options = {}) {
        // Spatial hashing for performance
        this.cellSize = 50;
        this.grid = new Map();
        // Support both old style (gameState directly) and new style (options object)
        if (options.gameState) {
            this.gameState = options.gameState;
            this.particleSystem = options.particleSystem || null;
            this.soundSystem = options.soundSystem || null;

            // Store callbacks from options
            this._onEnemyDestroyed = options.onEnemyDestroyed || null;
            this._onPlayerHit = options.onPlayerHit || null;
        } else {
            // Legacy: direct gameState parameter
            this.gameState = options;
            this.particleSystem = null;
            this.soundSystem = null;
            this._onEnemyDestroyed = null;
            this._onPlayerHit = null;
        }

        // Collision callbacks
        this.callbacks = {
            playerHitByBullet: null,
            playerHitByEnemy: null,
            enemyHitByBullet: null,
            bulletHitBullet: null,
            playerCollectPowerUp: null
        };

        // Set up default callbacks if provided in options
        if (this._onPlayerHit) {
            this.callbacks.playerHitByBullet = (player, bullet) => {
                this._onPlayerHit();
            };
            this.callbacks.playerHitByEnemy = (player, enemy, index) => {
                this._onPlayerHit();
            };
        }

        if (this._onEnemyDestroyed) {
            this.callbacks.enemyHitByBullet = (enemy, bullet, enemyIndex, bulletIndex) => {
                // Deal damage to enemy
                if (enemy.takeDamage) {
                    const killed = enemy.takeDamage(bullet.damage || 1);
                    if (killed) {
                        this._onEnemyDestroyed(enemy, bullet);
                        if (this.particleSystem && this.particleSystem.createExplosion) {
                            this.particleSystem.createExplosion(enemy.x, enemy.y, enemy.color || '#ff6600', 15);
                        }
                    }
                } else {
                    // Simple enemy without takeDamage
                    enemy.alive = false;
                    enemy.active = false;
                    this._onEnemyDestroyed(enemy, bullet);
                }
            };
        }

        // Collision stats for debugging
        this.stats = {
            checksPerFrame: 0,
            collisionsDetected: 0
        };

        console.log('✅ CollisionSystem initialized with gameState:', !!this.gameState);
    }

    /**
     * Register collision callback
     * @param {string} type - Collision type
     * @param {Function} callback - Callback function
     */
    onCollision(type, callback) {
        if (this.callbacks.hasOwnProperty(type)) {
            this.callbacks[type] = callback;
        }
    }

    /**
     * Circle-circle collision detection
     * @param {Object} a - First object with x, y, radius
     * @param {Object} b - Second object with x, y, radius
     * @returns {boolean} True if colliding
     */
    circleCollision(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distSq = dx * dx + dy * dy;
        const radiusSum = (a.radius || a.size || 10) + (b.radius || b.size || 10);
        return distSq < radiusSum * radiusSum;
    }

    /**
     * Point-circle collision detection
     * @param {Object} point - Point with x, y
     * @param {Object} circle - Circle with x, y, radius
     * @returns {boolean} True if point is inside circle
     */
    pointInCircle(point, circle) {
        const dx = point.x - circle.x;
        const dy = point.y - circle.y;
        const distSq = dx * dx + dy * dy;
        const radius = circle.radius || circle.size || 10;
        return distSq < radius * radius;
    }

    /**
     * Rectangle-rectangle collision detection
     * @param {Object} a - First rect with x, y, width, height
     * @param {Object} b - Second rect with x, y, width, height
     * @returns {boolean} True if colliding
     */
    rectCollision(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    /**
     * Circle-rectangle collision detection
     * @param {Object} circle - Circle with x, y, radius
     * @param {Object} rect - Rectangle with x, y, width, height
     * @returns {boolean} True if colliding
     */
    circleRectCollision(circle, rect) {
        const radius = circle.radius || circle.size || 10;

        // Find closest point on rectangle to circle center
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

        // Calculate distance
        const dx = circle.x - closestX;
        const dy = circle.y - closestY;

        return (dx * dx + dy * dy) < (radius * radius);
    }

    /**
     * Get distance between two points
     */
    distance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Get squared distance (faster, no sqrt)
     */
    distanceSquared(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return dx * dx + dy * dy;
    }

    /**
     * Check all collisions for the current frame
     * This is the main update method called each frame
     */
    update() {
        this.stats.checksPerFrame = 0;
        this.stats.collisionsDetected = 0;

        const gs = this.gameState;

        // Skip if game not running
        if (!gs.gameRunning || gs.gamePaused) return;

        // Player collisions (if player exists and not invulnerable)
        if (gs.player && !gs.playerInvulnerable && gs.player.alive !== false) {
            this.checkPlayerVsEnemyBullets(gs);
            this.checkPlayerVsEnemies(gs);
        }

        // Player bullets vs enemies
        this.checkBulletsVsEnemies(gs);

        // Player vs power-ups
        if (gs.player && gs.player.alive !== false) {
            this.checkPlayerVsPowerUps(gs);
        }

        // Optional: bullet vs bullet cancellation
        // this.checkBulletVsBullet(gs);
    }

    /**
     * Check player vs enemy bullets
     */
    checkPlayerVsEnemyBullets(gs) {
        const player = gs.player;
        const playerRadius = player.size || CONFIG.player.size;

        for (let i = gs.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = gs.enemyBullets[i];
            if (!bullet || !bullet.active) continue;

            this.stats.checksPerFrame++;

            const bulletRadius = bullet.radius || CONFIG.bullets.enemyRadius;

            if (this.circleCollision(
                { x: player.x, y: player.y, radius: playerRadius * 0.6 },
                { x: bullet.x, y: bullet.y, radius: bulletRadius }
            )) {
                this.stats.collisionsDetected++;

                // Remove bullet
                gs.enemyBullets.splice(i, 1);

                // Trigger callback
                if (this.callbacks.playerHitByBullet) {
                    this.callbacks.playerHitByBullet(player, bullet);
                }

                // Only one hit per frame
                break;
            }
        }
    }

    /**
     * Check player vs enemies
     */
    checkPlayerVsEnemies(gs) {
        const player = gs.player;
        const playerRadius = player.size || CONFIG.player.size;

        for (let i = gs.enemies.length - 1; i >= 0; i--) {
            const enemy = gs.enemies[i];
            if (!enemy || !enemy.alive) continue;

            this.stats.checksPerFrame++;

            const enemyRadius = enemy.size || 20;

            if (this.circleCollision(
                { x: player.x, y: player.y, radius: playerRadius * 0.6 },
                { x: enemy.x, y: enemy.y, radius: enemyRadius * 0.8 }
            )) {
                this.stats.collisionsDetected++;

                // Trigger callback
                if (this.callbacks.playerHitByEnemy) {
                    this.callbacks.playerHitByEnemy(player, enemy, i);
                }

                // Only one hit per frame
                break;
            }
        }
    }

    /**
     * Check player bullets vs enemies
     */
    checkBulletsVsEnemies(gs) {
        // Use bullets array from game state
        const bullets = gs.bullets;

        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            if (!bullet || !bullet.active) continue;

            const bulletRadius = bullet.radius || CONFIG.bullets.playerRadius;

            for (let j = gs.enemies.length - 1; j >= 0; j--) {
                const enemy = gs.enemies[j];
                if (!enemy || !enemy.alive) continue;

                this.stats.checksPerFrame++;

                const enemyRadius = enemy.size || 20;

                if (this.circleCollision(
                    { x: bullet.x, y: bullet.y, radius: bulletRadius },
                    { x: enemy.x, y: enemy.y, radius: enemyRadius }
                )) {
                    this.stats.collisionsDetected++;

                    // Trigger callback
                    if (this.callbacks.enemyHitByBullet) {
                        this.callbacks.enemyHitByBullet(enemy, bullet, j, i);
                    }

                    // Handle piercing bullets
                    if (!bullet.piercing || bullet.pierceCount <= 0) {
                        bullet.active = false;
                    } else if (bullet.pierceCount) {
                        bullet.pierceCount--;
                    }

                    break; // One enemy per bullet per frame
                }
            }
        }
    }

    /**
     * Check player vs power-ups
     */
    checkPlayerVsPowerUps(gs) {
        const player = gs.player;
        const playerRadius = player.size || CONFIG.player.size;

        for (let i = gs.powerUps.length - 1; i >= 0; i--) {
            const powerUp = gs.powerUps[i];
            if (!powerUp || !powerUp.active) continue;

            this.stats.checksPerFrame++;

            const powerUpRadius = powerUp.radius || 15;

            if (this.circleCollision(
                { x: player.x, y: player.y, radius: playerRadius },
                { x: powerUp.x, y: powerUp.y, radius: powerUpRadius }
            )) {
                this.stats.collisionsDetected++;

                // Remove power-up
                gs.powerUps.splice(i, 1);

                // Trigger callback
                if (this.callbacks.playerCollectPowerUp) {
                    this.callbacks.playerCollectPowerUp(player, powerUp);
                }
            }
        }
    }

    /**
     * Check bullet vs bullet (for bullet cancellation)
     */
    checkBulletVsBullet(gs) {
        const playerBullets = gs.bullets;
        const enemyBullets = gs.enemyBullets;

        for (let i = playerBullets.length - 1; i >= 0; i--) {
            const pBullet = playerBullets[i];
            if (!pBullet || !pBullet.active) continue;

            for (let j = enemyBullets.length - 1; j >= 0; j--) {
                const eBullet = enemyBullets[j];
                if (!eBullet || !eBullet.active) continue;

                this.stats.checksPerFrame++;

                if (this.circleCollision(
                    { x: pBullet.x, y: pBullet.y, radius: CONFIG.bullets.playerRadius },
                    { x: eBullet.x, y: eBullet.y, radius: CONFIG.bullets.enemyRadius }
                )) {
                    this.stats.collisionsDetected++;

                    // Cancel both bullets
                    pBullet.active = false;
                    eBullet.active = false;

                    // Trigger callback
                    if (this.callbacks.bulletHitBullet) {
                        this.callbacks.bulletHitBullet(pBullet, eBullet);
                    }
                }
            }
        }
    }

    /**
     * Check if a point is within screen bounds
     */
    isOnScreen(x, y, margin = 0) {
        return (
            x >= -margin &&
            x <= CONFIG.screen.width + margin &&
            y >= -margin &&
            y <= CONFIG.screen.height + margin
        );
    }

    /**
     * Clamp a position to screen bounds
     */
    clampToScreen(x, y, padding = 0) {
        return {
            x: Math.max(padding, Math.min(CONFIG.screen.width - padding, x)),
            y: Math.max(padding, Math.min(CONFIG.screen.height - padding, y))
        };
    }

    /**
     * Find nearest enemy to a position
     */
    findNearestEnemy(x, y, maxDistance = Infinity) {
        let nearest = null;
        let nearestDistSq = maxDistance * maxDistance;

        for (const enemy of this.gameState.enemies) {
            if (!enemy || !enemy.alive) continue;

            const distSq = this.distanceSquared({ x, y }, enemy);
            if (distSq < nearestDistSq) {
                nearestDistSq = distSq;
                nearest = enemy;
            }
        }

        return nearest;
    }

    /**
     * Find all enemies within radius
     */
    findEnemiesInRadius(x, y, radius) {
        const radiusSq = radius * radius;
        const result = [];

        for (const enemy of this.gameState.enemies) {
            if (!enemy || !enemy.alive) continue;

            const distSq = this.distanceSquared({ x, y }, enemy);
            if (distSq <= radiusSq) {
                result.push(enemy);
            }
        }

        return result;
    }

    /**
     * Get collision stats for debugging
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Reset collision system
     */
    reset() {
        this.stats.checksPerFrame = 0;
        this.stats.collisionsDetected = 0;
        this.grid.clear();
    }

    // ============================================
    // SPATIAL HASHING METHODS (Phase 3)
    // ============================================

    /**
     * Clear spatial hash grid
     */
    clearGrid() {
        this.grid.clear();
    }

    /**
     * Get cell key for position
     */
    getCellKey(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }

    /**
     * Add entity to spatial hash grid
     */
    addToGrid(entity, type) {
        if (!entity.active && entity.active !== undefined) return;

        const key = this.getCellKey(entity.x, entity.y);
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key).push({ entity, type });
    }

    /**
     * Get nearby entities from spatial hash
     */
    getNearby(x, y, radius = 1) {
        const entities = [];
        const cellRadius = Math.ceil(radius);

        const centerCellX = Math.floor(x / this.cellSize);
        const centerCellY = Math.floor(y / this.cellSize);

        for (let dx = -cellRadius; dx <= cellRadius; dx++) {
            for (let dy = -cellRadius; dy <= cellRadius; dy++) {
                const key = `${centerCellX + dx},${centerCellY + dy}`;
                if (this.grid.has(key)) {
                    entities.push(...this.grid.get(key));
                }
            }
        }

        return entities;
    }

    /**
     * Build spatial hash from game entities
     */
    buildSpatialHash() {
        this.clearGrid();

        const gs = this.gameState;
        if (!gs) return;

        // Add enemies to grid
        const enemies = gs.enemies || [];
        for (const enemy of enemies) {
            if (enemy.active || enemy.alive) {
                this.addToGrid(enemy, 'enemy');
            }
        }

        // Add power-ups to grid
        const powerUps = gs.powerUps || [];
        for (const powerUp of powerUps) {
            if (powerUp.active) {
                this.addToGrid(powerUp, 'powerup');
            }
        }
    }

    // ============================================
    // ENHANCED COLLISION CHECKS (Phase 3)
    // ============================================

    /**
     * Check collisions using spatial hashing
     */
    checkCollisionsSpatial(bulletPool, enemyBulletPool) {
        if (!this.gameState) return;

        this.stats.checksPerFrame = 0;
        this.stats.collisionsDetected = 0;

        // Build spatial hash
        this.buildSpatialHash();

        const gs = this.gameState;
        const player = gs.player;

        // Skip if game not running
        if (!gs.gameRunning || gs.paused) return;

        // Check player bullets vs enemies using spatial hash
        if (bulletPool) {
            const playerBullets = bulletPool.getPlayerBullets?.() ||
                                  bulletPool.getActiveBullets?.()?.filter(b => b.isPlayer) ||
                                  bulletPool.bullets?.filter(b => b.active && b.isPlayer) || [];

            for (const bullet of playerBullets) {
                if (!bullet.active) continue;

                const nearby = this.getNearby(bullet.x, bullet.y, 2);

                for (const { entity, type } of nearby) {
                    if (type !== 'enemy' || (!entity.active && !entity.alive)) continue;

                    this.stats.checksPerFrame++;

                    if (this.circleCollision(bullet, entity)) {
                        this.stats.collisionsDetected++;

                        // Hit enemy
                        const killed = entity.takeDamage?.(bullet.damage || 10);

                        // Handle bullet removal (unless piercing)
                        if (!bullet.piercing || (bullet.pierceCount && bullet.pierceCount <= 0)) {
                            bullet.active = false;
                        } else if (bullet.pierceCount) {
                            bullet.pierceCount--;
                        }

                        if (killed || !entity.active) {
                            this.handleEnemyKill(entity);
                        } else {
                            // Damage feedback
                            if (this.particleSystem?.addSparkle) {
                                this.particleSystem.addSparkle(entity.x, entity.y, entity.color, 3);
                            }
                            if (this.soundSystem?.playHit) {
                                this.soundSystem.playHit();
                            }
                        }

                        break;
                    }
                }
            }
        }

        // Check power-ups vs player using spatial hash
        if (player?.isAlive !== false) {
            const nearby = this.getNearby(player.x, player.y, 2);

            for (const { entity, type } of nearby) {
                if (type !== 'powerup' || !entity.active) continue;

                this.stats.checksPerFrame++;

                const collectRadius = {
                    x: player.x,
                    y: player.y,
                    radius: (player.size || 20) * 1.5
                };

                if (this.circleCollision(collectRadius, entity)) {
                    this.stats.collisionsDetected++;
                    entity.collect?.(player, gs, this.soundSystem, this.particleSystem);
                }
            }
        }
    }

    /**
     * Handle enemy kill with effects and power-up spawn
     */
    handleEnemyKill(enemy) {
        const gs = this.gameState;
        if (!gs) return;

        // Calculate score with multiplier
        const baseScore = enemy.points || 100;
        const multiplier = 1 + Math.floor((gs.combo || 0) / 5);
        const score = baseScore * multiplier;

        gs.score = (gs.score || 0) + score;

        // Combo
        gs.combo = (gs.combo || 0) + 1;
        gs.maxCombo = Math.max(gs.maxCombo || 0, gs.combo);
        gs.comboTimer = gs.comboTimeout || 180;

        // Check for radical slang
        if (gs.radicalSlang?.checkCombo) {
            gs.radicalSlang.checkCombo(gs.combo);
        }

        // Explosion effect
        if (this.particleSystem) {
            if (this.particleSystem.addExplosion) {
                this.particleSystem.addExplosion(enemy.x, enemy.y, enemy.color || '#ff6600', 15);
            } else if (this.particleSystem.explosion) {
                this.particleSystem.explosion(enemy.x, enemy.y, enemy.color || '#ff6600', 15);
            }

            if (this.particleSystem.addScorePopup) {
                this.particleSystem.addScorePopup(enemy.x, enemy.y - 20, score);
            }
        }

        // Sound
        if (this.soundSystem?.playExplosion) {
            this.soundSystem.playExplosion();
        } else if (this.soundSystem?.play) {
            this.soundSystem.play('explosion');
        }

        // Screen shake
        if (gs.screenShake) {
            gs.screenShake.intensity = Math.min(
                (gs.screenShake.intensity || 0) + 3,
                15
            );
            gs.screenShake.duration = Math.max(
                gs.screenShake.duration || 0,
                10
            );
        }

        // Chance to drop power-up
        this.trySpawnPowerUp(enemy.x, enemy.y, enemy.tier);

        // Call external callback if provided
        if (this._onEnemyDestroyed) {
            this._onEnemyDestroyed(enemy, null);
        }
    }

    /**
     * Handle player hit with effects
     */
    handlePlayerHit(player) {
        const gs = this.gameState;
        if (!gs || !player) return;

        const died = player.takeDamage?.(1);

        if (died) {
            gs.lives = Math.max((gs.lives || 0) - 1, 0);

            // Reset combo
            gs.combo = 0;
            if (gs.radicalSlang?.resetCombo) {
                gs.radicalSlang.resetCombo();
            }

            // Explosion
            if (this.particleSystem) {
                if (this.particleSystem.addExplosion) {
                    this.particleSystem.addExplosion(player.x, player.y, '#00ff00', 30);
                } else if (this.particleSystem.explosion) {
                    this.particleSystem.explosion(player.x, player.y, '#00ff00', 30);
                }
            }

            // Sound
            if (this.soundSystem?.playPlayerDeath) {
                this.soundSystem.playPlayerDeath();
            } else if (this.soundSystem?.play) {
                this.soundSystem.play('playerDeath');
            }

            // Screen shake
            if (gs.screenShake) {
                gs.screenShake.intensity = 15;
                gs.screenShake.duration = 30;
            }

            // Check game over
            if (gs.lives <= 0) {
                if (typeof window.gameOver === 'function') {
                    window.gameOver();
                }
            } else {
                // Respawn
                player.die?.();
            }
        }

        // Call external callback if provided
        if (this._onPlayerHit) {
            this._onPlayerHit();
        }
    }

    /**
     * Try to spawn a power-up at position
     */
    trySpawnPowerUp(x, y, enemyTier = 1) {
        const gs = this.gameState;
        if (!gs) return;

        // Base chance + bonus for harder enemies
        const baseChance = 0.15;
        const tierBonus = (enemyTier || 1) * 0.05;
        const waveBonus = ((gs.wave || 1) - 1) * 0.01;

        const spawnChance = Math.min(baseChance + tierBonus + waveBonus, 0.5);

        if (Math.random() < spawnChance) {
            // Initialize power-ups array if needed
            if (!gs.powerUps) {
                gs.powerUps = [];
            }

            const powerUp = new PowerUp(x, y);
            gs.powerUps.push(powerUp);

            console.log(`✨ Power-up spawned: ${powerUp.name} (${powerUp.type})`);
        }
    }

    /**
     * Check if circle collision between two entities
     */
    checkCircleCollision(a, b) {
        return this.circleCollision(a, b);
    }

    /**
     * Point in circle check
     */
    pointInCircle(px, py, cx, cy, radius) {
        const dx = px - cx;
        const dy = py - cy;
        return (dx * dx + dy * dy) < (radius * radius);
    }
}
