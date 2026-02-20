"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { ethers } from 'ethers';

// Message to sign for authentication
const SIGN_MESSAGE = "Welcome to BlockID! Sign this message to authenticate your identity on the Sepolia testnet. This request will not trigger a blockchain transaction or cost any gas fees.";

export function useWalletAuth() {
  const { login, logout } = useAuth();
  
  // Connection states
  const [address, setAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState(null);
  
  // Wallet detection states
  const [availableWallets, setAvailableWallets] = useState([]);
  const [hasSession, setHasSession] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize and detect available wallets
  useEffect(() => {
    // Check for stored session first
    const storedSession = localStorage.getItem('blockid_wallet_session');
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        setHasSession(true);
        // Don't auto-connect, just remember we have a session
      } catch (err) {
        console.error("Failed to parse stored session:", err);
        localStorage.removeItem('blockid_wallet_session');
      }
    }

    // Detect available wallets
    const detectWallets = async () => {
      const detected = [];
      
      // Check for MetaMask
      if (window.ethereum?.isMetaMask) {
        detected.push({
          name: 'MetaMask',
          icon: '/images/wallets/metamask.svg',
          provider: window.ethereum
        });
      }
      
      // Check for Coinbase Wallet
      if (window.ethereum?.isCoinbaseWallet || window.coinbaseWalletExtension) {
        detected.push({
          name: 'Coinbase Wallet',
          icon: '/images/wallets/coinbase.svg',
          provider: window.ethereum || window.coinbaseWalletExtension
        });
      }
      
      // Check for Trust Wallet
      if (window.ethereum?.isTrust || window.trustWallet) {
        detected.push({
          name: 'Trust Wallet',
          icon: '/images/wallets/trust.svg',
          provider: window.ethereum || window.trustWallet
        });
      }
      
      // Generic browser wallet (if exists but not identified)
      if (window.ethereum && detected.length === 0) {
        detected.push({
          name: 'Browser Wallet',
          icon: '/images/wallets/ethereum.svg',
          provider: window.ethereum
        });
      }
      
      setAvailableWallets(detected);
    };
    
    detectWallets();
  }, []);

  // Listen for account changes and disconnection
  useEffect(() => {
    if (!window.ethereum) return;
    
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        handleDisconnect();
      } else if (accounts[0] !== address) {
        // Account was changed to a different one
        setAddress(accounts[0]);
        
        // Update the stored session with the new address
        if (hasSession) {
          const session = {
            address: accounts[0],
            timestamp: new Date().getTime()
          };
          localStorage.setItem('blockid_wallet_session', JSON.stringify(session));
        }
      }
    };
    
    const handleChainChanged = () => {
      // Reload the page when chain changes
      window.location.reload();
    };
    
    const handleDisconnect = () => {
      setAddress(null);
      setHasSession(false);
      localStorage.removeItem('blockid_wallet_session');
      logout();
    };
    
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);
    
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      window.ethereum.removeListener('disconnect', handleDisconnect);
    };
  }, [address, hasSession, logout]);

  // Check session status and automatically reconnect
  const checkSession = useCallback(async () => {
    console.log("Checking wallet session...");
    
    // Most aggressive session check - directly look for active session marker
    const sessionActive = sessionStorage.getItem('blockid_active_session');
    if (sessionActive === 'true' && window.ethereum) {
      console.log("Active session marker found, attempting immediate reconnect");
      try {
        // Try to get accounts without prompting
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          console.log("Found active accounts:", accounts[0]);
          setAddress(accounts[0]);
          setHasSession(true);
          
          // Update session storage & auth context
          sessionStorage.setItem('blockid_active_session', 'true');
          login(accounts[0]);
          
          // Force full auth completion
          sessionStorage.setItem('blockid_full_auth', 'complete');
          
          return true;
        }
        
        // If that fails, try a more aggressive approach by requesting accounts directly
        console.log("No active accounts, trying requestAccounts");
        const requestedAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (requestedAccounts && requestedAccounts.length > 0) {
          console.log("Got accounts after request:", requestedAccounts[0]);
          setAddress(requestedAccounts[0]);
          setHasSession(true);
          
          // Update session storage & auth context
          sessionStorage.setItem('blockid_active_session', 'true');
          login(requestedAccounts[0]);
          
          // Force full auth completion
          sessionStorage.setItem('blockid_full_auth', 'complete');
          
          return true;
        }
      } catch (error) {
        console.error("Failed to reconnect with active session:", error);
      }
    }
    
    // Fall back to the regular localStorage check
    console.log("Checking localStorage for wallet session");
    const storedSession = localStorage.getItem('blockid_wallet_session');
    if (!storedSession) {
      console.log("No stored wallet session found");
      return false;
    }
    
    try {
      const session = JSON.parse(storedSession);
      const now = new Date().getTime();
      
      // Session expiration check
      if (now - session.timestamp > 7 * 24 * 60 * 60 * 1000) {
        console.log("Stored session expired");
        localStorage.removeItem('blockid_wallet_session');
        sessionStorage.removeItem('blockid_active_session');
        return false;
      }
      
      console.log("Valid stored session found, attempting reconnect");
      
      // If still has wallet provider and wallet is unlocked, we can reconnect
      if (window.ethereum) {
        try {
          // Try aggressive reconnect since we have a session
          console.log("Requesting wallet accounts");
          const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' // This may show a popup
          });
          
          if (accounts && accounts.length > 0) {
            console.log("Wallet reconnected with account:", accounts[0]);
            // Even if the stored address is different, update with the current one
            setAddress(accounts[0]);
            setHasSession(true);
            
            // Update auth context
            login(accounts[0]);
            
            // Update session with latest address
            const updatedSession = {
              address: accounts[0],
              timestamp: new Date().getTime()
            };
            localStorage.setItem('blockid_wallet_session', JSON.stringify(updatedSession));
            
            // Also update session storage for quick checks during page navigation
            sessionStorage.setItem('blockid_active_session', 'true');
            sessionStorage.setItem('blockid_full_auth', 'complete');
            
            return true;
          }
        } catch (error) {
          console.error("Error during wallet reconnection:", error);
        }
      }
      
      // Keep the session alive even if we couldn't reconnect right now
      return false;
    } catch (err) {
      console.error("Failed to verify session:", err);
      localStorage.removeItem('blockid_wallet_session');
      sessionStorage.removeItem('blockid_active_session');
      return false;
    }
  }, [login]);

  // Check session on mount with auto-reconnect
  useEffect(() => {
    // Don't attempt reconnect if we already have an address
    if (!address) {
      checkSession();
    }
  }, [checkSession, address]);

  // Updated connect function that persists better
  const connect = useCallback(async (walletIndex = 0) => {
    setError(null);
    
    // If already connected, return success
    if (address) {
      return { success: true, address };
    }
    
    try {
      setIsConnecting(true);
      
      if (!window.ethereum) {
        setError("No Ethereum wallet found. Please install MetaMask or another web3 wallet.");
        return { success: false, error: "No Ethereum wallet found" };
      }
      
      // Select the wallet to use (if multiple detected)
      const provider = availableWallets.length > 0 
        ? availableWallets[walletIndex]?.provider 
        : window.ethereum;
      
      if (!provider) {
        setError("Selected wallet provider not available");
        return { success: false, error: "Provider not available" };
      }
      
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        setError("No accounts found or user rejected");
        return { success: false, error: "No accounts found" };
      }
      
      // Store wallet connection
      const newAddress = accounts[0];
      setAddress(newAddress);
      setHasSession(true);
      
      // Store in localStorage for persistence
      const session = {
        address: newAddress,
        timestamp: new Date().getTime()
      };
      localStorage.setItem('blockid_wallet_session', JSON.stringify(session));
      
      // Store in sessionStorage for navigation persistence
      sessionStorage.setItem('blockid_active_session', 'true');
      
      // Update auth context
      login(newAddress);
      
      return { success: true, address: newAddress };
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setError(error.message || "Failed to connect wallet");
      return { success: false, error: error.message };
    } finally {
      setIsConnecting(false);
    }
  }, [address, availableWallets, login]);

  // Disconnect function
  const disconnect = useCallback(() => {
    // Clean up local state
    setAddress(null);
    setHasSession(false);
    
    // Remove session from storage
    localStorage.removeItem('blockid_wallet_session');
    sessionStorage.removeItem('blockid_active_session');
    
    // Log out from auth context
    logout();
    
    // Force refresh provider state
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        // Request to deactivate the current account
        window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        }).catch(err => {
          // This may fail, but that's okay, we're just trying to force MetaMask to prompt 
          // for account selection on the next connect
          console.log("Permission request failed, this is expected:", err);
        });
        
        // Clear any cached provider state
        if (window.ethereum._state && window.ethereum._state.accounts) {
          window.ethereum._state.accounts = [];
        }
        
        // Force a manual disconnect event
        window.ethereum.emit('disconnect');
        
        console.log("Wallet disconnected successfully");
      } catch (err) {
        console.error("Error during disconnect cleanup:", err);
      }
    }
    
    return { success: true };
  }, [logout]);

  // Sign a message
  const signMessage = async (message = '') => {
    if (!address) {
      throw new Error('Wallet not connected');
    }
    
    setIsSigning(true);
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      return await signer.signMessage(message || `Verify wallet ownership at ${new Date().toISOString()}`);
    } catch (err) {
      console.error("Signing error:", err);
      throw err;
    } finally {
      setIsSigning(false);
    }
  };

  return {
    address,
    isConnecting,
    isSigning,
    connect,
    disconnect,
    error,
    availableWallets,
    hasSession,
    isConnected,
    signMessage
  };
}

// Default export for modules that expect it
export default useWalletAuth;
