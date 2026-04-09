import React, { useEffect } from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';

const darkAppearance = {
  variables: {
    colorBackground: '#1c1917',
    colorInputBackground: '#292524',
    colorInputText: '#e7e5e4',
    colorText: '#e7e5e4',
    colorTextSecondary: '#a8a29e',
    colorPrimary: '#60867a',
    colorDanger: '#f87171',
    borderRadius: '0.75rem',
    fontFamily: 'Inter, sans-serif',
  },
  elements: {
    card: {
      backgroundColor: '#1c1917',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
    },
    headerTitle: {
      color: '#f5f5f4',
      fontFamily: '"Playfair Display", serif',
      fontSize: '1.5rem',
    },
    headerSubtitle: {
      color: '#a8a29e',
    },
    formFieldLabel: {
      color: '#d6d3d1',
    },
    formFieldInput: {
      backgroundColor: '#292524',
      borderColor: '#44403c',
      color: '#f5f5f4',
    },
    formButtonPrimary: {
      backgroundColor: '#4c6b61',
      '&:hover': { backgroundColor: '#40564f' },
    },
    footerActionLink: {
      color: '#7ea196',
    },
    dividerLine: {
      backgroundColor: '#44403c',
    },
    dividerText: {
      color: '#78716c',
    },
    socialButtonsBlockButton: {
      backgroundColor: '#292524',
      borderColor: '#44403c',
      color: '#d6d3d1',
      '&:hover': { backgroundColor: '#44403c' },
    },
    identityPreviewText: { color: '#d6d3d1' },
    alertText: { color: '#fca5a5' },
  },
};

function AuthBackground({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: '#0f1117' }}>
      {/* Subtle radial glow behind the form */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(76,107,97,0.18) 0%, transparent 70%)',
        }}
      />

      {/* Decorative grid lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(#a8a29e 1px, transparent 1px), linear-gradient(90deg, #a8a29e 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Brand mark top */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-10">
        <span className="text-2xl font-serif text-stone-100 tracking-wide select-none" style={{ fontFamily: '"Playfair Display", serif' }}>
          Calender
        </span>
        <span className="text-xs font-medium uppercase tracking-widest text-stone-500">Your personal planner</span>
      </div>

      {/* The Clerk form */}
      <div className="relative z-10 mt-12">
        {children}
      </div>

      {/* Bottom tagline */}
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-stone-600 select-none whitespace-nowrap">
        Moments & Memories — beautifully organized.
      </p>
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
        appearance={darkAppearance}
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
        appearance={darkAppearance}
      />
    </AuthBackground>
  );
}
