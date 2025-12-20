// ============================================
// GEOMETRY 3044 — BULLET POOL
// ============================================

export class BulletPool {
    constructor(maxBullets = 200) {
        this.maxBullets = maxBullets;
        this.bullets = [];
        this.bulletIndex = 0;

        // Cached counts to avoid filtering arrays
        this._activeCount = 0;
        this._playerBulletCount = 0;

        // Pre-allocate bullets
        for (let i = 0; i < maxBullets; i++) {
            this.bullets.push(this.createBullet());
        }
    }

    createBullet() {
        const bullet = {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            active: false,
            isPlayer: true,
            size: 5,
            color: '#00ffff',
            damage: 10,
            pierce: false,
            pierceCount: 0,
            pierceHits: 0,
            bounce: false,
            bounceCount: 0,
            bounceHits: 0,
            homing: false,
            homingStrength: 0,
            chain: false,
            chainRange: 0,
            chainHits: 0,
            maxChainHits: 3,
            explosive: false,
            explosionRadius: 0,
            quantum: false,
            maxTrailLength: 5,
            trail: null,
            trailIndex: 0,
            trailCount: 0,
            lifetime: 0,
            maxLifetime: 300  // 5 seconds
        };
        bullet.trail = this.createTrail(bullet.maxTrailLength);
        return bullet;
    }

    createTrail(length) {
        return Array.from({ length }, () => ({ x: 0, y: 0 }));
    }

    // Main spawn method - supports both old get() and new spawn() signatures
    spawn(x, y, vx, vy, isPlayer = true, options = {}) {
        // Find inactive bullet or use oldest
        let bullet = null;

        for (let i = 0; i < this.maxBullets; i++) {
            const idx = (this.bulletIndex + i) % this.maxBullets;
            if (!this.bullets[idx].active) {
                bullet = this.bullets[idx];
                this.bulletIndex = (idx + 1) % this.maxBullets;
                break;
            }
        }

        // If no inactive found, reuse oldest
        if (!bullet) {
            bullet = this.bullets[this.bulletIndex];
            this.bulletIndex = (this.bulletIndex + 1) % this.maxBullets;
        }

        // Reset bullet
        bullet.x = x;
        bullet.y = y;
        bullet.vx = vx;
        bullet.vy = vy;
        bullet.active = true;
        bullet.isPlayer = isPlayer;
        bullet.lifetime = 0;
        bullet.maxTrailLength = options.maxTrailLength || bullet.maxTrailLength;
        if (bullet.trail.length !== bullet.maxTrailLength) {
            bullet.trail = this.createTrail(bullet.maxTrailLength);
        }
        bullet.trailIndex = 0;
        bullet.trailCount = 0;
        for (const point of bullet.trail) {
            point.x = x;
            point.y = y;
        }

        // Apply defaults
        bullet.size = options.size || (isPlayer ? 5 : 6);
        bullet.color = options.color || (isPlayer ? '#00ffff' : '#ff0066');
        bullet.damage = options.damage || 10;
        bullet.maxLifetime = options.maxLifetime || 300;

        // Special properties
        bullet.pierce = options.pierce || false;
        bullet.pierceCount = options.pierceCount || 0;
        bullet.pierceHits = 0;

        bullet.bounce = options.bounce || false;
        bullet.bounceCount = options.bounceCount || 0;
        bullet.bounceHits = 0;

        bullet.homing = options.homing || false;
        bullet.homingStrength = options.homingStrength || 0.05;

        bullet.chain = options.chain || false;
        bullet.chainRange = options.chainRange || 80;
        bullet.chainHits = 0;
        bullet.maxChainHits = options.maxChainHits || 3;

        bullet.explosive = options.explosive || false;
        bullet.explosionRadius = options.explosionRadius || 50;

        bullet.quantum = options.quantum || false;

        return bullet;
    }

