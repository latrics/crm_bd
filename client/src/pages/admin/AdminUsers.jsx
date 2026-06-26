import { useState, useEffect } from 'react';
import DeveloperGuide from '../../components/admin/DeveloperGuide.jsx';
import { getUsers, createUser, updateUser, resendInvite, revokeInvite } from '../../api/adminApi.js';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Form states
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [editForm, setEditForm] = useState({ id: '', name: '', email: '', role: 'member' });
  const [resetForm, setResetForm] = useState({ id: '', name: '', password: '', confirmPassword: '' });

  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isOnline = (u) => {
    if (!u.lastActiveAt) return false;
    const diff = new Date() - new Date(u.lastActiveAt);
    return diff < 45000;
  };

  useEffect(() => {
    fetchUsers();

    const interval = setInterval(async () => {
      try {
        const res = await getUsers();
        if (res.success) {
          setUsers(res.data);
        }
      } catch (err) {
        console.error('Silent users update failed', err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      if (res.success) {
        setUsers(res.data);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError(err.message || 'Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      const res = await updateUser(user._id, { isActive: !user.isActive });
      if (res.success) {
        fetchUsers();
      }
    } catch (err) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);
    try {
      const res = await createUser(addForm);
      if (res.success) {
        setShowAddModal(false);
        setAddForm({ name: '', email: '', password: '', role: 'member' });
        fetchUsers();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create user');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);
    try {
      const res = await updateUser(editForm.id, {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role
      });
      if (res.success) {
        setShowEditModal(false);
        fetchUsers();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to update user');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (resetForm.password !== resetForm.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    setFormSubmitting(true);
    try {
      const res = await updateUser(resetForm.id, { password: resetForm.password });
      if (res.success) {
        setShowResetModal(false);
        setResetForm({ id: '', name: '', password: '', confirmPassword: '' });
        alert('Password reset successfully!');
      }
    } catch (err) {
      setFormError(err.message || 'Failed to reset password');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleResendInvite = async (id) => {
    try {
      const res = await resendInvite(id);
      if (res.success) {
        alert('Invitation resent successfully!');
        fetchUsers();
      }
    } catch (err) {
      alert(err.message || 'Failed to resend invitation');
    }
  };

  const handleRevokeInvite = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this invitation?')) return;
    try {
      const res = await revokeInvite(id);
      if (res.success) {
        fetchUsers();
      }
    } catch (err) {
      alert(err.message || 'Failed to revoke invitation');
    }
  };

  // Helper styles
  const getRoleBadgeStyle = (role) => {
    switch (role?.toLowerCase()) {
      case 'superadmin':
      case 'super_admin':
        return 'bg-red-50 text-red-600 border-red-100';
      case 'admin':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'manager':
        return 'bg-purple-50 text-purple-600 border-purple-100';
      default:
        return 'bg-blue-50 text-blue-600 border-blue-100';
    }
  };

  const displayRole = (role) => {
    switch (role?.toLowerCase()) {
      case 'superadmin':
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'manager':
        return 'Manager';
      case 'member':
        return 'Member';
      default:
        return role ? role.charAt(0).toUpperCase() + role.slice(1) : '';
    }
  };

  const filteredUsers = users.filter(u => {
    const term = searchQuery.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.role || '').toLowerCase().includes(term)
    );
  });

  const guideSteps = [
    "This list displays all registered system users and their active credentials.",
    "Click suspend or deactivate to temporarily freeze access for any specific user.",
    "Use the Add User button in the header to register new team members manually."
  ];

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex justify-between items-end mb-4 gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-charcoal mb-2">User Management</h1>
          <p className="text-xs font-semibold text-brand-silver uppercase tracking-wider">Manage accounts • roles • reporting structures</p>
        </div>
        <div className="flex gap-4">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..." 
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/[0.08] min-w-[250px] transition-all bg-white text-brand-charcoal font-medium placeholder:text-brand-silver/60"
          />
          <button 
            onClick={() => {
              setFormError('');
              setShowAddModal(true);
            }}
            className="bg-brand-red text-white font-semibold text-sm px-6 py-2 rounded-xl hover:bg-brand-red/90 transition-all duration-200 shadow-[0_4px_12px_rgba(218,41,28,0.15)] hover:translate-y-[-1px]"
          >
            + Add User
          </button>
        </div>
      </div>

      <DeveloperGuide 
        title="User Accounts Guide"
        description="Verify system access privileges, check reporting relationships, and perform user account lifecycle actions."
        steps={guideSteps}
      />

      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red mx-auto"></div>
            <p className="text-xs text-brand-silver mt-2">Loading system users...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500 font-semibold text-sm">{error}</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Name & Email</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Role</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Reporting Manager</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-brand-silver uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map(user => {
                const online = isOnline(user);
                return (
                  <tr key={user._id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-[#DA291C]/10 text-[#DA291C]">
                            {getInitials(user.name)}
                          </div>
                          {online && (
                            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" title="Online" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-brand-charcoal text-sm">{user.name}</div>
                          <div className="text-xs text-brand-silver font-normal">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${getRoleBadgeStyle(user.role)}`}>
                        {displayRole(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-brand-charcoal">
                      {user.role?.toLowerCase() === 'member' || user.role?.toLowerCase() === 'manager' ? 'Admin' :
                       user.role?.toLowerCase() === 'admin' ? 'Super Admin' : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {user.isInvite ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                          {user.inviteStatus === 'opened' ? 'Opened' : 'Pending'}
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleToggleActive(user)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                            online 
                              ? 'bg-green-50 text-green-700 border-green-100/50 hover:bg-green-100/80' 
                              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          {online ? 'Active' : 'Inactive'}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-brand-silver font-medium tracking-wide">
                      {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      {user.isInvite ? (
                        <>
                          <button 
                            onClick={() => handleResendInvite(user._id)}
                            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg text-brand-charcoal hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
                            title="Resend Invitation"
                          >
                            Resend
                          </button>
                          <button 
                            onClick={() => handleRevokeInvite(user._id)}
                            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg text-brand-red hover:bg-red-50/50 transition-all"
                            title="Revoke Invitation"
                          >
                            Revoke
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => {
                              setFormError('');
                              setEditForm({ id: user._id, name: user.name, email: user.email, role: user.role });
                              setShowEditModal(true);
                            }}
                            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg text-brand-charcoal hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleToggleActive(user)}
                            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all ${
                              user.isActive 
                                ? 'text-brand-red hover:bg-red-50/50' 
                                : 'text-green-600 hover:bg-green-50/50'
                            }`}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button 
                            onClick={() => {
                              setFormError('');
                              setResetForm({ id: user._id, name: user.name, password: '', confirmPassword: '' });
                              setShowResetModal(true);
                            }}
                            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg text-brand-silver hover:bg-gray-50 transition-all"
                          >
                            Reset Pwd
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-sm font-semibold text-brand-silver">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-brand-charcoal/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-brand-charcoal transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="font-serif text-2xl font-bold text-brand-charcoal mb-2">Add New User</h3>
            <p className="text-xs text-brand-silver mb-5">Create a user account directly on the system.</p>

            {formError && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded-xl mb-4 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-brand-silver uppercase tracking-wider mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. Balaji Nagarajan"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-brand-red/50 bg-white text-brand-charcoal"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-silver uppercase tracking-wider mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="e.g. balaji@latrics.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-brand-red/50 bg-white text-brand-charcoal"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-silver uppercase tracking-wider mb-1.5">Password</label>
                <input 
                  type="password" 
                  required
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="Create password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-brand-red/50 bg-white text-brand-charcoal"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-silver uppercase tracking-wider mb-1.5">Assign Role</label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-brand-red/50 bg-white text-brand-charcoal font-semibold cursor-pointer"
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full bg-[#DA291C] hover:bg-[#C22419] text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {formSubmitting ? 'Creating...' : 'Create User'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-brand-charcoal/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-brand-charcoal transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="font-serif text-2xl font-bold text-brand-charcoal mb-2">Edit User</h3>
            <p className="text-xs text-brand-silver mb-5">Modify account information and permissions.</p>

            {formError && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded-xl mb-4 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-brand-silver uppercase tracking-wider mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-brand-red/50 bg-white text-brand-charcoal"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-silver uppercase tracking-wider mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-brand-red/50 bg-white text-brand-charcoal"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-silver uppercase tracking-wider mb-1.5">Assign Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-brand-red/50 bg-white text-brand-charcoal font-semibold cursor-pointer"
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full bg-[#DA291C] hover:bg-[#C22419] text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {formSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-brand-charcoal/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowResetModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-brand-charcoal transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="font-serif text-2xl font-bold text-brand-charcoal mb-2">Reset Password</h3>
            <p className="text-xs text-brand-silver mb-5">Reset access credentials for <span className="font-bold text-brand-charcoal">{resetForm.name}</span></p>

            {formError && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded-xl mb-4 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-brand-silver uppercase tracking-wider mb-1.5">New Password</label>
                <input 
                  type="password" 
                  required
                  value={resetForm.password}
                  onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                  placeholder="Enter new password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-brand-red/50 bg-white text-brand-charcoal"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-silver uppercase tracking-wider mb-1.5">Confirm New Password</label>
                <input 
                  type="password" 
                  required
                  value={resetForm.confirmPassword}
                  onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-brand-red/50 bg-white text-brand-charcoal"
                />
              </div>

              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full bg-[#DA291C] hover:bg-[#C22419] text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {formSubmitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
