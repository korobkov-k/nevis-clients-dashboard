import { expect, test, type Locator, type Page } from '@playwright/test';

const chartHeading = (page: Page) => page.getByRole('heading', { level: 2 });
const row = (page: Page, name: RegExp) => page.getByRole('row', { name });
const legend = (page: Page) => page.getByRole('list', { name: 'Series' });

async function readTooltipAt(page: Page, monthIndex: number): Promise<Locator> {
  await page.locator('.recharts-surface[tabindex="0"]').focus();
  for (let index = 0; index < monthIndex; index += 1) await page.keyboard.press('ArrowRight');
  return page.locator('.recharts-tooltip-wrapper [aria-live]');
}

test('drills down from the chart and keeps context while the treegrid changes', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Clients' })).toBeVisible();
  await expect(chartHeading(page)).toHaveText('Company');

  await test.step('select Branch 1 through a chart segment', async () => {
    const branch1Segments = page.locator('.recharts-bar-rectangles').first();
    await branch1Segments.locator('.recharts-bar-rectangle path').nth(3).click();
    await expect(chartHeading(page)).toHaveText('Company / Branch 1');
    await expect(row(page, /^Branch 1/)).toHaveAttribute('aria-selected', 'true');
    await expect(row(page, /^Branch 1/)).toHaveAttribute('aria-expanded', 'false');
  });

  await test.step('select Anna through the legend', async () => {
    await legend(page).getByRole('button', { name: 'Anna Blackwood' }).click();
    await expect(chartHeading(page)).toHaveText('Company / Branch 1 / Anna Blackwood');
    await expect(page.getByText('By acquisition channel', { exact: true })).toBeVisible();
    await expect(row(page, /^Anna Blackwood/)).toBeVisible();
    await expect(row(page, /^Anna Blackwood/)).toHaveAttribute('aria-selected', 'true');
    await expect(legend(page).getByRole('button')).toHaveText([
      'Existing clients',
      'New organic',
      'New paid',
    ]);

    const tooltip = await readTooltipAt(page, 4);
    await expect(tooltip).toContainText('June 2024');
    await expect(tooltip).toContainText('New organic0');
    await expect(tooltip).toContainText('Breakdown total33');
    await expect(tooltip).toContainText('Reported total32');
  });

  await test.step('collapse Branch 1 and keep the chart context', async () => {
    await row(page, /^Branch 1/)
      .getByTestId('row-chevron')
      .click();
    await expect(row(page, /^Anna Blackwood/)).toHaveCount(0);
    await expect(chartHeading(page)).toHaveText('Company / Branch 1 / Anna Blackwood');
  });

  await test.step('reset to the Company overview', async () => {
    await page.getByRole('button', { name: 'Company overview' }).click();
    await expect(chartHeading(page)).toHaveText('Company');
    await expect(legend(page).getByRole('button')).toHaveText(['Branch 1', 'Branch 2', 'Branch 3']);
    await expect(row(page, /^Branch 1/)).toHaveAttribute('aria-expanded', 'false');
  });
});
