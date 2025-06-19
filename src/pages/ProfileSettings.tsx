
import { ProfileForm } from "@/components/ProfileForm";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import LoadingSpinner from "@/components/LoadingSpinner";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ProfileSettings = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Manage your account settings and profile information.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && <div className="flex justify-center items-center h-40"><LoadingSpinner /></div>}
              {!loading && profile && <ProfileForm userProfile={profile} />}
              {!loading && !profile && <p>Could not load profile. Please try again later.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ProfileSettings;
