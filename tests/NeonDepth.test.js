import { FixedStepClock } from '../js/core/FixedStepClock.js';
import { BulletPool } from '../js/systems/BulletPool.js';
import { Railgun } from '../js/weapons/Railgun.js';
import { ChainLightning } from '../js/weapons/ChainLightning.js';
import { HomingMissileSystem } from '../js/weapons/HomingMissile.js';
import { GameModeManager } from '../js/systems/GameModeManager.js';

jest.mock('../js/rendering/GridRenderer.js', () => ({ addGridImpact: jest.fn() }));
import { CollisionSystem } from '../js/core/CollisionSystem.js';

const enemy = (x, y, hp = 20) => ({ x, y, hp, size: 12, active: true,
    takeDamage(amount) { this.hp -= amount; this.active = this.hp > 0; return !this.active; }
});
const player = { x: 450, y: 700, isAlive: true, canShoot: true };

describe('Display-independent simulation', () => {
    test.each([30, 60, 120, 144])('%i Hz produces 600 ticks in ten seconds', hz => {
        const clock = new FixedStepClock();
        let ticks = 0;
        for (let i = 0; i < hz * 10; i++) ticks += clock.advance(1000 / hz);
        expect(ticks).toBe(600);
    });
    test('tab stalls discard stale time; reset discards fractional pause time', () => {
        const clock = new FixedStepClock();
        clock.advance(8);
        expect(clock.advance(10000)).toBe(0);
        expect(clock.advance(10)).toBe(0);
        clock.reset();
        expect(clock.advance(10)).toBe(0);
        expect(clock.advance(NaN)).toBe(0);
    });
});

describe('Reusable spatial grid', () => {
    test('signed cell keys never alias within the playfield and off-screen margins', () => {
        const c = new CollisionSystem();
        const keys = new Set();
        for (let x = -4; x < 20; x++) for (let y = -4; y < 20; y++) keys.add(c.getCellKey(x * 80, y * 80));
        expect(keys.size).toBe(24 * 24);
    });
    test('rebuild reuses entries and cells, removing expired references', () => {
        const c = new CollisionSystem();
        const a = enemy(100, 100), b = enemy(800, 800);
        c.buildEnemySpatialHash({ enemies: [a] });
        const entry = c.getNearby(100, 100)[0];
        const cell = c.grid.values().next().value;
        c.buildEnemySpatialHash({ enemies: [b] });
        expect(c.getNearby(100, 100)).toHaveLength(0);
        expect(c.getNearby(800, 800)[0]).toBe(entry);
        expect(c.grid.values().next().value).toBe(cell);
        expect(entry.entity).toBe(b);
        c.reset();
        expect(entry.entity).toBeNull();
    });
    test('nearby candidates include every true circle collision at cell boundaries', () => {
        const c = new CollisionSystem();
        const enemies = [];
        for (let i = 0; i < 200; i++) enemies.push(enemy((i * 137) % 1000 - 50, (i * 83) % 1000 - 50));
        c.buildEnemySpatialHash({ enemies });
        for (let i = 0; i < 200; i++) {
            const bullet = { x: (i * 79) % 950, y: (i * 47) % 950, size: 5 };
            const nearby = c.getNearby(bullet.x, bullet.y, 1);
            for (const e of enemies) {
                if ((e.x - bullet.x) ** 2 + (e.y - bullet.y) ** 2 < 17 ** 2) {
                    expect(nearby.some(item => item.entity === e)).toBe(true);
                }
            }
        }
    });
});

