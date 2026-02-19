/**
 * Procedural PCM audio synthesis engine.
 * Generates raw PCM waveforms and writes WAV files.
 * Designed for dark synthwave / Perturbator-style music.
 */

export const SAMPLE_RATE = 44100;
export const BIT_DEPTH = 16;

export type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle' | 'noise' | 'pulse';

// ============================================================================
// OSCILLATORS
// ============================================================================

export function sine(frequency: number, t: number): number {
  return Math.sin(2 * Math.PI * frequency * t);
}

export function square(frequency: number, t: number, duty: number = 0.5): number {
  const phase = (frequency * t) % 1;
  return phase < duty ? 1 : -1;
}

export function sawtooth(frequency: number, t: number): number {
  return 2 * ((frequency * t) % 1) - 1;
}

export function triangle(frequency: number, t: number): number {
  const phase = (frequency * t) % 1;
  return 4 * Math.abs(phase - 0.5) - 1;
}

export function noise(): number {
  return Math.random() * 2 - 1;
}

export function pulse(frequency: number, t: number, width: number = 0.25): number {
  return square(frequency, t, width);
}

export function oscillate(type: WaveformType, frequency: number, t: number, param?: number): number {
  switch (type) {
    case 'sine': return sine(frequency, t);
    case 'square': return square(frequency, t, param);
    case 'sawtooth': return sawtooth(frequency, t);
    case 'triangle': return triangle(frequency, t);
    case 'noise': return noise();
    case 'pulse': return pulse(frequency, t, param);
  }
}

// ============================================================================
// ENVELOPES
// ============================================================================

export interface ADSREnvelope {
  attack: number;   // seconds
  decay: number;    // seconds
  sustain: number;  // level 0-1
  release: number;  // seconds
}

export function applyADSR(t: number, noteLength: number, env: ADSREnvelope): number {
  if (t < env.attack) {
    // Attack phase: ramp up from 0 to 1
    return t / env.attack;
  }
  const afterAttack = t - env.attack;
  if (afterAttack < env.decay) {
    // Decay phase: ramp down from 1 to sustain
    return 1 - (1 - env.sustain) * (afterAttack / env.decay);
  }
  if (t < noteLength) {
    // Sustain phase
    return env.sustain;
  }
  // Release phase
  const releaseTime = t - noteLength;
  if (releaseTime < env.release) {
    return env.sustain * (1 - releaseTime / env.release);
  }
  return 0;
}

// Short punchy envelope for drums/hits
export const PERC_ENV: ADSREnvelope = { attack: 0.005, decay: 0.1, sustain: 0, release: 0.05 };
// Pad / sustained envelope
export const PAD_ENV: ADSREnvelope = { attack: 0.3, decay: 0.2, sustain: 0.7, release: 0.5 };
// Lead synth envelope
export const LEAD_ENV: ADSREnvelope = { attack: 0.01, decay: 0.1, sustain: 0.6, release: 0.15 };
// Bass envelope
export const BASS_ENV: ADSREnvelope = { attack: 0.005, decay: 0.15, sustain: 0.5, release: 0.1 };
// Stab envelope
export const STAB_ENV: ADSREnvelope = { attack: 0.005, decay: 0.08, sustain: 0.3, release: 0.05 };

// ============================================================================
// EFFECTS
// ============================================================================

export function distortion(sample: number, amount: number): number {
  return Math.tanh(sample * amount);
}

export function bitcrush(sample: number, bits: number): number {
  const step = 2 / Math.pow(2, bits);
  return Math.round(sample / step) * step;
}

export function lowPassFilter(samples: Float64Array, cutoff: number): Float64Array {
  const rc = 1.0 / (2 * Math.PI * cutoff);
  const dt = 1.0 / SAMPLE_RATE;
  const alpha = dt / (rc + dt);
  const result = new Float64Array(samples.length);
  result[0] = samples[0];
  for (let i = 1; i < samples.length; i++) {
    result[i] = result[i - 1] + alpha * (samples[i] - result[i - 1]);
  }
  return result;
}

