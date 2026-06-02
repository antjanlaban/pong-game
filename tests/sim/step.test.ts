import { describe, expect, it } from "vitest";
import {
  BALL_RADIUS,
  DEFAULT_MATCH_LENGTH,
  FIELD_H,
  FIELD_W,
  P1_X,
  P2_X,
  PADDLE_W,
  SERVE_DELAY,
} from "../../src/config";
import { serveBall } from "../../src/sim/ball";
import { mulberry32 } from "../../src/sim/rng";
import { initGameState, stepGame } from "../../src/sim/step";
import type { InputState, Settings } from "../../src/types";

const settings: Settings = {
  mode: "2p",
  difficulty: "normal",
  matchLength: DEFAULT_MATCH_LENGTH,
  musicOn: true,
};

const noInput: InputState = {
  p1Dir: 0,
  p2Dir: 0,
  confirm: false,
  pause: false,
  back: false,
  mute: false,
  navUp: false,
  navDown: false,
  navLeft: false,
  navRight: false,
};

describe("initGameState", () => {
  it("starts with zero score and a serve delay", () => {
    const s = initGameState(settings, mulberry32(1));
    expect(s.score1).toBe(0);
    expect(s.score2).toBe(0);
    expect(s.serveDelay).toBeGreaterThan(0);
  });
});

describe("stepGame serve delay", () => {
  it("counts down the serve delay and keeps the ball centered", () => {
    const s0 = initGameState(settings, mulberry32(1));
    const { state } = stepGame(s0, noInput, 0.1, mulberry32(2));
    expect(state.serveDelay).toBeCloseTo(SERVE_DELAY - 0.1, 6);
    expect(state.ball.pos.x).toBe(FIELD_W / 2);
  });
});

describe("stepGame scoring", () => {
  it("awards a point to P2 when the ball passes the left edge and re-centers with serve delay", () => {
    const s0 = initGameState(settings, mulberry32(1));
    s0.serveDelay = 0;
    s0.ball = {
      pos: { x: -BALL_RADIUS - 1, y: 360 },
      vel: { x: -300, y: 0 },
      speed: 300,
      lastHitBy: 1,
    };
    const { state, events } = stepGame(s0, noInput, 0.01, mulberry32(2));
    expect(state.score2).toBe(1);
    expect(events.scored).toBe(2);
    expect(state.serveDelay).toBeGreaterThan(0);
    expect(state.ball.pos.x).toBe(FIELD_W / 2);
  });

  it("awards a point to P1 when the ball passes the right edge", () => {
    const s0 = initGameState(settings, mulberry32(1));
    s0.serveDelay = 0;
    s0.ball = {
      pos: { x: FIELD_W + BALL_RADIUS + 1, y: 360 },
      vel: { x: 300, y: 0 },
      speed: 300,
      lastHitBy: 2,
    };
    const { state, events } = stepGame(s0, noInput, 0.01, mulberry32(2));
    expect(state.score1).toBe(1);
    expect(events.scored).toBe(1);
  });
});

