import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  ArrowLeft,
  Heart, 
  Share2, 
  MapPin, 
  Bed, 
  Bath, 
  Car, 
  Wifi,
  Star,
  MessageCircle,
  Calendar,
  DollarSign,
  Home,
  ChevronLeft,
  ChevronRight,
  Info,
  Phone,
  Mail,
  User,
  Shield,
  CheckCircle
} from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Property } from "@/lib/supabase";

interface MobilePropertyDetailProps {
  property: Property;
  onBack?: () => void;
  onSave?: (property: Property) => void;
  onShare?: (property: Property) => void;
  onContact?: (property: Property) => void;
  onBookTour?: (property: Property) => void;
  isSaved?: boolean;
}

const MobilePropertyDetail = ({
  property,
  onBack,
  onSave,
  onShare,
  onContact,
  onBookTour,
  isSaved = false
}: MobilePropertyDetailProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactSheet, setShowContactSheet] = useState(false);
  const [showInfoSheet, setShowInfoSheet] = useState(false);

  // Mock images if none provided
  const images = property.images && property.images.length > 0 
    ? property.images 
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

  const handleSave = () => {
    onSave?.(property);
  };

  const handleShare = () => {
    onShare?.(property);
  };

  const handleContact = () => {
    onContact?.(property);
    setShowContactSheet(false);
  };

  const handleBookTour = () => {
    onBookTour?.(property);
  };

  // Mock amenities and features
  const amenities = [
    { icon: Wifi, label: "WiFi" },
    { icon: Car, label: "Parking" },
    { icon: Home, label: "Furnished" },
    { icon: Shield, label: "Security" },
    ...(property.amenities || []).slice(0, 6).map(amenity => ({
      icon: CheckCircle,
      label: amenity
    }))
  ];

  const highlights = [
    { icon: Bed, label: `${property.bedrooms || 0} Bedrooms`, value: property.bedrooms },
    { icon: Bath, label: `${property.bathrooms || 0} Bathrooms`, value: property.bathrooms },
    { icon: Home, label: property.property_type || "Apartment", value: property.property_type },
    { icon: Calendar, label: "Available", value: "Immediate" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={handleShare} className="p-2">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSave}
              className={`p-2 ${isSaved ? 'text-red-500' : 'text-gray-600'}`}
            >
              <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="relative h-80 bg-gray-200 overflow-hidden">
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
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full"
              onClick={prevImage}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full"
              onClick={nextImage}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>

            {/* Image Counter */}
            <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
              {currentImageIndex + 1} / {images.length}
            </div>
          </>
        )}

        {/* Status Badge */}
        {property.status && (
          <div className="absolute top-4 left-4">
            <Badge 
              variant={property.status === 'available' ? 'default' : 'secondary'}
              className="capitalize bg-green-500 text-white"
            >
              {property.status}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Title and Price */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900 flex-1 pr-4">
              {property.title}
            </h1>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                ${property.price?.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">
                {property.period === 'monthly' ? '/month' : property.period === 'yearly' ? '/year' : ''}
              </div>
            </div>
          </div>
          
          <div className="flex items-center text-gray-600 mb-4">
            <MapPin className="w-4 h-4 mr-1" />
            <span className="text-sm">{property.location}</span>
          </div>

          {/* Rating */}
          {property.rating && (
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
              <span className="text-sm font-medium text-gray-900 mr-1">
                {property.rating}
              </span>
              <span className="text-sm text-gray-500">
                ({property.reviews || 0} reviews)
              </span>
            </div>
          )}
        </div>

        {/* Highlights */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Property Highlights</h3>
          <div className="grid grid-cols-2 gap-3">
            {highlights.map((highlight, index) => (
              <div key={index} className="flex items-center bg-gray-50 rounded-lg p-3">
                <highlight.icon className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {highlight.value}
                  </div>
                  <div className="text-xs text-gray-500">{highlight.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        {property.description && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
            <p className="text-gray-600 leading-relaxed">
              {property.description}
            </p>
          </div>
        )}

        {/* Amenities */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h3>
          <div className="grid grid-cols-2 gap-2">
            {amenities.slice(0, 6).map((amenity, index) => (
              <div key={index} className="flex items-center py-2">
                <amenity.icon className="w-4 h-4 text-blue-600 mr-3" />
                <span className="text-sm text-gray-700">{amenity.label}</span>
              </div>
            ))}
          </div>
          {amenities.length > 6 && (
            <Sheet open={showInfoSheet} onOpenChange={setShowInfoSheet}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full mt-3">
                  <Info className="w-4 h-4 mr-2" />
                  View All Amenities
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[70vh]">
                <SheetHeader className="mb-4">
                  <SheetTitle>All Amenities</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-2 gap-3 pb-6">
                  {amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center py-2">
                      <amenity.icon className="w-4 h-4 text-blue-600 mr-3" />
                      <span className="text-sm text-gray-700">{amenity.label}</span>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* Landlord Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Landlord</h3>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {property.profiles?.full_name || "Property Owner"}
                  </div>
                  <div className="text-sm text-gray-500">Verified Landlord</div>
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                  <span className="text-sm font-medium">4.8</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom padding for sticky footer */}
        <div className="h-20" />
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-pb">
        <div className="flex space-x-3">
          <Sheet open={showContactSheet} onOpenChange={setShowContactSheet}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex-1">
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[50vh]">
              <SheetHeader className="mb-4">
                <SheetTitle>Contact Landlord</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 pb-6">
                <Button 
                  className="w-full h-12 text-left justify-start"
                  onClick={handleContact}
                >
                  <MessageCircle className="w-5 h-5 mr-3" />
                  Send Message
                </Button>
                <Button 
                  variant="outline"
                  className="w-full h-12 text-left justify-start"
                >
                  <Phone className="w-5 h-5 mr-3" />
                  Call Now
                </Button>
                <Button 
                  variant="outline"
                  className="w-full h-12 text-left justify-start"
                >
                  <Mail className="w-5 h-5 mr-3" />
                  Send Email
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={handleBookTour}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Book Tour
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobilePropertyDetail; 