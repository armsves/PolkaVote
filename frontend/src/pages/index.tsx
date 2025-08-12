import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { Layout } from '../components/Layout/Layout';
import RecentVoteItem, { type ProposalStats } from '../components/RecentVoteItem';
import VoteJson from '../../open_vote_contracts/out/Vote.sol/Vote.json';
import Proposals from '../components/Proposals';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import SidePanel from '../components/SidePanel';

import type { InscriptionInputs } from '../../types/proposal';

import {
  UiVote,
  getRecentVotes,
  getTotalVotes,
  createVote,
  waitForReceipt,
  inscribeOnVote,
  castVoteOnVote,
} from '../services/vote';

import Crypto, {
  getRandomValue,
  modExp,
  generateEmptyProof,
  generateInscriptionProof,
  generateVotingProof,
  bigIntToBytes32,
  u8ToHex
} from '../services/cryptography';

// 1) Import the compiled artifact (ABI lives here if needed)
import voteFactoryArtifact from '../../open_vote_contracts/out/VoteFactory.sol/VoteFactory.json';

// 2) Import the Sepolia broadcast log to get the deployed address
//    (this file is created by: forge script ... --broadcast)
import broadcast from '../../open_vote_contracts/broadcast/DeployOVFactory.s.sol/11155111/run-latest.json';

// Derive the VoteFactory address from the broadcast transactions
const SEPOLIA_CHAIN_ID = 11155111 as const;
const contractAddress =
  (broadcast.transactions.find((tx: any) => tx.contractName === 'VoteFactory')?.contractAddress ??
    process.env.NEXT_PUBLIC_VOTE_FACTORY_ADDRESS_SEPOLIA) as `0x${string}`;

// Optional: the ABI if/when you need it elsewhere
export const voteFactoryAbi = (voteFactoryArtifact as any).abi as readonly unknown[];

