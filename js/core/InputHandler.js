/**
 * Geometry 3044 - InputHandler Module
 * Handles keyboard, mouse, and touch input
 */

import { CONFIG } from '../config.js';

/**
 * InputHandler class - manages all input
 */
export class InputHandler {
    constructor(canvas) {
        this.canvas = canvas;

        // Keyboard state
        this.keys = {};
        this.keysPressed = {}; // For single-press detection
        this.keysReleased = {};

        // Mouse state
        this.mouse = {
            x: 0,
            y: 0,
            leftButton: false,
            rightButton: false,
            clicked: false
        };

        // Touch state
        this.touch = {
            active: false,
            joystick: {
                active: false,
                startX: 0,
                startY: 0,
                currentX: 0,
                currentY: 0,
                dx: 0,
                dy: 0
            },
            buttons: {
                fire: false,
                bomb: false
            }
        };

        // Action mappings
        this.actions = {
            moveUp: false,
            moveDown: false,
            moveLeft: false,
            moveRight: false,
            fire: false,
            bomb: false,
            pause: false,
            confirm: false,
            cancel: false
        };

        // Key bindings (configurable)
        this.keyBindings = {
            moveUp: ['ArrowUp', 'KeyW'],
            moveDown: ['ArrowDown', 'KeyS'],
            moveLeft: ['ArrowLeft', 'KeyA'],
            moveRight: ['ArrowRight', 'KeyD'],
            fire: ['Space', 'KeyZ'],
            bomb: ['KeyX', 'ShiftLeft', 'ShiftRight'],
            pause: ['Escape', 'KeyP'],
            confirm: ['Enter', 'Space'],
            cancel: ['Escape', 'Backspace']
        };

        // Touch zones (relative to canvas)
        this.touchZones = {
            joystickRadius: 100,
            buttonRadius: 50
        };

        // Bound event handlers (for removal)
        this._boundHandlers = {};

        // Initialize
        this.init();
    }

    /**
     * Initialize input event listeners
     */
    init() {
        // Keyboard events - use window, works without canvas
        this._boundHandlers.keydown = this.handleKeyDown.bind(this);
        this._boundHandlers.keyup = this.handleKeyUp.bind(this);
        window.addEventListener('keydown', this._boundHandlers.keydown);
        window.addEventListener('keyup', this._boundHandlers.keyup);

        // Mouse events - require canvas, fallback to document
        this._boundHandlers.mousemove = this.handleMouseMove.bind(this);
        this._boundHandlers.mousedown = this.handleMouseDown.bind(this);
        this._boundHandlers.mouseup = this.handleMouseUp.bind(this);

        if (this.canvas) {
            this.canvas.addEventListener('mousemove', this._boundHandlers.mousemove);
            this.canvas.addEventListener('mousedown', this._boundHandlers.mousedown);
            this.canvas.addEventListener('mouseup', this._boundHandlers.mouseup);
        } else {
            console.warn('InputHandler: Canvas not provided, using document for mouse events');
            document.addEventListener('mousemove', this._boundHandlers.mousemove);
            document.addEventListener('mousedown', this._boundHandlers.mousedown);
            document.addEventListener('mouseup', this._boundHandlers.mouseup);
        }

        // Touch events - require canvas
        this._boundHandlers.touchstart = this.handleTouchStart.bind(this);
        this._boundHandlers.touchmove = this.handleTouchMove.bind(this);
        this._boundHandlers.touchend = this.handleTouchEnd.bind(this);

        if (this.canvas) {
            this.canvas.addEventListener('touchstart', this._boundHandlers.touchstart, { passive: false });
            this.canvas.addEventListener('touchmove', this._boundHandlers.touchmove, { passive: false });
            this.canvas.addEventListener('touchend', this._boundHandlers.touchend, { passive: false });

            // Prevent context menu on right-click
            this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        }

        // Handle window blur (release all keys)
        this._boundHandlers.blur = this.handleBlur.bind(this);
        window.addEventListener('blur', this._boundHandlers.blur);

        console.log('✅ InputHandler initialized', this.canvas ? 'with canvas' : 'without canvas');
    }

    /**
     * Clean up event listeners
     */
    destroy() {
        window.removeEventListener('keydown', this._boundHandlers.keydown);
        window.removeEventListener('keyup', this._boundHandlers.keyup);
        window.removeEventListener('blur', this._boundHandlers.blur);

        if (this.canvas) {
            this.canvas.removeEventListener('mousemove', this._boundHandlers.mousemove);
            this.canvas.removeEventListener('mousedown', this._boundHandlers.mousedown);
            this.canvas.removeEventListener('mouseup', this._boundHandlers.mouseup);
            this.canvas.removeEventListener('touchstart', this._boundHandlers.touchstart);
            this.canvas.removeEventListener('touchmove', this._boundHandlers.touchmove);
            this.canvas.removeEventListener('touchend', this._boundHandlers.touchend);
        } else {
            document.removeEventListener('mousemove', this._boundHandlers.mousemove);
            document.removeEventListener('mousedown', this._boundHandlers.mousedown);
            document.removeEventListener('mouseup', this._boundHandlers.mouseup);
        }

        console.log('InputHandler destroyed');
    }

