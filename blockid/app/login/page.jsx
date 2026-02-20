"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ParticleNebula from '@/app/components/ParticleNebula';
import useWalletAuth from '@/app/hooks/useWalletAuth';
import { useAuth } from '@/app/contexts/AuthContext';
import dynamic from 'next/dynamic';
import LoadingScreen from '@/app/components/LoadingScreen';
import { AnimatedText, AnimatedHeading } from '@/app/components/animations/AnimatedText';
import { AnimatedSection, AnimatedCard, AnimatedButton } from '@/app/components/animations/AnimatedSection';
import { ScrollProgressBar } from '@/app/components/animations/ScrollAnimation';

// Wallet icons
const walletIcons = {
  metamask: "/wallets/metamask.svg",
  walletconnect: "/wallets/walletconnect.svg",
  coinbase: "/wallets/coinbase.svg",
  trust: "/wallets/trust.svg",
};

// Dynamically import the 3D component with a fallback
const DynamicBlockchainBackground = dynamic(
  () => import('@/app/components/BlockchainBackground').catch(() => () => null),
  { 
    ssr: false,
    loading: () => <div className="fixed top-0 left-0 w-full h-full z-0 opacity-50 pointer-events-none bg-gradient-to-br from-purple-900/10 to-violet-900/10"></div>
  }
);

