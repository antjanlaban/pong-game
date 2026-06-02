import type { InputState } from "../types";

const HELD_KEYS = new Set(["KeyW", "KeyS", "ArrowUp", "ArrowDown"]);

const EDGE_KEYS = new Set([
  "Enter",
  "Space",
  "Escape",
  "KeyP",
  "Backspace",
  "KeyM",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]);

const PREVENT_DEFAULT = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"]);

export interface InputManager {
  /** read + consume edge-triggered actions for this tick. */
  sample(): InputState;
  dispose(): void;
}

export function createInputManager(target: Window = window): InputManager {
  const held = new Set<string>();
  const edges = new Set<string>();

  const onDown = (e: KeyboardEvent): void => {
    if (PREVENT_DEFAULT.has(e.code)) e.preventDefault();
    if (HELD_KEYS.has(e.code)) held.add(e.code);
    if (EDGE_KEYS.has(e.code) && !e.repeat) edges.add(e.code);
  };
  const onUp = (e: KeyboardEvent): void => {
    held.delete(e.code);
  };

  target.addEventListener("keydown", onDown);
  target.addEventListener("keyup", onUp);

  function dir(up: string, down: string): -1 | 0 | 1 {
    const u = held.has(up);
    const d = held.has(down);
    if (u && !d) return -1;
    if (d && !u) return 1;
    return 0;
  }

  return {
    sample(): InputState {
      const state: InputState = {
        p1Dir: dir("KeyW", "KeyS"),
        p2Dir: dir("ArrowUp", "ArrowDown"),
        confirm: edges.has("Enter") || edges.has("Space"),
        pause: edges.has("Escape") || edges.has("KeyP"),
        back: edges.has("Backspace"),
        mute: edges.has("KeyM"),
        navUp: edges.has("ArrowUp"),
        navDown: edges.has("ArrowDown"),
        navLeft: edges.has("ArrowLeft"),
        navRight: edges.has("ArrowRight"),
      };
      edges.clear();
      return state;
    },
    dispose(): void {
      target.removeEventListener("keydown", onDown);
      target.removeEventListener("keyup", onUp);
    },
  };
}
