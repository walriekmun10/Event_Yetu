import React, { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE = 'http://localhost/Event-yetu/backend/api'

export default function ViewBookings(){
  const { user, token } = useContext(AuthContext)
  const [bookings, setBookings] = useState([])
  const navigate = useNavigate()

  useEffect(()=>{
    if(!user || user.role !== 'admin'){ navigate('/login'); return }
    loadBookings()
  },[user])

  const loadBookings = async ()=>{
    try{
      const res = await axios.get(`${API_BASE}/bookings.php?token=${token}`)
      setBookings(res.data || [])
    }catch(err){ console.error(err) }
  }

  const handleUpdateStatus = async (id, newStatus)=>{
    try{
      await axios.put(`${API_BASE}/bookings.php?id=${id}&token=${token}`, {status: newStatus})
      toast.success(`Booking ${newStatus}`)
      loadBookings()
    }catch(err){ toast.error('Failed to update status') }
  }

  const handleDelete = async (id)=>{
    if(!confirm('Delete this booking?')) return
    try{
      await axios.delete(`${API_BASE}/bookings.php?id=${id}&token=${token}`)
      toast.success('Booking deleted')
      loadBookings()
    }catch(err){ toast.error('Failed to delete') }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">All Bookings</h1>
        <button onClick={()=>navigate('/admin')} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">← Back to Dashboard</button>
      </nav>
      <div className="p-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Service</th>
                <th className="p-3 text-left">Client</th>
                <th className="p-3 text-left">Provider</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Created</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b=>(
                <tr key={b.id} className="border-b">
                  <td className="p-3">{b.service_name}</td>
                  <td className="p-3">{b.client_name}</td>
                  <td className="p-3 text-sm text-gray-600">{b.provider_name}</td>
                  <td className="p-3">{b.date}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${b.status==='confirmed'?'bg-green-100 text-green-800':b.status==='pending'?'bg-yellow-100 text-yellow-800':'bg-blue-100 text-blue-800'}`}>{b.status}</span>
                  </td>
                  <td className="p-3 text-sm text-gray-600">{b.created_at}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      {b.status !== 'confirmed' && <button onClick={()=>handleUpdateStatus(b.id, 'confirmed')} className="text-green-600 hover:underline text-sm">Confirm</button>}
                      {b.status !== 'cancelled' && <button onClick={()=>handleUpdateStatus(b.id, 'cancelled')} className="text-orange-600 hover:underline text-sm">Cancel</button>}
                      <button onClick={()=>handleDelete(b.id)} className="text-red-600 hover:underline text-sm">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
