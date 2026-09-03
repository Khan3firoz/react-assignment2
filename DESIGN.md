# DESIGN

How the configurable dashboard is put together, and why.

---

## Configuration format

The dashboard is a single **versioned** object. The current version is **2**.

```jsonc
{
  "schemaVersion": 2,
  "id": "operations",
  "name": "Operations Dashboard",
  "filters": [
    { "id": "region", "field": "region", "operator": "eq", "value": "North" }
  ],
  "widgets": [
    {
      "id": "w-orders",
      "type": "metric",
      "title": "Orders",
      "binding": { "dataSource": "orders", "fields": ["value", "previousValue"] },
      "layout": { "x": 0, "y": 0, "w": 4, "h": 4 },
      "accent": "#6366f1"            // charts only, optional
    }
  ],
  "updatedAt": "2026-09-03T12:00:00.000Z"
}
```

Defined in `src/dashboard/schema.ts`. Notable choices:

- **`schemaVersion`** is a `z.literal(2)` on the current schema — a config
  that isn't exactly v2 does not match it and is routed through migration or
  rejected.
- **`filters`** is an array of `{ id, field, operator, value }` with a closed
  set of operators (`eq`, `neq`, `in`, `contains`, `gt`, `lt`) and
  per-operator value rules (`in` needs an array, `gt`/`lt` need a number).
- **`widget.binding`** makes the data dependency explicit: which data source,
  and which fields the widget reads. `fields` must be non-empty.
- **`widget.layout`** values are **non-negative bounded integers** (`0..96`,
  `w`/`h` ≥ 1). This is what makes "negative layout" and "huge layout"
  hostile configs fail instead of rendering.
- **`title`** and **`name`** reject `<` / `>` so a "malicious HTML title"
  fails loudly rather than being silently sanitised.
- Objects are `.strict()` — unknown keys are a validation error.

### Runtime shape

Widgets don't consume the v2 config directly. `src/dashboard/adapter.ts`
converts it to a flatter runtime `Dashboard` (`{ filters: {region,status},
widgets: [{ id, type, config:{ title, dataSource, accent } }] }`) and back.
This kept the widget components simple while the persisted format stayed
strict and versioned. The transform is lossless for everything the UI edits.

---

## Validation

`src/dashboard/validator.ts` — `validateDashboardConfig(input): ValidationResult`
is the **only** way an untrusted blob becomes a renderable config. Pipeline:

1. **Probe.** Not an object / missing `schemaVersion` / non-integer version
   → `invalid`. Version outside the supported set (`[1, 2]`) →
   `unsupported-version` (visible, no repair).
2. **Migrate** if the version is older but supported (see below). A failing
   migration → `migration-failed`.
3. **Strict validate** the (possibly migrated) object against the v2 Zod
   schema, plus a cross-field check for duplicate widget IDs. Any issue →
   `invalid`, carrying the full `path — message` issue list.
4. Success → `{ ok: true, config, migratedFrom }`.

The result is a discriminated union; the UI renders `InvalidConfigNotice`
for every `ok: false` branch and never falls back to a default.

**Two validation layers, deliberately separate:**

| Layer | File | Validates | On failure |
|-------|------|-----------|------------|
| Config | `dashboard/schema.ts` + `validator.ts` | the dashboard document | `InvalidConfigNotice` |
| Payload | `services/schemas.ts` + `validatePayload.ts` | one data-source response | widget error state |

Payload schemas are intentionally unforgiving: **no `.optional()`, no
`.default()`, no `.catch()`**. `validatePayload` inspects the first Zod issue
to classify it precisely — `invalid_type` with `received: "undefined"` →
missing field; other `invalid_type` → wrong type (expected/received strings
surfaced to the UI); an all-empty collection → `empty`.

---

## Migration

`src/dashboard/migrations.ts` holds an **ordered chain** of steps
`{ from, to, run }`. `runMigrations(input, fromVersion)` applies steps until
the config reaches the current version; a gap in the chain throws
`MigrationError` (→ `migration-failed`, visible).

**v1 → v2** implemented:

- `filters: { region, status }` → `filters[]` (only non-`"all"` values are
  carried over, as `eq` filters)
- each widget gains an explicit `binding { dataSource, fields }` (fields
  looked up from a per-source map) and a computed `layout` block
- `widget.config.*` is flattened onto the widget

The migration re-validates its input as a strict v1 object first, so a
"v1-ish but broken" config fails in migration rather than producing garbage.

Adding v3 later is: append one `{ from: 2, to: 3, run }` step. Nothing else
changes.

---

## Widget registry

`src/components/widgets/registry.ts`:

```ts
export const widgetRegistry: Record<WidgetType, ComponentType<WidgetProps>> = {
  metric: MetricWidget,
  table: TableWidget,
  barChart: BarChartWidget,
  lineChart: LineChartWidget,
};
```

`WidgetRenderer` looks up `registry[widget.type]`, renders it inside a
`WidgetErrorBoundary`, and passes a `resetKey` derived from the widget config
so editing a crashed widget clears the boundary. An unknown `type` renders a
small inline "Unknown widget type" note (it can only happen from a hand-edited
runtime object; the schema rejects unknown types on load).

Every widget receives the same `WidgetProps` (`widget`, `filters`, `onEdit`,
`onDelete`) and renders through the shared `WidgetShell` frame, so states and
controls look identical across widget types.

---

## Async data layer

