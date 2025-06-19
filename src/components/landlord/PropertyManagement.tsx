import { useState } from "react";
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
  GitCompare
} from "lucide-react";
import { Property } from "@/lib/supabase";
import PropertyCard from "@/components/PropertyCard";
import PropertyComparison from "./PropertyComparison";
import { useToast } from "@/hooks/use-toast";

interface PropertyManagementProps {
  properties: Property[];
  onToggleStatus: (propertyId: string, currentStatus: string) => void;
  onDelete: (propertyId: string) => void;
  onUpdate: () => void;
  loading?: boolean;
}

const PropertyManagement = ({ properties, onToggleStatus, onDelete, onUpdate, loading = false }: PropertyManagementProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  
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
            
            {/* Bulk Actions */}
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
              <div key={property.id} className="relative">
                {/* Selection Checkbox */}
                <div className="absolute top-3 left-3 z-10">
                  <Checkbox
                    checked={selectedProperties.has(property.id)}
                    onCheckedChange={() => handleSelectProperty(property.id)}
                    className="bg-white/90 backdrop-blur-sm"
                  />
                </div>
                
            <PropertyCard
              property={property}
              showActions={true}
              showDeleteButton={true}
              showEditButton={true}
              showSaveButton={false}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
              </div>
          ))}
        </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyManagement;
