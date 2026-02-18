import { District, Location } from '../types';

export const DISTRICTS: District[] = [
  {
    id: 'downtown',
    name: 'Downtown',
    description: 'The gleaming heart of Neo-Tokyo. Corporate towers pierce the acid rain clouds, their holographic ads casting neon light on the streets below. Money flows here, but so does danger.',
    danger: 'medium',
    controllingFaction: 'megacorp',
    locations: [
      { id: 'neon_dragon_bar', name: 'The Neon Dragon', description: 'A sleek bar where corpo suits mingle with fixers. Good intel flows with the drinks.', type: 'bar', actions: ['drink', 'talk', 'gather_intel'] },
      { id: 'chrome_clinic', name: 'Chrome & Bone Clinic', description: 'A legitimate ripperdoc clinic. Clean, professional, and expensive.', type: 'clinic', actions: ['heal', 'install_augmentation', 'buy_meds'] },
      { id: 'synth_plaza', name: 'Synth Plaza Market', description: 'Open-air market selling everything from street food to military-grade tech.', type: 'shop', actions: ['buy', 'sell', 'browse'] },
      { id: 'tower_lobby', name: 'Arasaka Tower Lobby', description: 'The public floor of the most powerful megacorporation. Security is tight.', type: 'corporate_office', actions: ['talk', 'gather_intel'] },
    ],
    availableJobs: ['delivery_downtown', 'corpo_escort', 'data_heist'],
    shopInventory: [],
  },
  {
    id: 'kabuki',
    name: 'Kabuki District',
    description: 'Dense, overpopulated, and dripping with neon. Traditional culture clashes with cutting-edge tech in this maze of narrow streets and hidden passages.',
    danger: 'medium',
    controllingFaction: 'tyger_claws',
    locations: [
      { id: 'jacked_in', name: 'Jacked In', description: 'A dingy netrunner cafe. Rows of chairs with neural links. The smell of ozone fills the air.', type: 'data_haven', actions: ['hack', 'buy_programs', 'gather_intel'] },
      { id: 'lucky_cat', name: 'Lucky Cat Parlor', description: 'A gambling den run by the Tyger Claws. Fortunes are won and lost nightly.', type: 'club', actions: ['gamble', 'talk', 'drink'] },
      { id: 'kabuki_market', name: 'Night Market', description: 'A bustling street market that comes alive after dark. Everything has a price.', type: 'shop', actions: ['buy', 'sell', 'browse'] },
      { id: 'back_alley_doc', name: 'Dr. Vex\'s Backroom', description: 'A back-alley ripperdoc. Cheap, but you might wake up missing a kidney.', type: 'clinic', actions: ['heal', 'install_augmentation', 'buy_meds'] },
    ],
    availableJobs: ['tyger_delivery', 'net_dive', 'smuggling_run'],
    shopInventory: [],
  },
  {
    id: 'industrial',
    name: 'Industrial Zone',
    description: 'Rusting factories and abandoned warehouses stretch for miles. The air tastes like metal. Nomad caravans trade here, and gangs use it as a battleground.',
    danger: 'high',
    controllingFaction: 'maelstrom',
    locations: [
      { id: 'rust_bucket', name: 'The Rust Bucket', description: 'A bar built inside a decommissioned cargo container. The drinks are cheap and the fights are free.', type: 'bar', actions: ['drink', 'fight', 'talk'] },
      { id: 'scrapyard', name: 'Big Mike\'s Scrapyard', description: 'Mountains of tech refuse. One person\'s junk is another\'s weapon.', type: 'workshop', actions: ['craft', 'buy', 'sell', 'salvage'] },
      { id: 'warehouse_13', name: 'Warehouse 13', description: 'An unmarked warehouse. Those in the know come here for black market deals.', type: 'black_market', actions: ['buy', 'sell', 'fence'] },
      { id: 'dark_alley', name: 'Sector 7 Alley', description: 'A dangerous stretch of abandoned industrial blocks. Gang territory.', type: 'alley', actions: ['explore', 'scavenge'] },
    ],
    availableJobs: ['salvage_run', 'gang_hit', 'warehouse_heist'],
    shopInventory: [],
  },
  {
    id: 'neon_heights',
    name: 'Neon Heights',
    description: 'The entertainment district. Clubs, braindance parlors, and pleasure houses line every street. It\'s where the city comes to forget its problems.',
    danger: 'low',
    controllingFaction: null,
    locations: [
      { id: 'afterlife', name: 'The Afterlife', description: 'The most legendary merc bar in the city. Only the best get a booth here.', type: 'bar', actions: ['drink', 'talk', 'find_jobs'] },
      { id: 'bd_lounge', name: 'Dreamscape BD Lounge', description: 'Braindance parlor offering experiences from across the globe. Addictive and expensive.', type: 'club', actions: ['braindance', 'relax'] },
      { id: 'high_street_mall', name: 'High Street Mall', description: 'Upscale shopping center with designer chrome and luxury items.', type: 'shop', actions: ['buy', 'sell', 'browse'] },
      { id: 'apartment_complex', name: 'Heights Apartments', description: 'Affordable megabuilding apartments. Not great, but a roof over your head.', type: 'apartment', actions: ['rest', 'stash'] },
    ],
    availableJobs: ['celebrity_bodyguard', 'bd_theft', 'club_bouncer'],
    shopInventory: [],
  },
  {
    id: 'undercity',
    name: 'The Undercity',
    description: 'Beneath the streets lies another city entirely. Tunnels, abandoned subway lines, and forgotten infrastructure host the truly desperate and the truly dangerous.',
    danger: 'extreme',
    controllingFaction: 'voodoo_boys',
    locations: [
      { id: 'deep_net_node', name: 'Deep Net Node', description: 'A hidden access point to the old internet. Ghost data and rogue AIs lurk here.', type: 'data_haven', actions: ['hack', 'deep_dive', 'trade_data'] },
      { id: 'rat_king', name: 'The Rat King', description: 'A bar in a flooded subway station. The regulars have been down here so long they\'ve forgotten the sun.', type: 'bar', actions: ['drink', 'talk', 'hire'] },
      { id: 'organ_market', name: 'The Meat Market', description: 'No questions asked. Buy and sell organs, augmentations, and things better left unnamed.', type: 'black_market', actions: ['buy', 'sell', 'install_augmentation'] },
      { id: 'tunnel_maze', name: 'The Maze', description: 'Miles of twisting tunnels. Treasure and death in equal measure.', type: 'alley', actions: ['explore', 'scavenge'] },
    ],
    availableJobs: ['deep_net_run', 'tunnel_escort', 'organ_delivery'],
    shopInventory: [],
  },
];

export function getDistrict(id: string): District | undefined {
  return DISTRICTS.find(d => d.id === id);
}

export function getLocation(districtId: string, locationId: string): Location | undefined {
  const district = getDistrict(districtId);
  return district?.locations.find(l => l.id === locationId);
}
