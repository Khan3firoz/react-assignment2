# Operations Dashboard — Configurable Dashboard Builder

A frontend-only, professional operations dashboard builder. Users assemble a
dashboard from a widget catalogue, configure each widget, filter the whole
board, and save versioned revisions — all in the browser, with no backend,
no database, and no external API. Data comes from a hardcoded mock service
that deliberately simulates a hostile network.

---

## Installation

Requires **Node 18+**.

```bash
npm install
```

## Running the application

```bash
npm run dev        # start Vite dev server (http://localhost:5173)
npm run build      # type-check (tsc -b) + production build to dist/
npm run preview    # serve the production build
npm run typecheck  # tsc -b only
```

---

## Architecture

```
src/
  components/
    dashboard/     Dashboard shell: header, filter bar, grid, sidebar,
                   dialogs (revisions, conflict, share), dev panels.
    widgets/       The four widgets, the shared WidgetShell frame, the
                   registry, the per-widget error boundary, state views.
    editor/        WidgetEditorDialog — edit a widget's config.
    ui/            Small shadcn-style primitives (button, card, dialog,
                   select, slider, switch, badge, …). No Radix.
  dashboard/       Domain core (no React):
    schema.ts        Versioned Zod schema for the dashboard config (v2).
    validator.ts     validateDashboardConfig() — probe → migrate → validate.
    migrations.ts    v1 → v2 migration chain.
    adapter.ts       v2 config  <->  runtime shape used by widgets.
    filterEngine.ts  The ONE place widget data is filtered.
    catalogue.ts     Widget catalogue metadata.
    types.ts         Runtime Dashboard / Widget / Filters types.
  services/        Side-effecting layer (no React):
    mockDataService.ts   Async mock "server": delay, failure, timeout,
                         payload corruption. Returns RAW unvalidated JSON.
    schemas.ts           Strict per-data-source Zod payload contracts.
    validatePayload.ts   Classifies a payload into success / empty /
                         missing-field / wrong-type / invalid.
    faultConfig.ts       Pub/sub store for the Failure Simulator.
    dashboardStorage.ts  localStorage persistence + revision history +
                         concurrent-edit detection.
    shareService.ts      Frontend-only share simulation.
  hooks/
    useDashboard.ts    All dashboard state: add / remove / edit / filter /
                       save / restore / conflict.
    useWidgetData.ts   Per-widget fetch → validate → filter → state machine.
    useFaultConfig.ts  Subscribe to the Failure Simulator config.
  mock/
    dataSources.ts     Pristine hardcoded "server" payloads.
    hostileConfigs.ts  16 malformed dashboard configs + 1 valid v1 config.
    data.ts            Region / status enums used by the filter bar.
```

**Data flow for one widget:**

```
useWidgetData(sourceId, filters)
  └─ fetchDataSource()          mock async server, returns raw JSON or rejects
       └─ validatePayload()     strict Zod parse → success | empty | error kind
            └─ applyFilters()   centralized region/status filtering
                 └─ WidgetDataState: loading | success | empty | error
```

Every widget is wrapped in a **React error boundary** (`WidgetErrorBoundary`)
and the whole app in a last-resort `AppErrorBoundary`.

---

## Widgets

Registered in `src/components/widgets/registry.ts`:

```ts
const widgetRegistry = {
  metric:    MetricWidget,
  table:     TableWidget,
  barChart:  BarChartWidget,
  lineChart: LineChartWidget,
};
```

| Widget      | Data source(s)              | Renders                                   |
|-------------|-----------------------------|-------------------------------------------|
| **Metric**  | `orders`, `revenue`         | One KPI number + period-over-period delta |
| **Table**   | `recentOrders`              | Order rows with status badges             |
| **Bar chart** | `ordersByRegion`          | Orders per region (Recharts)              |
| **Line chart** | `revenueTrend`           | Revenue over months (Recharts)           |

Add a widget from the sidebar catalogue. Hover (or keyboard-focus) a widget
to reveal **Edit** / **Delete**. Edit opens a dialog to change the title,
data source, and (charts only) accent colour; the config is Zod-validated
before it is applied.

**Invariant:** *A widget either displays validated, truthful data, or it
visibly displays why it cannot.* There is no `data?.value ?? 0` anywhere.
`success` state carries only Zod-parsed data typed to the payload schema.

---

## Filters

The filter bar has **Region** and **Status**. Filters apply to the whole
dashboard: changing one re-runs `useWidgetData` for every widget.

Filter logic lives in exactly one place — `src/dashboard/filterEngine.ts`.
Widgets never re-implement it. It understands the validated payload shapes:

