import { GameEvent } from '../types';
import { getFaction, getFactionStanding } from './factions';
import { getDistrict } from './districts';

export const EVENTS: GameEvent[] = [
  // --- Random Encounters ---
  {
    id: 'mugging', title: 'Back Alley Mugging', category: 'random_encounter',
    description: 'A group of thugs steps out of the shadows, blocking your path. "Hand over your creds, or we\'ll take \'em off your corpse."',
    conditions: [], weight: 15, repeatable: true, cooldownDays: 2,
    choices: [
      {
        id: 'fight', text: 'Fight them off',
        skillCheck: { skill: 'combat', difficulty: 12 },
        outcomes: {
          success: [
            { type: 'message', message: 'You dispatch the thugs with practiced efficiency.' },
            { type: 'credits', value: 50, message: 'Looted ¥50 from the thugs.' },
            { type: 'experience', value: 20, message: '+20 XP' },
          ],
          failure: [
            { type: 'message', message: 'They overwhelm you and take what they want.' },
            { type: 'health', value: -15, message: 'Lost 15 HP from the beating.' },
            { type: 'credits', value: -100, message: 'Lost ¥100.' },
          ],
        },
      },
      {
        id: 'intimidate', text: 'Intimidate them',
        statCheck: { stat: 'cool', difficulty: 14 },
        outcomes: {
          success: [
            { type: 'message', message: 'Your cold stare makes them think twice. They back off.' },
            { type: 'experience', value: 15, message: '+15 XP' },
          ],
          failure: [
            { type: 'message', message: 'They laugh at your attempt. Things get ugly.' },
            { type: 'health', value: -10, message: 'Lost 10 HP.' },
            { type: 'credits', value: -75, message: 'Lost ¥75.' },
          ],
        },
      },
      {
        id: 'pay', text: 'Pay them off (¥50)',
        outcomes: {
          success: [
            { type: 'credits', value: -50, message: 'Paid ¥50 to avoid trouble.' },
            { type: 'message', message: 'They take the creds and disappear into the shadows.' },
          ],
        },
      },
      {
        id: 'run', text: 'Try to run',
        skillCheck: { skill: 'stealth', difficulty: 11 },
        outcomes: {
          success: [
            { type: 'message', message: 'You slip away before they can react.' },
            { type: 'experience', value: 10, message: '+10 XP' },
          ],
          failure: [
            { type: 'message', message: 'They catch you before you get far.' },
            { type: 'health', value: -20, message: 'Lost 20 HP from the beating.' },
            { type: 'credits', value: -150, message: 'Lost ¥150.' },
          ],
        },
      },
    ],
  },
  {
    id: 'street_vendor', title: 'Mysterious Vendor', category: 'random_encounter',
    description: 'A cloaked figure beckons you from a doorway. "Psst... I\'ve got something special. Fell off the back of a corpo transport."',
    conditions: [], weight: 10, repeatable: true, cooldownDays: 3,
    choices: [
      {
        id: 'buy', text: 'Check out the goods (¥200)',
        outcomes: {
          success: [
            { type: 'credits', value: -200, message: 'Paid ¥200.' },
            { type: 'item', target: 'data_shard', value: 1, message: 'Received a Data Shard!' },
            { type: 'experience', value: 10, message: '+10 XP' },
          ],
        },
      },
      {
        id: 'haggle', text: 'Try to haggle',
        skillCheck: { skill: 'persuasion', difficulty: 13 },
        outcomes: {
          success: [
            { type: 'credits', value: -100, message: 'Talked them down to ¥100.' },
            { type: 'item', target: 'data_shard', value: 1, message: 'Received a Data Shard!' },
            { type: 'experience', value: 15, message: '+15 XP' },
          ],
          failure: [
            { type: 'message', message: '"You insult me! Deal\'s off." The vendor disappears.' },
          ],
        },
      },
      {
        id: 'ignore', text: 'Keep walking',
        outcomes: {
          success: [
            { type: 'message', message: 'You walk past. Probably for the best.' },
          ],
        },
      },
    ],
  },
  {
    id: 'ncpd_checkpoint', title: 'NCPD Checkpoint', category: 'random_encounter',
    description: 'An NCPD checkpoint blocks the road ahead. Officers are scanning everyone passing through.',
    conditions: [], weight: 8, repeatable: true, cooldownDays: 3,
    choices: [
      {
        id: 'comply', text: 'Walk through normally',
        outcomes: {
          success: [
            { type: 'message', message: 'The scan comes up clean. The officers wave you through.' },
            { type: 'reputation', target: 'ncpd', value: 2, message: 'NCPD reputation slightly improved.' },
          ],
        },
      },
      {
        id: 'hack_scanner', text: 'Hack the scanner',
        skillCheck: { skill: 'hacking', difficulty: 15 },
        outcomes: {
          success: [
            { type: 'message', message: 'You feed the scanner false data. It beeps green and you pass through.' },
            { type: 'experience', value: 25, message: '+25 XP' },
          ],
          failure: [
            { type: 'message', message: 'The scanner flags you. Officers close in.' },
            { type: 'credits', value: -300, message: 'Fined ¥300 by NCPD.' },
            { type: 'reputation', target: 'ncpd', value: -10, message: 'NCPD reputation decreased.' },
          ],
        },
      },
      {
        id: 'detour', text: 'Take a detour to avoid them',
        outcomes: {
          success: [
            { type: 'message', message: 'You take a longer route through the back streets.' },
          ],
        },
      },
    ],
  },
  {
    id: 'data_leak', title: 'Dropped Data Shard', category: 'random_encounter',
    description: 'You spot a glowing data shard on the ground. Someone dropped it in a hurry - there are fresh scorch marks on the pavement nearby.',
    conditions: [], weight: 6, repeatable: true, cooldownDays: 5,
    choices: [
      {
        id: 'pick_up', text: 'Pick it up and read it',
        skillCheck: { skill: 'hacking', difficulty: 10 },
        outcomes: {
          success: [
            { type: 'message', message: 'The shard contains encrypted financial data. Could be valuable.' },
            { type: 'credits', value: 300, message: 'Decrypted data worth ¥300!' },
            { type: 'experience', value: 20, message: '+20 XP' },
          ],
          failure: [
            { type: 'message', message: 'The shard\'s encryption fights back. A nasty ICE program fries your interface.' },
            { type: 'health', value: -10, message: 'Lost 10 HP from neural feedback.' },
          ],
        },
      },
      {
        id: 'sell_raw', text: 'Pocket it to sell later',
        outcomes: {
          success: [
            { type: 'item', target: 'data_shard', value: 1, message: 'Picked up a Data Shard.' },
          ],
        },
      },
      {
        id: 'leave_it', text: 'Leave it - could be a trap',
        outcomes: {
          success: [
            { type: 'message', message: 'You walk on. Smart move or missed opportunity - who knows.' },
          ],
        },
      },
    ],
  },
  {
    id: 'wounded_stranger', title: 'Wounded Stranger', category: 'random_encounter',
    description: 'You find a person slumped against a wall, bleeding from a gunshot wound. They look up at you with desperate eyes.',
    conditions: [], weight: 7, repeatable: true, cooldownDays: 4,
    choices: [
      {
        id: 'help', text: 'Help them',
        skillCheck: { skill: 'medicine', difficulty: 12 },
        outcomes: {
          success: [
            { type: 'message', message: '"Thank you... I won\'t forget this." They press something into your hand before limping away.' },
            { type: 'credits', value: 150, message: 'Received ¥150 as thanks.' },
            { type: 'experience', value: 25, message: '+25 XP' },
            { type: 'humanity', value: 2, message: 'Your humanity increased.' },
          ],
          failure: [
            { type: 'message', message: 'You try your best but you\'re no doctor. They\'ll survive, barely.' },
            { type: 'humanity', value: 1, message: 'Your humanity increased slightly.' },
          ],
        },
      },
      {
        id: 'loot', text: 'Search their pockets',
        outcomes: {
          success: [
            { type: 'credits', value: 75, message: 'Found ¥75 in their pockets.' },
            { type: 'humanity', value: -3, message: 'Your humanity decreased.' },
          ],
        },
      },
      {
        id: 'ignore', text: 'Walk past - not your problem',
        outcomes: {
          success: [
            { type: 'message', message: 'You keep moving. This city teaches you not to get involved.' },
            { type: 'humanity', value: -1, message: 'Your humanity slightly decreased.' },
          ],
        },
      },
    ],
  },
  {
    id: 'street_fight', title: 'Street Brawl', category: 'random_encounter',
    description: 'A crowd has gathered around two combatants. A bookie is taking bets. "Hey, you look tough! Wanna step in the ring? Winner takes the pot!"',
    conditions: [], weight: 8, repeatable: true, cooldownDays: 3,
    choices: [
      {
        id: 'fight', text: 'Enter the fight',
        skillCheck: { skill: 'combat', difficulty: 14 },
        outcomes: {
          success: [
            { type: 'message', message: 'You knock your opponent out cold! The crowd goes wild!' },
            { type: 'credits', value: 200, message: 'Won ¥200 from the pot!' },
            { type: 'experience', value: 30, message: '+30 XP' },
          ],
          failure: [
            { type: 'message', message: 'You take a heavy hit and go down. The crowd boos.' },
            { type: 'health', value: -20, message: 'Lost 20 HP.' },
            { type: 'credits', value: -50, message: 'Lost your ¥50 entry fee.' },
          ],
        },
      },
      {
        id: 'bet', text: 'Place a bet instead (¥100)',
        outcomes: {
          success: [
            { type: 'credits', value: 100, message: 'Your fighter wins! Earned ¥100.' },
            { type: 'experience', value: 5, message: '+5 XP' },
          ],
        },
      },
      {
        id: 'watch', text: 'Watch from the crowd',
        outcomes: {
          success: [
            { type: 'message', message: 'An entertaining show. You picked up a few combat tips.' },
            { type: 'experience', value: 5, message: '+5 XP' },
          ],
        },
      },
    ],
  },
  {
    id: 'hacker_offer', title: 'Net Opportunity', category: 'random_encounter',
    description: 'Your comm buzzes with an encrypted message: "I\'ve got access codes to a corporate database. Split the profits 50/50. You in?"',
    conditions: [{ type: 'skill', target: 'hacking', operator: '>=', value: '10' }],
    weight: 6, repeatable: true, cooldownDays: 5,
    choices: [
      {
        id: 'accept', text: 'Jack in and help',
        skillCheck: { skill: 'hacking', difficulty: 16 },
        outcomes: {
          success: [
            { type: 'message', message: 'The hack goes smoothly. The data is worth a fortune.' },
            { type: 'credits', value: 500, message: 'Your cut: ¥500!' },
            { type: 'experience', value: 40, message: '+40 XP' },
          ],
          failure: [
            { type: 'message', message: 'ICE catches you mid-hack. Neural feedback slams into you.' },
            { type: 'health', value: -15, message: 'Lost 15 HP from ICE feedback.' },
            { type: 'reputation', target: 'megacorp', value: -5, message: 'Corpo reputation decreased.' },
          ],
        },
      },
      {
        id: 'decline', text: 'Decline - too risky',
        outcomes: {
          success: [
            { type: 'message', message: 'You delete the message. Wise choice, probably.' },
          ],
        },
      },
    ],
  },
  {
    id: 'cyberpsycho_sighting', title: 'Cyberpsycho Alert', category: 'random_encounter',
    description: 'Sirens wail as an NCPD drone broadcasts a warning: Cyberpsycho spotted in the area. Most people are running. You could too... or you could try to take it down for the bounty.',
    conditions: [{ type: 'level', target: '', operator: '>=', value: 3 }],
    weight: 4, repeatable: true, cooldownDays: 7,
    choices: [
      {
        id: 'engage', text: 'Engage the cyberpsycho',
        skillCheck: { skill: 'combat', difficulty: 18 },
        outcomes: {
          success: [
            { type: 'message', message: 'After a brutal fight, the cyberpsycho goes down. NCPD arrives and pays the bounty.' },
            { type: 'credits', value: 1000, message: 'Bounty: ¥1000!' },
            { type: 'experience', value: 80, message: '+80 XP' },
            { type: 'reputation', target: 'ncpd', value: 15, message: 'NCPD reputation greatly improved.' },
          ],
          failure: [
            { type: 'message', message: 'The cyberpsycho is too much. You barely escape with your life.' },
            { type: 'health', value: -40, message: 'Lost 40 HP!' },
          ],
        },
      },
      {
        id: 'hack', text: 'Try to hack their implants',
        skillCheck: { skill: 'hacking', difficulty: 20 },
        outcomes: {
          success: [
            { type: 'message', message: 'You breach their neural implant and shut them down remotely. Impressive.' },
            { type: 'credits', value: 1200, message: 'Bounty + tech bonus: ¥1200!' },
            { type: 'experience', value: 100, message: '+100 XP' },
            { type: 'reputation', target: 'ncpd', value: 20, message: 'NCPD reputation greatly improved.' },
          ],
          failure: [
            { type: 'message', message: 'The hack bounces. The cyberpsycho turns toward you...' },
            { type: 'health', value: -30, message: 'Lost 30 HP from the counterattack!' },
          ],
        },
      },
      {
        id: 'flee', text: 'Get to safety',
        outcomes: {
          success: [
            { type: 'message', message: 'You join the crowd fleeing the area. Live to fight another day.' },
          ],
        },
      },
    ],
  },
  {
    id: 'lucky_find', title: 'Lucky Find', category: 'random_encounter',
    description: 'While walking through the district, you notice a loose panel in the wall. Something glints behind it.',
    conditions: [], weight: 5, repeatable: true, cooldownDays: 6,
    choices: [
      {
        id: 'investigate', text: 'Investigate',
        statCheck: { stat: 'luck', difficulty: 10 },
        outcomes: {
          success: [
            { type: 'message', message: 'Hidden stash! Someone\'s rainy-day fund.' },
            { type: 'credits', value: 250, message: 'Found ¥250!' },
            { type: 'item', target: 'stim_pack', value: 1, message: 'Found a Stim Pack!' },
          ],
          failure: [
            { type: 'message', message: 'It\'s a trap! A small explosive goes off.' },
            { type: 'health', value: -10, message: 'Lost 10 HP from the explosion.' },
          ],
        },
      },
      {
        id: 'leave', text: 'Don\'t touch it',
        outcomes: {
          success: [
            { type: 'message', message: 'You leave it alone. Could\'ve been anything in there.' },
          ],
        },
      },
    ],
  },
  // --- Faction Events ---
  {
    id: 'faction_ally_aid', title: 'A Friend on the Street', category: 'faction',
    description: 'A figure in faction colors flags you down. "Hey, you\'re that runner, right? Our people told us to look out for you. We\'ve got something that might help."',
    conditions: [], // Dynamically gated by faction standing (Friendly+) in event system
    weight: 6, repeatable: true, cooldownDays: 5,
    choices: [
      {
        id: 'accept', text: 'Accept their help',
        outcomes: {
          success: [
            { type: 'health', value: 20, message: 'They patch you up. +20 HP.' },
            { type: 'credits', value: 150, message: 'They slip you ¥150 for the road.' },
            { type: 'message', message: '"Stay safe out there, choom. The family looks after its own."' },
          ],
        },
      },
      {
        id: 'info', text: 'Ask for intel instead',
        outcomes: {
          success: [
            { type: 'experience', value: 30, message: '+30 XP from faction intel.' },
            { type: 'skill', target: 'streetwise', value: 2, message: 'Streetwise +2' },
            { type: 'message', message: 'They share details about upcoming jobs and danger zones. Valuable information.' },
          ],
        },
      },
      {
        id: 'decline', text: 'Thanks, but I work alone.',
        outcomes: {
          success: [
            { type: 'message', message: 'They shrug and melt back into the crowd. The offer stands.' },
          ],
        },
      },
    ],
  },
  {
    id: 'faction_territory_tax', title: 'Territory Tax', category: 'faction',
    description: 'A group of armed gang members blocks your path. Their leader steps forward, eyes cold. "You\'re on our turf. Uninvited. There\'s a cost for that."',
    conditions: [], // Dynamically gated by faction standing (Hostile-) in game loop
    weight: 8, repeatable: true, cooldownDays: 3,
    choices: [
      {
        id: 'pay', text: 'Pay the tax (¥200)',
        outcomes: {
          success: [
            { type: 'credits', value: -200, message: 'Paid ¥200 "protection tax."' },
            { type: 'message', message: 'The leader pockets the creds. "Smart. Now get moving." They let you pass.' },
          ],
        },
      },
      {
        id: 'fight', text: 'Fight your way through',
        skillCheck: { skill: 'combat', difficulty: 16 },
        outcomes: {
          success: [
            { type: 'message', message: 'You put them down hard. Word will spread — this runner doesn\'t pay tax.' },
            { type: 'experience', value: 40, message: '+40 XP' },
            { type: 'credits', value: 100, message: 'Looted ¥100 from the shakedown crew.' },
            { type: 'street_cred', value: 3, message: 'Street Cred +3' },
          ],
          failure: [
            { type: 'health', value: -25, message: 'They beat you down. -25 HP.' },
            { type: 'credits', value: -300, message: 'They take ¥300 for your trouble.' },
            { type: 'message', message: '"Should\'ve paid when you had the chance."' },
          ],
        },
      },
      {
        id: 'talk', text: 'Talk your way out',
        skillCheck: { skill: 'persuasion', difficulty: 15 },
        outcomes: {
          success: [
            { type: 'message', message: 'You convince them you\'re more useful as an ally than a cash cow. They back off.' },
            { type: 'experience', value: 25, message: '+25 XP' },
          ],
          failure: [
            { type: 'credits', value: -200, message: 'Your words fail. They take ¥200 anyway.' },
            { type: 'message', message: '"Nice try. Pay up."' },
          ],
        },
      },
    ],
  },
  {
    id: 'faction_exclusive_job', title: 'Faction Contract', category: 'faction',
    description: 'Your comm buzzes with a priority message: "We have a job that requires someone we trust. The pay is exceptional, but this stays between us. Are you in?"',
    conditions: [], // Dynamically gated by faction standing (Allied) in event system
    weight: 5, repeatable: true, cooldownDays: 7,
    choices: [
      {
        id: 'accept', text: 'Accept the contract',
        skillCheck: { skill: 'streetwise', difficulty: 14 },
        outcomes: {
          success: [
            { type: 'credits', value: 2000, message: 'Job complete. Earned ¥2000!' },
            { type: 'experience', value: 80, message: '+80 XP' },
            { type: 'street_cred', value: 8, message: 'Street Cred +8' },
            { type: 'message', message: '"Clean work. We\'ll be in touch for more."' },
          ],
          failure: [
            { type: 'credits', value: 500, message: 'Partial success. Earned ¥500.' },
            { type: 'experience', value: 30, message: '+30 XP' },
            { type: 'message', message: '"Not your best work. We\'ll give you another chance."' },
          ],
        },
      },
      {
        id: 'negotiate', text: 'Negotiate for better terms',
        skillCheck: { skill: 'persuasion', difficulty: 16 },
        outcomes: {
          success: [
            { type: 'credits', value: 3000, message: 'Negotiated premium rate: ¥3000!' },
            { type: 'experience', value: 80, message: '+80 XP' },
            { type: 'street_cred', value: 10, message: 'Street Cred +10' },
            { type: 'message', message: '"You drive a hard bargain. But you\'re worth it."' },
          ],
          failure: [
            { type: 'message', message: '"Take it or leave it." The offer stands at standard rate.' },
            { type: 'credits', value: 2000, message: 'Earned ¥2000.' },
            { type: 'experience', value: 60, message: '+60 XP' },
          ],
        },
      },
      {
        id: 'decline', text: 'Not right now',
        outcomes: {
          success: [
            { type: 'message', message: '"Understood. The offer doesn\'t last forever, but we respect your choice."' },
          ],
        },
      },
    ],
  },
  {
    id: 'faction_power_play', title: 'Power Play', category: 'faction',
    description: 'Two factions are about to clash over a disputed weapons cache. Both sides have made it clear: you can tip the balance. The question is — whose side are you on?',
    conditions: [{ type: 'street_cred', target: '', operator: '>=', value: 40 }],
    weight: 4, repeatable: true, cooldownDays: 10,
    choices: [
      {
        id: 'side_a', text: 'Help the controlling faction',
        skillCheck: { skill: 'combat', difficulty: 15 },
        outcomes: {
          success: [
            { type: 'credits', value: 800, message: 'Earned ¥800 for your loyalty.' },
            { type: 'experience', value: 50, message: '+50 XP' },
            { type: 'street_cred', value: 5, message: 'Street Cred +5' },
            { type: 'message', message: 'The controlling faction wins. They remember your contribution.' },
          ],
          failure: [
            { type: 'health', value: -20, message: 'The fight was brutal. -20 HP.' },
            { type: 'experience', value: 20, message: '+20 XP' },
            { type: 'message', message: 'You held the line, barely. But the effort was noticed.' },
          ],
        },
      },
      {
        id: 'side_b', text: 'Help the rival faction',
        skillCheck: { skill: 'combat', difficulty: 15 },
        outcomes: {
          success: [
            { type: 'credits', value: 1000, message: 'Earned ¥1000 from the rival faction.' },
            { type: 'experience', value: 50, message: '+50 XP' },
            { type: 'street_cred', value: 5, message: 'Street Cred +5' },
            { type: 'message', message: 'The rivals win the cache. Your name is known to them now.' },
          ],
          failure: [
            { type: 'health', value: -20, message: 'The fight didn\'t go as planned. -20 HP.' },
            { type: 'experience', value: 20, message: '+20 XP' },
            { type: 'message', message: 'You fought, but the rivals still lost. At least you tried.' },
          ],
        },
      },
      {
        id: 'play_both', text: 'Play both sides',
        skillCheck: { skill: 'persuasion', difficulty: 18 },
        outcomes: {
          success: [
            { type: 'credits', value: 1500, message: 'Collected from both sides: ¥1500!' },
            { type: 'experience', value: 60, message: '+60 XP' },
            { type: 'street_cred', value: 8, message: 'Street Cred +8' },
            { type: 'message', message: 'You sold information to both sides and walked away richer. Risky, but brilliant.' },
          ],
          failure: [
            { type: 'health', value: -15, message: 'Both sides figured it out. -15 HP.' },
            { type: 'credits', value: -300, message: 'Lost ¥300 fleeing the fallout.' },
            { type: 'message', message: 'Playing both sides backfired. Hard.' },
          ],
        },
      },
      {
        id: 'stay_out', text: 'Stay out of it',
        outcomes: {
          success: [
            { type: 'message', message: 'You watch from a distance as the factions clash. Smart to stay neutral. This time.' },
          ],
        },
      },
    ],
  },
  {
    id: 'corpo_drone', title: 'Corporate Drone Crash', category: 'random_encounter',
    description: 'A Kenzaki delivery drone sparks and crashes at your feet. Its cargo bay pops open, spilling packages on the ground. Alarms start blaring.',
    conditions: [], weight: 5, repeatable: true, cooldownDays: 5,
    choices: [
      {
        id: 'grab_run', text: 'Grab what you can and run',
        skillCheck: { skill: 'stealth', difficulty: 13 },
        outcomes: {
          success: [
            { type: 'message', message: 'You snag a package and disappear before security arrives.' },
            { type: 'credits', value: 400, message: 'Package contents worth ¥400!' },
            { type: 'reputation', target: 'megacorp', value: -5, message: 'Kenzaki reputation slightly decreased.' },
          ],
          failure: [
            { type: 'message', message: 'A security drone spots you. Tagged and fined.' },
            { type: 'credits', value: -200, message: 'Fined ¥200 by Kenzaki Corp.' },
            { type: 'reputation', target: 'megacorp', value: -10, message: 'Kenzaki reputation decreased.' },
          ],
        },
      },
      {
        id: 'salvage_tech', text: 'Salvage the drone\'s tech',
        skillCheck: { skill: 'engineering', difficulty: 14 },
        outcomes: {
          success: [
            { type: 'message', message: 'You strip some valuable components from the drone.' },
            { type: 'item', target: 'scrap_metal', value: 3, message: 'Salvaged 3 Scrap Metal.' },
            { type: 'experience', value: 20, message: '+20 XP' },
          ],
          failure: [
            { type: 'message', message: 'The drone\'s self-destruct triggers. You jump back just in time.' },
            { type: 'health', value: -8, message: 'Minor burns: -8 HP.' },
          ],
        },
      },
      {
        id: 'report', text: 'Report it to Kenzaki',
        outcomes: {
          success: [
            { type: 'message', message: 'Kenzaki security arrives and thanks you. A small reward for your honesty.' },
            { type: 'credits', value: 100, message: 'Received ¥100 reward.' },
            { type: 'reputation', target: 'megacorp', value: 10, message: 'Kenzaki reputation improved.' },
          ],
        },
      },
    ],
  },
];

