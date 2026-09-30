/**
 * Wire contract for `GET /api/clients`, shared by the server and the client.
 * The response is the unchanged source tree: Company → branches → employees → channels.
 * Every level is optional below the root, and each node carries twelve monthly counts.
 */

export const CLIENTS_ENDPOINT = '/api/clients';

export const MONTH_COUNT = 12;

export interface ClientNodeBase {
  id: string;
  name: string;
  values: number[];
}

export type ChannelNode = ClientNodeBase;

export interface EmployeeNode extends ClientNodeBase {
  channels?: ChannelNode[];
}

export interface BranchNode extends ClientNodeBase {
  employees?: EmployeeNode[];
}

export interface CompanyNode extends ClientNodeBase {
  branches?: BranchNode[];
}

export type ClientsResponse = CompanyNode;

export class ClientsContractError extends Error {
  override name = 'ClientsContractError';
}

const CHILD_KEYS = ['branches', 'employees', 'channels'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertNode(value: unknown, depth: number, path: string, seenIds: Set<string>): void {
  if (!isRecord(value)) throw new ClientsContractError(`${path} is not an object`);
  if (typeof value.id !== 'string' || value.id === '') {
    throw new ClientsContractError(`${path}.id must be a non-empty string`);
  }
  if (seenIds.has(value.id)) throw new ClientsContractError(`${path}.id is not unique`);
  seenIds.add(value.id);
  if (typeof value.name !== 'string') {
    throw new ClientsContractError(`${path}.name must be a string`);
  }
  const { values } = value;
  if (
    !Array.isArray(values) ||
    values.length !== MONTH_COUNT ||
    !values.every((v) => typeof v === 'number' && Number.isFinite(v))
  ) {
    throw new ClientsContractError(`${path}.values must contain ${MONTH_COUNT} finite numbers`);
  }

  const childKey = CHILD_KEYS[depth];
  const children = childKey === undefined ? undefined : value[childKey];
  if (children === undefined) return;
  if (!Array.isArray(children)) {
    throw new ClientsContractError(`${path}.${String(childKey)} must be an array`);
  }
  children.forEach((child, index) => {
    assertNode(child, depth + 1, `${path}.${String(childKey)}[${index}]`, seenIds);
  });
}

/** Validates an unknown payload against the contract without copying or altering it. */
export function parseClientsResponse(payload: unknown): ClientsResponse {
  assertNode(payload, 0, 'response', new Set());
  return payload as ClientsResponse;
}
