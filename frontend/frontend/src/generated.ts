//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MyTokenModule#PrivateVoting
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 *
 */
export const myTokenModulePrivateVotingAbi = [
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'id', internalType: 'uint64', type: 'uint64', indexed: true },
      {
        name: 'creator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'ProposalCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'voter',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'proposal_nonce',
        internalType: 'uint64',
        type: 'uint64',
        indexed: true,
      },
      { name: 'vote', internalType: 'bool', type: 'bool', indexed: false },
    ],
    name: 'VoteCast',
  },
  {
    type: 'function',
    inputs: [
      { name: 'id', internalType: 'uint64', type: 'uint64' },
      { name: 'voter', internalType: 'address', type: 'address' },
      { name: 'proposal_nonce', internalType: 'uint64', type: 'uint64' },
    ],
    name: 'accountVoted',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'id', internalType: 'uint64', type: 'uint64' },
      { name: 'creator', internalType: 'address', type: 'address' },
      { name: 'description', internalType: 'string', type: 'string' },
      { name: 'voting_system', internalType: 'uint64', type: 'uint64' },
      { name: 'start_date', internalType: 'uint64', type: 'uint64' },
      { name: 'end_date', internalType: 'uint64', type: 'uint64' },
      { name: 'finished', internalType: 'bool', type: 'bool' },
      { name: 'result', internalType: 'uint64', type: 'uint64' },
    ],
    name: 'createProposal',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'id', internalType: 'uint64', type: 'uint64' },
      { name: 'result', internalType: 'uint64', type: 'uint64' },
    ],
    name: 'finishProposal',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'id', internalType: 'uint64', type: 'uint64' }],
    name: 'getProposal',
    outputs: [
      {
        name: '',
        internalType: 'struct PrivateVoting.Proposal',
        type: 'tuple',
        components: [
          { name: 'id', internalType: 'uint64', type: 'uint64' },
          { name: 'creator', internalType: 'address', type: 'address' },
          { name: 'description', internalType: 'string', type: 'string' },
          { name: 'voting_system', internalType: 'uint64', type: 'uint64' },
          { name: 'start_date', internalType: 'uint64', type: 'uint64' },
          { name: 'end_date', internalType: 'uint64', type: 'uint64' },
          { name: 'finished', internalType: 'bool', type: 'bool' },
          { name: 'result', internalType: 'uint64', type: 'uint64' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'proposal_nonce', internalType: 'uint64', type: 'uint64' },
    ],
    name: 'getProposalVotes',
    outputs: [
      {
        name: '',
        internalType: 'struct PrivateVoting.Vote[]',
        type: 'tuple[]',
        components: [
          { name: 'voter', internalType: 'address', type: 'address' },
          { name: 'timestamp', internalType: 'uint64', type: 'uint64' },
          { name: 'proposal_nonce', internalType: 'uint64', type: 'uint64' },
          { name: 'voter_nonce', internalType: 'uint64', type: 'uint64' },
          { name: 'vote', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getProposals',
    outputs: [
      {
        name: '',
        internalType: 'struct PrivateVoting.Proposal[]',
        type: 'tuple[]',
        components: [
          { name: 'id', internalType: 'uint64', type: 'uint64' },
          { name: 'creator', internalType: 'address', type: 'address' },
          { name: 'description', internalType: 'string', type: 'string' },
          { name: 'voting_system', internalType: 'uint64', type: 'uint64' },
          { name: 'start_date', internalType: 'uint64', type: 'uint64' },
          { name: 'end_date', internalType: 'uint64', type: 'uint64' },
          { name: 'finished', internalType: 'bool', type: 'bool' },
          { name: 'result', internalType: 'uint64', type: 'uint64' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'uint64', type: 'uint64' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint64', type: 'uint64' },
    ],
    name: 'hasVoted',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'proposalCount',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'proposalIds',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'uint64', type: 'uint64' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'proposalVotes',
    outputs: [
      { name: 'voter', internalType: 'address', type: 'address' },
      { name: 'timestamp', internalType: 'uint64', type: 'uint64' },
      { name: 'proposal_nonce', internalType: 'uint64', type: 'uint64' },
      { name: 'voter_nonce', internalType: 'uint64', type: 'uint64' },
      { name: 'vote', internalType: 'bool', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    name: 'proposals',
    outputs: [
      { name: 'id', internalType: 'uint64', type: 'uint64' },
      { name: 'creator', internalType: 'address', type: 'address' },
      { name: 'description', internalType: 'string', type: 'string' },
      { name: 'voting_system', internalType: 'uint64', type: 'uint64' },
      { name: 'start_date', internalType: 'uint64', type: 'uint64' },
      { name: 'end_date', internalType: 'uint64', type: 'uint64' },
      { name: 'finished', internalType: 'bool', type: 'bool' },
      { name: 'result', internalType: 'uint64', type: 'uint64' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'voter', internalType: 'address', type: 'address' },
      { name: 'timestamp', internalType: 'uint64', type: 'uint64' },
      { name: 'proposal_nonce', internalType: 'uint64', type: 'uint64' },
      { name: 'voter_nonce', internalType: 'uint64', type: 'uint64' },
      { name: '_vote', internalType: 'bool', type: 'bool' },
    ],
    name: 'vote',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const

/**
 *
 */
export const myTokenModulePrivateVotingAddress = {
  420420422: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
} as const

/**
 *
 */
export const myTokenModulePrivateVotingConfig = {
  address: myTokenModulePrivateVotingAddress,
  abi: myTokenModulePrivateVotingAbi,
} as const
