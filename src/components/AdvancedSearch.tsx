
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, SlidersHorizontal } from 'lucide-react';

interface SearchFilters {
  location: string;
  minPrice: number;
  maxPrice: number;
  bedrooms: string;
  bathrooms: string;
  sortBy: string;
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const AdvancedSearch = ({ onSearch, isOpen, onToggle }: AdvancedSearchProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    minPrice: 0,
    maxPrice: 10000,
    bedrooms: '',
    bathrooms: '',
    sortBy: 'newest'
  });

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleReset = () => {
    const resetFilters: SearchFilters = {
      location: '',
      minPrice: 0,
      maxPrice: 10000,
      bedrooms: '',
      bathrooms: '',
      sortBy: 'newest'
    };
    setFilters(resetFilters);
    onSearch(resetFilters);
  };

  if (!isOpen) {
    return (
      <Button variant="outline" onClick={onToggle}>
        <SlidersHorizontal className="w-4 h-4 mr-2" />
        Advanced Search
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Advanced Search
          <Button variant="ghost" size="sm" onClick={onToggle}>
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Enter city, neighborhood..."
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="bedrooms">Bedrooms</Label>
            <Select value={filters.bedrooms} onValueChange={(value) => setFilters({ ...filters, bedrooms: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
                <SelectItem value="5">5+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="bathrooms">Bathrooms</Label>
            <Select value={filters.bathrooms} onValueChange={(value) => setFilters({ ...filters, bathrooms: value })}>
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

        <div>
          <Label>Price Range: ${filters.minPrice} - ${filters.maxPrice}</Label>
          <div className="mt-2">
            <Slider
              value={[filters.minPrice, filters.maxPrice]}
              onValueChange={(value) => setFilters({ ...filters, minPrice: value[0], maxPrice: value[1] })}
              max={10000}
              min={0}
              step={100}
              className="w-full"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="sortBy">Sort By</Label>
          <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSearch} className="flex-1">
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedSearch;
