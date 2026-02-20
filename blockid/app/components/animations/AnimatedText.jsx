"use client";

import { useEffect, useState, Children, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

// Animated Text component for paragraphs and other text elements
export function AnimatedText({ 
  children, 
  className = '', 
  delay = 0,
  duration = 0.5
}) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return <div className={className}>{children}</div>;
  }
  
  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        duration: duration, 
        delay: delay,
        ease: [0.25, 0.1, 0.25, 1.0]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated Title component for headings that splits into lines
export function AnimatedTitle({ 
  children, 
  className = '', 
  textClassName = '',
  delay = 0,
  staggerDelay = 0.1,
  duration = 0.7
}) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Convert children to array for mapping
  const childArray = Children.toArray(children);
  
  if (!isMounted) {
    return (
      <h2 className={className}>
        {childArray.map((child, index) => (
          <span key={index} className={`block ${textClassName}`}>{child}</span>
        ))}
      </h2>
    );
  }
  
  return (
    <h2 className={className}>
      {childArray.map((child, index) => (
        <motion.span
          key={index}
          className={`block ${textClassName}`}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            duration: duration,
            delay: delay + (index * staggerDelay),
            ease: [0.25, 0.1, 0.25, 1.0] 
          }}
        >
          {child}
        </motion.span>
      ))}
    </h2>
  );
}

// Animation specifically for headings with staggered text animation
export function AnimatedHeading({ text, className, wordSpace = true, charStagger = 0.02 }) {
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
  
  // Split text into words then characters for fine-grained animation
  const words = text.split(" ");
  
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { 
        staggerChildren: charStagger,
        delayChildren: 0.1 * i,
      },
    }),
  };
  
  const child = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };
  
  // Fallback rendering for when animations fail
  if (!isInView && hasAnimated) {
    return <h2 className={className}>{text}</h2>;
  }
  
  return (
    <motion.h2
      ref={ref}
      className={className}
      variants={container}
      initial="hidden"
      animate={isInView || hasAnimated ? "visible" : "hidden"}
      style={{ opacity: hasAnimated ? 1 : null }}
    >
      {words.map((word, index) => (
        <span key={index} className="inline-block">
          {Array.from(word).map((char, charIndex) => (
            <motion.span
              key={`${index}-${charIndex}`}
              variants={child}
              className="inline-block"
            >
              {char}
            </motion.span>
          ))}
          {wordSpace && index !== words.length - 1 && (
            <span>&nbsp;</span>
          )}
        </span>
      ))}
    </motion.h2>
  );
} 