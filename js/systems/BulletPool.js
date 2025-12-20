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
        const time = Date.now() * 0.001;

        for (const bullet of this.bullets) {
            if (!bullet.active) continue;

            ctx.save();

            // Calculate bullet angle from velocity
            const angle = Math.atan2(bullet.vy, bullet.vx);

            // Draw specialized bullet based on type
            if (bullet.quantum) {
                this.drawQuantumBullet(ctx, bullet, time);
            } else if (bullet.chain) {
                this.drawChainBullet(ctx, bullet, time, angle);
            } else if (bullet.explosive) {
                this.drawExplosiveBullet(ctx, bullet, time);
            } else if (bullet.pierce) {
                this.drawPierceBullet(ctx, bullet, time, angle);
            } else if (bullet.homing) {
                this.drawHomingBullet(ctx, bullet, time, angle);
            } else if (bullet.bounce) {
                this.drawBounceBullet(ctx, bullet, time);
            } else if (bullet.isPlayer) {
                this.drawPlayerBullet(ctx, bullet, time, angle);
            } else {
                this.drawEnemyBullet(ctx, bullet, time, angle);
            }

            ctx.restore();
        }
    }

    /**
     * Draw player energy bolt - sleek plasma shot
     */
    drawPlayerBullet(ctx, bullet, time, angle) {
        const size = bullet.size;

        // Draw energy trail
        if (bullet.trailCount > 1) {
            const startIndex = (bullet.trailIndex - bullet.trailCount + bullet.maxTrailLength) % bullet.maxTrailLength;
            ctx.lineCap = 'round';

            for (let i = 1; i < bullet.trailCount; i++) {
                const pointIndex = (startIndex + i) % bullet.maxTrailLength;
                const prevIndex = (startIndex + i - 1) % bullet.maxTrailLength;
                const point = bullet.trail[pointIndex];
                const prevPoint = bullet.trail[prevIndex];
                const alpha = (i / bullet.trailCount) * 0.4;

                ctx.strokeStyle = bullet.color;
                ctx.lineWidth = size * (i / bullet.trailCount);
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.moveTo(prevPoint.x, prevPoint.y);
                ctx.lineTo(point.x, point.y);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }

        ctx.translate(bullet.x, bullet.y);
        ctx.rotate(angle + Math.PI / 2);

        // Outer glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = bullet.color;

        // Energy bolt shape - elongated diamond
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.moveTo(0, -size * 2);        // Front point
        ctx.lineTo(-size * 0.6, 0);       // Left
        ctx.lineTo(0, size * 1.2);        // Back
        ctx.lineTo(size * 0.6, 0);        // Right
        ctx.closePath();
        ctx.fill();

        // Inner hot core
        const gradient = ctx.createLinearGradient(0, -size, 0, size);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, bullet.color);
        gradient.addColorStop(1, bullet.color + '88');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, -size * 1.4);
        ctx.lineTo(-size * 0.3, 0);
        ctx.lineTo(0, size * 0.6);
        ctx.lineTo(size * 0.3, 0);
        ctx.closePath();
        ctx.fill();

        // Bright tip
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -size * 1.2, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw enemy bullet - aggressive spiked plasma
     */
    drawEnemyBullet(ctx, bullet, time, angle) {
        const size = bullet.size;

        // Trail
        if (bullet.trailCount > 1) {
            const startIndex = (bullet.trailIndex - bullet.trailCount + bullet.maxTrailLength) % bullet.maxTrailLength;
            for (let i = 1; i < bullet.trailCount; i++) {
                const pointIndex = (startIndex + i) % bullet.maxTrailLength;
                const point = bullet.trail[pointIndex];
                const alpha = (i / bullet.trailCount) * 0.3;

                ctx.fillStyle = bullet.color;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(point.x, point.y, size * (i / bullet.trailCount) * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        ctx.translate(bullet.x, bullet.y);
        ctx.rotate(angle + Math.PI / 2);

        // Menacing glow
        ctx.shadowBlur = 25;
        ctx.shadowColor = bullet.color;

        // Spiked bullet shape
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        const spikes = 4;
        for (let i = 0; i < spikes * 2; i++) {
            const spikeAngle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
            const r = i % 2 === 0 ? size * 1.5 : size * 0.6;
            const x = Math.cos(spikeAngle) * r;
            const y = Math.sin(spikeAngle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // Dark core for contrast
        ctx.fillStyle = '#330011';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing red center
        const pulse = 0.7 + Math.sin(time * 10) * 0.3;
        ctx.fillStyle = `rgba(255, 100, 100, ${pulse})`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff4444';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw homing missile - seeking arrow with exhaust
     */
    drawHomingBullet(ctx, bullet, time, angle) {
        const size = bullet.size;

        // Exhaust trail
        if (bullet.trailCount > 1) {
            const startIndex = (bullet.trailIndex - bullet.trailCount + bullet.maxTrailLength) % bullet.maxTrailLength;
            for (let i = 1; i < bullet.trailCount; i++) {
                const pointIndex = (startIndex + i) % bullet.maxTrailLength;
                const point = bullet.trail[pointIndex];
                const alpha = (i / bullet.trailCount) * 0.6;
                const trailSize = size * (i / bullet.trailCount) * 0.8;

                // Fire trail
                const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, trailSize);
                gradient.addColorStop(0, `rgba(255, 200, 100, ${alpha})`);
                gradient.addColorStop(0.5, `rgba(255, 100, 50, ${alpha * 0.7})`);
                gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(point.x, point.y, trailSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.translate(bullet.x, bullet.y);
        ctx.rotate(angle + Math.PI / 2);

        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff8800';

        // Missile body - arrow shape
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(0, -size * 2);          // Nose
        ctx.lineTo(-size * 0.8, -size * 0.5); // Left shoulder
        ctx.lineTo(-size * 0.5, size);      // Left tail
        ctx.lineTo(-size * 1.2, size * 1.5); // Left fin
        ctx.lineTo(-size * 0.3, size);
        ctx.lineTo(0, size * 0.5);          // Center back
        ctx.lineTo(size * 0.3, size);
        ctx.lineTo(size * 1.2, size * 1.5);  // Right fin
        ctx.lineTo(size * 0.5, size);
        ctx.lineTo(size * 0.8, -size * 0.5);
        ctx.closePath();
        ctx.fill();

        // Nose cone highlight
        ctx.fillStyle = '#ffaa44';
        ctx.beginPath();
        ctx.moveTo(0, -size * 2);
        ctx.lineTo(-size * 0.4, -size * 0.3);
        ctx.lineTo(size * 0.4, -size * 0.3);
        ctx.closePath();
        ctx.fill();

        // Seeker eye
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, -size * 0.8, size * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Thruster flame
        const flicker = 0.8 + Math.random() * 0.4;
        ctx.fillStyle = `rgba(255, 255, 200, ${flicker})`;
        ctx.shadowColor = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(-size * 0.3, size);
        ctx.lineTo(0, size + size * 1.5 * flicker);
        ctx.lineTo(size * 0.3, size);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Draw pierce bullet - sharp needle/dart
     */
    drawPierceBullet(ctx, bullet, time, angle) {
        const size = bullet.size;

        // Speed lines trail
        if (bullet.trailCount > 1) {
            const startIndex = (bullet.trailIndex - bullet.trailCount + bullet.maxTrailLength) % bullet.maxTrailLength;
            ctx.strokeStyle = bullet.color;
            ctx.lineCap = 'round';

            for (let i = 1; i < bullet.trailCount; i++) {
                const pointIndex = (startIndex + i) % bullet.maxTrailLength;
                const prevIndex = (startIndex + i - 1) % bullet.maxTrailLength;
                const point = bullet.trail[pointIndex];
                const prevPoint = bullet.trail[prevIndex];
                const alpha = (i / bullet.trailCount) * 0.5;

                ctx.lineWidth = 1;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.moveTo(prevPoint.x, prevPoint.y);
                ctx.lineTo(point.x, point.y);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }

        ctx.translate(bullet.x, bullet.y);
        ctx.rotate(angle + Math.PI / 2);

        ctx.shadowBlur = 15;
        ctx.shadowColor = '#88ffff';

        // Long needle shape
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(0, -size * 3);          // Sharp tip
        ctx.lineTo(-size * 0.15, -size * 2);
        ctx.lineTo(-size * 0.4, size * 0.5);
        ctx.lineTo(-size * 0.8, size * 1.5); // Left fletching
        ctx.lineTo(-size * 0.2, size);
        ctx.lineTo(0, size * 1.2);
        ctx.lineTo(size * 0.2, size);
        ctx.lineTo(size * 0.8, size * 1.5);  // Right fletching
        ctx.lineTo(size * 0.4, size * 0.5);
        ctx.lineTo(size * 0.15, -size * 2);
        ctx.closePath();
        ctx.fill();

        // Central energy line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -size * 2.5);
        ctx.lineTo(0, size * 0.5);
        ctx.stroke();

        // Piercing tip glow
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, -size * 2.5, size * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Pierce count indicator
        if (bullet.pierceCount > 0) {
            ctx.fillStyle = '#ffff00';
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 8;
            const remaining = bullet.pierceCount - bullet.pierceHits;
            for (let i = 0; i < remaining; i++) {
                ctx.beginPath();
                ctx.arc(0, size * 0.2 - i * size * 0.4, size * 0.15, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    /**
     * Draw bounce bullet - energy ball with ring
     */
    drawBounceBullet(ctx, bullet, time) {
        const size = bullet.size;

        // Bouncing trail
        if (bullet.trailCount > 1) {
            const startIndex = (bullet.trailIndex - bullet.trailCount + bullet.maxTrailLength) % bullet.maxTrailLength;
            for (let i = 1; i < bullet.trailCount; i++) {
                const pointIndex = (startIndex + i) % bullet.maxTrailLength;
                const point = bullet.trail[pointIndex];
                const alpha = (i / bullet.trailCount) * 0.4;

                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 2;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(point.x, point.y, size * (i / bullet.trailCount), 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }

        ctx.translate(bullet.x, bullet.y);

        // Spinning ring
        const spin = time * 5;
        ctx.save();
        ctx.rotate(spin);

        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffff00';

        // Outer ring with gaps
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const startAngle = (i / 4) * Math.PI * 2 + 0.2;
            const endAngle = ((i + 1) / 4) * Math.PI * 2 - 0.2;
            ctx.arc(0, 0, size * 1.5, startAngle, endAngle);
        }
        ctx.stroke();
        ctx.restore();

        // Core ball
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.4, '#ffff88');
        gradient.addColorStop(1, '#ffaa00');

        ctx.fillStyle = gradient;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffff00';
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();

        // Bounce count indicator
        const remaining = bullet.bounceCount - bullet.bounceHits;
        if (remaining > 0) {
            ctx.fillStyle = '#00ff00';
            ctx.font = `bold ${size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(remaining.toString(), 0, 0);
        }
    }

    /**
     * Draw chain lightning bullet - electric orb with tendrils
     */
    drawChainBullet(ctx, bullet, time, angle) {
        const size = bullet.size;

        // Electric trail
        if (bullet.trailCount > 1) {
            const startIndex = (bullet.trailIndex - bullet.trailCount + bullet.maxTrailLength) % bullet.maxTrailLength;
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 1;

            for (let i = 1; i < bullet.trailCount; i++) {
                const pointIndex = (startIndex + i) % bullet.maxTrailLength;
                const prevIndex = (startIndex + i - 1) % bullet.maxTrailLength;
                const point = bullet.trail[pointIndex];
                const prevPoint = bullet.trail[prevIndex];
                const alpha = (i / bullet.trailCount) * 0.5;

                ctx.globalAlpha = alpha;
                ctx.beginPath();
                // Zigzag between points
                const midX = (point.x + prevPoint.x) / 2 + (Math.random() - 0.5) * 10;
                const midY = (point.y + prevPoint.y) / 2 + (Math.random() - 0.5) * 10;
                ctx.moveTo(prevPoint.x, prevPoint.y);
                ctx.lineTo(midX, midY);
                ctx.lineTo(point.x, point.y);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }

        ctx.translate(bullet.x, bullet.y);

        // Electric tendrils
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        ctx.lineCap = 'round';

        const tendrils = 6;
        for (let i = 0; i < tendrils; i++) {
            const baseAngle = (i / tendrils) * Math.PI * 2 + time * 3;
            ctx.beginPath();
            ctx.moveTo(0, 0);

            let x = 0, y = 0;
            const segments = 3;
            for (let j = 0; j < segments; j++) {
                const segAngle = baseAngle + (Math.random() - 0.5) * 1.5;
                const segLen = size * (0.8 + Math.random() * 0.6);
                x += Math.cos(segAngle) * segLen;
                y += Math.sin(segAngle) * segLen;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // Core orb with gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, '#88ffff');
        gradient.addColorStop(0.7, '#00ffff');
        gradient.addColorStop(1, '#0088ff');

        ctx.fillStyle = gradient;
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#00ffff';
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();

        // Electric sparks around
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 4; i++) {
            const sparkAngle = time * 8 + (i / 4) * Math.PI * 2;
            const sparkDist = size * 1.3 + Math.sin(time * 15 + i) * size * 0.3;
            const sx = Math.cos(sparkAngle) * sparkDist;
            const sy = Math.sin(sparkAngle) * sparkDist;

            ctx.beginPath();
            ctx.arc(sx, sy, size * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }

        // Chain hit indicator
        const remaining = bullet.maxChainHits - bullet.chainHits;
        if (remaining > 0) {
            ctx.fillStyle = '#ffff00';
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Draw explosive bullet - glowing bomb
     */
    drawExplosiveBullet(ctx, bullet, time) {
        const size = bullet.size;
        const pulse = 1 + Math.sin(time * 10) * 0.15;

        // Warning trail
        if (bullet.trailCount > 1) {
            const startIndex = (bullet.trailIndex - bullet.trailCount + bullet.maxTrailLength) % bullet.maxTrailLength;
            for (let i = 1; i < bullet.trailCount; i++) {
                const pointIndex = (startIndex + i) % bullet.maxTrailLength;
                const point = bullet.trail[pointIndex];
                const alpha = (i / bullet.trailCount) * 0.4;

                ctx.fillStyle = i % 2 === 0 ? '#ff6600' : '#ffff00';
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(point.x, point.y, size * 0.3 * (i / bullet.trailCount), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        ctx.translate(bullet.x, bullet.y);

        // Explosion radius preview (faint)
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.15 + Math.sin(time * 8) * 0.1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, bullet.explosionRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        // Bomb body
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#ff4400';

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * pulse);
        gradient.addColorStop(0, '#ffff88');
        gradient.addColorStop(0.3, '#ff8800');
        gradient.addColorStop(0.7, '#ff4400');
        gradient.addColorStop(1, '#aa0000');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, size * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Fuse spark
        const sparkSize = size * 0.4 + Math.random() * size * 0.3;
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, -size * 0.8, sparkSize, 0, Math.PI * 2);
        ctx.fill();

        // Warning symbol
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', 0, size * 0.1);

        // Outer ring pulse
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5 + Math.sin(time * 12) * 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, size * 1.4 * pulse, 0, Math.PI * 2);
        ctx.stroke();
    }

    /**
     * Draw quantum bullet - phasing ghost bullets
     */
    drawQuantumBullet(ctx, bullet, time) {
        const size = bullet.size;

        // Quantum trail - fading copies
        if (bullet.trailCount > 1) {
            const startIndex = (bullet.trailIndex - bullet.trailCount + bullet.maxTrailLength) % bullet.maxTrailLength;
            for (let i = 1; i < bullet.trailCount; i++) {
                const pointIndex = (startIndex + i) % bullet.maxTrailLength;
                const point = bullet.trail[pointIndex];
                const alpha = (i / bullet.trailCount) * 0.3;

                ctx.fillStyle = '#aa00ff';
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(point.x, point.y, size * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        ctx.translate(bullet.x, bullet.y);
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#aa00ff';

        // Multiple phase copies
        const copies = 3;
        for (let i = 0; i < copies; i++) {
            const phase = time * 3 + (i / copies) * Math.PI * 2;
            const offsetX = Math.sin(phase) * size * 1.5;
            const offsetY = Math.cos(phase * 0.7) * size * 0.8;
            const alpha = 0.3 + (i === 1 ? 0.5 : 0);

            ctx.globalAlpha = alpha;

            // Phase bullet shape - diamond
            ctx.fillStyle = '#cc44ff';
            ctx.beginPath();
            ctx.moveTo(offsetX, offsetY - size * 1.2);
            ctx.lineTo(offsetX - size * 0.6, offsetY);
            ctx.lineTo(offsetX, offsetY + size * 0.8);
            ctx.lineTo(offsetX + size * 0.6, offsetY);
            ctx.closePath();
            ctx.fill();
        }

        ctx.globalAlpha = 1;

        // Central core
        const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(0.4, '#dd88ff');
        coreGradient.addColorStop(1, '#aa00ff');

        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Quantum uncertainty ring
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        const ringSize = size * 2 + Math.sin(time * 8) * size * 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, ringSize, 0, Math.PI * 2);
        ctx.stroke();
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
