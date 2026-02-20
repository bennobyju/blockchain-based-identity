"use client";

import { useRef, useEffect } from 'react';
import * as THREE from 'three';

export default function PurpleGlobe({ size = 200, opacity = 0.8, rotationSpeed = 0.001 }) {
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Scene setup
    const scene = new THREE.Scene();
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 300;
    
    // Create renderer
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ 
        alpha: true,
        antialias: true
      });
      renderer.setSize(size, size);
      renderer.setClearColor(0x000000, 0);
      
      // Only append if container exists and doesn't already have a canvas
      if (containerRef.current && !containerRef.current.querySelector('canvas')) {
        containerRef.current.appendChild(renderer.domElement);
      }
    } catch (err) {
      console.error("Failed to initialize WebGL renderer:", err);
      return;
    }
    
    // Create globe geometry
    const geometry = new THREE.SphereGeometry(100, 32, 32);
    
    // Create material with a soft glow effect
    const material = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6, // Purple
      transparent: true,
      opacity: 0.2,
      wireframe: true
    });
    
    // Create mesh
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);
    
    // Create a glowing atmosphere
    const atmosphereGeometry = new THREE.SphereGeometry(105, 32, 32);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);
    
    // Add floating particles around the globe
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 200;
    const posArray = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount * 3; i += 3) {
      // Create points in a spherical shape around the globe
      const radius = 120 + (Math.random() * 40);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      posArray[i] = radius * Math.sin(phi) * Math.cos(theta);
      posArray[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      posArray[i + 2] = radius * Math.cos(phi);
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 1.5,
      color: 0xc4b5fd,
      transparent: true,
      opacity: 0.8
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate the globe and atmosphere
      globe.rotation.y += rotationSpeed;
      atmosphere.rotation.y += rotationSpeed / 2;
      particlesMesh.rotation.y -= rotationSpeed / 3;
      
      // Render the scene
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle cleanup when component unmounts
    return () => {
      if (renderer) {
        if (containerRef.current) {
          const canvas = containerRef.current.querySelector('canvas');
          if (canvas) {
            containerRef.current.removeChild(canvas);
          }
        }
        
        // Dispose resources
        scene.remove(globe);
        scene.remove(atmosphere);
        scene.remove(particlesMesh);
        
        geometry.dispose();
        material.dispose();
        atmosphereGeometry.dispose();
        atmosphereMaterial.dispose();
        particlesGeometry.dispose();
        particlesMaterial.dispose();
        
        renderer.dispose();
      }
    };
  }, [size, rotationSpeed]);
  
  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: size,
        height: size,
        opacity: opacity,
        margin: '0 auto'
      }}
    />
  );
} 