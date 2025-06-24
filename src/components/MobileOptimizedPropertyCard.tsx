import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, 
  Share2, 
  MapPin, 
  Bed, 
  Bath, 
  Car, 
  Wifi,
  Star,
  MessageCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Property } from "@/lib/supabase";

interface MobileOptimizedPropertyCardProps {
  property: Property;
  onSave?: (property: Property) => void;
  onShare?: (property: Property) => void;
  onContact?: (property: Property) => void;
  isSaved?: boolean;
}

const MobileOptimizedPropertyCard = ({
  property,
  onSave,
  onShare,
  onContact,
  isSaved = false
}: MobileOptimizedPropertyCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Mock images if none provided
  const images = property.photo_urls && property.photo_urls.length > 0 
    ? property.photo_urls 
    : property.photo_url 
    ? [property.photo_url]
    : ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleImageSwipe = (event: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 50) {
      if (info.offset.x > 0) {
        prevImage();
      } else {
        nextImage();
      }
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSave?.(property);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onShare?.(property);
  };

  const handleContact = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContact?.(property);
  };

  // Get amenities for display
  const amenities = [
    { icon: Bed, label: `${property.bedrooms || 0} bed${property.bedrooms !== 1 ? 's' : ''}` },
    { icon: Bath, label: `${property.bathrooms || 0} bath${property.bathrooms !== 1 ? 's' : ''}` },
    ...(property.amenities || []).slice(0, 2).map(amenity => ({
      icon: amenity.toLowerCase().includes('wifi') ? Wifi : Car,
      label: amenity
    }))
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="relative">
          {/* Image Gallery */}
          <div className="relative h-64 bg-gray-200 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                src={images[currentImageIndex]}
                alt={property.title}
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleImageSwipe}
              />
            </AnimatePresence>

            {/* Image Navigation */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full"
                  onClick={prevImage}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full"
                  onClick={nextImage}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>

                {/* Image Indicators */}
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="absolute top-3 right-3 flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-sm"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`p-2 rounded-full shadow-sm ${
                  isSaved 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-white/90 hover:bg-white text-gray-700'
                }`}
                onClick={handleSave}
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              </Button>
            </div>

            {/* Property Status Badge */}
            {property.status && (
              <div className="absolute top-3 left-3">
                <Badge 
                  variant={property.status === 'available' ? 'default' : 'secondary'}
                  className="capitalize"
                >
                  {property.status}
                </Badge>
              </div>
            )}
          </div>

          {/* Content */}
          <CardContent className="p-4">
            {/* Title and Location */}
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
                {property.title}
              </h3>
              <div className="flex items-center text-gray-500 text-sm">
                <MapPin className="w-4 h-4 mr-1" />
                <span className="line-clamp-1">{property.location}</span>
              </div>
            </div>

            {/* Amenities */}
            <div className="flex flex-wrap gap-2 mb-3">
              {amenities.slice(0, 3).map((amenity, index) => (
                <div key={index} className="flex items-center bg-gray-100 rounded-full px-2 py-1">
                  <amenity.icon className="w-3 h-3 mr-1 text-gray-600" />
                  <span className="text-xs text-gray-600">{amenity.label}</span>
                </div>
              ))}
              {amenities.length > 3 && (
                <div className="flex items-center bg-gray-100 rounded-full px-2 py-1">
                  <span className="text-xs text-gray-600">+{amenities.length - 3} more</span>
                </div>
              )}
            </div>

            {/* Rating and Reviews - Mock data for now */}
            <div className="flex items-center mb-3">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium text-gray-900 ml-1">
                4.8
              </span>
              <span className="text-sm text-gray-500 ml-1">
                (24 reviews)
              </span>
            </div>

            {/* Price and Actions */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-bold text-gray-900">
                  ${property.price?.toLocaleString()}
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    /month
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  onClick={handleContact}
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Contact
                </Button>
                <Link to={`/property/${property.id}`}>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
};

export default MobileOptimizedPropertyCard; 