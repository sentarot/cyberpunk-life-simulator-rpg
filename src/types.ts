// ============================================================================
// Core Types for Cyberpunk Life Simulator RPG
// ============================================================================

// --- Character Types ---

export interface Stats {
  body: number;       // Physical strength, health, melee
  reflexes: number;   // Speed, agility, reaction time
  tech: number;       // Engineering, hacking hardware, crafting
  intelligence: number; // Netrunning, hacking, knowledge
  cool: number;       // Charisma, intimidation, composure
  luck: number;       // Critical chance, random events, loot
}

export type StatName = keyof Stats;

export interface Skills {
  combat: number;
  hacking: number;
  stealth: number;
  persuasion: number;
  engineering: number;
  streetwise: number;
  medicine: number;
  driving: number;
}

export type SkillName = keyof Skills;

export interface Augmentation {
  id: string;
  name: string;
  description: string;
  slot: AugmentationSlot;
  statBonuses: Partial<Stats>;
  skillBonuses: Partial<Skills>;
  cost: number;
  humanityCost: number;
  rarity: Rarity;
}

export type AugmentationSlot =
  | 'neural'
  | 'optics'
  | 'arms'
  | 'legs'
  | 'skeleton'
  | 'skin'
  | 'internal';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary' | 'iconic';

export type CharacterOrigin = 'street_kid' | 'corpo' | 'nomad' | 'netrunner';

export interface Character {
  name: string;
  origin: CharacterOrigin;
  stats: Stats;
  skills: Skills;
  augmentations: Augmentation[];
  level: number;
  experience: number;
  health: number;
  maxHealth: number;
  humanity: number;     // Decreases with augmentations, affects interactions
  credits: number;
  reputation: Record<string, number>; // faction -> reputation value
  inventory: InventoryItem[];
  equipped: EquippedGear;
  currentDistrict: string;
  apartment: string | null;
  contacts: string[];   // NPC IDs
  activeQuests: string[];
  completedQuests: string[];
  traits: string[];
  daysSurvived: number;
}

export interface EquippedGear {
  weapon: Item | null;
  armor: Item | null;
  cyberdeckProgram: Item | null;
}

// --- Item Types ---

export type ItemType = 'weapon' | 'armor' | 'consumable' | 'cyberdeck_program' | 'junk' | 'quest_item' | 'implant';

export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: Rarity;
  value: number;
  effects?: ItemEffect[];
}

export interface ItemEffect {
  stat?: StatName;
  skill?: SkillName;
  modifier: number;
  type: 'flat' | 'percentage';
}

export interface InventoryItem {
  item: Item;
  quantity: number;
}

// --- World Types ---

export type DistrictDanger = 'low' | 'medium' | 'high' | 'extreme';

export interface District {
  id: string;
  name: string;
  description: string;
  danger: DistrictDanger;
  controllingFaction: string | null;
  locations: Location[];
  availableJobs: string[];
  shopInventory: Item[];
}

export interface Location {
  id: string;
  name: string;
  description: string;
  type: LocationType;
  actions: string[];
}

export type LocationType =
  | 'bar'
  | 'shop'
  | 'clinic'
  | 'black_market'
  | 'apartment'
  | 'corporate_office'
  | 'alley'
  | 'club'
  | 'workshop'
  | 'data_haven';

export interface Faction {
  id: string;
  name: string;
  description: string;
  territory: string[];    // district IDs
  alignment: 'hostile' | 'neutral' | 'friendly';
  reputationThresholds: {
    hostile: number;
    neutral: number;
    friendly: number;
    allied: number;
  };
}

export interface NPC {
  id: string;
  name: string;
  title: string;
  faction: string | null;
  district: string;
  disposition: number; // -100 to 100
  dialogue: DialogueLine[];
  quests: string[];
  isVendor: boolean;
  vendorItems?: Item[];
}

export interface DialogueLine {
  id: string;
  text: string;
  responses: DialogueResponse[];
  condition?: EventCondition;
}

