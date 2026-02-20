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
 * - Multi-section compositions (32 bars) for extended listening
 */

import {
  SAMPLE_RATE, noteToFreq, midiToFreq, noteToMidi,
  synthBass, synthLead, synthPad, synthStab, synthKick, synthSnare, synthHihat, synthClap,
  mixBuffers, normalizeBuffer, lowPassFilter, highPassFilter, delay, distortion,
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

type ArpStyle = 'up' | 'down' | 'updown' | 'random';

function generateArpPattern(scaleNotes: number[], steps: number = 16, forceStyle?: ArpStyle): Pattern {
  const notes: (Note | null)[] = [];
  const arpStyles: ArpStyle[] = ['up', 'down', 'updown', 'random'];
  const style = forceStyle ?? arpStyles[Math.floor(Math.random() * arpStyles.length)];

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

/** Alternative bass pattern with more melodic movement */
function generateBassPatternB(rootMidi: number, scale: number[]): Pattern {
  const notes: (Note | null)[] = [];
  const bassRoot = rootMidi - 12;
  // Walking bass: scale-based movement
  const intervals = [0, 3, 5, 7, 5, 3, 0, 10].map(interval =>
    bassRoot + (scale.includes(interval % 12) ? interval : 0)
  );

  for (let i = 0; i < 16; i++) {
    if (i % 2 === 0) {
      const noteIdx = Math.floor(i / 2) % intervals.length;
      notes.push({
        midi: intervals[noteIdx],
        duration: 0.5,
        velocity: 0.7 + (i % 4 === 0 ? 0.2 : 0),
      });
    } else if (i % 4 === 3 && Math.random() < 0.4) {
      // Ghost notes on off-beats
      notes.push({
        midi: intervals[Math.floor(Math.random() * intervals.length)],
        duration: 0.25,
        velocity: 0.4,
      });
    } else {
      notes.push(null);
    }
  }
  return { notes, stepsPerBeat: 4 };
}

/** Minimal bass: just root and fifth, spaced out */
function generateBassPatternMinimal(rootMidi: number, scale: number[]): Pattern {
  const notes: (Note | null)[] = [];
  const bassRoot = rootMidi - 12;
  const fifth = scale.includes(7) ? 7 : 5;

  for (let i = 0; i < 16; i++) {
    if (i === 0) {
      notes.push({ midi: bassRoot, duration: 1.5, velocity: 0.9 });
    } else if (i === 8) {
      notes.push({ midi: bassRoot + fifth, duration: 1.0, velocity: 0.7 });
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

/** Variation driving pattern: open hats, claps instead of snare */
function generateDrumPatternVariation(style: 'driving' | 'halftime' | 'breakbeat'): DrumPattern {
  const hits: (DrumHit | null)[] = [];

  for (let i = 0; i < 16; i++) {
    switch (style) {
      case 'driving':
        // Variation: kick on 1 and 3, open hat accents, clap on 2 and 4
        if (i === 0 || i === 8) {
          hits.push({ type: 'kick', velocity: 1.0 });
        } else if (i === 4 || i === 12) {
          hits.push({ type: 'clap', velocity: 0.85 });
        } else if (i === 6 || i === 14) {
          hits.push({ type: 'openhat', velocity: 0.5 });
        } else if (i % 2 === 0) {
          hits.push({ type: 'hihat', velocity: 0.35 });
        } else if (i % 2 === 1) {
          hits.push({ type: 'hihat', velocity: 0.2 });
        } else {
          hits.push(null);
        }
        break;
      case 'halftime':
        // Variation: kick pattern shifted, snare+clap layer
        if (i === 0 || i === 12) {
          hits.push({ type: 'kick', velocity: 1.0 });
        } else if (i === 8) {
          hits.push({ type: 'clap', velocity: 0.8 });
        } else if (i === 6) {
          hits.push({ type: 'snare', velocity: 0.5 });
        } else if (i % 4 === 0) {
          hits.push({ type: 'hihat', velocity: 0.4 });
        } else if (i % 2 === 0) {
          hits.push({ type: 'hihat', velocity: 0.25 });
        } else {
          hits.push(Math.random() < 0.2 ? { type: 'hihat', velocity: 0.15 } : null);
        }
        break;
      case 'breakbeat':
        // Variation: syncopated pattern with open hats
        if (i === 0 || i === 3 || i === 10) {
          hits.push({ type: 'kick', velocity: 0.9 });
        } else if (i === 4 || i === 14) {
          hits.push({ type: 'snare', velocity: 0.8 });
        } else if (i === 8) {
          hits.push({ type: 'clap', velocity: 0.7 });
        } else if (i === 6 || i === 12) {
          hits.push({ type: 'openhat', velocity: 0.4 });
        } else if (i % 2 === 0) {
          hits.push({ type: 'hihat', velocity: 0.3 });
        } else {
          hits.push(Math.random() < 0.25 ? { type: 'hihat', velocity: 0.2 } : null);
        }
        break;
    }
  }
  return { hits, stepsPerBeat: 4 };
}

/** Sparse build-up drum pattern: just kick and building hats */
function generateDrumPatternSparse(): DrumPattern {
  const hits: (DrumHit | null)[] = [];
  for (let i = 0; i < 16; i++) {
    if (i === 0 || i === 8) {
      hits.push({ type: 'kick', velocity: 0.7 });
    } else if (i % 4 === 0) {
      hits.push({ type: 'hihat', velocity: 0.3 });
    } else {
      hits.push(null);
    }
  }
  return { hits, stepsPerBeat: 4 };
}

/** Drum fill for transitions (1 bar) */
function generateDrumFill(): DrumPattern {
  const hits: (DrumHit | null)[] = [];
  for (let i = 0; i < 16; i++) {
    if (i < 8) {
      // First half: snare rolls accelerating
      if (i % 4 === 0) hits.push({ type: 'snare', velocity: 0.6 });
      else if (i % 2 === 0) hits.push({ type: 'snare', velocity: 0.4 });
      else hits.push(null);
    } else {
      // Second half: rapid snare + kick buildup
      if (i % 2 === 0) hits.push({ type: 'snare', velocity: 0.7 + (i - 8) * 0.03 });
      else hits.push({ type: 'kick', velocity: 0.5 + (i - 8) * 0.05 });
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

/** Alternative chord progression: iv - i - VI - v */
function generatePadChordsB(rootMidi: number, scale: number[]): Note[][] {
  const chords: Note[][] = [];
  const scaleNotes = scale.map(i => rootMidi + i);

  const progressions = [
    [5, 7, 10],    // iv chord
    [0, 2, 4],     // i chord
    [5, 8, 12],    // VI chord (different voicing)
    [7, 10, 14],   // v chord
  ];

  for (const intervals of progressions) {
    const chord = intervals.map(semitone => {
      const closest = scaleNotes.reduce((prev, curr) =>
        Math.abs(curr - (rootMidi + semitone)) < Math.abs(prev - (rootMidi + semitone)) ? curr : prev
      );
      return {
        midi: closest,
        duration: 4,
        velocity: 0.35,
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
// TRACK COMPOSITIONS — Multi-section structures for longer loops
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

/**
 * TITLE TRACK: 32 bars at 128 BPM (~60s)
 * Structure: Intro(8) → Verse A(8) → Breakdown(8) → Verse B(8)
 */
function generateTitleTrack(): string {
  const bpm = 128;
  const rootMidi = noteToMidi('A2');
  const scale = SCALES.harmonicMinor;
  const scaleNotes = getScaleNotes(rootMidi + 12, scale, 2);
  const scaleNotesHigh = getScaleNotes(rootMidi + 24, scale, 2);
  const delayTime = Math.floor(60000 / bpm / 4); // 16th note delay

  // === SECTION: Intro (8 bars) — pads + sparse drums build to full ===
  const introSparseDrums = renderDrumPattern(generateDrumPatternSparse(), bpm, 4);
  const introDrivingDrums = renderDrumPattern(generateDrumPattern('driving'), bpm, 3);
  const introFill = renderDrumPattern(generateDrumFill(), bpm, 1);
  const introDrums = concatBuffers([introSparseDrums, introDrivingDrums, introFill]);

  const introChords = generatePadChords(rootMidi + 12, scale);
  const introPads = renderPadChords(introChords, bpm, synthPad);
  const introRepeatedPads = repeatBuffer(introPads, 2);

  const introArp = generateArpPattern(scaleNotes, 16, 'up');
  // Arp fades in over intro: silent first 4 bars, then in
  const introLeadSilent = renderSilence(bpm, 4);
  const introLeadActive = renderPatternToSamples(introArp, bpm,
    (freq, dur, vol) => synthLead(freq, dur, vol * 0.3), 4);
  const introLead = concatBuffers([introLeadSilent, delay(introLeadActive, delayTime, 0.3, 0.4)]);

  const intro = mixBuffers(
    [introDrums, introRepeatedPads, introLead],
    [0.6, 0.4, 0.3]
  );

  // === SECTION: Verse A (8 bars) — full arrangement ===
  const verseADrums = renderDrumPattern(generateDrumPattern('driving'), bpm, 8);
  const verseABass = renderPatternToSamples(generateBassPattern(rootMidi, scale), bpm, synthBass, 8);
  const verseAArp = generateArpPattern(scaleNotes, 16, 'updown');
  const verseALead = renderPatternToSamples(verseAArp, bpm, synthLead, 8);
  const verseALeadDelay = delay(verseALead, delayTime, 0.3, 0.4);
  const verseAPads = repeatBuffer(introPads, 2);

  const verseA = mixBuffers(
    [verseADrums, verseABass, verseALeadDelay, verseAPads],
    [0.7, 0.8, 0.45, 0.25]
  );

  // === SECTION: Breakdown (8 bars) — strip back, different chord prog, new arp ===
  const breakdownDrums1 = renderDrumPattern(generateDrumPatternVariation('halftime'), bpm, 7);
  const breakdownFill = renderDrumPattern(generateDrumFill(), bpm, 1);
  const breakdownDrums = concatBuffers([breakdownDrums1, breakdownFill]);

  const breakdownChords = generatePadChordsB(rootMidi + 12, scale);
  const breakdownPads = renderPadChords(breakdownChords, bpm,
    (freq, dur, vol) => synthPad(freq, dur, vol * 0.8));
  const breakdownRepeatedPads = repeatBuffer(breakdownPads, 2);

  const breakdownBass = renderPatternToSamples(
    generateBassPatternMinimal(rootMidi, scale), bpm, synthBass, 8);

  const breakdownArp = generateArpPattern(scaleNotesHigh, 16, 'down');
  const breakdownLead = renderPatternToSamples(breakdownArp, bpm,
    (freq, dur, vol) => synthLead(freq, dur, vol * 0.35), 8);
  const breakdownLeadDelay = delay(breakdownLead, delayTime * 2, 0.4, 0.5);

  const breakdown = mixBuffers(
    [breakdownDrums, breakdownBass, breakdownLeadDelay, breakdownRepeatedPads],
    [0.5, 0.5, 0.35, 0.45]
  );

  // === SECTION: Verse B (8 bars) — return full, different patterns + stabs ===
  const verseBDrums = renderDrumPattern(generateDrumPatternVariation('driving'), bpm, 8);
  const verseBBass = renderPatternToSamples(generateBassPatternB(rootMidi, scale), bpm,
    (freq, dur, vol) => {
      const b = synthBass(freq, dur, vol);
      for (let i = 0; i < b.length; i++) b[i] = distortion(b[i], 2.0);
      return b;
    }, 8);
  const verseBArp = generateArpPattern(scaleNotes, 16, 'random');
  const verseBLead = renderPatternToSamples(verseBArp, bpm, synthLead, 8);
  const verseBLeadDelay = delay(verseBLead, delayTime, 0.35, 0.4);
  const verseBPads = repeatBuffer(introPads, 2);

  // Stab accents in verse B
  const stabNotes: (Note | null)[] = Array(16).fill(null);
  stabNotes[0] = { midi: rootMidi + 24, duration: 0.25, velocity: 0.7 };
  stabNotes[6] = { midi: rootMidi + 24 + 3, duration: 0.25, velocity: 0.6 };
  stabNotes[12] = { midi: rootMidi + 24 + 7, duration: 0.25, velocity: 0.65 };
  const verseBStabs = renderPatternToSamples({ notes: stabNotes, stepsPerBeat: 4 }, bpm, synthStab, 8);

  const verseB = mixBuffers(
    [verseBDrums, verseBBass, verseBLeadDelay, verseBPads, verseBStabs],
    [0.7, 0.8, 0.4, 0.25, 0.35]
  );

  // === Assemble full track ===
  const full = concatBuffers([intro, verseA, breakdown, verseB]);
  return writeWav(normalizeBuffer(full), 'title.wav');
}

/**
 * EXPLORATION TRACK: 32 bars at 110 BPM (~70s)
 * Structure: Ambient Intro(8) → Section A(8) → Section B(8) → Section A'(8)
 */
function generateExplorationTrack(): string {
  const bpm = 110;
  const rootMidi = noteToMidi('C2');
  const scale = SCALES.phrygian;
  const scaleNotes = getScaleNotes(rootMidi + 24, scale, 2);
  const scaleNotesHigh = getScaleNotes(rootMidi + 36, scale, 1);
  const delayTime = Math.floor(60000 / bpm / 4);

  // Pad progressions
  const chordsA = generatePadChords(rootMidi + 12, scale);
  const chordsB = generatePadChordsB(rootMidi + 12, scale);

  // === Ambient Intro (8 bars) — pads only, sparse sparkles, no drums ===
  const introPads = renderPadChords(chordsA, bpm,
    (freq, dur, vol) => synthPad(freq, dur, vol * 0.7));
  const introRepeatedPads = repeatBuffer(introPads, 2);

  // Sparse sparkle melody
  const introSparkle = generateSparseNotes(scaleNotesHigh, 32, 4);
  const introSparkleSamples = renderPatternToSamples(
    { notes: introSparkle, stepsPerBeat: 2 }, bpm,
    (freq, dur, vol) => {
      const t = generateTone('sine', freq, dur,
        { attack: 0.1, decay: 0.3, sustain: 0.2, release: 0.5 }, vol);
      return delay(t, 500, 0.4, 0.6);
    }, 2);

  // Low drone for intro
  const introDroneDuration = (60 / bpm) * 4 * 8;
  const introDrone = generateTone('sawtooth', midiToFreq(rootMidi - 12), introDroneDuration,
    { attack: 3, decay: 1, sustain: 0.25, release: 2 }, 0.15);
  const introDroneFiltered = lowPassFilter(introDrone, 180);

  const intro = mixBuffers(
    [introRepeatedPads, introSparkleSamples, introDroneFiltered],
    [0.5, 0.3, 0.35]
  );

  // === Section A (8 bars) — add halftime drums, bass, arp ===
  const sectionADrums = renderDrumPattern(generateDrumPattern('halftime'), bpm, 8);
  const sectionABass = renderPatternToSamples(
    generateBassPatternMinimal(rootMidi, scale), bpm, synthBass, 8);

  const sectionAArp = generateArpPattern(scaleNotes, 16, 'up');
  const sectionALead = renderPatternToSamples(sectionAArp, bpm,
    (freq, dur, vol) => synthLead(freq, dur, vol * 0.35), 8);
  const sectionALeadDelay = delay(sectionALead, delayTime * 2, 0.4, 0.5);

  const sectionAPads = repeatBuffer(introPads, 2);

  const sectionA = mixBuffers(
    [sectionADrums, sectionABass, sectionALeadDelay, sectionAPads],
    [0.5, 0.55, 0.35, 0.4]
  );

  // === Section B (8 bars) — different chords, different arp, variation drums ===
  const sectionBDrums = renderDrumPattern(generateDrumPatternVariation('halftime'), bpm, 8);
  const sectionBBass = renderPatternToSamples(
    generateBassPatternB(rootMidi, scale), bpm, synthBass, 8);

  const sectionBPads = renderPadChords(chordsB, bpm,
    (freq, dur, vol) => synthPad(freq, dur, vol * 0.6));
  const sectionBRepeatedPads = repeatBuffer(sectionBPads, 2);

  const sectionBArp = generateArpPattern(scaleNotes, 16, 'down');
  const sectionBLead = renderPatternToSamples(sectionBArp, bpm,
    (freq, dur, vol) => synthLead(freq, dur, vol * 0.4), 8);
  const sectionBLeadDelay = delay(sectionBLead, delayTime * 3, 0.45, 0.5);

  // Add sparkles to section B
  const sectionBSparkle = generateSparseNotes(scaleNotesHigh, 32, 6);
  const sectionBSparkleSamples = renderPatternToSamples(
    { notes: sectionBSparkle, stepsPerBeat: 2 }, bpm,
    (freq, dur, vol) => {
      const t = generateTone('sine', freq, dur,
        { attack: 0.08, decay: 0.2, sustain: 0.15, release: 0.4 }, vol);
      return delay(t, 600, 0.35, 0.5);
    }, 2);

  const sectionB = mixBuffers(
    [sectionBDrums, sectionBBass, sectionBLeadDelay, sectionBRepeatedPads, sectionBSparkleSamples],
    [0.45, 0.55, 0.35, 0.45, 0.25]
  );

  // === Section A' (8 bars) — return to A chords with fuller arrangement ===
  const sectionA2Drums1 = renderDrumPattern(generateDrumPattern('halftime'), bpm, 7);
  const sectionA2Fill = renderDrumPattern(generateDrumFill(), bpm, 1);
  const sectionA2Drums = concatBuffers([sectionA2Drums1, sectionA2Fill]);

  const sectionA2Bass = renderPatternToSamples(
    generateBassPattern(rootMidi, scale), bpm, synthBass, 8);

  const sectionA2Arp = generateArpPattern(scaleNotes, 16, 'updown');
  const sectionA2Lead = renderPatternToSamples(sectionA2Arp, bpm,
    (freq, dur, vol) => synthLead(freq, dur, vol * 0.45), 8);
  const sectionA2LeadDelay = delay(sectionA2Lead, delayTime * 2, 0.4, 0.5);
  const sectionA2Pads = repeatBuffer(introPads, 2);

  const sectionA2 = mixBuffers(
    [sectionA2Drums, sectionA2Bass, sectionA2LeadDelay, sectionA2Pads],
    [0.55, 0.6, 0.4, 0.4]
  );

  // === Assemble ===
  const full = concatBuffers([intro, sectionA, sectionB, sectionA2]);
  return writeWav(normalizeBuffer(full), 'exploration.wav');
}

/**
 * COMBAT TRACK: 32 bars at 140 BPM (~55s)
 * Structure: Buildup(4) → Assault A(8) → Breakdown(4) → Assault B(8) → Final Push(8)
 */
function generateCombatTrack(): string {
  const bpm = 140;
  const rootMidi = noteToMidi('D2');
  const scale = SCALES.minor;
  const scaleNotes = getScaleNotes(rootMidi + 12, scale, 2);
  const scaleNotesHigh = getScaleNotes(rootMidi + 24, scale, 2);

  const heavyBass = (freq: number, dur: number, vol: number) => {
    const b = synthBass(freq, dur, vol);
    for (let i = 0; i < b.length; i++) b[i] = distortion(b[i], 2.5);
    return b;
  };

  // === Buildup (4 bars) — kick pulse, rising filtered noise, bass enters ===
  const buildupDrums1 = renderDrumPattern(generateDrumPatternSparse(), bpm, 3);
  const buildupFill = renderDrumPattern(generateDrumFill(), bpm, 1);
  const buildupDrums = concatBuffers([buildupDrums1, buildupFill]);

  const buildupBass = renderPatternToSamples(
    generateBassPatternMinimal(rootMidi, scale), bpm, heavyBass, 4);

  // Rising pad for tension
  const buildupDuration = (60 / bpm) * 4 * 4;
  const buildupPad = generateTone('sawtooth', midiToFreq(rootMidi + 12), buildupDuration,
    { attack: buildupDuration * 0.8, decay: 0.2, sustain: 0.5, release: 0.3 }, 0.3);
  const buildupPadFiltered = lowPassFilter(buildupPad, 1200);

  const buildup = mixBuffers(
    [buildupDrums, buildupBass, buildupPadFiltered],
    [0.7, 0.6, 0.4]
  );

  // === Assault A (8 bars) — breakbeat + heavy bass + aggressive arp + stabs ===
  const assaultADrums = renderDrumPattern(generateDrumPattern('breakbeat'), bpm, 8);
  const assaultABass = renderPatternToSamples(
    generateBassPattern(rootMidi, scale), bpm, heavyBass, 8);

  const assaultAArp = generateArpPattern(scaleNotes, 16, 'up');
  const assaultALead = renderPatternToSamples(assaultAArp, bpm, synthLead, 8);

  const stabNotesA: (Note | null)[] = Array(16).fill(null);
  stabNotesA[0] = { midi: rootMidi + 24, duration: 0.25, velocity: 0.8 };
  stabNotesA[4] = { midi: rootMidi + 24 + 3, duration: 0.25, velocity: 0.7 };
  stabNotesA[8] = { midi: rootMidi + 24, duration: 0.25, velocity: 0.8 };
  stabNotesA[12] = { midi: rootMidi + 24 + 5, duration: 0.25, velocity: 0.7 };
  const assaultAStabs = renderPatternToSamples(
    { notes: stabNotesA, stepsPerBeat: 4 }, bpm, synthStab, 8);

  const assaultA = mixBuffers(
    [assaultADrums, assaultABass, assaultALead, assaultAStabs],
    [0.8, 0.9, 0.5, 0.4]
  );

  // === Breakdown (4 bars) — halftime, filtered bass, atmospheric ===
  const breakdownDrums1 = renderDrumPattern(generateDrumPatternVariation('halftime'), bpm, 3);
  const breakdownFill = renderDrumPattern(generateDrumFill(), bpm, 1);
  const breakdownDrums = concatBuffers([breakdownDrums1, breakdownFill]);

  const breakdownBass = renderPatternToSamples(
    generateBassPatternMinimal(rootMidi, scale), bpm,
    (freq, dur, vol) => lowPassFilter(synthBass(freq, dur, vol), 400), 4);

  const breakdownArp = generateArpPattern(scaleNotesHigh, 16, 'down');
  const breakdownLead = renderPatternToSamples(breakdownArp, bpm,
    (freq, dur, vol) => synthLead(freq, dur, vol * 0.3), 4);
  const breakdownLeadDelay = delay(breakdownLead, 300, 0.4, 0.5);

  const combatBreakdown = mixBuffers(
    [breakdownDrums, breakdownBass, breakdownLeadDelay],
    [0.6, 0.5, 0.35]
  );

  // === Assault B (8 bars) — driving drums, different bass, new arp ===
  const assaultBDrums = renderDrumPattern(generateDrumPatternVariation('breakbeat'), bpm, 8);
  const assaultBBass = renderPatternToSamples(
    generateBassPatternB(rootMidi, scale), bpm, heavyBass, 8);

  const assaultBArp = generateArpPattern(scaleNotes, 16, 'random');
  const assaultBLead = renderPatternToSamples(assaultBArp, bpm, synthLead, 8);

  // Different stab pattern
  const stabNotesB: (Note | null)[] = Array(16).fill(null);
  stabNotesB[0] = { midi: rootMidi + 24 + 7, duration: 0.25, velocity: 0.8 };
  stabNotesB[3] = { midi: rootMidi + 24 + 5, duration: 0.25, velocity: 0.6 };
  stabNotesB[8] = { midi: rootMidi + 24 + 3, duration: 0.25, velocity: 0.75 };
  stabNotesB[11] = { midi: rootMidi + 24, duration: 0.25, velocity: 0.65 };
  const assaultBStabs = renderPatternToSamples(
    { notes: stabNotesB, stepsPerBeat: 4 }, bpm, synthStab, 8);

  const assaultB = mixBuffers(
    [assaultBDrums, assaultBBass, assaultBLead, assaultBStabs],
    [0.8, 0.85, 0.5, 0.4]
  );

  // === Final Push (8 bars) — maximum intensity, driving + breakbeat layered ===
  const finalDrums = renderDrumPattern(generateDrumPattern('driving'), bpm, 8);
  const finalBBDrums = renderDrumPattern(generateDrumPattern('breakbeat'), bpm, 8);
  const finalBass = renderPatternToSamples(
    generateBassPattern(rootMidi, scale), bpm, heavyBass, 8);

  const finalArp = generateArpPattern(scaleNotes, 16, 'updown');
  const finalLead = renderPatternToSamples(finalArp, bpm, synthLead, 8);

  const finalStabs = renderPatternToSamples(
    { notes: stabNotesA, stepsPerBeat: 4 }, bpm, synthStab, 8);

  // Add pad for extra intensity
  const finalChords = generatePadChords(rootMidi + 12, scale);
  const finalPads = renderPadChords(finalChords, bpm,
    (freq, dur, vol) => synthPad(freq, dur, vol * 0.5));
  const finalRepeatedPads = repeatBuffer(finalPads, 2);

  const finalPush = mixBuffers(
    [finalDrums, finalBBDrums, finalBass, finalLead, finalStabs, finalRepeatedPads],
    [0.6, 0.35, 0.9, 0.5, 0.35, 0.2]
  );

  // === Assemble ===
  const full = concatBuffers([buildup, assaultA, combatBreakdown, assaultB, finalPush]);
  return writeWav(normalizeBuffer(full), 'combat.wav');
}

/**
 * DARK AMBIENT TRACK: 32 bars at 80 BPM (~96s)
 * Structure: Drone A(8) → Evolving A(8) → Shift B(8) → Resolve(8)
 * No drums — pure atmosphere with evolving textures.
 */
function generateDarkAmbientTrack(): string {
  const bpm = 80;
  const rootMidi = noteToMidi('F#2');
  const scale = SCALES.phrygian;
  const barDuration = (60 / bpm) * 4;

  const highNotesA = getScaleNotes(rootMidi + 36, scale, 1);
  const highNotesB = getScaleNotes(rootMidi + 36, SCALES.harmonicMinor, 1);

  // === Drone A (8 bars) — root drone + pads (chord prog A) + sparse high notes ===
  const droneADuration = barDuration * 8;
  const droneA = generateTone('sawtooth', midiToFreq(rootMidi - 12), droneADuration,
    { attack: 3, decay: 1, sustain: 0.3, release: 2 }, 0.2);
  const droneAFiltered = lowPassFilter(droneA, 200);

  const chordsA = generatePadChords(rootMidi, scale);
  const padsA = renderPadChords(chordsA, bpm,
    (freq, dur, vol) => synthPad(freq, dur, vol * 0.5));
  const repeatedPadsA = repeatBuffer(padsA, 2);

  const sparklesA = generateSparseNotes(highNotesA, 32, 5);
  const sparklesASamples = renderPatternToSamples(
    { notes: sparklesA, stepsPerBeat: 2 }, bpm,
    (freq, dur, vol) => {
      const t = generateTone('sine', freq, dur,
        { attack: 0.15, decay: 0.4, sustain: 0.2, release: 0.6 }, vol);
      return delay(t, 600, 0.45, 0.6);
    }, 2);

  const sectionDroneA = mixBuffers(
    [droneAFiltered, repeatedPadsA, sparklesASamples],
    [0.4, 0.45, 0.25]
  );

  // === Evolving A (8 bars) — same root, add second drone layer, different sparkles ===
  const evolvingDuration = barDuration * 8;
  const evolvingDrone1 = generateTone('sawtooth', midiToFreq(rootMidi - 12), evolvingDuration,
    { attack: 2, decay: 1, sustain: 0.3, release: 2 }, 0.18);
  const evolvingDrone1Filtered = lowPassFilter(evolvingDrone1, 180);

  // Second drone a fifth above
  const evolvingDrone2 = generateTone('triangle', midiToFreq(rootMidi - 5), evolvingDuration,
    { attack: 4, decay: 2, sustain: 0.2, release: 3 }, 0.12);
  const evolvingDrone2Filtered = lowPassFilter(evolvingDrone2, 250);

  const evolvingPads = repeatBuffer(padsA, 2);

  const sparklesA2 = generateSparseNotes(highNotesA, 32, 8); // More sparkles
  const sparklesA2Samples = renderPatternToSamples(
    { notes: sparklesA2, stepsPerBeat: 2 }, bpm,
    (freq, dur, vol) => {
      const t = generateTone('sine', freq, dur,
        { attack: 0.1, decay: 0.3, sustain: 0.15, release: 0.5 }, vol);
      return delay(t, 450, 0.4, 0.55);
    }, 2);

  // Add very subtle rhythmic pulse (not drums, just a pad throb)
  const pulseDuration = barDuration * 8;
  const pulseBuffer = new Float64Array(Math.floor(pulseDuration * SAMPLE_RATE));
  for (let i = 0; i < pulseBuffer.length; i++) {
    const t = i / SAMPLE_RATE;
    // Slow LFO at ~0.5 Hz creates a breathing effect
    pulseBuffer[i] = Math.sin(2 * Math.PI * 0.5 * t) * 0.08;
  }

  const sectionEvolving = mixBuffers(
    [evolvingDrone1Filtered, evolvingDrone2Filtered, evolvingPads, sparklesA2Samples, pulseBuffer],
    [0.4, 0.3, 0.4, 0.3, 0.2]
  );

  // === Shift B (8 bars) — modulate to different chord prog, different sparkle set ===
  const shiftDuration = barDuration * 8;
  // Drone shifts down a half step (Phrygian flavor)
  const shiftDrone = generateTone('sawtooth', midiToFreq(rootMidi - 13), shiftDuration,
    { attack: 2, decay: 1.5, sustain: 0.25, release: 2.5 }, 0.2);
  const shiftDroneFiltered = lowPassFilter(shiftDrone, 170);

  const chordsB = generatePadChordsB(rootMidi, scale);
  const padsB = renderPadChords(chordsB, bpm,
    (freq, dur, vol) => synthPad(freq, dur, vol * 0.55));
  const repeatedPadsB = repeatBuffer(padsB, 2);

  const sparklesB = generateSparseNotes(highNotesB, 32, 6);
  const sparkleBSamples = renderPatternToSamples(
    { notes: sparklesB, stepsPerBeat: 2 }, bpm,
    (freq, dur, vol) => {
      const t = generateTone('triangle', freq, dur,
        { attack: 0.2, decay: 0.5, sustain: 0.15, release: 0.7 }, vol);
      return delay(t, 700, 0.5, 0.6);
    }, 2);

  const sectionShift = mixBuffers(
    [shiftDroneFiltered, repeatedPadsB, sparkleBSamples],
    [0.4, 0.5, 0.3]
  );

  // === Resolve (8 bars) — return to root, both pad progs blend, fade sparkles ===
  const resolveDuration = barDuration * 8;
  const resolveDrone = generateTone('sawtooth', midiToFreq(rootMidi - 12), resolveDuration,
    { attack: 1, decay: 2, sustain: 0.25, release: 4 }, 0.2);
  const resolveDroneFiltered = lowPassFilter(resolveDrone, 200);

  // Blend both chord progressions
  const resolvePadsA = repeatBuffer(padsA, 2);
  const resolvePadsB = renderPadChords(chordsB, bpm,
    (freq, dur, vol) => synthPad(freq, dur, vol * 0.3));
  const resolvePadsBRepeated = repeatBuffer(resolvePadsB, 2);

  const sparklesResolve = generateSparseNotes(highNotesA, 32, 4);
  const sparkleResolveSamples = renderPatternToSamples(
    { notes: sparklesResolve, stepsPerBeat: 2 }, bpm,
    (freq, dur, vol) => {
      const t = generateTone('sine', freq, dur,
        { attack: 0.2, decay: 0.5, sustain: 0.2, release: 0.8 }, vol);
      return delay(t, 550, 0.4, 0.6);
    }, 2);

  const sectionResolve = mixBuffers(
    [resolveDroneFiltered, resolvePadsA, resolvePadsBRepeated, sparkleResolveSamples],
    [0.4, 0.35, 0.2, 0.25]
  );

  // === Assemble ===
  const full = concatBuffers([sectionDroneA, sectionEvolving, sectionShift, sectionResolve]);
  return writeWav(normalizeBuffer(full), 'dark_ambient.wav');
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

/** Concatenate multiple audio buffers sequentially */
function concatBuffers(buffers: Float64Array[]): Float64Array {
  const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);
  const result = new Float64Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    result.set(buf, offset);
    offset += buf.length;
  }
  return result;
}

/** Render silence for N bars at given BPM */
function renderSilence(bpm: number, bars: number): Float64Array {
  const barDuration = (60 / bpm) * 4;
  const totalSamples = Math.floor(barDuration * bars * SAMPLE_RATE);
  return new Float64Array(totalSamples);
}

/** Generate a sparse pattern of notes (for ambient sparkles/textures) */
function generateSparseNotes(notePool: number[], steps: number, count: number): (Note | null)[] {
  const pattern: (Note | null)[] = Array(steps).fill(null);
  for (let i = 0; i < count; i++) {
    let pos: number;
    // Avoid collisions
    do {
      pos = Math.floor(Math.random() * steps);
    } while (pattern[pos] !== null && i < count * 3);

    pattern[pos] = {
      midi: notePool[Math.floor(Math.random() * notePool.length)],
      duration: 1 + Math.random(),
      velocity: 0.15 + Math.random() * 0.2,
    };
  }
  return pattern;
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
