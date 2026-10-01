import { fileURLToPath } from 'node:url';
import { buildApp } from './app.js';
import { readResponseDelayMs } from './config.js';

const staticRoot = fileURLToPath(new URL('../client', import.meta.url));
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '127.0.0.1';

const app = await buildApp({
  staticRoot,
  logger: true,
  responseDelayMs: readResponseDelayMs(),
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void app.close();
  });
}

await app.listen({ port, host });
