import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useSignMessage } from 'wagmi';
import { myTokenModulePrivateVotingAbi } from '../generated';
import { generateNoirProof } from '../utils/noirProof';
import ZkProofSpinner from './ZkProofSpinner';

interface Proposal {
  id: bigint;
  creator: string;
  description: string;
  voting_system: bigint;
  start_date: bigint;
  end_date: bigint;
  finished: boolean;
  result: bigint;
}

interface VotingInterfaceProps {
  contractAddress: string;
}

export function VotingInterface({ contractAddress }: VotingInterfaceProps) {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [voterNonce, setVoterNonce] = useState<number>(1);
  const [newProposal, setNewProposal] = useState({
    id: '',
    description: '',
    voting_system: '1',
    start_date: '',
    end_date: ''
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [proof, setProof] = useState<any>(null);
  const [witness, setWitness] = useState<any>(null);
  const [loadingProof, setLoadingProof] = useState(false);

  // Read proposals from contract
  const { data: proposals, refetch: refetchProposals } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: myTokenModulePrivateVotingAbi,
    functionName: 'getProposals',
  });

  // Write contract hooks
  const { writeContract: vote, isPending: isVoting } = useWriteContract();
  const { writeContract: createProposal, isPending: isCreating } = useWriteContract();
  const { writeContract: finishProposal, isPending: isFinishing } = useWriteContract();

  const handleVote = async (proposalId: bigint, voteValue: boolean) => {
    if (!address) return;

    setLogs([]);
    setProof(null);
    setWitness(null);
    setLoadingProof(true);

    setLogs((prev) => [...prev, `Generating Noir proof for vote: ${voteValue ? "Yes" : "No"}`]);
    try {
      const noirResult = await generateNoirProof({
        proposalId: Number(proposalId),
        address,
        is_upvote: voteValue,
        signMessageAsync,
      });

      setLogs((prev) => [...prev, "Proof generated."]);
      setProof(noirResult.proofData);
      setWitness(noirResult.witness);

      if (!noirResult.isValid) {
        setLogs((prev) => [...prev, "❌ Noir proof failed. Vote not submitted."]);
        alert("Noir proof failed. Vote not submitted.");
        setLoadingProof(false);
        return;
      }

      setLogs((prev) => [...prev, "✅ Noir proof valid. Submitting vote..."]);

      vote({
        address: contractAddress as `0x${string}`,
        abi: myTokenModulePrivateVotingAbi,
        functionName: 'vote',
        args: [
          address,
          BigInt(Math.floor(Date.now() / 1000)),
          proposalId,
          BigInt(voterNonce),
          voteValue
        ]
      });

      setVoterNonce(prev => prev + 1);
      setLogs((prev) => [...prev, "✅ Vote submitted."]);
    } catch (e) {
      setLogs((prev) => [...prev, `❌ Error: ${e}`]);
    } finally {
      setLoadingProof(false);
    }
  };

  const handleCreateProposal = () => {
    if (!address || !newProposal.id || !newProposal.description) return;

    createProposal({
      address: contractAddress as `0x${string}`,
      abi: myTokenModulePrivateVotingAbi,
      functionName: 'createProposal',
      args: [
        BigInt(newProposal.id),
        address,
        newProposal.description,
        BigInt(newProposal.voting_system),
        BigInt(Math.floor(new Date(newProposal.start_date).getTime() / 1000)),
        BigInt(Math.floor(new Date(newProposal.end_date).getTime() / 1000)),
        false,
        BigInt(0)
      ]
    });

    setNewProposal({
      id: '',
      description: '',
      voting_system: '1',
      start_date: '',
      end_date: ''
    });
    setShowCreateForm(false);
  };

  const handleFinishProposal = (proposalId: bigint, result: number) => {
    finishProposal({
      address: contractAddress as `0x${string}`,
      abi: myTokenModulePrivateVotingAbi,
      functionName: 'finishProposal',
      args: [proposalId, BigInt(result)]
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      refetchProposals();
    }, 10000); // Refetch every 10 seconds

    return () => clearInterval(interval);
  }, [refetchProposals]);

  const proposalArray = proposals as Proposal[] || [];

  return (
    <div className="container mx-auto p-4 md:p-8 relative">
      {/* Loader Overlay */}
      {loadingProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="flex flex-col items-center">
            <ZkProofSpinner />
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Main Voting Content */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white font-extrabold py-3 px-6 rounded-xl shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-400"
              disabled={!address}
            >
              + Create Proposal
            </button>
          </div>

          {/* Create Proposal Form */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-gray-200">
                <h2 className="text-2xl font-extrabold mb-6 text-gray-800">Create New Proposal</h2>
                <div className="space-y-4">
                  <input
                    type="number"
                    placeholder="Proposal ID"
                    value={newProposal.id}
                    onChange={(e) => setNewProposal(prev => ({ ...prev, id: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                  <textarea
                    placeholder="Description"
                    value={newProposal.description}
                    onChange={(e) => setNewProposal(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                  <select
                    value={newProposal.voting_system}
                    onChange={(e) => setNewProposal(prev => ({ ...prev, voting_system: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                  >
                    <option value="1">Simple Majority</option>
                    <option value="2">Supermajority</option>
                    <option value="3">Unanimous</option>
                  </select>
                  <input
                    type="datetime-local"
                    value={newProposal.start_date}
                    onChange={(e) => setNewProposal(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                  <input
                    type="datetime-local"
                    value={newProposal.end_date}
                    onChange={(e) => setNewProposal(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCreateProposal}
                    disabled={isCreating}
                    className="flex-1 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg shadow transition"
                  >
                    {isCreating ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-400 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Proposals List */}
          <div className="grid gap-6">
            {proposalArray.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-lg font-semibold">
                No proposals found. Create the first one!
              </div>
            ) : (
              proposalArray.map((proposal) => {
                const now = Date.now() / 1000;
                const hasEnded = Number(proposal.end_date) < now;
                const isOwner = address && proposal.creator.toLowerCase() === address.toLowerCase();

                return (
                  <div
                    key={proposal.id.toString()}
                    className="border border-gray-200 rounded-2xl p-8 bg-white shadow-lg hover:shadow-xl transition-shadow duration-200 mb-2"
                  >
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2">
                      <h3 className="text-2xl font-extrabold text-gray-800">Proposal #{proposal.id.toString()}</h3>
                      <span className={`px-4 py-1 rounded-full text-sm font-bold shadow-sm border ${
                        proposal.finished
                          ? 'bg-gray-200 text-gray-700 border-gray-300'
                          : hasEnded
                            ? 'bg-yellow-100 text-yellow-700 border-yellow-400'
                            : 'bg-green-100 text-green-700 border-green-400'
                      }`}>
                        {proposal.finished
                          ? 'Finished'
                          : hasEnded
                            ? 'Ended'
                            : 'Active'}
                      </span>
                    </div>
                    <div className="mb-3 text-lg text-gray-700">{proposal.description}</div>
                    <div className="flex flex-wrap gap-8 text-sm text-gray-500 mb-6">
                      <div>
                        <span className="font-semibold text-gray-700">Creator:</span> {shortenAddress(proposal.creator)}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Voting System:</span> {proposal.voting_system.toString()}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Start:</span> {formatDate(proposal.start_date)}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">End:</span> {formatDate(proposal.end_date)}
                      </div>
                    </div>
                    {/* Voting buttons: only if not finished, not ended */}
                    {!proposal.finished && !hasEnded && (
                      <div className="flex gap-4">
                        <button
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-extrabold py-3 px-4 rounded-xl text-lg shadow transition"
                          onClick={() => handleVote(proposal.id, true)}
                          disabled={isVoting || !address}
                        >
                          Yay
                        </button>
                        <button
                          className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-extrabold py-3 px-4 rounded-xl text-lg shadow transition"
                          onClick={() => handleVote(proposal.id, false)}
                          disabled={isVoting || !address}
                        >
                          Nay
                        </button>
                      </div>
                    )}
                    {/* Show close button only if ended, not finished, and owner */}
                    {isOwner && hasEnded && !proposal.finished && (
                      <div className="mt-4 flex">
                        <button
                          className="flex-1 bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white font-bold py-2 px-4 rounded-xl shadow transition"
                          onClick={() => handleFinishProposal(proposal.id, Number(proposal.result))}
                          disabled={isFinishing}
                        >
                          {isFinishing ? 'Closing...' : 'Close & Show Results'}
                        </button>
                      </div>
                    )}
                    {/* Show results if finished */}
                    {proposal.finished && (
                      <div className="mt-4 text-lg font-bold text-center text-green-700">
                        Result: {proposal.result.toString()}
                      </div>
                    )}
                    {/* If ended but not finished and not owner, show info */}
                    {hasEnded && !proposal.finished && !isOwner && (
                      <div className="mt-4 text-center text-yellow-600 font-semibold">
                        Voting has ended. Waiting for the owner to close and show results.
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-full md:w-96 bg-white rounded-2xl shadow-xl p-6 border border-gray-100 h-fit">
          <h2 className="text-xl font-extrabold mb-4 text-gray-800">Noir Proof Debug</h2>
          <div className="mb-4">
            <div className="font-semibold mb-1 text-gray-700">Logs:</div>
            <div className="bg-black text-green-200 rounded-lg p-3 text-xs h-32 overflow-auto font-mono whitespace-pre-line border border-gray-800">
              {logs.length === 0 ? <span className="text-gray-400">No logs yet.</span> : logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
          </div>
          <div className="mb-4">
            <div className="font-semibold mb-1 text-gray-700">Proof:</div>
            <div className="bg-gray-100 rounded-lg p-3 text-xs h-24 overflow-auto font-mono border border-gray-200">
              {proof ? <pre>{JSON.stringify(proof, null, 2)}</pre> : <span className="text-gray-400">No proof yet.</span>}
            </div>
          </div>
          <div>
            <div className="font-semibold mb-1 text-gray-700">Witness:</div>
            <div className="bg-gray-100 rounded-lg p-3 text-xs h-24 overflow-auto font-mono border border-gray-200">
              {witness ? <pre>{JSON.stringify(witness, null, 2)}</pre> : <span className="text-gray-400">No witness yet.</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function shortenAddress(address: string, chars = 4) {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

function formatDate(timestamp: bigint) {
  return new Date(Number(timestamp) * 1000).toLocaleString();
}