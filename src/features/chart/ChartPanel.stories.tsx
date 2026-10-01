import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, waitFor, within } from 'storybook/test';
import { buildChartModel } from '../../domain/chartModel';
import { buildClientTree } from '../../domain/clientTree';
import { MONTHS } from '../../domain/months';
import { IDS, sourceClients } from '../../test/sourceTree';
import { withPageBackground } from '../../test/storybook';
import { ChartPanel } from './ChartPanel';

const tree = buildClientTree(sourceClients);
const scope = (id: string) => buildChartModel(tree, id);

const meta = {
  title: 'Chart/ChartPanel',
  component: ChartPanel,
  decorators: [withPageBackground],
  args: {
    model: scope(IDS.company),
    hasSelection: false,
    animate: false,
    onSelectNode: fn(),
    onShowOverview: fn(),
  },
} satisfies Meta<typeof ChartPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Hovers a month's first segment and returns the tooltip it opens. */
async function openTooltipAt(canvasElement: HTMLElement, monthIndex: number) {
  const segment = await waitFor(() => {
    const element = canvasElement
      .querySelectorAll('.recharts-bar-rectangles')[0]
      ?.querySelectorAll('.recharts-bar-rectangle path')[monthIndex];
    if (!element) throw new Error('Chart has not rendered');
    return element;
  });
  const { left, top, width, height } = segment.getBoundingClientRect();
  segment.dispatchEvent(
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: left + width / 2,
      clientY: top + height / 2,
    }),
  );
  const tooltip = await waitFor(() => {
    const box = canvasElement.querySelector<HTMLElement>(
      '.recharts-tooltip-wrapper dl',
    )?.parentElement;
    if (!box?.textContent.startsWith(MONTHS[monthIndex]?.longLabel ?? '')) {
      throw new Error(`Tooltip for month ${monthIndex} not shown`);
    }
    return box;
  });
  return within(tooltip);
}

const yTicks = (canvasElement: HTMLElement) =>
  [
    ...canvasElement.querySelectorAll(
      '.recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value',
    ),
  ].map((tick) => tick.textContent);

/** Segments of one series, waiting for the responsive container to measure. */
async function segments(canvasElement: HTMLElement, seriesIndex: number) {
  return waitFor(() => {
    const layer = canvasElement.querySelectorAll('.recharts-bar-rectangles')[seriesIndex];
    const paths = [...(layer?.querySelectorAll<SVGElement>('.recharts-bar-rectangle path') ?? [])];
    if (paths.length === 0) throw new Error(`Series ${seriesIndex} has not rendered`);
    return paths;
  });
}

