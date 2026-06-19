import React from 'react';
import DeveloperGuide from '../../components/admin/DeveloperGuide.jsx';

export default function AdminRoles() {
  const roles = ['Super Admin', 'Admin', 'Manager', 'Member'];
  const permissions = [
    {
      module: 'System & Administration',
      actions: [
        { name: 'Access CRM Dashboard', rights: [true, true, true, true] },
        { name: 'Access Admin Dashboard', rights: [true, true, false, false] },
        { name: 'View Audit Logs', rights: [true, true, false, false] },
        { name: 'Export Audit Logs', rights: [true, false, false, false] },
        { name: 'Access Security Center', rights: [true, true, false, false] },
        { name: 'Access System Settings', rights: [true, 'Limited', false, false] },
        { name: 'Override Any Action', rights: [true, false, false, false] },
      ]
    },
    {
      module: 'User Management',
      actions: [
        { name: 'Create Admin', rights: [true, false, false, false] },
        { name: 'Create Manager', rights: [true, true, false, false] },
        { name: 'Create Member', rights: [true, true, false, false] },
        { name: 'Edit User Details', rights: [true, true, false, false] },
        { name: 'Disable User Account', rights: [true, true, false, false] },
        { name: 'View All Users', rights: [true, true, false, false] },
        { name: 'Reset User Passwords', rights: [true, true, false, false] },
        { name: 'Force Logout Users', rights: [true, true, false, false] },
      ]
    },
    {
      module: 'Lead Management',
      actions: [
        { name: 'View All Leads', rights: [true, true, 'Assigned / Authorized Records', 'Assigned Records'] },
        { name: 'Create Lead', rights: [true, true, true, false] },
        { name: 'Edit Lead Details', rights: [true, true, 'As Assigned by Admin', 'Limited Notes/Data'] },
        { name: 'Update Lead Pipeline Status', rights: [true, true, true, false] },
        { name: 'Assign Leads', rights: [true, true, false, false] },
        { name: 'Reassign Leads', rights: [true, true, false, false] },
      ]
    },
    {
      module: 'Tender Management',
      actions: [
        { name: 'View All Tenders', rights: [true, true, 'Assigned / Authorized Records', 'Assigned Records'] },
        { name: 'Create Tender', rights: [true, true, true, false] },
        { name: 'Edit Tender Details', rights: [true, true, 'As Assigned by Admin', false] },
        { name: 'Update Tender Status', rights: [true, true, true, false] },
        { name: 'Assign Tenders', rights: [true, true, false, false] },
      ]
    },
    {
      module: 'Document Operations',
      actions: [
        { name: 'Upload Documents', rights: [true, true, true, true] },
        { name: 'Download Documents', rights: [true, true, true, 'Approval Required'] },
      ]
    },
    {
      module: 'Record Deletion & Approvals',
      actions: [
        { name: 'Delete Normal Records', rights: [true, true, false, false] },
        { name: 'Delete Sensitive Records', rights: [true, 'Super Admin Approval Required', false, false] },
        { name: 'Raise Deletion Request', rights: [true, true, true, false] },
        { name: 'Approve Manager Requests', rights: [true, true, false, false] },
        { name: 'Approve Sensitive Deletions', rights: [true, false, false, false] },
        { name: 'View Approval Queue', rights: [true, true, false, false] },
      ]
    }
  ];

  const guideSteps = [
    "Select checkboxes on a permission matrix to adjust granular access.",
    "Click the save button at the bottom of the table to persist changes to the role database.",
    "System security tokens refresh immediately upon updating any role template."
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <div className="mb-4">
        <h1 className="font-serif text-3xl font-bold text-brand-charcoal mb-2">Roles & Permissions</h1>
        <p className="text-xs font-semibold text-brand-silver uppercase tracking-wider">Reference matrix for system access levels</p>
      </div>

      <DeveloperGuide 
        title="Role Access Guide"
        description="Verify system access levels, check RBAC inheritance, and configure functional permissions for different roles."
        steps={guideSteps}
      />

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
                  <td colSpan={roles.length + 1} className="px-6 py-3.5 text-xs font-black text-brand-charcoal uppercase tracking-widest border-y border-gray-100">
                    {group.module}
                  </td>
                </tr>
                {group.actions.map((action, j) => (
                  <tr key={j} className="hover:bg-gray-50/10 transition-colors">
                    <td className="px-6 py-3.5 text-xs font-semibold text-brand-charcoal border-r border-gray-100 pl-10">
                      {action.name}
                    </td>
                    {action.rights.map((right, k) => {
                      if (right === true) {
                        return (
                          <td key={k} className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-50 text-green-600 border border-green-100 text-xs">
                              ✓
                            </span>
                          </td>
                        );
                      } else if (right === false) {
                        return (
                          <td key={k} className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-50 text-red-500 border border-red-100/30 text-xs opacity-50">
                              ✕
                            </span>
                          </td>
                        );
                      } else {
                        let badgeStyle = "bg-blue-50 text-blue-700 border-blue-100";
                        if (right.includes("Approval")) {
                          badgeStyle = "bg-amber-50 text-amber-700 border-amber-100";
                        } else if (right.includes("Assigned")) {
                          badgeStyle = "bg-purple-50 text-purple-700 border-purple-100";
                        } else if (right.includes("Limited")) {
                          badgeStyle = "bg-gray-50 text-gray-700 border-gray-200";
                        }
                        return (
                          <td key={k} className="px-4 py-3.5 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold border leading-tight ${badgeStyle} max-w-[140px] text-center`}>
                              {right}
                            </span>
                          </td>
                        );
                      }
                    })}
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
