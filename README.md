# 🎮 Geometry 3044

Et retro-inspirert arcade shooter spill i stil med klassiske 80-talls arkadespill som Galaga, Tempest og Robotron.

![Geometry 3044](https://img.shields.io/badge/Status-Playable-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🕹️ Om Spillet

Geometry 3044 er et moderne take på klassiske arcade shooters, med:
- **Formation Flying Enemies** - Fiender som angriper i koordinerte formasjoner (Galaga-stil)
- **Boss Battles** - Ulike boss-typer med unike angrepsmønstre
- **Combo System** - Bygg opp combos for høyere score
- **Classic Continue System** - Coin-basert continue-system som i ekte arkadespill
- **Synthwave Aesthetic** - Neonfarger, starfield og retro-visuelt
- **Voice Samples** - Syntetiske stemmesamples som i 80-talls arkadespill

## 🎯 Kontroller

| Tast | Funksjon |
|------|----------|
| WASD/Piler | Bevegelse |
| Space | Skyt |
| Q | Auto-fire toggle |
| B | Bomb (clear screen) |
| C | Insert Coin |
| M | Mute/Unmute musikk |
| P | Pause |

## 🚀 Kom i Gang

### Spill Online
Bare åpne `index.html` i nettleseren din!

### Lokal Utvikling
```bash
# Klon repository
git clone https://github.com/Tombonator3000/3044.git
cd 3044

# Åpne i browser
open index.html  # Mac
start index.html # Windows
```

## 🎮 Spillmekanikk

### Poeng System
- Triangle Enemy: 100 poeng
- Square Enemy: 200 poeng  
- Pentagon Enemy: 300 poeng
- Formation Leader: +500 bonus
- Boss: 1000 × wave number

### Combo System
- Drep fiender etter hverandre uten pause for å bygge combo
- Combo multiplier øker score per kill
- Timeouten resettes ved hver kill

### Extra Lives
- Få 1 ekstra liv hver 100,000 poeng
- Maksimalt 5 liv

### Power-ups
- 🟡 **Weapon (W)**: Oppgrader våpen (max level 3)
- 🔵 **Shield (S)**: 3 hits beskyttelse
- 🟣 **Bomb (B)**: Ekstra bomb
- 🟠 **Rapid (R)**: Raskere ildrate
- ❤️ **Health**: Ekstra liv

## 🏗️ Kodestruktur
```
3044/
├── index.html
├── README.md
├── src/
│   ├── main.js              # Entry point
│   ├── game/
│   │   ├── Game.js          # Main game loop
│   │   ├── GameState.js     # Game state management
│   │   └── config.js        # Game configuration
│   ├── entities/
│   │   ├── Player.js        # Player class
│   │   ├── Enemy.js         # Enemy types
│   │   ├── Boss.js          # Boss battles
│   │   └── Bullet.js        # Projectiles
│   ├── systems/
│   │   ├── ParticleSystem.js
│   │   ├── SoundSystem.js
│   │   ├── WaveManager.js
│   │   ├── FormationManager.js
│   │   └── Starfield.js
│   ├── managers/
│   │   ├── InputManager.js
│   │   ├── UIManager.js
│   │   └── HighScoreManager.js
│   └── utils/
│       ├── collision.js
│       └── rendering.js
└── styles/
    └── main.css
```

## 🎨 Features

- ✅ Starfield background med parallax layers
- ✅ Formation flying enemies (V-formation, Sine Wave, Dive Bombers)
- ✅ 5 ulike boss-typer med unike mekanikker
- ✅ Coin-basert continue system
- ✅ High score leaderboard (localStorage)
- ✅ Attract mode (demo mode)
- ✅ Synthwave-inspirert design
- ✅ 8-bit voice samples
- ✅ Screen shake effekter
- ✅ Particle systems
- ✅ CRT monitor effekt

## 🔮 Planlagte Features

- [ ] Refaktorering til ES6 modules
- [ ] TypeScript migration
- [ ] Leaderboard backend (online highscores)
- [ ] Additional boss types
- [ ] Power-up combinations
- [ ] Achievement system
- [ ] Mobile touch controls optimization
- [ ] WebGL renderer for bedre performance
- [ ] Multiplayer co-op mode

## 🐛 Kjente Issues

Se [Issues](https://github.com/Tombonator3000/3044/issues) for aktuelle bugs og feature requests.

## 🤝 Bidra

Bidrag er velkomne! Se [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork prosjektet
2. Opprett din feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit dine endringer (`git commit -m 'Add some AmazingFeature'`)
4. Push til branchen (`git push origin feature/AmazingFeature`)
5. Åpne en Pull Request

## 📜 License

Dette prosjektet er lisensiert under MIT License - se [LICENSE](LICENSE) filen for detaljer.

## 🙏 Takk til

- Inspirert av klassiske arkadespill: Galaga, Tempest, Robotron 2084
- Synthwave aesthetic fra 80-tallet
- Retro gaming community

## 📧 Kontakt

Tombonator3000 - [@Tombonator3000](https://github.com/Tombonator3000)

Prosjekt Link: [https://github.com/Tombonator3000/3044](https://github.com/Tombonator3000/3044)

---

⭐ Hvis du liker prosjektet, gi det en stjerne på GitHub!
