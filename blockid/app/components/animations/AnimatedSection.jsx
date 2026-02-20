"use client";

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useEffect, useState, Children } from 'react';

// Animation for section containers that fade in and slide up
export function AnimatedSection({ children, className, delay = 0, duration = 0.5 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure content is visible even if animation fails
  useEffect(() => {
    if (isInView) {
      setHasAnimated(true);
    }
    
    // Fallback to make content visible after a timeout
    const timer = setTimeout(() => {
      setHasAnimated(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [isInView]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <section className={className}>{children}</section>;
  }

  const variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: duration,
        delay: delay,
        ease: [0.25, 0.1, 0.25, 1.0]
      }
    }
  };

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={isInView || hasAnimated ? "visible" : "hidden"}
      variants={variants}
      className={className}
      style={{ opacity: hasAnimated ? 1 : null }}
    >
      {children}
    </motion.section>
  );
}

// Animation for card elements with hover effects
export function AnimatedCard({ children, className, delay = 0, duration = 0.5, onClick }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const [hasAnimated, setHasAnimated] = useState(false);
  
  // Ensure content is visible even if animation fails
  useEffect(() => {
    if (isInView) {
      setHasAnimated(true);
    }
    
    // Fallback to make content visible after a timeout
    const timer = setTimeout(() => {
      setHasAnimated(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [isInView]);
  
  const variants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: duration,
        delay: delay,
        ease: "easeOut"
      }
    },
    hover: { 
      y: -8,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView || hasAnimated ? "visible" : "hidden"}
      whileHover="hover"
      variants={variants}
      className={className}
      style={{ opacity: hasAnimated ? 1 : null }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

// Animation for staggered list items
export function AnimatedList({ children, className, staggerDelay = 0.1 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const [hasAnimated, setHasAnimated] = useState(false);
  
  // Ensure content is visible even if animation fails
  useEffect(() => {
    if (isInView) {
      setHasAnimated(true);
    }
    
    // Fallback to make content visible after a timeout
    const timer = setTimeout(() => {
      setHasAnimated(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [isInView]);
  
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      }
    }
  };

  // If animation has occurred but component is not in view, render without animation
  if (!isInView && hasAnimated) {
    return (
      <div className={className} style={{ opacity: 1 }}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={container}
      initial="hidden"
      animate={isInView || hasAnimated ? "visible" : "hidden"}
      style={{ opacity: hasAnimated ? 1 : null }}
    >
      {children}
    </motion.div>
  );
}

// Animation for individual list items
export function AnimatedListItem({ children, className }) {
  const [hasAnimated, setHasAnimated] = useState(false);
  
  // Ensure content is visible even if animation fails
  useEffect(() => {
    // Fallback to make content visible after a timeout
    const timer = setTimeout(() => {
      setHasAnimated(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const item = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  return (
    <motion.div
      variants={item}
      className={className}
      style={{ opacity: hasAnimated ? 1 : null }}
    >
      {children}
    </motion.div>
  );
}

// Animation for buttons with pulse/glow effects
export function AnimatedButton({ children, className, onClick, delay = 0, duration = 0.4 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Ensure content is visible even if animation fails
  useEffect(() => {
    if (isInView) {
      setHasAnimated(true);
    }
    
    // Fallback to make content visible after a timeout
    const timer = setTimeout(() => {
      setHasAnimated(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [isInView]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div>{children}</div>;
  }
  
  if (!hasAnimated) {
    return (
      <motion.button
        ref={ref}
        className={className}
        onClick={onClick}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: duration, 
          delay: delay,
          ease: [0.25, 0.1, 0.25, 1.0]
        }}
        whileHover={{ 
          scale: 1.05,
          transition: { duration: 0.2 } 
        }}
        whileTap={{ 
          scale: 0.98,
          transition: { duration: 0.1 } 
        }}
      >
        {children}
      </motion.button>
    );
  }
  
  return (
    <motion.button
      ref={ref}
      className={className}
      onClick={onClick}
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.2 } 
      }}
      whileTap={{ 
        scale: 0.98,
        transition: { duration: 0.1 } 
      }}
      transition={{ duration: 0.2 }}
      style={{ opacity: 1 }}
    >
      {children}
    </motion.button>
  );
} 