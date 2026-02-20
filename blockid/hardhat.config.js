require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Check for required environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY || "cd813110e274ed8387ef570d71d008249b30477b4ec099ed2283c96c3cbea326";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "AYajjmpDLunawN9mRtBUbWAMSNG9on1NRL";
const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET ||"0x1acc218c4a41c12617eff5fe8fb0608473090dec";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";

// Log the admin wallet being used for deployment
console.log(`Using admin wallet: ${ADMIN_WALLET}`);

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      chainId: 1337,
      url: "http://127.0.0.1:8545/",
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
    goerli: {
      url: process.env.GOERLI_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  }
}; 