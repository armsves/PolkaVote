import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@parity/hardhat-polkadot";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  //resolc: {
  //  compilerSource: "npm"
  //},
  networks: {
    hardhat: {
      polkavm: true,
      forking: {
        url: "https://testnet-passet-hub-eth-rpc.polkadot.io"
      },
      adapterConfig: {
        adapterBinaryPath: "./bin/eth-rpc",
        dev: true
      }
    },
    polkadotHubTestnet: {
      polkavm: true,
      url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
      accounts: [vars.get("PRIVATE_KEY")]
    },
    'passet-hub': {
      url: 'https://blockscout-passet-hub.parity-testnet.parity.io/api/eth-rpc'
    },
  },
  etherscan: {
    apiKey: {
      'passet-hub': 'empty'
    },
    customChains: [
      {
        network: "passet-hub",
        chainId: 420420422,
        urls: {
          apiURL: "https://blockscout-passet-hub.parity-testnet.parity.io/api",
          browserURL: "https://blockscout-passet-hub.parity-testnet.parity.io"
        }
      }
    ]
  },
};

export default config;
