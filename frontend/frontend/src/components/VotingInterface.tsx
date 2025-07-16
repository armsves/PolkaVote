import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { myTokenModulePrivateVotingAbi } from '../generated';

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
  //const [selectedProposal, setSelectedProposal] = useState<number | null>(null);
  const [voterNonce, setVoterNonce] = useState<number>(1);
  const [newProposal, setNewProposal] = useState({
    id: '',
    description: '',
    voting_system: '1',
    start_date: '',
    end_date: ''
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

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

  const handleVote = (proposalId: bigint, voteValue: boolean) => {
    if (!address) return;

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
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">PolkaVote - Private Voting</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          disabled={!address}
        >
          Create Proposal
        </button>
      </div>

      {/* Create Proposal Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Create New Proposal</h2>
            <div className="space-y-4">
              <input
                type="number"
                placeholder="Proposal ID"
                value={newProposal.id}
                onChange={(e) => setNewProposal(prev => ({ ...prev, id: e.target.value }))}
                className="w-full p-2 border rounded"
              />
              <textarea
                placeholder="Description"
                value={newProposal.description}
                onChange={(e) => setNewProposal(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border rounded h-24"
              />
              <select
                value={newProposal.voting_system}
                onChange={(e) => setNewProposal(prev => ({ ...prev, voting_system: e.target.value }))}
                className="w-full p-2 border rounded"
              >
                <option value="1">Simple Majority</option>
                <option value="2">Supermajority</option>
                <option value="3">Unanimous</option>
              </select>
              <input
                type="datetime-local"
                value={newProposal.start_date}
                onChange={(e) => setNewProposal(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full p-2 border rounded"
              />
              <input
                type="datetime-local"
                value={newProposal.end_date}
                onChange={(e) => setNewProposal(prev => ({ ...prev, end_date: e.target.value }))}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCreateProposal}
                disabled={isCreating}
                className="flex-1 bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proposals List */}
      <div className="grid gap-4">
        {proposalArray.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No proposals found. Create the first one!
          </div>
        ) : (
          proposalArray.map((proposal) => (
            <div key={proposal.id.toString()} className="border rounded-lg p-4 bg-white shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold">Proposal #{proposal.id.toString()}</h3>
                <span className={`px-2 py-1 rounded text-sm ${
                  proposal.finished 
                    ? 'bg-gray-200 text-gray-800' 
                    : 'bg-green-200 text-green-800'
                }`}>
                  {proposal.finished ? 'Finished' : 'Active'}
                </span>
              </div>
              
              <p className="text-gray-700 mb-3">{proposal.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                <div>
                  <strong>Creator:</strong> {proposal.creator.slice(0, 6)}...{proposal.creator.slice(-4)}
                </div>
                <div>
                  <strong>Voting System:</strong> {proposal.voting_system.toString()}
                </div>
                <div>
                  <strong>Start:</strong> {new Date(Number(proposal.start_date) * 1000).toLocaleDateString()}
                </div>
                <div>
                  <strong>End:</strong> {new Date(Number(proposal.end_date) * 1000).toLocaleDateString()}
                </div>
              </div>

              {proposal.finished ? (
                <div className="text-center py-2 bg-gray-100 rounded">
                  <strong>Result:</strong> {proposal.result.toString()}
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVote(proposal.id, true)}
                    disabled={isVoting || !address}
                    className="flex-1 bg-green-500 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
                  >
                    Vote Yes
                  </button>
                  <button
                    onClick={() => handleVote(proposal.id, false)}
                    disabled={isVoting || !address}
                    className="flex-1 bg-red-500 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
                  >
                    Vote No
                  </button>
                  {address === proposal.creator && (
                    <button
                      onClick={() => handleFinishProposal(proposal.id, 1)}
                      disabled={isFinishing}
                      className="bg-yellow-500 hover:bg-yellow-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
                    >
                      Finish
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Voter Nonce Display */}
      <div className="mt-4 text-sm text-gray-600">
        <strong>Current Voter Nonce:</strong> {voterNonce}
      </div>
    </div>
  );
}