import { Faction } from '../types';

export const FACTIONS: Faction[] = [
  {
    id: 'megacorp',
    name: 'Kenzaki Megacorp',
    description: 'The dominant corporate power in the city. They control the economy, the police, and most of the government. They reward loyalty and crush dissent.',
    territory: ['downtown'],
    alignment: 'neutral',
    reputationThresholds: { hostile: -50, neutral: -10, friendly: 30, allied: 70 },
  },
  {
    id: 'tyger_claws',
    name: 'Tyger Claws',
    description: 'A powerful gang with roots in traditional crime families. They control Kabuki and much of the entertainment industry. Honor and profit walk hand in hand.',
    territory: ['kabuki'],
    alignment: 'neutral',
    reputationThresholds: { hostile: -40, neutral: -5, friendly: 25, allied: 60 },
  },
  {
    id: 'maelstrom',
    name: 'Maelstrom',
    description: 'Cyber-obsessed gang that pushes augmentation to the extreme. They worship technology and have little regard for human limits. Or human life.',
    territory: ['industrial'],
    alignment: 'hostile',
    reputationThresholds: { hostile: -30, neutral: 0, friendly: 30, allied: 65 },
  },
  {
    id: 'voodoo_boys',
    name: 'Voodoo Boys',
    description: 'Mysterious netrunners who inhabit the Undercity. They seek to make contact with rogue AIs beyond the Blackwall. Knowledge is their currency.',
    territory: ['undercity'],
    alignment: 'neutral',
    reputationThresholds: { hostile: -40, neutral: -5, friendly: 20, allied: 55 },
  },
  {
    id: 'ncpd',
    name: 'NCPD',
    description: 'Neo City Police Department. Underfunded, overworked, and increasingly desperate. Some officers still believe in justice. Most just want to survive their shift.',
    territory: [],
    alignment: 'neutral',
    reputationThresholds: { hostile: -60, neutral: -10, friendly: 20, allied: 50 },
  },
  {
    id: 'nomads',
    name: 'Desert Wolves',
    description: 'Nomad clan that trades between the city and the wasteland. They value freedom, family, and the open road above all else.',
    territory: ['industrial'],
    alignment: 'friendly',
    reputationThresholds: { hostile: -30, neutral: 0, friendly: 20, allied: 50 },
  },
];

export function getFaction(id: string): Faction | undefined {
  return FACTIONS.find(f => f.id === id);
}

export function getFactionStanding(reputation: number, faction: Faction): string {
  if (reputation >= faction.reputationThresholds.allied) return 'Allied';
  if (reputation >= faction.reputationThresholds.friendly) return 'Friendly';
  if (reputation >= faction.reputationThresholds.neutral) return 'Neutral';
  if (reputation >= faction.reputationThresholds.hostile) return 'Hostile';
  return 'Enemy';
}
