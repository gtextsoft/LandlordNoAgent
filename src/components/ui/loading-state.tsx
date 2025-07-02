import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  spinnerSize?: "sm" | "md" | "lg";
  overlay?: boolean;
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

interface LoadingOverlayProps {
  isVisible: boolean;
  text?: string;
  className?: string;
}

export const LoadingSpinner = ({ 
  size = "md", 
  className,
  text 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      {text && (
        <span className="text-sm text-muted-foreground">{text}</span>
      )}
    </div>
  );
};

export const LoadingSkeleton = ({ 
  lines = 3, 
  className 
}: LoadingSkeletonProps) => {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
        </div>
      ))}
    </div>
  );
};

export const LoadingOverlay = ({
  isVisible,
  text = "Loading...",
  className
}: LoadingOverlayProps) => {
  if (!isVisible) return null;

  return (
    <div className={cn(
      "absolute inset-0 bg-background/80 backdrop-blur-sm",
      "flex items-center justify-center z-50",
      className
    )}>
      <div className="flex flex-col items-center gap-4 p-6 bg-background border rounded-lg shadow-lg">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium">{text}</p>
      </div>
    </div>
  );
};

export const LoadingState = ({
  isLoading,
  children,
  loadingText = "Loading...",
  className,
  spinnerSize = "md",
  overlay = false
}: LoadingStateProps) => {
  if (overlay) {
    return (
      <div className={cn("relative", className)}>
        {children}
        <LoadingOverlay isVisible={isLoading} text={loadingText} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <LoadingSpinner size={spinnerSize} text={loadingText} />
      </div>
    );
  }

  return <>{children}</>;
};

// Higher-order component for async operations
interface WithLoadingProps {
  loading?: boolean;
  error?: string | null;
  loadingText?: string;
  errorComponent?: React.ComponentType<{ error: string }>;
  className?: string;
}

export const withLoading = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return ({ 
    loading, 
    error, 
    loadingText,
    errorComponent: ErrorComponent,
    className,
    ...props 
  }: P & WithLoadingProps) => {
    if (loading) {
      return (
        <div className={cn("flex items-center justify-center p-8", className)}>
          <LoadingSpinner text={loadingText} />
        </div>
      );
    }

    if (error && ErrorComponent) {
      return <ErrorComponent error={error} />;
    }

    if (error) {
      return (
        <div className={cn("text-center p-8 text-destructive", className)}>
          <p>Error: {error}</p>
        </div>
      );
    }

    return <Component {...(props as P)} />;
  };
};

// Table loading state
export const TableLoadingSkeleton = ({ 
  rows = 5, 
  columns = 4,
  className 
}: { 
  rows?: number; 
  columns?: number; 
  className?: string; 
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div 
              key={colIndex} 
              className="h-4 bg-muted rounded animate-pulse flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// Card loading state
export const CardLoadingSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn("p-6 border rounded-lg space-y-4", className)}>
      <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
        <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
      </div>
      <div className="flex space-x-2">
        <div className="h-8 bg-muted rounded animate-pulse w-20" />
        <div className="h-8 bg-muted rounded animate-pulse w-16" />
      </div>
    </div>
  );
};

// List loading state
export const ListLoadingSkeleton = ({ 
  items = 3,
  className 
}: { 
  items?: number; 
  className?: string; 
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
          <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
            <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
          </div>
          <div className="h-8 bg-muted rounded animate-pulse w-16" />
        </div>
      ))}
    </div>
  );
}; 