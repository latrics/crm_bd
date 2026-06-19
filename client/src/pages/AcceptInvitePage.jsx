import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { verifyInvite, acceptInvite } from '../api/authApi.js';
import loginBg from '../assets/images/signup_login_img.jpeg';

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [errorInitial, setErrorInitial] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreed: false
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorInitial('Invalid or missing invitation token.');
      setLoadingInitial(false);
      return;
    }

    const checkToken = async () => {
      try {
        const response = await verifyInvite(token);
        if (response.success) {
          setFormData(prev => ({
            ...prev,
            email: response.data.email,
            name: response.data.name || ''
          }));
        } else {
          setErrorInitial(response.message || 'Invitation is invalid or expired.');
        }
      } catch (err) {
        setErrorInitial(err.message || 'Failed to verify invitation. It may have expired or been used.');
      } finally {
        setLoadingInitial(false);
      }
    };

    checkToken();
  }, [token]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!formData.agreed) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);
    try {
      const response = await acceptInvite(token, formData.name, formData.password);
      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message || 'Failed to setup account');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during account setup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-[#fcfcfc]">
      {/* Left Pane - Image & Text */}
      <div className="hidden lg:flex w-1/2 relative bg-gray-100 flex-col justify-center px-16 xl:px-24">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${loginBg})` }}
        >
          {/* Subtle overlay to ensure text readability */}
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center mb-16">
            <span className="font-serif text-3xl font-black text-[#DA291C] tracking-wide">LATRICS</span>
            <span className="font-sans text-sm font-bold text-gray-500 tracking-normal ml-2 mt-1">CRM</span>
          </div>

          <div className="w-12 h-0.5 bg-[#DA291C] mb-8"></div>

          <h1 className="text-5xl xl:text-6xl font-bold text-gray-900 leading-tight mb-8 font-serif tracking-tight">
            Manage.<br/>Track.<br/>Grow.
          </h1>

          <p className="text-lg text-gray-600 max-w-md font-medium leading-relaxed">
            A simple and powerful CRM built for teams that want to achieve more.
          </p>
        </div>

        <div className="absolute bottom-8 left-16 z-10 text-sm text-gray-500 font-medium">
          Secure Enterprise Access
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="max-w-md w-full bg-white p-10 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Create Your Account</h2>
            <p className="text-sm text-gray-500 mt-2 font-medium">Get started with LATRICS CRM</p>
          </div>

          {loadingInitial ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#DA291C]"></div>
              <p className="text-sm text-gray-500 font-medium">Verifying invitation token...</p>
            </div>
          ) : errorInitial && !success ? (
            <div className="text-center py-6 space-y-6">
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-semibold">
                {errorInitial}
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full inline-flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-[#DA291C] hover:bg-[#C22419] transition-all shadow-sm"
              >
                Go to Login
              </button>
            </div>
          ) : success ? (
            <div className="text-center py-6 space-y-6">
              <div className="bg-green-50 border border-green-100 text-green-700 p-4 rounded-xl text-sm font-semibold">
                Account set up successfully! Your password has been configured.
              </div>
              <p className="text-xs text-gray-500 font-medium">You can now sign in with your email address and new password.</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full inline-flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-[#DA291C] hover:bg-[#C22419] transition-all shadow-sm"
              >
                Log In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1.5 ml-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#DA291C]/20 focus:border-[#DA291C] outline-none transition-all placeholder-gray-400 font-medium"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1.5 ml-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      name="email"
                      disabled
                      value={formData.email}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 text-gray-500 rounded-xl text-sm outline-none font-medium cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>



              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#DA291C]/20 focus:border-[#DA291C] outline-none transition-all placeholder-gray-400 font-medium"
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1.5 ml-1">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#DA291C]/20 focus:border-[#DA291C] outline-none transition-all placeholder-gray-400 font-medium"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {showConfirmPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center mt-2">
                <input
                  id="agreed"
                  name="agreed"
                  type="checkbox"
                  checked={formData.agreed}
                  onChange={handleChange}
                  className="h-3.5 w-3.5 text-[#DA291C] focus:ring-[#DA291C] border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="agreed" className="ml-2 block text-xs text-gray-600 font-medium">
                  I agree to the <span className="text-[#DA291C] hover:underline cursor-pointer">Terms of Service</span> and <span className="text-[#DA291C] hover:underline cursor-pointer">Privacy Policy</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#DA291C] hover:bg-[#C22419] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DA291C] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
              
              <div className="mt-8 text-center text-xs font-medium text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-[#DA291C] font-bold hover:underline transition-all">
                  Log In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
