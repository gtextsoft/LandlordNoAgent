import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Upload, 
  MessageCircle, 
  Search,
  Eye,
  Heart,
  FileText,
  Camera,
  User,
  Building,
  Loader2
} from 'lucide-react';

// Multi-step progress component
export const MultiStepProgress = ({ 
  steps, 
  currentStep, 
  completedSteps = [],
  variant = 'horizontal' 
}: {
  steps: Array<{ id: string; label: string; icon?: React.ComponentType<any> }>;
  currentStep: number;
  completedSteps?: string[];
  variant?: 'horizontal' | 'vertical';
}) => {
  if (variant === 'vertical') {
    return (
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;
          
          return (
            <div key={step.id} className="flex items-start">
              <div className="flex flex-col items-center mr-4">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${isCompleted 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : isCurrent 
                    ? 'bg-blue-500 border-blue-500 text-white animate-pulse' 
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                  }
                `}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : step.icon ? (
                    <step.icon className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-0.5 h-8 mt-2 transition-colors duration-300 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
              <div className="flex-1">
                <h4 className={`font-medium transition-colors duration-300 ${
                  isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-500'
                }`}>
                  {step.label}
                </h4>
                {isCurrent && (
                  <p className="text-sm text-gray-500 mt-1">In progress...</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = index === currentStep;
        
        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                ${isCompleted 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : isCurrent 
                  ? 'bg-blue-500 border-blue-500 text-white animate-pulse' 
                  : 'bg-gray-100 border-gray-300 text-gray-500'
                }
              `}>
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : step.icon ? (
                  <step.icon className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <span className={`text-sm mt-2 text-center transition-colors duration-300 ${
                isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-500'
              }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 transition-colors duration-300 ${
                isCompleted ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// File upload progress component
export const FileUploadProgress = ({ 
  files, 
  onRemove 
}: { 
  files: Array<{
    id: string;
    name: string;
    size: number;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
  }>;
  onRemove?: (id: string) => void;
}) => {
  return (
    <div className="space-y-3">
      {files.map((file) => (
        <Card key={file.id} className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                file.status === 'completed' ? 'bg-green-100' :
                file.status === 'error' ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                {file.status === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : file.status === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <Upload className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div>
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            
            {onRemove && (
              <button 
                onClick={() => onRemove(file.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
          
          {file.status === 'uploading' && (
            <div className="space-y-2">
              <Progress value={file.progress} className="h-2" />
              <p className="text-xs text-gray-500">{file.progress}% uploaded</p>
            </div>
          )}
          
          {file.status === 'error' && file.error && (
            <p className="text-xs text-red-600 mt-2">{file.error}</p>
          )}
          
          {file.status === 'completed' && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
              Upload Complete
            </Badge>
          )}
        </Card>
      ))}
    </div>
  );
};

// Profile completion progress
export const ProfileCompletionProgress = ({ 
  completionData 
}: { 
  completionData: {
    completed: number;
    total: number;
    sections: Array<{
      name: string;
      completed: boolean;
      icon: React.ComponentType<any>;
    }>;
  };
}) => {
  const percentage = (completionData.completed / completionData.total) * 100;
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Profile Completion</h3>
        <Badge variant={percentage === 100 ? "default" : "secondary"}>
          {Math.round(percentage)}%
        </Badge>
      </div>
      
      <Progress value={percentage} className="mb-4" />
      
      <div className="grid grid-cols-2 gap-3">
        {completionData.sections.map((section) => (
          <div key={section.name} className="flex items-center space-x-2">
            <div className={`p-1 rounded-full ${
              section.completed ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <section.icon className={`w-4 h-4 ${
                section.completed ? 'text-green-600' : 'text-gray-400'
              }`} />
            </div>
            <span className={`text-sm ${
              section.completed ? 'text-green-700' : 'text-gray-500'
            }`}>
              {section.name}
            </span>
          </div>
        ))}
      </div>
      
      {percentage < 100 && (
        <p className="text-xs text-gray-500 mt-4">
          Complete your profile to get better matches
        </p>
      )}
    </Card>
  );
};

// Search/Loading states
export const SearchProgress = ({ 
  isSearching, 
  query, 
  resultCount, 
  totalTime 
}: {
  isSearching: boolean;
  query: string;
  resultCount?: number;
  totalTime?: number;
}) => {
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    if (isSearching) {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isSearching]);
  
  if (isSearching) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">
            Searching for "{query}"{dots}
          </p>
        </div>
      </div>
    );
  }
  
  if (resultCount !== undefined) {
    return (
      <div className="flex items-center justify-between py-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            Found {resultCount.toLocaleString()} properties
            {query && <span> for "{query}"</span>}
          </span>
        </div>
        {totalTime && (
          <span className="text-xs text-gray-400">
            ({totalTime}ms)
          </span>
        )}
      </div>
    );
  }
  
  return null;
};

