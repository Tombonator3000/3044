/**
 * Geometry 3044 - SoundSystem Module
 * Handles all audio: sound effects and music
 */

import { CONFIG } from '../config.js';

/**
 * SoundSystem Class
 * Web Audio API based sound system with pooling
 */
export class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.musicGain = null;

        this.sounds = {};
        this.music = {
            menu: null,
            game: null,
            boss: null
        };

        this.currentMusic = null;
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.initialized = false;

        // Volume levels
        this.masterVolume = 1.0;
        this.sfxVolume = 0.7;
        this.musicVolume = CONFIG.audio.musicVolume;

        // Sound pool for frequently used sounds
        this.soundPools = {};
        this.poolSize = 5;
    }

    /**
     * Initialize the audio context (must be called from user interaction)
     */
    async init() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create gain nodes
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.masterVolume;

            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.connect(this.masterGain);
            this.sfxGain.gain.value = this.sfxVolume;

            this.musicGain = this.audioContext.createGain();
            this.musicGain.connect(this.masterGain);
            this.musicGain.gain.value = this.musicVolume;

            // Generate procedural sounds
            this.generateSounds();

            this.initialized = true;
            console.log('🔊 SoundSystem initialized');
        } catch (error) {
            console.warn('⚠️ SoundSystem initialization failed:', error);
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
     * Generate procedural sound effects
     */
    generateSounds() {
        // Player shoot
        this.sounds.playerShoot = this.createSynthSound({
            type: 'square',
            frequency: 880,
            duration: 0.08,
            attack: 0.01,
            decay: 0.07,
            pitchDecay: 0.5
        });

        // Enemy shoot
        this.sounds.enemyShoot = this.createSynthSound({
            type: 'sawtooth',
            frequency: 440,
            duration: 0.1,
            attack: 0.01,
            decay: 0.09,
            pitchDecay: 0.3
        });

        // Small explosion
        this.sounds.explosionSmall = this.createNoiseSound({
            duration: 0.2,
            attack: 0.01,
            decay: 0.19,
            filterStart: 2000,
            filterEnd: 100
        });

        // Large explosion
        this.sounds.explosionLarge = this.createNoiseSound({
            duration: 0.5,
            attack: 0.02,
            decay: 0.48,
            filterStart: 3000,
            filterEnd: 50
        });

        // Player death
        this.sounds.playerDeath = this.createSynthSound({
            type: 'sawtooth',
            frequency: 200,
            duration: 0.6,
            attack: 0.01,
            decay: 0.59,
            pitchDecay: 0.9
        });

        // Power-up collect
        this.sounds.powerUp = this.createSynthSound({
            type: 'sine',
            frequency: 440,
            duration: 0.3,
            attack: 0.01,
            decay: 0.29,
            pitchDecay: -0.5 // Rising pitch
        });

        // Bomb activation
        this.sounds.bomb = this.createSynthSound({
            type: 'sine',
            frequency: 100,
            duration: 0.8,
            attack: 0.1,
            decay: 0.7,
            pitchDecay: 0.8
        });

        // Wave complete
        this.sounds.waveComplete = this.createArpeggioSound([523, 659, 784, 1047], 0.15);

        // Menu select
        this.sounds.menuSelect = this.createSynthSound({
            type: 'square',
            frequency: 660,
            duration: 0.1,
            attack: 0.01,
            decay: 0.09,
            pitchDecay: 0
        });

        // Menu hover
        this.sounds.menuHover = this.createSynthSound({
            type: 'sine',
            frequency: 440,
            duration: 0.05,
            attack: 0.01,
            decay: 0.04,
            pitchDecay: 0
        });

        // Hit sound
        this.sounds.hit = this.createSynthSound({
            type: 'triangle',
            frequency: 200,
            duration: 0.08,
            attack: 0.005,
            decay: 0.075,
            pitchDecay: 0.3
        });

        // Coin insert
        this.sounds.coin = this.createArpeggioSound([880, 1108], 0.1);

        console.log('🎵 Procedural sounds generated');
    }

    /**
     * Create a synthesized sound
     */
    createSynthSound(options) {
        return {
            type: 'synth',
            waveform: options.type || 'sine',
            frequency: options.frequency || 440,
            duration: options.duration || 0.2,
            attack: options.attack || 0.01,
            decay: options.decay || 0.1,
            pitchDecay: options.pitchDecay || 0
        };
    }

    /**
     * Create a noise-based sound
     */
    createNoiseSound(options) {
        return {
            type: 'noise',
            duration: options.duration || 0.2,
            attack: options.attack || 0.01,
            decay: options.decay || 0.19,
            filterStart: options.filterStart || 2000,
            filterEnd: options.filterEnd || 100
        };
    }

    /**
     * Create an arpeggio sound
     */
    createArpeggioSound(frequencies, noteLength) {
        return {
            type: 'arpeggio',
            frequencies: frequencies,
            noteLength: noteLength || 0.1
        };
    }

    /**
     * Play a sound effect
     */
    play(soundName, volume = 1.0, pitch = 1.0) {
        if (!this.initialized || !this.sfxEnabled) return;
        if (!this.sounds[soundName]) {
            console.warn(`Sound not found: ${soundName}`);
            return;
        }

        const sound = this.sounds[soundName];

        switch (sound.type) {
            case 'synth':
                this.playSynthSound(sound, volume, pitch);
                break;
            case 'noise':
                this.playNoiseSound(sound, volume);
                break;
            case 'arpeggio':
                this.playArpeggioSound(sound, volume, pitch);
                break;
        }
    }

    /**
     * Play a synthesized sound
     */
    playSynthSound(sound, volume, pitch) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = sound.waveform;
        osc.frequency.value = sound.frequency * pitch;

        // Pitch envelope
        if (sound.pitchDecay !== 0) {
            const endFreq = sound.frequency * pitch * (1 - sound.pitchDecay);
            osc.frequency.exponentialRampToValueAtTime(
                Math.max(20, endFreq),
                this.audioContext.currentTime + sound.duration
            );
        }

        // Amplitude envelope
        const now = this.audioContext.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume * this.sfxVolume, now + sound.attack);
        gain.gain.exponentialRampToValueAtTime(0.001, now + sound.attack + sound.decay);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + sound.duration + 0.01);
    }

    /**
     * Play a noise-based sound
     */
    playNoiseSound(sound, volume) {
        const bufferSize = this.audioContext.sampleRate * sound.duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        // Fill with white noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = sound.filterStart;

        const gain = this.audioContext.createGain();

        // Frequency envelope
        const now = this.audioContext.currentTime;
        filter.frequency.exponentialRampToValueAtTime(
            sound.filterEnd,
            now + sound.duration
        );

        // Amplitude envelope
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume * this.sfxVolume, now + sound.attack);
        gain.gain.exponentialRampToValueAtTime(0.001, now + sound.attack + sound.decay);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        source.start(now);
    }

    /**
     * Play an arpeggio sound
     */
    playArpeggioSound(sound, volume, pitch) {
        const now = this.audioContext.currentTime;

        sound.frequencies.forEach((freq, index) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq * pitch;

            const noteStart = now + index * sound.noteLength;
            const noteEnd = noteStart + sound.noteLength;

            gain.gain.setValueAtTime(0, noteStart);
            gain.gain.linearRampToValueAtTime(volume * this.sfxVolume, noteStart + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, noteEnd);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(noteStart);
            osc.stop(noteEnd + 0.01);
        });
    }

    /**
     * Load and play music from URL
     */
    async loadMusic(name, url) {
        if (!this.initialized) return;

        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            this.music[name] = audioBuffer;
            console.log(`🎵 Music loaded: ${name}`);
        } catch (error) {
            console.warn(`⚠️ Failed to load music ${name}:`, error);
        }
    }

    /**
     * Play music track
     */
    playMusic(name, loop = true) {
        if (!this.initialized || !this.musicEnabled) return;

        this.stopMusic();

        if (!this.music[name]) {
            console.warn(`Music not found: ${name}`);
            return;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = this.music[name];
        source.loop = loop;
        source.connect(this.musicGain);
        source.start(0);

        this.currentMusic = {
            name: name,
            source: source
        };

        console.log(`🎵 Playing music: ${name}`);
    }

    /**
     * Stop current music
     */
    stopMusic(fadeOut = 0.5) {
        if (!this.currentMusic) return;

        if (fadeOut > 0) {
            const now = this.audioContext.currentTime;
            this.musicGain.gain.linearRampToValueAtTime(0, now + fadeOut);

            setTimeout(() => {
                if (this.currentMusic && this.currentMusic.source) {
                    try {
                        this.currentMusic.source.stop();
                    } catch (e) {}
                }
                this.currentMusic = null;
                this.musicGain.gain.value = this.musicVolume;
            }, fadeOut * 1000);
        } else {
            try {
                this.currentMusic.source.stop();
            } catch (e) {}
            this.currentMusic = null;
        }
    }

    /**
     * Set master volume
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }

    /**
     * Set SFX volume
     */
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.sfxVolume;
        }
    }

    /**
     * Set music volume
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicVolume;
        }
    }

    /**
     * Toggle SFX
     */
    toggleSfx() {
        this.sfxEnabled = !this.sfxEnabled;
        return this.sfxEnabled;
    }

    /**
     * Toggle music
     */
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (!this.musicEnabled) {
            this.stopMusic(0);
        }
        return this.musicEnabled;
    }

    /**
     * Mute all audio
     */
    mute() {
        if (this.masterGain) {
            this.masterGain.gain.value = 0;
        }
    }

    /**
     * Unmute all audio
     */
    unmute() {
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }

    /**
     * Check if audio is muted
     */
    isMuted() {
        return this.masterGain ? this.masterGain.gain.value === 0 : false;
    }

    /**
     * Get audio stats
     */
    getStats() {
        return {
            initialized: this.initialized,
            contextState: this.audioContext?.state || 'N/A',
            soundsLoaded: Object.keys(this.sounds).length,
            musicLoaded: Object.keys(this.music).filter(k => this.music[k] !== null).length,
            currentMusic: this.currentMusic?.name || 'None',
            masterVolume: this.masterVolume,
            sfxVolume: this.sfxVolume,
            musicVolume: this.musicVolume,
            sfxEnabled: this.sfxEnabled,
            musicEnabled: this.musicEnabled
        };
    }
}
