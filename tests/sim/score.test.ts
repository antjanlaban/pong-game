import { describe, expect, it } from "vitest";
import { isMatchOver, winnerOf } from "../../src/sim/score";

describe("isMatchOver", () => {
  for (const n of [3, 5, 7, 11]) {
    it(`is over exactly when a player reaches N=${n}`, () => {
      expect(isMatchOver(n - 1, n - 1, n)).toBe(false);
      expect(isMatchOver(n, n - 1, n)).toBe(true);
      expect(isMatchOver(n - 1, n, n)).toBe(true);
    });
  }
});

describe("winnerOf", () => {
  it("returns 1 when P1 has the higher score", () => {
    expect(winnerOf(7, 3)).toBe(1);
  });
  it("returns 2 when P2 has the higher score", () => {
    expect(winnerOf(2, 7)).toBe(2);
  });
});