export default function Login() {
  const router = useRouter();
  const { connect, isConnected, isConnecting } = useWalletAuth();
  const { user, isAuthenticated, loading, login } = useAuth();
  const [showConnect, setShowConnect] = useState(false);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [connectionStage, setConnectionStage] = useState('idle'); // idle, connecting, signing, connected
  const [isLoginSuccess, setIsLoginSuccess] = useState(false);

  useEffect(() => {
    console.log("Login page mounted, auth status:", isAuthenticated ? "authenticated" : "not authenticated");
    
    // If already authenticated, redirect to homepage
    if (isAuthenticated && !loading) {
      console.log("User is authenticated, redirecting to home page");
      router.push('/');
    } else {
      // Default to showing connect options
      setShowConnect(true);
    }
    
    // Check if the 3D component loaded successfully
    const checkBackground = async () => {
      try {
        await import('@/app/components/BlockchainBackground');
        setBackgroundLoaded(true);
      } catch (error) {
        console.error("3D background not available:", error);
        setBackgroundLoaded(false);
      }
    };
    
    checkBackground();
  }, [isAuthenticated, loading, router]);

  const handleConnect = async (walletType) => {
    try {
      setSelectedWallet(walletType);
      setConnectionStage('connecting');
      console.log(`Connecting to ${walletType} wallet`);
      
      // First connection step
      setTimeout(() => {
        setConnectionStage('signing');
        console.log("Requesting signature");
        
        // Simulate signature request with timeout
        setTimeout(async () => {
          try {
            await connect();
            setConnectionStage('connected');
            console.log("Wallet connected successfully");
            
            // Call login from auth context
            await login(walletType, "ethereum");
            
            // Show the success loading screen
            setTimeout(() => {
              setIsLoginSuccess(true);
              console.log("Login successful, showing success screen");
            }, 800);
          } catch (error) {
            console.error("Connection error:", error);
            setConnectionStage('idle');
            setSelectedWallet(null);
          }
        }, 1500);
      }, 1000);
    } catch (error) {
      console.error("Connection error:", error);
      setConnectionStage('idle');
      setSelectedWallet(null);
    }
  };

  // Handle loading complete after successful login
  const handleLoginLoadingComplete = () => {
    console.log("Login success screen complete, redirecting to home");
    router.push('/');
  };

  // If still checking auth status, show loading
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-purple-500 rounded-full border-t-transparent"></div>
    </div>;
  }
  
  // Show success loading screen after login
  if (isLoginSuccess) {
    return <LoadingScreen onLoadingComplete={handleLoginLoadingComplete} />;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="wave-bg"></div>
      <div className="blockchain-nodes"></div>
      
      {/* Full-page Particle Nebula for top coverage */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ParticleNebula expandTop={true} className="z-0" />
      </div>
      
      {/* Fallback background if 3D isn't available */}
      {!backgroundLoaded && (
        <div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none">
          {/* Gradient orbs */}
          <div className="absolute top-1/4 left-1/5 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-violet-600/10 blur-3xl"></div>
          <div className="absolute top-2/3 left-1/2 w-64 h-64 rounded-full bg-indigo-600/10 blur-3xl"></div>
        </div>
      )}
      
      {/* Try to render 3D background */}
      <DynamicBlockchainBackground />
      
      {/* Logo */}
      <div className="fixed top-8 left-8 z-20 flex items-center space-x-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center">
          <span className="text-white font-bold text-lg">ID</span>
        </div>
        <span className="text-xl font-bold text-white">BlockID</span>
      </div>
      
      {/* Sepolia Network Indicator */}
      <div className="fixed top-8 right-8 z-20 flex items-center px-3 py-1 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-mono">
        <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
        Sepolia Testnet
      </div>
      
      {/* Login Container */}
      <div className="container relative z-10 px-4">
        <div className="max-w-md mx-auto">
          {/* Login Card */}
          <div className="glass-card p-8 md:p-10 relative overflow-hidden">
            {/* Particle effect inside the card */}
            <div className="absolute inset-0 z-0">
              <ParticleNebula expandTop={false} className="z-0" />
            </div>
            
            <div className="relative z-10">
              {/* Card content */}
              <AnimatedHeading 
                text="Welcome to BlockID"
                className="text-3xl font-bold mb-2 gradient-text text-center"
              />
              <AnimatedText className="text-center text-[var(--muted-foreground)] mb-8" delay={0.2}>
                <p>Connect your wallet to access secure digital identity on Sepolia testnet</p>
              </AnimatedText>
              
              {showConnect ? (
                <>
                  <div className="space-y-3 mb-6">
                    {/* Wallet options */}
                    <AnimatedCard 
                      className={`w-full flex items-center justify-between p-4 rounded-lg bg-[var(--card)] border border-[var(--border)] hover:border-purple-500 transition-all duration-200 ${selectedWallet === 'metamask' ? 'border-purple-500 ring-2 ring-purple-500/20' : ''}`}
                      delay={0.1}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 mr-3 rounded-full bg-[#f6851b] flex items-center justify-center p-1">
                          <svg viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                            <path d="M32.9582 1L19.8241 10.7183L22.2665 5.09082L32.9582 1Z" fill="white" stroke="white" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2.04187 1L15.0487 10.809L12.7335 5.09082L2.04187 1Z" fill="white" stroke="white" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M28.2451 23.5329L24.7 28.872L32.2611 30.9264L34.4 23.6569L28.2451 23.5329Z" fill="white" stroke="white" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M0.60994 23.6569L2.73895 30.9264L10.3 28.872L6.75494 23.5329L0.60994 23.6569Z" fill="white" stroke="white" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M9.89752 14.5149L7.81494 17.6507L15.2964 17.9828L15.0316 9.98291L9.89752 14.5149Z" fill="white" stroke="white" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M25.1025 14.5149L19.8966 9.86896L19.7585 17.9828L27.2852 17.6507L25.1025 14.5149Z" fill="white" stroke="white" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M10.3 28.872L14.8189 26.7031L10.9222 23.6978L10.3 28.872Z" fill="white" stroke="white" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M20.1811 26.7031L24.7 28.872L24.0778 23.6978L20.1811 26.7031Z" fill="white" stroke="white" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span className="font-medium">MetaMask</span>
                      </div>
                      <div className="flex items-center">
                        {selectedWallet === 'metamask' && connectionStage !== 'idle' && (
                          <div className="flex items-center mr-3">
                            {connectionStage === 'connecting' && (
                              <span className="text-xs text-purple-400">Connecting...</span>
                            )}
                            {connectionStage === 'signing' && (
                              <span className="text-xs text-purple-400">Sign message in wallet...</span>
                            )}
                            {connectionStage === 'connected' && (
                              <span className="text-xs text-green-400">Connected ✓</span>
                            )}
                          </div>
                        )}
                        <span className="text-[var(--muted-foreground)] text-sm">Popular</span>
                      </div>
                    </AnimatedCard>
                    
                    <AnimatedCard 
                      className={`w-full flex items-center justify-between p-4 rounded-lg bg-[var(--card)] border border-[var(--border)] hover:border-purple-500 transition-all duration-200 ${selectedWallet === 'walletconnect' ? 'border-purple-500 ring-2 ring-purple-500/20' : ''}`}
                      delay={0.2}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 mr-3 rounded-full bg-[#3b99fc] flex items-center justify-center p-1">
                          <svg width="28" height="20" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                            <path d="M25.4412 24.3557C42.7866 7.01089 71.295 7.01422 88.6361 24.3593C90.2733 25.9965 93.3433 25.9925 94.9757 24.3589C96.6081 22.7253 96.604 19.654 94.9669 18.0168C73.7477 -3.20565 40.3098 -3.20565 19.0906 18.0168C17.4534 19.654 17.4494 22.7253 19.0818 24.3589C20.7141 25.9925 23.7841 25.9965 25.4212 24.3593L25.4412 24.3557Z" fill="white"/>
                            <path d="M18.0287 94.9736C19.6623 96.606 22.7335 96.6027 24.3714 94.9648C26.0092 93.327 26.006 90.2558 24.3723 88.6234C7.02702 71.2821 7.02702 42.7736 24.3723 25.4322C26.006 23.7998 26.0092 20.7287 24.3714 19.0908C22.7335 17.453 19.6623 17.4496 18.0287 19.082C-3.2001 40.3146 -3.2001 73.7411 18.0287 94.9736Z" fill="white"/>
                            <path d="M70.5787 88.6234C68.9451 90.2558 68.9418 93.327 70.5797 94.9648C72.2175 96.6027 75.2886 96.606 76.9223 94.9736C98.1511 73.7411 98.1511 40.3146 76.9223 19.082C75.2886 17.4496 72.2175 17.453 70.5797 19.0908C68.9418 20.7287 68.9451 23.7998 70.5787 25.4322C87.9241 42.7736 87.9241 71.2821 70.5787 88.6234Z" fill="white"/>
                            <path d="M25.4412 94.8904C23.804 96.5276 20.734 96.5235 19.1017 94.8899C17.4693 93.2563 17.4734 90.1851 19.1105 88.5479C40.3297 67.3254 73.7676 67.3254 94.9868 88.5479C96.624 90.1851 96.628 93.2563 94.9957 94.8899C93.3633 96.5235 90.2933 96.5276 88.6561 94.8904C71.3108 77.5455 42.8024 77.5489 25.4612 94.894L25.4412 94.8904Z" fill="white"/>
                          </svg>
                        </div>
                        <span className="font-medium">WalletConnect</span>
                      </div>
                      <div className="flex items-center">
                        {selectedWallet === 'walletconnect' && connectionStage !== 'idle' && (
                          <div className="flex items-center mr-3">
                            {connectionStage === 'connecting' && (
                              <span className="text-xs text-purple-400">Connecting...</span>
                            )}
                            {connectionStage === 'signing' && (
                              <span className="text-xs text-purple-400">Sign message in wallet...</span>
                            )}
                            {connectionStage === 'connected' && (
                              <span className="text-xs text-green-400">Connected ✓</span>
                            )}
                          </div>
                        )}
                        <span className="text-[var(--muted-foreground)] text-sm">Mobile</span>
                      </div>
                    </AnimatedCard>
                    
                    <AnimatedCard 
                      className={`w-full flex items-center justify-between p-4 rounded-lg bg-[var(--card)] border border-[var(--border)] hover:border-purple-500 transition-all duration-200 ${selectedWallet === 'coinbase' ? 'border-purple-500 ring-2 ring-purple-500/20' : ''}`}
                      delay={0.3}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 mr-3 rounded-full bg-[#0052ff] flex items-center justify-center p-1">
                          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 28C21.732 28 28 21.732 28 14C28 6.26801 21.732 0 14 0C6.26801 0 0 6.26801 0 14C0 21.732 6.26801 28 14 28Z" fill="#0052FF"/>
                            <path d="M14.2856 21C17.8878 21 20.8095 18.0783 20.8095 14.4762C20.8095 10.874 17.8878 7.95239 14.2856 7.95239C10.6835 7.95239 7.76184 10.874 7.76184 14.4762C7.76184 18.0783 10.6835 21 14.2856 21Z" fill="white"/>
                          </svg>
                        </div>
                        <span className="font-medium">Coinbase Wallet</span>
                      </div>
                      <div className="flex items-center">
                        {selectedWallet === 'coinbase' && connectionStage !== 'idle' && (
                          <div className="flex items-center mr-3">
                            {connectionStage === 'connecting' && (
                              <span className="text-xs text-purple-400">Connecting...</span>
                            )}
                            {connectionStage === 'signing' && (
                              <span className="text-xs text-purple-400">Sign message in wallet...</span>
                            )}
                            {connectionStage === 'connected' && (
                              <span className="text-xs text-green-400">Connected ✓</span>
                            )}
                          </div>
                        )}
                        <span className="text-[var(--muted-foreground)] text-sm">Mobile & Desktop</span>
                      </div>
                    </AnimatedCard>
                  </div>
                  
                  <div className="text-center text-sm text-[var(--muted-foreground)]">
                    <p>Don't have ETH on Sepolia? <a href="https://sepoliafaucet.com/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">Get testnet ETH</a></p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-6">
                  <AnimatedButton 
                    className="btn-primary px-6 py-3"
                    onClick={() => setShowConnect(true)}
                  >
                    Connect Wallet
                  </AnimatedButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ScrollProgressBar color="#8b5cf6" height={3} />
    </main>
  );
} 