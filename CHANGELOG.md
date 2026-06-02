# Changelog

Alle wijzigingen aan Pong. Format: [keepachangelog.com](https://keepachangelog.com/en/1.1.0/). Versies volgen [SemVer](https://semver.org/).

## [0.2.0] — 2026-06-02 — eerste speelbare release

### Added

- **Kern-game** — 1P-vs-AI en 2P-lokaal (gedeeld keyboard), hoofdmenu (moduskeuze/instellingen/start), eindige win-conditie (first-to-N) met eindscherm (winnaar + rematch/menu).
- **Pure simulatie** (`src/sim/*`) — deterministische ball/paddle/collision/score/ai/step met seeded RNG; volledig unit-getest (vitest).
- **Neon-retro renderer** (`src/render/*`) — Canvas 2D met glow, plus de verplichte visuele juice: hit-flash, bal-trail, lichte screenshake (pure `effects.ts`, getest).
- **Geluid** (`src/io/audio.ts`) — procedurele WebAudio-SFX (paddle/muur/score) + dempbare muziekloop; geen externe assets.
- **AI-moeilijkheidsgraden** — easy/normal/hard via predictieve intercept-tracking met per-graad tuning.
- **Pauze + herstart** — pauzeren/hervatten, opnieuw beginnen, terug naar menu via pure scene-state-machine.
- **Instelbare matchlengte** — first-to-N (3/5/7/11).

### Engineering

- Vanilla TypeScript (strict) + Canvas 2D, geen engine; fixed-timestep loop (sim @ 120 Hz). Gates groen: typecheck, biome, 60 vitest-tests.
