import { useState } from 'react';
import AdminStatCard from '../../components/admin/AdminStatCard.jsx';
import DeveloperGuide from '../../components/admin/DeveloperGuide.jsx';

export default function AdminOverview() {
  const stats = [
    { label: 'Total Users', value: 1, icon: '👥' },
    { label: 'Active Now', value: 1, icon: '🟢' },
    { label: 'Pending Approvals', value: 0, icon: '⏳', badgeCount: 0 },
    { label: 'Open Escalations', value: 0, icon: '🔥', badgeCount: 0 },
  ];

  const [members, setMembers] = useState([
    {
      id: 1,
      name: 'Balaji Nagarajan',
      email: 'balaji.nagarajan@latrics.com',
      role: 'SUPER ADMIN',
      roleColor: 'bg-red-50 text-red-600 border-red-100',
      access: 'Full Access',
      status: 'Active',
      statusColor: 'bg-green-500',
      lastActive: 'Today, 10:15 AM',
      avatarBg: 'bg-red-100 text-red-700',
      initials: 'BN'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' || member.role.toLowerCase().replace('_', ' ') === roleFilter.toLowerCase();
    const matchesStatus = statusFilter === 'All' || member.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesRole && matchesStatus;
  });

  const guideSteps = [
    "Navigate between different sections (Users, Approvals, Audit Logs) using the Admin Sidebar.",
    "Search or filter the Team list on this page to quickly verify search functionality.",
    "Click Quick Actions to simulate administrative operations in the CRM console."
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header Section */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="bg-red-50 text-brand-red text-xs font-bold px-3 py-1.5 rounded-full border border-red-100 uppercase tracking-wider">
            SUPER ADMIN
          </div>
          <button className="flex items-center gap-2 border border-gray-300 bg-white text-brand-charcoal text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm hover:bg-gray-50 transition-colors">
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Balaji Nagarajan
          </button>
        </div>
      </div>

      {/* Reusable Developer/Admin Guide */}
      <DeveloperGuide 
        title="Admin Console Overview" 
        description="This console provides a central interface for managing CRM systems, user roles, security audits, and records. It is currently configured in Super Admin viewpoint with mock telemetry reflecting active developer status."
        steps={guideSteps}
      />

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <AdminStatCard key={i} {...stat} />
        ))}
      </div>

      {/* Grid Layout below stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Area (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Team & Access Panel */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-5">
            <div className="flex flex-col gap-3 mb-6">
              <h2 className="font-serif text-xl font-bold text-brand-charcoal">Team & Access</h2>
              <div className="flex flex-row justify-between items-center gap-4 overflow-x-auto pb-2">
                {/* Search box (Left-aligned) */}
                <div className="relative shrink-0">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search members..."
                    className="border border-gray-200 rounded-xl pl-4 pr-9 py-2 text-xs focus:outline-none focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/[0.08] w-[220px] transition-all bg-white text-brand-charcoal shrink-0"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-4.5 w-4.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                </div>

                {/* Filters & Buttons (Right-aligned) */}
                <div className="flex items-center gap-2 flex-nowrap shrink-0">
                  {/* Role Filter */}
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-red/50 bg-white text-brand-charcoal font-semibold cursor-pointer shrink-0"
                  >
                    <option value="All">All Roles</option>
                    <option value="SUPER ADMIN">Super Admin</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-red/50 bg-white text-brand-charcoal font-semibold cursor-pointer shrink-0"
                  >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                  </select>

                  {/* Invite Button */}
                  <button className="bg-[#DA291C] hover:bg-[#C22419] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-[0_4px_12px_rgba(218,41,28,0.15)] flex items-center gap-1.5 whitespace-nowrap shrink-0">
                    + Invite Member
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-bold text-brand-silver uppercase tracking-wider">
                    <th className="pb-3 font-semibold">MEMBER</th>
                    <th className="pb-3 font-semibold">ROLE</th>
                    <th className="pb-3 font-semibold">ACCESS</th>
                    <th className="pb-3 font-semibold">STATUS</th>
                    <th className="pb-3 font-semibold">LAST ACTIVE</th>
                    <th className="pb-3 font-semibold text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${member.avatarBg}`}>
                            {member.initials}
                          </div>
                          <div>
                            <div className="font-semibold text-brand-charcoal text-sm">{member.name}</div>
                            <div className="text-xs text-brand-silver font-normal">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${member.roleColor}`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3.5 text-sm font-medium text-brand-charcoal">
                        {member.access}
                      </td>
                      <td className="py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">
                          <span className={`w-1.5 h-1.5 rounded-full ${member.statusColor}`}></span>
                          {member.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-xs text-brand-silver font-medium">
                        {member.lastActive}
                      </td>
                      <td className="py-3.5 text-right">
                        <button className="text-gray-400 hover:text-brand-charcoal transition-colors p-1">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-xs text-brand-silver font-medium">
                        No members found matching filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role Permissions Panel */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-5">
            <h2 className="font-serif text-xl font-bold text-brand-charcoal mb-4">Role Permissions</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-bold text-brand-silver uppercase tracking-wider">
                    <th className="pb-3 font-semibold">ROLE / MODULE</th>
                    <th className="pb-3 font-semibold text-center">LEADS</th>
                    <th className="pb-3 font-semibold text-center">DEALS</th>
                    <th className="pb-3 font-semibold text-center">TENDERS</th>
                    <th className="pb-3 font-semibold text-center">EXPORTS</th>
                    <th className="pb-3 font-semibold text-center">SETTINGS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50/50 transition-colors text-sm font-semibold">
                    <td className="py-4 text-[#DA291C]">Super Admin</td>
                    <td className="py-4 text-center">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-50 text-green-600 border border-green-100 text-xs">✓</span>
                    </td>
                    <td className="py-4 text-center">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-50 text-green-600 border border-green-100 text-xs">✓</span>
                    </td>
                    <td className="py-4 text-center">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-50 text-green-600 border border-green-100 text-xs">✓</span>
                    </td>
                    <td className="py-4 text-center">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-50 text-green-600 border border-green-100 text-xs">✓</span>
                    </td>
                    <td className="py-4 text-center">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-50 text-green-600 border border-green-100 text-xs">✓</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Area (1/3 width) */}
        <div className="space-y-6">

          {/* Quick Actions Panel */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-5">
            <h2 className="font-serif text-xl font-bold text-brand-charcoal mb-4">Quick Actions</h2>
            <div className="space-y-2.5">
              {[
                {
                  label: 'Invite employee',
                  icon: (
                    <svg className="w-4 h-4 text-brand-charcoal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  )
                },
                {
                  label: 'Create role',
                  icon: (
                    <svg className="w-4 h-4 text-brand-charcoal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  )
                },
                {
                  label: 'Assign records',
                  icon: (
                    <svg className="w-4 h-4 text-brand-charcoal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  )
                },
                {
                  label: 'View audit log',
                  icon: (
                    <svg className="w-4 h-4 text-brand-charcoal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  )
                }
              ].map((action, i) => (
                <button
                  key={i}
                  className="w-full flex items-center justify-between p-3.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left text-sm font-semibold text-brand-charcoal"
                >
                  <div className="flex items-center gap-3">
                    {action.icon}
                    {action.label}
                  </div>
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Admin Activity Panel */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-5">
            <h2 className="font-serif text-xl font-bold text-brand-charcoal mb-4">Recent Admin Activity</h2>
            <div className="relative border-l border-gray-200 pl-4 ml-2.5 space-y-6">
              {[
                {
                  time: 'Today, 10:15 AM',
                  user: 'Balaji Nagarajan',
                  userColor: 'text-brand-red font-bold',
                  action: 'logged into the system console',
                  dotColor: 'bg-brand-red'
                },
                {
                  time: 'May 11, 08:22 PM',
                  action: 'Database maintenance & check completed successfully',
                  dotColor: 'bg-gray-400'
                }
              ].map((activity, i) => (
                <div key={i} className="relative">
                  {/* Timeline dot */}
                  <span className={`absolute -left-[22.5px] top-1.5 w-3 h-3 rounded-full border-2 border-white ring-4 ring-white ${activity.dotColor}`}></span>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-brand-silver font-medium block">{activity.time}</span>
                    <p className="text-xs text-brand-charcoal font-normal">
                      {activity.user && <span className={`${activity.userColor} mr-1`}>{activity.user}</span>}
                      {activity.action}
                      {activity.actionBold && <span className={`${activity.actionBoldColor} ml-1`}>{activity.actionBold}</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
