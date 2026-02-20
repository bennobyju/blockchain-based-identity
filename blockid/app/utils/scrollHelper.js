"use client";

/**
 * Smoothly scrolls to an element by ID with additional offset
 * @param {string} elementId - The ID of the element to scroll to
 * @param {number} offsetPx - Additional offset in pixels (default: 20)
 */
export function smoothScrollTo(elementId, offsetPx = 20) {
  const element = document.getElementById(elementId);
  
  if (!element) {
    console.warn(`Element with id "${elementId}" not found`);
    return;
  }
  
  // Get the navbar height to offset the scroll position
  const navbar = document.querySelector('nav');
  const navbarHeight = navbar ? navbar.offsetHeight : 0;
  
  // Calculate the exact position with offset
  const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
  const offsetPosition = elementPosition - navbarHeight - offsetPx;
  
  // Try multiple scroll methods for cross-browser compatibility
  try {
    // First try the smooth behavior with scrollTo
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  } catch (error) {
    // Fallback for browsers that don't support smooth scrolling
    fallbackSmoothScroll(offsetPosition);
  }
}

/**
 * Fallback for smooth scrolling in browsers that don't support ScrollToOptions
 * @param {number} targetY - The target Y position to scroll to
 */
function fallbackSmoothScroll(targetY) {
  const duration = 500; // Duration in milliseconds
  const startY = window.pageYOffset;
  const distance = targetY - startY;
  let startTime = null;
  
  // Easing function (easeInOutQuad)
  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
  
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    window.scrollTo(0, startY + distance * easeInOutQuad(progress));
    
    if (elapsed < duration) {
      window.requestAnimationFrame(step);
    }
  }
  
  window.requestAnimationFrame(step);
}

/**
 * Handle URL hash navigation for direct links
 * This should be called once on page load
 */
export function handleHashNavigation() {
  // Check if there's a hash in the URL
  if (typeof window !== 'undefined' && window.location.hash) {
    // Remove the # character
    const elementId = window.location.hash.substring(1);
    
    // Wait a moment for the page to fully load before scrolling
    setTimeout(() => {
      smoothScrollTo(elementId, 80); // Use 80px offset for header
    }, 300);
  }
} 