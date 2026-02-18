import { Job } from '../types';

export const JOBS: Record<string, Job> = {
  // --- Downtown Jobs ---
  delivery_downtown: {
    id: 'delivery_downtown', name: 'Corporate Package Delivery', description: 'Deliver a sealed package across Downtown. Don\'t open it. Don\'t ask what\'s inside.',
    employer: 'Anonymous', district: 'downtown', type: 'delivery', difficulty: 2,
    payCredits: 200, payExperience: 20,
    reputationReward: null,
    requirements: [],
    risks: [{ chance: 0.15, type: 'ambush', severity: 1 }],
    duration: 1,
  },
  corpo_escort: {
    id: 'corpo_escort', name: 'Executive Escort', description: 'Protect a Kenzaki executive during a meeting in Kabuki. Expect trouble.',
    employer: 'Kenzaki Megacorp', district: 'downtown', type: 'bodyguard', difficulty: 4,
    payCredits: 600, payExperience: 50,
    reputationReward: { faction: 'megacorp', amount: 10 },
    requirements: [{ type: 'skill', target: 'combat', operator: '>=', value: 15 }],
    risks: [{ chance: 0.3, type: 'combat', severity: 2 }, { chance: 0.1, type: 'injury', severity: 2 }],
    duration: 1,
  },
  data_heist: {
    id: 'data_heist', name: 'Data Extraction', description: 'Break into a rival corp\'s server room and extract sensitive data. In and out, no traces.',
    employer: 'Jin Tanaka', district: 'downtown', type: 'heist', difficulty: 6,
    payCredits: 1500, payExperience: 100,
    reputationReward: { faction: 'megacorp', amount: -5 },
    requirements: [{ type: 'skill', target: 'hacking', operator: '>=', value: 20 }, { type: 'skill', target: 'stealth', operator: '>=', value: 15 }],
    risks: [{ chance: 0.4, type: 'combat', severity: 3 }, { chance: 0.2, type: 'arrest', severity: 3 }],
    duration: 1,
  },

  // --- Kabuki Jobs ---
  tyger_delivery: {
    id: 'tyger_delivery', name: 'Tyger Claw Drop', description: 'Pick up a package from the docks and deliver it to the Lucky Cat. Don\'t be late.',
    employer: 'Tyger Claws', district: 'kabuki', type: 'delivery', difficulty: 3,
    payCredits: 300, payExperience: 30,
    reputationReward: { faction: 'tyger_claws', amount: 8 },
    requirements: [],
    risks: [{ chance: 0.2, type: 'ambush', severity: 2 }],
    duration: 1,
  },
  net_dive: {
    id: 'net_dive', name: 'Net Dive: Data Mining', description: 'Jack into a compromised subnet and extract valuable data before ICE locks you out.',
    employer: 'Ghost', district: 'kabuki', type: 'hacking', difficulty: 5,
    payCredits: 800, payExperience: 70,
    reputationReward: { faction: 'voodoo_boys', amount: 5 },
    requirements: [{ type: 'skill', target: 'hacking', operator: '>=', value: 25 }],
    risks: [{ chance: 0.3, type: 'injury', severity: 2 }],
    duration: 1,
  },
  smuggling_run: {
    id: 'smuggling_run', name: 'Smuggling Run', description: 'Move contraband through NCPD checkpoints in Kabuki. Stealth and nerve required.',
    employer: 'Anonymous', district: 'kabuki', type: 'delivery', difficulty: 4,
    payCredits: 500, payExperience: 40,
    reputationReward: { faction: 'ncpd', amount: -10 },
    requirements: [{ type: 'skill', target: 'stealth', operator: '>=', value: 15 }],
    risks: [{ chance: 0.35, type: 'arrest', severity: 2 }, { chance: 0.15, type: 'combat', severity: 2 }],
    duration: 1,
  },

  // --- Industrial Jobs ---
  salvage_run: {
    id: 'salvage_run', name: 'Scrapyard Salvage', description: 'Search through the scrapyard for valuable tech components. Watch out for territorial gangs.',
    employer: 'Big Mike', district: 'industrial', type: 'gig', difficulty: 3,
    payCredits: 250, payExperience: 25,
    reputationReward: null,
    requirements: [{ type: 'skill', target: 'engineering', operator: '>=', value: 10 }],
    risks: [{ chance: 0.25, type: 'combat', severity: 2 }, { chance: 0.1, type: 'injury', severity: 1 }],
    duration: 1,
  },
  gang_hit: {
    id: 'gang_hit', name: 'Gang Elimination', description: 'Take out a rival gang leader in the Industrial Zone. Messy but pays well.',
    employer: 'Anonymous', district: 'industrial', type: 'assassination', difficulty: 7,
    payCredits: 2000, payExperience: 120,
    reputationReward: { faction: 'maelstrom', amount: 15 },
    requirements: [{ type: 'skill', target: 'combat', operator: '>=', value: 30 }, { type: 'level', target: '', operator: '>=', value: 3 }],
    risks: [{ chance: 0.5, type: 'combat', severity: 4 }, { chance: 0.2, type: 'injury', severity: 3 }, { chance: 0.1, type: 'reputation_loss', severity: 2 }],
    duration: 1,
  },
  warehouse_heist: {
    id: 'warehouse_heist', name: 'Warehouse Raid', description: 'Hit a Kenzaki weapons cache in Warehouse 13. Big risk, bigger reward.',
    employer: 'Razor', district: 'industrial', type: 'heist', difficulty: 8,
    payCredits: 3000, payExperience: 150,
    reputationReward: { faction: 'megacorp', amount: -20 },
    requirements: [{ type: 'skill', target: 'stealth', operator: '>=', value: 25 }, { type: 'skill', target: 'combat', operator: '>=', value: 25 }],
    risks: [{ chance: 0.5, type: 'combat', severity: 4 }, { chance: 0.3, type: 'arrest', severity: 4 }],
    duration: 1,
  },

  // --- Neon Heights Jobs ---
  celebrity_bodyguard: {
    id: 'celebrity_bodyguard', name: 'Celebrity Protection', description: 'Keep a braindance star safe during a club tour. Fans can be... enthusiastic.',
    employer: 'Dreamscape Entertainment', district: 'neon_heights', type: 'bodyguard', difficulty: 3,
    payCredits: 400, payExperience: 35,
    reputationReward: null,
    requirements: [{ type: 'skill', target: 'combat', operator: '>=', value: 10 }],
    risks: [{ chance: 0.2, type: 'combat', severity: 1 }],
    duration: 1,
  },
  bd_theft: {
    id: 'bd_theft', name: 'Braindance Heist', description: 'Steal an unreleased braindance from a rival studio. Worth a fortune on the black market.',
    employer: 'Anonymous', district: 'neon_heights', type: 'theft', difficulty: 5,
    payCredits: 1000, payExperience: 80,
    reputationReward: null,
    requirements: [{ type: 'skill', target: 'stealth', operator: '>=', value: 20 }],
    risks: [{ chance: 0.3, type: 'combat', severity: 2 }, { chance: 0.2, type: 'arrest', severity: 2 }],
    duration: 1,
  },
  club_bouncer: {
    id: 'club_bouncer', name: 'Club Bouncer Shift', description: 'Work the door at the Afterlife for a night. Easy money if nobody starts trouble.',
    employer: 'The Afterlife', district: 'neon_heights', type: 'bodyguard', difficulty: 2,
    payCredits: 150, payExperience: 15,
    reputationReward: null,
    requirements: [],
    risks: [{ chance: 0.2, type: 'combat', severity: 1 }],
    duration: 1,
  },

  // --- Undercity Jobs ---
  deep_net_run: {
    id: 'deep_net_run', name: 'Deep Net Expedition', description: 'Dive into the old net beyond the Blackwall. Find data fragments from before the collapse.',
    employer: 'Ghost', district: 'undercity', type: 'hacking', difficulty: 9,
    payCredits: 4000, payExperience: 200,
    reputationReward: { faction: 'voodoo_boys', amount: 20 },
    requirements: [{ type: 'skill', target: 'hacking', operator: '>=', value: 40 }, { type: 'level', target: '', operator: '>=', value: 5 }],
    risks: [{ chance: 0.4, type: 'injury', severity: 4 }, { chance: 0.2, type: 'combat', severity: 5 }],
    duration: 1,
  },
  tunnel_escort: {
    id: 'tunnel_escort', name: 'Tunnel Escort', description: 'Guide a group of refugees through the Undercity tunnels to safety. Danger at every turn.',
    employer: 'Desert Wolves', district: 'undercity', type: 'bodyguard', difficulty: 6,
    payCredits: 1200, payExperience: 90,
    reputationReward: { faction: 'nomads', amount: 15 },
    requirements: [{ type: 'skill', target: 'combat', operator: '>=', value: 20 }],
    risks: [{ chance: 0.4, type: 'combat', severity: 3 }, { chance: 0.2, type: 'ambush', severity: 3 }],
    duration: 1,
  },
  organ_delivery: {
    id: 'organ_delivery', name: 'Special Delivery', description: 'Transport "medical supplies" through the Undercity. Don\'t look in the cooler.',
    employer: 'The Meat Market', district: 'undercity', type: 'delivery', difficulty: 5,
    payCredits: 700, payExperience: 50,
    reputationReward: null,
    requirements: [{ type: 'skill', target: 'streetwise', operator: '>=', value: 15 }],
    risks: [{ chance: 0.3, type: 'ambush', severity: 3 }, { chance: 0.15, type: 'reputation_loss', severity: 2 }],
    duration: 1,
  },
};

export function getJob(id: string): Job | undefined {
  return JOBS[id];
}

export function getDistrictJobs(districtId: string): Job[] {
  return Object.values(JOBS).filter(j => j.district === districtId);
}
