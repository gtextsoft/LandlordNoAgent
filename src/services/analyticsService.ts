import supabase from '@/integrations/supabase/client';
import { Property as BaseProperty } from '@/lib/supabase';
import { PropertyTransaction, PropertyFinancialMetrics } from '@/integrations/supabase/types';

export interface PropertyMetrics {
  id: string;
  views: number;
  inquiries: number;
  conversionRate: number;
  averageRating: number;
  daysOnMarket: number;
  pricePerSqFt: number;
  marketScore: number;
  popularityScore: number;
  profitabilityScore: number;
  overallScore: number;
  occupancyRate: number;
  maintenanceCosts: number;
  netIncome: number;
  roi: number;
}

export interface AnalyticsData {
  date: string;
  value: number;
  label: string;
}

export interface MarketInsights {
  priceRanges: { range: string; count: number }[];
  averageRent: number;
  marketTrends: { trend: string; value: number }[];
  competitorAnalysis: { metric: string; value: number; benchmark: number }[];
  demandHotspots: { location: string; score: number }[];
}

export interface FinancialMetrics {
  totalRevenue: number;
  averageRent: number;
  monthlyGrowth: number;
  yearlyProjection: number;
  operatingCosts: number;
  netOperatingIncome: number;
  cashOnCashReturn: number;
  occupancyRate: number;
}

export interface Property extends BaseProperty {
  views?: number;
  chat_rooms?: any[];
  property_financial_metrics?: PropertyFinancialMetrics[];
  property_transactions?: PropertyTransaction[];
}

