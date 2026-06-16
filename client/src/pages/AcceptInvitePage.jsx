import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyInvite, acceptInvite } from '../api/authApi.js';

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing invitation token.');
      setLoading(false);
      return;
    }

    const checkToken = async () => {
      try {
        const response = await verifyInvite(token);
        if (response.success) {
          setEmail(response.data.email);
          setRole(response.data.role);
        } else {
          setError(response.message || 'Invitation is invalid or expired.');
        }
      } catch (err) {
        setError(err.message || 'Failed to verify invitation. It may have expired or been used.');
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const response = await acceptInvite(token, name, password);
      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message || 'Failed to set password');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during account setup.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-[#1A1A1A] via-[#111111] to-[#251010] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#DA291C]/10 border border-[#DA291C]/20 text-[#DA291C] mb-4 text-3xl">
            🔑
          </div>
          <h2 className="font-serif text-3xl font-bold text-white tracking-tight">
            Latrics CRM
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Account Setup & Password Activation
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#DA291C]"></div>
            <p className="text-sm text-gray-400">Verifying invitation token...</p>
          </div>
        ) : error && !success ? (
          <div className="text-center py-6 space-y-6">
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl text-sm">
              {error}
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full inline-flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-[#DA291C] hover:bg-[#C22419] transition-all shadow-[0_4px_12px_rgba(218,41,28,0.2)]"
            >
              Go to Login
            </button>
          </div>
        ) : success ? (
          <div className="text-center py-6 space-y-6">
            <div className="bg-green-500/10 border border-green-500/20 text-green-200 p-4 rounded-xl text-sm">
              Account set up successfully! Your password has been configured.
            </div>
            <p className="text-xs text-gray-400">You can now sign in with your email address and new password.</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full inline-flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-[#DA291C] hover:bg-[#C22419] transition-all shadow-[0_4px_12px_rgba(218,41,28,0.2)]"
            >
              Log In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Address (ReadOnly) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 cursor-not-allowed outline-none"
              />
            </div>

            {/* Role (ReadOnly badge) */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Assigned Role:</span>
              <span className="bg-[#DA291C]/15 text-[#FF5A4E] border border-[#DA291C]/25 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {role}
              </span>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] transition-all"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#DA291C] focus:ring-1 focus:ring-[#DA291C] transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 inline-flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-[#DA291C] hover:bg-[#C22419] focus:outline-none disabled:bg-gray-700 disabled:cursor-not-allowed transition-all shadow-[0_4px_12px_rgba(218,41,28,0.2)]"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Setting Password...
                </>
              ) : (
                'Activate Account'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
