import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useWidgetData } from "@/hooks/useWidgetData";
import type { SeriesPayload } from "@/services/schemas";
import { WidgetShell } from "./WidgetShell";
import { WidgetEmpty, WidgetError, WidgetLoading } from "./WidgetStates";
import type { WidgetProps } from "./types";

export function BarChartWidget({
  widget,
  filters,
  onEdit,
  onDelete,
}: WidgetProps) {
  const { state, retry } = useWidgetData<SeriesPayload>(
    widget.config.dataSource,
    filters
  );
  const accent = widget.config.accent ?? "#6366f1";

  return (
    <WidgetShell title={widget.config.title} onEdit={onEdit} onDelete={onDelete}>
      {state.status === "loading" && <WidgetLoading />}
      {state.status === "empty" && <WidgetEmpty />}
      {state.status === "error" && (
        <WidgetError reason={state.reason} onRetry={retry} />
      )}
      {state.status === "success" && (
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={state.data.points}
              margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey={state.data.xKey}
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border))",
                }}
              />
              {state.data.series.map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  fill={accent}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </WidgetShell>
  );
}