export function getEligibleEvents(state: import('../types').GameState): GameEvent[] {
  return EVENTS.filter(event => {
    // Check cooldown
    if (state.eventCooldowns[event.id] && state.currentDay < state.eventCooldowns[event.id]) {
      return false;
    }

    // Check if already completed and not repeatable
    if (!event.repeatable && state.completedEventIds.includes(event.id)) {
      return false;
    }

    // Check conditions
    for (const cond of event.conditions) {
      if (!checkEventCondition(state, cond)) {
        return false;
      }
    }

    // Faction events have dynamic standing gates
    if (event.category === 'faction') {
      if (!checkFactionEventEligibility(state, event.id)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Gate faction events by the player's standing with the controlling faction
 * in their current district.
 */
function checkFactionEventEligibility(state: import('../types').GameState, eventId: string): boolean {
  const district = getDistrict(state.character.currentDistrict);
  if (!district?.controllingFaction) return false;

  const faction = getFaction(district.controllingFaction);
  if (!faction) return false;

  const rep = state.character.reputation[faction.id] ?? 0;
  const standing = getFactionStanding(rep, faction);

  switch (eventId) {
    case 'faction_ally_aid':
      return standing === 'Friendly' || standing === 'Allied';
    case 'faction_territory_tax':
      return standing === 'Hostile' || standing === 'Enemy';
    case 'faction_exclusive_job':
      return standing === 'Allied';
    case 'faction_power_play':
      return true; // Uses its own conditions, available in any faction territory
    default:
      return true;
  }
}

function checkEventCondition(state: import('../types').GameState, cond: import('../types').EventCondition): boolean {
  const char = state.character;
  let actual: number;

  switch (cond.type) {
    case 'level':
      actual = char.level;
      break;
    case 'skill':
      actual = char.skills[cond.target as keyof typeof char.skills] ?? 0;
      break;
    case 'stat':
      actual = char.stats[cond.target as keyof typeof char.stats] ?? 0;
      break;
    case 'reputation':
      actual = char.reputation[cond.target] ?? 0;
      break;
    case 'credits':
      actual = char.credits;
      break;
    case 'day':
      actual = state.currentDay;
      break;
    case 'street_cred':
      actual = state.progression?.streetCred ?? 0;
      break;
    default:
      return true;
  }

  const expected = Number(cond.value);
  switch (cond.operator) {
    case '>=': return actual >= expected;
    case '<=': return actual <= expected;
    case '==': return actual === expected;
    case '!=': return actual !== expected;
    case '>': return actual > expected;
    case '<': return actual < expected;
    default: return true;
  }
}
