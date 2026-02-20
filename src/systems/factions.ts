import { GameState, Faction, DistrictDanger } from '../types';
import { getFaction, getFactionStanding, FACTIONS } from '../data/factions';
import { getDistrict } from '../data/districts';
import { addLogEntry } from '../engine/state';
import { awardStreetCred } from './progression';

// ─── Faction Rivalries ───────────────────────────────────────────────────────
// When you gain rep with one faction, their rivals lose a proportional amount.

interface Rivalry {
  faction: string;
  ratio: number; // multiplier: gaining 10 rep costs rivals 10 * ratio
}

const FACTION_RIVALRIES: Record<string, Rivalry[]> = {
  megacorp:    [{ faction: 'maelstrom', ratio: 0.5 }, { faction: 'voodoo_boys', ratio: 0.3 }],
  maelstrom:   [{ faction: 'megacorp', ratio: 0.4 }, { faction: 'tyger_claws', ratio: 0.5 }, { faction: 'ncpd', ratio: 0.6 }],
  tyger_claws: [{ faction: 'maelstrom', ratio: 0.5 }],
  voodoo_boys: [{ faction: 'megacorp', ratio: 0.3 }],
  ncpd:        [{ faction: 'maelstrom', ratio: 0.4 }],
  nomads:      [{ faction: 'megacorp', ratio: 0.2 }],
};

// ─── NPC Contact Bonuses ─────────────────────────────────────────────────────
// Each NPC contact grants a concrete passive bonus.

export interface ContactBonus {
  id: string;
  name: string;
  description: string;
  bonusType: 'job_pay' | 'healing_discount' | 'encounter_reduction' | 'skill_bonus' | 'bar_bonus';
  value: number;
  target?: string; // faction/skill/district
}

const CONTACT_BONUSES: ContactBonus[] = [
  {
    id: 'fixer_jin',
    name: 'Jin "Chrome" Tanaka',
    description: '+15% job pay from fixer connections',
    bonusType: 'job_pay',
    value: 15,
  },
  {
    id: 'ripperdoc_vex',
    name: 'Dr. Vex',
    description: '25% discount on clinic healing',
    bonusType: 'healing_discount',
    value: 25,
  },
  {
    id: 'gang_boss_razor',
    name: 'Razor',
    description: '50% fewer hostile encounters in Industrial Zone',
    bonusType: 'encounter_reduction',
    value: 50,
    target: 'industrial',
  },
  {
    id: 'netrunner_ghost',
    name: 'Ghost',
    description: '+8 Hacking skill in the Undercity',
    bonusType: 'skill_bonus',
    value: 8,
    target: 'hacking',
  },
  {
    id: 'bartender_maya',
    name: 'Maya',
    description: 'Better bar benefits: extra HP and intel bonus',
    bonusType: 'bar_bonus',
    value: 10,
  },
];

// ─── Standing Effects ────────────────────────────────────────────────────────
// Your standing with a faction changes gameplay in their territory.

export type FactionStanding = 'Enemy' | 'Hostile' | 'Neutral' | 'Friendly' | 'Allied';

export interface StandingEffects {
  priceModifier: number;    // multiplier (0.8 = 20% discount, 1.2 = 20% markup)
  dangerShift: number;      // -2 to +2 danger level shifts
  ambushChance: number;     // 0-1 chance of faction ambush per turn
  jobPayBonus: number;      // percentage bonus to faction job pay
  refuseService: boolean;   // shops/clinics refuse to serve you
}

const STANDING_EFFECTS: Record<FactionStanding, StandingEffects> = {
  Enemy:    { priceModifier: 1.0, dangerShift: 2,  ambushChance: 0.35, jobPayBonus: 0,  refuseService: true },
  Hostile:  { priceModifier: 1.3, dangerShift: 1,  ambushChance: 0.15, jobPayBonus: 0,  refuseService: false },
  Neutral:  { priceModifier: 1.0, dangerShift: 0,  ambushChance: 0,    jobPayBonus: 0,  refuseService: false },
  Friendly: { priceModifier: 0.9, dangerShift: -1, ambushChance: 0,    jobPayBonus: 10, refuseService: false },
  Allied:   { priceModifier: 0.8, dangerShift: -2, ambushChance: 0,    jobPayBonus: 25, refuseService: false },
};

