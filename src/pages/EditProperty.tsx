import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Home, X, CheckCircle, AlertCircle, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase, Property, HouseDocument } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useLoadingState } from "@/hooks/useLoadingState";
import { handleError, handleSuccess } from "@/utils/errorHandling";
import UnifiedImageUpload from "@/components/UnifiedImageUpload";
import HouseDocumentUpload from "@/components/HouseDocumentUpload";
import LoadingSpinner from "@/components/LoadingSpinner";
import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { Json } from "@/integrations/supabase/types";

const propertySchema = z.object({
  title: z.string()
    .min(5, "Property title must be at least 5 characters")
    .max(100, "Property title must be less than 100 characters"),
  description: z.string()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description must be less than 1000 characters"),
  price: z.number()
    .min(1000, "Price must be at least ₦1,000")
    .max(10000000, "Price must be less than ₦10,000,000"),
  location: z.string()
    .min(3, "Location is required")
    .max(100, "Location must be less than 100 characters"),
  bedrooms: z.number()
    .min(0, "Bedrooms cannot be negative")
    .max(20, "Bedrooms must be less than 20")
    .optional(),
  bathrooms: z.number()
    .min(0, "Bathrooms cannot be negative")
    .max(20, "Bathrooms must be less than 20")
    .optional(),
  status: z.enum(['active', 'inactive', 'pending', 'rented']),
});

type PropertyFormData = z.infer<typeof propertySchema>;

