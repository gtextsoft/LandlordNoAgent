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
import PropertyManagement from "@/components/landlord/PropertyManagement";
import MessagesSection from "@/components/landlord/MessagesSection";
import AnalyticsDashboard from "@/components/landlord/AnalyticsDashboard";
import RevenueTracking from "@/components/landlord/RevenueTracking";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Home, MessageCircle, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

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
  const [activeTab, setActiveTab] = useState("overview");
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

  const handleToggleStatus = async (propertyId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from('properties')
        .update({ status: newStatus })
        .eq('id', propertyId);

      if (error) throw error;

      await fetchProperties();
      handleSuccess(toast, `Property ${newStatus === 'active' ? 'activated' : 'suspended'} successfully.`);
    } catch (error: any) {
      handleError(error, toast, 'Failed to update property status');
    }
  };

  const handleDelete = async (propertyId: string) => {
    if (!confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      await fetchProperties();
      handleSuccess(toast, 'Property deleted successfully.');
    } catch (error: any) {
      handleError(error, toast, 'Failed to delete property');
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
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <TabsList>
              <TabsTrigger value="overview" className="flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="properties" className="flex items-center">
                <Home className="w-4 h-4 mr-2" />
                Properties
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center">
                <MessageCircle className="w-4 h-4 mr-2" />
                Messages
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
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

            {/* Recent Properties & Messages */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Properties */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Home className="w-5 h-5 mr-2" />
                    Recent Properties
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {properties.slice(0, 3).map((property) => (
                    <div key={property.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {property.title.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{property.title}</h4>
                        <p className="text-sm text-gray-600">{property.location}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                            {property.status}
                          </Badge>
                          <span className="text-sm font-medium text-green-600">
                            ₦{property.price?.toLocaleString()}/month
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {properties.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Home className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No properties yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Messages */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Recent Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {chatRooms.slice(0, 3).map((room) => (
                    <div key={room.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                        {room.renter_profile?.full_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {room.renter_profile?.full_name || 'Unknown User'}
                        </h4>
                        <p className="text-sm text-gray-600">{room.properties?.title}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(room.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {chatRooms.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No messages yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard 
              properties={properties}
              loading={statsLoading}
            />
          </TabsContent>

          <TabsContent value="properties" className="space-y-6">
            <PropertyManagement
              properties={properties}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDelete}
              onUpdate={fetchProperties}
              loading={propertiesLoading}
            />
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <MessagesSection chatRooms={chatRooms} loading={messagesLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default LandlordDashboard;
