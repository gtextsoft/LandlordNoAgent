import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Menu, 
  X, 
  Home, 
  Building, 
  Heart, 
  MessageCircle, 
  User, 
  Bell, 
  LogOut,
  ChevronRight,
  ChevronDown,
  Settings,
  Plus,
  MapPin,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EnhancedNavigationProps {
  variant?: 'landing' | 'app' | 'minimal';
  showSearch?: boolean;
  showBreadcrumbs?: boolean;
}

const EnhancedNavigation = ({ 
  variant = 'app', 
  showSearch = true, 
  showBreadcrumbs = true 
}: EnhancedNavigationProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);
  
  const { profile, signOut, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Generate breadcrumbs from current path
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter(x => x);
    const breadcrumbs = [
      { name: 'Home', href: '/', icon: Home }
    ];

    let currentPath = '';
    pathnames.forEach((name, index) => {
      currentPath += `/${name}`;
      
      // Map route names to user-friendly labels
      const routeLabels: Record<string, string> = {
        'properties': 'Properties',
        'property': 'Property Details',
        'landlord': 'Dashboard',
        'saved-properties': 'Saved Properties',
        'messages': 'Messages',
        'account': 'Account Settings',
        'contact': 'Contact',
        'login': 'Sign In'
      };

      breadcrumbs.push({
        name: routeLabels[name] || name.charAt(0).toUpperCase() + name.slice(1),
        href: currentPath,
        icon: name === 'properties' ? Building : undefined
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  const isActive = (path: string) => location.pathname === path;

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/properties?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const navigationItems = [
    { name: 'Browse', href: '/properties', icon: Building, active: isActive('/properties') },
    ...(profile ? [
      { name: 'Saved', href: '/saved-properties', icon: Heart, active: isActive('/saved-properties') },
      ...(!hasRole('landlord') ? [
        { name: 'Applications', href: '/my-applications', icon: User, active: isActive('/my-applications') }
      ] : []),
      { name: 'Messages', href: '/messages', icon: MessageCircle, active: isActive('/messages'), badge: 2 },
      ...(hasRole('landlord') ? [
        { name: 'Dashboard', href: '/landlord', icon: Home, active: isActive('/landlord') },
        { name: 'Analytics', href: '/analytics', icon: BarChart3, active: isActive('/analytics') }
      ] : [])
    ] : []),
    { name: 'Contact', href: '/contact', icon: MapPin, active: isActive('/contact') }
  ];

  // Landing page variant
  if (variant === 'landing') {
    return (
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-xl font-bold text-gray-900 flex items-center">
              <Home className="w-6 h-6 mr-2 text-blue-600" />
              LandlordNoAgent
            </Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Home
              </Link>
              <Link to="/properties" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Browse
              </Link>
              <Link to="/contact" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Contact
              </Link>
            </nav>
            
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" className="text-gray-600 font-medium">
                  Sign In
                </Button>
              </Link>
              <Link to="/login">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Main app navigation
  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-900 flex items-center">
              <Home className="w-6 h-6 mr-2 text-blue-600" />
              <span className="hidden sm:block">LandlordNoAgent</span>
              <span className="sm:hidden">LNA</span>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search properties, locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 pr-4 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2 rounded-lg font-medium transition-all duration-200 relative ${
                  item.active 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.name}
                {item.badge && (
                  <Badge className="ml-2 px-2 py-0 text-xs bg-red-500 text-white">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>

          {/* User Menu & Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            {profile && (
              <Button variant="ghost" size="sm" className="relative p-2">
                <Bell className="w-5 h-5 text-gray-600" />
                {notificationCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 px-1 py-0 text-xs bg-red-500 text-white min-w-[20px] h-5 flex items-center justify-center rounded-full">
                    {notificationCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* Add Property (Landlords) */}
            {hasRole('landlord') && (
              <Link to="/landlord/new">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Add Property</span>
                </Button>
              </Link>
            )}

            {/* User Dropdown */}
            {profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                      {profile.full_name?.charAt(0) || 'U'}
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{profile.full_name}</span>
                      <span className="text-xs text-gray-500">{profile.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/account" className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/saved-properties" className="flex items-center">
                      <Heart className="w-4 h-4 mr-2" />
                      Saved Properties
                    </Link>
                  </DropdownMenuItem>
                  {hasRole('landlord') && (
                    <DropdownMenuItem asChild>
                      <Link to="/landlord" className="flex items-center">
                        <Home className="w-4 h-4 mr-2" />
                        Landlord Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/login">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Breadcrumbs */}
        {showBreadcrumbs && breadcrumbs.length > 1 && (
          <div className="py-2 border-t border-gray-100">
            <nav className="flex items-center space-x-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center">
                  {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />}
                  <Link
                    to={crumb.href}
                    className={`flex items-center hover:text-blue-600 transition-colors ${
                      index === breadcrumbs.length - 1 
                        ? 'text-gray-900 font-medium' 
                        : 'text-gray-500'
                    }`}
                  >
                    {crumb.icon && <crumb.icon className="w-4 h-4 mr-1" />}
                    {crumb.name}
                  </Link>
                </div>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-6 space-y-4">
            {/* Mobile Search */}
            {showSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            )}

            {/* Mobile Navigation Items */}
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-colors ${
                    item.active 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </div>
                  {item.badge && (
                    <Badge className="px-2 py-0 text-xs bg-red-500 text-white">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              ))}
            </nav>

            {/* Mobile User Actions */}
            {profile && (
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <Link
                  to="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <Settings className="w-5 h-5 mr-3" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default EnhancedNavigation; 