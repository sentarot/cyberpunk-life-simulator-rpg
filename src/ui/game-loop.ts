import chalk from 'chalk';
import { GameState, MenuOption, Character, Stats, NPC as NPCType, GameEvent, Enemy } from '../types';
import { createInitialState, advanceTime, addLogEntry, applyOutcome } from '../engine/state';
import { saveGame, loadGame, listSaves } from '../engine/save';
import { createCharacter, getOriginInfo, equipItem, addItem, STAT_POINT_BUDGET, MIN_STAT, MAX_STAT, getStatTotal } from '../systems/character';
import { rollForEvent, resolveChoice } from '../systems/events';
import { canTakeJob, executeJob, buyItem, sellItem } from '../systems/economy';
import { initCombat, playerAttack, enemyAttack, playerHack, attemptFlee, processCombatEffects, getCombatRewards } from '../systems/combat';
import { rest, processNewDay, travelToDistrict, gamble, rentApartment } from '../systems/life';
import { showTitleScreen, showHUD, showCharacterSheet, showInventory, showDistrictInfo, showCombatHUD, showJobDetails, showFactionStandings, showNPCDialogue, showShopItem, showAugmentation, showGameOver, showLog } from './screens';
import { showMenu, prompt, promptNumber, confirmAction, waitForKey, clearScreen } from './input';
import { playTitleAnimation, playBootSequence, playAttackAnimation, playHackAnimation, playDamageFlash, playDeathAnimation, playTravelAnimation, playEventIntro, playLevelUpAnimation, getDistrictAmbience, glitchText, cursor } from './animation';
import { MusicManager, TrackName } from '../audio/music';
import { DISTRICTS, getDistrict } from '../data/districts';
import { NPCS, getRandomEnemy } from '../data/npcs';
import { getDistrictJobs, getJob } from '../data/jobs';
import { getShopItems, getClinicAugmentations, getItem, ITEMS } from '../data/items';
import { installAugmentation } from '../systems/character';
import { formatCredits } from '../utils/format';
import { chance, roll } from '../utils/dice';

export class GameLoop {
  private state!: GameState;
  private running: boolean = true;
  private music: MusicManager;
  private musicAvailable: boolean = false;
  private previousLevel: number = 1;

  constructor() {
    this.music = new MusicManager();
    this.musicAvailable = this.music.isAvailable();
  }

  async start(): Promise<void> {
    // Setup cleanup handler
    process.on('exit', () => {
      cursor.show();
      this.music.cleanup();
    });
    process.on('SIGINT', () => {
      cursor.show();
      this.music.stop();
      this.music.cleanup();
      process.exit(0);
    });

    clearScreen();

    // Generate music in background if available
    if (this.musicAvailable) {
      console.log(chalk.gray('  Generating soundtrack...'));
      this.music.pregenerateAll();
      console.log(chalk.green('  Soundtrack ready.'));
    }

    // Animated title sequence
    await playTitleAnimation(4000);

    // Start title music
    this.music.play('title');

    clearScreen();
    showTitleScreen();

    const mainChoice = showMenu('MAIN MENU', [
      { key: '1', label: 'New Game', description: 'Start a new life in the city' },
      { key: '2', label: 'Load Game', description: 'Continue a saved game' },
      { key: '3', label: 'Quit', description: 'Exit to reality' },
    ]);

    switch (mainChoice) {
      case '1':
        this.music.stop();
        // Boot sequence animation
        clearScreen();
        await playBootSequence();
        waitForKey();
        this.state = this.characterCreation();
        break;
      case '2':
        this.music.stop();
        const loaded = this.loadGameMenu();
        if (!loaded) {
          console.log(chalk.yellow('No save found. Starting new game.'));
          clearScreen();
          await playBootSequence();
          waitForKey();
          this.state = this.characterCreation();
        } else {
          this.state = loaded;
        }
        break;
      case '3':
        this.music.stop();
        this.music.cleanup();
        console.log(chalk.cyan('Disconnecting from the Net...'));
        return;
    }

    addLogEntry(this.state, 'Welcome to the city. Try not to die.', 'story');

    // Give starter items based on origin
    this.giveStarterItems();
    this.previousLevel = this.state.character.level;

    // Start exploration music
    this.music.play('exploration');

    // Main game loop
    while (this.running) {
      await this.gameTurn();
    }

    this.music.cleanup();
  }

