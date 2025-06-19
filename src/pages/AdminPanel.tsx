
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, LogOut, Eye, MessageCircle, Shield, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';

interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  landlord_name: string;
  landlord_email: string;
  status: string; // 'pending' | 'active' | 'suspended'
  created_at: string;
  message_count: number;
}

const AdminPanel = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, signOut, hasRole } = useAuth();

  useEffect(() => {
    if (!profile || !hasRole('admin')) {
      navigate('/');
      return;
    }
    fetchProperties();
  }, [profile, navigate, hasRole]);

  const fetchProperties = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('properties')
      .select('id, title, price, location, status, created_at, landlord_id, landlord:profiles(full_name, email)')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: error.message });
      setLoading(false);
      return;
    }
    const propertiesWithLandlord = (data || []).map((p: any) => ({
      ...p,
      landlord_name: p.landlord?.full_name || '',
      landlord_email: p.landlord?.email || '',
      message_count: 0 // TODO: fetch message count if needed
    }));
    setProperties(propertiesWithLandlord);
    setLoading(false);
  };

  const handleStatusToggle = async (propertyId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    
    const { error } = await supabase
      .from('properties')
      .update({ status: newStatus })
      .eq('id', propertyId);
    
    if (error) {
      toast({ title: 'Error', description: error.message });
      return;
    }

    setProperties(prev =>
      prev.map(property =>
        property.id === propertyId
          ? { ...property, status: newStatus }
          : property
      )
    );

    toast({
      title: `Property ${newStatus}`,
      description: `Property has been ${newStatus === "active" ? "activated" : "suspended"}.`,
    });
  };

  const handleApprove = async (propertyId: string) => {
    const { error } = await supabase
      .from('properties')
      .update({ status: 'active' })
      .eq('id', propertyId);
    if (error) {
      toast({ title: 'Error', description: error.message });
      return;
    }
    setProperties(prev =>
      prev.map(property =>
        property.id === propertyId ? { ...property, status: 'active' } : property
      )
    );
    toast({ title: 'Property Approved', description: 'Property is now visible to renters.' });
  };

  const handleDelete = async (propertyId: string) => {
    if (!confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      setProperties(prev => prev.filter(property => property.id !== propertyId));
      
      toast({
        title: "Success",
        description: "Property deleted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete property.",
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const activeProperties = properties.filter(p => p.status === "active").length;
  const suspendedProperties = properties.filter(p => p.status === "suspended").length;
  const totalMessages = properties.reduce((sum, p) => sum + p.message_count, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">FL</span>
                </div>
                <span className="text-xl font-bold text-gray-900">LandLordNoAgent</span>
              </Link>
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                <Shield className="w-3 h-3 mr-1" />
                Admin Panel
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {profile?.full_name}</span>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Properties</p>
                  <p className="text-3xl font-bold text-gray-900">{properties.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-3xl font-bold text-green-600">{activeProperties}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Badge className="w-6 h-6 bg-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Suspended</p>
                  <p className="text-3xl font-bold text-red-600">{suspendedProperties}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Messages</p>
                  <p className="text-3xl font-bold text-purple-600">{totalMessages}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Properties Table */}
        <Card>
          <CardHeader>
            <CardTitle>Property Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Landlord</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{property.title}</div>
                        <div className="text-sm text-gray-500">{property.location}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{property.landlord_name}</div>
                        <div className="text-sm text-gray-500">{property.landlord_email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${property.price.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MessageCircle className="w-4 h-4 mr-1 text-gray-400" />
                        {property.message_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={property.status === "active"}
                          onCheckedChange={() => handleStatusToggle(property.id, property.status)}
                        />
                        <Badge
                          variant={property.status === "active" ? "default" : "secondary"}
                          className={property.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                        >
                          {property.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 items-center">
                        <Link to={`/property/${property.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </Link>
                        {property.status === 'pending' && (
                          <Button size="sm" onClick={() => handleApprove(property.id)}>
                            Approve
                          </Button>
                        )}
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(property.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
