"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Create the auth context
const AuthContext = createContext(undefined);

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// AuthProvider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        // Check for stored auth in localStorage
        const storedUser = localStorage.getItem('blockid_user');
        
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
          
          // Check if session is still valid (within 7 days)
          const lastLogin = new Date(parsedUser.lastLogin).getTime();
          const now = new Date().getTime();
          const weekInMs = 7 * 24 * 60 * 60 * 1000;
          
          if (now - lastLogin > weekInMs) {
            // Auto-refresh the session timestamp
            const refreshedUser = {
              ...parsedUser,
              lastLogin: new Date().toISOString()
            };
            setUser(refreshedUser);
            localStorage.setItem('blockid_user', JSON.stringify(refreshedUser));
          }
        }
      } catch (error) {
        console.error("Failed to restore auth session:", error);
        // Clear potentially corrupted session data
        localStorage.removeItem('blockid_user');
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (!isLoading && user && pathname === '/login') {
      console.log("User is authenticated and on login page, redirecting to home");
      router.push('/');
    }
  }, [isLoading, user, pathname, router]);

  // Login function - called after wallet connection and signature
  const login = (address) => {
    // Create user object with wallet address
    const userData = {
      address,
      lastLogin: new Date().toISOString(),
      // Other user data can be added here
    };

    // Save to state
    setUser(userData);
    setIsAuthenticated(true);
    
    // Store in localStorage for persistence
    localStorage.setItem('blockid_user', JSON.stringify(userData));
    
    // Also store a backup session key that can be used for quick recovery
    sessionStorage.setItem('blockid_active_session', 'true');
    
    // Set a flag to indicate full authentication is complete
    sessionStorage.setItem('blockid_full_auth', 'complete');
  };

  // Logout function - called when wallet is disconnected
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('blockid_user');
    sessionStorage.removeItem('blockid_active_session');
    sessionStorage.removeItem('blockid_full_auth');
  };

  // Handle loading screen completion
  const handleLoadingComplete = () => {
    setInitialLoadComplete(true);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    handleLoadingComplete,
    initialLoadComplete,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 