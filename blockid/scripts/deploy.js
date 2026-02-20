const hre = require("hardhat");
const { ethers } = require("hardhat");
require("dotenv").config();

// Define the admin wallet address from environment variable
const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET || "0x1acc218c4a41c12617eff5fe8fb0608473090dec";
console.log(`Admin wallet address: ${adminWallet}`);

async function main() {
  console.log("Deploying BlockID smart contract...");
  console.log(`Network: ${hre.network.name}`);

  // Deploy the BlockID contract with admin wallet
  const BlockID = await ethers.getContractFactory("BlockID");
  const blockID = await BlockID.deploy(adminWallet);
  await blockID.waitForDeployment();
  
  const deployedAddress = await blockID.getAddress();
  console.log(`BlockID contract deployed to: ${deployedAddress}`);
  console.log(`Admin wallet set to: ${adminWallet}`);

  // Update .env with contract address
  console.log(`
  
Add this to your .env file:
NEXT_PUBLIC_CONTRACT_ADDRESS="${deployedAddress}"
  
  `);

  // For testnets, verify the contract
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    // Wait for block confirmations
    console.log("Waiting for block confirmations...");
    const receipt = await blockID.deploymentTransaction().wait(6);
    console.log("Confirmed!");

    // Verify the contract on Etherscan
    try {
      console.log("Verifying contract on Etherscan...");
      await hre.run("verify:verify", {
        address: deployedAddress,
        constructorArguments: [adminWallet],
      });
      console.log("Contract verified on Etherscan!");
    } catch (e) {
      console.log("Verification error:", e);
    }
  }

  return deployedAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 