export const CompanyOverview: Story = {
  play: async ({ canvas, canvasElement, step }) => {
    await expect(canvas.getByRole('heading', { name: 'Company' })).toBeVisible();
    await expect(canvas.getByText('By branch')).toBeVisible();
    const legend = canvas.getByRole('list', { name: 'Series' });
    await expect(
      within(legend)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Branch 1', 'Branch 2', 'Branch 3']);
    await expect(canvas.getByRole('button', { name: 'Company overview' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await expect(
      canvas.getByText(/Stacked bar chart of monthly clients for Company, by branch/),
    ).toBeInTheDocument();

    await step('February tooltip omits Reported total when it equals the breakdown', async () => {
      const tooltip = await openTooltipAt(canvasElement, 0);
      await expect(tooltip.getByText('February 2024')).toBeVisible();
      await expect(tooltip.getByText('Breakdown total').nextElementSibling).toHaveTextContent(
        '250',
      );
      await expect(tooltip.queryByText('Reported total')).toBeNull();
    });

    await step('May tooltip lists every branch, the breakdown and reported totals', async () => {
      const tooltip = await openTooltipAt(canvasElement, 3);
      await expect(tooltip.getByText('May 2024')).toBeVisible();
      await expect(tooltip.getByText('Branch 1').nextElementSibling).toHaveTextContent('156');
      await expect(tooltip.getByText('Branch 2').nextElementSibling).toHaveTextContent('87');
      await expect(tooltip.getByText('Branch 3').nextElementSibling).toHaveTextContent('36');
      await expect(tooltip.getByText('Breakdown total').nextElementSibling).toHaveTextContent(
        '279',
      );
      await expect(tooltip.getByText('Reported total').nextElementSibling).toHaveTextContent('301');
    });

    await step('Y axis starts at zero with rounded integer ticks', async () => {
      await waitFor(() => expect(yTicks(canvasElement)).toEqual(['0', '100', '200', '300', '400']));
    });
  },
};

export const SegmentAndLegendSelection: Story = {
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    const branch2Segments = await segments(canvasElement, 1);
    await expect(branch2Segments).toHaveLength(12);
    await userEvent.click(branch2Segments[4] as SVGElement);
    await expect(args.onSelectNode).toHaveBeenLastCalledWith(IDS.branch2, 'chart-segment');

    await userEvent.click(canvas.getByRole('button', { name: 'Branch 3' }));
    await expect(args.onSelectNode).toHaveBeenLastCalledWith(IDS.branch3, 'chart-legend');
    // The legend never hides a series.
    // Recharts renders the hovered segment in its own layer, so count per-month groups.
    const branch3Groups = canvasElement
      .querySelectorAll('.recharts-bar-rectangles')[2]
      ?.querySelectorAll('.recharts-bar-rectangle');
    await expect(branch3Groups).toHaveLength(12);
  },
};

export const Branch1Scope: Story = {
  args: { model: scope(IDS.branch1), hasSelection: true },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('heading', { name: 'Company / Branch 1' })).toBeVisible();
    await expect(canvas.getByText('By adviser')).toBeVisible();
    await expect(
      within(canvas.getByRole('list', { name: 'Series' })).getAllByRole('button'),
    ).toHaveLength(5);
    const tooltip = await openTooltipAt(canvasElement, 6);
    await expect(tooltip.getByText('Robert Chen').nextElementSibling).toHaveTextContent('58');
    await expect(tooltip.getByText('Breakdown total').nextElementSibling).toHaveTextContent('216');
    await expect(tooltip.getByText('Reported total').nextElementSibling).toHaveTextContent('214');
  },
};

export const AnnaScope: Story = {
  args: { model: scope(IDS.anna), hasSelection: true },
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    await expect(
      canvas.getByRole('heading', { name: 'Company / Branch 1 / Anna Blackwood' }),
    ).toBeVisible();
    await expect(canvas.getByText('By acquisition channel')).toBeVisible();

    const tooltip = await openTooltipAt(canvasElement, 4);
    await expect(tooltip.getByText('June 2024')).toBeVisible();
    // Zero values are listed, not dropped.
    await expect(tooltip.getByText('New organic').nextElementSibling).toHaveTextContent('0');
    await expect(tooltip.getByText('Breakdown total').nextElementSibling).toHaveTextContent('33');
    await expect(tooltip.getByText('Reported total').nextElementSibling).toHaveTextContent('32');

    await userEvent.click(canvas.getByRole('button', { name: 'Company overview' }));
    await expect(args.onShowOverview).toHaveBeenCalledOnce();

    // Ancestors in the path are buttons; the current node is not.
    const heading = canvas.getByRole('heading', { level: 2 });
    await expect(
      within(heading)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Company', 'Branch 1']);
    await userEvent.click(within(heading).getByRole('button', { name: 'Branch 1' }));
    await expect(args.onSelectNode).toHaveBeenLastCalledWith(IDS.branch1, 'chart-breadcrumb');
  },
};

export const LeafScope: Story = {
  args: { model: scope(IDS.branch2), hasSelection: true },
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    await expect(canvas.getByRole('heading', { name: 'Company / Branch 2' })).toBeVisible();
    await expect(canvas.getByText('Monthly clients')).toBeVisible();
    await expect(canvas.queryByRole('list', { name: 'Series' })).toBeNull();

    const tooltip = await openTooltipAt(canvasElement, 11);
    await expect(tooltip.getByText('Branch 2').nextElementSibling).toHaveTextContent('91');
    await expect(tooltip.queryByText('Breakdown total')).toBeNull();
    await expect(tooltip.queryByText('Reported total')).toBeNull();

    await userEvent.click((await segments(canvasElement, 0))[0] as SVGElement);
    await expect(args.onSelectNode).toHaveBeenLastCalledWith(IDS.branch2, 'chart-segment');
  },
};

const zeros = () => Array.from({ length: 12 }, () => 0);
/** Synthetic all-zero tree (not source data) to prove the axis stays non-degenerate. */
const zeroModel = buildChartModel(
  buildClientTree({
    id: 'zero-root',
    name: 'Zero adviser',
    values: zeros(),
    branches: [
      { id: 'zero-a', name: 'Channel A', values: zeros() },
      { id: 'zero-b', name: 'Channel B', values: zeros() },
    ],
  }),
  'zero-root',
);

export const AllZeroValues: Story = {
  args: { model: zeroModel, hasSelection: true },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(yTicks(canvasElement)).toEqual(['0', '1']));
  },
};

export const NoSeries: Story = {
  args: { model: { ...scope(IDS.company), series: [] } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No data to display')).toBeVisible();
    await expect(canvas.queryByRole('list', { name: 'Series' })).toBeNull();
  },
};
