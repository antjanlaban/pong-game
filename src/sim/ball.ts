import {
  BALL_RADIUS,
  BALL_SPEED_CAP,
  BALL_SPEED_UP,
  BALL_START_SPEED,
  FIELD_H,
  FIELD_W,
  MIN_VX_FRACTION,
} from "../config";
import type { Ball } from "../types";
import type { Rng } from "./rng";

/** build a velocity at `speed` toward `towardPlayer` (1=left/-x, 2=right/+x),
 *  with a random but not-too-vertical vy. */
function serveVelocity(towardPlayer: 1 | 2, speed: number, rng: Rng): { x: number; y: number } {
  const sign = towardPlayer === 1 ? -1 : 1;
  // pick |vx| in [MIN_VX_FRACTION, 1] * speed, then vy fills the rest.
  const minVx = MIN_VX_FRACTION * speed;
  const vxMag = minVx + rng.next() * (speed - minVx);
  const vyMag = Math.sqrt(Math.max(0, speed * speed - vxMag * vxMag));
  const vySign = rng.next() < 0.5 ? -1 : 1;
  return { x: sign * vxMag, y: vySign * vyMag };
}

export function serveBall(towardPlayer: 1 | 2, rng: Rng): Ball {
  return {
    pos: { x: FIELD_W / 2, y: FIELD_H / 2 },
    vel: serveVelocity(towardPlayer, BALL_START_SPEED, rng),
    speed: BALL_START_SPEED,
    lastHitBy: 0,
  };
}

/** advance ball one step; bounces off top/bottom walls only. */
export function stepBall(ball: Ball, dt: number): { ball: Ball; wallHit: boolean } {
  const x = ball.pos.x + ball.vel.x * dt;
  let y = ball.pos.y + ball.vel.y * dt;
  let vy = ball.vel.y;
  let wallHit = false;

  if (y < BALL_RADIUS) {
    y = BALL_RADIUS;
    vy = Math.abs(vy);
    wallHit = true;
  } else if (y > FIELD_H - BALL_RADIUS) {
    y = FIELD_H - BALL_RADIUS;
    vy = -Math.abs(vy);
    wallHit = true;
  }

  return {
    ball: { ...ball, pos: { x, y }, vel: { x: ball.vel.x, y: vy } },
    wallHit,
  };
}

/** increase ball speed by the per-rally factor (capped) and rescale velocity. */
export function speedUpBall(ball: Ball): Ball {
  const newSpeed = Math.min(BALL_SPEED_CAP, ball.speed * BALL_SPEED_UP);
  const mag = Math.hypot(ball.vel.x, ball.vel.y) || 1;
  const k = newSpeed / mag;
  return {
    ...ball,
    speed: newSpeed,
    vel: { x: ball.vel.x * k, y: ball.vel.y * k },
  };
}
