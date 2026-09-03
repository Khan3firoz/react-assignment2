import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { ConflictInfo } from "@/services/dashboardStorage";

interface ConflictDialogProps {
  conflict: ConflictInfo | null;
  onReloadLatest: () => void;
  onCancel: () => void;
}

/**
 * Shown when Save detects that localStorage moved ahead of the version the
 * editor started from. The save is blocked — the newer revision is never
 * silently overwritten.
 */
export function ConflictDialog({
  conflict,
  onReloadLatest,
  onCancel,
}: ConflictDialogProps) {
  return (
    <Dialog open={conflict !== null} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent onClose={onCancel} className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            ⚠ Dashboard Changed
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          This dashboard was modified elsewhere.
        </p>

        {conflict && (
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your version:</span>
              <span className="font-mono font-medium">{conflict.base}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Latest version:</span>
              <span className="font-mono font-medium">{conflict.latest}</span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onReloadLatest}>Reload Latest</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
