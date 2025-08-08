// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
// import {HonkVerifier} from "../src/Verifier.sol";
import {HonkVerifier} from "../src/InscriptionVerifier.sol";
// import {HonkVerifier} from "../src/VotingVerifier.sol";

contract DeployInscriptionVerifier is Script {
    function run() external {
        vm.startBroadcast();

        // Deploy the shared HonkVerifier
        // HonkVerifier verifier = new HonkVerifier();

        // Deploy InscriptionVerifier with HonkVerifier
        // InscriptionVerifier inscriptionVerifier = new InscriptionVerifier(verifier);

        // Deploy VotingVerifier with HonkVerifier
        HonkVerifier verifier = new HonkVerifier();

        vm.stopBroadcast();
    }
}
