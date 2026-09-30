import { buildApp } from './app.js';

const port = Number(process.env.API_PORT ?? 3001);
const app = await buildApp({ logger: true });

await app.listen({ port, host: '127.0.0.1' });
