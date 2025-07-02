import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageCircle, Eye, User, Clock, Home, Search, Filter, ArrowLeft, Building, Phone, Mail, Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import Layout from "@/components/Layout";
import { handleError } from "@/utils/errorHandling";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Messages = () => {
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      fetchChatRooms();
    }
  }, [profile]);

  useEffect(() => {
    filterChatRooms();
  }, [chatRooms, searchQuery, statusFilter]);

  const fetchChatRooms = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          properties (*, profiles!properties_landlord_id_fkey (*)),
          landlord_profile:profiles!chat_rooms_landlord_id_fkey (*),
          renter_profile:profiles!chat_rooms_renter_id_fkey (*),
          messages (*, sender:profiles!messages_sender_id_fkey (*))
        `)
        .or(`renter_id.eq.${profile.id},landlord_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChatRooms(data || []);
    } catch (error: any) {
      handleError(error, toast, 'Error fetching conversations');
    } finally {
      setLoading(false);
    }
  };

  const filterChatRooms = () => {
    let filtered = [...chatRooms];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(room => 
        room.properties?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.properties?.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getOtherParticipant(room)?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getLastMessage(room).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter(room => {
        const lastMessageTime = getLastMessageTime(room);
        const diffInHours = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);
        
        switch (statusFilter) {
          case "active":
            return diffInHours < 24;
          case "recent":
            return diffInHours < 168; // 7 days
          case "older":
            return diffInHours >= 168;
          default:
            return true;
        }
      });
    }

    setFilteredRooms(filtered);
  };

  const getLastMessage = (room: any) => {
    if (!room.messages || room.messages.length === 0) {
      return "No messages yet";
    }
    const lastMessage = room.messages[room.messages.length - 1];
    return lastMessage.content.length > 60 
      ? lastMessage.content.substring(0, 60) + "..."
      : lastMessage.content;
  };

  const getLastMessageTime = (room: any) => {
    if (!room.messages || room.messages.length === 0) {
      return new Date(room.created_at);
    }
    return new Date(room.messages[room.messages.length - 1].created_at);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getOtherParticipant = (room: any) => {
    if (profile?.id === room.landlord_id) {
      return room.renter_profile;
    } else {
      return room.landlord_profile;
    }
  };

  const getUserRole = (room: any) => {
    return profile?.id === room.landlord_id ? "landlord" : "renter";
  };

  const getMessageStatus = (room: any) => {
    const lastMessageTime = getLastMessageTime(room);
    const diffInHours = (new Date().getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return { status: "active", color: "bg-green-500" };
    if (diffInHours < 24) return { status: "recent", color: "bg-yellow-500" };
    return { status: "older", color: "bg-gray-400" };
  };

  const handleBackNavigation = () => {
    if (profile?.role === 'landlord') {
      navigate('/landlord');
    } else {
      navigate('/properties');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-4 lg:p-6">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            {profile?.role === 'landlord' ? (
              <>
                <Link to="/landlord" className="hover:text-blue-600">Dashboard</Link>
                <span>•</span>
                <span className="text-gray-900 font-medium">Messages</span>
              </>
            ) : (
              <>
                <Link to="/properties" className="hover:text-blue-600">Properties</Link>
                <span>•</span>
                <span className="text-gray-900 font-medium">Messages</span>
              </>
            )}
          </nav>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
              <p className="text-gray-600">
                Manage your conversations with {profile?.role === 'landlord' ? 'renters' : 'landlords'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={handleBackNavigation}
                className="hidden sm:flex"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to {profile?.role === 'landlord' ? 'Dashboard' : 'Properties'}
              </Button>
              {profile?.role === 'landlord' && (
                <Link to="/landlord/new">
                  <Button>
                    <Building className="w-4 h-4 mr-2" />
                    New Listing
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6 text-center">
              <MessageCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-blue-900">{chatRooms.length}</h3>
              <p className="text-blue-700">Total Conversations</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-green-900">
                {chatRooms.filter(room => {
                  const lastMessageTime = getLastMessageTime(room);
                  const diffInHours = (new Date().getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);
                  return diffInHours < 24;
                }).length}
              </h3>
              <p className="text-green-700">Active Today</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6 text-center">
              <User className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-purple-900">
                {new Set(chatRooms.map(room => getOtherParticipant(room)?.id)).size}
              </h3>
              <p className="text-purple-700">Unique Contacts</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6 text-center">
              <Home className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-orange-900">
                {new Set(chatRooms.map(room => room.property_id)).size}
              </h3>
              <p className="text-orange-700">Properties Discussed</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search conversations, properties, or contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Conversations</SelectItem>
                    <SelectItem value="active">Active Today</SelectItem>
                    <SelectItem value="recent">Recent (7 days)</SelectItem>
                    <SelectItem value="older">Older</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(searchQuery || statusFilter !== "all") && (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {filteredRooms.length} of {chatRooms.length} conversations
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversations List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Your Conversations
              {filteredRooms.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filteredRooms.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRooms.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {chatRooms.length === 0 ? "No conversations yet" : "No conversations match your filters"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {chatRooms.length === 0 ? (
                    profile?.role === 'landlord' 
                      ? "When renters contact you about your properties, conversations will appear here."
                      : "Start chatting with landlords about properties you're interested in."
                  ) : (
                    "Try adjusting your search or filter criteria."
                  )}
                </p>
                <div className="flex gap-3 justify-center">
                  {profile?.role === 'landlord' ? (
                    <>
                      <Link to="/landlord/new">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Building className="w-4 h-4 mr-2" />
                          Create Listing
                        </Button>
                      </Link>
                      <Link to="/landlord">
                        <Button variant="outline">
                          <Home className="w-4 h-4 mr-2" />
                          Back to Dashboard
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/properties">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Home className="w-4 h-4 mr-2" />
                          Browse Properties
                        </Button>
                      </Link>
                      <Link to="/saved-properties">
                        <Button variant="outline">
                          <Heart className="w-4 h-4 mr-2" />
                          Saved Properties
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRooms.map((room) => {
                  const otherParticipant = getOtherParticipant(room);
                  const userRole = getUserRole(room);
                  const lastMessageTime = getLastMessageTime(room);
                  const messageStatus = getMessageStatus(room);
                  
                  return (
                    <div
                      key={room.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Status Indicator */}
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${messageStatus.color} mb-1`} />
                          <span className="text-xs text-gray-500 capitalize">{messageStatus.status}</span>
                        </div>

                        {/* Conversation Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {room.properties?.title || 'Property'}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <Badge variant={userRole === 'landlord' ? 'default' : 'secondary'} className="text-xs">
                                {userRole === 'landlord' ? 'As Landlord' : 'As Renter'}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                ${room.properties?.price?.toLocaleString()}/month
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-600 flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              <span className="font-medium">
                                {userRole === 'landlord' ? 'Renter' : 'Landlord'}: 
                              </span>
                              <span className="ml-1 truncate">
                                {otherParticipant?.full_name || 'Unknown'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {room.properties?.location}
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-500 mb-2 flex items-start">
                            <MessageCircle className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                            <span className="truncate">{getLastMessage(room)}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTime(lastMessageTime)}
                            </div>
                            <div className="flex items-center space-x-3">
                              {otherParticipant?.email && (
                                <div className="flex items-center">
                                  <Mail className="w-3 h-3 mr-1" />
                                  <span className="truncate max-w-[150px]">{otherParticipant.email}</span>
                                </div>
                              )}
                              {otherParticipant?.phone && (
                                <div className="flex items-center">
                                  <Phone className="w-3 h-3 mr-1" />
                                  <span>{otherParticipant.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 ml-4">
                        <Link to={`/property/${room.property_id}`}>
                          <Button size="sm" variant="outline" className="w-full sm:w-auto">
                            <Eye className="w-4 h-4 mr-2" />
                            View Property
                          </Button>
                        </Link>
                        <Link to={`/property/${room.property_id}/chat`}>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Open Chat
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Messages; 