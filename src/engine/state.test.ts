import { createInitialState, advanceTime, applyOutcome, getXPForLevel, getEffectiveStat, getEffectiveSkill } from './state';
import { createCharacter } from '../systems/character';
import { Stats, EventOutcome, Augmentation } from '../types';

describe('game state', () => {
  const defaultStats: Stats = { body: 5, reflexes: 5, tech: 5, intelligence: 5, cool: 5, luck: 5 };

  describe('createInitialState', () => {
    it('should create initial state with day 1 morning', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const state = createInitialState(char);
      expect(state.currentDay).toBe(1);
      expect(state.currentTime).toBe('morning');
      expect(state.gameLog).toHaveLength(0);
    });
  });

  describe('advanceTime', () => {
    it('should cycle through time periods', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      let state = createInitialState(char);

      expect(state.currentTime).toBe('morning');
      state = advanceTime(state);
      expect(state.currentTime).toBe('afternoon');
      state = advanceTime(state);
      expect(state.currentTime).toBe('evening');
      state = advanceTime(state);
      expect(state.currentTime).toBe('night');
    });

    it('should advance day after night', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      let state = createInitialState(char);
      state.currentTime = 'night';

      state = advanceTime(state);
      expect(state.currentTime).toBe('morning');
      expect(state.currentDay).toBe(2);
    });

    it('should increment days survived when day changes', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      let state = createInitialState(char);
      state.currentTime = 'night';

      state = advanceTime(state);
      expect(state.character.daysSurvived).toBe(1);
    });
  });

  describe('applyOutcome', () => {
    it('should add credits', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const state = createInitialState(char);
      const outcome: EventOutcome = { type: 'credits', value: 100, message: 'Got 100 credits' };
      applyOutcome(state, outcome);
      expect(state.character.credits).toBe(600); // 500 + 100
    });

    it('should not go below 0 credits', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const state = createInitialState(char);
      const outcome: EventOutcome = { type: 'credits', value: -10000, message: 'Lost credits' };
      applyOutcome(state, outcome);
      expect(state.character.credits).toBe(0);
    });

    it('should modify health within bounds', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const state = createInitialState(char);
      const maxHp = state.character.maxHealth;
      state.character.health = 50;

      const healOutcome: EventOutcome = { type: 'health', value: 10, message: 'Healed' };
      applyOutcome(state, healOutcome);
      expect(state.character.health).toBe(60);

      // Should not exceed max health
      const bigHeal: EventOutcome = { type: 'health', value: 9999, message: 'Big heal' };
      applyOutcome(state, bigHeal);
      expect(state.character.health).toBe(maxHp);
    });

    it('should modify reputation', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const state = createInitialState(char);
      const outcome: EventOutcome = { type: 'reputation', target: 'megacorp', value: 20, message: 'Rep up' };
      applyOutcome(state, outcome);
      expect(state.character.reputation['megacorp']).toBe(20);
    });

    it('should modify humanity', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const state = createInitialState(char);
      const outcome: EventOutcome = { type: 'humanity', value: -15, message: 'Lost humanity' };
      applyOutcome(state, outcome);
      expect(state.character.humanity).toBe(85);
    });

    it('should add contacts', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const state = createInitialState(char);
      const outcome: EventOutcome = { type: 'contact', target: 'npc_1', message: 'New contact' };
      applyOutcome(state, outcome);
      expect(state.character.contacts).toContain('npc_1');
    });

    it('should not add duplicate contacts', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const state = createInitialState(char);
      const outcome: EventOutcome = { type: 'contact', target: 'npc_1', message: 'New contact' };
      applyOutcome(state, outcome);
      applyOutcome(state, outcome);
      expect(state.character.contacts.filter(c => c === 'npc_1')).toHaveLength(1);
    });
  });

  describe('getXPForLevel', () => {
    it('should return increasing XP requirements', () => {
      const xp2 = getXPForLevel(2);
      const xp3 = getXPForLevel(3);
      const xp10 = getXPForLevel(10);
      expect(xp3).toBeGreaterThan(xp2);
      expect(xp10).toBeGreaterThan(xp3);
    });
  });

  describe('getEffectiveStat', () => {
    it('should return base stat when no augmentations', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      expect(getEffectiveStat(char, 'body')).toBe(char.stats.body);
    });

    it('should include augmentation bonuses', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const aug: Augmentation = {
        id: 'test', name: 'Test', description: '', slot: 'arms',
        statBonuses: { body: 3 }, skillBonuses: {},
        cost: 0, humanityCost: 0, rarity: 'common',
      };
      char.augmentations.push(aug);
      expect(getEffectiveStat(char, 'body')).toBe(char.stats.body + 3);
    });
  });

  describe('getEffectiveSkill', () => {
    it('should return base skill when no augmentations', () => {
      const char = createCharacter('V', 'netrunner', defaultStats);
      expect(getEffectiveSkill(char, 'hacking')).toBe(20); // Netrunner starts with 20
    });
  });
});
