import React, { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Register(){
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('client')
  const [loading, setLoading] = useState(false)
  const { register } = useContext(AuthContext)
  const navigate = useNavigate()

  const submit = async (e)=>{
    e.preventDefault()
    
    if(!name || !email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    
    if(password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    
    setLoading(true)
    try{
      await register(name.trim(), email.trim(), password, role)
      toast.success('Registration successful!')
      if(role === 'admin') navigate('/admin')
      else if(role === 'provider') navigate('/provider')
      else navigate('/client')
    }catch(err){ 
      toast.error(err.response?.data?.error || 'Registration failed. Email may already exist.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <form onSubmit={submit} className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Create Account</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700">Full Name</label>
          <input 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your name" 
            value={name} 
            onChange={e=>setName(e.target.value)} 
            required 
          />
        </div>
        
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
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
          <input 
            type="password" 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="••••••••" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            required 
          />
          <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1 text-gray-700">I am a</label>
          <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={role} onChange={e=>setRole(e.target.value)}>
            <option value="client">Client</option>
            <option value="provider">Service Provider</option>
          </select>
        </div>
        
        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Account...' : 'Register'}
        </button>
        
        <p className="mt-4 text-center text-sm text-gray-600">Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link></p>
      </form>
    </div>
  )
}
