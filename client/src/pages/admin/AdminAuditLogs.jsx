import React, { useState } from 'react';
import DeveloperGuide from '../../components/admin/DeveloperGuide.jsx';

export default function AdminAuditLogs() {
  const [expandedRows, setExpandedRows] = useState({});
  
  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const logs = [
    { id: 1, timestamp: '2026-06-12 10:30 AM', user: 'balaji.nagarajan@latrics.com', action: 'Update', module: 'Leads', details: { before: 'Stage: New', after: 'Stage: Qualified' }, ip: '192.168.1.10' },
    { id: 2, timestamp: '2026-06-11 04:45 PM', user: 'balaji.nagarajan@latrics.com', action: 'Login', module: 'System', details: { after: 'Successful console developer login' }, ip: '192.168.1.10' },
  ];

  const guideSteps = [
    "Audit trails trace mutations made to Lead, Deal, and Tender pipelines.",
    "Click the toggle arrow on any row to expand and view precise changes in state.",
    "Use the export CSV option to download logs for external security reports."
  ];

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-charcoal mb-2">Audit Logs</h1>
          <p className="text-xs font-semibold text-brand-silver uppercase tracking-wider">Track user activity • data modifications • logins</p>
        </div>
        <button className="bg-brand-charcoal hover:bg-brand-charcoal/90 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 shadow-sm hover:translate-y-[-1px]">
          EXPORT CSV
        </button>
      </div>

      <DeveloperGuide 
        title="Security Audit Guide"
        description="Verify system compliance, database queries, and administrative commands. Audit logs record absolute snapshots of data changes."
        steps={guideSteps}
      />

      <div className="flex gap-4 mb-6">
        <select className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-brand-charcoal focus:outline-none focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/[0.08] bg-white font-medium cursor-pointer transition-all">
          <option>All Time</option>
          <option>This Month</option>
          <option>Last Month</option>
        </select>
        <select className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-brand-charcoal focus:outline-none focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/[0.08] bg-white font-medium cursor-pointer transition-all">
          <option>Balaji Nagarajan</option>
        </select>
        <select className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-brand-charcoal focus:outline-none focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/[0.08] bg-white font-medium cursor-pointer transition-all">
          <option>All Modules</option>
          <option>Leads</option>
          <option>Deals</option>
          <option>Tenders</option>
          <option>System</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider w-10"></th>
              <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">User</th>
              <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Action</th>
              <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Module</th>
              <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">IP/Device</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map(log => (
              <React.Fragment key={log.id}>
                <tr className="hover:bg-gray-50/30 transition-colors cursor-pointer" onClick={() => toggleRow(log.id)}>
                  <td className="px-6 py-4 text-brand-silver text-[10px]">
                    {expandedRows[log.id] ? '▼' : '▶'}
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-brand-charcoal">{log.timestamp}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-brand-charcoal">{log.user}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${
                      log.action === 'Update' ? 'bg-blue-50 text-blue-600 border-blue-100/50' : 
                      log.action === 'Create' ? 'bg-green-50 text-green-600 border-green-100/50' : 
                      'bg-gray-50 text-gray-600 border-gray-100'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-brand-charcoal font-medium">{log.module}</td>
                  <td className="px-6 py-4 text-xs text-brand-silver font-mono">{log.ip}</td>
                </tr>
                {expandedRows[log.id] && (
                  <tr className="bg-gray-50/30">
                    <td colSpan="6" className="px-6 py-4">
                      <div className="text-xs grid grid-cols-2 gap-4 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                        {log.details.before && (
                          <div>
                            <div className="font-semibold text-brand-red mb-1">Before:</div>
                            <div className="font-mono text-brand-charcoal bg-gray-50/60 p-2 rounded-lg border border-gray-100/50">{log.details.before}</div>
                          </div>
                        )}
                        {log.details.after && (
                          <div>
                            <div className="font-semibold text-green-600 mb-1">After:</div>
                            <div className="font-mono text-brand-charcoal bg-gray-50/60 p-2 rounded-lg border border-gray-100/50">{log.details.after}</div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
