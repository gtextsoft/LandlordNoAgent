import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase, Property, HouseDocument } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Edit, 
  Trash2, 
  Users, 
  FileText, 
  Download, 
  Eye,
  Calendar,
  MapPin,
  Home,
  Bed,
  Bath
} from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

const LandlordPropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile, hasRole } = useAuth();
  const { toast } = useToast();

  // Helper function to convert Json to HouseDocument[]
  const parseHouseDocuments = (docs: Json | null): HouseDocument[] => {
    if (!docs) return [];
    try {
      const parsedDocs = Array.isArray(docs) ? docs : [];
      return parsedDocs.map(doc => ({
        id: String((doc as any)?.id || ''),
        name: String((doc as any)?.name || ''),
        url: String((doc as any)?.url || ''),
        type: String((doc as any)?.type || ''),
        size: Number((doc as any)?.size || 0),
        uploadDate: String((doc as any)?.uploadDate || '')
      }));
    } catch (error) {
      console.error('Error parsing house documents:', error);
      return [];
    }
  };

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
        
        // Transform the property data to match our Property interface
        const transformedProperty = {
          ...data,
          house_documents: parseHouseDocuments(data.house_documents)
        };
        
        setProperty(transformedProperty);
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
    navigate("/landlord");
  };

  const handleEdit = () => {
    navigate(`/landlord/edit/${property?.id}`);
  };

  const handleDelete = async () => {
    if (!property || !window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', property.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Property deleted successfully",
      });

      navigate('/landlord');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete property",
        variant: "destructive"
      });
    }
  };

  const handleViewApplications = () => {
    navigate('/landlord/applications?property=' + property?.id);
  };

  const handleDownloadDocument = async (doc: HouseDocument) => {
    try {
      // Get signed URL for download
      const { data, error } = await supabase.storage
        .from('house-documents')
        .createSignedUrl(doc.url.split('/').pop() || '', 3600); // 1 hour expiry

      if (error) throw error;

      // Create download link
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download document",
        variant: "destructive"
      });
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
            <Link to="/landlord">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
                Back to Dashboard
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
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
            <p className="text-gray-400">{property.location}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Images and Description */}
            <div className="lg:col-span-2 space-y-6">
              {/* Property Images */}
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-0">
                  {property.photo_urls && property.photo_urls.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {property.photo_urls.slice(0, 4).map((url, index) => (
                        <img 
                          key={index}
                          src={url || '/placeholder.svg'}
                          alt={`${property.title} - Image ${index + 1}`}
                          className={`w-full object-cover rounded-lg ${index === 0 ? 'md:col-span-2 h-64' : 'h-32'}`}
                        />
                      ))}
                    </div>
                  ) : (
                <img 
                  src={property.photo_url || '/placeholder.svg'}
                  alt={property.title}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  )}
                </CardContent>
              </Card>

              {/* Description */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">{property.description}</p>
                </CardContent>
              </Card>

              {/* House Documents */}
              {property.house_documents && property.house_documents.length > 0 && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Property Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {property.house_documents.map((doc: HouseDocument) => (
                        <div key={doc.id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-8 h-8 text-blue-400" />
                            <div>
                              <p className="text-white font-medium truncate max-w-[150px]">{doc.name}</p>
                              <p className="text-gray-400 text-sm">
                                {(doc.size / 1024 / 1024).toFixed(1)} MB • {new Date(doc.uploadDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(doc.url, '_blank')}
                              className="border-gray-600 text-gray-300 hover:bg-gray-600"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadDocument(doc)}
                              className="border-gray-600 text-gray-300 hover:bg-gray-600"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
              </div>
                  </CardContent>
                </Card>
              )}

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Amenities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.map((amenity, index) => (
                        <Badge key={index} variant="secondary" className="bg-gray-700 text-gray-300">
                          {amenity}
                        </Badge>
                      ))}
              </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Details and Actions */}
            <div className="space-y-6">
              {/* Property Details */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Property Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Price:</span>
                    <span className="font-semibold text-green-400">₦{property.price.toLocaleString()}/year</span>
                  </div>
                  {property.bedrooms && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-2">
                        <Bed className="w-4 h-4" />
                        Bedrooms:
                      </span>
                      <span className="text-white">{property.bedrooms}</span>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-2">
                        <Bath className="w-4 h-4" />
                        Bathrooms:
                      </span>
                      <span className="text-white">{property.bathrooms}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location:
                    </span>
                    <span className="text-white">{property.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Status:</span>
                    <Badge 
                      variant={property.status === 'active' ? 'default' : 'secondary'}
                      className={property.status === 'active' ? 'bg-green-600' : 'bg-yellow-600'}
                    >
                      {property.status === 'active' ? 'Available' : 'Not Available'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Created:
                    </span>
                    <span className="text-white">
                      {new Date(property.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Management Actions */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Management Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={handleEdit}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Property
                  </Button>
                  <Button 
                    onClick={handleViewApplications}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    View Applications
                  </Button>
                  <Button 
                    onClick={handleDelete}
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Property
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LandlordPropertyDetail; 