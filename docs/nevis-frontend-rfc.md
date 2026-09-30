# Clients Dashboard: RFC

Agreed product and technical decisions, updated 30 September 2026. Read with the supplied specification PDF and `nevis-frontend-acceptance.md`, which contains exact interactions, palette tokens and acceptance tests.

## Problem

Build a dashboard for exploring monthly client counts from Company through branches, advisers and acquisition channels. The specification provides a hierarchical JSON payload and visual references, but leaves interactions and inconsistent totals unresolved. Deliver one linked chart and treegrid without inventing or correcting source data.

## Proposal

### Approach

- **Application:** React, strict TypeScript, Vite, Tailwind CSS, Recharts and native HTML table markup with treegrid semantics. Fastify runs on supported Node.js LTS, with `tsx` for development. Use pnpm, ESLint/Prettier, one repository/package manifest, compatible pinned versions and a committed lockfile.
- **Delivery:** `GET /api/clients` returns the unchanged source JSON. [Vite proxies development requests](https://vite.dev/config/server-options); production Fastify serves the built frontend and API. Share contracts, not server fixtures, with the production client.
- **State:** TanStack Query owns the request, with automatic retries/focus refetching disabled and explicit Retry. One dashboard-scoped React reducer/controller owns selection, expansion and logical focus; chart and treegrid receive derived data and callbacks.

### Key decisions

- **Authority:** the supplied JSON is numeric truth; [Figma](https://www.figma.com/design/t6itC2qsmr3WLPugwrVdqS/Web-engineer-home-task?node-id=1-2781) supplies appearance. Conflicting design numbers never override JSON. Parent/child discrepancies exist in the JSON itself: May Company reports 301 while its branches sum to 279.
- **Chart scope:** no selection means Company overview. Stack the effective node’s immediate children, never mixed hierarchy levels. Leaves show their own values without a legend. Display the node’s path and grouping. Adapt Y to each scope with a zero baseline, integer ticks and rounded upper bound covering displayed values.
- **Tooltip:** show the month, all series including zeros, and “Breakdown total.” Add “Reported total” only when the selected parent’s value differs. Leaves show their own value without redundant totals. No normalization, fabricated remainder, or permanent explanatory notice below the chart.
- **Unified selection:** row, legend and segment activation select the same node through one controller. Chart selection uses the series node ID, not the month or mutable index; it reveals only the node’s ancestors in the treegrid. Legend clicks do not hide series. Repeated selection and leaf-chart clicks are idempotent.
- **Expansion and focus:** Company starts expanded; other nodes are collapsed with no explicit selection. Disclosure only changes expansion. Collapsing retains descendant expansion and hidden selection; hidden focus recovers to the ancestor. Row clicks select and focus the row. Chart navigation keeps DOM focus in the chart, while preparing the selected row for treegrid re-entry. Refresh restores defaults.
- **Keyboard:** one treegrid tab stop; navigation does not select. Use the [WAI rows-first model](https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/examples/treegrid-1/) with separate Space selection and Enter disclosure. Right expands, then enters monthly cells. No special double-click action; exact keys and focus recovery are in the checklist.
- **Presentation:** shared Figma-derived tokens and a fixed ten-color palette, preserving the approved first five. Generate extensions once, never at runtime. At 375 px, confine horizontal scrolling to the table, bound the sticky name column and keep focused cells visible.
- **Request states:** initial loading uses chart axes, twelve neutral placeholder bars and table skeleton rows. CSS shimmer is opt-in, vertical on bars and horizontal on rows, with reduced-motion override. Error replaces the dashboard with a viewport-centered message and Retry; “Retrying…” remains in place during another attempt.

### What changes

- **Controller and rendering:** one user action updates related state atomically; pure adapters derive chart series and visible rows. No cross-component synchronization Effects, selection-triggered fetches or forced remounts. Preserve stable keys/references; keep tooltip hover local. Normal React rerenders are allowed; avoid unnecessary recalculation rather than claiming zero renders ([React state guidance](https://react.dev/learn/you-might-not-need-an-effect)).
- **Verification:** Vitest covers adapters/controller and [Fastify `inject()`](https://fastify.dev/docs/latest/Guides/Testing/). Storybook React/Vite, its [Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon) and MSW cover interactions/request states. Playwright adds one real-API journey and visually reviewed baselines.
- **Agent contract:** canonical `AGENTS.md`, referenced by `CLAUDE.md`, defines sources, boundaries, commands and acceptance. Baseline changes require visual review.

## Alternatives Considered

- **Fixed chart or fabricated channels:** a fixed scope prevents linked exploration; company-wide channel data cannot be inferred from Anna.
- **UI/grid frameworks:** MUI, Radix and shadcn are unnecessary dependencies here. Implement the bounded treegrid controller with native table layout and tested interaction semantics.
- **Expanded platform:** exclude SSR/Next.js, database, authentication, virtualization and CI infrastructure.

## Migration / Rollout

1. Establish source data, tokens and compatible tooling; prove API → page → story → test.
2. Implement controller, adapters, chart/treegrid and request states with acceptance tests.
3. Review desktop, 375 px, keyboard/accessibility, render behavior and screenshots.
4. Perform fresh-context diff review; verify build/start and document actual test evidence.

## Specification gaps and assumptions

- **Drill-down:** selection-driven chart navigation is an explicit product decision, not inferred proof of a selected adviser in the prototype.
- **Incomplete data:** missing children mean no available breakdown; reported totals remain independent from child sums.
- **Unspecified states:** the defined loading, error, selection, mobile and palette rules fill gaps in the source design. Internal table scrolling preserves every month without page overflow.
