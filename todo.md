# Geometry 3044 - Todo

## Pågående
*Ingen pågående oppgaver*

## Neste
- [ ] Playteste med nye optimaliseringer - verifiser 60fps ved wave 5-10
- [ ] Teste at LOD-rendering ikke er visuelt forstyrrende
- [ ] Teste at off-screen culling ikke forårsaker pop-in
- [ ] Vurdere WebGL-migrering for grid/starfield (fremtidig)
- [ ] BulletPool batch-rendering (gruppere etter type for færre state changes)
- [ ] GridRenderer offscreen canvas pre-rendering
- [ ] Balansere vanskelighetsgrad etter feedback

## Bugs
- [ ] Verifiser at Path2D caching fungerer for alle fiendetyper
- [ ] Verifiser at nebula gradient cache invalideres korrekt

## Forbedringer
- [ ] Forbedre mobilkontroller
- [ ] Legge til flere fiendetyper med unike behaviors

## Teknisk gjeld
- [ ] Konsistent feilhåndtering i alle moduler
- [ ] Fullstendig dokumentasjon av alle public metoder

---

## Fullførte oppgaver

### 2026-02-10 (Deep Performance Audit & Optimization)
- [x] VHSEffect: Erstattet getImageData med drawImage (15-40ms besparelse)
- [x] VHSEffect: Cachet noise pattern (2-5ms besparelse)
- [x] Starfield: Cachet nebula-gradienter (8-15ms besparelse)
- [x] Starfield: Optimalisert stjerne-rendering (færre save/restore)
- [x] Enemy: Flocking-throttling ved 120+ fiender (4-8ms besparelse)
- [x] Enemy: LOD-rendering (3 nivåer basert på fiende-antall)
- [x] Enemy: Path2D caching for polygon-former
- [x] WaveManager: Fjernet filter()-allokering per frame
- [x] ParticleSystem: Pre-allokerte trail-objekter (eliminert GC)
- [x] ParticleSystem: Off-screen culling i draw
- [x] ParticleSystem: Konsolidert drawLine save/restore (6→2 kall)
- [x] ParticleSystem: Forenklet context resets
- [x] ParticleSystem: Økt intensityMultiplier 0.5→0.7, baseCount 50→70
- [x] BulletPool: Off-screen culling
- [x] main.js: In-place enemy/asteroid removal (O(n)→O(1))
- [x] main.js: SlowMotionSystem gating
- [x] main.js: Off-screen enemy culling i render
- [x] CollisionSystem: Økt cellSize 50→80
- [x] CollisionSystem: Gjenbrukbar getNearby buffer
- [x] config.js: Økt particle maxCount 500→800

### 2026-02-03 (Partikkelfikser)
- [x] Fjernet emitExhaustParticles()-kallet fra Player.js (partikler foran skip)
- [x] Redusert maxCount i config.js fra 1000 til 500
- [x] Aktivert reducedParticles og satt intensityMultiplier til 0.5
- [x] Redusert eksplosjon baseCount fra 120 til 50

### 2026-02-03 (Fjernet slowdown-hendelser)
- [x] Fjernet nearDeath slow motion check fra update()
- [x] Fjernet waveComplete slow motion trigger
- [x] Fjernet bossKill/bossSpawn slow motion trigger

### 2026-02-03 (Flere fiender)
- [x] Økt base fiender per wave (15→25)
- [x] Økt perWave scaling (7→12)
- [x] Økt bonus fiender (12→18)
- [x] Raskere spawn delay (min 12→6 frames)
- [x] Pair-spawn fra wave 1 (75% sjanse)
- [x] Triple-spawn fra wave 3 (65% sjanse)
- [x] Quad-spawn fra wave 6 (50% sjanse)
- [x] Quint-spawn fra wave 10 (40% sjanse)

### 2026-01-26 (FPS/Performance)
- [x] Cachet bullet angles i update() for å unngå Math.atan2 i draw()
- [x] Squared distance i BulletPool targeting (findNearestTarget, findChainTarget)
- [x] Squared distance i explosive bullet damage calculation
- [x] Deterministisk animasjon erstatter Math.random() i render-loop
- [x] O(1) impact removal i GridRenderer (swap-and-pop)
- [x] Replace-oldest strategi for impact overflow
- [x] Gjenbrukbare arrays i ParticleSystem._drawBatched()
- [x] Statisk glowTypes Set i ParticleSystem

### 2026-01-26 (Fiende-AI)
- [x] Implementert flocking/koordinerings-system for fiender
- [x] Implementert threat assessment (fiender reagerer på power-ups)
- [x] Forbedret aggressiveBehavior med flanking
- [x] Forbedret diveBehavior med bevegelsesprediksjion
- [x] Forbedret sniperBehavior med smartere strafing
- [x] Forbedret glitchBehavior med flanking-teleportering
- [x] Optimalisert med squared distance (erstatter Math.hypot)
- [x] Integrert flocking i WaveManager

### 2026-01-26 (Wave-optimering)
- [x] Økt fiender per wave (base 10→15, perWave 5→7, bonus 8→12)
- [x] Raskere spawn rate (delay 60→50, min 25→15)
- [x] Gruppe-spawn fra wave 2 (var 3), triple-spawn fra wave 7 (var 10)
- [x] Optimalisert UFOManager.js - in-place array cleanup
- [x] Optimalisert Enemy.js - in-place neonTrails cleanup
- [x] Optimalisert GrazingSystem.js - in-place effects cleanup
- [x] Laget agents.md med retningslinjer for logging og arbeidsflyt
- [x] Laget todo.md struktur

### Tidligere (se log.md for detaljer)
- [x] Fase 1-5: Komplett modularisering av kodebasen
- [x] Optimalisering: Circular buffers, squared distances, spatial hashing
- [x] Bug fix: Memory leak i BestiaryScreen
- [x] Particle system: Geometry Wars-style eksplosjoner

---

*Oppdater denne filen når oppgaver starter/fullføres*
