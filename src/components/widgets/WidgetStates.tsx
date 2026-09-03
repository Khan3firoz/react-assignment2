/**
 * Presentational components for the non-success widget states. The exact
 * copy here matches the assessment spec.
 */

import type { ReactNode } from "react";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WidgetErrorReason } from "@/hooks/useWidgetData";

export function WidgetLoading() {
  return (
    <div
      className="flex h-full min-h-[120px] flex-col justify-center gap-3"
      role="status"
      aria-busy="true"
      aria-label="Loading widget data"
    >
      <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
      <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
      <div className="h-24 w-full animate-pulse rounded bg-muted" />
    </div>
  );
}

export function WidgetEmpty() {
  return (
    <div
      className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 text-center text-muted-foreground"
      role="status"
    >
      <Inbox className="h-8 w-8" />
      <p className="text-sm font-medium">No data available</p>
      <p className="text-xs">The request succeeded but returned no records.</p>
    </div>
  );
}

interface WidgetErrorProps {
  reason: WidgetErrorReason;
  onRetry: () => void;
}

/**
 * Renders the precise error block the spec requires for each failure class.
 * Retry is offered only where retrying can plausibly help (transport errors);
 * schema errors persist until the simulator toggle is cleared, but we still
 * show Retry so the user can re-attempt after changing settings.
 */
export function WidgetError({ reason, onRetry }: WidgetErrorProps) {
  let title: string;
  let body: ReactNode;

  switch (reason.type) {
    case "missing-field":
      title = "Unable to display widget";
      body = (
        <>
          Field <span className="font-mono">&quot;{reason.field}&quot;</span>{" "}
          does not exist.
        </>
      );
      break;
    case "wrong-type":
      title = "Invalid data";
      body = (
        <span className="flex flex-col gap-0.5">
          <span>
            Expected <span className="font-medium">{reason.expected}</span>
          </span>
          <span>
            Received <span className="font-medium">{reason.received}</span>
          </span>
        </span>
      );
      break;
    case "timeout":
      title = "Failed to load data";
      body = "Request timed out.";
      break;
    case "request-failed":
      title = "Failed to load data";
      body = "Request failed.";
      break;
    case "invalid":
      title = "Invalid data";
      body = reason.message;
      break;
  }

  return (
    <div
      className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 text-center"
      role="alert"
    >
      <AlertTriangle className="h-7 w-7 text-amber-500" />
      <p className="text-sm font-semibold">⚠ {title}</p>
      <div className="max-w-[85%] text-xs text-muted-foreground">{body}</div>
      <Button variant="outline" size="sm" className="mt-1" onClick={onRetry}>
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </Button>
    </div>
  );
}
