import React, { useState, useEffect } from 'react';
import API from '../api/client';
import { Building2, Plus, Archive, RefreshCw, AlertCircle } from 'lucide-react';

export default function Units() {
  const [units, setUnits] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State for New Unit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    unitNumber: '',
    address: '',
    monthlyRent: '',
    tenantName: ''
  });

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const res = await API.get('/units', {
        params: { archived: showArchived }
      });
      setUnits(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch units');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [showArchived]);

  const handleCreateUnit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await API.post('/units', {
        ...formData,
        monthlyRent: Number(formData.monthlyRent)
      });
      setIsModalOpen(false);
      setFormData({ unitNumber: '', address: '', monthlyRent: '', tenantName: '' });
      fetchUnits();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create unit');
    }
  };

  const handleToggleArchive = async (unitId, currentStatus) => {
    try {
      await API.patch(`/units/${unitId}/archive`, { isArchived: !currentStatus });
      fetchUnits();
    } catch (err) {
      setError('Failed to update unit status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Rental Units</h1>
          <p className="text-sm text-slate-500">Manage properties, monthly rates, and active tenants.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showArchived} 
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Show Archived
          </label>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition"
          >
            <Plus size={16} /> Add New Unit
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm border border-red-100">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Units Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase">
            <tr>
              <th className="p-3.5">Unit #</th>
              <th className="p-3.5">Address</th>
              <th className="p-3.5">Monthly Rent</th>
              <th className="p-3.5">Current Tenant</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-400">Loading units...</td>
              </tr>
            ) : units.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-400">No units found.</td>
              </tr>
            ) : (
              units.map((unit) => (
                <tr key={unit._id} className={unit.isArchived ? 'bg-slate-50/60' : ''}>
                  <td className="p-3.5 font-bold text-slate-800">{unit.unitNumber}</td>
                  <td className="p-3.5 text-slate-600">{unit.address}</td>
                  <td className="p-3.5 font-semibold text-slate-700">${unit.monthlyRent?.toLocaleString()}</td>
                  <td className="p-3.5 text-slate-600">{unit.tenantName}</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      unit.isArchived ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {unit.isArchived ? 'Archived' : 'Active'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button 
                      onClick={() => handleToggleArchive(unit._id, unit.isArchived)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition"
                      title={unit.isArchived ? 'Restore Unit' : 'Archive Unit'}
                    >
                      {unit.isArchived ? <RefreshCw size={16} /> : <Archive size={16} />}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Unit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Add New Unit</h2>
            <form onSubmit={handleCreateUnit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase mb-1">Unit Number</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. 101 or Apt 4B"
                  value={formData.unitNumber} 
                  onChange={(e) => setFormData({...formData, unitNumber: e.target.value})}
                  className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase mb-1">Address</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. 742 Evergreen Terrace"
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase mb-1">Monthly Rent ($)</label>
                <input 
                  type="number" 
                  required 
                  placeholder="e.g. 1500"
                  value={formData.monthlyRent} 
                  onChange={(e) => setFormData({...formData, monthlyRent: e.target.value})}
                  className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase mb-1">Tenant Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Jane Doe"
                  value={formData.tenantName} 
                  onChange={(e) => setFormData({...formData, tenantName: e.target.value})}
                  className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Save Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}