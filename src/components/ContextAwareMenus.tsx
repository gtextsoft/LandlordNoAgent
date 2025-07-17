import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Heart, 
  Share2, 
  MessageCircle, 
  Calendar, 
  Phone, 
  Flag, 
  Edit, 
  Eye, 
  Copy, 
  Download,
  Trash2,
  MapPin,
  Star,
  BookmarkPlus,
  ExternalLink,
  Settings,
  User,
  Building,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Home,
  Compass,
  Clock,
  TrendingUp,
  ChevronRight,
  Plus,
  Mail,
  Bell,
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Property Context Menu
export const PropertyContextMenu = ({ 
  property, 
  onSave, 
  onUnsave, 
  onShare, 
  onContact, 
  onScheduleTour, 
  onReport,
  isSaved = false,
  userType = 'renter'
}: {
  property: any;
  onSave?: (id: string) => void;
  onUnsave?: (id: string) => void;
  onShare?: (id: string) => void;
  onContact?: (id: string) => void;
  onScheduleTour?: (id: string) => void;
  onReport?: (id: string) => void;
  isSaved?: boolean;
  userType?: 'renter' | 'landlord';
}) => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  // Generate context-aware menu items based on user type and property state
  const menuItems = useMemo(() => {
    const items = [];

    if (userType === 'renter' || !hasRole('landlord')) {
      // Renter menu items
      items.push(
        {
          label: isSaved ? 'Remove from Saved' : 'Save Property',
          icon: Heart,
          action: () => isSaved ? onUnsave?.(property.id) : onSave?.(property.id),
          className: isSaved ? 'text-red-600' : 'text-blue-600'
        },
        {
          label: 'Contact Owner',
          icon: MessageCircle,
          action: () => onContact?.(property.id),
          className: 'text-green-600'
        },
        {
          label: 'Schedule Tour',
          icon: Calendar,
          action: () => onScheduleTour?.(property.id),
          className: 'text-purple-600'
        },
        {
          label: 'Call Owner',
          icon: Phone,
          action: () => window.open(`tel:${property.landlord?.phone}`),
        }
      );
    } else {
      // Landlord menu items (for their own properties)
      items.push(
        {
          label: 'Edit Property',
          icon: Edit,
          action: () => navigate(`/landlord/properties/${property.id}/edit`),
          className: 'text-blue-600'
        },
        {
          label: 'View Analytics',
          icon: TrendingUp,
          action: () => navigate(`/landlord/properties/${property.id}/analytics`),
        },
        {
          label: 'Manage Inquiries',
          icon: MessageCircle,
          action: () => navigate(`/landlord/properties/${property.id}/inquiries`),
        }
      );
    }

    // Common items for all users
    items.push(
      { type: 'separator' },
      {
        label: 'Share Property',
        icon: Share2,
        action: () => onShare?.(property.id),
        submenu: [
          {
            label: 'Copy Link',
            icon: Copy,
            action: () => navigator.clipboard.writeText(window.location.href)
          },
          {
            label: 'Share via Email',
            icon: Mail,
            action: () => window.open(`mailto:?subject=${property.title}&body=Check out this property: ${window.location.href}`)
          },
          {
            label: 'Download PDF',
            icon: Download,
            action: () => console.log('Download PDF')
          }
        ]
      },
      {
        label: 'Similar Properties',
        icon: Search,
        action: () => navigate(`/properties?similar=${property.id}`),
      },
      { type: 'separator' },
      {
        label: 'Report Property',
        icon: Flag,
        action: () => onReport?.(property.id),
        className: 'text-red-600'
      }
    );

    return items;
  }, [property, isSaved, userType, hasRole, onSave, onUnsave, onContact, onScheduleTour, onShare, onReport]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Property Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {menuItems.map((item, index) => {
          if (item.type === 'separator') {
            return <DropdownMenuSeparator key={index} />;
          }

          if (item.submenu) {
            return (
              <DropdownMenuSub key={index}>
                <DropdownMenuSubTrigger>
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {item.submenu.map((subItem: any, subIndex: number) => (
                    <DropdownMenuItem key={subIndex} onClick={subItem.action}>
                      <subItem.icon className="mr-2 h-4 w-4" />
                      <span>{subItem.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            );
          }

          return (
            <DropdownMenuItem
              key={index}
              onClick={item.action}
              className={item.className}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Search Context Menu (appears when searching)
export const SearchContextMenu = ({ 
  searchQuery, 
  onSaveSearch, 
  onClearSearch, 
  onRefineSearch,
  searchHistory = [],
  popularSearches = []
}: {
  searchQuery: string;
  onSaveSearch?: (query: string) => void;
  onClearSearch?: () => void;
  onRefineSearch?: (query: string) => void;
  searchHistory?: string[];
  popularSearches?: string[];
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Search Options
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Search Tools</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {searchQuery && (
          <>
            <DropdownMenuItem onClick={() => onSaveSearch?.(searchQuery)}>
              <BookmarkPlus className="mr-2 h-4 w-4" />
              Save This Search
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRefineSearch?.(searchQuery)}>
              <Settings className="mr-2 h-4 w-4" />
              Refine Search
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onClearSearch}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Search
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {searchHistory.length > 0 && (
          <>
            <DropdownMenuLabel>Recent Searches</DropdownMenuLabel>
            {searchHistory.slice(0, 3).map((query, index) => (
              <DropdownMenuItem key={index} onClick={() => onRefineSearch?.(query)}>
                <Clock className="mr-2 h-4 w-4" />
                {query}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {popularSearches.length > 0 && (
          <>
            <DropdownMenuLabel>Popular Searches</DropdownMenuLabel>
            {popularSearches.slice(0, 3).map((query, index) => (
              <DropdownMenuItem key={index} onClick={() => onRefineSearch?.(query)}>
                <TrendingUp className="mr-2 h-4 w-4" />
                {query}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Sort and Filter Menu
export const SortFilterMenu = ({ 
  currentSort, 
  currentFilters, 
  onSortChange, 
  onFilterChange,
  availableFilters
}: {
  currentSort: string;
  currentFilters: Record<string, any>;
  onSortChange: (sort: string) => void;
  onFilterChange: (filters: Record<string, any>) => void;
  availableFilters: any[];
}) => {
  const sortOptions = [
    { value: 'price_asc', label: 'Price: Low to High', icon: ArrowUp },
    { value: 'price_desc', label: 'Price: High to Low', icon: ArrowDown },
    { value: 'date_desc', label: 'Newest First', icon: Clock },
    { value: 'popular', label: 'Most Popular', icon: Star },
    { value: 'location', label: 'Location', icon: MapPin }
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowUpDown className="h-4 w-4 mr-2" />
          Sort & Filter
          {Object.keys(currentFilters).length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {Object.keys(currentFilters).length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Sort By</DropdownMenuLabel>
        {sortOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onSortChange(option.value)}
            className={currentSort === option.value ? 'bg-blue-50' : ''}
          >
            <option.icon className="mr-2 h-4 w-4" />
            {option.label}
            {currentSort === option.value && (
              <CheckCircle className="ml-auto h-4 w-4 text-blue-600" />
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Quick Filters</DropdownMenuLabel>
        
        {availableFilters.map((filter) => (
          <DropdownMenuItem
            key={filter.key}
            onClick={() => onFilterChange({ ...currentFilters, [filter.key]: !currentFilters[filter.key] })}
          >
            <filter.icon className="mr-2 h-4 w-4" />
            {filter.label}
            {currentFilters[filter.key] && (
              <CheckCircle className="ml-auto h-4 w-4 text-blue-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Location-aware Quick Actions
export const LocationQuickActions = ({ userLocation, nearbyPlaces }: { userLocation?: string; nearbyPlaces?: any[] }) => {
  const navigate = useNavigate();

  const quickActions = useMemo(() => {
    const actions = [
      {
        label: 'Properties Near Me',
        icon: Compass,
        action: () => navigate(`/properties?location=${userLocation}&radius=5km`),
        available: !!userLocation
      },
      {
        label: 'Popular Areas',
        icon: TrendingUp,
        action: () => navigate('/properties?popular=true'),
        available: true
      },
      {
        label: 'New Listings',
        icon: Clock,
        action: () => navigate('/properties?new=true'),
        available: true
      },
      {
        label: 'Price Reduced',
        icon: ArrowDown,
        action: () => navigate('/properties?price_reduced=true'),
        available: true
      }
    ];

    return actions.filter(action => action.available);
  }, [userLocation, navigate]);

  return (
    <Card className="p-4">
      <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
      <div className="space-y-2">
        {quickActions.map((action, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={action.action}
          >
            <action.icon className="w-4 h-4 mr-2" />
            {action.label}
          </Button>
        ))}
      </div>
      
      {nearbyPlaces && nearbyPlaces.length > 0 && (
        <>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Nearby Areas</h4>
            <div className="space-y-1">
              {nearbyPlaces.slice(0, 3).map((place, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => navigate(`/properties?location=${place.name}`)}
                >
                  <MapPin className="w-3 h-3 mr-2" />
                  {place.name}
                  <span className="ml-auto text-gray-400">{place.distance}</span>
                </Button>
              ))}
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

// User State Aware Menu
export const UserStateMenu = () => {
  const { profile, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState([
    { id: '1', type: 'message', title: 'New message from John', read: false },
    { id: '2', type: 'tour', title: 'Tour reminder for tomorrow', read: false },
    { id: '3', type: 'price', title: 'Price drop on saved property', read: true }
  ]);

  const contextualItems = useMemo(() => {
    const items = [];
    const currentPath = location.pathname;

    // Add contextual items based on current page
    if (currentPath === '/properties') {
      items.push({
        label: 'Save Search',
        icon: BookmarkPlus,
        action: () => console.log('Save search'),
        badge: 'New'
      });
    }

    if (currentPath.includes('/property/')) {
      items.push({
        label: 'Similar Properties',
        icon: Search,
        action: () => navigate('/properties?similar=true')
      });
    }

    if (hasRole('landlord')) {
      items.push({
        label: 'Add Property',
        icon: Plus,
        action: () => navigate('/landlord/new'),
        highlight: true
      });
      
      items.push({
        label: 'Analytics',
        icon: BarChart3,
        action: () => navigate('/analytics'),
        highlight: false
      });
    }

    return items;
  }, [location.pathname, hasRole, navigate]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex items-center space-x-2">
      {/* Contextual Actions */}
      {contextualItems.map((item, index) => (
        <Button
          key={index}
          variant={item.highlight ? 'default' : 'ghost'}
          size="sm"
          onClick={item.action}
          className={item.highlight ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          <item.icon className="w-4 h-4 mr-2" />
          {item.label}
          {item.badge && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {item.badge}
            </Badge>
          )}
        </Button>
      ))}

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 px-1 py-0 text-xs bg-red-500 text-white min-w-[16px] h-4 flex items-center justify-center rounded-full">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="p-3">
                  <div className="flex items-start space-x-3 w-full">
                    <div className={`p-1 rounded-full ${
                      notification.type === 'message' ? 'bg-blue-100' :
                      notification.type === 'tour' ? 'bg-green-100' : 'bg-yellow-100'
                    }`}>
                      {notification.type === 'message' ? (
                        <MessageCircle className="w-4 h-4 text-blue-600" />
                      ) : notification.type === 'tour' ? (
                        <Calendar className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-1" />
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <span className="text-center w-full">View All Notifications</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// Smart Suggestion Menu (appears based on user behavior)
export const SmartSuggestionMenu = ({ 
  suggestions, 
  onAcceptSuggestion, 
  onDismissSuggestion 
}: {
  suggestions: Array<{
    id: string;
    type: 'search' | 'property' | 'location' | 'price';
    title: string;
    description: string;
    action: () => void;
  }>;
  onAcceptSuggestion: (id: string) => void;
  onDismissSuggestion: (id: string) => void;
}) => {
  if (suggestions.length === 0) return null;

  return (
    <Card className="p-4 bg-blue-50 border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-blue-900 flex items-center">
          <Star className="w-4 h-4 mr-2" />
          Smart Suggestions
        </h3>
      </div>
      
      <div className="space-y-3">
        {suggestions.slice(0, 2).map((suggestion) => (
          <div key={suggestion.id} className="bg-white rounded-lg p-3 border border-blue-200">
            <h4 className="font-medium text-gray-900 text-sm mb-1">
              {suggestion.title}
            </h4>
            <p className="text-xs text-gray-600 mb-2">
              {suggestion.description}
            </p>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                className="text-xs h-7"
                onClick={() => {
                  suggestion.action();
                  onAcceptSuggestion(suggestion.id);
                }}
              >
                Try It
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-xs h-7"
                onClick={() => onDismissSuggestion(suggestion.id)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

 