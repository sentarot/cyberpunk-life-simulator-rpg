import { NPC, Enemy } from '../types';

export const NPCS: Record<string, NPC> = {
  fixer_jin: {
    id: 'fixer_jin', name: 'Jin "Chrome" Tanaka', title: 'Fixer',
    faction: null, district: 'downtown', disposition: 0,
    dialogue: [
      {
        id: 'intro', text: 'Fresh meat on the streets? I might have work for someone who doesn\'t ask too many questions.',
        responses: [
          { text: 'What kind of work?', nextDialogueId: 'jobs' },
          { text: 'I can handle anything.', nextDialogueId: 'jobs', skillCheck: { skill: 'persuasion', difficulty: 12 } },
          { text: 'Not interested.', nextDialogueId: null },
        ],
      },
      {
        id: 'jobs', text: 'The usual. Deliveries, data extraction, the occasional problem that needs... disappearing. Interested?',
        responses: [
          { text: 'Sign me up.', nextDialogueId: null, effects: [{ type: 'contact', target: 'fixer_jin', message: 'Jin Tanaka added as a contact.' }] },
          { text: 'I\'ll think about it.', nextDialogueId: null },
        ],
      },
    ],
    quests: ['first_gig'],
    isVendor: false,
  },
  ripperdoc_vex: {
    id: 'ripperdoc_vex', name: 'Dr. Vex', title: 'Ripperdoc',
    faction: null, district: 'kabuki', disposition: 10,
    dialogue: [
      {
        id: 'intro', text: 'Sit down, don\'t touch anything, and try not to bleed on my floor. What do you need?',
        responses: [
          { text: 'I need some chrome.', nextDialogueId: 'augment' },
          { text: 'Patch me up, doc.', nextDialogueId: 'heal' },
          { text: 'Just looking.', nextDialogueId: null },
        ],
      },
      {
        id: 'augment', text: 'I\'ve got a few things in stock. Nothing too exotic - for the really wild stuff, you\'ll need to go deeper.',
        responses: [
          { text: 'Show me what you\'ve got.', nextDialogueId: null },
        ],
      },
      {
        id: 'heal', text: 'Standard patch-up is 100 creds. Full restore is 300. What\'ll it be?',
        responses: [
          { text: 'Standard patch-up. (¥100)', nextDialogueId: null, effects: [{ type: 'credits', value: -100, message: 'Paid ¥100 for medical treatment.' }, { type: 'health', value: 30, message: 'Healed 30 HP.' }] },
          { text: 'Full restore. (¥300)', nextDialogueId: null, effects: [{ type: 'credits', value: -300, message: 'Paid ¥300 for full medical treatment.' }, { type: 'health', value: 999, message: 'Fully healed.' }] },
          { text: 'Never mind.', nextDialogueId: null },
        ],
      },
    ],
    quests: [],
    isVendor: false,
  },
  gang_boss_razor: {
    id: 'gang_boss_razor', name: 'Razor', title: 'Maelstrom Lieutenant',
    faction: 'maelstrom', district: 'industrial', disposition: -20,
    dialogue: [
      {
        id: 'intro', text: '*Red optics flicker as Razor sizes you up* You\'re either brave or stupid walking into our turf. Which is it?',
        responses: [
          { text: 'I\'m here to do business.', nextDialogueId: 'business', skillCheck: { skill: 'persuasion', difficulty: 14 } },
          { text: 'I can be useful to you.', nextDialogueId: 'work' },
          { text: '[Leave quietly]', nextDialogueId: null },
        ],
      },
      {
        id: 'business', text: 'Business? With a meat-bag like you? ...Fine. But cross us, and I\'ll personally rip out your spine.',
        responses: [
          { text: 'Understood.', nextDialogueId: null, effects: [{ type: 'contact', target: 'gang_boss_razor', message: 'Razor added as a contact.' }] },
        ],
      },
      {
        id: 'work', text: 'Maybe. We always need runners for the dirty jobs. Prove yourself and maybe you\'ll earn some respect.',
        responses: [
          { text: 'What do you need done?', nextDialogueId: null, effects: [{ type: 'reputation', target: 'maelstrom', value: 5, message: 'Maelstrom reputation slightly improved.' }] },
        ],
      },
    ],
    quests: ['maelstrom_initiation'],
    isVendor: false,
  },
  netrunner_ghost: {
    id: 'netrunner_ghost', name: 'Ghost', title: 'Voodoo Boys Netrunner',
    faction: 'voodoo_boys', district: 'undercity', disposition: -10,
    dialogue: [
      {
        id: 'intro', text: '*A face appears on a nearby screen* I see you. You\'re looking for something in the deep net. I can feel it.',
        responses: [
          { text: 'I need access to the deep net.', nextDialogueId: 'deep_net', skillCheck: { skill: 'hacking', difficulty: 15 } },
          { text: 'Who are you?', nextDialogueId: 'identity' },
          { text: 'I don\'t talk to screens.', nextDialogueId: null },
        ],
      },
      {
        id: 'deep_net', text: 'Bold. The deep net isn\'t for tourists. But if you\'re serious, we might have use for each other.',
        responses: [
          { text: 'I\'m serious.', nextDialogueId: null, effects: [{ type: 'contact', target: 'netrunner_ghost', message: 'Ghost added as a contact.' }, { type: 'reputation', target: 'voodoo_boys', value: 10, message: 'Voodoo Boys reputation improved.' }] },
        ],
      },
      {
        id: 'identity', text: 'Names are data. Data can be traced. Call me Ghost. That\'s all you need to know.',
        responses: [
          { text: 'Fair enough. Let\'s talk business.', nextDialogueId: 'deep_net' },
          { text: '[Leave]', nextDialogueId: null },
        ],
      },
    ],
    quests: ['ghost_in_machine'],
    isVendor: false,
  },
  bartender_maya: {
    id: 'bartender_maya', name: 'Maya', title: 'Bartender at The Afterlife',
    faction: null, district: 'neon_heights', disposition: 20,
    dialogue: [
      {
        id: 'intro', text: 'Welcome to the Afterlife. What\'ll it be? And before you ask - no, I don\'t know where any fixers are. *winks*',
        responses: [
          { text: 'Just a drink.', nextDialogueId: 'drink' },
          { text: 'I\'m looking for work.', nextDialogueId: 'work' },
          { text: 'What\'s the word on the street?', nextDialogueId: 'rumors' },
        ],
      },
      {
        id: 'drink', text: 'Coming right up. A NiCola for the road warrior. On the house for first-timers.',
        responses: [
          { text: 'Thanks.', nextDialogueId: null, effects: [{ type: 'health', value: 5, message: 'The drink was refreshing. +5 HP.' }] },
        ],
      },
      {
        id: 'work', text: 'Check the board by the back wall. Fixers post jobs there. The good stuff goes fast though.',
        responses: [
          { text: 'Thanks for the tip.', nextDialogueId: null, effects: [{ type: 'contact', target: 'bartender_maya', message: 'Maya added as a contact.' }] },
        ],
      },
      {
        id: 'rumors', text: 'Word is Kenzaki Corp is up to something big in the Industrial Zone. And the Voodoo Boys have been quiet. Too quiet.',
        responses: [
          { text: 'Interesting...', nextDialogueId: null, effects: [{ type: 'experience', value: 10, message: 'Gained some street knowledge. +10 XP.' }] },
        ],
      },
    ],
    quests: [],
    isVendor: false,
  },
};

