/**
 * Schema migrations. Each migration takes a validated config at version N and
 * returns a plain object at version N+1 (still to be validated by the caller).
 *
 * Migrations only run for versions in SUPPORTED_SCHEMA_VERSIONS. An unknown
 * version has no migration path and must fail visibly — see validator.ts.
 */

import {
  CURRENT_SCHEMA_VERSION,
  dashboardConfigV1Schema,
  type DashboardConfigV1,
} from "./schema";

const FIELD_MAP: Record<string, string[]> = {
  orders: ["value", "previousValue"],
  revenue: ["value", "previousValue"],
  ordersByRegion: ["points", "series", "xKey"],
  revenueTrend: ["points", "series", "xKey"],
  recentOrders: ["rows", "columns"],
};

/**
 * v1 → v2
 *  - object `filters { region, status }` becomes a `filters[]` array with
 *    explicit operators (only non-"all" values are carried over)
 *  - each widget gains an explicit `binding { dataSource, fields }` and a
 *    `layout` block; `config.*` is flattened onto the widget
 */
function migrateV1toV2(v1: DashboardConfigV1): Record<string, unknown> {
  const filters: Record<string, unknown>[] = [];
  if (v1.filters.region && v1.filters.region !== "all") {
    filters.push({
      id: "region",
      field: "region",
      operator: "eq",
      value: v1.filters.region,
    });
  }
  if (v1.filters.status && v1.filters.status !== "all") {
    filters.push({
      id: "status",
      field: "status",
      operator: "eq",
      value: v1.filters.status,
    });
  }

  const widgets = v1.widgets.map((w, i) => ({
    id: w.id,
    type: w.type,
    title: w.config.title,
    binding: {
      dataSource: w.config.dataSource,
      fields: FIELD_MAP[w.config.dataSource] ?? ["value"],
    },
    layout: {
      x: (i % 3) * 4,
      y: Math.floor(i / 3) * 6,
      w: w.type === "metric" ? 4 : 8,
      h: w.type === "metric" ? 4 : 8,
    },
    ...(w.config.accent ? { accent: w.config.accent } : {}),
  }));

  return {
    schemaVersion: 2,
    id: v1.id,
    name: v1.name,
    filters,
    widgets,
    updatedAt: v1.updatedAt,
  };
}

export interface MigrationStep {
  from: number;
  to: number;
  run: (input: unknown) => Record<string, unknown>;
}

/**
 * Ordered migration chain. To add v2 → v3 later, append a step; the runner
 * applies them in sequence until the config reaches CURRENT_SCHEMA_VERSION.
 */
export const MIGRATIONS: MigrationStep[] = [
  {
    from: 1,
    to: 2,
    run: (input) => {
      const parsed = dashboardConfigV1Schema.safeParse(input);
      if (!parsed.success) {
        throw new MigrationError(
          1,
          2,
          "source config is not a valid v1 dashboard",
          parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
        );
      }
      return migrateV1toV2(parsed.data);
    },
  },
];

export class MigrationError extends Error {
  from: number;
  to: number;
  details: string[];
  constructor(from: number, to: number, message: string, details: string[] = []) {
    super(message);
    this.name = "MigrationError";
    this.from = from;
    this.to = to;
    this.details = details;
  }
}

/**
 * Walk `input` (already known to declare `fromVersion`) up to the current
 * version. Returns the migrated plain object (NOT yet schema-validated).
 * Throws MigrationError if a step is missing or a step rejects its input.
 */
export function runMigrations(
  input: unknown,
  fromVersion: number
): Record<string, unknown> {
  let current: unknown = input;
  let version = fromVersion;

  while (version < CURRENT_SCHEMA_VERSION) {
    const step = MIGRATIONS.find((m) => m.from === version);
    if (!step) {
      throw new MigrationError(
        version,
        CURRENT_SCHEMA_VERSION,
        `no migration path from schemaVersion ${version}`
      );
    }
    current = step.run(current);
    version = step.to;
  }

  return current as Record<string, unknown>;
}
