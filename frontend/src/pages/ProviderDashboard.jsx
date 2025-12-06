import React, { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler, defaults } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler)

// Chart.js defaults for better aesthetics
defaults.font.family = "'Inter', 'system-ui', 'sans-serif'"
defaults.color = '#4B5563'

const API_BASE = 'http://localhost/Event-yetu/backend/api'

export default function ProviderDashboard(){
  const { user, logout, token } = useContext(AuthContext)
  const [services, setServices] = useState([])
  const [bookings, setBookings] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({name:'',category:'Speakers',description:'',price:'',image:null})
  const [imageFile, setImageFile] = useState(null)
  const [activeTab, setActiveTab] = useState('overview') // 'overview', 'services', 'bookings'
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(()=>{
    if(!user || user.role !== 'provider'){ navigate('/login'); return }
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
      const res = await axios.get(`${API_BASE}/services.php?token=${token}`)
      // Backend now filters to provider's own services automatically
      setServices(res.data)
    }catch(err){ 
      toast.error('Failed to load services')
      throw err
    }
  }

  const loadBookings = async ()=>{
    try{
      const res = await axios.get(`${API_BASE}/bookings.php?token=${token}`)
      // Backend now filters to provider's own bookings automatically
      setBookings(res.data)
    }catch(err){ 
      toast.error('Failed to load bookings')
      throw err
    }
  }

  const handleSubmit = async (e)=>{
    e.preventDefault()
    try{
      let imageFilename = form.image
      if(imageFile){
        const fd = new FormData()
        fd.append('image', imageFile)
        const uploadRes = await axios.post(`${API_BASE}/upload.php?token=${token}`, fd, { 
          headers: { 'Content-Type': 'multipart/form-data' } 
        })
        imageFilename = uploadRes.data.filename
      }
      
      const payload = { ...form, image: imageFilename }
      
      if(editId){
        await axios.put(`${API_BASE}/services.php?id=${editId}&token=${token}`, payload, {
          headers: { 'Content-Type': 'application/json' }
        })
        toast.success('Service updated')
      }else{
        await axios.post(`${API_BASE}/services.php?token=${token}`, payload, {
          headers: { 'Content-Type': 'application/json' }
        })
        toast.success('Service created - pending admin approval')
      }
      setShowModal(false)
      setForm({name:'',category:'Speakers',description:'',price:'',image:null})
      setEditId(null)
      setImageFile(null)
      loadServices()
    }catch(err){ 
      toast.error(err.response?.data?.error || 'Failed to save service') 
    }
  }

  const handleDelete = async (id)=>{
    if(!window.confirm('Delete this service?')) return
    try{
      await axios.delete(`${API_BASE}/services.php?id=${id}&token=${token}`)
      toast.success('Service deleted')
      loadServices()
    }catch(err){ toast.error('Failed to delete') }
  }

  const handleUpdateBookingStatus = async (id, status)=>{
    try{
      await axios.put(`${API_BASE}/bookings.php?id=${id}&token=${token}`, { status })
      toast.success(`Booking ${status}`)
      loadBookings()
    }catch(err){ toast.error('Failed to update booking') }
  }

  const openEdit = (s)=>{ 
    setForm({name:s.name,category:s.category,description:s.description,price:s.price,image:s.image})
    setEditId(s.id)
    setShowModal(true)
    setImageFile(null)
  }

  // Analytics calculations
  const stats = {
    totalServices: services.length,
    approvedServices: services.filter(s => s.status === 'approved').length,
    pendingServices: services.filter(s => s.status === 'pending').length,
    totalBookings: bookings.filter(b => b.status !== 'cancelled').length,
    confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
    totalRevenue: bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => {
        const service = services.find(s => s.id == b.service_id)
        return sum + (service ? parseFloat(service.price) : 0)
      }, 0),
    potentialRevenue: bookings
      .filter(b => b.status === 'pending')
      .reduce((sum, b) => {
        const service = services.find(s => s.id == b.service_id)
        return sum + (service ? parseFloat(service.price) : 0)
      }, 0)
  }

  // Chart data
  const bookingsByService = services.map(s => ({
    name: s.name,
    count: bookings.filter(b => b.service_id == s.id).length
  })).sort((a, b) => b.count - a.count).slice(0, 5)

  const bookingsOverTime = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentYear = new Date().getFullYear()
    const monthlyCounts = months.map((month, idx) => {
      return bookings.filter(b => {
        const date = new Date(b.date)
        return date.getMonth() === idx && date.getFullYear() === currentYear
      }).length
    })
    return { labels: months, data: monthlyCounts }
  })()

  const statusDistribution = {
    labels: ['Confirmed', 'Pending', 'Cancelled'],
    datasets: [{
      data: [stats.confirmedBookings, stats.pendingBookings, stats.cancelledBookings],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
      borderWidth: 0
    }]
  }

  const popularServicesChart = {
    labels: bookingsByService.map(s => s.name),
    datasets: [{
      label: 'Bookings',
      data: bookingsByService.map(s => s.count),
      backgroundColor: 'rgba(147, 51, 234, 0.7)',
      borderColor: 'rgba(147, 51, 234, 1)',
      borderWidth: 2,
      borderRadius: 8,
      barThickness: 45
    }]
  }

  const monthlyTrendChart = {
    labels: bookingsOverTime.labels,
    datasets: [{
      label: 'Monthly Bookings',
      data: bookingsOverTime.data,
      borderColor: 'rgba(59, 130, 246, 1)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
      borderWidth: 3,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: 'rgba(59, 130, 246, 1)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }]
  }

  // Calculate average booking value
  const avgBookingValue = stats.confirmedBookings > 0 
    ? Math.round(stats.totalRevenue / stats.confirmedBookings) 
    : 0

  // Calculate completion rate
  const completionRate = stats.totalBookings > 0
    ? Math.round((stats.confirmedBookings / stats.totalBookings) * 100)
    : 0

  const getStatusColor = (status) => {
    switch(status){
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'approved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const categories = ['Speakers', 'MCs', 'DJs', 'Tents', 'Sound Systems', 'Lighting Systems']

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Event Yetu</h1>
                <p className="text-xs text-gray-500">Provider Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500">Service Provider</p>
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
        {loading ? (
          <div className="space-y-6">
            {/* Loading Skeletons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-xl h-32 animate-pulse"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map(i => (
                <div key={i} className="bg-white rounded-xl h-80 animate-pulse"></div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="mb-6 bg-white rounded-2xl shadow-md p-1.5 inline-flex gap-1">
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-2.5 px-6 rounded-xl font-semibold transition-all duration-200 ${
                  activeTab === 'analytics' 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                📊 Analytics
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`py-2.5 px-6 rounded-xl font-semibold transition-all duration-200 ${
                  activeTab === 'services' 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                🎉 Services {services.length > 0 && `(${services.length})`}
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`py-2.5 px-6 rounded-xl font-semibold transition-all duration-200 ${
                  activeTab === 'bookings' 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                📅 Bookings {bookings.length > 0 && `(${bookings.length})`}
              </button>
            </div>

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Total Revenue</p>
                        <p className="text-3xl font-bold text-gray-800 mt-2">
                          Ksh {stats.totalRevenue.toLocaleString()}
                        </p>
                        <p className="text-xs text-purple-600 mt-2 font-semibold">
                          {stats.confirmedBookings} completed bookings
                        </p>
                      </div>
                      <div className="bg-purple-100 p-4 rounded-xl">
                        <span className="text-3xl">💰</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Pending Revenue</p>
                        <p className="text-3xl font-bold text-gray-800 mt-2">
                          Ksh {stats.potentialRevenue.toLocaleString()}
                        </p>
                        <p className="text-xs text-blue-600 mt-2 font-semibold">
                          {stats.pendingBookings} pending bookings
                        </p>
                      </div>
                      <div className="bg-blue-100 p-4 rounded-xl">
                        <span className="text-3xl">⏳</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Active Services</p>
                        <p className="text-3xl font-bold text-gray-800 mt-2">{stats.approvedServices}</p>
                        <p className="text-xs text-green-600 mt-2 font-semibold">
                          {stats.pendingServices} pending approval
                        </p>
                      </div>
                      <div className="bg-green-100 p-4 rounded-xl">
                        <span className="text-3xl">🎉</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Total Bookings</p>
                        <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalBookings}</p>
                        <p className="text-xs text-orange-600 mt-2 font-semibold">
                          {completionRate}% completion rate
                        </p>
                      </div>
                      <div className="bg-orange-100 p-4 rounded-xl">
                        <span className="text-3xl">📅</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Most Booked Services */}
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">🏆</span>
                      Top Performing Services
                    </h3>
                    {bookingsByService.length > 0 ? (
                      <Bar 
                        data={popularServicesChart} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: true,
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              padding: 12,
                              titleFont: { size: 14, weight: 'bold' },
                              bodyFont: { size: 13 },
                              cornerRadius: 8,
                              callbacks: {
                                label: (context) => `${context.parsed.y} bookings`
                              }
                            }
                          },
                          scales: {
                            y: { 
                              beginAtZero: true, 
                              ticks: { 
                                stepSize: 1,
                                font: { size: 12 }
                              },
                              grid: { color: 'rgba(0, 0, 0, 0.05)' }
                            },
                            x: {
                              grid: { display: false },
                              ticks: { font: { size: 12 } }
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="text-center py-12 text-gray-400">
                        <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="font-medium">No booking data yet</p>
                      </div>
                    )}
                  </div>

                  {/* Booking Status Distribution */}
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📊</span>
                      Booking Status Distribution
                    </h3>
                    {stats.totalBookings > 0 ? (
                      <Doughnut 
                        data={statusDistribution}
                        options={{
                          responsive: true,
                          maintainAspectRatio: true,
                          plugins: {
                            legend: { 
                              position: 'bottom',
                              labels: {
                                padding: 15,
                                font: { size: 13, weight: '600' },
                                usePointStyle: true,
                                pointStyle: 'circle'
                              }
                            },
                            tooltip: {
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              padding: 12,
                              titleFont: { size: 14, weight: 'bold' },
                              bodyFont: { size: 13 },
                              cornerRadius: 8,
                              callbacks: {
                                label: function(context) {
                                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                  const percentage = ((context.parsed / total) * 100).toFixed(1);
                                  return `${context.label}: ${context.parsed} (${percentage}%)`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="text-center py-12 text-gray-400">
                        <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                        </svg>
                        <p className="font-medium">No bookings yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">💡</span>
                      Key Metrics
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                        <div>
                          <p className="text-sm text-purple-700 font-semibold mb-1">Avg Booking Value</p>
                          <p className="text-2xl font-bold text-purple-900">
                            Ksh {avgBookingValue.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-purple-200 p-3 rounded-lg">
                          <svg className="w-8 h-8 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                        <div>
                          <p className="text-sm text-green-700 font-semibold mb-1">Completion Rate</p>
                          <p className="text-2xl font-bold text-green-900">{completionRate}%</p>
                        </div>
                        <div className="bg-green-200 p-3 rounded-lg">
                          <svg className="w-8 h-8 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Trend - Spans 2 columns */}
                  <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📈</span>
                      Monthly Booking Trends (2025)
                    </h3>
                    <Line 
                      data={monthlyTrendChart}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            titleFont: { size: 14, weight: 'bold' },
                            bodyFont: { size: 13 },
                            cornerRadius: 8
                          }
                        },
                        scales: {
                          y: { 
                            beginAtZero: true, 
                            ticks: { 
                              stepSize: 1,
                              font: { size: 12 }
                            },
                            grid: { color: 'rgba(0, 0, 0, 0.05)' }
                          },
                          x: {
                            grid: { display: false },
                            ticks: { font: { size: 12 } }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">My Services</h2>
                  <button 
                    onClick={()=>{
                      setShowModal(true)
                      setEditId(null)
                      setForm({name:'',category:'Speakers',description:'',price:'',image:null})
                      setImageFile(null)
                    }} 
                    className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-blue-700 transition shadow-md font-medium"
                  >
                    + Add New Service
                  </button>
                </div>

                {services.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-md p-20 text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <p className="text-xl text-gray-600 font-medium">No services yet</p>
                    <p className="text-gray-500 mt-2 mb-6">Create your first service to get started</p>
                    <button 
                      onClick={()=>{
                        setShowModal(true)
                        setEditId(null)
                        setForm({name:'',category:'Speakers',description:'',price:'',image:null})
                        setImageFile(null)
                      }} 
                      className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-blue-700 transition shadow-md"
                    >
                      Create Service
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((s, index)=>(
                      <div 
                        key={s.id} 
                        className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 transform hover:-translate-y-2 group"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        {/* Service Image */}
                        <div className="relative h-48 bg-gradient-to-br from-purple-400 to-blue-500 overflow-hidden">
                          {s.image ? (
                            <img 
                              src={`http://localhost/Event-yetu/backend/uploads/${s.image}`} 
                              alt={s.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-6xl group-hover:scale-110 transition duration-500">
                              🎉
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition duration-300"></div>
                          <div className="absolute top-3 right-3">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg ${getStatusColor(s.status)}`}>
                              {s.status}
                            </span>
                          </div>
                          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-gray-800 shadow-lg">
                            {s.category}
                          </div>
                        </div>

                        {/* Service Details */}
                        <div className="p-5">
                          <h3 className="font-bold text-xl text-gray-800 mb-2 group-hover:text-purple-600 transition line-clamp-1">
                            {s.name}
                          </h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2 min-h-[40px]">
                            {s.description || 'No description'}
                          </p>
                          
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100 mb-4">
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Price</p>
                              <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                Ksh {parseInt(s.price).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500 font-medium">Bookings</p>
                              <p className="text-2xl font-bold text-gray-800">
                                {bookings.filter(b => b.service_id == s.id).length}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button 
                              onClick={()=>openEdit(s)} 
                              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2.5 rounded-lg hover:from-blue-600 hover:to-blue-700 transition font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                            >
                              ✏️ Edit
                            </button>
                            <button 
                              onClick={()=>handleDelete(s.id)} 
                              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2.5 rounded-lg hover:from-red-600 hover:to-red-700 transition font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Service Bookings</h2>
                  <button 
                    onClick={loadBookings}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition shadow-md"
                  >
                    🔄 Refresh
                  </button>
                </div>

                {bookings.filter(b => b.status !== 'cancelled').length === 0 ? (
                  <div className="bg-white rounded-xl shadow-md p-20 text-center">
                    <div className="text-6xl mb-4">📅</div>
                    <p className="text-xl text-gray-600 font-medium">No bookings yet</p>
                    <p className="text-gray-500 mt-2">Bookings will appear here when clients book your services</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.filter(b => b.status !== 'cancelled').map(b=>{
                      const service = services.find(s => s.id == b.service_id)
                      return (
                        <div key={b.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-6 border border-gray-100">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="font-bold text-xl text-gray-800">{b.service_name}</h3>
                                  <p className="text-sm text-gray-500">Booking ID: #{b.id}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(b.status)}`}>
                                  {b.status?.toUpperCase()}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="flex items-center space-x-2">
                                  <span className="text-2xl">👤</span>
                                  <div>
                                    <p className="text-xs text-gray-500">Client</p>
                                    <p className="text-sm font-medium text-gray-700">{b.client_name}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <span className="text-2xl">📅</span>
                                  <div>
                                    <p className="text-xs text-gray-500">Event Date</p>
                                    <p className="text-sm font-medium text-gray-700">{b.date}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <span className="text-2xl">💰</span>
                                  <div>
                                    <p className="text-xs text-gray-500">Price</p>
                                    <p className="text-sm font-medium text-gray-700">
                                      Ksh {service ? parseInt(service.price).toLocaleString() : 'N/A'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <span className="text-2xl">📋</span>
                                  <div>
                                    <p className="text-xs text-gray-500">Category</p>
                                    <p className="text-sm font-medium text-gray-700">{service?.category || 'N/A'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex lg:flex-col gap-2">
                              {b.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleUpdateBookingStatus(b.id, 'confirmed')}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm font-medium whitespace-nowrap"
                                  >
                                    ✅ Confirm
                                  </button>
                                  <button
                                    onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium whitespace-nowrap"
                                  >
                                    ❌ Cancel
                                  </button>
                                </>
                              )}
                              {b.status === 'confirmed' && (
                                <button
                                  onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')}
                                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium whitespace-nowrap"
                                >
                                  ❌ Cancel
                                </button>
                              )}
                              {b.status === 'cancelled' && (
                                <span className="text-sm text-gray-500 italic">No actions available</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Service Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all animate-slideUp">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 text-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  {editId ? '✏️ Edit Service' : '➕ Add New Service'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Service Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition shadow-sm" 
                    placeholder="e.g., Professional DJ Services" 
                    value={form.name} 
                    onChange={e=>setForm({...form,name:e.target.value})} 
                    required 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select 
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition shadow-sm" 
                    value={form.category} 
                    onChange={e=>setForm({...form,category:e.target.value})}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea 
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition shadow-sm resize-none" 
                    placeholder="Describe your service in detail..." 
                    value={form.description} 
                    onChange={e=>setForm({...form,description:e.target.value})}
                    rows="4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price (Ksh) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-gray-500 font-medium">Ksh</span>
                    <input 
                      type="number" 
                      className="w-full pl-16 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition shadow-sm" 
                      placeholder="10,000" 
                      value={form.price} 
                      onChange={e=>setForm({...form,price:e.target.value})} 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Service Image</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-500 transition">
                    <input 
                      type="file" 
                      accept="image/jpeg,image/png" 
                      className="hidden" 
                      id="imageInput"
                      onChange={e=>setImageFile(e.target.files[0])} 
                    />
                    <label htmlFor="imageInput" className="cursor-pointer">
                      <div className="text-4xl mb-2">📸</div>
                      <p className="text-sm text-gray-600">Click to upload image</p>
                      <p className="text-xs text-gray-500 mt-1">Max 2MB, JPG/PNG only</p>
                    </label>
                    {imageFile && (
                      <p className="text-sm text-green-600 mt-2 font-medium">✓ {imageFile.name}</p>
                    )}
                    {form.image && !imageFile && (
                      <p className="text-sm text-blue-600 mt-2 font-medium">✓ Current: {form.image}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8 pt-6 border-t sticky bottom-0 bg-white">
                <button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 text-white px-6 py-4 rounded-xl hover:from-purple-700 hover:to-blue-700 transition shadow-lg font-bold text-lg transform hover:scale-105"
                >
                  {editId ? '💾 Update Service' : '➕ Create Service'}
                </button>
                <button 
                  type="button" 
                  onClick={()=>setShowModal(false)} 
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-4 rounded-xl hover:bg-gray-300 transition font-semibold text-lg transform hover:scale-105"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