export const ENEMIES: Record<string, Enemy> = {
  // Low level
  street_thug: {
    id: 'street_thug', name: 'Street Thug', level: 1, health: 30, damage: 5, armor: 0,
    skills: { combat: 10 }, loot: [{ itemId: 'scrap_metal', chance: 0.5 }],
    creditDrop: { min: 10, max: 50 }, experienceDrop: 15,
  },
  gang_punk: {
    id: 'gang_punk', name: 'Gang Punk', level: 2, health: 40, damage: 7, armor: 1,
    skills: { combat: 15 }, loot: [{ itemId: 'rusty_pistol', chance: 0.2 }, { itemId: 'scrap_metal', chance: 0.4 }],
    creditDrop: { min: 20, max: 80 }, experienceDrop: 25,
  },
  // Mid level
  corpo_security: {
    id: 'corpo_security', name: 'Corporate Security', level: 4, health: 60, damage: 12, armor: 4,
    skills: { combat: 30 }, loot: [{ itemId: 'tech_pistol', chance: 0.15 }, { itemId: 'stim_pack', chance: 0.3 }],
    creditDrop: { min: 50, max: 200 }, experienceDrop: 50,
  },
  maelstrom_soldier: {
    id: 'maelstrom_soldier', name: 'Maelstrom Soldier', level: 5, health: 70, damage: 14, armor: 3,
    skills: { combat: 35, hacking: 10 }, loot: [{ itemId: 'scrap_metal', chance: 0.6 }, { itemId: 'data_shard', chance: 0.3 }],
    creditDrop: { min: 40, max: 150 }, experienceDrop: 60,
  },
  // High level
  cyberpsycho: {
    id: 'cyberpsycho', name: 'Cyberpsycho', level: 8, health: 120, damage: 22, armor: 6,
    skills: { combat: 50 }, loot: [{ itemId: 'military_chip', chance: 0.4 }, { itemId: 'katana', chance: 0.1 }],
    creditDrop: { min: 100, max: 500 }, experienceDrop: 120,
  },
  rogue_ai_drone: {
    id: 'rogue_ai_drone', name: 'Rogue AI Drone', level: 7, health: 80, damage: 18, armor: 8,
    skills: { combat: 40, hacking: 40 }, loot: [{ itemId: 'military_chip', chance: 0.5 }, { itemId: 'short_circuit', chance: 0.2 }],
    creditDrop: { min: 80, max: 300 }, experienceDrop: 100,
  },
  // Boss
  chrome_demon: {
    id: 'chrome_demon', name: 'Chrome Demon', level: 10, health: 200, damage: 30, armor: 10,
    skills: { combat: 60, hacking: 30 }, loot: [{ itemId: 'monowire', chance: 0.15 }, { itemId: 'military_chip', chance: 0.7 }],
    creditDrop: { min: 500, max: 2000 }, experienceDrop: 250,
  },
};