describe('Turbo weapons', () => {
    test('faster shots affect only player bullets and reset on pool reuse', () => {
        const pool = new BulletPool(1);
        pool.speedMultiplier = 1.25;
        expect(pool.spawn(20, 20, 0, -10, true).vy).toBe(-12.5);
        expect(pool.spawn(20, 20, 0, 10, false).vy).toBe(10);
        expect(pool.spawn(20, 20, 0, -10, true).vy).toBe(-12.5);
    });
    test('railgun damages only the forward beam and supports sideways waves', () => {
        const damageEnemy = jest.fn();
        const r = new Railgun({ damageEnemy, canvas: { logicalWidth: 900 } });
        const front = enemy(450, 200), behind = enemy(450, 800), side = enemy(650, 700);
        r.fire(player, [front, behind, side]);
        expect(damageEnemy.mock.calls.map(c => c[0])).toEqual([front]);
        damageEnemy.mockClear();
        r.fire({ ...player, sidescrollerMode: true }, [front, behind, side]);
        expect(damageEnemy.mock.calls.map(c => c[0])).toEqual([side]);
    });
    test('special kills run through normal score and kill tracking exactly once', () => {
        const c = new CollisionSystem();
        const gs = { score: 0, combo: 0, sessionStats: { kills: 0 } };
        c.gameState = gs;
        c.trySpawnPowerUp = jest.fn();
        const target = enemy(450, 200, 10);
        const r = new Railgun({ damageEnemy(e, amount) {
            if (e.active && e.takeDamage(amount)) c.handleEnemyKill(e);
        } });
        r.fire(player, [target]);
        r.fire(player, [target]);
        expect(gs.score).toBe(100);
        expect(gs.sessionStats.kills).toBe(1);
    });
    test('chain resolves bounded hops without timers that could fire during pause', () => {
        const timer = jest.spyOn(global, 'setTimeout');
        const targets = Array.from({ length: 8 }, (_, i) => enemy(450, 680 - i * 25));
        const damageEnemy = jest.fn((e, amount) => e.takeDamage(amount));
        const chain = new ChainLightning({ damageEnemy });
        chain.trigger(450, 700, targets, 18);
        expect(damageEnemy).toHaveBeenCalledTimes(5);
        expect(new Set(damageEnemy.mock.calls.map(c => c[0])).size).toBe(5);
        expect(timer).not.toHaveBeenCalled();
        for (let i = 0; i < 12; i++) chain.update();
        expect(chain.arcs).toHaveLength(0);
        timer.mockRestore();
    });
    test('missiles recycle their object and trail after expiring', () => {
        const missiles = new HomingMissileSystem({ canvas: { logicalWidth: 900, logicalHeight: 900 } });
        const target = enemy(450, 100);
        missiles.fire(player, [target]);
        const first = missiles.missiles[0];
        const trail = first.trail[0];
        first.life = 1;
        missiles.update([target]);
        expect(missiles.missiles).toHaveLength(0);
        expect(first.target).toBeNull();
        missiles.cooldown = 0;
        missiles.fire(player, [target]);
        expect(missiles.missiles[0]).toBe(first);
        expect(first.trail[0]).toBe(trail);
    });
    test('Turbo is opt-in and Classic retains its standard settings', () => {
        global.localStorage = { getItem: () => null, setItem() {} };
        const modes = new GameModeManager();
        expect(modes.currentMode).toBe('classic');
        expect(modes.selectMode('turbo')).toBe(true);
        const gs = {};
        modes.initializeMode(gs);
        expect(gs.waveBreakMultiplier).toBe(0.55);
        modes.selectMode('classic');
        modes.initializeMode(gs);
        expect(gs.waveBreakMultiplier).toBe(1);
        expect(modes.getCurrentModeSettings().playerBulletSpeed).toBeUndefined();
    });
});

import { MobileControls } from '../js/ui/MobileControls.js';
describe('Short mobile bomb taps', () => {
    test('a complete press/release between frames is consumed exactly once', () => {
        global.window = { ontouchstart: null };
        const controls = new MobileControls({ addEventListener() {}, getBoundingClientRect: () => ({left:0,top:0,width:900,height:900}) });
        const touch = { identifier: 4, clientX: controls.bombButton.x, clientY: controls.bombButton.y };
        const event = { preventDefault() {}, changedTouches: [touch] };
        controls.handleTouchStart(event);
        controls.handleTouchEnd(event);
        expect(controls.isBombing()).toBe(false);
        expect(controls.consumeBombPress()).toBe(true);
        expect(controls.consumeBombPress()).toBe(false);
        controls.handleTouchStart(event);
        controls.resetState();
        expect(controls.consumeBombPress()).toBe(false);
    });
});

import { ParticleSystem } from '../js/systems/ParticleSystem.js';
test.each(['_drawDirect', '_drawBatched'])('%s uses the real playfield instead of cutting particles at 800x600', method => {
    const ps = new ParticleSystem();
    const visible = { active: true, x: 850, y: 850, type: 'default', draw: jest.fn() };
    const outside = { active: true, x: 1000, y: 1000, type: 'default', draw: jest.fn() };
    ps.particles = [visible, outside];
    ps[method]({ canvas: { logicalWidth: 900, logicalHeight: 900 } });
    expect(visible.draw).toHaveBeenCalledTimes(1);
    expect(outside.draw).not.toHaveBeenCalled();
});
