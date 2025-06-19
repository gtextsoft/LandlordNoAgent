
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';
import { handleError, handleSuccess } from '@/utils/shared';
import { useLoadingState } from './useLoadingState';

export interface SavedProperty {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
}

export const useSavedProperties = () => {
  const [savedProperties, setSavedProperties] = useState<string[]>([]);
  const { loading, setLoading } = useLoadingState();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchSavedProperties();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSavedProperties = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('saved_properties')
        .select('property_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setSavedProperties(data?.map(item => item.property_id) || []);
    } catch (error: any) {
      handleError(error, toast, 'Error fetching saved properties');
    } finally {
      setLoading(false);
    }
  };

  const toggleSavedProperty = async (propertyId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save properties.",
        variant: "destructive"
      });
      return;
    }

    const isSaved = savedProperties.includes(propertyId);
    
    try {
      if (isSaved) {
        const { error } = await supabase
          .from('saved_properties')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', propertyId);

        if (error) throw error;
        setSavedProperties(prev => prev.filter(id => id !== propertyId));
        handleSuccess(toast, "Property removed from saved list.");
      } else {
        const { error } = await supabase
          .from('saved_properties')
          .insert({
            user_id: user.id,
            property_id: propertyId
          });

        if (error) throw error;
        setSavedProperties(prev => [...prev, propertyId]);
        handleSuccess(toast, "Property added to your saved list.");
      }
    } catch (error: any) {
      handleError(error, toast, 'Failed to update saved properties.');
    }
  };

  return {
    savedProperties,
    loading,
    toggleSavedProperty,
    isSaved: (propertyId: string) => savedProperties.includes(propertyId)
  };
};
