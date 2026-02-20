"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";

export default function LoadingScreenWrapper({ children }) {
  const { isLoading } = useAuth();
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  // Handle initial loading effect
  useEffect(() => {
    // If auth loading is complete, show content after a short delay
    if (!isLoading) {
      const timer = setTimeout(() => {
        setIsInitialLoadComplete(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // If still in initial loading state, show loading screen
  if (!isInitialLoadComplete) {
    return (
      <div className="fixed inset-0 bg-[var(--background)] flex items-center justify-center z-50">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center mb-4 animate-pulse">
            <span className="text-white font-bold text-2xl">ID</span>
          </div>
          <div className="h-2 w-48 bg-[var(--secondary)]/10 rounded-full overflow-hidden">
            <div className="h-full bg-purple-600 w-1/2 animate-[loader_1.5s_ease-in-out_infinite]"></div>
          </div>
        </div>
      </div>
    );
  }

  // Once loaded, show children content
  return children;
}
