# Hello Clarence

A small, web-based RPG. You walk around a field, you find Clarence, you say hello.

Phaser 3 + TypeScript in the browser, Fastify on Node, one repo, one command to run it.

**[Play the latest build](https://github.com/jacklatrobe/HelloClarenceGame/actions)** — CI publishes the
`dist` artifact on every green `main` build.

## Requirements

- Node.js `>=22.12` (`.nvmrc` pins 24)
- npm 10+

## Quick start

```bash
git clone https://github.com/jacklatrobe/HelloClarenceGame.git
cd HelloClarenceGame
npm install
npm run dev
```

`npm run dev` starts two processes:

| Process | URL                   | What it is                                        |
| ------- | --------------------- | ------------------------------------------------- |
| client  | http://localhost:5173 | Vite dev server with HMR for the Phaser game      |
| server  | http://localhost:8787 | Fastify API (`/api/*`); Vite proxies to it in dev |

Open http://localhost:5173. If the server is down the game still runs and the HUD reads
`server: offline` — the client is never blocked on the API.

## Scripts

| Script                  | Does                                                        |
| ----------------------- | ----------------------------------------------------------- |
| `npm run dev`           | Client + server with watch mode                             |
| `npm run dev:client`    | Vite only                                                   |
| `npm run dev:server`    | Fastify only, restarts on change                            |
| `npm run build`         | Production client bundle into `dist/`                       |
| `npm start`             | Serves `dist/` plus `/api/*` from one Fastify process       |
| `npm run typecheck`     | `tsc` over the whole repo, then again with browser libs off |
| `npm run lint`          | ESLint (type-aware)                                         |
| `npm run format`        | Prettier, write                                             |
| `npm test`              | Vitest, single run                                          |
| `npm run test:coverage` | Vitest with v8 coverage                                     |
| `npm run smoke`         | Headless browser test of the built game (needs Chrome/Edge) |
| `npm run check`         | Everything CI runs, in order                                |

## Layout

```
index.html            Vite entry document
src/main.ts           Boots Phaser
src/game/             Scenes, dialogue, world generation
src/net/api.ts        Typed fetch helpers for /api
src/styles/           Global CSS (nothing here is bundled into the game canvas)
server/               Fastify app + HTTP entrypoint
shared/types.ts       Types shared by client and server, no runtime deps
tests/                Vitest specs
scripts/              Repo tooling (commit-message validation)
```

## Controls

| Key                      | Action                     |
| ------------------------ | -------------------------- |
| `W` `A` `S` `D` / arrows | Move                       |
| `E` or `Space`           | Talk to a nearby character |
| `1`–`9`                  | Pick a dialogue choice     |
| `Esc`                    | Leave a conversation       |

## How we work

Trunk-based, one short-lived branch per change, squash-merge into `main`, `main` is always
deployable. See [CONTRIBUTING.md](./CONTRIBUTING.md) and the branch rules in
[docs/governance.md](./docs/governance.md).

## License

MIT — see [LICENSE](./LICENSE).
