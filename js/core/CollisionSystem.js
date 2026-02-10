/**
 * Geometry 3044 - CollisionSystem Module
 * Handles all collision detection between game entities
 */

import { CONFIG } from '../config.js';
import { PowerUp } from '../entities/PowerUp.js';
import { Asteroid } from '../entities/Asteroid.js';
import { addGridImpact } from '../rendering/GridRenderer.js';

/**
 * Utility function to check if an entity is active/alive
 * Standardizes the inconsistent active/alive checks across the codebase
 * @param {Object} entity - Entity to check
 * @returns {boolean} True if entity is active/alive
 */
function isEntityActive(entity) {
    if (!entity) return false;
    // Check both active and alive properties - entity is valid if either is true
    // Some entities use .active (bullets, powerups), some use .alive (enemies)
    return entity.active !== false && entity.alive !== false;
}

/**
 * CollisionSystem class - manages collision detection with spatial hashing
 */
export class CollisionSystem {
    constructor(options = {}) {
        // Spatial hashing for performance
        // OPTIMIZED: Increased from 50 to 80 for fewer cells with 200+ enemies
        this.cellSize = 80;
        this.grid = new Map();
        this.maxEnemyRadius = 0;
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

        // Debug log only when enabled
        if (CONFIG.debug?.enabled) {
            console.log('✅ CollisionSystem initialized with gameState:', !!this.gameState);
        }
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
     * Optimized circle collision - takes raw values to avoid object creation in hot paths
     * @param {number} x1 - First circle x
     * @param {number} y1 - First circle y
     * @param {number} r1 - First circle radius
     * @param {number} x2 - Second circle x
     * @param {number} y2 - Second circle y
     * @param {number} r2 - Second circle radius
     * @returns {boolean} True if colliding
     */
    circleCollisionRaw(x1, y1, r1, x2, y2, r2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        const radiusSum = r1 + r2;
        return dx * dx + dy * dy < radiusSum * radiusSum;
    }

    /**
     * Main collision check method - called from main.js
     * Orchestrates collision detection across all entity types.
     * Each collision type is delegated to a focused helper method for clarity.
     *
     * @param {Object} gameState - The game state object
     * @param {Object} bulletPool - Player bullet pool
     * @param {Object} enemyBulletPool - Enemy bullet pool
     * @param {Object} particleSystem - Particle system for effects
     * @param {Object} soundSystem - Sound system for audio
     */
    checkCollisions(gameState, bulletPool, enemyBulletPool, particleSystem, soundSystem) {
        // Store references for use in collision handlers
        this.gameState = gameState;
        this.particleSystem = particleSystem;
        this.soundSystem = soundSystem;

        this.stats.checksPerFrame = 0;
        this.stats.collisionsDetected = 0;

        const player = gameState.player;
        const playerSize = player?.size || 20;

        // Build spatial hash once for enemy-related collisions
        if (bulletPool) {
            this.buildEnemySpatialHash(gameState);
        }

        // Delegate to focused collision handlers
        this.checkPlayerBulletsVsEnemiesMain(bulletPool);
        this.checkPlayerBulletsVsBoss(bulletPool, gameState);
        this.checkEnemyBulletsVsPlayerMain(enemyBulletPool, player, playerSize);
        this.checkEnemiesVsPlayerMain(player, playerSize, gameState);
        this.checkPlayerBulletsVsAsteroids(bulletPool, gameState);
        this.checkAsteroidsVsPlayerMain(player, playerSize, gameState);
        this.checkPlayerVsPowerUpsMain(player, playerSize, gameState);
    }

    /**
     * Check player bullets vs enemies using spatial hashing
     * @private
     */
    checkPlayerBulletsVsEnemiesMain(bulletPool) {
        if (!bulletPool) return;

        const bullets = bulletPool.getActiveBullets?.() || bulletPool.bullets || [];

        for (const bullet of bullets) {
            if (!bullet.active || !bullet.isPlayer) continue;

            const bulletRadius = bullet.radius || bullet.size || CONFIG.bullets?.playerRadius || 4;
            const searchRadius = Math.max(
                1,
                Math.ceil((bulletRadius + this.maxEnemyRadius) / this.cellSize)
            );
            const nearby = this.getNearby(bullet.x, bullet.y, searchRadius);

            for (const { entity: enemy, type } of nearby) {
                if (type !== 'enemy' || !enemy.active) continue;

                this.stats.checksPerFrame++;

                if (this.circleCollision(bullet, enemy)) {
                    this.stats.collisionsDetected++;
                    this.handleBulletEnemyCollision(bullet, enemy);
                    break;
                }
            }
        }
    }

    /**
     * Handle the result of a bullet hitting an enemy
     * @private
     */
    handleBulletEnemyCollision(bullet, enemy) {
        const killed = enemy.takeDamage?.(bullet.damage || 10);

        // Remove bullet (unless piercing)
        if (!bullet.pierce) {
            bullet.active = false;
        }

        if (killed || !enemy.active) {
            this.handleEnemyKill(enemy);
        } else {
            // Hit effect
            if (this.particleSystem?.addSparkle) {
                this.particleSystem.addSparkle(enemy.x, enemy.y, enemy.color, 3);
            }
            if (this.soundSystem?.playHit) {
                this.soundSystem.playHit();
            }
        }
    }

    /**
     * Check player bullets vs boss
     * @private
     */
    checkPlayerBulletsVsBoss(bulletPool, gameState) {
        if (!bulletPool || !gameState.boss?.active) return;

        const bullets = bulletPool.getActiveBullets?.() || bulletPool.bullets || [];
        const bossHitbox = { x: gameState.boss.x, y: gameState.boss.y, size: gameState.boss.size };

        for (const bullet of bullets) {
            if (!bullet.active || !bullet.isPlayer) continue;

            this.stats.checksPerFrame++;

            if (this.circleCollision(bullet, bossHitbox)) {
                this.stats.collisionsDetected++;

                gameState.boss.takeDamage?.(bullet.damage || 10);
                bullet.active = false;

                // Hit effect
                if (this.particleSystem?.addSparkle) {
                    this.particleSystem.addSparkle(gameState.boss.x, gameState.boss.y, '#ffffff', 5);
                }
                if (this.soundSystem?.playHit) {
                    this.soundSystem.playHit();
                }
            }
        }
    }

    /**
     * Check enemy bullets vs player
     * @private
     */
    checkEnemyBulletsVsPlayerMain(enemyBulletPool, player, playerSize) {
        if (!enemyBulletPool || !player?.isAlive || player.invulnerable) return;

        const bullets = enemyBulletPool.getActiveBullets?.() || enemyBulletPool.bullets || [];
        // Player hitbox increased from 0.5 to 0.7 for more challenging collision
        const playerHitbox = { x: player.x, y: player.y, size: playerSize * 0.7 };

        for (const bullet of bullets) {
            if (!bullet.active) continue;

            this.stats.checksPerFrame++;

            if (this.circleCollision(bullet, playerHitbox)) {
                this.stats.collisionsDetected++;

                bullet.active = false;
                player.takeDamage?.(1);
                break;
            }
        }
    }

    /**
     * Check enemies vs player collision (contact damage)
     * @private
     */
    checkEnemiesVsPlayerMain(player, playerSize, gameState) {
        if (!player?.isAlive || player.invulnerable) return;

        // Player hitbox increased from 0.5 to 0.7 for more challenging collision
        const playerHitbox = { x: player.x, y: player.y, size: playerSize * 0.7 };

        for (const enemy of gameState.enemies) {
            if (!enemy.active) continue;

            this.stats.checksPerFrame++;

            if (this.circleCollision(enemy, playerHitbox)) {
                this.stats.collisionsDetected++;

                player.takeDamage?.(1);
                enemy.takeDamage?.(100); // Destroy enemy on collision

                if (this.particleSystem?.addExplosion) {
                    this.particleSystem.addExplosion(enemy.x, enemy.y, '#ff00ff', 20);
                }
                break;
            }
        }
    }

    /**
     * Check player bullets vs asteroids
     * @private
     */
    checkPlayerBulletsVsAsteroids(bulletPool, gameState) {
        if (!bulletPool || !gameState.asteroids?.length) return;

        const bullets = bulletPool.getActiveBullets?.() || bulletPool.bullets || [];

        for (const bullet of bullets) {
            if (!bullet.active || !bullet.isPlayer) continue;

            for (let i = gameState.asteroids.length - 1; i >= 0; i--) {
                const asteroid = gameState.asteroids[i];
                if (!asteroid.active) continue;

                this.stats.checksPerFrame++;

                if (asteroid.checkCollision(bullet)) {
                    this.stats.collisionsDetected++;
                    this.handleBulletAsteroidCollision(bullet, asteroid, gameState);
                    break;
                }
            }
        }
    }

    /**
     * Handle the result of a bullet hitting an asteroid
     * @private
     */
    handleBulletAsteroidCollision(bullet, asteroid, gameState) {
        const destroyed = asteroid.takeDamage(bullet.damage || 1);

        // Remove bullet (unless piercing)
        if (!bullet.pierce) {
            bullet.active = false;
        }

        if (destroyed) {
            this.handleAsteroidKill(asteroid, gameState, this.particleSystem, this.soundSystem);
        } else {
            // Hit effect
            if (this.particleSystem?.addSparkle) {
                this.particleSystem.addSparkle(asteroid.x, asteroid.y, asteroid.primaryColor, 5);
            }
            if (this.soundSystem?.playHit) {
                this.soundSystem.playHit();
            }
        }
    }

    /**
     * Check asteroids vs player collision
     * @private
     */
    checkAsteroidsVsPlayerMain(player, playerSize, gameState) {
        if (!player?.isAlive || player.invulnerable || !gameState.asteroids?.length) return;

        const playerHitbox = { x: player.x, y: player.y, size: playerSize * 0.7, radius: playerSize * 0.7 };

        for (const asteroid of gameState.asteroids) {
            if (!asteroid.active) continue;

            this.stats.checksPerFrame++;

            if (asteroid.checkCollision(playerHitbox)) {
                this.stats.collisionsDetected++;

                player.takeDamage?.(1);

                if (this.particleSystem?.addExplosion) {
                    this.particleSystem.addExplosion(player.x, player.y, '#ff00ff', 15);
                }

                // Grid impact
                addGridImpact(player.x, player.y, 50, 150);

                break;
            }
        }
    }

    /**
     * Check player vs power-ups collection
     * @private
     */
    checkPlayerVsPowerUpsMain(player, playerSize, gameState) {
        if (!player?.isAlive) return;

        const collectRadius = { x: player.x, y: player.y, size: playerSize * 1.5 };

        for (let i = gameState.powerUps.length - 1; i >= 0; i--) {
            const powerUp = gameState.powerUps[i];
            if (!powerUp.active) continue;

            this.stats.checksPerFrame++;

            if (this.circleCollision(powerUp, collectRadius)) {
                this.stats.collisionsDetected++;

                powerUp.collect?.(player, gameState, this.soundSystem, this.particleSystem);

                // Register with power-up manager
                if (gameState.powerUpManager?.registerPowerUp) {
                    gameState.powerUpManager.registerPowerUp(powerUp.type, powerUp.tier);
                }
            }
        }
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
        if (gs.player && !gs.playerInvulnerable && gs.player.isAlive !== false) {
            this.checkPlayerVsEnemyBullets(gs);
            this.checkPlayerVsEnemies(gs);
        }

        // Player bullets vs enemies
        this.buildEnemySpatialHash(gs);
        this.checkBulletsVsEnemies(gs);

        // Player vs power-ups
        if (gs.player && gs.player.isAlive !== false) {
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
        const playerRadius = (player.size || CONFIG.player.size) * 0.75;  // Player hitbox

        for (let i = 0; i < gs.enemyBullets.length; i++) {
            const bullet = gs.enemyBullets[i];
            if (!bullet || !bullet.active) continue;

            this.stats.checksPerFrame++;

            // Use optimized collision check without object creation
            if (this.circleCollisionRaw(
                player.x, player.y, playerRadius,
                bullet.x, bullet.y, bullet.radius || CONFIG.bullets.enemyRadius
            )) {
                this.stats.collisionsDetected++;

                // Mark bullet as inactive (will be cleaned up by GameLoop)
                bullet.active = false;

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
        const playerRadius = (player.size || CONFIG.player.size) * 0.75;  // Player hitbox

        for (let i = gs.enemies.length - 1; i >= 0; i--) {
            const enemy = gs.enemies[i];
            if (!isEntityActive(enemy)) continue;

            this.stats.checksPerFrame++;

            // Use optimized collision check without object creation
            if (this.circleCollisionRaw(
                player.x, player.y, playerRadius,
                enemy.x, enemy.y, (enemy.size || 20) * 0.85
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

            const searchRadius = Math.max(
                1,
                Math.ceil((bulletRadius + this.maxEnemyRadius) / this.cellSize)
            );
            const nearby = this.getNearby(bullet.x, bullet.y, searchRadius);

            for (const { entity: enemy, type } of nearby) {
                if (type !== 'enemy' || !isEntityActive(enemy)) continue;

                this.stats.checksPerFrame++;

                // Use optimized collision check without object creation
                if (this.circleCollisionRaw(
                    bullet.x, bullet.y, bulletRadius,
                    enemy.x, enemy.y, enemy.size || 20
                )) {
                    this.stats.collisionsDetected++;

                    // Trigger callback
                    if (this.callbacks.enemyHitByBullet) {
                        this.callbacks.enemyHitByBullet(enemy, bullet, null, i);
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

        for (let i = 0; i < gs.powerUps.length; i++) {
            const powerUp = gs.powerUps[i];
            if (!powerUp || !powerUp.active) continue;

            this.stats.checksPerFrame++;

            // Use optimized collision check without object creation
            if (this.circleCollisionRaw(
                player.x, player.y, playerRadius,
                powerUp.x, powerUp.y, powerUp.radius || 15
            )) {
                this.stats.collisionsDetected++;

                // Mark power-up as inactive (will be cleaned up by GameLoop)
                powerUp.active = false;

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
        const playerBulletRadius = CONFIG.bullets.playerRadius;
        const enemyBulletRadius = CONFIG.bullets.enemyRadius;

        for (let i = playerBullets.length - 1; i >= 0; i--) {
            const pBullet = playerBullets[i];
            if (!pBullet || !pBullet.active) continue;

            for (let j = enemyBullets.length - 1; j >= 0; j--) {
                const eBullet = enemyBullets[j];
                if (!eBullet || !eBullet.active) continue;

                this.stats.checksPerFrame++;

                // Use optimized collision check without object creation
                if (this.circleCollisionRaw(
                    pBullet.x, pBullet.y, playerBulletRadius,
                    eBullet.x, eBullet.y, enemyBulletRadius
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
            if (!isEntityActive(enemy)) continue;

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
            if (!isEntityActive(enemy)) continue;

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
        // OPTIMIZED: Reuse buffer array to avoid allocating new array per call
        // Note: Caller must use results before next getNearby call
        if (!this._nearbyBuffer) this._nearbyBuffer = [];
        const entities = this._nearbyBuffer;
        entities.length = 0;
        const cellRadius = Math.ceil(radius);

        const centerCellX = Math.floor(x / this.cellSize);
        const centerCellY = Math.floor(y / this.cellSize);

        for (let dx = -cellRadius; dx <= cellRadius; dx++) {
            for (let dy = -cellRadius; dy <= cellRadius; dy++) {
                const key = `${centerCellX + dx},${centerCellY + dy}`;
                const cell = this.grid.get(key);
                if (cell) {
                    // OPTIMIZED: Push items individually instead of spread operator
                    for (let i = 0; i < cell.length; i++) {
                        entities.push(cell[i]);
                    }
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
            if (isEntityActive(enemy)) {
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

    /**
     * Build spatial hash for enemies only (per frame)
     */
    buildEnemySpatialHash(gs = this.gameState) {
        this.clearGrid();
        this.maxEnemyRadius = 0;

        if (!gs) return;

        const enemies = gs.enemies || [];
        for (const enemy of enemies) {
            if (!isEntityActive(enemy)) continue;

            const enemyRadius = enemy.radius || enemy.size || 20;
            this.maxEnemyRadius = Math.max(this.maxEnemyRadius, enemyRadius);
            this.addToGrid(enemy, 'enemy');
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
     * Update kill tracking stats (bestiary and session)
     * @param {Object} enemy - The killed enemy
     */
    updateKillStats(enemy) {
        const gs = this.gameState;
        if (!gs) return;

        if (gs.bestiary && enemy.type) {
            gs.bestiary.recordKill(enemy.type, gs.wave || 1);
        }

        if (gs.sessionStats) {
            gs.sessionStats.kills = (gs.sessionStats.kills || 0) + 1;
        }
    }

    /**
     * Calculate and apply score with combo multiplier
     * @param {Object} enemy - The killed enemy
     * @returns {number} The calculated score
     */
    updateScoreAndCombo(enemy) {
        const gs = this.gameState;
        if (!gs) return 0;

        const baseScore = enemy.points || 100;
        const multiplier = 1 + Math.floor((gs.combo || 0) / 5);
        const score = baseScore * multiplier;

        gs.score = (gs.score || 0) + score;
        gs.combo = (gs.combo || 0) + 1;
        gs.maxCombo = Math.max(gs.maxCombo || 0, gs.combo);
        gs.comboTimer = gs.comboTimeout || 180;

        if (gs.radicalSlang?.checkCombo) {
            gs.radicalSlang.checkCombo(gs.combo);
        }
        if (gs.radicalSlang?.showKillPhrase) {
            gs.radicalSlang.showKillPhrase(enemy.x, enemy.y);
        }

        return score;
    }

    /**
     * Calculate explosion intensity based on enemy and combo
     * @param {number} enemySize - Size of the enemy
     * @param {number} combo - Current combo count
     * @returns {number} The calculated intensity (capped at 2.0)
     */
    calculateExplosionIntensity(enemySize, combo) {
        let intensity = 0.6 + (enemySize / 50);

        if (combo >= 50) {
            intensity *= 1.5;
        } else if (combo >= 20) {
            intensity *= 1.2;
        }

        return Math.min(intensity, 2.0);
    }

    /**
     * Create special explosion effects for specific enemy types
     * Returns true if a special explosion was created (to avoid double explosions)
     * @param {Object} enemy - The killed enemy
     * @param {number} combo - Current combo count
     * @returns {boolean} True if special explosion was triggered
     */
    createSpecialExplosion(enemy, combo) {
        if (!this.particleSystem) return false;

        const enemyType = enemy.type || 'default';
        const color = enemy.color || '#ff6600';

        // Only trigger special explosions for very high combos or special enemy types
        // These replace the normal explosion to avoid stacking
        if (combo >= 50 && this.particleSystem.megaComboExplosion) {
            const comboLevel = Math.floor(combo / 25);
            this.particleSystem.megaComboExplosion(enemy.x, enemy.y, comboLevel);
            return true;
        } else if ((enemyType === 'electric' || enemyType === 'laser' || enemyType === 'laserdisc')
                   && this.particleSystem.electricExplosion) {
            this.particleSystem.electricExplosion(enemy.x, enemy.y, color);
            return true;
        } else if ((enemyType === 'glitch' || enemyType === 'vhstracker')
                   && this.particleSystem.glitchExplosion) {
            this.particleSystem.glitchExplosion(enemy.x, enemy.y);
            return true;
        }

        return false;
    }

    /**
     * Create explosion particle effects for enemy death
     * Only creates ONE explosion - either special or normal, not both
     * @param {Object} enemy - The killed enemy
     * @param {number} score - The score to display
     */
    createExplosionEffects(enemy, score) {
        if (!this.particleSystem) return;

        const gs = this.gameState;
        const combo = gs?.combo || 0;
        const color = enemy.color || '#ff6600';
        const enemySize = enemy.size || 20;

        // First try special explosion - if triggered, skip normal explosion
        const hadSpecialExplosion = this.createSpecialExplosion(enemy, combo);

        // Only add normal explosion if no special one was triggered
        if (!hadSpecialExplosion) {
            if (this.particleSystem.addGeometryWarsExplosion) {
                const intensity = this.calculateExplosionIntensity(enemySize, combo);
                this.particleSystem.addGeometryWarsExplosion(enemy.x, enemy.y, color, intensity);
            } else {
                if (this.particleSystem.addExplosion) {
                    this.particleSystem.addExplosion(enemy.x, enemy.y, color, 15);
                }
                if (this.particleSystem.addShockwave) {
                    this.particleSystem.addShockwave(enemy.x, enemy.y, color, 60);
                }
            }
        }

        if (this.particleSystem.addScorePopup) {
            this.particleSystem.addScorePopup(enemy.x, enemy.y - 20, score);
        }
    }

    /**
     * Apply screen shake effect based on enemy size
     * @param {Object} enemy - The killed enemy
     */
    applyScreenShake(enemy) {
        const gs = this.gameState;
        if (!gs?.screenShake) return;

        const shakeIntensity = 3 + (enemy.size || 20) * 0.1;
        gs.screenShake.intensity = Math.min(
            (gs.screenShake.intensity || 0) + shakeIntensity,
            15
        );
        gs.screenShake.duration = Math.max(
            gs.screenShake.duration || 0,
            10
        );
    }

    /**
     * Play explosion sound effect
     */
    playExplosionSound() {
        if (this.soundSystem?.playExplosion) {
            this.soundSystem.playExplosion();
        } else if (this.soundSystem?.play) {
            this.soundSystem.play('explosion');
        }
    }

    /**
     * Handle asteroid destruction with effects and child spawning
     * @param {Object} asteroid - The destroyed asteroid
     * @param {Object} gameState - The game state
     * @param {Object} particleSystem - Particle system for effects
     * @param {Object} soundSystem - Sound system for audio
     */
    handleAsteroidKill(asteroid, gameState, particleSystem, soundSystem) {
        if (!gameState) return;

        // Add score
        const score = asteroid.points || 100;
        gameState.score = (gameState.score || 0) + score;

        // Increment combo
        gameState.combo = (gameState.combo || 0) + 1;
        gameState.maxCombo = Math.max(gameState.maxCombo || 0, gameState.combo);
        gameState.comboTimer = gameState.comboTimeout || 180;

        // Grid ripple effect
        const impactForce = 40 + asteroid.size * 1.5;
        const impactRadius = 100 + asteroid.size * 2;
        addGridImpact(asteroid.x, asteroid.y, impactForce, impactRadius);

        // Explosion effects
        if (particleSystem) {
            // Rocky explosion with debris
            if (particleSystem.addExplosion) {
                particleSystem.addExplosion(asteroid.x, asteroid.y, asteroid.primaryColor, 20);
            }
            if (particleSystem.addShockwave) {
                particleSystem.addShockwave(asteroid.x, asteroid.y, asteroid.accentColor || '#ffaa00', 80);
            }
            if (particleSystem.addScorePopup) {
                particleSystem.addScorePopup(asteroid.x, asteroid.y - 20, score);
            }
        }

        // Sound effect
        if (soundSystem?.playExplosion) {
            soundSystem.playExplosion();
        }

        // Screen shake
        if (gameState.screenShake) {
            const shakeIntensity = 3 + asteroid.size * 0.15;
            gameState.screenShake.intensity = Math.min(
                (gameState.screenShake.intensity || 0) + shakeIntensity,
                12
            );
            gameState.screenShake.duration = Math.max(
                gameState.screenShake.duration || 0,
                10
            );
        }

        // Spawn child asteroids (classic Asteroids behavior!)
        const children = asteroid.getChildAsteroids();
        for (const child of children) {
            const newAsteroid = new Asteroid(child.x, child.y, child.sizeType, gameState);
            newAsteroid.sidescrollerMode = asteroid.sidescrollerMode;
            gameState.asteroids.push(newAsteroid);
        }

        // Small chance to drop power-up from large asteroids
        if (asteroid.sizeType === 'large' && Math.random() < 0.15) {
            this.trySpawnPowerUp(asteroid.x, asteroid.y, 1);
        }
    }

    /**
     * Handle enemy kill with effects and power-up spawn
     * Orchestrates all kill-related actions through focused helper methods
     * @param {Object} enemy - The killed enemy
     */
    handleEnemyKill(enemy) {
        const gs = this.gameState;
        if (!gs) return;

        // Update tracking stats
        this.updateKillStats(enemy);

        // Calculate and apply score/combo
        const score = this.updateScoreAndCombo(enemy);

        // Grid ripple effect
        const impactForce = 30 + (enemy.size || 20) * 1.5;
        const impactRadius = 80 + (enemy.size || 20) * 3;
        addGridImpact(enemy.x, enemy.y, impactForce, impactRadius);

        // Visual and audio effects
        this.createExplosionEffects(enemy, score);
        this.playExplosionSound();
        this.applyScreenShake(enemy);

        // Power-up drop chance
        this.trySpawnPowerUp(enemy.x, enemy.y, enemy.tier);

        // External callback
        if (this._onEnemyDestroyed) {
            this._onEnemyDestroyed(enemy, null);
        }
    }

    /**
     * Reset combo state when player dies
     * @param {Object} gs - Game state
     * @private
     */
    resetComboOnDeath(gs) {
        gs.combo = 0;
        gs.radicalSlang?.resetCombo?.();
    }

    /**
     * Create epic death explosion effects for player
     * Uses fallback chain to find available explosion method
     * @param {number} x - Player X position
     * @param {number} y - Player Y position
     * @private
     */
    createPlayerDeathEffects(x, y) {
        if (!this.particleSystem) return;

        const color = '#00ff00';
        const ps = this.particleSystem;

        // Try explosion methods in order of preference
        const explosionMethod =
            ps.addGeometryWarsPlayerDeath?.bind(ps, x, y, color) ||
            ps.epicDeathExplosion?.bind(ps, x, y, color) ||
            ps.synthwaveExplosion?.bind(ps, x, y) ||
            ps.addExplosion?.bind(ps, x, y, color, 30);

        explosionMethod?.();
    }

    /**
     * Play death sound effect with fallback
     * @private
     */
    playPlayerDeathSound() {
        if (this.soundSystem?.playPlayerDeath) {
            this.soundSystem.playPlayerDeath();
        } else {
            this.soundSystem?.play?.('playerDeath');
        }
    }

    /**
     * Apply intense screen shake for player death
     * @param {Object} gs - Game state
     * @private
     */
    applyPlayerDeathScreenShake(gs) {
        if (!gs.screenShake) return;
        gs.screenShake.intensity = 15;
        gs.screenShake.duration = 30;
    }

    /**
     * Handle game over or respawn based on remaining lives
     * @param {Object} player - The player object
     * @param {Object} gs - Game state
     * @private
     */
    handlePlayerDeathOutcome(player, gs) {
        if (gs.lives <= 0) {
            if (typeof window.gameOver === 'function') {
                window.gameOver();
            }
        } else {
            player.die?.();
        }
    }

    /**
     * Handle player hit with death effects
     * Orchestrates damage, effects, and game state updates
     * @param {Object} player - The player object
     */
    handlePlayerHit(player) {
        const gs = this.gameState;
        if (!gs || !player) return;

        const died = player.takeDamage?.(1);

        if (died) {
            gs.lives = Math.max((gs.lives || 0) - 1, 0);

            this.resetComboOnDeath(gs);
            addGridImpact(player.x, player.y, 100, 300);
            this.createPlayerDeathEffects(player.x, player.y);
            this.playPlayerDeathSound();
            this.applyPlayerDeathScreenShake(gs);
            this.handlePlayerDeathOutcome(player, gs);
        }

        this._onPlayerHit?.();
    }

    /**
     * Try to spawn a power-up at position
     */
    trySpawnPowerUp(x, y, enemyTier = 1) {
        const gs = this.gameState;
        if (!gs) return;

        // Base chance + bonus for harder enemies (balanced for difficulty)
        const baseChance = 0.08;  // Reduced from 0.15
        const tierBonus = (enemyTier || 1) * 0.03;  // Reduced from 0.05
        const waveBonus = ((gs.wave || 1) - 1) * 0.005;  // Reduced from 0.01

        const spawnChance = Math.min(baseChance + tierBonus + waveBonus, 0.35);  // Max reduced from 0.5

        if (Math.random() < spawnChance) {
            // Initialize power-ups array if needed
            if (!gs.powerUps) {
                gs.powerUps = [];
            }

            const powerUp = new PowerUp(x, y);
            gs.powerUps.push(powerUp);

            // Debug log only when enabled (power-ups spawn frequently)
            if (CONFIG.debug?.logGameEvents) {
                console.log(`✨ Power-up spawned: ${powerUp.name} (${powerUp.type})`);
            }
        }
    }

    /**
     * Check if circle collision between two entities
     */
    checkCircleCollision(a, b) {
        return this.circleCollision(a, b);
    }
}