  private characterCreation(): GameState {
    clearScreen();
    console.log(chalk.cyan.bold('\n  === CHARACTER CREATION ===\n'));

    // Name
    const name = prompt('Enter your name');

    // Origin
    console.log(chalk.bold('\nChoose your origin:'));
    const origins = [
      { key: '1', label: 'Street Kid', description: getOriginInfo('street_kid').description },
      { key: '2', label: 'Corpo', description: getOriginInfo('corpo').description },
      { key: '3', label: 'Nomad', description: getOriginInfo('nomad').description },
      { key: '4', label: 'Netrunner', description: getOriginInfo('netrunner').description },
    ];
    const originChoice = showMenu('Choose Origin', origins);
    const originMap: Record<string, 'street_kid' | 'corpo' | 'nomad' | 'netrunner'> = {
      '1': 'street_kid', '2': 'corpo', '3': 'nomad', '4': 'netrunner',
    };
    const origin = originMap[originChoice];
    const originInfo = getOriginInfo(origin);

    console.log(chalk.green(`\nOrigin bonuses: +${JSON.stringify(originInfo.stats)}`));
    console.log(chalk.green(`Starting credits: ¥${originInfo.credits}`));

    // Stat allocation
    console.log(chalk.bold(`\nAllocate stat points. You have ${STAT_POINT_BUDGET} points to distribute.`));
    console.log(chalk.gray(`Each stat must be between ${MIN_STAT} and ${MAX_STAT}.\n`));

    const stats: Stats = { body: MIN_STAT, reflexes: MIN_STAT, tech: MIN_STAT, intelligence: MIN_STAT, cool: MIN_STAT, luck: MIN_STAT };
    let remaining = STAT_POINT_BUDGET - (MIN_STAT * 6);

    const statNames: (keyof Stats)[] = ['body', 'reflexes', 'tech', 'intelligence', 'cool', 'luck'];
    for (const stat of statNames) {
      const maxAlloc = Math.min(MAX_STAT - MIN_STAT, remaining);
      if (maxAlloc > 0) {
        console.log(chalk.gray(`  Points remaining: ${remaining}`));
        const points = promptNumber(`  ${stat.charAt(0).toUpperCase() + stat.slice(1)}`, 0, maxAlloc);
        stats[stat] += points;
        remaining -= points;
      }
    }

    // Auto-distribute remaining points
    if (remaining > 0) {
      console.log(chalk.yellow(`  Auto-distributing ${remaining} remaining points to luck.`));
      stats.luck = Math.min(MAX_STAT, stats.luck + remaining);
    }

    const character = createCharacter(name || 'V', origin, stats);

    console.log(chalk.green('\nCharacter created!'));
    showCharacterSheet(character);
    waitForKey();

    return createInitialState(character);
  }

  private loadGameMenu(): GameState | null {
    const saves = listSaves();
    if (saves.length === 0) return null;

    console.log(chalk.bold('\nSaved Games:'));
    for (const save of saves) {
      const date = new Date(save.timestamp).toLocaleString();
      console.log(`  ${chalk.yellow(save.name)} - ${save.characterName} (Day ${save.day}) - ${chalk.gray(date)}`);
    }

    const name = prompt('Enter save name to load');
    return loadGame(name);
  }

  private giveStarterItems(): void {
    const char = this.state.character;
    addItem(char, ITEMS.rusty_pistol);
    addItem(char, ITEMS.leather_jacket);
    addItem(char, ITEMS.stim_pack, 3);
    equipItem(char, ITEMS.rusty_pistol);
    equipItem(char, ITEMS.leather_jacket);
  }

  private async gameTurn(): Promise<void> {
    // Check game over
    if (this.state.character.health <= 0) {
      this.music.stop();
      await playDeathAnimation();
      this.music.play('gameover', false);
      showGameOver(this.state);
      this.running = false;
      return;
    }

    // Check for level up
    if (this.state.character.level > this.previousLevel) {
      await playLevelUpAnimation(this.state.character.level);
      this.previousLevel = this.state.character.level;
    }

    // Process new day if morning
    if (this.state.currentTime === 'morning') {
      const dayMsgs = processNewDay(this.state);
      for (const msg of dayMsgs) {
        console.log(chalk.gray(`  ${msg}`));
      }
    }

    // Show HUD
    showHUD(this.state);

    // Show district ambience
    const ambience = getDistrictAmbience(this.state.character.currentDistrict);
    if (ambience.trim()) {
      console.log(ambience);
    }

    // Check for random event
    const event = rollForEvent(this.state);
    if (event) {
      await this.handleEvent(event);
    }

    // Main action menu
    await this.mainMenu();

    // Advance time
    this.state = advanceTime(this.state);

    // Switch to dark ambient at night
    if (this.state.currentTime === 'night') {
      this.music.play('dark_ambient');
    } else if (this.state.currentTime === 'morning') {
      this.music.play('exploration');
    }

    // Auto-save
    if (this.state.settings.autoSave && this.state.currentTime === 'morning') {
      saveGame(this.state);
    }
  }