describe("stepGame serve determinism", () => {
  // Drive a score, then run `delayTicks` count-down ticks (each shorter than the
  // remaining delay) followed by the tick that elapses the delay and serves.
  // The serve must consume the RNG exactly once, so the resulting serve
  // velocity must not depend on how many ticks elapsed inside the delay window.
  function serveAfter(delayTicks: number): { x: number; y: number } {
    const SEED = 12345;
    const s0 = initGameState(settings, mulberry32(SEED));
    s0.serveDelay = 0;
    s0.ball = {
      pos: { x: -BALL_RADIUS - 1, y: 360 },
      vel: { x: -300, y: 0 },
      speed: 300,
      lastHitBy: 1,
    };
    // one shared rng for the whole run, so premature next() calls would shift it.
    const rng = mulberry32(SEED);
    let { state } = stepGame(s0, noInput, 0.01, rng); // score -> serveDelay set
    // count-down ticks that do NOT elapse the delay
    const tickDt = SERVE_DELAY / (delayTicks + 2);
    for (let i = 0; i < delayTicks; i++) {
      state = stepGame(state, noInput, tickDt, rng).state;
      expect(state.serveDelay).toBeGreaterThan(0);
    }
    // big tick that elapses the remaining delay and performs the single serve
    state = stepGame(state, noInput, SERVE_DELAY, rng).state;
    expect(state.serveDelay).toBe(0);
    return state.ball.vel;
  }

  it("serve velocity is independent of the number of delay ticks (deterministic RNG)", () => {
    const fewTicks = serveAfter(1);
    const manyTicks = serveAfter(10);
    expect(manyTicks.x).toBeCloseTo(fewTicks.x, 9);
    expect(manyTicks.y).toBeCloseTo(fewTicks.y, 9);
  });

  it("consumes the RNG exactly once per point (serve matches a single serveBall call)", () => {
    // The point above scores toward player 1, then a single serve toward player 1
    // should pop exactly the first values off the same seed. A premature/duplicate
    // serveBall call would shift the RNG sequence and break this equality.
    const served = serveAfter(3);
    const expected = serveBall(1, mulberry32(12345)).vel;
    expect(served.x).toBeCloseTo(expected.x, 9);
    expect(served.y).toBeCloseTo(expected.y, 9);
  });

  it("rests the ball at center with zero velocity during the score delay", () => {
    const s0 = initGameState(settings, mulberry32(1));
    s0.serveDelay = 0;
    s0.ball = {
      pos: { x: -BALL_RADIUS - 1, y: 200 },
      vel: { x: -300, y: 50 },
      speed: 300,
      lastHitBy: 1,
    };
    const { state } = stepGame(s0, noInput, 0.01, mulberry32(2));
    expect(state.serveDelay).toBeGreaterThan(0);
    expect(state.ball.pos.x).toBe(FIELD_W / 2);
    expect(state.ball.pos.y).toBe(FIELD_H / 2);
    expect(state.ball.vel.x).toBe(0);
    expect(state.ball.vel.y).toBe(0);
  });
});

describe("stepGame collision event", () => {
  it("emits paddleHit and reverses vx when the ball strikes P1", () => {
    const s0 = initGameState(settings, mulberry32(1));
    s0.serveDelay = 0;
    s0.p1 = { x: P1_X, y: 305, dir: 0 }; // center ~360
    s0.ball = {
      pos: { x: P1_X + PADDLE_W + BALL_RADIUS - 1, y: 360 },
      vel: { x: -300, y: 0 },
      speed: 300,
      lastHitBy: 0,
    };
    const { state, events } = stepGame(s0, noInput, 0.001, mulberry32(2));
    expect(events.paddleHit).toBe(true);
    expect(state.ball.vel.x).toBeGreaterThan(0);
  });
});

describe("stepGame human input", () => {
  it("moves P1 up when p1Dir is -1", () => {
    const s0 = initGameState(settings, mulberry32(1));
    s0.serveDelay = 0;
    const before = s0.p1.y;
    const { state } = stepGame(s0, { ...noInput, p1Dir: -1 }, 0.1, mulberry32(2));
    expect(state.p1.y).toBeLessThan(before);
  });
});

describe("stepGame AI (1p)", () => {
  it("moves the AI paddle toward an incoming ball", () => {
    const aiSettings: Settings = { ...settings, mode: "1p", difficulty: "hard" };
    const s0 = initGameState(aiSettings, mulberry32(1));
    s0.serveDelay = 0;
    s0.aiCooldown = 0;
    s0.p2 = { x: P2_X, y: 0, dir: 0 }; // top
    s0.ball = { pos: { x: 600, y: 600 }, vel: { x: 400, y: 0 }, speed: 400, lastHitBy: 1 };
    const { state } = stepGame(s0, noInput, 0.05, mulberry32(2));
    expect(state.p2.y).toBeGreaterThan(0); // moved down toward y=600
  });

  it("ignores p2Dir input in 1p mode (AI controls P2)", () => {
    const aiSettings: Settings = { ...settings, mode: "1p", difficulty: "easy" };
    const s0 = initGameState(aiSettings, mulberry32(1));
    s0.serveDelay = 0;
    s0.aiCooldown = 1; // hold target == initial center, ball moving away => drift center, paddle already centered
    s0.p2 = { x: P2_X, y: (FIELD_H - 110) / 2, dir: 0 };
    s0.ball = { pos: { x: 600, y: 360 }, vel: { x: -400, y: 0 }, speed: 400, lastHitBy: 2 };
    const { state } = stepGame(s0, { ...noInput, p2Dir: 1 }, 0.05, mulberry32(2));
    // human p2Dir would push down; AI keeps it ~centered, so it should not have moved a full human step.
    expect(Math.abs(state.p2.y - (FIELD_H - 110) / 2)).toBeLessThan(900 * 0.05);
  });
});
