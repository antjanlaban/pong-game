import { SIM_DT } from "../config";

export interface Loop {
  start(): void;
  stop(): void;
}

/**
 * Fixed-timestep loop: calls `simTick(SIM_DT)` zero or more times per frame to
 * drain accumulated time, then `render()` once. Decouples physics from fps.
 */
export function createLoop(simTick: (dt: number) => void, render: () => void): Loop {
  let raf = 0;
  let last = 0;
  let acc = 0;
  let running = false;

  const frame = (now: number): void => {
    if (!running) return;
    const seconds = (now - last) / 1000;
    last = now;
    acc += Math.min(seconds, 0.25); // clamp huge gaps (tab switch)
    while (acc >= SIM_DT) {
      simTick(SIM_DT);
      acc -= SIM_DT;
    }
    render();
    raf = requestAnimationFrame(frame);
  };

  return {
    start(): void {
      if (running) return;
      running = true;
      last = performance.now();
      acc = 0;
      raf = requestAnimationFrame(frame);
    },
    stop(): void {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
}
