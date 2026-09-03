import { TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrencyINR, formatNumber } from "@/lib/utils";
import { useWidgetData } from "@/hooks/useWidgetData";
import type { MetricPayload } from "@/services/schemas";
import { WidgetShell } from "./WidgetShell";
import { WidgetEmpty, WidgetError, WidgetLoading } from "./WidgetStates";
import type { WidgetProps } from "./types";

export function MetricWidget({ widget, filters, onEdit, onDelete }: WidgetProps) {
  const { state, retry } = useWidgetData<MetricPayload>(
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
      {state.status === "success" && <MetricValue payload={state.data} />}
    </WidgetShell>
  );
}

function MetricValue({ payload }: { payload: MetricPayload }) {
  const display =
    payload.unit === "currency"
      ? formatCurrencyINR(payload.value)
      : formatNumber(payload.value);

  const delta = payload.value - payload.previousValue;
  const pct =
    payload.previousValue === 0
      ? null
      : (delta / payload.previousValue) * 100;
  const up = delta >= 0;

  return (
    <div className="flex h-full flex-col justify-center">
      <span className="text-3xl font-bold tracking-tight">{display}</span>
      <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        {payload.label}
        {pct !== null && (
          <span
            className={`inline-flex items-center gap-0.5 font-medium ${
              up ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {up ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(pct).toFixed(1)}%
          </span>
        )}
      </span>
    </div>
  );
}
