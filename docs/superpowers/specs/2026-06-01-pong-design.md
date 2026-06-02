# Pong — Design Spec

**Status:** Approved (AI-only brainstorm 2026-06-01; user unavailable, all clarifying decisions resolved in-spec).
**Type:** Design-spec (volgt op de opdracht-brief `2026-05-19-pong-opdracht.md`). Hieruit volgt een implementation-plan via `superpowers:writing-plans`.
**Werkmap:** `C:/Users/Antjan/projects/pong-game` (LabTech ts-default scaffold: bun, TypeScript strict, biome, vitest).

---

## Mission

- **Doel:** Eén browser-speelbare, moderne Pong (1P-vs-AI en 2P-lokaal) opleveren als eerste eindige werklast die de volledige Spec A-route doorloopt.
- **Scope binnen:** Kern-game (twee modi: 1P-vs-AI en 2P-lokaal-gedeeld-keyboard; hoofdmenu met moduskeuze/instellingen/start; eindige win-conditie + eindscherm met winnaar + rematch/terug-naar-menu) plus vier verplichte uitbreidingen: (1) geluid — SFX (paddle/muur/score) + lichte dempbare achtergrondmuziek; (2) AI-moeilijkheidsgraden (easy/normal/hard); (3) pauze + herstart (pauzeren/hervatten, opnieuw beginnen, terug naar menu); (4) instelbare matchlengte (first-to-N) + visuele juice (hit-flash, bal-trail, lichte screenshake).
- **Scope buiten:** Online/netwerk-multiplayer, accounts/login, cross-sessie persistentie/online leaderboards, mobiel/touch-besturing. Desktop-keyboard is de doelinput.
- **Succescriterium:** Game-DoD — beide modi volledig speelbaar menu→match→eindscherm→rematch/menu; alle 4 uitbreidingen werken; vloeiende gameplay (richt 60 fps); visueel "modern & niet-generiek"; geen kritieke happy-path-bugs; responsieve besturing.

---

## Gekozen aanpak + motivatie

**Gekozen: vanilla TypeScript + Canvas 2D, met een strikt gescheiden pure-simulatielaag en een dunne render/IO-schil.** De game-logica (bal, paddles, physics, score, win-conditie, AI) leeft in pure, side-effect-vrije TS-modules die een `GameState` nemen en een nieuwe state teruggeven; rendering (Canvas), input (keyboard), audio (WebAudio) en de scene-state-machine (menu/playing/paused/gameover) zijn aparte, dunne lagen eromheen. Dit maakt de happy-path volledig vitest-testbaar zonder DOM/canvas, en houdt de repo self-contained (geen externe binaire assets).

**Afgewezen alternatieven:**

1. **Game-engine (Phaser / PixiJS / kaboom.js).** Levert kant-en-klare scene-graph, sprites en audio, maar voegt een zware dependency + bundel toe, vertroebelt de pure-sim/render-scheiding (engine-objecten zijn stateful en moeilijk los te unit-testen), en de memory-indicatie zegt expliciet "geen zware engine". Voor één Pong is dit overkill en werkt het de testbaarheidseis tegen. *Afgewezen.*
2. **React + state-driven rendering.** Bekend en component-vriendelijk, maar React's render-model past slecht op een 60 fps imperatieve game-loop (per-frame reconciliation is verspilling), en dwingt een runtime-dependency af die de scaffold niet heeft. Menu's zouden mooi zijn maar de match-loop zou alsnog buiten React om op canvas moeten draaien — dan liever één consistent model. *Afgewezen.*
3. **Vanilla TS + DOM/CSS (divs als paddles/bal).** Geen canvas nodig en CSS-transitions geven gratis juice, maar DOM-manipulatie op 60 fps schaalt slecht (bal-trail = veel nodes), screenshake/glow zijn omslachtig, en de neon-glow-look (additive `shadowBlur`) is op canvas triviaal en op DOM niet. *Afgewezen.*

De gekozen aanpak wint op alle drie de assen die de mission/architectuur-richtlijn eisen: **testbaarheid** (pure sim los van IO), **self-contained** (geen assets, geen runtime-deps buiten de scaffold), en **performance/look** (canvas 2D met glow haalt moeiteloos 60 fps en levert de niet-generieke stijl).

---

## Visuele stijl — neon-retro / synthwave

