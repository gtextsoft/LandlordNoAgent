import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  MapPin, 
  TrendingUp, 
  Users, 
  Shield, 
  MessageCircle,
  ArrowRight,
  Play,
  Star,
  CheckCircle,
  Home,
  Clock
} from 'lucide-react';

const EnhancedHero = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const heroStats = [
    { label: 'Active Properties', value: '15,000+', icon: Home },
    { label: 'Happy Renters', value: '50,000+', icon: Users },
    { label: 'Average Match Time', value: '2.5 Days', icon: Clock },
    { label: 'Success Rate', value: '96%', icon: TrendingUp }
  ];

  const featuredLocations = [
    { name: 'Downtown Lagos', count: '2,400+ properties', image: '/api/placeholder/200/120' },
    { name: 'Victoria Island', count: '1,800+ properties', image: '/api/placeholder/200/120' },
    { name: 'Lekki Phase 1', count: '3,200+ properties', image: '/api/placeholder/200/120' },
    { name: 'Ikeja GRA', count: '1,600+ properties', image: '/api/placeholder/200/120' }
  ];

  const testimonialSlides = [
    {
      content: "Found my dream apartment in just 3 days! No agent fees, direct communication with the landlord. Absolutely perfect!",
      author: "Sarah Johnson",
      role: "Marketing Manager",
      location: "Lagos",
      rating: 5,
      avatar: "/api/placeholder/64/64"
    },
    {
      content: "As a property owner, this platform has transformed how I rent out my properties. Quality tenants, faster process!",
      author: "Michael Adebayo",
      role: "Property Owner",
      location: "Abuja",
      rating: 5,
      avatar: "/api/placeholder/64/64"
    },
    {
      content: "The direct communication feature is a game-changer. No more middleman delays or hidden fees!",
      author: "Aisha Ibrahim",
      role: "Software Developer",
      location: "Port Harcourt",
      rating: 5,
      avatar: "/api/placeholder/64/64"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonialSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonialSlides.length]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `/properties?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background with Parallax Effect */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900"
          style={{
            backgroundImage: `url('/BG.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60" />
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        {/* Main Hero Content */}
        <div className="text-center mb-16">
          {/* Badge */}
          <Badge className="mb-6 px-4 py-2 bg-white/10 text-white border-white/20 hover:bg-white/20 transition-all">
            <Star className="w-4 h-4 mr-2 text-yellow-400" />
            Nigeria's #1 Direct Rental Platform
          </Badge>

          {/* Main Headlines */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            <span className="block">Rent Smarter.</span>
            <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Connect Directly.
            </span>
            <span className="block">Pay Less.</span>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed">
            Skip the agents, avoid the fees. Connect directly with property owners and find your perfect home in Nigeria.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link to="/properties">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 py-4 text-lg font-semibold shadow-2xl transform hover:scale-105 transition-all duration-200">
                Start Searching
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg backdrop-blur-sm"
              onClick={() => setShowVideoModal(true)}
            >
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>

          {/* Hero Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {heroStats.map((stat, index) => (
              <Card key={index} className="bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                <CardContent className="p-6 text-center">
                  <stat.icon className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-gray-300 text-sm">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Enhanced Search Bar */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="bg-white/95 backdrop-blur-md shadow-2xl border-0">
            <CardContent className="p-2">
              <div className="flex flex-col lg:flex-row gap-2">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search by location, neighborhood, or landmark..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-12 h-14 text-lg border-0 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button 
                  onClick={handleSearch}
                  size="lg" 
                  className="h-14 px-8 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search Properties
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Locations */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-white text-center mb-8">Popular Locations</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredLocations.map((location, index) => (
              <Card key={index} className="group cursor-pointer bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-t-lg mb-3 flex items-center justify-center">
                    <Home className="w-8 h-8 text-white/70" />
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-white mb-1">{location.name}</h4>
                    <p className="text-gray-300 text-sm">{location.count}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Social Proof Carousel */}
        <div className="text-center">
          <h3 className="text-3xl font-bold text-white mb-8">What Our Users Say</h3>
          <Card className="max-w-4xl mx-auto bg-white/10 border-white/20 backdrop-blur-md">
            <CardContent className="p-8">
              <div className="relative">
                {testimonialSlides.map((testimonial, index) => (
                  <div
                    key={index}
                    className={`transition-all duration-500 ${
                      index === currentSlide ? 'opacity-100' : 'opacity-0 absolute inset-0'
                    }`}
                  >
                    <div className="flex justify-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <blockquote className="text-xl text-white mb-6 italic">
                      "{testimonial.content}"
                    </blockquote>
                    <div className="flex items-center justify-center">
                      <img 
                        src={testimonial.avatar} 
                        alt={testimonial.author}
                        className="w-12 h-12 rounded-full mr-4"
                      />
                      <div className="text-left">
                        <div className="font-semibold text-white">{testimonial.author}</div>
                        <div className="text-gray-300 text-sm">{testimonial.role} • {testimonial.location}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Slide Indicators */}
              <div className="flex justify-center mt-8 space-x-2">
                {testimonialSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentSlide ? 'bg-blue-400' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-4xl w-full mx-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVideoModal(false)}
              className="absolute -top-12 right-0 text-white hover:bg-white/20"
            >
              ✕
            </Button>
            <Card className="overflow-hidden">
              <video
                ref={videoRef}
                controls
                autoPlay
                className="w-full aspect-video"
                poster="/api/placeholder/800/450"
              >
                <source src="/demo-video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </Card>
          </div>
        </div>
      )}
    </section>
  );
};

export default EnhancedHero; 