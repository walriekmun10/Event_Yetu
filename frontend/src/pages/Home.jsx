import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, TrendingUp, Package, ArrowRight, Star, MapPin } from 'lucide-react';
import { CartContext } from '../context/CartContext'

const Home = () => {
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'DJs', 'Photography', 'Catering', 'Decoration', 'Venues', 'Entertainment'];
  const { addToCart } = useContext(CartContext)

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch services
      const servicesRes = await fetch('http://localhost/Event-yetu/backend/api/services.php');
      const servicesData = await servicesRes.json();
      
      // Fetch packages
      const packagesRes = await fetch('http://localhost/Event-yetu/backend/api/bookings_full.php?action=get-packages');
      const packagesData = await packagesRes.json();

      if (servicesData.success) {
        setServices(servicesData.services || []);
      }
      
      if (packagesData.success) {
        setPackages(packagesData.packages || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Find Perfect Services for Your Event
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Browse hundreds of verified service providers or choose from our premium packages
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto bg-white rounded-full p-2 shadow-2xl flex items-center">
              <Search className="w-6 h-6 text-gray-400 ml-4" />
              <input
                type="text"
                placeholder="Search services, providers, categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-3 text-gray-900 focus:outline-none"
              />
              <button className="bg-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-indigo-700 transition-colors">
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Premium Packages Section */}
        {packages.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Premium Packages</h2>
                <p className="text-gray-600">Pre-built packages for your convenience</p>
              </div>
              <Link
                to="/packages"
                className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center space-x-2"
              >
                <span>View All</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {packages.slice(0, 3).map(pkg => (
                <div
                  key={pkg.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow border border-gray-100"
                >
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <Package className="w-12 h-12" />
                      <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">
                        {pkg.duration}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                    <p className="text-white/90 text-sm">{pkg.description}</p>
                  </div>
                  
                  <div className="p-6">
                    <div className="mb-6">
                      <div className="text-3xl font-bold text-gray-900 mb-2">
                        Ksh {Number(pkg.price).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">All-inclusive package</div>
                    </div>

                    <div className="space-y-2 mb-6">
                      <div className="font-semibold text-gray-900 mb-3">Includes:</div>
                      {pkg.includes?.slice(0, 4).map((item, index) => (
                        <div key={index} className="flex items-center text-gray-600">
                          <div className="w-2 h-2 bg-indigo-600 rounded-full mr-3"></div>
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                      {pkg.includes?.length > 4 && (
                        <div className="text-sm text-indigo-600 font-medium">
                          +{pkg.includes.length - 4} more services
                        </div>
                      )}
                    </div>

                    <Link
                      to={`/book-package/${pkg.id}`}
                      className="block w-full bg-indigo-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      Book Package
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Services Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {selectedCategory === 'All' ? 'All Services' : `${selectedCategory} Services`}
              </h2>
              <p className="text-gray-600">
                {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No services found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredServices.map(service => (
                <div
                  key={service.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow border border-gray-100"
                >
                  <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 relative overflow-hidden">
                    {service.image ? (
                      <img
                        src={`http://localhost/Event-yetu/${service.image}`}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <Calendar className="w-16 h-16" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-sm font-semibold text-gray-700">{service.category}</span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-2xl font-bold text-indigo-600">
                          Ksh {Number(service.price).toLocaleString()}
                        </div>
                        {service.provider_name && (
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {service.provider_name}
                          </div>
                        )}
                      </div>
                    </div>

                          <div className="flex space-x-3">
                            <Link
                              to={`/service/${service.id}`}
                              className="flex-1 border border-indigo-600 text-indigo-600 text-center py-2 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
                            >
                              View Details
                            </Link>
                            <Link
                              to="/book-services"
                              state={{ serviceId: service.id }}
                              className="flex-1 bg-indigo-600 text-white text-center py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                            >
                              Quick Book
                            </Link>
                            <button
                              onClick={() => addToCart(service)}
                              className="ml-2 px-3 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                              Add to Cart
                            </button>
                          </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="mt-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Book Your Event?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Choose multiple services or select a package - all in one seamless booking
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              to="/book-services"
              className="bg-white text-indigo-600 px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-colors inline-flex items-center space-x-2"
            >
              <Calendar className="w-5 h-5" />
              <span>Book Services Now</span>
            </Link>
            <Link
              to="/packages"
              className="border-2 border-white text-white px-8 py-4 rounded-full font-bold hover:bg-white/10 transition-colors inline-flex items-center space-x-2"
            >
              <Package className="w-5 h-5" />
              <span>View Packages</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