const EditProperty = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [houseDocuments, setHouseDocuments] = useState<HouseDocument[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState('');
  const [formProgress, setFormProgress] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const { loading, withLoading } = useLoadingState();
  const { user, profile, hasRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      location: "",
      bedrooms: undefined,
      bathrooms: undefined,
      status: 'pending',
    },
  });

  // Watch form values for progress calculation
  const watchedValues = form.watch();

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

  // Helper function to convert HouseDocument[] to Json
  const serializeHouseDocuments = (docs: HouseDocument[]): Json => {
    return docs.map(doc => ({
      id: doc.id,
      name: doc.name,
      url: doc.url,
      type: doc.type,
      size: doc.size,
      uploadDate: doc.uploadDate
    })) as Json;
  };

  // Fetch property data on component mount
  useEffect(() => {
    const fetchProperty = async () => {
      if (!id || !profile) return;

      try {
        setInitialLoading(true);

        if (!hasRole('landlord')) {
          navigate('/');
          return;
        }

        const { data: propertyData, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .eq('landlord_id', profile.id)
          .single();

        if (error) throw error;

        if (!propertyData) {
          throw new Error('Property not found or you do not have permission to edit it');
        }

        // Convert house_documents from Json to HouseDocument[]
        const parsedDocs = parseHouseDocuments(propertyData.house_documents);
        const propertyWithParsedDocs: Property = {
          ...propertyData,
          house_documents: parsedDocs
        };

        setProperty(propertyWithParsedDocs);
        setHouseDocuments(parsedDocs);

        // Populate form with existing data
        form.reset({
          title: propertyData.title || "",
          description: propertyData.description || "",
          price: propertyData.price || 0,
          location: propertyData.location || "",
          bedrooms: propertyData.bedrooms || undefined,
          bathrooms: propertyData.bathrooms || undefined,
          status: propertyData.status as any || 'pending',
        });

        // Set existing images
        if (propertyData.photo_urls && Array.isArray(propertyData.photo_urls)) {
          setImageUrls(propertyData.photo_urls);
        } else if (propertyData.photo_url) {
          setImageUrls([propertyData.photo_url]);
        }

        // Set existing amenities
        if (propertyData.amenities && Array.isArray(propertyData.amenities)) {
          setAmenities(propertyData.amenities);
        }

      } catch (error: any) {
        console.error('Error fetching property:', error);
        handleError(error, toast, 'Failed to load property data');
        navigate('/landlord');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchProperty();
  }, [id, profile, hasRole, navigate, form, toast]);

  // Calculate form completion progress
  useEffect(() => {
    const requiredFields = ['title', 'description', 'price', 'location'];
    const optionalFields = ['bedrooms', 'bathrooms'];
    
    let completedRequired = 0;
    let completedOptional = 0;
    
    // Check required fields
    requiredFields.forEach(field => {
      const value = watchedValues[field as keyof PropertyFormData];
      if (field === 'price') {
        if (value && Number(value) > 0) {
          completedRequired++;
        }
      } else {
        if (value && String(value).trim() !== "") {
          completedRequired++;
        }
      }
    });
    
    // Check optional fields
    optionalFields.forEach(field => {
      const value = watchedValues[field as keyof PropertyFormData];
      if (value && Number(value) > 0) {
        completedOptional++;
      }
    });
    
    // Calculate progress
    const requiredProgress = (completedRequired / requiredFields.length) * 60;
    const optionalProgress = (completedOptional / optionalFields.length) * 15;
    const imageProgress = imageUrls.length > 0 ? 15 : 0;
    const documentProgress = houseDocuments.length > 0 ? 10 : 0;
    
    setFormProgress(Math.round(requiredProgress + optionalProgress + imageProgress + documentProgress));
  }, [watchedValues, imageUrls, houseDocuments]);

  const addAmenity = () => {
    if (newAmenity.trim() && !amenities.includes(newAmenity.trim()) && amenities.length < 10) {
      setAmenities([...amenities, newAmenity.trim()]);
      setNewAmenity('');
    }
  };

  const removeAmenity = (amenity: string) => {
    setAmenities(amenities.filter(a => a !== amenity));
  };

  const onSubmit = async (data: PropertyFormData) => {
    if (!id || !profile) return;

    try {
      const updateData = {
        ...data,
        photo_urls: imageUrls,
        amenities,
        house_documents: serializeHouseDocuments(houseDocuments),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', id)
        .eq('landlord_id', profile.id);

      if (error) throw error;

      handleSuccess(toast, 'Property updated successfully');
      navigate('/landlord');
    } catch (error: any) {
      console.error('Error updating property:', error);
      handleError(error, toast, 'Failed to update property');
    }
  };

  const getFieldValidationState = (fieldName: keyof PropertyFormData) => {
    const fieldState = form.getFieldState(fieldName);
    if (fieldState.error) return "error";
    if (fieldState.isDirty && !fieldState.error) return "success";
    return "default";
  };

  const getFieldIcon = (fieldName: keyof PropertyFormData) => {
    const state = getFieldValidationState(fieldName);
    if (state === "error") return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (state === "success") return <CheckCircle className="w-4 h-4 text-green-500" />;
    return null;
  };

  if (initialLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!property) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto p-4 lg:p-6">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h2>
            <p className="text-gray-600 mb-6">
              The property you're trying to edit doesn't exist or you don't have permission to edit it.
            </p>
            <Link to="/landlord">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link to="/landlord" className="hover:text-blue-600">Dashboard</Link>
            <span>•</span>
            <Link to="/landlord/properties" className="hover:text-blue-600">Properties</Link>
            <span>•</span>
            <span className="text-gray-900 font-medium">Edit Property</span>
          </nav>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg">
                <Save className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Property</h1>
                <p className="text-gray-600">Update your property information</p>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">Form Completion</div>
                <div className="flex items-center space-x-2">
                  <Progress value={formProgress} className="w-32" />
                  <span className="text-sm font-medium text-gray-900">{formProgress}%</span>
                </div>
              </div>
            </div>
          </div>
          {/* Mobile Progress */}
          <div className="md:hidden mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Form Completion</span>
              <span className="text-sm font-medium text-gray-900">{formProgress}%</span>
            </div>
            <Progress value={formProgress} className="w-full" />
          </div>
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    Basic Information
                    <Badge variant="outline" className="ml-2 text-red-600">Required</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center justify-between">
                          Property Title *
                          {getFieldIcon("title")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Modern 2BR Apartment in Downtown Lagos"
                            {...field}
                            className={getFieldValidationState("title") === "error" ? "border-red-500" : ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Make it descriptive and appealing ({field.value.length}/100 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center justify-between">
                          Description *
                          {getFieldIcon("description")}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your property in detail - location, features, nearby amenities..."
                            rows={4}
                            {...field}
                            className={getFieldValidationState("description") === "error" ? "border-red-500" : ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide detailed information to attract renters ({field.value.length}/1000 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            Annual Rent (₦) *
                            {getFieldIcon("price")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="2500000"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              className={getFieldValidationState("price") === "error" ? "border-red-500" : ""}
                            />
                          </FormControl>
                          <FormDescription>
                            {field.value > 0 && (
                              <span className="text-green-600">
                                ≈ ₦{Math.round(field.value / 12).toLocaleString()}/month
                              </span>
                            )}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            Location *
                            {getFieldIcon("location")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Victoria Island, Lagos"
                              {...field}
                              className={getFieldValidationState("location") === "error" ? "border-red-500" : ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Include area/neighborhood for better discovery
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Property Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Property Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="bedrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bedrooms</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              placeholder="2"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bathrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bathrooms</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              step="0.5"
                              placeholder="1.5"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">Pending Review</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="rented">Rented</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Amenities */}
                  <div>
                    <FormLabel>Amenities (Optional)</FormLabel>
                    <FormDescription className="mb-3">
                      Add up to 10 amenities to highlight your property features
                    </FormDescription>
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={newAmenity}
                        onChange={(e) => setNewAmenity(e.target.value)}
                        placeholder="Add amenity (e.g., Parking, Pool, Gym)"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                        disabled={amenities.length >= 10}
                      />
                      <Button 
                        type="button" 
                        onClick={addAmenity} 
                        variant="outline"
                        disabled={!newAmenity.trim() || amenities.length >= 10}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {amenities.map((amenity) => (
                        <Badge key={amenity} variant="secondary" className="flex items-center gap-1 py-1 px-2">
                          {amenity}
                          <X
                            className="w-3 h-3 cursor-pointer hover:bg-red-100 rounded"
                            onClick={() => removeAmenity(amenity)}
                          />
                        </Badge>
                      ))}
                    </div>
                    {amenities.length >= 10 && (
                      <p className="text-sm text-orange-600 mt-2">Maximum 10 amenities reached</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Images */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    Property Images
                    <Badge variant="outline" className="ml-2 text-orange-600">Recommended</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UnifiedImageUpload
                    onImagesUploaded={setImageUrls}
                    currentImageUrls={imageUrls}
                    bucket="property-images"
                    maxImages={10}
                  />
                  <FormDescription className="mt-3">
                    Upload high-quality photos to attract more renters. First image will be the main display photo.
                  </FormDescription>
                </CardContent>
              </Card>

              {/* House Documents */}
              {user && (
                <HouseDocumentUpload
                  onDocumentsUploaded={setHouseDocuments}
                  currentDocuments={houseDocuments}
                  maxDocuments={5}
                  landlordId={user.id}
                  propertyId={property.id}
                />
              )}

              {/* Submit */}
              <div className="flex gap-4 pt-6">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/landlord")}
                  disabled={loading}
                  className="px-8"
                >
                  Cancel
                </Button>
              </div>
              
              {formProgress < 50 && (
                <div className="text-center text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                  Complete the required fields to save your changes
                </div>
              )}
            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
};

export default EditProperty; 