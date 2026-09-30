# Clients Dashboard: implementation checklist

Companion to `nevis-frontend-rfc.md`, updated 30 September 2026. Implement one linked chart and treegrid using Tailwind CSS, Recharts and native table markup. The rules below are the implementation baseline; do not add MUI, Radix, shadcn or a grid library.

## Inputs and scope

- **Read before coding:** the supplied specification PDF, RFC and [main Figma screen](https://www.figma.com/design/t6itC2qsmr3WLPugwrVdqS/Web-engineer-home-task?node-id=1-2781). Copy the complete payload, including IDs, from the PDF rather than reconstructing it from checklist examples.
- **Design references:** inspect [branch expansion](https://www.figma.com/design/t6itC2qsmr3WLPugwrVdqS/Web-engineer-home-task?node-id=0-1491), [channel expansion](https://www.figma.com/design/t6itC2qsmr3WLPugwrVdqS/Web-engineer-home-task?node-id=0-1447), [row states](https://www.figma.com/design/t6itC2qsmr3WLPugwrVdqS/Web-engineer-home-task?node-id=0-1533) and [row-name variants](https://www.figma.com/design/t6itC2qsmr3WLPugwrVdqS/Web-engineer-home-task?node-id=0-1414). Report unavailable design access; do not claim visual verification of an approximation.
- **Language and delivery:** application text, code identifiers and README are English. Public deployment or distribution requires explicit authorization.
- **Scope:** hierarchical exploration, selection-driven chart, request states and responsive presentation. Exclude sorting, search, editing, export, routing, persistence, lazy-loaded branches, AI functionality and speculative performance work.

## Application contract

- [ ] Use shared Figma-derived tokens, Tailwind utilities and a small global stylesheet. Do not introduce CSS Modules or an additional UI system.
- [ ] Keep the unchanged source fixture on the server; stories/tests may reuse it, but the production client must load it through the API.
- [ ] Return the original root object from `GET /api/clients` without an extra envelope. Check HTTP failures and distinguish errors from empty success.
- [ ] Fetch the complete tree once through TanStack Query. Disable automatic retries and focus refetching, provide Retry, and isolate caches between stories/tests.
- [ ] Use one ordered month definition, Feb 2024 through Jan 2025, for both surfaces. Avoid timezone-sensitive parsing for labels.
- [ ] Separate request lifecycle, selection/expansion/focus state, pure adapters and presentation. Components receive narrow APIs, not whole query/store objects.
- [ ] Table, chart and legend interactions use one dashboard-scoped React reducer/controller and unidirectional data flow. Store one selected-node ID; derive the effective node, chart series and visible rows. Do not synchronize separate component copies through Effects.
- [ ] Represent each user intent with one action carrying stable node identity and its origin, updating related selection/expansion/logical-focus state atomically. Keep reducers pure; perform necessary DOM focus work through refs after commit, not inside the reducer ([React reducer guidance](https://react.dev/learn/extracting-state-logic-into-a-reducer)).
- [ ] Keep the chart and treegrid mounted across selection changes; do not key whole surfaces by selected node or rebuild their DOM imperatively. Use source IDs as row/series keys, preserve unchanged references and memoize expensive adapters at the relevant dependency boundary. Changes to focus/expansion alone must not rebuild chart data.
- [ ] Keep transient tooltip hover local to the chart. Avoid passing one changing controller object to every row; pass narrow values/callbacks. Verify representative interactions with React Profiler rather than adding blanket memoization or promising zero rerenders.
- [ ] Type-check client, server, stories and tests. Verify both development and production build/start.

## Chart and data acceptance

- [ ] Use Recharts documented props/renderers and shared tokens, not DOM mutation or private selectors.
- [ ] Resolve the effective chart node from selection, defaulting to Company. Derive series from its immediate children in source order with stable IDs.
- [ ] Company overview and explicit Company selection stack three branches. Branch 1 stacks five advisers. Anna stacks three acquisition channels.
- [ ] A leaf, including Branch 2/3, shows its own twelve values as a single bar series without a legend. Never fabricate children to match other nodes at the same level.
- [ ] Recompute the Y-axis for each selected scope, starting at zero with integer tick labels and a rounded upper bound at or above the maximum displayed monthly value/stack sum. Never scale to a mismatching parent total or clip a stack. Handle an all-zero story with a non-degenerate domain.
- [ ] Show node name/path and grouping, such as “Company / Branch 1 / Anna” and “By acquisition channel.” Use “Monthly clients” for a leaf. Keep context visible even if its selected row is hidden.
- [ ] Include an explicit Company overview action that clears selection without resetting expansion. Clicking an already selected row or pressing Space on it keeps selection unchanged.
- [ ] Show correct series names in legend/tooltip. Expansion and focus movement must not affect chart data; never use visible rows as series.
- [ ] Preserve all twelve source values, including zeros. Do not normalize, reconcile, allocate remainders or invent an “Other” category.
- [ ] Show a month-level tooltip containing every displayed series, including zero values, followed by “Breakdown total.” Add “Reported total” only if the effective node's JSON value differs from that sum. For leaves show the node's own value without duplicated totals. Do not add a permanent discrepancy caption or banner.
- [ ] Preserve the distinction between source data and design mistakes: the JSON itself contains parent/child discrepancies; Figma-only numeric differences are ignored. Never label a child sum as a reported parent value.
- [ ] Exact values remain available through the linked, keyboard-accessible treegrid. Give the chart a concise accessible scope description; tooltip content must not rely only on color. Verify keyboard tooltip reading using supported Recharts accessibility behavior.
- [ ] Use the fixed ten-color tokens below, preserving the first five and keeping labels/order stable. No runtime palette generator or dependency.
- [ ] Legend entries and nonzero stack segments activate their represented node through the same controller as row selection. Use the originating series node ID, not its mutable index. A segment's month does not become a filter; legend activation does not hide series.
- [ ] Chart/legend selection reveals only ancestors needed to make the selected row visible, preserving all other expansion flags. Do not automatically expand the selected node's children, collapse unrelated branches or change source values.
- [ ] Keep DOM focus in the chart on chart navigation; if a keyboard-activated legend button disappears, focus the stable chart heading. Set the treegrid's next entry target to the selected row, without immediately focusing or scrolling to it. A later manual collapse uses normal focus recovery and preserves selection.
- [ ] Use keyboard-operable legend buttons so zero-valued segments remain selectable through their legend entry. On touch, tapping a segment selects directly rather than requiring a tooltip-first double tap. Clicking a leaf-chart bar selects its already active node idempotently; empty plot space does nothing.

### Fixed palette

Use these tokens in source sibling order for a node's child series. A selected leaf retains the token associated with its position among its parent's children; selection/focus/hover never renumbers colors.

| Token    | HEX       | Status              |
| -------- | --------- | ------------------- |
| chart-1  | `#B29DF8` | Approved, unchanged |
| chart-2  | `#F4BEB4` | Approved, unchanged |
| chart-3  | `#A75E6E` | Approved, unchanged |
| chart-4  | `#97D8C4` | Approved, unchanged |
| chart-5  | `#275DAD` | Approved, unchanged |
| chart-6  | `#448502` | Generated extension |
| chart-7  | `#C58A04` | Generated extension |
| chart-8  | `#0D9296` | Generated extension |
| chart-9  | `#8D52B7` | Generated extension |
| chart-10 | `#F680C0` | Generated extension |

The extension was generated once with the first five anchors fixed, choosing separated in-gamut OKLab candidates; it is not a runtime feature or an accessibility certification. Inspect the [ten-color preview](https://coolors.co/b29df8-f4beb4-a75e6e-97d8c4-275dad-448502-c58a04-0d9296-8d52b7-f680c0), then verify stacked-chart legibility and color-vision behavior during visual review. The supplied data needs at most five concurrent series; the remaining tokens are reserved, not a reason to invent additional data.

### Numeric regression checks

Mapping tests use literal expectations rather than values recomputed through the adapter under test:

| Scope / check         | Expected                                                                     |
| --------------------- | ---------------------------------------------------------------------------- |
| Company, Feb 2024     | Branches 147, 76, 27; breakdown total 250                                    |
| Company, May 2024     | Branches 156, 87, 36; breakdown total 279; reported Company 301              |
| Company, Jan 2025     | Branches 214, 91, 45; breakdown total 350                                    |
| Branch 1, Aug 2024    | Advisers 38, 16, 51, 58, 53; breakdown total 216; reported Branch 1 214      |
| Anna, Jun 2024        | Channels 31, 0, 2; breakdown total 33; reported Anna 32                      |
| Anna, Aug 2024        | Channels 34, 2, 0; breakdown total 36; reported Anna 38                      |
| Branch 2 leaf         | One series, Feb 76 and Jan 91, no legend                                     |
| Existing channel leaf | One series, Feb 25 and Jan 34, no legend                                     |
| Structure             | Twelve months; stable source IDs/order; no mixed hierarchy levels            |
| Independence          | Expansion/focus changes preserve selected scope, series and values           |
| Y-axis                | Zero baseline; integer ticks; domain covers each scope’s largest stack/value |

## Tree state and pointer acceptance

- [ ] Flatten visible nodes into sibling `<tr>` elements in a valid table. No nested accordion panels or `<div>` wrappers between rows.
- [ ] Keep selection, expansion and active focus independently addressable. Focus includes row identity and, when applicable, column identity.
- [ ] Initially Company is expanded, branches collapsed, with no explicit selection. Four data rows are visible and the chart shows Company overview.
- [ ] Expanding Branch 1 reveals five advisers; expanding Anna reveals three channels. Fully expanded there are twelve data rows.
- [ ] Only Company, Branch 1 and Anna have children/disclosures. Leaves have neither an inactive chevron nor `aria-expanded`.
- [ ] Clicking row content selects that row and sets both actual DOM focus and the treegrid's active focus location to the row, including clicks on numeric content. Subsequent arrow navigation starts there. Clicking the chevron toggles expansion only, stops propagation into selection, and likewise focuses its row.
- [ ] Use a roughly 32 × 32 px chevron hit target around the design-sized glyph. Preserve row geometry.
- [ ] Do not attach a double-click action or delay single-click handling. Two row clicks remain idempotent selection.
- [ ] Collapsing a parent hides descendants but retains their expansion flags and the selected node. Reopening restores prior descendant expansion.
- [ ] If collapse would hide active keyboard focus, move it to the collapsing ancestor without changing selection. Never leave DOM focus on an unmounted descendant.
- [ ] Hidden selection remains represented by the chart path and overview reset. Do not pretend the collapsing ancestor is selected.
- [ ] Numbers never change on interaction: Branch 1 Jul remains 201; Robert Aug remains 58. Refresh resets transient UI state.

## Keyboard and accessibility acceptance

Use MUI as the reference for separating selection from disclosure, not as a dependency. Its [icon-container expansion](https://mui.com/x/react-tree-view/simple-tree-view/expansion/#limit-expansion-to-icon-container) and [keyboard documentation](https://mui.com/x/react-tree-view/accessibility/) describe a tree view; our monthly columns require the [WAI rows-first treegrid model](https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/examples/treegrid-1/).

Use native table layout with explicit treegrid semantics and a small tested focus controller. This is not an unchanged MUI tree: Right enters cells after expansion, and Space selects idempotently instead of toggling selection off.

- [ ] Apply `role="treegrid"` with an accessible name; preserve explicit row, rowheader, columnheader and gridcell relationships. Follow the [treegrid semantic requirements](https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/).
- [ ] Expose each data row’s hierarchy level and sibling position/count, expanded state where applicable, and selection state. Preserve month/header associations; do not replace numeric cells with one concatenated row label.
- [ ] Use roving `tabIndex`: one active row/cell is in the Tab sequence; other navigable rows/cells are programmatically focusable. The non-interactive header and chevrons are not additional Tab stops.
- [ ] Chevron activation is also available through row/name-cell Enter and horizontal navigation. If represented by a button, exclude it from sequential Tab navigation and prevent duplicate keyboard handling.
- [ ] Before any interaction, first keyboard entry focuses Company. A row click or chart/legend navigation establishes a new row entry target. Otherwise re-entry restores the last valid focus location; if hidden, use its nearest visible ancestor. Mere focus restoration must not expand hidden selection or change the chart.
- [ ] Tab/Shift+Tab leave the composite in the corresponding direction. All cells contain read-only data, so no internal edit mode or focus trap is needed.
- [ ] Keep keyboard focus visibly distinct from selected-row styling and pointer hover. Provide concise discoverable keyboard instructions.

The following is the product’s precise keyboard contract, based on rows-first navigation with explicit, independent row selection:

| Key                   | Row focus                                                                | Cell focus                                              |
| --------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------- |
| Up / Down             | Previous/next visible data row                                           | Previous/next visible data row, same column             |
| Right                 | Expand if collapsed; otherwise focus the first cell, including on leaves | Next cell, without wrapping                             |
| Left                  | Collapse if expanded; otherwise focus parent, if any                     | Previous cell; from first cell, return to row           |
| Enter                 | Toggle expansion for parents; select leaves                              | Name cell: same action as row; numeric cells: no action |
| Space                 | Select row without toggling it off                                       | Select containing row without changing cell focus       |
| Home / End            | First/last visible data row                                              | First/last cell in current row                          |
| Ctrl+Home / Ctrl+End  | First/last visible data row                                              | First/last visible data row, same column                |
| Page Up / Page Down   | Move by approximately one viewport of rows, clamped at boundaries        | Same movement, preserving column                        |
| Printable name prefix | Focus next matching visible node, wrapping search; never select          | No typeahead action                                     |

- [ ] Boundary arrows do nothing, without navigation wrapping. Typeahead searches visible labels case-insensitively, supports a short buffered prefix, and excludes modifier shortcuts.
- [ ] Prevent browser defaults only for handled keys. Do not intercept Tab, browser shortcuts or IME composition; Space selection must not scroll the page.
- [ ] Scroll focused rows/cells into view, including horizontally at narrow widths, without hiding the cell behind the sticky name column.
- [ ] Do not add multi-selection shortcuts or sibling-wide expansion. These additional MUI shortcuts are not part of this bounded product contract.
- [ ] Inspect the accessibility tree and perform a keyboard pass. Attempt real screen-reader testing when available; label it unverified otherwise. Automated checks do not establish screen-reader usability.

## Visual and request states

- [ ] Match desktop spacing, typography, panels, row heights, indentation, separators, chart colors and hover styling. Centralize measured tokens; do not substitute a generic dashboard theme.
- [ ] Share fonts, tokens and Tailwind stylesheet between application and Storybook. Use explicit class mappings or CSS variables, not dynamically assembled utility names.
- [ ] Prefer supplied/exportable local fonts and avatars. Otherwise use deterministic fallbacks/initials and document the difference; no random avatar service.
- [ ] Add restrained selected/focused states and chart context compatible with the reference design. Do not claim these unspecified states were supplied by Figma.
- [ ] At 375 px, no document-level horizontal overflow. Keep table scrolling internal and the sticky name column bounded; every month must remain reachable.
- [ ] Expanded content grows the page rather than clipping to the prototype frame. A focused numeric cell is readable, not merely present in the DOM.
- [ ] Initial loading preserves panel geometry and the page heading. The chart skeleton contains axis lines, the twelve known month positions and twelve neutral placeholder bars for the fixed year view; omit invented numeric Y ticks, totals, tooltip values and live interactions. Placeholder heights are deterministic, not random or presented as data.
- [ ] The table skeleton uses its header geometry and four initial-row placeholders. Loading is announced once; decorative placeholders are hidden from assistive technology and introduce no focusable controls. Replace skeletons as soon as data arrives, with no artificial minimum delay.
- [ ] Implement CSS shimmer as one explicit opt-in component/config option, disabled by default. When enabled, shimmer travels vertically through chart bars and horizontally across table rows; it must not animate bar values/heights. Disabling the option leaves static skeletons with identical geometry. `prefers-reduced-motion: reduce` always disables shimmer.
- [ ] On request error render only a viewport-centered error message and Retry against the page background. Remove dashboard title, panels, chart axes, table and skeletons; do not retain a dashboard-shaped empty shell or add duplicate errors/toasts.
- [ ] Use “Couldn’t load client data” with a concise useful explanation. Keep the same centered layout during retry; its action becomes “Retrying…” and blocks duplicate requests. Failure restores Retry, success shows the dashboard. Announce the outcome; if the focused retry control disappears on success, recover focus to the dashboard heading.
- [ ] Cover empty chart/table inputs in isolated stories without fabricating an empty API contract or zero-valued success chart.
- [ ] Keep all chart bars/data on narrow screens; reduce tick-label density if necessary, not data density.

## Tests and stories

Test behavior at the lowest useful layer. Screenshots are review evidence, not proof of correct numeric mapping.

| Layer                         | Minimum coverage                                                                                                                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vitest, Node                  | Literal chart expectations; controller selection from each origin; ancestor-only reveal; visible-row order; retained expansion/selection; focus transitions; stable derived chart data on focus/expansion changes; Fastify response through `inject()` |
| Storybook + Vitest browser    | Company, Branch 1, Anna and leaf chart scopes; row/segment/legend activation; selection versus disclosure; keyboard navigation and focus recovery; tooltip mismatch/equality cases; skeleton/error/retry                                               |
| MSW                           | Deterministic page success, pending loading and error-to-retry transition                                                                                                                                                                              |
| Playwright Test               | One real-API journey: select Branch 1 by a chart segment, Anna by legend, verify selected row and chart scope/data, manually collapse Branch 1 and verify preserved chart context, reset overview                                                      |
| Playwright visual comparisons | Default desktop, expanded desktop with Anna selected, leaf chart, expanded 375 px state, static loading skeleton, centered error state                                                                                                                 |

- **Keyboard regression:** Tab enters/leaves once; row clicks establish the origin for subsequent arrows; focus movement does not select; Space selects; Enter discloses; Right reaches month cells; collapse recovers hidden focus; returning from the chart reset does not restore a hidden focus target.
- **Chart regression:** verify a known month's rendered series/tooltip values, not just SVG geometry. At Company scope, May shows Breakdown total 279 and Reported total 301; February omits Reported total because both equal 250. Leaves do not duplicate their value as a total.
- **Linked-navigation regression:** chart and legend select the same node as its table row. Verify ancestors become visible but the selected node's children do not open; the treegrid receives the right next-entry target without an immediate DOM-focus jump. Repeated leaf selection is a no-op.
- **Motion regression:** test shimmer off, shimmer explicitly enabled, and reduced-motion override. Snapshot the static variant; test CSS animation behavior separately without flaky moving-image baselines.
- **Story scope:** stories around table, chart and page, including a separate long-name fixture. Do not document every cell or modify the original payload for layout testing.
- **Determinism:** explicit response control and observable conditions, no arbitrary sleeps. Reset handlers/caches; control the typeahead timer in tests.
- **Production paths:** no test-only API routes, application query parameters or hidden controls. MSW/interception handles failures; the real-API smoke remains unmocked.
- **Visual setup:** fixed viewport, locale and browser; wait for fonts; consistently disable chart animations. Use the same rendering environment for [Playwright screenshot comparisons](https://playwright.dev/docs/test-snapshots).
- **Review:** save screenshots for inspection. Compare the first baseline to Figma, document intentional differences, and never rewrite baselines only to make checks pass.

## Local commands and handoff

- **`pnpm dev`:** frontend and real API together.
- **`pnpm storybook`:** isolated review surface.
- **`pnpm check`:** type checks, lint/format checks and non-interactive logic/API/story tests.
- **`pnpm test:e2e` / `pnpm test:visual`:** separate smoke and visual suites; document report access and browser prerequisites.
- **`pnpm build` / `pnpm start`:** production build and runtime.

Keep canonical `AGENTS.md` with `CLAUDE.md` referencing it. Record source precedence, commands, boundaries and acceptance rules without creating a review platform or repetitive per-component policy files.

Finish with a fresh-context review using the source specification, RFC, diff and test evidence. Check data honesty, keyboard/accessibility behavior, visual differences and unnecessary complexity; fix material findings and rerun affected checks.

README must cover setup, commands, assumptions, known limitations and next steps. Separate tests actually run from planned or unavailable checks.

## Specification gaps and assumptions

- **Initial chart and drill-down:** no selected row initially; Company overview is the default. Selection controls scope; the static design is not treated as proof of a selected Anna state.
- **Breakdown availability:** immediate children determine series. No children means one own-value series, not a missing-data error or invented breakdown.
- **Inconsistent totals:** discrepancies exist in the source JSON, not only Figma. Retain every supplied value; child sums are breakdown totals and may differ from reported counts. Surface the difference only through the conditional Reported total tooltip row.
- **Selection versus expansion:** manual disclosure is independent of selection, including hidden selection and retained descendant expansion. Chart/legend navigation additionally reveals ancestors to expose the selected row, not its children. Only overview reset clears selection during a page session; refresh restores defaults.
- **Keyboard adaptation:** MUI-inspired interactions are adapted to a rows-first treegrid for meaningful monthly columns. Focus does not imply selection; Space is idempotent; no multi-select or special double-click action.
- **Unspecified states:** the loading axes/twelve-bar skeleton, opt-in directional shimmer, centered error/retry screen and fixed ten-color palette follow the product decisions above. Internal horizontal scrolling keeps all months reachable without page overflow.
- **Source inconsistencies and assets:** numeric conflicts resolve to the PDF; unsupported leaf chevrons are omitted. Document any unavailable font/avatar fallback rather than silently substituting assets.
