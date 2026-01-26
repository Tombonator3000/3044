/**
 * Geometry 3044 - Mobile Touch Controls
 * Provides visual touch controls for mobile devices
 */

import { config } from '../config.js';

export class MobileControls {
    constructor(canvas) {
        this.canvas = canvas;
        this.enabled = false;
        this.visible = true;

        // Detect if mobile device
        this.isMobile = this.detectMobile();

        // Touch state
        this.joystick = {
            active: false,
            baseX: 0,
            baseY: 0,
            stickX: 0,
            stickY: 0,
            dx: 0,
            dy: 0,
            touchId: null
        };

        this.fireButton = {
            active: false,
            x: 0,
            y: 0,
            touchId: null
        };

        this.bombButton = {
            active: false,
            x: 0,
            y: 0,
            touchId: null
        };

        // Control dimensions
        this.joystickBaseRadius = 60;
        this.joystickStickRadius = 30;
        this.joystickMaxDistance = 50;
        this.fireButtonRadius = 45;
        this.bombButtonRadius = 35;

        // Margins from screen edges
        this.margin = 30;
        this.buttonSpacing = 20;

        // Animation state
        this.pulsePhase = 0;

        // Bound event handlers
        this._boundHandlers = {};

        // Performance: Cache gradients to avoid recreating every frame
        this._gradientCache = {
            joystick: null,
            joystickPos: { x: 0, y: 0 },
            fireGlow: null,
            firePos: { x: 0, y: 0 },
            fireActive: false,
            bombGlow: null,
            bombPos: { x: 0, y: 0 },
            bombActive: false
        };

        // Performance: Cache bounding rect to avoid layout thrashing
        this._cachedRect = null;
        this._rectCacheTime = 0;

        // Initialize if mobile
        if (this.isMobile) {
            this.enable();
        }
    }

    /**
     * Detect if device is mobile/touch
     */
    detectMobile() {
        return (
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        );
    }

    /**
     * Enable mobile controls
     */
    enable() {
        if (this.enabled) return;
        this.enabled = true;

        // Bind event handlers
        this._boundHandlers.touchstart = this.handleTouchStart.bind(this);
        this._boundHandlers.touchmove = this.handleTouchMove.bind(this);
        this._boundHandlers.touchend = this.handleTouchEnd.bind(this);
        this._boundHandlers.touchcancel = this.handleTouchEnd.bind(this);

        // Add listeners
        this.canvas.addEventListener('touchstart', this._boundHandlers.touchstart, { passive: false });
        this.canvas.addEventListener('touchmove', this._boundHandlers.touchmove, { passive: false });
        this.canvas.addEventListener('touchend', this._boundHandlers.touchend, { passive: false });
        this.canvas.addEventListener('touchcancel', this._boundHandlers.touchcancel, { passive: false });

        // Update positions
        this.updatePositions();

        console.log('Mobile controls enabled');
    }

    /**
     * Disable mobile controls
     */
    disable() {
        if (!this.enabled) return;
        this.enabled = false;

        // Remove listeners
        this.canvas.removeEventListener('touchstart', this._boundHandlers.touchstart);
        this.canvas.removeEventListener('touchmove', this._boundHandlers.touchmove);
        this.canvas.removeEventListener('touchend', this._boundHandlers.touchend);
        this.canvas.removeEventListener('touchcancel', this._boundHandlers.touchcancel);

        // Reset state
        this.resetState();

        console.log('Mobile controls disabled');
    }

    /**
     * Reset all touch states
     */
    resetState() {
        this.joystick.active = false;
        this.joystick.dx = 0;
        this.joystick.dy = 0;
        this.joystick.touchId = null;
        this.fireButton.active = false;
        this.fireButton.touchId = null;
        this.bombButton.active = false;
        this.bombButton.touchId = null;
    }

    /**
     * Update control positions based on canvas size
     */
    updatePositions() {
        const w = config.screen.width;
        const h = config.screen.height;

        // Joystick on bottom-left
        this.joystick.baseX = this.margin + this.joystickBaseRadius;
        this.joystick.baseY = h - this.margin - this.joystickBaseRadius;
        this.joystick.stickX = this.joystick.baseX;
        this.joystick.stickY = this.joystick.baseY;

        // Fire button on bottom-right
        this.fireButton.x = w - this.margin - this.fireButtonRadius;
        this.fireButton.y = h - this.margin - this.fireButtonRadius;

        // Bomb button above fire button
        this.bombButton.x = w - this.margin - this.bombButtonRadius;
        this.bombButton.y = this.fireButton.y - this.fireButtonRadius - this.buttonSpacing - this.bombButtonRadius;
    }

