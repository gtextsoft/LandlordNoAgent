import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Building, 
  UserCheck, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Home,
  Shield,
  Zap,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { UserRoleType } from "@/lib/supabase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRoleType>("renter");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, signIn, profile, hasRole } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (profile) {
      if (hasRole('landlord')) {
        navigate('/landlord');
      } else {
        navigate('/');
      }
    }
  }, [profile, navigate, hasRole]);

  // Password strength checker
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }
    
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) strength += 25;
    
    setPasswordStrength(strength);
  }, [password]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength >= 75) return "bg-green-500";
    if (passwordStrength >= 50) return "bg-yellow-500";
    if (passwordStrength >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength >= 75) return "Strong";
    if (passwordStrength >= 50) return "Medium";
    if (passwordStrength >= 25) return "Weak";
    return "Very Weak";
  };

  const validRoles: UserRoleType[] = ["renter", "landlord", "admin"];

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Frontend role validation
    if (!validRoles.includes(role)) {
      toast({
        title: "Invalid Role",
        description: `Role must be one of: ${validRoles.join(", ")}`,
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await signUp(email, password, role, fullName);

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to create account. Please try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Account created!",
          description: "Check your email to confirm your account.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
      } else {
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back to home link */}
        <Link 
          to="/" 
          className="inline-flex items-center text-slate-600 hover:text-blue-600 mb-8 transition-all duration-200 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="font-medium">Back to home</span>
        </Link>

        {/* Main card */}
        <Card className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl shadow-blue-500/10">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Home className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome to LandLord
            </CardTitle>
            <CardDescription className="text-slate-600 mt-2">
              Sign in to your account or create a new one to get started
            </CardDescription>
          </CardHeader>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mx-6 mb-6 bg-slate-100/80">
              <TabsTrigger 
                value="signin" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            {/* Sign In Tab */}
            <TabsContent value="signin" className="mx-0">
              <form onSubmit={handleSignIn} className="space-y-6">
                <CardContent className="space-y-5 pt-0">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-slate-700 font-medium">
                      Email Address
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 h-12 bg-slate-50/80 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-slate-700 font-medium">
                      Password
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 pr-10 h-12 bg-slate-50/80 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link 
                      to="/forgot-password" 
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-200"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 text-white font-medium"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      <span className="flex items-center space-x-2">
                        <span>Sign In</span>
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                      </span>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup" className="mx-0">
              <form onSubmit={handleSignUp} className="space-y-6">
                <CardContent className="space-y-5 pt-0">
                  {/* Role Selection */}
                  <div className="space-y-3">
                    <Label className="text-slate-700 font-medium">Choose your account type:</Label>
                    <RadioGroup 
                      value={role} 
                      onValueChange={(value) => setRole(value as UserRoleType)} 
                      className="grid grid-cols-2 gap-3"
                    >
                      <div className="relative">
                        <RadioGroupItem value="renter" id="renter" className="peer sr-only" />
                        <Label 
                          htmlFor="renter" 
                          className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-50/50 p-4 hover:bg-slate-50 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 cursor-pointer transition-all duration-200 group"
                        >
                          <UserCheck className="w-6 h-6 mb-2 text-slate-400 group-hover:text-blue-500 peer-data-[state=checked]:text-blue-600 transition-colors duration-200" />
                          <span className="font-medium text-slate-700 group-hover:text-slate-900 peer-data-[state=checked]:text-blue-700">
                            Renter
                          </span>
                          <span className="text-xs text-slate-500 mt-1 text-center">
                            Looking for properties
                          </span>
                        </Label>
                      </div>
                      <div className="relative">
                        <RadioGroupItem value="landlord" id="landlord" className="peer sr-only" />
                        <Label 
                          htmlFor="landlord" 
                          className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-50/50 p-4 hover:bg-slate-50 peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:bg-indigo-50 cursor-pointer transition-all duration-200 group"
                        >
                          <Building className="w-6 h-6 mb-2 text-slate-400 group-hover:text-indigo-500 peer-data-[state=checked]:text-indigo-600 transition-colors duration-200" />
                          <span className="font-medium text-slate-700 group-hover:text-slate-900 peer-data-[state=checked]:text-indigo-700">
                            Landlord
                          </span>
                          <span className="text-xs text-slate-500 mt-1 text-center">
                            Managing properties
                          </span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullname" className="text-slate-700 font-medium">
                      Full Name
                    </Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                      <Input
                        id="fullname"
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="pl-10 h-12 bg-slate-50/80 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-slate-700 font-medium">
                      Email Address
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 h-12 bg-slate-50/80 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-slate-700 font-medium">
                      Password
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a secure password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 pr-10 h-12 bg-slate-50/80 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {password && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Password strength:</span>
                          <span className={`font-medium ${
                            passwordStrength >= 75 ? 'text-green-600' :
                            passwordStrength >= 50 ? 'text-yellow-600' :
                            passwordStrength >= 25 ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {getPasswordStrengthText()}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                            style={{ width: `${passwordStrength}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Terms and Conditions */}
                  <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-200">
                    By creating an account, you agree to our{" "}
                    <Link to="/terms" className="text-blue-600 hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </Link>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 text-white font-medium"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Creating account...</span>
                      </div>
                    ) : (
                      <span className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Create Account</span>
                      </span>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="px-6 pb-6">
            <Separator className="mb-4" />
            <div className="flex items-center justify-center space-x-4 text-xs text-slate-500">
              <div className="flex items-center space-x-1">
                <Shield className="w-3 h-3" />
                <span>Secure</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3" />
                <span>Fast</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-3 h-3" />
                <span>Trusted</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
