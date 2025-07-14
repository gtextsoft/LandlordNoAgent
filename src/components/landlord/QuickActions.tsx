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
  Star,
  Archive,
  Download,
  Upload,
  FileText,
  Settings,
  RefreshCw,
  CheckSquare,
  AlertTriangle,
  Building,
  Mail
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Property } from "@/lib/supabase";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface QuickActionsProps {
  stats?: {
    totalProperties: number;
    activeProperties: number;
    totalViews: number;
    totalInquiries: number;
    monthlyRevenue?: number;
  };
  properties?: Property[];
  onPropertiesUpdate?: () => void;
}

interface Activity {
  id: string;
  action: string;
  property: string;
  time: string;
  type: 'inquiry' | 'view' | 'message';
}

interface BulkAction {
  title: string;
  description: string;
  icon: any;
  action: () => void;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

const QuickActions = ({ stats, properties = [], onPropertiesUpdate }: QuickActionsProps) => {
  const { profile } = useAuth();
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [currentBulkAction, setCurrentBulkAction] = useState<BulkAction | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

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
      title: "View Applications",
      description: "Review and manage rental applications",
      icon: Users,
      href: "/landlord/applications",
      variant: "outline" as const,
      priority: "high",
    },
    {
      title: "Messages",
      description: "View and respond to tenant messages",
      icon: MessageCircle,
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

  const bulkActions: BulkAction[] = [
    {
      title: "Update Status",
      description: "Change status of selected properties",
      icon: RefreshCw,
      action: async () => {
        if (!selectedProperties.length) return;
        
        try {
          setBulkActionLoading(true);
          const { error } = await supabase
            .from('properties')
            .update({ status: 'active' })
            .in('id', selectedProperties);
            
          if (error) throw error;
          
          toast({
            title: "Status Updated",
            description: `Successfully updated ${selectedProperties.length} properties`,
          });
          
          onPropertiesUpdate?.();
        } catch (error) {
          console.error('Error updating properties:', error);
          toast({
            title: "Error",
            description: "Failed to update properties",
            variant: "destructive",
          });
        } finally {
          setBulkActionLoading(false);
          setShowBulkDialog(false);
        }
      },
      requiresConfirmation: true,
      confirmationMessage: "Are you sure you want to update the status of the selected properties?",
    },
    {
      title: "Export Data",
      description: "Export selected properties data",
      icon: Download,
      action: () => {
        const selectedData = properties
          .filter(p => selectedProperties.includes(p.id))
          .map(p => ({
            title: p.title,
            price: p.price,
            status: p.status,
            location: p.location,
            created_at: p.created_at,
          }));
          
        const csv = convertToCSV(selectedData);
        downloadCSV(csv, 'property-export.csv');
      },
    },
    {
      title: "Archive Properties",
      description: "Archive selected properties",
      icon: Archive,
      action: async () => {
        if (!selectedProperties.length) return;
        
        try {
          setBulkActionLoading(true);
          const { error } = await supabase
            .from('properties')
            .update({ status: 'archived' })
            .in('id', selectedProperties);
            
          if (error) throw error;
          
          toast({
            title: "Properties Archived",
            description: `Successfully archived ${selectedProperties.length} properties`,
          });
          
          onPropertiesUpdate?.();
        } catch (error) {
          console.error('Error archiving properties:', error);
          toast({
            title: "Error",
            description: "Failed to archive properties",
            variant: "destructive",
          });
        } finally {
          setBulkActionLoading(false);
          setShowBulkDialog(false);
        }
      },
      requiresConfirmation: true,
      confirmationMessage: "Are you sure you want to archive the selected properties?",
    },
    {
      title: "Send Bulk Message",
      description: "Send message to all tenants",
      icon: Mail,
      action: async () => {
        // Implementation for bulk messaging
        toast({
          title: "Coming Soon",
          description: "Bulk messaging feature will be available soon!",
        });
      },
    },
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

  const handleBulkAction = (action: BulkAction) => {
    if (action.requiresConfirmation) {
      setCurrentBulkAction(action);
      setShowBulkDialog(true);
    } else {
      action.action();
    }
  };

  const convertToCSV = (data: any[]) => {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).join(','));
    return [headers, ...rows].join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {actions.map((action, index) => (
          <Link key={index} to={action.href}>
            <Card className={`hover:shadow-lg transition-shadow ${action.className || ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <action.icon className="w-6 h-6" />
                  <div>
                    <h3 className="font-semibold">{action.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Bulk Actions</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Select Action</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {bulkActions.map((action, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => handleBulkAction(action)}
                    disabled={selectedProperties.length === 0}
                  >
                    <action.icon className="w-4 h-4 mr-2" />
                    {action.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {properties.map((property) => (
              <div key={property.id} className="flex items-center space-x-4">
                <Checkbox
                  checked={selectedProperties.includes(property.id)}
                  onCheckedChange={(checked) => {
                    setSelectedProperties(prev =>
                      checked
                        ? [...prev, property.id]
                        : prev.filter(id => id !== property.id)
                    );
                  }}
                />
                <div className="flex-1">
                  <h4 className="font-medium">{property.title}</h4>
                  <p className="text-sm text-gray-500">{property.location}</p>
                </div>
                <Badge>{property.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-gray-500">
                      {activity.property} • {activity.time}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentBulkAction?.title}</DialogTitle>
            <DialogDescription>
              {currentBulkAction?.confirmationMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDialog(false)}
              disabled={bulkActionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => currentBulkAction?.action()}
              disabled={bulkActionLoading}
            >
              {bulkActionLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuickActions;
