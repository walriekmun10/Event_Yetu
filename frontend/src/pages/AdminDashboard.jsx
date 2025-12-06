import React, { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement, Filler, defaults } from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement, Filler)

// Chart.js defaults for better aesthetics
defaults.font.family = "'Inter', 'system-ui', 'sans-serif'"
defaults.color = '#4B5563'

export default function AdminDashboard(){
  const { user, logout, token } = useContext(AuthContext)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const navigate = useNavigate()
  const API_BASE = 'http://localhost/Event-yetu/backend/api'

  useEffect(()=>{
    if(!user || user.role !== 'admin'){ navigate('/login'); return }
    
    axios.get(`${API_BASE}/reports.php?token=${token}`)
      .then(res => {
        setData(res.data)
        setLoading(false)
      })
      .catch(err => {
        toast.error('Failed to load dashboard data')
        setLoading(false)
      })
  },[user, token])

  if(!user || user.role !== 'admin') return null
  
  if(loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-xl font-semibold text-gray-700">Loading Admin Dashboard...</p>
      </div>
    </div>
  )

  const popularData = data && data.popular && data.popular.length > 0 ? {
    labels: data.popular.map(p=>p.name),
    datasets: [{
      label: 'Bookings',
      data: data.popular.map(p=>p.cnt),
      backgroundColor: 'rgba(59, 130, 246, 0.7)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 2,
      borderRadius: 8,
      barThickness: 50
    }]
  } : null

  const statsData = data ? {
    labels: ['Total Users','Service Providers','Active Services','Total Bookings'],
    datasets: [{
      data: [data.users, data.providers, data.services, data.bookings],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(139, 92, 246, 0.8)'
      ],
      borderColor: [
        'rgb(59, 130, 246)',
        'rgb(16, 185, 129)',
        'rgb(245, 158, 11)',
        'rgb(139, 92, 246)'
      ],
      borderWidth: 3
    }]
  } : null

  // Calculate booking status distribution
  const bookingStatusData = data && data.detailedBookings ? {
    labels: ['Completed', 'Confirmed', 'Pending'],
    datasets: [{
      data: [
        data.detailedBookings.filter(b => b.status === 'completed').length,
        data.detailedBookings.filter(b => b.status === 'confirmed').length,
        data.detailedBookings.filter(b => b.status === 'pending').length
      ],
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(245, 158, 11, 0.8)'
      ],
      borderColor: [
        'rgb(16, 185, 129)',
        'rgb(59, 130, 246)',
        'rgb(245, 158, 11)'
      ],
      borderWidth: 2
    }]
  } : null

  // Calculate revenue data
  const totalRevenue = data && data.detailedBookings 
    ? data.detailedBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + parseFloat(b.price || 0), 0)
    : 0

  const pendingRevenue = data && data.detailedBookings 
    ? data.detailedBookings
        .filter(b => b.status === 'pending' || b.status === 'confirmed')
        .reduce((sum, b) => sum + parseFloat(b.price || 0), 0)
    : 0

  const downloadPDF = ()=>{
    toast.promise(
      fetch(`${API_BASE}/reports.php?format=pdf&token=${token}`)
        .then(res => {
          if(!res.ok) throw new Error('Failed to generate PDF')
          return res.blob()
        })
        .then(blob => {
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `event-yetu-report-${new Date().toISOString().split('T')[0]}.pdf`
          a.click()
          window.URL.revokeObjectURL(url)
        }),
      {
        loading: 'Generating PDF report...',
        success: 'PDF downloaded successfully!',
        error: 'Failed to download report'
      }
    )
  }

  const handleLogout = () => {
    toast.success('Logged out successfully')
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <nav className="bg-white shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">Welcome back, {user?.name || 'Admin'}</p>
            </div>
            <button 
              onClick={handleLogout} 
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2.5 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {!data ? (
          <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200">
            <div className="flex items-center gap-3 text-red-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-semibold">Failed to load dashboard data. Please refresh the page.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards - Improved with revenue */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Total Users</p>
                    <p className="text-3xl font-bold text-gray-800">{data.users}</p>
                    <p className="text-xs text-blue-600 mt-2 font-semibold">
                      {data.providers} Providers
                    </p>
                  </div>
                  <div className="bg-blue-100 p-4 rounded-xl">
                    <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-800">
                      Ksh {totalRevenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 mt-2 font-semibold">
                      From completed bookings
                    </p>
                  </div>
                  <div className="bg-green-100 p-4 rounded-xl">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Active Services</p>
                    <p className="text-3xl font-bold text-gray-800">{data.services}</p>
                    <p className="text-xs text-purple-600 mt-2 font-semibold">
                      Avg {data.providers > 0 ? (data.services / data.providers).toFixed(1) : 0} per provider
                    </p>
                  </div>
                  <div className="bg-purple-100 p-4 rounded-xl">
                    <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Total Bookings</p>
                    <p className="text-3xl font-bold text-gray-800">{data.bookings}</p>
                    <p className="text-xs text-orange-600 mt-2 font-semibold">
                      Ksh {pendingRevenue.toLocaleString()} pending
                    </p>
                  </div>
                  <div className="bg-orange-100 p-4 rounded-xl">
                    <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6 bg-white rounded-2xl shadow-md p-1.5 inline-flex gap-1">
              <button 
                onClick={()=>setActiveTab('analytics')}
                className={`py-2.5 px-6 rounded-xl font-semibold transition-all duration-200 ${
                  activeTab === 'analytics' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                📊 Analytics
              </button>
              <button 
                onClick={()=>setActiveTab('bookings')}
                className={`py-2.5 px-6 rounded-xl font-semibold transition-all duration-200 ${
                  activeTab === 'bookings' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                📋 Bookings
              </button>
              <button 
                onClick={()=>setActiveTab('management')}
                className={`py-2.5 px-6 rounded-xl font-semibold transition-all duration-200 ${
                  activeTab === 'management' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                ⚙️ Management
              </button>
            </div>

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Popular Services Chart */}
                  <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">🏆</span>
                      Top Performing Services
                    </h3>
                    {popularData ? (
                      <Bar data={popularData} options={{
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
                      }} />
                    ) : (
                      <div className="text-center py-12 text-gray-400">
                        <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="font-medium">No booking data available</p>
                      </div>
                    )}
                  </div>

                  {/* Booking Status Distribution */}
                  <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📈</span>
                      Booking Status Overview
                    </h3>
                    {bookingStatusData ? (
                      <Doughnut data={bookingStatusData} options={{
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
                      }} />
                    ) : (
                      <div className="text-center py-12 text-gray-400">
                        <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                        </svg>
                        <p className="font-medium">No booking data available</p>
                      </div>
                    )}
                  </div>

                  {/* Platform Statistics */}
                  <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📊</span>
                      Platform Distribution
                    </h3>
                    {statsData && <Doughnut data={statsData} options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      plugins: {
                        legend: { 
                          position: 'bottom',
                          labels: {
                            padding: 12,
                            font: { size: 12, weight: '600' },
                            usePointStyle: true,
                            pointStyle: 'circle'
                          }
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          padding: 12,
                          titleFont: { size: 14, weight: 'bold' },
                          bodyFont: { size: 13 },
                          cornerRadius: 8
                        }
                      }
                    }} />}
                  </div>

                  {/* Key Metrics */}
                  <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">💡</span>
                      Key Performance Metrics
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                        <div>
                          <p className="text-sm text-blue-700 font-semibold mb-1">Conversion Rate</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {data.users > 0 ? Math.round((data.providers / data.users) * 100) : 0}%
                          </p>
                        </div>
                        <div className="bg-blue-200 p-3 rounded-lg">
                          <svg className="w-8 h-8 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                        <div>
                          <p className="text-sm text-green-700 font-semibold mb-1">Completion Rate</p>
                          <p className="text-2xl font-bold text-green-900">
                            {data.bookings > 0 && data.detailedBookings 
                              ? Math.round((data.detailedBookings.filter(b => b.status === 'completed').length / data.bookings) * 100)
                              : 0}%
                          </p>
                        </div>
                        <div className="bg-green-200 p-3 rounded-lg">
                          <svg className="w-8 h-8 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                        <div>
                          <p className="text-sm text-purple-700 font-semibold mb-1">Avg Revenue per Booking</p>
                          <p className="text-2xl font-bold text-purple-900">
                            Ksh {data.bookings > 0 && totalRevenue > 0
                              ? Math.round(totalRevenue / data.detailedBookings.filter(b => b.status === 'completed').length).toLocaleString()
                              : 0}
                          </p>
                        </div>
                        <div className="bg-purple-200 p-3 rounded-lg">
                          <svg className="w-8 h-8 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Management Tab */}
            {activeTab === 'management' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="text-2xl">⚙️</span>
                    Quick Management Actions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link 
                      to="/admin/users" 
                      className="flex items-center gap-4 p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:shadow-lg transition-all duration-200 group border-2 border-blue-200 hover:border-blue-400"
                    >
                      <div className="bg-blue-500 p-3 rounded-xl group-hover:scale-110 transition-transform">
                        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-lg">Manage Users</p>
                        <p className="text-sm text-gray-600">View & edit user accounts</p>
                      </div>
                    </Link>

                    <Link 
                      to="/admin/services" 
                      className="flex items-center gap-4 p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:shadow-lg transition-all duration-200 group border-2 border-green-200 hover:border-green-400"
                    >
                      <div className="bg-green-500 p-3 rounded-xl group-hover:scale-110 transition-transform">
                        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-lg">Manage Services</p>
                        <p className="text-sm text-gray-600">Approve & moderate services</p>
                      </div>
                    </Link>

                    <Link 
                      to="/admin/bookings" 
                      className="flex items-center gap-4 p-5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:shadow-lg transition-all duration-200 group border-2 border-orange-200 hover:border-orange-400"
                    >
                      <div className="bg-orange-500 p-3 rounded-xl group-hover:scale-110 transition-transform">
                        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-lg">View Bookings</p>
                        <p className="text-sm text-gray-600">Track all platform bookings</p>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Export & Reports */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="text-2xl">📄</span>
                    Reports & Export
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                      onClick={downloadPDF}
                      className="flex items-center gap-4 p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:shadow-lg transition-all duration-200 group border-2 border-purple-200 hover:border-purple-400"
                    >
                      <div className="bg-purple-500 p-3 rounded-xl group-hover:scale-110 transition-transform">
                        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-gray-800 text-lg">Download PDF Report</p>
                        <p className="text-sm text-gray-600">Full analytics & bookings</p>
                      </div>
                    </button>

                    <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
                      <div className="bg-gray-400 p-3 rounded-xl">
                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-gray-600 text-lg">CSV Export</p>
                        <p className="text-sm text-gray-500">Coming soon...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                          <span className="text-3xl">📋</span>
                          Bookings Overview
                        </h3>
                        <p className="text-blue-100 text-sm mt-1">Complete booking history with detailed information</p>
                      </div>
                      {data.detailedBookings && data.detailedBookings.length > 0 && (
                        <button 
                          onClick={downloadPDF}
                          className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2.5 rounded-lg hover:bg-blue-50 transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Export PDF
                        </button>
                      )}
                    </div>
                  </div>

                  {data.detailedBookings && data.detailedBookings.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Service
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Client
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Provider
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Price
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {data.detailedBookings.map((booking, index) => (
                              <tr 
                                key={booking.id} 
                                className={`hover:bg-blue-50 transition-colors duration-150 ${
                                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                }`}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-900">
                                      {new Date(booking.date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm font-semibold text-gray-900">{booking.service_name}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm">
                                    <div className="font-medium text-gray-900">{booking.client_name}</div>
                                    <div className="text-gray-500 text-xs">{booking.client_email}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm font-medium text-gray-700">
                                    {booking.provider_name || 'N/A'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-sm font-bold text-green-600">
                                    Ksh {Number(booking.price).toLocaleString()}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                    booking.status === 'completed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : booking.status === 'confirmed'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Unknown'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 font-medium">
                            Showing {data.detailedBookings.length} booking{data.detailedBookings.length !== 1 ? 's' : ''}
                          </span>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-500">
                              Total Revenue: <span className="font-bold text-green-600">Ksh {totalRevenue.toLocaleString()}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-16 text-center">
                      <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 text-xl font-semibold mb-2">No bookings yet</p>
                      <p className="text-gray-400 text-sm">Booking details will appear here once customers start making reservations</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
