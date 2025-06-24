import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useAuth } from "@/hooks/useAuth";
import { Building, Home, MessageSquare, LogOut, User, Shield, Heart, Menu, X, Plus, Bell, Palette, Moon, Sun, MessageCircle, CheckCircle, AlertCircle, DollarSign, Wrench, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { NotificationService, Notification as DBNotification } from "@/services/notificationService";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import EnhancedNavigation from "@/components/EnhancedNavigation";
import UserOnboarding from "@/components/UserOnboarding";

interface LayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
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

const Layout = ({ children, showNav = true }: LayoutProps) => {
  const { profile, signOut, hasRole, primaryRole } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  
  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Theme state
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    mode: 'light',
    colorScheme: 'blue',
    compactMode: false,
    animations: true
  });

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userType, setUserType] = useState<'renter' | 'landlord'>('renter');

  // Check if user needs onboarding
  useEffect(() => {
    if (profile && !localStorage.getItem('onboardingCompleted') && !localStorage.getItem('onboardingSkipped')) {
      const shouldShowOnboarding = !profile.full_name;
      if (shouldShowOnboarding) {
        setUserType(hasRole('landlord') ? 'landlord' : 'renter');
        setShowOnboarding(true);
      }
    }
  }, [profile, hasRole]);

  const isActive = (path: string) => location.pathname === path;

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

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

  // Load real notifications from database (only for landlords)
  useEffect(() => {
    if (!profile?.id || !hasRole('landlord')) return;

    const loadNotifications = async () => {
      try {
        console.log('Loading notifications for user:', profile.id); // Debug log
        
        const [notificationsData, unreadCountData] = await Promise.all([
          NotificationService.getUserNotifications(profile.id, 10),
          NotificationService.getUnreadCount(profile.id)
        ]);

        console.log('Loaded notifications:', notificationsData); // Debug log
        console.log('Unread count:', unreadCountData); // Debug log

        // Add time ago calculation
        const notificationsWithTimeAgo = notificationsData.map(notification => ({
          ...notification,
          timeAgo: formatTimeAgo(notification.created_at)
        }));

        setNotifications(notificationsWithTimeAgo);
        setUnreadCount(unreadCountData);
      } catch (error) {
        console.error('Error loading notifications:', error);
        // Set empty notifications on error
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    loadNotifications();

    // Set up real-time subscription
    let subscription: any = null;
    subscription = NotificationService.subscribeToNotifications(
      profile.id,
      (newNotification) => {
        console.log('New notification received:', newNotification); // Debug log
        
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

    return () => {
      if (subscription) {
        NotificationService.unsubscribeFromNotifications(subscription);
      }
    };
  }, [profile?.id, hasRole, toast]);

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

  // Notification functions
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

  const clearTestNotifications = async () => {
    if (!profile?.id) return;
    
    try {
      await NotificationService.clearTestNotifications(profile.id);
      setNotifications([]);
      setUnreadCount(0);
      toast({
        title: "Test notifications cleared",
        description: "All test/dummy notifications have been removed.",
      });
    } catch (error) {
      console.error('Error clearing test notifications:', error);
      toast({
        title: "Error",
        description: "Failed to clear test notifications.",
        variant: "destructive",
      });
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

  // Different sidebar configs for different roles
  const getSidebarConfig = () => {
    if (hasRole('admin')) {
      return {
        title: "Admin Portal",
        bgColor: "bg-gray-800/90",
        borderColor: "border-red-800",
        logoColor: "from-red-600 to-red-800",
        textColor: "text-white",
        links: [
          { to: "/admin", icon: Shield, label: "Admin Panel", active: isActive('/admin') },
          { to: "/properties", icon: Home, label: "Browse Properties", active: isActive('/properties') },
        ]
      };
    } else if (hasRole('landlord')) {
      return {
        title: "Landlord Portal",
        bgColor: "bg-white/90",
        borderColor: "border-blue-200",
        logoColor: "from-blue-600 to-indigo-600",
        textColor: "text-gray-900",
        links: [
          { to: "/landlord", icon: Building, label: "Dashboard", active: isActive('/landlord') },
          { to: "/landlord/properties", icon: Home, label: "My Properties", active: isActive('/landlord/properties') },
          { to: "/landlord/new", icon: Plus, label: "New Listing", active: isActive('/landlord/new') },
          { to: "/messages", icon: MessageSquare, label: "Messages", active: isActive('/messages') },
          { to: "/account", icon: User, label: "Account Settings", active: isActive('/account') },
        ]
      };
    } else {
      return {
        title: "Renter Portal",
        bgColor: "bg-white/90",
        borderColor: "border-green-200",
        logoColor: "from-green-600 to-blue-600",
        textColor: "text-gray-900",
        links: [
          { to: "/properties", icon: Home, label: "Browse Properties", active: isActive('/properties') },
          { to: "/saved-properties", icon: Heart, label: "Saved Properties", active: isActive('/saved-properties') },
          { to: "/messages", icon: MessageSquare, label: "Messages", active: isActive('/messages') },
        ]
      };
    }
  };

  const sidebarConfig = getSidebarConfig();

  // Mobile Header Component
  const MobileHeader = () => (
    <header className={`lg:hidden ${sidebarConfig.bgColor} backdrop-blur-sm border-b ${sidebarConfig.borderColor} shadow-sm sticky top-0 z-40`}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 bg-gradient-to-r ${sidebarConfig.logoColor} rounded-lg flex items-center justify-center`}>
            <span className="text-white font-bold text-sm">FL</span>
          </div>
          <div>
            <span className={`text-lg font-bold ${sidebarConfig.textColor}`}>LandlordNoAgent</span>
            <p className={`text-xs ${hasRole('admin') ? 'text-red-300' : 'text-gray-500'}`}>
              {sidebarConfig.title}
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
          className={`${hasRole('admin') ? 'text-white hover:bg-red-800' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <Menu className="w-6 h-6" />
        </Button>
      </div>
    </header>
  );

  // Mobile Menu Overlay
  const MobileMenu = () => (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />
      
      {/* Slide-out Menu */}
      <div className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] ${sidebarConfig.bgColor} backdrop-blur-sm border-l ${sidebarConfig.borderColor} shadow-xl z-50 lg:hidden transform transition-transform duration-300 ease-in-out ${
        mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Menu Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 bg-gradient-to-r ${sidebarConfig.logoColor} rounded-lg flex items-center justify-center`}>
              <span className="text-white font-bold text-sm">FL</span>
            </div>
            <div>
              <span className={`text-lg font-bold ${sidebarConfig.textColor}`}>LandlordNoAgent</span>
              <p className={`text-xs ${hasRole('admin') ? 'text-red-300' : 'text-gray-500'}`}>
                {sidebarConfig.title}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(false)}
            className={`${hasRole('admin') ? 'text-white hover:bg-red-800' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {sidebarConfig.links.map((link) => (
            <Link key={link.to} to={link.to} onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={link.active ? 'default' : 'ghost'}
                className={`w-full justify-start mb-2 ${!link.active && hasRole('admin') ? 'text-gray-300 hover:text-white' : ''}`}
              >
                <link.icon className="w-4 h-4 mr-3" />
                {link.label}
              </Button>
            </Link>
          ))}
          
          {/* Role switching for multi-role users */}
          {(hasRole('admin') && hasRole('landlord')) && (
            <div className="mt-6 pt-4 border-t border-gray-600">
              <p className="text-xs text-gray-400 mb-3 px-3">Switch Role</p>
              <Link to="/landlord" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" size="sm" className="w-full mb-2 text-gray-300 border-gray-600">
                  <Building className="w-4 h-4 mr-3" />
                  Landlord Portal
                </Button>
              </Link>
            </div>
          )}
        </nav>

        {/* User Profile Section */}
        <div className="px-6 py-4 border-t">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-10 h-10 ${hasRole('admin') ? 'bg-red-100' : 'bg-blue-100'} rounded-full flex items-center justify-center`}>
              <User className={`w-5 h-5 ${hasRole('admin') ? 'text-red-600' : 'text-blue-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${sidebarConfig.textColor} truncate`}>
                {profile?.full_name || 'User'}
              </p>
              <p className={`text-xs ${hasRole('admin') ? 'text-red-300' : 'text-gray-500'} truncate`}>
                {primaryRole}
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            className={`w-full ${hasRole('admin') ? 'border-red-600 text-red-300 hover:text-white hover:bg-red-800' : 'border-gray-300'}`}
            onClick={() => {
              setMobileMenuOpen(false);
              signOut();
            }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </>
  );

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    toast({
      title: "Welcome!",
      description: "Your profile setup is complete.",
    });
  };

  // Use enhanced navigation only for landing page when not authenticated
  const isLandingPage = location.pathname === '/landing';
  const useEnhancedNav = showNav && (isLandingPage && !profile);

  if (useEnhancedNav) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <EnhancedNavigation 
          variant={isLandingPage ? 'landing' : 'app'}
          showSearch={!isLandingPage}
          showBreadcrumbs={!isLandingPage}
        />
        <main>{children}</main>
        
        {/* Onboarding Modal */}
        <UserOnboarding
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={handleOnboardingComplete}
          userType={userType}
        />
        
        {/* Footer */}
        <footer className="bg-white/80 backdrop-blur-sm border-t py-8 mt-auto">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">FL</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">LandlordNoAgent</span>
                </div>
                <p className="text-gray-600">
                  Connecting landlords and renters seamlessly.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">For Renters</h4>
                <ul className="space-y-2">
                  <li><Link to="/properties" className="text-gray-600 hover:text-blue-600">Browse Properties</Link></li>
                  <li><Link to="/login" className="text-gray-600 hover:text-blue-600">Save Favorites</Link></li>
                  <li><Link to="/login" className="text-gray-600 hover:text-blue-600">Contact Landlords</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">For Landlords</h4>
                <ul className="space-y-2">
                  <li><Link to="/login" className="text-gray-600 hover:text-blue-600">List Property</Link></li>
                  <li><Link to="/login" className="text-gray-600 hover:text-blue-600">Manage Listings</Link></li>
                  <li><Link to="/login" className="text-gray-600 hover:text-blue-600">Track Analytics</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
                <ul className="space-y-2">
                  <li><Link to="#" className="text-gray-600 hover:text-blue-600">Help Center</Link></li>
                  <li><Link to="/contact" className="text-gray-600 hover:text-blue-600">Contact Us</Link></li>
                  <li><Link to="#" className="text-gray-600 hover:text-blue-600">Privacy Policy</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t mt-8 pt-8 text-center text-gray-600">
              <p>&copy; 2025 Gtext Holding. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Desktop Sidebar for authenticated users */}
      {showNav && profile ? (
        <aside className={`hidden lg:flex flex-col w-64 h-screen fixed top-0 left-0 z-20 ${sidebarConfig.bgColor} backdrop-blur-sm border-r ${sidebarConfig.borderColor} shadow-sm`}>
          <div className="flex items-center space-x-2 px-6 py-6 border-b">
            <div className={`w-8 h-8 bg-gradient-to-r ${sidebarConfig.logoColor} rounded-lg flex items-center justify-center`}>
              <span className="text-white font-bold text-sm">FL</span>
            </div>
            <div>
              <span className={`text-xl font-bold ${sidebarConfig.textColor}`}>LandlordNoAgent</span>
              <p className={`text-xs ${hasRole('admin') ? 'text-red-300' : 'text-gray-500'}`}>
                {sidebarConfig.title}
              </p>
            </div>
          </div>
          <nav className="flex-1 flex flex-col gap-2 px-4 py-6">
            {sidebarConfig.links.map((link) => (
              <Link key={link.to} to={link.to}>
                <Button
                  variant={link.active ? 'default' : 'ghost'}
                  className={`w-full justify-start mb-2 ${!link.active && hasRole('admin') ? 'text-gray-300 hover:text-white' : ''}`}
                >
                  <link.icon className="w-4 h-4 mr-2" />
                  {link.label}
                </Button>
              </Link>
            ))}
            
            {/* Role switching for multi-role users */}
            {(hasRole('admin') && hasRole('landlord')) && (
              <div className="mt-4 pt-4 border-t border-gray-600">
                <p className="text-xs text-gray-400 mb-2">Switch Role</p>
                <Link to="/landlord">
                  <Button variant="outline" size="sm" className="w-full mb-2 text-gray-300 border-gray-600">
                    <Building className="w-4 h-4 mr-2" />
                    Landlord Portal
                  </Button>
                </Link>
              </div>
            )}
            
            {(hasRole('admin') && hasRole('renter')) && (
              <div className="mt-4 pt-4 border-t border-gray-600">
                <Link to="/properties">
                  <Button variant="outline" size="sm" className="w-full mb-2 text-gray-300 border-gray-600">
                    <Home className="w-4 h-4 mr-2" />
                    Browse Properties
                  </Button>
                </Link>
              </div>
            )}
          </nav>
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 ${hasRole('admin') ? 'bg-red-100' : 'bg-blue-100'} rounded-full flex items-center justify-center`}>
                <User className={`w-4 h-4 ${hasRole('admin') ? 'text-red-600' : 'text-blue-600'}`} />
              </div>
              <div>
                <span className={`text-sm font-medium ${sidebarConfig.textColor}`}>
                  {profile.full_name}
                </span>
                <p className={`text-xs ${hasRole('admin') ? 'text-red-300' : 'text-gray-500'}`}>
                  {primaryRole}
                </p>
              </div>
            </div>
            
            {/* Action Icons for Landlords */}
            <div className="flex items-center space-x-1">
              {hasRole('landlord') && (
                <>
                  {/* Theme Settings */}
                  <Dialog open={themeDialogOpen} onOpenChange={setThemeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Palette className="w-4 h-4 text-gray-600" />
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
                            {[
                              { name: 'Blue', value: 'blue', colors: 'from-blue-500 to-indigo-600' },
                              { name: 'Green', value: 'green', colors: 'from-green-500 to-emerald-600' },
                              { name: 'Purple', value: 'purple', colors: 'from-purple-500 to-violet-600' },
                              { name: 'Orange', value: 'orange', colors: 'from-orange-500 to-amber-600' }
                            ].map((scheme) => (
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                        <Bell className="w-4 h-4 text-gray-600" />
                        {unreadCount > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs"
                          >
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                      <div className="flex items-center justify-between p-4 border-b">
                        <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                        <div className="flex gap-2">
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
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={clearTestNotifications}
                            className="text-xs h-6 px-2 text-red-600 hover:text-red-700"
                            title="Clear test notifications"
                          >
                            Clear Test
                          </Button>
                        </div>
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
                </>
              )}
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => signOut()}
                className={`h-8 w-8 ${hasRole('admin') ? 'border-red-600 text-red-300 hover:text-white' : ''}`}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </aside>
      ) : null}

      {/* Main Content Wrapper */}
      <div
        className={[
          'flex-1 min-h-screen flex flex-col',
          showNav && profile ? 'lg:ml-64' : ''
        ].join(' ')}
      >
        {/* Mobile Header */}
        {showNav && profile && <MobileHeader />}

        {/* Mobile Menu */}
        {showNav && profile && <MobileMenu />}

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Onboarding Modal */}
        <UserOnboarding
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={handleOnboardingComplete}
          userType={userType}
        />

        {/* Footer */}
        <footer className="bg-white/80 backdrop-blur-sm border-t py-8 mt-auto">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">FL</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">LandlordNoAgent</span>
                </div>
                <p className="text-gray-600">
                  Connecting landlords and renters seamlessly.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">For Renters</h4>
                <ul className="space-y-2">
                  <li><Link to="/properties" className="text-gray-600 hover:text-blue-600">Browse Properties</Link></li>
                  <li><Link to="/login" className="text-gray-600 hover:text-blue-600">Save Favorites</Link></li>
                  <li><Link to="/login" className="text-gray-600 hover:text-blue-600">Contact Landlords</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">For Landlords</h4>
                <ul className="space-y-2">
                  <li><Link to="/login" className="text-gray-600 hover:text-blue-600">List Property</Link></li>
                  <li><Link to="/login" className="text-gray-600 hover:text-blue-600">Manage Listings</Link></li>
                  <li><Link to="/login" className="text-gray-600 hover:text-blue-600">Track Analytics</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
                <ul className="space-y-2">
                  <li><Link to="#" className="text-gray-600 hover:text-blue-600">Help Center</Link></li>
                  <li><Link to="/contact" className="text-gray-600 hover:text-blue-600">Contact Us</Link></li>
                  <li><Link to="#" className="text-gray-600 hover:text-blue-600">Privacy Policy</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t mt-8 pt-8 text-center text-gray-600">
              <p>&copy; 2025 Gtext Holding. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
