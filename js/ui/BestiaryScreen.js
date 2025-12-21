// ============================================
// GEOMETRY 3044 - BESTIARY SCREEN UI
// ============================================
// Displays discovered enemies in a gallery format
// Shows silhouettes for undiscovered enemies
// ============================================

import { EnemyBestiary, ENEMY_DATA, ENEMY_TYPES } from '../systems/EnemyBestiary.js';

export class BestiaryScreen {
    constructor(bestiary) {
        this.bestiary = bestiary || new EnemyBestiary();
        this.selectedIndex = 0;
        this.visible = false;
        this.onClose = null;

        // Animation
        this.animTimer = 0;
    }

    /**
     * Show the bestiary screen
     */
    show() {
        this.visible = true;
        this.selectedIndex = 0;
        this.animTimer = 0;
        this.render();
    }

    /**
     * Hide the bestiary screen
     */
    hide() {
        this.visible = false;
        const screen = document.getElementById('bestiaryScreen');
        if (screen) {
            screen.style.display = 'none';
        }
        if (this.onClose) {
            this.onClose();
        }
    }

    /**
     * Render the bestiary screen
     */
    render() {
        let screen = document.getElementById('bestiaryScreen');

        // Create screen if it doesn't exist
        if (!screen) {
            screen = document.createElement('div');
            screen.id = 'bestiaryScreen';
            screen.className = 'fullscreen-menu';
            document.getElementById('gameContainer').appendChild(screen);
        }

        const enemies = this.bestiary.getAllEnemies();
        const discovered = this.bestiary.getDiscoveredCount();
        const total = this.bestiary.getTotalCount();

        screen.innerHTML = `
            <div class="menu-container bestiary-container">
                <h2 class="screen-title">ENEMY BESTIARY</h2>
                <div class="bestiary-progress">${discovered}/${total} DISCOVERED</div>

                <div class="bestiary-grid" id="bestiaryGrid">
                    ${enemies.map((enemy, index) => this.renderEnemyCard(enemy, index)).join('')}
                </div>

                <div class="bestiary-details" id="bestiaryDetails">
                    ${this.renderEnemyDetails(enemies[this.selectedIndex])}
                </div>

                <div class="menu-nav-buttons">
                    <button class="btn btn-secondary" id="closeBestiaryBtn">BACK</button>
                </div>
            </div>
        `;

        screen.style.display = 'flex';

        // Bind events
        this.bindEvents();
    }

    /**
     * Render a single enemy card
     */
    renderEnemyCard(enemy, index) {
        const isSelected = index === this.selectedIndex;
        const isDiscovered = enemy.discovered;

        return `
            <div class="bestiary-card ${isSelected ? 'selected' : ''} ${isDiscovered ? 'discovered' : 'locked'}"
                 data-index="${index}" data-type="${enemy.type}">
                <div class="enemy-icon" style="--enemy-color: ${isDiscovered ? enemy.color : '#333333'}">
                    ${isDiscovered ? this.getEnemyShape(enemy.type) : '?'}
                </div>
                <div class="enemy-card-name">${isDiscovered ? enemy.name : '???'}</div>
                ${isDiscovered ? `<div class="enemy-kills">${enemy.kills} kills</div>` : ''}
            </div>
        `;
    }

    /**
     * Get SVG shape for enemy type
     */
    getEnemyShape(type) {
        const shapes = {
            triangle: '<svg viewBox="0 0 40 40"><polygon points="20,5 35,35 5,35" fill="currentColor"/></svg>',
            square: '<svg viewBox="0 0 40 40"><rect x="5" y="5" width="30" height="30" fill="currentColor"/></svg>',
            pentagon: '<svg viewBox="0 0 40 40"><polygon points="20,3 38,15 32,37 8,37 2,15" fill="currentColor"/></svg>',
            divebomber: '<svg viewBox="0 0 40 40"><polygon points="20,0 30,20 20,40 10,20" fill="currentColor"/></svg>',
            sinewave: '<svg viewBox="0 0 40 40"><polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="currentColor"/></svg>',
            pixelskull: '<svg viewBox="0 0 40 40"><rect x="8" y="5" width="24" height="20" rx="4" fill="currentColor"/><rect x="10" y="25" width="8" height="10" fill="currentColor"/><rect x="22" y="25" width="8" height="10" fill="currentColor"/></svg>',
            ghostbyte: '<svg viewBox="0 0 40 40"><ellipse cx="20" cy="15" rx="15" ry="12" fill="currentColor"/><path d="M5,15 L5,35 L10,30 L15,35 L20,30 L25,35 L30,30 L35,35 L35,15" fill="currentColor"/></svg>',
            laserdisc: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="20" cy="20" r="8" fill="currentColor"/></svg>',
            vhstracker: '<svg viewBox="0 0 40 40"><rect x="3" y="10" width="34" height="20" rx="2" fill="currentColor"/><circle cx="12" cy="20" r="5" fill="#000"/><circle cx="28" cy="20" r="5" fill="#000"/></svg>',
            arcadeboss: '<svg viewBox="0 0 40 40"><rect x="8" y="2" width="24" height="36" rx="2" fill="currentColor"/><rect x="10" y="5" width="20" height="15" fill="#000"/><rect x="12" y="25" width="6" height="8" fill="#f00"/><circle cx="25" cy="28" r="3" fill="#0ff"/></svg>',
            synthwave: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" fill="currentColor" opacity="0.5"/><polygon points="20,8 28,25 12,25" fill="currentColor"/></svg>',
            pixelinvader: '<svg viewBox="0 0 40 40"><rect x="8" y="10" width="4" height="4" fill="currentColor"/><rect x="28" y="10" width="4" height="4" fill="currentColor"/><rect x="12" y="14" width="16" height="4" fill="currentColor"/><rect x="8" y="18" width="24" height="8" fill="currentColor"/><rect x="8" y="26" width="8" height="4" fill="currentColor"/><rect x="24" y="26" width="8" height="4" fill="currentColor"/></svg>'
        };
        return shapes[type] || '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" fill="currentColor"/></svg>';
    }

