import { GameLoop } from './ui/game-loop';

async function main(): Promise<void> {
  const game = new GameLoop();
  await game.start();
}

main().catch(console.error);
