// Random number utilities for the game

/**
 * Roll a number between min and max (inclusive).
 */
export function roll(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Roll a d20 (1-20).
 */
export function d20(): number {
  return roll(1, 20);
}

/**
 * Perform a skill/stat check. Returns true if the check passes.
 * Roll d20 + modifier vs difficulty.
 */
export function check(modifier: number, difficulty: number): { success: boolean; roll: number; total: number } {
  const rolled = d20();
  const total = rolled + modifier;
  return { success: total >= difficulty, roll: rolled, total };
}

/**
 * Weighted random selection from a list of items with weights.
 */
export function weightedRandom<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  return items[items.length - 1];
}

/**
 * Returns true with the given probability (0-1).
 */
export function chance(probability: number): boolean {
  return Math.random() < probability;
}

/**
 * Pick a random element from an array.
 */
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Shuffle an array in place (Fisher-Yates).
 */
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
