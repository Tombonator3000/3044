# GEOMETRY 3044 - Komplett Designdokument

## Innholdsfortegnelse
1. [Oversikt](#oversikt)
2. [Teknologi og Kode](#teknologi-og-kode)
3. [Prosjektstruktur](#prosjektstruktur)
4. [Spillmekanikk](#spillmekanikk)
5. [Spillerskipet](#spillerskipet)
6. [Våpensystem](#våpensystem)
7. [Fiender og Bosser](#fiender-og-bosser)
8. [Power-ups](#power-ups)
9. [Lydsystem](#lydsystem)
10. [Visuelle Effekter](#visuelle-effekter)
11. [Brukergrensesnitt (UI/HUD)](#brukergrensesnitt-uihud)
12. [Spilltilstander](#spilltilstander)
13. [Ytelsesoptimalisering](#ytelsesoptimalisering)

---

## Oversikt

**GEOMETRY 3044** er et retroinspirert arkadespill i synthwave/80-talls stil. Spillet kombinerer klassisk shoot-em-up gameplay med moderne visuelle effekter, dype våpensystemer og progressiv vanskelighetsgrad.

### Hovedtrekk
- Bølgebasert fiendespawning med økende vanskelighetsgrad
- 10 unike spesialvåpen
- 12+ fiendetyper med distinkte oppførsler
- 5 forskjellige bosser som roterer
- 34 power-up typer fordelt på 5 sjeldenhetsgrader
- Prosedyralt genererte lydeffekter
- Retro CRT/VHS visuelle effekter
- Progressive Web App (PWA) støtte

---

## Teknologi og Kode

### Hovedteknologier

| Teknologi | Bruksområde |
|-----------|-------------|
| **Vanilla JavaScript (ES6)** | All spillogikk, modulbasert arkitektur |
| **HTML5 Canvas 2D** | All grafikk og rendering |
| **Web Audio API** | Prosedyral lydgenerering og musikkavspilling |
| **localStorage** | Lagring av highscores og innstillinger |
| **Service Worker** | PWA-funksjonalitet for offline-spill |

### Kodearkitektur

Spillet bruker **ES6 moduler** med tydelig separasjon av ansvar:

```javascript
// Eksempel på modulimport
import { GameState } from './core/GameState.js';
import { Player } from './entities/Player.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
```

### Viktige Kodemønstre

#### 1. Object Pooling
```javascript
// BulletPool.js - Forhåndsallokerer kuler for ytelse
class BulletPool {
    constructor(maxSize = 500) {
        this.pool = [];
        this.active = [];
        // Gjenbruker kuleobjekter istedenfor å opprette/slette
    }

    getBullet() {
        return this.pool.pop() || new Bullet();
    }

    returnBullet(bullet) {
        bullet.reset();
        this.pool.push(bullet);
    }
}
```

#### 2. Sentralisert Tilstandshåndtering
```javascript
// GameState.js - Single source of truth
const GameState = {
    score: 0,
    lives: 3,
    bombs: 3,
    combo: 0,
    wave: 1,
    isPlaying: false,
    isPaused: false,
    // ... alle spilldata samlet
};
```

#### 3. Konfigurasjonsdrevet Design
```javascript
// Fiender defineres via data, ikke kode
const ENEMY_CONFIG = {
    triangle: {
        hp: 1,
        size: 15,
        speed: 2.2,
        points: 100,
        behavior: 'aggressive'
    },
    // Lett å legge til nye fiendetyper
};
```

#### 4. Canvas Transformasjonsstakk
```javascript
// Effektiv rendering med save/restore
ctx.save();
ctx.translate(x, y);
ctx.rotate(angle);
// tegn relativt til senter
ctx.restore();
```

#### 5. Event-Drevet Arkitektur
```javascript
// Hovedloopen delegerer til undersystemer
function gameLoop(timestamp) {
    InputHandler.update();      // Håndter input
    WaveManager.update();       // Spawn fiender
    Player.update();            // Oppdater spiller
    Enemies.update();           // Oppdater fiender
    CollisionSystem.check();    // Kollisjonsdeteksjon
    ParticleSystem.update();    // Partikkeleffekter
    render();                   // Tegn alt
    requestAnimationFrame(gameLoop);
}
```

---

## Prosjektstruktur

```
/home/user/3044/
├── index.html                    # Hovedspillside
├── styles.css                    # Spillstyling
├── package.json                  # Prosjektmetadata
├── manifest.json                 # PWA-manifest
├── sw.js                         # Service Worker
│
├── /js/                          # Kildekode
│   ├── main.js                   # Inngangspunkt (30k+ linjer)
│   ├── config.js                 # Spillkonfigurasjon
│   ├── globals.js                # Global tilstand
│   │
│   ├── /core/                    # Kjernesystemer
│   │   ├── GameState.js          # Tilstandshåndtering
│   │   ├── GameLoop.js           # Hovedloop
│   │   ├── InputHandler.js       # Inputsystem
│   │   └── CollisionSystem.js    # Kollisjonsdeteksjon
│   │
│   ├── /entities/                # Spillobjekter
│   │   ├── Player.js             # Spillerkarakter
│   │   ├── Enemy.js              # Fiendetyper
│   │   ├── Boss.js               # Boss-kamper
│   │   ├── Bullet.js             # Prosjektiler
│   │   └── PowerUp.js            # Power-ups
│   │
│   ├── /weapons/                 # Spesialvåpen (10 typer)
│   │   ├── WeaponManager.js      # Våpensystemkontroller
│   │   ├── Railgun.js            # Ladet gjennomtrengende skudd
│   │   ├── ChainLightning.js     # Hoppende lynskade
│   │   ├── PlasmaBeam.js         # Kontinuerlig laserstråle
│   │   ├── SpreadNova.js         # Sirkulær kulespredning
│   │   ├── HomingMissile.js      # Søkende raketter
│   │   ├── BlackHoleGrenade.js   # Gravitasjonsbrønn-eksplosjon
│   │   ├── MirrorShield.js       # Reflekterende skjold
│   │   ├── DroneCompanion.js     # Orbiterende droner
│   │   ├── TimeFracture.js       # Saktefilm-sone
│   │   └── SynthwaveAnnihilator.js # Ultimat gridvåpen
│   │
│   ├── /systems/                 # Spillsystemer
│   │   ├── ParticleSystem.js     # Partikkeleffekter
│   │   ├── BulletPool.js         # Kulepooling
│   │   ├── SoundSystem.js        # Lyd (Web Audio API)
│   │   ├── MusicManager.js       # Musikkhåndtering
│   │   ├── WaveManager.js        # Bølgeprogresjon
│   │   ├── PowerUpManager.js     # Power-up system
│   │   ├── ShipManager.js        # Skiptilpasning
│   │   ├── GrazingSystem.js      # Bullet graze mekanikk
│   │   ├── RiskRewardSystem.js   # Risk/reward mekanikker
│   │   ├── SlowMotionSystem.js   # Tidsmanipulasjon
│   │   ├── ZoneSystem.js         # Sonebasert gameplay
│   │   ├── ReactiveMusicSystem.js# Dynamisk musikk
│   │   ├── GameModeManager.js    # Spillmodusvalg
│   │   ├── DailyChallengeSystem.js# Daglige utfordringer
│   │   └── AchievementSystem.js  # Prestasjonssporing
│   │
│   ├── /ui/                      # Brukergrensesnitt
│   │   ├── HUD.js                # Hoved-HUD system
│   │   ├── MenuManager.js        # Menysystem
│   │   ├── OptionsMenu.js        # Innstillingsmeny
│   │   ├── HUDThemes.js          # 4 temavalg
│   │   ├── MobileControls.js     # Touch-kontroller
│   │   ├── RadicalSlang.js       # 80-talls tekstpopups
│   │   └── /components/          # HUD-komponenter
│   │       ├── ScoreDisplay.js
│   │       ├── LivesDisplay.js
│   │       ├── WaveDisplay.js
│   │       ├── BombsDisplay.js
│   │       ├── ComboMeter.js
│   │       ├── BossHealthBar.js
│   │       ├── PowerUpSlots.js
│   │       ├── HighScoreDisplay.js
│   │       └── PerformanceMonitor.js
│   │
│   ├── /effects/                 # Visuelle effekter
│   │   ├── Starfield.js          # 5-lags stjernefelt
│   │   ├── Explosions.js         # 80-talls eksplosjonseffekter
│   │   ├── ParticleSystem.js     # Partikler (12+ typer)
│   │   ├── CRTEffect.js          # CRT-monitoreffekt
│   │   ├── VHSEffect.js          # VHS/analoge effekter
│   │   ├── VHSGlitch.js          # Glitch-effekter
│   │   └── RadicalSlang.js       # Radical 80s slang
│   │
│   ├── /rendering/               # Rendering
│   │   └── GridRenderer.js       # Bølgende gridbakgrunn
│   │
│   └── /utils/                   # Verktøy
│       ├── DrawUtils.js          # Tegnehjelpere
│       ├── Logger.js             # Debug-logging
│       └── index.js
│
├── /assets/
│   └── /audio/
│       ├── Menu.mp3              # Menymusikk (6.3 MB)
│       └── game1.mp3             # Spillmusikk (3.8 MB)
│
└── /icons/                       # PWA-ikoner
```

---

## Spillmekanikk

### Kjernegameplay Loop

1. **Bølgesystem** - Fiender spawner i økende vanskelige bølger
2. **Formasjonsflyging** - Fiender angriper i koordinerte mønstre
3. **Boss-kamper** - Hver 5. bølge dukker det opp en spesiell boss
4. **Combo-system** - Å drepe fiender fortløpende bygger multiplikatorer
5. **Power-ups** - Samlbare gjenstander som modifiserer spillerevner
6. **Liv & Continues** - Klassisk arkade continue-system med credits

### Vanskelighetsgrader

| Innstilling | Fiender | Hastighet | Skuddrate | Poeng | Liv |
|-------------|---------|-----------|-----------|-------|-----|
| **Easy** | 50% | 60% | 2.0x tregere | 50% | 5 |
| **Normal** | 100% | 100% | 1.0x | 100% | 3 |
| **Hard** | 150% | 140% | 43% raskere | 150% | 2 |
| **Extreme** | 200% | 180% | 100% raskere | 300% | 1 |

### Bølgeprogresjon

- **Baseformel**: `10 + (wave × 5) + (wave/5 × 8)` fiender
- Spawn-rate øker over bølger (60 frames → 15 frames minimum)
- Sidescroller-modus på bølge 4, 9, 14, 19, 24, 29
- Boss hver 5. bølge (5, 10, 15, 20, 25, 30...)

### Poengsystem

| Kilde | Poeng |
|-------|-------|
| Triangle-fiende | 100 + combo-multiplikator |
| Square-fiende | 200 + combo-multiplikator |
| Pentagon-fiende | 300 + combo-multiplikator |
| Formasjonsleder | +500 bonus |
| Boss | 1000 × bølgenummer |
| Ekstra liv | Hver 100.000 poeng (maks 9 liv) |

---

## Spillerskipet

### Grunnleggende Egenskaper

| Egenskap | Verdi | Beskrivelse |
|----------|-------|-------------|
| **Størrelse** | 20 piksler | Rendret som geometrisk form |
| **Hastighet** | 5.5 base | Justerbar per vanskelighetsgrad |
| **Skuddrate** | 10 frames | Kan forbedres med power-ups |
| **Uovervinnelig varighet** | 180 frames | Etter respawn |
| **Maks våpennivå** | 5 | Kan oppgradere basisvåpen |
| **Skjoldhelse** | 0-9 treff | Samles via power-ups |
| **Respawn-forsinkelse** | 60 frames | Etter død |
| **Skjermomslutning** | Ja | Asteroids-stil wrapping |

### Kontroller

| Handling | Standardtaster | Alternativ |
|----------|----------------|------------|
| Beveg opp | W / ↑ | - |
| Beveg ned | S / ↓ | - |
| Beveg venstre | A / ← | - |
| Beveg høyre | D / → | - |
| Skyt | Space / Z | - |
| Bombe | X / Shift | - |
| Auto-skyt toggle | Q | - |
| Pause | P / ESC | - |
| Mute musikk | M | - |
| Sett inn mynt | C | - |

### Mobilkontroller

| Handling | Touch-område |
|----------|--------------|
| Joystick | Berør venstre område |
| Skyt-knapp | Berør høyre område |
| Bombe-knapp | Berør nederst til høyre |

### Spesielle Evner

- **Basisskudd** - Kontinuerlig strøm av kuler
- **Auto-skyt modus** - Toggle for automatisk skyting
- **Bomber** - Tøm skjermen for fiender/kuler (3 initialt)
- **Skjold** - Absorberer opptil 3 treff (midlertidig)
- **Skjermomslutning** - Bevegelse wrapper rundt skjermkanter

### Forbedrede Egenskaper (via power-ups)

- Laserbeam-angrep
- Søkende kuler
- Spredningsskudd
- Gjennomtrengende kuler
- Sprettende kuler
- Kjedelynangrep
- Speilskip (dobbeltskudd)
- Nova-klar tilstand
- Vortex-effekt
- Omega-modus (forbedret)
- Spøkelsesmodus (uovervinnelig)
- Kvante-modus (flere skudd)
- Plasma-modus
- Matrix-modus (trege fiender)
- Uendelighetsmodus
- Gud-modus (ultimat)
- Fever-modus (fiender flykter)

---

## Våpensystem

### Basisvåpen

| Egenskap | Verdi |
|----------|-------|
| Skuddrate | 10 frames per skudd |
| Skade | 1 poeng per treff |
| Nivåer | 5 (spredning øker) |

### 10 Spesialvåpen

#### 1. Railgun
> Ladet gjennomtrengende skudd

| Egenskap | Verdi |
|----------|-------|
| **Cooldown** | 10 sekunder |
| **Ladetid** | 45 frames |
| **Skade** | 50 per skudd |
| **Egenskaper** | Gjennomtrenger alle fiender |
| **Visuelt** | Lilla stråle med hvit kjerne |
| **Lyd** | Distinkt ladelyd |

#### 2. Chain Lightning
> Hoppende lynskade mellom fiender

| Egenskap | Verdi |
|----------|-------|
| **Varighet** | 10 sekunder aktiv |
| **Maks hopp** | 5 hopp |
| **Rekkevidde** | 180 piksler |
| **Skade** | 100 base, 70% per hopp |
| **Egenskaper** | Auto-kjeder til nærmeste fiende |
| **Visuelt** | Cyan buer mellom mål |
| **Lyd** | Zap-lyder med tonehøydevariasjon |

#### 3. Plasma Beam
> Kontinuerlig laserstråle

| Egenskap | Verdi |
|----------|-------|
| **Varighet** | 8 sekunder (480 frames) |
| **Skade** | 2 per frame |
| **Strålebredde** | 8 piksler |
| **Maks lengde** | 800 piksler |
| **Rotasjonshastighet** | 0.03 rad/frame (A/D taster) |
| **Ladetid** | 30 frames før avfyring |
| **Visuelt** | Magenta stråle med pulserende kjerne |

#### 4. Spread Nova
> Sirkulær kulespredning

| Egenskap | Verdi |
|----------|-------|
| **Cooldown** | 60 frames |
| **Kuler** | 16 i sirkel |
| **Hastighet** | 8 px/frame |
| **Skade** | 15 per kule |
| **Visuelt** | Gul ekspanderende nova-ring |
| **Effekt** | Umiddelbar 360° dekning |

#### 5. Homing Missiles
> Selvstyrende raketter

| Egenskap | Verdi |
|----------|-------|
| **Cooldown** | 45 frames |
| **Maks aktive** | 4 missiler |
| **Hastighet** | 6 px/frame |
| **Svingrate** | 0.08 rad/frame |
| **Skade** | 30 per missil |
| **Levetid** | 300 frames |
| **Visuelt** | Oransje raketter med haler |
| **AI** | Auto-sikter på nærmeste fiende |

#### 6. Black Hole Grenade
> Gravitasjonsbrønn-eksplosjon

| Egenskap | Verdi |
|----------|-------|
| **Cooldown** | 5 sekunder |
| **Varighet** | 2 sekunder trekking |
| **Trekkradius** | 200 piksler |
| **Trekkstyrke** | 3 px/frame |
| **Eksplosjonsskade** | 100 |
| **Eksplosjonsradius** | 150 piksler |
| **Visuelt** | Lilla vortex-effekt |
| **Faser** | Flyvende → Trekkende → Eksploderende |

#### 7. Mirror Shield
> Reflekterende skjold

| Egenskap | Verdi |
|----------|-------|
| **Varighet** | 3 sekunder (180 frames) |
| **Cooldown** | 600 frames |
| **Refleksjonsradius** | 50 piksler |
| **Refleksjonsskade** | 2× original |
| **Form** | Heksagon (6 sider) |
| **Visuelt** | Cyan roterende skjold |
| **Effekt** | Omdirigerer fiendekuler tilbake |

#### 8. Drone Companions
> Orbiterende støttedroner

| Egenskap | Verdi |
|----------|-------|
| **Varighet** | 15 sekunder |
| **Maks droner** | 2 orbiterende |
| **Orbitradius** | 60 piksler |
| **Skuddrate** | 30 frames |
| **Kulehastighet** | 10 px/frame |
| **Skade** | 8 per kule |
| **Visuelt** | Grønne droner med cyan thrustere |
| **AI** | Auto-skyter på fiender |

#### 9. Time Fracture
> Saktefilm-sone

| Egenskap | Verdi |
|----------|-------|
| **Varighet** | 5 sekunder (300 frames) |
| **Cooldown** | 900 frames |
| **Radius** | 250 piksler |
| **Fiendebremsing** | 0.2× hastighet (80% treg) |
| **Spillerboost** | 1.5× hastighet |
| **Visuelt** | Blå forvrengningssone med gridlinjer |
| **Effekt** | Bullet-time sone rundt spilleren |

#### 10. Synthwave Annihilator (ULTIMAT)
> Ultimat gridvåpen

| Egenskap | Verdi |
|----------|-------|
| **Varighet** | 3 sekunder (180 frames) |
| **Cooldown** | 1800 frames |
| **Gridskade** | 5 per frame |
| **Gridavstand** | 60 piksler |
| **Visuelt** | Animert neongrid med pulsbølger |
| **Effekt** | Kontinuerlig skader fiender på gridlinjer |
| **Sjeldenhet** | Legendarisk våpen |

---

## Fiender og Bosser

### Grunnleggende Fiendetyper

#### 1. Triangle (Scout)
> Rask fiende med aggressiv oppførsel

| Egenskap | Verdi |
|----------|-------|
| **HP** | 1 |
| **Størrelse** | 15 |
| **Hastighet** | 2.2 + 0.18/bølge |
| **Poeng** | 100 + 15/bølge |
| **Oppførsel** | Aggressiv |
| **Skuddrate** | 120 frames |
| **Rolle** | Raskt "cannon fodder" |

#### 2. Square (Heavy)
> Tøff, pansret fiende

| Egenskap | Verdi |
|----------|-------|
| **HP** | 3 + 0.5/bølge |
| **Størrelse** | 25 |
| **Hastighet** | 1.5 + 0.08/bølge |
| **Poeng** | 200 + 25/bølge |
| **Oppførsel** | Patruljering |
| **Skuddrate** | 180 frames |
| **Spesialt** | Skjold ved høy intelligens |
| **Rolle** | Tøff/tank-aktig |

#### 3. Pentagon (Sniper)
> Farlig langdistansefiende

| Egenskap | Verdi |
|----------|-------|
| **HP** | 2 + 1/3 bølge |
| **Størrelse** | 20 |
| **Hastighet** | 1.2 + 0.05/bølge |
| **Poeng** | 300 + 35/bølge |
| **Oppførsel** | Sniper |
| **Skuddrate** | 200 frames |
| **Kulehastighet** | 8 + 0.8/bølge |
| **Spesialt** | Sikteprediksjson, burst fire |
| **Rolle** | Farlig på avstand |

#### 4. Dive Bomber
> Kamikaze-angriper

| Egenskap | Verdi |
|----------|-------|
| **HP** | 2 |
| **Størrelse** | 18 |
| **Hastighet** | 0.5 (sakte bevegelse) |
| **Poeng** | 250 + 30/bølge |
| **Oppførsel** | Stukangrep |
| **Stukhastighet** | 12 + 0.5/bølge |
| **Rolle** | Kamikaze-angrep |

#### 5. Sine Wave (Elite)
> Mønsterbasert trussel

| Egenskap | Verdi |
|----------|-------|
| **HP** | 4 + 0.5/bølge |
| **Størrelse** | 22 |
| **Hastighet** | 2 + 0.1/bølge |
| **Poeng** | 400 + 50/bølge |
| **Oppførsel** | Sinusbølgemønster |
| **Spesialt** | Spredningskulemønster |
| **Rolle** | Mønsterbasert trussel |

### 8-Bit Inspirerte Fiender

#### 6. Pixel Invader (Bølge 3+)
> Klassisk Galaga-stil fiende med retro pikselert utseende og formasjonsflyging.

#### 7. Ghost Byte (Bølge 5+)
> Gjennomsiktig, svevende fiende som varierer transparens og har unnvikende bevegelse.

#### 8. Laser Disc (Bølge 7+)
> Spinnende diskform med laserkulemønster og orbital oppførsel.

#### 9. Pixel Skull (Bølge 10+)
> Faseskiftende hodeskalle-fiende som toggler mellom synlig/faset med glødeeffekter på øynene.

#### 10. VHS Tracker (Bølge 12+)
> Glitchy teleporterende fiende med CRT-forvrengningseffekter og uforutsigbar bevegelse.

#### 11. Arcade Boss (Bølge 15+)
> Mini-boss type med økt HP/stats og spesielle mønstre.

#### 12. Synthwave Enemy (Bølge 9+)
> Pulserende neonfarger med synthwave-estetikk og dynamiske visuelle effekter.

### Fiendeskalering

- HP skalerer med bølge: `baseHP + (bølgenummer × 0.2)`
- Hastighet øker med bølge
- Skuddrate forbedres (kortere cooldowns)
- Kulehastighet øker
- Unnvikelsessjanse øker med intelligensnivå
- Fiendeantall skalerer med vanskelighetsgrad

---

### Boss-kamper

> Hver 5. bølge (Bølge 5, 10, 15, 20, 25, 30...)

#### 1. THE GUARDIAN (Cyan/Blå)

| Egenskap | Verdi |
|----------|-------|
| **Form** | Heksagon |
| **Størrelse** | 60 |
| **Maks HP** | 100 × (1 + 0.2 × bølge) |
| **Hastighet** | 2 |
| **Poeng** | 5000 × ceil(bølge/5) |
| **Skjold** | 50 HP |
| **Angrep** | Spredning, Laser, Spiral |
| **Trekk** | Har reflekterende skjold |

#### 2. THE DESTROYER (Rød/Oransje)

| Egenskap | Verdi |
|----------|-------|
| **Form** | Firkant |
| **Størrelse** | 80 (størst) |
| **Maks HP** | 150 × (1 + 0.2 × bølge) |
| **Hastighet** | 1.5 |
| **Poeng** | 7500 × ceil(bølge/5) |
| **Angrep** | Sperrild, Missiler, Slam |
| **Trekk** | Høy skade, aggressiv |

#### 3. THE PHANTOM (Lilla/Magenta)

| Egenskap | Verdi |
|----------|-------|
| **Form** | Trekant |
| **Størrelse** | 50 (minst) |
| **Maks HP** | 80 × (1 + 0.2 × bølge) |
| **Hastighet** | 4 (raskest) |
| **Poeng** | 6000 × ceil(bølge/5) |
| **Kan teleportere** | Ja |
| **Angrep** | Blink, Klone, Vortex |
| **Trekk** | Høy mobilitet |

#### 4. THE MOTHERSHIP (Gul/Oransje)

| Egenskap | Verdi |
|----------|-------|
| **Form** | Diamant |
| **Størrelse** | 100 (største) |
| **Maks HP** | 200 × (1 + 0.2 × bølge) |
| **Hastighet** | 1 (tregest) |
| **Poeng** | 10000 × ceil(bølge/5) |
| **Skjold** | 100 HP |
| **Kan spawne minions** | Ja |
| **Angrep** | Spawn, Stråle, Nova |
| **Trekk** | Støtte/invokasjonstype |

#### 5. THE OVERLORD (Gull/Rosa - ULTIMAT)

| Egenskap | Verdi |
|----------|-------|
| **Form** | Stjerne |
| **Størrelse** | 90 |
| **Maks HP** | 250 × (1 + 0.2 × bølge) |
| **Hastighet** | 2.5 |
| **Poeng** | 15000 × ceil(bølge/5) |
| **Skjold** | 75 HP |
| **Kan teleportere OG spawne** | Ja |
| **Angrep** | Alle mønstre |
| **Trekk** | Kombinerer alle evner |

### Boss-mekanikker

- **3 angrepsfaser** (100%, 60%, 30% HP)
- Faser trigger skjermristing og visuelle effekter
- Skadeflash-feedback når truffet
- Dødssekvens med eksplosjoner og partikler
- Inngangsanimasjon (glir ned fra toppen)
- Rotasjon og pulserende visuell feedback
- Boss-helseindikator vises i HUD
- Angrepsmønstre endres per fase

---

## Power-ups

### Totalt 34 Power-up Typer (5 Nivåer)

### Nivå 1: COMMON (68% sjanse)

| Power-up | Symbol | Effekt |
|----------|--------|--------|
| **Weapon** | Grønn W | Oppgrader basisvåpennivå (maks 5) |
| **Shield** | Cyan S | Legg til 3 skjoldpoeng |
| **Bomb** | Oransje B | Ekstra bombe for skjermtømming |
| **Points** | $ | 1000 × bølge poengbonus |
| **Speed** | Magenta > | Hastighetsboost (midlertidig) |

### Nivå 2: UNCOMMON (22% sjanse)

| Power-up | Symbol | Varighet | Effekt |
|----------|--------|----------|--------|
| **Laser** | Rød L | 45 sek | Rød laserstrålevåpen |
| **Spread** | Oransje * | 45 sek | Flerretningsskudd |
| **Homing** | Cyan H | 45 sek | Selvsøkende kuler |
| **Magnet** | Rosa M | 45 sek | Tiltrekk power-ups |
| **Auto-Fire** | Grønn A | 45 sek | Automatisk skyting |
| **Life** | Rød ♥ | - | Ekstra liv |

### Nivå 3: RARE (8% sjanse)

| Power-up | Symbol | Varighet | Effekt |
|----------|--------|----------|--------|
| **Pierce** | Grønn → | 45 sek | Kuler gjennomtrenger fiender |
| **Bounce** | Gul ◊ | 45 sek | Kuler spretter av vegger |
| **Chain** | Lilla ⚡ | 45 sek | Lyn hopper mellom fiender |
| **Freeze** | Cyan ❄ | 5 sek | Frys alle fiender |
| **Mirror** | Blå ◑ | 45 sek | Speilskip dobbeltskudd |
| **Vortex** | Grønn ◉ | 45 sek | Trekkende vortex-effekt |

### Nivå 4: EPIC (1.5% sjanse)

| Power-up | Symbol | Varighet | Effekt |
|----------|--------|----------|--------|
| **Nova** | Gul ✦ | - | Eksplosiv utbrudd |
| **Omega** | Rød Ω | 10 sek | Forbedret modus |
| **Ghost** | Lilla 👻 | 8 sek | Uovervinnelighet |
| **Quantum** | Lilla Q | 8 sek | Flere skudd samtidig |
| **Plasma** | Rosa P | 8 sek | Plasmaeffekter |
| **Matrix** | Grønn ▣ | 10 sek | Trege fiender |

### Nivå 5: LEGENDARY (<0.3% sjanse)

| Power-up | Symbol | Varighet | Effekt |
|----------|--------|----------|--------|
| **Fever Mode** | Rosa ★ | 15 sek | Fiender flykter, +2 poengemultiplikator |
| **Infinity** | Gull ∞ | 10 sek | Ubegrenset ammunisjon |
| **God Mode** | Hvit ✧ | 15 sek | Uovervinnelig + rask + uendelig |

### Power-up Visning

- Størrelse øker med nivå
- Fargekoding etter sjeldenhet
- Pulserende glødeeffekt
- Roterende animasjon
- Nivåindikatorprikker (1-5)
- Blinkende advarsel når den utløper

### Combo-system

7 spesielle combo-effekter ved riktig power-up kombinasjon:

| Combo | Ingredienser | Effekt |
|-------|--------------|--------|
| **PULSE CANNON** | Laser + Speed | Rask laserkraft |
| **DEATH BLOSSOM** | Spread + Homing | Søkende spredningsskudd |
| **CHAIN LIGHTNING** | Chain + Pierce | Gjennomtrengende lyn |
| **BLACK HOLE** | Vortex + Nova | Gravitasjonseksplosjon |
| **TIME WARP** | Matrix + Ghost | Udødelig saktefilm |
| **ARMAGEDDON** | Omega + Infinity | Ubegrenset kraft |
| **ASCENSION** | God + Fever | Ultimat kraft |

---

## Lydsystem

### Musikk

| Fil | Størrelse | Bruk |
|-----|-----------|------|
| **Menu.mp3** | 6.3 MB | Menymusikk |
| **game1.mp3** | 3.8 MB | Spillmusikk |

### Musikksystem

- **Reaktiv musikk**: Justerer tempo/intensitet basert på gameplay
- **Volumkontroll**: Separate volumer for musikk/lydeffekter
- **Kryssfading**: Jevn overgang mellom spor

### Lydeffekter (Prosedyralt Generert)

Alle lydeffekter genereres i sanntid ved hjelp av Web Audio API:

#### 1. Spillerskudd
```javascript
{
    type: 'sine/square',
    frequency: 880,
    duration: 0.08,
    attack: 0.01,
    decay: 0.07,
    pitchDecay: 0.5
}
```

#### 2. Fiendeskudd
```javascript
{
    type: 'sawtooth',
    frequency: 440,
    duration: 0.1,
    attack: 0.01,
    decay: 0.09,
    pitchDecay: 0.3
}
```

#### 3. Liten Eksplosjon
```javascript
{
    type: 'noise',
    duration: 0.2,
    filterStart: 2000,
    filterEnd: 100,
    attack: 0.01,
    decay: 0.19
}
```

#### 4. Stor Eksplosjon
```javascript
{
    type: 'noise',
    duration: 0.5,
    filterStart: 3000,
    filterEnd: 50,
    attack: 0.02,
    decay: 0.48
}
```

#### 5. Spillerdød
```javascript
{
    type: 'sawtooth (fallende)',
    frequency: 200,
    duration: 0.6,
    pitchDecay: 0.9 // synkende tone
}
```

#### 6. Power-up Samlet
```javascript
{
    type: 'sine (stigende)',
    frequency: 440,
    duration: 0.3,
    pitchDecay: -0.5 // stigende tone
}
```

#### 7. Bombeaktivering
```javascript
{
    type: 'sine (lavfrekvent)',
    frequency: 100,
    duration: 0.8,
    attack: 0.1
}
```

#### 8. Railgun Ladelyd
- Egendefinert stigende tone
- Tonehøyde øker med lading

#### 9. Chain Lightning Zap
- Tonehøyde varierer med hoppnummer
- Skarp attack-envelope

#### 10. Plasma Beam Loop
- Kontinuerlig summing mens aktiv

### Lydarkitektur

```javascript
// Web Audio API struktur
AudioContext
    └── MasterGainNode (master volum)
        ├── SFXGainNode (lydeffekter)
        │   ├── OscillatorNode (sine/square/sawtooth)
        │   └── NoiseSource (hvit støy)
        └── MusicGainNode (musikk)
            └── AudioBufferSourceNode (MP3)
```

### Lydfunksjoner

- Lydpooling (5 per lydtype for overlapping)
- Master/SFX/Musikk gain nodes
- Prosedyral generering (ingen forhåndsinnspilte filer unntatt musikk)
- Dynamisk tonehøydevariasjon
- ADSR-lignende envelope-kontroll

---

## Visuelle Effekter

### Stjernefelt (5 Lag)

| Lag | Stjerner | Hastighet | Beskrivelse |
|-----|----------|-----------|-------------|
| 1 | 60 | 0.1-0.3 | Fjerne små stjerner |
| 2 | 50 | 0.3-0.6 | Fjerne stjerner |
| 3 | 40 | 0.6-1.0 | Mellomavstand |
| 4 | 30 | 1.0-1.5 | Nære stjerner |
| 5 | 15 | 1.5-2.5 | Lyse nære stjerner |

- Parallakse-scrolling effekt
- Blinkende animasjon
- Flere stjernefarger

### Tåkesky (Nebulae)

- 4 hovedtåkeskyer (8 fjerne)
- Store uskarpe radiale gradienter
- Subtil fargelagdeling
- Sakte drivende bevegelse

### Eksplosjoner

| Egenskap | Verdi |
|----------|-------|
| **Type** | Episk 80-talls stil |
| **Partikler** | 20-40 per eksplosjon |
| **Sjokkbølger** | 2-3 ekspanderende ringer |
| **Gnister** | 12 partikkelhaler |
| **Rusk** | Flyvende fragmenter |
| **Varighet** | 90 frames |
| **Farger** | Hvit, Gul, Oransje, Rød |

### Partikkeltyper (12+)

1. **Spark** - Skarpe retningsbestemte partikler
2. **Trail** - Glatte følgende haler
3. **Explosion** - Radiale utbruddspartikler
4. **Glow** - Myke glødende partikler
5. **Debris** - Tunge fallende fragmenter
6. **Score** - Flytende teksttall
7. **Shockwave** - Ekspanderende ringer
8. **Pixel** - 8-bit stilblokker
9. **Ring** - Sirkulære ringer
10. **Lightning** - Taggete lyn
11. **Fire** - Flammeeffekt
12. **Smoke** - Oppløsende skyer
13. **Star** - Blinkende stjerner

### Partikkelfunksjoner

- Pool-basert allokering (maks 1000)
- Hastighetsbasert bevegelse
- Friksjon og gravitasjonsfysikk
- Rotasjonsanimasjon
- Størrelsskalering med levetid
- Fargeoverganger
- Alpha fade-out
- Ytelsesoptimert

### Visuelle Temaer (6 Bølgetemaer)

| Bølge | Temanavn | Primær | Sekundær | Aksent |
|-------|----------|--------|----------|--------|
| 1 | MIAMI VICE | #ff0080 | #00ffff | #ff00ff |
| 2 | TRON LEGACY | #00ffff | #ff8000 | #0080ff |
| 3 | OUTRUN | #ff0066 | #ffff00 | #ff3300 |
| 4 | BLADE RUNNER | #0088ff | #ff0044 | #00ff88 |
| 5 | AKIRA | #ff0000 | #ffcc00 | #ff6600 |
| 6 | GHOST IN SHELL | #00ff66 | #00ccff | #66ffcc |

### Skjermeffekter

#### CRT-effekt
- Scanlines (4px avstand, 4% alpha)
- Kromatisk aberrasjon (RGB-forskyvning)
- Tilfeldig flimring (2% sjanse)
- Horisontale forvrengningslinjer
- Vignettmørkning

#### VHS-effekt
- Scanline-animasjon
- Fargestøybuffer
- Glitch-effekter
- Kromatisk aberrasjon
- Frame-hopping animasjon

#### Skjermristing

| Intensitet | Styrke | Frames |
|------------|--------|--------|
| Lett | 3 | 10 |
| Medium | 8 | 20 |
| Tung | 15 | 30 |
| Massiv | 25 | 45 |

#### Grid Renderer
- Bølgende perspektivgrid
- Farge som matcher bølgetema
- Y-akse bølgende animasjon
- Fargetonerotasjon

---

## Brukergrensesnitt (UI/HUD)

### 4 Velgbare Temaer

1. **Classic Arcade** - Tradisjonell arkadestil
2. **Synthwave Neon** - Neon 80-talls estetikk
3. **8-Bit Retro** - Pikselert retrostil
4. **Cyberpunk** - Futuristisk tech-look

### HUD-komponenter

#### 1. Poengvisning
- Gjeldende øktpoeng
- Combo-multiplikatorindikator
- Poeng-popup animasjoner (+100, +500 tekst)

#### 2. Livvisning
- Hjertikoner (maks 9)
- Visuell feedback ved tap
- Ekstra liv milepælindikator

#### 3. Bølgevisning
- Gjeldende bølgenummer
- Temanavn (for første 6 bølger)
- Bølgeprogresjonsbar

#### 4. Bombevisning
- Bombeantall (0-9)
- Visuelle ikonindikatorer
- Cooldown-timer

#### 5. Combo Meter
- Combo-antallvisning
- Multiplikatorverdi (1x - 10x+)
- Combo timeout-progresjon
- Visuell fade-inn/ut

#### 6. Boss-helseindikator
- Vises når boss er aktiv
- Fasefargendringer
- Skadeflash-feedback
- Boss-navnetikett

#### 7. Power-up Slots
- Vis aktive midlertidige krefter
- Gjenværende varighetslinjer
- Power-up ikon/farge
- Stabling-indikatorer

#### 8. High Score-visning
- Personlig beste sporing
- Sammenlign nåværende vs. beste
- Ny highscore-highlight

#### 9. Multiplikator-popup
- Flytende tekst nær spilleren
- "×2", "×5", etc. indikatorer
- Animert skalaeffekt

#### 10. Ytelsesmonitor (Valgfri)
- FPS-visning
- Enhetsantall
- Partikkelantall
- Debug info toggle

---

## Spilltilstander

### Tilstandsdiagram

```
ATTRACT MODE (Tittelskjerm)
    ↓ (Trykk Start / Hvilken som helst tast)
FULL MENY
    ├→ START GAME → SPILLER
    ├→ SELECT SHIP → SKIPVALG → (tilbake til meny)
    ├→ GAME MODE → MODUSVALG → (tilbake til meny)
    ├→ OPTIONS → INNSTILLINGER → (tilbake til meny)
    └→ HIGH SCORES → HIGHSCORE-LISTE → (tilbake til meny)

SPILLER
    ├→ (P-tast) PAUSET
    │   └→ FORTSETT eller HOVEDMENY
    └→ GAME OVER
        ├→ (Ny highscore?) POENGREGISTRERING
        │   └→ HIGHSCORE-LISTE
        ├→ FORTSETTE? (hvis credits tilgjengelig)
        │   ├→ (Ja) SPILLER (nytt liv)
        │   └→ GAME OVER-SKJERM
        └→ GAME OVER-SKJERM
            ├→ SPILL IGJEN → SPILLER (start på nytt)
            └→ HOVEDMENY → ATTRACT MODE
```

### Skjermtilstander

#### 1. Attract Mode (Meny)
- Tittel: "GEOMETRY 3044"
- High score-visning
- "PRESS START" tekst
- "C: INSERT COIN" hint
- Blinkende animasjoner
- Roterende historiefortellinger

#### 2. Full Meny
- START GAME
- SELECT SHIP
- GAME MODE
- OPTIONS
- Daily Challenge
- Achievements
- High Scores
- Credits-visning

#### 3. In-Game
- Poeng (øverst til venstre)
- Liv (øverst til høyre)
- Bølge (øverst i midten)
- Bomber (nederst til venstre)
- Combo meter (høyre side)
- Boss-helseindikator (hvis aktiv)
- Power-up status
- Mini ytelsesstatistikk

#### 4. Pauset
- PAUSED overlay
- Fortsett/Meny knapper
- Innstillinger tilgjengelig

#### 5. Game Over
- "GAME OVER MAN"
- Sluttpoeng
- Bølge nådd
- Maks Combo
- Spill Igjen / Hovedmeny knapper

#### 6. High Score-registrering
- "NEW HIGH SCORE!"
- Poengvisning
- 3-bokstavs initialregistrering
- Send-knapp

#### 7. High Score-liste
- Topp 10 poeng
- Navninitialer
- Poengverdi
- Dato (valgfritt)

#### 8. Continue-skjerm
- Sluttpoeng
- Nedtellingstimer (10s)
- Credits gjenværende
- Kostnad for neste credit
- Kjøp Credit-prompt (C-tast)

#### 9. Innstillingsmeny
- Lyd: Lydeffekter Av/På
- Lyd: Musikk Av/På
- Visuelt: VHS-effekt
- Visuelt: Scanlines
- Gameplay: Skjermristing
- Gameplay: Partikkelintensitet
- Vanskelighetsgrad: Easy/Normal/Hard/Extreme

---

## Ytelsesoptimalisering

### Tekniske Spesifikasjoner

| Egenskap | Verdi |
|----------|-------|
| **Canvas-størrelse** | 900×900 logisk (responsiv skalering) |
| **Mål-FPS** | 60 |
| **Partikkelgrense** | 1000 maks |
| **Kulepool** | 500+ kuler |
| **Fiendegrense** | Skalerer med bølge |
| **Frame-tid** | 16.67ms mål |

### Optimaliseringsfunksjoner

#### Object Pooling
```javascript
// Unngår Garbage Collection-pauser
class BulletPool {
    constructor(maxSize) {
        this.pool = new Array(maxSize);
        this.activeCount = 0;
    }
    // Gjenbruker objekter istedenfor å opprette nye
}
```

#### Spatial Hashing for Kollisjoner
```javascript
// Grid-basert kollisjonsdeteksjon
class SpatialHash {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.cells = new Map();
    }
    // O(n) istedenfor O(n²) kollisjonssjekker
}
```

#### Mobiloptimalisering
```javascript
// Automatisk deteksjon og tilpasning
const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
if (isMobile) {
    particleCount *= 0.5;      // Reduser partikler
    disableVHSEffect = true;    // Deaktiver tunge effekter
    optimizeGridSize = true;    // Optimer kollisjongrid
}
```

#### Effekttoggler
- CRT-effekt kan slås av
- VHS-effekt kan slås av
- Partikkelintensitet justerbar
- Skjermristing kan deaktiveres

#### Frame Skipping
```javascript
// Hopp over frames ved lav ytelse
if (deltaTime > 32) { // mer enn 2 frames bak
    skipRender = true;
    updateOnlyEssentials();
}
```

---

## Oppsummering

**GEOMETRY 3044** er et omfattende moderne arkadespill som kombinerer:

- **Klassisk gameplay** med bølgebasert progresjon og arkademekanikker
- **Moderne teknologi** med Web Audio API og Canvas 2D
- **Dybde våpensystem** med 10 unike spesialvåpen
- **Variert fiendekatalog** med 12+ fiendetyper og 5 bosser
- **Rik power-up system** med 34 typer og combo-muligheter
- **Prosedyral lyd** generert i sanntid
- **Retro estetikk** med CRT, VHS og synthwave-effekter
- **Ytelsesoptimert** kode med object pooling og spatial hashing

Kodebasen er godt organisert med klar separasjon av ansvar, noe som gjør den vedlikeholdbar og utvidbar for fremtidig utvikling.

---

*Dokumentet oppdatert: 2025*
*Versjon: 1.0*
