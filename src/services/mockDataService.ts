/**
 * Mock asynchronous data service. There is NO backend — this simulates one
 * with hardcoded JSON, Promises and setTimeout.
 *
 * Simulated conditions (driven by faultConfig / the Failure Simulator panel):
 *   - configurable delay 0–5000ms
 *   - random failures (failure rate %)
 *   - timeout (forceTimeout, plus a hard REQUEST_TIMEOUT_MS ceiling)
 *   - missing fields (removeField)
 *   - wrong data types (wrongDataType)
 *   - empty data (emptyResponse)
 *
 * The service returns RAW, UNVALIDATED JSON. All validation happens in the
 * widget layer via Zod. The service never silently substitutes defaults.
 */

import {
  PRIMARY_FIELD,
  RAW_DATA_SOURCES,
  type RawDataSourceId,
} from "@/mock/dataSources";
import {
  getFaultConfig,
  REQUEST_TIMEOUT_MS,
  type FaultConfig,
} from "./faultConfig";

/** Error kinds the service can reject with. The widget maps these to UI. */
export type MockErrorKind = "network" | "timeout";

export class MockServiceError extends Error {
  kind: MockErrorKind;
  constructor(kind: MockErrorKind, message: string) {
    super(message);
    this.name = "MockServiceError";
    this.kind = kind;
  }
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new MockServiceError("timeout", "Request aborted"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new MockServiceError("timeout", "Request aborted"));
      },
      { once: true }
    );
  });
}

/**
 * Apply the configured payload corruptions to a fresh clone of the raw data.
 * Order matters: removeField wins over wrongDataType wins over emptyResponse
 * when several are toggled, so each scenario is individually testable.
 */
function corrupt(
  sourceId: RawDataSourceId,
  config: FaultConfig
): unknown {
  const raw = deepClone(RAW_DATA_SOURCES[sourceId]) as Record<string, unknown>;
  const primary = PRIMARY_FIELD[sourceId];

  if (config.removeField) {
    delete raw[primary];
    return raw;
  }

  if (config.wrongDataType) {
    const value = raw[primary];
    if (Array.isArray(value)) {
      // hand back a string where an array is expected
      raw[primary] = "not-an-array";
    } else if (typeof value === "number") {
      raw[primary] = String(value);
    } else {
      raw[primary] = 12345; // number where object/other expected
    }
    return raw;
  }

  if (config.emptyResponse) {
    if (primary === "points" || Array.isArray(raw.points)) {
      raw.points = [];
    } else if (primary === "rows" || Array.isArray(raw.rows)) {
      raw.rows = [];
    } else {
      // metric has no natural "empty" — the server hands back an explicit
      // empty marker the validator recognises as the empty state.
      return { empty: true as const };
    }
    return raw;
  }

  return raw;
}

/**
 * Fetch a data source. Resolves with raw unvalidated JSON, or rejects with a
 * MockServiceError for network/timeout conditions.
 */
export function fetchDataSource(
  sourceId: RawDataSourceId,
  options: { signal?: AbortSignal } = {}
): Promise<unknown> {
  const config = getFaultConfig();
  const effectiveDelay = config.forceTimeout
    ? REQUEST_TIMEOUT_MS + 2000
    : Math.min(Math.max(config.delayMs, 0), 5000);

  return new Promise<unknown>((resolve, reject) => {
    // Hard timeout ceiling — mirrors a real client-side abort.
    const timeoutTimer = setTimeout(() => {
      reject(
        new MockServiceError(
          "timeout",
          `Request timed out after ${REQUEST_TIMEOUT_MS}ms`
        )
      );
    }, REQUEST_TIMEOUT_MS);

    const finish = (fn: () => void) => {
      clearTimeout(timeoutTimer);
      fn();
    };

    delay(effectiveDelay, options.signal)
      .then(() => {
        // Random failure roll happens AFTER the latency, like a real API.
        const roll = Math.random() * 100;
        if (roll < config.failureRatePct) {
          finish(() =>
            reject(new MockServiceError("network", "Request failed."))
          );
          return;
        }
        finish(() => resolve(corrupt(sourceId, config)));
      })
      .catch((err) => finish(() => reject(err)));
  });
}
