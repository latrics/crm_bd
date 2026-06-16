import { useState, useEffect } from 'react';
import AdminStatCard from '../../components/admin/AdminStatCard.jsx';
import DeveloperGuide from '../../components/admin/DeveloperGuide.jsx';
import { getUsers, inviteUser, deleteUser } from '../../api/adminApi.js';

export default function AdminOverview() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(null); // Will hold { link, email, role }
  const [inviteError, setInviteError] = useState(null);

  // Delete State
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Fetch users on mount
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers();
      if (response.success) {
        setMembers(response.data);
      } else {
        setError('Failed to fetch members');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);
    setInviteSubmitting(true);

    try {
      const response = await inviteUser(inviteEmail, inviteRole);
      if (response.success) {
        setInviteSuccess({
          link: response.data.link,
          email: response.data.email,
          role: response.data.role
        });
        setInviteEmail('');
        // Refresh the member list to show new pending status or similar (once activated, they appear)
        fetchUsers();
      } else {
        setInviteError(response.message || 'Failed to send invitation');
      }
    } catch (err) {
      setInviteError(err.message || 'An error occurred during invitation creation');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setDeleteSubmitting(true);
    try {
      const response = await deleteUser(userToDelete._id);
      if (response.success) {
        setMembers(members.filter(m => m._id !== userToDelete._id));
        setUserToDelete(null);
        fetchUsers();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    alert('Invitation link copied to clipboard!');
  };

  const getOutlookWebLink = (email, role, link) => {
    const subject = encodeURIComponent('Invitation to Join Latrics CRM');
    // Using \r\n ensures properly encoded %0D%0A which Outlook Web handles more reliably
    const bodyText = `Hello,\r\n\r\nYou have been invited to join the Latrics CRM platform as a ${role.toUpperCase()}.\r\n\r\nTo get started, please set up your account credentials and activate your profile using the secure link below:\r\n\r\n${link}\r\n\r\nPlease note: For security purposes, this setup link will automatically expire in 24 hours.\r\n\r\nIf you have any questions or require assistance, please contact your system administrator.\r\n\r\nBest regards,\r\nThe Latrics System Operations Team`;
    
    const body = encodeURIComponent(bodyText);
    
    // Using the classic robust OWA path format
    return `https://outlook.office.com/owa/?path=/mail/action/compose&to=${encodeURIComponent(email)}&subject=${subject}&body=${body}`;
  };

  // Helper formatting functions
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadgeStyle = (role) => {
    switch (role?.toLowerCase()) {
      case 'superadmin':
        return 'bg-red-50 text-red-600 border-red-100';
      case 'admin':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      default:
        return 'bg-blue-50 text-blue-600 border-blue-100';
    }
  };

  const getRoleAccessDescription = (role) => {
    switch (role?.toLowerCase()) {
      case 'superadmin':
        return 'Full Access';
      case 'admin':
        return 'Administrative';
      default:
        return 'Standard Member';
    }
  };

  // Stats calculation
  const stats = [
    { label: 'Total Users', value: members.length, icon: '👥' },
    { label: 'Active Now', value: members.filter(m => m.isActive).length, icon: '🟢' },
    { label: 'System Admins', value: members.filter(m => ['superadmin', 'admin'].includes(m.role?.toLowerCase())).length, icon: '🛡️' },
    { label: 'Members', value: members.filter(m => m.role?.toLowerCase() === 'member').length, icon: '👤' },
  ];

  // Filtering
  const filteredMembers = members.filter(member => {
    const nameStr = member.name || '';
    const emailStr = member.email || '';
    const roleStr = member.role || '';
    
    const matchesSearch = nameStr.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          emailStr.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'All' || 
                        roleStr.toLowerCase() === roleFilter.toLowerCase().replace(' ', '');
    
    const matchesStatus = statusFilter === 'All' || 
                          (statusFilter === 'Active' ? member.isActive : !member.isActive);
                          
    return matchesSearch && matchesRole && matchesStatus;
  });

  const guideSteps = [
    "Navigate between different sections (Users, Approvals, Audit Logs) using the Admin Sidebar.",
    "Click '+ Invite Member' to invite a new admin or standard member to the CRM.",
    "Use Clipboard Copy or Send via Outlook mailto: links to share setup links directly with invitees.",
    "Remove inactive or departing users securely using the actions panel."
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
            System Console
          </button>
        </div>
      </div>

      {/* Reusable Developer/Admin Guide */}
      <DeveloperGuide 
        title="Admin Console Overview" 
        description="This console provides a central interface for managing CRM systems, user roles, security audits, and records. Send user invitations or remove active members directly from this panel."
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
                    <option value="Super Admin">Super Admin</option>
                    <option value="Admin">Admin</option>
                    <option value="Member">Member</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-red/50 bg-white text-brand-charcoal font-semibold cursor-pointer shrink-0"
                  >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>

                  {/* Invite Button */}
                  <button 
                    onClick={() => {
                      setInviteSuccess(null);
                      setInviteError(null);
                      setShowInviteModal(true);
                    }}
                    className="bg-[#DA291C] hover:bg-[#C22419] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-[0_4px_12px_rgba(218,41,28,0.15)] flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    + Invite Member
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red mx-auto"></div>
                  <p className="text-xs text-brand-silver mt-2">Loading system users...</p>
                </div>
              ) : error ? (
                <div className="text-center py-10 text-red-500 text-xs font-semibold">{error}</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold text-brand-silver uppercase tracking-wider">
                      <th className="pb-3 font-semibold">MEMBER</th>
                      <th className="pb-3 font-semibold">ROLE</th>
                      <th className="pb-3 font-semibold">ACCESS</th>
                      <th className="pb-3 font-semibold">STATUS</th>
                      <th className="pb-3 font-semibold text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredMembers.map((member) => (
                      <tr key={member._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-[#DA291C]/10 text-[#DA291C]`}>
                              {getInitials(member.name)}
                            </div>
                            <div>
                              <div className="font-semibold text-brand-charcoal text-sm">{member.name}</div>
                              <div className="text-xs text-brand-silver font-normal">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${getRoleBadgeStyle(member.role)}`}>
                            {member.role === 'superadmin' ? 'SUPER ADMIN' : member.role?.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 text-sm font-medium text-brand-charcoal">
                          {getRoleAccessDescription(member.role)}
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${member.isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${member.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                            {member.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          {member.role?.toLowerCase() !== 'superadmin' && (
                            <button 
                              onClick={() => setUserToDelete(member)}
                              className="text-red-500 hover:text-red-700 transition-colors p-1.5 text-xs font-bold hover:underline"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredMembers.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-xs text-brand-silver font-medium">
                          No members found matching filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
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
                  <tr className="hover:bg-gray-50/50 transition-colors text-sm font-semibold">
                    <td className="py-4 text-amber-600">Admin</td>
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
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-50 text-gray-300 border border-gray-100 text-xs">-</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors text-sm font-semibold">
                    <td className="py-4 text-blue-600">Member</td>
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
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-50 text-gray-300 border border-gray-100 text-xs">-</span>
                    </td>
                    <td className="py-4 text-center">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-50 text-gray-300 border border-gray-100 text-xs">-</span>
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
              <button
                onClick={() => {
                  setInviteSuccess(null);
                  setInviteError(null);
                  setShowInviteModal(true);
                }}
                className="w-full flex items-center justify-between p-3.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left text-sm font-semibold text-brand-charcoal bg-white"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-brand-charcoal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Invite employee
                </div>
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-brand-charcoal/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button 
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-brand-charcoal transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {!inviteSuccess ? (
              <>
                <h3 className="font-serif text-2xl font-bold text-brand-charcoal mb-2">Invite Team Member</h3>
                <p className="text-xs text-brand-silver mb-5">
                  Send a one-time invitation link to activate their password and grant system access.
                </p>

                {inviteError && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded-xl mb-4 font-semibold">
                    {inviteError}
                  </div>
                )}

                <form onSubmit={handleInviteSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-brand-silver uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="e.g. employee@latrics.com"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-brand-red/50 bg-white text-brand-charcoal"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-brand-silver uppercase tracking-wider mb-1.5">
                      Assign Role
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setInviteRole('member')}
                        className={`py-3 px-4 border rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${inviteRole === 'member' ? 'border-brand-red bg-red-50/30 text-brand-red' : 'border-gray-200 text-brand-charcoal hover:bg-gray-50'}`}
                      >
                        <span className="text-base">👤</span>
                        <span>Member</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInviteRole('admin')}
                        className={`py-3 px-4 border rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${inviteRole === 'admin' ? 'border-brand-red bg-red-50/30 text-brand-red' : 'border-gray-200 text-brand-charcoal hover:bg-gray-50'}`}
                      >
                        <span className="text-base">🛡️</span>
                        <span>Admin</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={inviteSubmitting}
                    className="w-full bg-[#DA291C] hover:bg-[#C22419] text-white text-xs font-bold py-3 rounded-xl transition-all shadow-[0_4px_12px_rgba(218,41,28,0.15)] flex items-center justify-center gap-2"
                  >
                    {inviteSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generating Link...
                      </>
                    ) : (
                      'Generate Invitation'
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-2 space-y-5">
                <div className="w-12 h-12 bg-green-50 text-green-500 border border-green-100 rounded-full flex items-center justify-center text-xl mx-auto">
                  ✓
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-brand-charcoal">Invitation Generated</h3>
                  <p className="text-xs text-brand-silver mt-1">
                    Setup link successfully created for <span className="font-bold text-brand-charcoal">{inviteSuccess.email}</span>
                  </p>
                </div>

                {/* Link View Box */}
                <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl text-left">
                  <span className="text-[9px] font-bold text-brand-silver uppercase block mb-1">SETUP LINK</span>
                  <code className="text-[10px] break-all select-all font-mono text-brand-charcoal bg-white px-2 py-1 border border-gray-100 rounded block">
                    {inviteSuccess.link}
                  </code>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleCopyLink(inviteSuccess.link)}
                    className="py-2.5 px-4 border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50 text-brand-charcoal transition-all"
                  >
                    Copy Link
                  </button>
                  <a
                    href={getOutlookWebLink(inviteSuccess.email, inviteSuccess.role, inviteSuccess.link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-4 bg-[#DA291C] hover:bg-[#C22419] rounded-xl text-xs font-semibold text-white shadow-md hover:shadow-lg transition-all text-center block"
                  >
                    Send via Outlook Web
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-brand-charcoal/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 text-center space-y-4">
            <div className="w-12 h-12 bg-red-50 text-red-500 border border-red-100 rounded-full flex items-center justify-center text-xl mx-auto">
              ⚠️
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-brand-charcoal">Remove User Access</h3>
              <p className="text-xs text-brand-silver mt-1.5 leading-relaxed">
                Are you sure you want to remove <span className="font-bold text-brand-charcoal">{userToDelete.name}</span> ({userToDelete.email})? This action is permanent and revokes all CRM access immediately.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="py-2 px-4 border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50 text-brand-charcoal transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteSubmitting}
                className="py-2 px-4 bg-red-600 hover:bg-red-700 rounded-xl text-xs font-semibold text-white transition-all shadow-md"
              >
                {deleteSubmitting ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
