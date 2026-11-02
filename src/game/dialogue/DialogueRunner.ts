export interface DialogueChoice {
  readonly label: string;
  /** Node id to jump to, or null to end the conversation. */
  readonly next: string | null;
}

export interface DialogueNode {
  readonly id: string;
  readonly speaker: string;
  readonly text: string;
  /** Implicit next node when there are no choices. null/undefined ends the chat. */
  readonly next?: string | null;
  readonly choices?: readonly DialogueChoice[];
}

export type DialogueGraph = readonly DialogueNode[];

/**
 * A tiny, dependency-free dialogue state machine.
 *
 * Pure enough to unit test and render from any scene: the renderer asks for
 * `node`, reacts to `advance()` / `choose(i)`, and stops when `finished`.
 */
export class DialogueRunner {
  readonly #nodes: Map<string, DialogueNode>;
  readonly #startId: string;
  #currentId: string | null;
  readonly #visited: string[] = [];

  constructor(graph: DialogueGraph, startId: string) {
    this.#nodes = new Map();
    for (const node of graph) {
      if (this.#nodes.has(node.id)) {
        throw new Error(`Duplicate dialogue node id: "${node.id}"`);
      }
      this.#nodes.set(node.id, node);
    }
    if (!this.#nodes.has(startId)) {
      throw new Error(`Unknown dialogue start node: "${startId}"`);
    }
    this.#startId = startId;
    this.#currentId = startId;
    this.#visited.push(startId);
  }

  /** The node being displayed, or null once the conversation has ended. */
  get node(): DialogueNode | null {
    return this.#currentId === null ? null : (this.#nodes.get(this.#currentId) ?? null);
  }

  get finished(): boolean {
    return this.#currentId === null;
  }

  /** Node ids visited so far, including the current one. */
  get visited(): readonly string[] {
    return this.#visited;
  }

  /** True when pressing "continue" would move the conversation forward. */
  get canAdvance(): boolean {
    const node = this.node;
    if (node === null || (node.choices?.length ?? 0) > 0) return false;
    return typeof node.next === 'string';
  }

  /** Moves to the node's implicit `next`, or ends the conversation. */
  advance(): DialogueNode | null {
    const node = this.node;
    if (node === null) return null;
    if ((node.choices?.length ?? 0) > 0) {
      throw new Error(`Node "${node.id}" has choices; call choose(index) instead of advance()`);
    }
    return this.#goto(node.next ?? null);
  }

  /** Picks the choice at `index` on the current node. */
  choose(index: number): DialogueNode | null {
    const node = this.node;
    if (node === null) throw new Error('Cannot choose: conversation has ended');

    const choices = node.choices ?? [];
    const choice = choices[index];
    if (choice === undefined) {
      throw new Error(`Node "${node.id}" has no choice at index ${index}`);
    }
    return this.#goto(choice.next);
  }

  /** Restarts the conversation, optionally from a different node. */
  restart(startId: string = this.#startId): DialogueNode | null {
    if (!this.#nodes.has(startId)) {
      throw new Error(`Unknown dialogue start node: "${startId}"`);
    }
    this.#visited.length = 0;
    this.#visited.push(startId);
    this.#currentId = startId;
    return this.node;
  }

  #goto(id: string | null): DialogueNode | null {
    if (id === null) {
      this.#currentId = null;
      return null;
    }
    const next = this.#nodes.get(id);
    if (next === undefined) {
      throw new Error(
        `Dialogue node "${this.#currentId ?? '<end>'}" points at missing node "${id}"`,
      );
    }
    this.#currentId = id;
    this.#visited.push(id);
    return next;
  }
}
