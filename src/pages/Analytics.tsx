import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase, Property } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useLoadingState } from "@/hooks/useLoadingState";
import { handleError, handleSuccess } from "@/utils/errorHandling";
import LoadingSpinner from "@/components/LoadingSpinner";
import Layout from "@/components/Layout";
import AnalyticsDashboard from "@/components/landlord/AnalyticsDashboard";
import { Navigate } from "react-router-dom";

const Analytics = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const { loading, setLoading } = useLoadingState();
  const { profile, hasRole } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!profile || !hasRole('landlord')) {
      return;
    }
    
    fetchProperties();
  }, [profile]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      
      const { data: propertiesData, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_financial_metrics(*),
          property_transactions(*)
        `)
        .eq('landlord_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProperties(propertiesData || []);
    } catch (error: any) {
      handleError(error, toast, 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  // Ensure only landlords can access this page
  if (!profile || !hasRole('landlord')) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <AnalyticsDashboard 
          properties={properties}
          loading={loading}
        />
      </div>
    </Layout>
  );
};

export default Analytics; 