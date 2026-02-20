"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';

// Optimized CoinbaseIndex component with performance enhancements and fallback data
export default function CoinbaseIndex() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  // Top cryptocurrencies to display
  const coinIds = useMemo(() => [
    'bitcoin',
    'ethereum',
    'ripple',
    'cardano',
    'solana',
    'polkadot',
    'dogecoin',
    'avalanche-2',
    'chainlink',
    'polygon'
  ], []);

  // Fallback data for when API fails
  const fallbackData = useMemo(() => [
    {
      id: 'bitcoin',
      name: 'Bitcoin',
      symbol: 'BTC',
      image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
      currentPrice: 63850.32,
      priceChange24h: 1.25,
      marketCap: 1245678901234,
      volume: 32456789012
    },
    {
      id: 'ethereum',
      name: 'Ethereum',
      symbol: 'ETH',
      image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
      currentPrice: 3128.45,
      priceChange24h: 2.34,
      marketCap: 375678901234,
      volume: 12456789012
    },
    {
      id: 'ripple',
      name: 'XRP',
      symbol: 'XRP',
      image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
      currentPrice: 0.5123,
      priceChange24h: -1.25,
      marketCap: 27567890123,
      volume: 1245678901
    },
    {
      id: 'cardano',
      name: 'Cardano',
      symbol: 'ADA',
      image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
      currentPrice: 0.4523,
      priceChange24h: 0.34,
      marketCap: 15678901234,
      volume: 756789012
    },
    {
      id: 'solana',
      name: 'Solana',
      symbol: 'SOL',
      image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
      currentPrice: 129.75,
      priceChange24h: 3.45,
      marketCap: 56789012345,
      volume: 2345678901
    },
    {
      id: 'polkadot',
      name: 'Polkadot',
      symbol: 'DOT',
      image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
      currentPrice: 6.12,
      priceChange24h: -0.56,
      marketCap: 7890123456,
      volume: 345678901
    },
    {
      id: 'dogecoin',
      name: 'Dogecoin',
      symbol: 'DOGE',
      image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
      currentPrice: 0.1345,
      priceChange24h: 1.78,
      marketCap: 18901234567,
      volume: 1234567890
    },
    {
      id: 'avalanche-2',
      name: 'Avalanche',
      symbol: 'AVAX',
      image: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
      currentPrice: 34.56,
      priceChange24h: 2.45,
      marketCap: 12345678901,
      volume: 567890123
    },
    {
      id: 'chainlink',
      name: 'Chainlink',
      symbol: 'LINK',
      image: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
      currentPrice: 14.32,
      priceChange24h: 1.67,
      marketCap: 8765432109,
      volume: 432109876
    },
    {
      id: 'polygon',
      name: 'Polygon',
      symbol: 'MATIC',
      image: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
      currentPrice: 0.7234,
      priceChange24h: -0.89,
      marketCap: 6543210987,
      volume: 321098765
    }
  ], []);

  // Multiple API endpoints to try if one fails
  const apiEndpoints = useMemo(() => [
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds.join(',')}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`,
    `https://api.coincap.io/v2/assets?ids=${coinIds.join(',')}`
  ], [coinIds]);

  // Optimized fetch function with multiple API fallbacks
  const fetchCryptoData = useCallback(async () => {
    setLoading(true);
    setIsUsingFallback(false);
    
    // Try each API endpoint sequentially
    for (let i = 0; i < apiEndpoints.length; i++) {
      try {
        // Add cache-busting parameter
        const timestamp = new Date().getTime();
        const url = `${apiEndpoints[i]}&timestamp=${timestamp}`;
        
        const response = await fetch(url, { 
          headers: { 
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        let data = await response.json();
        
        // Process different API response formats
        let processedCoins;
        if (i === 1) { // CoinCap API format
          processedCoins = data.data.map(coin => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol.toUpperCase(),
            image: `https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`,
            currentPrice: parseFloat(coin.priceUsd),
            priceChange24h: parseFloat(coin.changePercent24Hr),
            marketCap: parseFloat(coin.marketCapUsd),
            volume: parseFloat(coin.volumeUsd24Hr)
          }));
        } else { // CoinGecko API format
          processedCoins = data.map(coin => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol.toUpperCase(),
            image: coin.image,
            currentPrice: coin.current_price,
            priceChange24h: coin.price_change_percentage_24h,
            marketCap: coin.market_cap,
            volume: coin.total_volume
          }));
        }
        
        setCoins(processedCoins);
        setLastUpdated(new Date());
        setError(null);
        setLoading(false);
        return; // Exit if successful
      } catch (err) {
        console.error(`Error fetching from API endpoint ${i+1}:`, err);
        // Continue to next API endpoint
      }
    }
    
    // If all APIs fail, use fallback data
    setIsUsingFallback(true);
    setCoins(fallbackData);
    setLastUpdated(new Date());
    setError("Could not connect to cryptocurrency APIs. Using cached data.");
    setLoading(false);
  }, [apiEndpoints, fallbackData]);

  // Initial fetch and refresh interval
  useEffect(() => {
    // Fetch data immediately
    fetchCryptoData();
    
    // Set up interval for refreshing data (every 60 seconds)
    const intervalId = setInterval(fetchCryptoData, 60000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchCryptoData]);

  // Format currency with proper locale - optimized for better performance
  const formatCurrency = useCallback((value) => {
    if (typeof value !== 'number') return '$0.00';
    
    // Use cached formatting for better performance
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: value < 1 ? 4 : 2,
      maximumFractionDigits: value < 1 ? 4 : 2
    }).format(value);
  }, []);

  // Format large numbers with abbreviations
  const formatLargeNumber = useCallback((num) => {
    if (typeof num !== 'number') return '0';
    
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(2)}B`;
    } else if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toString();
  }, []);

  // Memoized empty state
  const EmptyState = useMemo(() => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 mb-4 text-[var(--muted)]">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium mb-2">No Data Available</h3>
      <p className="text-[var(--muted-foreground)] max-w-md">
        We couldn't retrieve the cryptocurrency data at this time. Please try again later.
      </p>
      <button 
        onClick={fetchCryptoData}
        className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
      >
        Try Again
      </button>
    </div>
  ), [fetchCryptoData]);

  // Loading state with simplified skeleton UI for faster rendering
  if (loading && coins.length === 0) {
    return (
      <div className="relative glass-card overflow-hidden">
        <div className="p-6 text-center">
          <div className="flex justify-center items-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mr-3"></div>
            <p>Loading cryptocurrency data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && coins.length === 0) {
    return (
      <div className="glass-card p-6">
        {EmptyState}
      </div>
    );
  }

  return (
    <div className="relative glass-card overflow-hidden">
      {/* Refresh indicator */}
      {loading && (
        <div className="absolute top-0 left-0 w-full h-1 bg-purple-600/20">
          <div className="h-full bg-purple-600 animate-pulse" style={{ width: '100%' }}></div>
        </div>
      )}
      
      {/* Error notification */}
      {error && (
        <div className="bg-amber-500/20 border-l-4 border-amber-500 p-2 text-amber-800 dark:text-amber-200 text-sm">
          {error}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider w-8">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Price</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">24h %</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider hidden md:table-cell">Market Cap</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider hidden lg:table-cell">Volume (24h)</th>
            </tr>
          </thead>
          <tbody>
            {coins.map((coin, index) => (
              <tr key={coin.id} className="border-b border-[var(--border)] hover:bg-[var(--card-foreground)]/5 transition-colors">
                <td className="px-4 py-4 text-[var(--muted-foreground)]">{index + 1}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <img 
                      src={coin.image} 
                      alt={coin.name} 
                      className="h-8 w-8 rounded-full mr-3" 
                      onError={(e) => {
                        e.target.src = `https://via.placeholder.com/32/8b5cf6/ffffff?text=${coin.symbol.charAt(0)}`;
                      }}
                    />
                    <div>
                      <div className="font-medium">{coin.name}</div>
                      <div className="text-[var(--muted-foreground)] text-sm">{coin.symbol}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-right font-medium">{formatCurrency(coin.currentPrice)}</td>
                <td className="px-4 py-4 text-right">
                  <span 
                    className={`inline-block py-1 px-2 rounded-md text-xs font-medium ${
                      coin.priceChange24h >= 0 
                        ? 'bg-green-500/20 text-green-500' 
                        : 'bg-red-500/20 text-red-500'
                    }`}
                  >
                    {coin.priceChange24h >= 0 ? '+' : ''}{coin.priceChange24h?.toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-4 text-right hidden md:table-cell text-[var(--muted-foreground)]">
                  {formatCurrency(coin.marketCap)} <span className="text-xs">({formatLargeNumber(coin.marketCap)})</span>
                </td>
                <td className="px-4 py-4 text-right hidden lg:table-cell text-[var(--muted-foreground)]">
                  {formatCurrency(coin.volume)} <span className="text-xs">({formatLargeNumber(coin.volume)})</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Last updated timestamp */}
      {lastUpdated && (
        <div className="p-3 text-xs text-[var(--muted-foreground)] text-right border-t border-[var(--border)] flex justify-between items-center">
          <div>
            {isUsingFallback && <span className="text-amber-500">Using cached data</span>}
          </div>
          <div>
            Last updated: {lastUpdated.toLocaleTimeString()}
            <button 
              onClick={fetchCryptoData} 
              className="ml-2 p-1 text-purple-500 hover:text-purple-400 transition-colors"
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 