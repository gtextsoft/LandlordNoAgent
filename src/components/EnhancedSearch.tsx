import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  MapPin, 
  Filter, 
  X, 
  SlidersHorizontal,
  Mic,
  MicOff,
  History,
  TrendingUp,
  Home,
  Building,
  Zap,
  Wifi,
  Car,
  Wind,
  Shield,
  Sun
} from 'lucide-react';

interface SearchFilters {
  location: string;
  priceRange: [number, number];
  bedrooms: string;
  bathrooms: string;
  propertyType: string;
  amenities: string[];
  sortBy: string;
}

interface LocationSuggestion {
  name: string;
  type: 'city' | 'neighborhood' | 'landmark';
  count?: number;
}

interface EnhancedSearchProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  onFiltersChange?: (filters: SearchFilters) => void;
  placeholder?: string;
  showFilters?: boolean;
}

const EnhancedSearch = ({ 
  onSearch, 
  onFiltersChange,
  placeholder = "Search by location, property type, or keywords...",
  showFilters = true 
}: EnhancedSearchProps) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const recognition = useRef<any>(null);

  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    priceRange: [0, 5000000],
    bedrooms: '',
    bathrooms: '',
    propertyType: '',
    amenities: [],
    sortBy: 'newest'
  });

  // Mock location suggestions (replace with real API)
  const locationSuggestions: LocationSuggestion[] = [
    { name: 'Lagos Island', type: 'neighborhood', count: 1240 },
    { name: 'Victoria Island', type: 'neighborhood', count: 890 },
    { name: 'Lekki Phase 1', type: 'neighborhood', count: 2100 },
    { name: 'Ikeja GRA', type: 'neighborhood', count: 650 },
    { name: 'Abuja', type: 'city', count: 3400 },
    { name: 'Port Harcourt', type: 'city', count: 1800 },
    { name: 'Kano', type: 'city', count: 980 }
  ];

  const trendingSearches = [
    'Apartments in Lekki',
    'Houses in Abuja',
    'Studio apartments Lagos',
    'Furnished apartments VI'
  ];

  const availableAmenities = [
    { id: 'wifi', label: 'WiFi', icon: Wifi },
    { id: 'parking', label: 'Parking', icon: Car },
    { id: 'security', label: '24/7 Security', icon: Shield },
    { id: 'generator', label: 'Backup Generator', icon: Zap },
    { id: 'ac', label: 'Air Conditioning', icon: Wind },
    { id: 'balcony', label: 'Balcony', icon: Sun }
  ];

  const filteredSuggestions = locationSuggestions.filter(suggestion =>
    suggestion.name.toLowerCase().includes(query.toLowerCase())
  );

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };

      recognition.current.onerror = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    if (query.trim()) {
      // Save to recent searches
      const newRecentSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(newRecentSearches);
      localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
      
      onSearch(query, filters);
      setShowSuggestions(false);
    }
  };

  const handleVoiceSearch = () => {
    if (recognition.current && !isListening) {
      setIsListening(true);
      recognition.current.start();
    } else if (isListening) {
      recognition.current.stop();
      setIsListening(false);
    }
  };

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange?.(updated);
  };

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      location: '',
      priceRange: [0, 5000000],
      bedrooms: '',
      bathrooms: '',
      propertyType: '',
      amenities: [],
      sortBy: 'newest'
    };
    setFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
  };

  const toggleAmenity = (amenityId: string) => {
    const newAmenities = filters.amenities.includes(amenityId)
      ? filters.amenities.filter(a => a !== amenityId)
      : [...filters.amenities, amenityId];
    updateFilters({ amenities: newAmenities });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.bedrooms) count++;
    if (filters.bathrooms) count++;
    if (filters.propertyType) count++;
    if (filters.amenities.length > 0) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000000) count++;
    return count;
  };

  return (
    <div className="w-full" ref={searchRef}>
      {/* Main Search Bar */}
      <div className="relative">
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-2">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder={placeholder}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  onFocus={() => setShowSuggestions(true)}
                  className="pl-12 pr-20 h-14 text-lg border-0 focus:ring-2 focus:ring-blue-500"
                />
                
                {/* Voice Search Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleVoiceSearch}
                  className={`absolute right-12 top-1/2 transform -translate-y-1/2 p-2 ${
                    isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>

                {/* Clear Button */}
                {query && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setQuery('');
                      setShowSuggestions(false);
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Filters Toggle */}
              {showFilters && (
                <Button
                  variant="outline"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="h-14 px-6 relative"
                >
                  <SlidersHorizontal className="w-5 h-5 mr-2" />
                  Filters
                  {getActiveFiltersCount() > 0 && (
                    <Badge className="ml-2 px-2 py-0 text-xs bg-blue-500">
                      {getActiveFiltersCount()}
                    </Badge>
                  )}
                </Button>
              )}

              {/* Search Button */}
              <Button 
                onClick={handleSearch}
                size="lg" 
                className="h-14 px-8 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
              >
                <Search className="w-5 h-5 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Suggestions Dropdown */}
        {showSuggestions && (query || recentSearches.length > 0) && (
          <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-xl border max-h-96 overflow-y-auto">
            <CardContent className="p-0">
              {/* Location Suggestions */}
              {query && filteredSuggestions.length > 0 && (
                <div className="p-4 border-b">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Locations
                  </h4>
                  {filteredSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(suggestion.name);
                        setShowSuggestions(false);
                        handleSearch();
                      }}
                      className="w-full text-left p-2 hover:bg-gray-50 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          suggestion.type === 'city' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {suggestion.type === 'city' ? <Building className="w-4 h-4" /> : <Home className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-medium">{suggestion.name}</div>
                          <div className="text-sm text-gray-500 capitalize">{suggestion.type}</div>
                        </div>
                      </div>
                      {suggestion.count && (
                        <Badge variant="outline" className="text-xs">
                          {suggestion.count} properties
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Recent Searches */}
              {!query && recentSearches.length > 0 && (
                <div className="p-4 border-b">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <History className="w-4 h-4 mr-2" />
                    Recent Searches
                  </h4>
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(search);
                        setShowSuggestions(false);
                        handleSearch();
                      }}
                      className="w-full text-left p-2 hover:bg-gray-50 rounded-lg flex items-center"
                    >
                      <History className="w-4 h-4 mr-3 text-gray-400" />
                      {search}
                    </button>
                  ))}
                </div>
              )}

              {/* Trending Searches */}
              {!query && (
                <div className="p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Trending Searches
                  </h4>
                  {trendingSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(search);
                        setShowSuggestions(false);
                        handleSearch();
                      }}
                      className="w-full text-left p-2 hover:bg-gray-50 rounded-lg flex items-center"
                    >
                      <TrendingUp className="w-4 h-4 mr-3 text-gray-400" />
                      {search}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {filtersOpen && (
        <Card className="mt-4 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Advanced Filters</CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setFiltersOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Price Range: ₦{filters.priceRange[0].toLocaleString()} - ₦{filters.priceRange[1].toLocaleString()}
              </label>
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => updateFilters({ priceRange: value as [number, number] })}
                max={5000000}
                min={0}
                step={50000}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>₦0</span>
                <span>₦5M+</span>
              </div>
            </div>

            {/* Property Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type
                </label>
                <Select value={filters.propertyType} onValueChange={(value) => updateFilters({ propertyType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any type</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="duplex">Duplex</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bedrooms
                </label>
                <Select value={filters.bedrooms} onValueChange={(value) => updateFilters({ bedrooms: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="0">Studio</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                    <SelectItem value="5">5+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bathrooms
                </label>
                <Select value={filters.bathrooms} onValueChange={(value) => updateFilters({ bathrooms: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Amenities
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableAmenities.map((amenity) => (
                  <div key={amenity.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity.id}
                      checked={filters.amenities.includes(amenity.id)}
                      onCheckedChange={() => toggleAmenity(amenity.id)}
                    />
                    <label
                      htmlFor={amenity.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center cursor-pointer"
                    >
                      <amenity.icon className="w-4 h-4 mr-2 text-gray-500" />
                      {amenity.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <Select value={filters.sortBy} onValueChange={(value) => updateFilters({ sortBy: value })}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedSearch; 