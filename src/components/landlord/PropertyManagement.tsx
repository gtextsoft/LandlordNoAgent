import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Home, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckSquare, 
  Square, 
  Trash2, 
  Eye, 
  EyeOff, 
  Download,
  RefreshCw,
  GitCompare,
  Wrench,
  Archive
} from "lucide-react";
import { Property } from "@/lib/supabase";
import PropertyCard from "@/components/PropertyCard";
import PropertyComparison from "./PropertyComparison";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PropertyStatusBadge from "@/components/PropertyStatusBadge";

interface PropertyManagementProps {
  properties: Property[];
  onToggleStatus: (propertyId: string, currentStatus: string) => void;
  onDelete: (propertyId: string) => void;
  onUpdate: () => void;
  loading?: boolean;
}

interface StatusTransition {
  nextStatus: string;
  label: string;
  description: string;
  icon: any;
  requiresConfirmation?: boolean;
}

const PropertyManagement = ({ properties, onToggleStatus, onDelete, onUpdate, loading = false }: PropertyManagementProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [applicationsByProperty, setApplicationsByProperty] = useState<Record<string, any[]>>({});
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedTransition, setSelectedTransition] = useState<StatusTransition | null>(null);
  
  const { toast } = useToast();

  const filteredProperties = properties.filter((property) => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || property.status === statusFilter;
    
    const matchesPriceRange = (!priceRange.min || property.price >= Number(priceRange.min)) &&
                             (!priceRange.max || property.price <= Number(priceRange.max));
    
    return matchesSearch && matchesStatus && matchesPriceRange;
  });

  const handleSelectAll = () => {
    if (selectedProperties.size === filteredProperties.length) {
      setSelectedProperties(new Set());
    } else {
      setSelectedProperties(new Set(filteredProperties.map(p => p.id)));
    }
  };

  const handleSelectProperty = (propertyId: string) => {
    const newSelected = new Set(selectedProperties);
    if (newSelected.has(propertyId)) {
      newSelected.delete(propertyId);
    } else {
      newSelected.add(propertyId);
    }
    setSelectedProperties(newSelected);
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete' | 'export') => {
    if (selectedProperties.size === 0) {
      toast({
        title: "No Properties Selected",
        description: "Please select at least one property to perform bulk actions.",
        variant: "destructive",
      });
      return;
    }

    setBulkActionLoading(true);

    try {
      const selectedIds = Array.from(selectedProperties);
      
      switch (action) {
        case 'activate':
          for (const id of selectedIds) {
            const property = properties.find(p => p.id === id);
            if (property?.status !== 'active') {
              await onToggleStatus(id, property?.status || 'inactive');
            }
          }
          toast({
            title: "Properties Activated",
            description: `${selectedIds.length} properties have been activated.`,
          });
          break;
          
        case 'deactivate':
          for (const id of selectedIds) {
            const property = properties.find(p => p.id === id);
            if (property?.status === 'active') {
              await onToggleStatus(id, 'active');
            }
          }
          toast({
            title: "Properties Deactivated",
            description: `${selectedIds.length} properties have been deactivated.`,
          });
          break;
          
        case 'delete':
          if (confirm(`Are you sure you want to delete ${selectedIds.length} properties? This action cannot be undone.`)) {
            for (const id of selectedIds) {
              await onDelete(id);
            }
            toast({
              title: "Properties Deleted",
              description: `${selectedIds.length} properties have been deleted.`,
            });
          }
          break;
          
        case 'export':
          const selectedPropertiesData = properties.filter(p => selectedIds.includes(p.id));
          const csvContent = generateCSV(selectedPropertiesData);
          downloadCSV(csvContent, 'selected_properties.csv');
          toast({
            title: "Export Complete",
            description: `${selectedIds.length} properties exported to CSV.`,
          });
          break;
      }
      
      setSelectedProperties(new Set());
      onUpdate();
    } catch (error) {
      console.error('Bulk action error:', error);
      toast({
        title: "Action Failed",
        description: "An error occurred while performing the bulk action.",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const generateCSV = (properties: Property[]) => {
    const headers = ['Title', 'Location', 'Price', 'Bedrooms', 'Bathrooms', 'Status', 'Created Date'];
    const rows = properties.map(p => [
      p.title,
      p.location || '',
      p.price,
      p.bedrooms || 0,
      p.bathrooms || 0,
      p.status,
      new Date(p.created_at).toLocaleDateString()
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriceRange({ min: "", max: "" });
  };

  useEffect(() => {
    const fetchApplications = async () => {
      const result: Record<string, any[]> = {};
      for (const property of properties) {
        const { data, error } = await supabase
          .from('rental_applications')
          .select('*')
          .eq('property_id', property.id);
        if (!error && data && data.length > 0) {
          result[property.id] = data;
        }
      }
      setApplicationsByProperty(result);
    };
    if (properties.length > 0) fetchApplications();
  }, [properties]);

  const handleApplicationAction = async (applicationId: string, action: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('rental_applications')
        .update({ status: action })
        .eq('id', applicationId);
      if (error) throw error;
      toast({ title: `Application ${action}`, description: `Application has been ${action}.`, variant: 'default' });
      // Refresh applications
      const updatedApplicationsByProperty = { ...applicationsByProperty };
      for (const propertyId in updatedApplicationsByProperty) {
        updatedApplicationsByProperty[propertyId] = updatedApplicationsByProperty[propertyId].map(app =>
          app.id === applicationId ? { ...app, status: action } : app
        );
      }
      setApplicationsByProperty(updatedApplicationsByProperty);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update application.', variant: 'destructive' });
    }
  };

  const getAvailableTransitions = (currentStatus: string): StatusTransition[] => {
    switch (currentStatus) {
      case 'pending':
        return [
          {
            nextStatus: 'active',
            label: 'Activate',
            description: 'Make the property visible to potential renters',
            icon: Eye,
            requiresConfirmation: true
          },
          {
            nextStatus: 'inactive',
            label: 'Deactivate',
            description: 'Hide the property from potential renters',
            icon: EyeOff
          }
        ];
      case 'active':
        return [
          {
            nextStatus: 'rented',
            label: 'Mark as Rented',
            description: 'Property has been rented out',
            icon: Home,
            requiresConfirmation: true
          },
          {
            nextStatus: 'inactive',
            label: 'Deactivate',
            description: 'Hide the property from potential renters',
            icon: EyeOff
          },
          {
            nextStatus: 'maintenance',
            label: 'Under Maintenance',
            description: 'Property needs repairs or maintenance',
            icon: Wrench
          },
          {
            nextStatus: 'archived',
            label: 'Archive',
            description: 'Archive this property listing',
            icon: Archive,
            requiresConfirmation: true
          }
        ];
      case 'rented':
        return [
          {
            nextStatus: 'active',
            label: 'Available Again',
            description: 'Make the property available for rent',
            icon: Eye,
            requiresConfirmation: true
          },
          {
            nextStatus: 'maintenance',
            label: 'Under Maintenance',
            description: 'Property needs repairs or maintenance',
            icon: Wrench
          },
          {
            nextStatus: 'archived',
            label: 'Archive',
            description: 'Archive this property listing',
            icon: Archive,
            requiresConfirmation: true
          }
        ];
      case 'inactive':
        return [
          {
            nextStatus: 'active',
            label: 'Activate',
            description: 'Make the property visible to potential renters',
            icon: Eye
          },
          {
            nextStatus: 'archived',
            label: 'Archive',
            description: 'Archive this property listing',
            icon: Archive,
            requiresConfirmation: true
          }
        ];
      case 'maintenance':
        return [
          {
            nextStatus: 'active',
            label: 'Mark as Available',
            description: 'Maintenance complete, make property available',
            icon: Eye
          },
          {
            nextStatus: 'inactive',
            label: 'Deactivate',
            description: 'Hide the property from potential renters',
            icon: EyeOff
          },
          {
            nextStatus: 'archived',
            label: 'Archive',
            description: 'Archive this property listing',
            icon: Archive,
            requiresConfirmation: true
          }
        ];
      case 'archived':
        return [
          {
            nextStatus: 'active',
            label: 'Restore',
            description: 'Restore and make property active',
            icon: RefreshCw,
            requiresConfirmation: true
          }
        ];
      default:
        return [];
    }
  };

  const handleStatusChange = async (propertyId: string, transition: StatusTransition) => {
    if (transition.requiresConfirmation) {
      setSelectedPropertyId(propertyId);
      setSelectedTransition(transition);
      setShowStatusDialog(true);
    } else {
      await updatePropertyStatus(propertyId, transition.nextStatus);
    }
  };

  const updatePropertyStatus = async (propertyId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ status: newStatus })
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Property status has been updated to ${newStatus}`,
      });

      onUpdate?.();
    } catch (error: any) {
      console.error('Error updating property status:', error);
      toast({
        title: "Error",
        description: "Failed to update property status",
        variant: "destructive",
      });
    } finally {
      setShowStatusDialog(false);
    }
  };

  // Show comparison view if enabled
  if (showComparison) {
    return (
      <PropertyComparison 
        properties={properties}
        onClose={() => setShowComparison(false)}
      />
    );
  }

  // Loading skeleton
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center">
                <Home className="w-5 h-5 mr-2" />
                Your Properties
              </CardTitle>
              <div className="h-4 bg-gray-200 rounded w-32 mt-1 animate-pulse"></div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="h-10 bg-gray-200 rounded w-64 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-gray-200 rounded-t-lg"></div>
                <CardContent className="p-4 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-200 rounded flex-1"></div>
                    <div className="h-8 bg-gray-200 rounded flex-1"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (properties.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No properties yet</h4>
          <p className="text-gray-600 mb-6">
            Start by creating your first property listing to attract potential renters.
          </p>
          <Link to="/landlord/new">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Listing
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          {/* Header with title and bulk actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center">
              <Home className="w-5 h-5 mr-2" />
              Your Properties
                {selectedProperties.size > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedProperties.size} selected
                  </Badge>
                )}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {filteredProperties.length} of {properties.length} {properties.length === 1 ? 'property' : 'properties'}
                {searchTerm && ` matching "${searchTerm}"`}
              </p>
            </div>
            
            Bulk Actions
            {selectedProperties.size > 0 && (
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={bulkActionLoading}>
                      <MoreVertical className="w-4 h-4 mr-2" />
                      Bulk Actions
                      {bulkActionLoading && <RefreshCw className="w-4 h-4 ml-2 animate-spin" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => handleBulkAction('activate')}>
                      <Eye className="w-4 h-4 mr-2" />
                      Activate Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('deactivate')}>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Deactivate Selected
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleBulkAction('export')}>
                      <Download className="w-4 h-4 mr-2" />
                      Export to CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowComparison(true)}>
                      <GitCompare className="w-4 h-4 mr-2" />
                      Compare Properties
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleBulkAction('delete')}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedProperties(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search properties by title or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Price Range */}
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min price"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                className="w-28"
              />
              <Input
                type="number"
                placeholder="Max price"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                className="w-28"
              />
            </div>
            
            {/* Clear Filters */}
            {(searchTerm || statusFilter !== "all" || priceRange.min || priceRange.max) && (
              <Button variant="outline" onClick={clearFilters} size="sm">
                Clear Filters
              </Button>
            )}
          </div>

          {/* Select All */}
          {filteredProperties.length > 0 && (
            <div className="flex items-center gap-2 pb-2 border-b">
              <Checkbox
                id="select-all"
                checked={selectedProperties.size === filteredProperties.length}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Select all {filteredProperties.length} properties
              </label>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredProperties.length === 0 ? (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No properties found</p>
            <p className="text-sm text-gray-400">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <div key={property.id} className="mb-8">
              <PropertyCard property={property} />
              {/* Rental Applications Section */}
              {applicationsByProperty[property.id] && applicationsByProperty[property.id].length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mt-4 border">
                  <h4 className="text-lg font-semibold mb-2 text-gray-800">Rental Applications</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Applicant</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Documents</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applicationsByProperty[property.id].map((app) => (
                        <tr key={app.id} className="border-b">
                          <td className="p-2">{app.full_name}</td>
                          <td className="p-2">{app.email}</td>
                          <td className="p-2">{app.status}</td>
                          <td className="p-2">
                            {Array.isArray(app.document_urls) && app.document_urls.length > 0 ? (
                              <ul>
                                {app.document_urls.map((url: string, idx: number) => (
                                  <li key={idx}>
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Document {idx + 1}</a>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-gray-400">No documents</span>
                            )}
                          </td>
                          <td className="p-2">
                            {app.status === 'pending' && (
                              <>
                                <button
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded mr-2"
                                  onClick={() => handleApplicationAction(app.id, 'approved')}
                                >
                                  Approve
                                </button>
                                <button
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                                  onClick={() => handleApplicationAction(app.id, 'rejected')}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyManagement;
