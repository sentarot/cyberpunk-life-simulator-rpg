import * as fs from 'fs';
import * as path from 'path';
import { SaveData, GameState } from '../types';

const SAVE_DIR = path.join(process.cwd(), 'saves');
const SAVE_VERSION = '1.0.0';

function ensureSaveDir(): void {
  if (!fs.existsSync(SAVE_DIR)) {
    fs.mkdirSync(SAVE_DIR, { recursive: true });
  }
}

export function saveGame(state: GameState, slotName: string = 'autosave'): boolean {
  try {
    ensureSaveDir();
    const saveData: SaveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      gameState: state,
    };
    const filePath = path.join(SAVE_DIR, `${slotName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(saveData, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

export function loadGame(slotName: string = 'autosave'): GameState | null {
  try {
    const filePath = path.join(SAVE_DIR, `${slotName}.json`);
    if (!fs.existsSync(filePath)) return null;

    const raw = fs.readFileSync(filePath, 'utf-8');
    const saveData: SaveData = JSON.parse(raw);

    if (saveData.version !== SAVE_VERSION) {
      console.log(`Warning: Save version mismatch (${saveData.version} vs ${SAVE_VERSION})`);
    }

    return saveData.gameState;
  } catch {
    return null;
  }
}

export function listSaves(): { name: string; timestamp: number; characterName: string; day: number }[] {
  try {
    ensureSaveDir();
    const files = fs.readdirSync(SAVE_DIR).filter(f => f.endsWith('.json'));
    return files.map(f => {
      const raw = fs.readFileSync(path.join(SAVE_DIR, f), 'utf-8');
      const data: SaveData = JSON.parse(raw);
      return {
        name: f.replace('.json', ''),
        timestamp: data.timestamp,
        characterName: data.gameState.character.name,
        day: data.gameState.currentDay,
      };
    });
  } catch {
    return [];
  }
}

export function deleteSave(slotName: string): boolean {
  try {
    const filePath = path.join(SAVE_DIR, `${slotName}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
