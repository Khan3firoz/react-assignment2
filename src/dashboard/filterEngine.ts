/**
 * Centralized dashboard-filter logic. Every widget's data passes through
 * applyFilters() exactly once (in useWidgetData) — no widget re-implements
 * region/status filtering itself.
 *
 * The engine understands the *validated* payload shapes:
 *   - metric  : a single aggregate; region/status can't meaningfully slice it,
 *               so it is passed through untouched (documented, not silent).
 *   - series  : { points[] } — points are filtered by matching x-axis /
 *               region keys where present.
 *   - table   : { rows[] } — rows filtered on their region / status fields.
 */

import type { DashboardFilters } from "./types";
import type {
  MetricPayload,
  SeriesPayload,
  TablePayload,
} from "@/services/schemas";

export type FilterablePayload = MetricPayload | SeriesPayload | TablePayload;

function isTable(p: FilterablePayload): p is TablePayload {
  return "rows" in p && Array.isArray((p as TablePayload).rows);
}

function isSeries(p: FilterablePayload): p is SeriesPayload {
  return "points" in p && Array.isArray((p as SeriesPayload).points);
}

/** True when no filter is narrowing the result. */
export function filtersAreEmpty(filters: DashboardFilters): boolean {
  return filters.region === "all" && filters.status === "all";
}

function rowMatches(
  row: Record<string, unknown>,
  filters: DashboardFilters
): boolean {
  const regionOk =
    filters.region === "all" ||
    String(row.region ?? "") === filters.region;
  const statusOk =
    filters.status === "all" ||
    String(row.status ?? "") === filters.status;
  return regionOk && statusOk;
}

/**
 * Apply the dashboard filters to a validated payload. Pure — returns a new
 * payload, never mutates the input. Shape is preserved so downstream widgets
 * and the empty-state check keep working unchanged.
 */
export function applyFilters<T extends FilterablePayload>(
  payload: T,
  filters: DashboardFilters
): T {
  if (filtersAreEmpty(filters)) return payload;

  if (isTable(payload)) {
    return {
      ...payload,
      rows: payload.rows.filter((r) =>
        rowMatches(r as unknown as Record<string, unknown>, filters)
      ),
    };
  }

  if (isSeries(payload)) {
    // Only the region filter maps onto a category series here; status has no
    // dimension in the series data, so it does not narrow it.
    if (filters.region === "all") return payload;
    return {
      ...payload,
      points: payload.points.filter((pt) => {
        const key = pt[payload.xKey];
        // Keep the point if its x value isn't a region at all (e.g. a month
        // trend), otherwise require an exact region match.
        const REGIONS = ["North", "South", "East", "West"];
        if (typeof key === "string" && REGIONS.includes(key)) {
          return key === filters.region;
        }
        return true;
      }),
    };
  }

  // Metric: no per-dimension slice available. Passed through by design.
  return payload;
}
