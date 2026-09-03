import { useState } from "react";
import { ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HOSTILE_CONFIGS, LEGACY_V1_CONFIG } from "@/mock/hostileConfigs";
import {
  validateDashboardConfig,
  type ValidationResult,
} from "@/dashboard/validator";

interface HostileConfigPanelProps {
  /** Push a raw config blob into the main view for rendering / validation. */
  onLoadConfig: (config: unknown, label: string) => void;
}

/**
 * Developer panel: pick a hostile / malformed config and load it into the
 * dashboard view. The app must never crash — invalid configs land on the
 * "Invalid Dashboard Configuration" surface.
 */
export function HostileConfigPanel({ onLoadConfig }: HostileConfigPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t bg-muted/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <ShieldAlert className="h-4 w-4" />
          Hostile Configurations
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronUp className="h-4 w-4" />
        )}
      </button>

      {open && (
        <div className="space-y-1.5 px-3 pb-3">
          <button
            type="button"
            onClick={() =>
              onLoadConfig(LEGACY_V1_CONFIG, "Legacy v1 (migrates to v2)")
            }
            className="w-full rounded-md border border-emerald-300 bg-emerald-50/60 px-2.5 py-2 text-left text-xs hover:bg-emerald-50"
          >
            <span className="font-medium">✓ Legacy v1 config</span>
            <span className="block text-[11px] text-muted-foreground">
              Valid — exercises the v1 → v2 migration path.
            </span>
          </button>

          {HOSTILE_CONFIGS.map((hc) => {
            const outcome: ValidationResult = validateDashboardConfig(hc.config);
            const classified = outcome.ok ? "ok" : outcome.kind;
            const matches = outcome.ok
              ? false
              : outcome.kind === hc.expected;
            return (
              <button
                key={hc.id}
                type="button"
                onClick={() => onLoadConfig(hc.config, hc.label)}
                className="w-full rounded-md border px-2.5 py-2 text-left text-xs hover:bg-background"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-medium">{hc.label}</span>
                  <Badge
                    variant={matches ? "warning" : "destructive"}
                    className="shrink-0"
                  >
                    {classified}
                  </Badge>
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {hc.note}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
