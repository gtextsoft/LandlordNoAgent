import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, Plus, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Filter } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface RevenueTrackingProps {
  propertyId?: string; // Optional - if provided, shows data for specific property
}

interface Transaction {
  id: string;
  property_id: string;
  transaction_type: 'rent_payment' | 'deposit' | 'maintenance_cost' | 'utility_payment' | 'insurance' | 'tax' | 'other_income' | 'other_expense';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  due_date?: string;
  payment_date?: string;
  description?: string;
  recurring: boolean;
  recurrence_interval?: string;
}

interface FinancialMetrics {
  total_revenue: number;
  total_expenses: number;
  net_income: number;
  occupancy_rate: number;
}

const RevenueTracking = () => {
  const { user, hasRole } = useAuth();
  
  // Ensure only landlords can access this component
  if (!hasRole('landlord')) {
    return <Navigate to="/" replace />;
  }

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    transaction_type: 'rent_payment',
    status: 'pending',
    recurring: false,
  });
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'last_month' | 'this_year'>('this_month');
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
    fetchMetrics();
  }, [dateFilter]);

  const fetchTransactions = async () => {
    try {
      // The RLS policies will automatically filter to show only the landlord's data
      const { data: transactions, error } = await supabase
        .from('property_transactions')
        .select(`
          *,
          properties:property_id (
            title,
            address
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transaction data",
        variant: "destructive",
      });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      // The RLS policies will automatically filter to show only the landlord's data
      const { data: metrics, error } = await supabase
        .from('property_financial_metrics')
        .select(`
          *,
          properties:property_id (
            title,
            address
          )
        `);

      if (error) throw error;
      
      if (metrics && metrics.length > 0) {
        const aggregatedMetrics = metrics.reduce((acc, curr) => ({
          total_revenue: acc.total_revenue + curr.total_revenue,
          total_expenses: acc.total_expenses + curr.total_expenses,
          net_income: acc.net_income + curr.net_income,
          occupancy_rate: acc.occupancy_rate + curr.occupancy_rate / metrics.length, // Average occupancy
        }), {
          total_revenue: 0,
          total_expenses: 0,
          net_income: 0,
          occupancy_rate: 0,
        });
        
        setMetrics(aggregatedMetrics);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load financial metrics",
        variant: "destructive",
      });
      setMetrics(null);
    }
  };

  const handleAddTransaction = async () => {
    try {
      if (!newTransaction.amount || !newTransaction.transaction_type) {
        throw new Error("Please fill in all required fields");
      }

      const { error } = await supabase
        .from('property_transactions')
        .insert({
          ...newTransaction,
          property_id: user?.id,
          due_date: selectedDate?.toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Transaction added",
        description: "The transaction has been recorded successfully.",
      });

      setShowAddTransaction(false);
      setNewTransaction({
        transaction_type: 'rent_payment',
        status: 'pending',
        recurring: false,
      });
      setSelectedDate(undefined);
      fetchTransactions();
      fetchMetrics();
    } catch (error: any) {
      toast({
        title: "Error adding transaction",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{metrics?.total_revenue.toLocaleString()}</div>
            <p className="text-xs text-gray-500">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{metrics?.total_expenses.toLocaleString()}</div>
            <p className="text-xs text-gray-500">+4.5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{metrics?.net_income.toLocaleString()}</div>
            <p className="text-xs text-gray-500">+12.3% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.occupancy_rate.toFixed(1)}%</div>
            <p className="text-xs text-gray-500">+2.5% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transactions</CardTitle>
          <div className="flex items-center space-x-2">
            <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value as 'all' | 'this_month' | 'last_month' | 'this_year')}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowAddTransaction(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    "p-2 rounded-full",
                    transaction.transaction_type.includes('payment') || transaction.transaction_type === 'deposit'
                      ? "bg-green-100"
                      : "bg-red-100"
                  )}>
                    {transaction.transaction_type.includes('payment') || transaction.transaction_type === 'deposit' ? (
                      <ArrowUpRight className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{transaction.description || transaction.transaction_type.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-500">
                      {transaction.due_date && format(new Date(transaction.due_date), 'PPP')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-medium",
                    transaction.transaction_type.includes('payment') || transaction.transaction_type === 'deposit'
                      ? "text-green-600"
                      : "text-red-600"
                  )}>
                    {transaction.transaction_type.includes('payment') || transaction.transaction_type === 'deposit'
                      ? `+₦${transaction.amount.toLocaleString()}`
                      : `-₦${transaction.amount.toLocaleString()}`
                    }
                  </p>
                  <p className="text-sm text-gray-500">{transaction.status}</p>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No transactions found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Transaction Dialog */}
      <Dialog open={showAddTransaction} onOpenChange={setShowAddTransaction}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Transaction Type</Label>
              <Select
                value={newTransaction.transaction_type}
                onValueChange={(value: any) => setNewTransaction({ ...newTransaction, transaction_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select transaction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rent_payment">Rent Payment</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="maintenance_cost">Maintenance Cost</SelectItem>
                  <SelectItem value="utility_payment">Utility Payment</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="tax">Tax</SelectItem>
                  <SelectItem value="other_income">Other Income</SelectItem>
                  <SelectItem value="other_expense">Other Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Amount (₦)</Label>
              <Input
                type="number"
                value={newTransaction.amount || ''}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) })}
                placeholder="Enter amount"
              />
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={newTransaction.description || ''}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                placeholder="Enter description"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={newTransaction.status}
                onValueChange={(value: any) => setNewTransaction({ ...newTransaction, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTransaction(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTransaction}>
              Add Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RevenueTracking; 