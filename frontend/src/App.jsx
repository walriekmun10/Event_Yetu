import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Footer from './components/Footer'
import ChatAssistant from './components/ChatAssistant'
import ChatBot from './components/ChatBot'
import Login from './pages/Login'
import RegisterPage from './pages/RegisterPage'
import Landing from './pages/Landing'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import AdminDashboard from './pages/AdminDashboard'
import ProviderDashboard from './pages/ProviderDashboard'
import ClientDashboard from './pages/ClientDashboard'
import ServiceDetails from './pages/ServiceDetails'
import ManageUsers from './pages/ManageUsers'
import ManageServices from './pages/ManageServices'
import ViewBookings from './pages/ViewBookings'
import MultiServiceBooking from './pages/MultiServiceBooking'
import ReceiptView from './pages/ReceiptView'
import CartPage from './pages/Cart'
import Checkout from './pages/Checkout'

export default function App(){
  return (
    <AuthProvider>
      <CartProvider>
        <div className="flex flex-col min-h-screen">
          <Toaster position="top-right" />
          <ChatAssistant />
          <ChatBot />
          <div className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing/>} />
              <Route path="/home" element={<Home/>} />
              <Route path="/about" element={<About/>} />
              <Route path="/contact" element={<Contact/>} />
              <Route path="/login" element={<Login/>} />
              <Route path="/register" element={<RegisterPage/>} />
              
              {/* Dashboard Routes */}
              <Route path="/admin" element={<AdminDashboard/>} />
              <Route path="/admin/users" element={<ManageUsers/>} />
              <Route path="/admin/services" element={<ManageServices/>} />
              <Route path="/admin/bookings" element={<ViewBookings/>} />
              <Route path="/provider" element={<ProviderDashboard/>} />
              <Route path="/client" element={<ClientDashboard/>} />
              
              {/* Service & Booking Routes */}
              <Route path="/service/:id" element={<ServiceDetails/>} />
              <Route path="/book-services" element={<MultiServiceBooking/>} />
              <Route path="/cart" element={<CartPage/>} />
              <Route path="/checkout" element={<Checkout/>} />
              <Route path="/receipt/:bookingId" element={<ReceiptView/>} />
            </Routes>
          </div>
          <Footer />
        </div>
      </CartProvider>
    </AuthProvider>
  )
}
