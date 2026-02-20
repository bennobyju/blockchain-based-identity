# Real Blockchain Implementation Update

To update the Dashboard page to use real blockchain transactions instead of mock ones, follow these instructions:

## 1. Locate the mintIDCard function

In `app/(routes)/dashboard/page.jsx`, find the `mintIDCard` function (around line 822). The function currently starts with this comment:

```js
// Mint ID card (mock implementation to bypass blockchain errors)
const mintIDCard = async () => {
```

## 2. Replace the code with real blockchain implementation

Replace the function with the following code:

```js
// Mint ID card (real blockchain implementation)
const mintIDCard = async () => {
  if (!fullAuthCompleted) {
    setErrorMessage("Please complete the wallet authentication process first.");
    return;
  }
  
  if (!address) {
    setErrorMessage("Please connect your wallet to mint an ID card.");
    return;
  }
  
  if (!formData.fullName || !formData.email || !formData.dateOfBirth || !formData.photoUrl) {
    setErrorMessage("Please complete all required fields before minting your ID.");
    return;
  }
  
  setIsLoading(true);
  setErrorMessage("");
  setSuccessMessage("Processing your ID card...");
  
  try {
    console.log("Starting real blockchain ID card minting process...");
    console.log("Connected wallet address:", address);
    
    // Generate a unique identity hash
    let uid;
    try {
      const uniqueIdentifier = `${formData.fullName}_${formData.email}_${Date.now()}`;
      console.log("Creating unique identifier:", uniqueIdentifier);
      
      // Use generateBytes32Hash from blockchain.js for consistent hashing
      uid = await generateBytes32Hash(uniqueIdentifier);
      console.log("Generated blockchain-compatible hash:", uid);
    } catch (hashError) {
      console.error("Error generating hash:", hashError);
      setErrorMessage(`Failed to generate identity hash: ${hashError.message}`);
      setIsLoading(false);
      return null;
    }
    
    // Prepare metadata for blockchain
    const idData = {
      name: formData.fullName,
      email: formData.email,
      dateOfBirth: formData.dateOfBirth,
      photoUrl: formData.photoUrl,
      uniqueHash: uid // Properly formatted bytes32 hash
    };
    
    // Call the real blockchain transaction
    setSuccessMessage("Please confirm the transaction in your wallet...");
    console.log("Calling createIdentity with data:", idData);
    
    const tx = await createIdentity(idData);
    console.log("Transaction submitted:", tx);
    
    setSuccessMessage("Transaction submitted! Waiting for confirmation...");
    
    // Create the minted card with blockchain transaction data
    const mintedCard = {
      ...formData,
      walletAddress: address,
      uniqueIdentityHash: uid,
      blockchainTxnHash: tx.hash,
      status: 'confirmed',
      isMinted: true,
      blockNumber: "Pending", // Will be updated once confirmed
      mintedAt: new Date().toISOString(),
      dateOfIssue: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 10*365*24*60*60*1000).toISOString(),
      role: formData.role || 'Personal ID',
      organization: formData.organization || 'Sepolia Network Authority',
      idNumber: `BID-${uid.substring(2, 10).toUpperCase()}`
    };
    
    console.log("Created minted card:", mintedCard);
    
    // Save to localStorage
    saveIDToLocalStorage(address, mintedCard);
    
    // Update UI state
    setExistingID(mintedCard);
    setHasExistingID(true);
    setWalletHasId(true);
    setCardPreview(mintedCard);
    setSuccessMessage("Your ID has been successfully minted on the blockchain!");
    
    // Reset form
    clearFormData();
    
    // Return transaction object
    return tx;
  } catch (error) {
    console.error("Error in blockchain minting process:", error);
    
    // Provide user-friendly error messages based on common transaction failures
    if (error.message.includes("insufficient funds")) {
      setErrorMessage("You don't have enough ETH to cover gas fees. Please add Sepolia ETH to your wallet.");
    } else if (error.message.includes("user rejected")) {
      setErrorMessage("You rejected the transaction. The ID was not minted.");
    } else if (error.message.includes("This wallet already has an ID")) {
      setErrorMessage("This wallet already has an ID minted on the blockchain. You cannot mint another one.");
    } else if (error.message.includes("This identity hash is already registered")) {
      setErrorMessage("This identity is already registered on the blockchain.");
    } else {
      setErrorMessage(`Failed to mint ID: ${error.message}`);
    }
    
    return null;
  } finally {
    setIsLoading(false);
  }
};
```

## 3. Key changes explained

1. Changed from using mock blockchain transactions to real ones
2. Uses the `generateBytes32Hash` function from blockchain.js for consistent hash formatting
3. Directly calls the `createIdentity` function imported from blockchain.js
4. Provides better error handling for blockchain-specific errors (insufficient funds, rejected transactions, etc.)
5. Creates the ID using the actual transaction hash returned from the blockchain
6. Sets the ID number based on the hash instead of a random number

## 4. Ensuring proper imports

The dashboard already imports all necessary functions:

```js
import { 
  createIdentity, 
  hasIdentity, 
  isHashRegistered, 
  getIdentityByOwner,
  verifyIdentityHash,
  requestIdentity,
  getUserRequests,
  getRequestDetails,
  isAdmin,
  getPendingRequests,
  approveIDRequest,
  rejectIDRequest,
  createIdentityByAdmin,
  getAdminAddresses,
  generateBytes32Hash
} from '@/utils/blockchain';
```

No additional imports needed.

## 5. Testing considerations

When testing this implementation:

1. Make sure your wallet has sufficient Sepolia ETH for gas fees
2. Watch for the MetaMask or wallet popup to confirm the transaction
3. Check for errors in the console if the transaction fails
4. Verify that the transaction hash is properly saved with the ID card 