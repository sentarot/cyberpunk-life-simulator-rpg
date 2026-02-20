import chalk from 'chalk';
import { GameState, Character, CombatState, Enemy, Job, NPC, Augmentation, Item, ProgressionState } from '../types';
import { formatCredits, formatHealth, formatHumanity, formatTime, formatDanger, formatStatValue, formatRarity, header, sectionHeader, divider, successMsg, failMsg, warnMsg, storyText, npcDialogue, progressBar } from '../utils/format';
import { getDistrict } from '../data/districts';
import { getFaction, getFactionStanding, FACTIONS } from '../data/factions';
import { getXPForLevel } from '../engine/state';
import { getTierName, getActName, getNextTierCred } from '../systems/progression';
import { getPerkById, PERK_LEVELS } from '../data/perks';

export function showTitleScreen(): void {
  console.log(chalk.cyan(`
  ╔══════════════════════════════════════════════════════════╗
  ║                                                          ║
  ║    ░█████╗░██╗░░░██╗██████╗░███████╗██████╗░            ║
  ║    ██╔══██╗╚██╗░██╔╝██╔══██╗██╔════╝██╔══██╗            ║
  ║    ██║░░╚═╝░╚████╔╝░██████╦╝█████╗░░██████╔╝            ║
  ║    ██║░░██╗░░╚██╔╝░░██╔══██╗██╔══╝░░██╔══██╗            ║
  ║    ╚█████╔╝░░░██║░░░██████╦╝███████╗██║░░██║            ║
  ║    ░╚════╝░░░░╚═╝░░░╚═════╝░╚══════╝╚═╝░░╚═╝            ║
  ║                                                          ║
  ║           L I F E   S I M U L A T O R                    ║
  ║                                                          ║
  ║    The year is 2087. The megacorps rule the world.       ║
  ║    The streets are dangerous. The Net is deadlier.       ║
  ║    You're just trying to survive.                         ║
  ║                                                          ║
  ╚══════════════════════════════════════════════════════════╝
  `));
}

export function showHUD(state: GameState): void {
  const char = state.character;
  const district = getDistrict(char.currentDistrict);
  const districtName = district?.name ?? char.currentDistrict;
  const danger = district?.danger ?? 'medium';
  const prog = state.progression;

  console.log(divider('═'));
  console.log(
    `  ${chalk.bold(char.name)} ${chalk.gray(`Lv.${char.level}`)} ` +
    `${chalk.gray('|')} ${formatHealth(char.health, char.maxHealth)} ` +
    `${chalk.gray('|')} ${formatCredits(char.credits)} ` +
    `${chalk.gray('|')} Humanity: ${formatHumanity(char.humanity)}`
  );
  console.log(
    `  Day ${state.currentDay} ${chalk.gray('|')} ${formatTime(state.currentTime)} ` +
    `${chalk.gray('|')} ${chalk.white(districtName)} ${chalk.gray('[')}Danger: ${formatDanger(danger)}${chalk.gray(']')}`
  );
  if (prog) {
    const tierStr = formatTier(prog);
    const nextCred = getNextTierCred(prog.tier);
    const credProgress = nextCred ? ` (${prog.streetCred}/${nextCred})` : ` (${prog.streetCred})`;
    console.log(
      `  ${chalk.magenta('Act ' + prog.act + ': ' + getActName(prog.act))} ` +
      `${chalk.gray('|')} ${tierStr}${chalk.gray(credProgress)} ` +
      `${chalk.gray('|')} Jobs: ${prog.jobsCompleted} ${chalk.gray('|')} Kills: ${prog.enemiesDefeated}`
    );
  }
  console.log(divider('═'));
}

function formatTier(prog: ProgressionState): string {
  const name = getTierName(prog.tier);
  switch (prog.tier) {
    case 'nobody': return chalk.gray(name);
    case 'prospect': return chalk.white(name);
    case 'operator': return chalk.cyan(name);
    case 'player': return chalk.green(name);
    case 'veteran': return chalk.yellow(name);
    case 'elite': return chalk.magentaBright(name);
    case 'legend': return chalk.yellowBright.bold(name);
  }
}