export class AnalyticsService {
  // Get property metrics for a landlord
  static async getPropertyMetrics(landlordId: string): Promise<PropertyMetrics[]> {
    if (!landlordId) return [];
    
    try {
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          *,
          chat_rooms (*),
          property_financial_metrics (*),
          property_transactions (*)
        `)
        .eq('landlord_id', landlordId);

      if (propertiesError) throw propertiesError;
      if (!properties?.length) return [];

      // Get actual view counts for all properties
      const { data: viewsData } = await supabase
        .from('property_views')
        .select('property_id, count')
        .in('property_id', properties.map(p => p.id));

      const metrics = await Promise.all(properties.map(async (property: Property) => {
        const inquiries = property.chat_rooms?.length ?? 0;
        const daysOnMarket = property.created_at ? 
          Math.floor((Date.now() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 
          0;
        
        // Get actual views for this property
        const views = viewsData?.filter(v => v.property_id === property.id)
          .reduce((sum, v) => sum + (v.count || 0), 0) ?? 0;
        
        const conversionRate = views > 0 ? Math.min((inquiries / views) * 100, 100) : 0;
        const averageRating = property.average_rating ?? 0;
        
        // Calculate price per square foot only if both price and square_feet are available
        const pricePerSqFt = (property.price && property.square_feet && property.square_feet > 0) ? 
          Math.round(property.price / property.square_feet) : 
          0;
        
        // Get financial metrics with proper null checks
        const financialMetrics = property.property_financial_metrics?.[0] ?? {
          total_revenue: 0,
          total_expenses: 0,
          net_income: 0,
          occupancy_rate: 0
        };

        // Calculate maintenance costs from transactions with proper null checks
        const maintenanceCosts = property.property_transactions
          ?.filter(t => t?.transaction_type === 'maintenance_cost' && t?.status === 'completed')
          .reduce((sum, t) => sum + (t?.amount ?? 0), 0) ?? 0;

        // Calculate ROI with null checks
        const totalInvestment = property.price ?? 0;
        const netIncome = financialMetrics.net_income ?? 0;
        const roi = totalInvestment > 0 ? (netIncome / totalInvestment) * 100 : 0;
        
        // Calculate scores based on real metrics
        const popularityScore = Math.min(
          50 + // Base score
          (views > 0 ? 25 : 0) + // Has views
          (inquiries > 0 ? 25 : 0), // Has inquiries
          100
        );
        
        const profitabilityScore = Math.min(
          50 + // Base score
          (netIncome > 0 ? 25 : 0) + // Profitable
          (roi > 0 ? 25 : 0), // Positive ROI
          100
        );
        
        const marketScore = Math.min(
          50 + // Base score
          (property.status === 'active' ? 25 : 0) + // Active listing
          (financialMetrics.occupancy_rate > 80 ? 25 : 0), // High occupancy
          100
        );
        
        const overallScore = Math.round((popularityScore + profitabilityScore + marketScore) / 3);

        return {
          id: property.id,
          views,
          inquiries,
          conversionRate: Math.round(conversionRate * 10) / 10,
          averageRating: Math.round(averageRating * 10) / 10,
          daysOnMarket,
          pricePerSqFt,
          marketScore: Math.round(marketScore),
          popularityScore: Math.round(popularityScore),
          profitabilityScore: Math.round(profitabilityScore),
          overallScore,
          occupancyRate: financialMetrics.occupancy_rate ?? 0,
          maintenanceCosts,
          netIncome,
          roi: Math.round(roi * 100) / 100
        };
      }));

      return metrics;
    } catch (error) {
      console.error('Error fetching property metrics:', error);
      return [];
    }
  }

  // Generate analytics chart data based on real database data with improved query efficiency
  static async generateRealChartData(landlordId: string, type: string, timeRange: string): Promise<AnalyticsData[]> {
    if (!landlordId) return [];
    
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const data: AnalyticsData[] = [];
    
    try {
      // Fetch all required data in one go for the entire date range
      const { data: properties } = await supabase
        .from('properties')
        .select('id, created_at, status')
        .eq('landlord_id', landlordId)
        .gte('created_at', startDate.toISOString());

      const { data: chatRooms } = await supabase
        .from('chat_rooms')
        .select('created_at, properties!inner(landlord_id)')
        .eq('properties.landlord_id', landlordId)
        .gte('created_at', startDate.toISOString());

      // Get actual property views from analytics
      const { data: viewsData } = await supabase
        .from('property_views')
        .select('property_id, view_date, count')
        .eq('landlord_id', landlordId)
        .gte('view_date', startDate.toISOString());

      // Get actual transactions for revenue calculation
      const { data: transactions } = await supabase
        .from('property_transactions')
        .select('*')
        .eq('status', 'completed')
        .in('transaction_type', ['rent_payment', 'deposit', 'other_income'])
        .gte('payment_date', startDate.toISOString());
      
      // Generate daily data points
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        let value = 0;
        
        switch (type) {
          case "revenue": {
            // Calculate actual revenue from completed transactions
            value = transactions?.filter(t => 
              new Date(t.payment_date).toISOString().split('T')[0] === dateStr
            ).reduce((sum, t) => sum + (t.amount || 0), 0) ?? 0;
            break;
          }
            
          case "views": {
            // Use actual view counts from analytics
            value = viewsData?.filter(v => 
              v.view_date === dateStr
            ).reduce((sum, v) => sum + (v.count || 0), 0) ?? 0;
            break;
          }
            
          case "inquiries": {
            value = chatRooms?.filter(cr => 
              new Date(cr.created_at).toISOString().split('T')[0] === dateStr
            ).length ?? 0;
            break;
          }
            
          default:
            value = 0;
        }
        
        data.push({
          date: dateStr,
          value: Math.max(value, 0),
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error generating chart data:', error);
      return [];
    }
  }

  // Get property performance metrics
  static async getPropertyPerformance(properties: Property[]): Promise<PropertyMetrics[]> {
    try {
      if (!properties.length) return [];

      const propertyIds = properties.map(p => p.id);

      // Fetch financial metrics for all properties
      const { data: financialMetrics } = await supabase
        .from('property_financial_metrics')
        .select('*')
        .in('property_id', propertyIds);

      // Fetch all transactions for all properties
      const { data: transactions } = await supabase
        .from('property_transactions')
        .select('*')
        .in('property_id', propertyIds);

      // Fetch views for all properties
      const { data: viewsData } = await supabase
        .from('property_views')
        .select('*')
        .in('property_id', propertyIds);

      // Map metrics for each property
      const metrics = properties.map(property => {
        const propertyMetrics = financialMetrics?.find(m => m.property_id === property.id);
        const propertyTransactions = transactions?.filter(t => t.property_id === property.id) || [];
        const propertyViews = viewsData?.find(v => v.property_id === property.id)?.count || 0;

        const daysOnMarket = Math.floor(
          (Date.now() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Calculate actual revenue from completed transactions
        const revenue = propertyTransactions
          .filter(t => t.status === 'completed' && ['rent_payment', 'deposit', 'other_income'].includes(t.transaction_type))
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        // Calculate total expenses from completed transactions
        const expenses = propertyTransactions
          .filter(t => t.status === 'completed' && ['maintenance_cost', 'utility_payment', 'insurance', 'tax', 'other_expense'].includes(t.transaction_type))
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        // Calculate maintenance costs from completed transactions
        const maintenanceCosts = propertyTransactions
          .filter(t => t.transaction_type === 'maintenance_cost' && t.status === 'completed')
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        // Calculate net income from actual transactions
        const netIncome = revenue - expenses;

        // Calculate ROI using actual revenue and expenses
        const totalInvestment = property.price || 0;
        const roi = totalInvestment > 0 ? (netIncome / totalInvestment) * 100 : 0;

        // Calculate scores based on real metrics
        const popularityScore = Math.min(
          50 + // Base score
          (propertyViews > 0 ? 25 : 0) + // Has views
          (propertyTransactions.length > 0 ? 25 : 0), // Has transactions
          100
        );

        const profitabilityScore = Math.min(
          50 + // Base score
          (netIncome > 0 ? 25 : 0) + // Profitable
          (roi > 0 ? 25 : 0), // Positive ROI
          100
        );

        const marketScore = Math.min(
          50 + // Base score
          (property.status === 'active' ? 25 : 0) + // Active listing
          (propertyMetrics?.occupancy_rate > 80 ? 25 : 0), // High occupancy
          100
        );

        const overallScore = Math.round((popularityScore + profitabilityScore + marketScore) / 3);

        return {
          id: property.id,
          views: propertyViews,
          inquiries: propertyTransactions.length,
          conversionRate: propertyViews > 0 ? Math.min((propertyTransactions.length / propertyViews) * 100, 100) : 0,
          averageRating: property.average_rating ?? 0,
          daysOnMarket,
          pricePerSqFt: property.price && property.square_feet ? Math.round(property.price / property.square_feet) : 0,
          marketScore: Math.round(marketScore),
          popularityScore: Math.round(popularityScore),
          profitabilityScore: Math.round(profitabilityScore),
          overallScore,
          occupancyRate: propertyMetrics?.occupancy_rate || 0,
          maintenanceCosts,
          netIncome,
          roi: Math.round(roi * 100) / 100
        };
      });

      return metrics;
    } catch (error) {
      console.error('Error calculating property performance:', error);
      return [];
    }
  }

  // Enhanced market insights with real data analysis
  static async getMarketInsights(properties: Property[]): Promise<MarketInsights> {
    try {
      // Calculate price ranges
      const priceRanges = this.calculatePriceRanges(properties);
      
      // Calculate average rent
      const averageRent = properties.reduce((sum, p) => sum + (p.price || 0), 0) / properties.length;

      // Analyze market trends
      const priceGrowth = await this.calculatePriceGrowth(properties);
      const marketTrends = [
        { trend: "Price Growth", value: priceGrowth },
        { trend: "Demand Index", value: this.calculateDemandIndex(properties) },
        { trend: "Market Saturation", value: this.calculateMarketSaturation(properties) }
      ];

      // Analyze competition
      const competitorAnalysis = await this.analyzeCompetition(properties);

      // Identify demand hotspots
      const demandHotspots = await this.analyzeDemandByLocation(properties);

      return {
        priceRanges,
        averageRent,
        marketTrends,
        competitorAnalysis,
        demandHotspots
      };
    } catch (error) {
      console.error('Error getting market insights:', error);
      return {
        priceRanges: [],
        averageRent: 0,
        marketTrends: [],
        competitorAnalysis: [],
        demandHotspots: []
      };
    }
  }

  // Enhanced financial metrics with comprehensive analysis
  static async getFinancialMetrics(properties: Property[]): Promise<FinancialMetrics> {
    try {
      if (!properties.length) {
        return {
          totalRevenue: 0,
          averageRent: 0,
          monthlyGrowth: 0,
          yearlyProjection: 0,
          operatingCosts: 0,
          netOperatingIncome: 0,
          cashOnCashReturn: 0,
          occupancyRate: 0
        };
      }

      const propertyIds = properties.map(p => p.id);

      // Get all completed transactions for the properties
      const { data: transactions, error: transactionsError } = await supabase
        .from('property_transactions')
        .select('*')
        .in('property_id', propertyIds)
        .eq('status', 'completed');

      if (transactionsError) throw transactionsError;

      // Calculate revenue from actual transactions
      const revenue = transactions
        ?.filter(t => ['rent_payment', 'deposit', 'other_income'].includes(t.transaction_type))
        .reduce((sum, t) => sum + (t.amount || 0), 0) ?? 0;

      // Calculate operating costs from actual transactions
      const operatingCosts = transactions
        ?.filter(t => ['maintenance_cost', 'utility_payment', 'insurance', 'tax', 'other_expense'].includes(t.transaction_type))
        .reduce((sum, t) => sum + (t.amount || 0), 0) ?? 0;

      // Calculate net operating income
      const netOperatingIncome = revenue - operatingCosts;

      // Calculate average rent from actual rent payments
      const rentPayments = transactions
        ?.filter(t => t.transaction_type === 'rent_payment')
        .reduce((sum, t) => sum + (t.amount || 0), 0) ?? 0;
      const averageRent = properties.length > 0 ? rentPayments / properties.length : 0;

      // Calculate monthly growth based on actual rent payments
      const monthlyGrowth = await this.calculateMonthlyGrowth(properties);

      // Project yearly revenue based on actual transactions
      const yearlyProjection = revenue * (1 + (monthlyGrowth / 100) * 12);

      // Calculate cash on cash return using actual net income
      const totalInvestment = properties.reduce((sum, p) => sum + (p.price || 0), 0);
      const cashOnCashReturn = totalInvestment > 0 
        ? (netOperatingIncome / totalInvestment) * 100 
        : 0;

      // Calculate actual occupancy rate
      const occupancyRate = await this.calculateOccupancyRate(properties);

      return {
        totalRevenue: Math.round(revenue * 100) / 100,
        averageRent: Math.round(averageRent * 100) / 100,
        monthlyGrowth: Math.round(monthlyGrowth * 1000) / 10, // Convert to percentage
        yearlyProjection: Math.round(yearlyProjection * 100) / 100,
        operatingCosts: Math.round(operatingCosts * 100) / 100,
        netOperatingIncome: Math.round(netOperatingIncome * 100) / 100,
        cashOnCashReturn: Math.round(cashOnCashReturn * 100) / 100,
        occupancyRate: Math.round(occupancyRate * 100) / 100
      };
    } catch (error) {
      console.error('Error calculating financial metrics:', error);
      return {
        totalRevenue: 0,
        averageRent: 0,
        monthlyGrowth: 0,
        yearlyProjection: 0,
        operatingCosts: 0,
        netOperatingIncome: 0,
        cashOnCashReturn: 0,
        occupancyRate: 0
      };
    }
  }

  // Legacy calculation method as fallback
  private static async calculateLegacyFinancialMetrics(properties: Property[]): Promise<FinancialMetrics> {
    const totalRevenue = properties.reduce((sum, p) => sum + (p.price || 0), 0);
    const averageRent = totalRevenue / properties.length;
    
    // Calculate monthly growth
    const monthlyGrowth = await this.calculateMonthlyGrowth(properties);
    
    // Project yearly revenue
    const yearlyProjection = totalRevenue * 12 * (1 + monthlyGrowth / 100);
    
    // Calculate operating costs (estimated as 30% of revenue)
    const operatingCosts = totalRevenue * 0.3;
    
    // Calculate net operating income
    const netOperatingIncome = totalRevenue - operatingCosts;
    
    // Calculate cash on cash return (estimated)
    const totalInvestment = totalRevenue * 5; // Estimated property value
    const cashOnCashReturn = (netOperatingIncome / totalInvestment) * 100;
    
    // Calculate occupancy rate
    const occupancyRate = await this.calculateOccupancyRate(properties);

    return {
      totalRevenue,
      averageRent,
      monthlyGrowth,
      yearlyProjection,
      operatingCosts,
      netOperatingIncome,
      cashOnCashReturn,
      occupancyRate
    };
  }

  // Helper methods for market analysis
  private static calculatePriceRanges(properties: Property[]) {
    const ranges = [
      { min: 0, max: 500000, label: '0-500k' },
      { min: 500000, max: 1000000, label: '500k-1M' },
      { min: 1000000, max: 2000000, label: '1M-2M' },
      { min: 2000000, max: 5000000, label: '2M-5M' },
      { min: 5000000, max: Infinity, label: '5M+' }
    ];

    return ranges.map(range => ({
      range: range.label,
      count: properties.filter(p => 
        (p.price || 0) >= range.min && (p.price || 0) < range.max
      ).length
    }));
  }

  private static async calculateMonthlyGrowth(properties: Property[]): Promise<number> {
    try {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const { data: lastMonthProperties } = await supabase
        .from('properties')
        .select('price')
        .lt('created_at', lastMonth.toISOString());
      
      if (!lastMonthProperties?.length) return 0;
      
      const lastMonthAvg = lastMonthProperties.reduce((sum, p) => sum + (p.price || 0), 0) / lastMonthProperties.length;
      const currentAvg = properties.reduce((sum, p) => sum + (p.price || 0), 0) / properties.length;
      
      return ((currentAvg - lastMonthAvg) / lastMonthAvg) * 100;
    } catch (error) {
      console.error('Error calculating monthly growth:', error);
      return 0;
    }
  }

  private static async calculateOccupancyRate(properties: Property[]): Promise<number> {
    const totalProperties = properties.length;
    const rentedProperties = properties.filter(p => p.status === 'rented').length;
    return totalProperties > 0 ? (rentedProperties / totalProperties) * 100 : 0;
  }

  private static calculateDemandIndex(properties: Property[]): number {
    // Calculate demand based on views and inquiries
    const totalProperties = properties.length;
    if (totalProperties === 0) return 0;
    
    return Math.min(
      properties.reduce((sum, p) => sum + (p.views || 0), 0) / totalProperties,
      100
    );
  }

  private static calculateMarketSaturation(properties: Property[]): number {
    // Calculate market saturation based on active listings vs total
    const activeListings = properties.filter(p => p.status === 'active').length;
    return properties.length > 0 ? (activeListings / properties.length) * 100 : 0;
  }

  private static async analyzeCompetition(properties: Property[]): Promise<{ metric: string; value: number; benchmark: number }[]> {
    try {
      const avgPrice = properties.reduce((sum, p) => sum + (p.price || 0), 0) / properties.length;
      
      const { data: marketProperties } = await supabase
        .from('properties')
        .select('price, status');
      
      const marketAvgPrice = marketProperties?.reduce((sum, p) => sum + (p.price || 0), 0) || 0;
      const marketCount = marketProperties?.length || 1;
      
      return [
        {
          metric: "Average Price",
          value: avgPrice,
          benchmark: marketAvgPrice / marketCount
        },
        {
          metric: "Market Share",
          value: (properties.length / marketCount) * 100,
          benchmark: 100 / marketCount
        }
      ];
    } catch (error) {
      console.error('Error analyzing competition:', error);
      return [];
    }
  }

  private static async analyzeDemandByLocation(properties: Property[]): Promise<{ location: string; score: number }[]> {
    try {
      const locations = properties.reduce((acc, p) => {
        if (p.location) {
          const area = p.location.split(',')[0].trim();
          acc[area] = (acc[area] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      return Object.entries(locations)
        .map(([location, count]) => ({
          location,
          score: (count / properties.length) * 100
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    } catch (error) {
      console.error('Error analyzing demand by location:', error);
      return [];
    }
  }

  // Export analytics data to CSV
  static exportAnalyticsData(propertyPerformance: any[], filename: string = 'property-analytics') {
    const csvContent = [
      ['Property', 'Price', 'Status', 'Views', 'Inquiries', 'Conversion Rate', 'Revenue'],
      ...propertyPerformance.map(p => [
        p.title,
        p.price || 0,
        p.status,
        p.views,
        p.inquiries,
        `${p.conversionRate}%`,
        p.revenue
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Get user activity data
  static async getUserActivityData(timeRange: string): Promise<AnalyticsData[]> {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const data: AnalyticsData[] = [];
    
    try {
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        // Get users who were active on this date
        const { data: activeUsers, error } = await supabase
          .from('profiles')
          .select('id')
          .gte('last_sign_in_at', dateStr)
          .lt('last_sign_in_at', nextDay.toISOString().split('T')[0]);
        
        if (error) throw error;
        
        data.push({
          date: dateStr,
          value: activeUsers?.length || 0,
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error generating user activity data:', error);
      return Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        return {
          date: date.toISOString().split('T')[0],
          value: 0,
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
      });
    }
  }

  // Add calculatePriceGrowth method
  private static async calculatePriceGrowth(properties: Property[]): Promise<number> {
    if (!properties.length) return 0;
    
    // Calculate average price growth over time
    const sortedProperties = [...properties].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    const oldestPrice = sortedProperties[0].price;
    const newestPrice = sortedProperties[sortedProperties.length - 1].price;
    
    if (!oldestPrice || !newestPrice) return 0;
    
    const monthsDiff = (new Date().getTime() - new Date(sortedProperties[0].created_at).getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsDiff < 1) return 0;
    
    const growth = ((newestPrice - oldestPrice) / oldestPrice) * 100;
    return Math.round((growth / monthsDiff) * 100) / 100; // Monthly growth rate
  }
} 