import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  /** Shown in the fallback header so the user knows which widget crashed. */
  widgetTitle: string;
  /** When this value changes (e.g. after an edit) the boundary clears itself. */
  resetKey?: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Wraps a single widget. A render/runtime crash in one widget is contained
 * here and never propagates to sibling widgets or the dashboard shell.
 */
export class WidgetErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prev: Props) {
    // A config change after a crash should give the widget a fresh attempt.
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      `Widget "${this.props.widgetTitle}" crashed:`,
      error,
      info.componentStack
    );
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <Card className="flex h-full flex-col border-destructive/40">
          <CardContent className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
            <AlertOctagon className="h-7 w-7 text-destructive" />
            <p className="text-sm font-semibold">⚠ Widget crashed</p>
            <p className="max-w-[85%] text-xs text-muted-foreground">
              &quot;{this.props.widgetTitle}&quot; hit an unexpected error and
              was isolated so the rest of the dashboard keeps working.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={this.reset}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reload widget
            </Button>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}
