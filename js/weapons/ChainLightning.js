/**
 * Geometry 3044 - Chain Lightning Weapon
 * Electric attack that hops between enemies
 */

import { CONFIG } from '../config.js';
import { config, particleSystem } from '../globals.js';

const CHAIN_LIGHTNING = {
    name: 'CHAIN LIGHTNING',
    duration: 600,           // 10 seconds at 60fps
    maxHops: 5,
    hopRange: 180,           // pixels
    damageDecay: 0.7,        // 70% damage per hop
    arcDuration: 12,         // frames arc is visible
    color: '#00ffff',
    glowColor: '#00ffff'
};

export class ChainLightning {
    constructor() {
        this.arcs = [];
        this.maxArcs = 20;  // Pool size
    }

    /**
     * Trigger chain lightning from a hit position
     */
    trigger(startX, startY, enemies, initialDamage) {
        this.chainToNextEnemy(startX, startY, enemies, initialDamage, CHAIN_LIGHTNING.maxHops, []);
    }

    /**
     * Recursively chain to next enemy
     */
    chainToNextEnemy(x, y, enemies, damage, hopsLeft, hitEnemies) {
        if (hopsLeft <= 0 || damage < 1) return;

        // Find nearest UNHIT enemy
        let nearest = null;
        let nearestDist = CHAIN_LIGHTNING.hopRange;

        for (const enemy of enemies) {
            if (!enemy.active || hitEnemies.includes(enemy)) continue;
            const dist = Math.hypot(enemy.x - x, enemy.y - y);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = enemy;
            }
        }

        if (!nearest) return;

        // Create arc
        this.createArc(x, y, nearest.x, nearest.y);

        // Apply damage
        if (nearest.takeDamage) {
            nearest.takeDamage(damage);
        } else {
            nearest.hp -= damage;
            if (nearest.hp <= 0) nearest.active = false;
        }

        hitEnemies.push(nearest);

        // Create impact sparks
        this.createImpactSparks(nearest.x, nearest.y);

        // Chain to next (with delay for visual effect)
        setTimeout(() => {
            this.chainToNextEnemy(
                nearest.x, nearest.y,
                enemies,
                damage * CHAIN_LIGHTNING.damageDecay,
                hopsLeft - 1,
                hitEnemies
            );
        }, 40);
    }

    /**
     * Create a lightning arc between two points
     */
    createArc(x1, y1, x2, y2) {
        const arc = {
            points: this.generateZigzag(x1, y1, x2, y2),
            life: CHAIN_LIGHTNING.arcDuration,
            maxLife: CHAIN_LIGHTNING.arcDuration,
            active: true
        };
        this.arcs.push(arc);

        // Cleanup old arcs
        if (this.arcs.length > this.maxArcs) {
            this.arcs = this.arcs.filter(a => a.active);
        }
    }

    /**
     * Generate zigzag points for lightning effect
     */
    generateZigzag(x1, y1, x2, y2) {
        const points = [{x: x1, y: y1}];
        const numSegments = 6 + Math.floor(Math.random() * 4);
        const dx = x2 - x1;
        const dy = y2 - y1;
        const perpX = -dy;
        const perpY = dx;
        const len = Math.hypot(perpX, perpY);

        if (len === 0) {
            points.push({x: x2, y: y2});
            return points;
        }

        for (let i = 1; i < numSegments; i++) {
            const t = i / numSegments;
            const offset = (Math.random() - 0.5) * 40;
            points.push({
                x: x1 + dx * t + (perpX / len) * offset,
                y: y1 + dy * t + (perpY / len) * offset
            });
        }
        points.push({x: x2, y: y2});
        return points;
    }

    /**
     * Create spark particles at impact point
     */
    createImpactSparks(x, y) {
        if (particleSystem) {
            particleSystem.sparks(x, y, CHAIN_LIGHTNING.color, 10);
        }
    }

    /**
     * Update all arcs
     */
    update() {
        this.arcs = this.arcs.filter(arc => {
            arc.life--;
            arc.active = arc.life > 0;
            return arc.active;
        });
    }

    /**
     * Draw all active arcs
     */
    draw(ctx) {
        if (this.arcs.length === 0) return;

        ctx.save();

        for (const arc of this.arcs) {
            if (!arc.active || arc.points.length < 2) continue;

            const alpha = arc.life / arc.maxLife;

            // Outer glow
            ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * 0.5})`;
            ctx.lineWidth = 6;
            ctx.shadowBlur = 25;
            ctx.shadowColor = CHAIN_LIGHTNING.color;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            ctx.moveTo(arc.points[0].x, arc.points[0].y);
            for (let i = 1; i < arc.points.length; i++) {
                ctx.lineTo(arc.points[i].x, arc.points[i].y);
            }
            ctx.stroke();

            // Inner bright core
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffffff';
            ctx.stroke();
        }

        ctx.restore();
    }
}
