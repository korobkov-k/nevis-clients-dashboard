import { QueryClientProvider } from '@tanstack/react-query';
import type { Decorator } from '@storybook/react-vite';
import { delay, http, HttpResponse } from 'msw';
import { useState, type ReactNode } from 'react';
import { CLIENTS_ENDPOINT } from '../../shared/clientsContract';
import { createQueryClient } from '../api/queryClient';
import { sourceClients } from './sourceTree';

/** A fresh query cache per story render, so stories and tests never share request state. */
function IsolatedQueryClient({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

export const withQueryClient: Decorator = (Story) => (
  <IsolatedQueryClient>
    <Story />
  </IsolatedQueryClient>
);

/** Page-coloured canvas for panel-level stories. */
export const withPageBackground: Decorator = (Story) => (
  <div className="min-h-screen bg-background-primary p-4">
    <Story />
  </div>
);

export const clientsHandlers = {
  success: http.get(CLIENTS_ENDPOINT, () => HttpResponse.json(sourceClients)),
  pending: http.get(CLIENTS_ENDPOINT, async () => {
    await delay('infinite');
    return HttpResponse.json(sourceClients);
  }),
  failure: http.get(CLIENTS_ENDPOINT, () =>
    HttpResponse.json({ message: 'Service unavailable' }, { status: 503 }),
  ),
};

/**
 * A manually released response gate: the first request fails immediately; each later request
 * waits for one `release()` (which may happen before the request arrives), the second then
 * fails and the rest succeed. Tests observe the in-flight retry state without sleeping.
 */
export function createRetryGate() {
  let requests = 0;
  let permits = 0;
  let waiters: (() => void)[] = [];

  const waitForPermit = () =>
    new Promise<void>((resolve) => {
      if (permits > 0) {
        permits -= 1;
        resolve();
      } else {
        waiters.push(resolve);
      }
    });

  return {
    handler: http.get(CLIENTS_ENDPOINT, async () => {
      requests += 1;
      const attempt = requests;
      if (attempt > 1) await waitForPermit();
      return attempt <= 2
        ? HttpResponse.json({ message: 'Service unavailable' }, { status: 503 })
        : HttpResponse.json(sourceClients);
    }),
    release: () => {
      const waiter = waiters.shift();
      if (waiter) waiter();
      else permits += 1;
    },
    reset: () => {
      requests = 0;
      permits = 0;
      waiters = [];
    },
    requestCount: () => requests,
  };
}

/** Forces `prefers-reduced-motion` for a story; returns a cleanup for `beforeEach`. */
export function stubReducedMotion(reduce: boolean) {
  const original = window.matchMedia.bind(window);
  window.matchMedia = (query: string) =>
    query.includes('prefers-reduced-motion')
      ? ({
          matches: reduce && query.includes('reduce'),
          media: query,
          onchange: null,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          addListener: () => undefined,
          removeListener: () => undefined,
          dispatchEvent: () => false,
        } satisfies MediaQueryList)
      : original(query);
  return () => {
    window.matchMedia = original;
  };
}
