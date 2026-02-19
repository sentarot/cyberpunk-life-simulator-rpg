/**
 * Procedural dark synthwave music composer.
 * Generates Perturbator/Carpenter Brut-style tracks.
 *
 * Musical characteristics:
 * - Minor keys, dark atmosphere
 * - Heavy distorted sawtooth bass
 * - Arpeggiated synth leads
 * - Driving drum machines (4/4 time)
 * - Tempo: 120-140 BPM
 */

import {
  SAMPLE_RATE, noteToFreq, midiToFreq, noteToMidi,
  synthBass, synthLead, synthPad, synthStab, synthKick, synthSnare, synthHihat, synthClap,
  mixBuffers, normalizeBuffer, lowPassFilter, delay, distortion,
  generateTone, LEAD_ENV,
} from './synth';
import { writeWav, AudioPlayer } from './wav';

// ============================================================================
// SCALES AND KEYS
// ============================================================================

// Intervals from root for various scales
const SCALES: Record<string, number[]> = {
  minor:           [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor:   [0, 2, 3, 5, 7, 8, 11],
  phrygian:        [0, 1, 3, 5, 7, 8, 10],
  minorPentatonic: [0, 3, 5, 7, 10],
  dorian:          [0, 2, 3, 5, 7, 9, 10],
};

function getScaleNotes(rootMidi: number, scale: number[], octaves: number = 2): number[] {
  const notes: number[] = [];
  for (let oct = 0; oct < octaves; oct++) {
    for (const interval of scale) {
      notes.push(rootMidi + interval + oct * 12);
    }
  }
  return notes;
}

// ============================================================================
// PATTERN TYPES
// ============================================================================

interface Note {
  midi: number;
  duration: number; // in beats
  velocity: number; // 0-1
}

interface DrumHit {
  type: 'kick' | 'snare' | 'hihat' | 'clap' | 'openhat';
  velocity: number;
}

interface Pattern {
  notes: (Note | null)[];  // null = rest
  stepsPerBeat: number;    // e.g. 4 = 16th notes
}

interface DrumPattern {
  hits: (DrumHit | null)[];
  stepsPerBeat: number;
}

// ============================================================================
// PATTERN GENERATORS
// ============================================================================

function generateArpPattern(scaleNotes: number[], steps: number = 16): Pattern {
  const notes: (Note | null)[] = [];
  const arpStyles = ['up', 'down', 'updown', 'random'];
  const style = arpStyles[Math.floor(Math.random() * arpStyles.length)];

  // Use lower octave notes for arp
  const arpNotes = scaleNotes.slice(0, 8);

  for (let i = 0; i < steps; i++) {
    // Some steps are rests for rhythmic variation
    if (Math.random() < 0.15) {
      notes.push(null);
      continue;
    }

    let noteIdx: number;
    switch (style) {
      case 'up':
        noteIdx = i % arpNotes.length;
        break;
      case 'down':
        noteIdx = (arpNotes.length - 1) - (i % arpNotes.length);
        break;
      case 'updown':
        const cycle = (arpNotes.length - 1) * 2;
        const pos = i % cycle;
        noteIdx = pos < arpNotes.length ? pos : cycle - pos;
        break;
      case 'random':
      default:
        noteIdx = Math.floor(Math.random() * arpNotes.length);
        break;
    }

    notes.push({
      midi: arpNotes[noteIdx],
      duration: 0.5,
      velocity: 0.5 + Math.random() * 0.3,
    });
  }
  return { notes, stepsPerBeat: 4 };
}

function generateBassPattern(rootMidi: number, scale: number[]): Pattern {
  const notes: (Note | null)[] = [];
  // Classic synthwave bass: root note heavy, with occasional movement
  const bassNotes = [0, 0, 0, 0, 5, 5, 3, 7].map(interval =>
    rootMidi - 12 + (scale.includes(interval) ? interval : 0)
  );

  for (let i = 0; i < 16; i++) {
    if (i % 2 === 0) {
      // Hit on even 16th notes (8th note pulse)
      const noteIdx = Math.floor(i / 2) % bassNotes.length;
      notes.push({
        midi: bassNotes[noteIdx],
        duration: 0.75,
        velocity: 0.8 + (i % 4 === 0 ? 0.2 : 0), // accent on beats
      });
    } else {
      notes.push(null);
    }
  }
  return { notes, stepsPerBeat: 4 };
}

function generateDrumPattern(style: 'driving' | 'halftime' | 'breakbeat'): DrumPattern {
  const hits: (DrumHit | null)[] = [];

  for (let i = 0; i < 16; i++) {
    switch (style) {
      case 'driving':
        // Four on the floor with offbeat hats
        if (i % 4 === 0) {
          hits.push({ type: 'kick', velocity: 1.0 });
        } else if (i % 4 === 2) {
          hits.push({ type: 'hihat', velocity: 0.5 });
        } else if (i % 8 === 4) {
          hits.push({ type: 'snare', velocity: 0.9 });
        } else if (i % 2 === 1) {
          hits.push({ type: 'hihat', velocity: 0.3 });
        } else {
          hits.push(null);
        }
        break;
      case 'halftime':
        if (i === 0 || i === 10) {
          hits.push({ type: 'kick', velocity: 1.0 });
        } else if (i === 8) {
          hits.push({ type: 'snare', velocity: 0.9 });
        } else if (i % 2 === 0) {
          hits.push({ type: 'hihat', velocity: 0.4 });
        } else {
          hits.push(Math.random() < 0.3 ? { type: 'hihat', velocity: 0.2 } : null);
        }
        break;
      case 'breakbeat':
        if (i === 0 || i === 6 || i === 10) {
          hits.push({ type: 'kick', velocity: 0.9 });
        } else if (i === 4 || i === 12) {
          hits.push({ type: 'snare', velocity: 0.8 });
        } else if (i % 2 === 0) {
          hits.push({ type: 'hihat', velocity: 0.4 });
        } else {
          hits.push(Math.random() < 0.2 ? { type: 'hihat', velocity: 0.2 } : null);
        }
        break;
    }
  }
  return { hits, stepsPerBeat: 4 };
}

function generatePadChords(rootMidi: number, scale: number[]): Note[][] {
  // Generate 4-bar chord progression
  const chords: Note[][] = [];
  const scaleNotes = scale.map(i => rootMidi + i);

  // i - VI - III - VII (common dark progression)
  const progressions = [
    [0, 2, 4],     // i chord
    [5, 7, 9],     // VI chord (relative major)
    [2, 4, 7],     // III chord
    [7, 9, 11],    // VII chord
  ];

  for (const intervals of progressions) {
    const chord = intervals.map(semitone => {
      // Find closest scale note
      const closest = scaleNotes.reduce((prev, curr) =>
        Math.abs(curr - (rootMidi + semitone)) < Math.abs(prev - (rootMidi + semitone)) ? curr : prev
      );
      return {
        midi: closest,
        duration: 4, // whole bar
        velocity: 0.4,
      };
    });
    chords.push(chord);
  }

  return chords;
}

// ============================================================================
// TRACK RENDERER
// ============================================================================

function renderPatternToSamples(
  pattern: Pattern,
  bpm: number,
  synthFn: (freq: number, dur: number, vol: number) => Float64Array,
  bars: number = 1,
): Float64Array {
  const beatDuration = 60 / bpm;
  const stepDuration = beatDuration / pattern.stepsPerBeat;
  const totalSteps = pattern.notes.length * bars;
  const totalDuration = totalSteps * stepDuration;
  const totalSamples = Math.floor(totalDuration * SAMPLE_RATE);
  const buffer = new Float64Array(totalSamples);

  for (let bar = 0; bar < bars; bar++) {
    for (let step = 0; step < pattern.notes.length; step++) {
      const note = pattern.notes[step];
      if (!note) continue;

      const startTime = (bar * pattern.notes.length + step) * stepDuration;
      const startSample = Math.floor(startTime * SAMPLE_RATE);
      const freq = midiToFreq(note.midi);
      const dur = note.duration * beatDuration;

      const noteSamples = synthFn(freq, dur, note.velocity);
      for (let i = 0; i < noteSamples.length && startSample + i < totalSamples; i++) {
        buffer[startSample + i] += noteSamples[i];
      }
    }
  }

  return buffer;
}

function renderDrumPattern(pattern: DrumPattern, bpm: number, bars: number = 1): Float64Array {
  const beatDuration = 60 / bpm;
  const stepDuration = beatDuration / pattern.stepsPerBeat;
  const totalSteps = pattern.hits.length * bars;
  const totalDuration = totalSteps * stepDuration;
  const totalSamples = Math.floor(totalDuration * SAMPLE_RATE);
  const buffer = new Float64Array(totalSamples);

  for (let bar = 0; bar < bars; bar++) {
    for (let step = 0; step < pattern.hits.length; step++) {
      const hit = pattern.hits[step];
      if (!hit) continue;

      const startTime = (bar * pattern.hits.length + step) * stepDuration;
      const startSample = Math.floor(startTime * SAMPLE_RATE);

      let hitSamples: Float64Array;
      switch (hit.type) {
        case 'kick': hitSamples = synthKick(hit.velocity); break;
        case 'snare': hitSamples = synthSnare(hit.velocity); break;
        case 'hihat': hitSamples = synthHihat(false, hit.velocity); break;
        case 'openhat': hitSamples = synthHihat(true, hit.velocity); break;
        case 'clap': hitSamples = synthClap(hit.velocity); break;
        default: continue;
      }

      for (let i = 0; i < hitSamples.length && startSample + i < totalSamples; i++) {
        buffer[startSample + i] += hitSamples[i];
      }
    }
  }

  return buffer;
}

function renderPadChords(
  chords: Note[][],
  bpm: number,
  synthFn: (freq: number, dur: number, vol: number) => Float64Array,
): Float64Array {
  const beatDuration = 60 / bpm;
  const barDuration = beatDuration * 4; // 4 beats per bar
  const totalDuration = chords.length * barDuration;
  const totalSamples = Math.floor(totalDuration * SAMPLE_RATE);
  const buffer = new Float64Array(totalSamples);

  for (let i = 0; i < chords.length; i++) {
    const startTime = i * barDuration;
    const startSample = Math.floor(startTime * SAMPLE_RATE);
    const dur = barDuration;

    for (const note of chords[i]) {
      const freq = midiToFreq(note.midi);
      const noteSamples = synthFn(freq, dur, note.velocity);
      for (let j = 0; j < noteSamples.length && startSample + j < totalSamples; j++) {
        buffer[startSample + j] += noteSamples[j];
      }
    }
  }

  return buffer;
}

// ============================================================================
// TRACK COMPOSITIONS
// ============================================================================

export type TrackName = 'title' | 'exploration' | 'combat' | 'dark_ambient' | 'victory' | 'gameover';

/**
 * Generate a complete dark synthwave track.
 * Returns the file path of the generated WAV.
 */
export function generateTrack(trackName: TrackName): string {
  switch (trackName) {
    case 'title': return generateTitleTrack();
    case 'exploration': return generateExplorationTrack();
    case 'combat': return generateCombatTrack();
    case 'dark_ambient': return generateDarkAmbientTrack();
    case 'victory': return generateVictoryStinger();
    case 'gameover': return generateGameOverTrack();
    default: return generateExplorationTrack();
  }
}

function generateTitleTrack(): string {
  const bpm = 128;
  const bars = 8;
  const rootMidi = noteToMidi('A2');
  const scale = SCALES.harmonicMinor;
  const scaleNotes = getScaleNotes(rootMidi + 12, scale, 2); // Lead in higher octave

  // Drums: driving four-on-the-floor
  const drums = renderDrumPattern(generateDrumPattern('driving'), bpm, bars);

  // Bass: heavy sawtooth pulse
  const bassPattern = generateBassPattern(rootMidi, scale);
  const bass = renderPatternToSamples(bassPattern, bpm, synthBass, bars);

  // Lead arpeggio
  const arpPattern = generateArpPattern(scaleNotes, 16);
  const lead = renderPatternToSamples(arpPattern, bpm, synthLead, bars);
  const leadWithDelay = delay(lead, 187, 0.3, 0.4); // Delay synced to 16th note

  // Pad chords
  const chords = generatePadChords(rootMidi + 12, scale);
  const pads = renderPadChords(chords, bpm, synthPad);
  // Repeat pads to match length
  const repeatedPads = repeatBuffer(pads, bars / 4);

  // Mix
  const mixed = mixBuffers(
    [drums, bass, leadWithDelay, repeatedPads],
    [0.7, 0.8, 0.45, 0.3]
  );

  const normalized = normalizeBuffer(mixed);
  return writeWav(normalized, 'title.wav');
}

function generateExplorationTrack(): string {
  const bpm = 110;
  const bars = 8;
  const rootMidi = noteToMidi('C2');
  const scale = SCALES.phrygian;
  const scaleNotes = getScaleNotes(rootMidi + 24, scale, 2);

  // Lighter drums
  const drums = renderDrumPattern(generateDrumPattern('halftime'), bpm, bars);

  // Subtle bass
  const bassPattern = generateBassPattern(rootMidi, scale);
  const bass = renderPatternToSamples(bassPattern, bpm, synthBass, bars);

  // Atmospheric arp
  const arpPattern = generateArpPattern(scaleNotes, 16);
  const lead = renderPatternToSamples(arpPattern, bpm,
    (freq, dur, vol) => synthLead(freq, dur, vol * 0.4), bars);
  const leadWithDelay = delay(lead, 273, 0.4, 0.5);

  // Big pads
  const chords = generatePadChords(rootMidi + 12, scale);
  const pads = renderPadChords(chords, bpm, synthPad);
  const repeatedPads = repeatBuffer(pads, bars / 4);

  const mixed = mixBuffers(
    [drums, bass, leadWithDelay, repeatedPads],
    [0.5, 0.6, 0.35, 0.45]
  );

  return writeWav(normalizeBuffer(mixed), 'exploration.wav');
}

function generateCombatTrack(): string {
  const bpm = 140;
  const bars = 8;
  const rootMidi = noteToMidi('D2');
  const scale = SCALES.minor;
  const scaleNotes = getScaleNotes(rootMidi + 12, scale, 2);

  // Aggressive drums
  const drums = renderDrumPattern(generateDrumPattern('breakbeat'), bpm, bars);

  // Heavy distorted bass
  const bassPattern = generateBassPattern(rootMidi, scale);
  const bass = renderPatternToSamples(bassPattern, bpm,
    (freq, dur, vol) => {
      const b = synthBass(freq, dur, vol);
      for (let i = 0; i < b.length; i++) b[i] = distortion(b[i], 2.5);
      return b;
    }, bars);

  // Aggressive lead
  const arpPattern = generateArpPattern(scaleNotes, 16);
  const lead = renderPatternToSamples(arpPattern, bpm, synthLead, bars);

  // Stab accents
  const stabNotes: (Note | null)[] = Array(16).fill(null);
  stabNotes[0] = { midi: rootMidi + 24, duration: 0.25, velocity: 0.8 };
  stabNotes[4] = { midi: rootMidi + 24 + 3, duration: 0.25, velocity: 0.7 };
  stabNotes[8] = { midi: rootMidi + 24, duration: 0.25, velocity: 0.8 };
  stabNotes[12] = { midi: rootMidi + 24 + 5, duration: 0.25, velocity: 0.7 };
  const stabs = renderPatternToSamples({ notes: stabNotes, stepsPerBeat: 4 }, bpm, synthStab, bars);

  const mixed = mixBuffers(
    [drums, bass, lead, stabs],
    [0.8, 0.9, 0.5, 0.4]
  );

  return writeWav(normalizeBuffer(mixed), 'combat.wav');
}

function generateDarkAmbientTrack(): string {
  const bpm = 80;
  const bars = 8;
  const rootMidi = noteToMidi('F#2');
  const scale = SCALES.phrygian;

  // No drums, just atmosphere
  const chords = generatePadChords(rootMidi, scale);
  const pads = renderPadChords(chords, bpm,
    (freq, dur, vol) => synthPad(freq, dur, vol * 0.6));
  const repeatedPads = repeatBuffer(pads, bars / 4);

  // Low drone
  const droneDuration = (60 / bpm) * 4 * bars;
  const drone = generateTone('sawtooth', midiToFreq(rootMidi - 12), droneDuration,
    { attack: 2, decay: 1, sustain: 0.3, release: 2 }, 0.2);
  const filteredDrone = lowPassFilter(drone, 200);

  // Sparse high notes
  const highNotes = getScaleNotes(rootMidi + 36, scale, 1);
  const sparsePattern: (Note | null)[] = Array(32).fill(null);
  for (let i = 0; i < 6; i++) {
    const pos = Math.floor(Math.random() * 32);
    sparsePattern[pos] = {
      midi: highNotes[Math.floor(Math.random() * highNotes.length)],
      duration: 1,
      velocity: 0.2 + Math.random() * 0.2,
    };
  }
  const sparkles = renderPatternToSamples({ notes: sparsePattern, stepsPerBeat: 2 }, bpm,
    (freq, dur, vol) => {
      const t = generateTone('sine', freq, dur,
        { attack: 0.1, decay: 0.3, sustain: 0.2, release: 0.5 }, vol);
      return delay(t, 500, 0.4, 0.6);
    }, bars / 2);

  const mixed = mixBuffers(
    [repeatedPads, filteredDrone, sparkles],
    [0.5, 0.4, 0.3]
  );

  return writeWav(normalizeBuffer(mixed), 'dark_ambient.wav');
}

function generateVictoryStinger(): string {
  const bpm = 130;
  const rootMidi = noteToMidi('A3');

  // Short triumphant stinger
  const duration = 2; // seconds
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new Float64Array(totalSamples);

  // Rising arpeggio
  const notes = [0, 3, 7, 12, 15, 19, 24]; // Minor chord ascending
  const noteLen = duration / notes.length;
  for (let i = 0; i < notes.length; i++) {
    const freq = midiToFreq(rootMidi + notes[i]);
    const tone = synthStab(freq, noteLen, 0.7);
    const startSample = Math.floor(i * noteLen * SAMPLE_RATE);
    for (let j = 0; j < tone.length && startSample + j < totalSamples; j++) {
      buffer[startSample + j] += tone[j];
    }
  }

  // Kick on beat
  const kick = synthKick(0.8);
  for (let j = 0; j < kick.length && j < totalSamples; j++) {
    buffer[j] += kick[j];
  }

  return writeWav(normalizeBuffer(buffer), 'victory.wav');
}

function generateGameOverTrack(): string {
  const rootMidi = noteToMidi('C2');
  const duration = 4;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new Float64Array(totalSamples);

  // Descending dark tones
  const notes = [12, 11, 8, 7, 5, 3, 0];
  const noteLen = 0.5;
  for (let i = 0; i < notes.length; i++) {
    const freq = midiToFreq(rootMidi + notes[i]);
    const tone = synthPad(freq, noteLen, 0.5);
    const startSample = Math.floor(i * noteLen * SAMPLE_RATE);
    for (let j = 0; j < tone.length && startSample + j < totalSamples; j++) {
      buffer[startSample + j] += tone[j];
    }
  }

  // Low drone
  const drone = generateTone('sawtooth', midiToFreq(rootMidi - 12), duration,
    { attack: 0.1, decay: 0.5, sustain: 0.3, release: 1 }, 0.4);
  const filteredDrone = lowPassFilter(drone, 150);
  for (let i = 0; i < totalSamples && i < filteredDrone.length; i++) {
    buffer[i] += filteredDrone[i];
  }

  // Noise fadeout
  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    if (t > duration * 0.7) {
      buffer[i] += (Math.random() * 2 - 1) * 0.1 * Math.exp(-(t - duration * 0.7) * 2);
    }
  }

  return writeWav(normalizeBuffer(buffer), 'gameover.wav');
}

