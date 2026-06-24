import React, { useState, useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { SignUp } from '@clerk/react';
import { verifyInvite } from '../api/authApi.js';
import loginBg from '../assets/images/signup_login_img.jpeg';

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
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

      {/* Right Pane - Clerk SignUp */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <SignUp 
          routing="path"
          path="/accept-invite"
          fallbackRedirectUrl="/dashboard" 
          signInUrl="/login" 
          initialValues={{ emailAddress: inviteEmail }}
        />
      </div>
    </div>
  );
}
