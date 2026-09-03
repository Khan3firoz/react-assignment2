import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { widgetCatalogue } from "@/dashboard/catalogue";
import type { WidgetType } from "@/dashboard/types";
import { FailureSimulatorPanel } from "./FailureSimulatorPanel";
import { HostileConfigPanel } from "./HostileConfigPanel";
import { ConcurrentEditDevPanel } from "./ConcurrentEditDevPanel";

interface WidgetCatalogueProps {
  onAdd: (type: WidgetType) => void;
  onLoadConfig: (config: unknown, label: string) => void;
}

export function WidgetCatalogue({ onAdd, onLoadConfig }: WidgetCatalogueProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r bg-muted/30">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Widget Catalogue</h2>
        <p className="text-xs text-muted-foreground">Click to add to dashboard</p>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden p-3">
        {widgetCatalogue.map((entry) => {
          const Icon = entry.icon;
          return (
            <Button
              key={entry.type}
              variant="outline"
              className="h-auto w-full justify-start gap-3 px-3 py-2.5 text-left"
              onClick={() => onAdd(entry.type)}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background">
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="flex items-center gap-1 text-sm font-medium">
                  <Plus className="h-3 w-3 shrink-0" />
                  {entry.label}
                </span>
                <span className="whitespace-normal text-xs font-normal text-muted-foreground">
                  {entry.description}
                </span>
              </span>
            </Button>
          );
        })}
      </div>
      <FailureSimulatorPanel />
      <ConcurrentEditDevPanel />
      <HostileConfigPanel onLoadConfig={onLoadConfig} />
    </aside>
  );
}
