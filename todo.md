# Geometry 3044 - Todo

## Pågående
*Ingen pågående oppgaver*

## Neste
- [ ] Teste FPS-forbedringer med mange fiender og kuler
- [ ] Teste at fiende-AI forbedringer fungerer som forventet
- [ ] Balansere vanskelighetsgrad etter feedback

## Bugs
*Ingen kjente bugs for øyeblikket*

## Forbedringer
- [ ] Legge til flere partikkeleffekter
- [ ] Forbedre mobilkontroller
- [ ] Legge til flere fiendetyper med unike behaviors

## Teknisk gjeld
- [ ] Konsistent feilhåndtering i alle moduler
- [ ] Fullstendig dokumentasjon av alle public metoder

---

## Fullførte oppgaver

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
