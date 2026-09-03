import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      navigate(res.data.user.role === 'PROPERTY_MANAGER' ? '/dashboard' : '/requests');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded-lg shadow border border-slate-200">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Sign In</h2>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input 
            type="email" 
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input 
            type="password" 
            required 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded font-medium hover:bg-indigo-700 text-sm">
          Sign In
        </button>
      </form>
    </div>
  );
}