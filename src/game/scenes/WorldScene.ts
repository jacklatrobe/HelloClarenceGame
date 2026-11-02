import Phaser from 'phaser';

import { GAME_WIDTH, SERVER_STATUS_KEY, SERVER_VERSION_KEY } from '../config';
import { CLARENCE_DIALOGUE, CLARENCE_START_NODE } from '../dialogue/clarence';
import { generateMap, isSolid, TILE, type GameMap } from '../world/mapgen';

const MAP_SEED = 20261102;
const PLAYER_SPEED = 110;
const TALK_RADIUS = 22;

type MoveKey = 'W' | 'A' | 'S' | 'D' | 'E' | 'SPACE';

export class WorldScene extends Phaser.Scene {
  private map!: GameMap;
  private player!: Phaser.Physics.Arcade.Sprite;
  private clarence!: Phaser.Physics.Arcade.Sprite;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<MoveKey, Phaser.Input.Keyboard.Key>;
  private prompt!: Phaser.GameObjects.Text;
  private serverLabel!: Phaser.GameObjects.Text;
  private serverLabelValue = '';

  /**
   * Event-driven, not polled with `JustDown`. A quick tap can deliver keydown
   * and keyup inside the same game step, and `Key.onUp` clears the just-down
   * flag before `update()` ever sees it.
   */
  private readonly tryTalk = (event: KeyboardEvent): void => {
    if (event.repeat || !this.nearClarence()) return;
    this.openDialogue();
  };

  constructor() {
    super('World');
  }

  create(): void {
    this.map = generateMap(MAP_SEED);

    this.buildTerrain();
    this.buildActors();

    const worldWidth = this.map.cols * TILE;
    const worldHeight = this.map.rows * TILE;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setRoundPixels(true);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);

    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.clarence);

    const keyboard = this.input.keyboard;
    if (keyboard === null) {
      throw new Error('Keyboard input is unavailable in this environment');
    }
    this.cursors = keyboard.createCursorKeys();
    this.keys = keyboard.addKeys('W,A,S,D,E,SPACE') as Record<MoveKey, Phaser.Input.Keyboard.Key>;
    keyboard.on('keydown-E', this.tryTalk);
    keyboard.on('keydown-SPACE', this.tryTalk);

    this.prompt = this.add
      .text(0, 0, `Press E to say hello to ${this.map.npc.name}`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#fde68a',
        backgroundColor: '#0b112099',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5, 1)
      .setDepth(20)
      .setVisible(false);

    this.buildHud();
    this.cameras.main.fadeIn(250, 11, 17, 32);
  }

  override update(): void {
    this.updateMovement();
    this.updateInteractionPrompt();
    this.updateServerLabel();
  }

  /** Scenes are never restarted in this game, but a reload must not leak these. */
  shutdown(): void {
    const keyboard = this.input.keyboard;
    keyboard?.off('keydown-E', this.tryTalk);
    keyboard?.off('keydown-SPACE', this.tryTalk);
  }

  private serverLabelText(): string {
    const status = this.registry.get(SERVER_STATUS_KEY) as string | undefined;
    const version = this.registry.get(SERVER_VERSION_KEY) as string | undefined;
    return status === undefined ? 'server: checking...' : `server: ${status} v${version}`;
  }

  /** The health probe resolves after create(), so refresh the HUD each frame. */
  private updateServerLabel(): void {
    const label = this.serverLabelText();
    if (label === this.serverLabelValue) return;
    this.serverLabelValue = label;
    this.serverLabel.setText(label);
    this.serverLabel.setColor(
      this.registry.get(SERVER_STATUS_KEY) === 'offline' ? '#fca5a5' : '#6ee7b7',
    );
  }

  private buildTerrain(): void {
    const worldWidth = this.map.cols * TILE;
    const worldHeight = this.map.rows * TILE;

    this.add.tileSprite(0, 0, worldWidth, worldHeight, 'floor').setOrigin(0, 0).setDepth(0);

    this.walls = this.physics.add.staticGroup();
    for (let row = 0; row < this.map.rows; row += 1) {
      for (let col = 0; col < this.map.cols; col += 1) {
        if (!isSolid(this.map, col, row)) continue;
        const rock = this.walls.create(
          (col + 0.5) * TILE,
          (row + 0.5) * TILE,
          'rock',
        ) as Phaser.Physics.Arcade.Sprite;
        rock.setDepth(5);
      }
    }
  }

  private buildActors(): void {
    this.player = this.physics.add.sprite(
      (this.map.spawn.col + 0.5) * TILE,
      (this.map.spawn.row + 0.5) * TILE,
      'player',
    );
    this.player.setDepth(10);
    this.player.setCollideWorldBounds(true);
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    playerBody.setSize(TILE - 4, TILE - 4);

    this.clarence = this.physics.add.sprite(
      (this.map.npc.col + 0.5) * TILE,
      (this.map.npc.row + 0.5) * TILE,
      'clarence',
    );
    this.clarence.setDepth(10);
    const clarenceBody = this.clarence.body as Phaser.Physics.Arcade.Body;
    clarenceBody.setImmovable(true);
    clarenceBody.moves = false;
  }

  private updateMovement(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;

    const dx = Number(right) - Number(left);
    const dy = Number(down) - Number(up);

    // Probe each axis separately: rejecting the whole vector makes walls feel
    // like glue, probing per-axis lets the player slide along them.
    let moveX = 0;
    let moveY = 0;

    if (dx !== 0) {
      const probe = this.player.x + dx * (TILE / 2 + 1);
      if (!isSolid(this.map, Math.floor(probe / TILE), Math.floor(this.player.y / TILE))) {
        moveX = dx;
      }
    }

    if (dy !== 0) {
      const probe = this.player.y + dy * (TILE / 2 + 1);
      if (!isSolid(this.map, Math.floor(this.player.x / TILE), Math.floor(probe / TILE))) {
        moveY = dy;
      }
    }

    if (moveX === 0 && moveY === 0) {
      body.setVelocity(0, 0);
      return;
    }

    const direction = new Phaser.Math.Vector2(moveX, moveY).normalize().scale(PLAYER_SPEED);
    body.setVelocity(direction.x, direction.y);
  }

  private nearClarence(): boolean {
    return (
      Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.clarence.x,
        this.clarence.y,
      ) <= TALK_RADIUS
    );
  }

  private updateInteractionPrompt(): void {
    if (!this.nearClarence()) {
      this.prompt.setVisible(false);
      return;
    }
    this.prompt.setPosition(this.clarence.x, this.clarence.y - TILE).setVisible(true);
  }

  private openDialogue(): void {
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.prompt.setVisible(false);
    // Pausing stops this scene's keyboard plugin, so the held key cannot
    // immediately advance the box we just opened.
    this.scene.pause();
    this.scene.launch('Dialogue', {
      graph: CLARENCE_DIALOGUE,
      startId: CLARENCE_START_NODE,
      title: this.map.npc.name,
    });
  }

  private buildHud(): void {
    this.serverLabel = this.add
      .text(8, 6, this.serverLabelText(), {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: this.registry.get(SERVER_STATUS_KEY) === 'offline' ? '#fca5a5' : '#6ee7b7',
      })
      .setScrollFactor(0)
      .setDepth(30);

    this.add
      .text(GAME_WIDTH - 8, 6, 'WASD / arrows to move', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#94a3b8',
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(30);
  }
}
