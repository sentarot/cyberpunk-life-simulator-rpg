import { Character, CombatState, Enemy, CombatEffect } from '../types';
import { d20, roll, chance, clamp } from '../utils/dice';
import { getEffectiveStat, getEffectiveSkill, getDifficultyModifier } from '../engine/state';
import { GameState } from '../types';

export function initCombat(character: Character, enemy: Enemy): CombatState {
  return {
    playerHealth: character.health,
    enemyHealth: enemy.health,
    enemyMaxHealth: enemy.health,
    enemyName: enemy.name,
    enemyLevel: enemy.level,
    round: 1,
    playerEffects: [],
    enemyEffects: [],
    fled: false,
    resolved: false,
  };
}

export function playerAttack(state: GameState, combat: CombatState, enemy: Enemy): string[] {
  const messages: string[] = [];
  const char = state.character;
  const diffMod = getDifficultyModifier(state.settings);

  // Calculate attack
  const attackRoll = d20();
  const attackBonus = Math.floor(getEffectiveStat(char, 'reflexes') / 2) + Math.floor(getEffectiveSkill(char, 'combat') / 10);
  const total = attackRoll + attackBonus;
  const defense = 10 + Math.floor(enemy.level * 1.5 * diffMod);

  if (attackRoll === 20) {
    // Critical hit
    const baseDamage = getPlayerDamage(char);
    const critDamage = baseDamage * 2;
    combat.enemyHealth = Math.max(0, combat.enemyHealth - critDamage);
    messages.push(`CRITICAL HIT! You deal ${critDamage} damage!`);
  } else if (total >= defense) {
    const damage = getPlayerDamage(char);
    combat.enemyHealth = Math.max(0, combat.enemyHealth - damage);
    messages.push(`You hit for ${damage} damage.`);
  } else {
    messages.push('Your attack misses!');
  }

  if (combat.enemyHealth <= 0) {
    combat.resolved = true;
    messages.push(`${enemy.name} has been defeated!`);
  }

  return messages;
}

export function enemyAttack(state: GameState, combat: CombatState, enemy: Enemy): string[] {
  const messages: string[] = [];
  const char = state.character;
  const diffMod = getDifficultyModifier(state.settings);

  const attackRoll = d20();
  const attackTotal = attackRoll + Math.floor(enemy.level * diffMod);
  const playerDefense = 10 + Math.floor(getEffectiveStat(char, 'reflexes') / 2);
  const armorReduction = char.equipped.armor?.effects?.reduce((sum, e) => sum + (e.stat === 'body' ? e.modifier : 0), 0) ?? 0;

  if (attackRoll === 1) {
    messages.push(`${enemy.name} fumbles their attack!`);
  } else if (attackTotal >= playerDefense) {
    const baseDamage = Math.floor(enemy.damage * diffMod);
    const finalDamage = Math.max(1, baseDamage - armorReduction);
    combat.playerHealth = Math.max(0, combat.playerHealth - finalDamage);
    messages.push(`${enemy.name} hits you for ${finalDamage} damage!`);
  } else {
    messages.push(`${enemy.name}'s attack misses!`);
  }

  if (combat.playerHealth <= 0) {
    combat.resolved = true;
    messages.push('You have been defeated...');
  }

  return messages;
}

