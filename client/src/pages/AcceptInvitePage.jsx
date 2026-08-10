import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { SignUp, useAuth as useClerkAuth, useClerk } from '@clerk/react';
import { verifyInvite } from '../api/authApi.js';
import { useAuth as useAppAuth } from '../context/AuthContext.jsx';
import loginBg from '../assets/images/signup_login_img.jpeg';
import latricsLogo from '../assets/images/latrics_grey_red_logo.svg';

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

        {/* Right side: Modern Clerk SignUp Component container */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 md:p-6 relative">
          {userId && isAuthenticated ? (
            <div className="max-w-md w-full bg-blue-50 border border-blue-200 text-blue-800 p-8 rounded-xl text-center shadow-sm">
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
                className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Log me out to accept invite
              </button>
              <a href="/dashboard" className="mt-4 block text-blue-600 hover:underline text-sm font-medium">
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
          )}
        </div>

      </div>
    </div>
  );
}
