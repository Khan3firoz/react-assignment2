/**
 * Hostile / malformed dashboard configurations used by the developer
 * "Hostile Configurations" panel. Each entry is fed verbatim to
 * validateDashboardConfig(); the app must never crash and must show the
 * "Invalid Dashboard Configuration" surface with real details.
 *
 * `expected` documents the classification we expect the validator to reach.
 */

export interface HostileConfig {
  id: string;
  label: string;
  /** What we expect validateDashboardConfig() to return. */
  expected: "invalid" | "unsupported-version" | "migration-failed";
  note: string;
  config: unknown;
}

/** A structurally-valid v2 widget we can mutate per-case. */
function goodWidget(overrides: Record<string, unknown> = {}) {
  return {
    id: "w-1",
    type: "metric",
    title: "Orders",
    binding: { dataSource: "orders", fields: ["value", "previousValue"] },
    layout: { x: 0, y: 0, w: 4, h: 4 },
    ...overrides,
  };
}

function goodBase(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 2,
    id: "operations",
    name: "Operations Dashboard",
    filters: [],
    widgets: [goodWidget()],
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export const HOSTILE_CONFIGS: HostileConfig[] = [
  {
    id: "empty-object",
    label: "1. Empty object",
    expected: "invalid",
    note: "No schemaVersion, no fields at all.",
    config: {},
  },
  {
    id: "missing-schema-version",
    label: "2. Missing schemaVersion",
    expected: "invalid",
    note: "Otherwise-plausible config with no schemaVersion key.",
    config: { id: "operations", name: "Ops", filters: [], widgets: [] },
  },
  {
    id: "schema-version-999",
    label: "3. schemaVersion 999",
    expected: "unsupported-version",
    note: "Unknown future version — must fail visibly, no migration.",
    config: goodBase({ schemaVersion: 999 }),
  },
  {
    id: "widgets-null",
    label: "4. widgets: null",
    expected: "invalid",
    note: "widgets must be an array.",
    config: goodBase({ widgets: null }),
  },
  {
    id: "widgets-string",
    label: "5. widgets: string",
    expected: "invalid",
    note: "widgets is a string, not an array.",
    config: goodBase({ widgets: "all of them" }),
  },
  {
    id: "null-widget",
    label: "6. null widget in array",
    expected: "invalid",
    note: "widgets: [null] — element is not an object.",
    config: goodBase({ widgets: [null] }),
  },
  {
    id: "unknown-widget-type",
    label: "7. Unknown widget type",
    expected: "invalid",
    note: "type: 'pieChart3D' is not in the widget enum.",
    config: goodBase({ widgets: [goodWidget({ type: "pieChart3D" })] }),
  },
  {
    id: "duplicate-widget-ids",
    label: "8. Duplicate widget IDs",
    expected: "invalid",
    note: "Two widgets share id 'w-1'.",
    config: goodBase({
      widgets: [goodWidget({ id: "w-1" }), goodWidget({ id: "w-1", title: "Revenue" })],
    }),
  },
  {
    id: "missing-binding",
    label: "9. Missing binding",
    expected: "invalid",
    note: "Widget has no binding object.",
    config: goodBase({
      widgets: [
        { id: "w-1", type: "metric", title: "Orders", layout: { x: 0, y: 0, w: 4, h: 4 } },
      ],
    }),
  },
  {
    id: "missing-field",
    label: "10. Missing field in binding",
    expected: "invalid",
    note: "binding.fields is an empty array.",
    config: goodBase({
      widgets: [goodWidget({ binding: { dataSource: "orders", fields: [] } })],
    }),
  },
  {
    id: "wrong-field-type",
    label: "11. Wrong field type",
    expected: "invalid",
    note: "binding.fields contains a number.",
    config: goodBase({
      widgets: [goodWidget({ binding: { dataSource: "orders", fields: [42] } })],
    }),
  },
  {
    id: "invalid-filter",
    label: "12. Invalid filter",
    expected: "invalid",
    note: "operator 'between' is not supported and value shape is wrong.",
    config: goodBase({
      filters: [{ id: "f1", field: "amount", operator: "between", value: null }],
    }),
  },
  {
    id: "negative-layout",
    label: "13. Negative layout",
    expected: "invalid",
    note: "layout.x is -5.",
    config: goodBase({
      widgets: [goodWidget({ layout: { x: -5, y: 0, w: 4, h: 4 } })],
    }),
  },
  {
    id: "huge-layout",
    label: "14. Huge layout",
    expected: "invalid",
    note: "layout.w is 100000, well past the grid bound.",
    config: goodBase({
      widgets: [goodWidget({ layout: { x: 0, y: 0, w: 100000, h: 4 } })],
    }),
  },
  {
    id: "malicious-html-title",
    label: "15. Malicious HTML title",
    expected: "invalid",
    note: "title contains a <script> tag — rejected, not sanitised.",
    config: goodBase({
      widgets: [
        goodWidget({ title: "<script>alert('xss')</script>" }),
      ],
    }),
  },
  {
    id: "unknown-data-source",
    label: "16. Unknown data source",
    expected: "invalid",
    note: "binding.dataSource 'stonks' is not a known source.",
    config: goodBase({
      widgets: [
        goodWidget({ binding: { dataSource: "stonks", fields: ["value"] } }),
      ],
    }),
  },
];

/** A legit v1 config, to prove the migration path works end-to-end. */
export const LEGACY_V1_CONFIG = {
  schemaVersion: 1,
  id: "operations",
  name: "Operations Dashboard",
  filters: { region: "North", status: "all" },
  updatedAt: new Date().toISOString(),
  widgets: [
    {
      id: "w-orders",
      type: "metric",
      config: { title: "Orders", dataSource: "orders" },
    },
    {
      id: "w-region",
      type: "barChart",
      config: { title: "Orders by Region", dataSource: "ordersByRegion", accent: "#6366f1" },
    },
  ],
};
