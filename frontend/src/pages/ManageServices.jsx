import React, { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE = 'http://localhost/Event-yetu/backend/api'

export default function ManageServices(){
  const { user, token } = useContext(AuthContext)
  const [services, setServices] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({name:'',category:'Speakers',description:'',price:''})
  const [imageFile, setImageFile] = useState(null)
  const navigate = useNavigate()

  useEffect(()=>{
    if(!user || user.role !== 'admin'){ navigate('/login'); return }
    loadServices()
  },[user])

  const loadServices = async ()=>{
    try{
      const res = await axios.get(`${API_BASE}/services.php?all=1`, { headers: { Authorization: `Bearer ${token}` } })
      setServices(res.data || [])
    }catch(err){ console.error(err) }
  }

  const handleApprove = async (id)=>{
    try{
      await axios.put(`${API_BASE}/services.php?id=${id}`, {status:'approved'}, { headers: { Authorization: `Bearer ${token}` } })
      toast.success('Service approved')
      loadServices()
    }catch(err){ toast.error('Failed to approve') }
  }

  const handleDelete = async (id)=>{
    if(!confirm('Delete this service?')) return
    try{
      await axios.delete(`${API_BASE}/services.php?id=${id}`, { headers: { Authorization: `Bearer ${token}` } })
      toast.success('Service deleted')
      loadServices()
    }catch(err){ toast.error('Failed to delete') }
  }

  const handleAddService = async (e)=>{
    e.preventDefault()
    try{
      let imageFilename = form.image || null
      if(imageFile){
        const fd = new FormData()
        fd.append('image', imageFile)
        const uploadRes = await axios.post(`${API_BASE}/upload.php`, fd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } })
        imageFilename = uploadRes.data.filename
      }
      
      const payload = { ...form, image: imageFilename }
      
      if(editId){
        await axios.put(`${API_BASE}/services.php?id=${editId}`, payload, { headers: { Authorization: `Bearer ${token}` } })
        toast.success('Service updated successfully')
      }else{
        await axios.post(`${API_BASE}/services.php`, payload, { headers: { Authorization: `Bearer ${token}` } })
        toast.success('Service created and approved')
      }
      
      setShowModal(false)
      setForm({name:'',category:'Speakers',description:'',price:''})
      setImageFile(null)
      setEditId(null)
      loadServices()
    }catch(err){ 
      toast.error(err.response?.data?.error || 'Failed to save service') 
    }
  }

  const openEdit = (s)=>{
    setEditId(s.id)
    setForm({name:s.name, category:s.category, description:s.description, price:s.price, image:s.image})
    setShowModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Manage Services</h1>
        <div className="flex gap-2">
          <button onClick={()=>setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ Add Service</button>
          <button onClick={()=>navigate('/admin')} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">← Back</button>
        </div>
      </nav>
      <div className="p-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Provider</th>
                <th className="p-3 text-left">Price</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map(s=>(
                <tr key={s.id} className="border-b">
                  <td className="p-3">{s.name}</td>
                  <td className="p-3">{s.category}</td>
                  <td className="p-3 text-sm text-gray-600">{s.provider_name}</td>
                  <td className="p-3">Ksh {s.price}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${s.status==='approved'?'bg-green-100 text-green-800':'bg-yellow-100 text-yellow-800'}`}>{s.status}</span>
                  </td>
                  <td className="p-3 flex gap-2">
                    <button onClick={()=>openEdit(s)} className="text-blue-600 hover:underline text-sm">Edit</button>
                    {s.status !== 'approved' && <button onClick={()=>handleApprove(s.id)} className="text-green-600 hover:underline text-sm">Approve</button>}
                    <button onClick={()=>handleDelete(s.id)} className="text-red-600 hover:underline text-sm">Delete</button>
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
            <h3 className="text-xl font-bold mb-4">{editId ? 'Edit Service' : 'Add New Service'}</h3>
            <form onSubmit={handleAddService}>
              <input className="w-full p-2 border rounded mb-3" placeholder="Service Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
              <select className="w-full p-2 border rounded mb-3" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                <option>Speakers</option>
                <option>MCs</option>
                <option>DJs</option>
                <option>Tents</option>
                <option>Sound Systems</option>
                <option>Lighting Systems</option>
                <option>Photography</option>
              </select>
              <textarea className="w-full p-2 border rounded mb-3" placeholder="Description" rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
              <input type="number" className="w-full p-2 border rounded mb-3" placeholder="Price (Ksh)" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required />
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Image (optional)</label>
                <input type="file" accept="image/jpeg,image/png" className="w-full p-2 border rounded" onChange={e=>setImageFile(e.target.files[0])} />
                {imageFile && <p className="text-sm text-gray-600 mt-1">Selected: {imageFile.name}</p>}
                {!imageFile && form.image && <p className="text-sm text-gray-600 mt-1">Current: {form.image}</p>}
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">{editId ? 'Update' : 'Create'} Service</button>
                <button type="button" onClick={()=>{setShowModal(false);setForm({name:'',category:'Speakers',description:'',price:''});setImageFile(null);setEditId(null)}} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
