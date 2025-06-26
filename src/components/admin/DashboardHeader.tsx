import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Download, 
  RefreshCw, 
  Settings, 
  Shield,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface DashboardHeaderProps {
  onRefresh?: () => void;
  onExport?: () => void;
  pendingCount?: number;
  systemHealth?: number;
  activeUsers?: number;
  totalUsers?: number;
}

const DashboardHeader = ({ 
  onRefresh, 
  onExport, 
  pendingCount = 0,
  systemHealth = 95,
  activeUsers = 0,
  totalUsers = 0
}: DashboardHeaderProps) => {
  const { profile } = useAuth();

  return (
    <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-lg mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Control Center</h1>
            <p className="text-red-100 mt-1">
              Welcome back, {profile?.full_name || 'Administrator'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {pendingCount > 0 && (
            <div className="flex items-center bg-red-500/20 backdrop-blur-sm rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">
                {pendingCount} items need attention
              </span>
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={onRefresh}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={onExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Bell className="w-4 h-4 mr-2" />
            Alerts
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2 bg-red-500">
                {pendingCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>
      
      {/* Quick Stats Bar */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="text-red-100 text-sm font-medium">System Health</div>
          <div className="text-2xl font-bold mt-1 flex items-center">
            {systemHealth}%
            <div className={`ml-2 w-2 h-2 rounded-full ${
              systemHealth >= 95 ? 'bg-green-400' : 
              systemHealth >= 80 ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="text-red-100 text-sm font-medium">Active Users</div>
          <div className="text-lg font-bold mt-1">
            {activeUsers.toLocaleString()} / {totalUsers.toLocaleString()}
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="text-red-100 text-sm font-medium">User Engagement</div>
          <div className="text-lg font-bold mt-1">
            {totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}%
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="text-red-100 text-sm font-medium">Platform Status</div>
          <div className="text-lg font-bold mt-1">
            {pendingCount === 0 ? 'All Clear' : `${pendingCount} Pending`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader; 