- **table** — rows filtered on `region` + `status`
- **series** — points filtered on `region` when the x-axis is regional;
  a month-trend series is left untouched
- **metric** — a single aggregate has no dimension to slice, so it is passed
  through (documented, not a silent fallback)

If filtering empties a collection, the widget switches to its **empty** state.

---

## Failure Simulator

A developer panel in the sidebar (`FailureSimulatorPanel`). It drives a
global fault config; any change causes every widget to re-fetch and
re-validate.

| Control          | Effect                                                        |
|------------------|--------------------------------------------------------------|
| **API Delay**    | 0–5000 ms artificial latency (`setTimeout`)                  |
| **Failure Rate** | 0–100 % chance each request rejects with a network error    |
| **Force Timeout**| Every request exceeds the hard timeout ceiling              |
| **Remove Field** | Drop the payload's primary field → widget "missing field"   |
| **Wrong Data Type** | Return a string where a number/array is expected         |
| **Empty Response** | Structurally valid payload with no rows / points          |
| **Reset**        | Restore defaults                                            |

Widget error copy is exact per failure class — e.g. a missing field shows
*"⚠ Unable to display widget / Field \"value\" does not exist. [Retry]"*, a
type mismatch shows *"⚠ Invalid data / Expected number / Received string"*.

A failure in one widget never affects the others.

---

## Hostile Configurations

A second developer panel (`HostileConfigPanel`) lets you load a malformed
dashboard **configuration** into a preview frame. The app must never crash;
invalid configs land on the canonical surface:

> ⚠ Invalid Dashboard Configuration
> The dashboard configuration cannot be rendered.
> [View Details]

"View Details" shows the failure kind, a summary, and a per-path issue list.
Invalid configs are **never silently repaired**.

The 16 fixtures (`src/mock/hostileConfigs.ts`): empty object, missing
`schemaVersion`, `schemaVersion 999`, `widgets` null, `widgets` string, null
widget, unknown widget type, duplicate widget IDs, missing binding, missing
field, wrong field type, invalid filter, negative layout, huge layout,
malicious HTML title, unknown data source. A valid **v1** config is also
included to exercise the v1 → v2 migration.

---

## Revisions

Every **Save** writes a new revision to localStorage with a monotonic version
number, a timestamp, and an auto-generated change description
(`+2 widgets`, `filters changed`, `renamed`, …). Open **Revisions** in the
header to see them newest-first.

**Restore is non-destructive.** Restoring revision *N* appends a *new*
revision whose contents equal *N* — later revisions are kept:

```
v1  v2  v3  v4  v5
restore v2  →  v6   (v6 contents == v2 contents; v3..v5 still there)
```

### Concurrent edit detection

Before saving, the editor compares the version it started from against what
is now in localStorage. If localStorage moved ahead (another tab saved), the
save is **blocked** and a dialog appears:

> ⚠ Dashboard Changed
> This dashboard was modified elsewhere.
> Your version: 4   Latest version: 5
> [Reload Latest] [Cancel]

The newer revision is never silently overwritten. Use the **Concurrent Edit**
dev panel → *Simulate external save* to trigger this.

---

## Sharing

`ShareDialog` (header → **Share**) is a frontend-only simulation:

- **Private** — only you can view
- **Anyone with link can view** — mints a fake `#/share/<token>` URL with a
  Copy button

The choice persists in localStorage. Nothing leaves the browser.

---

## Known limitations

- **No backend, by design.** Persistence is localStorage; "sharing" and
  "concurrent edits" are simulations. Clearing site data resets everything.
- **No drag-and-drop layout.** Widget order follows insertion order; the grid
  is a fixed responsive layout (metrics span 1 column, others span 2, tables
  span the full width). The v2 schema stores a `layout` block and validates
  it, but the renderer does not yet honour arbitrary positions.
- **Filters are region + status only.** The schema models general filters
  with operators, but the UI and `filterEngine` implement the two the brief
  asked for.
- **Metric widgets ignore filters.** A single aggregate cannot be sliced by
  region/status without per-record data for that metric; this is surfaced in
  the code and the README rather than faked.
- **Recharts bundle size.** The single JS chunk is ~670 KB (190 KB gzipped),
  mostly Recharts + React. No code-splitting was added.
- **No automated test suite.** Logic was verified with throwaway Node
  scripts during development (service fault matrix, config-validation matrix,
  storage/revision/conflict semantics, boot + widget-render paths); these
  were not kept in the repo. `SELF_REVIEW.md` covers this.
- **Mock service leaves one dangling timer** (~2 s) when *Force Timeout* is
  on: the hard timeout fires first, the inner latency timer is not cleared.
  Harmless for a mock; noted for honesty.