const DANGER_ORDER: DistrictDanger[] = ['low', 'medium', 'high', 'extreme'];

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Get the player's standing with the controlling faction of their current district.
 * Returns null if the district has no controlling faction.
 */
export function getDistrictFactionStanding(state: GameState): { faction: Faction; standing: FactionStanding } | null {
  const district = getDistrict(state.character.currentDistrict);
  if (!district?.controllingFaction) return null;

  const faction = getFaction(district.controllingFaction);
  if (!faction) return null;

  const rep = state.character.reputation[faction.id] ?? 0;
  const standing = getFactionStanding(rep, faction) as FactionStanding;
  return { faction, standing };
}

/**
 * Get standing effects for the player in their current district.
 */
export function getDistrictStandingEffects(state: GameState): StandingEffects {
  const result = getDistrictFactionStanding(state);
  if (!result) return STANDING_EFFECTS.Neutral;
  return STANDING_EFFECTS[result.standing];
}

/**
 * Get the effective danger level for the current district, modified by faction standing.
 */
export function getEffectiveDanger(state: GameState): DistrictDanger {
  const district = getDistrict(state.character.currentDistrict);
  if (!district) return 'medium';

  const baseDangerIndex = DANGER_ORDER.indexOf(district.danger);
  const effects = getDistrictStandingEffects(state);
  const newIndex = Math.max(0, Math.min(DANGER_ORDER.length - 1, baseDangerIndex + effects.dangerShift));
  return DANGER_ORDER[newIndex];
}

/**
 * Get price modifier for shops in the current district.
 */
export function getShopPriceModifier(state: GameState): number {
  return getDistrictStandingEffects(state).priceModifier;
}

/**
 * Check if shops/services refuse to serve the player (Enemy standing).
 */
export function isServiceRefused(state: GameState): boolean {
  return getDistrictStandingEffects(state).refuseService;
}

/**
 * Get job pay multiplier based on faction standing for a given job.
 */
export function getFactionJobPayMultiplier(state: GameState, jobFaction: string | null): number {
  if (!jobFaction) return 1.0;

  const faction = getFaction(jobFaction);
  if (!faction) return 1.0;

  const rep = state.character.reputation[faction.id] ?? 0;
  const standing = getFactionStanding(rep, faction) as FactionStanding;
  const bonus = STANDING_EFFECTS[standing].jobPayBonus;
  return 1 + bonus / 100;
}

/**
 * Check if a faction ambush should occur this turn.
 * Returns the faction ID if ambush triggers, null otherwise.
 */
export function checkFactionAmbush(state: GameState): string | null {
  const result = getDistrictFactionStanding(state);
  if (!result) return null;

  const effects = STANDING_EFFECTS[result.standing];
  if (effects.ambushChance <= 0) return null;

  // Razor contact reduces encounter chance in Industrial
  if (state.character.currentDistrict === 'industrial' &&
      state.character.contacts.includes('gang_boss_razor') &&
      result.faction.id === 'maelstrom') {
    if (Math.random() >= effects.ambushChance * 0.5) return null;
  } else if (Math.random() >= effects.ambushChance) {
    return null;
  }

  return result.faction.id;
}

/**
 * Apply faction rivalry: when gaining rep with one faction, rivals lose rep.
 * Returns messages about rivalry effects.
 */
export function applyFactionRivalry(state: GameState, factionId: string, amount: number): string[] {
  if (amount <= 0) return []; // Only positive gains trigger rivalry

  const rivalries = FACTION_RIVALRIES[factionId];
  if (!rivalries) return [];

  const messages: string[] = [];
  for (const rivalry of rivalries) {
    const loss = Math.floor(amount * rivalry.ratio);
    if (loss > 0) {
      const current = state.character.reputation[rivalry.faction] ?? 0;
      state.character.reputation[rivalry.faction] = Math.max(-100, current - loss);
      const rivalFaction = getFaction(rivalry.faction);
      const rivalName = rivalFaction?.name ?? rivalry.faction;
      messages.push(`${rivalName} rep -${loss} (rivalry)`);
    }
  }
  return messages;
}

