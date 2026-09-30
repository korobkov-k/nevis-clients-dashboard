import { useQuery } from '@tanstack/react-query';
import { fetchClients } from './clientsApi';

export const clientsQueryKey = ['clients'] as const;

export function useClientsQuery() {
  return useQuery({
    queryKey: clientsQueryKey,
    queryFn: ({ signal }) => fetchClients(signal),
  });
}
