import type { DashboardFilters, Widget } from "@/dashboard/types";

/** Props every widget component in the registry receives. */
export interface WidgetProps {
  widget: Widget;
  filters: DashboardFilters;
  onEdit: () => void;
  onDelete: () => void;
}
