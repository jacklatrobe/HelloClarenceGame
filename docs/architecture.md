# Architecture

## The one-paragraph version

The browser owns the game. `src/` is a Phaser 3 application compiled by Vite; it has no knowledge
of the server other than a couple of `fetch` calls in `src/net/api.ts`. `server/` is a Fastify app
that serves the built client out of `dist/` and a small `/api` surface. Types that cross the wire
live in `shared/types.ts` and are imported by both sides, so a change to the API shape is a
compile error in two places instead of a runtime surprise. There is no database and no auth yet.

## Why these choices

| Decision                 | Alternative considered            | Reason                                                                   |
| ------------------------ | --------------------------------- | ------------------------------------------------------------------------ |
| Phaser 3                 | Pixi, raw canvas, Godot web       | Batteries-included scenes/physics/input; the whole game is ~400 lines.   |
| Vite                     | webpack, esbuild alone            | Instant HMR, first-class TS, and Vitest reuses its config.               |
| Fastify                  | Express, `node:http`              | Schema-first, fast, and `app.inject()` makes route tests trivial.        |
| One package, no monorepo | npm/pnpm workspaces               | Two consumers is not a monorepo. Revisit if a second deployable appears. |
| Node type-stripping off  | `node --experimental-strip-types` | `tsx` is boring and works everywhere, including CI.                      |
| Procedural textures      | Committed PNGs                    | No binary art in the repo while the art direction is undecided.          |

## Module boundaries

```
src/main.ts                → boots Phaser, nothing else
src/game/config.ts         → Phaser config + the one registry key contract
src/game/scenes/*          → rendering, input. Thin. No business rules.
src/game/world/mapgen.ts   → pure: (seed, size) → GameMap
src/game/dialogue/*        → pure: DialogueGraph → DialogueRunner state machine
src/net/api.ts             → the only place that calls fetch()
server/app.ts              → routes + static hosting; buildApp() is testable
server/index.ts            → listen(), signal handling. Nothing else.
shared/types.ts            → wire types. Zero runtime code.
```

**The rule:** scenes are allowed to be ugly. Logic modules are not allowed to know Phaser exists.
`mapgen.ts` and `DialogueRunner.ts` take plain data and return plain data, which is why they are
the only things with real test coverage today.

## Runtime shape

**Development** — two processes. Vite on `:5173` owns the UI and proxies `/api` to Fastify on
`:8787`. Editing a scene hot-reloads; editing the server restarts it.

**Production** — one process. `npm run build` emits `dist/`, then `npm start` runs Fastify, which
serves `dist/` as static files with an SPA fallback and answers `/api/*`. Unknown `/api/*` paths
get a JSON 404 rather than the SPA shell.

## Failure modes we accept

- **API down in dev.** The game boots and shows `server: offline`. The client never awaits the API
  on the critical path.
- **`dist/` missing when the server starts.** `buildApp()` skips static registration silently, which
  is why the server tests pass without a build step.
- **Map generation changing the world.** Maps are seeded and deterministic; `MAP_SEED` in
  `WorldScene.ts` is the whole save file right now.

## Next architectural decisions (not yet made)

1. Persistence: `localStorage` first, then a real store behind `/api/saves`.
2. Whether content (dialogue, maps) moves to JSON/TOML loaded at runtime or stays as typed modules.
3. Multiplayer: authoritative server or peer-to-peer. Everything above assumes single-player until
   that is decided.
