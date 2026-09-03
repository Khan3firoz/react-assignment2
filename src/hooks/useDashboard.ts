import { useCallback, useMemo, useState } from "react";
import type {
  Dashboard,
  DashboardFilters,
  Widget,
  WidgetConfig,
  WidgetType,
} from "@/dashboard/types";
import { createDefaultDashboard } from "@/dashboard/defaultDashboard";
import { getCatalogueEntry } from "@/dashboard/catalogue";
import { dashboardToConfig } from "@/dashboard/adapter";
import type { ValidationResult } from "@/dashboard/validator";
import {
  detectConflict,
  getRevisions,
  loadDashboard,
  restoreRevision as restoreRevisionInStore,
  saveDashboard,
  type ConflictInfo,
  type Revision,
} from "@/services/dashboardStorage";

function makeId() {
  return `w-${Math.random().toString(36).slice(2, 9)}`;
}

/** Read the store once, defensively. Any unexpected throw degrades to a
 *  fresh default dashboard rather than crashing the app. */
function readInitial() {
  try {
    return loadDashboard();
  } catch (err) {
    console.error("loadDashboard threw unexpectedly", err);
    return { status: "empty" as const };
  }
}

export function useDashboard() {
  // Lazy initialisers run once, inside render, so a throw here is catchable
  // by the app-level error boundary.
  const [initialLoad] = useState(readInitial);

  const [dashboard, setDashboard] = useState<Dashboard>(() =>
    initialLoad.status === "ok"
      ? initialLoad.dashboard
      : createDefaultDashboard()
  );
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    initialLoad.status === "ok" ? initialLoad.dashboard.updatedAt : null
  );
  const [revisions, setRevisions] = useState<Revision[]>(() => getRevisions());

  /**
   * The version the editor is currently based on. Starts as whatever was
   * loaded (null if the store was empty). Advances on every successful save
   * and on "Reload Latest". Used for concurrent-edit detection.
   */
  const [baseVersion, setBaseVersion] = useState<number | null>(
    initialLoad.status === "ok" ? initialLoad.version : null
  );

  /** Set only when the *persisted* config is unreadable — surfaced by the UI. */
  const [loadError] = useState<Extract<ValidationResult, { ok: false }> | null>(
    initialLoad.status === "invalid" ? initialLoad.result : null
  );

  /** Non-null while a save is blocked pending the user's conflict decision. */
  const [conflict, setConflict] = useState<ConflictInfo | null>(null);

  const dirty = useMemo(
    () => dashboard.updatedAt !== lastSavedAt,
    [dashboard.updatedAt, lastSavedAt]
  );

  const touch = useCallback(
    (next: Dashboard): Dashboard => ({
      ...next,
      updatedAt: new Date().toISOString(),
    }),
    []
  );

  const addWidget = useCallback(
    (type: WidgetType) => {
      const entry = getCatalogueEntry(type);
      const widget: Widget = {
        id: makeId(),
        type,
        config: {
          title: entry.defaultTitle,
          dataSource: entry.defaultDataSource,
          accent:
            type === "barChart"
              ? "#6366f1"
              : type === "lineChart"
                ? "#10b981"
                : undefined,
        },
      };
      setDashboard((d) => touch({ ...d, widgets: [...d.widgets, widget] }));
    },
    [touch]
  );

  const removeWidget = useCallback(
    (id: string) => {
      setDashboard((d) =>
        touch({ ...d, widgets: d.widgets.filter((w) => w.id !== id) })
      );
    },
    [touch]
  );

  const updateWidgetConfig = useCallback(
    (id: string, config: WidgetConfig) => {
      setDashboard((d) =>
        touch({
          ...d,
          widgets: d.widgets.map((w) => (w.id === id ? { ...w, config } : w)),
        })
      );
    },
    [touch]
  );

  const setFilters = useCallback(
    (filters: Partial<DashboardFilters>) => {
      setDashboard((d) =>
        touch({ ...d, filters: { ...d.filters, ...filters } })
      );
    },
    [touch]
  );

  const resetDashboard = useCallback(() => {
    setDashboard(touch(createDefaultDashboard()));
  }, [touch]);

  /**
   * Save. First checks whether localStorage has moved ahead of our
   * baseVersion (someone else saved). If so, surface the conflict and do
   * NOT write. Otherwise persist a new revision.
   */
  const save = useCallback(() => {
    const c = detectConflict(baseVersion);
    if (c) {
      setConflict(c);
      return;
    }
    const result = saveDashboard(dashboard);
    setLastSavedAt(dashboard.updatedAt);
    setBaseVersion(result.version);
    setRevisions(result.revisions);
  }, [baseVersion, dashboard]);

  /** Discard local edits and load whatever is now in localStorage. */
  const reloadLatest = useCallback(() => {
    const loaded = loadDashboard();
    if (loaded.status === "ok") {
      setDashboard(loaded.dashboard);
      setBaseVersion(loaded.version);
      setLastSavedAt(loaded.dashboard.updatedAt);
      setRevisions(getRevisions());
    }
    setConflict(null);
  }, []);

  const dismissConflict = useCallback(() => setConflict(null), []);

  /**
   * Restore a past revision. Delegates to the store, which appends a NEW
   * revision (later revisions are kept). The editor then reflects the
   * restored state and is based on the new version.
   */
  const restoreRevision = useCallback((version: number) => {
    const result = restoreRevisionInStore(version);
    if (!result) return;
    setDashboard(result.dashboard);
    setLastSavedAt(result.dashboard.updatedAt);
    setBaseVersion(result.version);
    setRevisions(result.revisions);
  }, []);

  return {
    dashboard,
    dirty,
    lastSavedAt,
    baseVersion,
    revisions,
    loadError,
    conflict,
    currentConfig: useMemo(() => dashboardToConfig(dashboard), [dashboard]),
    addWidget,
    removeWidget,
    updateWidgetConfig,
    setFilters,
    resetDashboard,
    save,
    reloadLatest,
    dismissConflict,
    restoreRevision,
  };
}

export type UseDashboardReturn = ReturnType<typeof useDashboard>;
