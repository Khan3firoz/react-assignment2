import { useState } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { simulateExternalSave } from "@/services/dashboardStorage";

/**
 * Dev-only: mimics another tab/user saving the dashboard, bumping the stored
 * version ahead of this editor's baseVersion. The next Save here will then
 * detect the conflict.
 */
export function ConcurrentEditDevPanel() {
  const [note, setNote] = useState<string | null>(null);

  const run = () => {
    const v = simulateExternalSave();
    setNote(
      v
        ? `Another session saved. Stored version is now v${v}. Press Save to see the conflict prompt.`
        : "Nothing is saved yet — press Save once first, then try this."
    );
  };

  return (
    <div className="border-t bg-muted/40 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Users className="h-4 w-4" />
        Concurrent Edit
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Simulates someone else saving this dashboard in another tab.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-2 w-full"
        onClick={run}
      >
        Simulate external save
      </Button>
      {note && (
        <p className="mt-2 text-[11px] text-muted-foreground" role="status">
          {note}
        </p>
      )}
    </div>
  );
}
