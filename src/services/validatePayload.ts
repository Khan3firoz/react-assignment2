/**
 * Turns a raw payload + Zod schema into a precise, typed result the widget
 * can render deterministically. Distinguishes:
 *   - missing-field   → "Field X does not exist"
 *   - wrong-type      → "Expected number / Received string"
 *   - invalid         → generic schema violation
 *   - empty           → validated but no rows/points to show
 */

import { z } from "zod";
import type { AnyPayloadSchema } from "./schemas";

export type ValidationOutcome<T> =
  | { status: "success"; data: T }
  | { status: "empty" }
  | {
      status: "missing-field";
      field: string;
    }
  | {
      status: "wrong-type";
      field: string;
      expected: string;
      received: string;
    }
  | {
      status: "invalid";
      message: string;
    };

function isEmptyPayload(data: unknown): boolean {
  if (data == null) return true;
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (obj.empty === true) return true;
    if (Array.isArray(obj.points)) return obj.points.length === 0;
    if (Array.isArray(obj.rows)) return obj.rows.length === 0;
  }
  return false;
}

export function validatePayload<S extends AnyPayloadSchema>(
  schema: S,
  raw: unknown
): ValidationOutcome<z.infer<S>> {
  // An explicit empty marker from the service short-circuits schema checks.
  if (
    raw != null &&
    typeof raw === "object" &&
    (raw as Record<string, unknown>).empty === true
  ) {
    return { status: "empty" };
  }

  const result = schema.safeParse(raw);

  if (result.success) {
    if (isEmptyPayload(result.data)) return { status: "empty" };
    return { status: "success", data: result.data as z.infer<S> };
  }

  // Inspect the first issue to classify the failure precisely.
  const issue = result.error.issues[0];
  const field = issue?.path.join(".") || "(root)";

  if (issue) {
    if (
      issue.code === z.ZodIssueCode.invalid_type &&
      issue.received === "undefined"
    ) {
      return { status: "missing-field", field };
    }
    if (issue.code === z.ZodIssueCode.invalid_type) {
      return {
        status: "wrong-type",
        field,
        expected: issue.expected,
        received: issue.received,
      };
    }
  }

  return {
    status: "invalid",
    message: issue?.message ?? "Payload does not match the expected schema.",
  };
}
