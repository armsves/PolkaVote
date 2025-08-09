// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {Vote} from "../src/Vote.sol";
import {HonkVerifier as InscriptionVerifier} from "../src/InscriptionVerifier.sol";
import {HonkVerifier as VotingVerifier} from "../src/VotingVerifier.sol";
import {ModArithmetic} from "../src/ModArithmetic.sol";

contract VoteTest is Test {
    InscriptionVerifier inscriptionVerifier;
    VotingVerifier votingVerifier;
    bytes32 generator;
    uint256 constant FIELD_MODULUS = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    ModArithmetic modAr;
    bytes inscriptionProof;
    bytes votingProof;
    uint256 inscriptionDeadlineTimestamp;
    uint256 constant VOTERS = 11;

    bytes32[] publicInputs;

    address user = makeAddr("user");

    function setUp() public {
        inscriptionVerifier = new InscriptionVerifier();
        votingVerifier = new VotingVerifier();
        generator = bytes32(uint256(3));
        modAr = new ModArithmetic(uint256(generator), FIELD_MODULUS);
    }

    function _getInscriptionProof(bytes32 randomValue, bytes32 encryptedRandomValue)
        internal
        returns (bytes memory _proof)
    {
        uint256 NUM_ARGS = 6;
        string[] memory inputs = new string[](NUM_ARGS);
        inputs[0] = "npx";
        inputs[1] = "tsx";
        inputs[2] = "js-scripts/generateInscriptionProof.ts";
        inputs[3] = vm.toString(randomValue);
        inputs[4] = vm.toString(generator);
        inputs[5] = vm.toString(encryptedRandomValue);

        bytes memory result = vm.ffi(inputs);
        console.logBytes(result);

        (_proof, /*_publicInputs*/ ) = abi.decode(result, (bytes, bytes32[]));
    }

    function _getVotingProof(bytes32 votingValue, bytes32 encryptedVotingValue)
        internal
        returns (bytes memory _proof)
    {
        uint256 NUM_ARGS = 6;
        string[] memory inputs = new string[](NUM_ARGS);
        inputs[0] = "npx";
        inputs[1] = "tsx";
        inputs[2] = "js-scripts/generateVotingProof .ts";
        inputs[3] = vm.toString(votingValue);
        inputs[4] = vm.toString(generator);
        inputs[5] = vm.toString(encryptedVotingValue);

        bytes memory result = vm.ffi(inputs);
        console.logBytes(result);

        (_proof, /*_publicInputs*/ ) = abi.decode(result, (bytes, bytes32[]));
    }

    function testCorrectInscription() public {
        uint256 voters = 1;

        Vote vote = new Vote(inscriptionVerifier, votingVerifier, voters, generator);
        uint256 randomDegree = 1;
        // bytes32 randomValue = bytes32(uint256(modexp(generator, randomDegree)));
        uint256 encrypted = modAr.modExp(uint256(generator), randomDegree);
        bytes32 encryptedRandomValue = bytes32(uint256(encrypted));

        bytes memory proof = _getInscriptionProof(bytes32(randomDegree), encryptedRandomValue);
        vote.enscribeVoter(proof, encryptedRandomValue);

        assertEq(vote.s_enscribedVoters(), 1);
    }

    function testElevenVotersFullFlow() public {
        Vote vote = new Vote(inscriptionVerifier, votingVerifier, VOTERS, generator);

        address[VOTERS] memory users;
        enscribeAllVoters(users, vote);
        // Assert total number of enscribed voters
        assertEq(vote.s_enscribedVoters(), VOTERS);
        assertEq(vote.s_maximalNumberOfVoters(), VOTERS);

        uint256 nullified = evaluateProducts(vote);
        assertEq(nullified, uint256(1));

        uint256 votesSum = allVotersVote(users, vote);
        assertEq(vote.s_yesVotes(), votesSum);
    }

    function enscribeAllVoters(address[VOTERS] memory users, Vote vote) public {
        for (uint256 i = 0; i < VOTERS; i++) {
            // Simulate a unique user
            address userAddr = address(uint160(i + 1));
            users[i] = userAddr;

            vm.startPrank(userAddr);

            // Each user has a unique random_value
            uint256 randomDegree = i + 1;
            uint256 encrypted = modAr.modExp(uint256(generator), randomDegree);
            bytes32 encryptedRandomValue = bytes32(encrypted);
            bytes32 randomValue = bytes32(randomDegree);

            // Generate proof
            bytes memory proof = _getInscriptionProof(randomValue, encryptedRandomValue);

            // Enscribe the voter
            vote.enscribeVoter(proof, encryptedRandomValue);

            vm.stopPrank();
        }
    }

    // A sanity check evaluation (it is not needed during the real flow)
    function evaluateProducts(Vote vote) public view returns (uint256) {
        uint256 encryptedProduct = 1;
        uint256 shareProduct = 1;

        for (uint256 i = 0; i < VOTERS; i++) {
            address voter = vote.s_voters(i);
            uint256 value = uint256(vote.s_encrypted_random_values(voter));

            encryptedProduct = modAr.modMul(encryptedProduct, value);
        }

        for (uint256 i = 0; i < VOTERS; i++) {
            uint256 share = vote.s_decryption_shares(i);
            shareProduct = modAr.modMul(shareProduct, share);
        }

        return shareProduct;
    }

    function allVotersVote(address[VOTERS] memory users, Vote vote) public returns (uint256) {
        uint256[] memory votes = generateBinaryArray(VOTERS);
        uint256 votesSum = 0;
        for (uint256 i = 0; i < VOTERS; i++) {
            votesSum += votes[i];
        }

        for (uint256 i = 0; i < VOTERS; i++) {
            // Simulate a unique user
            address userAddr = address(uint160(i + 1));
            users[i] = userAddr;

            vm.startPrank(userAddr);

            uint256 encryptedVote =
                modAr.modMul(modAr.modExp(uint256(generator), votes[i]), vote.s_decryption_shares(i));
            console.log("index =", i);
            console.log("encryptedVote =", encryptedVote);

            // bytes memory proof = new bytes(0);
            bytes memory proof = _getVotingProof(bytes32(votes[i]), bytes32(modAr.modExp(uint256(generator), votes[i])));

            vote.vote(proof, bytes32(encryptedVote));
            vm.stopPrank();
        }
        return votesSum;
    }

    function generateBinaryArray(uint256 length) private view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            uint256 rand = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, i)));

            result[i] = uint256(rand % 2);
        }

        return result;
    }
}
