import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Monitor } from 'lucide-react';
import { AuthProvider } from './context/AuthContext.jsx';
import { CRMProvider } from './context/CRMContext.jsx';
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx';
import Navbar from './components/layout/Navbar.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import LeadsPage from './pages/LeadsPage.jsx';
import DealsPage from './pages/DealsPage.jsx';
import TenderPage from './pages/TenderPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import UnauthorizedPage from './pages/UnauthorizedPage.jsx';
import UserManagement from './pages/UserManagement.jsx';
import AuditLogs from './pages/AuditLogs.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import Toast from './components/common/Toast.jsx';
import ProfileSettings from './pages/ProfileSettings.jsx';
import Notifications from './components/layout/Notifications.jsx';
import BugCenterPage from './pages/BugCenterPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import SettingsLayout from './components/layout/SettingsLayout.jsx';
import AccountPage from './pages/AccountPage.jsx';
import AppearanceSettings from './pages/AppearanceSettings.jsx';
import HelpCenterPage from './pages/HelpCenterPage.jsx';

import AdminLayout from './components/layout/AdminLayout.jsx';
import AdminOverview from './pages/admin/AdminOverview.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminApprovals from './pages/admin/AdminApprovals.jsx';
import AdminAuditLogs from './pages/admin/AdminAuditLogs.jsx';
import AdminMasterData from './pages/admin/AdminMasterData.jsx';
import AdminOwnership from './pages/admin/AdminOwnership.jsx';
import AdminRoles from './pages/admin/AdminRoles.jsx';
import AcceptInvitePage from './pages/AcceptInvitePage.jsx';
import SyncAuthPage from './pages/SyncAuthPage.jsx';

function AppLayout() {
  const { settings } = useTheme();

  // Dynamic padding regulated globally from ThemeContext (Enforcing spacious 64px = px-6 sm:px-12 lg:px-16 default)
  const paddingClass = settings.paddingX === '32px'
    ? 'px-4 sm:px-8'
    : settings.paddingX === '48px'
    ? 'px-6 sm:px-12'
    : settings.paddingX === '80px'
    ? 'px-8 sm:px-20'
    : 'px-6 sm:px-12 lg:px-16'; // Standard 64px (px-16) default for generous visible side margin

  return (
    <>
      <Navbar />
      <div className={`w-full ${paddingClass} pt-[88px] pb-6 transition-all duration-150`}>
        <Outlet />
      </div>
      <Notifications />
    </>
  );
}

function ResponsiveBlocker() {
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      // Typically desktop/laptop starts at 1024px
      setIsMobileOrTablet(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isMobileOrTablet) return null;

  return (
    <div className="fixed inset-0 bg-[#07090e] text-white z-[999999] flex flex-col items-center justify-center p-6 text-center select-none font-sans overflow-hidden">
      {/* Ambient Gradient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(218,41,28,0.06)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[radial-gradient(circle,rgba(124,58,237,0.04)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-sm w-full bg-[#0d111a]/40 border border-white/[0.06] rounded-2xl p-8 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.8)] relative z-10 flex flex-col items-center gap-6">
        
        {/* Sleek Minimal Icon Container */}
        <div className="w-12 h-12 rounded-full border border-white/[0.08] bg-white/[0.02] flex items-center justify-center text-slate-300 shadow-[0_0_15px_rgba(255,255,255,0.02)]">
          <Monitor className="w-5 h-5 text-slate-300 stroke-[1.5]" />
        </div>
        
        {/* Sleek Minimal Text */}
        <div className="space-y-1.5">
          <h2 className="text-xs font-bold tracking-[0.25em] text-white uppercase">
            Desktop Recommended
          </h2>
          <p className="text-[10px] text-brand-red font-semibold tracking-[0.15em] uppercase">
            Latrics CRM
          </p>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed font-normal px-2">
          This system is optimized for high-density desktop displays. Please sign in on a laptop or desktop computer for the full workspace experience.
        </p>

        {/* Divider */}
        <div className="w-12 h-[1px] bg-white/[0.08]" />

        {/* Sleek Resolution Indicator */}
        <div className="text-[9px] text-slate-500 font-medium tracking-wider uppercase">
          Min Width: 1024px
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <CRMProvider>
            <div className="min-h-screen bg-brand-bg font-sans text-brand-text">
              <Routes>
                <Route path="/login/*" element={<LoginPage />} />
                <Route path="/accept-invite/*" element={<AcceptInvitePage />} />
                <Route path="/sync-auth" element={<SyncAuthPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="overview" replace />} />
                  <Route path="overview" element={<AdminOverview />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="approvals" element={<AdminApprovals />} />
                  <Route path="audit-logs" element={<AdminAuditLogs />} />
                  <Route path="master-data" element={<AdminMasterData />} />
                  <Route path="ownership" element={<AdminOwnership />} />
                  <Route path="roles" element={<AdminRoles />} />
                  <Route path="*" element={<Navigate to="overview" replace />} />
                </Route>

                {/* Layout route wrapping all main application pages */}
                <Route 
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  } 
                >
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/leads" element={<LeadsPage />} />
                  <Route path="/deals" element={<DealsPage />} />
                  <Route path="/tenders" element={<TenderPage />} />
                  <Route path="/notifications" element={<SettingsLayout><NotificationsPage /></SettingsLayout>} />
                  
                  {/* Top-Level User Account & Settings Routes */}
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/profile" element={<SettingsLayout><ProfileSettings /></SettingsLayout>} />
                  <Route path="/settings" element={<AccountPage />} />
                  <Route path="/appearance" element={<SettingsLayout><AppearanceSettings /></SettingsLayout>} />
                  <Route path="/security" element={<SettingsLayout><ProfileSettings /></SettingsLayout>} />
                  <Route path="/bug-center" element={<SettingsLayout><BugCenterPage /></SettingsLayout>} />
                  <Route path="/help-center" element={<SettingsLayout><HelpCenterPage /></SettingsLayout>} />

                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
              </Routes>
              <Toast />
              <ResponsiveBlocker />
            </div>
          </CRMProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
