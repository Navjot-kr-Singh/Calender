import React from 'react';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import WallCalendar from './components/Calendar/WallCalendar';
import { LoginPage, SignupPage } from './components/AuthPages';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error("Missing Publishable Key")
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <BrowserRouter>
        <Routes>
          <Route path="/login/*" element={<LoginPage />} />
          <Route path="/signup/*" element={<SignupPage />} />
          <Route 
            path="/" 
            element={
              <>
                <SignedIn>
                  <div className="min-h-screen bg-[#f0ede8] dark:bg-[#0f1117] transition-colors duration-300">
                    <WallCalendar />
                  </div>
                </SignedIn>
                <SignedOut>
                  <Navigate to="/login" replace />
                </SignedOut>
              </>
            } 
          />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  );
}

export default App;