  private async mainMenu(): Promise<void> {
    const musicLabel = this.music.enabled ? 'Music OFF' : 'Music ON';
    const options: MenuOption[] = [
      { key: 'e', label: 'Explore District', description: 'Look around the current area' },
      { key: 'j', label: 'Jobs', description: 'Find work' },
      { key: 't', label: 'Travel', description: 'Move to another district' },
      { key: 'i', label: 'Inventory', description: 'Check your gear' },
      { key: 'c', label: 'Character', description: 'View your stats' },
      { key: 'f', label: 'Factions', description: 'View faction standings' },
      { key: 'l', label: 'Log', description: 'View recent events' },
      { key: 'r', label: 'Rest', description: 'Rest and recover health' },
      { key: 'm', label: musicLabel, description: 'Toggle soundtrack' },
      { key: 's', label: 'Save', description: 'Save your game' },
      { key: 'q', label: 'Quit', description: 'Save and quit' },
    ];

    const choice = showMenu('What do you do?', options);

    switch (choice) {
      case 'e': await this.exploreDistrict(); break;
      case 'j': await this.jobMenu(); break;
      case 't': await this.travelMenu(); break;
      case 'i': this.inventoryMenu(); break;
      case 'c': this.characterMenu(); break;
      case 'f': showFactionStandings(this.state.character); waitForKey(); break;
      case 'l': showLog(this.state, 15); waitForKey(); break;
      case 'r': this.restAction(); break;
      case 'm': this.toggleMusic(); break;
      case 's': this.saveMenu(); break;
      case 'q': this.quitGame(); break;
    }
  }

  private toggleMusic(): void {
    this.music.enabled = !this.music.enabled;
    if (this.music.enabled) {
      console.log(chalk.cyan('  ♪ Music enabled. Jacking into the soundwave...'));
      this.music.play('exploration');
    } else {
      console.log(chalk.gray('  ♪ Music disabled. Silence falls.'));
    }
  }

  private async exploreDistrict(): Promise<void> {
    showDistrictInfo(this.state);

    const district = getDistrict(this.state.character.currentDistrict);
    if (!district) return;

    const options: MenuOption[] = district.locations.map((loc, i) => ({
      key: String(i + 1),
      label: loc.name,
      description: loc.type,
    }));
    options.push({ key: 'b', label: 'Back' });

    const choice = showMenu('Visit a location', options);
    if (choice === 'b') return;

    const locIndex = parseInt(choice) - 1;
    const location = district.locations[locIndex];
    if (!location) return;

    console.log(`\n  ${chalk.bold(location.name)}`);
    console.log(`  ${chalk.italic(location.description)}`);

    await this.handleLocation(location.type, location.id);
  }

  private async handleLocation(type: string, locationId: string): Promise<void> {
    switch (type) {
      case 'bar':
        this.barMenu();
        break;
      case 'shop':
        this.shopMenu();
        break;
      case 'clinic':
        this.clinicMenu();
        break;
      case 'black_market':
        this.blackMarketMenu();
        break;
      case 'club':
        this.clubMenu();
        break;
      case 'data_haven':
        this.dataHavenMenu();
        break;
      case 'workshop':
        this.workshopMenu();
        break;
      case 'alley':
        await this.alleyExplore();
        break;
      case 'apartment':
        this.apartmentMenu();
        break;
      case 'corporate_office':
        this.corpoOfficeMenu();
        break;
    }
  }

