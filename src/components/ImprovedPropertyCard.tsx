import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Bed, 
  Bath, 
  Heart, 
  Share2, 
  Eye, 
  Calendar,
  MessageCircle,
  Star,
  Wifi,
  Car,
  Home,
  ChevronLeft,
  ChevronRight,
  Play,
  Camera
} from 'lucide-react';
import { Property } from '@/lib/supabase';
import { useSavedProperties } from '@/hooks/useSavedProperties';

interface ImprovedPropertyCardProps {
  property: Property;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'featured';
  showVirtualTour?: boolean;
  onCompareChange?: (propertyId: string, checked: boolean) => void;
  isCompared?: boolean;
}

const ImprovedPropertyCard = ({ 
  property, 
  showActions = true, 
  variant = 'default',
  showVirtualTour = false,
  onCompareChange,
  isCompared
}: ImprovedPropertyCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isSaved, toggleSavedProperty } = useSavedProperties();

  const images = property.photo_urls && property.photo_urls.length > 0 
    ? property.photo_urls 
    : property.photo_url 
    ? [property.photo_url] 
    : ['/api/placeholder/400/300'];

  const propertyIsSaved = isSaved(property.id);

  const handleSaveToggle = async () => {
    setIsLoading(true);
    try {
      await toggleSavedProperty(property.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: `Check out this property: ${property.title}`,
          url: window.location.origin + `/property/${property.id}`,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.origin + `/property/${property.id}`);
    }
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const getCardClasses = () => {
    const baseClasses = "group relative overflow-hidden transition-all duration-300 hover:shadow-2xl";
    
    switch (variant) {
      case 'compact':
        return `${baseClasses} max-w-sm`;
      case 'featured':
        return `${baseClasses} ring-2 ring-blue-500 shadow-lg`;
      default:
        return baseClasses;
    }
  };

  const getImageHeight = () => {
    switch (variant) {
      case 'compact':
        return 'h-48';
      case 'featured':
        return 'h-72';
      default:
        return 'h-64';
    }
  };

  return (
    <Card 
      className={getCardClasses()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Compare Checkbox */}
      {onCompareChange && (
        <div className="absolute top-3 right-3 z-20">
          <label className="flex items-center space-x-2 bg-white/80 px-2 py-1 rounded shadow">
            <input
              type="checkbox"
              checked={!!isCompared}
              onChange={e => onCompareChange(property.id, e.target.checked)}
            />
            <span className="text-xs font-medium">Compare</span>
          </label>
        </div>
      )}

      {/* Image Gallery Section */}
      <div className={`relative ${getImageHeight()} overflow-hidden`}>
        {/* Main Image */}
        <img
          src={images[currentImageIndex]}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/api/placeholder/400/300';
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge 
            variant={property.status === 'active' ? 'default' : 'secondary'}
            className="shadow-lg backdrop-blur-sm"
          >
            {property.status === 'active' ? 'Available' : 'Pending'}
          </Badge>
        </div>

        {/* Featured Badge */}
        {variant === 'featured' && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-yellow-500 text-yellow-900 shadow-lg">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          </div>
        )}

        {/* Image Navigation */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className={`absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={nextImage}
              className={`absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>

            {/* Image Indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Virtual Tour Button */}
        {showVirtualTour && (
          <div className="absolute bottom-3 right-3">
            <Button
              size="sm"
              variant="secondary"
              className="backdrop-blur-sm bg-white/90 hover:bg-white"
            >
              <Play className="w-3 h-3 mr-1" />
              Virtual Tour
            </Button>
          </div>
        )}

        {/* Photo Count */}
        {images.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 rounded-full text-xs flex items-center">
            <Camera className="w-3 h-3 mr-1" />
            {images.length}
          </div>
        )}

        {/* Quick Actions Overlay */}
        {showActions && (
          <div className={`absolute top-3 right-3 flex space-x-2 transition-all duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <Button
              size="sm"
              variant="secondary"
              className={`backdrop-blur-sm transition-all duration-200 ${
                propertyIsSaved 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-white/90 hover:bg-white'
              } ${isLoading ? 'animate-pulse' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSaveToggle();
              }}
              disabled={isLoading}
            >
              <Heart 
                className={`w-4 h-4 ${
                  propertyIsSaved ? 'fill-current' : ''
                }`} 
              />
            </Button>
            
            <Button
              size="sm"
              variant="secondary"
              className="backdrop-blur-sm bg-white/90 hover:bg-white"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleShare();
              }}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Content Section */}
      <CardContent className="p-4 space-y-4">
        {/* Price and Title */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="text-2xl font-bold text-blue-600">
              ₦{property.price.toLocaleString()}
              <span className="text-sm text-gray-500 font-normal">/month</span>
            </div>
            {property.profiles && (
              <div className="flex items-center text-xs text-gray-500">
                <div className="w-6 h-6 bg-gray-300 rounded-full mr-2 flex items-center justify-center">
                  <Home className="w-3 h-3" />
                </div>
                <span className="truncate max-w-20">
                  {property.profiles.full_name?.split(' ')[0] || 'Owner'}
                </span>
              </div>
            )}
          </div>
          
          <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
            {property.title}
          </h3>
        </div>

        {/* Location */}
        <div className="flex items-center text-gray-600 text-sm">
          <MapPin className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
          <span className="truncate">{property.location}</span>
        </div>

        {/* Property Details */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            {property.bedrooms !== undefined && (
              <div className="flex items-center">
                <Bed className="w-4 h-4 mr-1" />
                <span>{property.bedrooms || 'Studio'}</span>
              </div>
            )}
            {property.bathrooms !== undefined && (
              <div className="flex items-center">
                <Bath className="w-4 h-4 mr-1" />
                <span>{property.bathrooms}</span>
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500 flex items-center">
            <Eye className="w-3 h-3 mr-1" />
            <span>124 views</span>
          </div>
        </div>

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {property.amenities.slice(0, 3).map((amenity, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {amenity === 'WiFi' && <Wifi className="w-3 h-3 mr-1" />}
                {amenity === 'Parking' && <Car className="w-3 h-3 mr-1" />}
                {amenity}
              </Badge>
            ))}
            {property.amenities.length > 3 && (
              <Badge variant="outline" className="text-xs text-gray-500">
                +{property.amenities.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Description */}
        <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
          {property.description}
        </p>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Link to={`/property/${property.id}`} className="flex-1">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200">
              View Details
            </Button>
          </Link>
          
          <Button
            variant="outline"
            size="sm"
            className="px-4 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all duration-200"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            Chat
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="px-4 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200"
          >
            <Calendar className="w-4 h-4 mr-1" />
            Tour
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImprovedPropertyCard; 