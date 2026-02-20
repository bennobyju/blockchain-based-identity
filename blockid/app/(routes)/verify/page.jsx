"use client";

import { useState, useEffect } from 'react';
import { useWalletAuth } from '@/app/hooks/useWalletAuth';
import { 
  getIdentityById, 
  getIdentityByOwner, 
  verifyIdentityHash,
  verifyDownloadedID
} from '@/utils/blockchain';
import { formatDate, timestampToDate } from '@/utils/formatting';
import IDCard from '@/app/components/IDCard';
import { QRCodeCanvas } from 'qrcode.react';
import { useRouter } from 'next/navigation';

export default function VerifyPage() {
  const { address } = useWalletAuth();
  const router = useRouter();
  const [verificationMethod, setVerificationMethod] = useState('id'); // 'id' or 'address'
  const [idNumber, setIdNumber] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [verificationHash, setVerificationHash] = useState('');
  const [identity, setIdentity] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);

  // Check for URL parameters from QR code scan
  useEffect(() => {
    const checkURLParams = async () => {
      if (typeof window !== 'undefined') {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hash = urlParams.get('hash');
        const txn = urlParams.get('txn');
        const address = urlParams.get('address');
        const id = urlParams.get('id');
        
        if (hash || txn || address || id) {
          setIsAutoVerifying(true);
          
          if (hash) {
            setVerificationMethod('hash');
            setVerificationHash(hash);
          } else if (address) {
            setVerificationMethod('address');
            setOwnerAddress(address);
          } else if (id) {
            setVerificationMethod('id');
            setIdNumber(id.replace('BID-', ''));
          }
          
          // Auto-verify after a short delay
          setTimeout(() => {
            handleVerify();
            setIsAutoVerifying(false);
          }, 1000);
        }
      }
    };
    
    checkURLParams();
  }, []);

  // Check for URL parameters from QR code scan
  const handleVerify = async () => {
    try {
      setIsLoading(true);
      setError('');
      setIdentity(null);
      setVerificationResult(null);
      
      let fetchedIdentity;
      
      if (verificationMethod === 'id') {
        if (!idNumber || (isNaN(parseInt(idNumber.replace('BID-', ''))) && isNaN(parseInt(idNumber)))) {
          throw new Error('Please enter a valid ID number');
        }
        
        // Clean the ID number if it has BID- prefix
        const cleanId = idNumber.startsWith('BID-') ? idNumber : `BID-${idNumber}`;
        
        // Try to verify using downloaded ID verification first (works with offline IDs)
        const downloadedIdResult = await verifyDownloadedID(cleanId, ownerAddress);
        
        if (downloadedIdResult.success && downloadedIdResult.verified) {
          // ID was verified locally
          fetchedIdentity = downloadedIdResult.identity;
          setVerificationResult({
            isValid: true,
            message: downloadedIdResult.message || 'ID verified successfully.'
          });
        } else {
          // Fallback to blockchain verification
          fetchedIdentity = await getIdentityById(parseInt(idNumber.replace('BID-', '')));
        }
      } else if (verificationMethod === 'address') {
        if (!ownerAddress || !ownerAddress.startsWith('0x')) {
          throw new Error('Please enter a valid Ethereum address');
        }
        
        // Try to verify any ID owned by this address from local storage first
        const downloadedIdResult = await verifyDownloadedID(null, ownerAddress);
        
        if (downloadedIdResult.success && downloadedIdResult.verified) {
          // ID was verified locally
          fetchedIdentity = downloadedIdResult.identity;
          setVerificationResult({
            isValid: true,
            message: downloadedIdResult.message || 'ID verified successfully for this wallet.'
          });
        } else {
          // Fallback to blockchain verification
          fetchedIdentity = await getIdentityByOwner(ownerAddress);
        }
      } else if (verificationMethod === 'hash') {
        if (!verificationHash) {
          throw new Error('Please enter a valid verification hash');
        }
        
        const result = await verifyIdentityHash(verificationHash);
        if (result && result.isValid) {
          fetchedIdentity = await getIdentityById(result.idNumber);
          setVerificationResult({
            isValid: true,
            message: 'The hash is valid for this identity.'
          });
        } else {
          setVerificationResult({
            isValid: false,
            message: 'Invalid or unregistered hash. This ID does not exist or has been tampered with.'
          });
        }
      }
      
      if (fetchedIdentity) {
        // Process dates from timestamp if needed
        if (fetchedIdentity.createdAt && typeof fetchedIdentity.createdAt === 'number') {
          fetchedIdentity.createdAt = timestampToDate(fetchedIdentity.createdAt);
        }
        if (fetchedIdentity.expiresAt && typeof fetchedIdentity.expiresAt === 'number') {
          fetchedIdentity.expiresAt = timestampToDate(fetchedIdentity.expiresAt);
        }
        
        setIdentity(fetchedIdentity);
      } else {
        throw new Error('No identity found with the provided information');
      }
      
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message || 'An error occurred during verification');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to display blockchain verification status
  const displayBlockchainStatus = () => {
    if (!identity) return null;
    
    return (
      <div className="mt-6 rounded-lg overflow-hidden shadow-lg">
        <div className="bg-blue-900 px-4 py-3">
          <h3 className="text-white font-bold">Blockchain Verification Details</h3>
        </div>
        <div className="bg-gray-800 p-4 text-gray-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Blockchain Status</p>
              <p className="text-base text-green-400 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified on Sepolia Network
              </p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500">Owner Wallet</p>
              <p className="text-sm font-mono break-all">{identity.walletAddress || "Not available"}</p>
            </div>
          </div>
          
          {identity.blockchainTxnHash && (
            <div className="mt-4">
              <p className="text-xs text-gray-500">Transaction Hash</p>
              <a 
                href={`https://sepolia.etherscan.io/tx/${identity.blockchainTxnHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono text-blue-400 hover:text-blue-300 break-all"
              >
                {identity.blockchainTxnHash}
              </a>
            </div>
          )}
          
          <div className="mt-4">
            <p className="text-xs text-gray-500">Identity Hash</p>
            <p className="text-sm font-mono break-all">{identity.uniqueIdentityHash || "Not available"}</p>
          </div>
          
          <div className="mt-4">
            <p className="text-xs text-gray-500">Verification Method</p>
            <p className="text-sm">
              {verificationMethod === 'id' && 'ID Number Verification'}
              {verificationMethod === 'address' && 'Wallet Address Verification'}
              {verificationMethod === 'hash' && 'Identity Hash Verification'}
            </p>
          </div>
          
          <div className="mt-4">
            <p className="text-xs text-gray-500">Verified At</p>
            <p className="text-sm">{new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Verify Digital ID</h1>
      
      {isAutoVerifying ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying ID from QR code...</p>
        </div>
      ) : !identity ? (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Enter Verification Details</h2>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Verification Method</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setVerificationMethod('id')}
                className={`px-4 py-2 rounded-md ${verificationMethod === 'id' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                ID Number
              </button>
              <button
                onClick={() => setVerificationMethod('address')}
                className={`px-4 py-2 rounded-md ${verificationMethod === 'address' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Wallet Address
              </button>
              <button
                onClick={() => setVerificationMethod('hash')}
                className={`px-4 py-2 rounded-md ${verificationMethod === 'hash' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Verification Hash
              </button>
            </div>
          </div>
          
          {verificationMethod === 'id' && (
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">ID Number</label>
              <input
                type="number"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="Enter ID number (e.g., 42)"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          
          {verificationMethod === 'address' && (
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Wallet Address</label>
              <input
                type="text"
                value={ownerAddress}
                onChange={(e) => setOwnerAddress(e.target.value)}
                placeholder="Enter Ethereum wallet address (0x...)"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          
          {verificationMethod === 'hash' && (
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Verification Hash</label>
              <input
                type="text"
                value={verificationHash}
                onChange={(e) => setVerificationHash(e.target.value)}
                placeholder="Enter identity verification hash"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              onClick={handleVerify}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Verify ID'}
            </button>
          </div>
          
          {error && (
            <div className="mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
              <p>{error}</p>
            </div>
          )}
          
          {verificationResult && (
            <div className={`mt-6 p-4 ${verificationResult.isValid ? 'bg-green-100 border-l-4 border-green-500 text-green-700' : 'bg-red-100 border-l-4 border-red-500 text-red-700'}`}>
              <p>{verificationResult.message}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-white text-xl font-bold">Verified Digital ID</h2>
                {identity.isMinted && (
                  <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    VERIFIED
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-800 mb-2">ID Information</h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="font-medium">{identity.fullName || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">ID Number</p>
                        <p className="font-medium">{identity.idNumber || 'Not available'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Issue Date</p>
                        <p className="font-medium">{formatDate(identity.dateOfIssue) || 'Not available'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Expiry Date</p>
                        <p className="font-medium">{formatDate(identity.expiryDate) || 'Not available'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="md:w-2/3">
                  {displayBlockchainStatus()}
                  
                  <div className="mt-6 flex gap-4">
                    <button
                      onClick={() => {
                        setIdentity(null);
                        setVerificationResult(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Verify Another ID
                    </button>
                    {identity.blockchainTxnHash && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${identity.blockchainTxnHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        View on Etherscan
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 