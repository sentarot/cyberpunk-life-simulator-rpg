import { StatName, SkillName } from '../types';

/**
 * Perks are permanent passive bonuses chosen at milestone levels.
 * They create meaningful build differentiation and reward investment
 * in particular playstyles.
 */

export interface Perk {
  id: string;
  name: string;
  description: string;
  tier: 1 | 2 | 3 | 4;           // unlocked at levels 3, 5, 7, 10
  category: 'combat' | 'tech' | 'social' | 'survival';
  effects: PerkEffect[];
}

export interface PerkEffect {
  type: 'stat_bonus' | 'skill_bonus' | 'max_health' | 'cred_multiplier' | 'damage_bonus'
    | 'armor_bonus' | 'heal_bonus' | 'crit_chance' | 'hack_damage' | 'xp_bonus'
    | 'discount' | 'flee_bonus' | 'humanity_recovery';
  target?: StatName | SkillName;
  value: number;
}

/** Levels at which the player picks a perk */
export const PERK_LEVELS = [3, 5, 7, 10];

/** How many stat points awarded per level-up */
export const STAT_POINTS_PER_LEVEL = 1;

/** How many skill points awarded per level-up */
export const SKILL_POINTS_PER_LEVEL = 5;

// ─── TIER 1 PERKS (Level 3) ───────────────────────────────────────────────

const TIER_1_PERKS: Perk[] = [
  {
    id: 'iron_skin',
    name: 'Iron Skin',
    description: '+15 max HP. You can take a beating and keep going.',
    tier: 1,
    category: 'combat',
    effects: [{ type: 'max_health', value: 15 }],
  },
  {
    id: 'quick_learner',
    name: 'Quick Learner',
    description: '+25% XP from all sources. Knowledge is power.',
    tier: 1,
    category: 'tech',
    effects: [{ type: 'xp_bonus', value: 25 }],
  },
  {
    id: 'street_smarts',
    name: 'Street Smarts',
    description: '+3 street cred per completed job. Your reputation grows faster.',
    tier: 1,
    category: 'social',
    effects: [{ type: 'cred_multiplier', value: 3 }],
  },
  {
    id: 'scrapper',
    name: 'Scrapper',
    description: '+3 base damage in combat. Hit harder, live longer.',
    tier: 1,
    category: 'combat',
    effects: [{ type: 'damage_bonus', value: 3 }],
  },
];

// ─── TIER 2 PERKS (Level 5) ───────────────────────────────────────────────

const TIER_2_PERKS: Perk[] = [
  {
    id: 'chrome_constitution',
    name: 'Chrome Constitution',
    description: '+25 max HP and +2 Body. Your body has adapted to the chrome.',
    tier: 2,
    category: 'survival',
    effects: [
      { type: 'max_health', value: 25 },
      { type: 'stat_bonus', target: 'body', value: 2 },
    ],
  },
  {
    id: 'neural_optimizer',
    name: 'Neural Optimizer',
    description: '+50% hack damage and +2 Intelligence. The Net bends to your will.',
    tier: 2,
    category: 'tech',
    effects: [
      { type: 'hack_damage', value: 50 },
      { type: 'stat_bonus', target: 'intelligence', value: 2 },
    ],
  },
  {
    id: 'silver_tongue',
    name: 'Silver Tongue',
    description: '+2 Cool, +10 Persuasion. Words are weapons too.',
    tier: 2,
    category: 'social',
    effects: [
      { type: 'stat_bonus', target: 'cool', value: 2 },
      { type: 'skill_bonus', target: 'persuasion', value: 10 },
    ],
  },
  {
    id: 'combat_veteran',
    name: 'Combat Veteran',
    description: '+5 damage, +10 Combat skill. You\'ve learned to fight dirty.',
    tier: 2,
    category: 'combat',
    effects: [
      { type: 'damage_bonus', value: 5 },
      { type: 'skill_bonus', target: 'combat', value: 10 },
    ],
  },
];

// ─── TIER 3 PERKS (Level 7) ───────────────────────────────────────────────

