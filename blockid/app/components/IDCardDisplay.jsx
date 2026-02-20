"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';

export default function DigitalIDCard({ idData }) {
  const [idCard, setIdCard] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    console.log("IDCardDisplay received data:", idData);
    // If idData prop is provided, use it
    if (idData) {
      setIdCard(idData);
      return;
    }
    
    // Otherwise try to load from localStorage
    if (isAuthenticated) {
      try {
        const savedCard = localStorage.getItem('blockid_card');
        if (savedCard) {
          setIdCard(JSON.parse(savedCard));
        }
      } catch (error) {
        console.error("Error loading ID card data:", error);
      }
    }
  }, [idData, isAuthenticated]);
  
  const handleEditCard = () => {
    router.push('/dashboard');
  };
  
  // No card data available
  if (!idCard) {
    return (
      <div className="max-w-md mx-auto bg-gray-900 p-6 rounded-xl shadow-md">
        <p className="text-center text-gray-300">No ID card data available</p>
      </div>
    );
  }
  
  // Format date to be more readable
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };
  
  // Helper function to truncate transaction hash
  const truncateHash = (hash) => {
    if (!hash) return '';
    return hash.substring(0, 10) + '...' + hash.substring(hash.length - 10);
  };
  
  return (
    <div className="max-w-md mx-auto bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-700">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white text-xl font-bold">Digital ID Card</h2>
            <p className="text-purple-200">Blockchain Verified</p>
          </div>
          <div className="flex items-center">
            {idCard.isMinted && (
              <div className="mr-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                MINTED
              </div>
            )}
            <svg width="48" height="48" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-12 w-12">
              <rect width="80" height="80" rx="40" fill="#5B21B6"/>
              <text x="40" y="48" fontFamily="Arial" fontSize="24" fill="white" textAnchor="middle">BID</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6">
        <div className="flex mb-6">
          {/* Photo Section */}
          <div className="mr-4">
            <div className="h-32 w-32 rounded-lg overflow-hidden bg-gray-800 border border-gray-600">
              {idCard.photoUrl ? (
                <img
                  src={idCard.photoUrl}
                  alt="ID Photo"
                  className="h-full w-full object-cover"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/128?text=Photo' }}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gray-700">
                  <span className="text-gray-300">No Photo</span>
                </div>
              )}
            </div>
          </div>

          {/* Identity Info */}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white">{idCard.fullName || 'Full Name'}</h3>
            <p className="text-gray-300 mb-2">{idCard.email || 'email@example.com'}</p>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-400">ID Number</p>
                <p className="font-medium text-gray-200">{idCard.idNumber || 'BID-000000'}</p>
              </div>
              <div>
                <p className="text-gray-400">Issued On</p>
                <p className="font-medium text-gray-200">{formatDate(idCard.dateOfIssue) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400">Expiry Date</p>
                <p className="font-medium text-gray-200">{formatDate(idCard.expiryDate) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400">Verification</p>
                <p className="font-medium text-green-400">✓ Verified</p>
              </div>
              
              <div>
                <p className="text-gray-400">Date of Birth</p>
                <p className="font-medium text-gray-200">{formatDate(idCard.dateOfBirth) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400">Age</p>
                <p className="font-medium text-gray-200">{idCard.age || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="border-t border-gray-700 pt-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-400">Organization</p>
              <p className="text-sm font-medium text-gray-200">{idCard.organization || 'Sepolia Network Authority'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Role</p>
              <p className="text-sm font-medium text-gray-200">{idCard.role || 'Personal ID'}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-400">Wallet Address</p>
            <p className="text-sm font-mono break-all text-gray-300">{idCard.walletAddress || '0x0000000000000000000000000000000000000000'}</p>
          </div>

          {/* QR Code Section - Always visible regardless of transaction hash */}
          <div>
            <p className="text-xs text-gray-400">Blockchain Verification</p>
            <div className="flex items-center">
              <div className="mr-2 mt-1 bg-white p-1 rounded">
                <QRCodeCanvas
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/verify?${new URLSearchParams({
                    id: idCard.idNumber || '',
                    hash: idCard.uniqueIdentityHash || '',
                    txn: idCard.blockchainTxnHash || '',
                    address: idCard.walletAddress || ''
                  }).toString()}`}
                  size={80}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="flex flex-col">
                {idCard.blockchainTxnHash ? (
                  <p className="text-xs font-mono break-all text-gray-300">{truncateHash(idCard.blockchainTxnHash)}</p>
                ) : (
                  <p className="text-xs font-mono text-gray-300">ID Verification</p>
                )}
                <p className="text-xs text-green-400 mt-1">Scan to verify authenticity</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 