export function showCharacterSheet(char: Character, prog?: ProgressionState): void {
  console.log(header(`${char.name} - Character Sheet`));

  if (prog) {
    console.log(sectionHeader('STREET CRED'));
    const tierStr = formatTier(prog);
    const nextCred = getNextTierCred(prog.tier);
    const credBar = nextCred
      ? progressBar(prog.streetCred, nextCred, 20)
      : chalk.yellowBright(`${prog.streetCred} (MAX)`);
    console.log(`  Tier:         ${tierStr}`);
    console.log(`  Street Cred:  ${credBar}`);
    console.log(`  Act:          ${chalk.magenta(`${prog.act}: ${getActName(prog.act)}`)}`);
    console.log(`  Jobs Done:    ${prog.jobsCompleted} ${chalk.gray('|')} Enemies Defeated: ${prog.enemiesDefeated}`);
    if (prog.completedMilestones.length > 0) {
      console.log(`  Milestones:   ${prog.completedMilestones.length} completed`);
    }
  }

  console.log(sectionHeader('STATS'));
  console.log(`  Body:         ${formatStatValue(char.stats.body).padEnd(15)} Reflexes:      ${formatStatValue(char.stats.reflexes)}`);
  console.log(`  Tech:         ${formatStatValue(char.stats.tech).padEnd(15)} Intelligence:  ${formatStatValue(char.stats.intelligence)}`);
  console.log(`  Cool:         ${formatStatValue(char.stats.cool).padEnd(15)} Luck:          ${formatStatValue(char.stats.luck)}`);

  console.log(sectionHeader('SKILLS'));
  console.log(`  Combat:       ${String(char.skills.combat).padEnd(15)} Hacking:       ${char.skills.hacking}`);
  console.log(`  Stealth:      ${String(char.skills.stealth).padEnd(15)} Persuasion:    ${char.skills.persuasion}`);
  console.log(`  Engineering:  ${String(char.skills.engineering).padEnd(15)} Streetwise:    ${char.skills.streetwise}`);
  console.log(`  Medicine:     ${String(char.skills.medicine).padEnd(15)} Driving:       ${char.skills.driving}`);

  console.log(sectionHeader('INFO'));
  console.log(`  Origin:       ${chalk.white(char.origin)}`);
  console.log(`  Level:        ${char.level} (${char.experience}/${getXPForLevel(char.level + 1)} XP)`);
  console.log(`  Health:       ${formatHealth(char.health, char.maxHealth)}`);
  console.log(`  Credits:      ${formatCredits(char.credits)}`);
  console.log(`  Humanity:     ${formatHumanity(char.humanity)}`);
  console.log(`  Days Survived: ${char.daysSurvived}`);

  if (char.augmentations.length > 0) {
    console.log(sectionHeader('AUGMENTATIONS'));
    for (const aug of char.augmentations) {
      console.log(`  [${aug.slot}] ${chalk.cyan(aug.name)} - ${aug.description}`);
    }
  }

  if (char.equipped.weapon || char.equipped.armor) {
    console.log(sectionHeader('EQUIPPED'));
    if (char.equipped.weapon) console.log(`  Weapon: ${chalk.red(char.equipped.weapon.name)}`);
    if (char.equipped.armor) console.log(`  Armor:  ${chalk.blue(char.equipped.armor.name)}`);
    if (char.equipped.cyberdeckProgram) console.log(`  Program: ${chalk.green(char.equipped.cyberdeckProgram.name)}`);
  }

  if (char.perks && char.perks.length > 0) {
    console.log(sectionHeader('PERKS'));
    for (const perkId of char.perks) {
      const perk = getPerkById(perkId);
      if (perk) {
        const catColor = perk.category === 'combat' ? chalk.red
          : perk.category === 'tech' ? chalk.cyan
          : perk.category === 'social' ? chalk.magenta
          : chalk.green;
        console.log(`  ${catColor('●')} ${chalk.bold(perk.name)} - ${chalk.gray(perk.description)}`);
      }
    }
    if (char.level < 10) {
      const nextPerkLevel = PERK_LEVELS.find(l => l > char.level) ?? null;
      if (nextPerkLevel) {
        console.log(chalk.gray(`  Next perk at level ${nextPerkLevel}`));
      }
    }
  } else if (char.level < 3) {
    console.log(sectionHeader('PERKS'));
    console.log(chalk.gray(`  First perk available at level 3`));
  }

  if (char.traits.length > 0) {
    console.log(sectionHeader('TRAITS'));
    console.log(`  ${char.traits.join(', ')}`);
  }
}

