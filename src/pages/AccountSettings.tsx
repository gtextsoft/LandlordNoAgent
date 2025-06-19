
import { useAuth } from '@/hooks/useAuth';
import { ProfileForm } from '@/components/ProfileForm';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AccountSettings = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    // This could happen if the profile is still loading or failed to load.
    // A redirect or a more robust error message would be good here.
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">Could not load your profile. Please try logging in again.</p>
        <Button onClick={() => navigate('/login')}>Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Edit Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileForm userProfile={profile} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AccountSettings;
