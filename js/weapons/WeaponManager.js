/**
 * Geometry 3044 - WeaponManager Module
 * Manages all special weapon systems
 */

import { CONFIG } from '../config.js';
import { config, gameState, particleSystem, bulletPool, enemyBulletPool, soundSystem } from '../globals.js';
import { ChainLightning } from './ChainLightning.js';
import { PlasmaBeam } from './PlasmaBeam.js';
import { Railgun } from './Railgun.js';
import { SpreadNova } from './SpreadNova.js';
import { HomingMissileSystem } from './HomingMissile.js';
import { BlackHoleGrenade } from './BlackHoleGrenade.js';
import { MirrorShield } from './MirrorShield.js';
import { DroneCompanionSystem } from './DroneCompanion.js';
import { TimeFracture } from './TimeFracture.js';
import { SynthwaveAnnihilator } from './SynthwaveAnnihilator.js';

export class WeaponManager {
    constructor() {
        // Initialize all weapon systems
        this.chainLightning = new ChainLightning();
        this.plasmaBeam = new PlasmaBeam();
        this.railgun = new Railgun();
        this.spreadNova = new SpreadNova();
        this.homingMissiles = new HomingMissileSystem();
        this.blackHole = new BlackHoleGrenade();
        this.mirrorShield = new MirrorShield();
        this.drones = new DroneCompanionSystem();
        this.timeFracture = new TimeFracture();
        this.synthwave = new SynthwaveAnnihilator();

        // Active special weapons (from powerups)
        this.activeWeapons = {
            chainLightning: false,
            plasmaBeam: false,
            railgun: false,
            spreadNova: false,
            homingMissiles: false,
            blackHole: false,
            mirrorShield: false,
            drones: false,
            timeFracture: false,
            synthwave: false
        };

        // Duration timers for timed weapons
        this.weaponTimers = {
            chainLightning: 0,
            plasmaBeam: 0,
            drones: 0
        };
    }

    /**
     * Activate a weapon by name
     */
    activateWeapon(weaponName, player) {
        switch(weaponName) {
            case 'chainLightning':
                this.activeWeapons.chainLightning = true;
                this.weaponTimers.chainLightning = 600; // 10 seconds
                break;
            case 'plasmaBeam':
                this.activeWeapons.plasmaBeam = true;
                this.plasmaBeam.activate();
                break;
            case 'railgun':
                this.railgun.startCharge();
                break;
            case 'spreadNova':
                this.spreadNova.fire(player);
                break;
            case 'homingMissiles':
                if (gameState && gameState.enemies) {
                    this.homingMissiles.fire(player, gameState.enemies);
                }
                break;
            case 'blackHole':
                // Black hole needs a target position (mouse or auto-aim)
                const targetX = player.x;
                const targetY = player.y - 200;
                this.blackHole.throw(player, targetX, targetY);
                break;
            case 'mirrorShield':
                this.mirrorShield.activate();
                break;
            case 'drones':
                this.activeWeapons.drones = true;
                this.drones.spawnDrones(player);
                break;
            case 'timeFracture':
                this.timeFracture.activate(player);
                break;
            case 'synthwave':
                this.synthwave.activate();
                break;
        }
    }

    /**
     * Fire railgun (called on key release after charging)
     */
    fireRailgun(player) {
        if (this.railgun.charging && gameState && gameState.enemies) {
            this.railgun.fire(player, gameState.enemies);
        }
    }

    /**
     * Update all weapon systems
     */
    update(player, enemies, keys) {
        // Update weapon timers
        if (this.weaponTimers.chainLightning > 0) {
            this.weaponTimers.chainLightning--;
            if (this.weaponTimers.chainLightning <= 0) {
                this.activeWeapons.chainLightning = false;
            }
        }

        // Update all weapon systems
        this.chainLightning.update();
        this.plasmaBeam.update(player, keys, enemies);
        this.railgun.update(player, enemies, keys);
        this.spreadNova.update();
        this.homingMissiles.update(enemies);
        this.blackHole.update(enemies, enemyBulletPool);
        this.mirrorShield.update(player, enemyBulletPool, enemies);
        this.drones.update(player, enemies);

        const timeEffects = this.timeFracture.update(player, enemies, enemyBulletPool);

        this.synthwave.update(enemies, enemyBulletPool);

        // Update active weapons status based on internal states
        this.activeWeapons.plasmaBeam = this.plasmaBeam.active;
        this.activeWeapons.mirrorShield = this.mirrorShield.active;
        this.activeWeapons.timeFracture = this.timeFracture.active;
        this.activeWeapons.synthwave = this.synthwave.active;
        this.activeWeapons.drones = this.drones.drones.length > 0;

        return timeEffects;
    }

    /**
     * Draw all active weapon effects
     */
    draw(ctx, player) {
        this.chainLightning.draw(ctx);
        this.plasmaBeam.draw(ctx, player);
        this.railgun.draw(ctx, player);
        this.spreadNova.draw(ctx);
        this.homingMissiles.draw(ctx);
        this.blackHole.draw(ctx);
        this.mirrorShield.draw(ctx, player);
        this.drones.draw(ctx, player);
        this.timeFracture.draw(ctx);
        this.synthwave.draw(ctx);
    }

    /**
     * Called when bullet hits enemy (for chain lightning)
     */
    onBulletHit(x, y, enemies, damage) {
        if (this.activeWeapons.chainLightning) {
            this.chainLightning.trigger(x, y, enemies, damage);
        }
    }

    /**
     * Get cooldown status for UI
     */
    getCooldowns() {
        return {
            railgun: this.railgun.cooldown,
            spreadNova: this.spreadNova.cooldown,
            homingMissiles: this.homingMissiles.cooldown,
            blackHole: this.blackHole.cooldown,
            mirrorShield: this.mirrorShield.cooldown,
            timeFracture: this.timeFracture.cooldown,
            synthwave: this.synthwave.cooldown
        };
    }

    /**
     * Check if a weapon is active
     */
    isWeaponActive(weaponName) {
        return this.activeWeapons[weaponName] || false;
    }

    /**
     * Reset all weapons (on game restart)
     */
    reset() {
        this.chainLightning = new ChainLightning();
        this.plasmaBeam = new PlasmaBeam();
        this.railgun = new Railgun();
        this.spreadNova = new SpreadNova();
        this.homingMissiles = new HomingMissileSystem();
        this.blackHole = new BlackHoleGrenade();
        this.mirrorShield = new MirrorShield();
        this.drones = new DroneCompanionSystem();
        this.timeFracture = new TimeFracture();
        this.synthwave = new SynthwaveAnnihilator();

        for (const key in this.activeWeapons) {
            this.activeWeapons[key] = false;
        }
        for (const key in this.weaponTimers) {
            this.weaponTimers[key] = 0;
        }
    }

    /**
     * Get stats for debugging
     */
    getStats() {
        return {
            activeWeapons: { ...this.activeWeapons },
            cooldowns: this.getCooldowns(),
            chainLightningArcs: this.chainLightning.arcs.length,
            activeMissiles: this.homingMissiles.missiles.length,
            activeGrenades: this.blackHole.grenades.length,
            activeDrones: this.drones.drones.length
        };
    }
}
