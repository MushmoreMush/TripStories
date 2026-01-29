import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Simple error tracking service - can be replaced with Sentry, LogRocket, etc.
export function trackError(error: Error, errorInfo?: ErrorInfo, context?: Record<string, unknown>) {
  // Log to console in development
  console.error("[Error Tracking]", {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack,
    context,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  });

  // In production, send to error tracking service
  if (process.env.NODE_ENV === "production") {
    // Example: Send to your error tracking endpoint
    fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        context,
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(() => {
      // Silently fail - don't want error tracking to cause more errors
    });
  }
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    trackError(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[50vh] p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-2" />
              <CardTitle>Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                An unexpected error occurred. Our team has been notified.
              </p>
              {process.env.NODE_ENV !== "production" && this.state.error && (
                <details className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-32">
                  <summary className="cursor-pointer font-medium">Error details</summary>
                  <pre className="mt-2 whitespace-pre-wrap">{this.state.error.message}</pre>
                </details>
              )}
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={this.handleRetry}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try again
                </Button>
                <Button onClick={this.handleReload}>Reload page</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for tracking errors imperatively
export function useErrorTracking() {
  return {
    trackError: (error: Error, context?: Record<string, unknown>) => {
      trackError(error, undefined, context);
    },
  };
}
