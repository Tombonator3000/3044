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

        this.stopCurrentMusic(0.5);

        // Wait for fade out before starting new track
        setTimeout(() => {
            if (!this.musicEnabled) return;

            const source = this.audioContext.createBufferSource();
            source.buffer = this.menuMusic;
            source.loop = true;
            source.connect(this.musicGain);
            source.start(0);

            this.currentSource = source;
            this.currentTrack = 'menu';

            console.log('🎵 Playing menu music');
        }, 500);
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

        this.stopCurrentMusic(0.3);

        // Wait for fade out before starting new track
        setTimeout(() => {
            if (!this.musicEnabled) return;

            // Select random track
            const randomIndex = Math.floor(Math.random() * this.gameTracks.length);
            const track = this.gameTracks[randomIndex];

            const source = this.audioContext.createBufferSource();
            source.buffer = track.buffer;
            source.loop = true;
            source.connect(this.musicGain);
            source.start(0);

            this.currentSource = source;
            this.currentTrack = track.name;

            console.log(`🎵 Playing game music: ${track.name}`);
        }, 300);
    }

    /**
     * Stop current music with optional fade out
     */
    stopCurrentMusic(fadeTime = 0.5) {
        if (!this.currentSource) return;

        try {
            if (fadeTime > 0 && this.musicGain) {
                const now = this.audioContext.currentTime;
                this.musicGain.gain.setValueAtTime(this.volume, now);
                this.musicGain.gain.linearRampToValueAtTime(0, now + fadeTime);

                // Restore volume after fade
                setTimeout(() => {
                    if (this.musicGain) {
                        this.musicGain.gain.value = this.volume;
                    }
                }, fadeTime * 1000);

                // Stop source after fade
                setTimeout(() => {
                    try {
                        if (this.currentSource) {
                            this.currentSource.stop();
                        }
                    } catch (e) {}
                }, fadeTime * 1000);
            } else {
                this.currentSource.stop();
            }
        } catch (e) {
            // Source might already be stopped
        }

        this.currentSource = null;
        this.currentTrack = null;
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
