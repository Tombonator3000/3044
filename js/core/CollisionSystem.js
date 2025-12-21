/**
 * Geometry 3044 - CollisionSystem Module
 * Handles all collision detection between game entities
 */

import { CONFIG } from '../config.js';
import { PowerUp } from '../entities/PowerUp.js';
import { addGridImpact } from '../rendering/GridRenderer.js';

/**
 * CollisionSystem class - manages collision detection with spatial hashing
 */
export class CollisionSystem {
    constructor(options = {}) {
        // Spatial hashing for performance
        this.cellSize = 50;
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
     * Main collision check method - called from main.js
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

        // Player bullets vs enemies
        if (bulletPool) {
            this.buildEnemySpatialHash(gameState);
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

                        // Damage enemy
                        const killed = enemy.takeDamage?.(bullet.damage || 10);

                        // Remove bullet (unless piercing)
                        if (!bullet.pierce) {
                            bullet.active = false;
                        }

                        if (killed || !enemy.active) {
                            this.handleEnemyKill(enemy);
                        } else {
                            // Hit effect
                            if (particleSystem?.addSparkle) {
                                particleSystem.addSparkle(enemy.x, enemy.y, enemy.color, 3);
                            }
                            if (soundSystem?.playHit) {
                                soundSystem.playHit();
                            }
                        }

                        break;
                    }
                }
            }
        }

        // Player bullets vs boss
        if (bulletPool && gameState.boss?.active) {
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
                    if (particleSystem?.addSparkle) {
                        particleSystem.addSparkle(gameState.boss.x, gameState.boss.y, '#ffffff', 5);
                    }
                    if (soundSystem?.playHit) {
                        soundSystem.playHit();
                    }
                }
            }
        }

        // Enemy bullets vs player
        if (enemyBulletPool && player?.isAlive && !player.invulnerable) {
            const bullets = enemyBulletPool.getActiveBullets?.() || enemyBulletPool.bullets || [];
            const playerHitbox = { x: player.x, y: player.y, size: playerSize * 0.5 };

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

        // Enemies vs player collision
        if (player?.isAlive && !player.invulnerable) {
            const playerHitbox = { x: player.x, y: player.y, size: playerSize * 0.5 };

            for (const enemy of gameState.enemies) {
                if (!enemy.active) continue;

                this.stats.checksPerFrame++;

                if (this.circleCollision(enemy, playerHitbox)) {
                    this.stats.collisionsDetected++;

                    player.takeDamage?.(1);
                    enemy.takeDamage?.(100); // Destroy enemy on collision

                    if (particleSystem?.addExplosion) {
                        particleSystem.addExplosion(enemy.x, enemy.y, '#ff00ff', 20);
                    }
                    break;
                }
            }
        }

        // Player vs power-ups
        if (player?.isAlive) {
            const collectRadius = { x: player.x, y: player.y, size: playerSize * 1.5 };

            for (let i = gameState.powerUps.length - 1; i >= 0; i--) {
                const powerUp = gameState.powerUps[i];
                if (!powerUp.active) continue;

                this.stats.checksPerFrame++;

                if (this.circleCollision(powerUp, collectRadius)) {
                    this.stats.collisionsDetected++;

                    powerUp.collect?.(player, gameState, soundSystem, particleSystem);

                    // Register with power-up manager
                    if (gameState.powerUpManager?.registerPowerUp) {
                        gameState.powerUpManager.registerPowerUp(powerUp.type, powerUp.tier);
                    }
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
        if (gs.player && !gs.playerInvulnerable && gs.player.alive !== false) {
            this.checkPlayerVsEnemyBullets(gs);
            this.checkPlayerVsEnemies(gs);
        }

        // Player bullets vs enemies
        this.buildEnemySpatialHash(gs);
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

        for (let i = 0; i < gs.enemyBullets.length; i++) {
            const bullet = gs.enemyBullets[i];
            if (!bullet || !bullet.active) continue;

            this.stats.checksPerFrame++;

            const bulletRadius = bullet.radius || CONFIG.bullets.enemyRadius;

            if (this.circleCollision(
                { x: player.x, y: player.y, radius: playerRadius * 0.6 },
                { x: bullet.x, y: bullet.y, radius: bulletRadius }
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

            const searchRadius = Math.max(
                1,
                Math.ceil((bulletRadius + this.maxEnemyRadius) / this.cellSize)
            );
            const nearby = this.getNearby(bullet.x, bullet.y, searchRadius);

            for (const { entity: enemy, type } of nearby) {
                if (type !== 'enemy' || !enemy || !enemy.alive) continue;

                this.stats.checksPerFrame++;

                const enemyRadius = enemy.size || 20;

                if (this.circleCollision(
                    { x: bullet.x, y: bullet.y, radius: bulletRadius },
                    { x: enemy.x, y: enemy.y, radius: enemyRadius }
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

            const powerUpRadius = powerUp.radius || 15;

            if (this.circleCollision(
                { x: player.x, y: player.y, radius: playerRadius },
                { x: powerUp.x, y: powerUp.y, radius: powerUpRadius }
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

    /**
     * Build spatial hash for enemies only (per frame)
     */
    buildEnemySpatialHash(gs = this.gameState) {
        this.clearGrid();
        this.maxEnemyRadius = 0;

        if (!gs) return;

        const enemies = gs.enemies || [];
        for (const enemy of enemies) {
            if (!enemy || (!enemy.active && !enemy.alive)) continue;

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
     * Handle enemy kill with EPIC effects and power-up spawn
     */
    handleEnemyKill(enemy) {
        const gs = this.gameState;
        if (!gs) return;

        // Track kill in bestiary
        if (gs.bestiary && enemy.type) {
            gs.bestiary.recordKill(enemy.type, gs.wave || 1);
        }

        // Track session stats
        if (gs.sessionStats) {
            gs.sessionStats.kills = (gs.sessionStats.kills || 0) + 1;
        }

        // Calculate score with multiplier
        const baseScore = enemy.points || 100;
        const multiplier = 1 + Math.floor((gs.combo || 0) / 5);
        const score = baseScore * multiplier;

        gs.score = (gs.score || 0) + score;

        // Combo
        gs.combo = (gs.combo || 0) + 1;
        gs.maxCombo = Math.max(gs.maxCombo || 0, gs.combo);
        gs.comboTimer = gs.comboTimeout || 180;

        // Check for radical slang (combo phrases)
        if (gs.radicalSlang?.checkCombo) {
            gs.radicalSlang.checkCombo(gs.combo);
        }

        // Show kill phrase occasionally (10% chance handled inside)
        if (gs.radicalSlang?.showKillPhrase) {
            gs.radicalSlang.showKillPhrase(enemy.x, enemy.y);
        }

        // === GRID RIPPLE EFFECT ===
        // Add impact to the waving grid for Geometry Wars-style ripples
        const impactForce = 30 + (enemy.size || 20) * 1.5;
        const impactRadius = 80 + (enemy.size || 20) * 3;
        addGridImpact(enemy.x, enemy.y, impactForce, impactRadius);

        // === ADVANCED EXPLOSION EFFECTS ===
        if (this.particleSystem) {
            const combo = gs.combo || 0;
            const enemyType = enemy.type || 'default';
            const color = enemy.color || '#ff6600';

            // Choose explosion type based on enemy type and combo
            if (combo >= 50 && this.particleSystem.megaComboExplosion) {
                // MEGA COMBO explosion for high combos
                const comboLevel = Math.floor(combo / 25);
                this.particleSystem.megaComboExplosion(enemy.x, enemy.y, comboLevel);
            } else if (enemyType === 'electric' || enemyType === 'laser') {
                // Electric explosion for electric/laser enemies
                if (this.particleSystem.electricExplosion) {
                    this.particleSystem.electricExplosion(enemy.x, enemy.y, color);
                }
            } else if (enemyType === 'glitch' || Math.random() < 0.1) {
                // VHS glitch explosion (10% random chance or glitch enemies)
                if (this.particleSystem.glitchExplosion) {
                    this.particleSystem.glitchExplosion(enemy.x, enemy.y);
                }
            } else if (enemy.size > 30 || enemyType === 'heavy') {
                // Fire explosion for big/heavy enemies
                if (this.particleSystem.fireExplosion) {
                    this.particleSystem.fireExplosion(enemy.x, enemy.y, enemy.size / 30);
                }
            } else if (combo >= 20 && this.particleSystem.synthwaveExplosion) {
                // Synthwave explosion for decent combos
                this.particleSystem.synthwaveExplosion(enemy.x, enemy.y);
            } else if (this.particleSystem.pixelExplosion && Math.random() < 0.3) {
                // 30% chance for pixel explosion
                this.particleSystem.pixelExplosion(enemy.x, enemy.y, color);
            } else {
                // Standard explosion with shockwave
                if (this.particleSystem.addExplosion) {
                    this.particleSystem.addExplosion(enemy.x, enemy.y, color, 15);
                }
                // Add shockwave effect
                if (this.particleSystem.addShockwave) {
                    this.particleSystem.addShockwave(enemy.x, enemy.y, color, 60);
                }
            }

            // Score popup
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

        // Screen shake (stronger for bigger enemies)
        if (gs.screenShake) {
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

        // Chance to drop power-up
        this.trySpawnPowerUp(enemy.x, enemy.y, enemy.tier);

        // Call external callback if provided
        if (this._onEnemyDestroyed) {
            this._onEnemyDestroyed(enemy, null);
        }
    }

    /**
     * Handle player hit with EPIC effects
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

            // === MASSIVE GRID RIPPLE for player death ===
            addGridImpact(player.x, player.y, 100, 300);

            // Epic death explosion
            if (this.particleSystem) {
                if (this.particleSystem.epicDeathExplosion) {
                    this.particleSystem.epicDeathExplosion(player.x, player.y, '#00ff00');
                } else if (this.particleSystem.synthwaveExplosion) {
                    this.particleSystem.synthwaveExplosion(player.x, player.y);
                } else if (this.particleSystem.addExplosion) {
                    this.particleSystem.addExplosion(player.x, player.y, '#00ff00', 30);
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
