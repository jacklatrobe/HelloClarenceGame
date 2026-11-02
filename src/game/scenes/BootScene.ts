import Phaser from 'phaser';

import { TILE } from '../world/mapgen';

/**
 * Generates every texture procedurally so the repo carries no binary art.
 * Real sprite sheets can replace these keys later without touching the scenes.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.createTextures();
    this.scene.start('World');
  }

  private createTextures(): void {
    const g = this.add.graphics();

    // Floor: dark slate with a subtle grid edge.
    g.fillStyle(0x1f2937, 1);
    g.fillRect(0, 0, TILE, TILE);
    g.fillStyle(0x111827, 1);
    g.fillRect(0, 0, TILE, 1);
    g.fillRect(0, 0, 1, TILE);
    g.generateTexture('floor', TILE, TILE);
    g.clear();

    // Rock: lighter, with a highlight so it reads as an obstacle.
    g.fillStyle(0x374151, 1);
    g.fillRect(0, 0, TILE, TILE);
    g.fillStyle(0x4b5563, 1);
    g.fillRect(0, 0, TILE, 3);
    g.fillStyle(0x1f2937, 1);
    g.fillRect(0, TILE - 2, TILE, 2);
    g.generateTexture('rock', TILE, TILE);
    g.clear();

    // Player: cyan.
    g.fillStyle(0x38bdf8, 1);
    g.fillRect(3, 2, 10, 12);
    g.fillStyle(0xe0f2fe, 1);
    g.fillRect(5, 5, 2, 2);
    g.fillRect(9, 5, 2, 2);
    g.generateTexture('player', TILE, TILE);
    g.clear();

    // Clarence: amber, with a little hat.
    g.fillStyle(0xf59e0b, 1);
    g.fillRect(3, 4, 10, 10);
    g.fillStyle(0xb45309, 1);
    g.fillRect(2, 1, 12, 4);
    g.fillStyle(0x1c1917, 1);
    g.fillRect(5, 7, 2, 2);
    g.fillRect(9, 7, 2, 2);
    g.generateTexture('clarence', TILE, TILE);
    g.clear();

    g.destroy();
  }
}
