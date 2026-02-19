import {
  createInitialProgression,
  getTierForCred,
  getActForTier,
  getTierName,
  getTierDescription,
  getActName,
  getNextTierCred,
  getCredForTier,
  awardStreetCred,
  getJobStreetCred,
  getCombatStreetCred,
  getSurvivalStreetCred,
  getScaledDanger,
} from './progression';
import { createCharacter } from './character';
import { createInitialState } from '../engine/state';
import { Stats } from '../types';

describe('progression system', () => {
  const defaultStats: Stats = { body: 5, reflexes: 5, tech: 5, intelligence: 5, cool: 5, luck: 5 };

  describe('createInitialProgression', () => {
    it('should start as nobody with 0 street cred', () => {
      const prog = createInitialProgression();
      expect(prog.streetCred).toBe(0);
      expect(prog.tier).toBe('nobody');
      expect(prog.act).toBe(1);
      expect(prog.completedMilestones).toHaveLength(0);
      expect(prog.jobsCompleted).toBe(0);
      expect(prog.enemiesDefeated).toBe(0);
    });
  });

  describe('getTierForCred', () => {
    it('should return nobody for 0 cred', () => {
      expect(getTierForCred(0)).toBe('nobody');
    });

    it('should return prospect at 25 cred', () => {
      expect(getTierForCred(25)).toBe('prospect');
    });

    it('should return operator at 50 cred', () => {
      expect(getTierForCred(50)).toBe('operator');
    });

    it('should return player at 100 cred', () => {
      expect(getTierForCred(100)).toBe('player');
    });

    it('should return veteran at 150 cred', () => {
      expect(getTierForCred(150)).toBe('veteran');
    });

    it('should return elite at 200 cred', () => {
      expect(getTierForCred(200)).toBe('elite');
    });

    it('should return legend at 300 cred', () => {
      expect(getTierForCred(300)).toBe('legend');
    });

    it('should return legend for very high cred', () => {
      expect(getTierForCred(999)).toBe('legend');
    });

    it('should stay at current tier between thresholds', () => {
      expect(getTierForCred(24)).toBe('nobody');
      expect(getTierForCred(49)).toBe('prospect');
      expect(getTierForCred(99)).toBe('operator');
    });
  });

  describe('getActForTier', () => {
    it('should return act 1 for nobody and prospect', () => {
      expect(getActForTier('nobody')).toBe(1);
      expect(getActForTier('prospect')).toBe(1);
    });

    it('should return act 2 for operator through veteran', () => {
      expect(getActForTier('operator')).toBe(2);
      expect(getActForTier('player')).toBe(2);
      expect(getActForTier('veteran')).toBe(2);
    });

    it('should return act 3 for elite and legend', () => {
      expect(getActForTier('elite')).toBe(3);
      expect(getActForTier('legend')).toBe(3);
    });
  });

  describe('getTierName and getTierDescription', () => {
    it('should return human-readable tier names', () => {
      expect(getTierName('nobody')).toBe('Nobody');
      expect(getTierName('legend')).toBe('Legend');
    });

    it('should return tier descriptions', () => {
      expect(getTierDescription('nobody')).toContain('face in the crowd');
      expect(getTierDescription('legend')).toContain('mark on this city');
    });
  });

  describe('getActName', () => {
    it('should return act names', () => {
      expect(getActName(1)).toBe('SURVIVAL');
      expect(getActName(2)).toBe('RISE');
      expect(getActName(3)).toBe('LEGACY');
    });
  });

  describe('getNextTierCred', () => {
    it('should return next threshold', () => {
      expect(getNextTierCred('nobody')).toBe(25);
      expect(getNextTierCred('prospect')).toBe(50);
      expect(getNextTierCred('elite')).toBe(300);
    });

    it('should return null for legend', () => {
      expect(getNextTierCred('legend')).toBeNull();
    });
  });

  describe('awardStreetCred', () => {
    it('should increase street cred', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const state = createInitialState(char);
      const result = awardStreetCred(state, 10, 'test');

      expect(state.progression.streetCred).toBe(10);
      expect(result.messages.length).toBeGreaterThan(0);
      expect(result.tierChanged).toBe(false);
    });

    it('should trigger tier change at threshold', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const state = createInitialState(char);
      state.progression.streetCred = 24;

      const result = awardStreetCred(state, 1, 'test');
      expect(state.progression.tier).toBe('prospect');
      expect(result.tierChanged).toBe(true);
      expect(result.newTier).toBe('prospect');
    });

    it('should trigger act change when crossing act boundary', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const state = createInitialState(char);
      state.progression.streetCred = 49;
      state.progression.tier = 'prospect';

      const result = awardStreetCred(state, 1, 'test');
      expect(state.progression.tier).toBe('operator');
      expect(state.progression.act).toBe(2);
      expect(result.actChanged).toBe(true);
      expect(result.newAct).toBe(2);
    });

    it('should record tier reached day', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const state = createInitialState(char);
      state.currentDay = 5;
      state.progression.streetCred = 24;

      awardStreetCred(state, 1, 'test');
      expect(state.progression.tierReachedDay.prospect).toBe(5);
    });
  });

  describe('getJobStreetCred', () => {
    it('should give more cred for harder jobs on success', () => {
      expect(getJobStreetCred(1, true)).toBe(3);
      expect(getJobStreetCred(5, true)).toBe(11);
      expect(getJobStreetCred(9, true)).toBe(19);
    });

    it('should give 1 cred on failure', () => {
      expect(getJobStreetCred(1, false)).toBe(1);
      expect(getJobStreetCred(9, false)).toBe(1);
    });
  });

  describe('getCombatStreetCred', () => {
    it('should give cred based on enemy level', () => {
      expect(getCombatStreetCred(1)).toBe(2);
      expect(getCombatStreetCred(5)).toBe(6);
      expect(getCombatStreetCred(10)).toBe(11);
    });
  });

  describe('getSurvivalStreetCred', () => {
    it('should give cred every 7 days', () => {
      expect(getSurvivalStreetCred(7)).toBe(1);
      expect(getSurvivalStreetCred(14)).toBe(1);
      expect(getSurvivalStreetCred(21)).toBe(1);
    });

    it('should give 0 on non-milestone days', () => {
      expect(getSurvivalStreetCred(1)).toBe(0);
      expect(getSurvivalStreetCred(6)).toBe(0);
      expect(getSurvivalStreetCred(13)).toBe(0);
    });

    it('should give 0 on day 0', () => {
      expect(getSurvivalStreetCred(0)).toBe(0);
    });
  });

  describe('getScaledDanger', () => {
    it('should not scale for nobody/prospect', () => {
      expect(getScaledDanger('low', 'nobody')).toBe('low');
      expect(getScaledDanger('medium', 'prospect')).toBe('medium');
    });

    it('should upgrade low to medium for operator+', () => {
      expect(getScaledDanger('low', 'operator')).toBe('medium');
      expect(getScaledDanger('low', 'player')).toBe('medium');
    });

    it('should upgrade medium to high for player+', () => {
      expect(getScaledDanger('medium', 'player')).toBe('high');
      expect(getScaledDanger('medium', 'veteran')).toBe('high');
    });

    it('should upgrade high to extreme for veteran+', () => {
      expect(getScaledDanger('high', 'veteran')).toBe('extreme');
      expect(getScaledDanger('high', 'elite')).toBe('extreme');
    });

    it('should not upgrade extreme further', () => {
      expect(getScaledDanger('extreme', 'legend')).toBe('extreme');
    });
  });
});
