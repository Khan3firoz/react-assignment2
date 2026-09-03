/**
 * Hardcoded "server" payloads. These are the raw shapes the mock service
 * returns BEFORE any fault injection. Each key is a data source id.
 *
 * The service may mutate a clone of these (drop fields, change types, empty
 * arrays) according to the Failure Simulator config — the objects here are
 * always the pristine source of truth.
 */

export interface RawOrderRow {
  id: string;
  customer: string;
  region: string;
  status: string;
  amount: number;
  date: string;
}

export interface RawMetricPayload {
  /** canonical metric value */
  value: number;
  label: string;
  /** previous-period value, used for delta display */
  previousValue: number;
  unit: "number" | "currency";
}

export interface RawSeriesPoint {
  [key: string]: string | number;
}

export interface RawSeriesPayload {
  xKey: string;
  series: { key: string; label: string }[];
  points: RawSeriesPoint[];
}

export interface RawTablePayload {
  columns: { key: string; label: string }[];
  rows: RawOrderRow[];
}

export type RawPayload =
  | RawMetricPayload
  | RawSeriesPayload
  | RawTablePayload;

export const RAW_DATA_SOURCES = {
  orders: {
    value: 12_450,
    label: "Total Orders",
    previousValue: 11_980,
    unit: "number",
  } satisfies RawMetricPayload,

  revenue: {
    value: 2_400_000,
    label: "Total Revenue",
    previousValue: 2_120_000,
    unit: "currency",
  } satisfies RawMetricPayload,

  ordersByRegion: {
    xKey: "region",
    series: [{ key: "orders", label: "Orders" }],
    points: [
      { region: "North", orders: 4210 },
      { region: "South", orders: 3820 },
      { region: "East", orders: 2640 },
      { region: "West", orders: 1780 },
    ],
  } satisfies RawSeriesPayload,

  revenueTrend: {
    xKey: "month",
    series: [{ key: "revenue", label: "Revenue" }],
    points: [
      { month: "Mar", revenue: 320_000 },
      { month: "Apr", revenue: 410_000 },
      { month: "May", revenue: 380_000 },
      { month: "Jun", revenue: 520_000 },
      { month: "Jul", revenue: 610_000 },
      { month: "Aug", revenue: 720_000 },
    ],
  } satisfies RawSeriesPayload,

  recentOrders: {
    columns: [
      { key: "id", label: "Order" },
      { key: "customer", label: "Customer" },
      { key: "region", label: "Region" },
      { key: "status", label: "Status" },
      { key: "amount", label: "Amount" },
    ],
    rows: [
      { id: "ORD-1001", customer: "Acme Corp", region: "North", status: "Delivered", amount: 45200, date: "2026-08-28" },
      { id: "ORD-1002", customer: "Globex", region: "South", status: "Pending", amount: 12800, date: "2026-08-29" },
      { id: "ORD-1003", customer: "Initech", region: "East", status: "Shipped", amount: 30500, date: "2026-08-29" },
      { id: "ORD-1004", customer: "Umbrella", region: "West", status: "Cancelled", amount: 8700, date: "2026-08-30" },
      { id: "ORD-1005", customer: "Stark Ind.", region: "North", status: "Delivered", amount: 98000, date: "2026-08-31" },
      { id: "ORD-1006", customer: "Wayne Ent.", region: "South", status: "Delivered", amount: 76400, date: "2026-09-01" },
      { id: "ORD-1007", customer: "Hooli", region: "East", status: "Pending", amount: 15300, date: "2026-09-01" },
      { id: "ORD-1008", customer: "Pied Piper", region: "West", status: "Shipped", amount: 22100, date: "2026-09-02" },
      { id: "ORD-1009", customer: "Soylent", region: "North", status: "Delivered", amount: 51200, date: "2026-09-02" },
      { id: "ORD-1010", customer: "Massive Dyn.", region: "South", status: "Cancelled", amount: 6400, date: "2026-09-03" },
    ],
  } satisfies RawTablePayload,
} as const;

export type RawDataSourceId = keyof typeof RAW_DATA_SOURCES;

/** The canonical numeric/primary field name each source exposes, for
 *  "field does not exist" messaging when the simulator removes it. */
export const PRIMARY_FIELD: Record<RawDataSourceId, string> = {
  orders: "value",
  revenue: "value",
  ordersByRegion: "points",
  revenueTrend: "points",
  recentOrders: "rows",
};