const TIER_3_PERKS: Perk[] = [
  {
    id: 'ghost_protocol',
    name: 'Ghost in the Machine',
    description: '+20 Stealth, +20 Hacking, +2 Reflexes. Digital and physical invisibility.',
    tier: 3,
    category: 'tech',
    effects: [
      { type: 'skill_bonus', target: 'stealth', value: 20 },
      { type: 'skill_bonus', target: 'hacking', value: 20 },
      { type: 'stat_bonus', target: 'reflexes', value: 2 },
    ],
  },
  {
    id: 'war_machine',
    name: 'War Machine',
    description: '+8 damage, +3 Body, +5 armor. Built to destroy.',
    tier: 3,
    category: 'combat',
    effects: [
      { type: 'damage_bonus', value: 8 },
      { type: 'stat_bonus', target: 'body', value: 3 },
      { type: 'armor_bonus', value: 5 },
    ],
  },
  {
    id: 'fixer_network',
    name: 'Fixer Network',
    description: '+5 street cred per job, +20 Streetwise, 20% shop discount.',
    tier: 3,
    category: 'social',
    effects: [
      { type: 'cred_multiplier', value: 5 },
      { type: 'skill_bonus', target: 'streetwise', value: 20 },
      { type: 'discount', value: 20 },
    ],
  },
  {
    id: 'regenerator',
    name: 'Regenerator',
    description: '+40 max HP, double rest healing, slow humanity recovery.',
    tier: 3,
    category: 'survival',
    effects: [
      { type: 'max_health', value: 40 },
      { type: 'heal_bonus', value: 100 },
      { type: 'humanity_recovery', value: 1 },
    ],
  },
];

// ─── TIER 4 PERKS (Level 10) ──────────────────────────────────────────────

const TIER_4_PERKS: Perk[] = [
  {
    id: 'legend_of_the_streets',
    name: 'Legend of the Streets',
    description: '+3 to ALL stats. You\'ve transcended ordinary limits.',
    tier: 4,
    category: 'social',
    effects: [
      { type: 'stat_bonus', target: 'body', value: 3 },
      { type: 'stat_bonus', target: 'reflexes', value: 3 },
      { type: 'stat_bonus', target: 'tech', value: 3 },
      { type: 'stat_bonus', target: 'intelligence', value: 3 },
      { type: 'stat_bonus', target: 'cool', value: 3 },
      { type: 'stat_bonus', target: 'luck', value: 3 },
    ],
  },
  {
    id: 'apex_predator',
    name: 'Apex Predator',
    description: '+15 damage, 20% crit chance, +50 max HP. Death incarnate.',
    tier: 4,
    category: 'combat',
    effects: [
      { type: 'damage_bonus', value: 15 },
      { type: 'crit_chance', value: 20 },
      { type: 'max_health', value: 50 },
    ],
  },
  {
    id: 'netrunner_prime',
    name: 'Netrunner Prime',
    description: '+100% hack damage, +5 Intelligence, +30 Hacking. The Net is yours.',
    tier: 4,
    category: 'tech',
    effects: [
      { type: 'hack_damage', value: 100 },
      { type: 'stat_bonus', target: 'intelligence', value: 5 },
      { type: 'skill_bonus', target: 'hacking', value: 30 },
    ],
  },
  {
    id: 'unkillable',
    name: 'Unkillable',
    description: '+100 max HP, +5 Body, +5 armor. They can\'t stop what they can\'t kill.',
    tier: 4,
    category: 'survival',
    effects: [
      { type: 'max_health', value: 100 },
      { type: 'stat_bonus', target: 'body', value: 5 },
      { type: 'armor_bonus', value: 5 },
    ],
  },
];

// ─── Public API ───────────────────────────────────────────────────────────

const ALL_PERKS = [...TIER_1_PERKS, ...TIER_2_PERKS, ...TIER_3_PERKS, ...TIER_4_PERKS];
const PERKS_BY_TIER: Record<number, Perk[]> = {
  1: TIER_1_PERKS,
  2: TIER_2_PERKS,
  3: TIER_3_PERKS,
  4: TIER_4_PERKS,
};

export function getPerkTierForLevel(level: number): number | null {
  const index = PERK_LEVELS.indexOf(level);
  return index >= 0 ? index + 1 : null;
}

export function getPerksForTier(tier: number): Perk[] {
  return PERKS_BY_TIER[tier] ?? [];
}

export function getPerkById(id: string): Perk | undefined {
  return ALL_PERKS.find(p => p.id === id);
}

/**
 * Aggregate all perk effects of a given type from the player's perk list.
 */
export function getPerkBonus(perkIds: string[], effectType: PerkEffect['type'], target?: string): number {
  let total = 0;
  for (const id of perkIds) {
    const perk = getPerkById(id);
    if (!perk) continue;
    for (const effect of perk.effects) {
      if (effect.type === effectType && (!target || effect.target === target)) {
        total += effect.value;
      }
    }
  }
  return total;
}