    /**
     * Handle key down event
     */
    handleKeyDown(e) {
        const code = e.code;
        const key = e.key;

        // Track press state (only fire once per press)
        if (!this.keys[code]) {
            this.keysPressed[code] = true;
        }

        // Set both code (KeyA) and key (a) for compatibility
        this.keys[code] = true;
        this.keys[key] = true;

        // Prevent default for game keys
        if (this.isGameKey(code)) {
            e.preventDefault();
        }
    }

    /**
     * Handle key up event
     */
    handleKeyUp(e) {
        const code = e.code;
        const key = e.key;
        // Clear both code (KeyA) and key (a) for compatibility
        this.keys[code] = false;
        this.keys[key] = false;
        this.keysReleased[code] = true;
    }

    /**
     * Handle window blur
     */
    handleBlur() {
        // Release all keys - clear properties instead of reassigning object
        // This preserves the object reference for globals.js connection
        for (const key in this.keys) {
            this.keys[key] = false;
        }
        this.keysPressed = {};
        this.keysReleased = {};
        this.mouse.leftButton = false;
        this.mouse.rightButton = false;
        this.touch.active = false;
        this.touch.joystick.active = false;
        this.touch.buttons.fire = false;
        this.touch.buttons.bomb = false;
    }

    /**
     * Handle mouse move
     */
    handleMouseMove(e) {
        if (this.canvas) {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = (e.clientX - rect.left) * (CONFIG.screen.width / rect.width);
            this.mouse.y = (e.clientY - rect.top) * (CONFIG.screen.height / rect.height);
        } else {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        }
    }

    /**
     * Handle mouse down
     */
    handleMouseDown(e) {
        if (e.button === 0) {
            this.mouse.leftButton = true;
            this.mouse.clicked = true;
        } else if (e.button === 2) {
            this.mouse.rightButton = true;
        }
    }

    /**
     * Handle mouse up
     */
    handleMouseUp(e) {
        if (e.button === 0) {
            this.mouse.leftButton = false;
        } else if (e.button === 2) {
            this.mouse.rightButton = false;
        }
    }

    /**
     * Handle touch start
     */
    handleTouchStart(e) {
        e.preventDefault();
        this.touch.active = true;

        for (const touch of e.changedTouches) {
            const pos = this.getTouchPosition(touch);

            // Left side = joystick
            if (pos.x < CONFIG.screen.width / 2) {
                this.touch.joystick.active = true;
                this.touch.joystick.startX = pos.x;
                this.touch.joystick.startY = pos.y;
                this.touch.joystick.currentX = pos.x;
                this.touch.joystick.currentY = pos.y;
                this.touch.joystick.dx = 0;
                this.touch.joystick.dy = 0;
            }
            // Right side = buttons
            else {
                // Top right = bomb
                if (pos.y < CONFIG.screen.height / 2) {
                    this.touch.buttons.bomb = true;
                }
                // Bottom right = fire
                else {
                    this.touch.buttons.fire = true;
                }
            }
        }
    }

