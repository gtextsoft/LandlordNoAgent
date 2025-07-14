import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase, Property } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import RentalApplicationForm from '@/components/RentalApplicationForm';
import PropertyStatusBadge from '@/components/PropertyStatusBadge';
import { DemoPaymentGateway } from '@/components/DemoPaymentGateway';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile, hasRole } = useAuth();
  const { toast } = useToast();
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPropertyAndApplication = async () => {
      if (!id || !profile) return;
      
      setLoading(true);
      try {
        // Fetch property details
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select(`
            *,
            profiles!properties_landlord_id_fkey (*)
          `)
          .eq('id', id)
          .single();
        
        if (propertyError) throw propertyError;
        setProperty(propertyData);

        // Fetch rental application if user is logged in
        if (profile.id) {
          const { data: applicationData, error: applicationError } = await supabase
            .from('rental_applications')
            .select('id, status')
            .eq('property_id', id)
            .eq('renter_id', profile.id)
            .single();

          if (applicationError && applicationError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            throw applicationError;
          }

          if (applicationData) {
            setApplicationStatus(applicationData.status);
            setApplicationId(applicationData.id);
          }
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load property details.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchPropertyAndApplication();
  }, [id, profile, toast]);

  const handleBack = () => {
    navigate(profile && hasRole('landlord') ? "/landlord" : "/properties");
  };

  // Function to render the action button based on application status
  const renderActionButton = () => {
    if (!profile || hasRole('landlord') || property?.status !== 'active') {
      return null;
    }

    const buttonStyles = "w-full py-2 px-4 rounded-lg transition-colors font-semibold";

    if (!applicationStatus) {
      return (
        <Dialog open={showApplicationModal} onOpenChange={setShowApplicationModal}>
          <DialogTrigger asChild>
            <button className={`${buttonStyles} bg-green-600 hover:bg-green-700 text-white`}>
              Apply Now
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rental Application</DialogTitle>
              <DialogDescription>
                Please fill out the rental application form below. All fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <RentalApplicationForm 
              propertyId={property.id} 
              propertyPrice={property.price}
              onSuccess={(appId) => {
                setShowApplicationModal(false);
                setApplicationStatus('application_pending');
                setApplicationId(appId);
              }} 
            />
          </DialogContent>
        </Dialog>
      );
    }

    switch (applicationStatus) {
      case 'application_pending':
        return (
          <button 
            className={`${buttonStyles} bg-yellow-600 hover:bg-yellow-700 text-white cursor-not-allowed`}
            disabled
          >
            Application Pending
          </button>
        );
      case 'application_rejected':
        return (
          <button 
            className={`${buttonStyles} bg-red-600 hover:bg-red-700 text-white cursor-not-allowed`}
            disabled
          >
            Application Rejected
          </button>
        );
      case 'application_approved':
        return (
          <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
            <DialogTrigger asChild>
              <button className={`${buttonStyles} bg-blue-600 hover:bg-blue-700 text-white`}>
                Proceed to Payment
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Complete Payment</DialogTitle>
                <DialogDescription>
                  Please complete your payment to secure the rental property. This is a secure payment process.
                </DialogDescription>
              </DialogHeader>
              {applicationId && (
                <DemoPaymentGateway 
                  applicationId={applicationId}
                  propertyId={property.id}
                  amount={property.price}
                  onSuccess={() => {
                    setShowPaymentModal(false);
                    setApplicationStatus('payment_completed');
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
        );
      case 'payment_completed':
        return (
          <button 
            className={`${buttonStyles} bg-green-600 hover:bg-green-700 text-white cursor-not-allowed`}
            disabled
          >
            Payment Completed
          </button>
        );
      default:
        return null;
    }
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
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
                {profile && hasRole('landlord') ? "Back to Dashboard" : "Back to Properties"}
              </button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button 
              onClick={handleBack}
              className="text-blue-400 hover:text-blue-300 mb-4"
            >
              ← Back to {profile && hasRole('landlord') ? "Dashboard" : "Properties"}
            </button>
            <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
            <p className="text-gray-400">{property.location}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="bg-gray-800 rounded-lg overflow-hidden mb-6">
                <img 
                  src={property.photo_url || '/placeholder.svg'}
                  alt={property.title}
                  className="w-full h-64 object-cover"
                />
              </div>
              
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Description</h2>
                <p className="text-gray-300 leading-relaxed">{property.description}</p>
              </div>
            </div>

            <div>
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Property Details</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price:</span>
                    <span className="font-semibold text-green-400">₦{property?.price.toLocaleString()}/year</span>
                  </div>
                  {property?.bedrooms && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bedrooms:</span>
                      <span>{property.bedrooms}</span>
                    </div>
                  )}
                  {property?.bathrooms && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bathrooms:</span>
                      <span>{property.bathrooms}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Status:</span>
                    <PropertyStatusBadge status={property?.status || ''} />
                  </div>
                  {applicationStatus && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Your Application:</span>
                      <PropertyStatusBadge status={applicationStatus} />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="mb-6">
                {renderActionButton()}
              </div>

              {property?.profiles && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Contact Owner</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Owner:</span>
                      <span>{property.profiles.full_name || 'Property Owner'}</span>
                    </div>
                    <button 
                      onClick={() => navigate(`/property/${property.id}/chat`)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PropertyDetail; 