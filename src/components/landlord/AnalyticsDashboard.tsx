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
  Eye, 
  MessageCircle, 
  Calendar,
  PieChart,
  LineChart,
  Download,
  Filter,
  RefreshCw,
  Building,
  Activity,
  Target,
  Map
} from "lucide-react";
import { Property } from "@/lib/supabase";
import { AnalyticsService, MarketInsights, FinancialMetrics, AnalyticsData } from "@/services/analyticsService";
import { useAuth } from "@/hooks/useAuth";
import { Chart } from "@/components/ui/chart";

interface AnalyticsDashboardProps {
  properties: Property[];
  loading?: boolean;
}

type ChartType = "revenue" | "views" | "inquiries";

const AnalyticsDashboard = ({ properties, loading = false }: AnalyticsDashboardProps) => {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [chartType, setChartType] = useState<ChartType>("revenue");
  const { profile } = useAuth();

  // State for real chart data with proper typing
  const [chartData, setChartData] = useState<AnalyticsData[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  // State for enhanced analytics
  const [marketInsights, setMarketInsights] = useState<MarketInsights>({
    priceRanges: [],
    averageRent: 0,
    marketTrends: [],
    competitorAnalysis: [],
    demandHotspots: []
  });

  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics>({
    totalRevenue: 0,
    averageRent: 0,
    monthlyGrowth: 0,
    yearlyProjection: 0,
    operatingCosts: 0,
    netOperatingIncome: 0,
    cashOnCashReturn: 0,
    occupancyRate: 0
  });

  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (!properties.length || !profile?.id) return;

      try {
        const insights = await AnalyticsService.getMarketInsights(properties);
        const metrics = await AnalyticsService.getFinancialMetrics(properties);
        
        setMarketInsights(insights);
        setFinancialMetrics(metrics);
      } catch (error) {
        console.error('Error loading analytics data:', error);
        // Reset to default values on error
        setMarketInsights({
          priceRanges: [],
          averageRent: 0,
          marketTrends: [],
          competitorAnalysis: [],
          demandHotspots: []
        });
        setFinancialMetrics({
          totalRevenue: 0,
          averageRent: 0,
          monthlyGrowth: 0,
          yearlyProjection: 0,
          operatingCosts: 0,
          netOperatingIncome: 0,
          cashOnCashReturn: 0,
          occupancyRate: 0
        });
      }
    };

    loadAnalyticsData();
  }, [properties, profile?.id]);

  useEffect(() => {
    const loadChartData = async () => {
      if (!profile?.id) return;
      
      setChartLoading(true);
      try {
        const data = await AnalyticsService.generateRealChartData(profile.id, chartType, timeRange);
        setChartData(data);
      } catch (error) {
        console.error('Error loading chart data:', error);
        setChartData([]);
      } finally {
        setChartLoading(false);
      }
    };

    loadChartData();
  }, [chartType, timeRange, profile?.id]);

  const exportData = () => {
    if (!properties.length) return;
    AnalyticsService.exportAnalyticsData(properties, 'property-analytics');
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
      {/* Analytics Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h3>
          <p className="text-gray-600">Comprehensive insights into your property performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select 
            value={timeRange} 
            onValueChange={(value: "7d" | "30d" | "90d") => setTimeRange(value)}>
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
          <Button variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Revenue</p>
                <p className="text-3xl font-bold">₦{financialMetrics.totalRevenue.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">+{financialMetrics.monthlyGrowth.toFixed(1)}% this month</span>
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
                <p className="text-green-100">Net Operating Income</p>
                <p className="text-3xl font-bold">₦{financialMetrics.netOperatingIncome.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <Activity className="w-4 h-4 mr-1" />
                  <span className="text-sm">ROI: {financialMetrics.cashOnCashReturn.toFixed(1)}%</span>
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
                <p className="text-3xl font-bold">{financialMetrics.occupancyRate.toFixed(1)}%</p>
                <div className="flex items-center mt-2">
                  {financialMetrics.occupancyRate >= 80 ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  <span className="text-sm">
                    {financialMetrics.occupancyRate >= 80 ? 'Excellent' : 'Room for improvement'}
                  </span>
                </div>
              </div>
              <Target className="w-12 h-12 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Market Performance</p>
                <p className="text-3xl font-bold">{marketInsights.marketTrends[0]?.value.toFixed(1)}%</p>
                <div className="flex items-center mt-2">
                  <Map className="w-4 h-4 mr-1" />
                  <span className="text-sm">vs Market Average</span>
                </div>
              </div>
              <PieChart className="w-12 h-12 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Chart
                type="line"
                data={chartData}
                loading={chartLoading}
                xField="label"
                yField="value"
                seriesField="type"
              />
            </div>
          </CardContent>
        </Card>

        {/* Market Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Market Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Price Distribution</h4>
                <div className="grid grid-cols-2 gap-2">
                  {marketInsights.priceRanges.map((range, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{range.range}</span>
                      <Badge variant="secondary">{range.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Top Locations</h4>
                <div className="space-y-2">
                  {marketInsights.demandHotspots.map((location, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{location.location}</span>
                      <Progress value={location.score} className="w-24" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Competitive Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Competitive Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marketInsights.competitorAnalysis.map((metric, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <h4 className="font-semibold text-sm text-gray-600">{metric.metric}</h4>
                <p className="text-2xl font-bold mt-1">
                  {metric.metric.includes('Price') ? '₦' : ''}{metric.value.toLocaleString()}
                  {!metric.metric.includes('Price') ? '%' : ''}
                </p>
                <div className="flex items-center mt-2 text-sm">
                  {metric.value > metric.benchmark ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={metric.value > metric.benchmark ? 'text-green-600' : 'text-red-600'}>
                    vs {metric.benchmark.toLocaleString()} benchmark
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard; 