import { GameState, GameEvent, EventChoice, EventOutcome } from '../types';
import { getEligibleEvents } from '../data/events';
import { weightedRandom, check, chance } from '../utils/dice';
import { applyOutcomes, addLogEntry, getEffectiveSkill, getEffectiveStat } from '../engine/state';
import { addItem } from './character';
import { getItem } from '../data/items';

export function rollForEvent(state: GameState): GameEvent | null {
  // Base chance of an event per time period
  const eventChance = 0.4;
  if (!chance(eventChance)) return null;

  const eligible = getEligibleEvents(state);
  if (eligible.length === 0) return null;

  const weights = eligible.map(e => e.weight);
  return weightedRandom(eligible, weights);
}

export function resolveChoice(state: GameState, event: GameEvent, choiceId: string): string[] {
  const choice = event.choices.find(c => c.id === choiceId);
  if (!choice) return ['Invalid choice.'];

  const messages: string[] = [];
  let outcomes: EventOutcome[];

  // Handle skill check
  if (choice.skillCheck) {
    const skillVal = getEffectiveSkill(state.character, choice.skillCheck.skill);
    const modifier = Math.floor(skillVal / 5);
    const result = check(modifier, choice.skillCheck.difficulty);

    if (result.success) {
      messages.push(`[${choice.skillCheck.skill.toUpperCase()} check: ${result.total} vs ${choice.skillCheck.difficulty} - SUCCESS]`);
      outcomes = choice.outcomes.success;
    } else {
      messages.push(`[${choice.skillCheck.skill.toUpperCase()} check: ${result.total} vs ${choice.skillCheck.difficulty} - FAILED]`);
      outcomes = choice.outcomes.failure ?? choice.outcomes.success;
    }
  }
  // Handle stat check
  else if (choice.statCheck) {
    const statVal = getEffectiveStat(state.character, choice.statCheck.stat);
    const modifier = Math.floor(statVal / 2);
    const result = check(modifier, choice.statCheck.difficulty);

    if (result.success) {
      messages.push(`[${choice.statCheck.stat.toUpperCase()} check: ${result.total} vs ${choice.statCheck.difficulty} - SUCCESS]`);
      outcomes = choice.outcomes.success;
    } else {
      messages.push(`[${choice.statCheck.stat.toUpperCase()} check: ${result.total} vs ${choice.statCheck.difficulty} - FAILED]`);
      outcomes = choice.outcomes.failure ?? choice.outcomes.success;
    }
  }
  // No check required
  else {
    outcomes = choice.outcomes.success;
  }

  // Apply outcomes
  for (const outcome of outcomes) {
    // Handle item rewards specially
    if (outcome.type === 'item' && outcome.target) {
      const item = getItem(outcome.target);
      if (item) {
        addItem(state.character, item, outcome.value ?? 1);
      }
    }
    const msg = applyOutcomes(state, [outcome]);
    messages.push(...msg);
  }

  // Set cooldown
  if (event.cooldownDays > 0) {
    state.eventCooldowns[event.id] = state.currentDay + event.cooldownDays;
  }
  if (!event.repeatable) {
    state.completedEventIds.push(event.id);
  }

  addLogEntry(state, `Event: ${event.title}`, 'story');

  return messages;
}
