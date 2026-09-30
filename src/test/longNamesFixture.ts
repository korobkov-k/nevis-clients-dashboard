import type { ClientsResponse } from '../../shared/clientsContract';

const months = (base: number) => Array.from({ length: 12 }, (_, index) => base + index);

/** Layout-only fixture with long names; separate from the untouched source payload. */
export const longNamesClients: ClientsResponse = {
  id: 'long-company',
  name: 'Northwind Wealth Management International Holdings',
  values: months(1200),
  branches: [
    {
      id: 'long-branch',
      name: 'Greater Metropolitan Private Client Advisory Branch',
      values: months(900),
      employees: [
        {
          id: 'long-adviser',
          name: 'Alexandra Konstantinopoulou-Montgomery',
          values: months(400),
          channels: [
            {
              id: 'long-channel',
              name: 'Referrals from existing institutional relationships',
              values: months(250),
            },
          ],
        },
      ],
    },
    { id: 'long-branch-2', name: 'Harbourfront', values: months(300) },
  ],
};
