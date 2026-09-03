import { formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useWidgetData } from "@/hooks/useWidgetData";
import type { TablePayload } from "@/services/schemas";
import { WidgetShell } from "./WidgetShell";
import { WidgetEmpty, WidgetError, WidgetLoading } from "./WidgetStates";
import type { WidgetProps } from "./types";

const statusVariant: Record<
  string,
  "success" | "warning" | "destructive" | "secondary"
> = {
  Delivered: "success",
  Pending: "warning",
  Cancelled: "destructive",
  Shipped: "secondary",
};

export function TableWidget({ widget, filters, onEdit, onDelete }: WidgetProps) {
  const { state, retry } = useWidgetData<TablePayload>(
    widget.config.dataSource,
    filters
  );

  return (
    <WidgetShell title={widget.config.title} onEdit={onEdit} onDelete={onDelete}>
      {state.status === "loading" && <WidgetLoading />}
      {state.status === "empty" && <WidgetEmpty />}
      {state.status === "error" && (
        <WidgetError reason={state.reason} onRetry={retry} />
      )}
      {state.status === "success" && <OrdersTable payload={state.data} />}
    </WidgetShell>
  );
}

function OrdersTable({ payload }: { payload: TablePayload }) {
  // Filtering already happened centrally in useWidgetData — rows here are
  // exactly what should be displayed.
  const rows = payload.rows;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            {payload.columns.map((c) => (
              <th key={c.key} className="px-2 py-2 font-medium">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b last:border-0">
              {payload.columns.map((c) => {
                const value = (row as Record<string, string | number>)[c.key];
                return (
                  <td key={c.key} className="px-2 py-2">
                    {c.key === "status" ? (
                      <Badge
                        variant={statusVariant[String(value)] ?? "secondary"}
                      >
                        {String(value)}
                      </Badge>
                    ) : c.key === "amount" ? (
                      `₹${formatNumber(Number(value))}`
                    ) : (
                      String(value)
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
