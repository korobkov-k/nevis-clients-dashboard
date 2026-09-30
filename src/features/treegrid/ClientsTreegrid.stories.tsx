import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo } from 'react';
import { expect, waitFor } from 'storybook/test';
import type { ClientsResponse } from '../../../shared/clientsContract';
import { Panel } from '../../components/Panel';
import { buildClientTree } from '../../domain/clientTree';
import { longNamesClients } from '../../test/longNamesFixture';
import { sourceClients } from '../../test/sourceTree';
import { withPageBackground } from '../../test/storybook';
import { useDashboardController } from '../dashboard/useDashboardController';
import { ClientsTreegrid } from './ClientsTreegrid';

/** Wires the treegrid to the real dashboard controller so stories exercise real behaviour. */
function ControlledTreegrid({ data }: { data: ClientsResponse }) {
  const tree = useMemo(() => buildClientTree(data), [data]);
  const { selectedId, expandedIds, visibleRows, tabStop, actions } = useDashboardController(tree);
  return (
    <>
      <button type="button">Before</button>
      <Panel className="my-4 overflow-hidden">
        <ClientsTreegrid
          label="Clients by month"
          rows={visibleRows}
          expandedIds={expandedIds}
          selectedId={selectedId}
          tabStop={tabStop}
          onSelect={actions.selectNode}
          onToggle={actions.toggleExpanded}
          onSetExpanded={actions.setExpanded}
          onFocusChange={actions.moveFocus}
        />
      </Panel>
      <button type="button">After</button>
    </>
  );
}

const meta = {
  title: 'Treegrid/ClientsTreegrid',
  component: ControlledTreegrid,
  decorators: [withPageBackground],
  args: { data: sourceClients },
} satisfies Meta<typeof ControlledTreegrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const dataRows = (canvasElement: HTMLElement) =>
  [...canvasElement.querySelectorAll<HTMLElement>('tbody tr[data-row-id]')].map(
    (row) => row.querySelector('th')?.textContent,
  );

