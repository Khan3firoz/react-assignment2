import { SlidersHorizontal } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { regions, statuses } from "@/mock/data";
import type { DashboardFilters as Filters } from "@/dashboard/types";

interface DashboardFiltersProps {
  filters: Filters;
  onChange: (filters: Partial<Filters>) => void;
}

export function DashboardFilters({ filters, onChange }: DashboardFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-b bg-muted/20 px-6 py-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="filter-region" className="text-xs text-muted-foreground">
          Region
        </Label>
        <Select
          id="filter-region"
          className="h-8 w-32"
          value={filters.region}
          onValueChange={(region) => onChange({ region })}
          options={[
            { label: "All", value: "all" },
            ...regions.map((r) => ({ label: r, value: r })),
          ]}
        />
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="filter-status" className="text-xs text-muted-foreground">
          Status
        </Label>
        <Select
          id="filter-status"
          className="h-8 w-32"
          value={filters.status}
          onValueChange={(status) => onChange({ status })}
          options={[
            { label: "All", value: "all" },
            ...statuses.map((s) => ({ label: s, value: s })),
          ]}
        />
      </div>
    </div>
  );
}
