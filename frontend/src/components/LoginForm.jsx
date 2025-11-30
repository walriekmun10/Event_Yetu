import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginForm({ onSuccess }){
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [loading,setLoading] = useState(false)
  const [showPassword,setShowPassword] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try{
      const data = await login(email,password)
      toast.success('Signed in')
      if (onSuccess) onSuccess()
      
      // Role-based redirect
      const role = data.user?.role
      if (role === 'admin') {
        navigate('/admin')
      } else if (role === 'provider') {
        navigate('/provider')
      } else {
        navigate('/client')
      }
    }catch(err){
      console.error('Login error', err)
      const msg = err.response?.data?.error || 'Login failed'
      toast.error(msg)
    }finally{ setLoading(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700">Email</label>
        <div className="mt-1 relative">
          <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500" placeholder="you@example.com" />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Password</label>
        <div className="mt-1 relative">
          <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" />
          <button type="button" onClick={()=>setShowPassword(s=>!s)} className="absolute right-2 top-2 text-sm text-gray-500">{showPassword?'Hide':'Show'}</button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center text-sm"><input type="checkbox" className="mr-2"/> Remember me</label>
        <a href="#" className="text-sm text-indigo-600">Forgot password?</a>
      </div>

      <div>
        <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </div>

      <div className="text-center text-sm text-gray-500">Or continue with</div>
      <div className="flex gap-3 justify-center">
        <button type="button" className="px-4 py-2 rounded-lg border">Google</button>
        <button type="button" className="px-4 py-2 rounded-lg border">Facebook</button>
      </div>
    </form>
  )
}
