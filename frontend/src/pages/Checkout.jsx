import React, { useContext, useState } from 'react'
import { CartContext } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Checkout = () => {
  const { cart, getCartTotal, clearCart } = useContext(CartContext)
  const { user, token } = useAuth()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleCheckout = async () => {
    if (cart.length === 0) return
    if (!user) {
      alert('You must be logged in as a client to checkout')
      navigate('/login')
      return
    }

    // Require phone in profile. If missing, prompt and update profile
    let phone = user.phone || user.phone_number || ''
    if (!phone) {
      const entered = prompt('Enter your phone number (07XXXXXXXX or 2547XXXXXXXX):')
      if (!entered) return
      // Validate client-side basic format
      const digits = entered.replace(/[^0-9]/g, '')
      let formatted = digits
      if (digits.length === 9) formatted = '254' + digits
      if (digits.length === 10 && digits.startsWith('0')) formatted = '254' + digits.slice(1)
      if (!/^254[0-9]{9}$/.test(formatted)) { alert('Invalid phone format'); return }

      // Update profile on server
      try {
        const upd = await fetch('/Event-yetu/backend/api/auth.php?action=me', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
          body: JSON.stringify({ phone: formatted })
        })
        const upj = await upd.json()
        if (!upj.success) { alert(upj.error || 'Failed to save phone'); return }
        phone = formatted
      } catch (e) {
        alert('Failed to save phone'); return
      }
    }

    setLoading(true)
    try {
      // Create booking and payment record server-side (validates prices)
      const res = await fetch('/Event-yetu/backend/api/cart_checkout.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ cart })
      })
      const json = await res.json()
      if (!json.success) {
        alert(json.message || 'Checkout failed')
        setLoading(false)
        return
      }

      // Initiate M-Pesa STK Push
      const mpRes = await fetch('/Event-yetu/backend/api/payments/mpesa_stk_push.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ phoneNumber: phone, amount: json.amount, bookingId: json.booking_id, accountReference: json.booking_id, description: 'Event-Yetu Booking' })
      })
      const mpJson = await mpRes.json()
      if (!mpJson.success) {
        alert(mpJson.error || 'Payment initiation failed')
        setLoading(false)
        return
      }

      // Payment initiated (pending). Navigate to receipt or pending page
      clearCart()
      navigate(`/receipt/${json.booking_id}`)
    } catch (err) {
      console.error(err)
      alert('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      <h2 className="text-2xl font-bold mb-4">Checkout</h2>
      <div className="bg-white p-6 rounded-lg">
        <div className="mb-4">Total: <span className="font-bold">Ksh {Number(getCartTotal()).toLocaleString()}</span></div>
        <div>
          <button onClick={handleCheckout} disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded">
            {loading ? 'Processing...' : 'Confirm & Pay'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Checkout