export function showInventory(char: Character): void {
  console.log(header('INVENTORY'));

  if (char.inventory.length === 0) {
    console.log(chalk.gray('  Your inventory is empty.'));
    return;
  }

  for (let i = 0; i < char.inventory.length; i++) {
    const inv = char.inventory[i];
    const qty = inv.quantity > 1 ? ` x${inv.quantity}` : '';
    console.log(
      `  ${chalk.yellow(`[${i + 1}]`)} ${inv.item.name}${qty} ` +
      `${chalk.gray(`(${formatRarity(inv.item.rarity)})`)} - ` +
      `${chalk.gray(inv.item.description)} ` +
      `${chalk.yellow(`¥${inv.item.value}`)}`
    );
  }
}

export function showDistrictInfo(state: GameState): void {
  const district = getDistrict(state.character.currentDistrict);
  if (!district) return;

  console.log(header(district.name));
  console.log(storyText(`  ${district.description}`));
  console.log(`\n  Danger Level: ${formatDanger(district.danger)}`);
  if (district.controllingFaction) {
    const faction = getFaction(district.controllingFaction);
    if (faction) {
      const rep = state.character.reputation[faction.id] ?? 0;
      const standing = getFactionStanding(rep, faction);
      console.log(`  Controlled by: ${chalk.bold(faction.name)} (${standing})`);
    }
  }

  console.log(sectionHeader('LOCATIONS'));
  for (const loc of district.locations) {
    console.log(`  ${chalk.yellow('>')} ${chalk.white(loc.name)} - ${chalk.gray(loc.description)}`);
  }
}

export function showCombatHUD(combat: CombatState, char: Character): void {
  console.log(divider('═'));
  console.log(chalk.red.bold(`  COMBAT - Round ${combat.round}`));
  console.log(divider());
  console.log(`  You:    ${formatHealth(combat.playerHealth, char.maxHealth)}`);
  console.log(`  ${combat.enemyName}: ${progressBar(combat.enemyHealth, combat.enemyMaxHealth, 20)}`);

  if (combat.playerEffects.length > 0) {
    console.log(chalk.gray(`  Your effects: ${combat.playerEffects.map(e => e.name).join(', ')}`));
  }
  if (combat.enemyEffects.length > 0) {
    console.log(chalk.gray(`  Enemy effects: ${combat.enemyEffects.map(e => e.name).join(', ')}`));
  }
  console.log(divider('═'));
}

export function showJobDetails(job: Job): void {
  console.log(`\n  ${chalk.bold.white(job.name)}`);
  console.log(`  ${chalk.gray(job.description)}`);
  console.log(`  Employer:    ${job.employer}`);
  console.log(`  Difficulty:  ${chalk.yellow('★'.repeat(job.difficulty))}${chalk.gray('★'.repeat(10 - job.difficulty))}`);
  console.log(`  Pay:         ${formatCredits(job.payCredits)} + ${job.payExperience} XP`);
  if (job.reputationReward) {
    const sign = job.reputationReward.amount > 0 ? '+' : '';
    console.log(`  Reputation:  ${job.reputationReward.faction} ${sign}${job.reputationReward.amount}`);
  }
  if (job.risks.length > 0) {
    const riskTypes = job.risks.map(r => r.type).join(', ');
    console.log(`  Risks:       ${chalk.red(riskTypes)}`);
  }
}

