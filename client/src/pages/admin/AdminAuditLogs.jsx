import React, { useState, useEffect } from 'react';
import DeveloperGuide from '../../components/admin/DeveloperGuide.jsx';
import { getAuditLogs } from '../../api/adminApi.js';
import { format, isToday, isYesterday, subDays } from 'date-fns';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [expandedRows, setExpandedRows] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState('All Users');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [selectedModule, setSelectedModule] = useState('All Modules');
  const [selectedDateRange, setSelectedDateRange] = useState('All Time');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getAuditLogs();
      if (res.success) {
        setLogs(res.data);
      } else {
        setError('Failed to load audit logs.');
      }
    } catch (err) {
      setError(err.message || 'Error loading audit logs.');
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Get unique lists for filter select options
  const uniqueUsers = ['All Users', ...new Set(logs.map(log => log.user_id?.name || log.user_name || 'System'))];
  
  const rolesList = ['All Roles', 'Super Admin', 'Admin', 'Manager', 'Member'];
  const modulesList = ['All Modules', 'Leads', 'Tenders', 'Documents', 'Users', 'Security'];
  const dateRanges = ['All Time', 'Today', 'Past 7 Days', 'Past 30 Days'];

  // Filter logs based on inputs
  const filteredLogs = logs.filter(log => {
    const term = searchQuery.toLowerCase();
    const userName = (log.user_id?.name || log.user_name || 'System').toLowerCase();
    const actionMsg = (log.meta?.message || log.action || '').toLowerCase();
    const moduleName = (log.entity || '').toLowerCase();
    const actionType = (log.action || '').toLowerCase();
    const entityId = (log.entity_id || '').toLowerCase();

    const matchesSearch = 
      userName.includes(term) ||
      actionMsg.includes(term) ||
      moduleName.includes(term) ||
      actionType.includes(term) ||
      entityId.includes(term);

    // User Filter
    const userMatch = selectedUser === 'All Users' || (log.user_id?.name || log.user_name || 'System') === selectedUser;

    // Role Filter
    const logRole = (log.user_id?.role || log.user_role || 'System').toLowerCase().replace('_', '');
    const selectedRoleNorm = selectedRole.toLowerCase().replace(' ', '').replace('_', '');
    const roleMatch = selectedRole === 'All Roles' || logRole === selectedRoleNorm;

    // Module Filter
    const moduleMatch = selectedModule === 'All Modules' || (log.entity || '').toLowerCase() === selectedModule.toLowerCase();

    // Date Filter
    const logDate = new Date(log.createdAt || log.timestamp);
    let dateMatch = true;
    const now = new Date();
    
    if (selectedDateRange === 'Today') {
      dateMatch = isToday(logDate);
    } else if (selectedDateRange === 'Past 7 Days') {
      dateMatch = logDate >= subDays(now, 7);
    } else if (selectedDateRange === 'Past 30 Days') {
      dateMatch = logDate >= subDays(now, 30);
    }

    return matchesSearch && userMatch && roleMatch && moduleMatch && dateMatch;
  });

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Actor', 'Role', 'Action', 'Module', 'Description', 'IP Address', 'Severity'];
    const rows = filteredLogs.map(log => [
      format(new Date(log.createdAt || log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      log.user_id?.name || log.user_name || 'System',
      log.user_id?.role || log.user_role || 'System',
      log.action,
      log.entity,
      log.meta?.message || log.action,
      log.ip_address || '-',
      log.severity || 'info'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Latrics_Audit_Logs_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSeverityBadgeStyle = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'critical':
        return 'bg-red-50 text-red-600 border-red-100';
      case 'warning':
        return 'bg-orange-50 text-orange-600 border-orange-100/60';
      case 'success':
        return 'bg-green-50 text-green-600 border-green-100';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-150';
    }
  };

  const getRoleText = (role) => {
    if (!role) return 'System';
    if (role.toLowerCase() === 'superadmin' || role.toLowerCase() === 'super_admin') return 'Super Admin';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  const guideSteps = [
    "Audit trails trace mutations made to Lead, Deal, and Tender pipelines.",
    "Click the toggle arrow on any row to expand and view precise changes in state.",
    "Use the export CSV option to download logs for external security reports."
  ];

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex justify-between items-end mb-4 gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-charcoal mb-2">Audit Logs</h1>
          <p className="text-xs font-semibold text-brand-silver uppercase tracking-wider">Track user activity • data modifications • logins</p>
        </div>
        <div className="flex gap-4 flex-wrap">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search details, action, id..." 
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/[0.08] min-w-[200px] transition-all bg-white text-brand-charcoal font-medium placeholder:text-brand-silver/60"
          />
          <button 
            onClick={exportToCSV}
            disabled={filteredLogs.length === 0}
            className="bg-brand-charcoal hover:bg-brand-charcoal/90 disabled:opacity-55 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 shadow-sm hover:translate-y-[-1px]"
          >
            EXPORT CSV
          </button>
        </div>
      </div>

      <DeveloperGuide 
        title="Security Audit Guide"
        description="Verify system compliance, database queries, and administrative commands. Audit logs record absolute snapshots of data changes."
        steps={guideSteps}
      />

      {/* Filters bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <select 
          value={selectedDateRange}
          onChange={(e) => setSelectedDateRange(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 text-xs text-brand-charcoal focus:outline-none focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/[0.08] bg-white font-semibold cursor-pointer transition-all"
        >
          {dateRanges.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        
        <select 
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 text-xs text-brand-charcoal focus:outline-none focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/[0.08] bg-white font-semibold cursor-pointer transition-all"
        >
          {uniqueUsers.map(u => <option key={u} value={u}>{u === 'All Users' ? 'All Users' : u}</option>)}
        </select>
        
        <select 
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 text-xs text-brand-charcoal focus:outline-none focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/[0.08] bg-white font-semibold cursor-pointer transition-all"
        >
          {rolesList.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        
        <select 
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 text-xs text-brand-charcoal focus:outline-none focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/[0.08] bg-white font-semibold cursor-pointer transition-all"
        >
          {modulesList.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        
        <button 
          onClick={() => {
            setSearchQuery('');
            setSelectedUser('All Users');
            setSelectedRole('All Roles');
            setSelectedModule('All Modules');
            setSelectedDateRange('All Time');
          }}
          className="col-span-2 md:col-span-1 border border-brand-red/20 text-brand-red hover:bg-brand-red/[0.04] text-xs font-semibold px-4 py-2 rounded-xl transition-all"
        >
          Reset Filters
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red mx-auto"></div>
            <p className="text-xs text-brand-silver mt-2">Loading logs...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500 text-sm font-semibold">{error}</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider w-10"></th>
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">User</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Role</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Action</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Module</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.map(log => {
                const hasDetails = log.meta && (log.meta.before || log.meta.after || log.meta.changes);
                return (
                  <React.Fragment key={log._id}>
                    <tr 
                      className={`hover:bg-gray-50/30 transition-colors ${hasDetails ? 'cursor-pointer' : ''}`} 
                      onClick={() => hasDetails && toggleRow(log._id)}
                    >
                      <td className="px-6 py-4 text-brand-silver text-[10px]">
                        {hasDetails ? (expandedRows[log._id] ? '▼' : '▶') : ''}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-brand-charcoal">
                        {format(new Date(log.createdAt || log.timestamp), 'MMM dd, yyyy hh:mm a')}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-brand-charcoal">
                        {log.user_id?.name || log.user_name || 'System'}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-brand-silver">
                        {getRoleText(log.user_id?.role || log.user_role)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getSeverityBadgeStyle(log.severity)}`}>
                          {log.meta?.message || log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-brand-charcoal font-bold uppercase tracking-wider">{log.entity}</td>
                      <td className="px-6 py-4 text-xs text-brand-silver font-mono">{log.ip_address || '-'}</td>
                    </tr>
                    {expandedRows[log._id] && hasDetails && (
                      <tr className="bg-gray-50/20">
                        <td colSpan="7" className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border border-gray-100 rounded-xl p-5 shadow-inner">
                            {log.meta.changes ? (
                              <div className="col-span-2 space-y-2">
                                <h4 className="font-bold text-xs text-brand-charcoal uppercase tracking-wider border-b border-gray-150 pb-1">Changes Logged:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {Object.keys(log.meta.changes).map(field => (
                                    <div key={field} className="bg-gray-50/50 p-3 rounded-lg border border-gray-150">
                                      <div className="font-bold text-[10px] text-brand-silver uppercase tracking-wider mb-1.5">{field}</div>
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                          <span className="text-[9px] font-semibold text-brand-red uppercase block">Before</span>
                                          <span className="font-mono text-brand-charcoal break-all">{String(log.meta.changes[field].old ?? 'null')}</span>
                                        </div>
                                        <div>
                                          <span className="text-[9px] font-semibold text-green-600 uppercase block">After</span>
                                          <span className="font-mono text-brand-charcoal break-all">{String(log.meta.changes[field].new ?? 'null')}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <>
                                {log.meta.before && (
                                  <div>
                                    <div className="font-bold text-xs text-brand-red mb-1.5 uppercase tracking-wider">Before state:</div>
                                    <pre className="text-[10px] font-mono text-brand-charcoal bg-gray-50/60 p-3.5 rounded-lg border border-gray-150 overflow-x-auto max-h-56">
                                      {JSON.stringify(log.meta.before, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.meta.after && (
                                  <div>
                                    <div className="font-bold text-xs text-green-600 mb-1.5 uppercase tracking-wider">After state:</div>
                                    <pre className="text-[10px] font-mono text-brand-charcoal bg-gray-50/60 p-3.5 rounded-lg border border-gray-150 overflow-x-auto max-h-56">
                                      {JSON.stringify(log.meta.after, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-sm font-semibold text-brand-silver">
                    No matching logs found in this query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
