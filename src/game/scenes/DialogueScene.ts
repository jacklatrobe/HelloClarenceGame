import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { CLARENCE_DIALOGUE, CLARENCE_START_NODE } from '../dialogue/clarence';
import { DialogueRunner, type DialogueGraph } from '../dialogue/DialogueRunner';

export interface DialogueSceneData {
  readonly graph: DialogueGraph;
  readonly startId: string;
  readonly title: string;
}

const BOX_HEIGHT = 148;
const BOX_MARGIN = 24;
/** Ignore input briefly so the key that opened the box does not close it. */
const INPUT_GRACE_MS = 180;

export class DialogueScene extends Phaser.Scene {
  private runner!: DialogueRunner;
  private speakerText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private openedAt = 0;
  private closable = false;

  private readonly handleKey = (event: KeyboardEvent): void => {
    if (!this.closable) return;

    const node = this.runner.node;
    if (node === null) {
      this.close();
      return;
    }

    const choices = node.choices ?? [];
    if (choices.length > 0) {
      const digit = Number.parseInt(event.key, 10);
      if (Number.isInteger(digit) && digit >= 1 && digit <= choices.length) {
        this.runner.choose(digit - 1);
        this.render();
      }
      return;
    }

    if (event.key === 'Escape') {
      this.close();
      return;
    }

    if (event.key === ' ' || event.key === 'Enter' || event.key.toLowerCase() === 'e') {
      event.preventDefault();
      this.runner.advance();
      this.render();
    }
  };

  constructor() {
    super('Dialogue');
  }

  init(data: Partial<DialogueSceneData>): void {
    this.runner = new DialogueRunner(
      data.graph ?? CLARENCE_DIALOGUE,
      data.startId ?? CLARENCE_START_NODE,
    );
  }

  create(data: Partial<DialogueSceneData>): void {
    this.openedAt = this.time.now;
    this.closable = false;

    const boxTop = GAME_HEIGHT - BOX_HEIGHT - BOX_MARGIN;
    const boxWidth = GAME_WIDTH - BOX_MARGIN * 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x0f172a, 0.96);
    panel.fillRoundedRect(BOX_MARGIN, boxTop, boxWidth, BOX_HEIGHT, 10);
    panel.lineStyle(2, 0x38bdf8, 0.9);
    panel.strokeRoundedRect(BOX_MARGIN, boxTop, boxWidth, BOX_HEIGHT, 10);

    const speaker = data.title ?? 'Clarence';

    this.speakerText = this.add.text(BOX_MARGIN + 18, boxTop + 14, speaker, {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#fbbf24',
    });

    this.bodyText = this.add.text(BOX_MARGIN + 18, boxTop + 44, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#e2e8f0',
      wordWrap: { width: boxWidth - 36 },
      lineSpacing: 6,
    });

    this.hintText = this.add.text(BOX_MARGIN + 18, boxTop + BOX_HEIGHT - 30, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#64748b',
      wordWrap: { width: boxWidth - 36 },
    });

    this.input.keyboard?.on('keydown', this.handleKey);

    this.render();
  }

  override update(): void {
    if (!this.closable && this.time.now - this.openedAt > INPUT_GRACE_MS) {
      this.closable = true;
    }
  }

  private render(): void {
    const node = this.runner.node;
    if (node === null) {
      this.close();
      return;
    }

    this.speakerText.setText(node.speaker);
    this.bodyText.setText(node.text);

    const choices = node.choices ?? [];
    if (choices.length > 0) {
      const lines = choices.map((choice, index) => `${index + 1}. ${choice.label}`);
      this.hintText.setText(lines.join('   '));
      return;
    }

    this.hintText.setText(
      this.runner.canAdvance ? 'Space / Enter to continue  ·  Esc to leave' : 'Esc to leave',
    );
  }

  private close(): void {
    this.input.keyboard?.off('keydown', this.handleKey);
    this.scene.resume('World');
    this.scene.stop();
  }
}
