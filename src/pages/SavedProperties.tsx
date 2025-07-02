
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSavedProperties } from '@/hooks/useSavedProperties';
import { supabase, Property } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import Layout from '@/components/Layout';
import { useLoadingState } from '@/hooks/useLoadingState';
import { handleError } from '@/utils/errorHandling';
import { useToast } from '@/hooks/use-toast';

const SavedProperties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const { loading, setLoading } = useLoadingState();
  const { user } = useAuth();
  const { savedProperties } = useSavedProperties();
  const { toast } = useToast();

  useEffect(() => {
    if (savedProperties.length > 0) {
      fetchSavedProperties();
    } else {
      setLoading(false);
    }
  }, [savedProperties]);

  const fetchSavedProperties = async () => {
    if (savedProperties.length === 0) {
      setProperties([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          profiles!properties_landlord_id_fkey (*)
        `)
        .in('id', savedProperties)
        .eq('status', 'active');

      if (error) throw error;
      setProperties(data || []);
    } catch (error: any) {
      handleError(error, toast, 'Error fetching saved properties');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please log in to view saved properties</h1>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <Heart className="w-8 h-8 mr-3 text-red-500" />
            Saved Properties
          </h1>
          <p className="text-gray-600">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'} saved
          </p>
        </div>

        {properties.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved properties yet</h3>
              <p className="text-gray-600 mb-6">
                Start browsing properties and save your favorites by clicking the heart icon.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                showSaveButton={true}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SavedProperties;
