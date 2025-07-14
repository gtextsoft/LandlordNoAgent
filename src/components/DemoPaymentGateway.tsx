import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  CreditCard, 
  Lock, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  Calendar,
  User
} from 'lucide-react';

interface DemoPaymentGatewayProps {
  applicationId: string;
  propertyId: string;
  amount: number;
  onSuccess?: () => void;
}

const DemoPaymentGateway = ({ applicationId, propertyId, amount, onSuccess }: DemoPaymentGatewayProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'details' | 'payment' | 'processing'>('details');
  
  // Form states
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const validateForm = () => {
    if (paymentMethod === 'card') {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
        toast({
          title: "Invalid Card Number",
          description: "Please enter a valid 16-digit card number.",
          variant: "destructive"
        });
        return false;
      }
      
      if (!expiryDate || expiryDate.length < 5) {
        toast({
          title: "Invalid Expiry Date",
          description: "Please enter a valid expiry date (MM/YY).",
          variant: "destructive"
        });
        return false;
      }
      
      if (!cvv || cvv.length < 3) {
        toast({
          title: "Invalid CVV",
          description: "Please enter a valid CVV code.",
          variant: "destructive"
        });
        return false;
      }
      
      if (!cardName.trim()) {
        toast({
          title: "Missing Cardholder Name",
          description: "Please enter the cardholder's name.",
          variant: "destructive"
        });
        return false;
      }
    }
    
    return true;
  };

  const processPayment = async () => {
    if (!validateForm()) return;
    
    setProcessing(true);
    setStep('processing');

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Update application status to payment_completed
      const { error: updateError } = await supabase
        .from('rental_applications')
        .update({ 
          status: 'payment_completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // Create a payment record (you might want to add a payments table)
      // For now, we'll just show success

      toast({
        title: "Payment Successful!",
        description: "Your rental payment has been processed successfully.",
      });

      // Navigate to success page
      navigate(`/payment-success/${applicationId}`);
      
      if (onSuccess) {
        onSuccess();
      }

    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "There was an error processing your payment. Please try again.",
        variant: "destructive"
      });
      setStep('payment');
    } finally {
      setProcessing(false);
    }
  };

  if (step === 'processing') {
    return (
      <div className="max-w-md mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <h3 className="text-lg font-semibold mb-2">Processing Payment...</h3>
            <p className="text-gray-600 mb-4">Please don't close this window</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-center">
                <Shield className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm text-blue-800">Secure Payment in Progress</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Payment</h2>
        <p className="text-gray-600">Secure your rental property with a quick payment</p>
      </div>

      {/* Payment Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Rental Amount</span>
            <span className="text-2xl font-bold text-gray-900">₦{amount.toLocaleString()}</span>
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total Amount</span>
            <span className="text-2xl font-bold text-green-600">₦{amount.toLocaleString()}</span>
          </div>
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              <span className="text-sm text-green-800">No hidden fees • Secure payment</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setPaymentMethod('card')}
            >
              <div className="flex items-center">
                <input 
                  type="radio" 
                  checked={paymentMethod === 'card'} 
                  onChange={() => setPaymentMethod('card')}
                  className="mr-3"
                />
                <CreditCard className="h-5 w-5 mr-2" />
                <span className="font-medium">Credit/Debit Card</span>
                <Badge variant="secondary" className="ml-auto">Recommended</Badge>
              </div>
            </div>
            
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                paymentMethod === 'bank' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setPaymentMethod('bank')}
            >
              <div className="flex items-center">
                <input 
                  type="radio" 
                  checked={paymentMethod === 'bank'} 
                  onChange={() => setPaymentMethod('bank')}
                  className="mr-3"
                />
                <User className="h-5 w-5 mr-2" />
                <span className="font-medium">Bank Transfer</span>
                <Badge variant="outline" className="ml-auto">Coming Soon</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      {paymentMethod === 'card' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Card Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                  maxLength={5}
                />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                  maxLength={4}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="cardName">Cardholder Name</Label>
              <Input
                id="cardName"
                placeholder="John Doe"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="billingAddress">Billing Address</Label>
              <Input
                id="billingAddress"
                placeholder="123 Main Street, City, State"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {paymentMethod === 'bank' && (
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Bank Transfer</h3>
            <p className="text-gray-600">
              Bank transfer payment option is coming soon. Please use card payment for now.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-center text-sm text-gray-600">
            <Lock className="h-4 w-4 mr-2" />
            <span>Your payment information is secured with 256-bit SSL encryption</span>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => navigate(-1)}
        >
          Cancel
        </Button>
        <Button 
          className="flex-1" 
          onClick={processPayment}
          disabled={processing || paymentMethod === 'bank'}
        >
          {processing ? 'Processing...' : `Pay ₦${amount.toLocaleString()}`}
        </Button>
      </div>

      {/* Demo Notice */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-800">Demo Payment Gateway</h4>
            <p className="text-sm text-yellow-700">
              This is a demonstration payment system. No real charges will be made. 
              Use any valid card format for testing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPaymentGateway; 