import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance.js';
import PageHeader from '../components/layout/PageHeader.jsx';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/admin/audit-logs');
        setLogs(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch logs', err);
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) return <div className="p-12 text-center text-brand-silver font-bold">Retrieving audit trails...</div>;

  return (
    <div className="pb-12">
      <PageHeader title="Audit Logs" subtitle="Immutable history of all system activities" />

      <div className="bg-white rounded-3xl shadow-xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-surfaceAlt/50 border-b border-brand-border">
                <th className="px-6 py-5 text-[10px] font-black text-brand-silver uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-5 text-[10px] font-black text-brand-silver uppercase tracking-widest">User</th>
                <th className="px-6 py-5 text-[10px] font-black text-brand-silver uppercase tracking-widest">Action</th>
                <th className="px-6 py-5 text-[10px] font-black text-brand-silver uppercase tracking-widest">Module</th>
                <th className="px-6 py-5 text-[10px] font-black text-brand-silver uppercase tracking-widest">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {logs.map(log => (
                <tr key={log._id} className="hover:bg-brand-surfaceAlt/20 transition-colors">
                  <td className="px-6 py-5 text-xs text-brand-silver font-bold tabular-nums">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-bold text-brand-text text-sm">{log.user?.name || 'System'}</div>
                    <div className="text-[10px] text-brand-silver font-medium">{log.user?.email || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tight ${
                      log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                      log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                      log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-xs font-black text-brand-text uppercase tracking-widest">
                    {log.module}
                  </td>
                  <td className="px-6 py-5 max-w-xs">
                    <div className="text-[10px] text-brand-silver font-medium truncate italic" title={JSON.stringify(log.details)}>
                      {log.details?.path || 'N/A'} - {JSON.stringify(log.details?.params || {})}
                    </div>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-brand-silver font-bold italic">
                    No activity logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
