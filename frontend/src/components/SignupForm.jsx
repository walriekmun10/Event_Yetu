import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

function PasswordStrength({ value }){
  const score = value.length > 9 ? 3 : value.length > 6 ? 2 : value.length > 3 ? 1 : 0
  const colors = ['bg-red-300','bg-yellow-300','bg-yellow-500','bg-green-400']
  return (
    <div className="h-2 w-full bg-gray-200 rounded mt-2 overflow-hidden">
      <div className={`h-2 ${colors[score]} rounded`} style={{ width: `${(score/3)*100}%` }} />
    </div>
  )
}

export default function SignupForm({ onSuccess }){
  const { register } = useAuth()
  const navigate = useNavigate()
  const [step,setStep] = useState(1)
  const [name,setName] = useState('')
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [confirm,setConfirm] = useState('')
  const [role,setRole] = useState('client')
  const [loading,setLoading] = useState(false)

  const next = (e)=>{ e?.preventDefault(); if(!name||!email||!password) return toast.error('Complete required fields'); setStep(2) }

  const submit = async (e)=>{
    e.preventDefault();
    if(password !== confirm) return toast.error('Passwords do not match')
    setLoading(true)
    try{
      const data = await register(name,email,password,role)
      toast.success('Account created')
      if(onSuccess) onSuccess()
      
      // Role-based redirect
      if (role === 'admin') {
        navigate('/admin')
      } else if (role === 'provider') {
        navigate('/provider')
      } else {
        navigate('/client')
      }
    }catch(err){
      console.error('Register error', err)
      const msg = err.response?.data?.error || 'Registration failed'
      toast.error(msg)
    }finally{ setLoading(false) }
  }

  return (
    <div>
      <form onSubmit={step===1?next:submit} className="space-y-4">
        {step===1 && (
          <>
            <div>
              <label className="text-sm font-medium text-gray-700">Full name</label>
              <input value={name} onChange={e=>setName(e.target.value)} className="w-full mt-1 px-4 py-3 border rounded-lg" placeholder="Jane Doe" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input value={email} onChange={e=>setEmail(e.target.value)} type="email" className="w-full mt-1 px-4 py-3 border rounded-lg" placeholder="you@example.com" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input value={password} onChange={e=>setPassword(e.target.value)} type="password" className="w-full mt-1 px-4 py-3 border rounded-lg" placeholder="Create a password" />
              <PasswordStrength value={password} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Confirm Password</label>
              <input value={confirm} onChange={e=>setConfirm(e.target.value)} type="password" className="w-full mt-1 px-4 py-3 border rounded-lg" placeholder="Confirm password" />
            </div>
            <div className="flex justify-end">
              <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg">Next</button>
            </div>
          </>
        )}

        {step===2 && (
          <>
            <div>
              <label className="text-sm font-medium text-gray-700">Account Type</label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label className={`p-4 border rounded-lg cursor-pointer ${role==='client'?'border-indigo-600 bg-indigo-50':''}`}>
                  <input type="radio" name="role" value="client" checked={role==='client'} onChange={()=>setRole('client')} className="hidden" />
                  <div className="font-semibold">I'm a Customer</div>
                  <div className="text-sm text-gray-600">Browse and book services</div>
                </label>
                <label className={`p-4 border rounded-lg cursor-pointer ${role==='provider'?'border-indigo-600 bg-indigo-50':''}`}>
                  <input type="radio" name="role" value="provider" checked={role==='provider'} onChange={()=>setRole('provider')} className="hidden" />
                  <div className="font-semibold">I'm a Provider</div>
                  <div className="text-sm text-gray-600">List services and manage bookings</div>
                </label>
              </div>
            </div>

            <div className="flex items-center">
              <input id="terms" type="checkbox" required className="mr-2" />
              <label htmlFor="terms" className="text-sm text-gray-600">I agree to the Terms & Conditions</label>
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={()=>setStep(1)} className="px-4 py-2 border rounded-lg">Back</button>
              <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg" disabled={loading}>{loading?'Creating...':'Create account'}</button>
            </div>
          </>
        )}
      </form>
    </div>
  )
}
