import React, { useContext } from 'react'
import { ShoppingCart } from 'lucide-react'
import { CartContext } from '../context/CartContext'
import { Link } from 'react-router-dom'

const CartIcon = () => {
  const { getCartCount } = useContext(CartContext)
  const count = getCartCount()
  return (
    <Link to="/cart" className="relative inline-flex items-center">
      <ShoppingCart className="w-6 h-6 text-white" />
      {count > 0 && (
        <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">{count}</span>
      )}
    </Link>
  )
}

export default CartIcon
