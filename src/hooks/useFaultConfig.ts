import { useSyncExternalStore } from "react";
import {
  getFaultConfig,
  resetFaultConfig,
  setFaultConfig,
  subscribeFaultConfig,
  type FaultConfig,
} from "@/services/faultConfig";

/** Subscribe a component to the global Failure Simulator config. */
export function useFaultConfig() {
  // Third arg is the server snapshot — the store is a plain module singleton,
  // so the same getter is valid on the server and keeps the hook SSR-safe.
  const config = useSyncExternalStore(
    subscribeFaultConfig,
    getFaultConfig,
    getFaultConfig
  );
  return {
    config,
    update: (patch: Partial<FaultConfig>) => setFaultConfig(patch),
    reset: resetFaultConfig,
  };
}
