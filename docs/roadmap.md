# Roadmap

Rough, and expected to be wrong. Order is a suggestion, not a promise.

## Now — make it a game loop

- [ ] A save/load of player position and progress in `localStorage`
- [ ] More than one NPC, and dialogue that remembers what you said
- [ ] Items and a simple inventory
- [ ] Real sprite art to replace the procedural textures

## Next — make it a world

- [ ] Multiple maps and doors between them
- [ ] Dialogue and map content loaded from data files, not TypeScript modules
- [ ] Sound and music, with a mute toggle
- [ ] Gamepad and touch input

## Later — make it a project

- [ ] Persistence behind `/api/saves` with a real store
- [ ] A playable build published per release (GitHub Pages or a static host)
- [ ] Visual regression snapshots for the HUD and dialogue box
- [ ] Playwright smoke test: boot, walk, talk

## Explicitly not doing yet

- Accounts and auth
- Multiplayer
- A level editor
- A component library

Each of those is a multi-week commitment that would starve the actual game. Revisit when the
single-player loop is fun.
