"use client";

import { Button } from "@qbs-autonaim/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary перехватил ошибку:", error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      const isConnectionError =
        this.state.error.message?.includes("ECONNREFUSED") ||
        this.state.error.message?.includes("Failed query") ||
        this.state.error.message?.includes("Connection") ||
        this.state.error.message?.includes("Database");

      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-6">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                {isConnectionError
                  ? "Проблема с подключением"
                  : "Произошла ошибка"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isConnectionError
                  ? "Не удалось подключиться к серверу. Проверьте подключение и попробуйте снова."
                  : "Что-то пошло не так. Попробуйте обновить страницу."}
              </p>

              {process.env.NODE_ENV === "development" &&
                this.state.error.message && (
                  <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-left">
                    <p className="text-xs font-mono text-destructive break-all">
                      {this.state.error.message}
                    </p>
                  </div>
                )}
            </div>

            <Button
              onClick={this.reset}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Попробовать снова
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