    // Alias for backwards compatibility
    get(x, y, vx, vy, isPlayer, options) {
        return this.spawn(x, y, vx, vy, isPlayer, options);
    }

    update(canvas, gameState, deltaTime = 1) {
        const scaledDeltaTime = Math.max(deltaTime, 0);
        this._activeCount = 0;
        this._playerBulletCount = 0;

        for (const bullet of this.bullets) {
            if (!bullet.active) continue;

            this._activeCount++;
            if (bullet.isPlayer) this._playerBulletCount++;

            // Store trail position
            const trailPoint = bullet.trail[bullet.trailIndex];
            trailPoint.x = bullet.x;
            trailPoint.y = bullet.y;
            bullet.trailIndex = (bullet.trailIndex + 1) % bullet.maxTrailLength;
            bullet.trailCount = Math.min(bullet.trailCount + 1, bullet.maxTrailLength);

            // Homing behavior
            if (bullet.homing && bullet.isPlayer && gameState?.enemies) {
                const target = this.findNearestTarget(bullet, gameState.enemies);
                if (target) {
                    const angle = Math.atan2(target.y - bullet.y, target.x - bullet.x);
                    const currentAngle = Math.atan2(bullet.vy, bullet.vx);
                    const angleDiff = angle - currentAngle;

                    // Normalize angle difference
                    const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
                    const newAngle = currentAngle + normalizedDiff * bullet.homingStrength * scaledDeltaTime;

                    const speed = Math.hypot(bullet.vx, bullet.vy);
                    bullet.vx = Math.cos(newAngle) * speed;
                    bullet.vy = Math.sin(newAngle) * speed;
                }
            }

            // Move
            bullet.x += bullet.vx * scaledDeltaTime;
            bullet.y += bullet.vy * scaledDeltaTime;
            bullet.lifetime += scaledDeltaTime;

            // Bounce off walls
            if (bullet.bounce && bullet.bounceHits < bullet.bounceCount) {
                if (bullet.x < 0 || bullet.x > canvas.logicalWidth) {
                    bullet.vx *= -1;
                    bullet.bounceHits++;
                    bullet.x = Math.max(0, Math.min(canvas.logicalWidth, bullet.x));
                }
                if (bullet.y < 0) {
                    bullet.vy *= -1;
                    bullet.bounceHits++;
                    bullet.y = Math.max(0, bullet.y);
                }
            }

            // Deactivate if off screen or expired
            if (bullet.x < -50 || bullet.x > canvas.logicalWidth + 50 ||
                bullet.y < -50 || bullet.y > canvas.logicalHeight + 50 ||
                bullet.lifetime > bullet.maxLifetime) {
                bullet.active = false;
            }
        }
    }

    findNearestTarget(bullet, enemies) {
        let nearest = null;
        let nearestDist = Infinity;

        for (const enemy of enemies) {
            if (!enemy.active) continue;

            const dist = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y);
            if (dist < nearestDist && dist < 300) {
                nearestDist = dist;
                nearest = enemy;
            }
        }

