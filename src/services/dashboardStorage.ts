/**
 * localStorage persistence + revision history for the dashboard.
 *
 * Storage model
 * -------------
 *   operations-dashboard:current    → { version, config }   (latest saved)
 *   operations-dashboard:revisions  → Revision[]             (newest first)
 *
 * `version` is a monotonically increasing integer. It never decreases, even
 * on restore: restoring an old revision appends a NEW revision with the next
 * version number, so later revisions are preserved (v1..v5, v6 ← restored v2).
 *
 * Every config is stored in the versioned v2 schema format and re-validated
 * on read via validateDashboardConfig(). A stored blob that fails validation
 * is reported — never silently repaired.
 */

import type { Dashboard } from "@/dashboard/types";
import type { DashboardConfig } from "@/dashboard/schema";
import { configToDashboard, dashboardToConfig } from "@/dashboard/adapter";
import {
  validateDashboardConfig,
  type ValidationResult,
} from "@/dashboard/validator";

const CURRENT_KEY = "operations-dashboard:current";
const REVISIONS_KEY = "operations-dashboard:revisions";
const MAX_REVISIONS = 50;

export interface Revision {
  /** Monotonic version number: 1, 2, 3, … */
  version: number;
  /** ISO timestamp of the save. */
  savedAt: string;
  /** Human-readable summary of what changed in this save. */
  description: string;
  config: DashboardConfig;
}

interface StoredCurrent {
  version: number;
  config: DashboardConfig;
}

