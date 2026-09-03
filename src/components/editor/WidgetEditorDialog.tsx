import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { getCatalogueEntry } from "@/dashboard/catalogue";
import {
  widgetConfigSchema,
  type Widget,
  type WidgetConfig,
} from "@/dashboard/types";

interface WidgetEditorDialogProps {
  widget: Widget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, config: WidgetConfig) => void;
}

const ACCENT_PRESETS = [
  { label: "Indigo", value: "#6366f1" },
  { label: "Emerald", value: "#10b981" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Sky", value: "#0ea5e9" },
];

export function WidgetEditorDialog({
  widget,
  open,
  onOpenChange,
  onSave,
}: WidgetEditorDialogProps) {
  const [title, setTitle] = useState("");
  const [dataSource, setDataSource] = useState("");
  const [accent, setAccent] = useState<string>("#6366f1");
  const [error, setError] = useState<string | null>(null);

  const entry = useMemo(
    () => (widget ? getCatalogueEntry(widget.type) : null),
    [widget]
  );
  const isChart =
    widget?.type === "barChart" || widget?.type === "lineChart";

  useEffect(() => {
    if (!widget) return;
    setTitle(widget.config.title);
    setDataSource(widget.config.dataSource);
    setAccent(widget.config.accent ?? "#6366f1");
    setError(null);
  }, [widget]);

  if (!widget || !entry) return null;

  const handleSave = () => {
    const candidate: WidgetConfig = {
      title: title.trim(),
      dataSource: dataSource as WidgetConfig["dataSource"],
      accent: isChart ? accent : undefined,
    };
    const result = widgetConfigSchema.safeParse(candidate);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid configuration");
      return;
    }
    onSave(widget.id, result.data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Edit {entry.label}</DialogTitle>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="widget-title">Title</Label>
              <Input
                id="widget-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Widget title"
                aria-invalid={error ? true : undefined}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="widget-source">Data source</Label>
              <Select
                id="widget-source"
                value={dataSource}
                onValueChange={setDataSource}
                options={entry.dataSources.map((d) => ({
                  label: d.label,
                  value: d.value,
                }))}
              />
            </div>

            {isChart && (
              <div className="grid gap-2">
                <Label htmlFor="widget-accent">Accent color</Label>
                <Select
                  id="widget-accent"
                  value={accent}
                  onValueChange={setAccent}
                  options={ACCENT_PRESETS}
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
