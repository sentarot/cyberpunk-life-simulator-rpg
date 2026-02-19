import { GameEvent } from '../types';

/**
 * Milestone events form the narrative backbone of the game.
 * They trigger based on street cred thresholds and tell a
 * cohesive story of rising from nobody to legend.
 *
 * Act 1: SURVIVAL (Nobody -> Prospect)
 *   You're nobody. The city doesn't care if you live or die.
 *
 * Act 2: RISE (Operator -> Player -> Veteran)
 *   You're someone. That means you're also a target.
 *
 * Act 3: LEGACY (Elite -> Legend)
 *   You're a legend. The question is what kind.
 */
export const MILESTONES: GameEvent[] = [
  // ═══════════════════════════════════════════
  // ACT 1: SURVIVAL
  // ═══════════════════════════════════════════
  {
    id: 'milestone_first_blood',
    title: 'First Blood',
    category: 'milestone',
    description: 'A grizzled woman in a long coat finds you after a job. She looks you over with eyes that have seen a thousand runners come and go. "Someone told me you handled yourself out there. Most new blood doesn\'t last a week. You\'ve got something. I don\'t know what yet, but I might be able to use it."',
    conditions: [{ type: 'street_cred', target: '', operator: '>=', value: 5 }],
    weight: 100,
    repeatable: false,
    cooldownDays: 0,
    choices: [
      {
        id: 'ready',
        text: '"I\'m ready for real work."',
        outcomes: {
          success: [
            { type: 'experience', value: 30, message: '+30 XP' },
            { type: 'contact', target: 'fixer_jin', message: 'The fixer slides you a comm number.' },
            { type: 'street_cred', value: 3, message: 'Street Cred +3' },
            { type: 'message', message: 'She nods slowly. "We\'ll see. I\'ll be in touch." She vanishes into the crowd.' },
          ],
        },
      },
      {
        id: 'independent',
        text: '"I don\'t work for anyone."',
        outcomes: {
          success: [
            { type: 'experience', value: 20, message: '+20 XP' },
            { type: 'skill', target: 'streetwise', value: 3, message: 'Streetwise +3' },
            { type: 'street_cred', value: 2, message: 'Street Cred +2' },
            { type: 'message', message: 'She smirks. "That\'s what they all say. But everyone works for someone in this city. Remember that."' },
          ],
        },
      },
    ],
  },

  {
    id: 'milestone_street_name',
    title: 'A Name on the Street',
    category: 'milestone',
    description: 'You step into a bar and the room shifts. Just for a second. A few people glance your way. The bartender pours your drink before you order it. Someone mutters your name — not your real name, the one they gave you. The one earned in blood and neon. For the first time, you exist in this city.',
    conditions: [{ type: 'street_cred', target: '', operator: '>=', value: 25 }],
    weight: 100,
    repeatable: false,
    cooldownDays: 0,
    choices: [
      {
        id: 'embrace',
        text: '"This is who I am now." Embrace the reputation.',
        outcomes: {
          success: [
            { type: 'experience', value: 50, message: '+50 XP' },
            { type: 'trait', target: 'Street Name', message: 'Trait gained: Street Name' },
            { type: 'street_cred', value: 5, message: 'Street Cred +5' },
            { type: 'credits', value: 200, message: 'A stranger buys your drink and slides over ¥200. "For the road, choom."' },
            { type: 'message', message: 'You drink it slow. The city knows your name. That\'s a weapon and a target, both at once.' },
          ],
        },
      },
      {
        id: 'humble',
        text: '"Reputation gets you killed." Stay low.',
        outcomes: {
          success: [
            { type: 'experience', value: 40, message: '+40 XP' },
            { type: 'skill', target: 'stealth', value: 5, message: 'Stealth +5' },
            { type: 'street_cred', value: 3, message: 'Street Cred +3' },
            { type: 'trait', target: 'Ghost Protocol', message: 'Trait gained: Ghost Protocol' },
            { type: 'message', message: 'You finish the drink and slip out the back. Better to be underestimated. That\'s how you survive.' },
          ],
        },
      },
    ],
  },

  // ═══════════════════════════════════════════
  // ACT 2: RISE
  // ═══════════════════════════════════════════
  {
    id: 'milestone_crossroads',
    title: 'Crossroads',
    category: 'milestone',
    description: 'You\'ve risen far enough that the powers in this city have taken notice. A corpo suit in a black car pulls up beside you on the street. "My employer would like a word." Before you can respond, your comm buzzes with a coded message from the underground: "We need to talk. Tonight." The city is pulling you in two directions. Or maybe you pull yourself.',
    conditions: [{ type: 'street_cred', target: '', operator: '>=', value: 50 }],
    weight: 100,
    repeatable: false,
    cooldownDays: 0,
    choices: [
      {
        id: 'corpo',
        text: 'Get in the car. Meet the corpo.',
        outcomes: {
          success: [
            { type: 'reputation', target: 'megacorp', value: 15, message: 'Kenzaki Megacorp reputation improved.' },
            { type: 'credits', value: 1000, message: 'They offer ¥1000 as a "gesture of goodwill."' },
            { type: 'street_cred', value: 8, message: 'Street Cred +8' },
            { type: 'trait', target: 'Corporate Contact', message: 'Trait gained: Corporate Contact' },
            { type: 'message', message: 'The executive studies you from behind tinted lenses. "You\'re useful. Keep being useful, and doors will open. Fail us, and... well." The threat hangs in the climate-controlled air.' },
          ],
        },
      },
      {
        id: 'underground',
        text: 'Answer the underground signal.',
        outcomes: {
          success: [
            { type: 'reputation', target: 'voodoo_boys', value: 15, message: 'Voodoo Boys reputation improved.' },
            { type: 'skill', target: 'hacking', value: 5, message: 'Hacking +5' },
            { type: 'street_cred', value: 8, message: 'Street Cred +8' },
            { type: 'trait', target: 'Underground Connection', message: 'Trait gained: Underground Connection' },
            { type: 'message', message: 'In a flooded basement, a face materializes on a cracked screen. "The corpos see you as a tool. We see you as one of us. The Net remembers everything — let us show you what it knows."' },
          ],
        },
      },
      {
        id: 'independent',
        text: 'Ignore both. Walk your own path.',
        outcomes: {
          success: [
            { type: 'stat', target: 'cool', value: 1, message: 'Cool +1' },
            { type: 'skill', target: 'streetwise', value: 5, message: 'Streetwise +5' },
            { type: 'street_cred', value: 10, message: 'Street Cred +10' },
            { type: 'trait', target: 'Lone Wolf', message: 'Trait gained: Lone Wolf' },
            { type: 'message', message: 'You walk past the car without a glance. Delete the message without reading it. This city wants to own you — every faction, every fixer, every corpo with a checkbook. Not today. Not ever.' },
          ],
        },
      },
    ],
  },

  {
    id: 'milestone_rival',
    title: 'Shadow of Yourself',
    category: 'milestone',
    description: 'The name "Sable" keeps surfacing in every bar, every fixer\'s comm, every job board. A merc who appeared out of nowhere, rising fast — taking your gigs, undercutting your prices, talking trash to every contact you have. Tonight, across a crowded room full of smoke and neon, you lock eyes. Sable raises a glass in mock salute. This was always going to happen.',
    conditions: [{ type: 'street_cred', target: '', operator: '>=', value: 75 }],
    weight: 100,
    repeatable: false,
    cooldownDays: 0,
    choices: [
      {
        id: 'confront',
        text: 'Cross the room. End this now.',
        skillCheck: { skill: 'combat', difficulty: 18 },
        outcomes: {
          success: [
            { type: 'experience', value: 100, message: '+100 XP' },
            { type: 'street_cred', value: 15, message: 'Street Cred +15' },
            { type: 'credits', value: 500, message: 'Looted ¥500 from Sable\'s pockets.' },
            { type: 'message', message: 'The fight is brutal and public. Tables shatter. The crowd backs away. When it\'s over, Sable is on the floor, and every eye in the room is on you. Your name just got louder.' },
          ],
          failure: [
            { type: 'health', value: -30, message: 'Sable is faster than you expected. -30 HP.' },
            { type: 'street_cred', value: 5, message: 'Street Cred +5 (you stood your ground)' },
            { type: 'message', message: 'Sable catches you with a hidden blade. "Not bad. But not good enough." They vanish into the crowd. This isn\'t over.' },
          ],
        },
      },
      {
        id: 'outplay',
        text: 'Play it smart. Undermine them politically.',
        skillCheck: { skill: 'persuasion', difficulty: 16 },
        outcomes: {
          success: [
            { type: 'experience', value: 80, message: '+80 XP' },
            { type: 'street_cred', value: 12, message: 'Street Cred +12' },
            { type: 'skill', target: 'persuasion', value: 3, message: 'Persuasion +3' },
            { type: 'message', message: 'Over the next few days, you call in favors, spread truths that are worse than lies, and cut Sable off from every fixer in the city. By week\'s end, they can\'t get a gig mopping floors. The streets have a new king.' },
          ],
          failure: [
            { type: 'reputation', target: 'ncpd', value: -10, message: 'Your scheming attracted NCPD attention.' },
            { type: 'street_cred', value: 3, message: 'Street Cred +3' },
            { type: 'message', message: 'Sable sees your play coming and turns it around. Some of your contacts go cold. You\'ll recover, but it stings.' },
          ],
        },
      },
      {
        id: 'befriend',
        text: 'Buy them a drink. Turn a rival into an ally.',
        skillCheck: { skill: 'streetwise', difficulty: 15 },
        outcomes: {
          success: [
            { type: 'experience', value: 60, message: '+60 XP' },
            { type: 'street_cred', value: 8, message: 'Street Cred +8' },
            { type: 'contact', target: 'rival_sable', message: 'Sable added as a contact.' },
            { type: 'trait', target: 'Former Rival', message: 'Trait gained: Former Rival' },
            { type: 'message', message: 'Sable eyes the drink, then laughs. "You\'re either smart or crazy." An hour and three bottles later, you have a new ally. The city\'s big enough for both of you — barely.' },
          ],
          failure: [
            { type: 'credits', value: -200, message: 'Lost ¥200 buying drinks for nothing.' },
            { type: 'street_cred', value: 2, message: 'Street Cred +2' },
            { type: 'message', message: 'Sable takes the drink, toasts to your health, and walks out. "Nice try. But I don\'t make friends." At least it didn\'t get violent.' },
          ],
        },
      },
    ],
  },

  {
    id: 'milestone_point_of_no_return',
    title: 'Point of No Return',
    category: 'milestone',
    description: 'Your screen flickers on by itself at 3am. A distorted voice speaks through speakers that should be off: "Impressive climb, runner. From nothing to... this. I\'ve been watching since the beginning. I see potential — the kind this city grinds to dust. I can change that. I can make you untouchable. All I need... is your loyalty." The line goes dead. A location pulses on your HUD.',
    conditions: [{ type: 'street_cred', target: '', operator: '>=', value: 100 }],
    weight: 100,
    repeatable: false,
    cooldownDays: 0,
    choices: [
      {
        id: 'go',
        text: 'Go to the meeting. Hear them out.',
        outcomes: {
          success: [
            { type: 'street_cred', value: 15, message: 'Street Cred +15' },
            { type: 'credits', value: 2000, message: 'A briefcase with ¥2000 waits at the location.' },
            { type: 'experience', value: 100, message: '+100 XP' },
            { type: 'trait', target: 'Shadow Alliance', message: 'Trait gained: Shadow Alliance' },
            { type: 'message', message: 'The meeting happens on a rooftop above the city. No face, just a voice from a drone: "Consider this an advance. The real payment comes later. You\'ll know what to do when the time comes." The drone disappears into the rain.' },
          ],
        },
      },
      {
        id: 'trace',
        text: 'Trace the signal. Find out who they are.',
        skillCheck: { skill: 'hacking', difficulty: 20 },
        outcomes: {
          success: [
            { type: 'street_cred', value: 12, message: 'Street Cred +12' },
            { type: 'experience', value: 120, message: '+120 XP' },
            { type: 'skill', target: 'hacking', value: 5, message: 'Hacking +5' },
            { type: 'trait', target: 'Signal Traced', message: 'Trait gained: Signal Traced' },
            { type: 'message', message: 'The trace bounces through seventeen proxies across three continents before landing on a server buried inside Kenzaki Tower\'s basement. Someone very powerful — or something — is pulling strings from the heart of the megacorp. This changes everything.' },
          ],
          failure: [
            { type: 'health', value: -15, message: 'ICE feedback: -15 HP.' },
            { type: 'street_cred', value: 5, message: 'Street Cred +5' },
            { type: 'message', message: 'The trace hits a wall of military-grade ICE. Whoever this is, they don\'t want to be found. The signal dies, leaving you with more questions and a splitting headache.' },
          ],
        },
      },
      {
        id: 'reject',
        text: 'Delete the message. Trust no one.',
        outcomes: {
          success: [
            { type: 'humanity', value: 3, message: 'Humanity +3. You hold onto yourself.' },
            { type: 'street_cred', value: 8, message: 'Street Cred +8' },
            { type: 'experience', value: 60, message: '+60 XP' },
            { type: 'trait', target: 'Uncompromised', message: 'Trait gained: Uncompromised' },
            { type: 'message', message: 'You wipe the message, then wipe the comm. Then you sit in the dark for a long time, thinking about all the runners who took offers like this. None of them ended well. You\'ll make your own way.' },
          ],
        },
      },
    ],
  },

  {
    id: 'milestone_betrayal',
    title: 'The Price of Trust',
    category: 'milestone',
    description: 'The job was clean. Simple extraction, easy money. That\'s what they told you. But when you arrived, the lights were already on, the doors were locked, and a kill team was waiting. You barely escaped with your life, bleeding through the rain-slicked streets. Someone you trusted set this up. Someone who knew your patterns, your safe routes, your timing. And now, stumbling into a safe house with a bullet wound and a burning need for answers, one thing is crystalline clear: this is personal.',
    conditions: [{ type: 'street_cred', target: '', operator: '>=', value: 150 }],
    weight: 100,
    repeatable: false,
    cooldownDays: 0,
    choices: [
      {
        id: 'hunt',
        text: 'Hunt them down. No mercy.',
        skillCheck: { skill: 'combat', difficulty: 20 },
        outcomes: {
          success: [
            { type: 'experience', value: 150, message: '+150 XP' },
            { type: 'street_cred', value: 20, message: 'Street Cred +20' },
            { type: 'credits', value: 1500, message: 'Recovered ¥1500 from the traitor.' },
            { type: 'trait', target: 'Blood Debt Paid', message: 'Trait gained: Blood Debt Paid' },
            { type: 'message', message: 'It takes three days. You don\'t sleep. You follow every lead, kick in every door, burn every bridge until you find them. The confrontation is brief and final. Word spreads fast: cross this runner, and there\'s nowhere to hide.' },
          ],
          failure: [
            { type: 'health', value: -25, message: 'The hunt goes badly. -25 HP.' },
            { type: 'street_cred', value: 10, message: 'Street Cred +10 (you survived)' },
            { type: 'message', message: 'You find them, but they were ready. Another ambush, another scar. You escape, barely. The traitor vanishes into the underground, but at least they know you\'re coming. They\'ll never sleep easy again.' },
          ],
        },
      },
      {
        id: 'disappear',
        text: 'Disappear. Go dark. Rebuild from nothing.',
        skillCheck: { skill: 'stealth', difficulty: 18 },
        outcomes: {
          success: [
            { type: 'experience', value: 100, message: '+100 XP' },
            { type: 'street_cred', value: 15, message: 'Street Cred +15' },
            { type: 'skill', target: 'stealth', value: 5, message: 'Stealth +5' },
            { type: 'trait', target: 'Risen from Ashes', message: 'Trait gained: Risen from Ashes' },
            { type: 'message', message: 'You become a ghost. New comm, new safe house, new routes. For two weeks, you don\'t exist. When you resurface, you\'re sharper, harder, and the traitor has moved on to easier prey. You\'re nobody\'s victim.' },
          ],
          failure: [
            { type: 'credits', value: -500, message: 'Going dark is expensive. -¥500.' },
            { type: 'street_cred', value: 8, message: 'Street Cred +8' },
            { type: 'message', message: 'You try to vanish, but this city has too many eyes. Someone recognizes you. Word gets out. You relocate again, poorer but alive. The shadows aren\'t as welcoming as they used to be.' },
          ],
        },
      },
      {
        id: 'connected',
        text: 'Call in every favor you have. Fight this with connections.',
        skillCheck: { skill: 'streetwise', difficulty: 18 },
        outcomes: {
          success: [
            { type: 'experience', value: 120, message: '+120 XP' },
            { type: 'street_cred', value: 18, message: 'Street Cred +18' },
            { type: 'reputation', target: 'ncpd', value: 10, message: 'NCPD reputation improved.' },
            { type: 'trait', target: 'Web of Allies', message: 'Trait gained: Web of Allies' },
            { type: 'message', message: 'You make calls. A lot of calls. Fixers, bartenders, ripperdocs, even a cop who owes you. The network closes in on the traitor like a noose. By week\'s end, they\'re blacklisted from every job in the city. Nobody betrays someone this connected.' },
          ],
          failure: [
            { type: 'reputation', target: 'tyger_claws', value: -10, message: 'Some favors come with strings. Tyger Claws rep decreased.' },
            { type: 'street_cred', value: 8, message: 'Street Cred +8' },
            { type: 'message', message: 'You call in favors, but some debts cut both ways. The traitor goes quiet, but you\'ve made promises you\'ll need to keep. Nothing is free in this city.' },
          ],
        },
      },
    ],
  },

  // ═══════════════════════════════════════════
  // ACT 3: LEGACY
  // ═══════════════════════════════════════════
  {
    id: 'milestone_the_score',
    title: 'The Score',
    category: 'milestone',
    description: 'They call it the Prometheus Job. A data vault buried beneath Kenzaki Tower holding secrets worth more than most nations\' GDP. AI research. Blackmail on every politician in the pacific rim. The real names behind the Blackwall. No one has ever cracked it. Three different factions want it done — for three very different reasons. They all want you. This is it. The one that makes or breaks a legend.',
    conditions: [{ type: 'street_cred', target: '', operator: '>=', value: 200 }],
    weight: 100,
    repeatable: false,
    cooldownDays: 0,
    choices: [
      {
        id: 'plan',
        text: 'Plan it carefully. Leave nothing to chance.',
        statCheck: { stat: 'intelligence', difficulty: 18 },
        outcomes: {
          success: [
            { type: 'experience', value: 250, message: '+250 XP' },
            { type: 'street_cred', value: 30, message: 'Street Cred +30' },
            { type: 'credits', value: 8000, message: 'The data is worth ¥8000 on the open market.' },
            { type: 'trait', target: 'Prometheus', message: 'Trait gained: Prometheus' },
            { type: 'message', message: 'Three weeks of planning. Every guard rotation mapped. Every ICE wall catalogued. When you move, it\'s like water through cracks. In and out in eleven minutes. The data hits the market by morning. By evening, the world has changed — and everyone knows who did it.' },
          ],
          failure: [
            { type: 'health', value: -35, message: 'The plan had a gap. -35 HP.' },
            { type: 'credits', value: 3000, message: 'Partial data recovered: ¥3000.' },
            { type: 'street_cred', value: 15, message: 'Street Cred +15 (you attempted the impossible)' },
            { type: 'message', message: 'Close. So close. But one variable you didn\'t account for — an AI watchdog that wasn\'t in any blueprint. You get out with partial data and a near-death experience. Not the legend you wanted, but legends are built on attempts too.' },
          ],
        },
      },
      {
        id: 'blitz',
        text: 'Hit it fast and hard. Shock and awe.',
        skillCheck: { skill: 'combat', difficulty: 22 },
        outcomes: {
          success: [
            { type: 'experience', value: 300, message: '+300 XP' },
            { type: 'street_cred', value: 35, message: 'Street Cred +35' },
            { type: 'credits', value: 6000, message: 'Grabbed ¥6000 worth of assets in the chaos.' },
            { type: 'trait', target: 'Battering Ram', message: 'Trait gained: Battering Ram' },
            { type: 'message', message: 'You go in loud. Explosions. Gunfire. A trail of unconscious guards and smoking security drones. It\'s ugly, brutal, and undeniably effective. The data vault cracks under brute force. Alarms scream. You\'re gone before backup arrives. The footage leaks online. They\'ll be telling this story for decades.' },
          ],
          failure: [
            { type: 'health', value: -50, message: 'The security was overwhelming. -50 HP.' },
            { type: 'credits', value: 1000, message: 'Escaped with scraps: ¥1000.' },
            { type: 'street_cred', value: 12, message: 'Street Cred +12 (the attempt alone is legendary)' },
            { type: 'message', message: 'The firepower was more than you bargained for. A mech. An actual mech. You retreat through a wall of bullets and barely make it out. The data\'s still in there. But the attempt? That\'s already a story worth telling.' },
          ],
        },
      },
      {
        id: 'play_sides',
        text: 'Play the factions against each other. Let them do the work.',
        skillCheck: { skill: 'persuasion', difficulty: 22 },
        outcomes: {
          success: [
            { type: 'experience', value: 200, message: '+200 XP' },
            { type: 'street_cred', value: 40, message: 'Street Cred +40' },
            { type: 'credits', value: 10000, message: 'Triple-crossed everyone. ¥10000 from all three factions.' },
            { type: 'trait', target: 'Puppet Master', message: 'Trait gained: Puppet Master' },
            { type: 'message', message: 'You sell the same plan to three factions, each believing they\'re the exclusive client. On the night of the heist, they all send teams — and while they fight each other in Kenzaki\'s lobby, you walk in through the service entrance. By morning, you have the data, and three factions each think the others betrayed them. Masterful.' },
          ],
          failure: [
            { type: 'health', value: -20, message: 'One faction saw through you. -20 HP.' },
            { type: 'reputation', target: 'megacorp', value: -20, message: 'Kenzaki is furious. Rep devastated.' },
            { type: 'street_cred', value: 10, message: 'Street Cred +10' },
            { type: 'message', message: 'Almost worked. But one faction had an inside source and saw the triple-cross coming. The heist falls apart. You escape the crossfire, but bridges are burning and some of them were load-bearing.' },
          ],
        },
      },
      {
        id: 'walk_away',
        text: 'Walk away. Some things aren\'t worth it.',
        outcomes: {
          success: [
            { type: 'humanity', value: 5, message: 'Humanity +5. You choose who you are.' },
            { type: 'street_cred', value: 5, message: 'Street Cred +5' },
            { type: 'experience', value: 50, message: '+50 XP' },
            { type: 'trait', target: 'Walked Away', message: 'Trait gained: Walked Away' },
            { type: 'message', message: 'Everyone thinks you\'re crazy. "The biggest job in history and you just... pass?" But you\'ve seen what this city does to people who reach too far. You\'re alive. You\'re free. And sometimes, that\'s the most legendary choice of all.' },
          ],
        },
      },
    ],
  },

  {
    id: 'milestone_legend',
    title: 'Legend',
    category: 'milestone',
    description: 'There are no more jobs. No more climbing. The fixers don\'t call you anymore — they call about you. Your name is a currency. Your reputation is a force of nature. You stand on the highest rooftop in Neo-Tokyo, rain streaming down your face, and look out over the endless ocean of neon. Somewhere down there, another nobody is trying to survive their first night. You were them once. Not anymore.',
    conditions: [{ type: 'street_cred', target: '', operator: '>=', value: 300 }],
    weight: 100,
    repeatable: false,
    cooldownDays: 0,
    choices: [
      {
        id: 'reflect',
        text: 'Look back on the journey. Remember who you were.',
        outcomes: {
          success: [
            { type: 'experience', value: 500, message: '+500 XP' },
            { type: 'street_cred', value: 50, message: 'Street Cred +50' },
            { type: 'trait', target: 'Legend of Neo-Tokyo', message: 'LEGENDARY TRAIT: Legend of Neo-Tokyo' },
            { type: 'message', message: 'They\'ll tell your story in bars and braindance parlors for generations. The nobody from the streets who became immortal. Every choice, every scar, every friend and enemy — they all led here. To this moment. To this view. You are a legend.' },
          ],
        },
      },
      {
        id: 'next',
        text: '"There\'s always another city. Always another challenge."',
        outcomes: {
          success: [
            { type: 'experience', value: 500, message: '+500 XP' },
            { type: 'street_cred', value: 50, message: 'Street Cred +50' },
            { type: 'trait', target: 'Restless Legend', message: 'LEGENDARY TRAIT: Restless Legend' },
            { type: 'message', message: 'Legends don\'t retire. They find the next impossible thing and aim themselves at it. Somewhere out there is a challenge worthy of what you\'ve become. And until you find it, the city will remember your name.' },
          ],
        },
      },
    ],
  },
];

/**
 * Get milestones that the player qualifies for but hasn't completed yet.
 */
export function getAvailableMilestones(state: import('../types').GameState): GameEvent[] {
  return MILESTONES.filter(m => {
    // Already completed
    if (state.progression.completedMilestones.includes(m.id)) return false;

    // Check street cred condition
    for (const cond of m.conditions) {
      if (cond.type === 'street_cred') {
        const required = Number(cond.value);
        if (state.progression.streetCred < required) return false;
      }
    }

    return true;
  });
}
