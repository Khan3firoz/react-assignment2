import { useState, type ReactNode } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import type { Widget } from "@/dashboard/types";
import { configToDashboard } from "@/dashboard/adapter";
import {
  validateDashboardConfig,
  type ValidationResult,
} from "@/dashboard/validator";
import { WidgetCatalogue } from "./WidgetCatalogue";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardFilters } from "./DashboardFilters";
import { DashboardGrid } from "./DashboardGrid";
import { RevisionsDialog } from "./RevisionsDialog";
import { ConflictDialog } from "./ConflictDialog";
import { ShareDialog } from "./ShareDialog";
import { InvalidConfigNotice } from "./InvalidConfigNotice";
import { WidgetEditorDialog } from "@/components/editor/WidgetEditorDialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

/** A config loaded from the Hostile Configurations panel for inspection. */
interface Preview {
  label: string;
  result: ValidationResult;
}

export function DashboardBuilder() {
  const {
    dashboard,
    dirty,
    lastSavedAt,
    baseVersion,
    revisions,
    loadError,
    conflict,
    addWidget,
    removeWidget,
    updateWidgetConfig,
    setFilters,
    save,
    reloadLatest,
    dismissConflict,
    restoreRevision,
  } = useDashboard();

  const [editing, setEditing] = useState<Widget | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [dismissedLoadError, setDismissedLoadError] = useState(false);

  const openEditor = (widget: Widget) => {
    setEditing(widget);
    setEditorOpen(true);
  };

  const loadPreviewConfig = (config: unknown, label: string) => {
    setPreview({ label, result: validateDashboardConfig(config) });
  };

  // What the main panel should render:
  //  - a hostile-config preview (valid → render it; invalid → notice)
  //  - else a persisted-config load error (until dismissed)
  //  - else the live dashboard
  const previewDashboard =
    preview?.result.ok ? configToDashboard(preview.result.config) : null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <DashboardHeader
        title={dashboard.name}
        dirty={dirty}
        lastSavedAt={lastSavedAt}
        baseVersion={baseVersion}
        revisionCount={revisions.length}
        onSave={save}
        onOpenRevisions={() => setRevisionsOpen(true)}
        onOpenShare={() => setShareOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <WidgetCatalogue onAdd={addWidget} onLoadConfig={loadPreviewConfig} />
        <main className="flex flex-1 flex-col overflow-hidden">
          <DashboardFilters filters={dashboard.filters} onChange={setFilters} />

          <div className="flex flex-1 flex-col overflow-y-auto p-6">
            {preview ? (
              <PreviewFrame
                label={preview.label}
                onClose={() => setPreview(null)}
              >
                {previewDashboard ? (
                  <DashboardGrid
                    widgets={previewDashboard.widgets}
                    filters={previewDashboard.filters}
                    onEditWidget={() => {}}
                    onDeleteWidget={() => {}}
                  />
                ) : (
                  <InvalidConfigNotice
                    result={
                      preview.result as Extract<ValidationResult, { ok: false }>
                    }
                  />
                )}
              </PreviewFrame>
            ) : loadError && !dismissedLoadError ? (
              <InvalidConfigNotice
                result={loadError}
                onDismiss={() => setDismissedLoadError(true)}
              />
            ) : (
              <>
                <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
                  Dashboard
                </h2>
                <DashboardGrid
                  widgets={dashboard.widgets}
                  filters={dashboard.filters}
                  onEditWidget={openEditor}
                  onDeleteWidget={removeWidget}
                />
              </>
            )}
          </div>
        </main>
      </div>

      <WidgetEditorDialog
        widget={editing}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSave={updateWidgetConfig}
      />
      <RevisionsDialog
        open={revisionsOpen}
        onOpenChange={setRevisionsOpen}
        revisions={revisions}
        currentVersion={baseVersion}
        onRestore={restoreRevision}
      />
      <ConflictDialog
        conflict={conflict}
        onReloadLatest={reloadLatest}
        onCancel={dismissConflict}
      />
      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} />
    </div>
  );
}

function PreviewFrame({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-4 flex items-center justify-between rounded-md border border-dashed bg-muted/40 px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          Previewing config:{" "}
          <span className="font-mono text-foreground">{label}</span>
        </span>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
          Exit preview
        </Button>
      </div>
      {children}
    </div>
  );
}
