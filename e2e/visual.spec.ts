import { expect, test, type Page } from '@playwright/test';

async function ready(page: Page) {
  await page.evaluate(() => document.fonts.ready);
}

async function openDashboard(page: Page) {
  await page.goto('/');
  await expect(page.locator('.recharts-bar-rectangle').first()).toBeVisible();
  await ready(page);
}

const chevron = (page: Page, name: RegExp) =>
  page.getByRole('row', { name }).getByTestId('row-chevron');

test('default desktop', async ({ page }) => {
  await openDashboard(page);
  await expect(page).toHaveScreenshot('default-desktop.png', { fullPage: true });
});

test('expanded desktop with Anna selected', async ({ page }) => {
  await openDashboard(page);
  await chevron(page, /^Branch 1/).click();
  await chevron(page, /^Anna Blackwood/).click();
  await page.getByRole('row', { name: /^Anna Blackwood/ }).click();
  await page.mouse.move(0, 0);
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(
    'Company / Branch 1 / Anna Blackwood',
  );
  await expect(page).toHaveScreenshot('expanded-anna-desktop.png', { fullPage: true });
});

test('leaf chart', async ({ page }) => {
  await openDashboard(page);
  await page.getByRole('row', { name: /^Branch 2/ }).click();
  await page.mouse.move(0, 0);
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('Company / Branch 2');
  await expect(page).toHaveScreenshot('leaf-chart-desktop.png', { fullPage: true });
});

test('expanded at 375 px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openDashboard(page);
  await chevron(page, /^Branch 1/).click();
  await chevron(page, /^Anna Blackwood/).click();
  await page.mouse.move(0, 0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
  await expect(page).toHaveScreenshot('expanded-mobile.png', { fullPage: true });
});

test('static loading skeleton', async ({ page }) => {
  // Hold the request open so the skeleton stays on screen.
  await page.route('**/api/clients', () => undefined);
  await page.goto('/');
  await expect(page.getByTestId('dashboard-skeleton')).toBeAttached();
  await ready(page);
  await expect(page).toHaveScreenshot('loading-skeleton.png', { fullPage: true });
});

test('centred error state', async ({ page }) => {
  await page.route('**/api/clients', (route) =>
    route.fulfill({ status: 503, json: { message: 'Service unavailable' } }),
  );
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  await ready(page);
  await expect(page).toHaveScreenshot('error.png', { fullPage: true });
});

test('the dashboard replaces the skeleton without layout shift', async ({ page }) => {
  const { promise: gate, resolve: release } = Promise.withResolvers<undefined>();
  await page.route('**/api/clients', async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto('/');
  await expect(
    page.locator('[data-testid="dashboard-skeleton"] .recharts-bar-rectangle'),
  ).toHaveCount(12);
  await ready(page);

  const geometry = () =>
    page.evaluate(() => {
      const box = (element: Element | null) => {
        const rect = element?.getBoundingClientRect();
        return rect ? [rect.top, rect.left, rect.width, rect.height].map(Math.round) : null;
      };
      return {
        panels: [...document.querySelectorAll('main section')].map(box),
        header: box(document.querySelector('thead tr')),
        rows: [...document.querySelectorAll('tbody tr')].slice(0, 4).map(box),
        monthLabels: [...document.querySelectorAll('.recharts-xAxis-tick-labels text')].map(box),
        gridlines: [...document.querySelectorAll('.recharts-cartesian-grid-horizontal line')]
          .map((line) => line.getAttribute('y1'))
          .sort(),
      };
    });

  const skeleton = await geometry();
  release(undefined);
  await expect(page.getByRole('treegrid')).toBeVisible();
  expect(await geometry()).toEqual(skeleton);
});
