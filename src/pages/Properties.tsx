import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Home, Bed, Bath, Heart, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSavedProperties } from "@/hooks/useSavedProperties";
import { supabase, Property } from "@/lib/supabase";
import LoadingSpinner from "@/components/LoadingSpinner";
import Layout from "@/components/Layout";
import { useLoadingState } from "@/hooks/useLoadingState";
import { handleError } from "@/utils/shared";
import { useToast } from "@/hooks/use-toast";

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
  const propertiesPerPage = 15;
  const { profile } = useAuth();
  const { savedProperties, toggleSavedProperty } = useSavedProperties();
  const { toast } = useToast();

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [locationFilter, propertyTypeFilter, priceRangeFilter, bedroomsFilter, properties]);

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

      {/* Search Filters */}
      <section className="bg-gray-50 py-8 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Enter your location"
                    className="pl-10 bg-gray-50 border-gray-200"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                  <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
                    <SelectTrigger className="pl-10 bg-gray-50 border-gray-200">
                      <SelectValue placeholder="Apartment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <Select value={priceRangeFilter} onValueChange={setPriceRangeFilter}>
                  <SelectTrigger className="bg-gray-50 border-gray-200">
                    <SelectValue placeholder="1000 - 25000" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="0-1000">Under $1,000</SelectItem>
                    <SelectItem value="1000-2000">$1,000 - $2,000</SelectItem>
                    <SelectItem value="2000-3000">$2,000 - $3,000</SelectItem>
                    <SelectItem value="3000-5000">$3,000 - $5,000</SelectItem>
                    <SelectItem value="5000">$5,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                <div className="relative">
                  <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                  <Select value={bedroomsFilter} onValueChange={setBedroomsFilter}>
                    <SelectTrigger className="pl-10 bg-gray-50 border-gray-200">
                      <SelectValue placeholder="Studio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="1">1 Bedroom</SelectItem>
                      <SelectItem value="2">2 Bedrooms</SelectItem>
                      <SelectItem value="3">3 Bedrooms</SelectItem>
                      <SelectItem value="4">4+ Bedrooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-end">
                <Button className="w-full bg-teal-700 hover:bg-teal-800 text-white font-medium py-3">
                  <Search className="w-4 h-4 mr-2" />
                  Find a Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredProperties.length === 0 ? (
            <div className="text-center py-16">
              <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties found</h3>
              <p className="text-gray-600">Try adjusting your search filters or check back later.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {currentProperties.map((property) => (
                  <div key={property.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300">
                    <div className="relative">
                      <img
                        src={property.photo_url || "/placeholder.svg"}
                        alt={property.title}
                        className="w-full h-64 object-cover rounded-t-xl"
                      />
                      <button
                        onClick={() => profile && toggleSavedProperty(property.id)}
                        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm"
                      >
                        <Heart 
                          className={`w-4 h-4 ${
                            savedProperties.includes(property.id) 
                              ? 'text-red-500 fill-current' 
                              : 'text-gray-600'
                          }`} 
                        />
                      </button>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {property.bedrooms || 0}-Bedroom Apartment in Lekki
                        </h3>
                      </div>
                      
                      <div className="flex items-center text-gray-500 text-sm mb-3">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>Lekki Phase 1, Lagos, Nigeria</span>
                      </div>
                      
                      <div className="text-2xl font-bold text-gray-900 mb-4">
                        ₦ {property.price.toLocaleString()}
                        <span className="text-sm text-gray-500 font-normal"> per year</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Bed className="w-4 h-4 mr-1" />
                            <span>{property.bedrooms || 0}</span>
                          </div>
                          <div className="flex items-center">
                            <Bath className="w-4 h-4 mr-1" />
                            <span>{property.bathrooms || 1}</span>
                          </div>
                          <div className="flex items-center">
                            <Home className="w-4 h-4 mr-1" />
                            <span>WiFi</span>
                          </div>
                          <div className="flex items-center">
                            <span>🅿️</span>
                            <span className="ml-1">Solar</span>
                          </div>
                          <div className="flex items-center">
                            <span>🏠</span>
                            <span className="ml-1">Pool</span>
                          </div>
                        </div>
                      </div>
                      
                      <Link to={`/property/${property.id}`}>
                        <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                          View More Detail
                        </Button>
                      </Link>
                    </div>
                  </div>
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