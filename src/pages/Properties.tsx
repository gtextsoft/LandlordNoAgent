import { useState, useEffect } from "react";
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
import { handleError } from "@/utils/shared";
import { useToast } from "@/hooks/use-toast";
import EnhancedSearch from "@/components/EnhancedSearch";
import ImprovedPropertyCard from "@/components/ImprovedPropertyCard";
import PropertyMapView from "@/components/PropertyMapView";

const Properties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const { loading, setLoading } = useLoadingState();
  const [locationFilter, setLocationFilter] = useState("");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all");
  const [priceRangeFilter, setPriceRangeFilter] = useState("all");
  const [bedroomsFilter, setBedroomsFilter] = useState("all");
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const propertiesPerPage = 15;
  const { profile } = useAuth();
  const { savedProperties, toggleSavedProperty } = useSavedProperties();
  const { toast } = useToast();

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [locationFilter, propertyTypeFilter, priceRangeFilter, bedroomsFilter, properties, searchQuery]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      
      // Fetch properties
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          profiles!properties_landlord_id_fkey (*)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);

      // Fetch chat rooms for authenticated users
      if (profile) {
        const { data: chatData, error: chatError } = await supabase
          .from('chat_rooms')
          .select(`
            *,
            properties (*, profiles!properties_landlord_id_fkey (*)),
            landlord_profile:profiles!chat_rooms_landlord_id_fkey (*),
            renter_profile:profiles!chat_rooms_renter_id_fkey (*)
          `)
          .eq('renter_id', profile.id)
          .order('created_at', { ascending: false });

        if (chatError) throw chatError;
        setChatRooms((chatData as any) || []);
      }
    } catch (error: any) {
      handleError(error, toast, 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    let filtered = properties;

    // Search query filter
    if (searchQuery) {
      filtered = filtered.filter(property =>
        property.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (locationFilter) {
      filtered = filtered.filter(property =>
        property.location?.toLowerCase().includes(locationFilter.toLowerCase())
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

    setFilteredProperties(filtered);
    setCurrentPage(1);
  };

  // Enhanced search handlers
  const handleSearch = (query: string, filters: any) => {
    setSearchQuery(query);
    // Apply enhanced filters
    if (filters.location) setLocationFilter(filters.location);
    if (filters.propertyType) setPropertyTypeFilter(filters.propertyType);
    if (filters.bedrooms) setBedroomsFilter(filters.bedrooms);
    if (filters.bathrooms) {
      // Handle bathrooms filter if needed
    }
    // Handle price range
    if (filters.priceRange && filters.priceRange[0] > 0 || filters.priceRange[1] < 5000000) {
      setPriceRangeFilter(`${filters.priceRange[0]}-${filters.priceRange[1]}`);
    }
  };

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
  };

  const totalPages = Math.ceil(filteredProperties.length / propertiesPerPage);
  const startIndex = (currentPage - 1) * propertiesPerPage;
  const endIndex = startIndex + propertiesPerPage;
  const currentProperties = filteredProperties.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {currentProperties.map((property) => (
                  <ImprovedPropertyCard
                    key={property.id}
                    property={property}
                    variant="default"
                    showActions={true}
                    showVirtualTour={false}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
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
                  
                  {Array.from({ length: Math.min(8, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 8) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 7 + i;
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
                    disabled={currentPage === totalPages}
                    className="flex items-center bg-teal-700 hover:bg-teal-800 text-white border-teal-700"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );

  // For authenticated users, use Layout component with sidebar
  if (profile) {
    return (
      <Layout>
        <PropertiesContent />
      </Layout>
    );
  }

  // For non-authenticated users, show public header
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <PropertiesContent />
    </div>
  );
};

export default Properties; 