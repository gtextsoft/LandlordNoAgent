// MyApplications.tsx
// TODO: Add navigation link to this page from user menu or dashboard
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  MessageSquare,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';

interface ApplicationWithProperty {
  id: string;
  property_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  employment_info: string | null;
  references_info: string | null;
  status: string;
  document_urls: string[] | null;
  created_at: string | null;
  updated_at: string | null;
  rent_amount: number;
  rejection_reason?: string;
  property: {
    id: string;
    title: string;
    location: string | null;
    price: number;
    photo_url: string | null;
  } | null;
}

const MyApplications = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [applications, setApplications] = useState<ApplicationWithProperty[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationWithProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchApplications();
    
    // Set up real-time subscription for application updates
    const channel = supabase
      .channel('rental_applications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rental_applications',
          filter: `renter_id=eq.${profile?.id}`
        },
        async (payload) => {
          if (payload.eventType === 'UPDATE') {
            // Fetch the complete application data including property information
            const { data: updatedApp, error } = await supabase
              .from('rental_applications')
              .select(`
                *,
                property:properties(id, title, location, price, photo_url)
              `)
              .eq('id', payload.new.id)
              .single();

            if (!error && updatedApp) {
              setApplications(prev => 
                prev.map(app => 
                  app.id === updatedApp.id ? updatedApp : app
                )
              );
              
              // Show toast for status changes
              if (payload.old.status !== payload.new.status) {
                const statusText = getStatusText(payload.new.status);
                toast({
                  title: "Application Status Updated",
                  description: `Your application status changed to: ${statusText}`,
                });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, toast]);

  // Filter applications based on search and status
  useEffect(() => {
    let filtered = applications;

    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.property?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.property?.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    setFilteredApplications(filtered);
  }, [applications, searchTerm, statusFilter]);

  const fetchApplications = async () => {
    if (!profile) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rental_applications')
        .select(`
          *,
          property:properties(id, title, location, price, photo_url)
        `)
        .eq('renter_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load applications. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshApplications = async () => {
    setRefreshing(true);
    await fetchApplications();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Applications updated successfully.",
    });
  };

  const getStatusText = (status: string) => {
    // Normalize status by removing prefix if it exists
    const normalizedStatus = status.replace('application_', '');
    switch (normalizedStatus) {
      case 'pending': return 'Pending Review';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'payment_completed': return 'Payment Completed';
      default: return normalizedStatus.replace('_', ' ');
    }
  };

  const getStatusIcon = (status: string) => {
    // Normalize status by removing prefix if it exists
    const normalizedStatus = status.replace('application_', '');
    switch (normalizedStatus) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'payment_completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    // Normalize status by removing prefix if it exists
    const normalizedStatus = status.replace('application_', '');
    switch (normalizedStatus) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'destructive';
      case 'payment_completed': return 'default';
      default: return 'secondary';
    }
  };

  const getApplicationsByStatus = (status: string) => {
    // Handle both prefixed and unprefixed status values
    const normalizedSearchStatus = status.replace('application_', '');
    return applications.filter(app => {
      const normalizedAppStatus = app.status?.replace('application_', '');
      return normalizedAppStatus === normalizedSearchStatus;
    });
  };

  const handleViewProperty = (propertyId: string) => {
    navigate(`/property/${propertyId}`);
  };

  const handleContactLandlord = (propertyId: string) => {
    navigate(`/property/${propertyId}/chat`);
  };

  const handlePayment = (applicationId: string) => {
    navigate(`/payment/${applicationId}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto py-10 px-4">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your applications...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-10 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
              <p className="text-gray-600 mt-1">Track your rental applications and their status</p>
            </div>
            <Button 
              onClick={refreshApplications} 
              disabled={refreshing}
              variant="outline"
              className="w-fit"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by property name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Applications</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="payment_completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {getApplicationsByStatus('application_pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {getApplicationsByStatus('application_approved').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {getApplicationsByStatus('application_rejected').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {getApplicationsByStatus('payment_completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Applications ({filteredApplications.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredApplications.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {applications.length === 0 ? 'No applications yet' : 'No matching applications'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {applications.length === 0 
                    ? 'You haven\'t submitted any rental applications yet.' 
                    : 'Try adjusting your search or filter criteria.'
                  }
                </p>
                {applications.length === 0 && (
                  <Button onClick={() => navigate('/properties')}>
                    Browse Properties
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredApplications.map(app => (
                  <div key={app.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Property Image */}
                      <div className="lg:w-48 flex-shrink-0">
                        <img
                          src={app.property?.photo_url || '/placeholder.svg'}
                          alt={app.property?.title || 'Property'}
                          className="w-full h-32 lg:h-40 object-cover rounded-lg border"
                        />
                      </div>
                      
                      {/* Application Details */}
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">
                              {app.property?.title || 'Property'}
                            </h3>
                            <div className="flex items-center text-gray-600 mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span className="text-sm">{app.property?.location || 'Location not specified'}</span>
                            </div>
                            <div className="flex items-center text-gray-600 mt-1">
                              <DollarSign className="h-4 w-4 mr-1" />
                              <span className="text-sm font-medium">₦{app.property?.price?.toLocaleString()}/year</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {getStatusIcon(app.status)}
                            <Badge variant={getStatusVariant(app.status)}>
                              {getStatusText(app.status)}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Application Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Applied on:</span>
                            <span className="ml-2 text-gray-600">
                              {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          {app.updated_at && app.updated_at !== app.created_at && (
                            <div>
                              <span className="font-medium text-gray-700">Last updated:</span>
                              <span className="ml-2 text-gray-600">
                                {new Date(app.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Rejection Reason */}
                        {app.status === 'application_rejected' && app.rejection_reason && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                            <p className="text-sm text-red-700 mt-1">{app.rejection_reason}</p>
                          </div>
                        )}

                        {/* Documents */}
                        {Array.isArray(app.document_urls) && app.document_urls.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Documents uploaded:</p>
                            <div className="flex flex-wrap gap-2">
                              {app.document_urls.map((url, idx) => (
                                <a 
                                  key={idx}
                                  href={url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  Document {idx + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewProperty(app.property_id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Property
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleContactLandlord(app.property_id)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Contact Landlord
                          </Button>
                          
                          {app.status?.replace('application_', '') === 'approved' && (
                            <Button
                              size="sm"
                              onClick={() => handlePayment(app.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Proceed to Payment
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MyApplications; 