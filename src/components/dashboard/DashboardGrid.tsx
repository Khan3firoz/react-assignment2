import { LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardFilters, Widget } from "@/dashboard/types";
import { WidgetRenderer } from "./WidgetRenderer";

interface DashboardGridProps {
  widgets: Widget[];
  filters: DashboardFilters;
  onEditWidget: (widget: Widget) => void;
  onDeleteWidget: (id: string) => void;
}

/**
 * Grid layout: a 2-column grid on md+ screens. Metric widgets take one
 * column; every other widget spans the full width. This keeps the board
 * filling the available width instead of leaving a dead gutter on the right.
 */
export function DashboardGrid({
  widgets,
  filters,
  onEditWidget,
  onDeleteWidget,
}: DashboardGridProps) {
  if (widgets.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
        <LayoutDashboard className="h-10 w-10" />
        <p className="text-sm font-medium">Your dashboard is empty</p>
        <p className="text-xs">Add widgets from the catalogue on the left.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {widgets.map((widget) => (
        <div
          key={widget.id}
          className={cn(widget.type !== "metric" && "md:col-span-2")}
        >
          <WidgetRenderer
            widget={widget}
            filters={filters}
            onEdit={onEditWidget}
            onDelete={onDeleteWidget}
          />
        </div>
      ))}
    </div>
  );
}
