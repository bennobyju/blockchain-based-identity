"use client";

import { useRef, useEffect } from 'react';

export default function SimplifiedGalaxy() {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Set up globe parameters
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const radius = Math.min(window.innerWidth, window.innerHeight) * 0.25;
    let rotation = 0;
    
    // Create points on the globe
    const points = [];
    const numPoints = 100;
    
    for (let i = 0; i < numPoints; i++) {
      // Generate random spherical coordinates
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      // Convert to cartesian coordinates on a unit sphere
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.sin(phi) * Math.sin(theta);
      const z = Math.cos(phi);
      
      points.push({
        x, y, z,
        size: Math.random() * 2 + 1,
        connections: []
      });
    }
    
    // Connect nearby points
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dist = Math.sqrt(
          Math.pow(points[i].x - points[j].x, 2) +
          Math.pow(points[i].y - points[j].y, 2) +
          Math.pow(points[i].z - points[j].z, 2)
        );
        
        if (dist < 0.8) {
          points[i].connections.push(j);
        }
      }
    }
    
    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation function
    function animate() {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update rotation
      rotation += 0.002;
      
      // Draw globe outline
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw glow effect
      const gradient = ctx.createRadialGradient(
        centerX, centerY, radius * 0.5,
        centerX, centerY, radius * 2
      );
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.1)');
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 2, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Draw points and connections
      const visiblePoints = [];
      
      // Calculate screen coordinates with rotation
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        
        // Rotate around Y axis
        const cosR = Math.cos(rotation);
        const sinR = Math.sin(rotation);
        const x2 = point.x * cosR + point.z * sinR;
        const z2 = point.z * cosR - point.x * sinR;
        
        // Project onto 2D screen
        const scale = 1 / (1 + z2);
        const screenX = centerX + x2 * radius * scale;
        const screenY = centerY + point.y * radius * scale;
        
        visiblePoints.push({
          index: i,
          x: screenX,
          y: screenY,
          z: z2,
          size: point.size * scale,
          connections: point.connections
        });
      }
      
      // Sort by Z for proper rendering order
      visiblePoints.sort((a, b) => b.z - a.z);
      
      // Draw connections
      for (const point of visiblePoints) {
        if (point.z < 0.1) {  // Only draw points on the front side
          for (const connIndex of points[point.index].connections) {
            const connPoint = visiblePoints.find(p => p.index === connIndex);
            if (connPoint && connPoint.z < 0.1) {
              // Draw line with opacity based on distance
              const distance = Math.hypot(point.x - connPoint.x, point.y - connPoint.y);
              const maxDist = radius * 0.8;
              if (distance < maxDist) {
                const opacity = 0.5 * (1 - distance / maxDist);
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
                ctx.lineTo(connPoint.x, connPoint.y);
                ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
              }
            }
          }
        }
      }
      
      // Draw points
      for (const point of visiblePoints) {
        if (point.z < 0.1) {  // Only draw points on the front side
          const opacity = 0.9 - point.z * 0.5;
          
          // Draw glow
          const glowSize = point.size * 2;
          const glowGradient = ctx.createRadialGradient(
            point.x, point.y, 0,
            point.x, point.y, glowSize
          );
          glowGradient.addColorStop(0, `rgba(139, 92, 246, ${opacity * 0.5})`);
          glowGradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
          
          ctx.beginPath();
          ctx.arc(point.x, point.y, glowSize, 0, Math.PI * 2);
          ctx.fillStyle = glowGradient;
          ctx.fill();
          
          // Draw point
          ctx.beginPath();
          ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(139, 92, 246, ${opacity})`;
          ctx.fill();
        }
      }
      
      // Draw latitude/longitude lines
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI;
        
        // Draw longitude circles
        ctx.beginPath();
        ctx.ellipse(
          centerX, centerY,
          radius, radius * Math.abs(Math.cos(angle + rotation)),
          0, 0, Math.PI * 2
        );
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.15)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      
      requestAnimationFrame(animate);
    }
    
    animate();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 w-full h-full z-0" 
      style={{ pointerEvents: 'none' }}
    />
  );
} 