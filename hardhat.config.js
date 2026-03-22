import "@nomicfoundation/hardhat-toolbox-viem";
import * as dotenv from "dotenv";
dotenv.config();

export default {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: false },
      evmVersion: "cancun",
    },
  },
  networks: {
    base: {
      url: process.env.ALCHEMY_URL,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      chainId: 8453,
    },
  },
  paths: {
    tests: "./test",
  },
  etherscan: {
    apiKey: {
      base: process.env.BASESCAN_API_KEY,
    },
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
    ],
  },
};
