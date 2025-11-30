import React, { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login(){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const submit = async (e)=>{
    e.preventDefault()
    
    if(!email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    
    setLoading(true)
    try{
      const res = await login(email.trim(), password)
      toast.success('Login successful!')
      if(res.user.role === 'admin') navigate('/admin')
      else if(res.user.role === 'provider') navigate('/provider')
      else navigate('/client')
    }catch(err){ 
      toast.error(err.response?.data?.error || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <form onSubmit={submit} className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Welcome Back</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
          <input 
            type="email"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="you@example.com" 
            value={email} 
            onChange={e=>setEmail(e.target.value)} 
            required 
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
          <input 
            type="password" 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="••••••••" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            required 
          />
        </div>
        
        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        
        <p className="mt-4 text-center text-sm text-gray-600">Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Register</Link></p>
      </form>
    </div>
  )
}
