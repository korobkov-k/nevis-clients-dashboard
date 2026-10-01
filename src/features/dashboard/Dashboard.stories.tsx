import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { sourceClients } from '../../test/sourceTree';
import { Dashboard } from './Dashboard';

const meta = {
  title: 'Dashboard/Dashboard',
  component: Dashboard,
  args: { data: sourceClients, animateChart: false },
  decorators: [
    (Story) => (
      <main className="flex min-h-screen flex-col gap-4 bg-background-primary px-4 py-6">
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof Dashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

async function segmentOf(canvasElement: HTMLElement, seriesIndex: number, monthIndex = 0) {
  return waitFor(() => {
    const layer = canvasElement.querySelectorAll('.recharts-bar-rectangles')[seriesIndex];
    const segment = layer?.querySelectorAll<SVGElement>('.recharts-bar-rectangle path')[monthIndex];
    if (!segment) throw new Error('Chart has not rendered');
    return segment;
  });
}

export const Default: Story = {};

export const LinkedNavigation: Story = {
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const chartHeading = () => canvas.getByRole('heading', { level: 2 });
    const row = (name: RegExp) => canvas.getByRole('row', { name });
    const grid = canvas.getByRole('treegrid');

    await step('A Branch 1 segment selects Branch 1 without expanding it', async () => {
      await userEvent.click(await segmentOf(canvasElement, 0, 3));
      await expect(chartHeading()).toHaveTextContent('Company / Branch 1');
      await expect(canvas.getByText('By adviser')).toBeVisible();
      await expect(row(/^Branch 1/)).toHaveAttribute('aria-selected', 'true');
      await expect(row(/^Branch 1/)).toHaveAttribute('aria-expanded', 'false');
      await expect(grid).not.toContainElement(document.activeElement as HTMLElement);
    });

    await step('The Anna legend entry reveals only her ancestors', async () => {
      const legend = canvas.getByRole('list', { name: 'Series' });
      within(legend).getByRole('button', { name: 'Anna Blackwood' }).focus();
      await userEvent.keyboard('{Enter}');
      await expect(chartHeading()).toHaveTextContent('Company / Branch 1 / Anna Blackwood');
      await expect(row(/^Branch 1/)).toHaveAttribute('aria-expanded', 'true');
      await expect(row(/^Anna Blackwood/)).toHaveAttribute('aria-selected', 'true');
      await expect(row(/^Anna Blackwood/)).toHaveAttribute('aria-expanded', 'false');
      // The activated legend button is gone; focus stays in the chart on its heading.
      await expect(chartHeading()).toHaveFocus();
    });

    await step('The treegrid entry target is the selected row, without a focus jump', async () => {
      await expect(row(/^Anna Blackwood/)).toHaveAttribute('tabindex', '0');
      await expect(grid.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    });

    await step('Collapsing Branch 1 keeps the chart context and hidden selection', async () => {
      const chevron = row(/^Branch 1/).querySelector<HTMLElement>('[data-testid="row-chevron"]');
      await userEvent.click(chevron as HTMLElement);
      await expect(canvas.queryByRole('row', { name: /^Anna Blackwood/ })).toBeNull();
      await expect(chartHeading()).toHaveTextContent('Company / Branch 1 / Anna Blackwood');
      await expect(canvas.queryAllByRole('row', { selected: true })).toHaveLength(0);
    });

    await step('Company overview clears selection but keeps expansion', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Company overview' }));
      await expect(chartHeading()).toHaveTextContent(/^Company$/);
      await expect(row(/^Branch 1/)).toHaveAttribute('aria-expanded', 'false');
      await expect(row(/^Company/)).toHaveAttribute('aria-expanded', 'true');
    });
  },
};

export const BreadcrumbNavigation: Story = {
  play: async ({ canvas, userEvent, step }) => {
    const chartHeading = () => canvas.getByRole('heading', { level: 2 });
    const crumb = (name: string) => within(chartHeading()).getByRole('button', { name });
    const row = (name: RegExp) => canvas.getByRole('row', { name });

    await step('Drill down to New paid through the legend', async () => {
      const legend = () => canvas.getByRole('list', { name: 'Series' });
      await userEvent.click(within(legend()).getByRole('button', { name: 'Branch 1' }));
      await userEvent.click(within(legend()).getByRole('button', { name: 'Anna Blackwood' }));
      await userEvent.click(within(legend()).getByRole('button', { name: 'New paid' }));
      await expect(chartHeading()).toHaveTextContent(
        'Company / Branch 1 / Anna Blackwood / New paid',
      );
    });

    await step('A keyboard-activated crumb drills up and keeps focus in the chart', async () => {
      crumb('Anna Blackwood').focus();
      await userEvent.keyboard('{Enter}');
      await expect(chartHeading()).toHaveTextContent('Company / Branch 1 / Anna Blackwood');
      await expect(row(/^Anna Blackwood/)).toHaveAttribute('aria-selected', 'true');
      await expect(chartHeading()).toHaveFocus();
    });

    await step('The Company crumb selects Company without collapsing anything', async () => {
      await userEvent.click(crumb('Company'));
      await expect(chartHeading()).toHaveTextContent(/^Company$/);
      await expect(row(/^Company/)).toHaveAttribute('aria-selected', 'true');
      await expect(row(/^Anna Blackwood/)).toHaveAttribute('aria-expanded', 'true');
      await expect(within(chartHeading()).queryAllByRole('button')).toHaveLength(0);
    });
  },
};

function highlightedSegments(canvasElement: HTMLElement, seriesIndex: number) {
  const layer = canvasElement.querySelectorAll('.recharts-bar-rectangles')[seriesIndex];
  return layer?.querySelectorAll('.chart-segment-highlighted').length ?? 0;
}

export const LinkedHover: Story = {
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const row = (name: RegExp) => canvas.getByRole('row', { name });
    const legendItem = (name: string) =>
      within(canvas.getByRole('list', { name: 'Series' })).getByRole('button', { name });

    await step('A table row highlights its whole series and legend entry', async () => {
      await userEvent.hover(row(/^Branch 2/));
      await waitFor(() => expect(highlightedSegments(canvasElement, 1)).toBe(12));
      await expect(highlightedSegments(canvasElement, 0)).toBe(0);
      await expect(legendItem('Branch 2')).toHaveClass('text-content-primary');
      await userEvent.unhover(row(/^Branch 2/));
      await waitFor(() => expect(highlightedSegments(canvasElement, 1)).toBe(0));
    });

    await step('A legend entry highlights its row with the hover colour', async () => {
      await userEvent.hover(legendItem('Branch 3'));
      await expect(row(/^Branch 3/)).toHaveClass('bg-surface-hover');
      await expect(highlightedSegments(canvasElement, 2)).toBe(12);
      await userEvent.unhover(legendItem('Branch 3'));
      await expect(row(/^Branch 3/)).not.toHaveClass('bg-surface-hover');
    });

    await step('A chart segment highlights only itself, its row and tooltip line', async () => {
      const segment = await segmentOf(canvasElement, 0, 4);
      await userEvent.hover(segment);
      await waitFor(() => expect(highlightedSegments(canvasElement, 0)).toBe(1));
      await expect(row(/^Branch 1/)).toHaveClass('bg-surface-hover');
    });
  },
};

export const LeafChartIsIdempotent: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole('row', { name: /^Branch 2/ }));
    await expect(canvas.getByRole('heading', { level: 2 })).toHaveTextContent('Company / Branch 2');
    await expect(canvas.queryByRole('list', { name: 'Series' })).toBeNull();
    await userEvent.click(await segmentOf(canvasElement, 0, 5));
    await expect(canvas.getByRole('heading', { level: 2 })).toHaveTextContent('Company / Branch 2');
    await expect(canvas.getAllByRole('row', { selected: true })).toHaveLength(1);
  },
};

export const OverviewResetDoesNotRestoreHiddenFocus: Story = {
  play: async ({ canvas, userEvent }) => {
    const row = (name: RegExp) => canvas.getByRole('row', { name });
    await userEvent.click(
      row(/^Branch 1/).querySelector('[data-testid="row-chevron"]') as HTMLElement,
    );
    await userEvent.click(row(/^Robert Chen/));
    await userEvent.click(
      row(/^Branch 1/).querySelector('[data-testid="row-chevron"]') as HTMLElement,
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Company overview' }));

    // Tab from the chart lands on the nearest visible row, not hidden Robert.
    canvas.getByRole('button', { name: 'Branch 3' }).focus();
    await userEvent.tab();
    await expect(row(/^Branch 1/)).toHaveFocus();
    await expect(canvas.queryByRole('row', { name: /^Robert Chen/ })).toBeNull();
  },
};
