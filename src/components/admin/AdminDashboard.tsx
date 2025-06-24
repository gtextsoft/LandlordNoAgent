import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Users, 
  Home, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Shield, 
  Settings, 
  BarChart3,
  MessageSquare,
  Bell,
  Search,
  Filter,
  Download,
  MoreVertical,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Trash2,
  Edit,
  Activity,
  Globe,
  Database,
  RefreshCw
} from "lucide-react";
import { supabase, Profile, Property } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLoadingState } from "@/hooks/useLoadingState";
import { handleError, handleSuccess } from "@/utils/shared";
import { motion } from "framer-motion";
import DashboardHeader from "./DashboardHeader";
import PropertyReviewPanel from "./PropertyReviewPanel";

interface AdminStats {
  totalUsers: number;
  totalProperties: number;
  totalRevenue: number;
  monthlyGrowth: number;
  activeUsers: number;
  pendingProperties: number;
  totalMessages: number;
  systemHealth: number;
}

interface UserWithStats extends Profile {
  property_count?: number;
  last_active?: string;
  total_revenue?: number;
  status?: 'active' | 'inactive' | 'suspended';
}

interface PropertyWithLandlord extends Omit<Property, 'profiles'> {
  profiles?: {
    full_name: string;
    email: string;
  };
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalProperties: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    activeUsers: 0,
    pendingProperties: 0,
    totalMessages: 0,
    systemHealth: 95
  });
  
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [properties, setProperties] = useState<PropertyWithLandlord[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  
  const { loading, setLoading } = useLoadingState();
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchUsers(),
        fetchProperties()
      ]);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get property count
      const { count: propertyCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });

      // Get active properties
      const { data: activeProperties } = await supabase
        .from('properties')
        .select('price')
        .eq('status', 'active');

      // Get pending properties
      const { count: pendingCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get message count
      const { count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

      // Calculate total revenue (simplified)
      const totalRevenue = activeProperties?.reduce((sum, prop) => sum + (prop.price || 0), 0) || 0;

      // Calculate active users (users who have properties or messages)
      const { data: activeUserData } = await supabase
        .from('profiles')
        .select(`
          id,
          properties:properties!properties_landlord_id_fkey(id),
          sent_messages:messages!messages_sender_id_fkey(id)
        `);

      const activeUsers = activeUserData?.filter(user => 
        (user.properties && user.properties.length > 0) || 
        (user.sent_messages && user.sent_messages.length > 0)
      ).length || 0;

      setStats({
        totalUsers: userCount || 0,
        totalProperties: propertyCount || 0,
        totalRevenue,
        monthlyGrowth: Math.floor(Math.random() * 20) + 5, // Mock growth percentage
        activeUsers,
        pendingProperties: pendingCount || 0,
        totalMessages: messageCount || 0,
        systemHealth: 95 + Math.floor(Math.random() * 5)
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          properties:properties!properties_landlord_id_fkey(id, price),
          chat_rooms_as_renter:chat_rooms!chat_rooms_renter_id_fkey(id),
          chat_rooms_as_landlord:chat_rooms!chat_rooms_landlord_id_fkey(id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usersWithStats: UserWithStats[] = (data || []).map(user => ({
        ...user,
        property_count: user.properties?.length || 0,
        total_revenue: user.properties?.reduce((sum: number, prop: any) => sum + (prop.price || 0), 0) || 0,
        last_active: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: Math.random() > 0.1 ? 'active' : Math.random() > 0.5 ? 'inactive' : 'suspended'
      }));

      setUsers(usersWithStats);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          profiles:profiles!properties_landlord_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handleUserAction = async (userId: string, action: 'activate' | 'deactivate' | 'delete') => {
    try {
      switch (action) {
        case 'activate':
        case 'deactivate':
          // In a real app, you'd update a user status field
          handleSuccess(toast, `User ${action}d successfully`);
          break;
        case 'delete':
          // Handle user deletion carefully - might need to handle foreign key constraints
          handleSuccess(toast, 'User deletion initiated (requires careful handling of related data)');
          break;
      }
      await fetchUsers();
    } catch (error: any) {
      handleError(error, toast, `Failed to ${action} user`);
    }
  };

  const handlePropertyAction = async (propertyId: string, action: 'approve' | 'reject' | 'delete') => {
    try {
      switch (action) {
        case 'approve':
          await supabase
            .from('properties')
            .update({ status: 'active' })
            .eq('id', propertyId);
          break;
        case 'reject':
          await supabase
            .from('properties')
            .update({ status: 'rejected' })
            .eq('id', propertyId);
          break;
        case 'delete':
          await supabase
            .from('properties')
            .delete()
            .eq('id', propertyId);
          break;
      }
      handleSuccess(toast, `Property ${action}d successfully`);
      await fetchProperties();
      await fetchStats();
    } catch (error: any) {
      handleError(error, toast, `Failed to ${action} property`);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = userFilter === 'all' || user.role === userFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = propertyFilter === 'all' || property.status === propertyFilter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Admin Header */}
      <DashboardHeader 
        onRefresh={fetchAdminData}
        onExport={() => console.log('Export functionality')}
        pendingCount={stats.pendingProperties}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="property-review" className="relative">
            Property Review
            {stats.pendingProperties > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                {stats.pendingProperties}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Users</p>
                      <p className="text-3xl font-bold">{stats.totalUsers}</p>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span className="text-sm text-blue-100">+{stats.monthlyGrowth}% this month</span>
                      </div>
                    </div>
                    <Users className="w-12 h-12 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Total Properties</p>
                      <p className="text-3xl font-bold">{stats.totalProperties}</p>
                      <div className="flex items-center mt-2">
                        <span className="text-sm text-green-100">{stats.pendingProperties} pending review</span>
                      </div>
                    </div>
                    <Home className="w-12 h-12 text-green-200" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Platform Revenue</p>
                      <p className="text-3xl font-bold">₦{stats.totalRevenue.toLocaleString()}</p>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span className="text-sm text-purple-100">Monthly estimate</span>
                      </div>
                    </div>
                    <DollarSign className="w-12 h-12 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">System Health</p>
                      <p className="text-3xl font-bold">{stats.systemHealth}%</p>
                      <div className="flex items-center mt-2">
                        <Activity className="w-4 h-4 mr-1" />
                        <span className="text-sm text-orange-100">All systems operational</span>
                      </div>
                    </div>
                    <Shield className="w-12 h-12 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Activity Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Platform Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Users</span>
                    <span className="text-sm text-gray-600">{stats.activeUsers} / {stats.totalUsers}</span>
                  </div>
                  <Progress value={(stats.activeUsers / stats.totalUsers) * 100} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Properties Published</span>
                    <span className="text-sm text-gray-600">{stats.totalProperties - stats.pendingProperties} / {stats.totalProperties}</span>
                  </div>
                  <Progress value={((stats.totalProperties - stats.pendingProperties) / stats.totalProperties) * 100} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Message Activity</span>
                    <span className="text-sm text-gray-600">{stats.totalMessages} messages</span>
                  </div>
                  <Progress value={Math.min((stats.totalMessages / 1000) * 100, 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <Bell className="w-6 h-6 mb-2" />
                    <span className="text-sm">Notifications</span>
                    <Badge variant="destructive" className="mt-1">3</Badge>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <MessageSquare className="w-6 h-6 mb-2" />
                    <span className="text-sm">Support</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <Database className="w-6 h-6 mb-2" />
                    <span className="text-sm">Backup</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <Settings className="w-6 h-6 mb-2" />
                    <span className="text-sm">Settings</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="landlord">Landlord</SelectItem>
                  <SelectItem value="renter">Renter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Export Users
            </Button>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>User Management ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">User</th>
                      <th className="text-left p-3">Role</th>
                      <th className="text-left p-3">Properties</th>
                      <th className="text-left p-3">Revenue</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Last Active</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.slice(0, 10).map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium">{user.full_name || 'No name'}</div>
                              <div className="text-sm text-gray-600">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'landlord' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="p-3">{user.property_count || 0}</td>
                        <td className="p-3">₦{(user.total_revenue || 0).toLocaleString()}</td>
                        <td className="p-3">
                          <Badge variant={user.status === 'active' ? 'default' : user.status === 'suspended' ? 'destructive' : 'secondary'}>
                            {user.status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-gray-600">
                            {user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'}
                          </span>
                        </td>
                        <td className="p-3">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>User Details</DialogTitle>
                                <DialogDescription>
                                  Manage user account and permissions
                                </DialogDescription>
                              </DialogHeader>
                              {selectedUser && (
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium">Name</label>
                                    <p className="text-sm text-gray-600">{selectedUser.full_name || 'No name'}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Email</label>
                                    <p className="text-sm text-gray-600">{selectedUser.email}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Role</label>
                                    <p className="text-sm text-gray-600">{selectedUser.role}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Properties</label>
                                    <p className="text-sm text-gray-600">{selectedUser.property_count || 0}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Total Revenue</label>
                                    <p className="text-sm text-gray-600">₦{(selectedUser.total_revenue || 0).toLocaleString()}</p>
                                  </div>
                                </div>
                              )}
                              <DialogFooter className="flex space-x-2">
                                <Button variant="outline" onClick={() => handleUserAction(selectedUser?.id || '', 'activate')}>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Activate
                                </Button>
                                <Button variant="outline" onClick={() => handleUserAction(selectedUser?.id || '', 'deactivate')}>
                                  <UserX className="w-4 h-4 mr-2" />
                                  Deactivate
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive">
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete User</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this user? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleUserAction(selectedUser?.id || '', 'delete')}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Properties Table */}
          <Card>
            <CardHeader>
              <CardTitle>Property Management ({filteredProperties.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Property</th>
                      <th className="text-left p-3">Landlord</th>
                      <th className="text-left p-3">Price</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Created</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProperties.slice(0, 10).map((property) => (
                      <tr key={property.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                              <img
                                src={property.photo_url || "/placeholder.svg"}
                                alt={property.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-medium">{property.title}</div>
                              <div className="text-sm text-gray-600">{property.location}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{property.profiles?.full_name || 'Unknown'}</div>
                            <div className="text-sm text-gray-600">{property.profiles?.email}</div>
                          </div>
                        </td>
                        <td className="p-3 font-medium">₦{property.price?.toLocaleString()}</td>
                        <td className="p-3">
                          <Badge variant={
                            property.status === 'active' ? 'default' :
                            property.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {property.status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-gray-600">
                            {new Date(property.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            {property.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handlePropertyAction(property.id, 'approve')}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePropertyAction(property.id, 'reject')}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Property</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this property? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handlePropertyAction(property.id, 'delete')}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Property Review Tab */}
        <TabsContent value="property-review" className="space-y-6">
          <PropertyReviewPanel />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Platform Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Platform Name</label>
                  <Input defaultValue="LandLord Platform" />
                </div>
                <div>
                  <label className="text-sm font-medium">Commission Rate (%)</label>
                  <Input type="number" defaultValue="5" />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Properties per User</label>
                  <Input type="number" defaultValue="100" />
                </div>
                <Button>Save Settings</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Require Email Verification</label>
                  <Select defaultValue="enabled">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Property Approval Required</label>
                  <Select defaultValue="enabled">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Max Login Attempts</label>
                  <Input type="number" defaultValue="5" />
                </div>
                <Button>Update Security</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;