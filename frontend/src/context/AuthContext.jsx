import React, { createContext, useState, useEffect, useContext } from 'react'
import axios from 'axios'
import jwt_decode from 'jwt-decode'

export const AuthContext = createContext()

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const API_BASE = 'http://localhost/Event-yetu/backend/api'

export function AuthProvider({ children }){
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(()=>{
    if(token){
      try{ 
        // Decode token to ensure it's valid, then fetch full profile
        const p = jwt_decode(token);
        // Fetch full user profile from backend (includes profile_image)
        (async () => {
          try {
            const res = await axios.get(`${API_BASE}/auth.php?action=me`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data && res.data.user) {
              setUser(res.data.user);
            } else {
              // Fallback to decoded token info
              setUser({ id: p.sub, role: p.role, email: p.email });
            }
          } catch (err) {
            // If fetching profile fails, use decoded token minimally
            setUser({ id: p.sub, role: p.role, email: p.email });
          }
        })();
      }catch(e){ 
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
      }
    }
  },[token])

  // Update profile image in context (used after successful upload)
  const updateProfileImage = (imageUrl) => {
    setUser(prev => prev ? { ...prev, profile_image: imageUrl.replace(/^\//, '') } : prev);
  }

  const login = async (email,password)=>{
    const res = await axios.post(`${API_BASE}/auth.php?action=login`,{email,password});
    const t = res.data.token; 
    const userData = res.data.user;
    localStorage.setItem('token', t); 
    setToken(t);
    setUser({
      id: userData.id, 
      role: userData.role, 
      email: userData.email,
      name: userData.name
    });
    return res.data;
  }
  const register = async (name,email,password,role)=>{
    const res = await axios.post(`${API_BASE}/auth.php?action=register`,{name,email,password,role});
    const t = res.data.token; 
    const userData = res.data.user;
    localStorage.setItem('token', t); 
    setToken(t);
    setUser({
      id: userData.id, 
      role: userData.role, 
      email: userData.email,
      name: userData.name
    });
    return res.data;
  }
  const logout = ()=>{ localStorage.removeItem('token'); setToken(null); setUser(null); }

  return (<AuthContext.Provider value={{user,token,login,register,logout,updateProfileImage}}>{children}</AuthContext.Provider>)
}
