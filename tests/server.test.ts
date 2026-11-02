import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildApp } from '../server/app';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp({ version: '9.9.9' });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('GET /api/health', () => {
  it('reports ok with the injected version', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/health' });

    expect(response.statusCode).toBe(200);
    const body = response.json<{
      status: string;
      version: string;
      uptimeSeconds: number;
      timestamp: string;
    }>();
    expect(body.status).toBe('ok');
    expect(body.version).toBe('9.9.9');
    expect(body.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });
});

describe('GET /api/dialogue/clarence', () => {
  it('serves the dialogue graph the client renders', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/dialogue/clarence' });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ nodes: { id: string; speaker: string; text: string }[] }>();
    expect(body.nodes.length).toBeGreaterThan(0);
    expect(body.nodes[0]?.speaker).toBe('Clarence');
  });
});

describe('unknown routes', () => {
  it('returns 404 for unmatched API paths', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/nope' });

    expect(response.statusCode).toBe(404);
  });
});