/**
 * Check if the player just crossed a faction standing threshold.
 * Awards street cred for reaching Friendly or Allied status.
 */
export function checkFactionStandingMilestone(state: GameState, factionId: string, oldRep: number, newRep: number): string[] {
  const faction = getFaction(factionId);
  if (!faction) return [];

  const oldStanding = getFactionStanding(oldRep, faction);
  const newStanding = getFactionStanding(newRep, faction);

  if (oldStanding === newStanding) return [];

  const messages: string[] = [];
  messages.push(`${faction.name} standing: ${oldStanding} → ${newStanding}`);

  // Award street cred for positive milestones
  if (newStanding === 'Friendly' && oldStanding !== 'Allied') {
    const credResult = awardStreetCred(state, 5, `becoming Friendly with ${faction.name}`);
    messages.push(...credResult.messages);
  } else if (newStanding === 'Allied') {
    const credResult = awardStreetCred(state, 10, `becoming Allied with ${faction.name}`);
    messages.push(...credResult.messages);
  }

  return messages;
}

// ─── Contact Bonus Helpers ───────────────────────────────────────────────────

/**
 * Get a specific contact bonus if the player has that contact.
 */
export function getContactBonus(state: GameState, contactId: string): ContactBonus | null {
  if (!state.character.contacts.includes(contactId)) return null;
  return CONTACT_BONUSES.find(b => b.id === contactId) ?? null;
}

/**
 * Check if the player has a contact bonus of a given type.
 */
export function hasContactBonus(state: GameState, bonusType: ContactBonus['bonusType']): ContactBonus | null {
  for (const bonus of CONTACT_BONUSES) {
    if (bonus.bonusType === bonusType && state.character.contacts.includes(bonus.id)) {
      return bonus;
    }
  }
  return null;
}

/**
 * Get all active contact bonuses for the player.
 */
export function getActiveContactBonuses(state: GameState): ContactBonus[] {
  return CONTACT_BONUSES.filter(b => state.character.contacts.includes(b.id));
}

/**
 * Get the job pay multiplier from contacts (fixer_jin bonus).
 */
export function getContactJobPayMultiplier(state: GameState): number {
  const bonus = getContactBonus(state, 'fixer_jin');
  return bonus ? 1 + bonus.value / 100 : 1.0;
}

/**
 * Get healing price discount from contacts (ripperdoc_vex bonus).
 */
export function getHealingDiscount(state: GameState): number {
  const bonus = getContactBonus(state, 'ripperdoc_vex');
  return bonus ? bonus.value / 100 : 0;
}

/**
 * Check if combat encounter should be skipped due to contact bonus.
 * (Razor reduces encounters in Industrial Zone.)
 */
export function shouldReduceEncounter(state: GameState): boolean {
  const bonus = getContactBonus(state, 'gang_boss_razor');
  if (!bonus || state.character.currentDistrict !== bonus.target) return false;
  return Math.random() < bonus.value / 100;
}

/**
 * Get hacking skill bonus from Ghost contact when in Undercity.
 */
export function getGhostHackingBonus(state: GameState): number {
  const bonus = getContactBonus(state, 'netrunner_ghost');
  if (!bonus || state.character.currentDistrict !== 'undercity') return 0;
  return bonus.value;
}

/**
 * Get bar bonus from Maya contact.
 */
export function getMayaBarBonus(state: GameState): { extraHP: number; extraSkill: number } {
  const bonus = getContactBonus(state, 'bartender_maya');
  if (!bonus) return { extraHP: 0, extraSkill: 0 };
  return { extraHP: bonus.value, extraSkill: 2 };
}

// Export for tests
export { FACTION_RIVALRIES, CONTACT_BONUSES, STANDING_EFFECTS, DANGER_ORDER };
