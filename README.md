# Cyberpunk Life Simulator RPG

A terminal-based cyberpunk life simulator RPG set in a dystopian future megacity. Navigate the neon-lit streets, take on dangerous jobs, upgrade your body with cybernetic augmentations, and try to survive.

## Features

- **Character Creation** - Choose from 4 origins (Street Kid, Corpo, Nomad, Netrunner) with unique bonuses and starting conditions
- **6 Core Stats** - Body, Reflexes, Tech, Intelligence, Cool, Luck
- **8 Skills** - Combat, Hacking, Stealth, Persuasion, Engineering, Streetwise, Medicine, Driving
- **5 Districts** - Downtown, Kabuki, Industrial Zone, Neon Heights, The Undercity - each with unique locations, dangers, and opportunities
- **6 Factions** - Build reputation with Kenzaki Megacorp, Tyger Claws, Maelstrom, Voodoo Boys, NCPD, and Desert Wolves
- **Cybernetic Augmentations** - Install neural processors, optics, arm weapons, leg enhancements, and more - at the cost of your humanity
- **Job System** - Take gigs, heists, deliveries, assassinations, hacking runs, and bodyguard work
- **Combat System** - Turn-based combat with physical attacks, hacking, items, and flee options
- **Random Events** - Muggings, mysterious vendors, NCPD checkpoints, cyberpsycho sightings, and more
- **Economy** - Earn credits, buy gear, sell loot, gamble, and manage daily expenses
- **Life Simulation** - Rent apartments, rest, travel between districts, and watch the days pass
- **Save/Load** - Multiple save slots with autosave support
- **Animated ASCII Art** - Glitch effects, neon sign flicker, cyber rain, scanline distortion, boot sequence, combat animations, travel transitions, and per-district ambient visuals
- **Procedural Synthwave Soundtrack** - Dark synth / Perturbator-style music generated in real-time using PCM audio synthesis with sawtooth/square/pulse oscillators, ADSR envelopes, distortion, filters, delay, and chorus. Separate tracks for title, exploration, combat, dark ambient, victory, and game over. Toggle with [M] in-game

## Installation

```bash
npm install
```

## Running

```bash
# Development mode
npm run dev

# Build and run
npm run build
npm start
```

## Testing

```bash
npm test
```

## How to Play

1. Create your character by choosing a name, origin, and distributing stat points
2. Explore districts, visit locations, take jobs, and survive
3. Earn credits to buy better gear and cybernetic augmentations
4. Build reputation with factions to unlock better opportunities
5. Watch your humanity - too many augmentations can push you toward cyberpsychosis

## Project Structure

```
src/
├── types.ts              # Core type definitions
├── index.ts              # Entry point
├── engine/
│   ├── state.ts          # Game state management
│   └── save.ts           # Save/load system
├── systems/
│   ├── character.ts      # Character creation and management
│   ├── combat.ts         # Turn-based combat
│   ├── economy.ts        # Jobs, trading, expenses
│   ├── events.ts         # Random event resolution
│   └── life.ts           # Life simulation (rest, travel, etc.)
├── data/
│   ├── districts.ts      # World locations
│   ├── factions.ts       # Faction definitions
│   ├── items.ts          # Items and augmentations
│   ├── npcs.ts           # NPCs and enemies
│   ├── jobs.ts           # Available jobs
│   └── events.ts         # Random event definitions
├── audio/
│   ├── synth.ts          # PCM waveform synthesis engine
│   ├── music.ts          # Procedural dark synth music composer
│   └── wav.ts            # WAV file generation and playback
├── ui/
│   ├── game-loop.ts      # Main game loop with music/animation integration
│   ├── animation.ts      # ASCII animation engine (glitch, rain, neon, etc.)
│   ├── screens.ts        # Display functions
│   └── input.ts          # Input handling
└── utils/
    ├── dice.ts           # Random number utilities
    └── format.ts         # Text formatting with chalk
```

## Audio

The game generates a Perturbator/Carpenter Brut-style dark synthwave soundtrack procedurally at startup using raw PCM synthesis. No audio files are bundled - all music is created mathematically from oscillators, envelopes, and effects.

The audio system auto-detects available playback tools (`aplay`, `paplay`, `play`, `ffplay`, `mpv`) and gracefully degrades to silent mode if none are found. Generated WAV files are cached in `.audio_cache/` and cleaned up on exit.

Press **[M]** in-game to toggle music on/off.
