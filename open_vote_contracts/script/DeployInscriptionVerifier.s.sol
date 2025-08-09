// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {HonkVerifier} from "../src/InscriptionVerifier.sol";

contract DeployInscriptionVerifier is Script {
    function run() external {
        vm.startBroadcast();

        HonkVerifier verifier = new HonkVerifier();

        vm.stopBroadcast();
    }
}
