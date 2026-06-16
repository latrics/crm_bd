import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { CRMProvider } from './context/CRMContext.jsx';
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

import AdminLayout from './components/layout/AdminLayout.jsx';
import AdminOverview from './pages/admin/AdminOverview.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminApprovals from './pages/admin/AdminApprovals.jsx';
import AdminAuditLogs from './pages/admin/AdminAuditLogs.jsx';
import AdminMasterData from './pages/admin/AdminMasterData.jsx';
import AdminOwnership from './pages/admin/AdminOwnership.jsx';
import AdminRoles from './pages/admin/AdminRoles.jsx';
import AcceptInvitePage from './pages/AcceptInvitePage.jsx';

function AppLayout() {
  return (
    <CRMProvider>
      <Navbar />
      <div className="max-w-[1250px] mx-auto px-6 py-7">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/deals" element={<DealsPage />} />
          <Route path="/tenders" element={<TenderPage />} />
          <Route path="/profile" element={<ProfileSettings />} />
        </Routes>
      </div>
    </CRMProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-brand-bg font-sans text-brand-text">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/accept-invite" element={<AcceptInvitePage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin', 'superadmin', 'SUPERADMIN']}>
                  <AdminLayout />
                </ProtectedRoute>
              } 
            >
              <Route path="overview" element={<AdminOverview />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="approvals" element={<AdminApprovals />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
              <Route path="master-data" element={<AdminMasterData />} />
              <Route path="ownership" element={<AdminOwnership />} />
              <Route path="roles" element={<AdminRoles />} />
              <Route path="*" element={<Navigate to="overview" replace />} />
            </Route>

            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              } 
            />
          </Routes>
          <Toast />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
