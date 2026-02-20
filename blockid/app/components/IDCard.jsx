"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { fetchFromIPFS } from '@/utils/ipfs';

export default function IDCard({ idNumber, identity, showActions = false, onVerify, onRevoke }) {
  const [idData, setIdData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("ID Card received data:", identity);
    const loadIDData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // If identity is passed directly, use it
        if (identity) {
          setIdData(identity);
          setLoading(false);
          return;
        }
        
        // Otherwise try to fetch from IPFS (in a real app)
        // This is a placeholder for actual IPFS fetching logic
        const data = await fetchFromIPFS(idNumber);
        setIdData(data);
      } catch (err) {
        console.error("Error loading ID data:", err);
        setError("Failed to load ID data");
      } finally {
        setLoading(false);
      }
    };
    
    loadIDData();
  }, [identity, idNumber]);
  
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
  
  if (loading) {
    return <div className="p-6 bg-gray-900 rounded-lg shadow-md">Loading ID card...</div>;
  }
  
  if (error || !idData) {
    return <div className="p-6 bg-gray-900 rounded-lg shadow-md text-gray-300">{error || "ID data not available"}</div>;
  }
  
  return (
    <div className="p-6 bg-gray-900 rounded-lg shadow-md border border-gray-700">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Photo and QR Code section */}
        <div className="w-full md:w-1/3 flex flex-col items-center space-y-4">
          {/* Photo */}
          <div className="w-32 h-32 bg-gray-800 border border-gray-600 rounded-lg overflow-hidden">
            {idData.photoUrl ? (
              <img 
                src={idData.photoUrl} 
                alt="ID Photo" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/150?text=No+Photo';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-700">
                <span className="text-gray-400">No Photo</span>
              </div>
            )}
          </div>
          
          {/* QR Code */}
          <div className="flex flex-col items-center">
            <div className="bg-white p-2 rounded">
              <QRCodeSVG 
                value={`https://blockid.app/verify/${idNumber}`} 
                size={96}
              />
            </div>
            <span className="text-sm text-gray-400 mt-2">Scan to verify</span>
          </div>
        </div>

        {/* ID Details */}
        <div className="w-full md:w-2/3">
          <h2 className="text-2xl font-bold mb-1 text-white">
            {idData.fullName || `${idData.firstName || ''} ${idData.lastName || ''}`}
          </h2>
          <h3 className="text-lg text-gray-400 mb-4">
            {idData.role || identity.idType?.charAt(0).toUpperCase() + identity.idType?.slice(1).replace('_', ' ') || "Personal ID"}
          </h3>

          {/* ID Info */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-400">ID Number:</span>
              <span className="font-mono text-gray-200">{idNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Date of Birth:</span>
              <span className="text-gray-200">{formatDate(idData.dateOfBirth) || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Age:</span>
              <span className="text-gray-200">{idData.age || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Issue Date:</span>
              <span className="text-gray-200">{formatDate(idData.dateOfIssue || idData.createdAt) || "N/A"}</span>
            </div>
            {(identity.expiresAt || idData.expiryDate) && (
              <div className="flex justify-between">
                <span className="text-gray-400">Expiry Date:</span>
                <span className="text-gray-200">{formatDate(identity.expiresAt || idData.expiryDate) || "N/A"}</span>
              </div>
            )}
            {idData.additionalInfo && (
              <div className="pt-2 border-t border-gray-700">
                <span className="text-gray-400 block mb-1">Additional Info:</span>
                <p className="text-gray-200">{idData.additionalInfo}</p>
              </div>
            )}
          </div>

          {/* Transaction Hash */}
          {idData.blockchainTxnHash && (
            <div className="flex flex-col mb-4 pt-2 border-t border-gray-700">
              <span className="text-gray-400 text-sm">Transaction Hash:</span>
              <span className="font-mono text-xs truncate text-gray-300">{idData.blockchainTxnHash}</span>
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex gap-3 mt-4">
              {!identity.isVerified && onVerify && (
                <button
                  onClick={() => onVerify(idNumber)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex-1"
                >
                  Verify ID
                </button>
              )}
              {onRevoke && (
                <button
                  onClick={() => onRevoke(idNumber)}
                  className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded flex-1"
                >
                  Revoke ID
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 