export function highPassFilter(samples: Float64Array, cutoff: number): Float64Array {
  const rc = 1.0 / (2 * Math.PI * cutoff);
  const dt = 1.0 / SAMPLE_RATE;
  const alpha = rc / (rc + dt);
  const result = new Float64Array(samples.length);
  result[0] = samples[0];
  for (let i = 1; i < samples.length; i++) {
    result[i] = alpha * (result[i - 1] + samples[i] - samples[i - 1]);
  }
  return result;
}

export function delay(samples: Float64Array, delayMs: number, feedback: number, mix: number): Float64Array {
  const delaySamples = Math.floor((delayMs / 1000) * SAMPLE_RATE);
  const result = new Float64Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    result[i] = samples[i];
    if (i >= delaySamples) {
      result[i] += result[i - delaySamples] * feedback * mix;
    }
  }
  return result;
}

export function chorus(samples: Float64Array, rate: number = 0.5, depth: number = 0.003): Float64Array {
  const result = new Float64Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE;
    const offset = Math.floor(depth * SAMPLE_RATE * (1 + Math.sin(2 * Math.PI * rate * t)));
    const idx = i - offset;
    result[i] = samples[i] * 0.7 + (idx >= 0 ? samples[idx] * 0.3 : 0);
  }
  return result;
}

// ============================================================================
// NOTE HELPERS
// ============================================================================

/** Convert MIDI note number to frequency. A4 = 69 = 440Hz */
export function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

// Note name to MIDI mapping
const NOTE_MAP: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
};

/** Parse note string like "A4", "C#3" to MIDI number */
export function noteToMidi(note: string): number {
  const match = note.match(/^([A-Ga-g][#b]?)(\d)$/);
  if (!match) return 69; // default A4
  const [, name, octave] = match;
  return NOTE_MAP[name.toUpperCase()] + (parseInt(octave) + 1) * 12;
}

/** Parse note string to frequency */
export function noteToFreq(note: string): number {
  return midiToFreq(noteToMidi(note));
}

// ============================================================================
// BUFFER MIXING
// ============================================================================

export function mixBuffers(buffers: Float64Array[], volumes: number[]): Float64Array {
  const maxLen = Math.max(...buffers.map(b => b.length));
  const result = new Float64Array(maxLen);
  for (let i = 0; i < buffers.length; i++) {
    const buf = buffers[i];
    const vol = volumes[i] ?? 1;
    for (let j = 0; j < buf.length; j++) {
      result[j] += buf[j] * vol;
    }
  }
  return result;
}

export function normalizeBuffer(buffer: Float64Array): Float64Array {
  let max = 0;
  for (let i = 0; i < buffer.length; i++) {
    max = Math.max(max, Math.abs(buffer[i]));
  }
  if (max === 0) return buffer;
  const result = new Float64Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    result[i] = buffer[i] / max;
  }
  return result;
}

// ============================================================================
// INSTRUMENT GENERATORS
// ============================================================================

/** Generate a single note/tone as Float64 samples */
export function generateTone(
  waveform: WaveformType,
  frequency: number,
  duration: number,
  envelope: ADSREnvelope,
  volume: number = 1.0,
  waveParam?: number,
): Float64Array {
  const numSamples = Math.floor(SAMPLE_RATE * (duration + envelope.release));
  const buffer = new Float64Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const osc = oscillate(waveform, frequency, t, waveParam);
    const env = applyADSR(t, duration, envelope);
    buffer[i] = osc * env * volume;
  }
  return buffer;
}

/** Dark synth bass: layered detuned sawtooth with distortion */
export function synthBass(frequency: number, duration: number, volume: number = 0.8): Float64Array {
  const numSamples = Math.floor(SAMPLE_RATE * (duration + BASS_ENV.release));
  const buffer = new Float64Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Layer two detuned sawtooths
    const osc1 = sawtooth(frequency, t) * 0.6;
    const osc2 = sawtooth(frequency * 1.005, t) * 0.4; // slight detune
    const sub = sine(frequency / 2, t) * 0.3; // sub bass
    const raw = osc1 + osc2 + sub;
    const env = applyADSR(t, duration, BASS_ENV);
    buffer[i] = distortion(raw * env, 1.8) * volume;
  }
  return lowPassFilter(buffer, 800);
}

