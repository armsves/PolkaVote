import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  sepolia
} from 'wagmi/chains';

// Add Passet Hub testnet chain
export const passetHubTestnet = {
  id: 420420422,
  name: 'Passet Hub',
  network: 'passet-hub',
  nativeCurrency: {
    name: 'Passet Hub',
    symbol: 'PAS',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://testnet-passet-hub-eth-rpc.polkadot.io'] },
    public: { http: ['https://testnet-passet-hub-eth-rpc.polkadot.io'] },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://blockscout-passet-hub.parity-testnet.parity.io/',
    },
  },
  testnet: true,
};

export const config = getDefaultConfig({
  appName: 'PolkaVote',
  projectId: 'YOUR_PROJECT_ID',
  chains: [
    passetHubTestnet,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [sepolia] : []),
  ],
  ssr: true,
});
