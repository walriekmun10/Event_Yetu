import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const MultiServiceBooking = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [services, setServices] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Booking details
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [venue, setVenue] = useState('');
  const [notes, setNotes] = useState('');
  
  const categories = ['All', 'Speakers', 'MCs', 'DJs', 'Tents', 'Sound Systems', 'Lighting Systems'];
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadServices();
  }, [user]);
  
  const loadServices = async () => {
    try {
      const response = await axios.get('http://localhost/Event-yetu/backend/api/services.php');
      setServices(response.data.filter(s => s.status === 'approved'));
    } catch (error) {
      toast.error('Failed to load services');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'All' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  const addToCart = (service) => {
    const existingItem = cart.find(item => item.service_id === service.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.service_id === service.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
      toast.success(`Increased quantity of ${service.name}`);
    } else {
      setCart([...cart, {
        service_id: service.id,
        name: service.name,
        category: service.category,
        price: parseFloat(service.price),
        quantity: 1,
        image_url: service.image_url
      }]);
      toast.success(`Added ${service.name} to cart`);
    }
  };
  
  const removeFromCart = (serviceId) => {
    setCart(cart.filter(item => item.service_id !== serviceId));
    toast.success('Removed from cart');
  };
  
  const updateQuantity = (serviceId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(serviceId);
      return;
    }
    
    setCart(cart.map(item =>
      item.service_id === serviceId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };
  
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  const handleSubmitBooking = async () => {
    if (cart.length === 0) {
      toast.error('Please add at least one service to cart');
      return;
    }
    
    if (!eventDate) {
      toast.error('Please select an event date');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const bookingData = {
        services: cart.map(item => ({
          service_id: item.service_id,
          quantity: item.quantity
        })),
        event_date: eventDate,
        event_time: eventTime || null,
        venue: venue || null,
        notes: notes || null
      };
      
      const response = await axios.post(
        'http://localhost/Event-yetu/backend/api/bookings_enhanced.php?action=create-multi',
        bookingData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        toast.success('Booking created successfully!');
        
        // Clear cart and form
        setCart([]);
        setEventDate('');
        setEventTime('');
        setVenue('');
        setNotes('');
        
        // Navigate to bookings page or show receipt
        setTimeout(() => {
          navigate('/client', { state: { tab: 'bookings', bookingId: response.data.booking.id } });
        }, 1500);
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.error || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Multi-Service Booking</h1>
                <p className="text-xs text-gray-500">Select multiple services for your event</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                <span>🛒</span>
                <span>{cart.length} {cart.length === 1 ? 'Service' : 'Services'}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Services List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
                
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category === 'All' ? '' : category)}
                      className={`px-4 py-2 rounded-lg transition ${
                        (category === 'All' && !selectedCategory) || selectedCategory === category
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Services Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {loading ? (
                [1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                    <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))
              ) : filteredServices.length === 0 ? (
                <div className="col-span-2 text-center py-12">
                  <span className="text-6xl mb-4 block">🔍</span>
                  <p className="text-gray-500">No services found</p>
                </div>
              ) : (
                filteredServices.map(service => (
                  <div key={service.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden group">
                    {service.image_url ? (
                      <img
                        src={`http://localhost/Event-yetu/${service.image_url}`}
                        alt={service.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                        <span className="text-6xl">🎉</span>
                      </div>
                    )}
                    
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 group-hover:text-indigo-600 transition">
                            {service.name}
                          </h3>
                          <p className="text-sm text-gray-500">{service.category}</p>
                        </div>
                      </div>
                      
                      {service.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {service.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-indigo-600">
                          Ksh {parseFloat(service.price).toLocaleString()}
                        </span>
                        
                        <button
                          onClick={() => addToCart(service)}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                        >
                          <span>➕</span>
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Cart & Booking Details */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Cart */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>🛒</span>
                  <span>Your Cart ({cart.length})</span>
                </h3>
                
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-4xl mb-2 block">🛒</span>
                    <p className="text-gray-500 text-sm">Cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.service_id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm text-gray-800">{item.name}</h4>
                            <p className="text-xs text-gray-500">{item.category}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.service_id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.service_id, item.quantity - 1)}
                              className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                            >
                              −
                            </button>
                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.service_id, item.quantity + 1)}
                              className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                          
                          <span className="font-bold text-indigo-600">
                            Ksh {(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {cart.length > 0 && (
                  <div className="mt-4 pt-4 border-t-2 border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold">Ksh {calculateTotal().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold text-indigo-600">
                      <span>Total:</span>
                      <span>Ksh {calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Event Details */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>📅</span>
                  <span>Event Details</span>
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Time (Optional)
                    </label>
                    <input
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Venue (Optional)
                    </label>
                    <input
                      type="text"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="Event location"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any special requirements..."
                      rows="3"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                    ></textarea>
                  </div>
                  
                  <button
                    onClick={handleSubmitBooking}
                    disabled={cart.length === 0 || !eventDate || submitting}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>✓</span>
                        <span>Complete Booking</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiServiceBooking;
