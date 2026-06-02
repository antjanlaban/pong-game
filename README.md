# pong-game



## Stack

- Runtime: Bun
- Test: Vitest
- Lint/format: Biome
- Type-check: TypeScript

## Aan de slag

```bash
bun install
bun test
bun run typecheck
bun run check
```

## Run & verify

- Dev gates: `bun run typecheck`, `bun run check`, `bun run test`.
- Play: serve the folder statically (`bunx serve .`) and open the page. If the browser refuses to execute `src/main.ts` directly, bundle first: `bun build src/main.ts --outfile=dist/main.js` and point `index.html` at `./dist/main.js`.
- Acceptance: walk `docs/superpowers/acceptance/2026-06-01-pong-acceptance.md`.

## LabTech-werkstroom

Deze repo gebruikt [LabTech](https://github.com/) — zie `CLAUDE.md` en `.claude/labtech.json` voor tier-info.

- Experiment? `/start-experiment <naam>` (in een Claude-sessie).
- Klaar? `/promote-to-main`.

<!-- LABTECH-KICKOFF -->
## 🎯 Zo bouw je dit in 1 keer

Als je later terugkomt en deze opdracht wilt láten bouwen via de LabTech-route:

```bash
cd "/c/Users/Antjan/projects/pong-game"
bun install        # eenmalig de dependencies installeren
claude
```

…en typ in die Claude-sessie precies deze regel:

```
/auto --from idea docs/superpowers/specs/2026-05-19-pong-opdracht.md
```

`/auto` doorloopt mission-wizard → brainstorm → plan → bouw → promote → retrospect autonoom.

> Origineel ingebouwd door `/start-project` op 2026-06-01.
<!-- /LABTECH-KICKOFF -->
