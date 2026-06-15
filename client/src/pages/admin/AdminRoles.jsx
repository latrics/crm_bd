import React from 'react';

export default function AdminRoles() {
  const roles = ['Super Admin', 'Admin', 'Manager', 'Member'];
  const permissions = [
    { module: 'Leads', actions: [
      { name: 'View All', rights: [true, true, false, false] },
      { name: 'View Own/Team', rights: [true, true, true, true] },
      { name: 'Create', rights: [true, true, true, true] },
      { name: 'Edit', rights: [true, true, true, true] },
      { name: 'Delete', rights: [true, true, false, false] },
    ]},
    { module: 'Deals', actions: [
      { name: 'View All', rights: [true, true, false, false] },
      { name: 'View Own/Team', rights: [true, true, true, true] },
      { name: 'Create', rights: [true, true, true, true] },
      { name: 'Edit', rights: [true, true, true, true] },
      { name: 'Delete', rights: [true, false, false, false] },
    ]},
    { module: 'System Admin', actions: [
      { name: 'Manage Users', rights: [true, true, false, false] },
      { name: 'View Audit Logs', rights: [true, true, false, false] },
      { name: 'Master Data Config', rights: [true, false, false, false] },
      { name: 'Bulk Reassign', rights: [true, false, false, false] },
    ]}
  ];

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-brand-charcoal mb-2">Roles & Permissions</h1>
        <p className="text-xs font-semibold text-brand-silver uppercase tracking-wider">Reference matrix for system access levels</p>
      </div>

      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
          <h2 className="text-xs font-semibold text-brand-charcoal uppercase tracking-wider">Permission Matrix</h2>
          <span className="text-xs font-medium text-brand-silver bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">Read-only Reference</span>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider border-r border-gray-100">Module & Action</th>
              {roles.map(role => (
                <th key={role} className="px-6 py-3.5 text-xs font-semibold text-brand-charcoal uppercase tracking-wider text-center">
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {permissions.map((group, i) => (
              <React.Fragment key={i}>
                <tr className="bg-gray-50/30">
                  <td colSpan={roles.length + 1} className="px-6 py-3 text-xs font-semibold text-brand-charcoal uppercase tracking-wider">
                    {group.module}
                  </td>
                </tr>
                {group.actions.map((action, j) => (
                  <tr key={j} className="hover:bg-gray-50/20 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-brand-charcoal border-r border-gray-100 pl-10">
                      {action.name}
                    </td>
                    {action.rights.map((hasRight, k) => (
                      <td key={k} className="px-6 py-3 text-center">
                        {hasRight ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-50 text-green-600 border border-green-100 text-xs font-bold">
                            ✓
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-50 text-red-500 border border-red-100/30 text-xs opacity-50">
                            ✕
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

