import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { handleError, handleSuccess } from "@/utils/shared";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, profile, hasRole } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (profile) {
      if (hasRole('admin')) {
        navigate('/admin');
      } else {
        navigate('/');
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive"
        });
      }
    }
  }, [profile, navigate, hasRole, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (!profile || profile.role !== 'admin') {
          await supabase.auth.signOut();
          throw new Error("You don't have admin privileges.");
        }

        navigate('/admin');
        handleSuccess(toast, "Welcome to the admin panel!");
      }
    } catch (error: any) {
      handleError(error, toast, error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Temporary admin creation function (remove after first admin is created)
  const createFirstAdmin = async () => {
    try {
      const adminEmail = "admin@landlord.com";
      const adminPassword = "Admin123!"; // Change this password!
      
      console.log('Creating first admin account...');
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      console.log('Auth user created, now updating profile...');

      // Update profile to admin role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: 'admin',
          full_name: 'System Administrator'
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Profile error:', profileError);
        throw profileError;
      }

      alert(`Admin account created successfully!\nEmail: ${adminEmail}\nPassword: ${adminPassword}\n\nPlease change the password after first login!`);
      
    } catch (error: any) {
      console.error('Error creating admin:', error);
      alert(`Error creating admin: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center text-red-200 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>

        <Card className="bg-gray-800/90 backdrop-blur-sm border-red-800 shadow-2xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-800 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Admin Portal
            </CardTitle>
            <CardDescription className="text-red-200">
              Secure administrative access
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-red-200">Admin Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-red-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-gray-700/50 border-red-700 text-white placeholder-red-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-red-200">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-red-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Your admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 bg-gray-700/50 border-red-700 text-white placeholder-red-300"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-lg font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </>
                ) : (
                  "Access Admin Panel"
                )}
              </Button>
              
              {/* Temporary Admin Creation Button - Remove after first admin is created */}
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm mb-2">
                  <strong>First Time Setup:</strong> Click below to create the first admin account
                </p>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={createFirstAdmin}
                  className="w-full border-yellow-400 text-yellow-700 hover:bg-yellow-50"
                >
                  Create First Admin Account
                </Button>
                <p className="text-xs text-yellow-600 mt-2">
                  This will create: admin@landlord.com with password: Admin123!
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-4 text-center">
          <p className="text-red-200 text-sm">
            For regular access, use the{" "}
            <Link to="/login" className="text-red-400 hover:text-white underline">
              main login page
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