/** Screaming lead synth: square wave with PWM */
export function synthLead(frequency: number, duration: number, volume: number = 0.5): Float64Array {
  const numSamples = Math.floor(SAMPLE_RATE * (duration + LEAD_ENV.release));
  const buffer = new Float64Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // PWM - pulse width modulation
    const pwm = 0.3 + 0.2 * Math.sin(2 * Math.PI * 3 * t);
    const osc = pulse(frequency, t, pwm);
    const env = applyADSR(t, duration, LEAD_ENV);
    buffer[i] = osc * env * volume;
  }
  return buffer;
}

/** Dark pad: layered detuned sawtooths with slow chorus */
export function synthPad(frequency: number, duration: number, volume: number = 0.3): Float64Array {
  const numSamples = Math.floor(SAMPLE_RATE * (duration + PAD_ENV.release));
  const buffer = new Float64Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const osc1 = sawtooth(frequency, t) * 0.35;
    const osc2 = sawtooth(frequency * 1.003, t) * 0.35;
    const osc3 = sawtooth(frequency * 0.998, t) * 0.3;
    const raw = osc1 + osc2 + osc3;
    const env = applyADSR(t, duration, PAD_ENV);
    buffer[i] = raw * env * volume;
  }
  return chorus(lowPassFilter(buffer, 2000));
}

/** Stab synth: sharp attack, quick decay */
export function synthStab(frequency: number, duration: number, volume: number = 0.6): Float64Array {
  const numSamples = Math.floor(SAMPLE_RATE * (duration + STAB_ENV.release));
  const buffer = new Float64Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const osc = square(frequency, t) * 0.5 + sawtooth(frequency, t) * 0.5;
    const env = applyADSR(t, duration, STAB_ENV);
    buffer[i] = distortion(osc * env, 1.5) * volume;
  }
  return buffer;
}

// ============================================================================
// DRUM SYNTHESIS
// ============================================================================

/** Synthesized kick drum */
export function synthKick(volume: number = 0.9): Float64Array {
  const duration = 0.3;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new Float64Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Pitch drops from 150Hz to 40Hz
    const freq = 40 + 110 * Math.exp(-t * 30);
    const osc = sine(freq, t);
    // Quick exponential decay
    const env = Math.exp(-t * 10);
    // Add click transient
    const click = t < 0.005 ? noise() * (1 - t / 0.005) : 0;
    buffer[i] = (osc * env + click * 0.3) * volume;
  }
  return buffer;
}

/** Synthesized snare */
export function synthSnare(volume: number = 0.7): Float64Array {
  const duration = 0.2;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new Float64Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const body = sine(180, t) * Math.exp(-t * 20);
    const noiseComp = noise() * Math.exp(-t * 15);
    buffer[i] = (body * 0.4 + noiseComp * 0.6) * volume;
  }
  return highPassFilter(buffer, 200);
}

/** Synthesized hi-hat */
export function synthHihat(open: boolean = false, volume: number = 0.4): Float64Array {
  const duration = open ? 0.3 : 0.08;
  const decay = open ? 8 : 40;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new Float64Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Band-passed noise
    const n = noise();
    const env = Math.exp(-t * decay);
    buffer[i] = n * env * volume;
  }
  return highPassFilter(buffer, 6000);
}

/** Synthesized clap */
export function synthClap(volume: number = 0.6): Float64Array {
  const duration = 0.15;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new Float64Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Multiple noise bursts
    const burst1 = t < 0.01 ? 1 : 0;
    const burst2 = (t > 0.015 && t < 0.025) ? 0.8 : 0;
    const burst3 = (t > 0.03 && t < 0.04) ? 0.6 : 0;
    const tail = t > 0.04 ? Math.exp(-(t - 0.04) * 25) : 0;
    const n = noise();
    buffer[i] = n * (burst1 + burst2 + burst3 + tail) * volume;
  }
  return highPassFilter(buffer, 1000);
}
