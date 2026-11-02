#!/usr/bin/env node
/**
 * Headless smoke test: boots the production build, drives a real browser, and
 * asserts the game reaches its first meaningful state (walk -> talk).
 *
 * Not part of `npm run check` because it needs a browser on the machine. Run it
 * before a release:
 *
 *   npm run smoke
 *
 * Options (env):
 *   SMOKE_CHANNEL  browser channel for playwright-core. Default: chrome.
 *                  Use `msedge` on machines without Chrome.
 *   SMOKE_PORT     pin the port for the temporary server. By default a free
 *                  port is picked, so a stray dev server cannot be mistaken
 *                  for the one under test.
 */

import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const CHANNEL = process.env.SMOKE_CHANNEL ?? 'chrome';
const ARTIFACT_DIR = path.resolve(process.cwd(), 'artifacts', 'smoke');

async function isPortFree(port) {
  try {
    await fetch(`http://127.0.0.1:${port}/api/health`, {
      signal: AbortSignal.timeout(500),
    });
    return false;
  } catch {
    return true;
  }
}

/** Never test against somebody else's server: pick a port nobody is on. */
async function pickPort() {
  const pinned = process.env.SMOKE_PORT;
  if (pinned !== undefined) {
    const port = Number.parseInt(pinned, 10);
    if (!(await isPortFree(port))) {
      throw new Error(`SMOKE_PORT ${port} is already in use`);
    }
    return port;
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const port = 20_000 + Math.floor(Math.random() * 20_000);
    if (await isPortFree(port)) return port;
  }
  throw new Error('Could not find a free port for the smoke test server');
}

const PORT = await pickPort();
const BASE_URL = `http://127.0.0.1:${PORT}`;

const failures = [];
const notes = [];

function check(condition, message) {
  if (condition) {
    notes.push(`  ok   ${message}`);
  } else {
    failures.push(message);
    notes.push(`  FAIL ${message}`);
  }
}

async function waitForHealth(timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok) return await response.json();
    } catch {
      // server not up yet
    }
    await delay(400);
  }
  throw new Error(`Server did not become healthy at ${BASE_URL}/api/health within ${timeoutMs}ms`);
}

