import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { SignUp } from '@clerk/react';
import loginBg from '../assets/images/signup_login_img.jpeg';

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

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
          fallbackRedirectUrl="/dashboard" 
          signInUrl="/login" 
          initialValues={{ emailAddress: email }}
        />
      </div>
    </div>
  );
}
