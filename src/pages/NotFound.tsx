import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Home, ArrowLeft, Building, Shield } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { profile, hasRole } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // Determine the appropriate home route based on user role
  const getHomeRoute = () => {
    if (!profile) return "/";
    
    if (hasRole('admin')) return "/admin";
    if (hasRole('landlord')) return "/landlord";
    return "/properties"; // Default for renters or other roles
  };

  const getHomeLabel = () => {
    if (!profile) return "Go to Home";
    
    if (hasRole('admin')) return "Return to Admin Panel";
    if (hasRole('landlord')) return "Return to Dashboard";
    return "Browse Properties";
  };

  const getHomeIcon = () => {
    if (!profile) return Home;
    
    if (hasRole('admin')) return Shield;
    if (hasRole('landlord')) return Building;
    return Home;
  };

  const HomeIcon = getHomeIcon();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl font-bold text-white">404</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-xl text-gray-600 mb-6">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          <Link to={getHomeRoute()}>
            <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <HomeIcon className="w-4 h-4 mr-2" />
              {getHomeLabel()}
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>

        {profile && (
          <div className="mt-8 p-4 bg-white/50 rounded-lg border">
            <p className="text-sm text-gray-600">
              Logged in as: <span className="font-medium">{profile.full_name}</span>
            </p>
            <p className="text-xs text-gray-500">
              Role: {hasRole('admin') ? 'Administrator' : hasRole('landlord') ? 'Landlord' : 'Renter'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotFound;
