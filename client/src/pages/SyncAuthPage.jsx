import React, { useEffect, useState, useRef } from 'react';
import { useUser } from '@clerk/react';
import { useNavigate } from 'react-router-dom';
import { syncUser as syncUserApi } from '../api/authApi.js';

export default function SyncAuthPage() {
  const { isLoaded, user } = useUser();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const syncAttempted = useRef(false);

  useEffect(() => {
    if (isLoaded && user && !syncAttempted.current) {
      syncAttempted.current = true;
      syncUser();
    }
  }, [isLoaded, user]);

  const syncUser = async () => {
    try {
      const email = user.primaryEmailAddress?.emailAddress;
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      
      const data = await syncUserApi(user.id, email, name);

      if (data.success) {
        // Redirect to dashboard on success
        navigate('/dashboard');
      } else {
        setError(data.message || 'Failed to sync user');
      }
    } catch (err) {
      console.error('Sync Error:', err);
      setError(err.message || 'An error occurred while syncing your account.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        {!error ? (
          <>
            <div className="w-16 h-16 border-4 border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Finalizing Setup...</h2>
            <p className="text-slate-500 mt-2">Please wait while we synchronize your account.</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-4">Sync Failed</h2>
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg mb-6 text-left whitespace-pre-wrap">
              {error}
            </div>
            <button
              onClick={() => {
                setError(null);
                syncAttempted.current = false;
              }}
              className="w-full bg-slate-900 text-white font-medium py-2.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
