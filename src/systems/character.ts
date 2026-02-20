import { Character, CharacterOrigin, Stats, Skills, Augmentation, AugmentationSlot, Item } from '../types';
import { clamp } from '../utils/dice';

const ORIGIN_BONUSES: Record<CharacterOrigin, { stats: Partial<Stats>; skills: Partial<Skills>; credits: number; description: string }> = {
  street_kid: {
    stats: { cool: 2, reflexes: 1 },
    skills: { streetwise: 15, combat: 10, persuasion: 5 },
    credits: 500,
    description: 'Grew up in the gutters of Night City. You know the streets, the gangs, and how to survive.',
  },
  corpo: {
    stats: { intelligence: 2, cool: 1 },
    skills: { persuasion: 15, hacking: 10, streetwise: 5 },
    credits: 2000,
    description: 'Former corporate drone who got burned. You have connections, knowledge, and expensive taste.',
  },
  nomad: {
    stats: { body: 2, tech: 1 },
    skills: { driving: 15, engineering: 10, combat: 5 },
    credits: 800,
    description: 'Wanderer from the badlands. You know machines, open roads, and the value of family.',
  },
  netrunner: {
    stats: { intelligence: 2, tech: 1 },
    skills: { hacking: 20, engineering: 5, stealth: 5 },
    credits: 1000,
    description: 'Born in the Net. You see the world as code, and code is your weapon.',
  },
};

export function getOriginInfo(origin: CharacterOrigin) {
  return ORIGIN_BONUSES[origin];
}

export function createCharacter(name: string, origin: CharacterOrigin, statPoints: Stats): Character {
  const originBonus = ORIGIN_BONUSES[origin];

  const stats: Stats = {
    body: statPoints.body + (originBonus.stats.body ?? 0),
    reflexes: statPoints.reflexes + (originBonus.stats.reflexes ?? 0),
    tech: statPoints.tech + (originBonus.stats.tech ?? 0),
    intelligence: statPoints.intelligence + (originBonus.stats.intelligence ?? 0),
    cool: statPoints.cool + (originBonus.stats.cool ?? 0),
    luck: statPoints.luck + (originBonus.stats.luck ?? 0),
  };

  const skills: Skills = {
    combat: originBonus.skills.combat ?? 0,
    hacking: originBonus.skills.hacking ?? 0,
    stealth: originBonus.skills.stealth ?? 0,
    persuasion: originBonus.skills.persuasion ?? 0,
    engineering: originBonus.skills.engineering ?? 0,
    streetwise: originBonus.skills.streetwise ?? 0,
    medicine: originBonus.skills.medicine ?? 0,
    driving: originBonus.skills.driving ?? 0,
  };

  const maxHealth = 50 + stats.body * 5;

  return {
    name,
    origin,
    stats,
    skills,
    augmentations: [],
    perks: [],
    level: 1,
    experience: 0,
    health: maxHealth,
    maxHealth,
    humanity: 100,
    credits: originBonus.credits,
    reputation: {},
    inventory: [],
    equipped: { weapon: null, armor: null, cyberdeckProgram: null },
    currentDistrict: 'downtown',
    apartment: null,
    contacts: [],
    activeQuests: [],
    completedQuests: [],
    traits: [origin],
    daysSurvived: 0,
  };
}

export function installAugmentation(character: Character, aug: Augmentation): { success: boolean; message: string } {
  if (character.credits < aug.cost) {
    return { success: false, message: 'Not enough credits for this augmentation.' };
  }

  const existingInSlot = character.augmentations.filter(a => a.slot === aug.slot);
  const maxPerSlot = getMaxAugPerSlot(aug.slot);
  if (existingInSlot.length >= maxPerSlot) {
    return { success: false, message: `No free ${aug.slot} augmentation slots available.` };
  }

  character.credits -= aug.cost;
  character.humanity = clamp(character.humanity - aug.humanityCost, 0, 100);
  character.augmentations.push(aug);

  return {
    success: true,
    message: `${aug.name} installed. Humanity: ${character.humanity}%`,
  };
}

function getMaxAugPerSlot(slot: AugmentationSlot): number {
  switch (slot) {
    case 'neural': return 1;
    case 'optics': return 1;
    case 'arms': return 2;
    case 'legs': return 2;
    case 'skeleton': return 1;
    case 'skin': return 1;
    case 'internal': return 3;
  }
}

export function equipItem(character: Character, item: Item): { success: boolean; message: string } {
  switch (item.type) {
    case 'weapon':
      character.equipped.weapon = item;
      return { success: true, message: `Equipped ${item.name}.` };
    case 'armor':
      character.equipped.armor = item;
      return { success: true, message: `Equipped ${item.name}.` };
    case 'cyberdeck_program':
      character.equipped.cyberdeckProgram = item;
      return { success: true, message: `Loaded ${item.name}.` };
    default:
      return { success: false, message: 'This item cannot be equipped.' };
  }
}

export function addItem(character: Character, item: Item, quantity: number = 1): void {
  const existing = character.inventory.find(i => i.item.id === item.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    character.inventory.push({ item, quantity });
  }
}

export function removeItem(character: Character, itemId: string, quantity: number = 1): boolean {
  const index = character.inventory.findIndex(i => i.item.id === itemId);
  if (index === -1) return false;

  character.inventory[index].quantity -= quantity;
  if (character.inventory[index].quantity <= 0) {
    character.inventory.splice(index, 1);
  }
  return true;
}

export function hasItem(character: Character, itemId: string): boolean {
  return character.inventory.some(i => i.item.id === itemId);
}

export function getStatTotal(character: Character): number {
  const s = character.stats;
  return s.body + s.reflexes + s.tech + s.intelligence + s.cool + s.luck;
}

export const STAT_POINT_BUDGET = 30;
export const MIN_STAT = 2;
export const MAX_STAT = 10;
