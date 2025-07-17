import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  MapPin, 
  Bed, 
  Bath, 
  Clock, 
  User, 
  Search,
  Home,
  Edit,
  Trash2,
  Filter,
  RefreshCw,
  DollarSign
} from "lucide-react";
import { supabase, Property } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

interface PropertyWithLandlord extends Omit<Property, 'profiles'> {
  profiles?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface ReviewData {
  propertyId: string;
  action: 'approve' | 'reject' | 'request_changes';
  adminNotes: string;
  rejectionReason?: string;
  flaggedConcerns: string[];
  verificationScore: number;
}

const commonConcerns = [
  "Incomplete information",
  "Missing photos",
  "Unrealistic price",
  "Suspicious listing",
  "Poor quality photos",
  "Inaccurate location",
  "Misleading description",
  "Missing contact details"
];

const PropertyReviewPanel = () => {
  const [activeTab, setActiveTab] = useState("review");
  const [allProperties, setAllProperties] = useState<PropertyWithLandlord[]>([]);
  const [properties, setProperties] = useState<PropertyWithLandlord[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithLandlord | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [reviewData, setReviewData] = useState<ReviewData>({
    propertyId: '',
    action: 'approve',
    adminNotes: '',
    rejectionReason: '',
    flaggedConcerns: [],
    verificationScore: 0
  });
  // Pagination state
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [allPage, setAllPage] = useState(1);
  const [allTotal, setAllTotal] = useState(0);
  const pageSize = 10;

  const { toast } = useToast();
  const { profile } = useAuth();

  // Filter properties based on search term and status
  const filteredProperties = (activeTab === "review" ? properties : allProperties).filter(property => {
    const matchesSearch = searchTerm.toLowerCase() === "" || 
      property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || property.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    if (activeTab === "review") {
      fetchPendingProperties(pendingPage, pageSize);
    } else {
      fetchAllProperties(allPage, pageSize);
    }
    // eslint-disable-next-line
  }, [activeTab, pendingPage, allPage]);

  const fetchAllProperties = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await supabase
        .from('properties')
        .select(`
          *,
          profiles!properties_landlord_id_fkey (
            full_name,
            email,
            avatar_url
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      setAllProperties(data || []);
      setAllTotal(count || 0);
    } catch (error) {
      console.error('Error fetching all properties:', error);
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingProperties = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await supabase
        .from('properties')
        .select(`
          *,
          profiles!properties_landlord_id_fkey (
            full_name,
            email,
            avatar_url
          )
        `, { count: 'exact' })
        .in('status', ['pending', 'under_review', 'flagged'])
        .order('created_at', { ascending: true })
        .range(from, to);
      if (error) throw error;
      setProperties(data || []);
      setPendingTotal(count || 0);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "Error",
        description: "Failed to load properties for review",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateVerificationScore = (property: PropertyWithLandlord) => {
    let score = 0;
    if (property.title && property.title.length > 10) score += 10;
    if (property.description && property.description.length > 50) score += 10;
    if (property.location) score += 10;
    if (property.bedrooms && property.bedrooms > 0) score += 8;
    if (property.bathrooms && property.bathrooms > 0) score += 8;
    if (property.amenities && property.amenities.length > 0) score += 9;
    if (property.photo_url) score += 10;
    if (property.photo_urls && property.photo_urls.length > 1) score += 10;
    if (property.price && property.price >= 50000 && property.price <= 50000000) score += 15;
    if (property.profiles?.full_name) score += 5;
    if (property.profiles?.email) score += 5;
    return Math.min(score, 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: "High Quality", variant: "default" as const };
    if (score >= 60) return { label: "Moderate Quality", variant: "secondary" as const };
    return { label: "Needs Review", variant: "destructive" as const };
  };

  const handleReviewProperty = (property: PropertyWithLandlord) => {
    setSelectedProperty(property);
    setReviewData({
      propertyId: property.id,
      action: 'approve',
      adminNotes: '',
      rejectionReason: '',
      flaggedConcerns: [],
      verificationScore: calculateVerificationScore(property)
    });
    setReviewDialogOpen(true);
  };

  const submitReview = async () => {
    if (!selectedProperty) return;

    try {
      // Insert the review record (this will automatically update property status via trigger)
      const { error: reviewError } = await supabase
        .from('property_reviews')
        .insert({
          property_id: reviewData.propertyId,
          admin_id: profile?.id,
          action: reviewData.action === 'approve' ? 'approved' : 
                 reviewData.action === 'reject' ? 'rejected' : 'requested_changes',
          admin_notes: reviewData.adminNotes,
          rejection_reason: reviewData.rejectionReason,
          flagged_concerns: reviewData.flaggedConcerns,
          verification_score: reviewData.verificationScore
        });

      if (reviewError) throw reviewError;

      // Create notification for landlord
      await supabase.rpc('create_notification', {
        p_user_id: selectedProperty.landlord_id,
        p_type: reviewData.action === 'approve' ? 'property_approved' : 'property_rejected',
        p_title: reviewData.action === 'approve' ? 'Property Approved!' : 'Property Needs Attention',
        p_message: reviewData.action === 'approve' 
          ? `Your property "${selectedProperty.title}" has been approved and is now live!`
          : `Your property "${selectedProperty.title}" requires attention. ${reviewData.rejectionReason || reviewData.adminNotes}`,
        p_action_url: `/property/${selectedProperty.id}`,
        p_metadata: {
          property_id: selectedProperty.id,
          admin_notes: reviewData.adminNotes,
          rejection_reason: reviewData.rejectionReason,
          flagged_concerns: reviewData.flaggedConcerns,
          verification_score: reviewData.verificationScore
        }
      });

      toast({
        title: "Review Completed",
        description: `Property has been ${reviewData.action === 'approve' ? 'approved' : reviewData.action === 'reject' ? 'rejected' : 'marked for changes'}.`,
      });

      setReviewDialogOpen(false);
      setSelectedProperty(null);
      await fetchPendingProperties();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (property: PropertyWithLandlord) => {
    // Navigate to edit page or open edit modal
    window.location.href = `/admin/properties/${property.id}/edit`;
  };

  const handleDelete = async (property: PropertyWithLandlord) => {
    if (!confirm(`Are you sure you want to delete "${property.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', property.id);

      if (error) throw error;

      toast({
        title: "Property Deleted",
        description: "The property has been successfully deleted.",
      });

      // Refresh the properties list
      if (activeTab === "review") {
        await fetchPendingProperties();
      } else {
        await fetchAllProperties();
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      toast({
        title: "Error",
        description: "Failed to delete property",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading properties for review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-600" />
            Property Management Center
          </h2>
          <p className="text-gray-600 mt-1">Manage and review all properties on the platform</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          {filteredProperties.length} {activeTab === "review" ? "Pending Review" : "Properties"}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="review" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Review Center
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            All Properties
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Search by property title, location, or landlord..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 mt-6">
            <AnimatePresence>
              {filteredProperties.map((property, index) => {
                const verificationScore = calculateVerificationScore(property);
                const scoreBadge = getScoreBadge(verificationScore);
                
                return (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex gap-6">
                          <div className="w-48 h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <img
                              src={property.photo_url || "/placeholder.svg"}
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                  {property.title}
                                  <Badge variant={scoreBadge.variant}>
                                    {scoreBadge.label}
                                  </Badge>
                                </h3>
                                <p className="text-gray-600 flex items-center gap-1 mt-1">
                                  <MapPin className="w-4 h-4" />
                                  {property.location || "Location not specified"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-green-600">
                                  ₦{property.price.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-500">per year</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-6 text-sm text-gray-600">
                              {property.bedrooms && (
                                <span className="flex items-center gap-1">
                                  <Bed className="w-4 h-4" />
                                  {property.bedrooms} bed
                                </span>
                              )}
                              {property.bathrooms && (
                                <span className="flex items-center gap-1">
                                  <Bath className="w-4 h-4" />
                                  {property.bathrooms} bath
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {new Date(property.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">{property.profiles?.full_name || "Unknown Landlord"}</p>
                                <p className="text-sm text-gray-600">{property.profiles?.email}</p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Verification Score</span>
                                <span className={`text-sm font-bold ${getScoreColor(verificationScore)}`}>
                                  {verificationScore}/100
                                </span>
                              </div>
                              <Progress value={verificationScore} className="h-2" />
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 justify-center">
                            <Button
                              onClick={() => handleReviewProperty(property)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              Review
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => window.open(`/property/${property.id}`, '_blank')}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredProperties.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Properties to Review</h3>
                  <p className="text-gray-600">
                    {searchTerm || statusFilter !== 'pending' 
                      ? 'No properties match your current filters.' 
                      : 'All properties have been reviewed!'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          {activeTab === "review" && (
            <Pagination page={pendingPage} total={pendingTotal} pageSize={pageSize} onPageChange={setPendingPage} />
          )}
        </TabsContent>

        <TabsContent value="manage">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Search properties..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Properties</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => fetchAllProperties(allPage, pageSize)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 mt-6">
            <AnimatePresence>
              {allProperties
                .filter(property => {
                  const matchesSearch = property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                     property.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                     property.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
                  return matchesSearch && matchesStatus;
                })
                .map((property, index) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex gap-6">
                          <div className="w-48 h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <img
                              src={property.photo_url || "/placeholder.svg"}
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {property.title}
                                </h3>
                                <p className="text-gray-600 flex items-center gap-1 mt-1">
                                  <MapPin className="w-4 h-4" />
                                  {property.location || "Location not specified"}
                                </p>
                              </div>
                              <Badge variant={
                                property.status === 'active' ? 'default' :
                                property.status === 'pending' ? 'secondary' :
                                property.status === 'rejected' ? 'destructive' :
                                'outline'
                              }>
                                {property.status}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-6 text-sm text-gray-600">
                              {property.bedrooms && (
                                <span className="flex items-center gap-1">
                                  <Bed className="w-4 h-4" />
                                  {property.bedrooms} bed
                                </span>
                              )}
                              {property.bathrooms && (
                                <span className="flex items-center gap-1">
                                  <Bath className="w-4 h-4" />
                                  {property.bathrooms} bath
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {new Date(property.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">{property.profiles?.full_name || "Unknown Landlord"}</p>
                                <p className="text-sm text-gray-600">{property.profiles?.email}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button
                              variant="outline"
                              onClick={() => window.open(`/property/${property.id}`, '_blank')}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleEdit(property)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            {property.status === 'pending' && (
                              <Button
                                onClick={() => handleReviewProperty(property)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Review
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDelete(property)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </AnimatePresence>

            {allProperties.length === 0 && !loading && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Properties Found</h3>
                  <p className="text-gray-600">
                    {searchTerm || statusFilter !== 'all'
                      ? 'No properties match your current filters.'
                      : 'There are no properties in the system.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          {activeTab === "manage" && (
            <Pagination page={allPage} total={allTotal} pageSize={pageSize} onPageChange={setAllPage} />
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Review Property: {selectedProperty?.title}
            </DialogTitle>
            <DialogDescription>
              Review and verify this property listing before it goes live to the public.
            </DialogDescription>
          </DialogHeader>

          {selectedProperty && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Property Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Title:</span>
                      <span className="font-medium">{selectedProperty.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{selectedProperty.location || "Not specified"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium text-green-600">₦{selectedProperty.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bedrooms:</span>
                      <span className="font-medium">{selectedProperty.bedrooms || "Not specified"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bathrooms:</span>
                      <span className="font-medium">{selectedProperty.bathrooms || "Not specified"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Landlord Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{selectedProperty.profiles?.full_name || "Not provided"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedProperty.profiles?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Listed:</span>
                      <span className="font-medium">{new Date(selectedProperty.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Verification Score</h4>
                  <span className={`text-lg font-bold ${getScoreColor(reviewData.verificationScore)}`}>
                    {reviewData.verificationScore}/100
                  </span>
                </div>
                <Progress value={reviewData.verificationScore} className="mb-2" />
                <p className="text-sm text-gray-600">
                  This score is based on completeness of information, image quality, and pricing reasonableness.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Review Decision</label>
                  <Select value={reviewData.action} onValueChange={(value: any) => 
                    setReviewData(prev => ({ ...prev, action: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approve">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Approve & Make Live
                        </div>
                      </SelectItem>
                      <SelectItem value="request_changes">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          Request Changes
                        </div>
                      </SelectItem>
                      <SelectItem value="reject">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          Reject Listing
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(reviewData.action === 'reject' || reviewData.action === 'request_changes') && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Flagged Concerns</label>
                    <div className="grid grid-cols-2 gap-2">
                      {commonConcerns.map((concern) => (
                        <label key={concern} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={reviewData.flaggedConcerns.includes(concern)}
                            onChange={() => {
                              setReviewData(prev => ({
                                ...prev,
                                flaggedConcerns: prev.flaggedConcerns.includes(concern)
                                  ? prev.flaggedConcerns.filter(c => c !== concern)
                                  : [...prev.flaggedConcerns, concern]
                              }));
                            }}
                            className="rounded border-gray-300"
                          />
                          <span>{concern}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {reviewData.action === 'reject' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Rejection Reason *</label>
                    <Textarea
                      value={reviewData.rejectionReason}
                      onChange={(e) => setReviewData(prev => ({ ...prev, rejectionReason: e.target.value }))}
                      placeholder="Explain why this property is being rejected..."
                      rows={3}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Admin Notes</label>
                  <Textarea
                    value={reviewData.adminNotes}
                    onChange={(e) => setReviewData(prev => ({ ...prev, adminNotes: e.target.value }))}
                    placeholder="Add any additional notes or feedback for the landlord..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={submitReview}
              disabled={reviewData.action === 'reject' && !reviewData.rejectionReason}
              className={
                reviewData.action === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                reviewData.action === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                'bg-yellow-600 hover:bg-yellow-700'
              }
            >
              {reviewData.action === 'approve' && <CheckCircle className="w-4 h-4 mr-2" />}
              {reviewData.action === 'reject' && <XCircle className="w-4 h-4 mr-2" />}
              {reviewData.action === 'request_changes' && <AlertTriangle className="w-4 h-4 mr-2" />}
              
              {reviewData.action === 'approve' ? 'Approve & Publish' :
               reviewData.action === 'reject' ? 'Reject Property' :
               'Request Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Pagination controls component
const Pagination = ({ page, total, pageSize, onPageChange }: { page: number, total: number, pageSize: number, onPageChange: (p: number) => void }) => {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 1}>Prev</Button>
      {Array.from({ length: totalPages }, (_, i) => (
        <Button
          key={i + 1}
          variant={page === i + 1 ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(i + 1)}
        >
          {i + 1}
        </Button>
      ))}
      <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>Next</Button>
    </div>
  );
};

export default PropertyReviewPanel;