Bewust niet-generiek. Geen platte zwart-wit-Pong.

- **Palet (donker, hoog contrast):** achtergrond near-black `#0a0a14` met een subtiele, naar de horizon vervagende grid-gloed; speler 1 = neon-cyaan `#22d3ee`; speler 2 / AI = neon-magenta `#f472b6`; bal = warm-wit `#fef9c3` met cyaan/magenta tint afhankelijk van wie hem laatst raakte; accent/score = elektrisch paars `#a855f7`.
- **Gloed:** alle bewegende elementen via additieve `ctx.shadowBlur` + `shadowColor` (bloom-achtig) zodat paddles en bal "lichtgevend" ogen.
- **Speelveld:** centrale stippellijn als zachtgloeiende segmenten; dunne rand-frame; subtiel grid op de achtergrond dat licht meebeweegt bij screenshake.
- **Typografie:** één geometrische sans (system stack: `ui-monospace`/`"Segoe UI"` fallback, geen webfont-asset) in caps voor menu/score; ruime letterspacing voor de "arcade modern" toon.
- **Beweging als identiteit:** de juice (trail/flash/shake) ís de stijl — het veld voelt levend zonder druk te worden.

Motivatie: neon-retro is op Canvas 2D goedkoop te realiseren (glow = één property), heeft een sterke eigen identiteit (anti-generiek), en de vier verplichte juice-effecten versterken precies deze look in plaats van eraan toegevoegd te zijn.

---

## Tech-stack + module-architectuur

**Stack (bevestigd):** Bun runtime, TypeScript strict (bestaande `tsconfig`), Biome lint/format, Vitest tests. Geen extra runtime-dependencies. Voor lokaal draaien serveren we `index.html` via `bun` (statische serve) of een dev-server-script; geen bundler-keuze nodig omdat browsers ESM-modules direct laden (we leveren `index.html` die `src/main.ts` als `<script type="module">` laadt; optioneel `bun build` voor één gebundeld bestand).

**Architectuurprincipe:** pure simulatie (deterministisch, geen `Date.now`, geen `Math.random` direct — RNG en `dt` worden geïnjecteerd) ⟂ IO-schil (canvas/keyboard/audio/loop). De sim kent de DOM niet.

**Bestandslijst-voorstel:**

```
src/
  main.ts                 # entrypoint: bootstrapt canvas, audio, input, loop, scene-machine
  config.ts               # FIELD_W/H, paddle-/bal-constants, AI-tuning-tabel, palet
  types.ts                # GameState, Paddle, Ball, Vec2, Settings, Difficulty, Mode, Scene, InputState

  sim/                    # PURE — geen DOM/canvas/audio, volledig unit-getest
    vec.ts                # vec-helpers (add, scale, clamp)
    rng.ts                # injecteerbare seeded RNG (mulberry32) voor deterministische tests
    ball.ts               # serve(), stepBall(): beweging + muur-bounce + speed-up per rally
    paddle.ts             # stepPaddle(): clamped beweging binnen veld
    collision.ts          # ballPaddleCollision(): detectie + reflectiehoek o.b.v. trefpunt
    score.ts              # applyScore(), isMatchOver(), winnerOf() (first-to-N)
    ai.ts                 # predictInterceptY(), aiTargetVelocity() per Difficulty
    step.ts               # stepGame(state, inputs, dt, rng): orchestreert één sim-tick + emit events

  render/                 # IMPURE — leest state, tekent
    renderer.ts           # draw(state): veld, paddles, bal, score, trail, flash, shake-offset
    effects.ts            # juice-state: trail-buffer, flash-timers, shake-decay (pure berekening, render leest)
    menu.ts               # tekent menu/instellingen/pauze/gameover-overlays

  io/                     # IMPURE — randapparaten
    input.ts              # keyboard → InputState (P1 W/S, P2 Up/Down, menu-/pauze-/mute-keys)
    audio.ts              # WebAudio: procedurele SFX (paddle/muur/score) + dempbare muziekloop
    loop.ts               # requestAnimationFrame fixed-timestep accumulator (sim op vaste dt)

  scene/
    machine.ts            # scene-state-machine: MENU → PLAYING ⇄ PAUSED → GAMEOVER → (rematch|menu)
                          # vertaalt input naar transities; bezit Settings; roept sim + render aan

index.html                # canvas + module-script
tests/
  sim/ball.test.ts
  sim/paddle.test.ts
  sim/collision.test.ts
  sim/score.test.ts
  sim/ai.test.ts
  sim/step.test.ts
  scene/machine.test.ts    # transities (pure, met fake input)
```

