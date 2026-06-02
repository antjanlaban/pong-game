import { TRAIL_LENGTH } from "../config";
import type { EffectsState, GameState, SimEvents } from "../types";

const FLASH_DECAY = 6; // per second
const SHAKE_DECAY = 9; // per second
const HIT_FLASH = 1;
const HIT_SHAKE = 6;
const SCORE_FLASH = 1;
const SCORE_SHAKE = 16;

export function initEffects(): EffectsState {
  return { trail: [], flash: 0, shake: 0 };
}

export function stepEffects(
  prev: EffectsState,
  state: GameState,
  events: SimEvents,
  dt: number,
): EffectsState {
  const trail = [...prev.trail, { x: state.ball.pos.x, y: state.ball.pos.y }];
  while (trail.length > TRAIL_LENGTH) trail.shift();

  let flash = Math.max(0, prev.flash - FLASH_DECAY * dt);
  let shake = Math.max(0, prev.shake - SHAKE_DECAY * dt);

  // wall bounce flashes only; screenshake is reserved for paddle hits and
  // scores so the screen doesn't shake continuously during normal rallies.
  if (events.wallHit) {
    flash = Math.max(flash, HIT_FLASH);
  }
  if (events.paddleHit) {
    flash = Math.max(flash, HIT_FLASH);
    shake = Math.max(shake, HIT_SHAKE);
  }
  if (events.scored !== 0) {
    flash = Math.max(flash, SCORE_FLASH);
    shake = Math.max(shake, SCORE_SHAKE);
  }

  return { trail, flash, shake };
}
