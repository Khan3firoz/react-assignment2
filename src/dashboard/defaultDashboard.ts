import type { Dashboard } from "./types";

export function createDefaultDashboard(): Dashboard {
  return {
    id: "default",
    name: "Operations Dashboard",
    filters: { region: "all", status: "all" },
    updatedAt: new Date().toISOString(),
    widgets: [
      {
        id: "w-orders",
        type: "metric",
        config: { title: "Orders", dataSource: "orders" },
      },
      {
        id: "w-revenue",
        type: "metric",
        config: { title: "Revenue", dataSource: "revenue" },
      },
      {
        id: "w-region-bar",
        type: "barChart",
        config: {
          title: "Orders by Region",
          dataSource: "ordersByRegion",
          accent: "#6366f1",
        },
      },
      {
        id: "w-revenue-line",
        type: "lineChart",
        config: {
          title: "Revenue Trend",
          dataSource: "revenueTrend",
          accent: "#10b981",
        },
      },
      {
        id: "w-recent",
        type: "table",
        config: { title: "Recent Orders", dataSource: "recentOrders" },
      },
    ],
  };
}
