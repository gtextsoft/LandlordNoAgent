import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, User, Home, MessageCircle, Phone, Mail, MoreVertical, Search, Paperclip, Building, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase, Message, ChatRoom, Property } from "@/lib/supabase";
import LoadingSpinner from "@/components/LoadingSpinner";
import Layout from "@/components/Layout";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const PropertyChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [otherParticipant, setOtherParticipant] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { profile } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!profile || !id) {
      navigate("/login");
      return;
    }

    const initializeChat = async () => {
      try {
        // Fetch property details with landlord info
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select(`
            *,
            profiles!properties_landlord_id_fkey (*)
          `)
          .eq('id', id)
          .single();

        if (propertyError) {
          console.error('Property fetch error:', propertyError);
          throw new Error('Property not found');
        }
        setProperty(propertyData as any);

        // Determine the other participant based on current user role
        let chatQuery = supabase
          .from('chat_rooms')
          .select(`
            *,
            properties (*),
            renter_profile:profiles!chat_rooms_renter_id_fkey (*),
            landlord_profile:profiles!chat_rooms_landlord_id_fkey (*)
          `)
          .eq('property_id', id);

        // Filter based on user role
        if (profile.role === 'renter') {
          chatQuery = chatQuery.eq('renter_id', profile.id);
        } else if (profile.role === 'landlord') {
          chatQuery = chatQuery.eq('landlord_id', profile.id);
        }

        const { data: existingChat, error: chatError } = await chatQuery.maybeSingle();

        let currentChatRoom = existingChat;

        if (!existingChat && profile.role === 'renter') {
          // Create new chat room if renter is initiating
          const { data: newChat, error: createError } = await supabase
            .from('chat_rooms')
            .insert({
              property_id: id,
              renter_id: profile.id,
              landlord_id: (propertyData as any).landlord_id,
            })
            .select(`
              *,
              properties (*),
              renter_profile:profiles!chat_rooms_renter_id_fkey (*),
              landlord_profile:profiles!chat_rooms_landlord_id_fkey (*)
            `)
            .single();

          if (createError) {
            console.error('Chat creation error:', createError);
            throw new Error('Failed to create chat room');
          }
          currentChatRoom = newChat;
        } else if (!existingChat) {
          throw new Error("Chat room not found");
        }

        setChatRoom(currentChatRoom as any);
        // Set other participant info
        if (profile.role === 'renter') {
          setOtherParticipant((currentChatRoom as any).landlord_profile);
        } else {
          setOtherParticipant((currentChatRoom as any).renter_profile);
        }

        // Fetch existing messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey (*)
          `)
          .eq('chat_room_id', (currentChatRoom as any).id)
          .order('created_at', { ascending: true });

        if (messagesError) {
          console.error('Messages fetch error:', messagesError);
          throw messagesError;
        }
        setMessages((messagesData as any) || []);
        setLoading(false);
        setTimeout(scrollToBottom, 100);
      } catch (error: any) {
        console.error('Chat initialization error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to load chat.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };
    initializeChat();
    // eslint-disable-next-line
  }, [id, profile, navigate, toast]);

  // Subscription effect: only runs when chatRoom is set
  useEffect(() => {
    if (!chatRoom) return;
    const channel = supabase
      .channel(`chat_room:${chatRoom.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_room_id=eq.${chatRoom.id}`,
      }, async (payload) => {
        console.log('New message received:', payload);
        // Fetch the complete message with profile info
        const { data: newMessageData } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey (*)
          `)
          .eq('id', (payload.new as any).id)
          .single();
        if (newMessageData) {
          setMessages(prev => [...prev, newMessageData as any]);
          setTimeout(scrollToBottom, 100);
        }
      });
    const subscription = channel.subscribe((status) => {
      console.log('Subscription status:', status);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [chatRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatRoom || !profile) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_room_id: chatRoom.id,
          sender_id: profile.id,
          content: newMessage.trim(),
        });

      if (error) {
        console.error('Message send error:', error);
        throw error;
      }

      setNewMessage("");
    } catch (error: any) {
      console.error('Send message error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message.",
        variant: "destructive",
      });
    }
  };

  const filteredMessages = messages.filter(message =>
    searchQuery === "" || message.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatMessageTime = (date: string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return messageDate.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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

  if (!chatRoom || !property) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Chat not found</h2>
            <p className="text-gray-600 mb-4">The chat room you're looking for doesn't exist.</p>
                          <div className="flex gap-3 justify-center">
                {profile?.role === 'landlord' ? (
                  <>
                    <Link to="/landlord">
                      <Button>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                      </Button>
                    </Link>
                    <Link to="/landlord/new">
                      <Button variant="outline">
                        <Building className="w-4 h-4 mr-2" />
                        New Listing
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/properties">
                      <Button>
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
                <Link to="/messages" className="hover:text-blue-600">Messages</Link>
              </>
            ) : (
              <>
                <Link to="/properties" className="hover:text-blue-600">Properties</Link>
                <span>•</span>
                <Link to="/messages" className="hover:text-blue-600">Messages</Link>
              </>
            )}
            <span>•</span>
            <span className="text-gray-900 font-medium">{property?.title}</span>
          </nav>
        </div>

        {/* Chat Header */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <Home className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{property?.title}</CardTitle>
                    <p className="text-gray-600">
                      ${property?.price.toLocaleString()}/month • {property?.location}
                    </p>
                  </div>
                </div>
                <Badge variant={profile?.role === 'landlord' ? 'default' : 'secondary'}>
                  {profile?.role === 'landlord' ? 'As Landlord' : 'As Renter'}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <Link to={`/property/${id}`}>
                  <Button size="sm" variant="outline">
                    <Home className="w-4 h-4 mr-2" />
                    View Property
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Search className="w-4 h-4 mr-2" />
                      Search Messages
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Mail className="w-4 h-4 mr-2" />
                      Email Contact
                    </DropdownMenuItem>
                    {otherParticipant?.phone && (
                      <DropdownMenuItem>
                        <Phone className="w-4 h-4 mr-2" />
                        Call {otherParticipant.phone}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Participant Info */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {profile?.full_name || 'You'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1)}
                    </p>
                  </div>
                </div>
                
                <div className="text-gray-400 mx-4">⇄</div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {otherParticipant?.full_name || 'Other User'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {otherParticipant?.role?.charAt(0).toUpperCase() + otherParticipant?.role?.slice(1)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                <p>{otherParticipant?.email}</p>
                {otherParticipant?.phone && <p>{otherParticipant.phone}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="flex flex-col h-[600px]">
          {/* Search Bar */}
          {searchQuery && (
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button size="sm" variant="outline" onClick={() => setSearchQuery("")}>
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Messages */}
          <CardContent className="flex-1 p-0 overflow-hidden">
            <div className="h-full overflow-y-auto p-4 space-y-4">
              {filteredMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  {searchQuery ? (
                    <p>No messages found matching "{searchQuery}"</p>
                  ) : (
                    <>
                      <p className="mb-2">Start the conversation about this property!</p>
                      <p className="text-xs">
                        You're chatting with {otherParticipant?.full_name || 'the other user'}
                      </p>
                    </>
                  )}
                </div>
              ) : (
                filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === profile?.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm ${
                        message.sender_id === profile?.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900 border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium ${
                          message.sender_id === profile?.id ? "text-blue-100" : "text-gray-600"
                        }`}>
                          {message.sender_id === profile?.id
                            ? "You"
                            : message.sender?.full_name || 'User'}
                        </span>
                        <span className={`text-xs ${
                          message.sender_id === profile?.id ? "text-blue-100" : "text-gray-500"
                        }`}>
                          {formatMessageTime(message.created_at)}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>

          {/* Message Input */}
          <div className="border-t p-4 bg-gray-50">
            <form onSubmit={handleSendMessage} className="flex space-x-3">
              <Button size="icon" variant="outline" type="button">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message ${otherParticipant?.full_name || 'other user'}...`}
                className="flex-1 bg-white"
                autoFocus
              />
              <Button 
                type="submit" 
                disabled={!newMessage.trim()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            {isTyping && (
              <p className="text-xs text-gray-500 mt-2">
                {otherParticipant?.full_name || 'Other user'} is typing...
              </p>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default PropertyChat;
