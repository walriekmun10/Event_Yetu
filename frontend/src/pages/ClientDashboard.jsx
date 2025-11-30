import React, { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { CartContext } from '../context/CartContext'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import PaymentModal from '../components/PaymentModal'
import PaymentHistory from '../components/PaymentHistory'
import SmartRecommendations from '../components/SmartRecommendations'

const API_BASE = 'http://localhost/Event-yetu/backend/api'

export default function ClientDashboard(){
  const { user, logout, token } = useContext(AuthContext)
  const { cart, addToCart, removeFromCart, updateCartItemDate, clearCart, getCartTotal, getCartCount } = useContext(CartContext)
  const [services, setServices] = useState([])
  const [bookings, setBookings] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sortBy, setSortBy] = useState('name') // 'name', 'price-low', 'price-high'
  const [activeTab, setActiveTab] = useState('recommendations') // 'recommendations', 'browse', 'bookings', 'cart', or 'payments'
  const [loading, setLoading] = useState(true)
  const [editingBooking, setEditingBooking] = useState(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const [paymentModal, setPaymentModal] = useState(null) // { booking, show }
  const navigate = useNavigate()

  useEffect(()=>{
    if(!user){ navigate('/login'); return }
    loadData()
  },[user])

  const loadData = async ()=>{
    setLoading(true)
    try{
      await Promise.all([loadServices(), loadBookings()])
    } catch(err){
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadServices = async ()=>{
    try{
      const res = await axios.get(`${API_BASE}/services.php`)
      setServices(res.data)
    }catch(err){ 
      console.error(err)
      throw err
    }
  }

  const loadBookings = async ()=>{
    try{
      const res = await axios.get(`${API_BASE}/bookings.php?token=${token}`)
      setBookings(res.data)
    }catch(err){ 
      console.error(err)
      throw err
    }
  }

  const filtered = services
    .filter(s => {
      if(category && s.category !== category) return false
      if(search && !s.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      if(sortBy === 'price-low') return parseFloat(a.price) - parseFloat(b.price)
      if(sortBy === 'price-high') return parseFloat(b.price) - parseFloat(a.price)
      return a.name.localeCompare(b.name)
    })

  const clearFilters = () => {
    setSearch('')
    setCategory('')
    setSortBy('name')
  }

  const getStatusColor = (status) => {
    switch(status){
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleUpdateBooking = async (bookingId, newDate) => {
    try {
      await axios.put(
        `${API_BASE}/bookings.php?id=${bookingId}&token=${token}`,
        { date: newDate }
      )
      toast.success('Booking updated successfully')
      setEditingBooking(null)
      loadBookings()
    } catch (err) {
      toast.error('Failed to update booking')
      console.error(err)
    }
  }

  const handleDeleteBooking = async (bookingId, bookingName) => {
    if (!window.confirm(`Are you sure you want to cancel "${bookingName}"?`)) {
      return
    }

    try {
      await axios.delete(`${API_BASE}/bookings.php?id=${bookingId}&token=${token}`)
      toast.success('Booking cancelled successfully')
      loadBookings()
    } catch (err) {
      toast.error('Failed to cancel booking')
      console.error(err)
    }
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    // Validate all items have event dates
    const missingDates = cart.filter(item => !item.eventDate)
    if (missingDates.length > 0) {
      toast.error('Please set event dates for all items in cart')
      return
    }

    setCheckingOut(true)
    try {
      // Create bookings for all items in cart
      const bookingPromises = cart.map(item =>
        axios.post(`${API_BASE}/bookings.php`, {
          service_id: item.id,
          date: item.eventDate
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      )

      await Promise.all(bookingPromises)
      
      toast.success(`Successfully booked ${cart.length} service(s)!`)
      clearCart()
      loadBookings()
      setActiveTab('bookings')
    } catch (err) {
      toast.error('Failed to complete checkout')
      console.error(err)
    } finally {
      setCheckingOut(false)
    }
  }

  const categories = [
    { name: 'All Categories', value: '', icon: '🎯' },
    { name: 'Speakers', value: 'Speakers', icon: '🎤' },
    { name: 'MCs', value: 'MCs', icon: '🎭' },
    { name: 'DJs', value: 'DJs', icon: '🎧' },
    { name: 'Tents', value: 'Tents', icon: '⛺' },
    { name: 'Sound Systems', value: 'Sound Systems', icon: '🔊' },
    { name: 'Lighting Systems', value: 'Lighting Systems', icon: '💡' },
  ]

  const stats = {
    totalBookings: bookings.length,
    confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    availableServices: services.length,
    cartItems: getCartCount(),
    cartTotal: getCartTotal()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Event Yetu</h1>
                <p className="text-xs text-gray-500">Client Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setActiveTab('cart')}
                  className="relative bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition duration-200 shadow-md flex items-center space-x-2"
                >
                  <span className="text-xl">🛒</span>
                  <span className="font-medium">Cart</span>
                  {getCartCount() > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {getCartCount()}
                    </span>
                  )}
                </button>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500">Client Account</p>
              </div>
              <button 
                onClick={logout} 
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition duration-200 shadow-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalBookings}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Confirmed</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.confirmedBookings}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Pending</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.pendingBookings}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Services Available</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.availableServices}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎉</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`flex-1 py-4 px-6 font-medium transition ${
                activeTab === 'recommendations' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-center space-x-2">
                <span>✨</span>
                <span>For You</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('browse')}
              className={`flex-1 py-4 px-6 font-medium transition ${
                activeTab === 'browse' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-center space-x-2">
                <span>🔍</span>
                <span>Browse Services</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('cart')}
              className={`flex-1 py-4 px-6 font-medium transition ${
                activeTab === 'cart' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-center space-x-2">
                <span>🛒</span>
                <span>My Cart</span>
                {getCartCount() > 0 && (
                  <span className={`${activeTab === 'cart' ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'} text-xs font-bold px-2 py-1 rounded-full`}>
                    {getCartCount()}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex-1 py-4 px-6 font-medium transition ${
                activeTab === 'bookings' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-center space-x-2">
                <span>📋</span>
                <span>My Bookings</span>
                {bookings.length > 0 && (
                  <span className={`${activeTab === 'bookings' ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'} text-xs font-bold px-2 py-1 rounded-full`}>
                    {bookings.length}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 py-4 px-6 font-medium transition ${
                activeTab === 'payments' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-center space-x-2">
                <span>💳</span>
                <span>Payments</span>
              </span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {/* Loading Skeletons */}
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-gray-200 rounded-xl h-48 animate-pulse"></div>
                ))}
              </div>
            ) : (
              <>
                {/* Recommendations Tab */}
                {activeTab === 'recommendations' && (
                  <SmartRecommendations />
                )}

                {/* Browse Services Tab */}
                {activeTab === 'browse' && (
                  <div>
                    {/* Search and Filter */}
                    <div className="mb-6">
                      <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1 relative">
                          <input 
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition" 
                            placeholder="Search for services, providers..." 
                            value={search} 
                            onChange={e=>setSearch(e.target.value)} 
                          />
                          <span className="absolute left-4 top-3.5 text-gray-400 text-xl">🔍</span>
                        </div>
                        <select 
                          value={sortBy}
                          onChange={e=>setSortBy(e.target.value)}
                          className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition"
                        >
                          <option value="name">Sort: Name (A-Z)</option>
                          <option value="price-low">Sort: Price (Low to High)</option>
                          <option value="price-high">Sort: Price (High to Low)</option>
                        </select>
                        {(search || category) && (
                          <button 
                            onClick={clearFilters}
                            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
                          >
                            Clear Filters
                          </button>
                        )}
                        <button 
                          onClick={loadServices}
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition shadow-md"
                        >
                          🔄 Refresh
                        </button>
                      </div>

                      {/* Category Pills */}
                      <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                          <button
                            key={cat.value}
                            onClick={() => setCategory(cat.value)}
                            className={`px-4 py-2 rounded-full font-medium transition ${
                              category === cat.value
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <span className="mr-1">{cat.icon}</span>
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Services Grid */}
                    {filtered.length === 0 ? (
                      <div className="text-center py-20">
                        <div className="text-6xl mb-4">🔍</div>
                        <p className="text-xl text-gray-600 font-medium">No services found</p>
                        <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map(s=>(
                          <div 
                            key={s.id} 
                            className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-gray-100 transform hover:-translate-y-1"
                          >
                            {/* Service Image */}
                            <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden">
                              {s.image ? (
                                <img 
                                  src={`http://localhost/Event-yetu/backend/uploads/${s.image}`} 
                                  alt={s.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-6xl group-hover:scale-110 transition duration-500">
                                  {categories.find(c => c.value === s.category)?.icon || '🎉'}
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition duration-300"></div>
                              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-gray-800 shadow-lg">
                                {s.category}
                              </div>
                              {cart.some(item => item.id === s.id) && (
                                <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg animate-pulse">
                                  ✓ In Cart
                                </div>
                              )}
                            </div>

                            {/* Service Details */}
                            <div className="p-5">
                              <h3 className="font-bold text-xl text-gray-800 mb-2 group-hover:text-blue-600 transition line-clamp-1">
                                {s.name}
                              </h3>
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2 min-h-[40px]">
                                {s.description || 'No description available'}
                              </p>
                              
                              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <div>
                                  <p className="text-xs text-gray-500">Provider</p>
                                  <p className="text-sm font-medium text-gray-700 line-clamp-1">{s.provider_name}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">Price</p>
                                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Ksh {parseInt(s.price).toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 flex gap-2">
                                <Link
                                  to={`/service/${s.id}`}
                                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2.5 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition text-center shadow-md hover:shadow-lg transform hover:scale-105"
                                >
                                  View Details
                                </Link>
                                <button
                                  onClick={() => addToCart(s)}
                                  disabled={cart.some(item => item.id === s.id)}
                                  className={`flex-1 py-2.5 rounded-lg font-medium transition shadow-md transform hover:scale-105 ${
                                    cart.some(item => item.id === s.id)
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-lg'
                                  }`}
                                >
                                  {cart.some(item => item.id === s.id) ? '✓ Added' : '🛒 Add'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Cart Tab */}
                {activeTab === 'cart' && (
                  <div>
                    {cart.length === 0 ? (
                      <div className="text-center py-20">
                        <div className="text-6xl mb-4">🛒</div>
                        <p className="text-xl text-gray-600 font-medium">Your cart is empty</p>
                        <p className="text-gray-500 mt-2 mb-6">Add services to your cart to book them together</p>
                        <button
                          onClick={() => setActiveTab('browse')}
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition shadow-md"
                        >
                          Browse Services
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-6 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 p-6 rounded-xl border-2 border-blue-200 shadow-lg">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-sm text-gray-600 font-medium">Cart Summary</p>
                              <p className="text-3xl font-bold text-gray-800 mt-1">
                                {cart.length} Service{cart.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600 font-medium">Total Amount</p>
                              <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-1">
                                Ksh {getCartTotal().toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="mt-4">
                            <div className="flex justify-between text-xs text-gray-600 mb-2">
                              <span>Items with dates: {cart.filter(i => i.eventDate).length}/{cart.length}</span>
                              <span>{Math.round((cart.filter(i => i.eventDate).length / cart.length) * 100)}% Complete</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${(cart.filter(i => i.eventDate).length / cart.length) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4 mb-6">
                          {cart.map((item, index) => (
                            <div 
                              key={item.id} 
                              className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                              style={{ animationDelay: `${index * 100}ms` }}
                            >
                              <div className="flex flex-col md:flex-row gap-4">
                                {/* Service Image */}
                                <div className="w-full md:w-40 h-40 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden flex-shrink-0 shadow-lg">
                                  {item.image ? (
                                    <img 
                                      src={`http://localhost/Event-yetu/backend/uploads/${item.image}`} 
                                      alt={item.name}
                                      className="w-full h-full object-cover hover:scale-110 transition duration-300"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white text-5xl">
                                      {categories.find(c => c.value === item.category)?.icon || '🎉'}
                                    </div>
                                  )}
                                </div>

                                {/* Service Details */}
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <h3 className="font-bold text-xl text-gray-800 mb-1">{item.name}</h3>
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                                          {item.category}
                                        </span>
                                        <span>•</span>
                                        <span>{item.provider_name}</span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs text-gray-500 mb-1">Price</p>
                                      <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        Ksh {parseInt(item.price).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>

                                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                    {item.description || 'No description available'}
                                  </p>

                                  {/* Event Date Picker */}
                                  <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        📅 Event Date <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                        type="date"
                                        value={item.eventDate}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => updateCartItemDate(item.id, e.target.value)}
                                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition shadow-sm"
                                      />
                                    </div>
                                    <button
                                      onClick={() => removeFromCart(item.id)}
                                      className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition mt-7 shadow-md hover:shadow-lg transform hover:scale-105"
                                    >
                                      🗑️ Remove
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Checkout Actions */}
                        <div className="flex flex-col sm:flex-row gap-4">
                          <button
                            onClick={clearCart}
                            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition shadow-md hover:shadow-lg transform hover:scale-105 font-medium"
                          >
                            🗑️ Clear Cart
                          </button>
                          <button
                            onClick={handleCheckout}
                            disabled={checkingOut || cart.some(item => !item.eventDate)}
                            className={`flex-1 py-4 rounded-xl font-bold text-lg transition shadow-lg transform ${
                              checkingOut || cart.some(item => !item.eventDate)
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-green-500 via-green-600 to-green-700 text-white hover:from-green-600 hover:via-green-700 hover:to-green-800 hover:shadow-2xl hover:scale-105 animate-pulse'
                            }`}
                          >
                            {checkingOut ? (
                              <span className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Processing...
                              </span>
                            ) : (
                              `🎉 Checkout - Ksh ${getCartTotal().toLocaleString()}`
                            )}
                          </button>
                        </div>
                        
                        {cart.some(item => !item.eventDate) && (
                          <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                            <div className="flex items-start">
                              <span className="text-2xl mr-3">⚠️</span>
                              <div>
                                <p className="font-semibold text-yellow-800">Action Required</p>
                                <p className="text-sm text-yellow-700 mt-1">
                                  Please set event dates for all items before checkout
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* My Bookings Tab */}
                {activeTab === 'bookings' && (
                  <div>
                    {bookings.length === 0 ? (
                      <div className="text-center py-20">
                        <div className="text-6xl mb-4">📋</div>
                        <p className="text-xl text-gray-600 font-medium">No bookings yet</p>
                        <p className="text-gray-500 mt-2 mb-6">Start by browsing our amazing services</p>
                        <button
                          onClick={() => setActiveTab('browse')}
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition shadow-md"
                        >
                          Browse Services
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {bookings.map((b, index)=>(
                          <div 
                            key={b.id} 
                            className="bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-l-4 border-blue-500 transform hover:-translate-y-1"
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h3 className="font-bold text-xl text-gray-800 mb-1">{b.service_name}</h3>
                                    <p className="text-sm text-gray-600">Booking #{b.id}</p>
                                  </div>
                                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${getStatusColor(b.status)}`}>
                                    {b.status}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 bg-gray-50 p-4 rounded-lg">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-xl">👤</span>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500 font-medium">Provider</p>
                                      <p className="text-sm font-semibold text-gray-700">{b.provider_name}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-xl">📅</span>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500 font-medium">Event Date</p>
                                      {editingBooking === b.id ? (
                                        <input
                                          type="date"
                                          defaultValue={b.date}
                                          min={new Date().toISOString().split('T')[0]}
                                          className="text-sm font-semibold text-gray-700 border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                          onBlur={(e) => {
                                            if (e.target.value !== b.date) {
                                              handleUpdateBooking(b.id, e.target.value)
                                            } else {
                                              setEditingBooking(null)
                                            }
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              if (e.target.value !== b.date) {
                                                handleUpdateBooking(b.id, e.target.value)
                                              } else {
                                                setEditingBooking(null)
                                              }
                                            } else if (e.key === 'Escape') {
                                              setEditingBooking(null)
                                            }
                                          }}
                                          autoFocus
                                        />
                                      ) : (
                                        <p className="text-sm font-semibold text-gray-700">
                                          {new Date(b.date).toLocaleDateString('en-US', { 
                                            weekday: 'short', 
                                            year: 'numeric', 
                                            month: 'short', 
                                            day: 'numeric' 
                                          })}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-xl">🆔</span>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500 font-medium">Reference</p>
                                      <p className="text-sm font-semibold text-gray-700">#{b.id}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex md:flex-col gap-2 flex-wrap">
                                {(b.status === 'pending' || b.status === 'booked') && !b.payment_status && (
                                  <button
                                    onClick={() => setPaymentModal({ booking: { ...b, serviceName: b.service_name }, show: true })}
                                    className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition text-sm font-medium text-center shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
                                  >
                                    💳 Pay Now
                                  </button>
                                )}
                                <Link
                                  to={`/service/${b.service_id}`}
                                  className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition text-sm font-medium text-center shadow-md hover:shadow-lg transform hover:scale-105"
                                >
                                  📄 View Service
                                </Link>
                                {(b.status === 'pending' || b.status === 'booked') && (
                                  <>
                                    <button
                                      onClick={() => setEditingBooking(b.id)}
                                      className="px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                                    >
                                      ✏️ Edit Date
                                    </button>
                                    <button
                                      onClick={() => handleDeleteBooking(b.id, b.service_name)}
                                      className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                                    >
                                      🗑️ Cancel
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Payments Tab */}
                {activeTab === 'payments' && (
                  <PaymentHistory />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModal?.show && (
        <PaymentModal
          booking={paymentModal.booking}
          onClose={() => setPaymentModal(null)}
          onSuccess={(paymentId) => {
            setPaymentModal(null)
            toast.success('Payment completed successfully!')
            loadBookings()
          }}
        />
      )}
    </div>
  )
}
