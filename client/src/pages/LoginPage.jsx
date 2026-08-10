import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { SignIn } from '@clerk/react';
import loginBg from '../assets/images/signup_login_img.jpeg';
import latricsLogo from '../assets/images/logo 1.svg';
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

  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100/60 p-4 md:p-8 font-sans relative">
      {/* Outer Card container */}
      <div className="bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-200/80 flex flex-col lg:flex-row w-full max-w-4xl overflow-hidden p-3 md:p-4 min-h-[580px] relative z-10">
        
        {/* Left side: Artwork/Branding Panel */}
        <div className="hidden lg:flex lg:w-1/2 relative rounded-[18px] border border-slate-200/50 overflow-hidden select-none flex-col justify-between p-8 text-[#54585A]">
          {/* Background Image */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-left transition-transform duration-10000 hover:scale-105" 
            style={{ backgroundImage: `url(${loginBg})` }}
          />
          {/* Gradient mask to fade into the white background */}
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/40 to-white" />
          <div className="absolute inset-0 z-0 bg-white/10 backdrop-blur-[0.5px]" />
          
          {/* Top Logo */}
          <div className="z-10 flex items-center">
            <img src={latricsLogo} alt="Latrics Logo" className="h-10 object-contain" />
          </div>

          {/* Call to action messaging */}
          <div className="z-10 max-w-xs mt-auto mb-8">
            <h3 className="text-lg font-extrabold leading-snug mb-2 text-slate-800 font-sans">
              The smarter way to organize work and drive results -
            </h3>
            <div className="h-[44px] overflow-hidden mb-3">
              <div 
                className="transition-transform duration-500 ease-in-out"
                style={{ transform: `translateY(-${wordIndex * 44}px)` }}
              >
                {['Manage.', 'Track.', 'Grow.'].map((word, idx) => (
                  <h2 
                    key={idx} 
                    className="text-4xl font-black text-brand-red tracking-tight font-sans h-[44px] flex items-center leading-none"
                  >
                    {word}
                  </h2>
                ))}
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-600 leading-relaxed font-sans">
              A simple and powerful CRM built for teams that want to achieve more.
            </p>
          </div>

          {/* Bottom corporate trademark */}
          <div className="z-10 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            ©2026 Latrics CRM. All Rights Reserved.
          </div>
        </div>

        {/* Right side: Grid pattern container holding Clerk Login Component */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 md:p-6 relative bg-grid-pattern rounded-[18px] lg:ml-2 border border-slate-100">
          {location.state?.message && (
            <div className="max-w-md w-full mb-4 bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {location.state.message}
            </div>
          )}
          {error && (
            <div className="max-w-md w-full mb-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm">
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
                  colorPrimary: '#2c303b', 
                  colorText: '#2D3139',
                  colorTextSecondary: '#54585A',
                  borderRadius: '12px',
                  fontFamily: '"Montserrat", sans-serif',
                },
                elements: {
                  card: 'border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl bg-white p-6 md:p-8',
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