export const Default: Story = {
  play: async ({ canvas }) => {
    const grid = canvas.getByRole('treegrid', { name: 'Clients by month' });
    await expect(grid).toBeVisible();
    await expect(canvas.getAllByRole('row')).toHaveLength(5); // header + 4 data rows
    const company = canvas.getByRole('row', { name: /^Company/ });
    await expect(company).toHaveAttribute('aria-expanded', 'true');
    await expect(company).toHaveAttribute('aria-level', '1');
    await expect(canvas.getByRole('row', { name: /^Branch 1/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    // Leaves expose neither a disclosure state nor a chevron.
    const branch2 = canvas.getByRole('row', { name: /^Branch 2/ });
    await expect(branch2).not.toHaveAttribute('aria-expanded');
    await expect(branch2.querySelector('[data-testid="row-chevron"]')).toBeNull();
    await expect(branch2).toHaveAttribute('aria-posinset', '2');
    await expect(branch2).toHaveAttribute('aria-setsize', '3');
    await expect(canvas.getAllByRole('columnheader')).toHaveLength(13);
  },
};

export const ExpandAndCollapse: Story = {
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const chevron = (name: RegExp) => {
      const button = canvas
        .getByRole('row', { name })
        .querySelector<HTMLElement>('[data-testid="row-chevron"]');
      if (!button) throw new Error(`No chevron for ${String(name)}`);
      return button;
    };

    await step('Expanding Branch 1 reveals five advisers', async () => {
      await userEvent.click(chevron(/^Branch 1/));
      await expect(dataRows(canvasElement)).toEqual([
        'Company',
        'Branch 1',
        'Anna Blackwood',
        'James Walker',
        'Maria Gutierrez',
        'Robert Chen',
        'Sarah Smith',
        'Branch 2',
        'Branch 3',
      ]);
    });

    await step('Expanding Anna reveals three channels (twelve rows)', async () => {
      await userEvent.click(chevron(/^Anna Blackwood/));
      await expect(dataRows(canvasElement)).toHaveLength(12);
      await expect(canvas.getByRole('row', { name: /^New paid/ })).toHaveAttribute(
        'aria-level',
        '4',
      );
    });

    await step('Chevron toggles expansion only, never selection', async () => {
      await expect(canvas.queryAllByRole('row', { selected: true })).toHaveLength(0);
      await expect(canvas.getByRole('row', { name: /^Anna Blackwood/ })).toHaveFocus();
    });

    await step('Collapsing Branch 1 hides descendants and keeps their expansion', async () => {
      await userEvent.click(chevron(/^Branch 1/));
      await expect(dataRows(canvasElement)).toHaveLength(4);
      await expect(canvas.getByRole('row', { name: /^Branch 1/ })).toHaveFocus();
      await userEvent.click(chevron(/^Branch 1/));
      await expect(dataRows(canvasElement)).toHaveLength(12);
    });

    await step('Values never change on interaction', async () => {
      const branch1 = canvas.getByRole('row', { name: /^Branch 1/ });
      await expect(branch1.querySelectorAll('td')[5]).toHaveTextContent('201');
      const robert = canvas.getByRole('row', { name: /^Robert Chen/ });
      await expect(robert.querySelectorAll('td')[6]).toHaveTextContent('58');
    });
  },
};

export const SelectionVersusDisclosure: Story = {
  play: async ({ canvas, userEvent }) => {
    const branch1 = canvas.getByRole('row', { name: /^Branch 1/ });
    // Clicking numeric content selects and focuses the row without expanding it.
    await userEvent.click(branch1.querySelectorAll('td')[3] as HTMLElement);
    await expect(branch1).toHaveAttribute('aria-selected', 'true');
    await expect(branch1).toHaveAttribute('aria-expanded', 'false');
    await expect(branch1).toHaveFocus();

    // A second click keeps the selection (idempotent, no toggle-off).
    await userEvent.click(branch1);
    await expect(branch1).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getAllByRole('row', { selected: true })).toHaveLength(1);

    // Arrow navigation starts from the clicked row and does not select.
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('row', { name: /^Branch 2/ })).toHaveFocus();
    await expect(branch1).toHaveAttribute('aria-selected', 'true');
  },
};