export function getNPC(id: string): NPC | undefined {
  return NPCS[id];
}

export function getEnemy(id: string): Enemy | undefined {
  return ENEMIES[id];
}

export function getRandomEnemy(districtDanger: string, playerLevel?: number): Enemy {
  // Scale enemy pool based on player level
  const effectiveDanger = scaleEnemyDanger(districtDanger, playerLevel ?? 1);

  switch (effectiveDanger) {
    case 'low':
      return ENEMIES.street_thug;
    case 'medium':
      return Math.random() > 0.5 ? ENEMIES.gang_punk : ENEMIES.street_thug;
    case 'high':
      const highEnemies = [ENEMIES.gang_punk, ENEMIES.corpo_security, ENEMIES.maelstrom_soldier];
      return highEnemies[Math.floor(Math.random() * highEnemies.length)];
    case 'extreme':
      const extremeEnemies = [ENEMIES.maelstrom_soldier, ENEMIES.cyberpsycho, ENEMIES.rogue_ai_drone];
      if (playerLevel && playerLevel >= 7 && Math.random() < 0.15) {
        return ENEMIES.chrome_demon;
      }
      return extremeEnemies[Math.floor(Math.random() * extremeEnemies.length)];
    default:
      return ENEMIES.street_thug;
  }
}

function scaleEnemyDanger(baseDanger: string, playerLevel: number): string {
  if (playerLevel >= 7 && baseDanger === 'low') return 'medium';
  if (playerLevel >= 5 && baseDanger === 'medium') return 'high';
  if (playerLevel >= 8 && baseDanger === 'high') return 'extreme';
  return baseDanger;
}
