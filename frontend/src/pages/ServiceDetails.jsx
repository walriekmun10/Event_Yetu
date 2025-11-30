import React, { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { CartContext } from '../context/CartContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE = 'http://localhost/Event-yetu/backend/api'

export default function ServiceDetails(){
  const { id } = useParams()
  const { user, token } = useContext(AuthContext)
  const { addToCart, cart } = useContext(CartContext)
  const [service, setService] = useState(null)
  const [date, setDate] = useState('')
  const navigate = useNavigate()

  useEffect(()=>{
    loadService()
  },[id])

  const loadService = async ()=>{
    try{
      const res = await axios.get(`${API_BASE}/services.php`)
      const s = res.data.find(x => x.id == id)
      setService(s)
    }catch(err){ console.error(err) }
  }

  const handleBook = async (e)=>{
    e.preventDefault()
    if(!user){ navigate('/login'); return }
    try{
      await axios.post(`${API_BASE}/bookings.php`, { service_id: id, date }, { headers: { Authorization: `Bearer ${token}` } })
      toast.success('Booking successful!')
      navigate('/client')
    }catch(err){ toast.error('Booking failed') }
  }

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login')
      return
    }
    addToCart(service, date)
    if (date) {
      setDate('') // Reset date after adding to cart
    }
  }

  const isInCart = cart.some(item => item.id == id)

  if(!service) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading service details...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button 
            onClick={()=>navigate(-1)} 
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition group"
          >
            <span className="transform group-hover:-translate-x-1 transition">←</span>
            Back to Services
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Service Image */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition duration-300">
            <div className="relative h-96 bg-gradient-to-br from-blue-400 to-purple-500">
              {service.image ? (
                <img 
                  src={`http://localhost/Event-yetu/backend/uploads/${service.image}`} 
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-9xl">
                  🎉
                </div>
              )}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                <span className="text-sm font-bold text-gray-800">{service.category}</span>
              </div>
              {isInCart && (
                <div className="absolute top-4 left-4 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg font-bold animate-pulse">
                  ✓ In Your Cart
                </div>
              )}
            </div>
          </div>

          {/* Service Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-3">{service.name}</h1>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full">
                  <span className="text-sm">👤</span>
                  <span className="text-sm font-semibold">{service.provider_name}</span>
                </div>
                <div className="flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full">
                  <span className="text-sm">📂</span>
                  <span className="text-sm font-semibold">{service.category}</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6 border-2 border-blue-200">
                <p className="text-sm text-gray-600 font-medium mb-1">Price</p>
                <p className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Ksh {parseInt(service.price).toLocaleString()}
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed">
                  {service.description || 'No description provided for this service.'}
                </p>
              </div>

              {user && user.role !== 'provider' && (
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">📅 Book this Service</h3>
                  <form onSubmit={handleBook} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Select Event Date <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="date" 
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition shadow-sm" 
                        value={date} 
                        onChange={e=>setDate(e.target.value)} 
                        min={new Date().toISOString().split('T')[0]}
                        required 
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <button 
                        type="submit" 
                        className="flex-1 bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition shadow-lg font-bold text-lg transform hover:scale-105"
                      >
                        🎉 Book Now
                      </button>
                      <button 
                        type="button"
                        onClick={handleAddToCart}
                        disabled={isInCart}
                        className={`flex-1 px-6 py-4 rounded-xl font-bold text-lg transition shadow-lg transform hover:scale-105 ${
                          isInCart 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
                        }`}
                      >
                        {isInCart ? '✓ Added' : '🛒 Add to Cart'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {!user && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
                  <div className="flex items-start">
                    <span className="text-3xl mr-3">🔐</span>
                    <div>
                      <p className="font-bold text-yellow-800 mb-2">Login Required</p>
                      <p className="text-sm text-yellow-700 mb-4">
                        Please login to book this service or add it to your cart.
                      </p>
                      <button
                        onClick={() => navigate('/login')}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-semibold shadow-md"
                      >
                        Login Now
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
