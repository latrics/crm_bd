import { useState, useEffect } from 'react';
import DeveloperGuide from '../../components/admin/DeveloperGuide.jsx';
import { getApprovals, updateApproval, resetApprovals } from '../../api/approvalsApi.js';
import useToast from '../../hooks/useToast.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export default function AdminApprovals() {
  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Delete Requests', 'Escalations', 'Resolved'];

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { user } = useAuth();
  const { addToast } = useToast();

  const userRole = user?.role ? user.role.replace(/[\s_]/g, '').toLowerCase() : '';
  const isSuperAdmin = userRole === 'superadmin';

  const fetchApprovals = async () => {
    try {
      const res = await getApprovals();
      setRequests(res.data || []);
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to fetch approvals' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  // Clear selections when filter changes
  useEffect(() => {
    setSelectedIds([]);
  }, [activeFilter]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateApproval(id, status);
      addToast({ type: 'success', message: `Request ${status.toLowerCase()} successfully` });
      fetchApprovals();
    } catch (err) {
      addToast({ type: 'error', message: `Failed to ${status.toLowerCase()} request` });
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map(id => updateApproval(id, status)));
      addToast({ type: 'success', message: `${selectedIds.length} requests ${status.toLowerCase()} successfully` });
      setSelectedIds([]);
      fetchApprovals();
    } catch (err) {
      addToast({ type: 'error', message: `Failed to update status for some requests` });
      fetchApprovals();
    } finally {
      setLoading(false);
    }
  };

  const handleResetApprovals = async () => {
    setResetting(true);
    try {
      const res = await resetApprovals();
      const resData = res.data || res;
      if (resData?.success) {
        addToast({ 
          type: 'success', 
          message: resData.message || 'Approval Center reset successfully. This reset event has been recorded in Audit Logs.' 
        });
        setShowConfirmReset(false);
        setSelectedIds([]);
        setRequests([]);
        await fetchApprovals();
      }
    } catch (err) {
      console.error('Failed to reset approvals', err);
      addToast({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to reset approvals. Super Admin authorization required.' 
      });
    } finally {
      setResetting(false);
    }
  };

  const filteredRequests = activeFilter === 'All' 
    ? requests 
    : activeFilter === 'Resolved' 
      ? requests.filter(r => r.status !== 'Pending')
      : requests.filter(r => r.type === activeFilter.split(' ')[0] || r.type + ' Requests' === activeFilter);

  const pendingFilteredRequests = filteredRequests.filter(r => r.status === 'Pending');

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(reqId => reqId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pendingFilteredRequests.length && pendingFilteredRequests.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingFilteredRequests.map(r => r._id));
    }
  };

  const guideSteps = [
    "This screen displays delete operations and discount limits waiting for Super Admin approval.",
    "Review raised tickets and choose to either Approve or Reject.",
    "Once approved, records are permanently deleted or updated in the main database."
  ];

  const guideCautions = [
    "Approving a deletion ticket permanently removes the target record from the database.",
    "Hard Resetting the Approval Center automatically revokes all pending deletion requests—your Lead, Deal, and Tender data is never lost during a reset."
  ];

  return (
    <div className="w-full space-y-6">
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-charcoal mb-2">Approval Center</h1>
          <p className="text-xs font-semibold text-brand-silver uppercase tracking-wider">Review requests • escalations • deletions</p>
        </div>
        
        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <button
              onClick={() => setShowConfirmReset(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100/80 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
            >
              <RotateCcw className="w-4 h-4 text-red-600" />
              Reset Approval Center
            </button>
          )}

          {/* Bulk Action Controls */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 bg-brand-surfaceAlt border border-brand-border px-4 py-2.5 rounded-xl animate-in fade-in slide-in-from-right-3 duration-200">
              <span className="text-xs font-bold text-brand-text flex items-center gap-1.5 mr-1">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-red text-white text-[10px] font-black">{selectedIds.length}</span>
                Selected
              </span>
              <button 
                onClick={() => handleBulkStatusUpdate('Approved')}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 shadow-sm transition-all cursor-pointer active:scale-95 border-none"
              >
                Approve All
              </button>
              <button 
                onClick={() => handleBulkStatusUpdate('Rejected')}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white border border-brand-red/30 text-brand-red hover:bg-red-50 transition-all cursor-pointer active:scale-95"
              >
                Reject All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 bg-red-100/80 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Hard Reset Approval Center?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              This action will clear all pending and resolved approval requests from the system. 
              <strong className="text-slate-800 font-bold block mt-2">
                Note: All pending deletion requests will be revoked by default so lead/deal data remains safe, and a permanent audit entry will be logged.
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
                onClick={handleResetApprovals}
                disabled={resetting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {resetting ? 'Resetting...' : 'Yes, Reset Requests'}
              </button>
            </div>
          </div>
        </div>
      )}

      <DeveloperGuide 
        title="Approval Process Guide"
        description="Verify database updates requested by CRM executives. System changes will remain in a pending state until authorized by a Super Admin."
        steps={guideSteps}
        cautions={guideCautions}
      />

      <div className="flex gap-2 mb-6">
        {filters.map(f => (
          <button 
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
              activeFilter === f 
                ? 'bg-brand-red text-white border-brand-red shadow-[0_4px_12px_rgba(218,41,28,0.15)]' 
                : 'bg-white text-brand-silver border-gray-200 hover:border-brand-red/50 hover:text-brand-red'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        {filteredRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 w-10 text-center">
                    {pendingFilteredRequests.length > 0 && (
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 cursor-pointer accent-brand-red"
                        checked={selectedIds.length > 0 && selectedIds.length === pendingFilteredRequests.length}
                        onChange={toggleSelectAll}
                      />
                    )}
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Request ID</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Raised By</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Related Record</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequests.map(req => (
                  <tr key={req._id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4 text-center">
                      {req.status === 'Pending' && (
                        <input 
                          type="checkbox"
                          className="w-4 h-4 cursor-pointer accent-brand-red"
                          checked={selectedIds.includes(req._id)}
                          onChange={() => toggleSelect(req._id)}
                        />
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-brand-charcoal">{req._id.substring(req._id.length - 6).toUpperCase()}</td>
                    <td className="px-6 py-4 text-sm font-medium text-brand-charcoal">{req.raisedBy}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${
                        req.type === 'Delete' ? 'bg-red-50 text-red-600 border-red-100/50' : 'bg-orange-50 text-orange-600 border-orange-100/50'
                      }`}>
                        {req.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-brand-charcoal font-medium">{req.recordName}</td>
                    <td className="px-6 py-4 text-xs text-brand-silver truncate max-w-[200px] font-normal">{req.description}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-brand-silver">{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${
                        req.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100/50' :
                        req.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-100/50' :
                        'bg-red-50 text-red-700 border-red-100/50'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {req.status === 'Pending' ? (
                          <>
                            <button onClick={() => handleUpdateStatus(req._id, 'Approved')} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-100/50 hover:bg-green-100/80 transition-colors cursor-pointer whitespace-nowrap">
                              Approve
                            </button>
                            <button onClick={() => handleUpdateStatus(req._id, 'Rejected')} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-brand-red/30 text-brand-red hover:bg-red-50 transition-colors cursor-pointer whitespace-nowrap">
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-brand-silver/60 uppercase tracking-wider whitespace-nowrap">{req.status}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-sm font-semibold text-brand-silver bg-gray-50/20">
            All requests processed. No pending approval actions required.
          </div>
        )}
      </div>
    </div>
  );
}