De `effects.ts` juice-berekening (trail-buffer-update, flash/shake-decay over `dt`) is bewust een pure functie zodat ook die deterministisch getest kan worden; `renderer.ts` doet alleen de canvas-calls.

---

## Game-mechanica

**Veld:** logisch coördinatenstelsel `FIELD_W = 1280`, `FIELD_H = 720` (canvas schaalt hierop, los van pixelresolutie). Oorsprong linksboven, y omlaag.

**Paddles:** breedte 16, hoogte 110; P1 links (x ≈ 48), P2 rechts (x ≈ FIELD_W−48−16). Snelheid 900 px/s (human, vol ingedrukt). Beweging geclamped tussen veldranden.

**Bal:** straal 10. Start-snelheid 540 px/s, richting bij serve willekeurig (geïnjecteerde RNG) maar nooit te verticaal (|vx| ≥ 0.45·speed gegarandeerd). Bovenkant/onderkant = reflectie (vy flip). Elke paddle-hit verhoogt de snelheid met factor 1.04, capped op 1100 px/s.

**Paddle-collision + hoek:** bij contact wordt vx omgekeerd; de verticale uitgaande component wordt bepaald door het trefpunt op de paddle (genormaliseerd −1..1 t.o.v. paddle-midden) × max-hoek (≈ 60°). Zo is "richten" mogelijk — kernfeel van Pong. Een lichte demping voorkomt vastlopen bij randtreffers.

**Score + win-conditie:** bal voorbij linkerrand → punt P2; voorbij rechterrand → punt P1. Na een punt: korte pauze (≈ 0.6 s, "serve delay"), dan serve richting de speler die het punt verloor. **Win:** first-to-N (N = matchlengte-instelling, default 7); `isMatchOver` true zodra een speler N haalt; `winnerOf` geeft de winnaar → scene → GAMEOVER.

**Determinisme:** `stepGame(state, inputs, dt, rng)` is puur en idempotent per tick. De game-loop draait een fixed-timestep accumulator (sim-dt = 1/120 s) ontkoppeld van de render-fps, zodat physics frame-rate-onafhankelijk en reproduceerbaar is (en testbaar met vaste dt-sequenties).

---

## AI-design per graad

**Algoritme:** predictieve tracking. Per tick, alleen wanneer de bal naar de AI-paddle toe beweegt, berekent de AI de voorspelde intercept-y aan de AI-x (inclusief muur-bounces via reflectie-vouwing). Daarop worden per graad imperfecties toegepast:

- **reactietijd** — de AI herberekent zijn doel-y pas elke `reactionMs`; ertussen houdt hij het oude doel vast (simuleert traagheid).
- **predictionError** — een (RNG-bepaalde, dus testbaar) offset opgeteld bij de voorspelde y, in paddle-hoogtes.
- **maxSpeed** — plafond op paddle-snelheid (fractie van human-snelheid).
- **deadZone** — als |doel-y − paddle-midden| kleiner is dan deze marge, beweegt de AI niet (voorkomt jitter en geeft openingen).

Wanneer de bal van de AI wég beweegt, drijft de paddle traag terug naar het veldmidden (menselijk "resetten").

**Tuning-tabel (`config.ts`):**

| Graad   | maxSpeed (×human) | reactionMs | predictionError (±paddle-h) | deadZone (px) |
|---------|-------------------|------------|-----------------------------|---------------|
| easy    | 0.55              | 220        | 0.9                         | 40            |
| normal  | 0.78              | 120        | 0.4                         | 22            |
| hard    | 0.95              | 55         | 0.12                        | 10            |

Easy is verslaanbaar en traag met grove missers; hard is snel, reageert bijna direct en mist zelden, maar de `deadZone` + niet-nul `predictionError` houden hem niet perfect (anders onverslaanbaar/saai). Alle randomness loopt via de geïnjecteerde seeded RNG, dus `ai.test.ts` kan exact gedrag asserteren.

---

## Input-mapping

