import React, { ErrorInfo, ReactNode } from 'react';
import ErrorBoundaryWrapper from '@/components/ErrorBoundaryWrapper';

interface WithErrorBoundaryProps {
  componentName?: string;
  fallbackUI?: ReactNode;
  errorHandler?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * Higher-order component that wraps a component with an ErrorBoundaryWrapper.
 * This makes it easy to add error boundaries to specific components.
 * 
 * @param Component The component to wrap with an error boundary
 * @param options Configuration options for the error boundary
 * @returns A new component wrapped with an error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: WithErrorBoundaryProps = {}
): React.FC<P> {
  const { componentName, fallbackUI, errorHandler } = options;
  
  const displayName = componentName || Component.displayName || Component.name || 'Component';
  
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <ErrorBoundaryWrapper 
        componentName={displayName}
        fallbackUI={fallbackUI}
        errorHandler={errorHandler}
      >
        <Component {...props} />
      </ErrorBoundaryWrapper>
    );
  };
  
  WrappedComponent.displayName = `WithErrorBoundary(${displayName})`;
  
  return WrappedComponent;
}

/**
 * A React component that provides a standardized way to create error boundaries
 * for specific sections of your application.
 */
export const SectionErrorBoundary: React.FC<{
  children: ReactNode;
  name: string;
  fallbackUI?: ReactNode;
  errorHandler?: (error: Error, errorInfo: ErrorInfo) => void;
}> = ({ children, name, fallbackUI, errorHandler }) => {
  return (
    <ErrorBoundaryWrapper
      componentName={name}
      fallbackUI={fallbackUI}
      errorHandler={errorHandler}
    >
      {children}
    </ErrorBoundaryWrapper>
  );
};