
You are my coding assistant for the HTML5 canvas arcade shooter **Geometry 3044**.

# NON-NEGOTIABLE RULES (Anti-Reset)
- DO NOT rewrite the project from scratch.
- DO NOT convert to any framework (no Phaser/Unity/etc.). Keep it plain HTML + Canvas + JS.
- Preserve the existing game loop, file structure, and function names unless I explicitly ask to change them.
- Only modify the sections I ask for. If unsure, explain tradeoffs — do not reset the codebase.
- Return changes as focused patches (before/after or clearly marked replacements), not full-file rewrites unless I explicitly request a full file.
- Keep variable and function names stable to avoid breaking other parts.
- If you add new code, clearly state **where** to insert it.

# CURRENT VISION (Design Highlights)
- Controls: WASD/Arrows to move, Space to shoot, B to bomb; 3 lives; bombs clear screen with radial bullets.
- Combo System with 80s slang text: RADICAL!, TUBULAR!, GNARLY!, BODACIOUS!, WICKED!, AWESOME!, RIGHTEOUS!, GROOVY!, FAR OUT! — shown based on combo chain.
- Attract Mode after 15s inactivity: AI plays demo, rotating promo texts every 2s, any key exits to play.
- Visuals: neon glow, screen shake on damage, particle explosions, scrolling grid background, glowing UI.
- Progression: wave-based, scaling difficulty, extra life every 100,000, weapon upgrades (single→double→triple), local high score.
- Mobile: responsive canvas, touch joystick + fire/bomb buttons.
- Advanced stretch: particle physics, CRT/scanline/chromatic aberration look, dynamic weather/lightning, procedural star field, screen warp + bullet time.

# HOW TO RESPOND
- First: summarize the requested change and list the functions you will touch.
- Then: provide **minimal diffs** only for those functions/blocks. Use this format:

  // BEFORE
  function shootBullet() { ... }

  // AFTER
  function shootBullet() {
    // fixed bullet lifetime + pooling
  }

- If adding new modules/helpers, place them near similar code and say: “Insert below <marker>”.
- Include quick sanity tests (what to check in the browser) after your patch.

# IMPORTANT QUALITY RULES
- Optimize: use object pooling for bullets/particles, avoid per-frame allocations, prefer AABB for collisions.
- Avoid layout thrash; draw with batched Canvas ops, minimal save/restore.
- Keep requestAnimationFrame loop clean: update(); draw(); requestAnimationFrame(...).
- Make bullets/enemies auto-clean when off-screen; never let sprites “hang” visually.
- Ensure consistent delta-time usage for movement.
- Provide guardrails for mobile (larger tap areas, option to reduce effect density).

# TASK PIPELINE EXAMPLES (use one at a time, incremental)
1) Fix bullets: ensure they disappear off-screen or after impact; no ghosting; pool bullets.
2) Ensure enemies spawn consistently per wave; add zig-zag + circle patterns; pool enemies.
3) Add combo system + 80s slang overlays with fade/scale pop.
4) Add particle explosions with pooling and neon glow (shadowBlur/shadowColor).
5) Implement attract mode with an AI that moves to nearest enemy centroid and shoots periodically; rotate promo texts.
6) Add bosses every 5 waves with distinct patterns.
7) Add powerups (shield, rapid-fire, bomb refill, double-score).
8) Add CRT/scanline overlay & optional chromatic aberration shader (2D canvas trick).

