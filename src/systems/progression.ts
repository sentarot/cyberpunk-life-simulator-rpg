import { GameState, ReputationTier, ProgressionState } from '../types';
import { addLogEntry } from '../engine/state';

// --- Tier Thresholds ---

const TIER_THRESHOLDS: { tier: ReputationTier; cred: number }[] = [
  { tier: 'legend', cred: 300 },
  { tier: 'elite', cred: 200 },
  { tier: 'veteran', cred: 150 },
  { tier: 'player', cred: 100 },
  { tier: 'operator', cred: 50 },
  { tier: 'prospect', cred: 25 },
  { tier: 'nobody', cred: 0 },
];

const TIER_ORDER: ReputationTier[] = ['nobody', 'prospect', 'operator', 'player', 'veteran', 'elite', 'legend'];

const ACT_MAP: Record<ReputationTier, 1 | 2 | 3> = {
  nobody: 1,
  prospect: 1,
  operator: 2,
  player: 2,
  veteran: 2,
  elite: 3,
  legend: 3,
};

// --- Tier Display Names ---

const TIER_NAMES: Record<ReputationTier, string> = {
  nobody: 'Nobody',
  prospect: 'Prospect',
  operator: 'Operator',
  player: 'Player',
  veteran: 'Veteran',
  elite: 'Elite',
  legend: 'Legend',
};

const TIER_DESCRIPTIONS: Record<ReputationTier, string> = {
  nobody: 'Just another face in the crowd.',
  prospect: 'People are starting to notice.',
  operator: 'You have a name in certain circles.',
  player: 'Fixers know your comm frequency.',
  veteran: 'Your reputation opens doors.',
  elite: 'The legends talk about you.',
  legend: 'You have made your mark on this city forever.',
};

const ACT_NAMES: Record<1 | 2 | 3, string> = {
  1: 'SURVIVAL',
  2: 'RISE',
  3: 'LEGACY',
};

// --- Public API ---

export function createInitialProgression(): ProgressionState {
  return {
    streetCred: 0,
    tier: 'nobody',
    act: 1,
    completedMilestones: [],
    tierReachedDay: { nobody: 1 },
    jobsCompleted: 0,
    jobsFailed: 0,
    enemiesDefeated: 0,
    enemiesFledFrom: 0,
    pivotalChoices: {},
  };
}

export function getTierForCred(streetCred: number): ReputationTier {
  for (const { tier, cred } of TIER_THRESHOLDS) {
    if (streetCred >= cred) return tier;
  }
  return 'nobody';
}

export function getActForTier(tier: ReputationTier): 1 | 2 | 3 {
  return ACT_MAP[tier];
}

export function getTierName(tier: ReputationTier): string {
  return TIER_NAMES[tier];
}

export function getTierDescription(tier: ReputationTier): string {
  return TIER_DESCRIPTIONS[tier];
}

export function getActName(act: 1 | 2 | 3): string {
  return ACT_NAMES[act];
}

export function getNextTierCred(tier: ReputationTier): number | null {
  const index = TIER_ORDER.indexOf(tier);
  if (index >= TIER_ORDER.length - 1) return null;
  const nextTier = TIER_ORDER[index + 1];
  const entry = TIER_THRESHOLDS.find(t => t.tier === nextTier);
  return entry?.cred ?? null;
}

export function getCredForTier(tier: ReputationTier): number {
  const entry = TIER_THRESHOLDS.find(t => t.tier === tier);
  return entry?.cred ?? 0;
}

/**
 * Award street cred and check for tier changes.
 * Returns messages about cred gain and any tier/act transitions.
 */
export function awardStreetCred(state: GameState, amount: number, source: string): {
  messages: string[];
  tierChanged: boolean;
  actChanged: boolean;
  newTier?: ReputationTier;
  newAct?: 1 | 2 | 3;
  oldTier?: ReputationTier;
  oldAct?: 1 | 2 | 3;
} {
  const messages: string[] = [];
  const prog = state.progression;
  const oldTier = prog.tier;
  const oldAct = prog.act;

  prog.streetCred += amount;
  if (amount > 0) {
    messages.push(`Street Cred +${amount} (${source})`);
  }

  const newTier = getTierForCred(prog.streetCred);
  const newAct = getActForTier(newTier);
  let tierChanged = false;
  let actChanged = false;

  if (newTier !== oldTier) {
    prog.tier = newTier;
    prog.tierReachedDay[newTier] = state.currentDay;
    tierChanged = true;
    addLogEntry(state, `Reputation tier reached: ${getTierName(newTier)}`, 'story');
  }

  if (newAct !== oldAct) {
    prog.act = newAct;
    actChanged = true;
    addLogEntry(state, `Act ${newAct}: ${getActName(newAct)} begins.`, 'story');
  }

  return {
    messages,
    tierChanged,
    actChanged,
    newTier: tierChanged ? newTier : undefined,
    newAct: actChanged ? newAct : undefined,
    oldTier: tierChanged ? oldTier : undefined,
    oldAct: actChanged ? oldAct : undefined,
  };
}

/**
 * Calculate street cred reward for a job based on difficulty.
 */
export function getJobStreetCred(difficulty: number, success: boolean): number {
  if (success) {
    return difficulty * 2 + 1;
  }
  return 1; // You showed up
}

/**
 * Calculate street cred reward for defeating an enemy.
 */
export function getCombatStreetCred(enemyLevel: number): number {
  return enemyLevel + 1;
}

/**
 * Street cred awarded for surviving (called each new day).
 */
export function getSurvivalStreetCred(daysSurvived: number): number {
  // +1 cred every 7 days
  if (daysSurvived > 0 && daysSurvived % 7 === 0) {
    return 1;
  }
  return 0;
}

/**
 * Get effective enemy difficulty scaling based on player tier.
 * Returns a danger level upgrade for enemy selection.
 */
export function getScaledDanger(baseDanger: string, tier: ReputationTier): string {
  const tierIndex = TIER_ORDER.indexOf(tier);

  // Operator+ bumps low -> medium
  if (baseDanger === 'low' && tierIndex >= 2) return 'medium';
  // Player+ bumps medium -> high
  if (baseDanger === 'medium' && tierIndex >= 3) return 'high';
  // Veteran+ bumps high -> extreme
  if (baseDanger === 'high' && tierIndex >= 4) return 'extreme';

  return baseDanger;
}

export { TIER_ORDER };
