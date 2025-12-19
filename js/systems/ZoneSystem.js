/**
 * Geometry 3044 - Zone System
 * Dynamic "hot zones" on screen that give bonus points
 * Zones move and pulse with the music/gameplay
 */

export class ZoneSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        // Zone configuration
        this.zones = [];
        this.maxZones = 3;
        this.zoneMinRadius = 60;
        this.zoneMaxRadius = 120;
        this.zoneDuration = 300;        // Frames a zone lasts
        this.zoneSpawnInterval = 180;   // Frames between spawns
        this.spawnTimer = 60;           // Start with quick spawn

        // Zone bonuses
        this.baseBonus = 1.5;           // Base multiplier in zone
        this.maxBonus = 3.0;            // Max multiplier (center of zone)

        // Visual
        this.pulsePhase = 0;

        // Stats
        this.killsInZone = 0;
        this.bonusPointsEarned = 0;
    }

    /**
     * Resize the zone system
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
    }

    /**
     * Spawn a new zone at a strategic location
     */
    spawnZone() {
        if (this.zones.length >= this.maxZones) return;

        // Choose a random position (avoiding edges)
        const padding = this.zoneMaxRadius + 50;
        const x = padding + Math.random() * (this.width - padding * 2);
        const y = padding + Math.random() * (this.height - padding * 2);

        const radius = this.zoneMinRadius + Math.random() * (this.zoneMaxRadius - this.zoneMinRadius);

        // Choose a zone type
        const types = ['score', 'combo', 'danger'];
        const type = types[Math.floor(Math.random() * types.length)];

        const zone = {
            x, y,
            radius,
            type,
            life: this.zoneDuration,
            maxLife: this.zoneDuration,
            pulseOffset: Math.random() * Math.PI * 2,
            // Movement
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            // Color based on type
            color: this.getZoneColor(type),
            name: this.getZoneName(type)
        };

        this.zones.push(zone);
    }

    /**
     * Get zone color by type
     */
    getZoneColor(type) {
        switch (type) {
            case 'score': return '#00ffff';   // Cyan - score bonus
            case 'combo': return '#ff00ff';   // Magenta - combo bonus
            case 'danger': return '#ff0000';  // Red - high risk/reward
            default: return '#ffffff';
        }
    }

    /**
     * Get zone name by type
     */
    getZoneName(type) {
        switch (type) {
            case 'score': return 'SCORE ZONE';
            case 'combo': return 'COMBO ZONE';
            case 'danger': return 'DANGER ZONE';
            default: return 'BONUS ZONE';
        }
    }

    /**
     * Update zones
     */
    update(deltaTime = 1) {
        this.pulsePhase += 0.05 * deltaTime;

        // Spawn timer
        this.spawnTimer -= deltaTime;
        if (this.spawnTimer <= 0) {
            this.spawnZone();
            this.spawnTimer = this.zoneSpawnInterval;
        }

        // Update existing zones
        for (const zone of this.zones) {
            zone.life -= deltaTime;

            // Move zone slowly
            zone.x += zone.vx * deltaTime;
            zone.y += zone.vy * deltaTime;

            // Bounce off edges
            if (zone.x < zone.radius || zone.x > this.width - zone.radius) {
                zone.vx *= -1;
                zone.x = Math.max(zone.radius, Math.min(this.width - zone.radius, zone.x));
            }
            if (zone.y < zone.radius || zone.y > this.height - zone.radius) {
                zone.vy *= -1;
                zone.y = Math.max(zone.radius, Math.min(this.height - zone.radius, zone.y));
            }
        }

        // Remove expired zones
        this.zones = this.zones.filter(z => z.life > 0);
    }

    /**
     * Check if a position is in any zone and get bonus
     * @param {number} x - X position
     * @param {number} y - Y position
     * @returns {Object|null} Zone info with bonus multiplier, or null
     */
    getZoneBonus(x, y) {
        for (const zone of this.zones) {
            const dx = x - zone.x;
            const dy = y - zone.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < zone.radius) {
                // Calculate multiplier based on distance to center
                const centerBonus = 1 - (dist / zone.radius);
                const multiplier = this.baseBonus + (this.maxBonus - this.baseBonus) * centerBonus;

                // Type-specific bonuses
                let finalMultiplier = multiplier;
                if (zone.type === 'danger') {
                    finalMultiplier *= 1.5; // Danger zones give extra bonus
                }

                return {
                    zone,
                    multiplier: finalMultiplier,
                    type: zone.type,
                    distanceRatio: centerBonus
                };
            }
        }
        return null;
    }

    /**
     * Process a kill in a zone
     */
    processZoneKill(x, y, baseScore) {
        const zoneInfo = this.getZoneBonus(x, y);
        if (!zoneInfo) return { score: baseScore, inZone: false };

        this.killsInZone++;
        const bonusScore = Math.floor(baseScore * zoneInfo.multiplier);
        this.bonusPointsEarned += bonusScore - baseScore;

        return {
            score: bonusScore,
            inZone: true,
            zoneType: zoneInfo.type,
            multiplier: zoneInfo.multiplier,
            zone: zoneInfo.zone
        };
    }

    /**
     * Draw zones
     */
    draw(ctx) {
        ctx.save();

        for (const zone of this.zones) {
            const alpha = Math.min(1, zone.life / 30); // Fade out in last 30 frames
            const lifeRatio = zone.life / zone.maxLife;
            const pulse = 1 + Math.sin(this.pulsePhase + zone.pulseOffset) * 0.1;

            // Outer glow
            ctx.globalAlpha = alpha * 0.2;
            ctx.fillStyle = zone.color;
            ctx.shadowBlur = 40;
            ctx.shadowColor = zone.color;
            ctx.beginPath();
            ctx.arc(zone.x, zone.y, zone.radius * pulse * 1.2, 0, Math.PI * 2);
            ctx.fill();

            // Zone border
            ctx.globalAlpha = alpha * 0.6;
            ctx.strokeStyle = zone.color;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 20;
            ctx.setLineDash([10, 5]);

            ctx.beginPath();
            ctx.arc(zone.x, zone.y, zone.radius * pulse, 0, Math.PI * 2);
            ctx.stroke();

            // Inner rings
            ctx.globalAlpha = alpha * 0.3;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 10]);

            for (let r = 0.33; r < 1; r += 0.33) {
                ctx.beginPath();
                ctx.arc(zone.x, zone.y, zone.radius * r * pulse, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Center indicator
            ctx.globalAlpha = alpha * 0.8;
            ctx.setLineDash([]);
            ctx.fillStyle = zone.color;
            ctx.beginPath();
            ctx.arc(zone.x, zone.y, 5, 0, Math.PI * 2);
            ctx.fill();

            // Zone name
            ctx.globalAlpha = alpha * 0.9;
            ctx.font = 'bold 12px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = zone.color;
            ctx.shadowBlur = 10;
            ctx.fillText(zone.name, zone.x, zone.y - zone.radius - 10);

            // Multiplier text
            ctx.font = 'bold 16px "Courier New", monospace';
            ctx.fillText(`x${this.maxBonus.toFixed(1)}`, zone.x, zone.y);

            // Timer bar
            ctx.globalAlpha = alpha * 0.5;
            const barWidth = zone.radius * 1.5;
            const barHeight = 4;
            const barX = zone.x - barWidth / 2;
            const barY = zone.y + zone.radius + 15;

            ctx.fillStyle = '#333333';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            ctx.fillStyle = zone.color;
            ctx.fillRect(barX, barY, barWidth * lifeRatio, barHeight);
        }

        ctx.restore();
    }

    /**
     * Reset system
     */
    reset() {
        this.zones = [];
        this.spawnTimer = 60;
        this.killsInZone = 0;
        this.bonusPointsEarned = 0;
    }

    /**
     * Get stats
     */
    getStats() {
        return {
            activeZones: this.zones.length,
            killsInZone: this.killsInZone,
            bonusPointsEarned: this.bonusPointsEarned
        };
    }
}