// Activity timeline component
export const ActivityTimeline = ({ 
  activities 
}: { 
  activities: Array<{
    id: string;
    type: 'view' | 'save' | 'message' | 'application';
    title: string;
    description: string;
    timestamp: Date;
    propertyId?: string;
  }>;
}) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'view': return Eye;
      case 'save': return Heart;
      case 'message': return MessageCircle;
      case 'application': return FileText;
      default: return Clock;
    }
  };
  
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'view': return 'text-blue-600 bg-blue-100';
      case 'save': return 'text-red-600 bg-red-100';
      case 'message': return 'text-green-600 bg-green-100';
      case 'application': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  
  return (
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const Icon = getActivityIcon(activity.type);
        const colorClass = getActivityColor(activity.type);
        
        return (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className={`p-2 rounded-full ${colorClass}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {activity.title}
              </p>
              <p className="text-sm text-gray-500">
                {activity.description}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {activity.timestamp.toLocaleDateString()} at {activity.timestamp.toLocaleTimeString()}
              </p>
            </div>
            {activity.propertyId && (
              <Badge variant="outline" className="text-xs">
                Property #{activity.propertyId}
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Property listing progress for landlords
export const PropertyListingProgress = ({ 
  propertyData 
}: { 
  propertyData: {
    basicInfo: boolean;
    photos: boolean;
    details: boolean;
    pricing: boolean;
    amenities: boolean;
  };
}) => {
  const steps = [
    { key: 'basicInfo', label: 'Basic Info', icon: Building },
    { key: 'photos', label: 'Photos', icon: Camera },
    { key: 'details', label: 'Details', icon: FileText },
    { key: 'pricing', label: 'Pricing', icon: User },
    { key: 'amenities', label: 'Amenities', icon: CheckCircle },
  ];
  
  const completedCount = Object.values(propertyData).filter(Boolean).length;
  const progress = (completedCount / steps.length) * 100;
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Listing Progress</h3>
        <Badge variant={progress === 100 ? "default" : "secondary"}>
          {completedCount}/{steps.length}
        </Badge>
      </div>
      
      <Progress value={progress} className="mb-6" />
      
      <div className="grid grid-cols-5 gap-4">
        {steps.map((step) => {
          const isCompleted = propertyData[step.key as keyof typeof propertyData];
          const Icon = step.icon;
          
          return (
            <div key={step.key} className="text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <Icon className="w-6 h-6" />
              </div>
              <p className={`text-xs ${
                isCompleted ? 'text-green-700 font-medium' : 'text-gray-500'
              }`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
      
      {progress < 100 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            Complete all sections to publish your listing
          </p>
        </div>
      )}
    </Card>
  );
};

// Loading skeleton for cards
export const CardSkeleton = ({ count = 1 }: { count?: number }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="p-4 animate-pulse">
          <div className="flex space-x-4">
            <div className="w-24 h-24 bg-gray-300 rounded-lg" />
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-gray-300 rounded w-3/4" />
              <div className="h-3 bg-gray-300 rounded w-1/2" />
              <div className="h-3 bg-gray-300 rounded w-1/4" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// Animated counter with progress
export const AnimatedProgressCounter = ({ 
  current, 
  target, 
  label, 
  duration = 2000 
}: {
  current: number;
  target: number;
  label: string;
  duration?: number;
}) => {
  const [count, setCount] = useState(current);
  const progress = (count / target) * 100;
  
  useEffect(() => {
    if (current === count) return;
    
    const increment = (target - current) / (duration / 50);
    const timer = setInterval(() => {
      setCount(prev => {
        const next = prev + increment;
        if (next >= target) {
          clearInterval(timer);
          return target;
        }
        return next;
      });
    }, 50);
    
    return () => clearInterval(timer);
  }, [current, target, duration]);
  
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-blue-600 mb-2">
        {Math.round(count).toLocaleString()}
      </div>
      <Progress value={progress} className="mb-2" />
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
};

export default {
  MultiStepProgress,
  FileUploadProgress,
  ProfileCompletionProgress,
  SearchProgress,
  ActivityTimeline,
  PropertyListingProgress,
  CardSkeleton,
  AnimatedProgressCounter
}; 