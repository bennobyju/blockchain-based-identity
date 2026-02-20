"use client";

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

// Parallax effect for background elements
export function ParallaxBackground({ children, className, speed = 0.5 }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", `${speed * 100}%`]);
  const [hasRendered, setHasRendered] = useState(false);
  
  useEffect(() => {
    // Ensure content is visible after a timeout
    const timer = setTimeout(() => {
      setHasRendered(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (hasRendered) {
    return (
      <motion.div ref={ref} className={className} style={{ y }}>
        {children}
      </motion.div>
    );
  }
  
  return (
    <div className={className} style={{ opacity: 1 }}>
      {children}
    </div>
  );
}

// Scroll progress indicator (like a progress bar)
export function ScrollProgressBar({ color = "#8b5cf6", height = 3 }) {
  const { scrollYProgress } = useScroll();
  
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 origin-left"
      style={{ 
        scaleX: scrollYProgress,
        height: height,
        background: color
      }}
    />
  );
}

// Rotation animation based on scroll
export function ScrollRotate({ children, className, maxRotation = 360 }) {
  const { scrollYProgress } = useScroll();
  const rotate = useTransform(scrollYProgress, [0, 1], [0, maxRotation]);
  const [hasRendered, setHasRendered] = useState(false);
  
  useEffect(() => {
    // Ensure content is visible after a timeout
    const timer = setTimeout(() => {
      setHasRendered(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (hasRendered) {
    return (
      <motion.div className={className} style={{ rotate }}>
        {children}
      </motion.div>
    );
  }
  
  return (
    <div className={className} style={{ opacity: 1 }}>
      {children}
    </div>
  );
}

// Fade in and out based on scroll position
export function ScrollFade({ 
  children, 
  className,
  fadeInStart = 0,
  fadeInEnd = 0.1,
  fadeOutStart = 0.9,
  fadeOutEnd = 1
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const opacity = useTransform(
    scrollYProgress,
    [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd],
    [0, 1, 1, 0]
  );
  
  const [hasRendered, setHasRendered] = useState(false);
  
  useEffect(() => {
    // Ensure content is visible after a timeout
    const timer = setTimeout(() => {
      setHasRendered(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (hasRendered) {
    return (
      <motion.div ref={ref} className={className} style={{ opacity }}>
        {children}
      </motion.div>
    );
  }
  
  return (
    <div ref={ref} className={className} style={{ opacity: 1 }}>
      {children}
    </div>
  );
}

// Scroll-triggered animation with configurable properties
export function ScrollTrigger({ 
  children, 
  className,
  animationType = "fadeUp", // fadeUp, fadeIn, scaleUp, slideIn
  threshold = 0.2,
  duration = 0.7,
  delay = 0
}) {
  const ref = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  // Ensure content is visible even if animation fails
  useEffect(() => {
    // Fallback to make content visible after a timeout
    const timer = setTimeout(() => {
      setHasAnimated(true);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Different animation variants
  const variants = {
    fadeUp: {
      hidden: { opacity: 0, y: 50 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration, delay, ease: "easeOut" }
      }
    },
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { 
        opacity: 1,
        transition: { duration, delay, ease: "easeOut" }
      }
    },
    scaleUp: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { 
        opacity: 1, 
        scale: 1,
        transition: { duration, delay, ease: "easeOut" }
      }
    },
    slideIn: {
      hidden: { opacity: 0, x: -50 },
      visible: { 
        opacity: 1, 
        x: 0,
        transition: { duration, delay, ease: "easeOut" }
      }
    }
  };
  
  // Get the appropriate variant
  const currentVariant = variants[animationType] || variants.fadeUp;
  
  // If fallback timer has triggered but element is not in view
  if (hasAnimated) {
    return (
      <div className={className} style={{ opacity: 1 }}>
        {children}
      </div>
    );
  }
  
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate="visible"
      variants={currentVariant}
      className={className}
    >
      {children}
    </motion.div>
  );
} 