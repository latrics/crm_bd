import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance.js';
import PageHeader from '../components/layout/PageHeader.jsx';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
      setLoading(false);
    }
  };

  const toggleStatus = async (user) => {
    try {
      await api.put(`/admin/users/${user._id}`, { isActive: !user.isActive });
      fetchUsers();
    } catch (err) {
      alert('Error updating status');
    }
  };

  if (loading) return <div className="p-12 text-center text-brand-silver font-bold">Loading system users...</div>;

  return (
    <div className="pb-12">
      <PageHeader title="User Management" subtitle="Manage CRM access and role hierarchy" />
      
      {error && (
        <div className="bg-red-50 text-brand-red p-4 rounded-xl font-bold text-xs mb-6 border border-brand-red/10">
          {error}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-surfaceAlt/50 border-b border-brand-border">
                <th className="px-6 py-5 text-[10px] font-black text-brand-silver uppercase tracking-widest">Name & Email</th>
                <th className="px-6 py-5 text-[10px] font-black text-brand-silver uppercase tracking-widest">Role</th>
                <th className="px-6 py-5 text-[10px] font-black text-brand-silver uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-brand-silver uppercase tracking-widest">Last Login</th>
                <th className="px-6 py-5 text-[10px] font-black text-brand-silver uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {users.map(user => (
                <tr key={user._id} className="hover:bg-brand-surfaceAlt/20 transition-colors">
                  <td className="px-6 py-5">
                    <div className="font-bold text-brand-text text-sm">{user.name}</div>
                    <div className="text-xs text-brand-silver font-medium">{user.email}</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tight ${
                      user.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                      user.role === 'manager' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-brand-green' : 'bg-brand-red'}`}></div>
                      <span className="text-xs font-bold text-brand-text">{user.isActive ? 'Active' : 'Suspended'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-xs text-brand-silver font-bold uppercase tracking-tighter">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => toggleStatus(user)}
                      className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${
                        user.isActive ? 'text-brand-red hover:bg-red-50' : 'text-brand-green hover:bg-green-50'
                      }`}
                    >
                      {user.isActive ? 'Suspend' : 'Activate'}
                    </button>
                    <button className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg text-brand-silver hover:bg-brand-surfaceAlt ml-2">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
