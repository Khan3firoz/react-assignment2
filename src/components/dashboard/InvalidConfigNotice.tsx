import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ValidationResult } from "@/dashboard/validator";

type Failure = Extract<ValidationResult, { ok: false }>;

const KIND_LABEL: Record<Failure["kind"], string> = {
  invalid: "Invalid configuration",
  "unsupported-version": "Unsupported schema version",
  "migration-failed": "Migration failed",
};

/**
 * The single canonical surface for an unrenderable dashboard configuration.
 * Never repairs anything — just explains, with full detail on demand.
 */
export function InvalidConfigNotice({
  result,
  onDismiss,
}: {
  result: Failure;
  onDismiss?: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card
      role="alert"
      className="mx-auto max-w-2xl border-amber-300 bg-amber-50/60"
    >
      <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
        <AlertTriangle className="h-9 w-9 text-amber-500" />
        <h2 className="text-base font-semibold">
          ⚠ Invalid Dashboard Configuration
        </h2>
        <p className="text-sm text-muted-foreground">
          The dashboard configuration cannot be rendered.
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-expanded={showDetails}
            onClick={() => setShowDetails((s) => !s)}
          >
            {showDetails ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            View Details
          </Button>
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>

        {showDetails && (
          <div className="mt-2 w-full rounded-md border bg-background p-3 text-left">
            <p className="text-xs font-medium text-muted-foreground">
              {KIND_LABEL[result.kind]}
              {result.detectedVersion !== null && (
                <> · detected schemaVersion {result.detectedVersion}</>
              )}
            </p>
            <p className="mt-1 text-sm">{result.summary}</p>
            <ul className="mt-2 space-y-1">
              {result.issues.map((issue, i) => (
                <li key={i} className="font-mono text-xs">
                  <span className="text-amber-700">{issue.path}</span>
                  {" — "}
                  <span className="text-muted-foreground">{issue.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