export interface DialogueResponse {
  text: string;
  nextDialogueId: string | null;
  skillCheck?: { skill: SkillName; difficulty: number };
  effects?: EventOutcome[];
}

// --- Event Types ---

export type EventCategory =
  | 'random_encounter'
  | 'story'
  | 'job'
  | 'faction'
  | 'personal'
  | 'world';

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  choices: EventChoice[];
  conditions: EventCondition[];
  weight: number;         // probability weight for random selection
  repeatable: boolean;
  cooldownDays: number;
}

export interface EventChoice {
  id: string;
  text: string;
  skillCheck?: { skill: SkillName; difficulty: number };
  statCheck?: { stat: StatName; difficulty: number };
  itemRequired?: string;
  outcomes: {
    success: EventOutcome[];
    failure?: EventOutcome[];
  };
}

export interface EventOutcome {
  type: EventOutcomeType;
  target?: string;
  value?: number;
  message: string;
}

export type EventOutcomeType =
  | 'credits'
  | 'experience'
  | 'health'
  | 'reputation'
  | 'item'
  | 'stat'
  | 'skill'
  | 'quest'
  | 'contact'
  | 'trait'
  | 'humanity'
  | 'message';

export interface EventCondition {
  type: 'stat' | 'skill' | 'reputation' | 'item' | 'quest' | 'district' | 'trait' | 'level' | 'credits' | 'day';
  target: string;
  operator: '>=' | '<=' | '==' | '!=' | '>' | '<';
  value: number | string;
}

// --- Job Types ---

export interface Job {
  id: string;
  name: string;
  description: string;
  employer: string;
  district: string;
  type: JobType;
  difficulty: number;       // 1-10
  payCredits: number;
  payExperience: number;
  reputationReward: { faction: string; amount: number } | null;
  requirements: EventCondition[];
  risks: JobRisk[];
  duration: number;         // in-game days
}

export type JobType = 'gig' | 'heist' | 'delivery' | 'assassination' | 'hacking' | 'bodyguard' | 'theft' | 'investigation';

export interface JobRisk {
  chance: number;           // 0-1 probability
  type: 'combat' | 'arrest' | 'injury' | 'reputation_loss' | 'ambush';
  severity: number;         // 1-5
}

// --- Combat Types ---

export interface CombatState {
  playerHealth: number;
  enemyHealth: number;
  enemyMaxHealth: number;
  enemyName: string;
  enemyLevel: number;
  round: number;
  playerEffects: CombatEffect[];
  enemyEffects: CombatEffect[];
  fled: boolean;
  resolved: boolean;
}

export interface CombatEffect {
  name: string;
  duration: number;
  damagePerRound?: number;
  statModifier?: Partial<Stats>;
}

export interface Enemy {
  id: string;
  name: string;
  level: number;
  health: number;
  damage: number;
  armor: number;
  skills: Partial<Skills>;
  loot: { itemId: string; chance: number }[];
  creditDrop: { min: number; max: number };
  experienceDrop: number;
}

// --- Game State ---

export interface GameState {
  character: Character;
  currentDay: number;
  currentTime: TimeOfDay;
  worldEvents: string[];       // IDs of active world events
  completedEventIds: string[];
  eventCooldowns: Record<string, number>; // eventId -> day available
  gameLog: LogEntry[];
  settings: GameSettings;
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface LogEntry {
  day: number;
  time: TimeOfDay;
  message: string;
  type: 'info' | 'combat' | 'quest' | 'reward' | 'danger' | 'story';
}

export interface GameSettings {
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare';
  autoSave: boolean;
  verboseLog: boolean;
}

// --- Save Data ---

export interface SaveData {
  version: string;
  timestamp: number;
  gameState: GameState;
}

// --- UI Types ---

export interface MenuOption {
  key: string;
  label: string;
  description?: string;
  disabled?: boolean;
  disabledReason?: string;
}

export interface ActionResult {
  success: boolean;
  messages: string[];
  outcomes: EventOutcome[];
}
