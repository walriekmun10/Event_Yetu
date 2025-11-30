import React, { useState } from 'react'
import LoginForm from './LoginForm'
import SignupForm from './SignupForm'

export default function AuthModal({ open, onClose, initialMode = 'login' }){
  const [mode, setMode] = useState(initialMode)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex">
            <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-600 p-8 text-white">
              <h3 className="text-2xl font-bold mb-2">Welcome to Event Yetu</h3>
              <p className="text-sm opacity-90">Book services, manage bookings and get paid — all in one platform.</p>
              <div className="mt-6 space-y-3">
                <div className="bg-white/10 p-3 rounded-lg">Fast bookings</div>
                <div className="bg-white/10 p-3 rounded-lg">Secure payments</div>
                <div className="bg-white/10 p-3 rounded-lg">Provider dashboard</div>
              </div>
            </div>
            <div className="w-full md:w-1/2 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold">{mode === 'login' ? 'Sign In' : 'Create Account'}</div>
                <div>
                  <button className={`px-3 py-1 rounded ${mode==='login' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`} onClick={()=>setMode('login')}>Login</button>
                  <button className={`ml-2 px-3 py-1 rounded ${mode==='signup' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`} onClick={()=>setMode('signup')}>Signup</button>
                </div>
              </div>

              <div>
                {mode === 'login' ? <LoginForm onSuccess={onClose} /> : <SignupForm onSuccess={onClose} />}
              </div>

              <div className="mt-4 text-right">
                <button className="text-sm text-gray-500" onClick={onClose}>Close</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
