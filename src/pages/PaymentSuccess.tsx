import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  CheckCircle, 
  Home, 
  Calendar, 
  FileText, 
  Mail, 
  Phone, 
  User,
  Download,
  MessageSquare,
  ArrowRight,
  DollarSign
} from 'lucide-react';

interface PaymentDetails {
  id: string;
  rent_amount: number;
  property_id: string;
  renter_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  property: {
    id: string;
    title: string;
    location: string;
    price: number;
    photo_url: string;
    landlord_id: string;
    profiles: {
      full_name: string;
      email: string;
      phone: string | null;
    };
  };
}

const PaymentSuccess = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentDetails();
  }, [applicationId]);

  const fetchPaymentDetails = async () => {
    if (!applicationId) {
      setError('No application ID provided');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('rental_applications')
        .select(`
          *,
          property:properties(
            id,
            title,
            location,
            price,
            photo_url,
            landlord_id,
            profiles!properties_landlord_id_fkey(
              full_name,
              email,
              phone
            )
          )
        `)
        .eq('id', applicationId)
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error('Application not found');
      }

      // Check if user is authorized to view this payment
      if (data.renter_id !== profile?.id) {
        throw new Error('Unauthorized access');
      }

      setPaymentDetails(data);

      // Update application status to payment_completed if not already
      if (data.status !== 'payment_completed') {
        const { error: updateError } = await supabase
          .from('rental_applications')
          .update({ status: 'payment_completed' })
          .eq('id', applicationId);

        if (updateError) {
          console.error('Failed to update application status:', updateError);
        }
      }

    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message || "Failed to load payment details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContactLandlord = () => {
    if (paymentDetails?.property_id) {
      navigate(`/property/${paymentDetails.property_id}/chat`);
    }
  };

  const handleViewProperty = () => {
    if (paymentDetails?.property_id) {
      navigate(`/property/${paymentDetails.property_id}`);
    }
  };

  const handleViewApplications = () => {
    navigate('/my-applications');
  };

  const generateReceipt = () => {
    if (!paymentDetails) return;

    const receiptContent = `
      RENTAL PAYMENT RECEIPT
      =====================
      
      Application ID: ${paymentDetails.id}
      Property: ${paymentDetails.property.title}
      Location: ${paymentDetails.property.location}
      
      Tenant Details:
      Name: ${paymentDetails.full_name}
      Email: ${paymentDetails.email}
      Phone: ${paymentDetails.phone || 'Not provided'}
      
      Landlord Details:
      Name: ${paymentDetails.property.profiles.full_name}
      Email: ${paymentDetails.property.profiles.email}
      Phone: ${paymentDetails.property.profiles.phone || 'Not provided'}
      
      Payment Details:
      Amount: ₦${paymentDetails.rent_amount.toLocaleString()}
      Date: ${new Date().toLocaleDateString()}
      Status: Completed
      
      Thank you for using LandlordNoAgent!
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${paymentDetails.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error || !paymentDetails) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-20 px-4 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <h1 className="text-2xl font-bold text-red-800 mb-4">Payment Error</h1>
            <p className="text-red-600 mb-6">{error || 'Failed to load payment details'}</p>
            <Button onClick={() => navigate('/my-applications')} variant="outline">
              View My Applications
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-10 px-4">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 rounded-full p-6">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
          <p className="text-xl text-gray-600 mb-2">
            Your rental payment has been processed successfully.
          </p>
          <p className="text-gray-500">
            Application ID: <span className="font-mono text-sm">{paymentDetails.id}</span>
          </p>
        </div>

        {/* Payment Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Amount Paid</label>
                  <p className="text-2xl font-bold text-green-600">
                    ₦{paymentDetails.rent_amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Payment Date</label>
                  <p className="text-gray-900">{new Date().toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Payment Status</label>
                  <Badge className="bg-green-100 text-green-800">Completed</Badge>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Property</label>
                  <p className="text-gray-900 font-medium">{paymentDetails.property.title}</p>
                  <p className="text-sm text-gray-600">{paymentDetails.property.location}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Landlord</label>
                  <p className="text-gray-900">{paymentDetails.property.profiles.full_name}</p>
                  <p className="text-sm text-gray-600">{paymentDetails.property.profiles.email}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Property Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <img
                  src={paymentDetails.property.photo_url || '/placeholder.svg'}
                  alt={paymentDetails.property.title}
                  className="w-full h-48 object-cover rounded-lg border"
                />
              </div>
              <div className="md:w-2/3 space-y-4">
                <h3 className="text-xl font-semibold">{paymentDetails.property.title}</h3>
                <p className="text-gray-600">{paymentDetails.property.location}</p>
                <p className="text-lg font-bold text-gray-900">
                  ₦{paymentDetails.property.price.toLocaleString()}/year
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    onClick={handleViewProperty}
                    variant="outline"
                    size="sm"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    View Property
                  </Button>
                  <Button 
                    onClick={handleContactLandlord}
                    variant="outline"
                    size="sm"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Landlord
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              What's Next?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 rounded-full p-2 mt-1">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Contact Your Landlord</h4>
                  <p className="text-sm text-gray-600">
                    Reach out to {paymentDetails.property.profiles.full_name} to arrange key pickup and move-in details.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-green-100 rounded-full p-2 mt-1">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Prepare Documentation</h4>
                  <p className="text-sm text-gray-600">
                    Keep your payment receipt and any lease documents in a safe place.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 rounded-full p-2 mt-1">
                  <Home className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Plan Your Move</h4>
                  <p className="text-sm text-gray-600">
                    Start planning your move-in date and coordinate with your landlord.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={generateReceipt}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Receipt
          </Button>
          
          <Button 
            onClick={handleContactLandlord}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Contact Landlord
            <ArrowRight className="h-4 w-4" />
          </Button>
          
          <Button 
            onClick={handleViewApplications}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            View All Applications
          </Button>
        </div>

        {/* Contact Information */}
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Need Help?</h3>
          <p className="text-gray-600 mb-4">
            If you have any questions about your rental or need assistance, don't hesitate to reach out.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="h-4 w-4" />
              <span>support@landlordnoagent.com</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="h-4 w-4" />
              <span>+234 xxx xxx xxxx</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentSuccess; 