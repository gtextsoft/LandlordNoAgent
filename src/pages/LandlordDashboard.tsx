import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase, Property } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useLoadingState } from "@/hooks/useLoadingState";
import { handleError, handleSuccess } from "@/utils/errorHandling";
import LoadingSpinner from "@/components/LoadingSpinner";
import Layout from "@/components/Layout";
import { debugDatabase, createSampleData } from "@/utils/databaseDebug";

import DashboardStats from "@/components/landlord/DashboardStats";
import QuickActions from "@/components/landlord/QuickActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Calendar, DollarSign } from "lucide-react";

interface ChatRoom {
  id: string;
  renter_id: string;
  property_id: string;
  created_at: string;
  properties?: Property;
  renter_profile?: any;
}

const LandlordDashboard = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeProperties: 0,
    totalViews: 0,
    totalInquiries: 0,
    newInquiriesThisWeek: 0,
    monthlyRevenue: 0,
    occupancyRate: 0,
  });
  
  const { loading, setLoading } = useLoadingState();
  const [statsLoading, setStatsLoading] = useState(true);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const { profile, hasRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔐 Auth check - Profile:', profile);
    console.log('🔐 Auth check - Has landlord role:', hasRole('landlord'));
    
    if (!profile || !hasRole('landlord')) {
      console.log('❌ User not authorized as landlord, redirecting to home');
      navigate('/');
      return;
    }
    
    console.log('✅ User authorized as landlord, fetching dashboard data');
    fetchDashboardData();
  }, [profile, navigate, hasRole]);

  const fetchDashboardData = async () => {
    // Fetch all data in parallel for better performance
    await Promise.all([
      fetchProperties(),
      fetchChatRooms(),
      fetchAnalytics()
    ]);
  };

  const fetchProperties = async () => {
    if (!profile) return;

    try {
      setPropertiesLoading(true);
      console.log('🏠 Fetching properties for landlord:', profile.id);
      
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          profiles!properties_landlord_id_fkey (*)
        `)
        .eq('landlord_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching properties:', error);
        throw error;
      }

      console.log('✅ Properties fetched:', data);
      setProperties((data as any) || []);
      
      // Calculate basic stats from properties
      const activeProperties = data?.filter(p => p.status === 'active').length || 0;
      const totalRevenue = data?.reduce((sum, p) => sum + (p.price || 0), 0) || 0;
      
      console.log('📊 Stats calculated:', {
        totalProperties: data?.length || 0,
        activeProperties,
        monthlyRevenue: Math.round(totalRevenue / 12)
      });
      
      setStats(prevStats => ({
        ...prevStats,
        totalProperties: data?.length || 0,
        activeProperties,
        monthlyRevenue: Math.round(totalRevenue / 12), // Convert yearly to monthly
      }));
    } catch (error: any) {
      console.error('❌ Property fetch error:', error);
      handleError(error, toast, 'Failed to load properties');
    } finally {
      setPropertiesLoading(false);
    }
  };

  const fetchChatRooms = async () => {
    if (!profile) return;
    
    try {
      setMessagesLoading(true);
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          properties (*),
          renter_profile:profiles!chat_rooms_renter_id_fkey (*),
          messages (*, sender:profiles!messages_sender_id_fkey (*))
        `)
        .eq('landlord_id', profile.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Transform data to match MessagesSection expected format
      const transformedChatRooms = (data || []).map(room => ({
        ...room,
        last_message: room.messages && room.messages.length > 0 
          ? {
              content: room.messages[room.messages.length - 1].content,
              created_at: room.messages[room.messages.length - 1].created_at,
              sender_type: room.messages[room.messages.length - 1].sender_id === profile.id ? 'landlord' : 'renter'
            }
          : null,
        unread_count: room.messages ? room.messages.filter(msg => 
          msg.sender_id !== profile.id
        ).length : 0,
        status: 'active' // Default status
      }));
      setChatRooms(transformedChatRooms);
      
      // Update inquiries count
      const totalInquiries = data?.length || 0;
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const newInquiriesThisWeek = data?.filter(room => 
        new Date(room.created_at) > oneWeekAgo
      ).length || 0;
      
      setStats(prevStats => ({
        ...prevStats,
        totalInquiries,
        newInquiriesThisWeek,
      }));
    } catch (error: any) {
      handleError(error, toast, 'Failed to load chat rooms');
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!profile) return;
    
    try {
      setStatsLoading(true);
      
      // Get real analytics data using our analytics service
      const { data: properties } = await supabase
        .from('properties')
        .select(`
          id,
          created_at,
          chat_rooms (
            id,
            created_at
          )
        `)
        .eq('landlord_id', profile.id);
      
      if (!properties) {
        setStats(prevStats => ({ ...prevStats, totalViews: 0 }));
        return;
      }

      // Get actual view counts from analytics
      const { data: viewsData } = await supabase
        .from('property_views')
        .select('count')
        .eq('landlord_id', profile.id);

      const totalViews = viewsData?.reduce((sum, view) => sum + (view.count || 0), 0) ?? 0;
      
      setStats(prevStats => ({
        ...prevStats,
        totalViews,
      }));
    } catch (error: any) {
      console.warn('Analytics fetch failed:', error);
      // Don't show error for analytics as it's not critical
      setStats(prevStats => ({ ...prevStats, totalViews: 0 }));
    } finally {
      setStatsLoading(false);
    }
  };

  // Calculate occupancy rate
  const occupancyRate = stats.totalProperties > 0 
    ? Math.round((stats.activeProperties / stats.totalProperties) * 100)
    : 0;

  const updatedStats = {
    ...stats,
    occupancyRate
  };

  // Show loading spinner only for initial page load
  if (loading && propertiesLoading && statsLoading && messagesLoading) {
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
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back! Here's an overview of your property business.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="animate-fade-in">
          <DashboardStats 
            stats={stats} 
            properties={properties}
            loading={statsLoading} 
          />
        </div>

        {/* Quick Actions */}
        <div className="animate-fade-in">
          <QuickActions 
            stats={{
              totalProperties: stats.totalProperties,
              activeProperties: stats.activeProperties,
              totalViews: stats.totalViews,
              totalInquiries: stats.totalInquiries
            }}
          />
        </div>

        {/* Key Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProperties}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeProperties} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{stats.monthlyRevenue?.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Estimated monthly
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews}</div>
              <p className="text-xs text-muted-foreground">
                Property views
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInquiries}</div>
              <p className="text-xs text-muted-foreground">
                {stats.newInquiriesThisWeek} this week
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default LandlordDashboard;
