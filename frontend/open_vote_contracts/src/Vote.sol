// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import {IVerifier as IInscriptionVerifier} from "./InscriptionVerifier.sol";
import {IVerifier as IVotingVerifier} from "./VotingVerifier.sol";
import {ModArithmetic} from "./ModArithmetic.sol";

contract Vote is Ownable {
    IInscriptionVerifier public s_inscriptionVerifier;
    IVotingVerifier public s_votingVerifier;
    bool public s_finalVote;
    uint256 public s_yesVotes;

    mapping(address => bytes32) public s_encrypted_random_values;
    uint256 public s_enscribedVoters = 0;
    bytes32[] public s_encrypted_votes;
    uint256 public s_votedVoters = 0;
    uint256 public s_maximalNumberOfVoters;
    bytes32 public s_generator;
    uint256 constant FIELD_MODULUS = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    ModArithmetic s_modAr;

    uint256[] public s_aggregated_multiplication;
    uint256[] public s_aggregated_division;
    uint256[] public s_decryption_shares;

    event Inscription__ProofSucceeded(bool result);
    event Inscription__VoterEnscribed(address voter, uint256 voterIndex);
    event Voting__ProofSucceeded(bool result);
    event Voting__Starting(uint256[]);

    error Constructor__InvalidDeadline(uint256 currentTime, uint256 providedDeadline);
    error Inscription__Closed(uint256 currentTime, uint256 deadline);
    error Inscription__InvalidProof(address voter);
    error Inscription__IsNotClosedYet(uint256 enscribedVoters, uint256 MaximalVoters);
    error Voting__InvalidProof(address voter);
    error Voting__IsClosed();
    error Voting__IsNotFinalized();
    error Voting__FailedToDecryptFinalVote();
    error Voter__InvalidIndex(uint256 voterIndex, uint256 maximalNumberOfVoters);

    struct Voter {
        address voterAddress;
        bool hasVoted;
    }
    
    Voter[] public s_voters;
    mapping(address => uint256) public s_voterIndex; // To efficiently find voter index

    constructor(
        IInscriptionVerifier _inscriptionVerifier,
        IVotingVerifier _votingVerifier,
        uint256 _numberOfVoters,
        bytes32 generator
    ) Ownable(msg.sender) {
        s_inscriptionVerifier = _inscriptionVerifier;
        s_votingVerifier = _votingVerifier;
        s_maximalNumberOfVoters = _numberOfVoters;
        s_generator = generator;
        s_modAr = new ModArithmetic(uint256(generator), FIELD_MODULUS);
    }

    function enscribeVoter(bytes calldata proof, bytes32 encrypted_random_value) external {
        if (verifyInscription(proof, encrypted_random_value)) {
            s_encrypted_random_values[msg.sender] = encrypted_random_value;
            s_enscribedVoters += 1;
            s_voters.push(Voter(msg.sender, false));
            s_voterIndex[msg.sender] = s_enscribedVoters - 1;

            emit Inscription__VoterEnscribed(msg.sender, s_enscribedVoters);

            if (s_enscribedVoters == s_maximalNumberOfVoters) {
                evaluateDecryptionValues();
            }
        }
    }


    function verifyInscription(bytes calldata proof, bytes32 encrypted_random_value) internal returns (bool) {
        if (s_enscribedVoters >= s_maximalNumberOfVoters) {
            revert Inscription__Closed(s_enscribedVoters, s_maximalNumberOfVoters);
        }

        bytes32[] memory publicInputs = new bytes32[](2);
        publicInputs[0] = s_generator;
        publicInputs[1] = encrypted_random_value;

        bool verifiedProof = s_inscriptionVerifier.verify(proof, publicInputs);

        if (verifiedProof) {
            emit Inscription__ProofSucceeded(verifiedProof);
        } else {
            revert Inscription__InvalidProof(msg.sender);
        }

        return verifiedProof;
    }

    function evaluateDecryptionValues() internal {
        if (s_maximalNumberOfVoters != s_enscribedVoters) {
            revert Inscription__IsNotClosedYet(s_votedVoters, s_enscribedVoters);
        }

        // Initialize with the first voter's encrypted value
        address firstVoter = s_voters[0].voterAddress;
        uint256 firstEncrypted = uint256(s_encrypted_random_values[firstVoter]);
        s_aggregated_multiplication.push(firstEncrypted);

        // Continue with the rest of the voters
        for (uint256 i = 1; i < s_voters.length; i++) {
            address voter = s_voters[i].voterAddress;  // Fixed: use i instead of i-1
            uint256 encrypted = uint256(s_encrypted_random_values[voter]);

            s_aggregated_multiplication.push(s_modAr.modMul(s_aggregated_multiplication[i - 1], encrypted));
        }

        for (uint256 i = 0; i < s_voters.length; i++) {
            uint256 reverse_i = s_voters.length - i - 1;
            s_aggregated_division.push(s_modAr.modInv(s_aggregated_multiplication[reverse_i]));
        }

        for (uint256 i = 0; i < s_voters.length; i++) {
            s_decryption_shares.push(s_modAr.modMul(s_aggregated_multiplication[i], s_aggregated_division[i]));
        }

        emit Voting__Starting(s_decryption_shares);
    }

    function getDecryptionValueByVoterIndex(uint256 voterIndex) external view returns (uint256) {
        if (s_enscribedVoters < s_maximalNumberOfVoters) {
            revert Inscription__IsNotClosedYet(s_enscribedVoters, s_maximalNumberOfVoters);
        }
        if (voterIndex >= s_maximalNumberOfVoters) {
            revert Voter__InvalidIndex(voterIndex, s_maximalNumberOfVoters);
        }
        return s_decryption_shares[voterIndex];
    }

    function vote(bytes calldata proof, bytes32 encrypted_vote) external {
        if (verifyVoting(proof, encrypted_vote)) {
            s_encrypted_votes.push(encrypted_vote);
            s_votedVoters += 1;
            
            // Mark voter as having voted - ONLY when verification succeeds
            uint256 voterIdx = s_voterIndex[msg.sender];
            s_voters[voterIdx].hasVoted = true;

            if (s_enscribedVoters == s_votedVoters) {
                evaluateFinalVote();
            }
        }
    }

    function verifyVoting(bytes calldata proof, bytes32 encrypted_vote) internal returns (bool) {
        if (s_votedVoters >= s_enscribedVoters) {
            revert Voting__IsClosed();
        }

        bytes32[] memory publicInputs = new bytes32[](2);
        publicInputs[0] = s_generator;
        publicInputs[1] = encrypted_vote;

        bool verifiedProof = s_votingVerifier.verify(proof, publicInputs);
        if (!verifiedProof) {
            revert Voting__InvalidProof(msg.sender);
        }

        emit Voting__ProofSucceeded(verifiedProof);
        return verifiedProof;
    }

    function evaluateFinalVote() public {
        uint256 encryptedFinalVote = 1;
        for (uint256 i = 0; i < s_maximalNumberOfVoters; i++) {
            encryptedFinalVote = s_modAr.modMul(encryptedFinalVote, uint256(s_encrypted_votes[i]));
        }
        bruteForceFinalVote(encryptedFinalVote);
    }

    function bruteForceFinalVote(uint256 encryptedValue) internal {
        uint256 acc = 1;
        for (uint256 i = 0; i <= s_maximalNumberOfVoters; i++) {
            if (acc == encryptedValue) {
                s_yesVotes = i;
                s_finalVote = i > s_maximalNumberOfVoters / 2;
                return;
            }
            acc = s_modAr.modMul(acc, uint256(s_generator));
        }
        revert Voting__FailedToDecryptFinalVote();
    }

    function getRegisteredVoters() external view returns (address[] memory voters, bool[] memory hasVoted) {
        voters = new address[](s_voters.length);
        hasVoted = new bool[](s_voters.length);
        
        for (uint256 i = 0; i < s_voters.length; i++) {
            voters[i] = s_voters[i].voterAddress;
            hasVoted[i] = s_voters[i].hasVoted;
        }
    }

    function get_finalVote() external view returns (bool) {
        if (s_enscribedVoters < s_maximalNumberOfVoters) {
            revert Inscription__IsNotClosedYet(s_enscribedVoters, s_maximalNumberOfVoters);
        }

        if (s_votedVoters != s_enscribedVoters) {
            revert Voting__IsNotFinalized();
        }
        return s_finalVote;
    }
}
