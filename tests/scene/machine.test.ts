import { describe, expect, it } from "vitest";
import { DEFAULT_MATCH_LENGTH } from "../../src/config";
import { MENU_ROWS, initMachine, pauseHasPriority, reduceMachine } from "../../src/scene/machine";
import type { InputState } from "../../src/types";

const base: InputState = {
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

/** start a match by confirming on the START row (Enter only starts there). */
function startedMachine() {
  const onStart = { ...initMachine(), menuCursor: MENU_ROWS.indexOf("start") };
  return reduceMachine(onStart, { ...base, confirm: true });
}

describe("machine", () => {
  it("starts in menu with default settings", () => {
    const m = initMachine();
    expect(m.scene).toBe("menu");
    expect(m.settings.matchLength).toBe(DEFAULT_MATCH_LENGTH);
    expect(m.settings.mode).toBe("1p");
  });

  it("menu confirm on the START row starts playing", () => {
    const onStart = { ...initMachine(), menuCursor: MENU_ROWS.indexOf("start") };
    const m = reduceMachine(onStart, { ...base, confirm: true });
    expect(m.scene).toBe("playing");
  });

  it("menu confirm on a settings row does NOT start playing", () => {
    const onMode = { ...initMachine(), menuCursor: MENU_ROWS.indexOf("mode") };
    const m = reduceMachine(onMode, { ...base, confirm: true });
    expect(m.scene).toBe("menu");
  });

  it("menu confirm on the music row toggles musicOn without starting", () => {
    const m0 = { ...initMachine(), menuCursor: MENU_ROWS.indexOf("music") };
    const m = reduceMachine(m0, { ...base, confirm: true });
    expect(m.scene).toBe("menu");
    expect(m.settings.musicOn).toBe(!m0.settings.musicOn);
  });

  it("playing + pause goes to paused; pause again resumes", () => {
    let m = startedMachine();
    m = reduceMachine(m, { ...base, pause: true });
    expect(m.scene).toBe("paused");
    m = reduceMachine(m, { ...base, pause: true });
    expect(m.scene).toBe("playing");
  });

  it("paused + both pause and confirm in one tick prefers resume (not restart)", () => {
    let m = startedMachine();
    m = reduceMachine(m, { ...base, pause: true }); // -> paused
    expect(m.scene).toBe("paused");
    // both edge-keys fire on the same tick: resume must win over restart.
    const resumed = reduceMachine(m, { ...base, pause: true, confirm: true });
    expect(resumed.scene).toBe("playing");
    // and pauseHasPriority must report that confirm should be ignored this tick,
    // so the loop does not reset the match state.
    expect(pauseHasPriority(m, { ...base, pause: true, confirm: true })).toBe(true);
    expect(pauseHasPriority(m, { ...base, confirm: true })).toBe(false);
  });

  it("paused + back returns to menu", () => {
    let m = startedMachine();
    m = reduceMachine(m, { ...base, pause: true });
    m = reduceMachine(m, { ...base, back: true });
    expect(m.scene).toBe("menu");
  });

  it("gameover + confirm rematches into playing", () => {
    const m = reduceMachine({ ...initMachine(), scene: "gameover" }, { ...base, confirm: true });
    expect(m.scene).toBe("playing");
  });

  it("gameover + back returns to menu", () => {
    const m = reduceMachine({ ...initMachine(), scene: "gameover" }, { ...base, back: true });
    expect(m.scene).toBe("menu");
  });

  it("requestGameOver flips playing to gameover", () => {
    let m = startedMachine();
    m = reduceMachine(m, base, true);
    expect(m.scene).toBe("gameover");
  });

  it("menu navLeft/navRight cycles match length among options", () => {
    const m = initMachine();
    // cursor must be on the matchLength row first
    const onRow = { ...m, menuCursor: 2 };
    const left = reduceMachine(onRow, { ...base, navLeft: true });
    const right = reduceMachine(onRow, { ...base, navRight: true });
    expect(left.settings.matchLength).not.toBe(right.settings.matchLength);
  });

  it("menu navRight on the music row toggles musicOn", () => {
    const m = { ...initMachine(), menuCursor: 3 };
    const toggled = reduceMachine(m, { ...base, navRight: true });
    expect(toggled.settings.musicOn).toBe(!m.settings.musicOn);
  });
});
