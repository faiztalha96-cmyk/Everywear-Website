import React, { ReactNode, ErrorInfo } from "react";
import { Link } from "wouter";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full space-y-8">
            <h1 className="text-4xl font-serif font-bold text-foreground">Something went wrong</h1>
            <p className="text-muted-foreground font-sans">
              We encountered an unexpected error. Our team has been notified.
            </p>
            
            {this.state.error && (
              <div className="bg-secondary p-4 text-left overflow-auto max-h-40 border border-border">
                <code className="text-xs font-mono text-destructive">
                  {this.state.error.message}
                </code>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="bg-foreground text-background px-8 py-3 text-sm font-semibold uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Try Again
              </button>
              <Link href="/" className="border border-border text-foreground px-8 py-3 text-sm font-semibold uppercase tracking-widest hover:bg-secondary transition-colors">
                Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
