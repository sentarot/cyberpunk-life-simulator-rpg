import { initCombat, getCombatRewards, getPlayerCombatStats } from './combat';
import { createCharacter } from './character';
import { Stats, Enemy } from '../types';

describe('combat system', () => {
  const defaultStats: Stats = { body: 5, reflexes: 5, tech: 5, intelligence: 5, cool: 5, luck: 5 };

  const testEnemy: Enemy = {
    id: 'test_enemy', name: 'Test Enemy', level: 2, health: 40, damage: 8, armor: 1,
    skills: { combat: 15 },
    loot: [{ itemId: 'scrap_metal', chance: 1.0 }], // 100% chance for testing
    creditDrop: { min: 50, max: 50 }, // Fixed for testing
    experienceDrop: 25,
  };

  describe('initCombat', () => {
    it('should initialize combat state correctly', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const combat = initCombat(char, testEnemy);

      expect(combat.playerHealth).toBe(char.health);
      expect(combat.enemyHealth).toBe(testEnemy.health);
      expect(combat.enemyMaxHealth).toBe(testEnemy.health);
      expect(combat.enemyName).toBe('Test Enemy');
      expect(combat.round).toBe(1);
      expect(combat.resolved).toBe(false);
      expect(combat.fled).toBe(false);
    });
  });

  describe('getCombatRewards', () => {
    it('should return credits within range', () => {
      const rewards = getCombatRewards(testEnemy);
      expect(rewards.credits).toBe(50); // Fixed range
      expect(rewards.experience).toBe(25);
    });

    it('should include loot with 100% chance', () => {
      const rewards = getCombatRewards(testEnemy);
      expect(rewards.loot).toContain('scrap_metal');
    });
  });

  describe('getPlayerCombatStats', () => {
    it('should calculate combat stats', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const stats = getPlayerCombatStats(char);

      expect(stats).toHaveProperty('attack');
      expect(stats).toHaveProperty('defense');
      expect(stats).toHaveProperty('hackPower');
      expect(stats).toHaveProperty('damage');
      expect(typeof stats.attack).toBe('number');
      expect(typeof stats.defense).toBe('number');
    });
  });
});
