import { describe, expect, it } from "vitest";
import { TRAIL_LENGTH } from "../../src/config";
import { initEffects, stepEffects } from "../../src/render/effects";
import type { GameState, SimEvents } from "../../src/types";

const noEvents: SimEvents = { paddleHit: false, wallHit: false, scored: 0 };

function fakeState(x: number, y: number): GameState {
  return {
    ball: { pos: { x, y }, vel: { x: 0, y: 0 }, speed: 0, lastHitBy: 0 },
  } as unknown as GameState;
}

describe("effects", () => {
  it("starts empty", () => {
    const e = initEffects();
    expect(e.trail).toEqual([]);
    expect(e.flash).toBe(0);
    expect(e.shake).toBe(0);
  });

  it("appends the ball position to the trail", () => {
    const e = stepEffects(initEffects(), fakeState(100, 200), noEvents, 0.016);
    expect(e.trail.at(-1)).toEqual({ x: 100, y: 200 });
  });

  it("caps the trail at TRAIL_LENGTH (oldest dropped)", () => {
    let e = initEffects();
    for (let i = 0; i < TRAIL_LENGTH + 5; i++) {
      e = stepEffects(e, fakeState(i, i), noEvents, 0.016);
    }
    expect(e.trail.length).toBe(TRAIL_LENGTH);
    expect(e.trail[0]).toEqual({ x: 5, y: 5 }); // first five dropped
  });

  it("bumps flash and shake on a paddle hit", () => {
    const e = stepEffects(initEffects(), fakeState(0, 0), { ...noEvents, paddleHit: true }, 0.001);
    expect(e.flash).toBeGreaterThan(0);
    expect(e.shake).toBeGreaterThan(0);
  });

  it("flashes but does NOT shake on a wall hit", () => {
    const e = stepEffects(initEffects(), fakeState(0, 0), { ...noEvents, wallHit: true }, 0.001);
    expect(e.flash).toBeGreaterThan(0);
    expect(e.shake).toBe(0);
  });

  it("bumps shake harder on a score than on a paddle hit", () => {
    const hit = stepEffects(
      initEffects(),
      fakeState(0, 0),
      { ...noEvents, paddleHit: true },
      0.001,
    );
    const score = stepEffects(initEffects(), fakeState(0, 0), { ...noEvents, scored: 1 }, 0.001);
    expect(score.shake).toBeGreaterThan(hit.shake);
  });

  it("decays flash and shake toward zero over time with no events", () => {
    let e = stepEffects(initEffects(), fakeState(0, 0), { ...noEvents, scored: 1 }, 0.001);
    const startFlash = e.flash;
    const startShake = e.shake;
    for (let i = 0; i < 60; i++) e = stepEffects(e, fakeState(0, 0), noEvents, 0.05);
    expect(e.flash).toBeLessThan(startFlash);
    expect(e.shake).toBeLessThan(startShake);
    expect(e.flash).toBeGreaterThanOrEqual(0);
    expect(e.shake).toBeGreaterThanOrEqual(0);
  });
});
