/**
 * WAV file generation and playback.
 * Converts Float64Array PCM data to WAV format and writes to disk.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ChildProcess, spawn } from 'child_process';
import { SAMPLE_RATE, BIT_DEPTH } from './synth';

const AUDIO_DIR = path.join(process.cwd(), '.audio_cache');

function ensureAudioDir(): void {
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }
}

/**
 * Convert Float64 PCM samples (-1 to 1) to 16-bit WAV file buffer.
 */
export function samplesToWav(samples: Float64Array, sampleRate: number = SAMPLE_RATE): Buffer {
  const numChannels = 1;
  const bitsPerSample = BIT_DEPTH;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const fileSize = 36 + dataSize;

  const buffer = Buffer.alloc(44 + dataSize);
  let offset = 0;

  // RIFF header
  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(fileSize, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;

  // fmt chunk
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4;           // chunk size
  buffer.writeUInt16LE(1, offset); offset += 2;            // PCM format
  buffer.writeUInt16LE(numChannels, offset); offset += 2;
  buffer.writeUInt32LE(sampleRate, offset); offset += 4;
  buffer.writeUInt32LE(byteRate, offset); offset += 4;
  buffer.writeUInt16LE(blockAlign, offset); offset += 2;
  buffer.writeUInt16LE(bitsPerSample, offset); offset += 2;

  // data chunk
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;

  // Write samples as 16-bit signed integers
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    const int16 = Math.floor(clamped * 32767);
    buffer.writeInt16LE(int16, offset);
    offset += 2;
  }

  return buffer;
}

/**
 * Write PCM samples to a WAV file.
 */
export function writeWav(samples: Float64Array, filename: string): string {
  ensureAudioDir();
  const filePath = path.join(AUDIO_DIR, filename);
  const wavBuffer = samplesToWav(samples);
  fs.writeFileSync(filePath, wavBuffer);
  return filePath;
}

/**
 * Audio player that can play WAV files in the background.
 * Tries aplay (ALSA), paplay (PulseAudio), play (SoX), then ffplay.
 */
export class AudioPlayer {
  private currentProcess: ChildProcess | null = null;
  private looping: boolean = false;
  private currentFile: string | null = null;
  private available: string | null = null;
  private checked: boolean = false;

  /**
   * Detect which audio player is available on this system.
   */
  private detectPlayer(): string | null {
    if (this.checked) return this.available;
    this.checked = true;

    const players = ['aplay', 'paplay', 'play', 'ffplay', 'mpv'];
    for (const player of players) {
      try {
        const result = require('child_process').spawnSync('which', [player], {
          stdio: 'pipe',
          timeout: 2000,
        });
        if (result.status === 0) {
          this.available = player;
          return player;
        }
      } catch {
        continue;
      }
    }
    this.available = null;
    return null;
  }

  /**
   * Get the command to play a WAV file.
   */
  private getPlayCommand(filePath: string, player: string): { cmd: string; args: string[] } {
    switch (player) {
      case 'aplay':
        return { cmd: 'aplay', args: ['-q', filePath] };
      case 'paplay':
        return { cmd: 'paplay', args: [filePath] };
      case 'play':
        return { cmd: 'play', args: ['-q', filePath] };
      case 'ffplay':
        return { cmd: 'ffplay', args: ['-nodisp', '-autoexit', '-loglevel', 'quiet', filePath] };
      case 'mpv':
        return { cmd: 'mpv', args: ['--no-video', '--really-quiet', filePath] };
      default:
        return { cmd: 'aplay', args: ['-q', filePath] };
    }
  }

  /**
   * Check if audio playback is available on this system.
   */
  isAvailable(): boolean {
    return this.detectPlayer() !== null;
  }

  /**
   * Play a WAV file once.
   */
  play(filePath: string): boolean {
    const player = this.detectPlayer();
    if (!player) return false;

    this.stop();
    const { cmd, args } = this.getPlayCommand(filePath, player);
    try {
      this.currentProcess = spawn(cmd, args, {
        stdio: 'ignore',
        detached: false,
      });
      this.currentFile = filePath;
      this.currentProcess.on('error', () => {
        this.currentProcess = null;
      });
      this.currentProcess.on('exit', () => {
        if (this.looping && this.currentFile) {
          this.play(this.currentFile);
        } else {
          this.currentProcess = null;
        }
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Play a WAV file on loop.
   */
  playLoop(filePath: string): boolean {
    this.looping = true;
    this.currentFile = filePath;
    return this.play(filePath);
  }

  /**
   * Stop playback.
   */
  stop(): void {
    this.looping = false;
    this.currentFile = null;
    if (this.currentProcess) {
      try {
        this.currentProcess.kill('SIGTERM');
      } catch {
        // Process may already be dead
      }
      this.currentProcess = null;
    }
  }

  /**
   * Clean up audio cache files.
   */
  cleanup(): void {
    this.stop();
    try {
      if (fs.existsSync(AUDIO_DIR)) {
        const files = fs.readdirSync(AUDIO_DIR);
        for (const file of files) {
          fs.unlinkSync(path.join(AUDIO_DIR, file));
        }
        fs.rmdirSync(AUDIO_DIR);
      }
    } catch {
      // Best effort cleanup
    }
  }
}
