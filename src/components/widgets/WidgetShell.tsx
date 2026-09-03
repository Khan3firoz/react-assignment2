import type { ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WidgetShellProps {
  title: string;
  onEdit: () => void;
  onDelete: () => void;
  children: ReactNode;
  className?: string;
}

/** Common frame for every widget: header, edit/delete controls, body slot. */
export function WidgetShell({
  title,
  onEdit,
  onDelete,
  children,
  className,
}: WidgetShellProps) {
  return (
    <Card className={cn("group flex h-full flex-col", className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="truncate">{title}</CardTitle>
        {/* Controls fade in on hover, but stay visible whenever one is
            focused so keyboard and touch users can reach them. */}
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onEdit}
            aria-label={`Edit widget: ${title}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
            aria-label={`Delete widget: ${title}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1">{children}</CardContent>
    </Card>
  );
}
