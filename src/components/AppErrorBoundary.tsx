import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * Last-resort boundary around the whole app. Individual widgets have their
 * own boundary; this only catches a crash in the shell itself so the user
 * sees a message instead of a blank page.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Application crashed:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="mx-auto mt-24 max-w-md rounded-lg border border-destructive/40 bg-background p-6 text-center"
        >
          <p className="text-base font-semibold">⚠ Something went wrong</p>
          <p className="mt-2 text-sm text-muted-foreground">
            The dashboard hit an unexpected error. Reloading the page usually
            fixes it. Your saved data is untouched.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Reload page
          </button>
          <pre className="mt-4 max-h-40 overflow-auto rounded bg-muted p-2 text-left text-[11px] text-muted-foreground">
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
