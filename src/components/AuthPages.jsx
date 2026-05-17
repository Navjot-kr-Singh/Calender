import React from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import calendarImg from '../assets/calendar.png';
import womanImg from '../assets/woman.png';

const clerkAppearance = {
  variables: {
    colorPrimary: '#E51E25',
    colorText: '#1a1a1a',
    colorBackground: '#ffffff',
    borderRadius: '0.5rem',
    fontFamily: 'Inter, sans-serif',
  },
  elements: {
    card: {
      boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)',
      border: '2px solid black',
      padding: '2rem',
    },
    headerTitle: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#1a1a1a',
      textAlign: 'center',
    },
    headerSubtitle: {
      color: '#666',
      textAlign: 'center',
      marginBottom: '1.5rem',
    },
    formFieldLabel: {
      fontWeight: '600',
      color: '#1a1a1a',
      marginBottom: '0.5rem',
    },
    formFieldInput: {
      border: '2px solid black',
      height: '3rem',
      fontSize: '1rem',
      '&:focus': {
        borderColor: '#E51E25',
        boxShadow: 'none',
      },
    },
    formButtonPrimary: {
      backgroundColor: '#E51E25',
      border: '2px solid black',
      boxShadow: '0 4px 0 0 rgba(0,0,0,1)',
      height: '3rem',
      fontSize: '1rem',
      fontWeight: '700',
      textTransform: 'none',
      '&:hover': {
        backgroundColor: '#cc1a21',
        transform: 'translateY(2px)',
        boxShadow: '0 2px 0 0 rgba(0,0,0,1)',
      },
      '&:active': {
        transform: 'translateY(4px)',
        boxShadow: 'none',
      },
    },
    socialButtonsBlockButton: {
      border: '2px solid black',
      height: '3rem',
      fontSize: '1rem',
      fontWeight: '600',
      '&:hover': {
        backgroundColor: '#f5f5f5',
      },
    },
    dividerLine: {
      backgroundColor: '#000',
      height: '1px',
    },
    dividerText: {
      color: '#000',
      fontWeight: '600',
      textTransform: 'lowercase',
    },
    footerActionLink: {
      color: '#E51E25',
      fontWeight: '700',
      textDecoration: 'underline',
      '&:hover': {
        color: '#cc1a21',
      },
    },
    identityPreviewText: { color: '#1a1a1a' },
    formFieldSuccessText: { color: '#10b981' },
    formFieldErrorText: { color: '#ef4444' },
  },
};

function AuthBackground({ children }) {
  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-y-auto">
      {/* Left Side: Branding & Illustrations */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-start pt-[10vh] p-12 bg-white relative overflow-hidden border-r border-gray-100">
        <div className="max-w-md w-full flex flex-col items-center text-center">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center">
            <h1 className="text-6xl font-bold text-[#1e4eb8] tracking-tight" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Calendra
            </h1>
          </div>

          {/* Calendar Illustration */}
          <div className="mb-12 relative">
            <img 
              src={calendarImg} 
              alt="Calendar Illustration" 
              className="w-64 h-auto object-contain transform -rotate-3"
            />
          </div>

          {/* Text Content */}
          <div className="mb-12">
            <h2 className="text-4xl font-black text-black mb-4 leading-tight">
              Your time, perfectly planned
            </h2>
            <p className="text-lg text-gray-600 font-medium max-w-sm mx-auto leading-relaxed">
              Join millions of professionals who easily book meetings with the #1 scheduling tool
            </p>
          </div>

          {/* Person Illustration */}
          <div className="relative">
            <img 
              src={womanImg} 
              alt="User Illustration" 
              className="w-56 h-auto object-contain"
            />
          </div>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-start pt-[12vh] p-6 bg-[#fcfcfc]">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  return (
    <AuthBackground>
      <SignIn
        path="/login"
        routing="path"
        signUpUrl="/signup"
        appearance={clerkAppearance}
      />
    </AuthBackground>
  );
}

export function SignupPage() {
  return (
    <AuthBackground>
      <SignUp
        path="/signup"
        routing="path"
        signInUrl="/login"
        appearance={clerkAppearance}
      />
    </AuthBackground>
  );
}