  private barMenu(): void {
    const options: MenuOption[] = [
      { key: '1', label: 'Have a drink (¥10)', description: 'Relax and recover a bit' },
      { key: '2', label: 'Talk to patrons', description: 'Gather intel' },
      { key: '3', label: 'Look for NPCs', description: 'See who\'s around' },
      { key: 'b', label: 'Leave' },
    ];
    const choice = showMenu('At the bar', options);

    switch (choice) {
      case '1':
        if (this.state.character.credits >= 10) {
          this.state.character.credits -= 10;
          this.state.character.health = Math.min(this.state.character.maxHealth, this.state.character.health + 5);
          console.log(chalk.green('  You enjoy a drink. +5 HP. -¥10.'));
        } else {
          console.log(chalk.red('  Can\'t afford a drink.'));
        }
        break;
      case '2':
        console.log(chalk.italic('  You overhear conversations about the latest happenings...'));
        this.state.character.skills.streetwise = Math.min(100, this.state.character.skills.streetwise + 1);
        console.log(chalk.green('  Streetwise +1'));
        break;
      case '3':
        this.talkToNPCs();
        break;
    }
    waitForKey();
  }

  private shopMenu(): void {
    const items = getShopItems(this.state.character.currentDistrict);
    console.log(chalk.bold('\n  === SHOP ==='));
    console.log(`  Your credits: ${formatCredits(this.state.character.credits)}\n`);

    const options: MenuOption[] = items.map((item, i) => ({
      key: String(i + 1),
      label: `${item.name} - ${formatCredits(item.value)}`,
      description: item.description,
    }));
    options.push({ key: 's', label: 'Sell items' });
    options.push({ key: 'b', label: 'Leave' });

    const choice = showMenu('Buy something?', options);
    if (choice === 'b') return;
    if (choice === 's') {
      this.sellMenu();
      return;
    }

    const index = parseInt(choice) - 1;
    if (index >= 0 && index < items.length) {
      const result = buyItem(this.state.character, items[index]);
      console.log(result.success ? chalk.green(`  ${result.message}`) : chalk.red(`  ${result.message}`));
    }
    waitForKey();
  }

  private sellMenu(): void {
    showInventory(this.state.character);
    if (this.state.character.inventory.length === 0) {
      waitForKey();
      return;
    }

    const choice = promptNumber('Item number to sell (0 to cancel)', 0, this.state.character.inventory.length);
    if (choice === 0) return;

    const item = this.state.character.inventory[choice - 1];
    const result = sellItem(this.state.character, item.item.id);
    console.log(result.success ? chalk.green(`  ${result.message}`) : chalk.red(`  ${result.message}`));
    waitForKey();
  }

  private clinicMenu(): void {
    const options: MenuOption[] = [
      { key: '1', label: `Heal (¥100)`, description: 'Restore 30 HP' },
      { key: '2', label: `Full Heal (¥300)`, description: 'Restore all HP' },
      { key: '3', label: 'Augmentations', description: 'Install cybernetic enhancements' },
      { key: 'b', label: 'Leave' },
    ];
    const choice = showMenu('Ripperdoc Clinic', options);

    switch (choice) {
      case '1':
        if (this.state.character.credits >= 100) {
          this.state.character.credits -= 100;
          this.state.character.health = Math.min(this.state.character.maxHealth, this.state.character.health + 30);
          console.log(chalk.green('  Healed 30 HP.'));
        } else {
          console.log(chalk.red('  Not enough credits.'));
        }
        break;
      case '2':
        if (this.state.character.credits >= 300) {
          this.state.character.credits -= 300;
          this.state.character.health = this.state.character.maxHealth;
          console.log(chalk.green('  Fully healed!'));
        } else {
          console.log(chalk.red('  Not enough credits.'));
        }
        break;
      case '3':
        this.augmentationMenu();
        return;
    }
    waitForKey();
  }

  private augmentationMenu(): void {
    const augs = getClinicAugmentations(this.state.character.currentDistrict);
    console.log(chalk.bold('\n  === AUGMENTATIONS ==='));
    console.log(`  Your credits: ${formatCredits(this.state.character.credits)}`);
    console.log(`  Your humanity: ${this.state.character.humanity}%\n`);

    for (let i = 0; i < augs.length; i++) {
      showAugmentation(augs[i], i + 1);
    }

    const choice = promptNumber('Install which? (0 to cancel)', 0, augs.length);
    if (choice === 0) return;

    const aug = augs[choice - 1];
    if (confirmAction(`Install ${aug.name} for ${formatCredits(aug.cost)}? Humanity -${aug.humanityCost}`)) {
      const result = installAugmentation(this.state.character, aug);
      console.log(result.success ? chalk.green(`  ${result.message}`) : chalk.red(`  ${result.message}`));
    }
    waitForKey();
  }

