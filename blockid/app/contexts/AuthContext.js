'use client';

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

// Create the auth context
const AuthContext = createContext(null);

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    // Check for wallet session in localStorage on mount
    const storedSession = localStorage.getItem('blockid_wallet_session');
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        if (session.address) {
          // If wallet session exists, use it to set user auth state
          setUser({
            address: session.address,
            authenticated: true
          });
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Failed to parse stored session:", err);
      }
    }
  }, []);

  // Login function
  const login = useCallback((address) => {
    setUser({ address, authenticated: true });
    setIsAuthenticated(true);
    
    // Ensure wallet session is stored
    const session = {
      address,
      timestamp: new Date().getTime()
    };
    localStorage.setItem('blockid_wallet_session', JSON.stringify(session));
    sessionStorage.setItem('blockid_active_session', 'true');
  }, []);

  // Logout function
  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('blockid_wallet_session');
    sessionStorage.removeItem('blockid_active_session');
  }, []);

  // Context value
  const value = {
    user,
    isAuthenticated,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 