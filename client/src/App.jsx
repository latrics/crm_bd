import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
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
import ReportBugWidget from './components/common/ReportBugWidget.jsx';

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
      <div className={`w-full ${paddingClass} py-6 transition-all duration-150`}>
        <Outlet />
      </div>
      <Notifications />
    </>
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
                  <Route path="/notifications" element={<NotificationsPage />} />
                  
                  {/* Top-Level User Account & Settings Routes */}
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/profile" element={<SettingsLayout><ProfileSettings /></SettingsLayout>} />
                  <Route path="/settings" element={<AccountPage />} />
                  <Route path="/appearance" element={<SettingsLayout><AppearanceSettings /></SettingsLayout>} />
                  <Route path="/security" element={<SettingsLayout><ProfileSettings /></SettingsLayout>} />
                  <Route path="/bug-center" element={<SettingsLayout><BugCenterPage /></SettingsLayout>} />

                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
              </Routes>
              <Toast />
              <ReportBugWidget />
            </div>
          </CRMProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
