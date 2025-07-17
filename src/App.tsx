import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoadingSpinner from "@/components/LoadingSpinner";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import LandlordDashboard from "./pages/LandlordDashboard";
import NewListing from "./pages/NewListing";
import PropertyDetail from "./pages/PropertyDetail";
import PropertyChat from "./pages/PropertyChat";
import AdminPanel from "./pages/AdminPanel";
import AccountSettings from "./pages/AccountSettings";
import NotFound from "./pages/NotFound";
import SavedProperties from "./pages/SavedProperties";
import Contact from "./pages/Contact";
import Properties from "./pages/Properties";
import Messages from "./pages/Messages";
import LandlordProperties from "./pages/LandlordProperties";
import LandlordPropertyDetail from './pages/LandlordPropertyDetail';
import RenterPropertyDetail from './pages/RenterPropertyDetail';
import EditProperty from './pages/EditProperty';
import ApplicationManagement from './pages/ApplicationManagement';
import PaymentSuccess from '@/pages/PaymentSuccess';
import DemoPaymentGateway from '@/components/DemoPaymentGateway';
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import RenterDashboard from './pages/RenterDashboard';
import MyApplications from './pages/MyApplications';
import Analytics from './pages/Analytics';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PaymentGatewayWrapper() {
  const { applicationId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<{
    propertyId: string;
    amount: number;
  } | null>(null);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('rental_applications')
          .select(`
            id,
            property_id,
            rent_amount,
            status
          `)
          .eq('id', applicationId)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Application not found');

        // Check if application is approved
        if (data.status !== 'application_approved') {
          throw new Error('Application must be approved before payment');
        }

        setPaymentDetails({
          propertyId: data.property_id,
          amount: data.rent_amount
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      fetchPaymentDetails();
    }
  }, [applicationId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !paymentDetails) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Error: {error || 'Failed to load payment details'}</p>
      </div>
    );
  }

  return (
    <DemoPaymentGateway
      applicationId={applicationId!}
      propertyId={paymentDetails.propertyId}
      amount={paymentDetails.amount}
    />
  );
}

function AppContent() {
  const { user, loading, hasRole, primaryRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/" element={
          user ? (
            primaryRole === 'admin' ?
              <Navigate to="/admin" replace /> :
            primaryRole === 'landlord' ?
              <Navigate to="/landlord" replace /> :
            primaryRole === 'renter' ?
              <Navigate to="/renter" replace /> :
              // No valid role
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
                  <p className="text-gray-700">Your account does not have a valid role assigned. Please contact support.</p>
                </div>
              </div>
          ) : (
            <Navigate to="/landing" replace />
          )
        } />
        <Route
          path="/renter"
          element={
            <ProtectedRoute>
              <RenterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-applications"
          element={
            <ProtectedRoute>
              <MyApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/saved-properties"
          element={
            <ProtectedRoute>
              <SavedProperties />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/:applicationId"
          element={
            <ProtectedRoute>
              <PaymentGatewayWrapper />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment-success/:applicationId"
          element={
            <ProtectedRoute>
              <PaymentSuccess />
            </ProtectedRoute>
          }
        />

        <Route
          path="/landlord"
          element={
            <ProtectedRoute allowedRoles={["landlord"]}>
              <LandlordDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/landlord/properties"
          element={
            <ProtectedRoute allowedRoles={["landlord"]}>
              <LandlordProperties />
            </ProtectedRoute>
          }
        />
        <Route
          path="/landlord/new"
          element={
            <ProtectedRoute allowedRoles={["landlord"]}>
              <NewListing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/landlord/edit/:id"
          element={
            <ProtectedRoute allowedRoles={["landlord"]}>
              <EditProperty />
            </ProtectedRoute>
          }
        />
        <Route
          path="/landlord/applications"
          element={
            <ProtectedRoute allowedRoles={["landlord"]}>
              <ApplicationManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/property/:id"
          element={
            <ProtectedRoute>
              <PropertyDetailRouter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/property/:id/chat"
          element={
            <ProtectedRoute>
              <PropertyChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={["landlord"]}>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/properties"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/database"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountSettings />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

function PropertyDetailRouter() {
  const { hasRole } = useAuth();
  if (hasRole('landlord')) {
    return <LandlordPropertyDetail />;
  } else {
    return <RenterPropertyDetail />;
  }
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppContent />
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