`src/services/mockDataService.ts` — `fetchDataSource(sourceId, { signal })`
is a `Promise` over `setTimeout`. There is no backend; this *is* the server.
It returns **raw, unvalidated JSON** — validation is exclusively the widget
layer's job. It never substitutes a default.

Simulated conditions, all from `faultConfig` (the Failure Simulator):

- **delay** — `0..5000 ms`, clamped
- **failure rate** — a `Math.random()*100 < rate` roll *after* the latency,
  like a real API; rejects with `MockServiceError("network")`
- **timeout** — `forceTimeout` sets the delay past a hard
  `REQUEST_TIMEOUT_MS` ceiling; a second internal timer rejects with
  `MockServiceError("timeout")`. The ceiling also acts as a real client-side
  abort would.
- **payload corruption** — `removeField` / `wrongDataType` / `emptyResponse`
  mutate a deep clone of the pristine payload. Order is fixed
  (`removeField` > `wrongDataType` > `emptyResponse`) so each toggle is
  independently testable.

`useWidgetData` owns the per-widget state machine:
`loading → (success | empty | error)`. It cancels stale responses with a
request-id ref + `AbortController`, re-fetches when the source, the two
filter fields, or the fault config change, and exposes `retry()`.

---

## Error handling

Three tiers, from most specific to last-resort:

1. **Expected data failures** are values, not exceptions. `useWidgetData`
   returns `{ status: "error", reason }` where `reason` is a discriminated
   union (`request-failed`, `timeout`, `missing-field`, `wrong-type`,
   `invalid`). `WidgetError` renders the exact copy per class with a
   **Retry** button.
2. **Per-widget crash boundary** — `WidgetErrorBoundary` wraps each widget.
   A render/runtime throw in one widget shows a contained "Widget crashed"
   card with **Reload widget**; siblings and the shell are unaffected.
3. **App boundary** — `AppErrorBoundary` wraps the whole tree. A crash in the
   shell itself shows a "Something went wrong / Reload page" panel with the
   error message, instead of a blank screen. `useDashboard`'s initial store
   read is a lazy state initialiser wrapped in try/catch, so even a
   pathological stored blob degrades to a fresh default rather than a boot
   crash.

Invalid **configurations** are handled before rendering by
`InvalidConfigNotice` (never a boundary — it's an expected outcome).

---

## Persistence

`src/services/dashboardStorage.ts`. Two keys:

```
operations-dashboard:current     { version, config }     latest saved
operations-dashboard:revisions   Revision[]              newest first, cap 50
```

Everything is stored as the strict v2 config and re-validated with
`validateDashboardConfig` on read. A stored blob that fails validation is
reported (`loadDashboard()` → `{ status: "invalid", result }`), never
repaired.

- `saveDashboard(dashboard, description?)` — writes `{version, config}` and
  prepends a `Revision`. Version = `highestVersion() + 1` (monotonic;
  computed across both keys). Auto description diffs widget adds/removes/edits
  + filter/name changes.
- `loadDashboard()` — `empty | ok{dashboard, version, migratedFrom} | invalid`.
- `getRevisions()` — all revisions, newest first.
- `restoreRevision(version)` — **appends** a new revision equal to the target
  (description `Restored from vN`). Later revisions are untouched.

---

## Concurrency

Single browser, no backend — so "concurrent edit" is: another tab saved
while this editor was open.

`useDashboard` tracks `baseVersion` — the version the editor started from
(advances on save and on Reload Latest). `saveDashboard` is preceded by
`detectConflict(baseVersion)`, which compares `baseVersion` against the
`version` currently in localStorage:

- equal (or base ahead) → save proceeds, new revision written
- localStorage ahead → **`ConflictDialog`**, save aborted. The user chooses
  **Reload Latest** (load stored config, re-base) or **Cancel** (keep
  editing, decide later).

The newer revision is never overwritten without an explicit user choice.
`simulateExternalSave()` (dev panel) writes the current stored config back
under the next version to create the condition.

---

## Trade-offs

- **v2 config vs. runtime shape (adapter).** Two representations is more code,
  but it let the persisted format be strict/versioned/migratable while the
  widgets stayed trivial. The adapter is small and lossless for edited fields.
- **Filtering after validation, in the hook.** Filtering the validated
  payload (rather than pushing filters into the mock "server") keeps the
  service a dumb data source and puts all filter logic in one pure module.
  Cost: charts/tables fetch the full payload and filter client-side — fine at
  mock-data scale.
- **No Radix / headless-UI.** Hand-rolled `Dialog`, `Select`, `Switch`,
  `Slider` keep the dependency list tiny. Cost: the focus trap in `Dialog` is
  minimal (focus-in on open + Esc + backdrop click, no full tab cycling).
- **Metric widgets ignore filters.** Honest limitation over a fake number.
  Slicing a metric by region would need per-record data for that metric.
- **Version numbers, not hashes.** A monotonic integer is what the brief's
  "Your version / Latest version" UI needs and is trivial to reason about.
- **No automated tests committed.** Logic was verified with throwaway Node
  scripts (fault matrix, config matrix, storage/restore/conflict, boot
  paths) run during development. A committed Vitest suite is the obvious next
  step; see `SELF_REVIEW.md`.
- **Single JS chunk (~670 KB).** Recharts dominates. Acceptable for an
  assessment; `manualChunks` or lazy-loading charts would fix it.
