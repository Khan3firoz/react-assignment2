import type { ComponentType } from "react";
import type { WidgetType } from "@/dashboard/types";
import type { WidgetProps } from "./types";
import { MetricWidget } from "./MetricWidget";
import { TableWidget } from "./TableWidget";
import { BarChartWidget } from "./BarChartWidget";
import { LineChartWidget } from "./LineChartWidget";

export const widgetRegistry: Record<WidgetType, ComponentType<WidgetProps>> = {
  metric: MetricWidget,
  table: TableWidget,
  barChart: BarChartWidget,
  lineChart: LineChartWidget,
};
