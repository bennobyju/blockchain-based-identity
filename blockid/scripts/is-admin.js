require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  try {
    // Define ANSI color codes for output formatting
    const colors = {
      reset: "\x1b[0m",
      red: "\x1b[31m",
      green: "\x1b[32m",
      yellow: "\x1b[33m",
      blue: "\x1b[34m"
    };
    
    // Get the wallet address to check - by default use the admin wallet from env
    const walletToCheck = process.env.NEXT_PUBLIC_ADMIN_WALLET || process.argv[2];
    if (!walletToCheck) {
      console.log(`${colors.red}No wallet address provided. Please provide an address as argument or set NEXT_PUBLIC_ADMIN_WALLET in your .env file.${colors.reset}`);
      return;
    }

    // Load the deployed contract
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    if (!contractAddress) {
      console.log(`${colors.red}Contract address not found in environment variables. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file.${colors.reset}`);
      return;
    }

    console.log(`${colors.blue}Checking admin status for wallet: ${walletToCheck}${colors.reset}`);
    console.log(`${colors.blue}Contract address: ${contractAddress}${colors.reset}`);
    console.log(`${colors.blue}Network: ${network.name}${colors.reset}`);

    // Get the contract factory and attach to the deployed contract
    const BlockID = await ethers.getContractFactory("BlockID");
    const blockID = await BlockID.attach(contractAddress);

    // Call the isAdmin function
    const isAdmin = await blockID.isAdmin(walletToCheck);
    
    // Display the result
    if (isAdmin) {
      console.log(`${colors.green}✓ The wallet ${walletToCheck} IS an admin of the BlockID contract.${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ The wallet ${walletToCheck} is NOT an admin of the BlockID contract.${colors.reset}`);
    }

    // Get current admin address if available
    try {
      const adminWallet = await blockID.adminWallet();
      console.log(`${colors.blue}Current admin wallet: ${adminWallet}${colors.reset}`);
    } catch (error) {
      console.log(`${colors.yellow}Could not retrieve current admin wallet: ${error.message}${colors.reset}`);
    }

  } catch (error) {
    console.error(`${colors.red}Error checking admin status:${colors.reset}`, error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 