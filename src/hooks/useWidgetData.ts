/**
 * Fetches + validates a single widget's data source. Owns the four widget
 * states: loading | success | error | empty (error is further subtyped so
 * the widget can render the exact required message).
 *
 * Re-runs when the source, the dashboard filters, or the fault config change,
 * and exposes retry().
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchDataSource,
  MockServiceError,
} from "@/services/mockDataService";
import { subscribeFaultConfig } from "@/services/faultConfig";
import { SCHEMA_BY_SOURCE } from "@/services/schemas";
import {
  validatePayload,
  type ValidationOutcome,
} from "@/services/validatePayload";
import {
  applyFilters,
  filtersAreEmpty,
  type FilterablePayload,
} from "@/dashboard/filterEngine";
import type { RawDataSourceId } from "@/mock/dataSources";
import type { DashboardFilters } from "@/dashboard/types";

export type WidgetErrorReason =
  | { type: "request-failed" }
  | { type: "timeout" }
  | { type: "missing-field"; field: string }
  | { type: "wrong-type"; field: string; expected: string; received: string }
  | { type: "invalid"; message: string };

export type WidgetDataState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "empty" }
  | { status: "error"; reason: WidgetErrorReason };

function outcomeToState<T>(
  outcome: ValidationOutcome<T>,
  filters: DashboardFilters
): WidgetDataState<T> {
  switch (outcome.status) {
    case "success": {
      // Centralized filtering: the ONLY place widget data gets filtered.
      const filtered = applyFilters(
        outcome.data as unknown as FilterablePayload,
        filters
      ) as unknown as T;
      // A payload that had rows/points but has none after filtering is
      // reported as empty, not as an empty-looking success.
      if (!filtersAreEmpty(filters) && isNowEmpty(filtered)) {
        return { status: "empty" };
      }
      return { status: "success", data: filtered };
    }
    case "empty":
      return { status: "empty" };
    case "missing-field":
      return {
        status: "error",
        reason: { type: "missing-field", field: outcome.field },
      };
    case "wrong-type":
      return {
        status: "error",
        reason: {
          type: "wrong-type",
          field: outcome.field,
          expected: outcome.expected,
          received: outcome.received,
        },
      };
    case "invalid":
      return {
        status: "error",
        reason: { type: "invalid", message: outcome.message },
      };
  }
}

/** After filtering: had collection data, now has none. */
function isNowEmpty(payload: unknown): boolean {
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.rows)) return obj.rows.length === 0;
    if (Array.isArray(obj.points)) return obj.points.length === 0;
  }
  return false;
}

export function useWidgetData<T = unknown>(
  sourceId: RawDataSourceId,
  filters: DashboardFilters
): {
  state: WidgetDataState<T>;
  retry: () => void;
} {
  const [state, setState] = useState<WidgetDataState<T>>({ status: "loading" });
  const [nonce, setNonce] = useState(0);
  const reqIdRef = useRef(0);

  const retry = useCallback(() => setNonce((n) => n + 1), []);

  // Re-fetch whenever the simulator config changes.
  useEffect(() => subscribeFaultConfig(() => setNonce((n) => n + 1)), []);

  // Primitive filter values drive the effect; the object identity may change
  // every render, so we depend on the fields, not the reference.
  const { region, status } = filters;

  useEffect(() => {
    const reqId = ++reqIdRef.current;
    const controller = new AbortController();
    setState({ status: "loading" });
    const activeFilters: DashboardFilters = { region, status };

    fetchDataSource(sourceId, { signal: controller.signal })
      .then((raw) => {
        if (reqId !== reqIdRef.current) return; // stale response
        const schema = SCHEMA_BY_SOURCE[sourceId];
        const outcome = validatePayload(schema, raw);
        setState(
          outcomeToState<T>(outcome as ValidationOutcome<T>, activeFilters)
        );
      })
      .catch((err: unknown) => {
        if (reqId !== reqIdRef.current) return;
        if (err instanceof MockServiceError && err.kind === "timeout") {
          setState({ status: "error", reason: { type: "timeout" } });
        } else {
          setState({
            status: "error",
            reason: { type: "request-failed" },
          });
        }
      });

    return () => controller.abort();
  }, [sourceId, region, status, nonce]);

  return { state, retry };
}
