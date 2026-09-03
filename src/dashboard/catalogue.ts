import type { LucideIcon } from "lucide-react";
import { BarChart3, LineChart, Table2, Gauge } from "lucide-react";
import type { DataSource, WidgetType } from "./types";

export interface CatalogueEntry {
  type: WidgetType;
  label: string;
  description: string;
  icon: LucideIcon;
  defaultTitle: string;
  defaultDataSource: DataSource;
  /** Data sources selectable for this widget type in the editor. */
  dataSources: { value: DataSource; label: string }[];
}

export const widgetCatalogue: CatalogueEntry[] = [
  {
    type: "metric",
    label: "Metric",
    description: "A single KPI number",
    icon: Gauge,
    defaultTitle: "New Metric",
    defaultDataSource: "orders",
    dataSources: [
      { value: "orders", label: "Total Orders" },
      { value: "revenue", label: "Total Revenue" },
    ],
  },
  {
    type: "table",
    label: "Table",
    description: "Tabular list of records",
    icon: Table2,
    defaultTitle: "New Table",
    defaultDataSource: "recentOrders",
    dataSources: [{ value: "recentOrders", label: "Recent Orders" }],
  },
  {
    type: "barChart",
    label: "Bar Chart",
    description: "Compare values across categories",
    icon: BarChart3,
    defaultTitle: "New Bar Chart",
    defaultDataSource: "ordersByRegion",
    dataSources: [
      { value: "ordersByRegion", label: "Orders by Region" },
    ],
  },
  {
    type: "lineChart",
    label: "Line Chart",
    description: "Trend over time",
    icon: LineChart,
    defaultTitle: "New Line Chart",
    defaultDataSource: "revenueTrend",
    dataSources: [{ value: "revenueTrend", label: "Revenue Trend" }],
  },
];

export function getCatalogueEntry(type: WidgetType): CatalogueEntry {
  const entry = widgetCatalogue.find((e) => e.type === type);
  if (!entry) throw new Error(`No catalogue entry for widget type: ${type}`);
  return entry;
}
