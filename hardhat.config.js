import "@nomicfoundation/hardhat-toolbox-viem";
import * as dotenv from "dotenv";
dotenv.config();

export default {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    base: {
      url: process.env.ALCHEMY_BASE_URL,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      chainId: 8453,
    },
  },
};
