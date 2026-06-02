import { AI_TUNING, BALL_RADIUS, FIELD_H, P2_X, PADDLE_H } from "../config";
import type { Ball, Difficulty } from "../types";
import type { Rng } from "./rng";
import { clampScalar } from "./vec";

const PLAYABLE_TOP = BALL_RADIUS;
const PLAYABLE_BOTTOM = FIELD_H - BALL_RADIUS;
const PLAYABLE_H = PLAYABLE_BOTTOM - PLAYABLE_TOP;

/** predicted y where the ball crosses x=targetX, folding top/bottom wall bounces. */
export function predictInterceptY(ball: Ball, targetX: number): number {
  if (ball.vel.x === 0) return ball.pos.y;
  const t = (targetX - ball.pos.x) / ball.vel.x;
  if (t <= 0) return ball.pos.y; // ball moving away; no future crossing
  const rawY = ball.pos.y + ball.vel.y * t;
  // reflect rawY into [PLAYABLE_TOP, PLAYABLE_BOTTOM] via triangle-wave folding.
  const offset = rawY - PLAYABLE_TOP;
  const period = 2 * PLAYABLE_H;
  let m = ((offset % period) + period) % period;
  if (m > PLAYABLE_H) m = period - m;
  return PLAYABLE_TOP + m;
}

export interface AiInput {
  ball: Ball;
  paddleY: number;
  difficulty: Difficulty;
  prevTargetY: number;
  cooldown: number;
  rng: Rng;
}

export interface AiOutput {
  dir: -1 | 0 | 1;
  targetY: number;
  cooldown: number;
}

/**
 * Compute the AI paddle direction for one tick.
 * `cooldown` counts seconds left until the AI may recompute its target.
 * Note: this function does not advance the cooldown timer (step.ts decrements it).
 */
export function aiPaddleDir(input: AiInput): AiOutput {
  const tuning = AI_TUNING[input.difficulty];
  const paddleCenter = input.paddleY + PADDLE_H / 2;
  const movingToward = input.ball.vel.x > 0; // right paddle (P2)

  let targetY = input.prevTargetY;
  let cooldown = input.cooldown;

  if (!movingToward) {
    // drift back to field center when the ball is heading away.
    targetY = FIELD_H / 2;
  } else if (input.cooldown <= 0) {
    // recompute: predicted intercept + seeded prediction error in paddle-heights.
    const predicted = predictInterceptY(input.ball, P2_X);
    const err = (input.rng.next() * 2 - 1) * tuning.predictionError * PADDLE_H;
    targetY = clampScalar(predicted + err, PLAYABLE_TOP, PLAYABLE_BOTTOM);
    cooldown = tuning.reactionMs / 1000;
  }

  const delta = targetY - paddleCenter;
  let dir: -1 | 0 | 1 = 0;
  if (Math.abs(delta) > tuning.deadZone) dir = delta > 0 ? 1 : -1;

  return { dir, targetY, cooldown };
}
