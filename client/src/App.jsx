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
          
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <UserManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/audit-logs" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AuditLogs />
              </ProtectedRoute>
            } 
          />
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
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            
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
