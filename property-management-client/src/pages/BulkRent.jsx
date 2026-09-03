import React, { useState } from 'react';
import API from '../api/client';
import { Download } from 'lucide-react';

export default function BulkRent() {
  const [monthYear, setMonthYear] = useState('2026-08');
  const [jsonText, setJsonText] = useState('[{"unitIdentifier": "101", "amount": 1200}]');
  const [report, setReport] = useState(null);

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    try {
      const payments = JSON.parse(jsonText);
      const res = await API.post('/rent/bulk', { monthYear, payments });
      setReport(res.data.summaryReport);
    } catch (err) {
      alert('Invalid JSON format or server error');
    }
  };

  const handleExportCSV = async () => {
    const res = await API.get('/rent/export-csv', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rent_Roll_${monthYear}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Bulk Rent Processing</h1>
        <button onClick={handleExportCSV} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded text-sm">
          <Download size={16} /> Export CSV Rent Roll
        </button>
      </div>

      <form onSubmit={handleBulkSubmit} className="bg-white p-6 rounded shadow-sm border border-slate-200 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Billing Month (YYYY-MM)</label>
          <input type="text" value={monthYear} onChange={(e) => setMonthYear(e.target.value)} className="border rounded p-2 text-sm w-48" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Batch Rent Payments (JSON Array)</label>
          <textarea rows={6} value={jsonText} onChange={(e) => setJsonText(e.target.value)} className="w-full border rounded p-2 text-sm font-mono" />
        </div>
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium">Process Batch</button>
      </form>

      {report && (
        <div className="bg-white p-6 rounded shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold mb-4">Processing Summary</h2>
          <div className="space-y-2">
            {report.map((item, index) => (
              <div key={index} className="flex justify-between border-b pb-2 text-sm">
                <span>Unit: {item.unitNumber || item.unitIdentifier}</span>
                <span className={`font-semibold ${
                  item.status === 'matched' ? 'text-green-600' :
                  item.status === 'underpaid' ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {item.status.toUpperCase()} ({item.amountPaid || 0})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}