/**
 * Geometry 3044 - UI Module Index
 * Phase 6: UI Components (Menus, HUD, ComboDisplay, Options)
 */

// Main UI classes
export { MenuManager, MenuState } from './MenuManager.js';
export { HUD } from './HUD.js';
export { ComboDisplay } from './ComboDisplay.js';
// RadicalSlangUI removed - never imported anywhere (use effects/RadicalSlang.js instead)
export { OptionsMenu } from './OptionsMenu.js';
export { BestiaryScreen } from './BestiaryScreen.js';

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
