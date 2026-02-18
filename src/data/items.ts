import { Item, Augmentation } from '../types';

export const ITEMS: Record<string, Item> = {
  // --- Weapons ---
  rusty_pistol: { id: 'rusty_pistol', name: 'Rusty Pistol', description: 'A beat-up handgun. Better than nothing.', type: 'weapon', rarity: 'common', value: 100, effects: [{ modifier: 3, type: 'flat' }] },
  tech_pistol: { id: 'tech_pistol', name: 'Kenzaki Type-7', description: 'Corporate-issue smart pistol with targeting assist.', type: 'weapon', rarity: 'uncommon', value: 500, effects: [{ modifier: 6, type: 'flat' }] },
  katana: { id: 'katana', name: 'Thermal Katana', description: 'A blade with a superheated edge. Cuts through armor like butter.', type: 'weapon', rarity: 'rare', value: 1500, effects: [{ modifier: 10, type: 'flat' }] },
  smart_rifle: { id: 'smart_rifle', name: 'Mantis Smart Rifle', description: 'Self-aiming rifle with neural link. Never misses. Almost.', type: 'weapon', rarity: 'rare', value: 2500, effects: [{ modifier: 12, type: 'flat' }] },
  monowire: { id: 'monowire', name: 'Monowire Whip', description: 'A molecule-thin wire that can slice through anything. Extremely dangerous to wield.', type: 'weapon', rarity: 'legendary', value: 5000, effects: [{ modifier: 18, type: 'flat' }] },

  // --- Armor ---
  leather_jacket: { id: 'leather_jacket', name: 'Armored Jacket', description: 'Stylish leather jacket with kevlar lining.', type: 'armor', rarity: 'common', value: 200, effects: [{ stat: 'body', modifier: 2, type: 'flat' }] },
  corporate_suit: { id: 'corporate_suit', name: 'Executive Armor Suit', description: 'Looks like a suit. Stops bullets like a vest.', type: 'armor', rarity: 'uncommon', value: 800, effects: [{ stat: 'body', modifier: 4, type: 'flat' }] },
  military_vest: { id: 'military_vest', name: 'Military-Grade Vest', description: 'Standard issue for corporate security. Heavy but effective.', type: 'armor', rarity: 'rare', value: 2000, effects: [{ stat: 'body', modifier: 7, type: 'flat' }] },
  subdermal_mesh: { id: 'subdermal_mesh', name: 'Subdermal Armor Mesh', description: 'Implanted armor weave beneath the skin.', type: 'armor', rarity: 'legendary', value: 8000, effects: [{ stat: 'body', modifier: 12, type: 'flat' }] },

  // --- Consumables ---
  stim_pack: { id: 'stim_pack', name: 'Stim Pack', description: 'Military-grade healing stimulant. Restores health.', type: 'consumable', rarity: 'common', value: 50 },
  neural_booster: { id: 'neural_booster', name: 'Neural Booster', description: 'Temporary boost to hacking ability.', type: 'consumable', rarity: 'uncommon', value: 150 },
  synth_blood: { id: 'synth_blood', name: 'Synth Blood', description: 'Synthetic blood replacement. Full heal.', type: 'consumable', rarity: 'rare', value: 500 },
  black_ice_chip: { id: 'black_ice_chip', name: 'Black ICE Chip', description: 'Loaded with lethal intrusion countermeasure electronics.', type: 'cyberdeck_program', rarity: 'rare', value: 1200 },

  // --- Cyberdeck Programs ---
  ping_daemon: { id: 'ping_daemon', name: 'Ping Daemon', description: 'Basic network scanning program.', type: 'cyberdeck_program', rarity: 'common', value: 100 },
  short_circuit: { id: 'short_circuit', name: 'Short Circuit', description: 'Overloads enemy cyberware. Devastating to augmented foes.', type: 'cyberdeck_program', rarity: 'uncommon', value: 400, effects: [{ modifier: 8, type: 'flat' }] },
  system_reset: { id: 'system_reset', name: 'System Reset', description: 'Forces a full system reboot on the target. Instant incapacitation.', type: 'cyberdeck_program', rarity: 'legendary', value: 3000, effects: [{ modifier: 25, type: 'flat' }] },

  // --- Junk / Trade ---
  scrap_metal: { id: 'scrap_metal', name: 'Scrap Metal', description: 'Bits of useful metal. Can be sold or used for crafting.', type: 'junk', rarity: 'common', value: 10 },
  data_shard: { id: 'data_shard', name: 'Data Shard', description: 'A small data storage device. Might contain something valuable.', type: 'junk', rarity: 'uncommon', value: 75 },
  military_chip: { id: 'military_chip', name: 'Military Tech Chip', description: 'Encrypted military hardware. Very valuable on the black market.', type: 'junk', rarity: 'rare', value: 500 },
};