    /**
     * Render detailed enemy info panel
     */
    renderEnemyDetails(enemy) {
        if (!enemy) return '<div class="no-selection">Select an enemy to view details</div>';

        if (!enemy.discovered) {
            return `
                <div class="enemy-details-locked">
                    <div class="locked-icon">?</div>
                    <div class="locked-text">UNDISCOVERED</div>
                    <div class="unlock-hint">First appears on Wave ${enemy.unlockWave}</div>
                </div>
            `;
        }

        return `
            <div class="enemy-details-header">
                <div class="enemy-portrait" style="color: ${enemy.color}">
                    ${this.getEnemyShape(enemy.type)}
                </div>
                <div class="enemy-title">
                    <h3 class="enemy-name" style="color: ${enemy.color}">${enemy.name}</h3>
                    <div class="enemy-subtitle">${enemy.displayName}</div>
                </div>
            </div>

            <div class="enemy-description">${enemy.description}</div>

            <div class="enemy-stats-grid">
                <div class="stat-item">
                    <span class="stat-label">ROLE</span>
                    <span class="stat-value">${enemy.role.toUpperCase()}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">BEHAVIOR</span>
                    <span class="stat-value">${enemy.behavior}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">HP</span>
                    <span class="stat-value">${enemy.stats.hp}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">SPEED</span>
                    <span class="stat-value">${enemy.stats.speed}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">FIRE RATE</span>
                    <span class="stat-value">${enemy.stats.fireRate}</span>
                </div>
                <div class="stat-item threat-${enemy.threat}">
                    <span class="stat-label">THREAT</span>
                    <span class="stat-value">${'*'.repeat(enemy.threat)}</span>
                </div>
            </div>

            <div class="enemy-player-stats">
                <div class="player-stat">
                    <span class="player-stat-label">TOTAL KILLS</span>
                    <span class="player-stat-value">${enemy.kills.toLocaleString()}</span>
                </div>
                <div class="player-stat">
                    <span class="player-stat-label">FIRST SEEN</span>
                    <span class="player-stat-value">Wave ${enemy.firstEncounterWave || '?'}</span>
                </div>
                <div class="player-stat">
                    <span class="player-stat-label">APPEARS FROM</span>
                    <span class="player-stat-value">Wave ${enemy.unlockWave}</span>
                </div>
            </div>
        `;
    }

    /**
     * Bind event handlers
     */
    bindEvents() {
        // Close button
        const closeBtn = document.getElementById('closeBestiaryBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // Card selection
        const cards = document.querySelectorAll('.bestiary-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.dataset.index);
                this.selectEnemy(index);
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    /**
     * Handle keyboard input
     */
    handleKeydown(e) {
        if (!this.visible) return;

        const enemies = this.bestiary.getAllEnemies();
        const cols = 4; // Grid columns

        switch (e.key) {
            case 'ArrowLeft':
                this.selectEnemy(Math.max(0, this.selectedIndex - 1));
                e.preventDefault();
                break;
            case 'ArrowRight':
                this.selectEnemy(Math.min(enemies.length - 1, this.selectedIndex + 1));
                e.preventDefault();
                break;
            case 'ArrowUp':
                this.selectEnemy(Math.max(0, this.selectedIndex - cols));
                e.preventDefault();
                break;
            case 'ArrowDown':
                this.selectEnemy(Math.min(enemies.length - 1, this.selectedIndex + cols));
                e.preventDefault();
                break;
            case 'Escape':
                this.hide();
                e.preventDefault();
                break;
        }
    }

    /**
     * Select an enemy by index
     */
    selectEnemy(index) {
        this.selectedIndex = index;

        // Update card selection
        const cards = document.querySelectorAll('.bestiary-card');
        cards.forEach((card, i) => {
            card.classList.toggle('selected', i === index);
        });

        // Update details panel
        const detailsPanel = document.getElementById('bestiaryDetails');
        if (detailsPanel) {
            const enemies = this.bestiary.getAllEnemies();
            detailsPanel.innerHTML = this.renderEnemyDetails(enemies[index]);
        }
    }

    /**
     * Update animation
     */
    update(deltaTime = 1) {
        if (!this.visible) return;
        this.animTimer += deltaTime;
    }
}
