import { ethers } from 'ethers';

/**
 * Generate a unique identity hash based on name and wallet address
 * This creates a deterministic, unique hash for an identity
 * @param {string} fullName - The full name of the identity owner
 * @param {string} walletAddress - The wallet address of the identity owner
 * @returns {string} - A unique hash string
 */
export const generateUIDHash = (fullName, walletAddress) => {
  if (!fullName || !walletAddress) {
    console.error('Missing required parameters for UID hash generation');
    return null;
  }

  try {
    // Normalize input
    const normalizedName = fullName.trim().toLowerCase();
    const normalizedAddress = walletAddress.trim().toLowerCase();
    
    // Create combined string and hash it
    const combined = `${normalizedName}:${normalizedAddress}:${Date.now()}`;
    
    // Use ethers.js keccak256 function to create a hash
    const hash = ethers.keccak256(ethers.toUtf8Bytes(combined));
    
    // Return the hash without the 0x prefix
    return hash.substring(2);
  } catch (error) {
    console.error('Error generating unique identity hash:', error);
    return null;
  }
};

/**
 * Format an ID number with proper prefix (if not already formatted)
 * @param {string|number} idNumber - The raw ID number
 * @returns {string} - Formatted ID number with BID- prefix
 */
export const formatIdNumber = (idNumber) => {
  if (!idNumber) return 'BID-000000';
  
  // If already formatted, return as is
  if (typeof idNumber === 'string' && idNumber.startsWith('BID-')) {
    return idNumber;
  }
  
  // Convert to string if it's a number
  const idStr = idNumber.toString();
  
  // Pad with zeros to ensure 6 digits
  const paddedId = idStr.padStart(6, '0');
  
  return `BID-${paddedId}`;
};

/**
 * Generate a random ID number with proper formatting
 * @returns {string} - A formatted random ID number
 */
export const generateRandomIdNumber = () => {
  const randomNum = Math.floor(Math.random() * 1000000);
  return formatIdNumber(randomNum);
};

/**
 * Generate a mock transaction hash for testing
 * @returns {string} - A mock Ethereum transaction hash
 */
export const generateMockTxnHash = () => {
  // Create a random 64-character hex string with 0x prefix
  return '0x' + Array(64).fill(0).map(() => 
    Math.floor(Math.random() * 16).toString(16)).join('');
};

/**
 * Calculate when an ID expires based on issue date and duration
 * @param {string|Date} issueDateStr - The issue date as string or Date object
 * @param {number} durationDays - Duration in days
 * @returns {Date} - The expiry date
 */
export const calculateExpiryDate = (issueDateStr, durationDays = 30) => {
  let issueDate;
  
  if (issueDateStr instanceof Date) {
    issueDate = issueDateStr;
  } else if (typeof issueDateStr === 'string') {
    issueDate = new Date(issueDateStr);
  } else {
    issueDate = new Date();
  }
  
  // Add duration days to issue date
  const expiryDate = new Date(issueDate);
  expiryDate.setDate(expiryDate.getDate() + durationDays);
  
  return expiryDate;
};

/**
 * Check if an ID is expired
 * @param {string|Date} expiryDateStr - The expiry date as string or Date object
 * @returns {boolean} - True if expired, false otherwise
 */
export const isIdExpired = (expiryDateStr) => {
  if (!expiryDateStr) return false; // No expiry date means it doesn't expire
  
  let expiryDate;
  
  if (expiryDateStr instanceof Date) {
    expiryDate = expiryDateStr;
  } else if (typeof expiryDateStr === 'string') {
    expiryDate = new Date(expiryDateStr);
  } else {
    return false; // Invalid input, assume not expired
  }
  
  const today = new Date();
  return today > expiryDate;
}; 