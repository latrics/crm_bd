import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { SignIn } from '@clerk/react';
import loginBg from '../assets/images/signup_login_img.jpeg';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const { isAuthenticated, user, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Clear previous errors when visiting the login page
  useEffect(() => {
    if (clearError) {
      clearError();
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left side: Artwork/Branding Panel (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-charcoal relative text-white flex-col justify-between p-12 overflow-hidden select-none">
        {/* Background Image Overlay with subtle opacity */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-10000 hover:scale-105" 
          style={{ backgroundImage: `url(${loginBg})`, opacity: 0.15 }}
        />
        
        {/* Top brand signature */}
        <div className="z-10 font-serif text-2xl font-black tracking-wide">
          LATRICS <span className="font-sans text-[10px] font-bold text-brand-silver tracking-normal ml-2">CRM SYSTEM</span>
        </div>

        {/* Dynamic call to action messaging */}
        <div className="z-10 max-w-md mt-auto">
          <h2 className="text-3xl font-serif font-black mb-4 uppercase tracking-tight leading-tight">Empowering Sales & Operations</h2>
          <p className="text-sm font-medium text-brand-silver leading-relaxed">
            Access secure CRM tools for managing pipelines, bulk lead reassignment, automated checklists, roles, and administrative data configuration.
          </p>
        </div>

        {/* Bottom corporate trademark */}
        <div className="z-10 text-[9px] font-bold text-brand-silver uppercase tracking-widest mt-12">
          © {new Date().getFullYear()} Latrics India Private Limited • All rights reserved
        </div>
      </div>

      {/* Right side: Modern Clerk Login Component */}
      <div className="w-full lg:w-1/2 bg-brand-bg flex flex-col items-center justify-center p-8 relative">
        {location.state?.message && (
          <div className="max-w-md w-full mb-4 bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {location.state.message}
          </div>
        )}
        {error && (
          <div className="max-w-md w-full mb-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        <SignIn routing="path" path="/login" fallbackRedirectUrl="/dashboard" signUpUrl="/accept-invite" />
      </div>
    </div>
  );
}
