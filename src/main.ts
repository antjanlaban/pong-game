import { FIELD_H, FIELD_W } from "./config";
import { createAudioManager } from "./io/audio";
import { createInputManager } from "./io/input";
import { createLoop } from "./io/loop";
import { initEffects, stepEffects } from "./render/effects";
import { drawGameOver, drawMenu, drawPause } from "./render/menu";
import { draw } from "./render/renderer";
import type { Machine } from "./scene/machine";
import { initMachine, pauseHasPriority, reduceMachine } from "./scene/machine";
import { mulberry32 } from "./sim/rng";
import { isMatchOver, winnerOf } from "./sim/score";
import { initGameState, stepGame } from "./sim/step";
import type { GameState } from "./types";

function bootstrap(): void {
  const canvas = document.getElementById("game") as HTMLCanvasElement | null;
  if (!canvas) throw new Error("missing #game canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  canvas.width = FIELD_W;
  canvas.height = FIELD_H;

  const input = createInputManager();
  const audio = createAudioManager();
  const rng = mulberry32(Date.now() >>> 0);

  let machine: Machine = initMachine();
  let game: GameState = initGameState(machine.settings, rng);
  let effects = initEffects();
  let prevScene = machine.scene;

  // first user gesture resumes audio (autoplay policy).
  const resumeAudio = (): void => audio.resume();
  window.addEventListener("keydown", resumeAudio, { once: true });
  window.addEventListener("pointerdown", resumeAudio, { once: true });

  function simTick(dt: number): void {
    const inputs = input.sample();

    if (inputs.mute) audio.toggleMuted();

    // capture the scene before reducing so transition handling can see where we came from.
    const fromMachine = machine;

    // PLAYING: advance the sim, detect match-over.
    if (machine.scene === "playing") {
      const result = stepGame(game, inputs, dt, rng);
      game = result.state;
      audio.playEvents(result.events, game.ball.speed);
      effects = stepEffects(effects, game, result.events, dt);
      const over = isMatchOver(game.score1, game.score2, game.settings.matchLength);
      machine = reduceMachine(machine, inputs, over);
      if (over) machine = { ...machine, winner: winnerOf(game.score1, game.score2) };
    } else {
      machine = reduceMachine(machine, inputs);
    }

    // handle scene entry transitions (reset state).
    if (machine.scene !== prevScene) {
      // entering play from menu/gameover starts a fresh match.
      if (machine.scene === "playing" && (prevScene === "menu" || prevScene === "gameover")) {
        audio.setMusicOn(machine.settings.musicOn);
        game = initGameState(machine.settings, rng);
        effects = initEffects();
      }
      // confirm-from-paused = restart (reset); a pause-toggle resume keeps state.
      // when both resume and restart fire in the same tick, resume wins, so we
      // must NOT reset the running match.
      if (
        machine.scene === "playing" &&
        prevScene === "paused" &&
        inputs.confirm &&
        !pauseHasPriority(fromMachine, inputs)
      ) {
        game = initGameState(machine.settings, rng);
        effects = initEffects();
      }
      prevScene = machine.scene;
    }
  }

  function render(): void {
    draw(ctx as CanvasRenderingContext2D, game, effects);
    if (machine.scene === "menu") {
      drawMenu(ctx as CanvasRenderingContext2D, machine);
    } else if (machine.scene === "paused") {
      drawPause(ctx as CanvasRenderingContext2D);
    } else if (machine.scene === "gameover" && machine.winner !== 0) {
      drawGameOver(ctx as CanvasRenderingContext2D, machine.winner);
    }
  }

  createLoop(simTick, render).start();
}

bootstrap();
