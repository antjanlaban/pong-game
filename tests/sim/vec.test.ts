import { describe, expect, it } from "vitest";
import { add, clampScalar, scale } from "../../src/sim/vec";

describe("vec", () => {
  it("adds two vectors componentwise", () => {
    expect(add({ x: 1, y: 2 }, { x: 3, y: -1 })).toEqual({ x: 4, y: 1 });
  });

  it("scales a vector", () => {
    expect(scale({ x: 2, y: -3 }, 2)).toEqual({ x: 4, y: -6 });
  });

  it("clamps a scalar into [min,max]", () => {
    expect(clampScalar(5, 0, 10)).toBe(5);
    expect(clampScalar(-1, 0, 10)).toBe(0);
    expect(clampScalar(99, 0, 10)).toBe(10);
  });
});
