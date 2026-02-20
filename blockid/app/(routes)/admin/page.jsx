"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useWalletAuth from '@/app/hooks/useWalletAuth';
import { 
  isAdmin, 
  getPendingRequests,
  getRequestDetails,
  approveIDRequest,
  rejectIDRequest
} from '@/utils/blockchain';
import { formatDuration } from '@/utils/formatting';

export default function AdminPage() {
  const router = useRouter();
  const { address, isConnected, connect, isConnecting, hasSession } = useWalletAuth();
  
  const [isAdminWallet, setIsAdminWallet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestDetails, setRequestDetails] = useState({});
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [expiryDuration, setExpiryDuration] = useState('30'); // Default 30 days
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingRequestId, setProcessingRequestId] = useState(null);

  // Check if connected wallet is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (address) {
        try {
          const adminStatus = await isAdmin(address);
          setIsAdminWallet(adminStatus);
          
          if (!adminStatus) {
            setError('Access denied. This wallet does not have admin privileges.');
          } else {
            loadPendingRequests();
          }
        } catch (err) {
          console.error("Error checking admin status:", err);
          setError('Failed to verify admin status. Please try again.');
        }
        setIsLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [address]);

  // Load pending ID requests
  const loadPendingRequests = async () => {
    try {
      setIsLoading(true);
      const requests = await getPendingRequests();
      setPendingRequests(requests);
      
      // Load details for each request
      const detailsPromises = requests.map(id => getRequestDetails(id));
      const allDetails = await Promise.all(detailsPromises);
      
      const detailsMap = {};
      requests.forEach((id, index) => {
        detailsMap[id] = allDetails[index];
      });
      
      setRequestDetails(detailsMap);
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading pending requests:", err);
      setError('Failed to load pending requests. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle request approval
  const handleApprove = async (requestId) => {
    try {
      setProcessingRequestId(requestId);
      setError('');
      setSuccessMessage('');
      
      // Convert days to seconds
      const durationInSeconds = parseInt(expiryDuration) * 24 * 60 * 60;
      
      const idNumber = await approveIDRequest(requestId, durationInSeconds);
      setSuccessMessage(`Request #${requestId} approved! ID #${idNumber} created successfully.`);
      
      // Refresh the pending requests list
      await loadPendingRequests();
    } catch (err) {
      console.error("Error approving request:", err);
      setError(`Failed to approve request #${requestId}. ${err.message}`);
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Handle request rejection
  const handleReject = async (requestId) => {
    try {
      setProcessingRequestId(requestId);
      setError('');
      setSuccessMessage('');
      
      if (!rejectionReason) {
        setError('Please provide a reason for rejection.');
        setProcessingRequestId(null);
        return;
      }
      
      await rejectIDRequest(requestId, rejectionReason);
      setSuccessMessage(`Request #${requestId} rejected.`);
      setRejectionReason('');
      
      // Refresh the pending requests list
      await loadPendingRequests();
    } catch (err) {
      console.error("Error rejecting request:", err);
      setError(`Failed to reject request #${requestId}. ${err.message}`);
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Handle expiry duration change
  const handleExpiryChange = (e) => {
    setExpiryDuration(e.target.value);
  };

  // Connect wallet if not connected
  const connectWallet = async () => {
    try {
      await connect();
    } catch (err) {
      console.error("Error connecting wallet:", err);
      setError('Failed to connect wallet. Please try again.');
    }
  };

  // Render wallet connection UI if not connected
  if (!address) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">BlockID Admin Panel</h1>
          <p className="text-gray-600 mb-6 text-center">Connect your admin wallet to access the admin panel.</p>
          <button
            onClick={connectWallet}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // Render access denied if not admin
  if (!isLoading && !isAdminWallet) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-6 text-center">Access Denied</h1>
          <p className="text-gray-700 mb-6 text-center">
            The connected wallet does not have admin privileges. Please connect with an admin wallet to access this page.
          </p>
          <p className="text-sm text-gray-500 mb-4 text-center">Connected Address: {address}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">BlockID Admin Panel</h1>
            <span className="px-4 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Admin: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
          </div>
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
              <p>{error}</p>
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
              <p>{successMessage}</p>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Pending ID Requests</h2>
            <button
              onClick={loadPendingRequests}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 mb-4"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Refresh Requests'}
            </button>
            
            {pendingRequests.length === 0 ? (
              <p className="text-gray-600">No pending requests found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Request ID</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Requester</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Requested At</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">IPFS Hash</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingRequests.map((requestId) => {
                      const details = requestDetails[requestId];
                      return (
                        <tr key={requestId}>
                          <td className="py-3 px-4 text-sm text-gray-800">{requestId.toString()}</td>
                          <td className="py-3 px-4 text-sm text-gray-800">
                            {details?.requester.slice(0, 6)}...{details?.requester.slice(-4)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-800">
                            {details?.requestedAt.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-800">
                            {details?.ipfsHash}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center">
                                <label htmlFor={`expiry-${requestId}`} className="mr-2 text-sm text-gray-600">Expires in (days):</label>
                                <input
                                  id={`expiry-${requestId}`}
                                  type="number"
                                  min="1"
                                  max="3650"
                                  className="border rounded p-1 w-20 text-sm"
                                  value={expiryDuration}
                                  onChange={handleExpiryChange}
                                />
                              </div>
                              <button
                                onClick={() => handleApprove(requestId)}
                                className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-1 px-3 rounded transition duration-200"
                                disabled={processingRequestId === requestId}
                              >
                                {processingRequestId === requestId ? 'Processing...' : 'Approve'}
                              </button>
                              <div className="flex items-center">
                                <input
                                  type="text"
                                  placeholder="Reason for rejection"
                                  className="border rounded p-1 text-sm mr-2 flex-grow"
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                />
                                <button
                                  onClick={() => handleReject(requestId)}
                                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-1 px-3 rounded transition duration-200"
                                  disabled={processingRequestId === requestId}
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 