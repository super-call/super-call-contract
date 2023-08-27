import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
// import "hardhat-contract-sizer";
import accountUtils from "./utils/accountUtils";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },

  // contractSizer: {
  //   alphaSort: false,
  //   runOnCompile: true,
  //   disambiguatePaths: false,
  // },

  networks: {
    ethereum: {
      url: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", // public infura endpoint
      chainId: 1,
      accounts: accountUtils.getAccounts(),
    },
    bsc: {
      url: "https://bsc-dataseed1.binance.org",
      chainId: 56,
      accounts: accountUtils.getAccounts(),
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: accountUtils.getAccounts(),
    },
    polygon: {
      url: "https://rpc-mainnet.maticvigil.com",
      chainId: 137,
      accounts: accountUtils.getAccounts(),
    },
    arbitrum: {
      url: `https://arb1.arbitrum.io/rpc`,
      chainId: 42161,
      accounts: accountUtils.getAccounts(),
    },
    optimism: {
      url: `https://mainnet.optimism.io`,
      chainId: 10,
      accounts: accountUtils.getAccounts(),
    },
    fantom: {
      url: `https://rpcapi.fantom.network`,
      chainId: 250,
      accounts: accountUtils.getAccounts(),
    },
    metis: {
      url: `https://andromeda.metis.io/?owner=1088`,
      chainId: 1088,
      accounts: accountUtils.getAccounts(),
    },

    goerli: {
      url: "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", // public infura endpoint
      chainId: 5,
      accounts: accountUtils.getAccounts(),
    },
    "bsc-testnet": {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      chainId: 97,
      accounts: accountUtils.getAccounts(),
    },
    fuji: {
      url: `https://api.avax-test.network/ext/bc/C/rpc`,
      chainId: 43113,
      accounts: accountUtils.getAccounts(),
    },
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com/",
      chainId: 80001,
      accounts: accountUtils.getAccounts(),
    },
    "arbitrum-goerli": {
      url: `https://goerli-rollup.arbitrum.io/rpc/`,
      chainId: 421613,
      accounts: accountUtils.getAccounts(),
    },
    "optimism-goerli": {
      url: `https://goerli.optimism.io/`,
      chainId: 420,
      accounts: accountUtils.getAccounts(),
    },
    "fantom-testnet": {
      url: `https://rpc.ankr.com/fantom_testnet`,
      chainId: 4002,
      accounts: accountUtils.getAccounts(),
    },
    "base-testnet": {
      chainId: 84531,
      url: `https://goerli.base.org`,
      accounts: accountUtils.getAccounts(),
    },
  },
};

export default config;
