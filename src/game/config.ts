import Phaser from 'phaser';

import { fetchHealth } from '../net/api';
import { BootScene } from './scenes/BootScene';
import { DialogueScene } from './scenes/DialogueScene';
import { WorldScene } from './scenes/WorldScene';

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 544;

export const SERVER_STATUS_KEY = 'serverStatus';
export const SERVER_VERSION_KEY = 'serverVersion';

/**
 * `?renderer=canvas` forces the Canvas renderer. Useful on machines with a
 * broken WebGL stack, and it is what the headless smoke test uses.
 */
function pickRenderer(): number {
  if (typeof window === 'undefined') return Phaser.AUTO;
  const requested = new URLSearchParams(window.location.search).get('renderer');
  return requested === 'canvas' ? Phaser.CANVAS : Phaser.AUTO;
}

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: pickRenderer(),
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0b1120',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, WorldScene, DialogueScene],
};

/** Non-blocking probe so the HUD can report whether the Node API is reachable. */
export async function probeServer(game: Phaser.Game): Promise<void> {
  try {
    const health = await fetchHealth();
    game.registry.set(SERVER_STATUS_KEY, 'online');
    game.registry.set(SERVER_VERSION_KEY, health.version);
  } catch {
    game.registry.set(SERVER_STATUS_KEY, 'offline');
    game.registry.set(SERVER_VERSION_KEY, 'unknown');
  }
}
