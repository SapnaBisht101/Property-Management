import React, { useState, useEffect } from 'react';
import API from '../api/client';
import { Wrench, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await API.get('/dashboard');
        setMetrics(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return <div className="p-6 text-slate-500">Loading portfolio metrics...</div>;
  }

  // Support potential key name mismatches from backend
  const trendData = metrics?.resolved8WeekTrend || metrics?.trend || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Portfolio Overview</h1>
        <p className="text-sm text-slate-500">Real-time status of properties, rent, and repairs.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded shadow-sm border border-slate-200 flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Open Requests</p>
            <p className="text-2xl font-bold text-slate-800">{metrics?.openRequests ?? 0}</p>
          </div>
          <div className="p-2 bg-amber-50 text-amber-500 rounded-full">
            <Wrench size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow-sm border border-slate-200 flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Rent Overdue</p>
            <p className="text-2xl font-bold text-red-600">{metrics?.rentOverdueUnits ?? 0} Units</p>
          </div>
          <div className="p-2 bg-red-50 text-red-500 rounded-full">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow-sm border border-slate-200 flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Resolved (This Week)</p>
            <p className="text-2xl font-bold text-emerald-600">{metrics?.resolvedThisWeek ?? 0}</p>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-500 rounded-full">
            <CheckCircle size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow-sm border border-slate-200 flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Rent Collected</p>
            <p className="text-2xl font-bold text-indigo-600">
              ${(metrics?.rentCollectedCurrentMonth ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-500 rounded-full">
            <DollarSign size={20} />
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-4 rounded shadow-sm border border-slate-200">
          <h2 className="text-base font-semibold text-slate-800 mb-4">
            Resolved Requests (8-Week Trend)
          </h2>
          <div className="h-64 w-full min-h-[250px]">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Bar
                    dataKey="resolvedCount"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    name="Resolved Requests"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400 border border-dashed border-slate-200 rounded">
                No trend data available
              </div>
            )}
          </div>
        </div>

        {/* Requests Breakdown */}
        <div className="bg-white p-4 rounded shadow-sm border border-slate-200">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Requests Breakdown</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Reported</span>
              <span className="font-semibold text-slate-800">{metrics?.requestsBreakdown?.reported ?? 0}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Triaged</span>
              <span className="font-semibold text-slate-800">{metrics?.requestsBreakdown?.triaged ?? 0}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Scheduled</span>
              <span className="font-semibold text-slate-800">{metrics?.requestsBreakdown?.scheduled ?? 0}</span>
            </div>
            <div className="flex justify-between items-center pb-2">
              <span className="text-sm text-slate-600">Resolved</span>
              <span className="font-semibold text-emerald-600">{metrics?.requestsBreakdown?.resolved ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}