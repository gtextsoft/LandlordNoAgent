
import { Badge } from '@/components/ui/badge';

interface PropertyStatusBadgeProps {
  status: string;
}

const PropertyStatusBadge = ({ status }: PropertyStatusBadgeProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', variant: 'secondary' as const };
      case 'active':
        return { label: 'Active', variant: 'default' as const };
      case 'rented':
        return { label: 'Rented', variant: 'outline' as const };
      case 'inactive':
        return { label: 'Inactive', variant: 'secondary' as const };
      case 'suspended':
        return { label: 'Suspended', variant: 'destructive' as const };
      default:
        return { label: status, variant: 'secondary' as const };
    }
  };

  const { label, variant } = getStatusConfig(status);

  return <Badge variant={variant}>{label}</Badge>;
};

export default PropertyStatusBadge;
