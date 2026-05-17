import React from 'react';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import WallCalendar from './components/Calendar/WallCalendar';
import { LoginPage, SignupPage } from './components/AuthPages';
import EventsPage from './components/Events/EventsPage';

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
                  <Navigate to="/events" replace />
                </SignedIn>
                <SignedOut>
                  <Navigate to="/login" replace />
                </SignedOut>
              </>
            } 
          />

          <Route 
            path="/events" 
            element={
              <SignedIn>
                <EventsPage />
              </SignedIn>
            } 
          />

          <Route 
            path="/schedule" 
            element={
              <SignedIn>
                <WallCalendar />
              </SignedIn>
            } 
          />

          {/* Fallback for profile and other routes */}
          <Route 
            path="*" 
            element={
              <SignedIn>
                <Navigate to="/events" replace />
              </SignedIn>
            } 
          />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  );
}

export default App;
