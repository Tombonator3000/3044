/**
 * Geometry 3044 - UI Module Index
 * Phase 6: UI Components (Menus, HUD, ComboDisplay, RadicalSlang, Options)
 */

// Main UI classes
export { MenuManager, MenuState } from './MenuManager.js';
export { HUD } from './HUD.js';
export { ComboDisplay } from './ComboDisplay.js';
export { RadicalSlangUI } from './RadicalSlang.js';
export { OptionsMenu } from './OptionsMenu.js';

// HUD Theme system
export { HUD_THEMES, DEFAULT_THEME, getTheme, getAllThemes } from './HUDThemes.js';

// HUD Components (for advanced customization)
export {
    ScoreDisplay,
    LivesDisplay,
    WaveDisplay,
    BombsDisplay,
    ComboMeter,
    BossHealthBar,
    PowerUpSlots,
    HighScoreDisplay,
    MultiplierPopup
} from './components/index.js';
