import { describe, expect, it } from "vitest";
import {
  BALL_RADIUS,
  BALL_SPEED_CAP,
  BALL_START_SPEED,
  FIELD_H,
  FIELD_W,
  MIN_VX_FRACTION,
} from "../../src/config";
import { serveBall, speedUpBall, stepBall } from "../../src/sim/ball";
import { mulberry32 } from "../../src/sim/rng";

describe("serveBall", () => {
  it("centers the ball and uses start speed", () => {
    const b = serveBall(1, mulberry32(7));
    expect(b.pos).toEqual({ x: FIELD_W / 2, y: FIELD_H / 2 });
    expect(b.speed).toBe(BALL_START_SPEED);
    expect(Math.hypot(b.vel.x, b.vel.y)).toBeCloseTo(BALL_START_SPEED, 3);
  });

  it("serves toward player 1 (negative vx) and not too vertical", () => {
    const b = serveBall(1, mulberry32(7));
    expect(b.vel.x).toBeLessThan(0);
    expect(Math.abs(b.vel.x)).toBeGreaterThanOrEqual(MIN_VX_FRACTION * b.speed - 1e-6);
  });

  it("serves toward player 2 (positive vx)", () => {
    const b = serveBall(2, mulberry32(7));
    expect(b.vel.x).toBeGreaterThan(0);
  });
});

describe("stepBall", () => {
  it("advances position by velocity * dt", () => {
    const b = serveBall(2, mulberry32(1));
    const { ball } = stepBall(b, 0.5);
    expect(ball.pos.x).toBeCloseTo(b.pos.x + b.vel.x * 0.5, 6);
    expect(ball.pos.y).toBeCloseTo(b.pos.y + b.vel.y * 0.5, 6);
  });

  it("reflects vy at the top wall and clamps inside, emitting wallHit", () => {
    const b = serveBall(2, mulberry32(1));
    b.pos = { x: 640, y: BALL_RADIUS + 1 };
    b.vel = { x: 100, y: -200 };
    const { ball, wallHit } = stepBall(b, 0.1);
    expect(wallHit).toBe(true);
    expect(ball.vel.y).toBeGreaterThan(0);
    expect(ball.pos.y).toBeGreaterThanOrEqual(BALL_RADIUS);
  });

  it("reflects vy at the bottom wall", () => {
    const b = serveBall(2, mulberry32(1));
    b.pos = { x: 640, y: FIELD_H - BALL_RADIUS - 1 };
    b.vel = { x: 100, y: 300 };
    const { ball, wallHit } = stepBall(b, 0.1);
    expect(wallHit).toBe(true);
    expect(ball.vel.y).toBeLessThan(0);
    expect(ball.pos.y).toBeLessThanOrEqual(FIELD_H - BALL_RADIUS);
  });

  it("does not bounce off left/right walls (scoring handled elsewhere)", () => {
    const b = serveBall(1, mulberry32(1));
    b.pos = { x: BALL_RADIUS + 1, y: 360 };
    b.vel = { x: -300, y: 0 };
    const { ball, wallHit } = stepBall(b, 0.1);
    expect(wallHit).toBe(false);
    expect(ball.vel.x).toBeLessThan(0); // still moving left, will be scored by step.ts
  });
});

describe("speedUp", () => {
  it("multiplies speed by factor and rescales velocity, capped", () => {
    const b = serveBall(2, mulberry32(3));
    const sped = serveBall(2, mulberry32(3));
    const out = speedUpBall(b);
    expect(out.speed).toBeCloseTo(Math.min(BALL_SPEED_CAP, sped.speed * 1.04), 3);
    expect(Math.hypot(out.vel.x, out.vel.y)).toBeCloseTo(out.speed, 3);
  });
});
