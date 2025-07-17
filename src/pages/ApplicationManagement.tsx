import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import PropertyStatusBadge from '@/components/PropertyStatusBadge';
import {
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  Check,
  X,
  Clock,
  Star,
  Download,
  Eye,
  Filter,
  Search,
  RefreshCw,
  Home,
  DollarSign,
  Users
} from 'lucide-react';

interface RentalApplication {
  id: string;
  property_id: string;
  renter_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  employment_info: string | null;
  references_info: string | null;
  status: string;
  document_urls: string[] | null;
  created_at: string;
  updated_at: string | null;
  properties?: {
    id: string;
    title: string;
    price: number;
    location: string;
    photo_url: string;
  };
}

interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  status: string;
}

const ApplicationManagement = () => {
  const [applications, setApplications] = useState<RentalApplication[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<RentalApplication | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProperty, setFilterProperty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;
  
  const { profile, hasRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!profile || !hasRole('landlord')) {
      navigate('/');
      return;
    }
    fetchData(currentPage);
    // eslint-disable-next-line
  }, [profile, hasRole, navigate, currentPage]);

  useEffect(() => {
    // Set initial filter from URL params
    const propertyParam = searchParams.get('property');
    if (propertyParam) {
      setFilterProperty(propertyParam);
    }
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
    fetchData(1);
    // eslint-disable-next-line
  }, [filterStatus, filterProperty, searchQuery]);

  const fetchData = async (page = 1) => {
    if (!profile) return;
    try {
      setLoading(true);
      // Fetch properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('id, title, price, location, status')
        .eq('landlord_id', profile.id);
      if (propertiesError) throw propertiesError;
      setProperties(propertiesData || []);
      // Fetch applications for landlord's properties (paginated)
      const propertyIds = propertiesData?.map(p => p.id) || [];
      let query = supabase
        .from('rental_applications')
        .select(`*, properties!rental_applications_property_id_fkey (id, title, price, location, photo_url)`, { count: 'exact' })
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false });
      // Server-side status filter
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      // Server-side property filter
      if (filterProperty !== 'all') {
        query = query.eq('property_id', filterProperty);
      }
      // Server-side search (full_name/email)
      if (searchQuery.trim()) {
        query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
      const { data: applicationsData, error: applicationsError, count } = await query;
      if (applicationsError) throw applicationsError;
      setApplications(applicationsData || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch applications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationAction = async (applicationId: string, status: 'approved' | 'rejected', reason?: string) => {
    try {
      setActionLoading(true);
      
      const updateData: any = { 
        status: status === 'approved' ? 'application_approved' : 'application_rejected',
        updated_at: new Date().toISOString()
      };
      
      if (status === 'rejected' && reason) {
        updateData.rejection_reason = reason;
      }

      const { error } = await supabase
        .from('rental_applications')
        .update(updateData)
        .eq('id', applicationId);

      if (error) throw error;

      // Update local state
      setApplications(applications.map(app => 
        app.id === applicationId 
          ? { ...app, status: updateData.status, updated_at: updateData.updated_at }
          : app
      ));

      toast({
        title: `Application ${status}`,
        description: `Application has been ${status} successfully.`,
      });

      setShowDetailModal(false);
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${status} application`,
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getApplicationScore = (application: RentalApplication): number => {
    let score = 0;
    
    // Basic info completeness
    if (application.full_name && application.email) score += 20;
    if (application.phone) score += 10;
    
    // Employment info
    if (application.employment_info && application.employment_info.length > 50) score += 30;
    
    // References
    if (application.references_info && application.references_info.length > 50) score += 25;
    
    // Documents
    if (application.document_urls && application.document_urls.length > 0) score += 15;
    
    return Math.min(score, 100);
  };

  const filteredApplications = applications.filter(app => {
    if (filterStatus !== 'all' && app.status !== filterStatus) return false;
    if (filterProperty !== 'all' && app.property_id !== filterProperty) return false;
    if (searchQuery && !app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !app.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Application Management</h1>
                <p className="text-gray-600 mt-2">
                  Manage rental applications for your properties
                </p>
              </div>
              <Button onClick={fetchData} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Applications</p>
                    <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {applications.filter(app => app.status === 'application_pending').length}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-green-600">
                      {applications.filter(app => app.status === 'application_approved').length}
                    </p>
                  </div>
                  <Check className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Rejected</p>
                    <p className="text-2xl font-bold text-red-600">
                      {applications.filter(app => app.status === 'application_rejected').length}
                    </p>
                  </div>
                  <X className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search applicants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="application_pending">Pending</SelectItem>
                    <SelectItem value="application_submitted">Submitted</SelectItem>
                    <SelectItem value="application_approved">Approved</SelectItem>
                    <SelectItem value="application_rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterProperty} onValueChange={setFilterProperty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Properties</SelectItem>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFilterStatus('all');
                    setFilterProperty('all');
                    setSearchQuery('');
                  }}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Applications List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Applications ({totalCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                  <p className="text-gray-600">
                    {totalCount === 0 
                      ? "You haven't received any applications yet." 
                      : "No applications match your current filters."
                    }
                  </p>
                </div>
              ) : (
                <>
                <div className="space-y-4">
                  {applications.map((application) => {
                    const score = getApplicationScore(application);
                    return (
                      <div
                        key={application.id}
                        className="border rounded-lg p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedApplication(application);
                          setShowDetailModal(true);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {application.full_name}
                                  </h3>
                                  <PropertyStatusBadge status={application.status} />
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500" />
                                    <span className="text-sm font-medium">{score}% Match</span>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    {application.email}
                                  </div>
                                  {application.phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-4 h-4" />
                                      {application.phone}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(application.created_at).toLocaleDateString()}
                                  </div>
                                </div>

                                {application.properties && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                    <Home className="w-4 h-4" />
                                    <span className="font-medium">{application.properties.title}</span>
                                    <span>•</span>
                                    <span>₦{application.properties.price.toLocaleString()}/year</span>
                                    <span>•</span>
                                    <span>{application.properties.location}</span>
                                  </div>
                                )}

                                <div className="flex items-center gap-4">
                                  <Progress value={score} className="flex-1 max-w-[200px]" />
                                  <span className="text-xs text-gray-500">Application Score</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {application.status === 'application_pending' && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApplicationAction(application.id, 'approved');
                                  }}
                                  disabled={actionLoading}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedApplication(application);
                                    setShowRejectModal(true);
                                  }}
                                  disabled={actionLoading}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Pagination Controls */}
                <div className="flex justify-center items-center mt-8 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>
                  {Array.from({ length: Math.ceil(totalCount / pageSize) }, (_, i) => (
                    <Button
                      key={i + 1}
                      variant={currentPage === i + 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === Math.ceil(totalCount / pageSize) || totalCount === 0}
                    onClick={() => setCurrentPage((p) => Math.min(Math.ceil(totalCount / pageSize), p + 1))}
                  >
                    Next
                  </Button>
                  <span className="ml-4 text-sm text-gray-500">
                    Page {currentPage} of {Math.max(1, Math.ceil(totalCount / pageSize))}
                  </span>
                </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Application Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedApplication && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <User className="w-6 h-6" />
                    {selectedApplication.full_name}
                    <PropertyStatusBadge status={selectedApplication.status} />
                  </DialogTitle>
                  <DialogDescription>
                    Application submitted {new Date(selectedApplication.created_at).toLocaleDateString()}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Application Score */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Application Score</span>
                      <span className="text-lg font-bold">{getApplicationScore(selectedApplication)}%</span>
                    </div>
                    <Progress value={getApplicationScore(selectedApplication)} />
                  </div>

                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{selectedApplication.email}</p>
                        </div>
                      </div>
                      {selectedApplication.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Phone</p>
                            <p className="font-medium">{selectedApplication.phone}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Property Information */}
                  {selectedApplication.properties && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Property Applied For</h3>
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start gap-4">
                          <img
                            src={selectedApplication.properties.photo_url || '/placeholder.svg'}
                            alt={selectedApplication.properties.title}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div>
                            <h4 className="font-semibold text-lg">{selectedApplication.properties.title}</h4>
                            <p className="text-gray-600">{selectedApplication.properties.location}</p>
                            <p className="text-lg font-bold text-green-600">
                              ₦{selectedApplication.properties.price.toLocaleString()}/year
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Employment Information */}
                  {selectedApplication.employment_info && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Employment Information</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="whitespace-pre-wrap">{selectedApplication.employment_info}</p>
                      </div>
                    </div>
                  )}

                  {/* References */}
                  {selectedApplication.references_info && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">References</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="whitespace-pre-wrap">{selectedApplication.references_info}</p>
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {selectedApplication.document_urls && selectedApplication.document_urls.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Documents</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedApplication.document_urls.map((url, index) => (
                          <div key={index} className="border rounded-lg p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="w-8 h-8 text-blue-600" />
                              <div>
                                <p className="font-medium">Document {index + 1}</p>
                                <p className="text-sm text-gray-600">PDF Document</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(url, '_blank')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = `document_${index + 1}.pdf`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="flex gap-3">
                  {selectedApplication.status === 'application_pending' && (
                    <>
                      <Button
                        onClick={() => {
                          setShowRejectModal(true);
                          setShowDetailModal(false);
                        }}
                        variant="destructive"
                        disabled={actionLoading}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleApplicationAction(selectedApplication.id, 'approved')}
                        disabled={actionLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                    </>
                  )}
                  <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Rejection Modal */}
        <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Application</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this application. This will help the applicant understand your decision.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Textarea
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedApplication) {
                    handleApplicationAction(selectedApplication.id, 'rejected', rejectionReason);
                  }
                }}
                disabled={actionLoading || !rejectionReason.trim()}
              >
                {actionLoading ? 'Rejecting...' : 'Reject Application'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ApplicationManagement; 