        return nearest;
    }

    draw(ctx) {
        for (const bullet of this.bullets) {
            if (!bullet.active) continue;

            ctx.save();

            // Draw trail
            if (bullet.trailCount > 1) {
                ctx.strokeStyle = bullet.color;
                ctx.lineWidth = bullet.size * 0.5;
                ctx.globalAlpha = 0.3;
                ctx.beginPath();
                const startIndex = (bullet.trailIndex - bullet.trailCount + bullet.maxTrailLength) % bullet.maxTrailLength;
                const firstPoint = bullet.trail[startIndex];
                ctx.moveTo(firstPoint.x, firstPoint.y);
                for (let i = 1; i < bullet.trailCount; i++) {
                    const pointIndex = (startIndex + i) % bullet.maxTrailLength;
                    const point = bullet.trail[pointIndex];
                    ctx.lineTo(point.x, point.y);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // Glow
            ctx.shadowBlur = 15;
            ctx.shadowColor = bullet.color;

            // Special rendering for quantum bullets
            if (bullet.quantum) {
                ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.02) * 0.3;

                // Draw multiple ghost bullets
                for (let i = 0; i < 3; i++) {
                    const offset = Math.sin(Date.now() * 0.01 + i * 2) * 10;
                    ctx.fillStyle = bullet.color;
                    ctx.beginPath();
                    ctx.arc(bullet.x + offset, bullet.y, bullet.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                // Normal bullet
                ctx.fillStyle = bullet.color;
                ctx.beginPath();
                ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
                ctx.fill();

                // Inner bright core
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.arc(bullet.x, bullet.y, bullet.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    // Returns the bullets array directly - caller should check .active
    // This avoids creating new arrays every frame
    getActiveBullets() {
        return this.bullets;
    }

    getPlayerBullets() {
        return this.bullets;
    }

    getEnemyBullets() {
        return this.bullets;
    }

    // Get count of active bullets (cached, updated in update())
    getActiveCount() {
        return this._activeCount;
    }

    // Iterate only active player bullets near a position (for dodge checks)
    *iterateNearbyPlayerBullets(x, y, radius) {
        const radiusSq = radius * radius;
        for (const bullet of this.bullets) {
            if (!bullet.active || !bullet.isPlayer) continue;
            const dx = bullet.x - x;
            const dy = bullet.y - y;
            if (dx * dx + dy * dy < radiusSq) {
                yield bullet;
            }
        }
    }

    clear() {
        for (const bullet of this.bullets) {
            bullet.active = false;
        }
    }

    // Handle bullet hit (for pierce/chain mechanics)
    onBulletHit(bullet, target, gameState, particleSystem) {
        if (!bullet.active) return true;  // Bullet should be removed

        // Pierce through enemies
        if (bullet.pierce && bullet.pierceHits < bullet.pierceCount) {
            bullet.pierceHits++;
            bullet.damage *= 0.8;  // Reduce damage after each pierce
            return false;  // Don't remove bullet
        }

        // Chain to nearby enemies
        if (bullet.chain && bullet.chainHits < bullet.maxChainHits) {
            const nextTarget = this.findChainTarget(bullet, target, gameState.enemies);
            if (nextTarget) {
                // Create chain lightning effect
                if (particleSystem) {
                    particleSystem.addChainLightning?.(bullet.x, bullet.y, nextTarget.x, nextTarget.y, bullet.color);
                }

                // Redirect bullet
                const angle = Math.atan2(nextTarget.y - bullet.y, nextTarget.x - bullet.x);
                const speed = Math.hypot(bullet.vx, bullet.vy);
                bullet.vx = Math.cos(angle) * speed;
                bullet.vy = Math.sin(angle) * speed;
                bullet.chainHits++;
                bullet.damage *= 0.7;

                return false;  // Don't remove bullet
            }
        }

        // Explosive bullets
        if (bullet.explosive && gameState?.enemies) {
            for (const enemy of gameState.enemies) {
                if (!enemy.active || enemy === target) continue;

                const dist = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y);
                if (dist < bullet.explosionRadius) {
                    const explosionDamage = Math.ceil(bullet.damage * (1 - dist / bullet.explosionRadius));
                    enemy.takeDamage?.(explosionDamage);
                }
            }

            // Explosion effect
            if (particleSystem) {
                particleSystem.addExplosion?.(bullet.x, bullet.y, '#ff6600', 20);
            }
        }

        return true;  // Remove bullet
    }

    findChainTarget(bullet, excludeTarget, enemies) {
        let nearest = null;
        let nearestDist = Infinity;

        for (const enemy of enemies) {
            if (!enemy.active || enemy === excludeTarget) continue;

            const dist = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y);
            if (dist < bullet.chainRange && dist < nearestDist) {
                nearestDist = dist;
                nearest = enemy;
            }
        }

        return nearest;
    }
}
