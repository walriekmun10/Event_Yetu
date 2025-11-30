import React, { useContext } from 'react'
import { CartContext } from '../context/CartContext'
import { Link, useNavigate } from 'react-router-dom'

const CartPage = () => {
  const { cart, removeFromCart, clearCart, getCartTotal } = useContext(CartContext)
  const navigate = useNavigate()

  return (
    <div className="max-w-4xl mx-auto py-12">
      <h2 className="text-2xl font-bold mb-4">Your Cart</h2>
      {cart.length === 0 ? (
        <div className="bg-white p-6 rounded-lg">Your cart is empty. <Link to="/home" className="text-indigo-600">Browse services</Link></div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg">
            {cart.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex items-center">
                  {item.image ? <img src={`http://localhost/Event-yetu/${item.image}`} alt="" className="w-16 h-16 object-cover rounded mr-4"/> : null}
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-sm text-gray-500">{item.provider_name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">Ksh {Number(item.price).toLocaleString()}</div>
                  <div className="mt-2 flex items-center space-x-2">
                    <button className="text-sm text-red-500" onClick={() => removeFromCart(item.id)}>Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <button className="px-4 py-2 bg-red-100 text-red-700 rounded" onClick={clearCart}>Clear Cart</button>
            </div>
            <div className="text-right">
              <div className="text-lg">Total: <span className="font-bold">Ksh {Number(getCartTotal()).toLocaleString()}</span></div>
              <div className="mt-2">
                <button onClick={() => navigate('/checkout')} className="px-6 py-2 bg-indigo-600 text-white rounded">Checkout</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CartPage
