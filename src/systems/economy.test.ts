import { canTakeJob, buyItem, sellItem, getDailyExpenses } from './economy';
import { createCharacter, addItem } from './character';
import { createInitialState } from '../engine/state';
import { Stats, Job, Item } from '../types';

describe('economy system', () => {
  const defaultStats: Stats = { body: 5, reflexes: 5, tech: 5, intelligence: 5, cool: 5, luck: 5 };

  describe('canTakeJob', () => {
    const easyJob: Job = {
      id: 'easy_job', name: 'Easy Job', description: 'A simple task',
      employer: 'Test', district: 'downtown', type: 'delivery', difficulty: 1,
      payCredits: 100, payExperience: 10,
      reputationReward: null,
      requirements: [],
      risks: [],
      duration: 1,
    };

    const hardJob: Job = {
      id: 'hard_job', name: 'Hard Job', description: 'A tough task',
      employer: 'Test', district: 'downtown', type: 'hacking', difficulty: 8,
      payCredits: 2000, payExperience: 100,
      reputationReward: null,
      requirements: [
        { type: 'skill', target: 'hacking', operator: '>=', value: 50 },
        { type: 'level', target: '', operator: '>=', value: 5 },
      ],
      risks: [],
      duration: 1,
    };

    it('should allow jobs with no requirements', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const state = createInitialState(char);
      const result = canTakeJob(state, easyJob);
      expect(result.eligible).toBe(true);
    });

    it('should reject jobs when skill requirement not met', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const state = createInitialState(char);
      const result = canTakeJob(state, hardJob);
      expect(result.eligible).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });

  describe('buyItem', () => {
    const testItem: Item = { id: 'test', name: 'Test Item', description: '', type: 'junk', rarity: 'common', value: 100 };

    it('should purchase item when affordable', () => {
      const char = createCharacter('V', 'corpo', defaultStats); // 2000 credits
      const result = buyItem(char, testItem);
      expect(result.success).toBe(true);
      expect(char.credits).toBe(1900);
      expect(char.inventory).toHaveLength(1);
    });

    it('should fail when not affordable', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      char.credits = 50;
      const result = buyItem(char, testItem);
      expect(result.success).toBe(false);
      expect(char.credits).toBe(50);
    });
  });

  describe('sellItem', () => {
    const testItem: Item = { id: 'test', name: 'Test Item', description: '', type: 'junk', rarity: 'common', value: 100 };

    it('should sell item for half value', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      addItem(char, testItem);
      const startCredits = char.credits;
      const result = sellItem(char, 'test');
      expect(result.success).toBe(true);
      expect(char.credits).toBe(startCredits + 50); // 50% of 100
    });

    it('should fail when item not in inventory', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const result = sellItem(char, 'nonexistent');
      expect(result.success).toBe(false);
    });
  });

  describe('getDailyExpenses', () => {
    it('should return base expenses with no apartment or augmentations', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const expenses = getDailyExpenses(char);
      expect(expenses).toBe(10); // Base living cost
    });

    it('should include apartment rent', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      char.apartment = 'downtown';
      const expenses = getDailyExpenses(char);
      expect(expenses).toBe(60); // 10 base + 50 rent
    });

    it('should include augmentation maintenance', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      char.augmentations.push({
        id: 'aug1', name: 'Aug', description: '', slot: 'neural',
        statBonuses: {}, skillBonuses: {}, cost: 0, humanityCost: 0, rarity: 'common',
      });
      char.augmentations.push({
        id: 'aug2', name: 'Aug2', description: '', slot: 'optics',
        statBonuses: {}, skillBonuses: {}, cost: 0, humanityCost: 0, rarity: 'common',
      });
      const expenses = getDailyExpenses(char);
      expect(expenses).toBe(20); // 10 base + 5*2 augmentations
    });
  });
});
