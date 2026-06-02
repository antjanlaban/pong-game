import { describe, expect, it } from "vitest";
import { mulberry32 } from "../../src/sim/rng";

describe("mulberry32", () => {
  it("is deterministic for a given seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = [a.next(), a.next(), a.next()];
    const seqB = [b.next(), b.next(), b.next()];
    expect(seqA).toEqual(seqB);
  });

  it("produces values in [0,1)", () => {
    const r = mulberry32(1);
    for (let i = 0; i < 100; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("different seeds differ", () => {
    expect(mulberry32(1).next()).not.toBe(mulberry32(2).next());
  });
});
