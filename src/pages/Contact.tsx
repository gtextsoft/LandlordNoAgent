import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Mail, 
  Phone, 
  Clock, 
  MapPin,
  ChevronDown,
  ArrowRight
} from "lucide-react";
import { useState } from "react";

const Contact = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Do I need to download an app?",
      answer: "No — it works perfectly on web and mobile. But the app is coming soon!"
    },
    {
      question: "Is it really agent-free?",
      answer: "Yes! We connect you directly with property owners, eliminating the need for traditional real estate agents and their fees."
    },
    {
      question: "How do I make sure a tenant or landlord is legit?",
      answer: "We verify all users through document checks and have a comprehensive review system to ensure safety and legitimacy."
    },
    {
      question: "Can I use this from my phone?",
      answer: "Absolutely! Our platform works seamlessly on mobile devices through your web browser."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-gray-900">
                LandlordNoAgent
              </Link>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="#" className="text-gray-700 hover:text-gray-900 font-medium">
                Product
              </Link>
              <Link to="#" className="text-gray-700 hover:text-gray-900 font-medium">
                Pricing
              </Link>
              <Link to="#" className="text-gray-700 hover:text-gray-900 font-medium">
                Blog
              </Link>
              <Link to="#" className="text-gray-700 hover:text-gray-900 font-medium">
                Company
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" className="text-gray-700 font-medium">
                  Log In
                </Button>
              </Link>
              <Link to="/login">
                <Button className="bg-teal-700 hover:bg-teal-800 text-white font-medium px-6">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-slate-500 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Contact Page
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Need Help? Let's Talk. Whether you're a landlord or a tenant, we're here to answer your 
            questions and make your experience smooth.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Left Column - Contact Info */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Reach Us Directly</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Email:</p>
                    <p className="text-gray-900">support@landlordnoagent.com</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Phone:</p>
                    <p className="text-gray-900">+234 (0)123456789</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Hours:</p>
                    <p className="text-gray-900">Monday - Saturday | 9 AM - 6 PM</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Office Address:</p>
                    <p className="text-gray-900">143 Allen Avenue, Ikeja, Lagos, Nigeria</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div>
              <Card className="p-8 border border-gray-200 shadow-sm">
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First name
                      </label>
                      <Input 
                        placeholder="Your first name"
                        className="w-full h-12 border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last name
                      </label>
                      <Input 
                        placeholder="Your last name"
                        className="w-full h-12 border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <Input 
                      type="email"
                      placeholder="your@email.com"
                      className="w-full h-12 border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone number
                    </label>
                    <Input 
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      className="w-full h-12 border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <Textarea 
                      placeholder="Write your message..."
                      rows={6}
                      className="w-full border border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <Button className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 font-medium">
                    Send Message
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Left Column */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Frequently asked questions
              </h2>
              <p className="text-gray-600">
                Still curious? Here's what most people ask.
              </p>
            </div>

            {/* Right Column - FAQ Items */}
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200">
                  <button
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none"
                    onClick={() => toggleFaq(index)}
                  >
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    <ChevronDown 
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        openFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-teal-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">LandlordNoAgent</h3>
              <p className="text-gray-600 text-sm mb-6">
                Write a short paragraph that explains what your company helps customers with.
              </p>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Input 
                    placeholder="Join our newsletter"
                    className="text-sm h-10 border border-gray-300"
                  />
                  <Button className="bg-teal-700 hover:bg-teal-800 text-white px-4 h-10">
                    Sign up
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="#" className="hover:text-gray-900">Features</Link></li>
                <li><Link to="#" className="hover:text-gray-900">Pricing</Link></li>
                <li><Link to="#" className="hover:text-gray-900">Changelog</Link></li>
                <li><Link to="#" className="hover:text-gray-900">Blog</Link></li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="#" className="hover:text-gray-900">About us</Link></li>
                <li><Link to="#" className="hover:text-gray-900">Community</Link></li>
                <li><Link to="#" className="hover:text-gray-900">Careers</Link></li>
                <li><Link to="#" className="hover:text-gray-900">Contact us</Link></li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="#" className="hover:text-gray-900">Terms of service</Link></li>
                <li><Link to="#" className="hover:text-gray-900">Privacy policy</Link></li>
                <li><Link to="#" className="hover:text-gray-900">Cookie policy</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Company name © 2024 • 123 Main Street Anytown, USA 56789
            </p>
            <div className="flex items-center space-x-4">
              {/* Social media icons would go here */}
              <div className="flex space-x-3">
                <div className="w-6 h-6 bg-gray-400 rounded"></div>
                <div className="w-6 h-6 bg-gray-400 rounded"></div>
                <div className="w-6 h-6 bg-gray-400 rounded"></div>
                <div className="w-6 h-6 bg-gray-400 rounded"></div>
                <div className="w-6 h-6 bg-gray-400 rounded"></div>
                <div className="w-6 h-6 bg-gray-400 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contact; 