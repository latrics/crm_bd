import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { id: 'overview', label: 'Overview', path: '/admin/overview', icon: '📊' },
  { id: 'users', label: 'User Management', path: '/admin/users', icon: '👥' },
  { id: 'approvals', label: 'Approval Center', path: '/admin/approvals', icon: '✅' },
  { id: 'audit', label: 'Audit Logs', path: '/admin/audit-logs', icon: '📝' },
  { id: 'master', label: 'Master Data Config', path: '/admin/master-data', icon: '⚙️' },
  { id: 'ownership', label: 'Ownership & Reassign', path: '/admin/ownership', icon: '🔄' },
  { id: 'roles', label: 'Roles & Permissions', path: '/admin/roles', icon: '🛡️' },
];

export default function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-gray-100 h-[calc(100vh-64px)] fixed top-16 left-0 overflow-y-auto">
      <div className="py-5 flex flex-col gap-1 px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (location.pathname === '/admin' && item.path === '/admin/overview');
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={`relative flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 group
                ${isActive 
                  ? 'bg-brand-red/[0.04] text-brand-red font-semibold' 
                  : 'text-brand-charcoal/80 hover:text-brand-charcoal hover:bg-gray-50 font-medium'
                }`}
            >
              <span className={`text-base transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-75'}`}>
                {item.icon}
              </span>
              <span className="tracking-wide">{item.label}</span>
              {isActive && (
                <span className="absolute left-0 top-[25%] bottom-[25%] w-[3px] bg-brand-red rounded-r" />
              )}
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
}

