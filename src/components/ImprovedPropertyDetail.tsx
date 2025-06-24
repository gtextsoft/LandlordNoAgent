import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  Share2, 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Calendar, 
  Shield, 
  Wifi, 
  Car, 
  Utensils,
  Zap,
  Droplets,
  Phone,
  MessageCircle,
  Star,
  ChevronLeft,
  ChevronRight,
  Play,
  Camera,
  Map,
  Building,
  User,
  Clock,
  CheckCircle,
  X,
  ArrowLeft,
  ExternalLink,
  Eye,
  Flag,
} from 'lucide-react';
import PropertyImageGallery from '@/components/PropertyImageGallery';
import { useAuth } from '@/hooks/useAuth';
import { Property as BaseProperty } from '@/lib/supabase';

// Extended Property interface with additional fields for ImprovedPropertyDetail
interface Property extends BaseProperty {
  image_url?: string;
  images?: string[];
  size?: string;
  furnished?: boolean;
  available_from?: string;
  property_type?: string;
  landlord?: {
    full_name: string;
    avatar_url?: string;
    phone?: string;
  };
  views?: number;
}

interface ImprovedPropertyDetailProps {
  property: Property;
  onBack?: () => void;
  onSave?: (propertyId: string) => void;
  onContact?: (propertyId: string) => void;
  onScheduleTour?: (propertyId: string) => void;
  onShare?: (propertyId: string) => void;
  onReport?: (propertyId: string) => void;
}

