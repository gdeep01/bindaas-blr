import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { typography } from '@/lib/typography';

const IS_DEV = import.meta.env.DEV;

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (IS_DEV) {
      console.error('Uncaught error in component tree:', error, errorInfo);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="glass-card m-4 flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-danger/40 p-6 text-center sm:m-8">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-danger">
            <AlertTriangle className="h-8 w-8 text-danger" />
          </div>
          <h2 className={`${typography.h2} mb-2 text-foreground`}>Something Went Wrong</h2>
          <p className={`${typography.body} mb-6 max-w-md text-muted-foreground`}>
            The application encountered an unexpected error while rendering this section.
          </p>
          <button
            onClick={this.handleReload}
            className="flex items-center gap-2 rounded-sm bg-foreground px-6 py-3 font-body text-[0.75rem] font-bold text-background transition-colors hover:bg-primary"
          >
            <RefreshCcw className="w-4 h-4" />
            Reload Page
          </button>
          
          {IS_DEV && this.state.error && (
            <div className="mt-8 w-full max-w-2xl overflow-auto rounded-sm border border-border bg-card p-4 text-left text-xs text-muted-foreground">
              {this.state.error.toString()}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