// ============================================================================
// UTILITY
// ============================================================================

function repeatBuffer(buffer: Float64Array, times: number): Float64Array {
  const intTimes = Math.ceil(times);
  const result = new Float64Array(buffer.length * intTimes);
  for (let t = 0; t < intTimes; t++) {
    for (let i = 0; i < buffer.length && t * buffer.length + i < result.length; i++) {
      result[t * buffer.length + i] = buffer[i];
    }
  }
  return result;
}

// ============================================================================
// MUSIC MANAGER
// ============================================================================

export class MusicManager {
  private player: AudioPlayer;
  private generatedTracks: Map<TrackName, string> = new Map();
  private currentTrack: TrackName | null = null;
  private _enabled: boolean = true;

  constructor() {
    this.player = new AudioPlayer();
  }

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._enabled = value;
    if (!value) {
      this.stop();
    }
  }

  /**
   * Check if audio is available on this system.
   */
  isAvailable(): boolean {
    return this.player.isAvailable();
  }

  /**
   * Pre-generate a track (can be slow, so do during loading).
   */
  pregenerate(trackName: TrackName): void {
    if (!this.generatedTracks.has(trackName)) {
      const path = generateTrack(trackName);
      this.generatedTracks.set(trackName, path);
    }
  }

  /**
   * Generate all tracks.
   */
  pregenerateAll(): void {
    const tracks: TrackName[] = ['title', 'exploration', 'combat', 'dark_ambient', 'victory', 'gameover'];
    for (const track of tracks) {
      this.pregenerate(track);
    }
  }

  /**
   * Play a track. Generates on-demand if not pregenerated.
   */
  play(trackName: TrackName, loop: boolean = true): void {
    if (!this._enabled) return;
    if (this.currentTrack === trackName) return; // Already playing

    let filePath = this.generatedTracks.get(trackName);
    if (!filePath) {
      filePath = generateTrack(trackName);
      this.generatedTracks.set(trackName, filePath);
    }

    this.currentTrack = trackName;
    if (loop) {
      this.player.playLoop(filePath);
    } else {
      this.player.play(filePath);
    }
  }

  /**
   * Play a one-shot sound effect.
   */
  playSFX(trackName: TrackName): void {
    if (!this._enabled) return;
    // SFX plays once, doesn't interrupt the current track
    let filePath = this.generatedTracks.get(trackName);
    if (!filePath) {
      filePath = generateTrack(trackName);
      this.generatedTracks.set(trackName, filePath);
    }
    // For SFX, we'd need a second player instance
    // For simplicity, just play it (will interrupt current music briefly)
    this.player.play(filePath);
  }

  /**
   * Stop all music.
   */
  stop(): void {
    this.player.stop();
    this.currentTrack = null;
  }

  /**
   * Clean up resources.
   */
  cleanup(): void {
    this.player.cleanup();
    this.generatedTracks.clear();
  }
}
