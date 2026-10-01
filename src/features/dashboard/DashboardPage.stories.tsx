import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import {
  clientsHandlers,
  createRetryGate,
  stubReducedMotion,
  withQueryClient,
} from '../../test/storybook';
import { DashboardPage } from './DashboardPage';

const meta = {
  title: 'Dashboard/DashboardPage',
  component: DashboardPage,
  decorators: [withQueryClient],
  beforeEach: () => stubReducedMotion(true),
  parameters: { msw: { handlers: [clientsHandlers.success] } },
} satisfies Meta<typeof DashboardPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const skeletonBars = (canvasElement: HTMLElement) =>
  canvasElement.querySelectorAll('[data-testid="dashboard-skeleton"] .recharts-bar-rectangle');

export const Loaded: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('treegrid')).toBeVisible();
    await expect(canvas.getByRole('heading', { level: 1, name: 'Clients' })).toBeVisible();
    await expect(canvas.getByRole('heading', { level: 2 })).toHaveTextContent('Company');
    await expect(canvas.getAllByRole('row')).toHaveLength(5);
  },
};

export const Loading: Story = {
  parameters: { msw: { handlers: [clientsHandlers.pending] } },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'Clients' })).toBeVisible();
    await expect(canvas.getByText('Loading client data…')).toBeInTheDocument();
    await waitFor(() => expect(skeletonBars(canvasElement)).toHaveLength(12));
    await expect(canvasElement.querySelectorAll('[data-testid="skeleton-row"]')).toHaveLength(4);
    await expect(canvas.getAllByText('Feb 2024')).toHaveLength(2); // chart axis + table header
    // Gridlines but no invented Y values.
    const yLabels = [
      ...canvasElement.querySelectorAll(
        '.recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value',
      ),
    ];
    await expect(yLabels.every((label) => label.textContent === '')).toBe(true);
    // Decorative, static and not focusable.
    const skeleton = canvasElement.querySelector('[data-testid="dashboard-skeleton"]');
    await expect(
      skeleton?.querySelectorAll('button, a, input, [tabindex]:not([tabindex="-1"])'),
    ).toHaveLength(0);
    for (const panel of skeleton?.children ?? []) {
      await expect(panel).toHaveAttribute('aria-hidden', 'true');
    }
    await expect(canvasElement.querySelector('.shimmer-x, .shimmer-y')).toBeNull();
    await expect(canvas.queryByRole('treegrid')).toBeNull();
  },
};

export const LoadingWithShimmer: Story = {
  args: { loadingShimmer: true },
  parameters: { msw: { handlers: [clientsHandlers.pending] } },
  beforeEach: () => stubReducedMotion(false),
  play: async ({ canvasElement }) => {
    const chartShimmer = canvasElement.querySelector<HTMLElement>('[data-testid="chart-shimmer"]');
    const row = canvasElement.querySelector<HTMLElement>('[data-testid="skeleton-row"]');
    await expect(chartShimmer).toHaveClass('shimmer-y');
    await expect(row).toHaveClass('shimmer-x');
    await expect(getComputedStyle(chartShimmer as HTMLElement).animationName).toBe('shimmer-y');
    await expect(getComputedStyle(row as HTMLElement).animationName).toBe('shimmer-x');
    // The shimmer is an overlay; the placeholder bars themselves never animate.
    await waitFor(() => expect(skeletonBars(canvasElement)).toHaveLength(12));
  },
};

export const LoadingShimmerWithReducedMotion: Story = {
  args: { loadingShimmer: true },
  parameters: { msw: { handlers: [clientsHandlers.pending] } },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(skeletonBars(canvasElement)).toHaveLength(12));
    await expect(canvasElement.querySelector('.shimmer-x, .shimmer-y')).toBeNull();
  },
};

export const LoadError: Story = {
  parameters: { msw: { handlers: [clientsHandlers.failure] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('alert')).toHaveTextContent('Couldn’t load client data');
    await expect(canvas.getByRole('button', { name: 'Retry' })).toBeVisible();
    await expect(canvas.queryByRole('heading', { name: 'Clients' })).toBeNull();
    await expect(canvas.queryByRole('treegrid')).toBeNull();
  },
};

const gate = createRetryGate();

export const RetryAfterError: Story = {
  parameters: { msw: { handlers: [gate.handler] } },
  beforeEach: () => {
    gate.reset();
    return stubReducedMotion(true);
  },
  play: async ({ canvas, userEvent, step }) => {
    const retry = await canvas.findByRole('button', { name: 'Retry' });

    await step('A failed retry shows Retrying… in place, then restores Retry', async () => {
      await userEvent.click(retry);
      await expect(canvas.getByRole('button', { name: 'Retrying…' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
      // Duplicate activation is ignored while the request is in flight.
      await userEvent.click(canvas.getByRole('button', { name: 'Retrying…' }));
      gate.release();
      await expect(await canvas.findByRole('button', { name: 'Retry' })).toBeVisible();
      await expect(canvas.getByRole('alert')).toHaveTextContent('Couldn’t load client data');
    });

    await step('A successful retry shows the dashboard and focuses its heading', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Retry' }));
      await expect(canvas.getByRole('button', { name: 'Retrying…' })).toHaveFocus();
      gate.release();
      const heading = await canvas.findByRole('heading', { level: 1, name: 'Clients' });
      await waitFor(() => expect(heading).toHaveFocus());
      await expect(canvas.getByRole('treegrid')).toBeVisible();
      await expect(gate.requestCount()).toBe(3);
    });
  },
};
