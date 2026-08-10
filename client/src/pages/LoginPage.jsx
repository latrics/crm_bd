import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { SignIn } from '@clerk/react';
import loginBg from '../assets/images/signup_login_img.jpeg';
import latricsLogo from '../assets/images/latrics_grey_red_logo.svg';
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
    <div className="min-h-screen w-full flex items-center justify-center bg-grid-pattern p-4 md:p-8 font-sans relative">
      {/* Outer Card container */}
      <div className="bg-[#F8F9FA] rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-200/80 flex flex-col lg:flex-row w-full max-w-4xl overflow-hidden p-4 min-h-[580px] relative z-10">
        
        {/* Left side: Artwork/Branding Panel (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 relative rounded-[18px] border border-slate-200/50 overflow-hidden select-none flex-col justify-between p-8 text-[#54585A]">
          {/* Background Image */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-10000 hover:scale-105" 
            style={{ backgroundImage: `url(${loginBg})` }}
          />
          {/* Subtle overlay for warmth and text safety */}
          <div className="absolute inset-0 z-0 bg-white/20 backdrop-blur-[0.5px]" />
          
          {/* Top Logo */}
          <div className="z-10 flex items-center">
            <img src={latricsLogo} alt="Latrics Logo" className="h-9 object-contain" />
          </div>

          {/* Call to action messaging */}
          <div className="z-10 max-w-xs mt-auto mb-10">
            <h3 className="text-lg font-extrabold leading-snug mb-2 text-slate-800 font-sans">
              The smarter way to organize work and drive results -
            </h3>
            <h2 className="text-4xl font-black mb-3 text-brand-red tracking-tight font-sans">
              Manage.
            </h2>
            <p className="text-xs font-semibold text-slate-600 leading-relaxed font-sans">
              A simple and powerful CRM built for teams that want to achieve more.
            </p>
          </div>

          {/* Bottom corporate trademark */}
          <div className="z-10 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            ©2026 Latrics CRM. All Rights Reserved.
          </div>
        </div>

        {/* Right side: Modern Clerk Login Component container */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 md:p-6 relative">
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
          
          <div className="w-full flex justify-center">
            <SignIn 
              routing="path" 
              path="/login" 
              fallbackRedirectUrl="/dashboard" 
              signUpUrl="/accept-invite"
              appearance={{
                variables: {
                  colorPrimary: '#2c303b', // Muted/charcoal button
                  colorText: '#2D3139',
                  colorTextSecondary: '#54585A',
                  borderRadius: '12px',
                  fontFamily: '"Montserrat", sans-serif',
                },
                elements: {
                  card: 'border border-slate-200/80 shadow-md rounded-xl bg-white p-6 md:p-8',
                  formButtonPrimary: 'bg-[#2c303b] hover:bg-[#1f222a] text-white text-sm font-medium py-2.5 rounded-lg w-full transition-colors',
                  footerActionLink: 'text-brand-red hover:text-red-700 font-bold transition-colors ml-1',
                }
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}


