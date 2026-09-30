import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CLIENTS_ENDPOINT, parseClientsResponse } from '../shared/clientsContract.js';
import { buildApp } from './app.js';
import clients from './data/clients.json' with { type: 'json' };

describe('GET /api/clients', () => {
  it('returns the unchanged source tree without an envelope', async () => {
    const app = await buildApp();
    const response = await app.inject({ method: 'GET', url: CLIENTS_ENDPOINT });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/^application\/json/);
    const body: unknown = response.json();
    expect(body).toStrictEqual(clients);
    expect(parseClientsResponse(body)).toMatchObject({
      id: 'd6e00056-dce4-4ef4-b034-d6467db6187d',
      name: 'Company',
    });
    await app.close();
  });

  it('responds 404 for unknown API routes', async () => {
    const app = await buildApp();
    const response = await app.inject({ method: 'GET', url: '/api/unknown' });

    expect(response.statusCode).toBe(404);
    await app.close();
  });
});

describe('static frontend', () => {
  let staticRoot: string | undefined;

  afterEach(async () => {
    if (staticRoot !== undefined) await rm(staticRoot, { recursive: true, force: true });
  });

  it('serves the built frontend alongside the API when a static root is given', async () => {
    staticRoot = await mkdtemp(join(tmpdir(), 'clients-dashboard-'));
    await writeFile(join(staticRoot, 'index.html'), '<!doctype html><title>Clients</title>');
    const app = await buildApp({ staticRoot });

    const page = await app.inject({ method: 'GET', url: '/' });
    expect(page.statusCode).toBe(200);
    expect(page.headers['content-type']).toMatch(/^text\/html/);

    const api = await app.inject({ method: 'GET', url: CLIENTS_ENDPOINT });
    expect(api.statusCode).toBe(200);
    await app.close();
  });
});
