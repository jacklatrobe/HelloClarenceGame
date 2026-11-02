#!/usr/bin/env node
/**
 * Validates a Conventional Commits message.
 *
 * Used by the `commit-msg` git hook and by the `pr-title` CI job, so pull
 * request titles and squash-merged commits follow the same convention.
 *
 * Usage:
 *   node scripts/check-commit-msg.mjs .git/COMMIT_EDITMSG
 *   node scripts/check-commit-msg.mjs --text "feat(world): add a second NPC"
 */

import { readFileSync } from 'node:fs';

const TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
];

const SUBJECT = new RegExp(
  `^(?:${TYPES.join('|')})(?:\\([a-z0-9][a-z0-9._/-]*\\))?!?: \\S.{0,71}$`,
);

/** Generated or tool-authored commits that are exempt from the convention. */
const ALLOWED_PREFIXES = ['Merge ', 'Revert "', 'fixup!', 'squash!', 'amend!', 'Initial commit'];

const IGNORED_PATTERNS = [/^chore\(release\)/, /^chore: release/];

const COLORS = process.stdout.isTTY
  ? { red: '\u001b[31m', yellow: '\u001b[33m', dim: '\u001b[2m', reset: '\u001b[0m' }
  : { red: '', yellow: '', dim: '', reset: '' };

function readMessage() {
  const args = process.argv.slice(2);

  const textIndex = args.indexOf('--text');
  if (textIndex !== -1) {
    return args[textIndex + 1] ?? '';
  }

  const file = args.find((arg) => !arg.startsWith('-'));
  if (file === undefined) {
    process.stderr.write(
      `${COLORS.yellow}No commit message file or --text given.${COLORS.reset}\n`,
    );
    process.exit(0);
  }

  return readFileSync(file, 'utf8');
}

function firstMeaningfulLine(raw) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !line.startsWith('#'));
}

function main() {
  const subject = firstMeaningfulLine(readMessage());

  if (subject === undefined) {
    // Let git handle an empty message; that is not our job.
    process.exit(0);
  }

  if (ALLOWED_PREFIXES.some((prefix) => subject.startsWith(prefix))) {
    process.exit(0);
  }

  if (IGNORED_PATTERNS.some((pattern) => pattern.test(subject))) {
    process.exit(0);
  }

  if (SUBJECT.test(subject)) {
    process.exit(0);
  }

  const lines = [
    '',
    `${COLORS.red}Commit/PR title is not a valid Conventional Commit.${COLORS.reset}`,
    '',
    `  subject: ${COLORS.dim}${subject}${COLORS.reset}`,
    '',
    '  expected: <type>(<optional scope>): <description>',
    '',
    `  types:    ${TYPES.join(', ')}`,
    '',
    '  examples:',
    '    feat(world): place Clarence on a walkable tile',
    '    fix(dialogue): ignore input for one frame after opening',
    '    docs: explain the trunk-based branch model',
    '',
    '  Handy: an empty scope is fine, and "!" marks a breaking change,',
    '  e.g. feat(api)!: drop the legacy /v1 routes',
    '',
  ];

  process.stderr.write(`${lines.join('\n')}\n`);
  process.exit(1);
}

main();
