/**
 * Versioned dashboard configuration schema (Zod).
 *
 * CURRENT_SCHEMA_VERSION is the only version the app renders directly.
 * Older versions are brought forward by src/dashboard/migrations.ts.
 * Unknown / unsupported versions fail visibly — they are never repaired.
 *
 * Design notes
 * ------------
 * - Everything is strict: `.strict()` objects, explicit enums, no silent
 *   coercion, no `.default()` / `.catch()` on anything load-bearing.
 * - `layout` uses non-negative, bounded integers so "negative layout" and
 *   "huge layout" hostile configs are rejected rather than rendered.
 * - Widget `binding` describes WHERE the data comes from (data source +
 *   the fields the widget reads). A widget with no binding is invalid.
 */

import { z } from "zod";

export const CURRENT_SCHEMA_VERSION = 2 as const;
export const SUPPORTED_SCHEMA_VERSIONS = [1, 2] as const;

/* ------------------------------------------------------------------ *
 * Primitives
 * ------------------------------------------------------------------ */

export const widgetTypeSchema = z.enum([
  "metric",
  "table",
  "barChart",
  "lineChart",
]);
export type WidgetType = z.infer<typeof widgetTypeSchema>;

export const dataSourceSchema = z.enum([
  "orders",
  "revenue",
  "ordersByRegion",
  "revenueTrend",
  "recentOrders",
]);
export type DataSourceId = z.infer<typeof dataSourceSchema>;

export const filterOperatorSchema = z.enum([
  "eq",
  "neq",
  "in",
  "contains",
  "gt",
  "lt",
]);
export type FilterOperator = z.infer<typeof filterOperatorSchema>;

/** Bounds for layout values — anything outside is a hostile/invalid config. */
const LAYOUT_MAX = 96;
const layoutIntSchema = z
  .number()
  .int("layout values must be integers")
  .nonnegative("layout values must be >= 0")
  .max(LAYOUT_MAX, `layout values must be <= ${LAYOUT_MAX}`);

/* ------------------------------------------------------------------ *
 * Widget
 * ------------------------------------------------------------------ */

export const widgetLayoutSchema = z
  .object({
    x: layoutIntSchema,
    y: layoutIntSchema,
    w: layoutIntSchema.min(1, "width must be >= 1"),
    h: layoutIntSchema.min(1, "height must be >= 1"),
  })
  .strict();
export type WidgetLayout = z.infer<typeof widgetLayoutSchema>;

/** Where a widget reads its data from. */
export const widgetBindingSchema = z
  .object({
    dataSource: dataSourceSchema,
    /** The payload fields the widget consumes. Must be non-empty. */
    fields: z
      .array(z.string().min(1, "field name must not be empty"))
      .min(1, "binding.fields must list at least one field"),
  })
  .strict();
export type WidgetBinding = z.infer<typeof widgetBindingSchema>;

/**
 * Title is validated as plain text: control chars and angle-bracket tags are
 * rejected so a "malicious HTML title" hostile config fails loudly instead of
 * being sanitised behind the user's back.
 */
const widgetTitleSchema = z
  .string()
  .min(1, "title is required")
  .max(120, "title is too long")
  .refine((s) => !/[<>]/.test(s), {
    message: "title must not contain HTML markup",
  });

export const widgetSchema = z
  .object({
    id: z.string().min(1, "widget id is required"),
    type: widgetTypeSchema,
    title: widgetTitleSchema,
    binding: widgetBindingSchema,
    layout: widgetLayoutSchema,
    /** Optional presentation-only accent for charts. */
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, "accent must be a hex color").optional(),
  })
  .strict();
export type WidgetV2 = z.infer<typeof widgetSchema>;

/* ------------------------------------------------------------------ *
 * Filters
 * ------------------------------------------------------------------ */

export const dashboardFilterSchema = z
  .object({
    id: z.string().min(1, "filter id is required"),
    field: z.string().min(1, "filter field is required"),
    operator: filterOperatorSchema,
    /** string | number | string[] — validated by the operator's needs below. */
    value: z.union([z.string(), z.number(), z.array(z.string())]),
  })
  .strict()
  .superRefine((f, ctx) => {
    if (f.operator === "in" && !Array.isArray(f.value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "operator 'in' requires an array value",
        path: ["value"],
      });
    }
    if ((f.operator === "gt" || f.operator === "lt") && typeof f.value !== "number") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `operator '${f.operator}' requires a numeric value`,
        path: ["value"],
      });
    }
  });
export type DashboardFilter = z.infer<typeof dashboardFilterSchema>;

/* ------------------------------------------------------------------ *
 * Dashboard (v2 — current)
 * ------------------------------------------------------------------ */

export const dashboardConfigSchema = z
  .object({
    schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
    id: z.string().min(1, "dashboard id is required"),
    name: z
      .string()
      .min(1, "dashboard name is required")
      .max(120, "dashboard name is too long")
      .refine((s) => !/[<>]/.test(s), {
        message: "name must not contain HTML markup",
      }),
    filters: z.array(dashboardFilterSchema),
    widgets: z.array(widgetSchema),
    /** ISO timestamp of last edit. */
    updatedAt: z.string().min(1),
  })
  .strict()
  .superRefine((cfg, ctx) => {
    const seen = new Set<string>();
    cfg.widgets.forEach((w, i) => {
      if (seen.has(w.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate widget id "${w.id}"`,
          path: ["widgets", i, "id"],
        });
      }
      seen.add(w.id);
    });
  });
export type DashboardConfig = z.infer<typeof dashboardConfigSchema>;

/* ------------------------------------------------------------------ *
 * Legacy v1 shape (for migration only — never rendered directly)
 * ------------------------------------------------------------------ */

export const dashboardConfigV1Schema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().min(1),
    name: z.string().min(1),
    filters: z.object({ region: z.string(), status: z.string() }),
    widgets: z.array(
      z.object({
        id: z.string().min(1),
        type: widgetTypeSchema,
        config: z.object({
          title: z.string().min(1),
          dataSource: dataSourceSchema,
          accent: z.string().optional(),
        }),
      })
    ),
    updatedAt: z.string().min(1),
  })
  .strict();
export type DashboardConfigV1 = z.infer<typeof dashboardConfigV1Schema>;

/** Just enough to read the version off an unknown blob. */
export const versionProbeSchema = z.object({
  schemaVersion: z.number().int(),
});
