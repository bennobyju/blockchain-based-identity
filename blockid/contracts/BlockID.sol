// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title BlockID
 * @dev A smart contract for managing digital identities on the Ethereum blockchain
 * Implements soulbound token mechanics (non-transferable), admin approval, and 1-wallet-1-ID enforcement
 */
contract BlockID is Ownable {
    using Strings for uint256;
    using ECDSA for bytes32;

    // Struct to store identity information
    struct Identity {
        address owner;
        string ipfsHash;
        uint256 createdAt;
        uint256 expiresAt;
        bool isVerified;
        string idType;
        bytes32 uniqueIdentityHash; // SHA-256 hash stored on-chain for verification
    }
    
    // Struct to store identity request
    struct IDRequest {
        address requester;
        string ipfsHash;     // Hash of the user's metadata
        uint256 requestedAt;
        bytes32 uniqueIdentityHash;
        bool isPending;
        bool isApproved;
        bool isRejected;
    }

    // Mapping from ID number to Identity
    mapping(uint256 => Identity) private identities;
    
    // Mapping from address to ID number (enforces 1 wallet = 1 ID)
    mapping(address => uint256) private walletToId;
    
    // Mapping from unique identity hash to ID number (prevents duplicates)
    mapping(bytes32 => uint256) private hashToId;
    
    // Mapping of authorized verifiers
    mapping(address => bool) private verifiers;
    
    // ADMIN specific mappings and variables
    address private adminWallet;
    
    // Request ID counter
    uint256 private requestCounter;
    
    // Mapping from request ID to IDRequest
    mapping(uint256 => IDRequest) private idRequests;
    
    // Mapping from requester address to array of their request IDs
    mapping(address => uint256[]) private userRequests;
    
    // Counter for ID numbers
    uint256 private idCounter;

    // Events
    event IdentityCreated(uint256 indexed idNumber, address indexed owner, string idType, bytes32 uniqueIdentityHash);
    event IdentityVerified(uint256 indexed idNumber, address indexed verifier);
    event IdentityRevoked(uint256 indexed idNumber, address indexed revokedBy);
    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);
    event IDRequested(uint256 indexed requestId, address indexed requester, bytes32 uniqueIdentityHash);
    event IDRequestApproved(uint256 indexed requestId, uint256 indexed idNumber, address indexed approvedBy);
    event IDRequestRejected(uint256 indexed requestId, address indexed rejectedBy, string reason);

    /**
     * @dev Constructor sets the deployer as the initial owner, admin, and verifier
     */
    constructor(address _adminWallet) Ownable(msg.sender) {
        adminWallet = _adminWallet;
        verifiers[msg.sender] = true;
        verifiers[_adminWallet] = true;
        emit VerifierAdded(msg.sender);
        emit VerifierAdded(_adminWallet);
        emit AdminChanged(address(0), _adminWallet);
    }

    /**
     * @dev Modifier to check if the caller is a verifier
     */
    modifier onlyVerifier() {
        require(verifiers[msg.sender], "BlockID: caller is not a verifier");
        _;
    }
    
    /**
     * @dev Modifier to check if the caller is the admin
     */
    modifier onlyAdmin() {
        require(msg.sender == adminWallet, "BlockID: caller is not the admin");
        _;
    }
    
    /**
     * @dev Change the admin wallet address (only owner can do this)
     * @param _newAdmin New admin wallet address
     */
    function changeAdmin(address _newAdmin) external onlyOwner {
        require(_newAdmin != address(0), "BlockID: invalid address");
        address oldAdmin = adminWallet;
        adminWallet = _newAdmin;
        
        // Also add new admin as verifier
        if (!verifiers[_newAdmin]) {
            verifiers[_newAdmin] = true;
            emit VerifierAdded(_newAdmin);
        }
        
        emit AdminChanged(oldAdmin, _newAdmin);
    }
    
    /**
     * @dev Get the current admin wallet address
     * @return address Current admin wallet address
     */
    function getAdmin() external view returns (address) {
        return adminWallet;
    }
    
    /**
     * @dev Check if an address already has an ID
     * @param owner Address to check
     * @return bool True if the address already has an ID
     */
    function hasIdentity(address owner) public view returns (bool) {
        return walletToId[owner] != 0;
    }
    
    /**
     * @dev Check if a unique identity hash is already registered
     * @param uniqueHash The hash to check
     * @return bool True if the hash is already registered
     */
    function isHashRegistered(bytes32 uniqueHash) public view returns (bool) {
        return hashToId[uniqueHash] != 0;
    }
    
    /**
     * @dev Check if an address is the admin
     * @param addr Address to check
     * @return bool True if the address is the admin
     */
    function isAdmin(address addr) public view returns (bool) {
        return addr == adminWallet;
    }
    
    /**
     * @dev Request a new digital identity (users must request first, admin approves)
     * @param ipfsHash IPFS hash of the identity data
     * @param idType Type of ID (e.g., "driver_license", "passport", "national_id")
     * @param uniqueHash SHA-256 hash combining user details for uniqueness verification
     * @return requestId The unique request ID assigned to this request
     */
    function requestIdentity(
        string memory ipfsHash,
        string memory idType,
        bytes32 uniqueHash
    ) external returns (uint256) {
        // Ensure requester doesn't already have an ID
        require(!hasIdentity(msg.sender), "BlockID: wallet already has an ID");
        
        // Ensure unique identity hash isn't reused
        require(!isHashRegistered(uniqueHash), "BlockID: identity with this hash already exists");
        
        // Make sure the same hash isn't in pending requests
        for (uint256 i = 0; i < userRequests[msg.sender].length; i++) {
            uint256 reqId = userRequests[msg.sender][i];
            if (idRequests[reqId].isPending && idRequests[reqId].uniqueIdentityHash == uniqueHash) {
                revert("BlockID: a request with this hash is already pending");
            }
        }
        
        requestCounter++;
        uint256 requestId = requestCounter;
        
        // Store the request
        idRequests[requestId] = IDRequest({
            requester: msg.sender,
            ipfsHash: ipfsHash,
            requestedAt: block.timestamp,
            uniqueIdentityHash: uniqueHash,
            isPending: true,
            isApproved: false,
            isRejected: false
        });
        
        // Store the request ID in the user's requests array
        userRequests[msg.sender].push(requestId);
        
        emit IDRequested(requestId, msg.sender, uniqueHash);
        
        return requestId;
    }
    
    /**
     * @dev Approve an identity request (only admin)
     * @param requestId The request ID to approve
     * @param expiryDuration Duration in seconds until the ID expires (0 for no expiry)
     * @return idNumber The unique ID number assigned to this identity
     */
    function approveIDRequest(uint256 requestId, uint256 expiryDuration) external onlyAdmin returns (uint256) {
        // Make sure the request exists and is pending
        require(idRequests[requestId].requester != address(0), "BlockID: request does not exist");
        require(idRequests[requestId].isPending, "BlockID: request is not pending");
        
        address requester = idRequests[requestId].requester;
        string memory ipfsHash = idRequests[requestId].ipfsHash;
        bytes32 uniqueHash = idRequests[requestId].uniqueIdentityHash;
        
        // Make sure the requester doesn't already have an ID (double-check)
        require(!hasIdentity(requester), "BlockID: requester already has an ID");
        
        // Make sure the hash isn't already registered (double-check)
        require(!isHashRegistered(uniqueHash), "BlockID: identity with this hash already exists");
        
        // Create a new identity
        idCounter++;
        uint256 idNumber = idCounter;
        
        uint256 expiresAt = expiryDuration > 0 ? block.timestamp + expiryDuration : 0;
        
        // Create the identity
        identities[idNumber] = Identity({
            owner: requester,
            ipfsHash: ipfsHash,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            isVerified: true, // Auto-verified since admin approved it
            idType: "personal_id", // Default ID type
            uniqueIdentityHash: uniqueHash
        });
        
        // Record wallet to ID mapping (for uniqueness enforcement)
        walletToId[requester] = idNumber;
        
        // Record hash to ID mapping (for duplicate prevention)
        hashToId[uniqueHash] = idNumber;
        
        // Update the request status
        idRequests[requestId].isPending = false;
        idRequests[requestId].isApproved = true;
        
        // Emit events
        emit IDRequestApproved(requestId, idNumber, msg.sender);
        emit IdentityCreated(idNumber, requester, "personal_id", uniqueHash);
        
        return idNumber;
    }
    
    /**
     * @dev Reject an identity request (only admin)
     * @param requestId The request ID to reject
     * @param reason Reason for rejection
     */
    function rejectIDRequest(uint256 requestId, string memory reason) external onlyAdmin {
        // Make sure the request exists and is pending
        require(idRequests[requestId].requester != address(0), "BlockID: request does not exist");
        require(idRequests[requestId].isPending, "BlockID: request is not pending");
        
        // Update the request status
        idRequests[requestId].isPending = false;
        idRequests[requestId].isRejected = true;
        
        emit IDRequestRejected(requestId, msg.sender, reason);
    }
    
    /**
     * @dev Get user's pending requests
     * @param user Address of the user
     * @return uint256[] Array of request IDs
     */
    function getUserRequests(address user) external view returns (uint256[] memory) {
        return userRequests[user];
    }
    
    /**
     * @dev Get request details
     * @param requestId The request ID to query
     * @return requester Address of the requester
     * @return ipfsHash IPFS hash of the identity data
     * @return requestedAt Timestamp when the request was made
     * @return uniqueIdentityHash SHA-256 hash of the user's details
     * @return isPending Whether the request is pending
     * @return isApproved Whether the request is approved
     * @return isRejected Whether the request is rejected
     */
    function getRequestDetails(uint256 requestId) external view returns (
        address requester,
        string memory ipfsHash,
        uint256 requestedAt,
        bytes32 uniqueIdentityHash,
        bool isPending,
        bool isApproved,
        bool isRejected
    ) {
        IDRequest storage request = idRequests[requestId];
        require(request.requester != address(0), "BlockID: request does not exist");
        
        return (
            request.requester,
            request.ipfsHash,
            request.requestedAt,
            request.uniqueIdentityHash,
            request.isPending,
            request.isApproved,
            request.isRejected
        );
    }
    
    /**
     * @dev Get all pending requests (for admin)
     * @return uint256[] Array of pending request IDs
     */
    function getPendingRequests() external view returns (uint256[] memory) {
        // Count pending requests
        uint256 count = 0;
        for (uint256 i = 1; i <= requestCounter; i++) {
            if (idRequests[i].isPending) {
                count++;
            }
        }
        
        // Create array of pending request IDs
        uint256[] memory pendingIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= requestCounter; i++) {
            if (idRequests[i].isPending) {
                pendingIds[index] = i;
                index++;
            }
        }
        
        return pendingIds;
    }

    /**
     * @dev Creates a new digital identity directly (only admins can do this)
     * @param owner Address that will own this identity
     * @param ipfsHash IPFS hash of the identity data
     * @param expiryDuration Duration in seconds until the ID expires (0 for no expiry)
     * @param idType Type of ID (e.g., "driver_license", "passport", "national_id")
     * @param uniqueHash SHA-256 hash combining user details for uniqueness verification
     * @return idNumber The unique ID number assigned to this identity
     */
    function createIdentity(
        address owner,
        string memory ipfsHash,
        uint256 expiryDuration,
        string memory idType,
        bytes32 uniqueHash
    ) external onlyAdmin returns (uint256) {
        // Ensure one ID per wallet
        require(!hasIdentity(owner), "BlockID: wallet already has an ID minted");
        
        // Ensure unique identity hash isn't reused
        require(!isHashRegistered(uniqueHash), "BlockID: identity with this unique hash already exists");
        
        idCounter++;
        uint256 idNumber = idCounter;
        
        uint256 expiresAt = expiryDuration > 0 ? block.timestamp + expiryDuration : 0;
        
        identities[idNumber] = Identity({
            owner: owner,
            ipfsHash: ipfsHash,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            isVerified: true, // Auto-verified since admin created it
            idType: idType,
            uniqueIdentityHash: uniqueHash
        });
        
        // Record wallet to ID mapping (for uniqueness enforcement)
        walletToId[owner] = idNumber;
        
        // Record hash to ID mapping (for duplicate prevention)
        hashToId[uniqueHash] = idNumber;
        
        emit IdentityCreated(idNumber, owner, idType, uniqueHash);
        
        return idNumber;
    }

    /**
     * @dev Verifies an identity
     * @param idNumber The ID number to verify
     */
    function verifyIdentity(uint256 idNumber) external onlyVerifier {
        require(identities[idNumber].owner != address(0), "BlockID: identity does not exist");
        require(!identities[idNumber].isVerified, "BlockID: identity already verified");
        
        identities[idNumber].isVerified = true;
        
        emit IdentityVerified(idNumber, msg.sender);
    }

    /**
     * @dev Revokes an identity
     * @param idNumber The ID number to revoke
     */
    function revokeIdentity(uint256 idNumber) external {
        require(identities[idNumber].owner != address(0), "BlockID: identity does not exist");
        require(
            identities[idNumber].owner == msg.sender || verifiers[msg.sender] || owner() == msg.sender || msg.sender == adminWallet,
            "BlockID: caller is not authorized"
        );
        
        // Clear the wallet to ID mapping
        walletToId[identities[idNumber].owner] = 0;
        
        // Clear the hash to ID mapping
        hashToId[identities[idNumber].uniqueIdentityHash] = 0;
        
        delete identities[idNumber];
        
        emit IdentityRevoked(idNumber, msg.sender);
    }

    /**
     * @dev Updates the IPFS hash for an identity
     * @param idNumber The ID number to update
     * @param newIpfsHash The new IPFS hash
     */
    function updateIdentityData(uint256 idNumber, string memory newIpfsHash) external {
        require(identities[idNumber].owner != address(0), "BlockID: identity does not exist");
        require(
            identities[idNumber].owner == msg.sender || msg.sender == adminWallet,
            "BlockID: caller is not the owner or admin"
        );
        
        identities[idNumber].ipfsHash = newIpfsHash;
    }

    /**
     * @dev Adds a new verifier
     * @param verifier Address of the verifier to add
     */
    function addVerifier(address verifier) external onlyAdmin {
        require(verifier != address(0), "BlockID: invalid address");
        require(!verifiers[verifier], "BlockID: already a verifier");
        
        verifiers[verifier] = true;
        
        emit VerifierAdded(verifier);
    }

    /**
     * @dev Removes a verifier
     * @param verifier Address of the verifier to remove
     */
    function removeVerifier(address verifier) external onlyAdmin {
        require(verifiers[verifier], "BlockID: not a verifier");
        require(verifier != adminWallet, "BlockID: cannot remove admin as verifier");
        require(verifier != owner(), "BlockID: cannot remove owner as verifier");
        
        verifiers[verifier] = false;
        
        emit VerifierRemoved(verifier);
    }

    /**
     * @dev Checks if an address is a verifier
     * @param verifier Address to check
     * @return bool True if the address is a verifier
     */
    function isVerifier(address verifier) external view returns (bool) {
        return verifiers[verifier];
    }

    /**
     * @dev Gets identity information
     * @param idNumber The ID number to query
     * @return owner The address that owns this identity
     * @return ipfsHash IPFS hash where identity data is stored
     * @return createdAt Timestamp when the identity was created
     * @return expiresAt Timestamp when the identity expires
     * @return isVerified Whether the identity is verified
     * @return idType The type of ID (e.g., "passport", "driver_license")
     * @return uniqueIdentityHash SHA-256 hash of the user's identity details
     */
    function getIdentity(uint256 idNumber) external view returns (
        address owner,
        string memory ipfsHash,
        uint256 createdAt,
        uint256 expiresAt,
        bool isVerified,
        string memory idType,
        bytes32 uniqueIdentityHash
    ) {
        Identity storage identity = identities[idNumber];
        require(identity.owner != address(0), "BlockID: identity does not exist");
        
        return (
            identity.owner,
            identity.ipfsHash,
            identity.createdAt,
            identity.expiresAt,
            identity.isVerified,
            identity.idType,
            identity.uniqueIdentityHash
        );
    }

    /**
     * @dev Gets the ID number associated with a wallet address
     * @param owner The address to query
     * @return uint256 ID number owned by the address (0 if none)
     */
    function getIdentityByOwner(address owner) external view returns (uint256) {
        return walletToId[owner];
    }

    /**
     * @dev Gets the ID number associated with a unique identity hash
     * @param uniqueHash The hash to query
     * @return uint256 ID number associated with the hash (0 if none)
     */
    function getIdentityByHash(bytes32 uniqueHash) external view returns (uint256) {
        return hashToId[uniqueHash];
    }

    /**
     * @dev Validates if an identity is valid (exists, verified, and not expired)
     * @param idNumber The ID number to validate
     * @return bool True if the identity is valid
     */
    function isIdentityValid(uint256 idNumber) external view returns (bool) {
        Identity storage identity = identities[idNumber];
        
        if (identity.owner == address(0)) {
            return false; // Identity doesn't exist
        }
        
        if (!identity.isVerified) {
            return false; // Identity not verified
        }
        
        if (identity.expiresAt > 0 && block.timestamp > identity.expiresAt) {
            return false; // Identity expired
        }
        
        return true;
    }
    
    /**
     * @dev Verifies that a given hash matches the on-chain hash for an ID
     * @param idNumber The ID number to check
     * @param claimedHash The hash to verify against the stored one
     * @return bool True if the hash matches
     */
    function verifyIdentityHash(uint256 idNumber, bytes32 claimedHash) external view returns (bool) {
        Identity storage identity = identities[idNumber];
        require(identity.owner != address(0), "BlockID: identity does not exist");
        
        return identity.uniqueIdentityHash == claimedHash;
    }
} 