  private blackMarketMenu(): void {
    console.log(chalk.bold('\n  === BLACK MARKET ==='));
    console.log(chalk.gray('  Deals happen in the shadows...\n'));

    const options: MenuOption[] = [
      { key: '1', label: 'Buy rare items', description: 'Premium goods at premium prices' },
      { key: '2', label: 'Sell contraband', description: 'Better prices than legit shops' },
      { key: 'b', label: 'Leave' },
    ];
    const choice = showMenu('Black Market', options);
    if (choice === 'b') return;

    if (choice === '1') {
      this.shopMenu(); // Reuse shop with black market inventory
    } else {
      this.sellMenu();
    }
  }

  private clubMenu(): void {
    const options: MenuOption[] = [
      { key: '1', label: 'Gamble (¥50)', description: 'Try your luck' },
      { key: '2', label: 'Gamble (¥200)', description: 'High stakes' },
      { key: '3', label: 'Socialize', description: 'Meet people, hear rumors' },
      { key: 'b', label: 'Leave' },
    ];
    const choice = showMenu('At the club', options);

    switch (choice) {
      case '1':
        const result1 = gamble(this.state, 50);
        result1.forEach(m => console.log(`  ${m}`));
        break;
      case '2':
        const result2 = gamble(this.state, 200);
        result2.forEach(m => console.log(`  ${m}`));
        break;
      case '3':
        console.log(chalk.italic('  You mingle with the crowd and pick up some useful information.'));
        this.state.character.skills.persuasion = Math.min(100, this.state.character.skills.persuasion + 1);
        console.log(chalk.green('  Persuasion +1'));
        break;
    }
    waitForKey();
  }

  private dataHavenMenu(): void {
    const options: MenuOption[] = [
      { key: '1', label: 'Practice hacking', description: 'Train your netrunning skills' },
      { key: '2', label: 'Scan for data', description: 'Look for valuable data in the Net' },
      { key: 'b', label: 'Leave' },
    ];
    const choice = showMenu('Data Haven', options);

    switch (choice) {
      case '1':
        this.state.character.skills.hacking = Math.min(100, this.state.character.skills.hacking + roll(1, 3));
        console.log(chalk.green('  Hacking skill improved!'));
        break;
      case '2':
        if (chance(0.4)) {
          const creds = roll(50, 200);
          this.state.character.credits += creds;
          console.log(chalk.green(`  Found valuable data worth ¥${creds}!`));
        } else {
          console.log(chalk.yellow('  Nothing valuable this time.'));
        }
        break;
    }
    waitForKey();
  }

  private workshopMenu(): void {
    const options: MenuOption[] = [
      { key: '1', label: 'Salvage junk', description: 'Convert scrap into credits' },
      { key: '2', label: 'Practice engineering', description: 'Improve your tech skills' },
      { key: 'b', label: 'Leave' },
    ];
    const choice = showMenu('Workshop', options);

    switch (choice) {
      case '1':
        const scrap = this.state.character.inventory.find(i => i.item.id === 'scrap_metal');
        if (scrap && scrap.quantity > 0) {
          const value = scrap.quantity * 15;
          this.state.character.credits += value;
          const qty = scrap.quantity;
          this.state.character.inventory = this.state.character.inventory.filter(i => i.item.id !== 'scrap_metal');
          console.log(chalk.green(`  Salvaged ${qty} scrap for ¥${value}.`));
        } else {
          console.log(chalk.yellow('  No scrap metal to salvage.'));
        }
        break;
      case '2':
        this.state.character.skills.engineering = Math.min(100, this.state.character.skills.engineering + roll(1, 3));
        console.log(chalk.green('  Engineering skill improved!'));
        break;
    }
    waitForKey();
  }

  private async alleyExplore(): Promise<void> {
    console.log(chalk.italic('  You venture into the dark alleys...'));

    if (chance(0.4)) {
      // Combat encounter
      const district = getDistrict(this.state.character.currentDistrict);
      const enemy = getRandomEnemy(district?.danger ?? 'medium');
      console.log(chalk.red(`\n  An enemy appears: ${enemy.name}!`));
      await this.runCombat(enemy);
    } else if (chance(0.3)) {
      // Find something
      const creds = roll(20, 100);
      this.state.character.credits += creds;
      console.log(chalk.green(`  Found ¥${creds} in a hidden stash!`));
      waitForKey();
    } else {
      console.log(chalk.gray('  Nothing of interest. The shadows are quiet today.'));
      waitForKey();
    }
  }

