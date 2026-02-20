/**
 * Format a duration in seconds to a human-readable string
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration string (e.g., "30 days", "1 year")
 */
export function formatDuration(seconds) {
  if (!seconds) return 'No expiration';
  
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (years > 0) {
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  } else if (months > 0) {
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  } else if (days > 0) {
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  } else if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  } else {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }
}

/**
 * Format a date string to a localized format
 * @param {string|Date} date - Date string or Date object
 * @param {boolean} includeTime - Whether to include time in the output
 * @returns {string} - Formatted date string
 */
export function formatDate(date, includeTime = false) {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const options = {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
    };
    
    return dateObj.toLocaleDateString(undefined, options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Calculate time remaining until a specific date
 * @param {string|Date} futureDate - The future date to calculate time until
 * @returns {string} - Formatted time remaining string
 */
export function timeRemaining(futureDate) {
  if (!futureDate) return 'N/A';
  
  try {
    const endDate = typeof futureDate === 'string' ? new Date(futureDate) : futureDate;
    const now = new Date();
    
    if (endDate <= now) {
      return 'Expired';
    }
    
    const diffInMilliseconds = endDate - now;
    const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
    
    return formatDuration(diffInSeconds);
  } catch (error) {
    console.error('Error calculating time remaining:', error);
    return 'Unknown';
  }
}

/**
 * Truncate an Ethereum address or hash for display
 * @param {string} address - The address/hash to truncate
 * @param {number} startChars - Number of characters to show at the start
 * @param {number} endChars - Number of characters to show at the end
 * @returns {string} - Truncated address/hash
 */
export function truncateAddress(address, startChars = 6, endChars = 4) {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Convert timestamp in seconds to Date object
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {Date} - JavaScript Date object
 */
export function timestampToDate(timestamp) {
  if (!timestamp) return null;
  return new Date(Number(timestamp) * 1000);
} 