const Home: NextPage = () => {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [recentVotesState, setRecentVotesState] = useState<UiVote[]>([]);
  const recentList = useMemo(() => recentVotesState, [recentVotesState]);
  const [voterStatusByAddr, setVoterStatusByAddr] = useState<Record<string, { isRegistered: boolean; hasVoted: boolean }>>({});
  const [busyByAddr, setBusyByAddr] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [isRefreshing, setIsRefreshing] = useState(false); // Add refreshing state

  // Filter and search state
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'finished' | 'recent'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'mostVotes'>('newest');

  const appendLog = useCallback((line: string) => {
    setLogs((prev) => [...prev, line]);
  }, []);

  // Function to refresh proposals data
  const refreshProposals = useCallback(async () => {
    try {
      setIsRefreshing(true);
      console.log('Refreshing proposals data...');
      const votes = await getRecentVotes({
        factoryAddress: contractAddress as `0x${string}`,
      });
      console.log('Refreshed votes:', votes);
      setRecentVotesState(votes);
      appendLog(`🔄 Refreshed ${votes.length} proposals`);
    } catch (error) {
      console.error('Failed to refresh proposals:', error);
      appendLog(`❌ Failed to refresh proposals: ${String(error)}`);
    } finally {
      setIsRefreshing(false);
    }
  }, [appendLog]);

  // Enhanced filtered and sorted list
  const filteredAndSortedList = useMemo(() => {
    let filtered = recentList;

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = recentList.filter(vote => {
        const votesCount = vote.registeredVoters.hasVoted.filter(voted => voted).length;
        const maxVoters = Number(vote.numberOfVoters);
        
        switch (filterStatus) {
          case 'active':
            return votesCount < maxVoters; // Still accepting votes
          case 'finished':
            return votesCount >= maxVoters; // Vote quota reached
          case 'recent':
            // Show votes created in the last 7 days (you might need to add timestamp to UiVote)
            // For now, show all as we don't have timestamp data
            return true;
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(vote => 
        vote.name.toLowerCase().includes(term) || 
        vote.description.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return Number(b.id) - Number(a.id); // Assuming higher ID = newer
        case 'oldest':
          return Number(a.id) - Number(b.id);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'mostVotes':
          const aVotes = a.registeredVoters.hasVoted.filter(voted => voted).length;
          const bVotes = b.registeredVoters.hasVoted.filter(voted => voted).length;
          return bVotes - aVotes;
        default:
          return 0;
      }
    });

    return sorted;
  }, [recentList, filterStatus, searchTerm, sortBy]);

  // Calculate stats from actual data
  const stats = useMemo(() => {
    const totalProposals = recentList.length;
    
    const totalVotesCast = recentList.reduce((total, vote) => {
      return total + vote.registeredVoters.hasVoted.filter(voted => voted).length;
    }, 0);
    
    const totalRegistrations = recentList.reduce((total, vote) => {
      return total + vote.registeredVoters.voters.length;
    }, 0);

    return {
      totalProposals,
      totalVotesCast,
      totalActiveVoters: totalRegistrations,
    };
  }, [recentList]);

  useEffect(() => {
    const fetchRecentVotes = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching recent votes for factory:', contractAddress);
        const votes = await getRecentVotes({
          factoryAddress: contractAddress as `0x${string}`,
        });
        console.log('Fetched votes:', votes);
        setRecentVotesState(votes);
        appendLog(`✅ Loaded ${votes.length} proposals`);
      } catch (error) {
        console.error('Failed to fetch recent votes:', error);
        appendLog(`❌ Failed to fetch proposals: ${String(error)}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (contractAddress) {
      fetchRecentVotes();
    }
  }, [appendLog]); // Remove contractAddress from dependencies

  const onInscribe = async (voteAddress: `0x${string}`) => {
    try {
      setBusyByAddr((m) => ({ ...m, [voteAddress]: true }));

      // Get inputs for this vote
      let randomValue = bigIntToBytes32(getRandomValue());
      let encryptedRandomValue = modExp(Crypto.generator, randomValue);
      let encryptedRandomValueBytes = bigIntToBytes32(encryptedRandomValue);
      let { proof, publicInputs } = await generateInscriptionProof(randomValue, encryptedRandomValueBytes, appendLog);
      const inputs: InscriptionInputs = { proof: u8ToHex(proof), encryptedRandomValue: encryptedRandomValueBytes };

      if (!inputs) {
        appendLog(`⚠️ Missing inscription inputs for ${voteAddress}. Provide {proof, encryptedRandomValue}.`);
        return;
      }

      appendLog(`Inscribe: sending tx for ${voteAddress}…`);
      const txHash = await inscribeOnVote({
        writeContractAsync,
        voteAddress,
        voteAbi: (VoteJson as any).abi,
        functionName: 'enscribeVoter',
        args: [inputs.proof, inputs.encryptedRandomValue],
      });

      appendLog(`✅ enscribeVoter tx sent: ${txHash}`);
      const receipt = await waitForReceipt(txHash);
      appendLog(
        `enscribeVoter confirmed in block ${receipt.blockNumber?.toString?.() ?? ''}`
      );

      // Refresh proposals data after successful inscription
      await refreshProposals();
      
    } catch (e) {
      console.error('inscribe failed:', e);
      appendLog(`❌ enscribeVoter failed: ${String(e)}`);
    } finally {
      setBusyByAddr((m) => ({ ...m, [voteAddress]: false }));
    }
  };

  const onVote = async (voteAddress: `0x${string}`, value: boolean) => {
    try {
      setBusyByAddr(m => ({ ...m, [voteAddress]: true }));

      const voteDegree = value ? 1n : 0n;
      const voteHex = bigIntToBytes32(voteDegree);
      const enc = modExp(Crypto.generator, voteDegree);
      const encHex = bigIntToBytes32(enc);

      const { proof, publicInputs } = await generateVotingProof(voteHex, encHex, appendLog);
      const proofHex = u8ToHex(proof);

      if (BigInt(publicInputs[0]) !== BigInt(Crypto.generator) ||
          BigInt(publicInputs[1]) !== BigInt(enc)) {
          appendLog('❌ Prover public inputs mismatch — aborting send');
          return;
      }
      appendLog('✅ Prover public inputs match!');

      appendLog(`Vote: sending tx for ${voteAddress}…`);
      const tx = await castVoteOnVote({
        writeContractAsync,
        voteAddress,
        voteAbi: (VoteJson as any).abi,
        functionName: 'vote',
        args: [proofHex, encHex],
      });

      appendLog(`✅ vote tx sent: ${tx}`);
      const receipt = await waitForReceipt(tx);
      appendLog(`vote confirmed in block ${receipt.blockNumber?.toString?.() ?? ''}`);

      // Refresh proposals data after successful vote
      await refreshProposals();

    } catch (e) {
      console.error('vote failed:', e);
      appendLog(`❌ vote failed: ${String(e)}`);
    } finally {
      setBusyByAddr(m => ({ ...m, [voteAddress]: false }));
    }
  };

  return (
    <Layout title="PolkaVote - Home">
      {/* Main Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mb-4"></div>
            <p className="text-lg font-medium text-gray-700">Loading proposals...</p>
            <p className="text-sm text-gray-500">Fetching data...</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to PolkaVote</h1>
          <p className="text-xl text-gray-600 mb-6">
            Private governance voting powered by zero-knowledge proofs and Noir
          </p>

          <div className="flex gap-4">
            <Link
              href="/create"
              className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              🏛️ Create Proposal
            </Link>
            <Link
              href="/overview"
              className="border border-pink-600 text-pink-600 hover:bg-pink-50 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              📊 View Overview
            </Link>
            <Link
              href="/votingInterface"
              className="border border-purple-600 text-purple-600 hover:bg-purple-50 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              🗳️ Voting Interface
            </Link>
            
            {/* Refresh Button */}
            <button
              onClick={refreshProposals}
              disabled={isRefreshing}
              className="border border-gray-600 text-gray-600 hover:bg-gray-50 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefreshing ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  Refreshing...
                </>
              ) : (
                <>🔄 Refresh</>
              )}
            </button>
          </div>
        </div>

        {/* Show content only when not loading */}
        {!isLoading && (
          <>
            {/* Main Content Grid - Proposals + Side Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
              {/* Proposals - Takes up 3/4 of the width */}
              <div className="lg:col-span-3">
                <Proposals
                  recentList={recentList}
                  address={address}
                  busyByAddr={busyByAddr}
                  onInscribe={onInscribe}
                  onVote={onVote}
                />
              </div>

              {/* Side Panel - Takes up 1/4 of the width */}
              <div className="lg:col-span-1">
                <div className="sticky top-4">
                  <SidePanel logs={logs} proof={null} witness={null} />
                </div>
              </div>
            </div>

            {/* Quick Stats - Updated with actual data */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-pink-600 mb-2">
                  {stats.totalProposals}
                </div>
                <div className="text-gray-600">Active Proposals</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {stats.totalVotesCast}
                </div>
                <div className="text-gray-600">Total Votes Cast</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {stats.totalActiveVoters}
                </div>
                <div className="text-gray-600">Active Voters</div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Home;
