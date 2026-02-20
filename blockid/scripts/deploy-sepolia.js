// Deployment script for Sepolia testnet
const hre = require("hardhat");

async function main() {
  console.log("Deploying BlockID contract to Sepolia testnet...");

  // Get the contract factory
  const BlockID = await hre.ethers.getContractFactory("BlockID");
  
  // Deploy the contract
  const blockId = await BlockID.deploy();
  
  // Wait for deployment to finish
  await blockId.waitForDeployment();
  
  // Get the deployed contract address
  const blockIdAddress = await blockId.getAddress();
  
  console.log(`BlockID contract deployed to: ${blockIdAddress}`);
  console.log("Save this address and add it to your application configuration!");
  
  // Verify the contract on Etherscan if API key is available
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for block confirmations...");
    // Wait for 6 block confirmations
    await blockId.deploymentTransaction().wait(6);
    console.log("Verifying contract on Etherscan...");
    
    await hre.run("verify:verify", {
      address: blockIdAddress,
      constructorArguments: [],
    });
    
    console.log("Contract verified on Etherscan");
  }
  
  // Output JSON for easy copying
  const deploymentInfo = {
    network: "sepolia",
    contractAddress: blockIdAddress,
    deploymentHash: blockId.deploymentTransaction().hash,
    blockNumber: blockId.deploymentTransaction().blockNumber,
  };
  
  console.log("\nDeployment Information:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 