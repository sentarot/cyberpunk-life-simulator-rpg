import { createCharacter, installAugmentation, equipItem, addItem, removeItem, hasItem, getStatTotal, STAT_POINT_BUDGET, MIN_STAT } from './character';
import { Augmentation, Item, Stats } from '../types';

describe('character system', () => {
  const defaultStats: Stats = { body: 5, reflexes: 5, tech: 5, intelligence: 5, cool: 5, luck: 5 };

  describe('createCharacter', () => {
    it('should create a character with correct name and origin', () => {
      const char = createCharacter('TestV', 'street_kid', defaultStats);
      expect(char.name).toBe('TestV');
      expect(char.origin).toBe('street_kid');
    });

    it('should apply origin stat bonuses', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      // Street kid gets +2 cool, +1 reflexes
      expect(char.stats.cool).toBe(7); // 5 + 2
      expect(char.stats.reflexes).toBe(6); // 5 + 1
    });

    it('should apply origin skill bonuses', () => {
      const char = createCharacter('V', 'netrunner', defaultStats);
      // Netrunner gets hacking: 20
      expect(char.skills.hacking).toBe(20);
    });

    it('should apply origin starting credits', () => {
      const corpoChar = createCharacter('V', 'corpo', defaultStats);
      const streetChar = createCharacter('V', 'street_kid', defaultStats);
      expect(corpoChar.credits).toBe(2000);
      expect(streetChar.credits).toBe(500);
    });

    it('should start at level 1 with 100 humanity', () => {
      const char = createCharacter('V', 'nomad', defaultStats);
      expect(char.level).toBe(1);
      expect(char.humanity).toBe(100);
    });

    it('should calculate max health based on body stat', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      // maxHealth = 50 + body * 5. Body = 5 (base) + 0 (street kid body bonus) = 5
      expect(char.maxHealth).toBe(50 + char.stats.body * 5);
      expect(char.health).toBe(char.maxHealth);
    });

    it('should start with empty inventory and no augmentations', () => {
      const char = createCharacter('V', 'corpo', defaultStats);
      expect(char.inventory).toHaveLength(0);
      expect(char.augmentations).toHaveLength(0);
    });
  });

  describe('installAugmentation', () => {
    const testAug: Augmentation = {
      id: 'test_aug', name: 'Test Aug', description: 'A test augmentation',
      slot: 'neural', statBonuses: { intelligence: 1 }, skillBonuses: {},
      cost: 1000, humanityCost: 10, rarity: 'uncommon',
    };

    it('should install augmentation when affordable', () => {
      const char = createCharacter('V', 'corpo', defaultStats); // 2000 credits
      const result = installAugmentation(char, testAug);
      expect(result.success).toBe(true);
      expect(char.augmentations).toHaveLength(1);
      expect(char.credits).toBe(1000); // 2000 - 1000
      expect(char.humanity).toBe(90); // 100 - 10
    });

    it('should fail when not enough credits', () => {
      const char = createCharacter('V', 'street_kid', defaultStats); // 500 credits
      const result = installAugmentation(char, testAug); // costs 1000
      expect(result.success).toBe(false);
      expect(char.augmentations).toHaveLength(0);
    });

    it('should fail when slot is full', () => {
      const char = createCharacter('V', 'corpo', defaultStats);
      char.credits = 10000;
      installAugmentation(char, testAug);
      const result = installAugmentation(char, { ...testAug, id: 'test_aug_2' });
      expect(result.success).toBe(false);
      expect(char.augmentations).toHaveLength(1);
    });
  });

  describe('equipItem', () => {
    it('should equip a weapon', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const weapon: Item = { id: 'test_gun', name: 'Test Gun', description: '', type: 'weapon', rarity: 'common', value: 100 };
      const result = equipItem(char, weapon);
      expect(result.success).toBe(true);
      expect(char.equipped.weapon?.id).toBe('test_gun');
    });

    it('should equip armor', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const armor: Item = { id: 'test_armor', name: 'Test Armor', description: '', type: 'armor', rarity: 'common', value: 200 };
      const result = equipItem(char, armor);
      expect(result.success).toBe(true);
      expect(char.equipped.armor?.id).toBe('test_armor');
    });

    it('should fail to equip non-equippable items', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const junk: Item = { id: 'junk', name: 'Junk', description: '', type: 'junk', rarity: 'common', value: 5 };
      const result = equipItem(char, junk);
      expect(result.success).toBe(false);
    });
  });

  describe('inventory management', () => {
    it('should add items to inventory', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const item: Item = { id: 'stim', name: 'Stim', description: '', type: 'consumable', rarity: 'common', value: 50 };
      addItem(char, item, 3);
      expect(char.inventory).toHaveLength(1);
      expect(char.inventory[0].quantity).toBe(3);
    });

    it('should stack duplicate items', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const item: Item = { id: 'stim', name: 'Stim', description: '', type: 'consumable', rarity: 'common', value: 50 };
      addItem(char, item, 2);
      addItem(char, item, 3);
      expect(char.inventory).toHaveLength(1);
      expect(char.inventory[0].quantity).toBe(5);
    });

    it('should remove items from inventory', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const item: Item = { id: 'stim', name: 'Stim', description: '', type: 'consumable', rarity: 'common', value: 50 };
      addItem(char, item, 3);
      removeItem(char, 'stim', 2);
      expect(char.inventory[0].quantity).toBe(1);
    });

    it('should completely remove items when quantity reaches 0', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const item: Item = { id: 'stim', name: 'Stim', description: '', type: 'consumable', rarity: 'common', value: 50 };
      addItem(char, item, 1);
      removeItem(char, 'stim', 1);
      expect(char.inventory).toHaveLength(0);
    });

    it('should correctly check if character has item', () => {
      const char = createCharacter('V', 'street_kid', defaultStats);
      const item: Item = { id: 'stim', name: 'Stim', description: '', type: 'consumable', rarity: 'common', value: 50 };
      expect(hasItem(char, 'stim')).toBe(false);
      addItem(char, item);
      expect(hasItem(char, 'stim')).toBe(true);
    });
  });
});
