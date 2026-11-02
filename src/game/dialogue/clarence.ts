import type { DialogueGraph } from './DialogueRunner';

export const CLARENCE_START_NODE = 'clarence.greet';

/** Level 1 content. Swap for a data-driven loader once we have more NPCs. */
export const CLARENCE_DIALOGUE: DialogueGraph = [
  {
    id: 'clarence.greet',
    speaker: 'Clarence',
    text: 'Oh! A visitor. Hello to you.',
    next: 'clarence.who',
  },
  {
    id: 'clarence.who',
    speaker: 'Clarence',
    text: 'They call me Clarence. I have been standing in this field for a very long time.',
    choices: [
      { label: 'How long, exactly?', next: 'clarence.long' },
      { label: 'Nice field.', next: 'clarence.field' },
      { label: 'I have to go.', next: null },
    ],
  },
  {
    id: 'clarence.long',
    speaker: 'Clarence',
    text: 'Long enough that the rocks learned my name before I did.',
    next: 'clarence.who',
  },
  {
    id: 'clarence.field',
    speaker: 'Clarence',
    text: 'It is a good field. Flat. Honest. Slightly too many rocks.',
    next: 'clarence.who',
  },
] as const;
