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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-grid-pattern font-sans relative overflow-hidden">

      {/* Absolute Background Image for Left Side */}
      <div className="hidden lg:block absolute top-0 left-0 w-1/2 h-full z-0 select-none">
        <div
          //className="absolute inset-0 bg-container bg-[left_-380px] transition-transform duration-10000 hover:scale-105"
          className="absolute inset-0 bg-cover bg-[center_85%] transition-transform duration-10000"
          style={{ backgroundImage: `url(${loginBg})` }}
        />
        {/* Gradient mask to fade into the grid background */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#fdfdfd]/40 to-[#fdfdfd]" />
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[0.5px]" />
      </div>

      {/* Left Content */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between px-12 xl:px-20 py-8 xl:py-2 text-[#54585A] min-h-screen">
        {/* Top Logo */}
        <div className="flex items-center -ml-6">
          <img src={latricsLogo} alt="Latrics Logo" className="h-[140px] object-contain" />
        </div>

        {/* Call to action messaging */}
        <div className="max-w-xl mt-2 mb-auto">
          <h1 className="text-3xl xl:text-[28px] font-semibold leading-[1.25] text-slate-800 tracking-tight mb-3 max-w-[800px] font-sans">
            The smarter way to organize work and drive results -
          </h1>
          <div className="h-[52px] overflow-hidden mt-6 mb-6">
            <div
              className="transition-transform duration-500 ease-in-out"
              style={{ transform: `translateY(-${wordIndex * 52}px)` }}
            >
              {['Manage.', 'Track.', 'Grow.'].map((word, idx) => (
                <h2
                  key={idx}
                  className="text-4xl xl:text-[42px] font-black text-brand-red tracking-tight font-sans h-[52px] flex items-center leading-none"
                >
                  {word}
                </h2>
              ))}
            </div>
          </div>
          <p className="text-xl xl:text-base font-medium text-slate-500 leading-relaxed font-sans max-w-[460px]">
            A simple and powerful CRM built for teams that want to achieve more.
          </p>
        </div>

        {/* Bottom corporate trademark */}
        <div className="text-[11px] font-medium text-slate-800 tracking-wider">
          ©2026 Latrics CRM. All Rights Reserved.
        </div>
      </div>

      {/* Right side: Modern Clerk Login Component container */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10 min-h-screen">
        {location.state?.message && (
          <div className="max-w-md w-full mb-6 bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" /> {location.state.message}
          </div>
        )}
        {error && (
          <div className="max-w-md w-full mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
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
                card: 'border border-slate-200/80 shadow-[0_10px_40px_rgba(0,0,0,0.04)] rounded-2xl bg-white p-6 md:p-8',
                formButtonPrimary: 'bg-[#2c303b] hover:bg-[#1f222a] text-white text-sm font-medium py-2.5 rounded-lg w-full transition-colors',
                footerActionLink: 'text-brand-red hover:text-red-700 font-bold transition-colors ml-1',
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}


