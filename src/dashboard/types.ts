import { z } from "zod";

export const widgetTypeSchema = z.enum([
  "metric",
  "table",
  "barChart",
  "lineChart",
]);
export type WidgetType = z.infer<typeof widgetTypeSchema>;

/** Which mock dataset a widget reads from. */
export const dataSourceSchema = z.enum([
  "orders",
  "revenue",
  "ordersByRegion",
  "revenueTrend",
  "recentOrders",
]);
export type DataSource = z.infer<typeof dataSourceSchema>;

export const widgetConfigSchema = z.object({
  /** Display title shown in the widget header. */
  title: z.string().min(1, "Title is required"),
  /** Data source key into the mock data service. */
  dataSource: dataSourceSchema,
  /** Optional accent color for charts / metric. */
  accent: z.string().optional(),
});
export type WidgetConfig = z.infer<typeof widgetConfigSchema>;

export const widgetSchema = z.object({
  id: z.string(),
  type: widgetTypeSchema,
  config: widgetConfigSchema,
});
export type Widget = z.infer<typeof widgetSchema>;

export const dashboardFiltersSchema = z.object({
  region: z.string(),
  status: z.string(),
});
export type DashboardFilters = z.infer<typeof dashboardFiltersSchema>;

export const dashboardSchema = z.object({
  id: z.string(),
  name: z.string(),
  widgets: z.array(widgetSchema),
  filters: dashboardFiltersSchema,
  updatedAt: z.string(),
});
export type Dashboard = z.infer<typeof dashboardSchema>;
