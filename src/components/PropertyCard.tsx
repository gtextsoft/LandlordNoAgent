
import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Bed, Bath, User, Trash2, Edit, Heart } from "lucide-react";
import { Property } from "@/lib/supabase";
import { useSavedProperties } from "@/hooks/useSavedProperties";
import { EditPropertyModal } from "./EditPropertyModal";

interface PropertyCardProps {
  property: Property;
  showActions?: boolean;
  showDeleteButton?: boolean;
  showEditButton?: boolean;
  showSaveButton?: boolean;
  onToggleStatus?: (propertyId: string, currentStatus: string) => void;
  onDelete?: (propertyId: string) => void;
  onUpdate?: () => void;
}

const PropertyCard = ({ 
  property, 
  showActions = false, 
  showDeleteButton = false,
  showEditButton = false,
  showSaveButton = true,
  onToggleStatus,
  onDelete,
  onUpdate
}: PropertyCardProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const { isSaved, toggleSavedProperty } = useSavedProperties();
  const fallbackImage = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop";
  
  const handleEditSuccess = () => {
    onUpdate?.();
  };

  const handleSaveToggle = async () => {
    setIsToggling(true);
    try {
      await toggleSavedProperty(property.id);
    } finally {
      setIsToggling(false);
    }
  };

  const propertyIsSaved = isSaved(property.id);

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden group relative">
        <div className="aspect-video overflow-hidden relative">
          <img
            src={property.photo_url || fallbackImage}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = fallbackImage;
            }}
          />
          <div className="absolute top-3 right-3">
            <Badge 
              variant={property.status === 'active' ? 'default' : 'secondary'}
              className="shadow-sm"
            >
              {property.status}
            </Badge>
          </div>
          {showSaveButton && (
            <div className="absolute top-3 left-3">
              <Button
                size="sm"
                variant={propertyIsSaved ? "default" : "secondary"}
                className={`p-2 h-9 w-9 shadow-sm transition-all duration-200 ${
                  propertyIsSaved 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-white/90 hover:bg-white text-gray-700'
                } ${isToggling ? 'animate-pulse' : ''}`}
                onClick={handleSaveToggle}
                disabled={isToggling}
              >
                <Heart 
                  className={`w-4 h-4 transition-all duration-200 ${
                    propertyIsSaved ? 'fill-white text-white scale-110' : 'text-gray-600'
                  }`} 
                />
              </Button>
            </div>
          )}
        </div>
        
        <CardContent className="p-4 md:p-5">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
                {property.title}
              </h3>
              {property.location && (
                <div className="flex items-center text-gray-500 text-sm mt-1">
                  <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="line-clamp-1">{property.location}</span>
                </div>
              )}
            </div>

            {property.profiles && (
              <div className="flex items-center text-gray-600 text-sm">
                <User className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="line-clamp-1">Listed by {property.profiles.full_name || 'Property Owner'}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-xl md:text-2xl font-bold text-blue-600">
                ${property.price.toLocaleString()}
                <span className="text-sm text-gray-500 font-normal">/month</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                {property.bedrooms !== undefined && (
                  <div className="flex items-center">
                    <Bed className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">{property.bedrooms || 'Studio'}</span>
                  </div>
                )}
                {property.bathrooms !== undefined && (
                  <div className="flex items-center">
                    <Bath className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">{property.bathrooms}</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-gray-600 text-sm line-clamp-2">
              {property.description}
            </p>

            {property.amenities && property.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {property.amenities.slice(0, 3).map((amenity, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
                {property.amenities.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{property.amenities.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 md:p-5 pt-0 flex gap-2">
          {showActions && onToggleStatus ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onToggleStatus(property.id, property.status)}
                className="flex-1"
              >
                {property.status === 'active' ? 'Suspend' : 'Activate'}
              </Button>
              {showEditButton && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              <Link to={`/property/${property.id}`} className="flex-1">
                <Button size="sm" className="w-full">
                  View Details
                </Button>
              </Link>
              {showDeleteButton && onDelete && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => onDelete(property.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </>
          ) : (
            <Link to={`/property/${property.id}`} className="w-full">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200">
                View Details
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>

      {showEditModal && (
        <EditPropertyModal
          property={property}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
};

export default PropertyCard;
