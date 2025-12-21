/**
 * Geometry 3044 - MusicManager
 * Handles background music playback for menu and in-game
 * - Menu.mp3 for start screen
 * - game1.mp3-game5.mp3 for in-game music (random selection)
 */

export class MusicManager {
    constructor() {
        this.audioContext = null;
        this.musicGain = null;

        // Music tracks
        this.menuMusic = null;
        this.gameTracks = [];
        this.currentSource = null;
        this.currentTrack = null;

        // State
        this.initialized = false;
        this.musicEnabled = true;
        this.volume = 0.5;

        // Track which game tracks are loaded
        this.loadedGameTracks = [];

        // Transition state
        this.isTransitioning = false;
        this.pendingPlay = null;

        // Track sources that are fading out to prevent overlap
        this.fadingOutSources = [];
    }

    /**
     * Initialize audio context (must be called from user interaction)
     */
    async init() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create music gain node
            this.musicGain = this.audioContext.createGain();
            this.musicGain.gain.value = this.volume;
            this.musicGain.connect(this.audioContext.destination);

            this.initialized = true;
            console.log('🎵 MusicManager initialized');

            // Load all music files
            await this.loadAllMusic();
        } catch (error) {
            console.warn('MusicManager initialization failed:', error);
        }
    }

    /**
     * Resume audio context if suspended
     */
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    /**
     * Load all music files
     */
    async loadAllMusic() {
        // Load menu music
        await this.loadMenuMusic();

        // Load game tracks (game1.mp3 through game5.mp3)
        await this.loadGameTracks();
    }

    /**
     * Load menu music
     */
    async loadMenuMusic() {
        try {
            const response = await fetch('assets/audio/Menu.mp3');
            if (!response.ok) {
                console.warn('Menu.mp3 not found');
                return;
            }
            const arrayBuffer = await response.arrayBuffer();
            this.menuMusic = await this.audioContext.decodeAudioData(arrayBuffer);
            console.log('🎵 Menu music loaded: Menu.mp3');
        } catch (error) {
            console.warn('Failed to load Menu.mp3:', error);
        }
    }

    /**
     * Load game tracks (game1.mp3 through game5.mp3)
     */
    async loadGameTracks() {
        const trackNames = ['game1.mp3', 'game2.mp3', 'game3.mp3', 'game4.mp3', 'game5.mp3'];

        for (const trackName of trackNames) {
            try {
                const response = await fetch(`assets/audio/${trackName}`);
                if (!response.ok) {
                    console.log(`🎵 ${trackName} not available`);
                    continue;
                }
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.gameTracks.push({
                    name: trackName,
                    buffer: audioBuffer
                });
                this.loadedGameTracks.push(trackName);
                console.log(`🎵 Game track loaded: ${trackName}`);
            } catch (error) {
                console.log(`🎵 ${trackName} not available`);
            }
        }

        console.log(`🎵 Total game tracks loaded: ${this.gameTracks.length}`);
    }

    /**
     * Play menu music
     */
    playMenuMusic() {
        if (!this.initialized || !this.musicEnabled) return;
        if (!this.menuMusic) {
            console.warn('Menu music not loaded');
            return;
        }

        // If already playing menu music, don't restart
        if (this.currentTrack === 'menu') return;

        this.transitionTo('menu', this.menuMusic, 0.5);
    }

    /**
     * Play a random game track
     */
    playGameMusic() {
        if (!this.initialized || !this.musicEnabled) return;
        if (this.gameTracks.length === 0) {
            console.warn('No game tracks loaded');
            return;
        }

        // Select random track
        const randomIndex = Math.floor(Math.random() * this.gameTracks.length);
        const track = this.gameTracks[randomIndex];

        this.transitionTo(track.name, track.buffer, 0.3);
    }

    /**
     * Stop all fading out sources immediately
     */
    stopAllFadingSources() {
        for (const source of this.fadingOutSources) {
            try {
                source.stop();
            } catch (e) {
                // Source might already be stopped
            }
        }
        this.fadingOutSources = [];
    }

    /**
     * Seamlessly transition from current music to new track
     * @param {string} trackName - Name of the new track
     * @param {AudioBuffer} buffer - Audio buffer to play
     * @param {number} fadeTime - Fade out time in seconds
     */
    transitionTo(trackName, buffer, fadeTime = 0.5) {
        // Cancel any pending transitions
        if (this.pendingPlay) {
            clearTimeout(this.pendingPlay);
            this.pendingPlay = null;
        }

        // Stop any sources that are still fading out to prevent overlap
        this.stopAllFadingSources();

        // Keep reference to old source for stopping
        const oldSource = this.currentSource;

        // Cancel any ongoing gain automations
        if (this.musicGain) {
            this.musicGain.gain.cancelScheduledValues(this.audioContext.currentTime);
        }

        // Clear current references immediately
        this.currentSource = null;
        this.currentTrack = null;

        // If there's current music, fade it out
        if (oldSource && fadeTime > 0) {
            this.isTransitioning = true;
            const now = this.audioContext.currentTime;

            // Track the old source for cleanup
            this.fadingOutSources.push(oldSource);

            // Create a separate gain node for fading out the old source
            const fadeGain = this.audioContext.createGain();
            fadeGain.connect(this.audioContext.destination);
            fadeGain.gain.setValueAtTime(this.volume, now);
            fadeGain.gain.linearRampToValueAtTime(0, now + fadeTime);

            // Disconnect old source from main gain and connect to fade gain
            try {
                oldSource.disconnect();
                oldSource.connect(fadeGain);
            } catch (e) {
                // Source might already be stopped
            }

            // Stop old source after fade completes
            const sourceToStop = oldSource;
            setTimeout(() => {
                try {
                    sourceToStop.stop();
                } catch (e) {
                    // Source might already be stopped
                }
                // Remove from fading sources list
                const index = this.fadingOutSources.indexOf(sourceToStop);
                if (index > -1) {
                    this.fadingOutSources.splice(index, 1);
                }
            }, fadeTime * 1000);

            // Start new track immediately (parallel with fade out)
            this.startTrack(trackName, buffer);
        } else {
            // No current music or no fade, stop immediately and start
            if (oldSource) {
                try {
                    oldSource.stop();
                } catch (e) {}
            }
            this.startTrack(trackName, buffer);
        }
    }

    /**
     * Start playing a track (internal method)
     */
    startTrack(trackName, buffer) {
        // Reset gain to target volume
        if (this.musicGain) {
            this.musicGain.gain.cancelScheduledValues(this.audioContext.currentTime);
            this.musicGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(this.musicGain);
        source.start(0);

        this.currentSource = source;
        this.currentTrack = trackName;
        this.isTransitioning = false;

        console.log(`🎵 Playing: ${trackName}`);
    }

    /**
     * Stop current music with optional fade out
     */
    stopCurrentMusic(fadeTime = 0.5) {
        // Cancel any pending transitions
        if (this.pendingPlay) {
            clearTimeout(this.pendingPlay);
            this.pendingPlay = null;
        }

        // Stop all fading sources immediately
        this.stopAllFadingSources();

        if (!this.currentSource) return;

        const sourceToStop = this.currentSource;
        this.currentSource = null;
        this.currentTrack = null;

        try {
            if (fadeTime > 0 && this.musicGain) {
                const now = this.audioContext.currentTime;
                this.musicGain.gain.cancelScheduledValues(now);
                this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
                this.musicGain.gain.linearRampToValueAtTime(0, now + fadeTime);

                // Stop source after fade
                setTimeout(() => {
                    try {
                        sourceToStop.stop();
                    } catch (e) {}
                    // Restore volume
                    if (this.musicGain) {
                        this.musicGain.gain.cancelScheduledValues(this.audioContext.currentTime);
                        this.musicGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
                    }
                }, fadeTime * 1000);
            } else {
                sourceToStop.stop();
            }
        } catch (e) {
            // Source might already be stopped
        }
    }

    /**
     * Set music volume
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.musicGain) {
            this.musicGain.gain.value = this.volume;
        }
    }

    /**
     * Toggle music on/off
     */
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;

        if (!this.musicEnabled) {
            this.stopCurrentMusic(0.2);
        }

        return this.musicEnabled;
    }

    /**
     * Enable music
     */
    enableMusic() {
        this.musicEnabled = true;
    }

    /**
     * Disable music
     */
    disableMusic() {
        this.musicEnabled = false;
        this.stopCurrentMusic(0.2);
    }

    /**
     * Pause music (reduces volume to 0)
     */
    pauseMusic() {
        if (this.musicGain) {
            this.musicGain.gain.value = 0;
        }
    }

    /**
     * Resume music (restores volume)
     */
    resumeMusic() {
        if (this.musicGain) {
            this.musicGain.gain.value = this.volume;
        }
    }

    /**
     * Check if music is enabled
     */
    isEnabled() {
        return this.musicEnabled;
    }

    /**
     * Get current playing track name
     */
    getCurrentTrack() {
        return this.currentTrack;
    }

    /**
     * Get list of loaded game tracks
     */
    getLoadedGameTracks() {
        return this.loadedGameTracks;
    }
}
