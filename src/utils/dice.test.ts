import { roll, d20, check, weightedRandom, chance, pick, shuffle, clamp } from './dice';

describe('dice utilities', () => {
  describe('roll', () => {
    it('should return a number within the range', () => {
      for (let i = 0; i < 100; i++) {
        const result = roll(1, 6);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(6);
      }
    });

    it('should return exact value when min equals max', () => {
      expect(roll(5, 5)).toBe(5);
    });
  });

  describe('d20', () => {
    it('should return a number between 1 and 20', () => {
      for (let i = 0; i < 100; i++) {
        const result = d20();
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(20);
      }
    });
  });

  describe('check', () => {
    it('should return success when total meets difficulty', () => {
      // Mock a high roll by testing many times
      let successFound = false;
      for (let i = 0; i < 100; i++) {
        const result = check(10, 5); // Very easy check
        if (result.success) {
          successFound = true;
          break;
        }
      }
      expect(successFound).toBe(true);
    });

    it('should return roll, total, and success properties', () => {
      const result = check(5, 10);
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('roll');
      expect(result).toHaveProperty('total');
      expect(result.total).toBe(result.roll + 5);
    });
  });

  describe('weightedRandom', () => {
    it('should return an item from the array', () => {
      const items = ['a', 'b', 'c'];
      const weights = [1, 1, 1];
      const result = weightedRandom(items, weights);
      expect(items).toContain(result);
    });

    it('should heavily favor high-weight items', () => {
      const items = ['rare', 'common'];
      const weights = [1, 1000];
      const counts: Record<string, number> = { rare: 0, common: 0 };
      for (let i = 0; i < 1000; i++) {
        counts[weightedRandom(items, weights)]++;
      }
      expect(counts.common).toBeGreaterThan(counts.rare);
    });
  });

  describe('chance', () => {
    it('should always return true with probability 1', () => {
      for (let i = 0; i < 100; i++) {
        expect(chance(1)).toBe(true);
      }
    });

    it('should always return false with probability 0', () => {
      for (let i = 0; i < 100; i++) {
        expect(chance(0)).toBe(false);
      }
    });
  });

  describe('pick', () => {
    it('should return an element from the array', () => {
      const arr = [1, 2, 3, 4, 5];
      for (let i = 0; i < 50; i++) {
        expect(arr).toContain(pick(arr));
      }
    });
  });

  describe('shuffle', () => {
    it('should return an array of the same length', () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffle(arr);
      expect(shuffled).toHaveLength(5);
    });

    it('should contain all original elements', () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffle(arr);
      expect(shuffled.sort()).toEqual(arr.sort());
    });

    it('should not modify the original array', () => {
      const arr = [1, 2, 3, 4, 5];
      const original = [...arr];
      shuffle(arr);
      expect(arr).toEqual(original);
    });
  });

  describe('clamp', () => {
    it('should return the value when within range', () => {
      expect(clamp(5, 1, 10)).toBe(5);
    });

    it('should return min when value is below', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('should return max when value is above', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });
});
