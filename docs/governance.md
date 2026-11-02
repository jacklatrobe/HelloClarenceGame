# Governance: branches, PRs, and CI

How this repo is configured, and how to change it. Keep this file in sync with reality — it is
the source of truth for "why is my push rejected?".

## Repository settings

| Setting                | Value    | Why                                                      |
| ---------------------- | -------- | -------------------------------------------------------- |
| Default branch         | `main`   | Trunk. Always deployable.                                |
| Delete branch on merge | on       | No stale branches to clean up.                           |
| Allow auto-merge       | on       | Flip a PR to auto-merge and walk away.                   |
| Update branch button   | on       | One click to satisfy the up-to-date requirement.         |
| Merge commits          | off      | A linear `main` history that reads like a changelog.     |
| Squash merge           | on       | Default for feature branches.                            |
| Rebase merge           | on       | For branches whose individual commits are worth keeping. |
| Squash commit title    | PR title | Makes the conventional-commit PR title check meaningful. |
| Squash commit message  | PR body  | The PR description becomes the commit body.              |

## `main` ruleset

Applied to `~DEFAULT_BRANCH`, enforcement `active`.

| Rule                             | Setting              | Why                                                          |
| -------------------------------- | -------------------- | ------------------------------------------------------------ |
| Restrict deletions               | on                   | You cannot delete trunk by accident.                         |
| Block force pushes               | on                   | Rewriting `main` is never the answer.                        |
| Require linear history           | on                   | No merge-commit spaghetti.                                   |
| Require a pull request           | on                   | Every change has a written rationale.                        |
| Required approvals               | **0**                | Solo dev: GitHub forbids self-approval, so 1 would deadlock. |
| Dismiss stale reviews on push    | on                   | Harmless with 0 approvals; correct if a reviewer is added.   |
| Require review thread resolution | on                   | Comments block merge until resolved.                         |
| Allowed merge methods            | squash, rebase       | Matches the repo settings above.                             |
| Required status checks           | `verify`, `pr-title` | The two CI gates.                                            |
| Require branches up to date      | on                   | Checks run against what actually lands on `main`.            |

**Bypass:** the `Repository admin` role bypasses the ruleset. That is the escape hatch — a hotfix
at 2am, a broken lockfile, a revert. Use it, then open a follow-up PR that explains what happened.
Bypass is intentional; if it starts being used weekly, the process is wrong, not the rule.

## Required checks

| Check               | Job      | Runs on                 | What it does                                                           |
| ------------------- | -------- | ----------------------- | ---------------------------------------------------------------------- |
| `verify`            | `ci.yml` | push to `main`, all PRs | `format:check`, `lint`, `typecheck`, `test`, `build` + artifact upload |
| `pr-title`          | `ci.yml` | PRs only                | Validates the PR title as a Conventional Commit                        |
| `dependency-review` | `ci.yml` | PRs only                | Fails on high/critical severity new dependencies. Not required.        |

Anything else you add to CI is advisory unless it is listed in the ruleset. Prefer keeping the
required set small — a gate that is always bypassed is worse than no gate.

## Commit and PR titles

`pr-title` and the `commit-msg` hook share `scripts/check-commit-msg.mjs`, so a title that passes
locally passes in CI and vice versa. Format:

```
<type>(<optional scope>): <description>
```

`feat(world): add a second NPC` — 72 characters max after the type, lower-case description,
no trailing period.

## When to loosen, when to tighten

- **Adding a second contributor?** Set required approvals to 1 and turn on `require_code_owner_review`.
- **Shipping a release branch?** Add a ruleset for `release/*` with the same checks.
- **New required check?** Land it as a non-required job first, let it run green for a week, then
  add it to the ruleset.
- **A rule blocks an emergency fix?** Bypass as admin, fix, then file an issue about the process
  rather than deleting the rule.

## Reproducing this configuration

```bash
# Repo settings
gh api -X PATCH repos/jacklatrobe/HelloClarenceGame \
  -F delete_branch_on_merge=true -F allow_auto_merge=true -F allow_update_branch=true \
  -F allow_merge_commit=false -F allow_squash_merge=true -F allow_rebase_merge=true \
  -f squash_merge_commit_title=PR_TITLE -f squash_merge_commit_message=PR_BODY

# Branch ruleset
gh api -X POST repos/jacklatrobe/HelloClarenceGame/rulesets --input .github/ruleset.main.json
```

The ruleset payload is committed at `.github/ruleset.main.json` so the configuration is versioned
alongside the code.
