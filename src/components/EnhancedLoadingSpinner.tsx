import { Loader2, Home, Search, MapPin } from 'lucide-react';

interface EnhancedLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'property' | 'search' | 'map';
  message?: string;
  showMessage?: boolean;
}

const EnhancedLoadingSpinner = ({ 
  size = 'md', 
  variant = 'default',
  message,
  showMessage = true 
}: EnhancedLoadingSpinnerProps) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'md':
        return 'w-8 h-8';
      case 'lg':
        return 'w-12 h-12';
      case 'xl':
        return 'w-16 h-16';
      default:
        return 'w-8 h-8';
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'property':
        return <Home className={`${getSizeClasses()} animate-bounce text-blue-600`} />;
      case 'search':
        return <Search className={`${getSizeClasses()} animate-spin text-green-600`} />;
      case 'map':
        return <MapPin className={`${getSizeClasses()} animate-pulse text-purple-600`} />;
      default:
        return <Loader2 className={`${getSizeClasses()} animate-spin text-blue-600`} />;
    }
  };

  const getMessage = () => {
    if (message) return message;
    
    switch (variant) {
      case 'property':
        return 'Loading properties...';
      case 'search':
        return 'Searching...';
      case 'map':
        return 'Loading map...';
      default:
        return 'Loading...';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* Main Loading Icon */}
      <div className="relative">
        {getIcon()}
        
        {/* Animated Ring */}
        <div className={`absolute inset-0 border-2 border-gray-200 rounded-full animate-spin ${getSizeClasses()}`}>
          <div className="absolute top-0 left-0 w-full h-full border-2 border-transparent border-t-blue-600 rounded-full animate-spin" style={{ animationDuration: '0.8s' }} />
        </div>
      </div>

      {/* Loading Message */}
      {showMessage && (
        <div className="mt-4 text-center">
          <p className="text-gray-600 font-medium animate-pulse">
            {getMessage()}
          </p>
          
          {/* Animated Dots */}
          <div className="flex justify-center items-center mt-2 space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  );
};

// Skeleton Loading Components
export const PropertyCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
    <div className="aspect-video bg-gray-200 rounded-lg mb-4" />
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="flex justify-between">
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-1/4" />
      </div>
      <div className="h-10 bg-gray-200 rounded" />
    </div>
  </div>
);

export const SearchBarSkeleton = () => (
  <div className="bg-white rounded-lg shadow-lg p-4 animate-pulse">
    <div className="flex space-x-4">
      <div className="flex-1 h-12 bg-gray-200 rounded" />
      <div className="w-32 h-12 bg-gray-200 rounded" />
      <div className="w-24 h-12 bg-gray-200 rounded" />
    </div>
  </div>
);

export const MapSkeleton = () => (
  <div className="w-full h-96 bg-gray-200 rounded-lg animate-pulse relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40 -skew-x-12 animate-shimmer" />
    <div className="absolute top-4 left-4 w-32 h-8 bg-gray-300 rounded" />
    <div className="absolute top-4 right-4 w-24 h-8 bg-gray-300 rounded" />
    <div className="absolute bottom-4 left-4 right-4 h-20 bg-gray-300 rounded" />
  </div>
);

// Page Loading Overlay
export const PageLoadingOverlay = ({ message = "Loading..." }: { message?: string }) => (
  <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4">
      <EnhancedLoadingSpinner size="lg" message={message} />
    </div>
  </div>
);

export default EnhancedLoadingSpinner; 