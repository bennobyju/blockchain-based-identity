"use client";

import { useRef, useEffect, useState, memo } from 'react';

const ParticleNebula = memo(({ expandTop = false, className = "" }) => {
  const canvasRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Delay canvas initialization to prioritize content rendering
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // Resize handler to ensure canvas is properly sized
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };
    
    resize();
    window.addEventListener('resize', resize);
    
    // Use fewer particles on mobile
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 30 : 50;
    
    // Particle system
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width / dpr,
        y: Math.random() * canvas.height / dpr,
        size: Math.random() * 2 + 1,
        speedX: Math.random() * 0.2 - 0.1,
        speedY: Math.random() * 0.2 - 0.1,
        opacity: Math.random() * 0.5 + 0.1
      });
    }
    
    // Connection distance - shorter on mobile
    const maxDistance = isMobile ? 100 : 150;
    
    // Animation loop with RAF optimization
    let animationId;
    let lastTime = 0;
    const fpsInterval = 1000 / 30; // Cap at 30fps for better performance
    
    function animate(timestamp) {
      animationId = requestAnimationFrame(animate);
      
      // Throttle frame rate
      const elapsed = timestamp - lastTime;
      if (elapsed < fpsInterval) return;
      lastTime = timestamp - (elapsed % fpsInterval);
      
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      
      // Draw particles
      for (const particle of particles) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148, 85, 255, ${particle.opacity})`;
        ctx.fill();
        
        // Update position with boundary checks
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Wrap around edges
        if (particle.x > canvas.width / dpr) particle.x = 0;
        else if (particle.x < 0) particle.x = canvas.width / dpr;
        if (particle.y > canvas.height / dpr) particle.y = 0;
        else if (particle.y < 0) particle.y = canvas.height / dpr;
      }
      
      // Draw connections (only if not on a slow device)
      if (!isMobile || window.innerWidth > 1024) {
        ctx.lineWidth = 0.3;
        
        // Only check half of potential connections to improve performance
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < maxDistance) {
              const opacity = (1 - distance / maxDistance) * 0.15;
              ctx.strokeStyle = `rgba(148, 85, 255, ${opacity})`;
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
      }
    }
    
    animationId = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [isVisible]);
  
  if (!isVisible) {
    return null; // Don't render anything until content is loaded
  }
  
  return (
    <canvas 
      ref={canvasRef} 
      className={`w-full h-full absolute inset-0 ${className}`}
      style={{
        top: expandTop ? '-10%' : 0,
        height: expandTop ? '110%' : '100%'
      }}
    />
  );
});

ParticleNebula.displayName = 'ParticleNebula';

export default ParticleNebula;
