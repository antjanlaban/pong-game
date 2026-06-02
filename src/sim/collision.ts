import { BALL_RADIUS, MAX_REFLECT_ANGLE, PADDLE_H, PADDLE_W } from "../config";
import type { Ball, Paddle } from "../types";
import { speedUpBall } from "./ball";
import { clampScalar } from "./vec";

/**
 * If `ball` is overlapping `paddle` while moving toward it, return the reflected,
 * sped-up ball. Otherwise null. `player` is 1 (left paddle) or 2 (right paddle).
 */
export function ballPaddleCollision(ball: Ball, paddle: Paddle, player: 1 | 2): Ball | null {
  const left = paddle.x;
  const right = paddle.x + PADDLE_W;
  const top = paddle.y;
  const bottom = paddle.y + PADDLE_H;

  // closest point on paddle to ball center; AABB-vs-circle overlap test.
  const nearestX = clampScalar(ball.pos.x, left, right);
  const nearestY = clampScalar(ball.pos.y, top, bottom);
  const dx = ball.pos.x - nearestX;
  const dy = ball.pos.y - nearestY;
  if (dx * dx + dy * dy > BALL_RADIUS * BALL_RADIUS) return null;

  // must be moving toward the paddle: left paddle => vx<0, right paddle => vx>0.
  const movingToward = player === 1 ? ball.vel.x < 0 : ball.vel.x > 0;
  if (!movingToward) return null;

  // normalized hit offset on the paddle face: -1 (top) .. +1 (bottom).
  const center = paddle.y + PADDLE_H / 2;
  const offset = clampScalar((ball.pos.y - center) / (PADDLE_H / 2), -1, 1);
  const angle = offset * MAX_REFLECT_ANGLE;

  const dirX = player === 1 ? 1 : -1;
  const reflected: Ball = {
    ...ball,
    vel: {
      x: dirX * ball.speed * Math.cos(angle),
      y: ball.speed * Math.sin(angle),
    },
    lastHitBy: player,
  };
  return speedUpBall(reflected);
}
