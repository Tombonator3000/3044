/**
 * Geometry 3044 - CollisionSystem Module
 * Handles all collision detection between game entities
 */

import { CONFIG } from '../config.js';

/**
 * CollisionSystem class - manages collision detection
 */
export class CollisionSystem {
    constructor(gameState) {
        this.gameState = gameState;

        // Collision callbacks
        this.callbacks = {
            playerHitByBullet: null,
            playerHitByEnemy: null,
            enemyHitByBullet: null,
            bulletHitBullet: null,
            playerCollectPowerUp: null
        };

        // Collision stats for debugging
        this.stats = {
            checksPerFrame: 0,
            collisionsDetected: 0
        };
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
    }
}
