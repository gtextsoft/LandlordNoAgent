import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Calendar, 
  Users, 
  MapPin, 
  Star, 
  Heart,
  ArrowRight,
  Home,
  Shield,
  MessageCircle,
  TrendingUp,
  Award,
  CheckCircle,
  Menu,
  ChevronDown
} from "lucide-react";

const LandingPage = () => {
  const featuredProperties = [
    {
      id: 1,
      title: "Beautiful Downtown Apartment",
      location: "Downtown, City Center",
      price: "$2,400",
      period: "month",
      rating: 4.9,
      reviews: 127,
      images: ["/placeholder.svg"],
      amenities: ["WiFi", "Kitchen", "Parking"],
      type: "Apartment"
    },
    {
      id: 2,
      title: "Spacious Family House",
      location: "Suburbs, Green Valley",
      price: "$3,200",
      period: "month",
      rating: 4.8,
      reviews: 89,
      images: ["/placeholder.svg"],
      amenities: ["Garden", "Garage", "Pool"],
      type: "House"
    },
    {
      id: 3,
      title: "Modern Studio Loft",
      location: "Arts District",
      price: "$1,800",
      period: "month",
      rating: 4.9,
      reviews: 156,
      images: ["/placeholder.svg"],
      amenities: ["Gym", "Rooftop", "Concierge"],
      type: "Studio"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Renter",
      content: "Found my perfect apartment in just 2 days! The direct communication with landlords made everything so much easier.",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Landlord",
      content: "As a property owner, this platform has saved me so much time. I get quality inquiries and can respond immediately.",
      rating: 5
    },
    {
      name: "Emily Davis",
      role: "Renter",
      content: "No more dealing with pushy agents or hidden fees. Just honest, direct communication with property owners.",
      rating: 5
    },
    {
      name: "David Wilson",
      role: "Landlord",
      content: "The best platform for connecting with serious renters. My properties get rented faster than ever before.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Exact match to image */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-gray-900">
                LandlordNoAgent
              </Link>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-600 hover:text-gray-900 font-medium">
                Home
              </Link>
              <Link to="/properties" className="text-gray-600 hover:text-gray-900 font-medium">
                Browse
              </Link>
              <Link to="#" className="text-gray-600 hover:text-gray-900 font-medium">
                About
              </Link>
              <Link to="/contact" className="text-gray-600 hover:text-gray-900 font-medium">
                Contact
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" className="text-gray-600 font-medium">
                  Sign In
                </Button>
              </Link>
              <Link to="/login">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 rounded-lg">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Matching the exact design */}
      <section className="relative min-h-[85vh] flex items-center justify-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/BG.png')",
            backgroundPosition: "center 10%"
          }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/30" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 leading-tight">
            Rent Smarter. No Agents.
          </h1>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 leading-tight">
            No Extra Fees.
          </h2>
          <p className="text-lg md:text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Connect directly with property owners and find your perfect rental home without middleman fees or complications.
          </p>

          {/* Search Bar - Clean white design exactly like image */}
          <div className="bg-white rounded-full shadow-2xl p-2 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
              <div className="relative">
                <div className="flex items-center px-6 py-4">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-900 mb-1">Where</p>
                    <input 
                      placeholder="Search destinations" 
                      className="border-0 p-0 text-sm text-gray-600 placeholder-gray-400 focus:ring-0 shadow-none bg-transparent outline-none w-full"
                    />
                  </div>
                </div>
              </div>
              
              <div className="relative border-l border-gray-200">
                <div className="flex items-center px-6 py-4">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-900 mb-1">Check in</p>
                    <input 
                      placeholder="Add dates" 
                      type="text"
                      className="border-0 p-0 text-sm text-gray-600 placeholder-gray-400 focus:ring-0 shadow-none bg-transparent outline-none w-full"
                    />
                  </div>
                </div>
              </div>
              
              <div className="relative border-l border-gray-200">
                <div className="flex items-center px-6 py-4">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-900 mb-1">Check out</p>
                    <input 
                      placeholder="Add dates" 
                      type="text"
                      className="border-0 p-0 text-sm text-gray-600 placeholder-gray-400 focus:ring-0 shadow-none bg-transparent outline-none w-full"
                    />
                  </div>
                </div>
              </div>
              
              <div className="relative border-l border-gray-200">
                <div className="flex items-center px-6 py-4">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-900 mb-1">Who</p>
                    <div className="flex items-center">
                      <input 
                        placeholder="Add guests" 
                        readOnly
                        className="border-0 p-0 text-sm text-gray-600 placeholder-gray-400 focus:ring-0 shadow-none bg-transparent outline-none w-full cursor-pointer"
                      />
                      <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
                    </div>
                  </div>
                  <Button className="bg-rose-500 hover:bg-rose-600 text-white rounded-full w-12 h-12 ml-4 flex items-center justify-center">
                    <Search className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties - Exact match to "Most Loved Homes" section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">Most Loved Homes</h2>
            <Link to="/properties">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900 font-medium">
                See all
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.map((property) => (
              <div key={property.id} className="group cursor-pointer">
                <div className="relative mb-4">
                  <img 
                    src={property.images[0]} 
                    alt={property.title}
                    className="w-full h-72 object-cover rounded-xl"
                  />
                  <button className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm">
                    <Heart className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 text-sm">
                      {property.location}
                    </h3>
                    <div className="flex items-center">
                      <Star className="w-3 h-3 text-gray-900 fill-current" />
                      <span className="text-sm text-gray-900 ml-1 font-medium">{property.rating}</span>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm">
                    Hosted by {property.title}
                  </p>
                  <p className="text-gray-500 text-sm">
                    5 nights · Nov 1-8
                  </p>
                  <p className="text-gray-900 font-medium">
                    {property.price} <span className="text-gray-500 font-normal">night</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section - "The rental market is broken" */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">The rental market is broken.</h2>
          <p className="text-xl text-gray-600 mb-16 max-w-3xl mx-auto">
            Traditional rental platforms charge high fees and create barriers between renters and property owners. 
            We're changing that by connecting you directly.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div>
              <div className="text-5xl font-bold text-gray-900 mb-2">25%</div>
              <p className="text-gray-600 text-lg">Average agent fees</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-gray-900 mb-2">7 days</div>
              <p className="text-gray-600 text-lg">Average response time</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-gray-900 mb-2">73%</div>
              <p className="text-gray-600 text-lg">Renters pay extra fees</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-gray-900 mb-2">89%</div>
              <p className="text-gray-600 text-lg">Want direct contact</p>
            </div>
          </div>
        </div>
      </section>

      {/* Designed for Good Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Designed for good</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built with trust and transparency in mind, connecting property owners and renters directly 
              for a better rental experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">Trust & safety</h3>
              <p className="text-gray-600 text-lg">
                Comprehensive verification and review systems ensure safe, reliable connections between renters and property owners.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">Inclusion</h3>
              <p className="text-gray-600 text-lg">
                We believe everyone deserves access to quality housing without discrimination or unnecessary barriers.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">Sustainability</h3>
              <p className="text-gray-600 text-lg">
                Supporting local communities by eliminating middleman fees and fostering direct, lasting relationships.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">Create an Account</h3>
              <p className="text-gray-600 text-lg">
                It's free and only takes a minute. Set up your profile and start browsing or listing properties.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">List or Explore</h3>
              <p className="text-gray-600 text-lg">
                Property owners can list their rentals, while renters can explore verified properties in their area.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">Connect & Close</h3>
              <p className="text-gray-600 text-lg">
                Message directly, arrange viewings, and finalize your rental agreement without any middleman.
              </p>
            </div>
          </div>

          <div className="text-center mt-16">
            <Link to="/login">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-12 py-4 rounded-lg font-medium">
                Get started for free today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Users Say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-8 border-0 shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently asked questions</h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 text-lg">How does LandlordNoAgent work?</h3>
              <p className="text-gray-600">LandlordNoAgent connects renters directly with property owners, eliminating the need for middlemen and reducing costs for both parties.</p>
            </div>
            <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 text-lg">Is it free to use?</h3>
              <p className="text-gray-600">Yes, creating an account and browsing properties is completely free. We only charge a small fee when a successful rental agreement is made.</p>
            </div>
            <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 text-lg">How do you verify properties?</h3>
              <p className="text-gray-600">All properties are verified through document checks and property owner verification to ensure legitimacy and prevent fraud.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Get started for free today
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of renters and landlords who are already using LandlordNoAgent to make better rental connections.
          </p>
          <Link to="/login">
            <Button className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-12 py-4 rounded-lg font-semibold">
              Get started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-6 text-white">LandlordNoAgent</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Connecting property owners and renters directly, without the hassle of traditional rental agencies.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-white text-lg">For Renters</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link to="/properties" className="hover:text-white transition-colors">Browse Properties</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Safety Tips</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-white text-lg">For Landlords</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link to="/login" className="hover:text-white transition-colors">List Property</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Resources</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Help Center</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-white text-lg">Company</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link to="#" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LandlordNoAgent. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
