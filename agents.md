# Agent Guide - Geometry 3044

## Oversikt

Dette dokumentet beskriver retningslinjer for AI-agenter som jobber på Geometry 3044-prosjektet.

---

## Logging til log.md

**ALT arbeid skal logges til `log.md`.**

### Hva skal logges:

1. **Dato** - Start hver ny økt med `## Date: YYYY-MM-DD`
2. **Oversikt** - Kort beskrivelse av hva som ble gjort
3. **Endringer implementert** - Detaljert liste over alle endringer:
   - Filnavn og linjenummer
   - Før/etter kodeeksempler
   - Forklaring på hvorfor endringen ble gjort
4. **Filer endret** - Liste over alle filer som ble modifisert
5. **Testing** - Hvordan endringene kan testes
6. **Bugs funnet** - Eventuelle problemer oppdaget
7. **Neste steg** - Hva som gjenstår

### Log-format:

```markdown
## Date: 2026-01-26

---

# TITTEL PÅ ARBEID

## Oversikt
Kort beskrivelse av arbeidet.

## Endringer implementert

### 1. Filnavn.js - Beskrivelse
**Problem**: Hva var problemet
**Løsning**: Hvordan det ble løst

```javascript
// FØR:
gammel kode

// ETTER:
ny kode
```

## Filer endret
- `sti/til/fil.js` - Kort beskrivelse

## Testing
- [ ] Test 1
- [ ] Test 2

---
```

---

## Todo.md - Oppgaveliste

**`todo.md` skal brukes for pågående og fremtidige oppgaver.**

### Hva skal til todo.md:

1. **Aktive oppgaver** - Det som jobbes med nå
2. **Planlagte oppgaver** - Det som skal gjøres snart
3. **Bugs** - Kjente feil som må fikses
4. **Forbedringer** - Ønsket funksjonalitet
5. **Teknisk gjeld** - Refaktorering som trengs

### Todo-format:

```markdown
# Geometry 3044 - Todo

## Pågående
- [ ] Oppgave som jobbes med nå

## Neste
- [ ] Neste oppgave
- [ ] Enda en oppgave

## Bugs
- [ ] Bug beskrivelse (fil:linje)

## Forbedringer
- [ ] Forbedring som ønskes

## Teknisk gjeld
- [ ] Refaktorering som trengs
```

### Regler for todo.md:

- Marker fullførte oppgaver med `[x]`
- Flytt fullførte oppgaver til log.md med detaljer
- Hold listen oppdatert under arbeidet
- Prioriter oppgaver (øverst = høyest prioritet)

---

## Arbeidsflyt

### Ved start av ny økt:

1. Les `agents.md` (dette dokumentet)
2. Les `log.md` for kontekst om tidligere arbeid
3. Les `todo.md` for aktive oppgaver
4. Start logging i `log.md` med dagens dato

### Under arbeidet:

1. Oppdater `todo.md` når oppgaver starter/fullføres
2. Logg alle endringer til `log.md` kontinuerlig
3. Test endringer før du går videre
4. Commit regelmessig med beskrivende meldinger

### Ved slutten av økten:

1. Oppdater `log.md` med fullstendig oversikt
2. Oppdater `todo.md` med status
3. Commit og push alle endringer

---

## Prosjektstruktur

```
3044/
├── agents.md          <- Dette dokumentet
├── log.md             <- Utviklingslogg (ALLTID oppdater)
├── todo.md            <- Oppgaveliste
├── index.html         <- Hovedfil
├── js/
│   ├── config.js      <- Konfigurasjon og temaer
│   ├── main.js        <- Hovedspillløkke
│   ├── entities/      <- Spillobjekter (Player, Enemy, Boss, PowerUp)
│   ├── systems/       <- Systemer (BulletPool, WaveManager, ParticleSystem)
│   ├── effects/       <- Visuelle effekter (Starfield, VHS, RadicalSlang)
│   ├── core/          <- Kjernefunksjonalitet (CollisionSystem, GameLoop)
│   ├── rendering/     <- Renderingsfunksjoner (GridRenderer)
│   └── ui/            <- Brukergrensesnitt (HUD, Menus)
└── assets/            <- Bilder, lyder, etc.
```

---

## Viktige konvensjoner

### Kode:

- ES6 moduler med `import`/`export`
- Ingen global state - pass parametere eksplisitt
- Kommentarer på norsk eller engelsk
- Konsistent formattering

### Git:

- Commit ofte med beskrivende meldinger
- Branch-navn: `claude/<beskrivelse>-<id>`
- Push til feature branch, ikke main

### Navngiving:

- Klasser: PascalCase (`ParticleSystem`)
- Funksjoner/variabler: camelCase (`updatePlayer`)
- Konstanter: UPPER_SNAKE_CASE (`MAX_PARTICLES`)
- Filer: PascalCase for klasser (`Player.js`), camelCase for utilities

---

## Vanlige oppgaver

### Legge til ny fiende:

1. Opprett i `js/entities/Enemy.js` eller ny fil
2. Legg til i `WaveManager.js` for spawning
3. Oppdater `CollisionSystem.js` om nødvendig
4. Test og logg til `log.md`

### Legge til ny effekt:

1. Opprett i `js/effects/` eller legg til i `ParticleSystem.js`
2. Eksporter fra `js/effects/index.js`
3. Importer og bruk i `main.js`
4. Test og logg til `log.md`

### Fikse bug:

1. Beskriv buggen i `log.md`
2. Finn årsaken (logg funnene)
3. Implementer fix
4. Test at det fungerer
5. Oppdater `log.md` med løsningen

---

## Huskeliste

- [ ] Les alltid kontekst før du starter
- [ ] Logg ALT til log.md
- [ ] Hold todo.md oppdatert
- [ ] Test endringer
- [ ] Commit regelmessig
- [ ] Ikke bryt eksisterende funksjonalitet
- [ ] Spør om noe er uklart

---

*Sist oppdatert: 2026-01-26*
