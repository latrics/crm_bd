import { useState } from 'react';

export default function AdminUsers() {
  const [users] = useState([
    { id: 1, name: 'Alice Smith', email: 'alice@latrics.com', role: 'Super Admin', manager: '-', isActive: true, lastLogin: '2026-06-12' },
    { id: 2, name: 'Bob Jones', email: 'bob@latrics.com', role: 'Manager', manager: 'Alice Smith', isActive: true, lastLogin: '2026-06-10' },
    { id: 3, name: 'Charlie Brown', email: 'charlie@latrics.com', role: 'Member', manager: 'Bob Jones', isActive: false, lastLogin: '2026-05-20' },
  ]);

  return (
    <div className="max-w-6xl">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-charcoal mb-2">User Management</h1>
          <p className="text-xs font-semibold text-brand-silver uppercase tracking-wider">Manage accounts • roles • reporting structures</p>
        </div>
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Search users..." 
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-red/50 focus:ring-2 focus:ring-brand-red/[0.08] min-w-[250px] transition-all bg-white text-brand-charcoal font-medium placeholder:text-brand-silver/60"
          />
          <button className="bg-brand-red text-white font-semibold text-sm px-6 py-2 rounded-xl hover:bg-brand-red/90 transition-all duration-200 shadow-[0_4px_12px_rgba(218,41,28,0.15)] hover:translate-y-[-1px]">
            + Add User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
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
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-brand-charcoal text-sm">{user.name}</div>
                  <div className="text-xs text-brand-silver font-normal">{user.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${
                    user.role === 'Super Admin' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                    user.role === 'Manager' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    'bg-gray-50 text-gray-600 border-gray-100'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-brand-charcoal">
                  {user.manager}
                </td>
                <td className="px-6 py-4">
                  <button className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors border ${
                    user.isActive 
                      ? 'bg-green-50 text-green-700 border-green-100/50 hover:bg-green-100/80' 
                      : 'bg-red-50 text-red-700 border-red-100/50 hover:bg-red-100/80'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 text-xs text-brand-silver font-medium tracking-wide">
                  {user.lastLogin}
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-brand-charcoal hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all">
                    Edit
                  </button>
                  <button className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-brand-red hover:bg-red-50/50 transition-all">
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-brand-silver hover:bg-gray-50 transition-all">
                    Reset Pwd
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


