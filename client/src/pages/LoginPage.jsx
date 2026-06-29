import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { SignIn } from '@clerk/react';
import loginBg from '../assets/images/signup_login_img.jpeg';

export default function LoginPage() {
  const { isAuthenticated, user, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Clear previous errors when visiting the login page
  useEffect(() => {
    if (clearError) {
      clearError();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from?.pathname;
      if (from && from !== '/' && from !== '/login') {
        navigate(from, { replace: true });
      } else {
        const isAdmin = ['superadmin', 'admin'].includes(user.role?.toLowerCase());
        navigate(isAdmin ? '/admin/overview' : '/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location]);

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
            Manage.<br />Track.<br />Grow.
          </h1>

          <p className="text-lg text-gray-600 max-w-md font-medium leading-relaxed">
            A simple and powerful CRM built for teams that want to achieve more.
          </p>
        </div>

        <div className="absolute bottom-8 left-16 z-10 text-sm text-gray-500 font-medium">
          Secure Enterprise Access
        </div>
      </div>

      {/* Right Pane - Clerk SignIn */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12">
        {location.state?.message && (
          <div className="max-w-md w-full mb-4 bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-sm font-semibold text-center">
            ✅ {location.state.message}
          </div>
        )}
        {error && (
          <div className="max-w-md w-full mb-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-semibold text-center">
            ⚠️ {error}
          </div>
        )}
        <SignIn routing="path" path="/login" fallbackRedirectUrl="/dashboard" signUpUrl="/accept-invite" />
      </div>
    </div>
  );
}
