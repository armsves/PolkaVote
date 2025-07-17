import { useAccount, useConnect, useDisconnect } from "wagmi";
import "./App.css";
import { myTokenModulePrivateVotingAddress } from "./generated";

import polkadotLogo from "./assets/polkadot-logo.svg";
import { VotingInterface } from "./components/VotingInterface";
import NoirVoteApp from "./components/NoirVote";

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
    <div className="flex flex-col min-h-screen w-full">
      {/* Navbar */}
      <nav className="flex items-center justify-between bg-white shadow px-4 py-2 w-full">
        <div className="flex items-center">
          <img src={polkadotLogo} className="h-10 w-10 mr-2" alt="Polkadot logo" />
        </div>
        <div className="flex-1 text-center">
          <span className="text-2xl font-bold tracking-wide">PolkaVote</span>
        </div>
        <div>
          {accountData.connector !== undefined ? (
            <button
              onClick={() => disconnect()}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Disconnect
            </button>
          ) : metamaskConnector ? (
            <button
              onClick={() => connect({ connector: metamaskConnector })}
              disabled={isPending}
              className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
            >
              {isPending ? 'Connecting...' : 'Connect MetaMask'}
            </button>
          ) : (
            <span className="text-red-500">MetaMask not detected</span>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center w-full">
        {accountData.connector !== undefined ? (
          <div className="container mx-auto p-2 leading-6 mb-6 w-full max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-6">
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
            <VotingInterface contractAddress={contractAddress} />
            <div className="my-6" />
            <NoirVoteApp />
          </div>
        ) : (
          <div className="container mx-auto p-2 leading-6 text-center w-full max-w-3xl">
            <p className="mb-4">MetaMask wallet not connected or installed. Please connect to interact with proposals.</p>
            {!metamaskConnector && (
              <p className="text-red-500">MetaMask not detected. Please install MetaMask to continue.</p>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 text-center py-4 text-sm text-gray-600 w-full">
        &copy; {new Date().getFullYear()} PolkaVote. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