  private apartmentMenu(): void {
    const char = this.state.character;

    if (!char.apartment) {
      const options: MenuOption[] = [
        { key: '1', label: 'Rent apartment (¥500)', description: 'Get a place to live' },
        { key: 'b', label: 'Leave' },
      ];
      const choice = showMenu('Apartment Complex', options);
      if (choice === '1') {
        const result = rentApartment(this.state);
        result.forEach(m => console.log(`  ${m}`));
      }
    } else {
      const options: MenuOption[] = [
        { key: '1', label: 'Rest', description: 'Sleep and recover' },
        { key: '2', label: 'Stash items', description: 'Manage inventory' },
        { key: 'b', label: 'Leave' },
      ];
      const choice = showMenu('Your Apartment', options);
      if (choice === '1') {
        this.restAction();
        return;
      }
      if (choice === '2') {
        this.inventoryMenu();
        return;
      }
    }
    waitForKey();
  }

  private corpoOfficeMenu(): void {
    console.log(chalk.italic('  The corporate lobby gleams with wealth and power.'));

    const options: MenuOption[] = [
      { key: '1', label: 'Observe', description: 'Watch and learn' },
      { key: '2', label: 'Talk to receptionist', description: 'See if there\'s work' },
      { key: 'b', label: 'Leave' },
    ];
    const choice = showMenu('Corporate Office', options);

    switch (choice) {
      case '1':
        console.log(chalk.italic('  You study the comings and goings of corporate life.'));
        this.state.character.skills.streetwise = Math.min(100, this.state.character.skills.streetwise + 1);
        console.log(chalk.green('  Streetwise +1'));
        break;
      case '2':
        console.log(chalk.italic('  "Applications are handled online. Please leave the premises."'));
        break;
    }
    waitForKey();
  }

  private talkToNPCs(): void {
    const districtNPCs = Object.values(NPCS).filter(n => n.district === this.state.character.currentDistrict);
    if (districtNPCs.length === 0) {
      console.log(chalk.gray('  Nobody interesting around.'));
      return;
    }

    const options: MenuOption[] = districtNPCs.map((npc, i) => ({
      key: String(i + 1),
      label: `${npc.name}`,
      description: npc.title,
    }));
    options.push({ key: 'b', label: 'Back' });

    const choice = showMenu('Talk to someone', options);
    if (choice === 'b') return;

    const npcIndex = parseInt(choice) - 1;
    const npc = districtNPCs[npcIndex];
    if (!npc) return;

    this.npcConversation(npc);
  }

  private npcConversation(npc: NPCType): void {
    let currentDialogueId: string | null = 'intro';

    while (currentDialogueId) {
      const dialogue = npc.dialogue.find(d => d.id === currentDialogueId);
      if (!dialogue) break;

      showNPCDialogue(npc, currentDialogueId);

      const options: MenuOption[] = dialogue.responses.map((r, i) => ({
        key: String(i + 1),
        label: r.text,
      }));

      const choice = showMenu('Respond', options);
      const responseIndex = parseInt(choice) - 1;
      const response = dialogue.responses[responseIndex];
      if (!response) break;

      // Apply effects
      if (response.effects) {
        for (const effect of response.effects) {
          const msg = applyOutcome(this.state, effect);
          console.log(chalk.green(`  ${msg}`));
        }
      }

      currentDialogueId = response.nextDialogueId;
    }
  }

  private async jobMenu(): Promise<void> {
    const jobs = getDistrictJobs(this.state.character.currentDistrict);

    if (jobs.length === 0) {
      console.log(chalk.gray('  No jobs available in this district.'));
      waitForKey();
      return;
    }

    console.log(chalk.bold('\n  === AVAILABLE JOBS ==='));
    const options: MenuOption[] = [];

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const eligibility = canTakeJob(this.state, job);
      options.push({
        key: String(i + 1),
        label: `${job.name} - ${formatCredits(job.payCredits)}`,
        description: eligibility.eligible ? `Difficulty: ${job.difficulty}` : undefined,
        disabled: !eligibility.eligible,
        disabledReason: eligibility.reason,
      });
    }
    options.push({ key: 'b', label: 'Back' });

    const choice = showMenu('Take a job', options);
    if (choice === 'b') return;

    const jobIndex = parseInt(choice) - 1;
    const job = jobs[jobIndex];
    if (!job) return;

    showJobDetails(job);