Gedeeld keyboard, desktop. `io/input.ts` houdt een `Set` van ingedrukte keys bij en projecteert die per tick naar een `InputState` (P1-richting −1/0/+1, P2-richting, plus edge-triggered menu-acties).

| Actie                       | Toets(en)            |
|-----------------------------|----------------------|
| Speler 1 omhoog / omlaag    | **W** / **S**        |
| Speler 2 omhoog / omlaag    | **ArrowUp** / **ArrowDown** |
| Menu navigeren              | **ArrowUp/Down** (item), **ArrowLeft/Right** (waarde wijzigen) |
| Bevestigen / start / rematch| **Enter** (ook **Space**) |
| Pauze / hervatten           | **Escape** (ook **P**) |
| Terug naar menu (pauze/gameover) | **Backspace** (of menu-item) |
| Geluid dempen / ontdempen   | **M**                |

In 1P-modus bestuurt de mens P1 (W/S); de AI bestuurt P2. In 2P bestuurt mens-1 P1 (W/S) en mens-2 P2 (pijltjes). `preventDefault` op pijltjes/Space tijdens spelen om page-scroll te voorkomen.

---

## Audio-aanpak

**Volledig procedureel via de WebAudio API — geen externe binaire assets.** `io/audio.ts` bezit één `AudioContext` (lazily gestart op de eerste user-gesture, zoals browsers eisen) en een master-gain voor mute.

- **SFX (oscillator + gain-envelope, korte ADSR):**
  - *paddle-hit:* korte square/triangle "blip", toonhoogte licht variërend met bal-snelheid.
  - *muur-bounce:* lagere, kortere sine "tok".
  - *score:* dalende/stijgende twee-tonen sine "jingle" (anders voor P1 vs P2).
- **Achtergrondmuziek:** een simpele, zachte procedurele arpeggio-loop (paar oscillators over een vaste akkoord-progressie met lowpass + lage gain) — bewust onopdringerig en dempbaar.
- **Mute:** **M** zet master-gain op 0 (muziek én SFX); status zichtbaar in menu en als klein icoon in-game. Muziek is daarnaast los uit te zetten in instellingen.

Audio leeft volledig in de IO-schil; de pure sim emit alleen *event-flags* (bv. `events: { paddleHit, wallHit, scored }`) in zijn return-waarde, die `audio.ts` afspeelt. Zo blijft de sim testbaar en geluidloos.

---

## De vier verplichte uitbreidingen — concreet

### 1. Geluid
Zoals hierboven: procedurele SFX voor paddle/muur/score + dempbare procedurele muziekloop. Sim emit events; IO speelt af. Mute via **M** + instelling muziek-aan/uit. **DoD-haak:** elk van de drie SFX-events speelt aantoonbaar (handmatige visuele/audio-acceptatie); sim-event-emissie is unit-getest.

### 2. AI-moeilijkheidsgraden
Easy/normal/hard, kiesbaar in het menu/instellingen vóór een 1P-match (en aanpasbaar bij rematch). Tuning per de tabel hierboven, gestuurd door `ai.ts`. **DoD-haak:** `ai.test.ts` verifieert per graad meetbaar verschil (bv. hard onderschept een rechte bal binnen X ticks, easy mist met de ingestelde error); de drie graden zijn selecteerbaar en hebben merkbaar ander speelgedrag.

### 3. Pauze + herstart
Tijdens PLAYING schakelt **Escape/P** naar PAUSED (sim bevriest, overlay toont opties). Vanuit PAUSED: hervatten, **opnieuw beginnen** (reset scores + serve, zelfde settings), of **terug naar menu**. **DoD-haak:** `scene/machine.test.ts` verifieert PLAYING⇄PAUSED en PAUSED→(resume/restart/menu); bij pauze verandert de sim-state niet over ticks.

### 4. Instelbare matchlengte + visuele juice
- **Matchlengte:** first-to-N kiesbaar in instellingen (opties bv. 3 / 5 / 7 / 11, default 7); `score.isMatchOver` gebruikt N. **DoD-haak:** `score.test.ts` verifieert win precies bij N voor elke optie.
- **Juice (de stijl-identiteit):**
  - *hit-flash:* bij paddle-/muur-hit een korte witte/gekleurde flash op het getroffen element + lichte veld-flash, met `dt`-gebaseerde decay.
  - *bal-trail:* ringbuffer van laatste posities, gerenderd als vervagende gloeiende segmenten achter de bal.
  - *screenshake:* korte, dalende offset op de hele render-transform bij paddle-hit (klein) en score (iets groter); amplitude decay via `effects.ts`.
  Alle drie zijn berekend in de **pure** `effects.ts` (buffer/timers over `dt`) en alleen *getekend* in `renderer.ts`. **DoD-haak:** `effects.test.ts` verifieert dat trail-buffer correct vult/verschuift en flash/shake naar 0 decayen; visuele aanwezigheid via handmatige acceptatie.

