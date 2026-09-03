import { History, Save, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardHeaderProps {
  title: string;
  dirty: boolean;
  lastSavedAt: string | null;
  baseVersion: number | null;
  revisionCount: number;
  onSave: () => void;
  onOpenRevisions: () => void;
  onOpenShare: () => void;
}

export function DashboardHeader({
  title,
  dirty,
  lastSavedAt,
  baseVersion,
  revisionCount,
  onSave,
  onOpenRevisions,
  onOpenShare,
}: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {baseVersion !== null && (
          <span className="text-xs text-muted-foreground">v{baseVersion}</span>
        )}
        {dirty ? (
          <Badge variant="warning">Unsaved changes</Badge>
        ) : lastSavedAt ? (
          <span className="text-xs text-muted-foreground">
            Saved {new Date(lastSavedAt).toLocaleTimeString()}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onSave} disabled={!dirty}>
          <Save className="h-4 w-4" />
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={onOpenRevisions}>
          <History className="h-4 w-4" />
          Revisions
          {revisionCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {revisionCount}
            </Badge>
          )}
        </Button>
        <Button size="sm" variant="outline" onClick={onOpenShare}>
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>
    </header>
  );
}
