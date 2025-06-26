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
  RefreshCw
} from "lucide-react";
import { Property } from "@/lib/supabase";
import { AnalyticsService } from "@/services/analyticsService";
import { useAuth } from "@/hooks/useAuth";

interface AnalyticsDashboardProps {
  properties: Property[];
  chatRooms: any[];
  stats: {
    totalProperties: number;
    activeProperties: number;
    totalViews: number;
    totalInquiries: number;
    newInquiriesThisWeek: number;
    monthlyRevenue: number;
    occupancyRate: number;
  };
  loading?: boolean;
}

const AnalyticsDashboard = ({ properties, chatRooms, stats, loading = false }: AnalyticsDashboardProps) => {
  const [timeRange, setTimeRange] = useState("30d");
  const [chartType, setChartType] = useState("revenue");
  const { profile } = useAuth();

  // State for real chart data
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  // Property performance analysis using real data
  const [propertyPerformance, setPropertyPerformance] = useState<any[]>([]);
  const [financialMetrics, setFinancialMetrics] = useState<any>({});
  const [marketInsights, setMarketInsights] = useState<any>({});

  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        const performance = await AnalyticsService.getPropertyPerformance(properties);
        const financial = AnalyticsService.getFinancialMetrics(properties);
        const market = AnalyticsService.getMarketInsights(properties);
        
        setPropertyPerformance(performance);
        setFinancialMetrics(financial);
        setMarketInsights(market);
      } catch (error) {
        console.error('Error loading analytics data:', error);
      }
    };

    if (properties.length > 0) {
      loadAnalyticsData();
    }
  }, [properties]);

  // Load chart data when chart type or time range changes
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

  // Use the calculated metrics
  const totalRevenue = financialMetrics.totalRevenue || 0;
  const averageRent = financialMetrics.averageRent || 0;
  const monthlyGrowth = financialMetrics.monthlyGrowth || 0;
  const yearlyProjection = financialMetrics.yearlyProjection || 0;
  const priceRanges = marketInsights.priceRanges || [];

  const exportData = () => {
    AnalyticsService.exportAnalyticsData(propertyPerformance, 'property-analytics');
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
          <h3 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h3>
          <p className="text-gray-600">Comprehensive insights into your property performance</p>
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
          <Button variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Revenue</p>
                <p className="text-3xl font-bold">₦{totalRevenue.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">+{monthlyGrowth}% this month</span>
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
                <p className="text-green-100">Average Rent</p>
                <p className="text-3xl font-bold">₦{Math.round(averageRent).toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">Above market avg</span>
                </div>
              </div>
              <BarChart3 className="w-12 h-12 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Occupancy Rate</p>
                <p className="text-3xl font-bold">{stats.occupancyRate}%</p>
                <div className="flex items-center mt-2">
                  {stats.occupancyRate >= 80 ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  <span className="text-sm">
                    {stats.occupancyRate >= 80 ? 'Excellent' : 'Room for improvement'}
                  </span>
                </div>
              </div>
              <PieChart className="w-12 h-12 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Yearly Projection</p>
                <p className="text-3xl font-bold">₦{(yearlyProjection / 1000000).toFixed(1)}M</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">Based on current trend</span>
                </div>
              </div>
              <LineChart className="w-12 h-12 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Performance Trends
              </CardTitle>
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="views">Property Views</SelectItem>
                  <SelectItem value="inquiries">Inquiries</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="h-64 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No data available for the selected period</p>
                  <p className="text-sm">Data will appear as your properties receive activity</p>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-end justify-between space-x-1">
                {chartData.map((point, index) => {
                  const maxValue = Math.max(...chartData.map(d => d.value), 1);
                  return (
                    <div key={index} className="flex flex-col items-center flex-1 group">
                      <div className="relative">
                        <div 
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t hover:from-blue-600 hover:to-blue-400 transition-colors cursor-pointer"
                          style={{ 
                            height: `${Math.max((point.value / maxValue) * 200, 8)}px`,
                            minWidth: '12px'
                          }}
                          title={`${point.label}: ${point.value.toLocaleString()}`}
                        ></div>
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {chartType === 'revenue' ? `₦${point.value.toLocaleString()}` : point.value.toLocaleString()}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                        {point.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Property Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Property Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Property</th>
                  <th className="text-left p-3">Price</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Views</th>
                  <th className="text-left p-3">Inquiries</th>
                  <th className="text-left p-3">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {propertyPerformance.slice(0, 10).map((property) => (
                  <tr key={property.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{property.title}</div>
                        <div className="text-sm text-gray-600">{property.location}</div>
                      </div>
                    </td>
                    <td className="p-3 font-medium">₦{property.price?.toLocaleString()}</td>
                    <td className="p-3">
                      <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                        {property.status}
                      </Badge>
                    </td>
                    <td className="p-3">{property.views}</td>
                    <td className="p-3">{property.inquiries}</td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <span>{property.conversionRate}%</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${property.conversionRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Market Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Price Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {priceRanges.map((range, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{range.range}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full" 
                        style={{ width: `${(range.count / properties.length) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8">{range.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Insights & Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Dynamic insights based on real data */}
              {priceRanges.length > 0 && (() => {
                const bestPerformingRange = priceRanges.reduce((best, current) => 
                  current.count > best.count ? current : best
                );
                return bestPerformingRange.count > 1 ? (
                  <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-medium text-blue-900">Market Insight</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      Most of your properties ({bestPerformingRange.count}) are in the {bestPerformingRange.range} range, 
                      representing {bestPerformingRange.percentage}% of your portfolio.
                    </p>
                  </div>
                ) : null;
              })()}
              
              {stats.occupancyRate >= 75 ? (
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-medium text-green-900">Strong Performance</h4>
                  <p className="text-sm text-green-800 mt-1">
                    Your occupancy rate of {stats.occupancyRate}% is {stats.occupancyRate >= 80 ? 'excellent and above' : 'above'} the market average of 75%.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <h4 className="font-medium text-yellow-900">Improvement Opportunity</h4>
                  <p className="text-sm text-yellow-800 mt-1">
                    Your occupancy rate of {stats.occupancyRate}% is below the market average. Consider reviewing pricing or marketing strategy.
                  </p>
                </div>
              )}
              
              {(() => {
                const inactiveCount = properties.filter(p => p.status === 'inactive').length;
                if (inactiveCount > 0) {
                  return (
                    <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                      <h4 className="font-medium text-yellow-900">Action Required</h4>
                      <p className="text-sm text-yellow-800 mt-1">
                        {inactiveCount} {inactiveCount === 1 ? 'property is' : 'properties are'} inactive. 
                        Reactivate to increase revenue potential.
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <h4 className="font-medium text-green-900">All Systems Go</h4>
                    <p className="text-sm text-green-800 mt-1">
                      All your properties are active and available for rent. Great job!
                    </p>
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 