export const AUGMENTATIONS: Record<string, Augmentation> = {
  // --- Neural ---
  basic_neural: {
    id: 'basic_neural', name: 'Neural Processor Mk.1', description: 'Basic neural enhancement. Improves processing speed.',
    slot: 'neural', statBonuses: { intelligence: 1 }, skillBonuses: { hacking: 10 },
    cost: 2000, humanityCost: 5, rarity: 'uncommon',
  },
  advanced_neural: {
    id: 'advanced_neural', name: 'Synaptic Accelerator', description: 'Military-grade neural processor. Think faster than humanly possible.',
    slot: 'neural', statBonuses: { intelligence: 3, reflexes: 1 }, skillBonuses: { hacking: 20 },
    cost: 8000, humanityCost: 12, rarity: 'legendary',
  },

  // --- Optics ---
  kiroshi_optics: {
    id: 'kiroshi_optics', name: 'Kiroshi Optics', description: 'Enhanced eyes with zoom, threat detection, and low-light vision.',
    slot: 'optics', statBonuses: { reflexes: 1 }, skillBonuses: { combat: 10 },
    cost: 1500, humanityCost: 3, rarity: 'uncommon',
  },
  netwatch_optics: {
    id: 'netwatch_optics', name: 'NetWatch Scanner Eyes', description: 'See the Net overlaid on reality. Identify all connected devices.',
    slot: 'optics', statBonuses: { intelligence: 2 }, skillBonuses: { hacking: 15 },
    cost: 5000, humanityCost: 8, rarity: 'rare',
  },

  // --- Arms ---
  gorilla_arms: {
    id: 'gorilla_arms', name: 'Gorilla Arms', description: 'Hydraulic arm replacements. Crush anything in your grip.',
    slot: 'arms', statBonuses: { body: 3 }, skillBonuses: { combat: 10 },
    cost: 4000, humanityCost: 10, rarity: 'rare',
  },
  mantis_blades: {
    id: 'mantis_blades', name: 'Mantis Blades', description: 'Retractable arm blades. Silent, deadly, and terrifying.',
    slot: 'arms', statBonuses: { reflexes: 2 }, skillBonuses: { combat: 15, stealth: 5 },
    cost: 6000, humanityCost: 12, rarity: 'legendary',
  },

  // --- Legs ---
  reinforced_legs: {
    id: 'reinforced_legs', name: 'Reinforced Tendons', description: 'Enhanced leg muscles allow for superhuman jumps.',
    slot: 'legs', statBonuses: { reflexes: 1, body: 1 }, skillBonuses: { stealth: 5 },
    cost: 2500, humanityCost: 5, rarity: 'uncommon',
  },

  // --- Skeleton ---
  titanium_skeleton: {
    id: 'titanium_skeleton', name: 'Titanium Bone Lacing', description: 'Bones reinforced with titanium alloy. Nearly unbreakable.',
    slot: 'skeleton', statBonuses: { body: 3 }, skillBonuses: {},
    cost: 7000, humanityCost: 15, rarity: 'legendary',
  },

  // --- Skin ---
  subdermal_armor: {
    id: 'subdermal_armor', name: 'Subdermal Armor', description: 'Armored mesh implanted beneath the skin.',
    slot: 'skin', statBonuses: { body: 2 }, skillBonuses: {},
    cost: 3000, humanityCost: 8, rarity: 'rare',
  },

  // --- Internal ---
  blood_pump: {
    id: 'blood_pump', name: 'Second Heart', description: 'Synthetic backup heart. Stabilizes you when critically injured.',
    slot: 'internal', statBonuses: { body: 1 }, skillBonuses: { medicine: 5 },
    cost: 3500, humanityCost: 7, rarity: 'rare',
  },
  adrenaline_booster: {
    id: 'adrenaline_booster', name: 'Adrenaline Booster', description: 'Floods your system with synthetic adrenaline in combat.',
    slot: 'internal', statBonuses: { reflexes: 2 }, skillBonuses: { combat: 5 },
    cost: 2000, humanityCost: 4, rarity: 'uncommon',
  },
};

export function getItem(id: string): Item | undefined {
  return ITEMS[id];
}

export function getAugmentation(id: string): Augmentation | undefined {
  return AUGMENTATIONS[id];
}

export function getShopItems(districtId: string): Item[] {
  switch (districtId) {
    case 'downtown':
      return [ITEMS.tech_pistol, ITEMS.corporate_suit, ITEMS.stim_pack, ITEMS.neural_booster, ITEMS.ping_daemon];
    case 'kabuki':
      return [ITEMS.rusty_pistol, ITEMS.leather_jacket, ITEMS.stim_pack, ITEMS.short_circuit, ITEMS.data_shard];
    case 'industrial':
      return [ITEMS.rusty_pistol, ITEMS.leather_jacket, ITEMS.stim_pack, ITEMS.scrap_metal, ITEMS.military_chip];
    case 'neon_heights':
      return [ITEMS.tech_pistol, ITEMS.corporate_suit, ITEMS.synth_blood, ITEMS.neural_booster, ITEMS.short_circuit];
    case 'undercity':
      return [ITEMS.katana, ITEMS.military_vest, ITEMS.synth_blood, ITEMS.black_ice_chip, ITEMS.system_reset];
    default:
      return [ITEMS.stim_pack, ITEMS.rusty_pistol];
  }
}

export function getClinicAugmentations(districtId: string): Augmentation[] {
  switch (districtId) {
    case 'downtown':
      return [AUGMENTATIONS.kiroshi_optics, AUGMENTATIONS.basic_neural, AUGMENTATIONS.adrenaline_booster];
    case 'kabuki':
      return [AUGMENTATIONS.basic_neural, AUGMENTATIONS.reinforced_legs, AUGMENTATIONS.subdermal_armor];
    case 'industrial':
      return [AUGMENTATIONS.gorilla_arms, AUGMENTATIONS.titanium_skeleton, AUGMENTATIONS.blood_pump];
    case 'undercity':
      return [AUGMENTATIONS.advanced_neural, AUGMENTATIONS.mantis_blades, AUGMENTATIONS.netwatch_optics];
    default:
      return [AUGMENTATIONS.basic_neural];
  }
}
