import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  MapPin, 
  MessageCircle, 
  User, 
  Calendar, 
  Bed, 
  Bath, 
  Check, 
  Home,
  Wifi,
  Wind,
  Zap,
  Car,
  Sun,
  Shield,
  Star,
  Clock,
  CreditCard,
  FileText,
  AlertCircle,
  Phone,
  Mail,
  X,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Settings
} from "lucide-react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import PropertyImageGallery from '@/components/PropertyImageGallery';
import Layout from '@/components/Layout';

interface Property {
  id: string;
  title: string;
  price: number;
  description: string;
  photo_url: string;
  location: string;
  status: string;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  landlord_id: string;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string;
    email: string;
  };
  photo_urls?: string[];
}

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const { profile, hasRole } = useAuth();
  const { toast } = useToast();

  // Prepare gallery images
  const galleryImages = property?.photo_urls && property.photo_urls.length > 0 
    ? property.photo_urls 
    : property?.photo_url 
    ? [property.photo_url] 
    : [];

  // Check if current user is the property owner
  const isOwner = profile?.role === 'landlord' && property?.landlord_id === profile.id;

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('properties')
          .select(`
            *,
            profiles!properties_landlord_id_fkey (*)
          `)
          .eq('id', id)
          .single();
        
        if (error) {
          throw error;
        }
        
        setProperty(data as any);
      } catch (error: any) {
        console.error('Error fetching property:', error);
        toast({
          title: "Error",
          description: "Failed to load property details.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperty();
  }, [id, toast]);

  // Keyboard navigation for image modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showImageModal || galleryImages.length === 0) return;

      switch (e.key) {
        case 'Escape':
          setShowImageModal(false);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setSelectedImageIndex(prev => prev === 0 ? galleryImages.length - 1 : prev - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          setSelectedImageIndex(prev => prev === galleryImages.length - 1 ? 0 : prev + 1);
          break;
      }
    };

    if (showImageModal) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [showImageModal, galleryImages.length]);

  const handleStartChat = () => {
    if (!profile) {
      toast({
        title: "Authentication Required",
        description: "Please log in to start a conversation.",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    if (!property) {
      toast({
        title: "Error",
        description: "Property information not available.",
        variant: "destructive"
      });
      return;
    }

    // Check if user is trying to chat with themselves (landlord with own property)
    if (profile.role === 'landlord' && property.landlord_id === profile.id) {
      toast({
        title: "Cannot Start Chat",
        description: "You cannot start a chat with yourself on your own property.",
        variant: "destructive"
      });
      return;
    }

    // Navigate to property chat page
    navigate(`/property/${property.id}/chat`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
      </Layout>
    );
  }

  if (!property) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Property not found</h2>
            <p className="text-gray-400 mb-4">The property you're looking for doesn't exist.</p>
            <Link to={profile && hasRole('landlord') ? "/landlord" : "/properties"}>
            <Button>
              <Home className="w-4 h-4 mr-2" />
                {profile && hasRole('landlord') ? "Back to Dashboard" : "Back to Properties"}
            </Button>
          </Link>
        </div>
      </div>
      </Layout>
    );
  }

  // Generate amenities based on property data and common amenities
  const getAmenitiesWithIcons = () => {
    const commonAmenities = [
    { name: "Free WiFi", icon: Wifi },
    { name: "Air Conditioning", icon: Wind },
    { name: "Constant Power + Water", icon: Zap },
    { name: "Dedicated Parking", icon: Car },
    { name: "Solar Backup", icon: Sun },
    { name: "24/7 Security", icon: Shield },
  ];

    // If property has specific amenities, use those, otherwise use common ones
    if (property.amenities && property.amenities.length > 0) {
      return property.amenities.map(amenity => ({
        name: amenity,
        icon: commonAmenities.find(a => a.name.toLowerCase().includes(amenity.toLowerCase()))?.icon || Wifi
      }));
    }

    return commonAmenities;
  };

  const amenitiesWithIcons = getAmenitiesWithIcons();

  const keyFeatures = [
    { label: "Bedrooms", value: property.bedrooms ? `${property.bedrooms} ${property.bedrooms > 1 ? 'bedrooms' : 'bedroom'}` : "Not specified" },
    { label: "Bathrooms", value: property.bathrooms ? `${property.bathrooms} ${property.bathrooms > 1 ? 'bathrooms' : 'bathroom'}` : "Not specified" },
    { label: "Property Type", value: "Residential" },
    { label: "Status", value: property.status === 'active' ? 'Available' : 'Not Available' },
    { label: "Location", value: property.location },
    { label: "Listed", value: new Date(property.created_at).toLocaleDateString() },
  ];

  const rentalTerms = [
    { term: "Rent", amount: `₦${property.price.toLocaleString()}/year` },
    { term: "Service Charge", amount: `₦${Math.round(property.price * 0.1).toLocaleString()} (estimated)` },
    { term: "Agency Fee", amount: `₦${Math.round(property.price * 0.1).toLocaleString()} (estimated)` },
    { term: "Caution Fee", amount: `₦${Math.round(property.price * 0.1).toLocaleString()} (refundable)` },
    { term: "Legal Agreement", amount: `₦${Math.round(property.price * 0.1).toLocaleString()} (10% of yearly rent)` },
    { term: "Total Payment", amount: "Contact landlord for details" },
  ];

  const requirements = [
    "Proof of employment or income",
    "Valid ID (National ID, Passport, or Driver's License)",
    "Reference letters (if required)",
    "Willingness to maintain property in good condition",
  ];

  const houseRules = [
    { rule: "No smoking inside the apartment", allowed: false },
    { rule: "No loud music or excessive noise", allowed: false },
    { rule: "Pets policy as per landlord's discretion", allowed: true },
    { rule: "Proper maintenance of property required", allowed: true },
    { rule: "Respect for neighbors and community", allowed: true },
    { rule: "No illegal activities", allowed: false },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header with Title and Location */}
        <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-blue-400 mb-1">
                {property.title}
              </h1>
              <div className="flex items-center text-gray-300 text-sm">
                <MapPin className="w-4 h-4 mr-1" />
                {property.location}
              </div>
            </div>
            <Link to={profile && hasRole('landlord') ? "/landlord" : "/properties"} className="flex items-center text-blue-400 hover:text-blue-300 transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              {profile && hasRole('landlord') ? "Back to Dashboard" : "Back to Properties"}
            </Link>
          </div>
        </div>

      <div className="p-6">
        {/* Property Image Gallery */}
        <div className="mb-6">
          <div className="relative">
            {/* Main Image */}
            <div className="h-96 bg-gray-700 rounded-lg overflow-hidden mb-4 relative group cursor-pointer"
                 onClick={() => setShowImageModal(true)}>
              {galleryImages.length > 0 ? (
                <>
                  <img 
                    src={galleryImages[selectedImageIndex]} 
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Navigation arrows */}
                  {galleryImages.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex(prev => prev === 0 ? galleryImages.length - 1 : prev - 1);
                        }}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex(prev => prev === galleryImages.length - 1 ? 0 : prev + 1);
                        }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      >
                        <ArrowLeft className="w-5 h-5 transform rotate-180" />
                      </button>
                    </>
                  )}
                  {/* Image counter */}
                  <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {selectedImageIndex + 1} / {galleryImages.length}
                  </div>
                  {/* View full size hint */}
                  <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Click to view full size
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-500">No image available</span>
                </div>
              )}
            </div>
            
            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {galleryImages.map((image, index) => (
                <div 
                  key={index} 
                  className={`h-20 bg-gray-700 rounded overflow-hidden cursor-pointer border-2 transition-all duration-300 ${
                    selectedImageIndex === index 
                      ? 'border-blue-400 ring-2 ring-blue-400/50' 
                      : 'border-transparent hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img 
                    src={image} 
                    alt={`${property.title} ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Overview */}
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center px-4 py-3 border-b border-gray-700">
                <Home className="w-5 h-5 mr-2 text-blue-400" />
                <h2 className="font-semibold">Property Overview</h2>
              </div>
              <div className="p-4 space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  {property.description}
                </p>
                <div className="text-sm text-gray-400">
                  <strong>The apartment features:</strong>
                </div>
                <ul className="list-disc list-inside space-y-1 text-gray-300 ml-4">
                  <li>A spacious living room</li>
                  <li>Dining area</li>
                  <li>Fully equipped kitchen (cabinets, sink, gas-ready)</li>
                  <li>All rooms ensuite with good ventilation and stable water supply</li>
                  <li>Located close to major amenities (supermarkets, schools, banks)</li>
                </ul>
                <p className="text-sm text-gray-400 mt-4">
                  No agents; it's so easy! Just peace of mind.
                </p>
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center px-4 py-3 border-b border-gray-700">
                <Wifi className="w-5 h-5 mr-2 text-blue-400" />
                <h2 className="font-semibold">Amenities</h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {amenitiesWithIcons.map((amenity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-2 bg-gray-700 rounded">
                      <amenity.icon className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-gray-300">{amenity.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center px-4 py-3 border-b border-gray-700">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" />
                <h2 className="font-semibold">Key Features</h2>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {keyFeatures.map((feature, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                      <span className="text-gray-300">{feature.label}</span>
                      <span className="text-gray-400">{feature.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rental Terms */}
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center px-4 py-3 border-b border-gray-700">
                <CreditCard className="w-5 h-5 mr-2 text-green-400" />
                <h2 className="font-semibold">Rental Terms</h2>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {rentalTerms.map((term, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                      <span className="text-gray-300">{term.term}</span>
                      <span className="text-white font-medium">{term.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="px-4 py-3 border-b border-gray-700">
                <h2 className="font-semibold">Requirements</h2>
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  {requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span className="text-gray-300">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* House Rules & Rental Terms */}
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="px-4 py-3 border-b border-gray-700">
                <h2 className="font-semibold">House Rules & Rental Terms</h2>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {houseRules.map((rule, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      {rule.allowed ? (
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      ) : (
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      )}
                      <span className="text-gray-300">{rule.rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cancellation Terms */}
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="px-4 py-3 border-b border-gray-700">
                <h2 className="font-semibold">Cancellation Terms</h2>
              </div>
              <div className="p-4 space-y-3 text-gray-300">
                <p><strong className="text-white">Refund:</strong> Cancellation 30 to 1 day before move-in (without penalty)</p>
                <p><strong className="text-white">For Cancellation:</strong> If you're moving out, lease is transferable to a landlord for landlord's commission</p>
                <p><strong className="text-white">Partial Refund:</strong> Some fees are refunded, check terms, and be including a small penalty to cover contract processing</p>
              </div>
                </div>

            {/* Recent Activity - Only for landlords */}
            {isOwner && (
              <div className="bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-center px-4 py-3 border-b border-gray-700">
                  <Clock className="w-5 h-5 mr-2 text-purple-400" />
                  <h2 className="font-semibold">Recent Activity</h2>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 bg-gray-700 rounded">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-300">New inquiry from John Smith</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-gray-700 rounded">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-300">Property viewed 15 times today</p>
                        <p className="text-xs text-gray-500">1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-gray-700 rounded">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-300">Property saved by 3 users</p>
                        <p className="text-xs text-gray-500">2 days ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Note - Different content for owner vs renter */}
            <div className="bg-gray-800 rounded-lg border border-yellow-600 border-l-4">
              <div className="flex items-center px-4 py-3 border-b border-gray-700">
                <AlertCircle className="w-5 h-5 mr-2 text-yellow-500" />
                <h2 className="font-semibold text-yellow-500">
                  {isOwner ? "Management Note" : "Note"}
                </h2>
              </div>
              <div className="p-4">
                {isOwner ? (
                  <div className="space-y-2">
                    <p className="text-gray-300">
                      This is your property listing. You can edit details, manage inquiries, and view statistics from the management panel.
                    </p>
                    <p className="text-sm text-yellow-400">
                      💡 Keep your property information updated to attract more inquiries.
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-300">
                    Contact the landlord to ask about lease pricing and viewing availability. 
                    The landlord is open and easily reachable 24/7.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {isOwner ? (
              // Landlord/Owner View
              <>
                {/* Property Management */}
                <div className="bg-gray-800 rounded-lg border border-gray-700">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <h2 className="font-semibold text-blue-400">Property Management</h2>
                  </div>
                  <div className="p-4 space-y-3">
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => navigate(`/landlord/edit/${property.id}`)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Property
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full bg-transparent border-gray-600 text-white hover:bg-gray-700"
                      onClick={() => navigate('/messages')}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      View Messages
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full bg-transparent border-red-600 text-red-400 hover:bg-red-900"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Property
                    </Button>
                  </div>
                </div>

                {/* Property Stats */}
                <div className="bg-gray-800 rounded-lg border border-gray-700">
                  <div className="flex items-center px-4 py-3 border-b border-gray-700">
                    <BarChart3 className="w-5 h-5 mr-2 text-green-400" />
                    <h2 className="font-semibold">Property Statistics</h2>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Views</span>
                      <span className="text-white font-medium">142</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Inquiries</span>
                      <span className="text-white font-medium">8</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Saves</span>
                      <span className="text-white font-medium">23</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Status</span>
                      <Badge className="bg-green-600 text-white">Active</Badge>
                    </div>
                  </div>
                </div>

                {/* Property Revenue */}
                <div className="bg-gray-800 rounded-lg border border-gray-700">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <h2 className="font-semibold">Revenue Information</h2>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="text-2xl font-bold text-white">₦{property.price.toLocaleString()}</div>
                      <div className="text-gray-400">Annual Rent</div>
                      <div className="text-sm text-gray-500">₦{Math.round(property.price / 12).toLocaleString()} / month</div>
                    </div>
                    <div className="pt-3 border-t border-gray-700">
                      <div className="text-sm text-gray-400">Potential Income</div>
                      <div className="text-lg font-semibold text-green-400">₦{property.price.toLocaleString()}/year</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Renter/Visitor View
              <>
            {/* Price Summary */}
                <div className="bg-gray-800 rounded-lg border border-gray-700">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <h2 className="font-semibold">Price Summary</h2>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="text-2xl font-bold text-white">₦{property.price.toLocaleString()}</div>
                      <div className="text-gray-400">/ year</div>
                      <div className="text-sm text-gray-500">₦{Math.round(property.price / 12).toLocaleString()} / month</div>
                      <div className="text-sm text-blue-400">Flexible payment plans available</div>
                    </div>
                  </div>
                </div>

                {/* Contact Landlord */}
                <div className="bg-gray-800 rounded-lg border border-gray-700">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <h2 className="font-semibold">Contact Landlord</h2>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                <div>
                        <div className="font-semibold text-white">
                          {property.profiles?.full_name || 'John Doe'}
                        </div>
                        <Badge variant="secondary" className="text-xs bg-green-600 text-white">
                          Verified
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={handleStartChat}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Start Chat
                      </Button>
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Book Inspection
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Location - Show for both */}
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center px-4 py-3 border-b border-gray-700">
                <MapPin className="w-5 h-5 mr-2 text-blue-400" />
                <h2 className="font-semibold">Location</h2>
              </div>
              <div className="p-4 space-y-3">
                <div className="text-white font-medium">{property.location}</div>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• 3 mins to Lekki Epe Expressway</li>
                  <li>• Walking distance to Eateria Supermarket, pharmacies, gyms</li>
                  <li>• Close to schools and tech hubs</li>
                  <li>• Quiet residential estate with good drainage</li>
                </ul>
                <div className="bg-gray-700 rounded-lg h-32 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Map placeholder</span>
                </div>
              </div>
                  </div>
                    </div>
                  </div>
                </div>

      {/* Full Screen Image Modal */}
      {showImageModal && galleryImages.length > 0 && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors duration-300"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation arrows */}
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImageIndex(prev => prev === 0 ? galleryImages.length - 1 : prev - 1)}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full z-10 transition-colors duration-300"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setSelectedImageIndex(prev => prev === galleryImages.length - 1 ? 0 : prev + 1)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full z-10 transition-colors duration-300"
                >
                  <ArrowLeft className="w-6 h-6 transform rotate-180" />
                </button>
              </>
            )}

            {/* Main image */}
            <img
              src={galleryImages[selectedImageIndex]}
              alt={`${property.title} ${selectedImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full">
              {selectedImageIndex + 1} of {galleryImages.length}
            </div>

            {/* Thumbnail navigation */}
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2 overflow-x-auto max-w-full">
              {galleryImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all duration-300 ${
                    selectedImageIndex === index
                      ? 'border-blue-400 ring-2 ring-blue-400/50'
                      : 'border-white/30 hover:border-white/60'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
                </div>
          </div>

          {/* Click outside to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={() => setShowImageModal(false)}
          />
        </div>
      )}
      </div>
    </Layout>
  );
};

export default PropertyDetail;