---

## Scene-state-machine

```
MENU ──start──▶ PLAYING ──Esc/P──▶ PAUSED
  ▲               │  ▲                 │
  │            score │  └──resume───────┘
  │            =N │                     │
  │               ▼          restart    │
  │           GAMEOVER ◀──────────────  │
  └──menu◀── (rematch ▶ PLAYING) ◀──menu─┘
```

`MENU` bezit de `Settings` (mode, difficulty, matchlength, music-on). `PLAYING` draait de fixed-timestep loop. `PAUSED` bevriest de sim maar blijft renderen (overlay). `GAMEOVER` toont winnaar + rematch (zelfde settings, scores reset) of terug-naar-menu. De machine is een pure reducer `(scene, event) → scene` waar mogelijk, zodat transities unit-getest zijn.

---

## Definition of Done (meetbaar, verifieerbaar)

Acceptatiecriteria — genummerd, elk afzonderlijk verifieerbaar:

**A. Kern-game & modi**
1. Vanuit het hoofdmenu zijn **1P-vs-AI** en **2P-lokaal** beide te starten en volledig te spelen menu→match→eindscherm→rematch/menu.
2. In 1P bestuurt de mens P1 (W/S) en speelt de AI P2; in 2P besturen twee mensen P1 (W/S) en P2 (pijltjes) op één keyboard.
3. Een paddle-hit reflecteert de bal met een trefpunt-afhankelijke hoek (richten werkt); bal versnelt per rally tot de cap.
4. Een match eindigt exact bij first-to-N met een eindscherm dat de **winnaar** toont plus **rematch** en **terug-naar-menu**.

**B. Uitbreidingen**
5. SFX spelen voor paddle-, muur- én score-events; een dempbare achtergrondmuziekloop speelt; **M** dempt alles.
6. Easy/normal/hard zijn selecteerbaar en vertonen merkbaar verschillend AI-gedrag conform de tuning-tabel.
7. **Escape/P** pauzeert en hervat; vanuit pauze werken opnieuw-beginnen en terug-naar-menu; tijdens pauze staat de sim stil.
8. Matchlengte (3/5/7/11) is instelbaar en bepaalt de win-conditie; hit-flash, bal-trail en screenshake zijn alle drie zichtbaar tijdens het spel.

**C. Kwaliteit**
9. Vloeiende gameplay richt 60 fps (fixed-timestep sim ontkoppeld van render); geen kritieke happy-path-bugs; besturing is responsief (input per tick verwerkt).
10. Stijl is herkenbaar neon-retro (glow, palet, juice) — visuele acceptatie via een korte handmatige run.

**D. Engineering / gates (Spec A prod-tier)**
11. `bun run typecheck` slaagt (strict, geen `any`-lekken in publieke sim-API).
12. `bun run check` (Biome lint+format) slaagt.
13. `bun test` slaagt; **unit-getest zijn ten minste:** `ball` (beweging + muur-bounce + speed-cap), `paddle` (clamp), `collision` (reflectiehoek per trefpunt), `score` (punt-toekenning + isMatchOver per N + winnaar), `ai` (intercept-voorspelling + per-graad gedrag met seeded RNG), `step` (één-tick-orchestratie + event-emissie), `effects` (trail-buffer + flash/shake-decay), en `scene/machine` (alle transities). Pure sim heeft geen DOM/canvas/audio-afhankelijkheid in tests.

**Totaal: 13 acceptatiecriteria** (A:4, B:4, C:2, D:3), met 8 unit-getest modulegebieden onder criterium 13.

---

## Wat bewust NIET in scope (YAGNI)

Geen bundler-/framework-keuze, geen asset-pipeline, geen persistente settings/highscores, geen online/touch/accounts. Settings leven in-memory voor de sessie. Eén canvas, één HTML-bestand.
