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

    function _getInscriptionProof(bytes32 randomValue, bytes32 encryptedRandomValue) internal returns (bytes memory _proof) {
        uint256 NUM_ARGS = 6;
        string[] memory inputs = new string[](NUM_ARGS);
        inputs[0] = "npx";
        inputs[1] = "tsx";
        inputs[2] = "js-scripts/generateProof.ts";
        inputs[3] = vm.toString(randomValue);
        inputs[4] = vm.toString(generator);
        inputs[5] = vm.toString(encryptedRandomValue);

        bytes memory result = vm.ffi(inputs);
        console.logBytes(result);

        (_proof, /*_publicInputs*/) =
            abi.decode(result, (bytes, bytes32[]));
        
    }

    // function modexp(uint256 base, uint256 exponent, uint256 modulus) internal pure returns (uint256 result) {
    //     result = 1;
    //     base = base % modulus;

    //     while (exponent > 0) {
    //         if (exponent % 2 == 1) {
    //             result = mulmod(result, base, modulus);
    //         }
    //         base = mulmod(base, base, modulus);
    //         exponent /= 2;
    //     }
    // }

    function testCorrectInscription() public {
        uint256 voters = 1;
        
        Vote vote = new Vote(inscriptionVerifier,
                             votingVerifier,
                             voters,
                             generator);
        uint256 randomDegree = 1;
        // bytes32 randomValue = bytes32(uint256(modexp(generator, randomDegree)));
        uint256 encrypted = modAr.modExp(uint256(generator), randomDegree);
        bytes32 encryptedRandomValue = bytes32(uint256(encrypted));
        
        bytes memory proof = _getInscriptionProof(bytes32(randomDegree), encryptedRandomValue);
        vote.enscribeVoter(proof, encryptedRandomValue);

        assertEq(vote.s_enscribedVoters(), 1);
    }

   function testElevenCorrectInscription() public {
        Vote vote = new Vote(
            inscriptionVerifier,
            votingVerifier,
            VOTERS,
            generator
        );

        // Declare a fixed-size memory array of 11 user addresses
        address[VOTERS] memory users;

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

        // Assert total number of enscribed voters
        assertEq(vote.s_enscribedVoters(), 11);

        // Log each user's encrypted_random_value
        for (uint256 i = 0; i < users.length; i++) {
            bytes32 value = vote.s_encrypted_random_values(users[i]);

            console.log("User:", users[i]);
            console.logBytes32(value);
        }

        uint256 nullified = evaluateProducts(vote);
        assertEq(nullified, uint256(1));
    }

    function evaluateProducts(Vote vote) public view returns (uint256) {
        uint256 encryptedProduct = 1;
        uint256 shareProduct = 1;

        for (uint256 i = 0; i < vote.s_maximalNumberOfVoters(); i++) {
            address voter = vote.s_voters(i);
            uint256 value = uint256(vote.s_encrypted_random_values(voter));
            
            encryptedProduct = modAr.modMul(encryptedProduct, value);
            // mulmod(encryptedProduct, value, FIELD_MODULUS);
        }

        for (uint256 i = 0; i < vote.s_votedVoters(); i++) {
            uint256 share = vote.s_decryption_shares(i);
            shareProduct = modAr.modMul(shareProduct, share);
            // mulmod(shareProduct, share, FIELD_MODULUS);
        }

        return modAr.modMul(encryptedProduct, shareProduct);
    }
}
