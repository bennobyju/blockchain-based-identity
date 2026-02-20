// First try to load the chalk package, and fall back to plain console.log if not available
let chalk;
try {
  // Try CommonJS require first
  chalk = require('chalk');
} catch (error) {
  try {
    // If CommonJS fails, provide simple color functions
    chalk = {
      green: (text) => `\x1b[32m${text}\x1b[0m`, // Green text
      red: (text) => `\x1b[31m${text}\x1b[0m`,   // Red text
      yellow: (text) => `\x1b[33m${text}\x1b[0m`, // Yellow text
      blue: (text) => `\x1b[34m${text}\x1b[0m`,  // Blue text
      bold: (text) => `\x1b[1m${text}\x1b[0m`    // Bold text
    };
  } catch (error) {
    // Absolute fallback with no colors
    chalk = {
      green: (text) => `✓ ${text}`,
      red: (text) => `✗ ${text}`,
      yellow: (text) => `! ${text}`,
      blue: (text) => `> ${text}`,
      bold: (text) => text
    };
  }
}

// Load environment variables
try {
  require('dotenv').config();
} catch (error) {
  console.log("Could not load dotenv. Using process.env directly.");
}

// Define categories and environment variables
const requiredEnvVars = [
  { name: 'PRIVATE_KEY', category: 'Blockchain', description: 'Private key for blockchain transactions' },
  { name: 'SEPOLIA_RPC_URL', category: 'Blockchain', description: 'Sepolia RPC URL for blockchain connection' },
  { name: 'ETHERSCAN_API_KEY', category: 'Blockchain', description: 'Etherscan API key for verification' },
  { name: 'NEXT_PUBLIC_NETWORK_NAME', category: 'Network', description: 'Network name for UI display' },
  { name: 'NEXT_PUBLIC_CHAIN_ID', category: 'Network', description: 'Chain ID for blockchain connections' },
  { name: 'NEXT_PUBLIC_RPC_URL', category: 'Network', description: 'RPC URL for frontend connections' },
  { name: 'NEXT_PUBLIC_ADMIN_WALLET', category: 'Contract', description: 'Admin wallet address' },
  { name: 'PINATA_API_KEY', category: 'IPFS', description: 'Pinata API key for IPFS uploads' },
  { name: 'PINATA_API_SECRET', category: 'IPFS', description: 'Pinata API secret for IPFS uploads' },
  { name: 'NEXT_PUBLIC_IPFS_GATEWAY', category: 'IPFS', description: 'IPFS gateway URL' },
];

const optionalEnvVars = [
  { name: 'NEXT_PUBLIC_CONTRACT_ADDRESS', category: 'Contract', description: 'Smart contract address' },
  { name: 'NEXT_PUBLIC_IS_DEVELOPMENT', category: 'Application', description: 'Development mode flag' },
  { name: 'NEXTAUTH_SECRET', category: 'Auth', description: 'NextAuth secret for session encryption' },
  { name: 'NEXTAUTH_URL', category: 'Auth', description: 'NextAuth URL for authentication callbacks' },
];

// Helper function to mask sensitive values
function maskValue(value, type) {
  if (!value) return undefined;
  
  if (type === 'key' || type === 'secret' || type === 'private') {
    const start = value.substring(0, 4);
    const end = value.substring(value.length - 4);
    return `${start}...${end}`;
  }
  return value;
}

// Check environment variables
console.log('BlockID Environment Variables Check');
console.log('=======================================');

// Check required variables
console.log('Checking required environment variables:');
const missingRequired = [];
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar.name];
  
  if (!value) {
    console.log(chalk.red(`${envVar.name}: Missing`));
    missingRequired.push(envVar);
  } else {
    const isSensitive = envVar.name.includes('KEY') || 
                        envVar.name.includes('SECRET') || 
                        envVar.name.includes('PRIVATE');
    const maskedValue = isSensitive ? maskValue(value, 'key') : value;
    console.log(chalk.green(`${envVar.name}: ${maskedValue}`));
  }
});

// Check optional variables
console.log('\nChecking optional environment variables:');
const missingOptional = [];
optionalEnvVars.forEach(envVar => {
  const value = process.env[envVar.name];
  
  if (!value) {
    console.log(chalk.yellow(`${envVar.name}: Not set (optional)`));
    missingOptional.push(envVar);
  } else {
    const isSensitive = envVar.name.includes('KEY') || 
                        envVar.name.includes('SECRET') || 
                        envVar.name.includes('PRIVATE');
    const maskedValue = isSensitive ? maskValue(value, 'key') : value;
    console.log(chalk.green(`${envVar.name}: ${maskedValue}`));
  }
});

// Summarize by category
console.log('\nCategory Summary:');
const categories = [...new Set([...requiredEnvVars, ...optionalEnvVars].map(v => v.category))];

categories.forEach(category => {
  const requiredInCategory = requiredEnvVars.filter(v => v.category === category);
  const missingInCategory = missingRequired.filter(v => v.category === category);
  
  if (missingInCategory.length === 0) {
    console.log(chalk.green(`${category}: All ${requiredInCategory.length} environment variables configured`));
  } else {
    console.log(chalk.red(`${category}: Missing ${missingInCategory.length} of ${requiredInCategory.length} required variables`));
  }
});

// Print final result
console.log('\nResult:');
if (missingRequired.length === 0) {
  console.log(chalk.green('All required environment variables are configured!'));
  // Exit with success code for the scripts to continue
  process.exit(0);
} else {
  console.log(chalk.red(`Missing ${missingRequired.length} required environment variables!`));
  // List the missing required variables with their descriptions
  missingRequired.forEach(v => {
    console.log(chalk.red(`- ${v.name}: ${v.description}`));
  });
  // Don't exit with error code if running in dev mode, just warn
  if (process.env.NODE_ENV !== 'production') {
    console.log(chalk.yellow('\nWarning: Continuing despite missing environment variables as we are in development mode.'));
    process.exit(0);
  } else {
    process.exit(1);
  }
} 