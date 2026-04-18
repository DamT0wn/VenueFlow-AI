'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Optional fallback UI — defaults to a styled error card */
  fallback?: ReactNode;
  /** Component name for error logging context */
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary — catches render errors in child components and
 * displays a graceful fallback instead of crashing the whole page.
 *
 * Usage:
 *   <ErrorBoundary name="MapPage">
 *     <VenueMap ... />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log to console in dev; in production this would go to Cloud Logging
    console.error(`[ErrorBoundary:${this.props.name ?? 'unknown'}]`, error, info.componentStack);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        role="alert"
        aria-live="assertive"
        className="flex flex-col items-center justify-center gap-4 p-8 rounded-3xl text-center"
        style={{
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.2)',
          minHeight: '160px',
        }}
      >
        <AlertTriangle size={32} style={{ color: '#EF4444' }} aria-hidden="true" />
        <div>
          <p className="text-[15px] font-bold mb-1" style={{ color: '#F1F5F9' }}>
            Something went wrong
          </p>
          <p className="text-[12px]" style={{ color: '#94A3B8' }}>
            {this.props.name ? `${this.props.name} failed to load` : 'This section failed to load'}
          </p>
        </div>
        <button
          onClick={this.handleReset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444' }}
        >
          <RefreshCw size={13} aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }
}