export function playerHack(state: GameState, combat: CombatState, enemy: Enemy): string[] {
  const messages: string[] = [];
  const char = state.character;

  const hackRoll = d20();
  const hackBonus = Math.floor(getEffectiveStat(char, 'intelligence') / 2) + Math.floor(getEffectiveSkill(char, 'hacking') / 10);
  const total = hackRoll + hackBonus;
  const resistance = 10 + enemy.level * 2;

  if (total >= resistance) {
    const damage = roll(5, 15) + Math.floor(getEffectiveSkill(char, 'hacking') / 5);
    combat.enemyHealth = Math.max(0, combat.enemyHealth - damage);
    messages.push(`Hack successful! Dealt ${damage} neural damage.`);

    // Chance to apply debuff
    if (chance(0.3)) {
      combat.enemyEffects.push({ name: 'System Glitch', duration: 2, damagePerRound: 3 });
      messages.push('Applied System Glitch - enemy takes 3 damage per round!');
    }
  } else {
    messages.push('Hack failed! Enemy ICE blocked the intrusion.');
    // Backlash damage
    const backlash = roll(2, 6);
    combat.playerHealth = Math.max(0, combat.playerHealth - backlash);
    messages.push(`ICE backlash: ${backlash} damage!`);
  }

  if (combat.enemyHealth <= 0) {
    combat.resolved = true;
    messages.push(`${enemy.name} has been defeated!`);
  }

  return messages;
}

export function attemptFlee(state: GameState, combat: CombatState, enemy: Enemy): string[] {
  const messages: string[] = [];
  const char = state.character;

  const fleeRoll = d20();
  const fleeBonus = Math.floor(getEffectiveStat(char, 'reflexes') / 2) + Math.floor(getEffectiveSkill(char, 'stealth') / 10);
  const total = fleeRoll + fleeBonus;
  const difficulty = 10 + enemy.level;

  if (total >= difficulty) {
    combat.fled = true;
    combat.resolved = true;
    messages.push('You manage to escape!');
  } else {
    messages.push('Failed to flee!');
    // Enemy gets a free attack
    const freeAttack = enemyAttack(state, combat, enemy);
    messages.push(...freeAttack);
  }

  return messages;
}

export function useStim(combat: CombatState): string[] {
  const healAmount = roll(15, 30);
  const maxHealth = combat.playerHealth + healAmount; // We don't have maxHealth in combat state directly
  combat.playerHealth += healAmount;
  return [`Used a stim pack. Healed ${healAmount} HP.`];
}

export function processCombatEffects(combat: CombatState): string[] {
  const messages: string[] = [];

  // Process enemy effects
  combat.enemyEffects = combat.enemyEffects.filter(e => {
    if (e.damagePerRound) {
      combat.enemyHealth = Math.max(0, combat.enemyHealth - e.damagePerRound);
      messages.push(`${e.name} deals ${e.damagePerRound} to ${combat.enemyName}.`);
    }
    e.duration--;
    return e.duration > 0;
  });

  // Process player effects
  combat.playerEffects = combat.playerEffects.filter(e => {
    if (e.damagePerRound) {
      combat.playerHealth = Math.max(0, combat.playerHealth - e.damagePerRound);
      messages.push(`${e.name} deals ${e.damagePerRound} to you.`);
    }
    e.duration--;
    return e.duration > 0;
  });

  return messages;
}

export function getCombatRewards(enemy: Enemy): { credits: number; experience: number; loot: string[] } {
  const credits = roll(enemy.creditDrop.min, enemy.creditDrop.max);
  const loot: string[] = [];
  for (const drop of enemy.loot) {
    if (chance(drop.chance)) {
      loot.push(drop.itemId);
    }
  }
  return { credits, experience: enemy.experienceDrop, loot };
}

function getPlayerDamage(char: Character): number {
  const weaponDamage = char.equipped.weapon?.effects?.reduce((sum, e) => sum + e.modifier, 0) ?? 0;
  const baseDamage = roll(3, 8) + Math.floor(char.stats.body / 3);
  return baseDamage + weaponDamage;
}

export function getPlayerCombatStats(char: Character) {
  return {
    attack: Math.floor(getEffectiveStat(char, 'reflexes') / 2) + Math.floor(getEffectiveSkill(char, 'combat') / 10),
    defense: 10 + Math.floor(getEffectiveStat(char, 'reflexes') / 2),
    hackPower: Math.floor(getEffectiveStat(char, 'intelligence') / 2) + Math.floor(getEffectiveSkill(char, 'hacking') / 10),
    damage: `3-8 + ${Math.floor(char.stats.body / 3)}`,
  };
}
