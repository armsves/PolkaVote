// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"

const MyVerifierModule = buildModule("MyVerifier", (m) => {

    const verifier = m.contract("HonkVerifier", [])

    return { verifier }
})

export default MyVerifierModule
