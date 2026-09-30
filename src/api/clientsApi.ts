import {
  CLIENTS_ENDPOINT,
  parseClientsResponse,
  type ClientsResponse,
} from '../../shared/clientsContract';

export class ClientsRequestError extends Error {
  override name = 'ClientsRequestError';

  constructor(readonly status: number) {
    super(`Client data request failed with HTTP ${status}`);
  }
}

/** Loads the complete client tree. HTTP failures and malformed payloads both reject. */
export async function fetchClients(signal?: AbortSignal): Promise<ClientsResponse> {
  const response = await fetch(CLIENTS_ENDPOINT, {
    signal: signal ?? null,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new ClientsRequestError(response.status);
  return parseClientsResponse(await response.json());
}