export const KeyboardNavigation: Story = {
  play: async ({ canvas, userEvent, step }) => {
    const row = (name: RegExp) => canvas.getByRole('row', { name });

    await step('Tab enters on Company and is the only tab stop', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Before' }));
      await userEvent.tab();
      await expect(row(/^Company/)).toHaveFocus();
      await userEvent.tab();
      await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus();
      await userEvent.tab({ shift: true });
      await expect(row(/^Company/)).toHaveFocus();
    });

    await step('Arrows move focus without selecting', async () => {
      await userEvent.keyboard('{ArrowDown}');
      await expect(row(/^Branch 1/)).toHaveFocus();
      await expect(canvas.queryAllByRole('row', { selected: true })).toHaveLength(0);
    });

    await step('Right expands, then enters cells; Left walks back', async () => {
      await userEvent.keyboard('{ArrowRight}');
      await expect(row(/^Branch 1/)).toHaveAttribute('aria-expanded', 'true');
      await expect(row(/^Branch 1/)).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(canvas.getByRole('rowheader', { name: 'Branch 1' })).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}{ArrowRight}');
      const mar = row(/^Branch 1/).querySelectorAll('td')[1];
      await expect(mar).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(row(/^Anna Blackwood/).querySelectorAll('td')[1]).toHaveFocus();
      await userEvent.keyboard('{End}');
      await expect(row(/^Anna Blackwood/).querySelectorAll('td')[11]).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(row(/^Anna Blackwood/).querySelectorAll('td')[11]).toHaveFocus();
      await userEvent.keyboard('{Home}{ArrowLeft}');
      await expect(row(/^Anna Blackwood/)).toHaveFocus();
    });

    await step('Space selects without toggling; Enter discloses', async () => {
      const scrollBefore = window.scrollY;
      await userEvent.keyboard(' ');
      await expect(row(/^Anna Blackwood/)).toHaveAttribute('aria-selected', 'true');
      await expect(window.scrollY).toBe(scrollBefore);
      await userEvent.keyboard(' ');
      await expect(row(/^Anna Blackwood/)).toHaveAttribute('aria-selected', 'true');
      await userEvent.keyboard('{Enter}');
      await expect(row(/^Anna Blackwood/)).toHaveAttribute('aria-expanded', 'true');
      await userEvent.keyboard('{Enter}');
      await expect(row(/^Anna Blackwood/)).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Space in a cell selects the row and keeps cell focus', async () => {
      await userEvent.keyboard('{ArrowDown}{ArrowRight}{ArrowRight}');
      const cell = row(/^James Walker/).querySelectorAll('td')[0];
      await expect(cell).toHaveFocus();
      await userEvent.keyboard(' ');
      await expect(row(/^James Walker/)).toHaveAttribute('aria-selected', 'true');
      await expect(cell).toHaveFocus();
    });

    await step('Left from a child goes to the parent, then collapses it', async () => {
      await userEvent.keyboard('{Home}{ArrowLeft}{ArrowLeft}');
      await expect(row(/^Branch 1/)).toHaveFocus();
      await userEvent.keyboard('{ArrowLeft}');
      await expect(row(/^Branch 1/)).toHaveAttribute('aria-expanded', 'false');
      await expect(row(/^Branch 1/)).toHaveFocus();
    });

    await step('Home/End and boundaries', async () => {
      await userEvent.keyboard('{End}');
      await expect(row(/^Branch 3/)).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(row(/^Branch 3/)).toHaveFocus();
      await userEvent.keyboard('{Control>}{Home}{/Control}');
      await expect(row(/^Company/)).toHaveFocus();
    });

    await step('Re-entry restores the last focus location', async () => {
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      await userEvent.tab();
      await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus();
      await userEvent.tab({ shift: true });
      await expect(row(/^Branch 2/)).toHaveFocus();
    });
  },
};

export const Typeahead: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Before' }));
    await userEvent.tab();
    await userEvent.keyboard('b');
    await expect(canvas.getByRole('row', { name: /^Branch 1/ })).toHaveFocus();
    await userEvent.keyboard('b');
    await expect(canvas.getByRole('row', { name: /^Branch 2/ })).toHaveFocus();
    await expect(canvas.queryAllByRole('row', { selected: true })).toHaveLength(0);
  },
};

export const FocusRecoveryOnCollapse: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Before' }));
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}{ArrowRight}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}');
    await expect(canvas.getByRole('row', { name: /^Robert Chen/ })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    const branch1 = canvas.getByRole('row', { name: /^Branch 1/ });
    await waitFor(() => expect(branch1).toHaveAttribute('aria-expanded', 'false'));
    await expect(branch1).toHaveFocus();
    await expect(document.activeElement).not.toBe(document.body);
  },
};

export const LongNames: Story = {
  args: { data: longNamesClients },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Before' }));
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}{ArrowRight}{ArrowDown}{ArrowRight}{ArrowDown}');
    const channel = canvas.getByRole('row', { name: /^Referrals from existing/ });
    await expect(channel).toHaveFocus();
    // Truncated visually but the full name remains the accessible row header name.
    await expect(
      canvas.getByRole('rowheader', {
        name: 'Referrals from existing institutional relationships',
      }),
    ).toBeVisible();
  },
};

export const Empty: Story = {
  render: () => (
    <Panel className="overflow-hidden">
      <ClientsTreegrid
        label="Clients by month"
        rows={[]}
        expandedIds={new Set()}
        selectedId={null}
        tabStop={{ rowId: 'none', column: null }}
        onSelect={() => undefined}
        onToggle={() => undefined}
        onSetExpanded={() => undefined}
        onFocusChange={() => undefined}
      />
    </Panel>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No clients to show')).toBeVisible();
  },
};
