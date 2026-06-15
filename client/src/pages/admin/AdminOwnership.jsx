import { useState } from 'react';
import AdminStatCard from '../../components/admin/AdminStatCard.jsx';
import DeveloperGuide from '../../components/admin/DeveloperGuide.jsx';

export default function AdminOwnership() {
  const [selectedUser, setSelectedUser] = useState('');
  
  const stats = [
    { label: 'Assigned Leads', value: 0, icon: '👤' },
    { label: 'Assigned Deals', value: 0, icon: '💼' },
    { label: 'Assigned Tenders', value: 0, icon: '📄' },
  ];

  const history = []; // Cleared reassignment history

  const guideSteps = [
    "Select the user from the dropdown to check their current assigned records count.",
    "Choose 'From User' and 'To User' dropdown options to reassign leads, deals, or tenders.",
    "Click Transfer Records to perform database migration; reassignment history logs will display below."
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <div className="mb-4">
        <h1 className="font-serif text-3xl font-bold text-brand-charcoal mb-2">Ownership & Reassignment</h1>
        <p className="text-xs font-semibold text-brand-silver uppercase tracking-wider">Transfer records • bulk reassignment</p>
      </div>

      <DeveloperGuide 
        title="Ownership Management Guide"
        description="Run batch reassignment tasks for CRM contacts, deals, and tenders. This tools makes it easy to offboard employees or balance sales quotas."
        steps={guideSteps}
      />

      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 mb-8">
        <h2 className="text-xs font-semibold text-brand-charcoal uppercase tracking-wider mb-4">User Summary</h2>
        <div className="flex gap-4 mb-6">
          <select 
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-brand-charcoal focus:outline-none focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/[0.08] min-w-[300px] transition-all bg-white font-medium cursor-pointer"
          >
            <option value="">Search and select a user...</option>
            <option value="balaji">Balaji Nagarajan</option>
          </select>
        </div>

        {selectedUser && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat, i) => (
              <AdminStatCard key={i} {...stat} />
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 mb-8">
        <h2 className="text-xs font-semibold text-brand-charcoal uppercase tracking-wider mb-4">Bulk Reassign</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-xs font-semibold text-brand-silver uppercase mb-2">From User</label>
            <select className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm text-brand-charcoal focus:outline-none focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/[0.08] transition-all bg-white font-medium cursor-pointer">
              <option>Select user...</option>
              <option>Balaji Nagarajan</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-silver uppercase mb-2">To User</label>
            <select className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm text-brand-charcoal focus:outline-none focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/[0.08] transition-all bg-white font-medium cursor-pointer">
              <option>Select user...</option>
              <option>Balaji Nagarajan</option>
            </select>
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-xs font-semibold text-brand-silver uppercase mb-3">Modules to Transfer</label>
          <div className="flex gap-6">
            {['Leads', 'Deals', 'Tenders'].map(mod => (
              <label key={mod} className="flex items-center gap-2 cursor-pointer font-medium text-brand-charcoal text-sm">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-brand-red focus:ring-brand-red/[0.2] focus:ring-2 accent-brand-red cursor-pointer transition-all" />
                <span>{mod}</span>
              </label>
            ))}
          </div>
        </div>
        <button className="bg-brand-red hover:bg-brand-red/90 text-white px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-[0_4px_12px_rgba(218,41,28,0.15)] hover:translate-y-[-1px] w-full md:w-auto">
          Transfer Records
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/30">
          <h2 className="text-xs font-semibold text-brand-charcoal uppercase tracking-wider">Reassignment History</h2>
        </div>
        {history.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Date</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">From</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">To</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Modules</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Records</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Performed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-6 py-4 text-xs font-semibold text-brand-charcoal">{row.date}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-brand-charcoal">{row.from}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-brand-charcoal">{row.to}</td>
                  <td className="px-6 py-4 text-xs text-brand-silver font-medium">{row.modules}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-brand-charcoal">{row.count}</td>
                  <td className="px-6 py-4 text-xs text-brand-silver font-medium">{row.performedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-sm font-semibold text-brand-silver bg-gray-50/20">
            No record reassignment tasks have been executed yet.
          </div>
        )}
      </div>
    </div>
  );
}
