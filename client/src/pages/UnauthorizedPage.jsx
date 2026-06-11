import React from 'react';
import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-brand-bg px-4 text-center">
      <div className="bg-white p-12 rounded-3xl shadow-xl border border-brand-border max-w-lg">
        <div className="w-20 h-20 bg-red-50 text-brand-red rounded-full flex items-center justify-center text-4xl mb-6 mx-auto">
          ⚠️
        </div>
        <h1 className="text-3xl font-serif font-black text-brand-text mb-4 uppercase tracking-tight">Access Restricted</h1>
        <p className="text-brand-silver font-bold text-sm mb-8">
          You do not have the required permissions to view this page. If you believe this is an error, please contact your System Administrator.
        </p>
        <Link 
          to="/dashboard" 
          className="inline-block bg-brand-charcoal text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-md active:scale-95"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
