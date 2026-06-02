---
name: pure_sim_io_scheiding_testbare_game
description: Scheid pure simulatie (deterministisch, seeded RNG) van de IO-schil (render/input/audio/loop) zodat de game-happy-path unit-testbaar blijft
metadata:
  type: reference
---

Pong's architectuur scheidt `src/sim/*` (pure, deterministische functies met geïnjecteerde `dt` + seeded RNG: ball, paddle, collision, score, ai, step, effects, scene/machine) van de dunne IO-schil (`render/`, `io/` input·audio·loop). Gevolg: 67 vitest-tests dekken de kern-game-logica zonder DOM/Canvas/AudioContext.

**Why:** game-code wordt snel onverifieerbaar als physics/score/AI verweven raken met rendering en input. Door de simulatie puur en deterministisch te houden (geen `Date.now()`/`Math.random()` direct — RNG geïnjecteerd) zijn precieze assertions mogelijk (reflectiehoek, speed-cap, win-conditie, serve-determinisme) en kan een adversariële review de logica beoordelen.

**How to apply:** houd de simulatie een pure reducer (`step(state, input, dt) → state`); laat de IO-schil alleen state lezen en effecten afspelen. Test de sim exhaustief met vitest; reserveer browser-acceptatie (Playwright) voor wat de unit-tests niet kunnen: render, input-pipeline, audio, 60fps, scene-overgangen. Doe die browser-smoke als onderdeel van de implementatie, niet pas bij de promote.
