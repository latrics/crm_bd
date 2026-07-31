import { Outlet } from 'react-router-dom';
import AdminSidebar from '../admin/AdminSidebar.jsx';
import Navbar from './Navbar.jsx';
import Notifications from './Notifications.jsx';

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#F5F4F0] font-sans text-brand-text flex flex-col">
      <Navbar />

      {/* Main Content Area */}
      <div className="flex pt-16 h-screen">
        <AdminSidebar />
        <main className="flex-1 ml-64 overflow-y-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
      <Notifications />
    </div>
  );
}
