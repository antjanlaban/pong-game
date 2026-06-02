import { describe, expect, it } from "vitest";
import { BALL_RADIUS, P1_X, PADDLE_H, PADDLE_W } from "../../src/config";
import { ballPaddleCollision } from "../../src/sim/collision";
import type { Ball, Paddle } from "../../src/types";

function ballAt(x: number, y: number, vx: number, vy: number): Ball {
  return { pos: { x, y }, vel: { x: vx, y: vy }, speed: Math.hypot(vx, vy), lastHitBy: 0 };
}

const p1: Paddle = { x: P1_X, y: 300, dir: 0 }; // covers y 300..410, center 355

describe("ballPaddleCollision", () => {
  it("returns null when ball misses the paddle vertically", () => {
    const ball = ballAt(P1_X + PADDLE_W, 100, -300, 0);
    expect(ballPaddleCollision(ball, p1, 1)).toBeNull();
  });

  it("returns null when ball moves away from the paddle", () => {
    const ball = ballAt(P1_X + PADDLE_W, 355, 300, 0); // moving right, away from left paddle
    expect(ballPaddleCollision(ball, p1, 1)).toBeNull();
  });

  it("reflects vx to positive on a left-paddle hit", () => {
    const ball = ballAt(P1_X + PADDLE_W + BALL_RADIUS - 1, 355, -300, 0);
    const out = ballPaddleCollision(ball, p1, 1);
    expect(out).not.toBeNull();
    expect((out as Ball).vel.x).toBeGreaterThan(0);
    expect((out as Ball).lastHitBy).toBe(1);
  });

  it("a center hit sends the ball nearly straight (small |vy|)", () => {
    const center = p1.y + PADDLE_H / 2;
    const ball = ballAt(P1_X + PADDLE_W + BALL_RADIUS - 1, center, -300, 0);
    const out = ballPaddleCollision(ball, p1, 1) as Ball;
    expect(Math.abs(out.vel.y)).toBeLessThan(Math.abs(out.vel.x));
  });

  it("a top-edge hit sends the ball upward (negative vy)", () => {
    const topHit = p1.y + 4;
    const ball = ballAt(P1_X + PADDLE_W + BALL_RADIUS - 1, topHit, -300, 0);
    const out = ballPaddleCollision(ball, p1, 1) as Ball;
    expect(out.vel.y).toBeLessThan(0);
  });

  it("speeds the ball up on a hit", () => {
    const ball = ballAt(P1_X + PADDLE_W + BALL_RADIUS - 1, 355, -300, 0);
    const out = ballPaddleCollision(ball, p1, 1) as Ball;
    expect(out.speed).toBeGreaterThan(ball.speed);
  });
});
