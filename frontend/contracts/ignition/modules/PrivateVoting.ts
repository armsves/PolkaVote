// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"
//import { parseEther } from "viem"

const MyTokenModule = buildModule("MyTokenModule", (m) => {

    const privateVoting = m.contract("PrivateVoting", [])

    return { privateVoting }
})

export default MyTokenModule
