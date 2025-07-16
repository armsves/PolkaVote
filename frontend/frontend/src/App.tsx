import { Routes, Route, Link } from "react-router-dom";
import { useAccount, useConnect, useDisconnect, Connector } from "wagmi";
import { myTokenModulePrivateVotingAddress } from "./generated";
import polkadotLogo from "./assets/polkadot-logo.svg";

import "./App.css";
import { VotingInterface } from "./components/VotingInterface";
import NoirPage from "./pages/NoirPage.tsx";


const contractAddress = myTokenModulePrivateVotingAddress[420420422];


function Home() {
  const accountData = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  // const metamaskConnector = connectors.find(connector =>
  //   connector.name.toLowerCase().includes("metamask")
  // );

  const metamaskConnector = connectors.find((connector: Connector) =>
    connector.name.toLowerCase().includes("metamask")
  );

  return (
    <>
      <img src={polkadotLogo} className="mx-auto h-52 p-4 logo" alt="Polkadot logo" />

      <div className="text-center mb-4">
        <Link
          to="/noir"
          className="text-blue-500 underline hover:text-blue-700"
        >
          Go to Noir Page
        </Link>
      </div>

      {accountData.connector ? (
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
                <strong>Address:</strong>{" "}
                {accountData.address?.slice(0, 6)}...{accountData.address?.slice(-4)}
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
                {isPending ? "Connecting..." : "Connect MetaMask"}
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/noir" element={<NoirPage />} />
    </Routes>
  );
}

export default App;
