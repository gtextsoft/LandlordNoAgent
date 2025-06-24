import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Property } from '@/lib/supabase';
import { 
  Map, 
  MapPin, 
  List, 
  Filter, 
  Search, 
  Home, 
  Bed, 
  Bath, 
  Heart,
  Phone,
  MessageCircle,
  Navigation
} from 'lucide-react';

interface PropertyMapViewProps {
  properties: Property[];
  onPropertySelect: (property: Property) => void;
  selectedProperty?: Property | null;
}

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

const PropertyMapView = ({ properties, onPropertySelect, selectedProperty }: PropertyMapViewProps) => {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 6.5244, lng: 3.3792 }); // Lagos, Nigeria
  const [mapZoom, setMapZoom] = useState(11);
  const mapRef = useRef<HTMLDivElement>(null);

  // Simulated map functionality (replace with actual map integration)
  const [mapBounds, setMapBounds] = useState<MapBounds>({
    north: 6.6,
    south: 6.4,
    east: 3.5,
    west: 3.2
  });

  // Filter properties based on search query
  const filteredProperties = properties.filter(property =>
    property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Simulate getting properties within map bounds
  const visibleProperties = filteredProperties.filter(() => true); // In real app, filter by map bounds

  const handlePropertyClick = (property: Property) => {
    onPropertySelect(property);
    // Center map on selected property (in real implementation)
    setMapCenter({ lat: 6.5244, lng: 3.3792 });
  };

  const PropertyMarker = ({ property, isSelected }: { property: Property; isSelected: boolean }) => (
    <div
      className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-full transition-all duration-200 ${
        isSelected ? 'z-20 scale-110' : 'z-10 hover:scale-105'
      }`}
      style={{
        left: `${Math.random() * 80 + 10}%`, // Simulate positioning
        top: `${Math.random() * 60 + 20}%`
      }}
      onClick={() => handlePropertyClick(property)}
    >
      <div
        className={`bg-white rounded-lg shadow-lg border-2 px-3 py-2 ${
          isSelected 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-blue-300'
        }`}
      >
        <div className="text-sm font-semibold text-gray-900">
          ₦{property.price.toLocaleString()}
        </div>
        <div className="text-xs text-gray-600">
          {property.bedrooms}br
        </div>
      </div>
      <div
        className={`w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-transparent mx-auto ${
          isSelected ? 'border-t-blue-500' : 'border-t-gray-200'
        }`}
      />
    </div>
  );

  const PropertyCard = ({ property }: { property: Property }) => (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        selectedProperty?.id === property.id ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => handlePropertyClick(property)}
    >
      <CardContent className="p-4">
        <div className="flex space-x-4">
          <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={property.photo_url || '/api/placeholder/80/80'}
              alt={property.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/api/placeholder/80/80';
              }}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 truncate">
              {property.title}
            </h3>
            <p className="text-xs text-gray-600 mb-2 truncate">
              <MapPin className="w-3 h-3 inline mr-1" />
              {property.location}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-blue-600">
                ₦{property.price.toLocaleString()}
              </div>
              <div className="flex items-center text-xs text-gray-500 space-x-2">
                {property.bedrooms && (
                  <span className="flex items-center">
                    <Bed className="w-3 h-3 mr-1" />
                    {property.bedrooms}
                  </span>
                )}
                {property.bathrooms && (
                  <span className="flex items-center">
                    <Bath className="w-3 h-3 mr-1" />
                    {property.bathrooms}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
      {/* Left Panel - Search and Properties List */}
      <div className="lg:w-1/3 flex flex-col bg-white border-r">
        {/* Header */}
        <div className="p-4 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              {filteredProperties.length} Properties Found
            </h2>
            
            {/* View Toggle - Mobile */}
            <div className="lg:hidden flex rounded-lg bg-gray-100 p-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex-1"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="flex-1"
              >
                <Map className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 bg-gray-50 border-b">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Price
                </label>
                <Input placeholder="₦0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Price
                </label>
                <Input placeholder="Any" />
              </div>
            </div>
          </div>
        )}

        {/* Properties List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
          
          {filteredProperties.length === 0 && (
            <div className="text-center py-12">
              <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No properties found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search criteria or filters.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Map View */}
      <div className={`flex-1 relative ${viewMode === 'list' ? 'hidden lg:block' : 'block'}`}>
        {/* Map Container */}
        <div
          ref={mapRef}
          className="w-full h-full bg-gradient-to-br from-blue-100 to-green-100 relative overflow-hidden"
        >
          {/* Simulated Map Background */}
          <div className="absolute inset-0">
            <div className="w-full h-full bg-gray-200 relative">
              {/* Grid pattern to simulate map */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #ccc 1px, transparent 1px),
                    linear-gradient(to bottom, #ccc 1px, transparent 1px)
                  `,
                  backgroundSize: '50px 50px'
                }}
              />
              
              {/* Simulated Roads */}
              <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-400 transform -translate-y-1/2" />
              <div className="absolute left-1/3 top-0 bottom-0 w-2 bg-gray-400" />
              <div className="absolute left-2/3 top-0 bottom-0 w-2 bg-gray-400" />
            </div>
          </div>

          {/* Property Markers */}
          {visibleProperties.map((property) => (
            <PropertyMarker
              key={property.id}
              property={property}
              isSelected={selectedProperty?.id === property.id}
            />
          ))}

          {/* Map Controls */}
          <div className="absolute top-4 right-4 space-y-2">
            <Button size="sm" variant="outline" className="bg-white">
              <Navigation className="w-4 h-4" />
            </Button>
            <div className="flex flex-col space-y-1">
              <Button size="sm" variant="outline" className="bg-white px-3">
                +
              </Button>
              <Button size="sm" variant="outline" className="bg-white px-3">
                −
              </Button>
            </div>
          </div>

          {/* Selected Property Details */}
          {selectedProperty && (
            <Card className="absolute bottom-4 left-4 right-4 lg:left-4 lg:right-auto lg:w-80 bg-white shadow-lg">
              <CardContent className="p-4">
                <div className="flex space-x-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={selectedProperty.photo_url || '/api/placeholder/80/80'}
                      alt={selectedProperty.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">
                      {selectedProperty.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 truncate">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {selectedProperty.location}
                    </p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xl font-bold text-blue-600">
                        ₦{selectedProperty.price.toLocaleString()}
                      </div>
                      <Badge variant="outline">
                        {selectedProperty.bedrooms}br • {selectedProperty.bathrooms}ba
                      </Badge>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" className="flex-1">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Chat
                      </Button>
                      <Button size="sm" variant="outline">
                        <Heart className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Phone className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyMapView; 