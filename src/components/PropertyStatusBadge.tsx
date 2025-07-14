import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle2, 
  Home, 
  XCircle, 
  Wrench, 
  Archive,
  FileText,
  HourglassIcon,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface PropertyStatusBadgeProps {
  status: string;
  showIcon?: boolean;
}

const PropertyStatusBadge = ({ status, showIcon = true }: PropertyStatusBadgeProps) => {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      // Property listing statuses
      case 'pending':
        return { 
          label: 'Pending Review', 
          variant: 'secondary' as const,
          icon: Clock,
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        };
      case 'active':
        return { 
          label: 'Active', 
          variant: 'default' as const,
          icon: CheckCircle2,
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        };
      case 'rented':
        return { 
          label: 'Rented', 
          variant: 'outline' as const,
          icon: Home,
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        };
      case 'inactive':
        return { 
          label: 'Inactive', 
          variant: 'secondary' as const,
          icon: XCircle,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
        };
      case 'maintenance':
        return { 
          label: 'Under Maintenance', 
          variant: 'secondary' as const,
          icon: Wrench,
          className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
        };
      case 'archived':
        return { 
          label: 'Archived', 
          variant: 'outline' as const,
          icon: Archive,
          className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
        };
      
      // Application statuses
      case 'application_pending':
        return {
          label: 'Application Pending',
          variant: 'secondary' as const,
          icon: HourglassIcon,
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        };
      case 'application_submitted':
        return {
          label: 'Application Submitted',
          variant: 'secondary' as const,
          icon: FileText,
          className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
        };
      case 'application_approved':
        return {
          label: 'Application Approved',
          variant: 'default' as const,
          icon: CheckCircle,
          className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
        };
      case 'application_rejected':
        return {
          label: 'Application Rejected',
          variant: 'destructive' as const,
          icon: AlertCircle,
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        };
      default:
        return { 
          label: status, 
          variant: 'secondary' as const,
          icon: Clock,
          className: ''
        };
    }
  };

  const { label, variant, icon: Icon, className } = getStatusConfig(status);

  return (
    <Badge variant={variant} className={`flex items-center gap-1 ${className}`}>
      {showIcon && <Icon className="w-3 h-3" />}
      {label}
    </Badge>
  );
};

export default PropertyStatusBadge;
