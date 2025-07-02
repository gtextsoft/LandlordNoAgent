import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageCircle, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner, ListLoadingSkeleton } from "@/components/ui/loading-state";
import { handleError, handleSuccess } from "@/utils/errorHandling";

interface ChatRoom {
  id: string;
  renter_id: string;
  property_id: string;
  created_at: string;
  properties?: {
    title: string;
    location?: string;
    price: number;
  };
  renter_profile?: {
    full_name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
  };
  last_message?: {
    content: string;
  created_at: string;
    sender_type: 'landlord' | 'renter';
  };
  unread_count?: number;
  status?: 'active' | 'archived' | 'closed';
}

interface MessagesSectionProps {
  chatRooms?: ChatRoom[];
  loading?: boolean;
}

const MessagesSection = ({ chatRooms = [], loading = false }: MessagesSectionProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived' | 'closed'>('all');
  const [quickReplyOpen, setQuickReplyOpen] = useState<string | null>(null);
  const [quickReplyText, setQuickReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  
  const { toast } = useToast();

  // Memoized filter for better performance
  const filteredChatRooms = useMemo(() => {
    return chatRooms.filter(room => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        room.renter_profile?.full_name?.toLowerCase().includes(searchLower) ||
        room.properties?.title?.toLowerCase().includes(searchLower) ||
        room.properties?.location?.toLowerCase().includes(searchLower);
      
      const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [chatRooms, searchTerm, statusFilter]);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
      case 'closed':
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
    }
  };

  const getMessageStatusIcon = (senderType: string, unreadCount?: number) => {
    if (senderType === 'renter' && unreadCount && unreadCount > 0) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    } else if (senderType === 'landlord') {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleQuickReply = useCallback(async (chatRoomId: string) => {
    if (!quickReplyText.trim()) return;
    
    setSendingReply(true);
    try {
      // Send actual message to database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('messages')
        .insert({
          chat_room_id: chatRoomId,
          sender_id: user.id,
          content: quickReplyText.trim()
        });

      if (error) throw error;
      
      handleSuccess("Your reply has been sent successfully.", toast, {
        title: "Message Sent",
      });
      
      setQuickReplyText("");
      setQuickReplyOpen(null);
      
      // Optionally refresh the chat rooms to show the new message
      // This would require a callback prop to refresh parent data
    } catch (error: any) {
      handleError(error, toast, "There was an error sending your message. Please try again.");
    } finally {
      setSendingReply(false);
    }
  }, [quickReplyText, toast]);

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Loading state with standardized component
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Recent Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ListLoadingSkeleton items={3} className="space-y-4" />
        </CardContent>
      </Card>
    );
  }

  if (chatRooms.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h4>
          <p className="text-gray-600 mb-6">
            When renters contact you about your properties, their messages will appear here.
          </p>
          <Link to="/landlord/new">
            <Button>
              Add a property to start receiving inquiries
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
        <CardTitle className="flex items-center">
          <MessageCircle className="w-5 h-5 mr-2" />
              Recent Messages
              {filteredChatRooms.filter(room => room.unread_count && room.unread_count > 0).length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {filteredChatRooms.reduce((sum, room) => sum + (room.unread_count || 0), 0)} unread
            </Badge>
          )}
        </CardTitle>
            <Link to="/messages">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  {statusFilter === 'all' ? 'All' : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                  All Messages
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('archived')}>
                  Archived
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('closed')}>
                  Closed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredChatRooms.length === 0 ? (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No messages found</p>
            <p className="text-sm text-gray-400">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredChatRooms.slice(0, 5).map((room) => (
              <div 
                key={room.id} 
                className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                  room.unread_count && room.unread_count > 0 ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={room.renter_profile?.avatar_url} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {getInitials(room.renter_profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900 truncate">
                          {room.renter_profile?.full_name || 'Unknown User'}
                      </h4>
                        {getStatusBadge(room.status)}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        {getMessageStatusIcon(room.last_message?.sender_type || 'renter', room.unread_count)}
                        <span>{formatTimeAgo(room.last_message?.created_at || room.created_at)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{room.properties?.title}</span>
                      <span className="text-green-600 font-medium">
                        ₦{room.properties?.price?.toLocaleString()}/month
                      </span>
                    </div>
                    
                    {room.last_message && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {room.last_message.content}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {room.renter_profile?.email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-32">{room.renter_profile.email}</span>
                          </div>
                        )}
                        {room.renter_profile?.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3" />
                            <span>{room.renter_profile.phone}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Quick Reply */}
                        <Dialog open={quickReplyOpen === room.id} onOpenChange={(open) => setQuickReplyOpen(open ? room.id : null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Send className="w-3 h-3 mr-1" />
                              Quick Reply
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Quick Reply to {room.renter_profile?.full_name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Textarea
                                placeholder="Type your message..."
                                value={quickReplyText}
                                onChange={(e) => setQuickReplyText(e.target.value)}
                                rows={4}
                              />
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="outline" 
                                  onClick={() => setQuickReplyOpen(null)}
                                  disabled={sendingReply}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={() => handleQuickReply(room.id)}
                                  disabled={sendingReply || !quickReplyText.trim()}
                                >
                                  {sendingReply ? 'Sending...' : 'Send'}
                                </Button>
                              </div>
                  </div>
                          </DialogContent>
                        </Dialog>
                        
                        {/* View Full Conversation */}
                  <Link to={`/property/${room.property_id}/chat`}>
                          <Button variant="default" size="sm">
                            View Chat
                    </Button>
                  </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {chatRooms.length > 5 && (
              <div className="text-center pt-4">
                <Link to="/messages">
                  <Button variant="outline">
                    View All {chatRooms.length} Conversations
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MessagesSection;
