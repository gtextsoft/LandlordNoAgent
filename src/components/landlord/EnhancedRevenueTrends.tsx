import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  Filter,
  RefreshCw,
  Target,
  Activity,
  Building,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  MessageCircle
} from "lucide-react";
import { Chart } from "@/components/ui/chart";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Property } from "@/lib/supabase";

interface RevenueMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  dailyRevenue: number;
  revenueGrowth: number;
  projectedRevenue: number;
  averageRent: number;
  occupancyRate: number;
  collectionRate: number;
  latePayments: number;
  outstandingAmount: number;
}

interface RevenueBreakdown {
  rentPayments: number;
  deposits: number;
  otherIncome: number;
  maintenanceCosts: number;
  utilityPayments: number;
  insurance: number;
  taxes: number;
  otherExpenses: number;
}

interface RevenueTrend {
  date: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  transactions: number;
  occupancy: number;
}

interface PropertyRevenue {
  propertyId: string;
  propertyName: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  occupancy: number;
  roi: number;
}

const EnhancedRevenueTrends = ({ properties }: { properties: Property[] }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [viewMode, setViewMode] = useState<"overview" | "breakdown" | "forecast" | "properties">("overview");
  const [loading, setLoading] = useState(false);
  
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    dailyRevenue: 0,
    revenueGrowth: 0,
    projectedRevenue: 0,
    averageRent: 0,
    occupancyRate: 0,
    collectionRate: 0,
    latePayments: 0,
    outstandingAmount: 0
  });

  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdown>({
    rentPayments: 0,
    deposits: 0,
    otherIncome: 0,
    maintenanceCosts: 0,
    utilityPayments: 0,
    insurance: 0,
    taxes: 0,
    otherExpenses: 0
  });

  const [revenueTrends, setRevenueTrends] = useState<RevenueTrend[]>([]);
  const [propertyRevenues, setPropertyRevenues] = useState<PropertyRevenue[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (properties.length > 0 && profile?.id) {
      loadRevenueData();
    }
  }, [properties, timeRange, profile?.id]);

  const loadRevenueData = async () => {
    setLoading(true);
    try {
      const propertyIds = properties.map(p => p.id);
      
      // Get date range
      const now = new Date();
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365;
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      // Fetch all transactions for the period
      const { data: transactions, error: transactionsError } = await supabase
        .from('property_transactions')
        .select('*')
        .in('property_id', propertyIds)
        .gte('payment_date', startDate.toISOString())
        .order('payment_date', { ascending: true });

      if (transactionsError) throw transactionsError;

      // Calculate revenue metrics
      const completedTransactions = transactions?.filter(t => t.status === 'completed') || [];
      const revenueTransactions = completedTransactions.filter(t => 
        ['rent_payment', 'deposit', 'other_income'].includes(t.transaction_type)
      );
      const expenseTransactions = completedTransactions.filter(t => 
        ['maintenance_cost', 'utility_payment', 'insurance', 'tax', 'other_expense'].includes(t.transaction_type)
      );

      const totalRevenue = revenueTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalExpenses = expenseTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const netIncome = totalRevenue - totalExpenses;

      // Calculate breakdown
      const breakdown: RevenueBreakdown = {
        rentPayments: revenueTransactions.filter(t => t.transaction_type === 'rent_payment')
          .reduce((sum, t) => sum + (t.amount || 0), 0),
        deposits: revenueTransactions.filter(t => t.transaction_type === 'deposit')
          .reduce((sum, t) => sum + (t.amount || 0), 0),
        otherIncome: revenueTransactions.filter(t => t.transaction_type === 'other_income')
          .reduce((sum, t) => sum + (t.amount || 0), 0),
        maintenanceCosts: expenseTransactions.filter(t => t.transaction_type === 'maintenance_cost')
          .reduce((sum, t) => sum + (t.amount || 0), 0),
        utilityPayments: expenseTransactions.filter(t => t.transaction_type === 'utility_payment')
          .reduce((sum, t) => sum + (t.amount || 0), 0),
        insurance: expenseTransactions.filter(t => t.transaction_type === 'insurance')
          .reduce((sum, t) => sum + (t.amount || 0), 0),
        taxes: expenseTransactions.filter(t => t.transaction_type === 'tax')
          .reduce((sum, t) => sum + (t.amount || 0), 0),
        otherExpenses: expenseTransactions.filter(t => t.transaction_type === 'other_expense')
          .reduce((sum, t) => sum + (t.amount || 0), 0)
      };

      // Calculate trends by day
      const trends: RevenueTrend[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayTransactions = completedTransactions.filter(t => 
          new Date(t.payment_date).toISOString().split('T')[0] === dateStr
        );
        
        const dayRevenue = dayTransactions
          .filter(t => ['rent_payment', 'deposit', 'other_income'].includes(t.transaction_type))
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const dayExpenses = dayTransactions
          .filter(t => ['maintenance_cost', 'utility_payment', 'insurance', 'tax', 'other_expense'].includes(t.transaction_type))
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        trends.push({
          date: dateStr,
          revenue: dayRevenue,
          expenses: dayExpenses,
          netIncome: dayRevenue - dayExpenses,
          transactions: dayTransactions.length,
          occupancy: properties.filter(p => p.status === 'rented').length / properties.length * 100
        });
      }

      // Calculate property-specific revenues
      const propertyRevenues: PropertyRevenue[] = properties.map(property => {
        const propertyTransactions = completedTransactions.filter(t => t.property_id === property.id);
        const propertyRevenue = propertyTransactions
          .filter(t => ['rent_payment', 'deposit', 'other_income'].includes(t.transaction_type))
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        const propertyExpenses = propertyTransactions
          .filter(t => ['maintenance_cost', 'utility_payment', 'insurance', 'tax', 'other_expense'].includes(t.transaction_type))
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        const propertyNetIncome = propertyRevenue - propertyExpenses;
        const propertyRoi = property.price ? (propertyNetIncome / property.price) * 100 : 0;

        return {
          propertyId: property.id,
          propertyName: property.title || `Property ${property.id}`,
          revenue: propertyRevenue,
          expenses: propertyExpenses,
          netIncome: propertyNetIncome,
          occupancy: property.status === 'rented' ? 100 : 0,
          roi: propertyRoi
        };
      });

      // Calculate metrics
      const monthlyRevenue = trends.slice(-30).reduce((sum, t) => sum + t.revenue, 0);
      const weeklyRevenue = trends.slice(-7).reduce((sum, t) => sum + t.revenue, 0);
      const dailyRevenue = trends.slice(-1)[0]?.revenue || 0;
      
      // Calculate growth rate
      const previousPeriod = timeRange === "30d" ? trends.slice(-60, -30) : trends.slice(-14, -7);
      const currentPeriod = timeRange === "30d" ? trends.slice(-30) : trends.slice(-7);
      const previousRevenue = previousPeriod.reduce((sum, t) => sum + t.revenue, 0);
      const currentRevenue = currentPeriod.reduce((sum, t) => sum + t.revenue, 0);
      const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      // Calculate projected revenue
      const projectedRevenue = totalRevenue * (1 + (revenueGrowth / 100));

      // Calculate collection rate and late payments
      const totalExpectedRent = properties.reduce((sum, p) => sum + (p.price || 0), 0);
      const collectionRate = totalExpectedRent > 0 ? (totalRevenue / totalExpectedRent) * 100 : 0;
      
      const latePayments = completedTransactions.filter(t => 
        t.transaction_type === 'rent_payment' && 
        new Date(t.payment_date) > new Date(t.due_date || t.payment_date)
      ).length;

      const outstandingAmount = totalExpectedRent - totalRevenue;

      setRevenueMetrics({
        totalRevenue,
        monthlyRevenue,
        weeklyRevenue,
        dailyRevenue,
        revenueGrowth,
        projectedRevenue,
        averageRent: properties.length > 0 ? totalRevenue / properties.length : 0,
        occupancyRate: properties.filter(p => p.status === 'rented').length / properties.length * 100,
        collectionRate,
        latePayments,
        outstandingAmount
      });

      setRevenueBreakdown(breakdown);
      setRevenueTrends(trends);
      setPropertyRevenues(propertyRevenues);

      // Generate chart data
      const chartData = trends.map(t => ({
        date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: t.revenue,
        expenses: t.expenses,
        netIncome: t.netIncome,
        transactions: t.transactions
      }));

      setChartData(chartData);

    } catch (error) {
      console.error('Error loading revenue data:', error);
      toast({
        title: "Error",
        description: "Failed to load revenue data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportRevenueData = () => {
    const data = {
      metrics: revenueMetrics,
      breakdown: revenueBreakdown,
      trends: revenueTrends,
      properties: propertyRevenues
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-data-${timeRange}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    );
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Revenue Trends</h3>
          <p className="text-gray-600">Comprehensive revenue analysis and forecasting</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadRevenueData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportRevenueData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Revenue</p>
                <p className="text-3xl font-bold">₦{revenueMetrics.totalRevenue.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  {getGrowthIcon(revenueMetrics.revenueGrowth)}
                  <span className="text-sm ml-1">
                    {revenueMetrics.revenueGrowth > 0 ? '+' : ''}{revenueMetrics.revenueGrowth.toFixed(1)}% vs previous period
                  </span>
                </div>
              </div>
              <DollarSign className="w-12 h-12 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Net Income</p>
                <p className="text-3xl font-bold">₦{(revenueMetrics.totalRevenue - Object.values(revenueBreakdown).slice(3).reduce((a, b) => a + b, 0)).toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <Activity className="w-4 h-4 mr-1" />
                  <span className="text-sm">Collection Rate: {revenueMetrics.collectionRate.toFixed(1)}%</span>
                </div>
              </div>
              <Building className="w-12 h-12 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Occupancy Rate</p>
                <p className="text-3xl font-bold">{revenueMetrics.occupancyRate.toFixed(1)}%</p>
                <div className="flex items-center mt-2">
                  <Target className="w-4 h-4 mr-1" />
                  <span className="text-sm">
                    {revenueMetrics.latePayments > 0 ? `${revenueMetrics.latePayments} late payments` : 'All payments on time'}
                  </span>
                </div>
              </div>
              <Users className="w-12 h-12 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Projected Revenue</p>
                <p className="text-3xl font-bold">₦{revenueMetrics.projectedRevenue.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">Based on current trends</span>
                </div>
              </div>
              <BarChart3 className="w-12 h-12 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <Chart
                  type="line"
                  data={chartData}
                  loading={loading}
                  xField="date"
                  yField="revenue"
                  seriesField="type"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Daily Average</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{revenueMetrics.dailyRevenue.toLocaleString()}</div>
                <p className="text-xs text-gray-500">Average daily revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Weekly Average</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{revenueMetrics.weeklyRevenue.toLocaleString()}</div>
                <p className="text-xs text-gray-500">Average weekly revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Monthly Average</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{revenueMetrics.monthlyRevenue.toLocaleString()}</div>
                <p className="text-xs text-gray-500">Average monthly revenue</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          {/* Revenue vs Expenses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Rent Payments</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(revenueBreakdown.rentPayments / revenueMetrics.totalRevenue) * 100} className="w-24" />
                      <span className="text-sm font-medium">₦{revenueBreakdown.rentPayments.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Deposits</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(revenueBreakdown.deposits / revenueMetrics.totalRevenue) * 100} className="w-24" />
                      <span className="text-sm font-medium">₦{revenueBreakdown.deposits.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Other Income</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(revenueBreakdown.otherIncome / revenueMetrics.totalRevenue) * 100} className="w-24" />
                      <span className="text-sm font-medium">₦{revenueBreakdown.otherIncome.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Maintenance</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(revenueBreakdown.maintenanceCosts / Object.values(revenueBreakdown).slice(3).reduce((a, b) => a + b, 0)) * 100} className="w-24" />
                      <span className="text-sm font-medium">₦{revenueBreakdown.maintenanceCosts.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Utilities</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(revenueBreakdown.utilityPayments / Object.values(revenueBreakdown).slice(3).reduce((a, b) => a + b, 0)) * 100} className="w-24" />
                      <span className="text-sm font-medium">₦{revenueBreakdown.utilityPayments.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Insurance & Taxes</span>
                    <div className="flex items-center gap-2">
                      <Progress value={((revenueBreakdown.insurance + revenueBreakdown.taxes) / Object.values(revenueBreakdown).slice(3).reduce((a, b) => a + b, 0)) * 100} className="w-24" />
                      <span className="text-sm font-medium">₦{(revenueBreakdown.insurance + revenueBreakdown.taxes).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-6">
          {/* Forecasting */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">₦{(revenueMetrics.projectedRevenue * 1.1).toLocaleString()}</div>
                  <p className="text-sm text-gray-600">Optimistic (10% growth)</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">₦{revenueMetrics.projectedRevenue.toLocaleString()}</div>
                  <p className="text-sm text-gray-600">Current trend</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">₦{(revenueMetrics.projectedRevenue * 0.9).toLocaleString()}</div>
                  <p className="text-sm text-gray-600">Conservative (10% decline)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueMetrics.latePayments > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="font-medium text-red-800">{revenueMetrics.latePayments} late payment(s)</p>
                      <p className="text-sm text-red-600">Outstanding: ₦{revenueMetrics.outstandingAmount.toLocaleString()}</p>
                    </div>
                  </div>
                )}
                
                {revenueMetrics.collectionRate < 90 && (
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="font-medium text-yellow-800">Low collection rate</p>
                      <p className="text-sm text-yellow-600">Only {revenueMetrics.collectionRate.toFixed(1)}% of expected revenue collected</p>
                    </div>
                  </div>
                )}

                {revenueMetrics.revenueGrowth > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium text-green-800">Revenue growing</p>
                      <p className="text-sm text-green-600">+{revenueMetrics.revenueGrowth.toFixed(1)}% growth this period</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties" className="space-y-6">
          {/* Property Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Property Revenue Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {propertyRevenues.map((property, index) => (
                  <div key={property.propertyId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{property.propertyName}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>Revenue: ₦{property.revenue.toLocaleString()}</span>
                        <span>Expenses: ₦{property.expenses.toLocaleString()}</span>
                        <span>ROI: {property.roi.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${property.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₦{property.netIncome.toLocaleString()}
                      </div>
                      <Badge variant={property.occupancy > 0 ? "default" : "secondary"}>
                        {property.occupancy > 0 ? 'Occupied' : 'Vacant'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedRevenueTrends; 