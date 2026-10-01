import { buildApp } from './app.js';
import { readResponseDelayMs } from './config.js';

const port = Number(process.env.API_PORT ?? 3001);
const app = await buildApp({ logger: true, responseDelayMs: readResponseDelayMs() });

await app.listen({ port, host: '127.0.0.1' });
