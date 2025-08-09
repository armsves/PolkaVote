// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {HonkVerifier as InscriptionVerifier} from "../src/InscriptionVerifier.sol";
import {HonkVerifier as VotingVerifier} from "../src/VotingVerifier.sol";
import {Vote} from "../src/Vote.sol";

contract DeployOV is Script {
    function run() external {
        vm.startBroadcast();

        InscriptionVerifier inscriptionVerifier = new InscriptionVerifier();
        VotingVerifier votingVerifier = new VotingVerifier();
        uint256 numberOfVoters = 11;
        uint256 generatorUint = 3;

        Vote vote = new Vote(
            inscriptionVerifier,
            votingVerifier,
            numberOfVoters,
            bytes32(generatorUint)
        );

        vm.stopBroadcast();
    }
}
