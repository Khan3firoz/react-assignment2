import { widgetRegistry } from "@/components/widgets/registry";
import { WidgetErrorBoundary } from "@/components/widgets/WidgetErrorBoundary";
import type { DashboardFilters, Widget } from "@/dashboard/types";

interface WidgetRendererProps {
  widget: Widget;
  filters: DashboardFilters;
  onEdit: (widget: Widget) => void;
  onDelete: (id: string) => void;
}

/**
 * Resolves a widget to its component via the registry, renders it, and
 * isolates it behind an Error Boundary so one widget's crash cannot take
 * down its siblings or the dashboard shell.
 */
export function WidgetRenderer({
  widget,
  filters,
  onEdit,
  onDelete,
}: WidgetRendererProps) {
  const Component = widgetRegistry[widget.type];

  if (!Component) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Unknown widget type: {widget.type}
      </div>
    );
  }

  return (
    <WidgetErrorBoundary
      widgetTitle={widget.config.title}
      resetKey={JSON.stringify(widget.config)}
    >
      <Component
        widget={widget}
        filters={filters}
        onEdit={() => onEdit(widget)}
        onDelete={() => onDelete(widget.id)}
      />
    </WidgetErrorBoundary>
  );
}
