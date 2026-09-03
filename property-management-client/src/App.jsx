import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Units from './pages/Units';
import Requests from './pages/Requests';
import BulkRent from './pages/BulkRent';
import { Building2, Wrench, DollarSign, LayoutDashboard, LogOut } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/requests" replace />;
  }
  return children;
};

const Navigation = () => {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <nav className="bg-slate-900 text-white border-b border-slate-800 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <span className="font-bold text-lg text-indigo-400">PropManage</span>
        <div className="flex gap-4 text-sm font-medium">
          {user.role === 'PROPERTY_MANAGER' && (
            <>
              <Link to="/dashboard" className="flex items-center gap-2 hover:text-indigo-300">
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link to="/units" className="flex items-center gap-2 hover:text-indigo-300">
                <Building2 size={16} /> Units
              </Link>
              <Link to="/rent" className="flex items-center gap-2 hover:text-indigo-300">
                <DollarSign size={16} /> Bulk Rent
              </Link>
            </>
          )}
          <Link to="/requests" className="flex items-center gap-2 hover:text-indigo-300">
            <Wrench size={16} /> Maintenance
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-slate-400">{user.name} ({user.role})</span>
        <button onClick={logout} className="p-1.5 hover:bg-slate-800 rounded text-slate-300">
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <Navigation />
          <div className="p-6 max-w-7xl mx-auto w-full flex-1">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['PROPERTY_MANAGER']}><Dashboard /></ProtectedRoute>
              } />
              <Route path="/units" element={
                <ProtectedRoute allowedRoles={['PROPERTY_MANAGER']}><Units /></ProtectedRoute>
              } />
              <Route path="/rent" element={
                <ProtectedRoute allowedRoles={['PROPERTY_MANAGER']}><BulkRent /></ProtectedRoute>
              } />
              <Route path="/requests" element={
                <ProtectedRoute><Requests /></ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/requests" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}