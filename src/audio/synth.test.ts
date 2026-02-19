import {
  sine, square, sawtooth, triangle, noise, pulse, oscillate,
  applyADSR, LEAD_ENV, BASS_ENV, PERC_ENV,
  distortion, bitcrush,
  midiToFreq, noteToMidi, noteToFreq,
  generateTone, synthBass, synthLead, synthPad, synthKick, synthSnare, synthHihat,
  mixBuffers, normalizeBuffer,
  SAMPLE_RATE,
} from './synth';
import { samplesToWav } from './wav';

describe('audio synthesis', () => {
  describe('oscillators', () => {
    it('sine should produce values between -1 and 1', () => {
      for (let i = 0; i < 1000; i++) {
        const t = i / SAMPLE_RATE;
        const val = sine(440, t);
        expect(val).toBeGreaterThanOrEqual(-1);
        expect(val).toBeLessThanOrEqual(1);
      }
    });

    it('square should produce values of -1 or 1', () => {
      for (let i = 0; i < 1000; i++) {
        const t = i / SAMPLE_RATE;
        const val = square(440, t);
        expect(Math.abs(val)).toBe(1);
      }
    });

    it('sawtooth should produce values between -1 and 1', () => {
      for (let i = 0; i < 1000; i++) {
        const t = i / SAMPLE_RATE;
        const val = sawtooth(440, t);
        expect(val).toBeGreaterThanOrEqual(-1);
        expect(val).toBeLessThanOrEqual(1);
      }
    });

    it('triangle should produce values between -1 and 1', () => {
      for (let i = 0; i < 1000; i++) {
        const t = i / SAMPLE_RATE;
        const val = triangle(440, t);
        expect(val).toBeGreaterThanOrEqual(-1);
        expect(val).toBeLessThanOrEqual(1);
      }
    });

    it('noise should produce values between -1 and 1', () => {
      for (let i = 0; i < 1000; i++) {
        const val = noise();
        expect(val).toBeGreaterThanOrEqual(-1);
        expect(val).toBeLessThanOrEqual(1);
      }
    });

    it('oscillate should dispatch to correct waveform', () => {
      const t = 0.001;
      expect(oscillate('sine', 440, t)).toBe(sine(440, t));
      expect(oscillate('square', 440, t)).toBe(square(440, t));
      expect(oscillate('sawtooth', 440, t)).toBe(sawtooth(440, t));
      expect(oscillate('triangle', 440, t)).toBe(triangle(440, t));
    });
  });

  describe('ADSR envelope', () => {
    it('should ramp up during attack', () => {
      const env = { attack: 0.1, decay: 0.1, sustain: 0.5, release: 0.1 };
      const start = applyADSR(0, 1, env);
      const mid = applyADSR(0.05, 1, env);
      const end = applyADSR(0.1, 1, env);
      expect(start).toBe(0);
      expect(mid).toBeCloseTo(0.5, 1);
      expect(end).toBeCloseTo(1.0, 1);
    });

    it('should decay to sustain level', () => {
      const env = { attack: 0.1, decay: 0.1, sustain: 0.5, release: 0.1 };
      const val = applyADSR(0.2, 1, env);
      expect(val).toBeCloseTo(0.5, 1);
    });

    it('should be zero after release', () => {
      const env = { attack: 0.1, decay: 0.1, sustain: 0.5, release: 0.1 };
      const val = applyADSR(1.2, 1, env);
      expect(val).toBe(0);
    });
  });

  describe('effects', () => {
    it('distortion should soft clip', () => {
      expect(distortion(0, 2)).toBe(0);
      expect(distortion(10, 2)).toBeCloseTo(1, 0); // tanh saturates
      expect(distortion(-10, 2)).toBeCloseTo(-1, 0);
    });

    it('bitcrush should quantize', () => {
      const val = bitcrush(0.73, 4);
      // Should snap to nearest quantization step, not be exact input
      expect(val).toBeGreaterThan(0);
      expect(val).toBeLessThanOrEqual(1);
      // 4-bit = 16 steps, step size = 2/16 = 0.125
      // Value should be on a 0.125 grid
      const step = 2 / Math.pow(2, 4);
      expect(val % step).toBeCloseTo(0, 10);
    });
  });

  describe('note helpers', () => {
    it('A4 should be 440Hz', () => {
      expect(midiToFreq(69)).toBe(440);
    });

    it('noteToMidi should parse note strings', () => {
      expect(noteToMidi('A4')).toBe(69);
      expect(noteToMidi('C4')).toBe(60);
      expect(noteToMidi('C#4')).toBe(61);
    });

    it('noteToFreq should return frequency for note string', () => {
      expect(noteToFreq('A4')).toBe(440);
    });

    it('octave should double frequency', () => {
      const a4 = midiToFreq(69);
      const a5 = midiToFreq(81);
      expect(a5).toBeCloseTo(a4 * 2, 0);
    });
  });

  describe('instrument generators', () => {
    it('generateTone should produce samples of correct length', () => {
      const duration = 0.5;
      const release = LEAD_ENV.release;
      const tone = generateTone('sine', 440, duration, LEAD_ENV);
      const expectedLength = Math.floor(SAMPLE_RATE * (duration + release));
      expect(tone.length).toBe(expectedLength);
    });

    it('synthBass should produce non-silent output', () => {
      const bass = synthBass(110, 0.3);
      const maxVal = Math.max(...Array.from(bass).map(Math.abs));
      expect(maxVal).toBeGreaterThan(0);
    });

    it('synthLead should produce non-silent output', () => {
      const lead = synthLead(440, 0.3);
      const maxVal = Math.max(...Array.from(lead).map(Math.abs));
      expect(maxVal).toBeGreaterThan(0);
    });

    it('synthKick should produce non-silent output', () => {
      const kick = synthKick();
      const maxVal = Math.max(...Array.from(kick).map(Math.abs));
      expect(maxVal).toBeGreaterThan(0);
    });

    it('synthSnare should produce non-silent output', () => {
      const snare = synthSnare();
      const maxVal = Math.max(...Array.from(snare).map(Math.abs));
      expect(maxVal).toBeGreaterThan(0);
    });

    it('synthHihat should produce non-silent output', () => {
      const hat = synthHihat();
      const maxVal = Math.max(...Array.from(hat).map(Math.abs));
      expect(maxVal).toBeGreaterThan(0);
    });
  });

  describe('buffer operations', () => {
    it('mixBuffers should combine buffers', () => {
      const buf1 = new Float64Array([1, 0, 0]);
      const buf2 = new Float64Array([0, 1, 0]);
      const mixed = mixBuffers([buf1, buf2], [1, 1]);
      expect(mixed[0]).toBe(1);
      expect(mixed[1]).toBe(1);
      expect(mixed[2]).toBe(0);
    });

    it('normalizeBuffer should scale to -1..1', () => {
      const buf = new Float64Array([2, -4, 1]);
      const normalized = normalizeBuffer(buf);
      expect(normalized[1]).toBe(-1); // -4/4 = -1
      expect(normalized[0]).toBe(0.5); // 2/4 = 0.5
    });
  });

  describe('WAV generation', () => {
    it('should produce a valid WAV buffer', () => {
      const samples = new Float64Array(SAMPLE_RATE); // 1 second of silence
      const wav = samplesToWav(samples);

      // Check RIFF header
      expect(wav.toString('ascii', 0, 4)).toBe('RIFF');
      expect(wav.toString('ascii', 8, 12)).toBe('WAVE');
      expect(wav.toString('ascii', 12, 16)).toBe('fmt ');
      expect(wav.toString('ascii', 36, 40)).toBe('data');

      // Check format
      expect(wav.readUInt16LE(20)).toBe(1); // PCM
      expect(wav.readUInt16LE(22)).toBe(1); // mono
      expect(wav.readUInt32LE(24)).toBe(SAMPLE_RATE); // sample rate
    });

    it('WAV buffer should have correct size', () => {
      const numSamples = 1000;
      const samples = new Float64Array(numSamples);
      const wav = samplesToWav(samples);
      // Header (44) + data (numSamples * 2 bytes for 16-bit)
      expect(wav.length).toBe(44 + numSamples * 2);
    });
  });
});