    if (confirmAction('Accept this job?')) {
      console.log(chalk.cyan(`\n  Starting job: ${job.name}...`));
      const result = executeJob(this.state, job);

      for (const msg of result.messages) {
        console.log(`  ${msg}`);
      }

      if (result.combatTriggered) {
        const district = getDistrict(this.state.character.currentDistrict);
        const enemy = getRandomEnemy(district?.danger ?? 'medium');
        await this.runCombat(enemy);
      }
    }
    waitForKey();
  }

  private async travelMenu(): Promise<void> {
    console.log(chalk.bold('\n  === TRAVEL ==='));
    console.log(chalk.gray('  Transit cost: ¥20 per district\n'));

    const options: MenuOption[] = DISTRICTS.map((d, i) => ({
      key: String(i + 1),
      label: d.name,
      description: d.id === this.state.character.currentDistrict ? '(Current)' : `Danger: ${d.danger}`,
      disabled: d.id === this.state.character.currentDistrict,
      disabledReason: 'Already here',
    }));
    options.push({ key: 'b', label: 'Back' });

    const choice = showMenu('Travel to', options);
    if (choice === 'b') return;

    const districtIndex = parseInt(choice) - 1;
    const district = DISTRICTS[districtIndex];
    if (!district) return;

    const fromDistrict = getDistrict(this.state.character.currentDistrict)?.name ?? this.state.character.currentDistrict;
    const messages = travelToDistrict(this.state, district.id);

    // Animated travel transition
    await playTravelAnimation(fromDistrict, district.name);
    messages.forEach(m => console.log(`  ${m}`));

    // Chance of encounter while traveling
    if (chance(0.2)) {
      console.log(chalk.yellow('\n  Trouble on the road!'));
      const enemy = getRandomEnemy(district.danger);
      await this.runCombat(enemy);
    }
    waitForKey();
  }

  private inventoryMenu(): void {
    showInventory(this.state.character);

    if (this.state.character.inventory.length === 0) {
      waitForKey();
      return;
    }

    const options: MenuOption[] = [
      { key: 'e', label: 'Equip item' },
      { key: 'u', label: 'Use item' },
      { key: 'b', label: 'Back' },
    ];
    const choice = showMenu('Inventory', options);

    if (choice === 'e') {
      const num = promptNumber('Item number to equip (0 to cancel)', 0, this.state.character.inventory.length);
      if (num > 0) {
        const item = this.state.character.inventory[num - 1].item;
        const result = equipItem(this.state.character, item);
        console.log(result.success ? chalk.green(`  ${result.message}`) : chalk.red(`  ${result.message}`));
      }
    } else if (choice === 'u') {
      const num = promptNumber('Item number to use (0 to cancel)', 0, this.state.character.inventory.length);
      if (num > 0) {
        this.useItem(num - 1);
      }
    }
    waitForKey();
  }

  private useItem(index: number): void {
    const inv = this.state.character.inventory[index];
    if (!inv) return;

    const item = inv.item;
    if (item.type === 'consumable') {
      switch (item.id) {
        case 'stim_pack':
          const heal = roll(15, 30);
          this.state.character.health = Math.min(this.state.character.maxHealth, this.state.character.health + heal);
          console.log(chalk.green(`  Used Stim Pack. Healed ${heal} HP.`));
          break;
        case 'neural_booster':
          this.state.character.skills.hacking = Math.min(100, this.state.character.skills.hacking + 5);
          console.log(chalk.green('  Neural Booster activated! Hacking +5 (temporary).'));
          break;
        case 'synth_blood':
          this.state.character.health = this.state.character.maxHealth;
          console.log(chalk.green('  Synth Blood administered. Fully healed!'));
          break;
        default:
          console.log(chalk.yellow('  Can\'t use this item.'));
          return;
      }
      inv.quantity--;
      if (inv.quantity <= 0) {
        this.state.character.inventory.splice(index, 1);
      }
    } else {
      console.log(chalk.yellow('  This item can\'t be used directly.'));
    }
  }

  private characterMenu(): void {
    showCharacterSheet(this.state.character);
    waitForKey();
  }

  private restAction(): void {
    const messages = rest(this.state);
    messages.forEach(m => console.log(`  ${m}`));
    waitForKey();
  }

  private async handleEvent(event: GameEvent): Promise<void> {
    // Animated event intro
    console.log('');
    await playEventIntro(event.title);
    console.log(chalk.italic(`  ${event.description}\n`));

    const options: MenuOption[] = event.choices.map(c => ({
      key: c.id,
      label: c.text,
      description: c.skillCheck ? `[${c.skillCheck.skill}]` : c.statCheck ? `[${c.statCheck.stat}]` : undefined,
    }));

    const choice = showMenu('What do you do?', options);
    const messages = resolveChoice(this.state, event, choice);

    for (const msg of messages) {
      console.log(`  ${msg}`);
    }
    waitForKey();
  }

  private async runCombat(enemyTemplate: Enemy): Promise<void> {
    const enemy = { ...enemyTemplate };
    const combat = initCombat(this.state.character, enemy);

    // Switch to combat music
    this.music.play('combat');

    while (!combat.resolved) {
      showCombatHUD(combat, this.state.character);

      const options: MenuOption[] = [
        { key: '1', label: 'Attack', description: 'Physical attack' },
        { key: '2', label: 'Hack', description: 'Neural attack (Intelligence)' },
        { key: '3', label: 'Use Stim', description: 'Heal', disabled: !this.state.character.inventory.some(i => i.item.id === 'stim_pack'), disabledReason: 'No stim packs' },
        { key: '4', label: 'Flee', description: 'Try to escape' },
      ];

      const choice = showMenu('Combat Action', options);
      let messages: string[] = [];

      switch (choice) {
        case '1':
          await playAttackAnimation();
          messages = playerAttack(this.state, combat, enemy);
          break;
        case '2':
          await playHackAnimation();
          messages = playerHack(this.state, combat, enemy);
          break;
        case '3':
          const stim = this.state.character.inventory.find(i => i.item.id === 'stim_pack');
          if (stim) {
            const heal = roll(15, 30);
            combat.playerHealth = Math.min(this.state.character.maxHealth, combat.playerHealth + heal);
            stim.quantity--;
            if (stim.quantity <= 0) {
              this.state.character.inventory = this.state.character.inventory.filter(i => i.item.id !== 'stim_pack');
            }
            messages = [`Used Stim Pack. Healed ${heal} HP.`];
          }
          break;
        case '4':
          messages = attemptFlee(this.state, combat, enemy);
          break;
      }

      messages.forEach(m => console.log(`  ${m}`));

      // Enemy turn if combat not resolved
      if (!combat.resolved && choice !== '4') {
        const enemyMessages = enemyAttack(this.state, combat, enemy);
        // Show damage flash if player got hit
        if (enemyMessages.some(m => m.includes('hits you'))) {
          await playDamageFlash();
        }
        enemyMessages.forEach(m => console.log(`  ${m}`));
      }

      // Process effects
      const effectMessages = processCombatEffects(combat);
      effectMessages.forEach(m => console.log(`  ${m}`));

      combat.round++;
    }

    // Update character health from combat
    this.state.character.health = combat.playerHealth;

    // Handle rewards
    if (!combat.fled && combat.enemyHealth <= 0) {
      // Victory
      this.music.play('victory', false);
      const rewards = getCombatRewards(enemy);
      this.state.character.credits += rewards.credits;
      this.state.character.experience += rewards.experience;
      console.log(chalk.green(`\n  Rewards: ${formatCredits(rewards.credits)} + ${rewards.experience} XP`));

      for (const lootId of rewards.loot) {
        const item = getItem(lootId);
        if (item) {
          addItem(this.state.character, item);
          console.log(chalk.green(`  Looted: ${item.name}`));
        }
      }

      addLogEntry(this.state, `Defeated ${enemy.name}. Earned ¥${rewards.credits}.`, 'combat');
    } else if (combat.fled) {
      addLogEntry(this.state, `Fled from ${enemy.name}.`, 'combat');
    } else {
      addLogEntry(this.state, `Defeated by ${enemy.name}.`, 'danger');
    }

    waitForKey();

    // Return to exploration music
    this.music.play('exploration');
  }

  private saveMenu(): void {
    const name = prompt('Save name (or press Enter for autosave)');
    const slotName = name || 'autosave';
    if (saveGame(this.state, slotName)) {
      console.log(chalk.green(`  Game saved as '${slotName}'.`));
    } else {
      console.log(chalk.red('  Failed to save game.'));
    }
    waitForKey();
  }

  private quitGame(): void {
    if (confirmAction('Save before quitting?')) {
      saveGame(this.state);
      console.log(chalk.green('  Game saved.'));
    }
    this.music.stop();
    this.music.cleanup();
    console.log(chalk.cyan('\n  Disconnecting from the Net... Stay safe out there, choom.'));
    this.running = false;
  }
}
