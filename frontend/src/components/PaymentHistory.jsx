import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function PaymentHistory() {
  const { token } = useContext(AuthContext)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const API_BASE = 'http://localhost/Event-yetu/backend/api'

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/payments/payments.php?token=${token}`)
      if (res.data.success) {
        setPayments(res.data.payments)
      }
    } catch (err) {
      console.error('Error fetching payments:', err)
      toast.error('Failed to load payment history')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'Pending':
        return (
          <svg className="w-5 h-5 text-yellow-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      case 'Failed':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading payment history...</p>
        </div>
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Payment History</h3>
        <p className="text-gray-500">You haven't made any payments yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Payment History</h2>
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold">
          {payments.length} Payment{payments.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid gap-4">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-gray-200"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(payment.status)}
                    <h3 className="text-lg font-bold text-gray-900">
                      {payment.serviceName}
                    </h3>
                  </div>
                  {payment.clientName && (
                    <p className="text-sm text-gray-600">Client: {payment.clientName}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    Ksh {parseFloat(payment.amount).toLocaleString()}
                  </div>
                  <span className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(payment.status)}`}>
                    {payment.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                  <p className="text-sm font-semibold text-gray-900">{payment.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Transaction Date</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(payment.transactionDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {payment.mpesaReceipt && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-1">M-Pesa Receipt</p>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-mono font-bold text-green-700">{payment.mpesaReceipt}</p>
                    </div>
                  </div>
                )}
                {payment.resultDesc && payment.status !== 'Pending' && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Message</p>
                    <p className="text-sm text-gray-700">{payment.resultDesc}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
