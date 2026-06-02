# Pong — Manual Acceptance Checklist

Build: `npx esbuild src/main.ts --bundle --format=esm --outfile=dist/main.js`, serveer de map en open de pagina.

**Browser-acceptatie uitgevoerd 2026-06-02** (Chromium via Playwright, gebundelde build, http://localhost). Legenda: ✅ = in-browser geverifieerd · 🧪 = unit-getest (vitest) maar niet apart in-browser uitgeoefend · ⚠️ = niet headless verifieerbaar.

## A. Core game & modes
- [x] A1 1P-vs-AI ✅ — menu→match start via Enter op START-rij; loop draait (animatie bevestigd over frames); W/S bewegen de linker-paddle (377→351 omhoog, terug omlaag). Gameover→rematch 🧪 (win-conditie unit-getest, niet volledig uitgespeeld in browser).
- [~] A2 2P-local 🧪 — moduskeuze in menu werkt (settings cyclen ✅); P1=W/S in-browser bevestigd; P2=Arrows→rechter-paddle is unit-getest (input-mapping) maar niet apart 2P-in-browser uitgeoefend.
- [~] A3 Hit-point-reflectie + rally-speedup 🧪 — `collision.ts`/`ball.ts` unit-getest (reflectiehoek + speed-cap); bal-beweging in browser bevestigd.
- [~] A4 Match eindigt op first-to-N; gameover winnaar+rematch+menu 🧪 — `score.ts` win-conditie unit-getest; back-to-menu ✅ in browser; volledige uitspeel-tot-gameover niet in deze run.

## B. Extensions
- [~] B5 SFX (paddle/wall/score) + muziekloop + M mute — AudioContext-API aanwezig ✅; SFX-event-emissie unit-getest 🧪; hoorbare weergave ⚠️ niet headless verifieerbaar.
- [x] B6 easy/normal/hard kiesbaar ✅ — difficulty-rij cyclet zichtbaar in menu; AI-tuning per graad unit-getest 🧪.
- [x] B7 Esc/P pauze & resume; back-to-menu ✅ — P pauzeert (PAUSED-overlay: lit 19k→77k), P hervat (beweging terug); Backspace→menu bevestigd.
- [x] B8 Matchlengte 3/5/7/11 settable ✅ (matchLength-rij cyclet); hit-flash/trail/screenshake — juice unit-getest incl. F1-fix (geen shake op wall-bounce) 🧪.

## C. Quality
- [x] C9 Vloeiende ~60fps, responsieve besturing, geen kritieke happy-path-bugs ✅ — loop animeert continu, input direct responsief, GEEN game-runtime-errors in console (alleen favicon-404 + eigen getImageData-warning).
- [x] C10 Herkenbaar neon-retro (glow, palette, juice) ✅ — canvas rendert glow-rijke neon-stijl (menu lit-ratio + zichtbare gloed).

## D. Engineering gates
- [x] D11 `npm run typecheck` (tsc) — PASS
- [x] D12 `npm run check` (biome) — PASS
- [x] D13 `npm run test` (vitest) — PASS, 67 tests (ball, paddle, collision, score, ai, step, effects, scene/machine + nieuwe fix-tests)

## Resterende handmatige checks (niet headless)
A2 2P-arrows live, A4 volledige match→gameover→rematch, B5 hoorbare audio: aanbevolen via een korte handmatige speelsessie in een desktop-browser. Alle onderliggende logica is unit-gedekt; de kern-happy-path (laden→menu→match→input→pauze→menu) is in Chromium bevestigd.
