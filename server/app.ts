import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyInstance } from 'fastify';

import { CLARENCE_DIALOGUE } from '../src/game/dialogue/clarence';
import { API_ROUTES, type DialogueResponse, type HealthResponse } from '../shared/types';

const here = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST = path.resolve(here, '..', 'dist');

export interface BuildAppOptions {
  /** Enable Fastify's pino logger. Defaults to false (nice for tests). */
  readonly logger?: boolean;
  /** Reported by `/api/health`. Defaults to `npm_package_version` or 0.0.0. */
  readonly version?: string;
}

/**
 * Builds the Fastify instance without listening on a socket.
 * Tests use this via `app.inject()`.
 */
export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const version = options.version ?? process.env['npm_package_version'] ?? '0.0.0';
  const startedAt = Date.now();

  const app = Fastify({ logger: options.logger ?? false });

  app.get(API_ROUTES.health, (): HealthResponse => {
    return {
      status: 'ok',
      version,
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
    };
  });

  app.get(API_ROUTES.clarenceDialogue, (): DialogueResponse => {
    return { nodes: CLARENCE_DIALOGUE };
  });

  // Serve the built client when it exists. In dev the Vite server owns the UI
  // and proxies /api here, so a missing dist/ is expected and not an error.
  if (existsSync(CLIENT_DIST)) {
    await app.register(fastifyStatic, { root: CLIENT_DIST, wildcard: false });

    app.setNotFoundHandler((request, reply) => {
      if (request.raw.url?.startsWith('/api/')) {
        return reply.code(404).send({ error: 'not_found' });
      }
      // Single-page app fallback.
      return reply.sendFile('index.html');
    });
  }

  return app;
}
