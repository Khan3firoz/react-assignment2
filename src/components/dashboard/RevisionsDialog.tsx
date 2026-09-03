import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, RotateCcw } from "lucide-react";
import type { Revision } from "@/services/dashboardStorage";

interface RevisionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revisions: Revision[];
  currentVersion: number | null;
  onRestore: (version: number) => void;
}

export function RevisionsDialog({
  open,
  onOpenChange,
  revisions,
  currentVersion,
  onRestore,
}: RevisionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Revision History
          </DialogTitle>
        </DialogHeader>

        {revisions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No revisions yet. Each <span className="font-medium">Save</span>{" "}
            records a revision here.
          </p>
        ) : (
          <ul className="max-h-80 divide-y overflow-y-auto">
            {revisions.map((rev) => (
              <li
                key={rev.version}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    Revision {rev.version}
                    {rev.version === currentVersion && (
                      <Badge variant="secondary">current</Badge>
                    )}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {new Date(rev.savedAt).toLocaleString()} · {rev.description}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={rev.version === currentVersion}
                  onClick={() => {
                    onRestore(rev.version);
                    onOpenChange(false);
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore
                </Button>
              </li>
            ))}
          </ul>
        )}

        <p className="pt-1 text-[11px] text-muted-foreground">
          Restoring a revision creates a new revision — later revisions are
          never deleted.
        </p>
      </DialogContent>
    </Dialog>
  );
}