    /**
     * Resize handler
     */
    resize(width, height) {
        this.updatePositions();
        this.invalidateRectCache();
    }

    /**
     * Get touch position relative to canvas
     * Performance: Uses cached bounding rect to avoid layout thrashing
     */
    getTouchPosition(touch) {
        // Cache rect for 100ms to avoid expensive getBoundingClientRect calls
        const now = performance.now();
        if (!this._cachedRect || now - this._rectCacheTime > 100) {
            this._cachedRect = this.canvas.getBoundingClientRect();
            this._rectCacheTime = now;
        }
        const rect = this._cachedRect;
        return {
            x: (touch.clientX - rect.left) * (config.screen.width / rect.width),
            y: (touch.clientY - rect.top) * (config.screen.height / rect.height)
        };
    }

    /**
     * Invalidate cached rect (call on resize)
     */
    invalidateRectCache() {
        this._cachedRect = null;
    }

    /**
     * Check if position is within joystick area
     */
    isInJoystickArea(x, y) {
        // Use a larger touch area for joystick (left third of screen)
        return x < config.screen.width / 3;
    }

    /**
     * Check if position is on fire button
     * Optimized: uses squared distance to avoid sqrt
     */
    isOnFireButton(x, y) {
        const dx = x - this.fireButton.x;
        const dy = y - this.fireButton.y;
        const distSq = dx * dx + dy * dy;
        const radiusSq = (this.fireButtonRadius * 1.5) ** 2; // Larger touch area
        return distSq <= radiusSq;
    }

    /**
     * Check if position is on bomb button
     * Optimized: uses squared distance to avoid sqrt
     */
    isOnBombButton(x, y) {
        const dx = x - this.bombButton.x;
        const dy = y - this.bombButton.y;
        const distSq = dx * dx + dy * dy;
        const radiusSq = (this.bombButtonRadius * 1.5) ** 2; // Larger touch area
        return distSq <= radiusSq;
    }

    /**
     * Handle touch start
     */
    handleTouchStart(e) {
        e.preventDefault();

        for (const touch of e.changedTouches) {
            const pos = this.getTouchPosition(touch);

            // Check joystick area
            if (this.joystick.touchId === null && this.isInJoystickArea(pos.x, pos.y)) {
                this.joystick.active = true;
                this.joystick.touchId = touch.identifier;
                this.joystick.baseX = pos.x;
                this.joystick.baseY = pos.y;
                this.joystick.stickX = pos.x;
                this.joystick.stickY = pos.y;
                this.joystick.dx = 0;
                this.joystick.dy = 0;
                continue;
            }

            // Check fire button
            if (this.fireButton.touchId === null && this.isOnFireButton(pos.x, pos.y)) {
                this.fireButton.active = true;
                this.fireButton.touchId = touch.identifier;
                continue;
            }

            // Check bomb button
            if (this.bombButton.touchId === null && this.isOnBombButton(pos.x, pos.y)) {
                this.bombButton.active = true;
                this.bombButton.touchId = touch.identifier;
                continue;
            }

            // Right side of screen (not on buttons) = fire
            if (pos.x > config.screen.width / 2 && this.fireButton.touchId === null) {
                this.fireButton.active = true;
                this.fireButton.touchId = touch.identifier;
            }
        }
    }

