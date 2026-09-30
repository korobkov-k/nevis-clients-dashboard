import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyInstance } from 'fastify';
import { CLIENTS_ENDPOINT, type ClientsResponse } from '../shared/clientsContract.js';
import clients from './data/clients.json' with { type: 'json' };

const clientsResponse: ClientsResponse = clients;

export interface BuildAppOptions {
  /** Directory with the built frontend. When omitted, only the API is served. */
  staticRoot?: string;
  logger?: boolean;
}

export async function buildApp({
  staticRoot,
  logger = false,
}: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger });

  app.get(CLIENTS_ENDPOINT, () => clientsResponse);

  if (staticRoot !== undefined) {
    await app.register(fastifyStatic, { root: staticRoot });
  }

  return app;
}