# HERE IS THE CURRENT CODE (single file)
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Geometry 3044 - Enhanced</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #000;
            overflow: hidden;
            font-family: 'Courier New', monospace;
            touch-action: none;
            user-select: none;
            width: 100vw;
            height: 100vh;
            position: fixed;
        }

        // Enhanced Particle System
        class ParticleSystem {
            constructor() {
                this.particles = [];
            }
            
            addMuzzleFlash(x, y, direction, color) {
                for (let i = 0; i < 3; i++) {
                    const angle = direction + (Math.random() - 0.5) * 0.3;
                    const speed = 2 + Math.random() * 2;
                    this.particles.push(new MuzzleParticle(
                        x + Math.cos(direction) * 10,
                        y + Math.sin(direction) * 10,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        color
                    ));
                }
                this.particles.push(new GlowParticle(x, y, color, 15));
            }
            
            addGlassShards(x, y, color, count = 8) {
                for (let i = 0; i < count; i++) {
                    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
                    const speed = 3 + Math.random() * 4;
                    this.particles.push(new ShardParticle(
                        x, y,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        color
                    ));
                }
            }
            
            addExplosion(x, y, color, count = 15) {
                for (let i = 0; i < count; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 8 + 2;
                    this.particles.push(new ExplosionParticle(
                        x, y,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        color
                    ));
                }
            }
            
            update() {
                this.particles = this.particles.filter(particle => {
                    particle.update();
                    return particle.active;
                });
            }
            
            draw(ctx) {
                this.particles.forEach(particle => particle.draw(ctx));
            }
        }

        // Enhanced Particle Classes
        class EnhancedParticle {
            constructor(x, y, vx, vy, color, life) {
                this.x = x;
                this.y = y;
                this.vx = vx;
                this.vy = vy;
                this.color = color;
                this.life = life;
                this.maxLife = life;
                this.active = true;
            }
            
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.life--;
                
                if (this.life <= 0) {
                    this.active = false;
                }
            }
        }

        class MuzzleParticle extends EnhancedParticle {
            constructor(x, y, vx, vy, color) {
                super(x, y, vx, vy, color, 8);
                this.size = 3;
            }
            
            update() {
                super.update();
                this.vx *= 0.9;
                this.vy *= 0.9;
            }
            
            draw(ctx) {
                const alpha = this.life / this.maxLife;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;
                
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        class ShardParticle extends EnhancedParticle {
            constructor(x, y, vx, vy, color) {
                super(x, y, vx, vy, color, 40);
                this.rotation = Math.random() * Math.PI * 2;
                this.rotationSpeed = (Math.random() - 0.5) * 0.3;
                this.size = Math.random() * 4 + 2;
            }
            
            update() {
                super.update();
                this.vy += 0.2; // Gravity
                this.vx *= 0.98; // Air resistance
                this.rotation += this.rotationSpeed;
            }
            
            draw(ctx) {
                const alpha = this.life / this.maxLife;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 1;
                ctx.shadowBlur = 5;
                ctx.shadowColor = this.color;
                
                ctx.beginPath();
                ctx.moveTo(0, -this.size);
                ctx.lineTo(-this.size * 0.6, this.size * 0.6);
                ctx.lineTo(this.size * 0.6, this.size * 0.6);
                ctx.closePath();
                ctx.stroke();
                
                ctx.globalAlpha = alpha * 0.5;
                ctx.fillStyle = this.color;
                ctx.fill();
                
                ctx.restore();
            }
        }

        class GlowParticle extends EnhancedParticle {
            constructor(x, y, color, size) {
                super(x, y, 0, 0, color, 10);
                this.size = size;
            }
            
            draw(ctx) {
                const alpha = this.life / this.maxLife;
                ctx.save();
                ctx.globalAlpha = alpha * 0.3;
                
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
                gradient.addColorStop(0, this.color);
                gradient.addColorStop(0.5, this.color + '80');
                gradient.addColorStop(1, this.color + '00');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
                
                ctx.restore();
            }
        }

        class ExplosionParticle extends EnhancedParticle {
            constructor(x, y, vx, vy, color) {
                super(x, y, vx, vy, color, 30);
                this.size = Math.random() * 3 + 1;
                this.gravity = 0.1;
                this.bounce = 0.7;
                this.friction = 0.98;
            }
            
            update() {
                // Apply physics
                this.vy += this.gravity; // Gravity
                this.vx *= this.friction; // Air resistance
                this.vy *= this.friction;
                
                this.x += this.vx;
                this.y += this.vy;
                
                // Bounce off ground
                if (this.y > config.height - this.size) {
                    this.y = config.height - this.size;
                    this.vy *= -this.bounce;
                    this.vx *= this.bounce;
                }
                
                // Bounce off walls
                if (this.x < this.size || this.x > config.width - this.size) {
                    this.vx *= -this.bounce;
                    this.x = Math.max(this.size, Math.min(config.width - this.size, this.x));
                }
                
                this.life--;
                if (this.life <= 0) {
                    this.active = false;
                }
            }
            
            draw(ctx) {
                const alpha = this.life / this.maxLife;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 8;
                ctx.shadowColor = this.color;
                
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
        
        #gameCanvas {
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            width: 100vw !important;
            height: 100vh !important;
            image-rendering: crisp-edges;
            object-fit: cover;
        }
        
        #menuScreen {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at center, #000033 0%, #000011 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #00ffff;
            z-index: 10;
        }
        
        .title-container {
            position: relative;
            margin-bottom: 60px;
        }
        
        .title-line {
            font-size: 72px;
            font-weight: bold;
            text-align: center;
            letter-spacing: 8px;
            margin: 0;
            line-height: 1.2;
            position: relative;
        }
        
        .title-line.geometry {
            color: #00ffff;
            text-shadow: 
                0 0 20px #00ffff,
                0 0 40px #00ffff,
                0 0 60px #00ffff;
            animation: pulseBlue 2s ease-in-out infinite;
        }
        
        .title-line.year {
            color: #ff00ff;
            text-shadow: 
                0 0 20px #ff00ff,
                0 0 40px #ff00ff,
                0 0 60px #ff00ff;
            animation: pulsePink 2s ease-in-out infinite 0.5s;
        }
        
        @keyframes pulseBlue {
            0%, 100% {
                transform: scale(1);
                filter: brightness(1);
            }
            50% {
                transform: scale(1.02);
                filter: brightness(1.3);
            }
        }
        
        @keyframes pulsePink {
            0%, 100% {
                transform: scale(1);
                filter: brightness(1);
            }
            50% {
                transform: scale(1.02);
                filter: brightness(1.3);
            }
        }
        
        .menu-button {
            padding: 15px 40px;
            margin: 10px;
            font-size: 20px;
            background: none;
            color: #00ffff;
            border: 2px solid #00ffff;
            cursor: pointer;
            transition: all 0.3s;
            text-transform: uppercase;
            letter-spacing: 2px;
            box-shadow: 0 0 10px #00ffff;
        }
        
        .menu-button:hover {
            background: #00ffff;
            color: #000;
            box-shadow: 0 0 20px #00ffff, 0 0 40px #00ffff;
            transform: scale(1.05);
        }
        
        #gameUI {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 5;
            display: none;
        }
        
        .score {
            position: absolute;
            top: 20px;
            left: 20px;
            font-size: 24px;
            color: #00ff00;
            text-shadow: 0 0 10px #00ff00;
        }
        
        .wave {
            position: absolute;
            top: 20px;
            right: 20px;
            font-size: 24px;
            color: #ff00ff;
            text-shadow: 0 0 10px #ff00ff;
        }
        
        .lives {
            position: absolute;
            top: 60px;
            left: 20px;
            font-size: 20px;
            color: #ffff00;
            text-shadow: 0 0 10px #ffff00;
        }
        
        #gameOverScreen {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at center, #330000 0%, #110000 100%);
            display: none;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #ff0000;
            z-index: 15;
            animation: fadeIn 2s ease-in-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; background: #000000; }
            to { opacity: 1; }
        }
        
        .game-over-title {
            font-size: 96px;
            font-weight: bold;
            text-align: center;
            letter-spacing: 8px;
            margin-bottom: 40px;
            color: #ff0000;
            text-shadow: 
                0 0 20px #ff0000,
                0 0 40px #ff0000,
                0 0 80px #ff0000;
            animation: pulseRed 1.5s ease-in-out infinite;
        }
        
        @keyframes pulseRed {
            0%, 100% {
                transform: scale(1);
                filter: brightness(1);
            }
            50% {
                transform: scale(1.05);
                filter: brightness(1.5);
            }
        }
        
        .game-over-stats {
            background: rgba(0, 0, 0, 0.8);
            padding: 30px;
            border: 2px solid #ff0000;
            border-radius: 10px;
            margin: 20px;
            box-shadow: 0 0 30px #ff0000;
        }
        
        .stat-line {
            font-size: 24px;
            margin: 15px 0;
            text-align: center;
            color: #ffffff;
        }
        
        .stat-value {
            color: #00ffff;
            font-weight: bold;
            text-shadow: 0 0 10px #00ffff;
        }
        
        .restart-button {
            padding: 20px 50px;
            margin-top: 30px;
            font-size: 24px;
            background: none;
            color: #ff0000;
            border: 3px solid #ff0000;
            cursor: pointer;
            transition: all 0.3s;
            text-transform: uppercase;
            letter-spacing: 3px;
            box-shadow: 0 0 20px #ff0000;
            animation: glowPulse 2s ease-in-out infinite;
        }
        
        @keyframes glowPulse {
            0%, 100% { box-shadow: 0 0 20px #ff0000; }
            50% { box-shadow: 0 0 40px #ff0000, 0 0 60px #ff0000; }
        }
        
        .restart-button:hover {
            background: #ff0000;
            color: #000;
            box-shadow: 0 0 30px #ff0000, 0 0 60px #ff0000;
            transform: scale(1.1);
        }
        
        @media (max-width: 768px) {
            .title-line { font-size: 48px; }
            .menu-button { 
                font-size: 16px; 
                padding: 12px 30px;
            }
            .game-over-title { font-size: 48px; }
            .stat-line { font-size: 18px; }
            .restart-button { 
                font-size: 18px; 
                padding: 15px 35px;
            }
        }
    </style>
</head>
<body>
    <canvas id="gameCanvas"></canvas>
    
    <div id="menuScreen">
        <div class="title-container">
            <div class="title-line geometry">GEOMETRY</div>
            <div class="title-line year">3044</div>
        </div>
        <div style="margin-top: 20px;">
            <button class="menu-button" id="startButton">START MISSION</button>
        </div>
    </div>
    
    <div id="gameUI">
        <div class="score">SCORE: <span id="scoreDisplay">0</span></div>
        <div class="wave">WAVE: <span id="waveDisplay">1</span></div>
        <div class="lives">LIVES: <span id="livesDisplay">3</span></div>
        <div class="bombs">BOMBS: <span id="bombsDisplay">3</span></div>
        <div class="combo">COMBO: <span id="comboDisplay">0</span></div>
    </div>
    
    <div id="gameOverScreen">
        <div class="game-over-title">GAME OVER</div>
        <div class="game-over-stats">
            <div class="stat-line">Final Score: <span class="stat-value" id="finalScore">0</span></div>
            <div class="stat-line">Waves Survived: <span class="stat-value" id="finalWave">0</span></div>
            <div class="stat-line">Max Combo: <span class="stat-value" id="finalCombo">0</span></div>
            <div class="stat-line">Personal Best: <span class="stat-value" id="personalBest">0</span></div>
            <div class="stat-line">Best Wave: <span class="stat-value" id="bestWave">0</span></div>
        </div>
        <button class="restart-button" id="restartButton">PLAY AGAIN</button>
    </div>
    
    <script>
        // Game Configuration
        const config = {
            width: 800,
            height: 600,
            fps: 60,
            colors: {
                player: '#00ffff',
                enemyTriangle: '#ff00ff',
                enemySquare: '#ff8800',
                enemyPentagon: '#ff0000',
                bullet: '#ffff00',
                enemyBullet: '#ff00ff',
                powerup: '#00ff00',
                grid: '#003366'
            }
        };

        // Enhanced Particle System - MOVED TO TOP
        class ParticleSystem {
            constructor() {
                this.particles = [];
            }
            
            addMuzzleFlash(x, y, direction, color) {
                for (let i = 0; i < 3; i++) {
                    const angle = direction + (Math.random() - 0.5) * 0.3;
                    const speed = 2 + Math.random() * 2;
                    this.particles.push(new MuzzleParticle(
                        x + Math.cos(direction) * 10,
                        y + Math.sin(direction) * 10,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        color
                    ));
                }
                this.particles.push(new GlowParticle(x, y, color, 15));
            }
            
            addGlassShards(x, y, color, count = 8) {
                for (let i = 0; i < count; i++) {
                    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
                    const speed = 3 + Math.random() * 4;
                    this.particles.push(new ShardParticle(
                        x, y,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        color
                    ));
                }
            }
            
            addExplosion(x, y, color, count = 15) {
                for (let i = 0; i < count; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 8 + 2;
                    this.particles.push(new ExplosionParticle(
                        x, y,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        color
                    ));
                }
            }
            
            update() {
                this.particles = this.particles.filter(particle => {
                    particle.update();
                    return particle.active;
                });
            }
            
            draw(ctx) {
                this.particles.forEach(particle => particle.draw(ctx));
            }
        }

        // Enhanced Particle Classes
        class EnhancedParticle {
            constructor(x, y, vx, vy, color, life) {
                this.x = x;
                this.y = y;
                this.vx = vx;
                this.vy = vy;
                this.color = color;
                this.life = life;
                this.maxLife = life;
                this.active = true;
            }
            
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.life--;
                
                if (this.life <= 0) {
                    this.active = false;
                }
            }
        }

        class MuzzleParticle extends EnhancedParticle {
            constructor(x, y, vx, vy, color) {
                super(x, y, vx, vy, color, 8);
                this.size = 3;
            }
            
            update() {
                super.update();
                this.vx *= 0.9;
                this.vy *= 0.9;
            }
            
            draw(ctx) {
                const alpha = this.life / this.maxLife;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;
                
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        class ShardParticle extends EnhancedParticle {
            constructor(x, y, vx, vy, color) {
                super(x, y, vx, vy, color, 40);
                this.rotation = Math.random() * Math.PI * 2;
                this.rotationSpeed = (Math.random() - 0.5) * 0.3;
                this.size = Math.random() * 4 + 2;
            }
            
            update() {
                super.update();
                this.vy += 0.2; // Gravity
                this.vx *= 0.98; // Air resistance
                this.rotation += this.rotationSpeed;
            }
            
            draw(ctx) {
                const alpha = this.life / this.maxLife;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 1;
                ctx.shadowBlur = 5;
                ctx.shadowColor = this.color;
                
                ctx.beginPath();
                ctx.moveTo(0, -this.size);
                ctx.lineTo(-this.size * 0.6, this.size * 0.6);
                ctx.lineTo(this.size * 0.6, this.size * 0.6);
                ctx.closePath();
                ctx.stroke();
                
                ctx.globalAlpha = alpha * 0.5;
                ctx.fillStyle = this.color;
                ctx.fill();
                
                ctx.restore();
            }
        }

        class GlowParticle extends EnhancedParticle {
            constructor(x, y, color, size) {
                super(x, y, 0, 0, color, 10);
                this.size = size;
            }
            
            draw(ctx) {
                const alpha = this.life / this.maxLife;
                ctx.save();
                ctx.globalAlpha = alpha * 0.3;
                
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
                gradient.addColorStop(0, this.color);
                gradient.addColorStop(0.5, this.color + '80');
                gradient.addColorStop(1, this.color + '00');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
                
                ctx.restore();
            }
        }

        class ExplosionParticle extends EnhancedParticle {
            constructor(x, y, vx, vy, color) {
                super(x, y, vx, vy, color, 30);
                this.size = Math.random() * 3 + 1;
                this.gravity = 0.1;
                this.bounce = 0.7;
                this.friction = 0.98;
            }
            
            update() {
                // Apply physics
                this.vy += this.gravity; // Gravity
                this.vx *= this.friction; // Air resistance
                this.vy *= this.friction;
                
                this.x += this.vx;
                this.y += this.vy;
                
                // Bounce off ground
                if (this.y > config.height - this.size) {
                    this.y = config.height - this.size;
                    this.vy *= -this.bounce;
                    this.vx *= this.bounce;
                }
                
                // Bounce off walls
                if (this.x < this.size || this.x > config.width - this.size) {
                    this.vx *= -this.bounce;
                    this.x = Math.max(this.size, Math.min(config.width - this.size, this.x));
                }
                
                this.life--;
                if (this.life <= 0) {
                    this.active = false;
                }
            }
            
            draw(ctx) {
                const alpha = this.life / this.maxLife;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 8;
                ctx.shadowColor = this.color;
                
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        // VHS Glitch Effect System
        class VHSGlitchSystem {
            constructor() {
                this.glitches = [];
                this.staticLines = [];
                this.chromaShift = { x: 0, y: 0, intensity: 0 };
                this.tracking = { offset: 0, intensity: 0 };
                this.noise = { intensity: 0, timer: 0 };
                this.colorBleed = { intensity: 0, timer: 0 };
                this.scanlineJitter = { intensity: 0, timer: 0 };
                this.dataCorruption = { active: false, blocks: [] };
            }
            
            triggerGlitch(intensity, duration) {
                this.glitches.push({
                    type: Math.random() < 0.5 ? 'horizontal' : 'vertical',
                    intensity: intensity,
                    duration: duration,
                    timer: 0,
                    offset: Math.random() * 200 - 100,
                    speed: Math.random() * 10 + 5
                });
                
                this.chromaShift.intensity = intensity * 0.8;
                this.chromaShift.x = (Math.random() - 0.5) * intensity * 3;
                this.chromaShift.y = (Math.random() - 0.5) * intensity * 2;
                
                this.tracking.intensity = intensity * 0.6;
                this.tracking.offset = (Math.random() - 0.5) * intensity * 5;
                
                this.noise.intensity = intensity * 0.5;
                this.noise.timer = duration;
                
                this.colorBleed.intensity = intensity * 0.3;
                this.colorBleed.timer = duration * 0.7;
                
                this.scanlineJitter.intensity = intensity * 0.4;
                this.scanlineJitter.timer = duration * 0.8;
                
                if (intensity > 0.5) {
                    this.dataCorruption.active = true;
                    this.dataCorruption.blocks = [];
                    for (let i = 0; i < Math.floor(intensity * 8); i++) {
                        this.dataCorruption.blocks.push({
                            x: Math.random() * config.width,
                            y: Math.random() * config.height,
                            width: Math.random() * 150 + 50,
                            height: Math.random() * 50 + 20,
                            life: duration * (0.5 + Math.random() * 0.5),
                            maxLife: duration,
                            color: `hsl(${Math.random() * 360}, 100%, 50%)`
                        });
                    }
                }
            }
            
            update() {
                this.glitches = this.glitches.filter(glitch => {
                    glitch.timer++;
                    glitch.offset += glitch.speed * (Math.random() - 0.5);
                    return glitch.timer < glitch.duration;
                });
                
                this.chromaShift.intensity *= 0.95;
                this.tracking.intensity *= 0.92;
                
                if (this.noise.timer > 0) {
                    this.noise.timer--;
                    this.noise.intensity *= 0.98;
                }
                
                if (this.colorBleed.timer > 0) {
                    this.colorBleed.timer--;
                    this.colorBleed.intensity *= 0.97;
                }
                
                if (this.scanlineJitter.timer > 0) {
                    this.scanlineJitter.timer--;
                    this.scanlineJitter.intensity *= 0.96;
                }
                
                if (this.dataCorruption.active) {
                    this.dataCorruption.blocks = this.dataCorruption.blocks.filter(block => {
                        block.life--;
                        return block.life > 0;
                    });
                    
                    if (this.dataCorruption.blocks.length === 0) {
                        this.dataCorruption.active = false;
                    }
                }
                
                if (Math.random() < 0.1) {
                    this.staticLines = [];
                    for (let i = 0; i < Math.random() * 20; i++) {
                        this.staticLines.push({
                            y: Math.random() * config.height,
                            width: Math.random() * config.width,
                            intensity: Math.random(),
                            life: Math.random() * 10 + 5
                        });
                    }
                }
                
                this.staticLines = this.staticLines.filter(line => {
                    line.life--;
                    return line.life > 0;
                });
            }
            
            apply(ctx) {
                ctx.save();
                
                if (this.chromaShift.intensity > 0.1) {
                    ctx.globalCompositeOperation = 'screen';
                    ctx.globalAlpha = this.chromaShift.intensity * 0.5;
                    
                    ctx.fillStyle = '#ff0000';
                    ctx.fillRect(this.chromaShift.x, 0, config.width, config.height);
                    
                    ctx.fillStyle = '#0000ff';
                    ctx.fillRect(-this.chromaShift.x, this.chromaShift.y, config.width, config.height);
                    
                    ctx.fillStyle = '#00ff00';
                    ctx.fillRect(this.chromaShift.y, -this.chromaShift.x * 0.5, config.width, config.height);
                }
                
                ctx.globalCompositeOperation = 'source-over';
                
                if (this.tracking.intensity > 0.1) {
                    const lines = Math.floor(this.tracking.intensity * 20);
                    for (let i = 0; i < lines; i++) {
                        const y = Math.random() * config.height;
                        const height = Math.random() * 8 + 2;
                        const offset = this.tracking.offset * (Math.random() - 0.5);
                        
                        ctx.globalAlpha = this.tracking.intensity * 0.8;
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(offset, y, config.width, height);
                    }
                }
                
                if (this.noise.intensity > 0.1) {
                    ctx.globalAlpha = this.noise.intensity * 0.3;
                    ctx.fillStyle = '#ffffff';
                    
                    for (let i = 0; i < this.noise.intensity * 200; i++) {
                        const x = Math.random() * config.width;
                        const y = Math.random() * config.height;
                        const size = Math.random() * 3 + 1;
                        ctx.fillRect(x, y, size, size);
                    }
                }
                
                this.staticLines.forEach(line => {
                    ctx.globalAlpha = line.intensity * 0.6;
                    ctx.fillStyle = Math.random() < 0.5 ? '#ffffff' : '#000000';
                    ctx.fillRect(0, line.y, line.width, 2);
                });
                
                if (this.colorBleed.intensity > 0.1) {
                    ctx.globalCompositeOperation = 'multiply';
                    ctx.globalAlpha = this.colorBleed.intensity * 0.4;
                    
                    const colors = ['#ff00ff', '#00ffff', '#ffff00'];
                    colors.forEach((color, index) => {
                        ctx.fillStyle = color;
                        ctx.fillRect(index * 2 - 2, 0, config.width, config.height);
                    });
                }
                
                if (this.scanlineJitter.intensity > 0.1) {
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.globalAlpha = this.scanlineJitter.intensity * 0.5;
                    ctx.fillStyle = '#000000';
                    
                    for (let y = 0; y < config.height; y += 4) {
                        const jitter = (Math.random() - 0.5) * this.scanlineJitter.intensity * 10;
                        ctx.fillRect(jitter, y, config.width, 2);
                    }
                }
                
                if (this.dataCorruption.active) {
                    ctx.globalCompositeOperation = 'source-over';
                    this.dataCorruption.blocks.forEach(block => {
                        const alpha = block.life / block.maxLife;
                        ctx.globalAlpha = alpha * 0.8;
                        
                        ctx.fillStyle = block.color;
                        ctx.fillRect(block.x, block.y, block.width, block.height);
                        
                        ctx.fillStyle = '#ffffff';
                        for (let i = 0; i < 20; i++) {
                            const px = block.x + Math.random() * block.width;
                            const py = block.y + Math.random() * block.height;
                            ctx.fillRect(px, py, 2, 2);
                        }
                        
                        ctx.fillStyle = '#000000';
                        for (let y = block.y; y < block.y + block.height; y += 6) {
                            ctx.fillRect(block.x, y, block.width, 1);
                        }
                    });
                }
                
                ctx.restore();
            }
        }

        // Enhanced 80s Slang System
        class RadicalSlang {
            constructor() {
                this.slangWords = [
                    "RADICAL!", "TUBULAR!", "GNARLY!", "BODACIOUS!", "WICKED!", 
                    "AWESOME!", "RIGHTEOUS!", "GROOVY!", "FAR OUT!", "SOLID!",
                    "FRESH!", "DOPE!", "SICK!", "PHAT!", "BANGIN'!", "TIGHT!",
                    "KILLER!", "SWEET!", "MONDO!", "BITCHIN'!", "OUTRAGEOUS!",
                    "MAXIMUM!", "EXTREME!", "ULTIMATE!", "INSANE!", "MENTAL!",
                    "WILD!", "CRAZY!", "PSYCHO!", "FIERCE!", "SAVAGE!",
                    "WICKED SICK!", "TOTALLY RAD!", "ULTRA GNARLY!", "MEGA FRESH!",
                    "SUPER FLY!", "WAY COOL!", "OFF THE HOOK!", "TO THE MAX!",
                    "RIGHTEOUS DUDE!", "MOST EXCELLENT!", "COWABUNGA!",
                    "GAG ME WITH A SPOON!", "GRODY TO THE MAX!", "NO WAY JOSE!",
                    "TOTALLY AWESOME!", "RADICAL DUDE!", "TUBULAR MAN!",
                    "GNARLY TO THE MAX!", "WICKED COOL!", "SUPER RADICAL!",
                    "MONDO COOL!", "ABSOLUTELY GNARLY!", "ULTRA TUBULAR!",
                    "MAXIMUM RADICAL!", "TOTALLY GNARLY!", "WICKED AWESOME!"
                ];
                this.currentSlang = "";
                this.slangTimer = 0;
                this.active = false;
                this.colorIndex = 0;
                this.vhsGlitch = null;
                console.log('RadicalSlang constructor called successfully!');
            }
            
            triggerSlang(comboCount) {
                console.log('triggerSlang called with combo:', comboCount);
                if (comboCount >= 1) {
                    this.currentSlang = this.slangWords[Math.floor(Math.random() * this.slangWords.length)];
                    this.slangTimer = 240;
                    this.active = true;
                    this.colorIndex = Math.floor(Math.random() * 6);
                    
                    console.log(`SUCCESS! Triggered slang: ${this.currentSlang} for combo ${comboCount}`);
                    
                    if (this.vhsGlitch) {
                        const intensity = Math.min(comboCount * 0.1, 1.0);
                        const duration = 30 + comboCount * 2;
                        this.vhsGlitch.triggerGlitch(intensity, duration);
                    }
                }
            }
            
            setVHSGlitch(vhsSystem) {
                this.vhsGlitch = vhsSystem;
            }
            
            update() {
                if (this.active) {
                    this.slangTimer--;
                    if (this.slangTimer <= 0) {
                        this.active = false;
                    }
                }
            }
            
            draw(ctx) {
                if (!this.active) return;
                
                const colors = ['#ff00ff', '#00ffff', '#ffff00', '#ff0000', '#00ff00', '#ff8800'];
                const alpha = this.slangTimer > 210 ? (240 - this.slangTimer) / 30 : 
                             this.slangTimer < 30 ? this.slangTimer / 30 : 1;
                
                ctx.save();
                ctx.globalAlpha = alpha;
                
                const bgGradient = ctx.createLinearGradient(0, 0, config.width, 0);
                bgGradient.addColorStop(0, colors[(this.colorIndex + 0) % colors.length] + '60');
                bgGradient.addColorStop(0.5, colors[(this.colorIndex + 1) % colors.length] + '60');
                bgGradient.addColorStop(1, colors[(this.colorIndex + 2) % colors.length] + '60');
                
                ctx.fillStyle = bgGradient;
                ctx.fillRect(0, config.height / 2 - 80, config.width, 160);
                
                for (let i = 0; i < 5; i++) {
                    const y = config.height / 2 - 80 + i * 32;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                    ctx.fillRect(0, y, config.width, 2);
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                    ctx.fillRect(0, y + 2, config.width, 1);
                }
                
                const fontSize = Math.min(config.width * 0.08, 64);
                ctx.font = `bold ${fontSize}px Courier New`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                const centerX = config.width / 2;
                const centerY = config.height / 2;
                
                const glitchOffset = Math.sin(this.slangTimer * 0.5) * 3;
                const chromaOffset = Math.sin(this.slangTimer * 0.3) * 2;
                
                for (let i = 0; i < 4; i++) {
                    ctx.strokeStyle = colors[(this.colorIndex + i) % colors.length];
                    ctx.lineWidth = 12 - i * 2;
                    ctx.shadowBlur = 40 + i * 15;
                    ctx.shadowColor = colors[(this.colorIndex + i) % colors.length];
                    
                    const vhsOffsetX = Math.sin(this.slangTimer * 0.1 + i) * 3;
                    const vhsOffsetY = Math.cos(this.slangTimer * 0.08 + i) * 1.5;
                    
                    ctx.strokeText(this.currentSlang, centerX + vhsOffsetX + glitchOffset, centerY + vhsOffsetY);
                }
                
                ctx.globalCompositeOperation = 'screen';
                ctx.globalAlpha = alpha * 0.6;
                
                ctx.fillStyle = '#ff0000';
                ctx.fillText(this.currentSlang, centerX + chromaOffset, centerY);
                
                ctx.fillStyle = '#0000ff';
                ctx.fillText(this.currentSlang, centerX - chromaOffset, centerY);
                
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = alpha;
                const mainGradient = ctx.createLinearGradient(centerX - 200, centerY - 50, centerX + 200, centerY + 50);
                mainGradient.addColorStop(0, colors[this.colorIndex]);
                mainGradient.addColorStop(0.5, '#ffffff');
                mainGradient.addColorStop(1, colors[(this.colorIndex + 1) % colors.length]);
                
                ctx.fillStyle = mainGradient;
                ctx.shadowBlur = 25;
                ctx.shadowColor = colors[this.colorIndex];
                ctx.fillText(this.currentSlang, centerX + glitchOffset * 0.5, centerY);
                
                ctx.globalAlpha = alpha * 0.4;
                ctx.fillStyle = colors[this.colorIndex];
                for (let y = centerY - 80; y < centerY + 80; y += 3) {
                    const scanlineAlpha = 0.3 + Math.sin((y + this.slangTimer) * 0.1) * 0.2;
                    ctx.globalAlpha = alpha * scanlineAlpha;
                    ctx.fillRect(0, y, config.width, 1);
                }
                
                if (Math.random() < 0.15) {
                    ctx.globalAlpha = alpha * 0.3;
                    ctx.fillStyle = '#ffffff';
                    for (let i = 0; i < 30; i++) {
                        const x = Math.random() * config.width;
                        const y = centerY - 80 + Math.random() * 160;
                        const size = Math.random() * 4 + 1;
                        ctx.fillRect(x, y, size, 1);
                    }
                }
                
                if (Math.random() < 0.1) {
                    ctx.globalAlpha = alpha * 0.4;
                    for (let i = 0; i < 3; i++) {
                        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
                        const blockX = Math.random() * config.width;
                        const blockY = centerY - 60 + Math.random() * 120;
                        const blockW = Math.random() * 50 + 10;
                        const blockH = Math.random() * 8 + 2;
                        ctx.fillRect(blockX, blockY, blockW, blockH);
                    }
                }
                
                if (Math.random() < 0.08) {
                    ctx.globalAlpha = alpha * 0.6;
                    ctx.fillStyle = '#ffffff';
                    const trackingY = centerY + (Math.random() - 0.5) * 100;
                    const offset = (Math.random() - 0.5) * 20;
                    ctx.fillRect(offset, trackingY, config.width, 3);
                }
                
                ctx.restore();
            }
        }

        // Simple Player Class
        class Player {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.size = 20;
                this.speed = 6;
                this.fireRate = 4;
                this.fireCooldown = 0;
                this.invulnerable = 0;
            }
            
            update() {
                if (this.fireCooldown > 0) this.fireCooldown--;
                if (this.invulnerable > 0) this.invulnerable--;
                
                this.x = Math.max(this.size, Math.min(config.width - this.size, this.x));
                this.y = Math.max(this.size, Math.min(config.height - this.size, this.y));
            }
            
            draw(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                
                if (this.invulnerable % 10 < 5) {
                    ctx.strokeStyle = config.colors.player;
                    ctx.fillStyle = config.colors.player + '33';
                    ctx.lineWidth = 2;
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = config.colors.player;
                    
                    ctx.beginPath();
                    ctx.moveTo(0, -this.size);
                    ctx.lineTo(-this.size * 0.866, this.size * 0.5);
                    ctx.lineTo(this.size * 0.866, this.size * 0.5);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.fill();
                }
                
                ctx.restore();
            }
            
            fire() {
                if (this.fireCooldown <= 0) {
                    gameState.bullets.push(new Bullet(this.x, this.y - this.size, 0, -12, true));
                    this.fireCooldown = this.fireRate;
                    
                    // Add muzzle flash particle effect
                    particleSystem.addMuzzleFlash(this.x, this.y - this.size, -Math.PI/2, config.colors.player);
                }
            }
        }

        // Simple Bullet Class
        class Bullet {
            constructor(x, y, vx, vy, isPlayer = true) {
                this.x = x;
                this.y = y;
                this.vx = vx;
                this.vy = vy;
                this.isPlayer = isPlayer;
                this.size = 3;
                this.active = true;
            }
            
            update() {
                this.x += this.vx;
                this.y += this.vy;
                
                if (this.x < -10 || this.x > config.width + 10 || 
                    this.y < -10 || this.y > config.height + 10) {
                    this.active = false;
                }
            }
            
            draw(ctx) {
                ctx.save();
                ctx.fillStyle = this.isPlayer ? config.colors.bullet : config.colors.enemyBullet;
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.isPlayer ? config.colors.bullet : config.colors.enemyBullet;
                
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Add bullet trail particles
                if (this.isPlayer && Math.random() < 0.3) {
                    gameState.particles.push(new ExplosionParticle(
                        this.x + (Math.random() - 0.5) * 4,
                        this.y + (Math.random() - 0.5) * 4,
                        (Math.random() - 0.5) * 2,
                        (Math.random() - 0.5) * 2,
                        config.colors.bullet
                    ));
                }
                
                ctx.restore();
            }
        }

        // Simple Enemy Class
        class Enemy {
            constructor(x, y, type) {
                this.x = x;
                this.y = y;
                this.type = type;
                this.active = true;
                this.rotation = 0;
                
                switch(type) {
                    case 'triangle':
                        this.sides = 3;
                        this.size = 15;
                        this.hp = 1;
                        this.speed = 2;
                        this.points = 100;
                        this.color = config.colors.enemyTriangle;
                        break;
                    case 'square':
                        this.sides = 4;
                        this.size = 20;
                        this.hp = 2;
                        this.speed = 1.5;
                        this.points = 200;
                        this.color = config.colors.enemySquare;
                        break;
                }
                
                this.maxHp = this.hp;
            }
            
            update() {
                this.y += this.speed;
                this.rotation += 0.02;
                
                if (this.y > config.height + 50) {
                    this.active = false;
                }
            }
            
            draw(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                
                ctx.strokeStyle = this.color;
                ctx.fillStyle = this.color + '33';
                ctx.lineWidth = 2;
                ctx.shadowBlur = 15;
                ctx.shadowColor = this.color;
                
                ctx.beginPath();
                for (let i = 0; i < this.sides; i++) {
                    const angle = (Math.PI * 2 * i) / this.sides - Math.PI / 2;
                    const px = Math.cos(angle) * this.size;
                    const py = Math.sin(angle) * this.size;
                    
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.stroke();
                ctx.fill();
                
                ctx.restore();
            }
            
            takeDamage() {
                this.hp--;
                if (this.hp <= 0) {
                    this.active = false;
                    
                    gameState.combo++;
                    if (gameState.combo > gameState.maxCombo) {
                        gameState.maxCombo = gameState.combo;
                    }
                    
                    console.log(`Enemy destroyed! Combo: ${gameState.combo}, Radical Slang exists: ${!!gameState.radicalSlang}`);
                    
                    // Add explosion particles
                    particleSystem.addExplosion(this.x, this.y, this.color, 12);
                    particleSystem.addGlassShards(this.x, this.y, this.color, 8);
                    
                    // Add regular explosion particles to game state
                    for (let i = 0; i < 8; i++) {
                        gameState.particles.push(new ExplosionParticle(
                            this.x + (Math.random() - 0.5) * 20,
                            this.y + (Math.random() - 0.5) * 20,
                            (Math.random() - 0.5) * 10,
                            (Math.random() - 0.5) * 10,
                            this.color
                        ));
                    }
                    
                    if (gameState.vhsGlitch && gameState.combo >= 1) {
                        const intensity = Math.min(gameState.combo * 0.08, 0.8);
                        const duration = 20 + gameState.combo * 1.5;
                        gameState.vhsGlitch.triggerGlitch(intensity, duration);
                    }
                    
                    if (gameState.radicalSlang && gameState.radicalSlang.triggerSlang) {
                        gameState.radicalSlang.triggerSlang(gameState.combo);
                    }
                    
                    gameState.score += this.points * gameState.combo;
                    updateUI();
                }
            }
        }

        // Game Variables
        let canvas, ctx, gameState, waveManager, particleSystem;

        // Initialize Game State
        function initializeGameState() {
            const newRadicalSlang = new RadicalSlang();
            const newVHSGlitch = new VHSGlitchSystem();
            
            newRadicalSlang.setVHSGlitch(newVHSGlitch);
            
            return {
                running: false,
                paused: false,
                score: 0,
                lives: 3,
                bombs: 3,
                wave: 1,
                combo: 0,
                maxCombo: 0,
                enemies: [],
                bullets: [],
                enemyBullets: [],
                particles: [],
                player: null,
                radicalSlang: newRadicalSlang,
                vhsGlitch: newVHSGlitch,
                screenShake: { x: 0, y: 0, intensity: 0, duration: 0 }
            };
        }

        gameState = initializeGameState();

        // Responsive canvas sizing
        function resizeCanvas() {
            if (!canvas) return;
            
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            
            canvas.width = screenWidth;
            canvas.height = screenHeight;
            canvas.style.width = screenWidth + 'px';
            canvas.style.height = screenHeight + 'px';
            
            config.width = screenWidth;
            config.height = screenHeight;
            
            if (gameState.player) {
                gameState.player.x = Math.min(gameState.player.x, config.width - gameState.player.size);
                gameState.player.y = Math.min(gameState.player.y, config.height - gameState.player.size);
            }
        }

        // Simple Wave Manager
        class WaveManager {
            constructor() {
                this.enemySpawnTimer = 0;
            }
            
            update() {
                this.enemySpawnTimer++;
                
                if (this.enemySpawnTimer > 60 && gameState.enemies.length < 5) {
                    this.spawnEnemy();
                    this.enemySpawnTimer = 0;
                }
            }
            
            spawnEnemy() {
                const types = ['triangle', 'square'];
                const type = types[Math.floor(Math.random() * types.length)];
                const x = Math.random() * (config.width - 100) + 50;
                gameState.enemies.push(new Enemy(x, -50, type));
            }
        }

        // Input handling
        const keys = {};

        document.addEventListener('keydown', (e) => {
            keys[e.key.toLowerCase()] = true;
        });

        document.addEventListener('keyup', (e) => {
            keys[e.key.toLowerCase()] = false;
        });

        // Highscore system
        let sessionHighscore = 0;
        let sessionHighestWave = 1;

        function getHighscore() {
            try {
                return localStorage.getItem('geometry3044_highscore') || sessionHighscore;
            } catch (e) {
                return sessionHighscore;
            }
        }

        function setHighscore(score, wave) {
            try {
                const currentHighscore = getHighscore();
                if (score > currentHighscore) {
                    localStorage.setItem('geometry3044_highscore', score);
                }
            } catch (e) {
                if (score > sessionHighscore) {
                    sessionHighscore = score;
                }
            }
        }

        // Game functions
        function startGame() {
            document.getElementById('menuScreen').style.display = 'none';
            document.getElementById('gameUI').style.display = 'block';
            
            // Initialize particle system
            particleSystem = new ParticleSystem();
            
            const newRadicalSlang = new RadicalSlang();
            const newVHSGlitch = new VHSGlitchSystem();
            newRadicalSlang.setVHSGlitch(newVHSGlitch);
            
            gameState = {
                running: true,
                paused: false,
                score: 0,
                lives: 3,
                bombs: 3,
                wave: 1,
                combo: 0,
                maxCombo: 0,
                enemies: [],
                bullets: [],
                enemyBullets: [],
                particles: [],
                player: new Player(config.width / 2, config.height - 100),
                radicalSlang: newRadicalSlang,
                vhsGlitch: newVHSGlitch,
                screenShake: { x: 0, y: 0, intensity: 0, duration: 0 }
            };
            
            waveManager = new WaveManager();
            
            console.log('Game started - Radical Slang exists:', !!gameState.radicalSlang);
            
            updateUI();
            requestAnimationFrame(gameLoop);
        }

        function gameOver() {
            gameState.running = false;
            
            setHighscore(gameState.score, gameState.wave);
            
            document.getElementById('gameUI').style.display = 'none';
            document.getElementById('gameOverScreen').style.display = 'flex';
            
            document.getElementById('finalScore').textContent = gameState.score.toLocaleString();
            document.getElementById('finalWave').textContent = gameState.wave;
            document.getElementById('finalCombo').textContent = gameState.maxCombo;
            document.getElementById('personalBest').textContent = parseInt(getHighscore()).toLocaleString();
        }

        function updateUI() {
            document.getElementById('scoreDisplay').textContent = gameState.score;
            document.getElementById('waveDisplay').textContent = gameState.wave;
            document.getElementById('livesDisplay').textContent = gameState.lives;
            document.getElementById('bombsDisplay').textContent = gameState.bombs;
            document.getElementById('comboDisplay').textContent = gameState.combo;
        }

        // Collision detection
        function checkCollisions() {
            gameState.bullets.forEach(bullet => {
                if (bullet.isPlayer && bullet.active) {
                    gameState.enemies.forEach(enemy => {
                        if (enemy.active && distance(bullet, enemy) < enemy.size) {
                            bullet.active = false;
                            enemy.takeDamage();
                        }
                    });
                }
            });
            
            if (gameState.player && gameState.player.invulnerable <= 0) {
                gameState.enemies.forEach(enemy => {
                    if (enemy.active && distance(enemy, gameState.player) < enemy.size + gameState.player.size) {
                        playerHit();
                        enemy.active = false;
                    }
                });
            }
        }

        function playerHit() {
            gameState.combo = 0;
            gameState.lives--;
            gameState.player.invulnerable = 120;
            
            // Add massive explosion particles when player is hit
            if (particleSystem) {
                particleSystem.addExplosion(gameState.player.x, gameState.player.y, '#ff0000', 25);
                particleSystem.addGlassShards(gameState.player.x, gameState.player.y, '#ffffff', 15);
            }
            
            // Add screen shake
            gameState.screenShake.intensity = 15;
            gameState.screenShake.duration = 30;
            
            // Add physics particles to game state
            for (let i = 0; i < 20; i++) {
                gameState.particles.push(new ExplosionParticle(
                    gameState.player.x + (Math.random() - 0.5) * 30,
                    gameState.player.y + (Math.random() - 0.5) * 30,
                    (Math.random() - 0.5) * 15,
                    (Math.random() - 0.5) * 15,
                    '#ff' + Math.floor(Math.random() * 256).toString(16).padStart(2, '0') + 
                    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
                ));
            }
            
            updateUI();
            
            if (gameState.lives <= 0) {
                gameOver();
            }
        }

        function distance(a, b) {
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            return Math.sqrt(dx * dx + dy * dy);
        }

        // Main game loop
        function gameLoop() {
            if (!gameState.running) return;
            
            if (!gameState.paused) {
                update();
                render();
            }
            
            requestAnimationFrame(gameLoop);
        }

        function update() {
            if (gameState.radicalSlang) gameState.radicalSlang.update();
            if (gameState.vhsGlitch) gameState.vhsGlitch.update();
            if (particleSystem) particleSystem.update();
            
            // Update screen shake
            if (gameState.screenShake.duration > 0) {
                gameState.screenShake.duration--;
                gameState.screenShake.x = (Math.random() - 0.5) * gameState.screenShake.intensity;
                gameState.screenShake.y = (Math.random() - 0.5) * gameState.screenShake.intensity;
                gameState.screenShake.intensity *= 0.9;
            } else {
                gameState.screenShake.x = 0;
                gameState.screenShake.y = 0;
            }
            
            if (gameState.player) {
                const moveSpeed = gameState.player.speed;
                if (keys['a'] || keys['arrowleft']) gameState.player.x -= moveSpeed;
                if (keys['d'] || keys['arrowright']) gameState.player.x += moveSpeed;
                if (keys['w'] || keys['arrowup']) gameState.player.y -= moveSpeed;
                if (keys['s'] || keys['arrowdown']) gameState.player.y += moveSpeed;
                
                if (keys[' ']) {
                    gameState.player.fire();
                }
                
                gameState.player.update();
            }
            
            if (waveManager) {
                waveManager.update();
            }
            
            gameState.enemies = gameState.enemies.filter(e => {
                e.update();
                return e.active;
            });
            
            gameState.bullets = gameState.bullets.filter(b => {
                b.update();
                return b.active;
            });
            
            gameState.particles = gameState.particles.filter(p => {
                p.update();
                return p.active;
            });
            
            checkCollisions();
        }

        function render() {
            if (!ctx) return;
            
            ctx.save();
            ctx.translate(gameState.screenShake.x, gameState.screenShake.y);
            
            ctx.fillStyle = '#000011';
            ctx.fillRect(0, 0, config.width, config.height);
            
            drawGrid();
            
            // Draw particles behind entities
            if (particleSystem) particleSystem.draw(ctx);
            gameState.particles.forEach(p => p.draw(ctx));
            
            gameState.enemies.forEach(e => e.draw(ctx));
            gameState.bullets.forEach(b => b.draw(ctx));
            if (gameState.player) gameState.player.draw(ctx);
            
            if (gameState.radicalSlang) gameState.radicalSlang.draw(ctx);
            
            // Draw particles on top for better visibility
            if (particleSystem) particleSystem.draw(ctx);
            
            if (gameState.vhsGlitch) gameState.vhsGlitch.apply(ctx);
            
            ctx.restore();
            
            if (gameState.combo > 1) {
                ctx.save();
                ctx.fillStyle = gameState.combo > 5 ? '#ffff00' : '#00ff00';
                ctx.font = gameState.combo > 10 ? 'bold 32px Courier New' : 'bold 24px Courier New';
                ctx.textAlign = 'center';
                ctx.shadowBlur = 20;
                ctx.shadowColor = gameState.combo > 5 ? '#ffff00' : '#00ff00';
                ctx.globalAlpha = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
                
                const comboText = gameState.combo > 10 ? `${gameState.combo}x MEGA COMBO!` : `${gameState.combo}x COMBO!`;
                ctx.fillText(comboText, config.width / 2, 150);
                ctx.restore();
            }
        }

        function drawGrid() {
            if (!ctx) return;
            
            ctx.strokeStyle = config.colors.grid + '33';
            ctx.lineWidth = 1;
            
            const gridSize = 50;
            
            for (let x = 0; x < config.width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, config.height);
                ctx.stroke();
            }
            
            for (let y = 0; y < config.height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(config.width, y);
                ctx.stroke();
            }
        }

        // Initialize everything when DOM is loaded
        window.onload = function() {
            canvas = document.getElementById('gameCanvas');
            ctx = canvas.getContext('2d');
            
            resizeCanvas();
            
            window.addEventListener('resize', resizeCanvas);
            window.addEventListener('orientationchange', () => {
                setTimeout(resizeCanvas, 100);
            });
            
            const startBtn = document.getElementById('startButton');
            const restartBtn = document.getElementById('restartButton');
            
            if (startBtn) {
                startBtn.onclick = function() {
                    startGame();
                };
            }
            
            if (restartBtn) {
                restartBtn.onclick = function() {
                    document.getElementById('gameOverScreen').style.display = 'none';
                    startGame();
                };
            }
            
            document.getElementById('menuScreen').style.display = 'flex';
        };
    </script>
</body>
</html>
```

# FIRST REQUEST (start here)
Please **audit and upgrade only** the bullet + enemy lifecycle:
- Bullet pooling (create N upfront; reuse; mark inactive; no new allocations during play).
- Bullet lifetime: remove or deactivate when off-screen or on collision; no “stuck” pixels/ghosts.
- Enemy spawning: guarantee visible spawn cadence per wave; ensure downward (or pattern) movement never stalls at 0 velocity.
- Add a small, well-contained particle impact burst (pooled) when bullet hits enemy.

Return only the specific changed/new code blocks with clear insert locations and a 5-step manual test checklist.
