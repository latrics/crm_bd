import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import AdminStatCard from '../../components/admin/AdminStatCard.jsx';
import DeveloperGuide from '../../components/admin/DeveloperGuide.jsx';
import { getUsers, inviteUser, deleteUser, getAuditLogs } from '../../api/adminApi.js';
import { format, isToday, isYesterday } from 'date-fns';

export default function AdminOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
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

  // Fetch users and logs on mount
  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, logsRes] = await Promise.all([
        getUsers(),
        getAuditLogs().catch(err => ({ success: false, data: [] }))
      ]);
      
      if (usersRes.success) {
        setMembers(usersRes.data);
      } else {
        setError('Failed to fetch members');
      }

      if (logsRes.success) {
        setAuditLogs(logsRes.data);
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const isOnline = (m) => {
    if (!m.lastActiveAt) return false;
    const diff = new Date() - new Date(m.lastActiveAt);
    return diff < 45000;
  };

  const fetchSilentData = async () => {
    try {
      const [usersRes, logsRes] = await Promise.all([
        getUsers(),
        getAuditLogs().catch(err => ({ success: false, data: [] }))
      ]);
      if (usersRes.success) {
        setMembers(usersRes.data);
      }
      if (logsRes.success) {
        setAuditLogs(logsRes.data);
      }
    } catch (err) {
      console.error('Silent background update failed', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchSilentData, 4000);
    return () => clearInterval(interval);
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
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleCopyLink = async (link, email, role, isSilent = false) => {
    try {
      const username = email ? email.split('@')[0] : 'there';
      const displayRole = role === 'superadmin' ? 'Administrator' : role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Member';

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Latrics CRM Invitation</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Poppins,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0;">
<tr>
<td align="center">
<table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.08);">
<!-- Top Brand Bar -->
<tr>
<td style="height:6px;background:#DA291C;"></td>
</tr>
<!-- Header -->
<tr>
<td align="center" style="padding:40px 40px 20px;">
<img src="https://ui-avatars.com/api/?name=L&color=DA291C&background=fef2f2" width="40" alt="Latrics CRM">
<p style="margin-top:8px;color:#8A8D8F;font-size:14px;">
Building Better Tomorrow
</p>
</td>
</tr>
<!-- Hero -->
<tr>
<td style="padding:0 50px;">
<h1 style="margin:0;font-size:32px;color:#54585A;font-weight:700;">
You're Invited to Join Latrics CRM
</h1>
<p style="margin-top:24px;font-size:16px;line-height:28px;color:#54585A;">
Hello <strong>${username}</strong>,
</p>
<p style="font-size:16px;line-height:28px;color:#54585A;">
You have been invited to join the
<strong>Latrics CRM Platform</strong>
as an <strong>${displayRole}</strong>.
</p>
<p style="font-size:16px;line-height:28px;color:#54585A;">
Create your account credentials and activate your profile using the secure link below.
</p>
</td>
</tr>
<!-- CTA -->
<tr>
<td align="center" style="padding:35px 50px;">
<a href="${link}" style="background:#DA291C;color:#ffffff;text-decoration:none;padding:16px 36px;border-radius:10px;font-size:16px;font-weight:600;display:inline-block;">
Activate Account
</a>
</td>
</tr>
<!-- Security Box -->
<tr>
<td style="padding:0 50px 30px;">
<div style="background:#F7F8F9;border-left:4px solid #DA291C;padding:20px;border-radius:10px;">
<p style="margin:0;font-size:14px;line-height:24px;color:#54585A;">
🔒 This invitation link will expire in
<strong>24 hours</strong>.
</p>
</div>
</td>
</tr>
<!-- Link -->
<tr>
<td style="padding:0 50px 40px;">
<p style="font-size:14px;color:#8A8D8F;">
If the button does not work, use the link below:
</p>
<p style="word-break:break-all;font-size:13px;color:#DA291C;">
${link}
</p>
</td>
</tr>
<!-- Footer -->
<tr>
<td style="background:#54585A;padding:30px;text-align:center;">
<p style="margin:0;color:#ffffff;font-size:14px;font-weight:600;">
Latrics System Operations Team
</p>
<p style="margin-top:8px;color:#C7C9C7;font-size:12px;">
Building Better Tomorrow
</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

      const blobHtml = new Blob([htmlContent], { type: 'text/html' });
      const blobText = new Blob([link], { type: 'text/plain' });
      
      const clipboardItem = new ClipboardItem({
        'text/html': blobHtml,
        'text/plain': blobText
      });
      
      await navigator.clipboard.write([clipboardItem]);
      if (!isSilent) {
        alert('Rich HTML layout copied to clipboard! You can now paste it directly into an email draft.');
      } else {
        alert('Rich HTML layout copied to clipboard!\n\nPlease press Ctrl+V (or Paste) into the email body once your email app opens.');
      }
    } catch (err) {
      console.warn('ClipboardItem API not supported, falling back to text copy', err);
      navigator.clipboard.writeText(link);
      if (!isSilent) {
        alert('Invitation link copied to clipboard!');
      } else {
        alert('Link copied to clipboard!\n\nPlease paste it into the email body once your email app opens.');
      }
    }
  };

  const getOutlookWebLink = (email, role, link) => {
    const subject = encodeURIComponent('Invitation to Join Latrics CRM');
    // Using \r\n ensures properly encoded %0D%0A. 
    // Removed angle brackets to ensure plain URL format which some clients prefer.
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
      case 'manager':
        return 'bg-purple-50 text-purple-600 border-purple-100';
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
      case 'manager':
        return 'Management';
      default:
        return 'Standard Member';
    }
  };

  const stats = [
    { label: 'Total Users', value: members.length, icon: '👥' },
    { label: 'Active Now', value: members.filter(m => isOnline(m)).length, icon: '🟢' },
    { label: 'System Admins', value: members.filter(m => ['superadmin', 'admin'].includes(m.role?.toLowerCase())).length, icon: '🛡️' },
    { label: 'Managers', value: members.filter(m => m.role?.toLowerCase() === 'manager').length, icon: '📋' },
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
            {user?.role === 'superadmin' ? 'SUPER ADMIN' : user?.role?.toUpperCase() || 'ADMIN'}
          </div>
          <button className="flex items-center gap-2 border border-gray-300 bg-white text-brand-charcoal text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm hover:bg-gray-50 transition-colors">
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {user?.name || 'System Console'}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                    <option value="Manager">Manager</option>
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
                    {filteredMembers.map((member) => {
                      const online = isOnline(member);
                      return (
                        <tr key={member._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-[#DA291C]/10 text-[#DA291C]`}>
                                  {getInitials(member.name)}
                                </div>
                                {online && (
                                  <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" title="Online" />
                                )}
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
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${online ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                              {online ? 'Active' : 'Inactive'}
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
                      );
                    })}
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
                    <td className="py-4 text-purple-600">Manager</td>
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

              <button
                onClick={() => navigate('/admin/roles')}
                className="w-full flex items-center justify-between p-3.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left text-sm font-semibold text-brand-charcoal bg-white"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-brand-charcoal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Create role
                </div>
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => navigate('/admin/ownership')}
                className="w-full flex items-center justify-between p-3.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left text-sm font-semibold text-brand-charcoal bg-white"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-brand-charcoal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Assign records
                </div>
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => navigate('/admin/audit-logs')}
                className="w-full flex items-center justify-between p-3.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left text-sm font-semibold text-brand-charcoal bg-white"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-brand-charcoal" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  View audit log
                </div>
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Recent Admin Activity Panel */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-5">
            <h2 className="font-serif text-xl font-bold text-brand-charcoal mb-4">Recent Admin Activity</h2>
            <div className="relative">
              <div className="space-y-0">
                {auditLogs.slice(0, 5).map((log, index) => {
                  const logDate = new Date(log.timestamp || log.createdAt);
                  let displayDate = format(logDate, 'MMM dd, hh:mm a');
                  if (isToday(logDate)) {
                    displayDate = `Today, ${format(logDate, 'hh:mm a')}`;
                  } else if (isYesterday(logDate)) {
                    displayDate = `Yesterday, ${format(logDate, 'hh:mm a')}`;
                  }

                  let actionText = '';
                  const entityName = log.entity ? (log.entity === 'Users' ? 'user' : log.entity.toLowerCase()) : 'record';
                  const actionType = log.action ? log.action.toUpperCase() : 'UPDATE';

                  if (actionType === 'INVITE_USER' || (actionType === 'CREATE' && log.entity === 'Invite')) {
                    actionText = `invited a new member (${log.meta?.email || log.meta?.body?.email || 'Unknown'})`;
                  } else if (actionType === 'CREATE') {
                    const identifier = log.meta?.body?.name || log.meta?.body?.title || log.meta?.body?.company || log.meta?.body?.email || '';
                    actionText = `created a new ${entityName}${identifier ? ` (${identifier})` : ''}`;
                  } else if (actionType === 'UPDATE') {
                    const changes = Object.keys(log.meta?.body || {}).filter(k => !['_id', 'createdAt', 'updatedAt', '__v'].includes(k));
                    const changesText = changes.length > 0 ? ` (updated: ${changes.slice(0, 3).join(', ')}${changes.length > 3 ? '...' : ''})` : '';
                    actionText = `updated ${entityName}${entityName === 'record' ? '' : ' record'}${changesText}`;
                  } else if (actionType === 'DELETE') {
                    actionText = `deleted a ${entityName}${entityName === 'record' ? '' : ' record'}`;
                  } else if (actionType === 'CONVERT') {
                    actionText = `converted a lead to a deal`;
                  } else {
                    actionText = `${actionType.toLowerCase()} ${entityName}`;
                  }

                  const getSeverityColor = (sev) => {
                    switch (sev?.toLowerCase()) {
                      case 'critical': return 'bg-red-500';
                      case 'warning': return 'bg-orange-500';
                      case 'success': return 'bg-green-500';
                      default: return 'bg-gray-400';
                    }
                  };

                  const getRoleText = (role) => {
                    if (!role) return 'System';
                    if (role.toLowerCase() === 'superadmin' || role.toLowerCase() === 'super_admin') return 'Super Admin';
                    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
                  };

                  return (
                    <div key={log._id || index} className="flex gap-4 items-stretch">
                      {/* Column 1: Timeline dot & line */}
                      <div className="flex flex-col items-center flex-shrink-0 w-3 relative">
                        <div className={`w-2.5 h-2.5 rounded-full border-2 border-white z-10 mt-1.5 ${getSeverityColor(log.severity)}`}></div>
                        {index < auditLogs.slice(0, 5).length - 1 && (
                          <div className="absolute top-3 bottom-0 w-px bg-gray-200 left-1/2 -translate-x-1/2"></div>
                        )}
                      </div>

                      {/* Column 2: Timestamp */}
                      <div className="w-[110px] shrink-0 text-[11px] text-gray-500 pt-0.5 font-medium whitespace-nowrap">
                        {displayDate}
                      </div>

                      {/* Column 3: Content details */}
                      <div className="flex-1 pb-6 text-xs">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="font-semibold text-brand-charcoal">
                            {log.user_id?.name || log.user_name || 'System'}
                          </span>
                          <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.25 rounded uppercase font-bold tracking-tight">
                            {getRoleText(log.user_id?.role || log.user_role)}
                          </span>
                          <span className="text-[9px] text-brand-silver font-bold uppercase tracking-wider">
                            • {log.entity || 'System'}
                          </span>
                        </div>
                        <p className="text-gray-600 text-[11px] leading-relaxed">
                          {log.meta?.message || actionText}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {auditLogs.length === 0 && (
                  <div className="text-xs text-gray-400 text-center py-4">No recent activity</div>
                )}
              </div>
              
              <div className="mt-2 pt-4 border-t border-gray-100 text-center">
                <button 
                  onClick={() => navigate('/admin/audit-logs')}
                  className="text-xs font-bold text-[#DA291C] hover:underline animate-pulse hover:animate-none"
                >
                  [ View Full Audit Logs ]
                </button>
              </div>
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
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setInviteRole('member')}
                        className={`py-3 px-2 border rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${inviteRole === 'member' ? 'border-brand-red bg-red-50/30 text-brand-red' : 'border-gray-200 text-brand-charcoal hover:bg-gray-50'}`}
                      >
                        <span className="text-base">👤</span>
                        <span>Member</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInviteRole('manager')}
                        className={`py-3 px-2 border rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${inviteRole === 'manager' ? 'border-brand-red bg-red-50/30 text-brand-red' : 'border-gray-200 text-brand-charcoal hover:bg-gray-50'}`}
                      >
                        <span className="text-base">📋</span>
                        <span>Manager</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInviteRole('admin')}
                        className={`py-3 px-2 border rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${inviteRole === 'admin' ? 'border-brand-red bg-red-50/30 text-brand-red' : 'border-gray-200 text-brand-charcoal hover:bg-gray-50'}`}
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
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] break-all select-all font-mono text-brand-charcoal bg-white px-2 py-2 border border-gray-100 rounded block flex-1">
                      {inviteSuccess.link}
                    </code>
                    <button 
                      onClick={() => handleCopyLink(inviteSuccess.link, inviteSuccess.email, inviteSuccess.role)}
                      className="p-2 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg transition-colors text-brand-silver hover:text-brand-charcoal"
                      title="Copy Hyperlink"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="mt-5 border-t border-gray-100 pt-4">
                  <p className="text-[10px] font-bold text-brand-silver uppercase block mb-3 text-center">Share Link Via</p>
                  <div className="flex items-center justify-center gap-4">
                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopyLink(inviteSuccess.link, inviteSuccess.email, inviteSuccess.role)}
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 text-brand-charcoal flex items-center justify-center group-hover:scale-110 group-hover:bg-gray-200 transition-all">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </div>
                      <span className="text-[10px] font-semibold text-gray-500">Copy</span>
                    </button>

                    {/* WhatsApp */}
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent('Join Latrics CRM using this link: ' + inviteSuccess.link)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center group-hover:scale-110 shadow-sm transition-all">
                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 .003 5.381.003 12.028c0 2.12.553 4.19 1.603 6.014L0 24l6.113-1.602a11.967 11.967 0 005.918 1.564h.005c6.645 0 12.026-5.381 12.026-12.029C24.062 5.38 18.675 0 12.031 0zm0 22.004h-.003a9.982 9.982 0 01-5.086-1.385l-.365-.217-3.782.991.996-3.69-.238-.378a9.969 9.969 0 01-1.523-5.303c0-5.503 4.478-9.98 9.98-9.98 5.503 0 9.982 4.477 9.982 9.98 0 5.502-4.479 9.98-9.981 9.98zm5.474-7.48c-.3-.15-1.776-.877-2.052-.977-.275-.1-.475-.15-.675.15-.2.3-.775.977-.95 1.177-.175.2-.35.225-.65.075-1.527-.754-2.613-1.428-3.642-3.21-.175-.3-.018-.462.132-.612.135-.135.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.675-1.625-.925-2.225-.245-.59-.492-.51-.675-.52h-.575c-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.113 3.225 5.116 4.521.714.309 1.27.493 1.704.631.716.227 1.368.195 1.884.118.577-.086 1.776-.726 2.026-1.426.25-.7.25-1.301.175-1.426-.075-.125-.275-.2-.575-.35z"/></svg>
                      </div>
                      <span className="text-[10px] font-semibold text-gray-500">WhatsApp</span>
                    </a>

                    {/* Outlook Web */}
                    <button
                      onClick={async () => {
                        await handleCopyLink(inviteSuccess.link, inviteSuccess.email, inviteSuccess.role, true);
                        const subject = encodeURIComponent('Invitation to Join Latrics CRM');
                        const email = encodeURIComponent(inviteSuccess.email || '');
                        window.open(`https://outlook.office.com/owa/?path=/mail/action/compose&to=${email}&subject=${subject}`, '_blank');
                      }}
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#0078D4] text-white flex items-center justify-center group-hover:scale-110 shadow-sm transition-all">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                      </div>
                      <span className="text-[10px] font-semibold text-gray-500">Outlook Web</span>
                    </button>

                    {/* Generic Mail */}
                    <button
                      onClick={async () => {
                        await handleCopyLink(inviteSuccess.link, inviteSuccess.email, inviteSuccess.role, true);
                        const subject = encodeURIComponent('Invitation to Join Latrics CRM');
                        const email = encodeURIComponent(inviteSuccess.email || '');
                        window.location.href = `mailto:${email}?subject=${subject}`;
                      }}
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-600 text-white flex items-center justify-center group-hover:scale-110 shadow-sm transition-all">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path></svg>
                      </div>
                      <span className="text-[10px] font-semibold text-gray-500">Email App</span>
                    </button>
                  </div>
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
