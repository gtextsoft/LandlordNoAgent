import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User, ChevronDown, LogOut, Plus, Bell, MessageCircle, Home, Eye, Calendar, Settings, Palette, Moon, Sun, AlertCircle, CheckCircle, DollarSign, Wrench } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { handleLogout } from "@/utils/shared";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { NotificationService, Notification as DBNotification } from "@/services/notificationService";

interface DashboardHeaderProps {
  onLogout: () => void;
}

// Use the database notification type
type Notification = DBNotification & {
  timeAgo?: string;
};

interface ThemeSettings {
  mode: 'light' | 'dark';
  colorScheme: 'blue' | 'green' | 'purple' | 'orange';
  compactMode: boolean;
  animations: boolean;
}

// Helper function to format time ago
const formatTimeAgo = (dateString: string | null): string => {
  if (!dateString) return 'Unknown time';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return date.toLocaleDateString();
};

const DashboardHeader = ({ onLogout }: DashboardHeaderProps) => {
  const { profile, userRoles, hasRole } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    mode: 'light',
    colorScheme: 'blue',
    compactMode: false,
    animations: true
  });

  // Load theme settings from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('landlordnoagent-theme');
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        setThemeSettings(parsed);
        applyTheme(parsed);
      } catch (error) {
        console.warn('Failed to parse saved theme:', error);
      }
    }
  }, []);

  // Apply theme to document
  const applyTheme = (settings: ThemeSettings) => {
    const root = document.documentElement;
    
    // Apply dark/light mode
    if (settings.mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Apply color scheme
    root.setAttribute('data-color-scheme', settings.colorScheme);
    
    // Apply compact mode
    if (settings.compactMode) {
      root.classList.add('compact');
    } else {
      root.classList.remove('compact');
    }
    
    // Apply animations setting
    if (!settings.animations) {
      root.classList.add('no-animations');
    } else {
      root.classList.remove('no-animations');
    }
  };

  // Update theme settings
  const updateTheme = (newSettings: Partial<ThemeSettings>) => {
    const updated = { ...themeSettings, ...newSettings };
    setThemeSettings(updated);
    applyTheme(updated);
    localStorage.setItem('landlordnoagent-theme', JSON.stringify(updated));
    
    toast({
      title: "Theme Updated",
      description: "Your theme preferences have been saved.",
    });
  };

  // Load real notifications from database
  useEffect(() => {
    const loadNotifications = async () => {
      if (!profile?.id) return;

      try {
        const [notificationsData, unreadCountData] = await Promise.all([
          NotificationService.getUserNotifications(profile.id, 10),
          NotificationService.getUnreadCount(profile.id)
        ]);

        // Add time ago calculation
        const notificationsWithTimeAgo = notificationsData.map(notification => ({
          ...notification,
          timeAgo: formatTimeAgo(notification.created_at)
        }));

        setNotifications(notificationsWithTimeAgo);
        setUnreadCount(unreadCountData);
      } catch (error) {
        console.error('Error loading notifications:', error);
        toast({
          title: "Error",
          description: "Failed to load notifications",
          variant: "destructive"
        });
      }
    };

    loadNotifications();

    // Set up real-time subscription
    let subscription: any = null;
    if (profile?.id) {
      subscription = NotificationService.subscribeToNotifications(
        profile.id,
        (newNotification) => {
          const notificationWithTimeAgo = {
            ...newNotification,
            timeAgo: formatTimeAgo(newNotification.created_at)
          };
          
          setNotifications(prev => [notificationWithTimeAgo, ...prev.slice(0, 9)]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast for new notifications
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      );
    }

    return () => {
      if (subscription) {
        NotificationService.unsubscribeFromNotifications(subscription);
      }
    };
  }, [profile?.id, toast]);

  const handleSignOut = async () => {
    await handleLogout();
    onLogout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!profile?.id) return;
    
    try {
      await NotificationService.markAllAsRead(profile.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'property_inquiry':
        return <Home className="w-4 h-4 text-green-500" />;
      case 'property_approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'property_rejected':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'booking_request':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'booking_confirmed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'booking_cancelled':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'payment_received':
        return <DollarSign className="w-4 h-4 text-green-500" />;
      case 'maintenance_request':
        return <Wrench className="w-4 h-4 text-orange-500" />;
      case 'system_update':
        return <Bell className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const colorSchemes = [
    { name: 'Blue', value: 'blue', colors: 'from-blue-500 to-indigo-600' },
    { name: 'Green', value: 'green', colors: 'from-green-500 to-emerald-600' },
    { name: 'Purple', value: 'purple', colors: 'from-purple-500 to-violet-600' },
    { name: 'Orange', value: 'orange', colors: 'from-orange-500 to-amber-600' }
  ];

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50 dark:bg-gray-900 dark:border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className={`w-10 h-10 bg-gradient-to-r ${
                themeSettings.colorScheme === 'blue' ? 'from-blue-600 to-indigo-600' :
                themeSettings.colorScheme === 'green' ? 'from-green-600 to-emerald-600' :
                themeSettings.colorScheme === 'purple' ? 'from-purple-600 to-violet-600' :
                'from-orange-600 to-amber-600'
              } rounded-lg flex items-center justify-center`}>
                <span className="text-white font-bold">FL</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">LandLordNoAgent</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Landlord Dashboard</p>
              </div>
            </Link>
          </div>
          

          
          <div className="flex items-center space-x-4">
            {/* Theme Settings */}
            <Dialog open={themeDialogOpen} onOpenChange={setThemeDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Theme Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Dark Mode Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {themeSettings.mode === 'dark' ? (
                        <Moon className="w-4 h-4" />
                      ) : (
                        <Sun className="w-4 h-4" />
                      )}
                      <span className="font-medium">Dark Mode</span>
                    </div>
                    <Switch
                      checked={themeSettings.mode === 'dark'}
                      onCheckedChange={(checked) => 
                        updateTheme({ mode: checked ? 'dark' : 'light' })
                      }
                    />
                  </div>

                  {/* Color Scheme */}
                  <div>
                    <h4 className="font-medium mb-3">Color Scheme</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {colorSchemes.map((scheme) => (
                        <button
                          key={scheme.value}
                          onClick={() => updateTheme({ colorScheme: scheme.value as any })}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            themeSettings.colorScheme === scheme.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                          }`}
                        >
                          <div className={`w-full h-8 rounded bg-gradient-to-r ${scheme.colors} mb-2`}></div>
                          <span className="text-sm font-medium">{scheme.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Additional Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Compact Mode</span>
                      <Switch
                        checked={themeSettings.compactMode}
                        onCheckedChange={(checked) => 
                          updateTheme({ compactMode: checked })
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Animations</span>
                      <Switch
                        checked={themeSettings.animations}
                        onCheckedChange={(checked) => 
                          updateTheme({ animations: checked })
                        }
                      />
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between p-4 border-b">
                  <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                  {unreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={markAllAsRead}
                      className="text-xs h-6 px-2"
                    >
                      Mark all read
                    </Button>
                  )}
                </div>
                
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.slice(0, 5).map((notification) => (
                      <DropdownMenuItem 
                        key={notification.id} 
                        className="p-0 focus:bg-transparent"
                        asChild
                      >
                        <Link 
                          to={notification.action_url || '#'}
                          onClick={() => markAsRead(notification.id)}
                          className="block"
                        >
                          <Card className={`m-2 border-0 shadow-none hover:bg-gray-50 transition-colors ${
                            !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                          }`}>
                            <CardContent className="p-3">
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-1">
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {notification.title}
                                    </p>
                                    {!notification.read && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {notification.timeAgo}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    
                    {notifications.length > 5 && (
                      <DropdownMenuItem asChild>
                        <Link to="/notifications" className="text-center p-2 text-sm text-blue-600 hover:text-blue-800">
                          View all notifications
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 pl-2 pr-2">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 hidden md:inline">
                      {profile?.full_name}
                    </span>
                    <div className="hidden md:flex gap-1">
                      {userRoles.map((role) => (
                        <Badge key={role} variant="secondary" className="text-xs">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/landlord" className="cursor-pointer">
                    <Eye className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/messages" className="cursor-pointer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    <span>Messages</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setThemeDialogOpen(true)} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Theme Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
