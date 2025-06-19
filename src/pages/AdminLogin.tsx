
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Invalid credentials",
            description: "Please check your email and password.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

          <form onSubmit={handleSignIn}>
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
                className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 h-11"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  "Access Admin Panel"
                )}
              </Button>
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
