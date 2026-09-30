import clients from '../../server/data/clients.json';
import type { ClientsResponse } from '../../shared/clientsContract';

/** The unchanged server fixture, reused by tests and stories (never by production code). */
export const sourceClients: ClientsResponse = clients;

/** Source IDs referenced by tests and stories. */
export const IDS = {
  company: 'd6e00056-dce4-4ef4-b034-d6467db6187d',
  branch1: 'd6b668e1-89a4-4467-bdf6-c9ebaf2cea5f',
  branch2: '71da0b06-5785-4a60-9273-4df2be619ee4',
  branch3: '63b01d42-922f-43ff-b0f8-2f3484e74c43',
  anna: 'e3c4637b-2f21-4b7e-883e-b13ae1a6df6a',
  james: 'afe9ebc0-6c35-4690-80b0-20e9bc0d8c7d',
  maria: 'bb012770-02d3-4999-aa08-c11a9065235d',
  robert: '61cd9425-2d8e-456f-b228-f7e7c6a76e5d',
  sarah: '3e4efd29-e7e4-4695-a1dc-6f3b0853c19d',
  existingClients: '716e7c30-b7c3-45c5-aa64-cbcf483917e0',
  newOrganic: 'bc5cd63a-668b-4c37-854d-69c1bd5fcbcd',
  newPaid: 'abbf873a-a0eb-46b8-b4cf-dc58e5f7a2d7',
} as const;
