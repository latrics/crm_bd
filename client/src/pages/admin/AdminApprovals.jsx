import { useState } from 'react';
import DeveloperGuide from '../../components/admin/DeveloperGuide.jsx';

export default function AdminApprovals() {
  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Delete Requests', 'Escalations', 'Resolved'];

  const [requests] = useState([]); // Cleared test cases

  const filteredRequests = activeFilter === 'All' 
    ? requests 
    : activeFilter === 'Resolved' 
      ? requests.filter(r => r.status !== 'Pending')
      : requests.filter(r => r.type === activeFilter.split(' ')[0] || r.type + ' Requests' === activeFilter);

  const guideSteps = [
    "This screen displays delete operations and discount limits waiting for Super Admin approval.",
    "Review raised tickets and choose to either Approve or Reject.",
    "Once approved, records are permanently deleted or updated in the main database."
  ];

  return (
    <div className="max-w-6xl space-y-6">
      <div className="mb-4">
        <h1 className="font-serif text-3xl font-bold text-brand-charcoal mb-2">Approval Center</h1>
        <p className="text-xs font-semibold text-brand-silver uppercase tracking-wider">Review requests • escalations • deletions</p>
      </div>

      <DeveloperGuide 
        title="Approval Process Guide"
        description="Verify database updates requested by CRM executives. System changes will remain in a pending state until authorized by a Super Admin."
        steps={guideSteps}
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
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Request ID</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Raised By</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Type</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Related Record</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Description</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Date</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRequests.map(req => (
                <tr key={req.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-6 py-4 text-xs font-semibold text-brand-charcoal">{req.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-brand-charcoal">{req.raisedBy}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${
                      req.type === 'Delete' ? 'bg-red-50 text-red-600 border-red-100/50' : 'bg-orange-50 text-orange-600 border-orange-100/50'
                    }`}>
                      {req.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-brand-charcoal font-medium">{req.record}</td>
                  <td className="px-6 py-4 text-xs text-brand-silver truncate max-w-[200px] font-normal">{req.desc}</td>
                  <td className="px-6 py-4 text-xs font-semibold text-brand-silver">{req.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${
                      req.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100/50' :
                      req.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-100/50' :
                      'bg-red-50 text-red-700 border-red-100/50'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    {req.status === 'Pending' ? (
                      <>
                        <button className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-100/50 hover:bg-green-100/80 transition-colors">
                          Approve
                        </button>
                        <button className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-brand-red/30 text-brand-red hover:bg-red-50 transition-colors">
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-brand-silver px-3 py-1.5">Processed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-sm font-semibold text-brand-silver bg-gray-50/20">
            All requests processed. No pending approval actions required.
          </div>
        )}
      </div>
    </div>
  );
}
