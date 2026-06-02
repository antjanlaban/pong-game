import { describe, expect, it } from "vitest";
import { FIELD_H, PADDLE_H, PADDLE_SPEED } from "../../src/config";
import { stepPaddle } from "../../src/sim/paddle";
import type { Paddle } from "../../src/types";

const base: Paddle = { x: 48, y: 300, dir: 0 };

describe("stepPaddle", () => {
  it("moves up by speed*dt for dir -1", () => {
    const out = stepPaddle({ ...base, dir: -1 }, PADDLE_SPEED, 0.1);
    expect(out.y).toBeCloseTo(300 - PADDLE_SPEED * 0.1, 6);
  });

  it("moves down by speed*dt for dir +1", () => {
    const out = stepPaddle({ ...base, dir: 1 }, PADDLE_SPEED, 0.1);
    expect(out.y).toBeCloseTo(300 + PADDLE_SPEED * 0.1, 6);
  });

  it("does not move for dir 0", () => {
    expect(stepPaddle({ ...base, dir: 0 }, PADDLE_SPEED, 0.1).y).toBe(300);
  });

  it("clamps at the top (y >= 0)", () => {
    const out = stepPaddle({ ...base, y: 5, dir: -1 }, PADDLE_SPEED, 1);
    expect(out.y).toBe(0);
  });

  it("clamps at the bottom (y <= FIELD_H - PADDLE_H)", () => {
    const out = stepPaddle({ ...base, y: FIELD_H - PADDLE_H - 5, dir: 1 }, PADDLE_SPEED, 1);
    expect(out.y).toBe(FIELD_H - PADDLE_H);
  });
});
