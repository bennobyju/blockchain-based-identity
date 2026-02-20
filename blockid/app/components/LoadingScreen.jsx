"use client";

import React, { useEffect, useState } from 'react';
import ParticleNebula from './ParticleNebula';

export default function LoadingScreen({ onLoadingComplete }) {
  const [opacity, setOpacity] = useState(1);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Connecting to wallet...');
  
  useEffect(() => {
    let timer;
    let currentProgress = 0;
    const startTime = Date.now();
    const totalDuration = 2500; // 2.5 seconds total
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const normalizedProgress = Math.min(1, elapsed / totalDuration);
      
      // Ease out cubic function for smoother progress at the end
      currentProgress = normalizedProgress < 0.5
        ? 4 * normalizedProgress * normalizedProgress * normalizedProgress
        : 1 - Math.pow(-2 * normalizedProgress + 2, 3) / 2;
      
      const roundedProgress = Math.round(currentProgress * 100);
      setProgress(roundedProgress);
      
      // Update loading text based on progress
      if (roundedProgress < 30) {
        setLoadingText('Connecting to wallet...');
      } else if (roundedProgress < 60) {
        setLoadingText('Verifying identity...');
      } else if (roundedProgress < 90) {
        setLoadingText('Generating secure token...');
      } else {
        setLoadingText('Identity verified!');
      }
      
      if (roundedProgress >= 100) {
        clearInterval(timer);
        
        // Wait a moment before fading out
        setTimeout(() => {
          setOpacity(0);
          
          // Wait for fade transition to complete
          setTimeout(() => {
            if (onLoadingComplete) {
              onLoadingComplete();
            }
          }, 500);
        }, 800);
      }
    };
    
    timer = setInterval(updateProgress, 50);
    
    return () => clearInterval(timer);
  }, [onLoadingComplete]);
  
  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--background)]"
      style={{ 
        opacity, 
        transition: 'opacity 0.5s ease-in-out'
      }}
    >
      {/* Background animation */}
      <div className="fixed inset-0 z-0">
        <ParticleNebula expandTop={true} />
      </div>
      
      <div className="relative z-10 flex flex-col items-center text-center max-w-md px-4">
        {/* Logo with glow */}
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-600 to-violet-600 
          flex items-center justify-center mb-8 pulse-purple"
          style={{
            boxShadow: '0 0 60px 15px rgba(139, 92, 246, 0.3)'
          }}
        >
          <span className="text-white font-bold text-4xl">ID</span>
        </div>
        
        {/* Progress text */}
        <h2 className="text-2xl font-bold mb-6">{loadingText}</h2>
        
        {/* Progress bar */}
        <div className="w-full h-2 bg-[var(--card)] rounded-full overflow-hidden mb-3">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 to-violet-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Progress percentage */}
        <div className="text-sm text-[var(--muted-foreground)]">
          {progress}% Complete
        </div>
      </div>
    </div>
  );
} 