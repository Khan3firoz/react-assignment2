/**
 * Strict Zod contracts for each raw data source. These are deliberately
 * unforgiving: no .optional(), no .default(), no .catch(). If the payload
 * doesn't match exactly, validation fails and the widget shows an error
 * state — it never renders partial or substituted data.
 */

import { z } from "zod";
import type { RawDataSourceId } from "@/mock/dataSources";

/** A single metric payload: one canonical numeric value + metadata. */
export const metricPayloadSchema = z.object({
  value: z.number(),
  label: z.string(),
  previousValue: z.number(),
  unit: z.enum(["number", "currency"]),
});
export type MetricPayload = z.infer<typeof metricPayloadSchema>;

const seriesPointSchema = z.record(z.union([z.string(), z.number()]));

export const seriesPayloadSchema = z.object({
  xKey: z.string(),
  series: z
    .array(z.object({ key: z.string(), label: z.string() }))
    .min(1),
  points: z.array(seriesPointSchema),
});
export type SeriesPayload = z.infer<typeof seriesPayloadSchema>;

const orderRowSchema = z.object({
  id: z.string(),
  customer: z.string(),
  region: z.string(),
  status: z.string(),
  amount: z.number(),
  date: z.string(),
});

export const tablePayloadSchema = z.object({
  columns: z
    .array(z.object({ key: z.string(), label: z.string() }))
    .min(1),
  rows: z.array(orderRowSchema),
});
export type TablePayload = z.infer<typeof tablePayloadSchema>;

export type AnyPayloadSchema =
  | typeof metricPayloadSchema
  | typeof seriesPayloadSchema
  | typeof tablePayloadSchema;

export const SCHEMA_BY_SOURCE: Record<RawDataSourceId, AnyPayloadSchema> = {
  orders: metricPayloadSchema,
  revenue: metricPayloadSchema,
  ordersByRegion: seriesPayloadSchema,
  revenueTrend: seriesPayloadSchema,
  recentOrders: tablePayloadSchema,
};
