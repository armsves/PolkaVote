// // SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import {IVerifier as IInscriptionVerifier} from "./InscriptionVerifier.sol";
import {IVerifier as IVotingVerifier} from "./VotingVerifier.sol";
import { ModArithmetic } from "./ModArithmetic.sol";

contract Vote is Ownable {
    IInscriptionVerifier public s_inscriptionVerifier;
    IVotingVerifier public s_votingVerifier;
    bool public s_finalVote;

    mapping(address => bytes32) public s_encrypted_random_values;
    uint256 public s_enscribedVoters = 0;
    mapping(address => bytes32) public s_encrypted_votes;
    uint256 public s_votedVoters = 0;
    // uint256 public inscriptionDeadline;
    uint256 public s_maximalNumberOfVoters;
    address[] public s_voters;
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
    error Inscription__IsNotClosed(uint256 currentTime, uint256 deadline);
    error Voting__InvalidProof(address voter);
    error Voting__IsClosed();
    error Voting__IsNotFinalized();
    
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
        if(verifyInscription(proof, encrypted_random_value)) {
            s_encrypted_random_values[msg.sender] = encrypted_random_value;
            s_enscribedVoters++;
            s_voters.push(msg.sender);
            emit Inscription__VoterEnscribed(msg.sender, s_enscribedVoters);
        }
    }

    function verifyInscription(bytes calldata proof, bytes32 encrypted_random_value) public returns (bool) {
        if (s_enscribedVoters >= s_maximalNumberOfVoters) {
            revert Inscription__Closed(s_enscribedVoters, s_maximalNumberOfVoters);
        }

        bytes32[] memory publicInputs = new bytes32[](0);
        // publicInputs[0] = s_generator;
        // publicInputs[1] = encrypted_random_value;
        // publicInputs[2] = encrypted_random_value;

        bool verifiedProof = s_inscriptionVerifier.verify(proof, publicInputs);

        if (verifiedProof) {
            emit Inscription__ProofSucceeded(verifiedProof);
        } else {
            revert Inscription__InvalidProof(msg.sender);
        }

        return verifiedProof;
    }

    function vote(bytes calldata proof, bytes32 encrypted_vote) external {
        if(verifyVoting(proof, encrypted_vote)) {
            s_encrypted_votes[msg.sender] = encrypted_vote;
            s_votedVoters++;
        }

        if (s_enscribedVoters == s_votedVoters) {
            evaluates_finalVote();
        }
    }

    function verifyVoting(bytes calldata proof, bytes32 encrypted_vote) public returns (bool) {
        if (s_votedVoters >= s_enscribedVoters) {
            revert Voting__IsClosed();
        }

        bytes32[] memory publicInputs = new bytes32[](1);
        publicInputs[0] = encrypted_vote;

        bool verifiedProof = s_votingVerifier.verify(proof, publicInputs);
        if(!verifiedProof) {
            revert Voting__InvalidProof(msg.sender);
        }

        emit Voting__ProofSucceeded(verifiedProof);
        s_encrypted_votes[msg.sender] = encrypted_vote;
        return verifiedProof;
    }

    function evaluates_finalVote() public {

    }

    function evaluateDecryptionValues() public {
        if (s_votedVoters != s_enscribedVoters) {
            revert Inscription__IsNotClosed(s_votedVoters, s_enscribedVoters);
        }

        s_aggregated_multiplication.push(
            uint256(s_encrypted_random_values[s_voters[0]])
        );

        for (uint256 i = 1; i < s_voters.length; i++) {
            address voter = s_voters[i];
            uint256 encrypted = uint256(s_encrypted_random_values[voter]);
            
            s_aggregated_multiplication.push(s_modAr.modMul(s_aggregated_multiplication[i-1], encrypted));
        }

        for (uint256 i = 0; i < s_voters.length; i++) {
            uint256 reverse_i = s_voters.length - i - 1;
            s_aggregated_division.push(
                s_modAr.modInv(s_aggregated_multiplication[reverse_i]));
        }

        for (uint256 i = 0; i < s_voters.length; i++) {
            s_decryption_shares.push(
                s_modAr.modMul(s_aggregated_multiplication[i], s_aggregated_division[i])
            );
        }

        emit Voting__Starting(s_decryption_shares);
    }
    
    function gets_finalVote() external view returns (bool) {
        if (s_enscribedVoters < s_maximalNumberOfVoters) {
            revert Inscription__IsNotClosed(s_enscribedVoters, s_maximalNumberOfVoters);
        }

        if (s_votedVoters != s_enscribedVoters) {
            revert Voting__IsNotFinalized();
        }
        return s_finalVote;
    }

    // function invmod(uint a, uint p) internal pure returns (uint) {
    //     if (a == 0 || a == p || p == 0)
    //         revert();
    //     if (a > p)
    //         a = a % p;
    //     int t1;
    //     int t2 = 1;
    //     uint r1 = p;
    //     uint r2 = a;
    //     uint q;
    //     while (r2 != 0) {
    //         q = r1 / r2;
    //         (t1, t2, r1, r2) = (t2, t1 - int(q) * t2, r2, r1 - q * r2);
    //     }
    //     if (t1 < 0)
    //         return (p - uint(-t1));
    //     return uint(t1);
    // }
}
