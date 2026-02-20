import { GameState, Character, GameSettings, TimeOfDay, LogEntry, EventOutcome, StatName, SkillName } from '../types';
import { clamp } from '../utils/dice';
import { createInitialProgression } from '../systems/progression';
import { getPerkBonus } from '../data/perks';
import { applyFactionRivalry, checkFactionStandingMilestone } from '../systems/factions';

const DEFAULT_SETTINGS: GameSettings = {
  difficulty: 'normal',
  autoSave: true,
  verboseLog: false,
};

export function createInitialState(character: Character): GameState {
  return {
    character,
    currentDay: 1,
    currentTime: 'morning',
    worldEvents: [],
    completedEventIds: [],
    eventCooldowns: {},
    gameLog: [],
    settings: { ...DEFAULT_SETTINGS },
    progression: createInitialProgression(),
  };
}

export function advanceTime(state: GameState): GameState {
  const timeOrder: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];
  const currentIndex = timeOrder.indexOf(state.currentTime);
  const nextIndex = (currentIndex + 1) % timeOrder.length;
  const newDay = nextIndex === 0 ? state.currentDay + 1 : state.currentDay;

  if (nextIndex === 0) {
    state.character.daysSurvived++;
  }

  return {
    ...state,
    currentTime: timeOrder[nextIndex],
    currentDay: newDay,
  };
}

export function addLogEntry(state: GameState, message: string, type: LogEntry['type'] = 'info'): void {
  state.gameLog.push({
    day: state.currentDay,
    time: state.currentTime,
    message,
    type,
  });
  // Keep log manageable
  if (state.gameLog.length > 500) {
    state.gameLog = state.gameLog.slice(-300);
  }
}

export function applyOutcome(state: GameState, outcome: EventOutcome): string {
  const char = state.character;
  const value = outcome.value ?? 0;

  switch (outcome.type) {
    case 'credits':
      char.credits = Math.max(0, char.credits + value);
      return outcome.message;

    case 'experience': {
      const xpBonus = (char.perks?.length > 0) ? getPerkBonus(char.perks, 'xp_bonus') : 0;
      const xpGain = xpBonus > 0 ? Math.floor(value * (1 + xpBonus / 100)) : value;
      char.experience += xpGain;
      checkLevelUp(char);
      return outcome.message;
    }

    case 'health':
      char.health = clamp(char.health + value, 0, char.maxHealth);
      return outcome.message;

    case 'reputation':
      if (outcome.target) {
        const oldRep = char.reputation[outcome.target] ?? 0;
        char.reputation[outcome.target] = clamp(oldRep + value, -100, 100);
        const newRep = char.reputation[outcome.target];
        // Apply faction rivalry and standing milestones
        if (value > 0) {
          applyFactionRivalry(state, outcome.target, value);
        }
        checkFactionStandingMilestone(state, outcome.target, oldRep, newRep);
      }
      return outcome.message;

    case 'stat':
      if (outcome.target && outcome.target in char.stats) {
        const statKey = outcome.target as StatName;
        char.stats[statKey] = clamp(char.stats[statKey] + value, 1, 20);
      }
      return outcome.message;

    case 'skill':
      if (outcome.target && outcome.target in char.skills) {
        const skillKey = outcome.target as SkillName;
        char.skills[skillKey] = clamp(char.skills[skillKey] + value, 0, 100);
      }
      return outcome.message;

    case 'humanity':
      char.humanity = clamp(char.humanity + value, 0, 100);
      return outcome.message;

    case 'quest':
      if (outcome.target && value > 0) {
        if (!char.activeQuests.includes(outcome.target)) {
          char.activeQuests.push(outcome.target);
        }
      } else if (outcome.target && value <= 0) {
        char.activeQuests = char.activeQuests.filter(q => q !== outcome.target);
        if (!char.completedQuests.includes(outcome.target)) {
          char.completedQuests.push(outcome.target);
        }
      }
      return outcome.message;

    case 'contact':
      if (outcome.target && !char.contacts.includes(outcome.target)) {
        char.contacts.push(outcome.target);
      }
      return outcome.message;

    case 'trait':
      if (outcome.target && !char.traits.includes(outcome.target)) {
        char.traits.push(outcome.target);
      }
      return outcome.message;

    case 'street_cred':
      if (state.progression) {
        state.progression.streetCred += value;
      }
      return outcome.message;

    case 'message':
      return outcome.message;

    default:
      return outcome.message;
  }
}

export function applyOutcomes(state: GameState, outcomes: EventOutcome[]): string[] {
  return outcomes.map(o => applyOutcome(state, o));
}

function checkLevelUp(char: Character): boolean {
  const xpRequired = getXPForLevel(char.level + 1);
  if (char.experience >= xpRequired) {
    char.level++;
    char.experience -= xpRequired;
    char.maxHealth += 5;
    char.health = char.maxHealth;
    return true;
  }
  return false;
}

export function getXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function getDifficultyModifier(settings: GameSettings): number {
  switch (settings.difficulty) {
    case 'easy': return 0.7;
    case 'normal': return 1.0;
    case 'hard': return 1.3;
    case 'nightmare': return 1.6;
  }
}

export function getEffectiveStat(char: Character, stat: StatName): number {
  let value = char.stats[stat];
  for (const aug of char.augmentations) {
    if (aug.statBonuses[stat]) {
      value += aug.statBonuses[stat]!;
    }
  }
  for (const inv of char.inventory) {
    if (inv.item.effects) {
      for (const effect of inv.item.effects) {
        if (effect.stat === stat) {
          value += effect.modifier;
        }
      }
    }
  }
  // Perk bonuses
  if (char.perks && char.perks.length > 0) {
    value += getPerkBonus(char.perks, 'stat_bonus', stat);
  }
  return value;
}

export function getEffectiveSkill(char: Character, skill: SkillName): number {
  let value = char.skills[skill];
  for (const aug of char.augmentations) {
    if (aug.skillBonuses[skill]) {
      value += aug.skillBonuses[skill]!;
    }
  }
  // Perk bonuses
  if (char.perks && char.perks.length > 0) {
    value += getPerkBonus(char.perks, 'skill_bonus', skill);
  }
  // Ghost contact: +8 hacking in Undercity
  if (skill === 'hacking' && char.currentDistrict === 'undercity' && char.contacts.includes('netrunner_ghost')) {
    value += 8;
  }
  return value;
}
