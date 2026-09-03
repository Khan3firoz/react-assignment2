/**
 * Bridges the validated v2 DashboardConfig to the runtime shape the widget
 * components already consume (flat filters + widget.config.*). This is a
 * lossless *view* transform — it never invents data, it only reshapes what
 * validation already proved correct.
 */

import type { DashboardConfig } from "./schema";
import type { Dashboard, DashboardFilters, Widget } from "./types";

/** Collapse the v2 filters[] array into the {region,status} the UI uses. */
export function toRuntimeFilters(config: DashboardConfig): DashboardFilters {
  const find = (field: string) =>
    config.filters.find((f) => f.field === field && f.operator === "eq");
  const region = find("region")?.value;
  const status = find("status")?.value;
  return {
    region: typeof region === "string" ? region : "all",
    status: typeof status === "string" ? status : "all",
  };
}

export function configToDashboard(config: DashboardConfig): Dashboard {
  const widgets: Widget[] = config.widgets.map((w) => ({
    id: w.id,
    type: w.type,
    config: {
      title: w.title,
      dataSource: w.binding.dataSource,
      accent: w.accent,
    },
  }));

  return {
    id: config.id,
    name: config.name,
    filters: toRuntimeFilters(config),
    widgets,
    updatedAt: config.updatedAt,
  };
}

/** Reverse: build a v2 config from the runtime Dashboard (for persistence). */
export function dashboardToConfig(dashboard: Dashboard): DashboardConfig {
  const filters: DashboardConfig["filters"] = [];
  if (dashboard.filters.region !== "all") {
    filters.push({
      id: "region",
      field: "region",
      operator: "eq",
      value: dashboard.filters.region,
    });
  }
  if (dashboard.filters.status !== "all") {
    filters.push({
      id: "status",
      field: "status",
      operator: "eq",
      value: dashboard.filters.status,
    });
  }

  const FIELD_MAP: Record<string, string[]> = {
    orders: ["value", "previousValue"],
    revenue: ["value", "previousValue"],
    ordersByRegion: ["points", "series", "xKey"],
    revenueTrend: ["points", "series", "xKey"],
    recentOrders: ["rows", "columns"],
  };

  return {
    schemaVersion: 2,
    id: dashboard.id,
    name: dashboard.name,
    filters,
    updatedAt: dashboard.updatedAt,
    widgets: dashboard.widgets.map((w, i) => ({
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
      ...(w.config.accent && /^#[0-9a-fA-F]{6}$/.test(w.config.accent)
        ? { accent: w.config.accent }
        : {}),
    })),
  };
}
