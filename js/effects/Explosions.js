/**
 * Geometry 3044 - Explosions Module
 *
 * NOTE: This module was cleaned up during code audit.
 *
 * REMOVED:
 * - Epic80sExplosion class: Never instantiated anywhere in the codebase.
 *   Explosion effects are handled by ParticleSystem.explosion() method.
 *
 * - RadicalSlang class: Duplicate of effects/RadicalSlang.js which is
 *   the version actually imported and used by main.js.
 *
 * If these classes are needed in the future:
 * - For explosions: Use ParticleSystem.explosion() or restore from git
 * - For slang popups: Import from './RadicalSlang.js'
 */

// Explosion effects are handled by ParticleSystem
// Radical slang is handled by effects/RadicalSlang.js
