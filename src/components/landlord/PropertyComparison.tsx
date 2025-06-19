import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  MessageCircle, 
  DollarSign,
  Home,
  MapPin,
  Calendar,
  Star,
  Zap,
  Award,
  X,
  GitCompare,
  Download,
  Filter
} from "lucide-react";
import { Property } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { AnalyticsService, PropertyMetrics } from "@/services/analyticsService";

interface PropertyComparisonProps {
  properties: Property[];
  onClose?: () => void;
}

const PropertyComparison = ({ properties, onClose }: PropertyComparisonProps) => {
  const { profile } = useAuth();
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [comparisonMode, setComparisonMode] = useState<'basic' | 'detailed' | 'market'>('basic');
  const [sortBy, setSortBy] = useState<'price' | 'performance' | 'market' | 'date'>('price');
  const [propertyMetrics, setPropertyMetrics] = useState<PropertyMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  // Load real metrics from analytics service
  useEffect(() => {
    const loadMetrics = async () => {
      if (!profile?.id) return;

      try {
        setLoading(true);
        const metrics = await AnalyticsService.getPropertyMetrics(profile.id);
        setPropertyMetrics(metrics);
      } catch (error) {
        console.error('Error loading property metrics:', error);
        setPropertyMetrics([]);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [profile?.id]);

  const togglePropertySelection = (propertyId: string) => {
    setSelectedProperties(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      } else if (prev.length < 4) { // Limit to 4 properties for comparison
        return [...prev, propertyId];
      }
      return prev;
    });
  };

  const getSelectedPropertiesData = () => {
    return properties.filter(p => selectedProperties.includes(p.id));
  };

  const getMetricsForProperty = (propertyId: string) => {
    return propertyMetrics.find(m => m.id === propertyId);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 80) return 'text-blue-600 bg-blue-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 90) return 'default';
    if (score >= 80) return 'secondary';
    if (score >= 70) return 'outline';
    return 'destructive';
  };

  const exportComparison = () => {
    const selectedData = getSelectedPropertiesData();
    const csvContent = [
      ['Property', 'Price', 'Location', 'Status', 'Views', 'Inquiries', 'Conversion Rate', 'Market Score', 'Overall Score'],
      ...selectedData.map(property => {
        const metrics = getMetricsForProperty(property.id);
        return [
          property.title,
          property.price,
          property.location,
          property.status,
          metrics?.views || 0,
          metrics?.inquiries || 0,
          `${metrics?.conversionRate || 0}%`,
          metrics?.marketScore || 0,
          metrics?.overallScore || 0
        ];
      })
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `property-comparison-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const sortedProperties = [...properties].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return (b.price || 0) - (a.price || 0);
      case 'performance':
        const metricsA = getMetricsForProperty(a.id);
        const metricsB = getMetricsForProperty(b.id);
        return (metricsB?.overallScore || 0) - (metricsA?.overallScore || 0);
      case 'market':
        const marketA = getMetricsForProperty(a.id);
        const marketB = getMetricsForProperty(b.id);
        return (marketB?.marketScore || 0) - (marketA?.marketScore || 0);
      case 'date':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <GitCompare className="w-6 h-6 mr-2" />
              Property Comparison
            </h2>
            <p className="text-gray-600 mt-1">Loading property metrics...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-32 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <GitCompare className="w-6 h-6 mr-2" />
            Property Comparison
          </h2>
          <p className="text-gray-600 mt-1">
            Compare up to 4 properties side-by-side to make informed decisions
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price">Sort by Price</SelectItem>
              <SelectItem value="performance">Sort by Performance</SelectItem>
              <SelectItem value="market">Sort by Market Score</SelectItem>
              <SelectItem value="date">Sort by Date</SelectItem>
            </SelectContent>
          </Select>
          {selectedProperties.length > 0 && (
            <Button onClick={exportComparison} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
          {onClose && (
            <Button onClick={onClose} variant="outline" size="icon">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Selection Info */}
      {selectedProperties.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{selectedProperties.length}/4 selected</Badge>
                <span className="text-sm text-gray-600">
                  {selectedProperties.length === 1 ? 'Select another property to compare' : 
                   selectedProperties.length < 4 ? 'You can select up to 4 properties' : 
                   'Maximum properties selected'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Select value={comparisonMode} onValueChange={(value: any) => setComparisonMode(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                    <SelectItem value="market">Market Analysis</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedProperties([])}
                >
                  Clear All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Property Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedProperties.map((property) => {
          const metrics = getMetricsForProperty(property.id);
          const isSelected = selectedProperties.includes(property.id);
          
          return (
            <Card 
              key={property.id} 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => togglePropertySelection(property.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Checkbox 
                    checked={isSelected}
                    onChange={() => {}} // Handled by card click
                    className="mt-1"
                  />
                  <Badge 
                    variant={getScoreBadgeVariant(metrics?.overallScore || 0)}
                    className="text-xs"
                  >
                    {metrics?.overallScore || 0}% Score
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold text-lg line-clamp-2">{property.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{property.location}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xl font-bold text-green-600">
                      ₦{property.price?.toLocaleString()}
                    </span>
                    <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                      {property.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Property Image Placeholder */}
                <div className="w-full h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  {property.photo_url ? (
                    <img 
                      src={property.photo_url} 
                      alt={property.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Home className="w-8 h-8 text-gray-400" />
                  )}
                </div>

                {/* Quick Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <Eye className="w-3 h-3 text-green-500 mr-1" />
                      <span className="text-xs font-medium">{metrics?.views || 0}</span>
                    </div>
                    <span className="text-xs text-gray-500">Views</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <MessageCircle className="w-3 h-3 text-blue-500 mr-1" />
                      <span className="text-xs font-medium">{metrics?.inquiries || 0}</span>
                    </div>
                    <span className="text-xs text-gray-500">Inquiries</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <Calendar className="w-3 h-3 text-purple-500 mr-1" />
                      <span className="text-xs font-medium">{metrics?.daysOnMarket || 0}</span>
                    </div>
                    <span className="text-xs text-gray-500">Days</span>
                  </div>
                </div>

                {/* Performance Bars */}
                <div className="mt-4 space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Market Score</span>
                      <span>{metrics?.marketScore || 0}%</span>
                    </div>
                    <Progress value={metrics?.marketScore || 0} className="h-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Popularity</span>
                      <span>{metrics?.popularityScore || 0}%</span>
                    </div>
                    <Progress value={metrics?.popularityScore || 0} className="h-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Comparison Table */}
      {selectedProperties.length > 1 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Detailed Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={comparisonMode} onValueChange={(value: any) => setComparisonMode(value)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="detailed">Performance</TabsTrigger>
                <TabsTrigger value="market">Market Analysis</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="mt-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Property</th>
                        {getSelectedPropertiesData().map(property => (
                          <th key={property.id} className="text-center p-3 min-w-[200px]">
                            <div>
                              <div className="font-medium">{property.title}</div>
                              <div className="text-sm text-gray-500">{property.location}</div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3 font-medium">Price</td>
                        {getSelectedPropertiesData().map(property => (
                          <td key={property.id} className="text-center p-3">
                            <span className="text-lg font-bold text-green-600">
                              ₦{property.price?.toLocaleString()}
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-medium">Status</td>
                        {getSelectedPropertiesData().map(property => (
                          <td key={property.id} className="text-center p-3">
                            <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                              {property.status}
                            </Badge>
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-medium">Bedrooms</td>
                        {getSelectedPropertiesData().map(property => (
                          <td key={property.id} className="text-center p-3">
                            {property.bedrooms || 'N/A'}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-medium">Bathrooms</td>
                        {getSelectedPropertiesData().map(property => (
                          <td key={property.id} className="text-center p-3">
                            {property.bathrooms || 'N/A'}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              
              <TabsContent value="detailed" className="mt-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Metric</th>
                        {getSelectedPropertiesData().map(property => (
                          <th key={property.id} className="text-center p-3 min-w-[200px]">
                            <div className="font-medium">{property.title}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3 font-medium">Views</td>
                        {getSelectedPropertiesData().map(property => {
                          const metrics = getMetricsForProperty(property.id);
                          return (
                            <td key={property.id} className="text-center p-3">
                              <div className="flex items-center justify-center">
                                <Eye className="w-4 h-4 text-green-500 mr-1" />
                                <span className="font-medium">{metrics?.views || 0}</span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-medium">Inquiries</td>
                        {getSelectedPropertiesData().map(property => {
                          const metrics = getMetricsForProperty(property.id);
                          return (
                            <td key={property.id} className="text-center p-3">
                              <div className="flex items-center justify-center">
                                <MessageCircle className="w-4 h-4 text-blue-500 mr-1" />
                                <span className="font-medium">{metrics?.inquiries || 0}</span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-medium">Conversion Rate</td>
                        {getSelectedPropertiesData().map(property => {
                          const metrics = getMetricsForProperty(property.id);
                          return (
                            <td key={property.id} className="text-center p-3">
                              <span className="font-medium">{metrics?.conversionRate || 0}%</span>
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-medium">Days on Market</td>
                        {getSelectedPropertiesData().map(property => {
                          const metrics = getMetricsForProperty(property.id);
                          return (
                            <td key={property.id} className="text-center p-3">
                              <div className="flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-purple-500 mr-1" />
                                <span className="font-medium">{metrics?.daysOnMarket || 0}</span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-medium">Overall Score</td>
                        {getSelectedPropertiesData().map(property => {
                          const metrics = getMetricsForProperty(property.id);
                          return (
                            <td key={property.id} className="text-center p-3">
                              <Badge 
                                variant={getScoreBadgeVariant(metrics?.overallScore || 0)}
                                className="text-sm"
                              >
                                {metrics?.overallScore || 0}%
                              </Badge>
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              
              <TabsContent value="market" className="mt-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Market Metric</th>
                        {getSelectedPropertiesData().map(property => (
                          <th key={property.id} className="text-center p-3 min-w-[200px]">
                            <div className="font-medium">{property.title}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3 font-medium">Market Score</td>
                        {getSelectedPropertiesData().map(property => {
                          const metrics = getMetricsForProperty(property.id);
                          return (
                            <td key={property.id} className="text-center p-3">
                              <div className="space-y-1">
                                <Progress value={metrics?.marketScore || 0} className="h-2" />
                                <span className="text-sm font-medium">{metrics?.marketScore || 0}%</span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-medium">Popularity Score</td>
                        {getSelectedPropertiesData().map(property => {
                          const metrics = getMetricsForProperty(property.id);
                          return (
                            <td key={property.id} className="text-center p-3">
                              <div className="space-y-1">
                                <Progress value={metrics?.popularityScore || 0} className="h-2" />
                                <span className="text-sm font-medium">{metrics?.popularityScore || 0}%</span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-medium">Profitability Score</td>
                        {getSelectedPropertiesData().map(property => {
                          const metrics = getMetricsForProperty(property.id);
                          return (
                            <td key={property.id} className="text-center p-3">
                              <div className="space-y-1">
                                <Progress value={metrics?.profitabilityScore || 0} className="h-2" />
                                <span className="text-sm font-medium">{metrics?.profitabilityScore || 0}%</span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-medium">Price per Sq Ft</td>
                        {getSelectedPropertiesData().map(property => {
                          const metrics = getMetricsForProperty(property.id);
                          return (
                            <td key={property.id} className="text-center p-3">
                              <div className="flex items-center justify-center">
                                <DollarSign className="w-4 h-4 text-green-500 mr-1" />
                                <span className="font-medium">₦{metrics?.pricePerSqFt || 0}</span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PropertyComparison; 