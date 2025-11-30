import React, { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE = 'http://localhost/Event-yetu/backend/api'

export default function ManageUsers(){
  const { user, token } = useContext(AuthContext)
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [form, setForm] = useState({name:'', email:'', password:'', role:'client'})
  const navigate = useNavigate()

  useEffect(()=>{
    if(!user || user.role !== 'admin'){ navigate('/login'); return }
    loadUsers()
  },[user])

  const loadUsers = async ()=>{
    try{
      const res = await axios.get(`${API_BASE}/auth.php?action=list&token=${token}`)
      setUsers(res.data || [])
    }catch(err){ console.error(err) }
  }

  const handleSubmit = async (e)=>{
    e.preventDefault()
    try{
      if(editUser){
        // Update user
        await axios.put(`${API_BASE}/auth.php?id=${editUser.id}&token=${token}`, form)
        toast.success('User updated')
      }else{
        // Create new user
        await axios.post(`${API_BASE}/auth.php?action=register`, form)
        toast.success('User created')
      }
      setShowModal(false)
      setForm({name:'', email:'', password:'', role:'client'})
      setEditUser(null)
      loadUsers()
    }catch(err){ 
      toast.error(err.response?.data?.error || 'Failed to save user') 
    }
  }

  const openEdit = (u)=>{
    setEditUser(u)
    setForm({name:u.name, email:u.email, password:'', role:u.role})
    setShowModal(true)
  }

  const openCreate = ()=>{
    setEditUser(null)
    setForm({name:'', email:'', password:'', role:'client'})
    setShowModal(true)
  }

  const handleDelete = async (id)=>{
    if(!confirm('Delete this user?')) return
    try{
      await axios.delete(`${API_BASE}/auth.php?id=${id}&token=${token}`)
      toast.success('User deleted')
      loadUsers()
    }catch(err){ toast.error('Failed to delete') }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Manage Users</h1>
        <div className="flex gap-2">
          <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ Add User</button>
          <button onClick={()=>navigate('/admin')} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">← Back</button>
        </div>
      </nav>
      <div className="p-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">Created</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u=>(
                <tr key={u.id} className="border-b">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{u.role}</span></td>
                  <td className="p-3 text-sm text-gray-600">{u.created_at}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={()=>openEdit(u)} className="text-blue-600 hover:underline text-sm">Edit</button>
                    <button onClick={()=>handleDelete(u.id)} className="text-red-600 hover:underline text-sm">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editUser ? 'Edit User' : 'Create User'}</h3>
            <form onSubmit={handleSubmit}>
              <input 
                className="w-full p-2 border rounded mb-3" 
                placeholder="Full Name" 
                value={form.name} 
                onChange={e=>setForm({...form,name:e.target.value})} 
                required 
              />
              <input 
                type="email" 
                className="w-full p-2 border rounded mb-3" 
                placeholder="Email" 
                value={form.email} 
                onChange={e=>setForm({...form,email:e.target.value})} 
                required 
              />
              <input 
                type="password" 
                className="w-full p-2 border rounded mb-3" 
                placeholder={editUser ? "New Password (leave blank to keep current)" : "Password"} 
                value={form.password} 
                onChange={e=>setForm({...form,password:e.target.value})} 
                required={!editUser}
              />
              <select 
                className="w-full p-2 border rounded mb-3" 
                value={form.role} 
                onChange={e=>setForm({...form,role:e.target.value})}
              >
                <option value="client">Client</option>
                <option value="provider">Provider</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex gap-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  {editUser ? 'Update' : 'Create'}
                </button>
                <button 
                  type="button" 
                  onClick={()=>{setShowModal(false);setEditUser(null);setForm({name:'',email:'',password:'',role:'client'})}} 
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
