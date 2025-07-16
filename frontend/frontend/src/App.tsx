import { useAccount, useConnect, useDisconnect } from "wagmi";
import "./App.css";
import { myTokenModulePrivateVotingAddress } from "./generated";

import polkadotLogo from "./assets/polkadot-logo.svg";
import { VotingInterface } from "./components/VotingInterface";

const contractAddress = myTokenModulePrivateVotingAddress[420420422];

function App() {
  const accountData = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  // Filter to only show MetaMask connector
  const metamaskConnector = connectors.find(connector => 
    connector.name.toLowerCase().includes('metamask')
  );

  return (
    <>
      <img src={polkadotLogo} className="mx-auto h-52 p-4 logo" alt="Polkadot logo" />
      
      {accountData.connector !== undefined ? (
        <>
          <div className="container mx-auto p-2 leading-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Wallet Connected!</h2>
              <button
                onClick={() => disconnect()}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Disconnect
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Chain ID:</strong> {accountData.chainId}
              </div>
              <div>
                <strong>Address:</strong> {accountData.address?.slice(0, 6)}...{accountData.address?.slice(-4)}
              </div>
              <div>
                <strong>Status:</strong> Connected
              </div>
            </div>
          </div>
          <VotingInterface contractAddress={contractAddress} />
        </>
      ) : (
        <div className="container mx-auto p-2 leading-6">
          <p className="mb-4">MetaMask wallet not connected or installed. Please connect to interact with proposals.</p>
          <div className="space-y-2">
            {metamaskConnector ? (
              <button
                onClick={() => connect({ connector: metamaskConnector })}
                disabled={isPending}
                className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded w-full"
              >
                {isPending ? 'Connecting...' : 'Connect MetaMask'}
              </button>
            ) : (
              <p className="text-red-500">MetaMask not detected. Please install MetaMask to continue.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default App;
