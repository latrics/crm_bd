import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from '../admin/AdminSidebar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import UserMenu from './UserMenu.jsx';

export default function AdminLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F4F0] font-sans text-brand-text flex flex-col">
      {/* Top bar */}
      <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 fixed top-0 w-full z-10 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <span className="text-xl font-serif font-bold tracking-tight text-brand-red">LATRICS</span>
            <span className="text-[10px] font-bold tracking-widest text-brand-silver">CRM</span>
          </div>
          
          <div className="h-6 w-px bg-gray-100"></div>
          
          {/* Breadcrumb */}
          <div className="text-xs font-medium text-brand-silver flex items-center gap-2">
            <span className="hover:text-brand-text cursor-pointer transition-colors" onClick={() => navigate('/dashboard')}>CRM</span>
            <span>/</span>
            <span className="text-brand-text font-semibold">Admin Dashboard</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-xs font-medium text-brand-charcoal hover:text-brand-red transition-colors"
          >
            Back to CRM
          </button>
          <UserMenu />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex pt-16 h-screen">
        <AdminSidebar />
        <main className="flex-1 ml-64 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
