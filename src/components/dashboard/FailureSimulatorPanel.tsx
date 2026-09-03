import { useState } from "react";
import { Bug, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useFaultConfig } from "@/hooks/useFaultConfig";

/**
 * Developer-only panel that drives the global fault-injection config.
 * Changing anything here causes every widget to re-fetch and re-validate.
 */
export function FailureSimulatorPanel() {
  const { config, update, reset } = useFaultConfig();
  const [open, setOpen] = useState(true);

  const toggles: {
    key: "forceTimeout" | "removeField" | "wrongDataType" | "emptyResponse";
    label: string;
    hint: string;
  }[] = [
    {
      key: "forceTimeout",
      label: "Force Timeout",
      hint: "Every request exceeds the timeout ceiling",
    },
    {
      key: "removeField",
      label: "Remove Field",
      hint: "Drop the primary field from the payload",
    },
    {
      key: "wrongDataType",
      label: "Wrong Data Type",
      hint: "Return a string where a number is expected",
    },
    {
      key: "emptyResponse",
      label: "Empty Response",
      hint: "Valid shape, but no rows / points",
    },
  ];

  return (
    <div className="border-t bg-muted/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Bug className="h-4 w-4" />
          Failure Simulator
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronUp className="h-4 w-4" />
        )}
      </button>

      {open && (
        <div className="space-y-4 px-4 pb-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="sim-delay" className="text-xs">
                API Delay
              </Label>
              <span className="font-mono text-xs text-muted-foreground">
                {config.delayMs} ms
              </span>
            </div>
            <Slider
              id="sim-delay"
              aria-label="API delay in milliseconds"
              min={0}
              max={5000}
              step={100}
              value={config.delayMs}
              onValueChange={(delayMs) => update({ delayMs })}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="sim-rate" className="text-xs">
                Failure Rate
              </Label>
              <span className="font-mono text-xs text-muted-foreground">
                {config.failureRatePct}%
              </span>
            </div>
            <Slider
              id="sim-rate"
              aria-label="Failure rate percentage"
              min={0}
              max={100}
              step={5}
              value={config.failureRatePct}
              onValueChange={(failureRatePct) => update({ failureRatePct })}
            />
          </div>

          <Separator />

          <div className="space-y-2.5">
            {toggles.map((t) => (
              <div key={t.key} className="flex items-start justify-between gap-3">
                <div className="flex flex-col">
                  <Label htmlFor={`sim-${t.key}`} className="text-xs">
                    {t.label}
                  </Label>
                  <span className="text-[11px] leading-tight text-muted-foreground">
                    {t.hint}
                  </span>
                </div>
                <Switch
                  id={`sim-${t.key}`}
                  checked={config[t.key]}
                  onCheckedChange={(v) => update({ [t.key]: v })}
                />
              </div>
            ))}
          </div>

          <Separator />

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={reset}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}
