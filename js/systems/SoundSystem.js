/**
 * Geometry 3044 - SoundSystem Module
 * Handles all audio: sound effects and music
 */

import { CONFIG } from '../config.js';
import { logger } from '../utils/Logger.js';

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
            logger.audio('SoundSystem initialized');
        } catch (error) {
            logger.warn('SoundSystem initialization failed:', error);
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

        // Boss appear sound
        this.sounds.boss = this.createSynthSound({
            type: 'sawtooth',
            frequency: 80,
            duration: 0.8,
            attack: 0.1,
            decay: 0.7,
            pitchDecay: 0.3
        });

        // Combo sound
        this.sounds.combo = this.createSynthSound({
            type: 'sine',
            frequency: 600,
            duration: 0.15,
            attack: 0.01,
            decay: 0.14,
            pitchDecay: -0.5
        });

        // Shield sound
        this.sounds.shield = this.createSynthSound({
            type: 'triangle',
            frequency: 300,
            duration: 0.2,
            attack: 0.02,
            decay: 0.18,
            pitchDecay: -0.3
        });

        // Fever beat
        this.sounds.fever = this.createSynthSound({
            type: 'sine',
            frequency: 500,
            duration: 0.1,
            attack: 0.01,
            decay: 0.09,
            pitchDecay: -0.2
        });

        // Basic laser sound
        this.sounds.laser = this.createSynthSound({
            type: 'sawtooth',
            frequency: 1500,
            duration: 0.15,
            attack: 0.01,
            decay: 0.14,
            pitchDecay: 0.8
        });

        // ============================================
        // ADVANCED LASER WEAPON SOUNDS
        // ============================================

        // Railgun charge - rising energy buildup
        this.sounds.railgunCharge = {
            type: 'custom',
            name: 'railgunCharge'
        };

        // Railgun fire - powerful discharge blast
        this.sounds.railgunFire = {
            type: 'custom',
            name: 'railgunFire'
        };

        // Plasma beam ignition
        this.sounds.plasmaBeamStart = {
            type: 'custom',
            name: 'plasmaBeamStart'
        };

        // Plasma beam continuous loop
        this.sounds.plasmaBeamLoop = {
            type: 'custom',
            name: 'plasmaBeamLoop'
        };

        // Plasma beam shutdown
        this.sounds.plasmaBeamEnd = {
            type: 'custom',
            name: 'plasmaBeamEnd'
        };

        // Chain lightning electric zap
        this.sounds.chainLightningZap = {
            type: 'custom',
            name: 'chainLightningZap'
        };

        console.log('🎵 Procedural sounds generated (including laser weapon sounds)');
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
            case 'custom':
                this.playCustomSound(sound.name, volume, pitch);
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
     * Play custom laser weapon sounds
     */
    playCustomSound(name, volume, pitch = 1.0) {
        switch (name) {
            case 'railgunCharge':
                this.playRailgunCharge(volume);
                break;
            case 'railgunFire':
                this.playRailgunFire(volume);
                break;
            case 'plasmaBeamStart':
                this.playPlasmaBeamStart(volume);
                break;
            case 'plasmaBeamLoop':
                return this.playPlasmaBeamLoop(volume);
            case 'plasmaBeamEnd':
                this.playPlasmaBeamEnd(volume);
                break;
            case 'chainLightningZap':
                this.playChainLightningZap(volume, pitch);
                break;
        }
    }

    /**
     * Railgun charge sound - rising energy buildup with harmonics
     */
    playRailgunCharge(volume = 0.6) {
        const now = this.audioContext.currentTime;
        const duration = 0.75; // Match charge time

        // Base oscillator - rising sawtooth
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(80, now);
        osc1.frequency.exponentialRampToValueAtTime(400, now + duration);
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(volume * this.sfxVolume * 0.4, now + 0.1);
        gain1.gain.linearRampToValueAtTime(volume * this.sfxVolume * 0.6, now + duration);
        osc1.connect(gain1);
        gain1.connect(this.sfxGain);
        osc1.start(now);
        osc1.stop(now + duration);

        // High harmonic - adds energy feel
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(200, now);
        osc2.frequency.exponentialRampToValueAtTime(2000, now + duration);
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(volume * this.sfxVolume * 0.2, now + duration * 0.5);
        gain2.gain.linearRampToValueAtTime(volume * this.sfxVolume * 0.4, now + duration);
        osc2.connect(gain2);
        gain2.connect(this.sfxGain);
        osc2.start(now);
        osc2.stop(now + duration);

        // Pulsing effect
        const osc3 = this.audioContext.createOscillator();
        const gain3 = this.audioContext.createGain();
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();

        osc3.type = 'square';
        osc3.frequency.setValueAtTime(150, now);
        osc3.frequency.exponentialRampToValueAtTime(600, now + duration);

        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(8, now);
        lfo.frequency.linearRampToValueAtTime(20, now + duration);
        lfoGain.gain.value = volume * this.sfxVolume * 0.15;

        lfo.connect(lfoGain);
        lfoGain.connect(gain3.gain);
        gain3.gain.setValueAtTime(volume * this.sfxVolume * 0.1, now);

        osc3.connect(gain3);
        gain3.connect(this.sfxGain);

        osc3.start(now);
        lfo.start(now);
        osc3.stop(now + duration);
        lfo.stop(now + duration);
    }

    /**
     * Railgun fire sound - massive energy discharge
     */
    playRailgunFire(volume = 0.8) {
        const now = this.audioContext.currentTime;
        const duration = 0.4;

        // Deep bass thump
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(60, now);
        osc1.frequency.exponentialRampToValueAtTime(20, now + duration);
        gain1.gain.setValueAtTime(volume * this.sfxVolume, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc1.connect(gain1);
        gain1.connect(this.sfxGain);
        osc1.start(now);
        osc1.stop(now + duration);

        // High frequency zap/crack
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(3000, now);
        osc2.frequency.exponentialRampToValueAtTime(200, now + 0.15);
        gain2.gain.setValueAtTime(volume * this.sfxVolume * 0.7, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc2.connect(gain2);
        gain2.connect(this.sfxGain);
        osc2.start(now);
        osc2.stop(now + 0.2);

        // Noise burst for impact
        const bufferSize = this.audioContext.sampleRate * 0.2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = buffer;
        const noiseGain = this.audioContext.createGain();
        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(2000, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        noiseFilter.Q.value = 1;
        noiseGain.gain.setValueAtTime(volume * this.sfxVolume * 0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noiseSource.start(now);

        // Purple energy whoosh (mid frequencies)
        const osc3 = this.audioContext.createOscillator();
        const gain3 = this.audioContext.createGain();
        osc3.type = 'triangle';
        osc3.frequency.setValueAtTime(800, now);
        osc3.frequency.exponentialRampToValueAtTime(100, now + 0.3);
        gain3.gain.setValueAtTime(volume * this.sfxVolume * 0.5, now);
        gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc3.connect(gain3);
        gain3.connect(this.sfxGain);
        osc3.start(now);
        osc3.stop(now + 0.35);
    }

    /**
     * Plasma beam start - ignition burst
     */
    playPlasmaBeamStart(volume = 0.6) {
        const now = this.audioContext.currentTime;

        // Initial spark/ignition
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(100, now);
        osc1.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gain1.gain.setValueAtTime(volume * this.sfxVolume * 0.7, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc1.connect(gain1);
        gain1.connect(this.sfxGain);
        osc1.start(now);
        osc1.stop(now + 0.2);

        // High frequency sizzle
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(2000, now);
        osc2.frequency.linearRampToValueAtTime(1200, now + 0.2);
        gain2.gain.setValueAtTime(volume * this.sfxVolume * 0.3, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc2.connect(gain2);
        gain2.connect(this.sfxGain);
        osc2.start(now);
        osc2.stop(now + 0.25);
    }

    /**
     * Plasma beam loop - continuous energy hum (returns nodes for stopping)
     */
    playPlasmaBeamLoop(volume = 0.4) {
        const now = this.audioContext.currentTime;

        // Create nodes for the continuous sound
        const nodes = {
            oscillators: [],
            gains: [],
            active: true
        };

        // Base hum
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.value = 120;
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(volume * this.sfxVolume * 0.3, now + 0.1);
        osc1.connect(gain1);
        gain1.connect(this.sfxGain);
        osc1.start(now);
        nodes.oscillators.push(osc1);
        nodes.gains.push(gain1);

        // High frequency buzz with LFO modulation
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();

        osc2.type = 'square';
        osc2.frequency.value = 800;

        lfo.type = 'sine';
        lfo.frequency.value = 6;
        lfoGain.gain.value = 100; // Frequency modulation amount

        lfo.connect(lfoGain);
        lfoGain.connect(osc2.frequency);

        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(volume * this.sfxVolume * 0.15, now + 0.1);
        osc2.connect(gain2);
        gain2.connect(this.sfxGain);
        osc2.start(now);
        lfo.start(now);
        nodes.oscillators.push(osc2, lfo);
        nodes.gains.push(gain2);

        // Plasma crackle with filtered noise
        const bufferSize = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;
        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 3000;
        noiseFilter.Q.value = 5;
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(volume * this.sfxVolume * 0.1, now + 0.1);
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noiseSource.start(now);
        nodes.oscillators.push(noiseSource);
        nodes.gains.push(noiseGain);

        // Store reference for stopping
        nodes.stop = () => {
            const stopTime = this.audioContext.currentTime;
            nodes.gains.forEach(g => {
                g.gain.linearRampToValueAtTime(0, stopTime + 0.1);
            });
            setTimeout(() => {
                nodes.oscillators.forEach(o => {
                    try { o.stop(); } catch(e) {}
                });
                nodes.active = false;
            }, 150);
        };

        return nodes;
    }

    /**
     * Plasma beam end - shutdown sound
     */
    playPlasmaBeamEnd(volume = 0.5) {
        const now = this.audioContext.currentTime;

        // Descending power-down
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(800, now);
        osc1.frequency.exponentialRampToValueAtTime(50, now + 0.3);
        gain1.gain.setValueAtTime(volume * this.sfxVolume * 0.5, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc1.connect(gain1);
        gain1.connect(this.sfxGain);
        osc1.start(now);
        osc1.stop(now + 0.35);

        // High frequency fade
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1500, now);
        osc2.frequency.exponentialRampToValueAtTime(200, now + 0.25);
        gain2.gain.setValueAtTime(volume * this.sfxVolume * 0.3, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc2.connect(gain2);
        gain2.connect(this.sfxGain);
        osc2.start(now);
        osc2.stop(now + 0.3);
    }

    /**
     * Chain lightning zap - electric arc sound
     */
    playChainLightningZap(volume = 0.6, pitch = 1.0) {
        const now = this.audioContext.currentTime;
        const duration = 0.12;

        // Sharp electric crack
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(2500 * pitch, now);
        osc1.frequency.exponentialRampToValueAtTime(800 * pitch, now + duration * 0.3);
        osc1.frequency.exponentialRampToValueAtTime(400 * pitch, now + duration);
        gain1.gain.setValueAtTime(volume * this.sfxVolume * 0.7, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc1.connect(gain1);
        gain1.connect(this.sfxGain);
        osc1.start(now);
        osc1.stop(now + duration + 0.01);

        // Secondary buzz
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(1800 * pitch, now);
        osc2.frequency.exponentialRampToValueAtTime(600 * pitch, now + duration);
        gain2.gain.setValueAtTime(volume * this.sfxVolume * 0.4, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8);
        osc2.connect(gain2);
        gain2.connect(this.sfxGain);
        osc2.start(now);
        osc2.stop(now + duration);

        // Noise crackle
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = buffer;
        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 2000;
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(volume * this.sfxVolume * 0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noiseSource.start(now);
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
            this.musicGain.gain.value = this.musicVolume;
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

    // ============================================
    // CONVENIENCE METHODS
    // ============================================

    playShoot() { this.play('playerShoot', 0.5); }
    playExplosion() { this.play('explosionSmall', 0.8); }
    playExplosionLarge() { this.play('explosionLarge', 1.0); }
    playPowerUp(tier = 1) { this.play('powerUp', 0.5 + tier * 0.1); }
    playHit() { this.play('hit', 0.4); }
    playBomb() { this.play('bomb', 1.0); }
    playCoin() { this.play('coin', 0.6); }
    playGameOver() { this.play('playerDeath', 1.0); }
    playBossAppear() { this.play('boss', 1.0); }
    playCombo() { this.play('combo', 0.7); }
    playShield() { this.play('shield', 0.5); }
    playFeverBeat() { this.play('fever', 0.4); }
    playLaser() { this.play('laser', 0.6); }
    playPlayerDeath() { this.play('playerDeath', 1.0); }
    playWaveComplete() { this.play('waveComplete', 0.8); }
    playMenuSelect() { this.play('menuSelect', 0.6); }
    playMenuHover() { this.play('menuHover', 0.4); }

    // ============================================
    // LASER WEAPON SOUND METHODS
    // ============================================

    /**
     * Play railgun charge sound - call when charging starts
     */
    playRailgunChargeSound() {
        if (!this.initialized || !this.sfxEnabled) return;
        this.playRailgunCharge(0.6);
    }

    /**
     * Play railgun fire sound - call when railgun fires
     */
    playRailgunFireSound() {
        if (!this.initialized || !this.sfxEnabled) return;
        this.playRailgunFire(0.8);
    }

    /**
     * Start plasma beam sound - returns control object with stop() method
     */
    startPlasmaBeamSound() {
        if (!this.initialized || !this.sfxEnabled) return null;
        this.playPlasmaBeamStart(0.6);
        // Start loop after initial burst
        const loopNodes = this.playPlasmaBeamLoop(0.4);
        return loopNodes;
    }

    /**
     * Stop plasma beam sound - pass the control object from startPlasmaBeamSound
     */
    stopPlasmaBeamSound(loopNodes) {
        if (!this.initialized || !this.sfxEnabled) return;
        if (loopNodes && loopNodes.stop) {
            loopNodes.stop();
        }
        this.playPlasmaBeamEnd(0.5);
    }

    /**
     * Play chain lightning zap sound - call for each arc
     * @param {number} hopIndex - The hop number (0-based) for pitch variation
     */
    playChainLightningSound(hopIndex = 0) {
        if (!this.initialized || !this.sfxEnabled) return;
        // Slightly higher pitch for each subsequent hop
        const pitch = 1.0 + (hopIndex * 0.15);
        this.playChainLightningZap(0.6, pitch);
    }
}
