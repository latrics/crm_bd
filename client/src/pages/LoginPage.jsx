import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-brand-bg px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-brand-border">
        <div>
          <div className="font-serif text-3xl font-black text-brand-red tracking-wide text-center mb-2">
            LATRICS <span className="font-sans text-sm font-bold text-brand-silver tracking-normal">CRM</span>
          </div>
          <h2 className="mt-6 text-center text-2xl font-serif font-black text-brand-text uppercase tracking-tight">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-brand-silver font-bold">
            Secure Enterprise CRM Portal
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-l-4 border-brand-red p-4 text-brand-red text-xs font-bold rounded">
              {error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-[10px] font-black text-brand-silver uppercase tracking-widest mb-1.5 ml-1">
                Email Address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-brand-border placeholder-brand-silver text-brand-text rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red sm:text-sm font-bold transition-all bg-brand-surfaceAlt/30"
                placeholder="admin@latrics.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-[10px] font-black text-brand-silver uppercase tracking-widest mb-1.5 ml-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-brand-border placeholder-brand-silver text-brand-text rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red sm:text-sm font-bold transition-all bg-brand-surfaceAlt/30"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-xs font-black uppercase tracking-widest rounded-xl text-white bg-brand-red hover:bg-brand-red/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Sign In'}
            </button>
          </div>
        </form>
        
        <div className="text-center">
          <p className="text-[9px] text-brand-silver font-bold uppercase tracking-tighter">
            Managed by Latrics India Private Limited • Internal Access Only
          </p>
        </div>
      </div>
    </div>
  );
}
