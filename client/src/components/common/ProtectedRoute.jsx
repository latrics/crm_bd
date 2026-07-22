import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { AlertTriangle } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user, loading, connectionError } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-brand-bg px-6">
        <div className="max-w-md w-full bg-white border border-brand-border rounded-crm p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-brand-redLight rounded-full flex items-center justify-center mx-auto mb-6 text-brand-red">
            <AlertTriangle className="w-8 h-8 text-brand-red animate-bounce" />
          </div>
          <h2 className="font-serif text-2xl font-black text-brand-text mb-3">Backend Connection Error</h2>
          <p className="text-brand-silver text-sm mb-6 leading-relaxed">
            We were unable to connect to the backend server. This usually happens if the backend server isn't running or the database connection failed (e.g. your IP address needs to be whitelisted on MongoDB Atlas).
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-brand-charcoal text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl hover:bg-brand-text transition-colors shadow-sm cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0) {
    const userRoleNorm = (user?.role || '').replace('_', '').toLowerCase();
    const allowedRolesNorm = allowedRoles.map(r => r.replace('_', '').toLowerCase());
    if (!allowedRolesNorm.includes(userRoleNorm)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}