    /**
     * Handle touch move
     */
    handleTouchMove(e) {
        e.preventDefault();

        for (const touch of e.changedTouches) {
            // Update joystick
            if (touch.identifier === this.joystick.touchId) {
                const pos = this.getTouchPosition(touch);

                const dx = pos.x - this.joystick.baseX;
                const dy = pos.y - this.joystick.baseY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 0) {
                    // Clamp to max distance
                    const clampedDist = Math.min(dist, this.joystickMaxDistance);
                    const normalizedDist = clampedDist / this.joystickMaxDistance;

                    // Update stick position
                    this.joystick.stickX = this.joystick.baseX + (dx / dist) * clampedDist;
                    this.joystick.stickY = this.joystick.baseY + (dy / dist) * clampedDist;

                    // Update direction (-1 to 1)
                    this.joystick.dx = (dx / dist) * normalizedDist;
                    this.joystick.dy = (dy / dist) * normalizedDist;
                } else {
                    this.joystick.stickX = this.joystick.baseX;
                    this.joystick.stickY = this.joystick.baseY;
                    this.joystick.dx = 0;
                    this.joystick.dy = 0;
                }
            }
        }
    }

    /**
     * Handle touch end
     */
    handleTouchEnd(e) {
        e.preventDefault();

        for (const touch of e.changedTouches) {
            // Release joystick
            if (touch.identifier === this.joystick.touchId) {
                this.joystick.active = false;
                this.joystick.touchId = null;
                this.joystick.dx = 0;
                this.joystick.dy = 0;
                // Reset stick to default position
                this.updatePositions();
            }

            // Release fire button
            if (touch.identifier === this.fireButton.touchId) {
                this.fireButton.active = false;
                this.fireButton.touchId = null;
            }

            // Release bomb button
            if (touch.identifier === this.bombButton.touchId) {
                this.bombButton.active = false;
                this.bombButton.touchId = null;
            }
        }
    }

    /**
     * Update animation state
     */
    update(deltaTime) {
        this.pulsePhase += deltaTime * 0.003;
        if (this.pulsePhase > Math.PI * 2) {
            this.pulsePhase -= Math.PI * 2;
        }
    }

    /**
     * Get current movement direction
     */
    getMovement() {
        return {
            x: this.joystick.dx,
            y: this.joystick.dy
        };
    }

    /**
     * Check if fire button is pressed
     */
    isFiring() {
        return this.fireButton.active;
    }

    /**
     * Check if bomb button is pressed
     */
    isBombing() {
        return this.bombButton.active;
    }

    /**
     * Draw the touch controls
     */
    draw(ctx) {
        if (!this.enabled || !this.visible) return;

        ctx.save();

        const pulse = Math.sin(this.pulsePhase) * 0.1 + 0.9;

        // Draw joystick
        this.drawJoystick(ctx, pulse);

        // Draw fire button
        this.drawFireButton(ctx, pulse);

        // Draw bomb button
        this.drawBombButton(ctx, pulse);

        ctx.restore();
    }

    /**
     * Draw joystick control
     */
    drawJoystick(ctx, pulse) {
        const baseAlpha = this.joystick.active ? 0.6 : 0.3;
        const baseX = this.joystick.active ? this.joystick.baseX : (this.margin + this.joystickBaseRadius);
        const baseY = this.joystick.active ? this.joystick.baseY : (config.screen.height - this.margin - this.joystickBaseRadius);

        // Outer ring (base)
        ctx.globalAlpha = baseAlpha * pulse;
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(baseX, baseY, this.joystickBaseRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner circle guides
        ctx.globalAlpha = baseAlpha * 0.3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(baseX, baseY, this.joystickMaxDistance, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Direction indicators
        ctx.globalAlpha = baseAlpha * 0.4;
        ctx.fillStyle = '#00ffff';
        const arrowSize = 8;
        const arrowDist = this.joystickBaseRadius - 15;

        // Up arrow
        this.drawArrow(ctx, baseX, baseY - arrowDist, 0, arrowSize);
        // Down arrow
        this.drawArrow(ctx, baseX, baseY + arrowDist, Math.PI, arrowSize);
        // Left arrow
        this.drawArrow(ctx, baseX - arrowDist, baseY, -Math.PI / 2, arrowSize);
        // Right arrow
        this.drawArrow(ctx, baseX + arrowDist, baseY, Math.PI / 2, arrowSize);

        // Stick
        const stickX = this.joystick.active ? this.joystick.stickX : baseX;
        const stickY = this.joystick.active ? this.joystick.stickY : baseY;

        ctx.globalAlpha = this.joystick.active ? 0.9 : 0.5;

        // Stick outer glow - use cached gradient if position unchanged
        const cache = this._gradientCache;
        if (!cache.joystick ||
            cache.joystickPos.x !== stickX ||
            cache.joystickPos.y !== stickY) {
            cache.joystick = ctx.createRadialGradient(stickX, stickY, 0, stickX, stickY, this.joystickStickRadius);
            cache.joystick.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
            cache.joystick.addColorStop(0.5, 'rgba(0, 255, 255, 0.4)');
            cache.joystick.addColorStop(1, 'rgba(0, 255, 255, 0)');
            cache.joystickPos.x = stickX;
            cache.joystickPos.y = stickY;
        }

        ctx.fillStyle = cache.joystick;
        ctx.beginPath();
        ctx.arc(stickX, stickY, this.joystickStickRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Stick solid center
        ctx.fillStyle = this.joystick.active ? '#00ffff' : '#008888';
        ctx.beginPath();
        ctx.arc(stickX, stickY, this.joystickStickRadius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('MOVE', baseX, baseY + this.joystickBaseRadius + 20);
    }

    /**
     * Draw small arrow
     */
    drawArrow(ctx, x, y, rotation, size) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(-size * 0.6, size * 0.5);
        ctx.lineTo(size * 0.6, size * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    /**
     * Draw fire button
     */
    drawFireButton(ctx, pulse) {
        const x = this.fireButton.x;
        const y = this.fireButton.y;
        const radius = this.fireButtonRadius;
        const active = this.fireButton.active;

        // Outer glow - use cached gradient if position/state unchanged
        ctx.globalAlpha = active ? 0.8 : 0.3;
        const cache = this._gradientCache;
        if (!cache.fireGlow ||
            cache.firePos.x !== x ||
            cache.firePos.y !== y ||
            cache.fireActive !== active) {
            cache.fireGlow = ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius * 1.5);
            cache.fireGlow.addColorStop(0, active ? 'rgba(0, 255, 0, 0.5)' : 'rgba(0, 255, 0, 0.2)');
            cache.fireGlow.addColorStop(1, 'rgba(0, 255, 0, 0)');
            cache.firePos.x = x;
            cache.firePos.y = y;
            cache.fireActive = active;
        }
        ctx.fillStyle = cache.fireGlow;
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Button ring
        ctx.globalAlpha = active ? 0.9 : 0.4 * pulse;
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = active ? 4 : 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner fill
        if (active) {
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Cross-hair / target indicator
        ctx.globalAlpha = active ? 0.9 : 0.5;
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;

        // Vertical line
        ctx.beginPath();
        ctx.moveTo(x, y - radius * 0.4);
        ctx.lineTo(x, y + radius * 0.4);
        ctx.stroke();

        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(x - radius * 0.4, y);
        ctx.lineTo(x + radius * 0.4, y);
        ctx.stroke();

        // Center dot
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('FIRE', x, y + radius + 18);
    }

    /**
     * Draw bomb button
     */
    drawBombButton(ctx, pulse) {
        const x = this.bombButton.x;
        const y = this.bombButton.y;
        const radius = this.bombButtonRadius;
        const active = this.bombButton.active;

        // Outer glow - use cached gradient if position/state unchanged
        ctx.globalAlpha = active ? 0.8 : 0.3;
        const cache = this._gradientCache;
        if (!cache.bombGlow ||
            cache.bombPos.x !== x ||
            cache.bombPos.y !== y ||
            cache.bombActive !== active) {
            cache.bombGlow = ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius * 1.5);
            cache.bombGlow.addColorStop(0, active ? 'rgba(255, 255, 0, 0.5)' : 'rgba(255, 255, 0, 0.2)');
            cache.bombGlow.addColorStop(1, 'rgba(255, 255, 0, 0)');
            cache.bombPos.x = x;
            cache.bombPos.y = y;
            cache.bombActive = active;
        }
        ctx.fillStyle = cache.bombGlow;
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Button ring
        ctx.globalAlpha = active ? 0.9 : 0.4 * pulse;
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = active ? 4 : 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner fill
        if (active) {
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Bomb icon (simple explosion star)
        ctx.globalAlpha = active ? 0.9 : 0.5;
        ctx.fillStyle = '#ffff00';

        const spikes = 8;
        const outerR = radius * 0.5;
        const innerR = radius * 0.25;

        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const px = x + Math.cos(angle) * r;
            const py = y + Math.sin(angle) * r;
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();

        // Label
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('BOMB', x, y + radius + 16);
    }

    /**
     * Toggle visibility
     */
    setVisible(visible) {
        this.visible = visible;
    }

    /**
     * Check if mobile device
     */
    isMobileDevice() {
        return this.isMobile;
    }

    /**
     * Force enable (for testing)
     */
    forceEnable() {
        this.isMobile = true;
        this.enable();
    }
}
