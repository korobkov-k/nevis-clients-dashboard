# Agent guide

Canonical instructions for humans and coding agents working in this repository.

## Sources and precedence

1. `server/data/clients.json`: the payload copied unchanged from `docs/source/Nevis-Frontend-Home-Assignment.pdf`. It is the only numeric truth. Never edit, normalise or reconcile it.
2. `docs/nevis-frontend-rfc.md` and `docs/nevis-frontend-acceptance.md`: agreed product/technical decisions and the acceptance checklist, including the keyboard contract and palette.
3. [Figma](https://www.figma.com/design/t6itC2qsmr3WLPugwrVdqS/Web-engineer-home-task?node-id=1-2781): appearance only. Numbers that appear only in Figma (e.g. Branch 1 Jul 2024 = 291) are ignored.

## Boundaries

| Layer             | Location                                                  | Rule                                                                                            |
| ----------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Contract          | `shared/clientsContract.ts`                               | Shared by server and client. No fixtures.                                                       |
| API               | `server/`                                                 | `GET /api/clients` returns the root object as-is. Production also serves `dist/client`.         |
| Request lifecycle | `src/api/`, `DashboardPage`                               | TanStack Query, no automatic retries or focus refetching.                                       |
| Pure domain       | `src/domain/`                                             | Tree index, visible rows, chart model, axis scale. No React.                                    |
| Controller        | `src/features/dashboard/dashboardState.ts`                | One reducer for selection, expansion and logical focus. Actions carry node ID and origin.       |
| Linked hover      | `src/features/dashboard/hoverStore.ts`, `linkedHover.tsx` | Transient pointer state only, read through primitive selectors. Never put hover in the reducer. |
| Presentation      | `src/features/{chart,treegrid}`, `src/components`         | Narrow props and callbacks; DOM focus through refs; no cross-component sync effects.            |

- The production client never imports `server/**` (enforced by ESLint). Stories and tests may reuse the fixture via `src/test/sourceTree.ts`.
- Styling: Tailwind utilities plus the tokens and small global layer in `src/styles.css`. No CSS Modules or UI kits (MUI, Radix, shadcn, grid libraries).
- Chart colours come from `--color-chart-1…10` by sibling index (`src/domain/chartPalette.ts`). Never generate colours at runtime.

## Commands

| Command                     | Purpose                                                 |
| --------------------------- | ------------------------------------------------------- |
| `pnpm dev`                  | Vite + Fastify API (proxied `/api`)                     |
| `pnpm storybook`            | Isolated component review                               |
| `pnpm check`                | Types, lint, format, unit + Storybook interaction tests |
| `pnpm test:e2e`             | Production build + real-API Playwright smoke            |
| `pnpm test:visual`          | Production build + visual comparisons                   |
| `pnpm build` / `pnpm start` | Production build and Fastify runtime                    |

## Acceptance rules

- Test behaviour at the lowest useful layer: adapters and reducer in Vitest (literal expectations), interactions in stories, one real-API journey in Playwright.
- Stories and tests are deterministic: MSW handlers or route interception, fresh query clients, no sleeps.
- No test-only routes, query parameters or hidden controls in production code.
- Visual baselines (`e2e/baselines/`) change only after a human has compared the new screenshots with Figma. Never update them just to make a check pass (`pnpm test:visual:update`).
- Run `pnpm check` before committing; run `pnpm test:e2e` and `pnpm test:visual` when behaviour or appearance changes.
