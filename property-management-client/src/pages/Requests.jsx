import React, { useState, useEffect } from 'react';
import API from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Search, AlertCircle, Plus, X } from 'lucide-react';

const ALLOWED_TRANSITIONS = {
  Reported: ['Reported', 'Triaged'],
  Triaged: ['Triaged', 'Scheduled'],
  Scheduled: ['Scheduled', 'Resolved'],
  Resolved: ['Resolved', 'Triaged'],
};

export default function Requests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [units, setUnits] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUnitId, setNewUnitId] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');

  const isManager = user?.role === 'PROPERTY_MANAGER';

  // Fetch contractors and active units for dropdowns
  useEffect(() => {
    if (isManager) {
      API.get('/auth/contractors')
        .then((res) => setContractors(res.data))
        .catch((err) => console.error('Failed to load contractors:', err));

      API.get('/units')
        .then((res) => setUnits(res.data.data || res.data))
        .catch((err) => console.error('Failed to load units:', err));
    }
  }, [isManager]);

  const fetchRequests = async () => {
    try {
      const res = await API.get('/requests', {
        params: { search, status, priority, page, limit: 10 }
      });
      setRequests(res.data.data);
      setTotalPages(res.data.pagination.pages);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [search, status, priority, page]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await API.post('/requests', {
        unitId: newUnitId,
        description: newDescription,
        priority: newPriority,
      });
      setIsModalOpen(false);
      setNewUnitId('');
      setNewDescription('');
      setNewPriority('Medium');
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create request.');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      setError('');
      await API.patch(`/requests/${id}/status`, { newStatus });
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Status update failed.');
    }
  };

  const handleAssignContractor = async (requestId, contractorId) => {
    try {
      setError('');
      const contractorIds = contractorId ? [contractorId] : [];
      await API.patch(`/requests/${requestId}/assign`, { contractorIds });
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Assignment failed.');
    }
  };

  return (
    <div className="space-y-6">
    <div className="flex justify-between items-center">
  <h1 className="text-2xl font-bold text-slate-800">Maintenance Requests</h1>
  
  {/* Show Log New Request button ONLY to Property Managers */}
  {isManager && (
    <button
      onClick={() => setIsModalOpen(true)}
      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2"
    >
      <Plus size={16} /> Log New Request
    </button>
  )}
</div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded flex items-center gap-2 text-sm border border-red-200">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search descriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded text-sm outline-none"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded p-2 text-sm">
          <option value="">All Statuses</option>
          <option value="Reported">Reported</option>
          <option value="Triaged">Triaged</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Resolved">Resolved</option>
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="border rounded p-2 text-sm">
          <option value="">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase">
            <tr>
              <th className="p-3">Unit</th>
              <th className="p-3">Description</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Assigned Contractor</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {requests.map((req) => {
              const currentContractorId = req.assignedContractors?.[0]?._id || req.assignedContractors?.[0] || '';

              return (
                <tr key={req._id}>
                  <td className="p-3 font-medium">{req.unitId?.unitNumber || 'N/A'}</td>
                  <td className="p-3">{req.description}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      req.priority === 'Urgent' || req.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {req.priority}
                    </span>
                  </td>

                  <td className="p-3">
                    {isManager ? (
                      <select
                        value={currentContractorId}
                        onChange={(e) => handleAssignContractor(req._id, e.target.value)}
                        className="border rounded p-1 text-xs bg-white w-full max-w-[160px]"
                      >
                        <option value="">-- Unassigned --</option>
                        {contractors.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-slate-600 text-xs">
                        {req.assignedContractors?.[0]?.name || 'Unassigned'}
                      </span>
                    )}
                  </td>

                  <td className="p-3">
                    <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-xs font-semibold">
                      {req.status}
                    </span>
                  </td>

                  <td className="p-3">
                    <select 
                      value={req.status}
                      onChange={(e) => handleStatusChange(req._id, e.target.value)}
                      className="border rounded p-1 text-xs bg-white"
                    >
                      {(ALLOWED_TRANSITIONS[req.status] || [req.status]).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center text-sm text-slate-600">
        <span>Page {page} of {totalPages || 1}</span>
        <div className="flex gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      </div>

      {/* Modal for Creating New Request */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-lg font-bold text-slate-800">Log Maintenance Request</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Unit</label>
                <select
                  required
                  value={newUnitId}
                  onChange={(e) => setNewUnitId(e.target.value)}
                  className="w-full border rounded p-2 text-sm"
                >
                  <option value="">-- Choose Unit --</option>
                  {units.map((u) => (
                    <option key={u._id} value={u._id}>
                      Unit {u.unitNumber} ({u.tenantName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Problem Description</label>
                <textarea
                  required
                  rows="3"
                  placeholder="e.g. Kitchen sink leakage reported by tenant"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full border rounded p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full border rounded p-2 text-sm"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded text-sm text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}