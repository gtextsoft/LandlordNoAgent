// MyApplications.tsx
// TODO: Add navigation link to this page from user menu or dashboard
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ApplicationWithProperty {
  id: string;
  property_id: string;
  full_name: string;
  email: string;
  status: string;
  document_urls: string[] | null;
  created_at: string | null;
  property: {
    title: string;
    location: string | null;
    price: number;
    photo_url: string | null;
  } | null;
}

const MyApplications = () => {
  const { profile } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!profile) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('rental_applications')
        .select(`*, property:properties(id, title, location, price, photo_url)`)
        .eq('renter_id', profile.id)
        .order('created_at', { ascending: false });
      if (!error && data) setApplications(data);
      setLoading(false);
    };
    fetchApplications();
  }, [profile]);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-10 px-4">
        <Card>
          <CardHeader>
            <CardTitle>My Rental Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">You have not submitted any rental applications yet.</div>
            ) : (
              <div className="space-y-6">
                {applications.map(app => (
                  <div key={app.id} className="border-b pb-4 mb-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={app.property?.photo_url || '/placeholder.svg'}
                        alt={app.property?.title || 'Property'}
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-lg">{app.property?.title || 'Property'}</div>
                        <div className="text-gray-500 text-sm">{app.property?.location}</div>
                        <div className="text-green-600 font-bold">₦{app.property?.price?.toLocaleString()}</div>
                      </div>
                      <Badge variant={app.status === 'approved' ? 'default' : app.status === 'rejected' ? 'destructive' : undefined}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Applied on:</span> {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="mt-2">
                      {Array.isArray(app.document_urls) && app.document_urls.length > 0 ? (
                        <ul className="flex flex-wrap gap-2">
                          {app.document_urls.map((url, idx) => (
                            <li key={idx}>
                              <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Document {idx + 1}</a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400">No documents uploaded</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MyApplications; 