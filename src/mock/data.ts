/** Hardcoded mock data. No backend, no API. */

export interface OrderRow {
  id: string;
  customer: string;
  region: string;
  status: "Delivered" | "Pending" | "Cancelled" | "Shipped";
  amount: number;
  date: string;
}

export const regions = ["North", "South", "East", "West"] as const;
export const statuses = [
  "Delivered",
  "Pending",
  "Cancelled",
  "Shipped",
] as const;

export const recentOrders: OrderRow[] = [
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
];

export const ordersByRegion = [
  { region: "North", orders: 4210, revenue: 1_240_000 },
  { region: "South", orders: 3820, revenue: 980_000 },
  { region: "East", orders: 2640, revenue: 720_000 },
  { region: "West", orders: 1780, revenue: 460_000 },
];

export const revenueTrend = [
  { month: "Mar", revenue: 320_000, orders: 1820 },
  { month: "Apr", revenue: 410_000, orders: 2110 },
  { month: "May", revenue: 380_000, orders: 1990 },
  { month: "Jun", revenue: 520_000, orders: 2680 },
  { month: "Jul", revenue: 610_000, orders: 3120 },
  { month: "Aug", revenue: 720_000, orders: 3640 },
];

export const summaryMetrics = {
  orders: 12_450,
  revenue: 2_400_000,
};
