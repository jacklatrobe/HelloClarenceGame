import Phaser from 'phaser';

import { gameConfig, probeServer } from './game/config';
import './styles/main.css';

declare global {
  interface Window {
    /** Exposed for browser-devtools debugging and scripts/smoke.mjs. */
    helloClarence: { game: Phaser.Game };
  }
}

const game = new Phaser.Game(gameConfig);

window.helloClarence = { game };

void probeServer(game);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game.destroy(true);
  });
}
