/** Simulated API latency in ms (`API_DELAY_MS`); defaults to 1 s so the skeleton is visible. */
export function readResponseDelayMs(env: NodeJS.ProcessEnv = process.env): number {
  const delay = Number(env.API_DELAY_MS ?? 1000);
  return Number.isFinite(delay) && delay > 0 ? delay : 0;
}
