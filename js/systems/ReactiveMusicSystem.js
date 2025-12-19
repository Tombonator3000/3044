/**
 * Geometry 3044 - Reactive Music System
 * Music that responds to gameplay events
 * - Bass drops on boss spawn
 * - Tempo increases with combo
 * - Filter sweeps on near-death
 * - Triumphant synths on wave clear
 */

export class ReactiveMusicSystem {
    constructor(soundSystem) {
        this.soundSystem = soundSystem;
        this.audioContext = null;

        // Music state
        this.intensity = 0;           // 0-1 overall intensity
        this.targetIntensity = 0;
        this.comboIntensity = 0;
        this.dangerIntensity = 0;

        // Audio nodes
        this.masterGain = null;
        this.filterNode = null;
        this.compressor = null;

        // Oscillators for reactive elements
        this.bassOsc = null;
        this.leadOsc = null;
        this.padOsc = null;

        // Tempo/rhythm
        this.baseTempo = 120;         // BPM
        this.currentTempo = 120;
        this.beatTimer = 0;
        this.beatInterval = 30;       // Frames per beat at 120bpm

        // Effect states
        this.filterCutoff = 2000;
        this.filterTarget = 2000;

        // Layers
        this.layers = {
            bass: { active: false, volume: 0 },
            drums: { active: false, volume: 0 },
            lead: { active: false, volume: 0 },
            pad: { active: false, volume: 0 },
            danger: { active: false, volume: 0 }
        };

        this.initialized = false;
    }

    /**
     * Initialize audio nodes
     */
    async init() {
        if (this.initialized || !this.soundSystem?.audioContext) return;

        try {
            this.audioContext = this.soundSystem.audioContext;

            // Create master gain for reactive music
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.3;

            // Create filter for sweeps
            this.filterNode = this.audioContext.createBiquadFilter();
            this.filterNode.type = 'lowpass';
            this.filterNode.frequency.value = 2000;
            this.filterNode.Q.value = 1;

            // Create compressor for punch
            this.compressor = this.audioContext.createDynamicsCompressor();
            this.compressor.threshold.value = -24;
            this.compressor.knee.value = 30;
            this.compressor.ratio.value = 12;
            this.compressor.attack.value = 0.003;
            this.compressor.release.value = 0.25;

            // Connect: source -> filter -> compressor -> masterGain -> destination
            this.filterNode.connect(this.compressor);
            this.compressor.connect(this.masterGain);
            this.masterGain.connect(this.soundSystem.musicGain || this.audioContext.destination);

            this.initialized = true;
            console.log('🎵 Reactive Music System initialized');
        } catch (e) {
            console.warn('Failed to initialize reactive music:', e);
        }
    }

    /**
     * Update music based on game state
     */
    update(gameState, deltaTime = 1) {
        if (!this.initialized) return;

        // Calculate target intensity from game state
        this.updateIntensity(gameState);

        // Update tempo based on combo
        this.updateTempo(gameState);

        // Update filter based on danger
        this.updateFilter(gameState);

        // Update beat timer
        this.beatTimer += deltaTime;
        if (this.beatTimer >= this.beatInterval) {
            this.beatTimer = 0;
            this.onBeat(gameState);
        }

        // Smooth intensity transitions
        this.intensity += (this.targetIntensity - this.intensity) * 0.05;

        // Update layer volumes
        this.updateLayers();
    }

    /**
     * Calculate target intensity
     */
    updateIntensity(gameState) {
        if (!gameState) return;

        // Base intensity from wave
        const waveIntensity = Math.min(1, (gameState.wave || 1) / 30);

        // Combo intensity
        const combo = gameState.combo || 0;
        this.comboIntensity = Math.min(1, combo / 50);

        // Danger intensity (low health, many bullets)
        const livesRatio = (gameState.lives || 3) / 3;
        this.dangerIntensity = 1 - livesRatio;

        // Boss intensity
        const bossIntensity = gameState.boss?.active ? 0.3 : 0;

        // Calculate target
        this.targetIntensity = Math.min(1,
            waveIntensity * 0.3 +
            this.comboIntensity * 0.3 +
            this.dangerIntensity * 0.2 +
            bossIntensity
        );
    }

    /**
     * Update tempo based on game state
     */
    updateTempo(gameState) {
        const combo = gameState?.combo || 0;

        // Increase tempo with combo (up to 180 BPM)
        const comboTempoBonus = Math.min(60, combo * 0.5);
        this.currentTempo = this.baseTempo + comboTempoBonus;

        // Calculate beat interval (frames at 60fps)
        this.beatInterval = Math.floor(3600 / this.currentTempo);
    }

    /**
     * Update filter for tension effects
     */
    updateFilter(gameState) {
        if (!this.filterNode) return;

        // Lower filter when in danger
        if (this.dangerIntensity > 0.5) {
            this.filterTarget = 500 + (1 - this.dangerIntensity) * 1500;
        } else {
            this.filterTarget = 2000 + this.intensity * 3000;
        }

        // Smooth filter transition
        this.filterCutoff += (this.filterTarget - this.filterCutoff) * 0.1;
        this.filterNode.frequency.value = this.filterCutoff;
    }

