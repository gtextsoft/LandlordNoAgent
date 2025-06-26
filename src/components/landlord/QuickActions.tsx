import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Eye, 
  Users, 
  BarChart3, 
  MessageCircle, 
  Calendar, 
  TrendingUp,
  Star
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface QuickActionsProps {
  stats?: {
    totalProperties: number;
    activeProperties: number;
    totalViews: number;
    totalInquiries: number;
    monthlyRevenue?: number;
  };
}

interface Activity {
  id: string;
  action: string;
  property: string;
  time: string;
  type: 'inquiry' | 'view' | 'message';
}

const QuickActions = ({ stats }: QuickActionsProps) => {
  const { profile } = useAuth();
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const actions = [
    {
      title: "Add New Property",
      description: "Create a new property listing",
      icon: Plus,
      href: "/landlord/new",
      variant: "default" as const,
      className: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white",
      priority: "high",
    },
    {
      title: "Manage Properties",
      description: "View and edit your property listings",
      icon: Eye,
      href: "/landlord/properties",
      variant: "outline" as const,
      priority: "medium",
    },
    {
      title: "Manage Tenants",
      description: "View and communicate with current tenants",
      icon: Users,
      href: "/messages",
      variant: "outline" as const,
      priority: "medium",
    },
    {
      title: "Analytics Dashboard",
      description: "View detailed property performance",
      icon: BarChart3,
      href: "#analytics",
      variant: "outline" as const,
      priority: "medium",
    }
  ];

  // Load real recent activity from database
  useEffect(() => {
    const loadRecentActivity = async () => {
      if (!profile?.id) return;

      try {
        setLoading(true);
        
        // Get recent chat rooms (inquiries) and messages
        const { data: chatRooms, error: chatError } = await supabase
          .from('chat_rooms')
          .select(`
            id,
            created_at,
            properties (title),
            renter_profile:profiles!chat_rooms_renter_id_fkey (full_name),
            messages (
              id,
              content,
              created_at,
              sender_id
            )
          `)
          .eq('landlord_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (chatError) throw chatError;

        const activities: Activity[] = [];

        // Add recent inquiries
        chatRooms?.forEach(room => {
          const timeDiff = Date.now() - new Date(room.created_at).getTime();
          const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
          
          let timeStr = '';
          if (hoursAgo < 1) timeStr = 'Just now';
          else if (hoursAgo < 24) timeStr = `${hoursAgo} hours ago`;
          else timeStr = `${Math.floor(hoursAgo / 24)} days ago`;

          activities.push({
            id: `inquiry-${room.id}`,
            action: `New inquiry from ${room.renter_profile?.full_name || 'Unknown'}`,
            property: room.properties?.title || 'Unknown Property',
            time: timeStr,
            type: 'inquiry'
          });

          // Add recent messages from this chat room
          if (room.messages && room.messages.length > 0) {
            const recentMessages = room.messages
              .filter(msg => msg.sender_id !== profile.id) // Only messages from renters
              .slice(-2); // Last 2 messages

            recentMessages.forEach(msg => {
              const msgTimeDiff = Date.now() - new Date(msg.created_at).getTime();
              const msgHoursAgo = Math.floor(msgTimeDiff / (1000 * 60 * 60));
              
              let msgTimeStr = '';
              if (msgHoursAgo < 1) msgTimeStr = 'Just now';
              else if (msgHoursAgo < 24) msgTimeStr = `${msgHoursAgo} hours ago`;
              else msgTimeStr = `${Math.floor(msgHoursAgo / 24)} days ago`;

              activities.push({
                id: `message-${msg.id}`,
                action: `New message from ${room.renter_profile?.full_name || 'Unknown'}`,
                property: room.properties?.title || 'Unknown Property',
                time: msgTimeStr,
                type: 'message'
              });
            });
          }
        });

        // Sort by most recent and limit to 5
        activities.sort((a, b) => {
          const timeA = a.time.includes('Just now') ? 0 : 
                      a.time.includes('hours ago') ? parseInt(a.time) : 
                      parseInt(a.time) * 24;
          const timeB = b.time.includes('Just now') ? 0 : 
                      b.time.includes('hours ago') ? parseInt(b.time) : 
                      parseInt(b.time) * 24;
          return timeA - timeB;
        });

        setRecentActivity(activities.slice(0, 5));
      } catch (error) {
        console.error('Error loading recent activity:', error);
        setRecentActivity([]);
      } finally {
        setLoading(false);
      }
    };

    loadRecentActivity();
  }, [profile?.id]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'inquiry':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'view':
        return <Eye className="w-4 h-4 text-green-500" />;
      case 'message':
        return <Users className="w-4 h-4 text-purple-500" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-500" />;
    }
  };

  // Calculate dynamic monthly goal based on current portfolio
  const currentRevenue = stats?.monthlyRevenue || 0;
  const dynamicGoal = Math.max(
    currentRevenue * 1.2, // 20% growth target
    50000 // Minimum goal of ₦50,000
  );
  const goalProgress = Math.min((currentRevenue / dynamicGoal) * 100, 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Quick Actions */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {actions.map((action) => (
              <Link 
                key={action.title} 
                to={action.href} 
                className={action.href.startsWith('#') ? "pointer-events-none" : ""}
              >
                <Button
                  variant={action.variant}
                  className={`w-full h-auto p-6 flex flex-col items-center space-y-3 transition-all duration-200 hover:scale-105 ${
                    action.className || ""
                  } ${action.href.startsWith('#') ? "opacity-50" : ""}`}
                  disabled={action.href.startsWith('#')}
                >
                  <div className="flex items-center space-x-2">
                    <action.icon className="w-6 h-6" />
                    {action.priority === "high" && (
                      <Badge variant="secondary" className="text-xs">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-base">{action.title}</div>
                    <div className="text-sm opacity-80 mt-1">{action.description}</div>
                  </div>
                  {action.href.startsWith('#') && (
                    <Badge variant="outline" className="text-xs">
                      Available in Tab Above
                    </Badge>
                  )}
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance & Activity */}
      <div className="space-y-6">
        {/* Monthly Goal Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
              Monthly Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Revenue Progress</span>
                <span className="text-sm font-medium">
                  ₦{currentRevenue.toLocaleString()} / ₦{dynamicGoal.toLocaleString()}
                </span>
              </div>
              <Progress value={goalProgress} className="h-2" />
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{Math.round(goalProgress)}% completed</span>
                <span>
                  {goalProgress >= 100 ? "🎉 Goal achieved!" : `₦${(dynamicGoal - currentRevenue).toLocaleString()} to go`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-start space-x-3 p-2">
                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        <div className="flex-1 space-y-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <>
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-shrink-0 mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.action}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {activity.property}
                        </p>
                        <p className="text-xs text-gray-400">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <Link to="/messages" className="block">
                    <Button variant="ghost" size="sm" className="w-full text-xs">
                      View All Messages
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No recent activity</p>
                  <p className="text-xs mt-1">Activity will appear when renters interact with your properties</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-500" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.totalProperties || 0}
                </div>
                <div className="text-xs text-gray-600">Properties</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats?.totalViews || 0}
                </div>
                <div className="text-xs text-gray-600">Total Views</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {stats?.totalInquiries || 0}
                </div>
                <div className="text-xs text-gray-600">Inquiries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {stats?.activeProperties || 0}
                </div>
                <div className="text-xs text-gray-600">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuickActions;
