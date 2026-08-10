import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CheckSquare, FileText, Settings, RefreshCw, Shield } from 'lucide-react';

const navItems = [
  { id: 'overview', label: 'Overview', path: '/admin/overview', icon: LayoutDashboard },
  { id: 'users', label: 'User Management', path: '/admin/users', icon: Users },
  { id: 'approvals', label: 'Approval Center', path: '/admin/approvals', icon: CheckSquare },
  { id: 'audit', label: 'Audit Logs', path: '/admin/audit-logs', icon: FileText },
  // { id: 'master', label: 'Master Data Config', path: '/admin/master-data', icon: Settings },
  // { id: 'ownership', label: 'Ownership & Reassign', path: '/admin/ownership', icon: RefreshCw },
  { id: 'roles', label: 'Roles & Permissions', path: '/admin/roles', icon: Shield },
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
              <span className={`transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-75'}`}>
                <item.icon className="w-4.5 h-4.5 shrink-0" />
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

