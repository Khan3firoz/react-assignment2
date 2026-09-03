import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { DashboardBuilder } from "@/components/dashboard/DashboardBuilder";

export default function App() {
  return (
    <AppErrorBoundary>
      <DashboardBuilder />
    </AppErrorBoundary>
  );
}
