/**
 * The single entry point for turning an untrusted blob into a renderable
 * DashboardConfig — or a structured failure. It NEVER repairs or silently
 * fills in invalid/unknown configurations.
 *
 * Pipeline:
 *   1. Probe schemaVersion.
 *        - not an object / missing / not an int  → invalid (visible)
 *        - version not in SUPPORTED range        → unsupported-version (visible)
 *   2. If older but supported, run migrations to CURRENT_SCHEMA_VERSION.
 *        - a failing migration                   → migration-failed (visible)
 *   3. Validate against the strict current schema.
 *        - any Zod issue                         → invalid (with full issue list)
 *   4. Success → { ok: true, config }
 */

import { z } from "zod";
import {
  CURRENT_SCHEMA_VERSION,
  SUPPORTED_SCHEMA_VERSIONS,
  dashboardConfigSchema,
  versionProbeSchema,
  type DashboardConfig,
} from "./schema";
import { MigrationError, runMigrations } from "./migrations";

export interface ValidationIssue {
  path: string;
  message: string;
}

export type ValidationResult =
  | { ok: true; config: DashboardConfig; migratedFrom: number | null }
  | {
      ok: false;
      kind: "invalid" | "unsupported-version" | "migration-failed";
      /** One-line summary for the banner. */
      summary: string;
      /** Full detail for the "View Details" drawer. */
      issues: ValidationIssue[];
      /** The version we detected, if we could read one. */
      detectedVersion: number | null;
    };

function zodIssues(err: z.ZodError): ValidationIssue[] {
  return err.issues.map((i) => ({
    path: i.path.length ? i.path.join(".") : "(root)",
    message: i.message,
  }));
}

export function validateDashboardConfig(input: unknown): ValidationResult {
  // --- 1. Probe version -------------------------------------------------
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return {
      ok: false,
      kind: "invalid",
      summary: "Configuration is not an object.",
      issues: [
        { path: "(root)", message: `expected object, received ${input === null ? "null" : Array.isArray(input) ? "array" : typeof input}` },
      ],
      detectedVersion: null,
    };
  }

  const probe = versionProbeSchema.safeParse(input);
  if (!probe.success) {
    return {
      ok: false,
      kind: "invalid",
      summary: "Configuration is missing a valid schemaVersion.",
      issues: zodIssues(probe.error),
      detectedVersion: null,
    };
  }

  const detectedVersion = probe.data.schemaVersion;

  if (!SUPPORTED_SCHEMA_VERSIONS.includes(detectedVersion as never)) {
    return {
      ok: false,
      kind: "unsupported-version",
      summary: `Unsupported schemaVersion ${detectedVersion}. This build supports ${SUPPORTED_SCHEMA_VERSIONS.join(", ")}.`,
      issues: [
        {
          path: "schemaVersion",
          message: `version ${detectedVersion} is unknown — no migration path and no schema to validate against`,
        },
      ],
      detectedVersion,
    };
  }

  // --- 2. Migrate if needed ------------------------------------------------
  let candidate: unknown = input;
  let migratedFrom: number | null = null;

  if (detectedVersion < CURRENT_SCHEMA_VERSION) {
    try {
      candidate = runMigrations(input, detectedVersion);
      migratedFrom = detectedVersion;
    } catch (err) {
      if (err instanceof MigrationError) {
        return {
          ok: false,
          kind: "migration-failed",
          summary: `Migration from schemaVersion ${err.from} failed: ${err.message}`,
          issues: err.details.length
            ? err.details.map((d) => ({ path: "migration", message: d }))
            : [{ path: "migration", message: err.message }],
          detectedVersion,
        };
      }
      return {
        ok: false,
        kind: "migration-failed",
        summary: "Migration failed unexpectedly.",
        issues: [{ path: "migration", message: String(err) }],
        detectedVersion,
      };
    }
  }

  // --- 3. Strict validation ---------------------------------------------
  const result = dashboardConfigSchema.safeParse(candidate);
  if (!result.success) {
    return {
      ok: false,
      kind: "invalid",
      summary: migratedFrom
        ? `Migrated config (v${migratedFrom} → v${CURRENT_SCHEMA_VERSION}) failed validation.`
        : "Dashboard configuration failed validation.",
      issues: zodIssues(result.error),
      detectedVersion,
    };
  }

  return { ok: true, config: result.data, migratedFrom };
}
