import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { 
  Home, 
  Search, 
  Heart, 
  MessageCircle, 
  User, 
  Building, 
  Plus,
  Menu,
  X,
  Bell,
  Settings
} from "lucide-react";
import { motion } from "framer-motion";

interface MobileNavigationProps {
  unreadCount?: number;
}

const MobileNavigation = ({ unreadCount = 0 }: MobileNavigationProps) => {
  const { profile, hasRole } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Bottom navigation items based on user role
  const getBottomNavItems = () => {
    if (!profile) {
      return [
        { path: "/landing", icon: Home, label: "Home" },
        { path: "/properties", icon: Search, label: "Search" },
        { path: "/contact", icon: MessageCircle, label: "Contact" },
        { path: "/login", icon: User, label: "Login" },
      ];
    }

    if (hasRole('landlord')) {
      return [
        { path: "/landlord", icon: Home, label: "Dashboard" },
        { path: "/landlord/properties", icon: Building, label: "Properties" },
        { path: "/landlord/new", icon: Plus, label: "Add" },
        { path: "/messages", icon: MessageCircle, label: "Messages", badge: unreadCount },
      ];
    }

    return [
      { path: "/properties", icon: Search, label: "Search" },
      { path: "/saved-properties", icon: Heart, label: "Saved" },
      { path: "/messages", icon: MessageCircle, label: "Messages", badge: unreadCount },
      { path: "/account", icon: User, label: "Account" },
    ];
  };

  const bottomNavItems = getBottomNavItems();

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to={profile ? (hasRole('landlord') ? '/landlord' : '/properties') : '/landing'} 
                className="text-xl font-bold text-gray-900">
            LandlordNoAgent
          </Link>
          
          <div className="flex items-center space-x-2">
            {profile && (
              <Button variant="ghost" size="sm" className="relative p-2">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 min-w-[18px] h-5 text-xs bg-red-500 border-2 border-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            )}
            
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Menu</h2>
                      <SheetClose asChild>
                        <Button variant="ghost" size="sm" className="p-2">
                          <X className="w-5 h-5" />
                        </Button>
                      </SheetClose>
                    </div>
                    {profile && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-900">
                          {profile.full_name || profile.email}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {hasRole('landlord') ? 'Landlord' : 'Renter'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Menu Items */}
                  <div className="flex-1 py-4">
                    {profile ? (
                      // Authenticated menu
                      <>
                        {hasRole('landlord') ? (
                          <>
                            <Link
                              to="/landlord"
                              className={`flex items-center px-4 py-3 text-sm font-medium hover:bg-gray-50 ${
                                isActive('/landlord') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                              }`}
                              onClick={() => setIsOpen(false)}
                            >
                              <Home className="w-5 h-5 mr-3" />
                              Dashboard
                            </Link>
                            <Link
                              to="/landlord/properties"
                              className={`flex items-center px-4 py-3 text-sm font-medium hover:bg-gray-50 ${
                                isActive('/landlord/properties') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                              }`}
                              onClick={() => setIsOpen(false)}
                            >
                              <Building className="w-5 h-5 mr-3" />
                              My Properties
                            </Link>
                            <Link
                              to="/landlord/new"
                              className={`flex items-center px-4 py-3 text-sm font-medium hover:bg-gray-50 ${
                                isActive('/landlord/new') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                              }`}
                              onClick={() => setIsOpen(false)}
                            >
                              <Plus className="w-5 h-5 mr-3" />
                              Add Property
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link
                              to="/properties"
                              className={`flex items-center px-4 py-3 text-sm font-medium hover:bg-gray-50 ${
                                isActive('/properties') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                              }`}
                              onClick={() => setIsOpen(false)}
                            >
                              <Search className="w-5 h-5 mr-3" />
                              Browse Properties
                            </Link>
                            <Link
                              to="/saved-properties"
                              className={`flex items-center px-4 py-3 text-sm font-medium hover:bg-gray-50 ${
                                isActive('/saved-properties') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                              }`}
                              onClick={() => setIsOpen(false)}
                            >
                              <Heart className="w-5 h-5 mr-3" />
                              Saved Properties
                            </Link>
                          </>
                        )}
                        <Link
                          to="/messages"
                          className={`flex items-center px-4 py-3 text-sm font-medium hover:bg-gray-50 relative ${
                            isActive('/messages') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                          <MessageCircle className="w-5 h-5 mr-3" />
                          Messages
                          {unreadCount > 0 && (
                            <Badge className="ml-auto bg-red-500 text-white text-xs">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </Badge>
                          )}
                        </Link>
                        <Link
                          to="/account"
                          className={`flex items-center px-4 py-3 text-sm font-medium hover:bg-gray-50 ${
                            isActive('/account') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                          <Settings className="w-5 h-5 mr-3" />
                          Account Settings
                        </Link>
                      </>
                    ) : (
                      // Public menu
                      <>
                        <Link
                          to="/landing"
                          className={`flex items-center px-4 py-3 text-sm font-medium hover:bg-gray-50 ${
                            isActive('/landing') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                          <Home className="w-5 h-5 mr-3" />
                          Home
                        </Link>
                        <Link
                          to="/properties"
                          className={`flex items-center px-4 py-3 text-sm font-medium hover:bg-gray-50 ${
                            isActive('/properties') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                          <Search className="w-5 h-5 mr-3" />
                          Browse Properties
                        </Link>
                        <Link
                          to="/contact"
                          className={`flex items-center px-4 py-3 text-sm font-medium hover:bg-gray-50 ${
                            isActive('/contact') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                          <MessageCircle className="w-5 h-5 mr-3" />
                          Contact Us
                        </Link>
                        <Link
                          to="/login"
                          className={`flex items-center px-4 py-3 text-sm font-medium hover:bg-gray-50 ${
                            isActive('/login') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                          <User className="w-5 h-5 mr-3" />
                          Sign In
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <motion.div 
          className="bg-white border-t border-gray-200 px-2 py-1 safe-area-pb"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="flex items-center justify-around">
            {bottomNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center px-3 py-2 rounded-lg transition-colors relative min-w-0 flex-1 ${
                  isActive(item.path) 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5" />
                  {item.badge && item.badge > 0 && (
                    <Badge className="absolute -top-2 -right-2 min-w-[16px] h-4 text-xs bg-red-500 border-2 border-white p-0">
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs mt-1 font-medium truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom padding for fixed navigation */}
      <div className="md:hidden h-16" />
    </>
  );
};

export default MobileNavigation; 