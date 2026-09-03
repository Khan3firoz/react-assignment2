/**
 * Global fault-injection configuration driven by the developer
 * "Failure Simulator" panel. A tiny pub/sub store so the mock service
 * (non-React) and the panel (React) share one source of truth.
 */

export interface FaultConfig {
  /** Artificial latency in ms, 0–5000. */
  delayMs: number;
  /** Probability 0–100 that a request rejects with a generic failure. */
  failureRatePct: number;
  /** Always exceed the request timeout. */
  forceTimeout: boolean;
  /** Delete the primary field from the payload before returning. */
  removeField: boolean;
  /** Coerce the primary numeric value to a string. */
  wrongDataType: boolean;
  /** Return a structurally-valid but empty payload. */
  emptyResponse: boolean;
}

export const DEFAULT_FAULT_CONFIG: FaultConfig = {
  delayMs: 600,
  failureRatePct: 0,
  forceTimeout: false,
  removeField: false,
  wrongDataType: false,
  emptyResponse: false,
};

/** Hard ceiling the mock service enforces on any single request. */
export const REQUEST_TIMEOUT_MS = 4000;

type Listener = (config: FaultConfig) => void;

let current: FaultConfig = { ...DEFAULT_FAULT_CONFIG };
const listeners = new Set<Listener>();

export function getFaultConfig(): FaultConfig {
  return current;
}

export function setFaultConfig(patch: Partial<FaultConfig>): void {
  current = { ...current, ...patch };
  listeners.forEach((l) => l(current));
}

export function resetFaultConfig(): void {
  current = { ...DEFAULT_FAULT_CONFIG };
  listeners.forEach((l) => l(current));
}

export function subscribeFaultConfig(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
