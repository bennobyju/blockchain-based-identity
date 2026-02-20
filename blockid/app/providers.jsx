"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "./contexts/AuthContext";
import { useEffect, useState } from "react";
import LoadingScreen from "./components/LoadingScreen";
import { ThemeProvider } from "next-themes";

/**
 * Providers component that wraps the application with all necessary context providers
 * and handles initial loading
 */
export function Providers({ children }) {
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  
  // Ensure app is fully loaded before rendering
  useEffect(() => {
    // Set a timeout to match the loading screen animation
    const timeoutId = setTimeout(() => {
      setIsPageLoaded(true);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  return (
    <ThemeProvider attribute="class">
      <SessionProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </SessionProvider>
    </ThemeProvider>
  );
} 