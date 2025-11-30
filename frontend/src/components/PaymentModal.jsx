import React, { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function PaymentModal({ booking, onClose, onSuccess }) {
  const [phone, setPhone] = useState('254')
  const [loading, setLoading] = useState(false)
  const [paymentId, setPaymentId] = useState(null)
  const [checkingStatus, setCheckingStatus] = useState(false)

  const API_BASE = 'http://localhost/Event-yetu/backend/api'

  const formatPhoneNumber = (value) => {
    // Remove all non-digits
    let cleaned = value.replace(/\D/g, '')
    
    // Ensure it starts with 254
    if (!cleaned.startsWith('254')) {
      if (cleaned.startsWith('0')) {
        cleaned = '254' + cleaned.substring(1)
      } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
        cleaned = '254' + cleaned
      }
    }
    
    // Limit to 12 digits (254XXXXXXXXX)
    return cleaned.substring(0, 12)
  }

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhone(formatted)
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    
    if (phone.length !== 12) {
      toast.error('Please enter a valid phone number (254XXXXXXXXX)')
      return
    }

    setLoading(true)
    
    try {
      const bookingPrice = booking.price || booking.service_price
      if (!bookingPrice) {
        toast.error('Unable to determine service price')
        setLoading(false)
        return
      }

      const res = await axios.post(
        `${API_BASE}/payments/mpesa_stk_push.php`,
        {
          phoneNumber: phone,
          amount: parseFloat(bookingPrice),
          bookingId: booking.id,
          accountReference: `BOOK-${booking.id}`,
          description: `Payment for ${booking.serviceName || booking.service_name}`
        }
      )
      
      if (res.data.success) {
        setPaymentId(res.data.paymentId)
        toast.success('Payment request sent! Check your phone and enter M-Pesa PIN.')
        
        // Start polling for payment status
        pollPaymentStatus(res.data.paymentId)
      } else {
        toast.error(res.data.error || 'Payment request failed')
        setLoading(false)
      }
    } catch (err) {
      console.error('Payment error:', err)
      const errorMsg = err.response?.data?.error || 'Payment failed. Please try again.'
      
      // Show more helpful message for M-Pesa configuration errors
      if (errorMsg.includes('Invalid Access Token') || errorMsg.includes('access token')) {
        toast.error('M-Pesa service temporarily unavailable. Please contact support or try again later.')
      } else if (errorMsg.includes('Booking not found')) {
        toast.error('Invalid booking. Please refresh and try again.')
      } else {
        toast.error(errorMsg)
      }
      setLoading(false)
    }
  }

  const pollPaymentStatus = async (pmtId) => {
    let attempts = 0
    const maxAttempts = 30 // Poll for 60 seconds (30 * 2 seconds)
    
    const checkStatus = async () => {
      if (attempts >= maxAttempts) {
        setLoading(false)
        toast.error('Payment timeout. Please check payment status manually.')
        return
      }

      setCheckingStatus(true)
      attempts++

      try {
        const res = await axios.get(`${API_BASE}/payments/payment_status.php?paymentId=${pmtId}`)
        
        if (res.data.success && res.data.payment) {
          const status = res.data.payment.status
          
          if (status === 'Completed') {
            toast.success('Payment successful! M-Pesa receipt: ' + res.data.payment.mpesaReceipt)
            setLoading(false)
            setCheckingStatus(false)
            onSuccess(pmtId)
            return
          } else if (status === 'Failed' || status === 'Cancelled') {
            toast.error('Payment failed: ' + (res.data.payment.resultDesc || status))
            setLoading(false)
            setCheckingStatus(false)
            return
          }
        }
        
        // Continue polling if status is still Pending
        setTimeout(checkStatus, 2000)
      } catch (err) {
        console.error('Status check error:', err)
        setTimeout(checkStatus, 2000)
      }
    }

    checkStatus()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">M-Pesa Payment</h3>
                <p className="text-green-100 text-sm">Lipa Na M-Pesa</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-white hover:bg-green-800 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Service Details */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Service</p>
            <p className="font-semibold text-gray-900 mb-3">{booking.serviceName || booking.service_name}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-sm text-gray-600">Amount:</span>
              <span className="text-3xl font-bold text-green-600">Ksh {parseFloat(booking.price || booking.service_price || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handlePayment}>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                M-Pesa Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <input
                  type="tel"
                  placeholder="254712345678"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  required
                  disabled={loading}
                  maxLength={12}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Format: 254XXXXXXXXX (e.g., 254712345678)
              </p>
            </div>

            {/* Status Messages */}
            {loading && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900">
                      {checkingStatus ? 'Waiting for payment confirmation...' : 'Sending payment request...'}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      {checkingStatus ? 'Please enter your M-Pesa PIN on your phone' : 'Please wait...'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || phone.length !== 12}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </span>
                ) : (
                  'Pay Now'
                )}
              </button>
            </div>
          </form>

          {/* Info */}
          <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex gap-2">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-yellow-800">
                You will receive an M-Pesa prompt on your phone. Enter your PIN to complete the payment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