    /**
     * Called on each beat
     */
    onBeat(gameState) {
        // Trigger beat-synced effects
        if (this.intensity > 0.5) {
            this.playBeatPulse();
        }

        // Kick drum on high intensity
        if (this.intensity > 0.7 && this.beatTimer === 0) {
            this.playKick();
        }
    }

    /**
     * Update music layers
     */
    updateLayers() {
        // Bass: always on at some level
        this.layers.bass.volume = 0.3 + this.intensity * 0.4;

        // Drums: kick in at medium intensity
        this.layers.drums.volume = this.intensity > 0.3 ? this.intensity : 0;

        // Lead: high intensity
        this.layers.lead.volume = this.intensity > 0.6 ? (this.intensity - 0.6) * 2.5 : 0;

        // Pad: background atmosphere
        this.layers.pad.volume = 0.2 + (1 - this.intensity) * 0.3;

        // Danger: low health warning
        this.layers.danger.volume = this.dangerIntensity > 0.5 ? this.dangerIntensity : 0;
    }

    /**
     * Play a beat pulse sound
     */
    playBeatPulse() {
        if (!this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.value = 80 + this.intensity * 40;

        const now = this.audioContext.currentTime;
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(this.filterNode);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    /**
     * Play kick drum
     */
    playKick() {
        if (!this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        const now = this.audioContext.currentTime;

        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.filterNode);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    /**
     * Trigger boss music effect
     */
    triggerBossMusic() {
        if (!this.audioContext) return;

        console.log('🎵 Boss music triggered!');

        // Bass drop
        const bassOsc = this.audioContext.createOscillator();
        const bassGain = this.audioContext.createGain();

        bassOsc.type = 'sawtooth';
        const now = this.audioContext.currentTime;

        bassOsc.frequency.setValueAtTime(80, now);
        bassOsc.frequency.exponentialRampToValueAtTime(30, now + 0.5);

        bassGain.gain.setValueAtTime(0.4, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1);

        bassOsc.connect(bassGain);
        bassGain.connect(this.filterNode);

        bassOsc.start(now);
        bassOsc.stop(now + 1);

        // Dramatic filter sweep
        if (this.filterNode) {
            this.filterNode.frequency.setValueAtTime(100, now);
            this.filterNode.frequency.exponentialRampToValueAtTime(5000, now + 0.5);
        }
    }

    /**
     * Trigger wave complete effect
     */
    triggerWaveComplete() {
        if (!this.audioContext) return;

        console.log('🎵 Wave complete music!');

        // Triumphant arpeggio
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        const now = this.audioContext.currentTime;

        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'triangle';
            osc.frequency.value = freq;

            const noteStart = now + i * 0.1;
            gain.gain.setValueAtTime(0, noteStart);
            gain.gain.linearRampToValueAtTime(0.2, noteStart + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.4);

            osc.connect(gain);
            gain.connect(this.filterNode || this.masterGain);

            osc.start(noteStart);
            osc.stop(noteStart + 0.5);
        });
    }

    /**
     * Trigger near-death effect
     */
    triggerNearDeath() {
        if (!this.audioContext) return;

        // Filter down sweep
        if (this.filterNode) {
            const now = this.audioContext.currentTime;
            this.filterNode.frequency.setValueAtTime(this.filterNode.frequency.value, now);
            this.filterNode.frequency.exponentialRampToValueAtTime(200, now + 0.3);
            this.filterNode.frequency.exponentialRampToValueAtTime(2000, now + 1);
        }

        // Warning pulse
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'square';
        const now = this.audioContext.currentTime;

        osc.frequency.setValueAtTime(100, now);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.setValueAtTime(0, now + 0.1);
        gain.gain.setValueAtTime(0.15, now + 0.2);
        gain.gain.setValueAtTime(0, now + 0.3);

        osc.connect(gain);
        gain.connect(this.filterNode || this.masterGain);

        osc.start(now);
        osc.stop(now + 0.4);
    }

    /**
     * Trigger combo milestone effect
     */
    triggerComboMilestone(combo) {
        if (!this.audioContext) return;

        // Rising arpeggio
        const baseFreq = 400 + Math.min(combo, 50) * 10;
        const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];
        const now = this.audioContext.currentTime;

        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            const noteStart = now + i * 0.05;
            gain.gain.setValueAtTime(0.15, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.15);

            osc.connect(gain);
            gain.connect(this.filterNode || this.masterGain);

            osc.start(noteStart);
            osc.stop(noteStart + 0.2);
        });
    }

    /**
     * Set master volume
     */
    setVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }

    /**
     * Get current music state
     */
    getState() {
        return {
            intensity: this.intensity,
            tempo: this.currentTempo,
            filterCutoff: this.filterCutoff,
            comboIntensity: this.comboIntensity,
            dangerIntensity: this.dangerIntensity
        };
    }

    /**
     * Reset system
     */
    reset() {
        this.intensity = 0;
        this.targetIntensity = 0;
        this.comboIntensity = 0;
        this.dangerIntensity = 0;
        this.currentTempo = this.baseTempo;
        this.filterCutoff = 2000;
        this.filterTarget = 2000;
        this.beatTimer = 0;
    }
}