/* ------------------------------------------------------------------ *
 * Low-level helpers
 * ------------------------------------------------------------------ */

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to write ${key}`, err);
  }
}

function readRevisionsRaw(): Revision[] {
  const arr = readJSON<unknown>(REVISIONS_KEY);
  if (!Array.isArray(arr)) return [];
  return arr.filter(
    (r): r is Revision =>
      !!r &&
      typeof (r as Revision).version === "number" &&
      typeof (r as Revision).savedAt === "string" &&
      validateDashboardConfig((r as Revision).config).ok
  );
}

/** The highest version number ever used (0 if none). */
function highestVersion(): number {
  const current = readJSON<StoredCurrent>(CURRENT_KEY);
  const revs = readRevisionsRaw();
  return Math.max(
    current?.version ?? 0,
    ...revs.map((r) => r.version),
    0
  );
}

/* ------------------------------------------------------------------ *
 * Change description
 * ------------------------------------------------------------------ */

function describeChange(
  prev: DashboardConfig | null,
  next: DashboardConfig
): string {
  if (!prev) return "Initial save";

  const parts: string[] = [];
  const prevIds = new Set(prev.widgets.map((w) => w.id));
  const nextIds = new Set(next.widgets.map((w) => w.id));

  const added = [...nextIds].filter((id) => !prevIds.has(id)).length;
  const removed = [...prevIds].filter((id) => !nextIds.has(id)).length;
  if (added) parts.push(`+${added} widget${added > 1 ? "s" : ""}`);
  if (removed) parts.push(`−${removed} widget${removed > 1 ? "s" : ""}`);

  const edited = next.widgets.filter((w) => {
    const before = prev.widgets.find((p) => p.id === w.id);
    return before && JSON.stringify(before) !== JSON.stringify(w);
  }).length;
  if (edited) parts.push(`${edited} widget${edited > 1 ? "s" : ""} edited`);

  if (JSON.stringify(prev.filters) !== JSON.stringify(next.filters)) {
    parts.push("filters changed");
  }
  if (prev.name !== next.name) parts.push("renamed");

  return parts.length ? parts.join(", ") : "No structural change";
}

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */

export interface SaveResult {
  version: number;
  config: DashboardConfig;
  revisions: Revision[];
}

/**
 * Persist the dashboard as a new revision. Returns the new version number and
 * the updated revision list. `description` overrides the auto-generated one
 * (used by restoreRevision).
 */
export function saveDashboard(
  dashboard: Dashboard,
  description?: string
): SaveResult {
  const config = dashboardToConfig(dashboard);
  const prev = readJSON<StoredCurrent>(CURRENT_KEY)?.config ?? null;
  const version = highestVersion() + 1;

  const revision: Revision = {
    version,
    savedAt: new Date().toISOString(),
    description: description ?? describeChange(prev, config),
    config,
  };

  const revisions = [revision, ...readRevisionsRaw()].slice(0, MAX_REVISIONS);

  writeJSON(CURRENT_KEY, { version, config } satisfies StoredCurrent);
  writeJSON(REVISIONS_KEY, revisions);

  return { version, config, revisions };
}

export type LoadResult =
  | { status: "empty" }
  | {
      status: "ok";
      dashboard: Dashboard;
      /** Version the loaded dashboard corresponds to. */
      version: number;
      migratedFrom: number | null;
    }
  | { status: "invalid"; result: Extract<ValidationResult, { ok: false }> };

/**
 * Load the current dashboard from localStorage. Returns "empty" if nothing is
 * stored, "invalid" (with details) if the stored blob fails validation, or
 * "ok" with the runtime dashboard and its version.
 */
export function loadDashboard(): LoadResult {
  const stored = readJSON<StoredCurrent>(CURRENT_KEY);
  if (!stored || typeof stored !== "object" || stored.config == null) {
    // Nothing stored, or a corrupt wrapper.
    if (localStorage.getItem(CURRENT_KEY) == null) return { status: "empty" };
    return {
      status: "invalid",
      result: {
        ok: false,
        kind: "invalid",
        summary: "Stored dashboard wrapper is malformed.",
        issues: [{ path: "(root)", message: "expected { version, config }" }],
        detectedVersion: null,
      },
    };
  }

  const result = validateDashboardConfig(stored.config);
  if (!result.ok) return { status: "invalid", result };

  return {
    status: "ok",
    dashboard: configToDashboard(result.config),
    version: typeof stored.version === "number" ? stored.version : 1,
    migratedFrom: result.migratedFrom,
  };
}

/** All revisions, newest first. */
export function getRevisions(): Revision[] {
  return readRevisionsRaw().sort((a, b) => b.version - a.version);
}

export interface RestoreResult {
  status: "ok";
  dashboard: Dashboard;
  /** The NEW version created by the restore. */
  version: number;
  revisions: Revision[];
}

/**
 * Restore a past revision by version number. This does NOT delete later
 * revisions — it creates a brand-new revision whose contents equal the target
 * revision's config, tagged with a "restored from vN" description.
 *
 *   before: v1 v2 v3 v4 v5
 *   restoreRevision(2)
 *   after:  v1 v2 v3 v4 v5 v6   (v6.config === v2.config)
 */
export function restoreRevision(version: number): RestoreResult | null {
  const target = getRevisions().find((r) => r.version === version);
  if (!target) return null;

  const dashboard = configToDashboard(target.config);
  const saved = saveDashboard(dashboard, `Restored from v${version}`);

  return {
    status: "ok",
    dashboard: configToDashboard(saved.config),
    version: saved.version,
    revisions: saved.revisions,
  };
}

/* ------------------------------------------------------------------ *
 * Concurrent-edit detection
 * ------------------------------------------------------------------ */

export interface ConflictInfo {
  /** Version the editor started from. */
  base: number;
  /** Version currently in localStorage (someone else saved). */
  latest: number;
}

/**
 * Compare the version the editor started from against what's now stored.
 * Returns ConflictInfo if the stored version moved ahead, else null.
 */
export function detectConflict(baseVersion: number | null): ConflictInfo | null {
  if (baseVersion == null) return null;
  const stored = readJSON<StoredCurrent>(CURRENT_KEY);
  const latest = stored?.version ?? 0;
  return latest > baseVersion ? { base: baseVersion, latest } : null;
}

export function clearAll(): void {
  localStorage.removeItem(CURRENT_KEY);
  localStorage.removeItem(REVISIONS_KEY);
}

/* ------------------------------------------------------------------ *
 * Dev helper — simulate a concurrent editor
 * ------------------------------------------------------------------ */

/**
 * Pretend another tab/user just saved: take whatever config is currently
 * stored (or a minimal placeholder) and write it back under the next version
 * number, plus a matching revision. This moves the stored version ahead of
 * any editor still based on the old one, so its next Save hits a conflict.
 * Returns the new stored version, or null if nothing was stored to base it on.
 */
export function simulateExternalSave(): number | null {
  const stored = readJSON<StoredCurrent>(CURRENT_KEY);
  if (!stored?.config) return null;

  const validation = validateDashboardConfig(stored.config);
  if (!validation.ok) return null;

  const version = highestVersion() + 1;
  const config: DashboardConfig = {
    ...validation.config,
    name: validation.config.name,
    updatedAt: new Date().toISOString(),
  };

  const revision: Revision = {
    version,
    savedAt: new Date().toISOString(),
    description: "Saved by another session",
    config,
  };

  writeJSON(CURRENT_KEY, { version, config } satisfies StoredCurrent);
  writeJSON(
    REVISIONS_KEY,
    [revision, ...readRevisionsRaw()].slice(0, MAX_REVISIONS)
  );
  return version;
}
