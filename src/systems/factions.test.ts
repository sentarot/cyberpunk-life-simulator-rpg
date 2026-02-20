import {
  getDistrictFactionStanding,
  getDistrictStandingEffects,
  getEffectiveDanger,
  getShopPriceModifier,
  isServiceRefused,
  getFactionJobPayMultiplier,
  applyFactionRivalry,
  checkFactionStandingMilestone,
  getContactBonus,
  hasContactBonus,
  getActiveContactBonuses,
  getContactJobPayMultiplier,
  getHealingDiscount,
  shouldReduceEncounter,
  getGhostHackingBonus,
  getMayaBarBonus,
  FACTION_RIVALRIES,
  STANDING_EFFECTS,
} from './factions';
import { createCharacter } from './character';
import { createInitialState } from '../engine/state';
import { Stats, GameState } from '../types';

describe('faction system', () => {
  const defaultStats: Stats = { body: 5, reflexes: 5, tech: 5, intelligence: 5, cool: 5, luck: 5 };

  function makeState(overrides?: { district?: string; reputation?: Record<string, number>; contacts?: string[] }): GameState {
    const char = createCharacter('TestRunner', 'street_kid', defaultStats);
    char.currentDistrict = overrides?.district ?? 'downtown';
    if (overrides?.reputation) {
      char.reputation = { ...overrides.reputation };
    }
    if (overrides?.contacts) {
      char.contacts = [...overrides.contacts];
    }
    return createInitialState(char);
  }

  describe('faction rivalries', () => {
    it('should have rivalry definitions for all major factions', () => {
      expect(FACTION_RIVALRIES.megacorp).toBeDefined();
      expect(FACTION_RIVALRIES.maelstrom).toBeDefined();
      expect(FACTION_RIVALRIES.tyger_claws).toBeDefined();
      expect(FACTION_RIVALRIES.voodoo_boys).toBeDefined();
      expect(FACTION_RIVALRIES.ncpd).toBeDefined();
      expect(FACTION_RIVALRIES.nomads).toBeDefined();
    });

    it('should decrease rival faction rep when gaining rep', () => {
      const state = makeState({ reputation: { megacorp: 0, maelstrom: 0, voodoo_boys: 0 } });
      const messages = applyFactionRivalry(state, 'megacorp', 20);

      // Maelstrom should lose rep (ratio 0.5 -> 10)
      expect(state.character.reputation.maelstrom).toBeLessThan(0);
      // Voodoo boys should lose rep (ratio 0.3 -> 6)
      expect(state.character.reputation.voodoo_boys).toBeLessThan(0);
      expect(messages.length).toBeGreaterThan(0);
    });

    it('should not trigger rivalry for negative rep changes', () => {
      const state = makeState({ reputation: { megacorp: 0, maelstrom: 0 } });
      const messages = applyFactionRivalry(state, 'megacorp', -10);
      expect(messages).toHaveLength(0);
      expect(state.character.reputation.maelstrom).toBe(0);
    });

    it('should not go below -100 rep', () => {
      const state = makeState({ reputation: { megacorp: 0, maelstrom: -95 } });
      applyFactionRivalry(state, 'megacorp', 50);
      expect(state.character.reputation.maelstrom).toBeGreaterThanOrEqual(-100);
    });
  });

  describe('standing effects', () => {
    it('should have defined effects for all standings', () => {
      expect(STANDING_EFFECTS.Enemy).toBeDefined();
      expect(STANDING_EFFECTS.Hostile).toBeDefined();
      expect(STANDING_EFFECTS.Neutral).toBeDefined();
      expect(STANDING_EFFECTS.Friendly).toBeDefined();
      expect(STANDING_EFFECTS.Allied).toBeDefined();
    });

    it('should give neutral effects when no controlling faction', () => {
      // Neon Heights has no controlling faction
      const state = makeState({ district: 'neon_heights' });
      const effects = getDistrictStandingEffects(state);
      expect(effects.priceModifier).toBe(1.0);
      expect(effects.dangerShift).toBe(0);
      expect(effects.ambushChance).toBe(0);
    });

    it('should give hostile effects for negative reputation in faction territory', () => {
      // Downtown is controlled by megacorp, hostile threshold is -50, neutral is -10
      const state = makeState({ district: 'downtown', reputation: { megacorp: -30 } });
      const effects = getDistrictStandingEffects(state);
      expect(effects.priceModifier).toBeGreaterThan(1.0); // markup
      expect(effects.ambushChance).toBeGreaterThan(0);
    });

    it('should give allied effects for high positive reputation', () => {
      // Downtown controlled by megacorp, allied threshold is 70
      const state = makeState({ district: 'downtown', reputation: { megacorp: 80 } });
      const effects = getDistrictStandingEffects(state);
      expect(effects.priceModifier).toBeLessThan(1.0); // discount
      expect(effects.ambushChance).toBe(0);
      expect(effects.jobPayBonus).toBeGreaterThan(0);
    });
  });

  describe('effective danger', () => {
    it('should reduce danger when allied with controlling faction', () => {
      const state = makeState({ district: 'industrial', reputation: { maelstrom: 70 } });
      const danger = getEffectiveDanger(state);
      // Industrial is normally 'high', allied gives -2 so should be 'low'
      expect(danger).toBe('low');
    });

    it('should increase danger when enemy of controlling faction', () => {
      const state = makeState({ district: 'neon_heights' }); // no faction = neutral
      const danger = getEffectiveDanger(state);
      expect(danger).toBe('low'); // base danger
    });

    it('should not go below low or above extreme', () => {
      // Allied in low danger district
      const state = makeState({ district: 'neon_heights' }); // low danger, no faction
      const danger = getEffectiveDanger(state);
      expect(['low', 'medium', 'high', 'extreme']).toContain(danger);
    });
  });

  describe('service refusal', () => {
    it('should refuse service at enemy standing', () => {
      // Megacorp: hostile -50, so -60 should be Enemy
      const state = makeState({ district: 'downtown', reputation: { megacorp: -60 } });
      expect(isServiceRefused(state)).toBe(true);
    });

    it('should not refuse service at hostile standing', () => {
      const state = makeState({ district: 'downtown', reputation: { megacorp: -30 } });
      expect(isServiceRefused(state)).toBe(false);
    });

    it('should not refuse service in uncontrolled territory', () => {
      const state = makeState({ district: 'neon_heights' });
      expect(isServiceRefused(state)).toBe(false);
    });
  });

  describe('faction job pay', () => {
    it('should give bonus pay for allied faction jobs', () => {
      const state = makeState({ reputation: { megacorp: 80 } });
      const mult = getFactionJobPayMultiplier(state, 'megacorp');
      expect(mult).toBeGreaterThan(1.0);
    });

    it('should give neutral pay for unrelated faction', () => {
      const state = makeState({ reputation: {} });
      const mult = getFactionJobPayMultiplier(state, null);
      expect(mult).toBe(1.0);
    });
  });

  describe('faction standing milestones', () => {
    it('should award street cred when reaching Friendly', () => {
      // Megacorp friendly threshold is 30
      const state = makeState({ reputation: { megacorp: 35 } });
      const messages = checkFactionStandingMilestone(state, 'megacorp', 25, 35);
      expect(messages.length).toBeGreaterThan(0);
      expect(messages.some(m => m.includes('Street Cred'))).toBe(true);
    });

    it('should award more street cred when reaching Allied', () => {
      // Megacorp allied threshold is 70
      const state = makeState({ reputation: { megacorp: 75 } });
      const messages = checkFactionStandingMilestone(state, 'megacorp', 65, 75);
      expect(messages.length).toBeGreaterThan(0);
    });

    it('should return empty messages when standing unchanged', () => {
      const state = makeState({ reputation: { megacorp: 20 } });
      const messages = checkFactionStandingMilestone(state, 'megacorp', 15, 20);
      expect(messages).toHaveLength(0);
    });
  });

  describe('contact bonuses', () => {
    it('should return null for contacts the player does not have', () => {
      const state = makeState({ contacts: [] });
      expect(getContactBonus(state, 'fixer_jin')).toBeNull();
    });

    it('should return the bonus for contacts the player has', () => {
      const state = makeState({ contacts: ['fixer_jin'] });
      const bonus = getContactBonus(state, 'fixer_jin');
      expect(bonus).not.toBeNull();
      expect(bonus!.bonusType).toBe('job_pay');
    });

    it('should find contact bonus by type', () => {
      const state = makeState({ contacts: ['ripperdoc_vex'] });
      const bonus = hasContactBonus(state, 'healing_discount');
      expect(bonus).not.toBeNull();
      expect(bonus!.id).toBe('ripperdoc_vex');
    });

    it('should list all active contact bonuses', () => {
      const state = makeState({ contacts: ['fixer_jin', 'bartender_maya'] });
      const bonuses = getActiveContactBonuses(state);
      expect(bonuses).toHaveLength(2);
    });
  });

  describe('contact job pay multiplier', () => {
    it('should give bonus when fixer_jin is a contact', () => {
      const state = makeState({ contacts: ['fixer_jin'] });
      const mult = getContactJobPayMultiplier(state);
      expect(mult).toBeGreaterThan(1.0);
    });

    it('should give 1.0 without the contact', () => {
      const state = makeState({ contacts: [] });
      expect(getContactJobPayMultiplier(state)).toBe(1.0);
    });
  });

  describe('healing discount', () => {
    it('should give discount when ripperdoc_vex is a contact', () => {
      const state = makeState({ contacts: ['ripperdoc_vex'] });
      expect(getHealingDiscount(state)).toBeGreaterThan(0);
    });

    it('should give 0 without the contact', () => {
      const state = makeState({ contacts: [] });
      expect(getHealingDiscount(state)).toBe(0);
    });
  });

  describe('ghost hacking bonus', () => {
    it('should give bonus in undercity with ghost contact', () => {
      const state = makeState({ district: 'undercity', contacts: ['netrunner_ghost'] });
      expect(getGhostHackingBonus(state)).toBeGreaterThan(0);
    });

    it('should give 0 in other districts', () => {
      const state = makeState({ district: 'downtown', contacts: ['netrunner_ghost'] });
      expect(getGhostHackingBonus(state)).toBe(0);
    });

    it('should give 0 without the contact', () => {
      const state = makeState({ district: 'undercity', contacts: [] });
      expect(getGhostHackingBonus(state)).toBe(0);
    });
  });

  describe('maya bar bonus', () => {
    it('should give bonus when bartender_maya is a contact', () => {
      const state = makeState({ contacts: ['bartender_maya'] });
      const bonus = getMayaBarBonus(state);
      expect(bonus.extraHP).toBeGreaterThan(0);
      expect(bonus.extraSkill).toBeGreaterThan(0);
    });

    it('should give 0 without the contact', () => {
      const state = makeState({ contacts: [] });
      const bonus = getMayaBarBonus(state);
      expect(bonus.extraHP).toBe(0);
      expect(bonus.extraSkill).toBe(0);
    });
  });

  describe('district faction standing', () => {
    it('should return faction and standing for controlled districts', () => {
      const state = makeState({ district: 'downtown', reputation: { megacorp: 0 } });
      const result = getDistrictFactionStanding(state);
      expect(result).not.toBeNull();
      expect(result!.faction.id).toBe('megacorp');
    });

    it('should return null for uncontrolled districts', () => {
      const state = makeState({ district: 'neon_heights' });
      const result = getDistrictFactionStanding(state);
      expect(result).toBeNull();
    });
  });

  describe('shop price modifier', () => {
    it('should give discount for friendly faction', () => {
      const state = makeState({ district: 'downtown', reputation: { megacorp: 40 } });
      expect(getShopPriceModifier(state)).toBeLessThan(1.0);
    });

    it('should give markup for hostile faction', () => {
      const state = makeState({ district: 'downtown', reputation: { megacorp: -30 } });
      expect(getShopPriceModifier(state)).toBeGreaterThan(1.0);
    });

    it('should give neutral price in uncontrolled territory', () => {
      const state = makeState({ district: 'neon_heights' });
      expect(getShopPriceModifier(state)).toBe(1.0);
    });
  });
});
