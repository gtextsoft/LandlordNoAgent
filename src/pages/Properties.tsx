import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Home, Bed, Bath, Heart, ChevronLeft, ChevronRight, MessageCircle, Map, List } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSavedProperties } from "@/hooks/useSavedProperties";
import { supabase, Property } from "@/lib/supabase";
import LoadingSpinner from "@/components/LoadingSpinner";
import Layout from "@/components/Layout";
import { useLoadingState } from "@/hooks/useLoadingState";
import { handleError } from "@/utils/errorHandling";
import { useToast } from "@/hooks/use-toast";
import EnhancedSearch from "@/components/EnhancedSearch";
import ImprovedPropertyCard from "@/components/ImprovedPropertyCard";
import PropertyMapView from "@/components/PropertyMapView";
import MobileOptimizedPropertyCard from "@/components/MobileOptimizedPropertyCard";
import ResponsiveGrid from "@/components/ResponsiveGrid";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { withErrorBoundary, SectionErrorBoundary } from "@/utils/errorBoundaryUtils";


const Properties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const { loading, setLoading } = useLoadingState();
  const [locationFilter, setLocationFilter] = useState("");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all");
  const [priceRangeFilter, setPriceRangeFilter] = useState("all");
  const [bedroomsFilter, setBedroomsFilter] = useState("all");
  const [bathroomsFilter, setBathroomsFilter] = useState("");
  const [amenitiesFilter, setAmenitiesFilter] = useState<string[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const propertiesPerPage = 15;
  const { profile } = useAuth();
  const { savedProperties, toggleSavedProperty } = useSavedProperties();
  const { toast } = useToast();
  const [comparedProperties, setComparedProperties] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Debounce search query to improve performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchProperties();
  }, []);

  // Memoized filtering for better performance
  const filteredPropertiesMemo = useMemo(() => {
    let filtered = properties;

    // Search query filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(property =>
        property.title?.toLowerCase().includes(query) ||
        property.location?.toLowerCase().includes(query) ||
        property.description?.toLowerCase().includes(query)
      );
    }

    if (locationFilter) {
      const location = locationFilter.toLowerCase();
      filtered = filtered.filter(property =>
        property.location?.toLowerCase().includes(location)
      );
    }

    if (propertyTypeFilter && propertyTypeFilter !== "all") {
      if (propertyTypeFilter === "studio") {
        filtered = filtered.filter(property => !property.bedrooms || property.bedrooms === 0);
      } else if (propertyTypeFilter === "apartment") {
        filtered = filtered.filter(property => property.bedrooms && property.bedrooms >= 1 && property.bedrooms <= 3);
      } else if (propertyTypeFilter === "house") {
        filtered = filtered.filter(property => property.bedrooms && property.bedrooms >= 3);
      }
    }

    if (priceRangeFilter && priceRangeFilter !== "all") {
      const [min, max] = priceRangeFilter.split('-').map(Number);
      filtered = filtered.filter(property => {
        if (max) {
          return property.price >= min && property.price <= max;
        } else {
          return property.price >= min;
        }
      });
    }

    if (bedroomsFilter && bedroomsFilter !== "all") {
      if (bedroomsFilter === "studio") {
        filtered = filtered.filter(property => !property.bedrooms || property.bedrooms === 0);
      } else {
        const bedrooms = parseInt(bedroomsFilter);
        filtered = filtered.filter(property => property.bedrooms === bedrooms);
      }
    }

    // Bathrooms filter
    if (bathroomsFilter && bathroomsFilter !== "") {
      const bathrooms = parseInt(bathroomsFilter);
      if (!isNaN(bathrooms)) {
        filtered = filtered.filter(property => (property.bathrooms || 0) >= bathrooms);
      }
    }

    // Amenities filter
    if (amenitiesFilter && amenitiesFilter.length > 0) {
      filtered = filtered.filter(property => {
        if (!property.amenities || !Array.isArray(property.amenities)) return false;
        return amenitiesFilter.every(amenity => property.amenities.includes(amenity));
      });
    }

    return filtered;
  }, [properties, debouncedSearchQuery, locationFilter, propertyTypeFilter, priceRangeFilter, bedroomsFilter, bathroomsFilter, amenitiesFilter]);

  // Update filtered properties when memo changes
  useEffect(() => {
    setFilteredProperties(filteredPropertiesMemo);
    setCurrentPage(1);
  }, [filteredPropertiesMemo]);

  const fetchProperties = async (page: number = 1, pageSize: number = 20) => {
    try {
      setLoading(true);
      
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // Optimized property fetch with pagination and minimal data
      const { data, error, count } = await supabase
        .from('properties')
        .select(`
          *,
          profiles!properties_landlord_id_fkey (
            id,
            full_name,
            email,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('status', 'active')
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type cast data to Property[] to fix type mismatch with profiles property
      setProperties((data || []) as Property[]);
      setTotalCount(count || 0);

      // Fetch chat rooms for authenticated users (separate query for performance)
      if (profile) {
        const { data: chatData, error: chatError } = await supabase
          .from('chat_rooms')
          .select(`
            id,
            property_id,
            landlord_id,
            renter_id,
            created_at,
            properties!chat_rooms_property_id_fkey (
              id,
              title,
              price,
              location
            )
          `)
          .eq('renter_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(10); // Limit recent chat rooms

        if (chatError) throw chatError;
        setChatRooms(chatData || []);
      }
    } catch (error: Error | unknown) {
      handleError(error, toast, 'Error fetching data');
      // Initialize with empty arrays on error to maintain valid state
      setProperties([]);
      setChatRooms([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced search handlers with useCallback for performance
  const handleSearch = useCallback((query: string, filters: {
    location?: string;
    propertyType?: string;
    bedrooms?: string;
    bathrooms?: string;
    amenities?: string[];
    priceRange?: [number, number];
  }) => {
    setSearchQuery(query);
    // Apply enhanced filters
    if (filters.location) setLocationFilter(filters.location);
    if (filters.propertyType) setPropertyTypeFilter(filters.propertyType);
    if (filters.bedrooms) setBedroomsFilter(filters.bedrooms);
    if (filters.bathrooms) setBathroomsFilter(filters.bathrooms);
    if (filters.amenities) setAmenitiesFilter(filters.amenities);
    // Handle price range
    if (filters.priceRange && (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000000)) {
      setPriceRangeFilter(`${filters.priceRange[0]}-${filters.priceRange[1]}`);
    }
  }, []);

  const handlePropertySelect = useCallback((property: Property) => {
    setSelectedProperty(property);
  }, []);

  // Memoized pagination calculations
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredProperties.length / propertiesPerPage);
    const startIndex = (currentPage - 1) * propertiesPerPage;
    const endIndex = startIndex + propertiesPerPage;
    const currentProperties = filteredProperties.slice(startIndex, endIndex);
    
    return { totalPages, currentProperties };
  }, [filteredProperties, currentPage, propertiesPerPage]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCompareChange = useCallback((propertyId: string, checked: boolean) => {
    setComparedProperties(prev => {
      if (checked) {
        return [...prev, propertyId];
      } else {
        return prev.filter(id => id !== propertyId);
      }
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Public header for non-authenticated users
  const PublicHeader = () => (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-900">
              LandlordNoAgent
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-gray-900 font-medium">
              Home
            </Link>
            <Link to="/properties" className="text-gray-900 font-medium">
              Browse
            </Link>
            <Link to="#" className="text-gray-600 hover:text-gray-900 font-medium">
              About
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-gray-900 font-medium">
              Contact
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost" className="text-gray-600 font-medium">
                Sign In
              </Button>
            </Link>
            <Link to="/login">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 rounded-lg">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );

  // Main content component
  const PropertiesContent = () => (
    <>
      {/* Hero Section - Different for authenticated vs non-authenticated users */}
      {profile ? (
        // Authenticated user dashboard header
        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-white mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Welcome back, {profile.full_name}!
              </h1>
              <p className="text-xl text-blue-100">
                Find your perfect home and connect with landlords
              </p>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Search className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{properties.length}</h3>
                  <p className="text-gray-600">Properties Available</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Heart className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{savedProperties.length}</h3>
                  <p className="text-gray-600">Saved Properties</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <MessageCircle className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{chatRooms.length}</h3>
                  <p className="text-gray-600">Active Conversations</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/saved-properties">
                <Button variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50">
                  <Heart className="w-4 h-4 mr-2" />
                  View Saved Properties ({savedProperties.length})
                </Button>
              </Link>
            </div>
          </div>
        </section>
      ) : (
        // Non-authenticated user hero section
        <section className="bg-gray-900 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Most Loved Homes
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              See what others are falling in love with. These listings are getting lots of attention.
            </p>
          </div>
        </section>
      )}

      {/* Enhanced Search Filters */}
      <section className="bg-gray-50 py-8 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EnhancedSearch 
            onSearch={handleSearch}
            placeholder="Search properties by location, type, or features..."
            showFilters={true}
          />
        </div>
      </section>

      {/* Properties Section with View Toggle */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with View Toggle */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {filteredProperties.length} Properties Found
              </h2>
              <p className="text-gray-600 mt-1">
                Showing results for your search criteria
              </p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-4">
              <div className="flex rounded-lg bg-gray-100 p-1">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="flex items-center px-4"
                >
                  <List className="w-4 h-4 mr-2" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className="flex items-center px-4"
                >
                  <Map className="w-4 h-4 mr-2" />
                  Map
                </Button>
              </div>
            </div>
          </div>

          {filteredProperties.length === 0 ? (
            <div className="text-center py-16">
              <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties found</h3>
              <p className="text-gray-600">Try adjusting your search filters or check back later.</p>
            </div>
          ) : viewMode === 'map' ? (
            /* Map View */
            <div className="h-screen -mx-4 sm:-mx-6 lg:-mx-8">
              <PropertyMapView
                properties={filteredProperties}
                onPropertySelect={handlePropertySelect}
                selectedProperty={selectedProperty}
              />
            </div>
          ) : (
            /* List View with Improved Property Cards */
            <>
              {/* Desktop and Tablet View */}
              <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginationData.currentProperties.map((property) => (
                  <ImprovedPropertyCard
                    key={property.id}
                    property={property}
                    variant="default"
                    showActions={true}
                    showVirtualTour={false}
                    onCompareChange={handleCompareChange}
                    isCompared={comparedProperties.includes(property.id)}
                  />
                ))}
              </div>

              {/* Mobile View */}
              <div className="md:hidden">
                <ResponsiveGrid mobileColumns={1} gap="md">
                  {paginationData.currentProperties.map((property) => (
                    <MobileOptimizedPropertyCard
                      key={property.id}
                      property={property}
                      onSave={() => toggleSavedProperty(property.id)}
                      isSaved={savedProperties.includes(property.id)}
                      onContact={() => console.log('Contact:', property.id)}
                      onShare={() => console.log('Share:', property.id)}
                    />
                  ))}
                </ResponsiveGrid>
              </div>

              {/* Pagination */}
              {paginationData.totalPages > 1 && (
                <div className="flex items-center justify-center mt-12 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Prev
                  </Button>
                  
                  {Array.from({ length: Math.min(8, paginationData.totalPages) }, (_, i) => {
                    let pageNum;
                    if (paginationData.totalPages <= 8) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= paginationData.totalPages - 3) {
                      pageNum = paginationData.totalPages - 7 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 p-0 ${
                          currentPage === pageNum 
                            ? 'bg-teal-700 hover:bg-teal-800 text-white' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === paginationData.totalPages}
                    className="flex items-center bg-teal-700 hover:bg-teal-800 text-white border-teal-700"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Floating Compare Button */}
          {comparedProperties.length >= 2 && (
            <div className="fixed bottom-8 right-8 z-50">
              <Button size="lg" className="bg-blue-600 text-white shadow-lg" onClick={() => setCompareModalOpen(true)}>
                Compare ({comparedProperties.length})
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Comparison Modal */}
      <Dialog open={compareModalOpen} onOpenChange={setCompareModalOpen}>
        <DialogContent className="max-w-5xl w-full">
          <DialogHeader>
            <DialogTitle>Compare Properties</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr>
                  <th className="p-2 border-b">Feature</th>
                  {comparedProperties.map(id => {
                    const prop = filteredProperties.find(p => p.id === id) || properties.find(p => p.id === id);
                    return (
                      <th key={id} className="p-2 border-b text-center">
                        <div className="flex flex-col items-center">
                          <img src={prop?.photo_url || '/placeholder.svg'} alt={prop?.title} className="w-24 h-20 object-cover rounded mb-2" />
                          <span className="font-semibold">{prop?.title}</span>
                          <button className="text-xs text-red-500 mt-1" onClick={() => setComparedProperties(prev => prev.filter(pid => pid !== id))}>Remove</button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 font-medium">Price</td>
                  {comparedProperties.map(id => {
                    const prop = filteredProperties.find(p => p.id === id) || properties.find(p => p.id === id);
                    return <td key={id} className="p-2 text-center">₦{prop?.price?.toLocaleString()}</td>;
                  })}
                </tr>
                <tr>
                  <td className="p-2 font-medium">Location</td>
                  {comparedProperties.map(id => {
                    const prop = filteredProperties.find(p => p.id === id) || properties.find(p => p.id === id);
                    return <td key={id} className="p-2 text-center">{prop?.location}</td>;
                  })}
                </tr>
                <tr>
                  <td className="p-2 font-medium">Bedrooms</td>
                  {comparedProperties.map(id => {
                    const prop = filteredProperties.find(p => p.id === id) || properties.find(p => p.id === id);
                    return <td key={id} className="p-2 text-center">{prop?.bedrooms}</td>;
                  })}
                </tr>
                <tr>
                  <td className="p-2 font-medium">Bathrooms</td>
                  {comparedProperties.map(id => {
                    const prop = filteredProperties.find(p => p.id === id) || properties.find(p => p.id === id);
                    return <td key={id} className="p-2 text-center">{prop?.bathrooms}</td>;
                  })}
                </tr>
                <tr>
                  <td className="p-2 font-medium">Amenities</td>
                  {comparedProperties.map(id => {
                    const prop = filteredProperties.find(p => p.id === id) || properties.find(p => p.id === id);
                    return <td key={id} className="p-2 text-center">{prop?.amenities?.join(', ') || '-'}</td>;
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  // For authenticated users, use Layout component with sidebar
  if (profile) {
    return (
      <Layout>
        <SectionErrorBoundary name="PropertiesContent" fallbackUI={
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Unable to load properties</h2>
            <p className="mb-4">We're having trouble loading the properties. Please try again later.</p>
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
          </div>
        }>
          <PropertiesContent />
        </SectionErrorBoundary>
      </Layout>
    );
  }

  // For non-authenticated users, show public header
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <SectionErrorBoundary name="PublicPropertiesContent">
        <PropertiesContent />
      </SectionErrorBoundary>
    </div>
  );
};

// Export the component wrapped with an error boundary
export default withErrorBoundary(Properties, {
  componentName: 'Properties',
  errorHandler: (error, errorInfo) => {
    console.error('Properties page error:', error, errorInfo);
  }
});