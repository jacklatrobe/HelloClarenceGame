import { describe, expect, it } from 'vitest';

import { CLARENCE_DIALOGUE, CLARENCE_START_NODE } from '../src/game/dialogue/clarence';
import { DialogueRunner } from '../src/game/dialogue/DialogueRunner';

describe('DialogueRunner', () => {
  it('starts on the requested node and exposes its text', () => {
    const runner = new DialogueRunner(CLARENCE_DIALOGUE, CLARENCE_START_NODE);

    expect(runner.finished).toBe(false);
    expect(runner.node?.id).toBe('clarence.greet');
    expect(runner.node?.speaker).toBe('Clarence');
    expect(runner.node?.text).toContain('Hello');
  });

  it('advances along implicit next links', () => {
    const runner = new DialogueRunner(CLARENCE_DIALOGUE, CLARENCE_START_NODE);

    expect(runner.canAdvance).toBe(true);
    runner.advance();

    expect(runner.node?.id).toBe('clarence.who');
    expect(runner.visited).toEqual(['clarence.greet', 'clarence.who']);
  });

  it('refuses advance() on a node that has choices', () => {
    const runner = new DialogueRunner(CLARENCE_DIALOGUE, 'clarence.who');

    expect(runner.canAdvance).toBe(false);
    expect(() => runner.advance()).toThrow(/has choices/);
  });

  it('follows a chosen branch and loops back to the hub', () => {
    const runner = new DialogueRunner(CLARENCE_DIALOGUE, 'clarence.who');

    runner.choose(0);
    expect(runner.node?.id).toBe('clarence.long');

    runner.advance();
    expect(runner.node?.id).toBe('clarence.who');
  });

  it('ends the conversation when a choice points at null', () => {
    const runner = new DialogueRunner(CLARENCE_DIALOGUE, 'clarence.who');

    runner.choose(2);

    expect(runner.finished).toBe(true);
    expect(runner.node).toBeNull();
    expect(runner.canAdvance).toBe(false);
    expect(runner.advance()).toBeNull();
  });

  it('rejects invalid input', () => {
    const runner = new DialogueRunner(CLARENCE_DIALOGUE, 'clarence.who');

    expect(() => runner.choose(99)).toThrow(/no choice at index 99/);
    expect(() => new DialogueRunner(CLARENCE_DIALOGUE, 'nope')).toThrow(
      /Unknown dialogue start node/,
    );
    expect(
      () =>
        new DialogueRunner(
          [
            { id: 'a', speaker: 'x', text: 'y' },
            { id: 'a', speaker: 'x', text: 'y' },
          ],
          'a',
        ),
    ).toThrow(/Duplicate dialogue node id/);
  });

  it('reports dangling next targets instead of silently ending', () => {
    const broken = [{ id: 'a', speaker: 'x', text: 'y', next: 'missing' }];
    const runner = new DialogueRunner(broken, 'a');

    expect(() => runner.advance()).toThrow(/missing node "missing"/);
  });

  it('restarts from the beginning or an explicit node', () => {
    const runner = new DialogueRunner(CLARENCE_DIALOGUE, 'clarence.who');
    runner.choose(2);
    expect(runner.finished).toBe(true);

    runner.restart();
    expect(runner.node?.id).toBe('clarence.who');
    expect(runner.visited).toEqual(['clarence.who']);

    runner.restart('clarence.greet');
    expect(runner.node?.id).toBe('clarence.greet');
  });
});

describe('CLARENCE_DIALOGUE content', () => {
  it('only references node ids that exist', () => {
    const ids = new Set(CLARENCE_DIALOGUE.map((node) => node.id));

    for (const node of CLARENCE_DIALOGUE) {
      if (typeof node.next === 'string') {
        expect(ids.has(node.next), `${node.id} -> ${node.next}`).toBe(true);
      }
      for (const choice of node.choices ?? []) {
        if (choice.next !== null) {
          expect(ids.has(choice.next), `${node.id} -> ${choice.next}`).toBe(true);
        }
      }
    }
  });

  it('is reachable from the start node', () => {
    const runner = new DialogueRunner(CLARENCE_DIALOGUE, CLARENCE_START_NODE);
    const seen = new Set<string>();

    // Walk every branch once to prove nothing is orphaned.
    const walk = (): void => {
      const node = runner.node;
      if (node === null || seen.has(node.id)) return;
      seen.add(node.id);

      const choices = node.choices ?? [];
      if (choices.length === 0) {
        runner.advance();
        walk();
        return;
      }
      for (let index = 0; index < choices.length; index += 1) {
        runner.choose(index);
        walk();
        runner.restart(node.id);
      }
    };

    walk();

    expect([...seen].sort()).toEqual(CLARENCE_DIALOGUE.map((n) => n.id).sort());
  });
});
