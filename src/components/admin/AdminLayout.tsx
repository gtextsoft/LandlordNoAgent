import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Users,
  Home,
  Settings,
  BarChart3,
  Database,
  LogOut,
  Menu,
  X,
  Bell,
  Search
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isActive = (path: string) => location.pathname === path;

  const adminNavItems = [
    { to: "/admin", icon: Shield, label: "Dashboard", active: isActive('/admin') },
    { to: "/admin/users", icon: Users, label: "User Management", active: isActive('/admin/users') },
    { to: "/admin/properties", icon: Home, label: "Property Management", active: isActive('/admin/properties') },
    { to: "/admin/analytics", icon: BarChart3, label: "Analytics", active: isActive('/admin/analytics') },
    { to: "/admin/database", icon: Database, label: "Database", active: isActive('/admin/database') },
    { to: "/admin/settings", icon: Settings, label: "System Settings", active: isActive('/admin/settings') },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      navigate('/admin/login');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile Header */}
      <header className="lg:hidden bg-red-900 text-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold">Admin Portal</span>
              <p className="text-xs text-red-200">System Administration</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="text-white hover:bg-red-800"
          >
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-gray-800 border-r border-gray-700">
          {/* Logo */}
          <div className="flex items-center px-6 py-6 bg-red-900">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mr-3">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Portal</h1>
              <p className="text-xs text-red-200">System Administration</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {adminNavItems.map((item) => (
              <Link key={item.to} to={item.to}>
                <Button
                  variant={item.active ? 'default' : 'ghost'}
                  className={`w-full justify-start text-left mb-2 ${
                    item.active 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>

          {/* User Profile */}
          <div className="px-6 py-4 border-t border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {profile?.full_name || 'Admin'}
                </p>
                <p className="text-xs text-red-300 truncate">System Administrator</p>
              </div>
            </div>
            
            <Button
              variant="outline"
              className="w-full border-red-600 text-red-300 hover:text-white hover:bg-red-800"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed top-0 left-0 z-50 w-80 h-full bg-gray-800 border-r border-gray-700 transform transition-transform lg:hidden">
              {/* Mobile Logo */}
              <div className="flex items-center justify-between px-6 py-6 bg-red-900">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">Admin Portal</h1>
                    <p className="text-xs text-red-200">System Administration</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  className="text-white hover:bg-red-800"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2">
                {adminNavItems.map((item) => (
                  <Link key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}>
                    <Button
                      variant={item.active ? 'default' : 'ghost'}
                      className={`w-full justify-start text-left mb-2 ${
                        item.active 
                          ? 'bg-red-600 text-white hover:bg-red-700' 
                          : 'text-gray-300 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </nav>

              {/* Mobile User Profile */}
              <div className="px-6 py-4 border-t border-gray-700">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {profile?.full_name || 'Admin'}
                    </p>
                    <p className="text-xs text-red-300 truncate">System Administrator</p>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  className="w-full border-red-600 text-red-300 hover:text-white hover:bg-red-800"
                  onClick={() => {
                    setSidebarOpen(false);
                    handleSignOut();
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-72">
          <div className="min-h-screen bg-gray-50">
            {/* Top Bar */}
            <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 shadow-sm">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
                <p className="text-sm text-gray-600">Manage your platform from here</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </Button>
                <Button variant="ghost" size="icon">
                  <Search className="w-5 h-5 text-gray-600" />
                </Button>
              </div>
            </header>

            {/* Page Content */}
            <div className="p-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 