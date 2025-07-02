import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase, Property } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import RentalApplicationForm from '@/components/RentalApplicationForm';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { Wifi, Car, Shield, Zap, Wind, Sun, MapPin, Home, Bed, Bath } from 'lucide-react';

const RenterPropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile, hasRole } = useAuth();
  const { toast } = useToast();
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('properties')
          .select(`*, profiles!properties_landlord_id_fkey (*)`)
          .eq('id', id)
          .single();
        if (error) throw error;
        setProperty(data);
      } catch (error: any) {
        console.error('Error fetching property:', error);
        toast({ title: "Error", description: "Failed to load property details.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id, toast]);

  const handleBack = () => {
    navigate("/properties");
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
            <Link to="/properties">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
                Back to Properties
              </button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Prepare images for gallery
  const images = property.photo_urls && property.photo_urls.length > 0
    ? property.photo_urls
    : property.photo_url
    ? [property.photo_url]
    : ['/placeholder.svg'];

  return (
    <Layout>
      {/* Hero Section with Carousel and Overlay */}
      <div className="relative w-full">
        <div className="w-full h-[340px] md:h-[420px] overflow-hidden">
          <Carousel className="group">
            <CarouselContent>
              {images.map((url, idx) => (
                <CarouselItem key={idx}>
                  <img src={url} alt={property.title} className="w-full h-[340px] md:h-[420px] object-cover rounded-xl transition-all duration-300" />
                </CarouselItem>
              ))}
            </CarouselContent>
            {/* Navigation Arrows */}
            <CarouselPrevious className="left-4 top-1/2 -translate-y-1/2 z-10 opacity-80 group-hover:opacity-100 transition" />
            <CarouselNext className="right-4 top-1/2 -translate-y-1/2 z-10 opacity-80 group-hover:opacity-100 transition" />
          </Carousel>
          {/* Dot Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, idx) => (
              <span key={idx} className={`h-2 w-2 rounded-full bg-white/80 border border-white shadow ${idx === 0 ? 'bg-blue-500' : ''}`}></span>
            ))}
          </div>
        </div>
        {/* Overlayed Title, Location, Price */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 via-black/10 to-transparent p-6 flex flex-col md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 drop-shadow-lg">{property.title}</h1>
            <div className="flex items-center text-blue-200 text-lg font-medium mb-2">
              <MapPin className="w-5 h-5 mr-2" />
              {property.location}
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-green-400 drop-shadow-lg mt-2 md:mt-0">
            ₦{property.price.toLocaleString()}/year
          </div>
        </div>
      </div>

      {/* Main Content Two-Column Layout */}
      <div className="max-w-5xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Description & Amenities */}
        <div className="md:col-span-2 flex flex-col gap-8">
          {/* Description Card */}
          <div className="bg-white/90 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-700 text-lg leading-relaxed">{property.description}</p>
          </div>
          {/* Amenities Card */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="bg-white/90 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {property.amenities.map((amenity, idx) => {
                  const iconMap: Record<string, JSX.Element> = {
                    wifi: <Wifi className="w-6 h-6 mb-1 text-blue-500" />,
                    parking: <Car className="w-6 h-6 mb-1 text-yellow-500" />,
                    security: <Shield className="w-6 h-6 mb-1 text-green-600" />,
                    generator: <Zap className="w-6 h-6 mb-1 text-orange-500" />,
                    ac: <Wind className="w-6 h-6 mb-1 text-cyan-500" />,
                    balcony: <Sun className="w-6 h-6 mb-1 text-yellow-400" />,
                  };
                  return (
                    <div key={idx} className="flex flex-col items-center bg-gray-100 rounded-lg p-3">
                      {iconMap[amenity] || <Home className="w-6 h-6 mb-1 text-gray-400" />}
                      <span className="text-gray-700 text-sm font-medium text-center">
                        {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {/* Right Column: Property Details, Actions, Owner Info */}
        <div className="flex flex-col gap-8">
          {/* Property Details Card */}
          <div className="bg-white/90 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Property Details</h2>
            <div className="space-y-3 text-gray-800 text-lg">
              <div className="flex items-center justify-between">
                <span className="flex items-center"><Bed className="w-5 h-5 mr-2 text-blue-500" />Bedrooms:</span>
                <span>{property.bedrooms}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center"><Bath className="w-5 h-5 mr-2 text-cyan-500" />Bathrooms:</span>
                <span>{property.bathrooms}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <span className={property.status === 'active' ? 'text-green-600 font-semibold' : 'text-yellow-600 font-semibold'}>
                  {property.status === 'active' ? 'Available' : 'Not Available'}
                </span>
              </div>
              {/* TODO: Add more details (type, size, year, etc.) */}
            </div>
          </div>
          {/* Owner Info Card */}
          {property.profiles && (
            <div className="bg-white/90 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Contact Owner</h2>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Owner:</span>
                  <span className="text-gray-800">{property.profiles.full_name || 'Property Owner'}</span>
                </div>
                <button 
                  onClick={() => navigate(`/property/${property.id}/chat`)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors mt-4 font-semibold"
                >
                  Send Message
                </button>
              </div>
            </div>
          )}
          {/* Actions Card (Apply Now) */}
          {profile && !hasRole('landlord') && property.status === 'active' && (
            <div className="bg-white/90 rounded-xl shadow-lg p-6 sticky top-24">
              <Dialog open={showApplicationModal} onOpenChange={setShowApplicationModal}>
                <DialogTrigger asChild>
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors font-bold text-lg">
                    Apply Now
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rental Application</DialogTitle>
                  </DialogHeader>
                  <RentalApplicationForm propertyId={property.id} onSuccess={() => setShowApplicationModal(false)} />
                </DialogContent>
              </Dialog>
            </div>
          )}
          {/* TODO: Add map, price breakdown, reviews, etc. */}
        </div>
      </div>
    </Layout>
  );
};

export default RenterPropertyDetail; 