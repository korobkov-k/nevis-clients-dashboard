import { QueryClient } from '@tanstack/react-query';

/** The tree is fetched once per page load; retries are explicit and user-initiated. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: Infinity,
      },
    },
  });
}