export function showFactionStandings(char: Character): void {
  console.log(header('FACTION STANDINGS'));
  // FACTIONS imported at top level
  for (const faction of FACTIONS) {
    const rep = char.reputation[faction.id] ?? 0;
    const standing = getFactionStanding(rep, faction);
    const bar = progressBar(rep + 100, 200, 15);
    console.log(`  ${chalk.bold(faction.name.padEnd(20))} ${standing.padEnd(10)} ${bar}`);
  }
}

export function showNPCDialogue(npc: NPC, dialogueId: string): void {
  const dialogue = npc.dialogue.find(d => d.id === dialogueId);
  if (!dialogue) return;

  console.log(`\n${npcDialogue(npc.name, dialogue.text)}`);
  console.log(chalk.gray(`  [${npc.title}]`));
}

export function showShopItem(item: Item, index: number): void {
  console.log(
    `  ${chalk.yellow(`[${index}]`)} ${item.name} ` +
    `(${formatRarity(item.rarity)}) - ${formatCredits(item.value)}`
  );
  console.log(chalk.gray(`       ${item.description}`));
}

export function showAugmentation(aug: Augmentation, index: number): void {
  console.log(
    `  ${chalk.yellow(`[${index}]`)} ${chalk.cyan(aug.name)} ` +
    `[${aug.slot}] (${formatRarity(aug.rarity)}) - ${formatCredits(aug.cost)}`
  );
  console.log(chalk.gray(`       ${aug.description}`));
  const statBonuses = Object.entries(aug.statBonuses).map(([k, v]) => `${k} +${v}`).join(', ');
  const skillBonuses = Object.entries(aug.skillBonuses).map(([k, v]) => `${k} +${v}`).join(', ');
  if (statBonuses) console.log(chalk.green(`       Stats: ${statBonuses}`));
  if (skillBonuses) console.log(chalk.green(`       Skills: ${skillBonuses}`));
  console.log(chalk.red(`       Humanity cost: -${aug.humanityCost}`));
}

export function showGameOver(state: GameState): void {
  const prog = state.progression;
  const tierLabel = prog ? getTierName(prog.tier) : 'Unknown';
  const credLabel = prog ? String(prog.streetCred) : '0';
  console.log(chalk.red(`
  ╔══════════════════════════════════════════════════════════╗
  ║                                                          ║
  ║                    G A M E   O V E R                     ║
  ║                                                          ║
  ║    ${state.character.name.padEnd(40)}        ║
  ║    Survived ${String(state.character.daysSurvived).padEnd(5)} days in the city              ║
  ║    Reached Level ${String(state.character.level).padEnd(33)}       ║
  ║    Final Tier: ${tierLabel.padEnd(35)}       ║
  ║    Street Cred: ${credLabel.padEnd(33)}       ║
  ║    Final Credits: ¥${String(state.character.credits).padEnd(30)}       ║
  ║    Jobs Completed: ${String(prog?.jobsCompleted ?? 0).padEnd(30)}       ║
  ║    Enemies Defeated: ${String(prog?.enemiesDefeated ?? 0).padEnd(28)}       ║
  ║                                                          ║
  ╚══════════════════════════════════════════════════════════╝
  `));
}

export function showLog(state: GameState, count: number = 10): void {
  console.log(header('RECENT LOG'));
  const recent = state.gameLog.slice(-count);
  for (const entry of recent) {
    const prefix = `[Day ${entry.day} ${entry.time}]`;
    let colorFn: (s: string) => string;
    switch (entry.type) {
      case 'combat': colorFn = chalk.red; break;
      case 'quest': colorFn = chalk.magenta; break;
      case 'reward': colorFn = chalk.green; break;
      case 'danger': colorFn = chalk.redBright; break;
      case 'story': colorFn = chalk.cyan; break;
      default: colorFn = chalk.gray;
    }
    console.log(`  ${chalk.gray(prefix)} ${colorFn(entry.message)}`);
  }
}
