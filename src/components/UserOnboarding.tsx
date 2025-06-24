import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle, 
  User, 
  Home, 
  Heart, 
  Search, 
  MessageCircle,
  X,
  ArrowRight,
  Star,
  MapPin,
  Camera,
  Phone,
  Mail
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AnimatedCounter } from '@/components/AnimatedComponents';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
}

interface UserOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  userType?: 'renter' | 'landlord';
}

const UserOnboarding = ({ isOpen, onClose, onComplete, userType = 'renter' }: UserOnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [onboardingData, setOnboardingData] = useState({
    preferences: {
      location: '',
      budget: '',
      propertyType: '',
      bedrooms: '',
    },
    profile: {
      firstName: '',
      lastName: '',
      phone: '',
      occupation: '',
      bio: '',
    },
    goals: {
      timeline: '',
      priorities: [] as string[],
    }
  });

  const { profile } = useAuth();

  // Pre-fill profile data if available
  useEffect(() => {
    if (profile) {
      const [firstName = '', lastName = ''] = (profile.full_name || '').split(' ');
      setOnboardingData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          firstName,
          lastName,
          phone: '',
        }
      }));
    }
  }, [profile]);

  // Renter onboarding steps
  const renterSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to LandlordNoAgent!',
      description: 'Let\'s help you find your perfect home',
      icon: Home,
      component: WelcomeStep
    },
    {
      id: 'preferences',
      title: 'Your Preferences',
      description: 'Tell us what you\'re looking for',
      icon: Search,
      component: PreferencesStep
    },
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Help landlords get to know you',
      icon: User,
      component: ProfileStep
    },
    {
      id: 'goals',
      title: 'Your Goals',
      description: 'When are you looking to move?',
      icon: Heart,
      component: GoalsStep
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Start browsing properties',
      icon: CheckCircle,
      component: CompleteStep
    }
  ];

  // Landlord onboarding steps
  const landlordSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome Property Owner!',
      description: 'Let\'s get you set up to list properties',
      icon: Home,
      component: LandlordWelcomeStep
    },
    {
      id: 'profile',
      title: 'Your Profile',
      description: 'Build trust with potential renters',
      icon: User,
      component: LandlordProfileStep
    },
    {
      id: 'property-basics',
      title: 'Property Basics',
      description: 'Tell us about your property',
      icon: Home,
      component: PropertyBasicsStep
    },
    {
      id: 'complete',
      title: 'Ready to List!',
      description: 'Create your first property listing',
      icon: CheckCircle,
      component: LandlordCompleteStep
    }
  ];

  const steps = userType === 'landlord' ? landlordSteps : renterSteps;
  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => [...prev, currentStepData.id]);
      setCurrentStep(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const completeOnboarding = () => {
    // Save onboarding data to localStorage or API
    localStorage.setItem('onboardingCompleted', 'true');
    localStorage.setItem('onboardingData', JSON.stringify(onboardingData));
    onComplete();
  };

  const skipOnboarding = () => {
    localStorage.setItem('onboardingSkipped', 'true');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
              <p className="text-blue-100 mt-1">{currentStepData.description}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={skipOnboarding} className="text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-blue-100 mb-2">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="bg-blue-500/30" />
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="p-6 overflow-y-auto flex-1">
          <currentStepData.component 
            data={onboardingData}
            onDataChange={setOnboardingData}
            userType={userType}
          />
        </CardContent>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={skipOnboarding} className="text-gray-500">
                Skip for now
              </Button>
              <Button onClick={nextStep} className="flex items-center bg-blue-600 hover:bg-blue-700">
                {currentStep === steps.length - 1 ? (
                  <>
                    Complete
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Individual Step Components
const WelcomeStep = ({ userType }: any) => (
  <div className="text-center py-8">
    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <Home className="w-10 h-10 text-blue-600" />
    </div>
    <h2 className="text-2xl font-bold text-gray-900 mb-4">
      Find Your Perfect Home
    </h2>
    <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
      Connect directly with property owners, skip the agent fees, and discover amazing rental properties across Nigeria.
    </p>
    
    <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">
          <AnimatedCounter end={15000} suffix="+" />
        </div>
        <p className="text-xs text-gray-500">Properties</p>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">
          <AnimatedCounter end={50000} suffix="+" />
        </div>
        <p className="text-xs text-gray-500">Users</p>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">
          <AnimatedCounter end={96} suffix="%" />
        </div>
        <p className="text-xs text-gray-500">Success Rate</p>
      </div>
    </div>
  </div>
);

const PreferencesStep = ({ data, onDataChange }: any) => (
  <div className="space-y-6">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Preferred Location
      </label>
      <Input
        placeholder="e.g., Lekki, Victoria Island, Ikeja..."
        value={data.preferences.location}
        onChange={(e) => onDataChange((prev: any) => ({
          ...prev,
          preferences: { ...prev.preferences, location: e.target.value }
        }))}
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Monthly Budget (₦)
        </label>
        <Input
          placeholder="e.g., 500,000"
          value={data.preferences.budget}
          onChange={(e) => onDataChange((prev: any) => ({
            ...prev,
            preferences: { ...prev.preferences, budget: e.target.value }
          }))}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bedrooms
        </label>
        <select 
          className="w-full p-3 border border-gray-300 rounded-lg"
          value={data.preferences.bedrooms}
          onChange={(e) => onDataChange((prev: any) => ({
            ...prev,
            preferences: { ...prev.preferences, bedrooms: e.target.value }
          }))}
        >
          <option value="">Any</option>
          <option value="studio">Studio</option>
          <option value="1">1 Bedroom</option>
          <option value="2">2 Bedrooms</option>
          <option value="3">3 Bedrooms</option>
          <option value="4+">4+ Bedrooms</option>
        </select>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Property Type
      </label>
      <div className="grid grid-cols-3 gap-3">
        {['Apartment', 'House', 'Studio'].map((type) => (
          <button
            key={type}
            onClick={() => onDataChange((prev: any) => ({
              ...prev,
              preferences: { ...prev.preferences, propertyType: type }
            }))}
            className={`p-4 border rounded-lg text-center transition-colors ${
              data.preferences.propertyType === type
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Home className="w-6 h-6 mx-auto mb-2" />
            <span className="font-medium">{type}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

const ProfileStep = ({ data, onDataChange }: any) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          First Name
        </label>
        <Input
          value={data.profile.firstName}
          onChange={(e) => onDataChange((prev: any) => ({
            ...prev,
            profile: { ...prev.profile, firstName: e.target.value }
          }))}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Last Name
        </label>
        <Input
          value={data.profile.lastName}
          onChange={(e) => onDataChange((prev: any) => ({
            ...prev,
            profile: { ...prev.profile, lastName: e.target.value }
          }))}
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Phone Number
      </label>
      <Input
        placeholder="+234 XXX XXX XXXX"
        value={data.profile.phone}
        onChange={(e) => onDataChange((prev: any) => ({
          ...prev,
          profile: { ...prev.profile, phone: e.target.value }
        }))}
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Occupation
      </label>
      <Input
        placeholder="e.g., Software Engineer, Teacher, Student..."
        value={data.profile.occupation}
        onChange={(e) => onDataChange((prev: any) => ({
          ...prev,
          profile: { ...prev.profile, occupation: e.target.value }
        }))}
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Brief Bio (Optional)
      </label>
      <Textarea
        placeholder="Tell landlords a bit about yourself..."
        rows={3}
        value={data.profile.bio}
        onChange={(e) => onDataChange((prev: any) => ({
          ...prev,
          profile: { ...prev.profile, bio: e.target.value }
        }))}
      />
    </div>
  </div>
);

const GoalsStep = ({ data, onDataChange }: any) => (
  <div className="space-y-6">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        When are you looking to move?
      </label>
      <div className="grid grid-cols-2 gap-3">
        {[
          'Immediately',
          'Within 1 month',
          'Within 3 months',
          'Just browsing'
        ].map((timeline) => (
          <button
            key={timeline}
            onClick={() => onDataChange((prev: any) => ({
              ...prev,
              goals: { ...prev.goals, timeline }
            }))}
            className={`p-4 border rounded-lg text-center transition-colors ${
              data.goals.timeline === timeline
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            {timeline}
          </button>
        ))}
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        What's most important to you? (Select all that apply)
      </label>
      <div className="grid grid-cols-2 gap-3">
        {[
          'Low rent',
          'Good location',
          'Modern amenities',
          'Security',
          'Parking space',
          'Pet-friendly'
        ].map((priority) => (
          <button
            key={priority}
            onClick={() => {
              const priorities = data.goals.priorities || [];
              const newPriorities = priorities.includes(priority)
                ? priorities.filter((p: string) => p !== priority)
                : [...priorities, priority];
              
              onDataChange((prev: any) => ({
                ...prev,
                goals: { ...prev.goals, priorities: newPriorities }
              }));
            }}
            className={`p-3 border rounded-lg text-sm transition-colors ${
              data.goals.priorities?.includes(priority)
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            {priority}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const CompleteStep = () => (
  <div className="text-center py-8">
    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <CheckCircle className="w-10 h-10 text-green-600" />
    </div>
    <h2 className="text-2xl font-bold text-gray-900 mb-4">
      You're All Set!
    </h2>
    <p className="text-gray-600 mb-8">
      Your profile is complete. Start browsing properties that match your preferences.
    </p>
    
    <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <Search className="w-6 h-6 text-blue-600 mx-auto mb-2" />
        <p className="text-xs font-medium">Browse Properties</p>
      </div>
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <Heart className="w-6 h-6 text-green-600 mx-auto mb-2" />
        <p className="text-xs font-medium">Save Favorites</p>
      </div>
      <div className="text-center p-4 bg-purple-50 rounded-lg">
        <MessageCircle className="w-6 h-6 text-purple-600 mx-auto mb-2" />
        <p className="text-xs font-medium">Contact Owners</p>
      </div>
    </div>
  </div>
);

// Landlord Steps (simplified versions)
const LandlordWelcomeStep = () => (
  <div className="text-center py-8">
    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <Home className="w-10 h-10 text-green-600" />
    </div>
    <h2 className="text-2xl font-bold text-gray-900 mb-4">
      Welcome Property Owner!
    </h2>
    <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
      List your properties and connect directly with quality renters. No agent fees, maximum control.
    </p>
  </div>
);

const LandlordProfileStep = ({ data, onDataChange }: any) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          First Name
        </label>
        <Input
          value={data.profile.firstName}
          onChange={(e) => onDataChange((prev: any) => ({
            ...prev,
            profile: { ...prev.profile, firstName: e.target.value }
          }))}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Last Name
        </label>
        <Input
          value={data.profile.lastName}
          onChange={(e) => onDataChange((prev: any) => ({
            ...prev,
            profile: { ...prev.profile, lastName: e.target.value }
          }))}
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Phone Number
      </label>
      <Input
        placeholder="+234 XXX XXX XXXX"
        value={data.profile.phone}
        onChange={(e) => onDataChange((prev: any) => ({
          ...prev,
          profile: { ...prev.profile, phone: e.target.value }
        }))}
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        About You (Optional)
      </label>
      <Textarea
        placeholder="Tell renters about yourself and your properties..."
        rows={4}
        value={data.profile.bio}
        onChange={(e) => onDataChange((prev: any) => ({
          ...prev,
          profile: { ...prev.profile, bio: e.target.value }
        }))}
      />
    </div>
  </div>
);

const PropertyBasicsStep = ({ data, onDataChange }: any) => (
  <div className="space-y-6">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Property Location
      </label>
      <Input
        placeholder="e.g., Lekki Phase 1, Lagos"
        value={data.preferences.location}
        onChange={(e) => onDataChange((prev: any) => ({
          ...prev,
          preferences: { ...prev.preferences, location: e.target.value }
        }))}
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Monthly Rent (₦)
        </label>
        <Input
          placeholder="e.g., 500,000"
          value={data.preferences.budget}
          onChange={(e) => onDataChange((prev: any) => ({
            ...prev,
            preferences: { ...prev.preferences, budget: e.target.value }
          }))}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bedrooms
        </label>
        <select 
          className="w-full p-3 border border-gray-300 rounded-lg"
          value={data.preferences.bedrooms}
          onChange={(e) => onDataChange((prev: any) => ({
            ...prev,
            preferences: { ...prev.preferences, bedrooms: e.target.value }
          }))}
        >
          <option value="">Select</option>
          <option value="studio">Studio</option>
          <option value="1">1 Bedroom</option>
          <option value="2">2 Bedrooms</option>
          <option value="3">3 Bedrooms</option>
          <option value="4+">4+ Bedrooms</option>
        </select>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Property Type
      </label>
      <div className="grid grid-cols-3 gap-3">
        {['Apartment', 'House', 'Studio'].map((type) => (
          <button
            key={type}
            onClick={() => onDataChange((prev: any) => ({
              ...prev,
              preferences: { ...prev.preferences, propertyType: type }
            }))}
            className={`p-4 border rounded-lg text-center transition-colors ${
              data.preferences.propertyType === type
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Home className="w-6 h-6 mx-auto mb-2" />
            <span className="font-medium">{type}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

const LandlordCompleteStep = () => (
  <div className="text-center py-8">
    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <CheckCircle className="w-10 h-10 text-green-600" />
    </div>
    <h2 className="text-2xl font-bold text-gray-900 mb-4">
      Ready to List!
    </h2>
    <p className="text-gray-600 mb-8">
      Your profile is set up. Create your first property listing and start connecting with renters.
    </p>
    
    <Button className="bg-green-600 hover:bg-green-700">
      <Camera className="w-4 h-4 mr-2" />
      Create Your First Listing
    </Button>
  </div>
);

export default UserOnboarding; 