/**
 * Geometry 3044 - Chain Lightning Weapon
 * Electric attack that hops between enemies
 */

import { CONFIG } from '../config.js';
import { config, particleSystem, soundSystem } from '../globals.js';

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

        // Play chain lightning zap sound with pitch variation based on hop
        const hopIndex = CHAIN_LIGHTNING.maxHops - hopsLeft;
        if (soundSystem && soundSystem.playChainLightningSound) {
            soundSystem.playChainLightningSound(hopIndex);
        }

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
            const time = Date.now() * 0.01;

            // Electric field background glow
            ctx.strokeStyle = `rgba(0, 150, 255, ${alpha * 0.15})`;
            ctx.lineWidth = 25;
            ctx.shadowBlur = 40;
            ctx.shadowColor = '#0088ff';
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            ctx.moveTo(arc.points[0].x, arc.points[0].y);
            for (let i = 1; i < arc.points.length; i++) {
                ctx.lineTo(arc.points[i].x, arc.points[i].y);
            }
            ctx.stroke();

            // Main outer glow - animated pulsing
            const pulseIntensity = 0.5 + Math.sin(time * 3) * 0.2;
            ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * pulseIntensity})`;
            ctx.lineWidth = 8 + Math.sin(time * 5) * 2;
            ctx.shadowBlur = 35;
            ctx.shadowColor = CHAIN_LIGHTNING.color;
            ctx.stroke();

            // Secondary electric layer
            ctx.strokeStyle = `rgba(100, 200, 255, ${alpha * 0.7})`;
            ctx.lineWidth = 4;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#66ccff';
            ctx.stroke();

            // Inner bright core - white hot center
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ffffff';
            ctx.stroke();

            // Draw branching mini-arcs at random points
            if (alpha > 0.3) {
                for (let i = 1; i < arc.points.length - 1; i++) {
                    if (Math.random() < 0.4) {
                        const p = arc.points[i];
                        const branchAngle = Math.random() * Math.PI * 2;
                        const branchLen = 15 + Math.random() * 25;

                        ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * 0.6})`;
                        ctx.lineWidth = 1.5;
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = '#00ffff';

                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        // Zigzag branch
                        const midX = p.x + Math.cos(branchAngle) * branchLen * 0.5 + (Math.random() - 0.5) * 10;
                        const midY = p.y + Math.sin(branchAngle) * branchLen * 0.5 + (Math.random() - 0.5) * 10;
                        ctx.lineTo(midX, midY);
                        ctx.lineTo(p.x + Math.cos(branchAngle) * branchLen, p.y + Math.sin(branchAngle) * branchLen);
                        ctx.stroke();
                    }
                }
            }

            // Draw energy nodes at each point
            for (let i = 0; i < arc.points.length; i++) {
                const p = arc.points[i];
                const nodeSize = i === 0 || i === arc.points.length - 1 ? 8 : 4;
                const nodeAlpha = alpha * (0.6 + Math.sin(time * 4 + i) * 0.4);

                // Node outer glow
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, nodeSize * 2);
                gradient.addColorStop(0, `rgba(255, 255, 255, ${nodeAlpha})`);
                gradient.addColorStop(0.3, `rgba(0, 255, 255, ${nodeAlpha * 0.8})`);
                gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(p.x, p.y, nodeSize * 2, 0, Math.PI * 2);
                ctx.fill();

                // Node core
                ctx.fillStyle = `rgba(255, 255, 255, ${nodeAlpha})`;
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#ffffff';
                ctx.beginPath();
                ctx.arc(p.x, p.y, nodeSize * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Electric arc particles along the path
            if (alpha > 0.5) {
                for (let i = 0; i < arc.points.length - 1; i++) {
                    const p1 = arc.points[i];
                    const p2 = arc.points[i + 1];
                    const particleCount = 2;

                    for (let j = 0; j < particleCount; j++) {
                        const t = Math.random();
                        const px = p1.x + (p2.x - p1.x) * t + (Math.random() - 0.5) * 8;
                        const py = p1.y + (p2.y - p1.y) * t + (Math.random() - 0.5) * 8;

                        ctx.fillStyle = `rgba(200, 255, 255, ${alpha * Math.random()})`;
                        ctx.shadowBlur = 8;
                        ctx.shadowColor = '#00ffff';
                        ctx.beginPath();
                        ctx.arc(px, py, 1 + Math.random() * 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
        }

        ctx.restore();
    }
}
