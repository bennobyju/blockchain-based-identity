"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import CoinbaseIndex from '../components/CoinbaseIndex';
import dynamic from 'next/dynamic';

// Dynamically import just one background component for better performance
const ParticleNebula = dynamic(
  () => import('../components/ParticleNebula'),
  {
    ssr: false,
    loading: () => <div className="fixed top-0 left-0 w-full h-full z-0 opacity-50 pointer-events-none bg-gradient-to-br from-purple-900/10 to-violet-900/10"></div>
  }
);

export default function CoinbasePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate loading and hide loading state after 1 second
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen flex flex-col relative">
      {/* Simplified Background - use only one effect for performance */}
      <div className="wave-bg"></div>
      
      {/* Use a simplified fixed background for better performance */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-br from-purple-900/5 to-violet-900/5">
        <div className="absolute top-1/4 left-1/5 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-violet-600/10 blur-3xl"></div>
      </div>

      <Navbar />

      {/* Main Content */}
      <section className="relative py-16 md:py-20 px-4 flex items-center justify-center overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          {/* Simplified Header */}
          <div className="text-center relative mb-10">
            <div className="relative">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 gradient-text relative z-10">
                Cryptocurrency Market
              </h1>
              <p className="text-lg mb-6 text-[var(--muted-foreground)] max-w-2xl mx-auto relative z-10">
                Live prices and market data
              </p>
            </div>
          </div>

          {/* Preload indicator for better UX */}
          {loading ? (
            <div className="glass-card p-8 text-center">
              <div className="flex justify-center items-center">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                <p>Loading cryptocurrency data...</p>
              </div>
            </div>
          ) : (
            <CoinbaseIndex />
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-[var(--border)] mt-auto">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">ID</span>
              </div>
              <span className="text-lg font-bold">BlockID</span>
            </div>

            <div className="text-center md:text-right text-[var(--muted-foreground)] text-sm">
              <p>© {new Date().getFullYear()} BlockID. All rights reserved.</p>
              <p>Powered by Ethereum Blockchain</p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
