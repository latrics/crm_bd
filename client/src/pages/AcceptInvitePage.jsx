import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { SignUp, useAuth as useClerkAuth, useClerk } from '@clerk/react';
import { verifyInvite } from '../api/authApi.js';
import { useAuth as useAppAuth } from '../context/AuthContext.jsx';
import loginBg from '../assets/images/signup_login_img.jpeg';
import latricsLogo from '../assets/images/logo 1.svg';

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get('token');
  const { userId } = useClerkAuth();
  const { signOut } = useClerk();
  const { isAuthenticated } = useAppAuth();
  const navigate = useNavigate();
  
  // Clerk changes the URL during signup (e.g., /accept-invite/verify). 
  // This drops query params. We must persist the token so the page doesn't crash.
  const [token, setToken] = useState(urlToken || sessionStorage.getItem('inviteToken'));

  useEffect(() => {
    if (urlToken) {
      sessionStorage.setItem('inviteToken', urlToken);
      setToken(urlToken);
    }
  }, [urlToken]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');

  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Handle redirect if user signed up/in on Clerk but is not yet synced in the app
  useEffect(() => {
    if (userId && !isAuthenticated) {
      navigate('/sync-auth', { replace: true });
    }
  }, [userId, isAuthenticated, navigate]);

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError('No invitation token provided.');
        setIsLoading(false);
        return;
      }

      try {
        const res = await verifyInvite(token);
        if (res.success && res.data?.email) {
          setInviteEmail(res.data.email);
        } else {
          setError('Failed to extract email from invitation.');
        }
      } catch (err) {
        setError(err.message || 'Invalid or expired invitation link.');
      } finally {
        setIsLoading(false);
      }
    }

    validateToken();
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfcfc] p-4">
        <div className="max-w-md w-full bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center shadow-sm">
          <h2 className="text-lg font-bold mb-2">Invitation Error</h2>
          <p className="text-sm font-medium">{error}</p>
          <a href="/login" className="mt-6 inline-block text-brand-red font-bold hover:underline">
            Return to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-grid-pattern font-sans relative overflow-hidden">
      
      {/* Absolute Background Image for Left Side */}
      <div className="hidden lg:block absolute top-0 left-0 w-1/2 h-full z-0 select-none">
        <div 
          className="absolute inset-0 bg-cover bg-left transition-transform duration-10000 hover:scale-105" 
          style={{ backgroundImage: `url(${loginBg})` }}
        />
        {/* Gradient mask to fade into the grid background */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#fdfdfd]/40 to-[#fdfdfd]" />
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[0.5px]" />
      </div>

      {/* Left Content */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-12 xl:p-20 text-[#54585A]">
        {/* Top Logo */}
        <div className="flex items-center -ml-2">
          <img src={latricsLogo} alt="Latrics Logo" className="h-14 object-contain" />
        </div>

        {/* Call to action messaging */}
        <div className="max-w-md mt-16 mb-auto">
          <h3 className="text-2xl font-extrabold leading-snug mb-4 text-slate-800 font-sans">
            The smarter way to organize work and drive results -
          </h3>
          <div className="h-[56px] overflow-hidden mb-6">
            <div 
              className="transition-transform duration-500 ease-in-out"
              style={{ transform: `translateY(-${wordIndex * 56}px)` }}
            >
              {['Manage.', 'Track.', 'Grow.'].map((word, idx) => (
                <h2 
                  key={idx} 
                  className="text-5xl font-black text-brand-red tracking-tight font-sans h-[56px] flex items-center leading-none"
                >
                  {word}
                </h2>
              ))}
            </div>
          </div>
          <p className="text-base font-medium text-slate-600 leading-relaxed font-sans">
            A simple and powerful CRM built for teams that want to achieve more.
          </p>
        </div>

        {/* Bottom corporate trademark */}
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          ©2026 Latrics CRM. All Rights Reserved.
        </div>
      </div>

      {/* Right side: Modern Clerk SignUp Component container */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10">
        {userId && isAuthenticated ? (
          <div className="max-w-md w-full bg-blue-50 border border-blue-200 text-blue-800 p-8 rounded-2xl text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h2 className="text-2xl font-bold mb-4">You are already logged in!</h2>
            <p className="text-sm mb-6">
              You are currently logged in as an active user (likely the Superadmin). 
              Clerk prevents logged-in users from seeing the Sign Up page.
            </p>
            <p className="text-sm font-medium mb-6">
              To test this invitation link as the invited user, please copy the URL and open it in an <strong>Incognito/Private Window</strong>.
            </p>
            <button 
              onClick={() => signOut()}
              className="w-full bg-[#2c303b] hover:bg-[#1f222a] text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              Log me out to accept invite
            </button>
            <a href="/dashboard" className="mt-4 block text-brand-red hover:text-red-700 font-bold text-sm transition-colors">
              Return to Dashboard
            </a>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <SignUp 
              routing="virtual"
              initialValues={{ emailAddress: inviteEmail }}
              forceRedirectUrl="/sync-auth"
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
        )}
      </div>
    </div>
  );
}
