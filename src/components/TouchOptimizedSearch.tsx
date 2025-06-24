import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  Search, 
  Filter, 
  MapPin, 
  Mic, 
  X, 
  Home,
  Building,
  Bed,
  Bath,
  DollarSign,
  SlidersHorizontal,
  TrendingUp,
  Clock,
  Heart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TouchOptimizedSearchProps {
  onSearch: (query: string, filters: any) => void;
  placeholder?: string;
  suggestions?: string[];
  recentSearches?: string[];
  trendingSearches?: string[];
  className?: string;
}

interface SearchFilters {
  location: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  priceRange: [number, number];
  amenities: string[];
}

const TouchOptimizedSearch = ({
  onSearch,
  placeholder = "Search properties...",
  suggestions = [],
  recentSearches = [],
  trendingSearches = [],
  className = ""
}: TouchOptimizedSearchProps) => {
  const [query, setQuery] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState<SearchFilters>({
    location: "",
    propertyType: "all",
    bedrooms: "all",
    bathrooms: "all",
    priceRange: [0, 5000],
    amenities: []
  });

  // Predefined suggestions
  const locationSuggestions = [
    "Downtown", "City Center", "Suburbs", "Waterfront", "University District",
    "Financial District", "Arts District", "Historic District"
  ];

  const trendingLocations = [
    "Miami Beach", "Manhattan", "Hollywood", "Beverly Hills", "SoHo",
    "Brooklyn Heights", "Venice Beach", "Capitol Hill"
  ];

  const amenityOptions = [
    "WiFi", "Parking", "Pool", "Gym", "Pet Friendly", "Balcony",
    "Garden", "Fireplace", "Air Conditioning", "Dishwasher"
  ];

  useEffect(() => {
    // Count active filters
    let count = 0;
    if (filters.location) count++;
    if (filters.propertyType !== "all") count++;
    if (filters.bedrooms !== "all") count++;
    if (filters.bathrooms !== "all") count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000) count++;
    if (filters.amenities.length > 0) count++;
    setActiveFiltersCount(count);
  }, [filters]);

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    onSearch(finalQuery, filters);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      setIsVoiceActive(true);
      recognition.start();

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        handleSearch(transcript);
        setIsVoiceActive(false);
      };

      recognition.onerror = () => {
        setIsVoiceActive(false);
      };

      recognition.onend = () => {
        setIsVoiceActive(false);
      };
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleAmenity = (amenity: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const clearFilters = () => {
    setFilters({
      location: "",
      propertyType: "all",
      bedrooms: "all",
      bathrooms: "all",
      priceRange: [0, 5000],
      amenities: []
    });
  };

  const clearSearch = () => {
    setQuery("");
    setShowSuggestions(false);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Main Search Bar */}
      <div className="relative">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-10 h-12 text-lg rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
                  onClick={clearSearch}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Voice Search Button */}
          <Button
            variant="outline"
            size="lg"
            className={`h-12 w-12 rounded-xl border-2 transition-colors ${
              isVoiceActive 
                ? 'bg-red-500 border-red-500 text-white animate-pulse' 
                : 'border-gray-200 hover:border-blue-500'
            }`}
            onClick={handleVoiceSearch}
          >
            <Mic className="w-5 h-5" />
          </Button>

          {/* Filters Button */}
          <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 relative"
              >
                <SlidersHorizontal className="w-5 h-5 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs min-w-[20px] h-5">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-xl font-semibold">Search Filters</SheetTitle>
                <div className="flex justify-between items-center">
                  <p className="text-gray-500">Refine your search</p>
                  <Button variant="ghost" onClick={clearFilters}>
                    Clear All
                  </Button>
                </div>
              </SheetHeader>

              <div className="space-y-6 pb-20">
                {/* Location */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Location</label>
                  <Input
                    placeholder="Enter location"
                    value={filters.location}
                    onChange={(e) => updateFilter('location', e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>

                {/* Property Type */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Property Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['all', 'apartment', 'house', 'studio', 'condo'].map((type) => (
                      <Button
                        key={type}
                        variant={filters.propertyType === type ? "default" : "outline"}
                        className="h-12 rounded-xl capitalize"
                        onClick={() => updateFilter('propertyType', type)}
                      >
                        {type === 'all' ? 'Any Type' : type}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Bedrooms</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['all', '0', '1', '2', '3', '4+'].map((bed) => (
                      <Button
                        key={bed}
                        variant={filters.bedrooms === bed ? "default" : "outline"}
                        className="h-12 rounded-xl"
                        onClick={() => updateFilter('bedrooms', bed)}
                      >
                        {bed === 'all' ? 'Any' : bed === '0' ? 'Studio' : bed}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-4 block">
                    Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
                  </label>
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) => updateFilter('priceRange', value)}
                    max={5000}
                    min={0}
                    step={100}
                    className="w-full"
                  />
                </div>

                {/* Amenities */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {amenityOptions.map((amenity) => (
                      <Badge
                        key={amenity}
                        variant={filters.amenities.includes(amenity) ? "default" : "outline"}
                        className="cursor-pointer px-3 py-2 text-sm rounded-full"
                        onClick={() => toggleAmenity(amenity)}
                      >
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Apply Filters Button */}
              <div className="fixed bottom-6 left-6 right-6">
                <Button
                  className="w-full h-12 rounded-xl text-lg font-medium"
                  onClick={() => {
                    handleSearch();
                    setIsFiltersOpen(false);
                  }}
                >
                  Apply Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 z-50"
            >
              <Card className="shadow-xl border-2 border-gray-100 rounded-xl overflow-hidden">
                <CardContent className="p-0">
                  
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center mb-2">
                        <Clock className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Recent Searches</span>
                      </div>
                      <div className="space-y-1">
                        {recentSearches.slice(0, 3).map((search, index) => (
                          <button
                            key={index}
                            className="w-full text-left px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            onClick={() => handleSuggestionClick(search)}
                          >
                            {search}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending Searches */}
                  {trendingLocations.length > 0 && (
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center mb-2">
                        <TrendingUp className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Trending</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {trendingLocations.slice(0, 4).map((location, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handleSuggestionClick(location)}
                          >
                            {location}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Location Suggestions */}
                  <div className="p-4">
                    <div className="flex items-center mb-2">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Popular Locations</span>
                    </div>
                    <div className="space-y-1">
                      {locationSuggestions.slice(0, 4).map((location, index) => (
                        <button
                          key={index}
                          className="w-full text-left px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center"
                          onClick={() => handleSuggestionClick(location)}
                        >
                          <MapPin className="w-3 h-3 mr-2 text-gray-400" />
                          {location}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 flex flex-wrap gap-2"
        >
          {filters.location && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {filters.location}
              <button onClick={() => updateFilter('location', '')}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.propertyType !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Home className="w-3 h-3" />
              {filters.propertyType}
              <button onClick={() => updateFilter('propertyType', 'all')}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.bedrooms !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Bed className="w-3 h-3" />
              {filters.bedrooms} bed{filters.bedrooms !== '1' ? 's' : ''}
              <button onClick={() => updateFilter('bedrooms', 'all')}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {(filters.priceRange[0] > 0 || filters.priceRange[1] < 5000) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              ${filters.priceRange[0]} - ${filters.priceRange[1]}
              <button onClick={() => updateFilter('priceRange', [0, 5000])}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.amenities.map((amenity) => (
            <Badge key={amenity} variant="secondary" className="flex items-center gap-1">
              {amenity}
              <button onClick={() => toggleAmenity(amenity)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </motion.div>
      )}

      {/* Quick Search Actions */}
      <div className="mt-4 flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => handleSearch()}
        >
          <Search className="w-4 h-4 mr-1" />
          Search All
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => {
            updateFilter('propertyType', 'apartment');
            handleSearch();
          }}
        >
          <Building className="w-4 h-4 mr-1" />
          Apartments
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => {
            updateFilter('propertyType', 'house');
            handleSearch();
          }}
        >
          <Home className="w-4 h-4 mr-1" />
          Houses
        </Button>
      </div>
    </div>
  );
};

export default TouchOptimizedSearch; 