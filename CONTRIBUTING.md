# Contributing

This is a solo project, so the rules are here to protect future-me from past-me. They are
deliberately light: one branch, one PR, green CI, squash merge. Nothing more.

## The loop

```bash
git switch main && git pull --ff-only
git switch -c feat/short-description

# work, then:
npm run check          # format + lint + typecheck + test + build

git commit -m "feat(world): describe the change"
git push -u origin HEAD
gh pr create --fill    # or open the PR in the browser
```

CI runs. When `verify` and `pr-title` are green, squash-merge and delete the branch.

## Branches

| Pattern        | Use for                                               |
| -------------- | ----------------------------------------------------- |
| `feat/<slug>`  | New gameplay, content, or capability                  |
| `fix/<slug>`   | A bug fix                                             |
| `chore/<slug>` | Tooling, deps, CI, refactors with no behaviour change |
| `docs/<slug>`  | Documentation only                                    |
| `spike/<slug>` | Throwaway exploration; do not merge as-is             |

Branches are short-lived. If a branch is more than a few days old, it is too big — cut it down.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), enforced by a `commit-msg` hook
and by CI on PR titles:

```
<type>(<optional scope>): <description>

feat(world): place Clarence on a walkable tile
fix(dialogue): ignore input for one frame after opening
docs: explain the trunk-based branch model
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

Because `main` only receives squash merges, **the PR title becomes the commit on `main`** — write
it as the commit you want to see in `git log`.

Useful scopes: `world`, `dialogue`, `scenes`, `api`, `ci`, `deps`, `docs`.

## Definition of done

A PR is mergeable when:

1. `npm run check` passes locally.
2. CI is green (`verify`, `pr-title`, `dependency-review`).
3. Anything that touches scenes or input has been through `npm run smoke`.
4. Tests cover the new logic, or the PR explains why they cannot.
5. No secrets, tokens, or `.env` files are in the diff.
6. Public behaviour changes are reflected in the README or `docs/`.

## Before a release

```bash
npm run smoke
```

This builds, boots the real server on a free port, drives headless Chrome through boot → walk →
talk → branch → exit, and writes screenshots to `artifacts/smoke/`. It is not part of
`npm run check` because it needs a browser installed. Use `SMOKE_CHANNEL=msedge` if Chrome is not
available.

## Testing rules of thumb

- Pure logic (world generation, dialogue state, economy maths) gets unit tests. No exceptions.
- Phaser scenes are hard to test in Node; keep decision logic out of scenes and in `src/game/**`
  modules that take plain data in and return plain data out.
- Server routes are tested through `app.inject()`, not by binding a port.

## Security

- Never commit tokens. `.env` is git-ignored; `.env.example` documents the shape.
- `main` has secret scanning and push protection enabled.
- Report vulnerabilities privately via
  [security advisories](https://github.com/jacklatrobe/HelloClarenceGame/security/advisories/new).

## Housekeeping

- Dependabot opens grouped minor/patch bumps every Monday. Merge them when CI is green.
- Every ~10 merges, or after any dependency bump, run `npm run test:coverage` and look for logic
  that has drifted away from its tests.
- Delete merged branches. The repo is configured to do it for you on merge.
