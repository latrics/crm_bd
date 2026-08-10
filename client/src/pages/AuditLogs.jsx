import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useToast from '../hooks/useToast.js';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { user } = useAuth();
  const { addToast } = useToast();

  const userRole = user?.role ? user.role.replace(/[\s_]/g, '').toLowerCase() : '';
  const isSuperAdmin = userRole === 'superadmin';

  const fetchLogs = async () => {
    try {
      const res = await api.get('/admin/audit-logs');
      setLogs(res.data?.data || res.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch logs', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleResetLogs = async () => {
    setResetting(true);
    try {
      const res = await api.post('/admin/audit-logs/reset');
      const resData = res.data || res;
      if (resData?.success) {
        addToast({ 
          type: 'success', 
          message: resData.message || 'Audit logs reset successfully. The reset action has been logged.' 
        });
        setShowConfirmReset(false);
        if (resData.data) {
          setLogs(resData.data);
        }
        await fetchLogs();
      }
    } catch (err) {
      console.error('Failed to reset audit logs', err);
      addToast({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to reset audit logs. Super Admin authorization required.' 
      });
    } finally {
      setResetting(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-brand-silver font-bold">Retrieving audit trails...</div>;

  return (
    <div className="pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <PageHeader title="Audit Logs" subtitle="Immutable history of all system activities" />

        {isSuperAdmin && (
          <button
            onClick={() => setShowConfirmReset(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100/80 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
          >
            <RotateCcw className="w-4 h-4 text-red-600" />
            Reset Audit Logs
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 bg-red-100/80 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Hard Reset Audit Logs?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              This action will clear all existing activity records from the database. 
              <strong className="text-slate-800 font-bold block mt-2">
                Note: A permanent entry recording WHO performed this hard reset will automatically be created and preserved in the audit trail.
              </strong>
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                disabled={resetting}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-slate-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetLogs}
                disabled={resetting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {resetting ? 'Resetting...' : 'Yes, Reset Logs'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-surfaceAlt/50 border-b border-brand-border">
                <th className="px-6 py-5 text-[10px] font-black text-brand-silver uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-5 text-[10px] font-black text-brand-silver uppercase tracking-widest">User</th>
                <th className="px-6 py-5 text-[10px] font-black text-brand-silver uppercase tracking-widest">Action</th>
                <th className="px-6 py-5 text-[10px] font-black text-brand-silver uppercase tracking-widest">Module / Entity</th>
                <th className="px-6 py-5 text-[10px] font-black text-brand-silver uppercase tracking-widest">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {logs.map(log => {
                const userName = log.user_id?.name || log.user_name || 'System';
                const userEmail = log.user_id?.email || (log.user_role ? `Role: ${log.user_role}` : 'N/A');
                const actionName = log.action || 'UPDATE';
                const entityName = log.entity || log.module || 'System';
                const timestamp = log.createdAt || log.timestamp;

                return (
                  <tr key={log._id} className="hover:bg-brand-surfaceAlt/20 transition-colors">
                    <td className="px-6 py-5 text-xs text-brand-silver font-bold tabular-nums">
                      {timestamp ? new Date(timestamp).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-brand-text text-sm">{userName}</div>
                      <div className="text-[10px] text-brand-silver font-medium">{userEmail}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tight ${
                        actionName === 'CREATE' ? 'bg-green-100 text-green-700' :
                        actionName === 'DELETE' ? 'bg-red-100 text-red-700' :
                        actionName === 'HARD_RESET' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                        actionName === 'UPDATE' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {actionName}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-xs font-black text-brand-text uppercase tracking-widest">
                      {entityName}
                    </td>
                    <td className="px-6 py-5 max-w-xs">
                      <div className="text-[10px] text-brand-silver font-medium italic" title={JSON.stringify(log.meta || log.details)}>
                        {log.meta?.description || log.details?.path || (log.meta ? JSON.stringify(log.meta) : 'N/A')}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
