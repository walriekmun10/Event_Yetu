import React, { createContext, useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export const CartContext = createContext()

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])

  useEffect(() => {
    const saved = localStorage.getItem('eventYetuCart')
    if (saved) {
      try { setCart(JSON.parse(saved)) } catch (e) { console.error('cart load', e) }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('eventYetuCart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (service, eventDate = '') => {
    if (cart.find(i => i.id === service.id)) {
      toast.error('Service already in cart')
      return false
    }
    const item = {
      id: service.id,
      name: service.name,
      price: Number(service.price) || 0,
      provider_name: service.provider_name || '',
      provider_id: service.provider_id || null,
      image: service.image || null,
      event_date: eventDate || null,
      addedAt: new Date().toISOString()
    }
    setCart(prev => [...prev, item])
    toast.success(`${service.name} added to cart`)
    return true
  }

  const removeFromCart = (id) => {
    const it = cart.find(i => i.id === id)
    setCart(prev => prev.filter(i => i.id !== id))
    if (it) toast.success(`${it.name} removed`)
  }

  const updateCartItemDate = (id, date) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, event_date: date } : i))
  }

  const clearCart = () => { setCart([]); localStorage.removeItem('eventYetuCart'); toast.success('Cart cleared') }

  const getCartTotal = () => cart.reduce((s, i) => s + Number(i.price || 0), 0)
  const getCartCount = () => cart.length

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateCartItemDate, clearCart, getCartTotal, getCartCount }}>
      {children}
    </CartContext.Provider>
  )
}

export default CartContext
