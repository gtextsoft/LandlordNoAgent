import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { ArrowLeft, Home, X, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useLoadingState } from "@/hooks/useLoadingState";
import { handleError, handleSuccess } from "@/utils/shared";
import UnifiedImageUpload from "@/components/UnifiedImageUpload";
import Layout from "@/components/Layout";
import { Link } from "react-router-dom";

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
    .max(20, "Bedrooms must be less than 20"),
  bathrooms: z.number()
    .min(0, "Bathrooms cannot be negative")
    .max(20, "Bathrooms must be less than 20"),
  status: z.enum(['active', 'pending']),
});

type PropertyFormData = z.infer<typeof propertySchema>;

const NewListing = () => {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState('');
  const [formProgress, setFormProgress] = useState(0);
  
  const { loading, withLoading } = useLoadingState();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      location: "",
      bedrooms: 1,
      bathrooms: 1,
      status: 'pending',
    },
  });

  // Watch form values for progress calculation
  const watchedValues = form.watch();

  // Calculate form completion progress
  useEffect(() => {
    const requiredFields = ['title', 'description', 'price', 'location'];
    const optionalFields = ['bedrooms', 'bathrooms'];
    
    let completedRequired = 0;
    let completedOptional = 0;
    
    // Check required fields
    requiredFields.forEach(field => {
      const value = watchedValues[field as keyof PropertyFormData];
      if (value && String(value).trim() !== "" && String(value) !== "0") {
        completedRequired++;
      }
    });
    
    // Check optional fields
    optionalFields.forEach(field => {
      const value = watchedValues[field as keyof PropertyFormData];
      if (value && Number(value) > 0) {
        completedOptional++;
      }
    });
    
    // Calculate progress (required fields worth 70%, optional 20%, images 10%)
    const requiredProgress = (completedRequired / requiredFields.length) * 70;
    const optionalProgress = (completedOptional / optionalFields.length) * 20;
    const imageProgress = imageUrls.length > 0 ? 10 : 0;
    
    setFormProgress(Math.round(requiredProgress + optionalProgress + imageProgress));
  }, [watchedValues, imageUrls]);

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
    if (!user) {
      handleError(new Error("Authentication required"), toast, "Please log in to create a listing");
      return;
    }

    if (imageUrls.length === 0) {
      toast({
        title: "Images Required",
        description: "Please upload at least one image of your property.",
        variant: "destructive",
      });
      return;
    }

    await withLoading(async () => {
      // Prepare the data for insertion, ensuring all required fields are present
      const propertyData = {
        title: data.title,
        description: data.description,
        price: data.price,
        location: data.location,
        bedrooms: data.bedrooms || null,
        bathrooms: data.bathrooms || null,
        status: data.status || 'pending',
        photo_url: imageUrls[0] || null,
        photo_urls: imageUrls.length > 0 ? imageUrls : null,
        amenities: amenities.length > 0 ? amenities : null,
        landlord_id: user.id,
      };

      const { data: property, error } = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single();

      if (error) throw error;

      handleSuccess(toast, "Property listing created successfully!");
      navigate("/landlord");
    });
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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link to="/landlord" className="hover:text-blue-600">Dashboard</Link>
            <span>•</span>
            <span className="text-gray-900 font-medium">New Listing</span>
          </nav>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create New Listing</h1>
                <p className="text-gray-600">Add a new property to your portfolio</p>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">Pending Review</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
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

              {/* Submit */}
              <div className="flex gap-4 pt-6">
                <Button 
                  type="submit" 
                  disabled={loading || formProgress < 70} 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {loading ? "Creating..." : "Create Listing"}
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
              
              {formProgress < 70 && (
                <div className="text-center text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
                  Complete at least 70% of the form to create your listing
                </div>
              )}
            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
};

export default NewListing;