    /**
     * Handle touch move
     */
    handleTouchMove(e) {
        e.preventDefault();

        for (const touch of e.changedTouches) {
            const pos = this.getTouchPosition(touch);

            // Update joystick if active
            if (this.touch.joystick.active && pos.x < CONFIG.screen.width / 2) {
                this.touch.joystick.currentX = pos.x;
                this.touch.joystick.currentY = pos.y;

                // Calculate direction
                const dx = pos.x - this.touch.joystick.startX;
                const dy = pos.y - this.touch.joystick.startY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Normalize and clamp
                if (distance > 0) {
                    const maxDistance = this.touchZones.joystickRadius;
                    const clampedDistance = Math.min(distance, maxDistance);
                    this.touch.joystick.dx = (dx / distance) * (clampedDistance / maxDistance);
                    this.touch.joystick.dy = (dy / distance) * (clampedDistance / maxDistance);
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
            const pos = this.getTouchPosition(touch);

            // Left side = release joystick
            if (pos.x < CONFIG.screen.width / 2) {
                this.touch.joystick.active = false;
                this.touch.joystick.dx = 0;
                this.touch.joystick.dy = 0;
            }
            // Right side = release buttons
            else {
                if (pos.y < CONFIG.screen.height / 2) {
                    this.touch.buttons.bomb = false;
                } else {
                    this.touch.buttons.fire = false;
                }
            }
        }

        // Check if any touches remain
        if (e.touches.length === 0) {
            this.touch.active = false;
            this.touch.joystick.active = false;
            this.touch.buttons.fire = false;
            this.touch.buttons.bomb = false;
        }
    }

    /**
     * Get touch position relative to canvas
     */
    getTouchPosition(touch) {
        if (this.canvas) {
            const rect = this.canvas.getBoundingClientRect();
            return {
                x: (touch.clientX - rect.left) * (CONFIG.screen.width / rect.width),
                y: (touch.clientY - rect.top) * (CONFIG.screen.height / rect.height)
            };
        }
        return { x: touch.clientX, y: touch.clientY };
    }

    /**
     * Check if a key code is used by the game
     */
    isGameKey(code) {
        for (const action in this.keyBindings) {
            if (this.keyBindings[action].includes(code)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if an action is active (held down)
     */
    isActionActive(action) {
        // Check keyboard
        const bindings = this.keyBindings[action];
        if (bindings) {
            for (const key of bindings) {
                if (this.keys[key]) {
                    return true;
                }
            }
        }

        // Check touch
        if (action === 'fire' && this.touch.buttons.fire) return true;
        if (action === 'bomb' && this.touch.buttons.bomb) return true;

        // Check mouse
        if (action === 'fire' && this.mouse.leftButton) return true;
        if (action === 'bomb' && this.mouse.rightButton) return true;

        return false;
    }

    /**
     * Check if an action was just pressed (single frame)
     */
    isActionPressed(action) {
        const bindings = this.keyBindings[action];
        if (bindings) {
            for (const key of bindings) {
                if (this.keysPressed[key]) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Get movement vector (normalized)
     */
    getMovement() {
        let dx = 0;
        let dy = 0;

        // Keyboard input
        if (this.isActionActive('moveLeft')) dx -= 1;
        if (this.isActionActive('moveRight')) dx += 1;
        if (this.isActionActive('moveUp')) dy -= 1;
        if (this.isActionActive('moveDown')) dy += 1;

        // Touch joystick input
        if (this.touch.joystick.active) {
            dx += this.touch.joystick.dx;
            dy += this.touch.joystick.dy;
        }

        // Normalize diagonal movement
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        if (magnitude > 1) {
            dx /= magnitude;
            dy /= magnitude;
        }

        return { x: dx, y: dy };
    }

    /**
     * Update input state - call once per frame at end
     */
    update() {
        // Update action states
        this.actions.moveUp = this.isActionActive('moveUp');
        this.actions.moveDown = this.isActionActive('moveDown');
        this.actions.moveLeft = this.isActionActive('moveLeft');
        this.actions.moveRight = this.isActionActive('moveRight');
        this.actions.fire = this.isActionActive('fire');
        this.actions.bomb = this.isActionActive('bomb');
        this.actions.pause = this.isActionPressed('pause');
        this.actions.confirm = this.isActionPressed('confirm');
        this.actions.cancel = this.isActionPressed('cancel');

        // Clear single-frame states
        this.keysPressed = {};
        this.keysReleased = {};
        this.mouse.clicked = false;
    }

    /**
     * Get raw keys state (for compatibility)
     */
    getKeys() {
        return this.keys;
    }

    /**
     * Get touch state (for compatibility)
     */
    getTouchState() {
        return {
            joystick: this.touch.joystick,
            buttons: this.touch.buttons
        };
    }

    /**
     * Draw touch controls (visual feedback)
     */
    drawTouchControls(ctx) {
        if (!this.touch.active) return;

        ctx.save();
        ctx.globalAlpha = 0.3;

        // Draw joystick
        if (this.touch.joystick.active) {
            // Base circle
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(
                this.touch.joystick.startX,
                this.touch.joystick.startY,
                this.touchZones.joystickRadius,
                0,
                Math.PI * 2
            );
            ctx.stroke();

            // Stick position
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(
                this.touch.joystick.currentX,
                this.touch.joystick.currentY,
                20,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        // Draw fire button
        const fireX = CONFIG.screen.width - 80;
        const fireY = CONFIG.screen.height - 100;
        ctx.strokeStyle = this.touch.buttons.fire ? '#00ff00' : '#00ff0080';
        ctx.fillStyle = this.touch.buttons.fire ? '#00ff0040' : 'transparent';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(fireX, fireY, this.touchZones.buttonRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#00ff00';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('FIRE', fireX, fireY);

        // Draw bomb button
        const bombX = CONFIG.screen.width - 80;
        const bombY = 100;
        ctx.strokeStyle = this.touch.buttons.bomb ? '#ffff00' : '#ffff0080';
        ctx.fillStyle = this.touch.buttons.bomb ? '#ffff0040' : 'transparent';
        ctx.beginPath();
        ctx.arc(bombX, bombY, this.touchZones.buttonRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffff00';
        ctx.fillText('BOMB', bombX, bombY);

        ctx.restore();
    }
}
