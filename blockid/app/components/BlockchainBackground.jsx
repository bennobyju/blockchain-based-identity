"use client";

import React, { useEffect, useRef } from 'react';

export default function BlockchainBackground() {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    // Nodes and connections
    const nodes = [];
    const nodeCount = 30;
    
    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 2,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        connections: []
      });
    }
    
    // Create connections between nodes
    for (let i = 0; i < nodes.length; i++) {
      const connectionsCount = Math.floor(Math.random() * 3) + 1;
      const potentialConnections = [...nodes];
      potentialConnections.splice(i, 1); // Remove self
      
      for (let j = 0; j < connectionsCount; j++) {
        if (potentialConnections.length === 0) break;
        
        const randomIndex = Math.floor(Math.random() * potentialConnections.length);
        nodes[i].connections.push(potentialConnections[randomIndex]);
        potentialConnections.splice(randomIndex, 1);
      }
    }
    
    // Animation loop
    function animate() {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        
        // Move nodes
        node.x += node.speedX;
        node.y += node.speedY;
        
        // Bounce off edges
        if (node.x + node.size > width || node.x - node.size < 0) {
          node.speedX = -node.speedX;
        }
        if (node.y + node.size > height || node.y - node.size < 0) {
          node.speedY = -node.speedY;
        }
        
        // Draw connections
        for (let j = 0; j < node.connections.length; j++) {
          const connectedNode = node.connections[j];
          
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(138, 102, 246, 0.15)';
          ctx.lineWidth = 1;
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(connectedNode.x, connectedNode.y);
          ctx.stroke();
          
          // Animate data transfers
          const now = Date.now();
          if ((now / 1000) % 3 < 1) {
            const animProgress = ((now / 1000) % 1);
            const dataX = node.x + (connectedNode.x - node.x) * animProgress;
            const dataY = node.y + (connectedNode.y - node.y) * animProgress;
            
            ctx.beginPath();
            ctx.arc(dataX, dataY, 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(138, 102, 246, 0.8)';
            ctx.fill();
          }
        }
        
        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(138, 102, 246, 0.4)';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size - 1, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
      }
      
      requestAnimationFrame(animate);
    }
    
    // Handle resize
    function handleResize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', handleResize);
    animate();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full z-0"
      style={{ pointerEvents: 'none' }}
    />
  );
}
