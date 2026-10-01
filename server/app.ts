import { setTimeout as sleep } from 'node:timers/promises';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyInstance } from 'fastify';
import { CLIENTS_ENDPOINT, type ClientsResponse } from '../shared/clientsContract.js';
import clients from './data/clients.json' with { type: 'json' };

const clientsResponse: ClientsResponse = clients;

export interface BuildAppOptions {
  /** Directory with the built frontend. When omitted, only the API is served. */
  staticRoot?: string;
  /** Simulated latency before the clients response, so loading states are observable. */
  responseDelayMs?: number;
  logger?: boolean;
}

export async function buildApp({
  staticRoot,
  responseDelayMs = 0,
  logger = false,
}: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger });

  app.get(CLIENTS_ENDPOINT, async () => {
    if (responseDelayMs > 0) await sleep(responseDelayMs);
    return clientsResponse;
  });

  if (staticRoot !== undefined) {
    await app.register(fastifyStatic, { root: staticRoot });
  }

  return app;
}
