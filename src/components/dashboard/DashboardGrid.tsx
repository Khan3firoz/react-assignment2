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

/** Widgets that should span the full grid width. */
const FULL_WIDTH_TYPES = new Set(["table"]);

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
    <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {widgets.map((widget) => (
        <div
          key={widget.id}
          className={cn(
            widget.type === "metric" ? "sm:col-span-1" : "sm:col-span-2",
            FULL_WIDTH_TYPES.has(widget.type) && "lg:col-span-3"
          )}
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
