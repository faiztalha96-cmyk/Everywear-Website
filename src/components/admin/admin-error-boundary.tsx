import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, LayoutDashboard } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Admin Panel Error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-background rounded-[2.5rem] border border-border p-10 md:p-12 text-center space-y-8 shadow-xl">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl font-serif font-bold uppercase tracking-tight">Something went wrong</h2>
              <p className="text-sm text-muted-foreground font-medium">
                The admin component encountered an unexpected error. This has been logged for our team.
              </p>
              {this.state.error && (
                <div className="p-4 bg-secondary/20 rounded-xl border border-border/50 text-left overflow-hidden">
                  <p className="text-[10px] font-mono text-red-500 line-clamp-3">
                    {this.state.error.message}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 pt-4">
              <button
                onClick={this.handleReset}
                className="h-14 bg-foreground text-background rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
              <a
                href="/admin"
                className="h-14 border-2 border-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-secondary transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