async function main() {
  const { chromium } = await import('playwright-core').catch(() => {
    throw new Error('playwright-core is not installed. Run: npm install');
  });

  await mkdir(ARTIFACT_DIR, { recursive: true });

  const server = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], {
    env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Fail loudly instead of silently testing whatever else is on the port.
  server.on('exit', (code) => {
    if (code !== null && code !== 0) {
      process.stderr.write(`smoke server exited early with code ${code}\n`);
    }
  });

  const serverLog = [];
  server.stdout.on('data', (chunk) => serverLog.push(chunk.toString()));
  server.stderr.on('data', (chunk) => serverLog.push(chunk.toString()));

  let browser;
  try {
    const health = await waitForHealth();
    notes.push(`  ok   server healthy on ${BASE_URL} (version ${health.version})`);

    browser = await chromium.launch({ channel: CHANNEL, headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') pageErrors.push(message.text());
    });

    // The Canvas renderer is deterministic under software rendering; WebGL in
    // headless containers is not. Same game code either way.
    await page.goto(`${BASE_URL}/?renderer=canvas`, { waitUntil: 'load', timeout: 30_000 });

    const booted = await page
      .waitForFunction(() => window.helloClarence?.game?.isBooted === true, { timeout: 30_000 })
      .then(() => true)
      .catch(() => false);
    check(booted, 'Phaser game boots and is exposed on window.helloClarence');
    if (!booted) {
      throw new Error('Game never booted; aborting the rest of the smoke test');
    }

    const worldReady = await page
      .waitForFunction(() => window.helloClarence.game.scene.isActive('World'), { timeout: 20_000 })
      .then(() => true)
      .catch(() => false);
    check(worldReady, 'World scene is active after boot');
    if (!worldReady) {
      throw new Error('World scene never started; aborting the rest of the smoke test');
    }

    const canvas = await page.evaluate(() => {
      const element = document.querySelector('canvas');
      return element === null ? null : { width: element.width, height: element.height };
    });
    check(canvas?.width === 960 && canvas?.height === 544, 'canvas is 960x544');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01-boot.png') });

    const actors = await page.evaluate(() => {
      const scene = window.helloClarence.game.scene.getScene('World');
      return {
        player: { x: scene.player.x, y: scene.player.y },
        clarence: { x: scene.clarence.x, y: scene.clarence.y },
      };
    });
    check(
      Number.isFinite(actors.clarence.x) && Number.isFinite(actors.clarence.y),
      'Clarence exists in the world',
    );
    check(
      Math.hypot(actors.clarence.x - actors.player.x, actors.clarence.y - actors.player.y) > 32,
      'Clarence does not spawn on top of the player',
    );

    // Walk with real key events to prove input wiring, then teleport next to
    // Clarence so the interaction test does not depend on map generation.
    const beforeWalk = actors.player;
    await page.keyboard.down('d');
    await delay(700);
    await page.keyboard.up('d');
    const afterWalk = await page.evaluate(() => {
      const scene = window.helloClarence.game.scene.getScene('World');
      return { x: scene.player.x, y: scene.player.y };
    });
    check(afterWalk.x > beforeWalk.x, 'holding D moves the player right');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02-walk.png') });

    await page.evaluate(() => {
      const scene = window.helloClarence.game.scene.getScene('World');
      scene.player.setPosition(scene.clarence.x - 18, scene.clarence.y);
    });
    await delay(200);
    await page.keyboard.press('e');
    await delay(600);

    const dialogue = await page.evaluate(() => {
      const scene = window.helloClarence.game.scene.getScene('Dialogue');
      return {
        active: window.helloClarence.game.scene.isActive('Dialogue'),
        text: scene?.bodyText?.text ?? null,
        speaker: scene?.speakerText?.text ?? null,
      };
    });

    check(dialogue.active, 'pressing E opens the Dialogue scene');
    check(
      dialogue.speaker === 'Clarence',
      `dialogue speaker is Clarence (got ${dialogue.speaker})`,
    );
    check(
      typeof dialogue.text === 'string' && dialogue.text.length > 0,
      `dialogue shows a line (got ${JSON.stringify(dialogue.text)})`,
    );
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03-talk.png') });

    // Space advances to the node with choices; pressing 1 should branch.
    await page.keyboard.press('Space');
    await delay(400);
    const branched = await page.evaluate(() => {
      const scene = window.helloClarence.game.scene.getScene('Dialogue');
      return scene?.runner?.node?.id ?? null;
    });
    check(branched === 'clarence.who', `Space advances to the choice node (got ${branched})`);

    await page.keyboard.press('1');
    await delay(400);
    const chosen = await page.evaluate(() => {
      const scene = window.helloClarence.game.scene.getScene('Dialogue');
      return scene?.runner?.node?.id ?? null;
    });
    check(chosen === 'clarence.long', `pressing 1 follows the first branch (got ${chosen})`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04-choice.png') });

    await page.keyboard.press('Escape');
    await delay(600);
    const resumed = await page.evaluate(() => ({
      dialogue: window.helloClarence.game.scene.isActive('Dialogue'),
      world: window.helloClarence.game.scene.isActive('World'),
    }));
    check(!resumed.dialogue, 'Escape closes the Dialogue scene');
    check(resumed.world, 'World scene resumes after the dialogue closes');

    check(pageErrors.length === 0, `no page errors (${JSON.stringify(pageErrors)})`);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
    notes.push(`  FAIL smoke run aborted: ${String(error)}`);
    if (error instanceof Error && error.stack !== undefined) {
      notes.push(error.stack.split('\n').slice(0, 4).join('\n'));
    }
  } finally {
    if (browser) await browser.close();
    server.kill();
    await delay(300);
    await writeFile(path.join(ARTIFACT_DIR, 'server.log'), serverLog.join(''), 'utf8').catch(
      () => {},
    );
  }

  process.stdout.write(`${notes.join('\n')}\n`);
  process.stdout.write(`screenshots: ${ARTIFACT_DIR}\n`);

  if (failures.length > 0) {
    process.stderr.write(`\n${failures.length} smoke check(s) failed:\n`);
    for (const failure of failures) process.stderr.write(`  - ${failure}\n`);
    process.exit(1);
  }

  process.stdout.write('\nsmoke test passed\n');
}

await main();
