import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users,
  Home,
  Calendar,
  PieChart,
  LineChart,
  Download,
  Filter,
  RefreshCw,
  Shield,
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import AdminAnalyticsChart from './AdminAnalyticsChart';
import { AnalyticsService } from "@/services/analyticsService";
import { PropertyTransaction, PropertyFinancialMetrics } from "@/integrations/supabase/types";
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface PlatformMetrics {
  totalUsers: number;
  activeUsers: number;
  totalProperties: number;
  activeProperties: number;
  totalRevenue: number;
  monthlyGrowth: number;
  propertyApprovalRate: number;
  averageResponseTime: number;
}

interface ChartData {
  date: string;
  value: number;
  label: string;
}

const AdminAnalyticsDashboard = () => {
  const { hasRole } = useAuth();
  
  // Ensure only admins can access this dashboard
  if (!hasRole('admin')) {
    return <Navigate to="/" replace />;
  }

  const [timeRange, setTimeRange] = useState("30d");
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    totalProperties: 0,
    activeProperties: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    propertyApprovalRate: 0,
    averageResponseTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [propertyChartData, setPropertyChartData] = useState<ChartData[]>([]);
  const [userActivityData, setUserActivityData] = useState<ChartData[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchPlatformMetrics();
  }, [timeRange]);

  const fetchPlatformMetrics = async () => {
    setLoading(true);
    try {
      // Fetch users metrics
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, created_at')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch properties metrics
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id, status, created_at')
        .order('created_at', { ascending: false });

      if (propertiesError) throw propertiesError;

      // Fetch financial metrics
      const { data: financialMetrics, error: financialError } = await supabase
        .from('property_financial_metrics')
        .select('*') as { data: PropertyFinancialMetrics[] | null; error: any };

      if (financialError) throw financialError;

      // Calculate active users based on recent activity
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const activeUsers = users?.filter(user => 
        user.created_at && new Date(user.created_at) > thirtyDaysAgo
      ).length || 0;

      // Calculate property metrics
      const activeProperties = properties?.filter(p => p.status === 'active').length || 0;

      // Calculate financial metrics
      const totalRevenue = financialMetrics?.reduce((sum, m) => sum + m.total_revenue, 0) || 0;
      
      // Calculate monthly growth from transactions
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const { data: thisMonthData } = await supabase
        .from('property_transactions')
        .select('*')
        .gte('payment_date', startOfMonth.toISOString())
        .in('transaction_type', ['rent_payment', 'deposit', 'other_income'])
        .eq('status', 'completed') as { data: PropertyTransaction[] | null; error: any };

      const { data: lastMonthData } = await supabase
        .from('property_transactions')
        .select('*')
        .gte('payment_date', startOfLastMonth.toISOString())
        .lt('payment_date', startOfMonth.toISOString())
        .in('transaction_type', ['rent_payment', 'deposit', 'other_income'])
        .eq('status', 'completed') as { data: PropertyTransaction[] | null; error: any };

      const thisMonthRevenue = thisMonthData?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const lastMonthRevenue = lastMonthData?.reduce((sum, t) => sum + t.amount, 0) || 0;

      const monthlyGrowth = lastMonthRevenue === 0 ? 0 :
        ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

      // Fetch property reviews for approval rate
      const { data: reviews } = await supabase
        .from('property_reviews')
        .select('id, action')
        .order('created_at', { ascending: false });

      const approvedReviews = reviews?.filter(r => r.action === 'approved').length || 0;
      const propertyApprovalRate = reviews?.length ? 
        Math.round((approvedReviews / reviews.length) * 100) : 0;

      // Set metrics
      setMetrics({
        totalUsers: users?.length || 0,
        activeUsers,
        totalProperties: properties?.length || 0,
        activeProperties,
        totalRevenue,
        monthlyGrowth,
        propertyApprovalRate,
        averageResponseTime: 24 // Default to 24 hours
      });

      // Generate chart data
      await generateChartData();

    } catch (error) {
      console.error('Error fetching platform metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = async () => {
    try {
      // Get date range based on timeRange
      const now = new Date();
      const days = parseInt(timeRange);
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      // Fetch transactions for the period
      const { data: transactions } = await supabase
        .from('property_transactions')
        .select('*')
        .gte('payment_date', startDate.toISOString())
        .order('payment_date', { ascending: true }) as { data: PropertyTransaction[] | null; error: any };

      if (!transactions) return;

      // Group transactions by date
      const dailyData = transactions.reduce((acc: Record<string, number>, t) => {
        const date = new Date(t.payment_date || t.created_at).toISOString().split('T')[0];
        if (!acc[date]) acc[date] = 0;
        if (t.transaction_type === 'rent_payment' || t.transaction_type === 'deposit' || t.transaction_type === 'other_income') {
          acc[date] += t.amount;
        }
        return acc;
      }, {});

      // Convert to chart data format
      const chartData: ChartData[] = Object.entries(dailyData).map(([date, value]) => ({
        date,
        value,
        label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }));

      setPropertyChartData(chartData);

      // Generate user activity data
      const userActivityChartData: ChartData[] = chartData.map(d => ({
        date: d.date,
        value: Math.round(d.value * 0.8), // Example: 80% of revenue represents active users
        label: d.label
      }));

      setUserActivityData(userActivityChartData);

    } catch (error) {
      console.error('Error generating chart data:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Platform Analytics</h3>
          <p className="text-gray-600">Comprehensive insights into platform performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => fetchPlatformMetrics()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Users</p>
                <p className="text-3xl font-bold">{metrics.totalUsers}</p>
                <div className="flex items-center mt-2">
                  <Users className="w-4 h-4 mr-1" />
                  <span className="text-sm">{metrics.activeUsers} active users</span>
                </div>
              </div>
              <Users className="w-12 h-12 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Properties</p>
                <p className="text-3xl font-bold">{metrics.totalProperties}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">{metrics.monthlyGrowth}% growth</span>
                </div>
              </div>
              <Home className="w-12 h-12 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Approval Rate</p>
                <p className="text-3xl font-bold">{metrics.propertyApprovalRate}%</p>
                <div className="flex items-center mt-2">
                  <Shield className="w-4 h-4 mr-1" />
                  <span className="text-sm">Quality score</span>
                </div>
              </div>
              <CheckCircle className="w-12 h-12 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Response Time</p>
                <p className="text-3xl font-bold">{metrics.averageResponseTime}h</p>
                <div className="flex items-center mt-2">
                  <Clock className="w-4 h-4 mr-1" />
                  <span className="text-sm">Avg. review time</span>
                </div>
              </div>
              <MessageCircle className="w-12 h-12 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Property Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminAnalyticsChart
              title="Properties"
              data={propertyChartData}
              loading={loading}
              color="#22c55e"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminAnalyticsChart
              title="Active Users"
              data={userActivityData}
              loading={loading}
              color="#8b5cf6"
            />
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Property Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <Badge variant="default" className="mr-2">Active</Badge>
                  {metrics.activeProperties} properties
                </span>
                <span className="text-green-600">{Math.round((metrics.activeProperties / metrics.totalProperties) * 100)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <Badge variant="secondary" className="mr-2">Pending</Badge>
                  {metrics.totalProperties - metrics.activeProperties} properties
                </span>
                <span className="text-yellow-600">
                  {Math.round(((metrics.totalProperties - metrics.activeProperties) / metrics.totalProperties) * 100)}%
                </span>
              </div>
              <Progress 
                value={Math.round((metrics.activeProperties / metrics.totalProperties) * 100)} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <Badge variant="default" className="mr-2">Active Users</Badge>
                  {metrics.activeUsers} users
                </span>
                <span className="text-green-600">{Math.round((metrics.activeUsers / metrics.totalUsers) * 100)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <Badge variant="secondary" className="mr-2">Inactive Users</Badge>
                  {metrics.totalUsers - metrics.activeUsers} users
                </span>
                <span className="text-yellow-600">
                  {Math.round(((metrics.totalUsers - metrics.activeUsers) / metrics.totalUsers) * 100)}%
                </span>
              </div>
              <Progress 
                value={Math.round((metrics.activeUsers / metrics.totalUsers) * 100)} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Review Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Average Response Time</span>
                <Badge variant={metrics.averageResponseTime <= 24 ? "default" : "secondary"}>
                  {metrics.averageResponseTime}h
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Approval Rate</span>
                <Badge variant={metrics.propertyApprovalRate >= 80 ? "default" : "secondary"}>
                  {metrics.propertyApprovalRate}%
                </Badge>
              </div>
              <Progress 
                value={metrics.propertyApprovalRate} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalyticsDashboard;