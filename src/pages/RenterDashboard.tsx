import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useLoadingState } from "@/hooks/useLoadingState";
import { handleError } from "@/utils/errorHandling";
import LoadingSpinner from "@/components/LoadingSpinner";
import Layout from "@/components/Layout";
import { useSavedProperties } from "@/hooks/useSavedProperties";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Heart, 
  MessageSquare, 
  FileText, 
  Search, 
  Bell,
  TrendingUp,
  Clock,
  MapPin,
  Star,
  ChevronRight,
  Calendar,
  DollarSign
} from "lucide-react";

interface RenterStats {
  savedPropertiesCount: number;
  applicationCount: number;
  messagesCount: number;
  recentViewsCount: number;
}

interface RecentApplication {
  id: string;
  status: string;
  created_at: string;
  property: {
    id: string;
    title: string;
    location: string;
    price: number;
    photo_url: string;
  };
}

interface RecentMessage {
  id: string;
  created_at: string;
  content: string;
  chat_room: {
    property: {
      title: string;
      id: string;
    };
  };
}

const RenterDashboard = () => {
  const [stats, setStats] = useState<RenterStats>({
    savedPropertiesCount: 0,
    applicationCount: 0,
    messagesCount: 0,
    recentViewsCount: 0,
  });
  
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [recentProperties, setRecentProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { profile, hasRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { savedProperties } = useSavedProperties();

  useEffect(() => {
    if (!profile || !hasRole('renter')) {
      navigate('/');
      return;
    }
    
    fetchDashboardData();
  }, [profile, hasRole, navigate]);

  const fetchDashboardData = async () => {
    if (!profile) return;
    
    try {
      setLoading(true);
      
      // Fetch applications with proper data transformation
      const { data: rawApplications, error: appError } = await supabase
        .from('rental_applications')
        .select(`
          id,
          status,
          created_at,
          property:properties(id, title, location, price, photo_url)
        `)
        .eq('renter_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (appError) throw appError;

      // Transform applications data to handle array responses
      const applications: RecentApplication[] = rawApplications?.map((app: any) => ({
        id: app.id,
        status: app.status,
        created_at: app.created_at,
        property: Array.isArray(app.property) ? app.property[0] : app.property
      })) || [];

      // Fetch messages count
      const { count: messagesCount, error: msgError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', profile.id);

      if (msgError) throw msgError;

      // Fetch recent messages with proper data transformation
      const { data: rawMessages, error: recentMsgError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          chat_room:chat_rooms(
            property:properties(id, title)
          )
        `)
        .eq('sender_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentMsgError) throw recentMsgError;

      // Transform messages data to handle nested array responses
      const messages: RecentMessage[] = rawMessages?.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        created_at: msg.created_at,
        chat_room: {
          property: Array.isArray(msg.chat_room) && msg.chat_room[0]?.property
            ? (Array.isArray(msg.chat_room[0].property) ? msg.chat_room[0].property[0] : msg.chat_room[0].property)
            : { id: '', title: 'Unknown Property' }
        }
      })) || [];

      // Fetch recommended properties (trending/recently added)
      const { data: trendingProperties, error: trendingError } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6);

      if (trendingError) throw trendingError;

      // Update stats
      setStats({
        savedPropertiesCount: savedProperties.length,
        applicationCount: applications?.length || 0,
        messagesCount: messagesCount || 0,
        recentViewsCount: 0, // TODO: Implement view tracking
      });

      setRecentApplications(applications);
      setRecentMessages(messages);
      setRecentProperties(trendingProperties || []);
      
    } catch (error: any) {
      handleError(error, toast, 'Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'application_approved': return 'bg-green-100 text-green-800';
      case 'application_pending': return 'bg-yellow-100 text-yellow-800';
      case 'application_rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatApplicationStatus = (status: string) => {
    return status.replace('application_', '').charAt(0).toUpperCase() + 
           status.replace('application_', '').slice(1);
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-4 lg:p-6">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back, {profile?.full_name?.split(' ')[0] || 'Renter'}!
                </h1>
                <p className="text-gray-600">
                  Find your perfect home and manage your rental journey
                </p>
              </div>
              <div className="hidden md:flex items-center space-x-3">
                <Link to="/properties">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Search className="w-4 h-4 mr-2" />
                    Browse Properties
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link to="/saved-properties">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
                <CardContent className="p-6 text-center">
                  <Heart className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-red-900">{stats.savedPropertiesCount}</h3>
                  <p className="text-red-700">Saved Properties</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/my-applications">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-6 text-center">
                  <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-blue-900">{stats.applicationCount}</h3>
                  <p className="text-blue-700">Applications</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/messages">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6 text-center">
                  <MessageSquare className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-green-900">{stats.messagesCount}</h3>
                  <p className="text-green-700">Messages Sent</p>
                </CardContent>
              </Card>
            </Link>

            <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
              <CardContent className="p-6 text-center">
                <Bell className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-purple-900">{stats.recentViewsCount}</h3>
                <p className="text-purple-700">Recent Views</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Recent Activity */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Applications */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Recent Applications
                  </CardTitle>
                  <Link to="/my-applications">
                    <Button variant="outline" size="sm">
                      View All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {recentApplications.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No applications yet</p>
                      <Link to="/properties">
                        <Button className="mt-4">Start Browsing Properties</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentApplications.map((app) => (
                        <div key={app.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                          <img
                            src={app.property?.photo_url || '/placeholder.svg'}
                            alt={app.property?.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{app.property?.title}</h4>
                            <p className="text-sm text-gray-600 flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {app.property?.location}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              ₦{app.property?.price?.toLocaleString()}/year
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={getApplicationStatusColor(app.status)}>
                              {formatApplicationStatus(app.status)}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(app.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Trending Properties */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Trending Properties
                  </CardTitle>
                  <Link to="/properties">
                    <Button variant="outline" size="sm">
                      View All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recentProperties.slice(0, 4).map((property) => (
                      <Link key={property.id} to={`/property/${property.id}`}>
                        <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                          <img
                            src={property.photo_url || '/placeholder.svg'}
                            alt={property.title}
                            className="w-full h-32 object-cover"
                          />
                          <div className="p-3">
                            <h4 className="font-semibold text-sm text-gray-900 mb-1">{property.title}</h4>
                            <p className="text-xs text-gray-600 flex items-center mb-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {property.location}
                            </p>
                            <p className="text-sm font-bold text-green-600">
                              ₦{property.price?.toLocaleString()}/year
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Quick Actions & Recent Messages */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link to="/properties">
                    <Button className="w-full justify-start" variant="outline">
                      <Search className="w-4 h-4 mr-2" />
                      Browse Properties
                    </Button>
                  </Link>
                  <Link to="/saved-properties">
                    <Button className="w-full justify-start" variant="outline">
                      <Heart className="w-4 h-4 mr-2" />
                      View Saved Properties
                    </Button>
                  </Link>
                  <Link to="/my-applications">
                    <Button className="w-full justify-start" variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      Check Applications
                    </Button>
                  </Link>
                  <Link to="/messages">
                    <Button className="w-full justify-start" variant="outline">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      View Messages
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Recent Messages */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Recent Messages
                  </CardTitle>
                  <Link to="/messages">
                    <Button variant="outline" size="sm">
                      View All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {recentMessages.length === 0 ? (
                    <div className="text-center py-6">
                      <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">No messages yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentMessages.map((msg) => (
                        <div key={msg.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-semibold text-gray-900">
                              {msg.chat_room?.property?.title}
                            </h5>
                            <span className="text-xs text-gray-500">
                              {new Date(msg.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {msg.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tips Card */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-900 flex items-center">
                    <Star className="w-5 h-5 mr-2" />
                    Renter Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-blue-800">
                  <ul className="space-y-2 text-sm">
                    <li>• Save properties you like for easy comparison</li>
                    <li>• Apply early to increase your chances</li>
                    <li>• Message landlords with specific questions</li>
                    <li>• Keep your documents ready for quick applications</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RenterDashboard; 