const ImprovedPropertyDetail = ({
  property,
  onBack,
  onSave,
  onContact,
  onScheduleTour,
  onShare,
  onReport
}: ImprovedPropertyDetailProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [viewCount, setViewCount] = useState(property.views || 0);
  
  const { profile } = useAuth();

  // Simulate view tracking
  useEffect(() => {
    const timer = setTimeout(() => {
      setViewCount(prev => prev + 1);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const amenities = [
    { icon: Wifi, label: 'WiFi', available: true },
    { icon: Car, label: 'Parking', available: true },
    { icon: Utensils, label: 'Kitchen', available: true },
    { icon: Zap, label: 'Generator', available: true },
    { icon: Droplets, label: 'Water Supply', available: true },
    { icon: Shield, label: 'Security', available: true },
  ];

  const propertyFeatures = [
    { label: 'Property Type', value: property.property_type },
    { label: 'Bedrooms', value: `${property.bedrooms} bed${property.bedrooms > 1 ? 's' : ''}` },
    { label: 'Bathrooms', value: `${property.bathrooms} bath${property.bathrooms > 1 ? 's' : ''}` },
    { label: 'Size', value: property.size ? `${property.size} sqft` : 'Not specified' },
    { label: 'Furnished', value: property.furnished ? 'Yes' : 'No' },
    { label: 'Available From', value: new Date(property.available_from || Date.now()).toLocaleDateString() },
  ];

  const landlordInfo = {
    name: property.landlord?.full_name || 'Property Owner',
    avatar: property.landlord?.avatar_url,
    responseTime: '< 1 hour',
    responseRate: '95%',
    propertiesCount: 12,
    joinedDate: '2023',
    isVerified: true
  };

  const similarProperties = [
    // Mock similar properties - in real app, this would come from API
    {
      id: '1',
      title: 'Similar 2BR Apartment',
      price: 450000,
      location: 'Lekki Phase 1',
      image: '/placeholder.svg'
    },
    {
      id: '2',
      title: 'Another Great Option',
      price: 520000,
      location: 'Victoria Island',
      image: '/placeholder.svg'
    }
  ];

  const handleSave = () => {
    setIsSaved(!isSaved);
    onSave?.(property.id);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: `Check out this property: ${property.title}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Show toast notification
    }
    onShare?.(property.id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {onBack && (
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              <div>
                <h1 className="text-lg font-semibold text-gray-900 truncate max-w-md">
                  {property.title}
                </h1>
                <p className="text-sm text-gray-500 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {property.location}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center text-sm text-gray-500">
                <Eye className="w-4 h-4 mr-1" />
                {viewCount.toLocaleString()} views
              </div>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
              <Button 
                variant={isSaved ? "default" : "ghost"} 
                size="sm" 
                onClick={handleSave}
                className={isSaved ? "text-white bg-red-500 hover:bg-red-600" : ""}
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onReport?.(property.id)}>
                <Flag className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <div className="relative">
                <div 
                  className="aspect-[16/10] bg-gray-200 cursor-pointer"
                  onClick={() => setIsGalleryOpen(true)}
                >
                  <img 
                    src={property.image_url || '/placeholder.svg'} 
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                    <Button variant="secondary" className="bg-white/90 hover:bg-white">
                      <Camera className="w-4 h-4 mr-2" />
                      View All Photos
                    </Button>
                  </div>
                </div>
                
                {/* Image Navigation */}
                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  1 / {property.images?.length || 1}
                </div>
                
                {/* Quick Actions Overlay */}
                <div className="absolute top-4 right-4 flex space-x-2">
                  <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white">
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white">
                    <Map className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Property Details Tabs */}
            <Card>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <CardHeader>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="amenities">Amenities</TabsTrigger>
                    <TabsTrigger value="location">Location</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  </TabsList>
                </CardHeader>
                
                <CardContent>
                  <TabsContent value="overview" className="space-y-6">
                    {/* Price and Key Info */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          ₦{property.price?.toLocaleString()}/month
                        </div>
                        <div className="flex items-center space-x-4 text-gray-600">
                          <div className="flex items-center">
                            <Bed className="w-4 h-4 mr-1" />
                            {property.bedrooms} beds
                          </div>
                          <div className="flex items-center">
                            <Bath className="w-4 h-4 mr-1" />
                            {property.bathrooms} baths
                          </div>
                          <div className="flex items-center">
                            <Square className="w-4 h-4 mr-1" />
                            {property.size || 'N/A'} sqft
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Available
                      </Badge>
                    </div>

                    <Separator />

                    {/* Description */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                      <div className="text-gray-600 leading-relaxed">
                        <p>
                          {showFullDescription 
                            ? property.description 
                            : `${property.description?.substring(0, 300)}${property.description && property.description.length > 300 ? '...' : ''}`
                          }
                        </p>
                        {property.description && property.description.length > 300 && (
                          <Button 
                            variant="link" 
                            className="p-0 h-auto text-blue-600 mt-2"
                            onClick={() => setShowFullDescription(!showFullDescription)}
                          >
                            {showFullDescription ? 'Show less' : 'Show more'}
                          </Button>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Property Features Grid */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Property Features</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {propertyFeatures.map((feature, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm text-gray-500">{feature.label}</div>
                            <div className="font-medium text-gray-900">{feature.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="amenities" className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">What this place offers</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {amenities.map((amenity, index) => (
                          <div 
                            key={index}
                            className={`flex items-center space-x-3 p-3 rounded-lg border ${
                              amenity.available 
                                ? 'border-green-200 bg-green-50' 
                                : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <amenity.icon className={`w-5 h-5 ${
                              amenity.available ? 'text-green-600' : 'text-gray-400'
                            }`} />
                            <span className={`font-medium ${
                              amenity.available ? 'text-green-900' : 'text-gray-500'
                            }`}>
                              {amenity.label}
                            </span>
                            {amenity.available && (
                              <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="location" className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Location & Neighborhood</h3>
                      <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <Map className="w-12 h-12 mx-auto mb-2" />
                          <p>Interactive map would go here</p>
                        </div>
                      </div>
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Nearby Places</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                          <div>• Shopping Mall - 0.5km</div>
                          <div>• Hospital - 1.2km</div>
                          <div>• School - 0.8km</div>
                          <div>• Bus Stop - 0.2km</div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="reviews" className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Reviews</h3>
                        <div className="flex items-center space-x-2">
                          <Star className="w-5 h-5 text-yellow-400 fill-current" />
                          <span className="font-medium">4.8</span>
                          <span className="text-gray-500">(24 reviews)</span>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {[1, 2, 3].map((review) => (
                          <div key={review} className="border-b border-gray-200 pb-4">
                            <div className="flex items-start space-x-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback>JD</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium">John Doe</span>
                                  <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-gray-600 text-sm">
                                  Great property with excellent amenities. The landlord was very responsive and helpful.
                                </p>
                                <span className="text-xs text-gray-400">2 weeks ago</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>

            {/* Similar Properties */}
            <Card>
              <CardHeader>
                <CardTitle>Similar Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {similarProperties.map((similar) => (
                    <div key={similar.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex space-x-3">
                        <img 
                          src={similar.image} 
                          alt={similar.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{similar.title}</h4>
                          <p className="text-sm text-gray-500 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {similar.location}
                          </p>
                          <p className="text-sm font-semibold text-green-600">
                            ₦{similar.price.toLocaleString()}/month
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Contact Property Owner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Landlord Info */}
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={landlordInfo.avatar} />
                    <AvatarFallback>{landlordInfo.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{landlordInfo.name}</span>
                      {landlordInfo.isVerified && (
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">Property Owner</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 py-3 border-y border-gray-200">
                  <div className="text-center">
                    <div className="text-sm font-medium">{landlordInfo.responseTime}</div>
                    <div className="text-xs text-gray-500">Response time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{landlordInfo.responseRate}</div>
                    <div className="text-xs text-gray-500">Response rate</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => onContact?.(property.id)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => onScheduleTour?.(property.id)}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Tour
                  </Button>
                  
                  <Button variant="outline" className="w-full">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now
                  </Button>
                </div>

                {/* Safety Note */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <Shield className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div className="text-xs text-yellow-800">
                      <p className="font-medium">Stay safe</p>
                      <p>Never send money before viewing the property in person.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Property Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Listed</span>
                  <span className="text-sm font-medium">3 days ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Views</span>
                  <span className="text-sm font-medium">{viewCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Inquiries</span>
                  <span className="text-sm font-medium">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Property ID</span>
                  <span className="text-sm font-medium">#{property.id}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {isGalleryOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-7xl max-h-full">
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4 z-10"
              onClick={() => setIsGalleryOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
            
            <PropertyImageGallery
              images={property.images || [property.image_url || '/placeholder.svg']}
              propertyTitle={property.title}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovedPropertyDetail; 