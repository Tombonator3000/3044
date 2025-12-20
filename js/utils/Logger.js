/**
 * Geometry 3044 - Logger Utility
 * Centralized logging with debug flag control
 */

import { config } from '../config.js';

/**
 * Logger class for controlled console output
 * All logging respects config.debug settings
 */
class Logger {
    constructor() {
        this.prefix = '🎮';
    }

    /**
     * Check if logging is enabled for a category
     */
    isEnabled(category = 'enabled') {
        return config.debug.enabled && (category === 'enabled' || config.debug[category]);
    }

    /**
     * General log - only when debug.enabled is true
     */
    log(message, ...args) {
        if (this.isEnabled()) {
            console.log(`${this.prefix} ${message}`, ...args);
        }
    }

    /**
     * Game events log (waves, spawns, etc.)
     */
    game(message, ...args) {
        if (this.isEnabled('logGameEvents')) {
            console.log(`🌊 ${message}`, ...args);
        }
    }

    /**
     * Audio events log
     */
    audio(message, ...args) {
        if (this.isEnabled('logAudio')) {
            console.log(`🔊 ${message}`, ...args);
        }
    }

    /**
     * Input events log
     */
    input(message, ...args) {
        if (this.isEnabled('logInput')) {
            console.log(`🎮 ${message}`, ...args);
        }
    }

    /**
     * Performance log
     */
    perf(message, ...args) {
        if (this.isEnabled('logPerformance')) {
            console.log(`⚡ ${message}`, ...args);
        }
    }

    /**
     * Warning - always shown when debug is enabled
     */
    warn(message, ...args) {
        if (this.isEnabled()) {
            console.warn(`⚠️ ${message}`, ...args);
        }
    }

    /**
     * Error - always shown (important for debugging)
     */
    error(message, ...args) {
        console.error(`❌ ${message}`, ...args);
    }

    /**
     * Group start for organized logging
     */
    group(label) {
        if (this.isEnabled()) {
            console.group(label);
        }
    }

    /**
     * Group end
     */
    groupEnd() {
        if (this.isEnabled()) {
            console.groupEnd();
        }
    }
}

// Singleton instance
export const logger = new Logger();

// Default export for convenience
export default logger;
