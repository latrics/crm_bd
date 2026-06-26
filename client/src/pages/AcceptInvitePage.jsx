import React, { useState, useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { SignUp, useAuth, useClerk } from '@clerk/react';
import { verifyInvite } from '../api/authApi.js';
import loginBg from '../assets/images/signup_login_img.jpeg';

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get('token');
  const { userId } = useAuth();
  const { signOut } = useClerk();
  
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

      {/* Right Pane - Standard Clerk SignUp */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        {userId ? (
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
          <SignUp 
            routing="virtual"
            initialValues={{ emailAddress: inviteEmail }}
            forceRedirectUrl="/sync-auth"
          />
        )}
      </div>
    </div>
  );
}
